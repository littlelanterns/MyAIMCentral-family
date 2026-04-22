-- ============================================================================
-- 00000000100151_rls_tasks_task_assignments_recursion_fix.sql
-- ============================================================================
-- Bug: UPDATE on public.tasks fails with
--   "ERROR: infinite recursion detected in policy for relation \"tasks\""
-- whenever the current user's query plan requires RLS to evaluate both
-- `tasks_update_assigned_member` (tasks) AND `ta_via_task`
-- (task_assignments).
--
-- The cycle:
--   tasks_update_assigned_member          (tasks)          → subquery on task_assignments
--   ta_via_task                           (task_assignments) → subquery on tasks
--   → re-enters tasks policies → back to task_assignments → ∞
--
-- User-visible consequences:
--   • "Remove from dashboard" menu item (useArchiveTask → UPDATE tasks
--     SET archived_at) silently fails for every family member who would
--     otherwise have update access via the assigned-member path.
--   • Server-side cleanup (tests, admin scripts) hit the same error.
--   • Any supabase-js UPDATE that causes the planner to evaluate both
--     policies blows up mid-query.
--
-- Fix: break the cycle on the task_assignments side. The `ta_via_task`
-- policy doesn't need to reference `tasks` at all — it can check family
-- membership directly via the assigned family_member, since a task
-- assignment implicitly lives in the family of its assigned member.
--
-- Uses a new SECURITY DEFINER helper `public.auth_family_ids()` that
-- returns every family_id the current user belongs to (mirroring the
-- existing `get_my_family_id()` but as SETOF to handle rare multi-family
-- cases without LIMIT 1 truncation). SECURITY DEFINER bypasses RLS
-- inside the helper, which is safe because the helper only reads the
-- caller's OWN family_members rows and returns UUIDs.
--
-- `family_members` RLS already uses `get_my_family_id()` and does NOT
-- reference `tasks` or `task_assignments`, so the new policy chain is
-- cycle-free:
--
--   tasks_update_assigned_member (tasks)   → task_assignments
--   ta_via_family                (task_assignments) → family_members
--   fm_select                    (family_members)   → get_my_family_id() (SECURITY DEFINER)
--   STOP
--
-- Idempotent: uses CREATE OR REPLACE for the helper and
-- DROP POLICY IF EXISTS + CREATE POLICY for the policy swap.
-- ============================================================================

BEGIN;

-- ── Helper: all family_ids the current user belongs to ────────────
CREATE OR REPLACE FUNCTION public.auth_family_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
$$;

COMMENT ON FUNCTION public.auth_family_ids() IS
  'Returns every family_id the authenticated user belongs to. SECURITY DEFINER so it can be referenced inside RLS policies without re-triggering RLS on family_members. Read-only, returns UUIDs only. Safe to expose to all authenticated users.';

GRANT EXECUTE ON FUNCTION public.auth_family_ids() TO authenticated;


-- ── Replace ta_via_task with a non-recursive equivalent ───────────
-- Old: `task_id IN (SELECT id FROM tasks WHERE family_id IN (...))`
-- New: `member_id IN (SELECT id FROM family_members WHERE family_id IN auth_family_ids())`
--
-- Equivalent for legitimate rows: a task assignment's member must be in
-- the same family as the task, so scoping by the member's family is the
-- same set of rows as scoping by the task's family — without going
-- through `tasks` at all.

DROP POLICY IF EXISTS "ta_via_task" ON public.task_assignments;
DROP POLICY IF EXISTS "ta_via_family" ON public.task_assignments;

CREATE POLICY "ta_via_family" ON public.task_assignments
  FOR ALL
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

COMMENT ON POLICY "ta_via_family" ON public.task_assignments IS
  'Scopes task_assignments to the current user''s families via family_member lookup only — does NOT reference tasks, so no recursion with tasks_update_assigned_member. Replaces ta_via_task (migration 000008).';


-- ── Verification ──────────────────────────────────────────────────
DO $$
DECLARE
  v_tasks_count INTEGER;
  v_ta_count    INTEGER;
  v_has_cycle   BOOLEAN := false;
  v_text        TEXT;
BEGIN
  SELECT COUNT(*) INTO v_tasks_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tasks';
  SELECT COUNT(*) INTO v_ta_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'task_assignments';

  RAISE NOTICE '[100151] tasks: % RLS policies; task_assignments: % RLS policies', v_tasks_count, v_ta_count;

  -- Belt-and-suspenders: fail the migration if ta_via_family still references tasks
  SELECT qual INTO v_text FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'task_assignments' AND policyname = 'ta_via_family';
  IF v_text IS NULL THEN
    RAISE EXCEPTION '[100151] ta_via_family policy not present after migration';
  END IF;
  IF v_text ~* 'from\s+public\.tasks|from\s+tasks' THEN
    RAISE EXCEPTION '[100151] ta_via_family still references tasks — recursion not broken';
  END IF;
END
$$;

COMMIT;
