-- ============================================================================
-- 00000000100147_shared_task_rls_fix.sql
-- ============================================================================
-- Bug fix: Secondary assignees on shared tasks (is_shared=true, "assign to
-- anyone" mode) cannot UPDATE the tasks row to mark it completed.
--
-- Root cause: the `tasks_manage_adults` policy (migration 000008) checks
-- assignee_id, created_by, and primary_parent_id — but when a task uses
-- the multi-assignment pattern, secondary assignees have rows in
-- task_assignments (member_id / family_member_id) without being the
-- task's assignee_id. The RLS UPDATE never JOINs task_assignments, so
-- their .update({ status: 'completed' }) silently returns 0 rows.
--
-- Fix: Add a targeted UPDATE policy that allows any family member with an
-- active task_assignments row for a task to UPDATE that task's status and
-- completion-related fields. This does NOT replace the existing
-- tasks_manage_adults policy — it's additive (OR semantics in Postgres RLS).
--
-- Scope: UPDATE only. The existing tasks_manage_adults FOR ALL policy
-- already covers INSERT/DELETE for adults and primary assignees.
--
-- Idempotent: uses DROP POLICY IF EXISTS before CREATE.
-- ============================================================================

BEGIN;

-- Add an UPDATE policy for members who appear in task_assignments
DROP POLICY IF EXISTS "tasks_update_assigned_member" ON public.tasks;

CREATE POLICY "tasks_update_assigned_member" ON public.tasks
  FOR UPDATE
  USING (
    -- The authenticated user has a family_member row that appears in
    -- task_assignments for this task (via either member_id or family_member_id)
    id IN (
      SELECT ta.task_id
      FROM public.task_assignments ta
      JOIN public.family_members fm ON (fm.id = ta.member_id OR fm.id = ta.family_member_id)
      WHERE fm.user_id = auth.uid()
        AND ta.is_active = true
    )
  )
  WITH CHECK (
    -- Same condition on the updated row — prevents reassigning to another family
    id IN (
      SELECT ta.task_id
      FROM public.task_assignments ta
      JOIN public.family_members fm ON (fm.id = ta.member_id OR fm.id = ta.family_member_id)
      WHERE fm.user_id = auth.uid()
        AND ta.is_active = true
    )
  );

COMMENT ON POLICY "tasks_update_assigned_member" ON public.tasks IS
  'Bug fix: allows secondary assignees on shared tasks (is_shared=true) to UPDATE the task row (mark complete, update status). The original tasks_manage_adults policy only checks assignee_id which misses members assigned via task_assignments.';


-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tasks';
  RAISE NOTICE '[100147] tasks table now has % RLS policies (expected 3: select_family + manage_adults + update_assigned_member)', v_count;
END
$$;

COMMIT;
