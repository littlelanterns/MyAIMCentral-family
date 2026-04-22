-- ============================================================================
-- 00000000100152_routine_dedupe_and_task_assignments_split.sql
-- ============================================================================
--
-- Two independent hardening passes bundled:
--
--   (A) Hard DB guard against duplicate routine assignments.
--       A partial unique index on (template_id, assignee_id) for active
--       routine tasks so the database itself refuses to accept a second
--       live "Zone 2: Herringbone" for Mosiah. Same routine recurring
--       every 4 weeks is still ONE row (recurrence lives inside
--       recurrence_details, not across rows). The 10-second dedupe
--       window in createTaskFromData catches fast retries; this index
--       catches everything — every code path, every delay, every
--       future bug. Belt-and-suspenders.
--
--   (B) Split task_assignments RLS from the permissive family-wide
--       ALL policy into per-command policies so non-admin members
--       cannot delete assignments or add siblings to tasks.
--       Founder rule: "I don't want my kids to be able to delete
--       tasks I assign them, but I'm super open to them adding/
--       editing their own."
--
--       Replaces `ta_via_family` (migration 100151) with four:
--         - ta_select   (SELECT): all family members read family rows
--         - ta_insert   (INSERT): can only insert rows where
--                                 member_id OR family_member_id equals
--                                 YOUR OWN family_members id, OR you
--                                 are primary_parent / additional_adult
--                                 (admins can assign anyone to anything)
--         - ta_update   (UPDATE): admins update anything in family;
--                                 other members update rows where they
--                                 are the assignee (rotation state,
--                                 is_active toggle)
--         - ta_delete   (DELETE): admins only — no child can remove
--                                 themselves or siblings from any task
--
-- Idempotent: DROP ... IF EXISTS + CREATE for both index and policies.
-- ============================================================================

BEGIN;

-- ── Part A: routine-assignment uniqueness ─────────────────────────

-- Partial unique index:
--   - scope: task_type='routine' (one-time tasks may legitimately repeat titles)
--   - only active rows: archived_at IS NULL
--   - only rows with both keys set
-- Guarantees: at most ONE active task row per (family, template, assignee)
-- for routine-type templates. Does NOT constrain:
--   • sibling same-template assignments (different assignee → different row)
--   • same person, different template → different row
--   • archived rows (so you can archive + re-deploy later without conflict)
--   • non-routine task types
DROP INDEX IF EXISTS public.tasks_unique_active_routine_per_assignee;
CREATE UNIQUE INDEX tasks_unique_active_routine_per_assignee
  ON public.tasks (template_id, assignee_id)
  WHERE task_type = 'routine'
    AND archived_at IS NULL
    AND template_id IS NOT NULL
    AND assignee_id IS NOT NULL;

COMMENT ON INDEX public.tasks_unique_active_routine_per_assignee IS
  'Hard DB guard: at most one active routine-task row per (template, assignee). Prevents the "Mosiah has two Herringbones" duplicate-assignment bug regardless of which code path or race condition produced the second insert. Archived rows and non-routine tasks are exempt.';


-- ── Part B: task_assignments policy split ─────────────────────────

-- Helper: is the current user an admin (primary_parent or additional_adult)
-- in the target family? SECURITY DEFINER to bypass RLS on family_members
-- for this check (same pattern as existing auth_family_ids / get_my_family_id).
CREATE OR REPLACE FUNCTION public.auth_is_admin_of(p_family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = auth.uid()
      AND family_id = p_family_id
      AND role IN ('primary_parent', 'additional_adult')
  )
$$;

COMMENT ON FUNCTION public.auth_is_admin_of(uuid) IS
  'True when the authenticated user is primary_parent or additional_adult in the given family. SECURITY DEFINER so it is safely callable from RLS policies without re-triggering RLS on family_members.';

GRANT EXECUTE ON FUNCTION public.auth_is_admin_of(uuid) TO authenticated;


-- Drop the combined policy from 100151
DROP POLICY IF EXISTS "ta_via_family" ON public.task_assignments;
-- Also defensively drop names we are about to create, for idempotency.
DROP POLICY IF EXISTS "ta_select" ON public.task_assignments;
DROP POLICY IF EXISTS "ta_insert" ON public.task_assignments;
DROP POLICY IF EXISTS "ta_update" ON public.task_assignments;
DROP POLICY IF EXISTS "ta_delete" ON public.task_assignments;


