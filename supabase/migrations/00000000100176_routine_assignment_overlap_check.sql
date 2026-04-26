-- Worker ROUTINE-PROPAGATION (c2.5, founder D5) — relax routine
-- uniqueness from "one active per (template, assignee)" to
-- "no overlapping date ranges per (template, assignee)".
--
-- Founder model:
--   - One template can be deployed to many family members simultaneously
--     (e.g. Bathroom routine to all 4 kids — each gets their own
--     check-off). Master edits propagate to all on save.
--   - One person can have many DIFFERENT templates assigned (Mosiah has
--     Kitchen + Bedroom + Morning Routine).
--   - One person CANNOT have the SAME template assigned twice with
--     overlapping date ranges. Sequential non-overlapping deployments
--     of the same template to the same person are fine
--     (e.g. summer routine, then a different fall deployment).
--
-- Date range semantics:
--   - dtstart = recurrence_details->>'dtstart' (YYYY-MM-DD); NULL falls
--     back to created_at::date for legacy rows that don't have it set
--     yet (forward-compatible — c2 writes dtstart on every new routine).
--   - end_date = tasks.due_date (the "Run until" picker); NULL means
--     ongoing / open-ended (treated as +infinity).
--   - Overlap: existing.dtstart <= new.end_date
--             AND existing.end_date >= new.dtstart
--     (with NULL end_date treated as infinity on both sides)
--
-- ── Step 1: drop the strict unique index ─────────────────────────
--
-- Prior to this migration, migration 100152 enforced "at most one
-- active routine row per (template, assignee)" via a partial unique
-- index. That blocks legitimate sequential deployments (summer routine
-- ending August 31, fall routine starting September 1 — both for the
-- same kid, both pointing at different time windows of the same
-- template). The trigger below replaces it with a stricter but
-- workflow-correct check: overlap, not existence.
DROP INDEX IF EXISTS public.tasks_unique_active_routine_per_assignee;


-- ── Step 2: trigger function ─────────────────────────────────────
--
-- Fires BEFORE INSERT OR UPDATE on tasks. Only checks routine rows
-- with template_id and assignee_id set. Skips archived rows. Compares
-- the proposed row's date range against every other active routine
-- deployment for the same (template_id, assignee_id) pair. Raises
-- if any range overlaps.
--
-- Application code is expected to pre-check via detectRoutineOverlap
-- so it can surface the warm "which days?" modal. This trigger is the
-- backstop for any non-UI write path (direct SQL, Edge Functions,
-- future migrations) — production Mom should never see a raw 23-class
-- Postgres error in the UI flow.
CREATE OR REPLACE FUNCTION public.prevent_overlapping_routine_assignments()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_dtstart date;
  v_new_end date;
  v_overlap_count integer;
BEGIN
  -- Skip non-routine rows entirely.
  IF NEW.task_type IS DISTINCT FROM 'routine' THEN
    RETURN NEW;
  END IF;

  -- Skip archived rows entirely (re-deploying after archive is fine).
  IF NEW.archived_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Skip rows missing the keys we'd compare on.
  IF NEW.template_id IS NULL OR NEW.assignee_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve the new row's date range.
  v_new_dtstart := COALESCE(
    NULLIF((NEW.recurrence_details ->> 'dtstart'), '')::date,
    NEW.created_at::date,
    CURRENT_DATE
  );
  v_new_end := NEW.due_date;  -- NULL = ongoing / +infinity

  -- Count active overlapping deployments for the same template+assignee.
  -- TG_OP guard: on UPDATE we exclude the row being updated itself.
  SELECT COUNT(*) INTO v_overlap_count
  FROM public.tasks AS existing
  WHERE existing.template_id = NEW.template_id
    AND existing.assignee_id = NEW.assignee_id
    AND existing.task_type = 'routine'
    AND existing.archived_at IS NULL
    AND (TG_OP <> 'UPDATE' OR existing.id <> NEW.id)
    AND (
      -- existing.dtstart <= new.end_date
      -- (NULL new.end_date = +infinity, so always true)
      v_new_end IS NULL
      OR COALESCE(
           NULLIF((existing.recurrence_details ->> 'dtstart'), '')::date,
           existing.created_at::date,
           CURRENT_DATE
         ) <= v_new_end
    )
    AND (
      -- existing.end_date >= new.dtstart
      -- (NULL existing.due_date = +infinity, so always true)
      existing.due_date IS NULL
      OR existing.due_date >= v_new_dtstart
    );

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION
      'Routine deployment overlaps with an existing active assignment for this template + family member. Application code should pre-check via detectRoutineOverlap and surface the resolution modal.'
      USING ERRCODE = 'exclusion_violation',
            HINT = 'Archive the existing deployment, narrow its end date, or pick a non-overlapping date range for the new one.';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_overlapping_routine_assignments() IS
  'Worker ROUTINE-PROPAGATION (c2.5, founder D5): backstop for the routine overlap rule. Application pre-checks via detectRoutineOverlap; this trigger ensures non-UI write paths (direct SQL, Edge Functions) cannot bypass the rule. Replaces the stricter tasks_unique_active_routine_per_assignee unique index from migration 100152.';


-- ── Step 3: drop any existing trigger of the same name (idempotent) ─
DROP TRIGGER IF EXISTS trg_prevent_overlapping_routine_assignments ON public.tasks;


-- ── Step 4: install trigger ──────────────────────────────────────
CREATE TRIGGER trg_prevent_overlapping_routine_assignments
  BEFORE INSERT OR UPDATE OF template_id, assignee_id, task_type, archived_at,
                              recurrence_details, due_date
  ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_overlapping_routine_assignments();

COMMENT ON TRIGGER trg_prevent_overlapping_routine_assignments ON public.tasks IS
  'Backstop for routine overlap rule. Fires only when fields used in the overlap calculation actually change.';


-- ── Step 5: smoke-test guard for production safety ──────────────
--
-- If, somehow, the live database already contains overlapping rows
-- (because the unique index from 100152 was dropped before this trigger
-- was installed in some environment), the migration loudly notices
-- but does NOT abort — the production data already exists and the
-- trigger only fires on FUTURE writes. Surface a NOTICE so a manual
-- cleanup can run.
DO $$
DECLARE
  v_existing_overlaps integer;
BEGIN
  SELECT COUNT(*) INTO v_existing_overlaps
  FROM public.tasks a
  JOIN public.tasks b
    ON a.template_id = b.template_id
   AND a.assignee_id = b.assignee_id
   AND a.id <> b.id
   AND a.task_type = 'routine'
   AND b.task_type = 'routine'
   AND a.archived_at IS NULL
   AND b.archived_at IS NULL;

  IF v_existing_overlaps > 0 THEN
    RAISE NOTICE
      'Worker ROUTINE-PROPAGATION migration 100176: % pre-existing duplicate (template_id, assignee_id) routine pair(s) detected. The new trigger only blocks NEW overlapping inserts. If any of these are also date-overlapping, mom should resolve them via the duplicate-resolution modal once Worker 1 ships c2.5 wire-up.',
      v_existing_overlaps;
  END IF;
END $$;