-- SELECT — any family member reads every assignment row in their family.
-- Unchanged from prior behavior. Required for rendering.
CREATE POLICY "ta_select" ON public.task_assignments
  FOR SELECT
  USING (
    member_id IN (
      SELECT fm.id FROM public.family_members fm
      WHERE fm.family_id IN (SELECT public.auth_family_ids())
    )
    OR family_member_id IN (
      SELECT fm.id FROM public.family_members fm
      WHERE fm.family_id IN (SELECT public.auth_family_ids())
    )
  );

COMMENT ON POLICY "ta_select" ON public.task_assignments IS
  'All family members can read every assignment row in their family. Required for task cards to display who is assigned.';


-- INSERT — admins can insert any row in their family; non-admins may only
-- insert rows where the assignee is themselves (opt-in to their own tasks).
-- Prevents a child from adding a sibling to a task.
CREATE POLICY "ta_insert" ON public.task_assignments
  FOR INSERT
  WITH CHECK (
    -- Admin path: assignee must belong to the admin's family
    (
      (member_id IS NULL OR member_id IN (
        SELECT fm.id FROM public.family_members fm
        WHERE fm.family_id IN (SELECT public.auth_family_ids())
      ))
      AND
      (family_member_id IS NULL OR family_member_id IN (
        SELECT fm.id FROM public.family_members fm
        WHERE fm.family_id IN (SELECT public.auth_family_ids())
      ))
      AND
      (SELECT bool_or(public.auth_is_admin_of(fm.family_id))
         FROM public.family_members fm
         WHERE fm.id = COALESCE(member_id, family_member_id))
    )
    OR
    -- Non-admin path: assignee must BE the current user's family_member row
    (
      (member_id IS NOT NULL AND member_id IN (
        SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      ))
      OR
      (family_member_id IS NOT NULL AND family_member_id IN (
        SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      ))
    )
  );

COMMENT ON POLICY "ta_insert" ON public.task_assignments IS
  'Admins (primary_parent / additional_adult) can insert any assignment row for a member in their family. Non-admin members can only insert rows where the assignee is themselves — prevents children from adding siblings to tasks.';


-- UPDATE — admins can update anything in their family; other members may
-- update rows where they are the assignee (rotation position toggle,
-- is_active leave-a-rotation, etc.).
CREATE POLICY "ta_update" ON public.task_assignments
  FOR UPDATE
  USING (
    -- Admin path: row is in admin's family
    (SELECT bool_or(public.auth_is_admin_of(fm.family_id))
       FROM public.family_members fm
       WHERE fm.id = COALESCE(member_id, family_member_id))
    OR
    -- Non-admin self-edit path
    (
      member_id IN (SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      OR family_member_id IN (SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    )
  )
  WITH CHECK (
    -- Same predicate on the resulting row — can't change assignee to outside family
    (SELECT bool_or(public.auth_is_admin_of(fm.family_id))
       FROM public.family_members fm
       WHERE fm.id = COALESCE(member_id, family_member_id))
    OR
    (
      member_id IN (SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      OR family_member_id IN (SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    )
  );

COMMENT ON POLICY "ta_update" ON public.task_assignments IS
  'Admins can update any assignment row in their family. Non-admin members can update rows where they are the assignee (e.g. leave a voluntary rotation).';


-- DELETE — admins ONLY. No child can remove themselves or a sibling
-- from any task assignment. Per founder rule.
CREATE POLICY "ta_delete" ON public.task_assignments
  FOR DELETE
  USING (
    (SELECT bool_or(public.auth_is_admin_of(fm.family_id))
       FROM public.family_members fm
       WHERE fm.id = COALESCE(member_id, family_member_id))
  );

COMMENT ON POLICY "ta_delete" ON public.task_assignments IS
  'Admins only (primary_parent / additional_adult). Non-admins cannot delete assignment rows — prevents children from removing themselves or siblings from tasks their parents assigned.';


-- ── Verification ──────────────────────────────────────────────────
DO $$
DECLARE
  v_idx_exists   BOOLEAN;
  v_policy_count INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'tasks_unique_active_routine_per_assignee'
  ) INTO v_idx_exists;
  IF NOT v_idx_exists THEN
    RAISE EXCEPTION '[100152] unique index missing after migration';
  END IF;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'task_assignments';
  IF v_policy_count <> 4 THEN
    RAISE EXCEPTION '[100152] task_assignments should have 4 policies, found %', v_policy_count;
  END IF;

  RAISE NOTICE '[100152] routine uniqueness index live; task_assignments has % policies (select/insert/update/delete)', v_policy_count;
END
$$;

COMMIT;
