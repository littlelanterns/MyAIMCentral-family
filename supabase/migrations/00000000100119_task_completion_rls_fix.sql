-- ============================================================================
-- 00000000100119_task_completion_rls_fix.sql
-- ============================================================================
-- Root-cause fix for the task_completions RLS policy gap that blocked
-- View As task completion everywhere (PlayDashboard, GuidedDashboard, and
-- the founder's adult Tasks page when acting on another member's task).
--
-- The original migration 00000000000008 wrote `tc_insert_own` to require
-- `member_id = auth.uid()'s family_member_id`, which was correct BEFORE
-- View As existed. After PRD-14 migration 00000000100058 added `acted_by`
-- columns for View As audit attribution, the RLS layer was never updated
-- to honor that column. The `acted_by` value was written by the client but
-- ignored by the policy check, so every View As completion 403'd silently
-- except where the client code happened to resolve the caller's own id.
--
-- A secondary gap: `useUncompleteTask` does a DELETE on task_completions,
-- but no DELETE policy exists, so un-completions have been silently failing
-- (0 rows affected, no error surfaced). The tasks row reset but the old
-- completion row stayed, creating gradual data integrity drift.
--
-- A third gap: `tc_approve_parent` only allowed primary_parent to UPDATE
-- completions for approval flows. additional_adult and special_adult could
-- not approve/reject rejections on behalf of a child, forcing mom to be the
-- only approval bottleneck.
--
-- The fix:
--   1. Drop `tc_insert_own` and `tc_approve_parent`
--   2. Add `tc_insert_adult_or_self` — adults (primary_parent, additional_adult,
--      special_adult) in the same family as the target member_id can insert,
--      AND any member can still insert their own completions (satisfies
--      teens acting on their own dashboards)
--   3. Add `tc_update_adult` — adults in the same family can update (approve,
--      reject, correct)
--   4. Add `tc_delete_adult_or_self` — adults can delete any family completion
--      (un-complete), members can delete their own
--   5. Mirror the same fix on `routine_step_completions` which had a different
--      but equally wrong policy (`FOR ALL USING` with no WITH CHECK — too
--      permissive for teens, insufficient for View As attribution audit)
--
-- Teens (role=member, dashboard_mode=independent) do NOT get acting-on-behalf
-- rights. They have no View As button on their dashboards per product design.
--
-- All existing data stays. No row changes. Just policy replacement.
-- Idempotent: safe to re-run. Uses DROP POLICY IF EXISTS.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. task_completions — replace tc_insert_own and tc_approve_parent
-- ============================================================================

DROP POLICY IF EXISTS "tc_insert_own" ON public.task_completions;
DROP POLICY IF EXISTS "tc_approve_parent" ON public.task_completions;

-- SELECT policy is correct as-is (tc_select_family). Not touching it.

-- INSERT: adults can insert for any family member in their family;
-- members (teens/kids) can only insert their own completions.
-- The WITH CHECK clause runs at INSERT time against the NEW row's values.
CREATE POLICY "tc_insert_adult_or_self"
  ON public.task_completions
  FOR INSERT
  WITH CHECK (
    -- Path A: adults acting within their family
    member_id IN (
      SELECT target.id
      FROM public.family_members target
      WHERE target.family_id IN (
        SELECT caller.family_id
        FROM public.family_members caller
        WHERE caller.user_id = auth.uid()
          AND caller.role IN ('primary_parent', 'additional_adult', 'special_adult')
      )
    )
    OR
    -- Path B: any member acting on their own
    member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "tc_insert_adult_or_self" ON public.task_completions IS
  'Build M Sub-phase B fix: adults (primary_parent, additional_adult, special_adult) can insert task completions for any member in their family (View As path). Members can insert their own completions. Teens have no View As button on their dashboards so they only ever hit the "self" path.';

-- UPDATE: adults can update (approve, reject, correct) any completion in
-- their family. Members cannot modify completions — only insert/delete their own.
CREATE POLICY "tc_update_adult"
  ON public.task_completions
  FOR UPDATE
  USING (
    task_id IN (
      SELECT t.id
      FROM public.tasks t
      WHERE t.family_id IN (
        SELECT caller.family_id
        FROM public.family_members caller
        WHERE caller.user_id = auth.uid()
          AND caller.role IN ('primary_parent', 'additional_adult', 'special_adult')
      )
    )
  )
  WITH CHECK (
    task_id IN (
      SELECT t.id
      FROM public.tasks t
      WHERE t.family_id IN (
        SELECT caller.family_id
        FROM public.family_members caller
        WHERE caller.user_id = auth.uid()
          AND caller.role IN ('primary_parent', 'additional_adult', 'special_adult')
      )
    )
  );

COMMENT ON POLICY "tc_update_adult" ON public.task_completions IS
  'Build M Sub-phase B fix: approval/rejection/correction of completions. Replaces tc_approve_parent which only allowed primary_parent. Now any adult (primary_parent, additional_adult, special_adult) in the same family can manage approval state.';

-- DELETE: adults can delete any family completion (un-complete via
-- useUncompleteTask); members can delete their own. This is the FIRST
-- DELETE policy on task_completions — the un-complete hook has been
-- silently failing for everyone since day one.
CREATE POLICY "tc_delete_adult_or_self"
  ON public.task_completions
  FOR DELETE
  USING (
    -- Path A: adults acting within their family
    task_id IN (
      SELECT t.id
      FROM public.tasks t
      WHERE t.family_id IN (
        SELECT caller.family_id
        FROM public.family_members caller
        WHERE caller.user_id = auth.uid()
          AND caller.role IN ('primary_parent', 'additional_adult', 'special_adult')
      )
    )
    OR
    -- Path B: members deleting their own completions
    member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "tc_delete_adult_or_self" ON public.task_completions IS
  'Build M Sub-phase B fix: un-complete task flow. No DELETE policy existed before this migration, so useUncompleteTask was silently failing (0 rows affected, no error). Adults can delete any family completion for un-complete / correction. Members can delete their own.';


-- ============================================================================
-- 2. routine_step_completions — harden the FOR ALL policy
-- ============================================================================
-- Original policy rsc_via_task used FOR ALL USING without WITH CHECK. That
-- meant: any family member could SELECT/INSERT/UPDATE/DELETE any step
-- completion in their family (too permissive for teens modifying siblings'
-- progress, though the impact is minor because step completions are
-- append-only audit rows). Replace with the same role-scoped pattern as
-- task_completions so the permission model is consistent.

DROP POLICY IF EXISTS "rsc_via_task" ON public.routine_step_completions;

CREATE POLICY "rsc_select_family"
  ON public.routine_step_completions
  FOR SELECT
  USING (
    task_id IN (
      SELECT t.id
      FROM public.tasks t
      WHERE t.family_id IN (
        SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "rsc_insert_adult_or_self"
  ON public.routine_step_completions
  FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT target.id
      FROM public.family_members target
      WHERE target.family_id IN (
        SELECT caller.family_id
        FROM public.family_members caller
        WHERE caller.user_id = auth.uid()
          AND caller.role IN ('primary_parent', 'additional_adult', 'special_adult')
      )
    )
    OR
    member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "rsc_delete_adult_or_self"
  ON public.routine_step_completions
  FOR DELETE
  USING (
    task_id IN (
      SELECT t.id
      FROM public.tasks t
      WHERE t.family_id IN (
        SELECT caller.family_id
        FROM public.family_members caller
        WHERE caller.user_id = auth.uid()
          AND caller.role IN ('primary_parent', 'additional_adult', 'special_adult')
      )
    )
    OR
    member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

-- Note: routine_step_completions has no UPDATE pathway in the current
-- codebase — it's append-only for the audit log. Intentionally no
-- UPDATE policy. If PRD-24 streak rewinding ever needs it, add one then.


-- ============================================================================
-- 3. Verification NOTICE
-- ============================================================================

DO $$
DECLARE
  v_tc_policies INTEGER;
  v_rsc_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tc_policies
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'task_completions';
  SELECT COUNT(*) INTO v_rsc_policies
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'routine_step_completions';

  RAISE NOTICE '[100119] task_completions now has % policies (expected 4: select, insert, update, delete)', v_tc_policies;
  RAISE NOTICE '[100119] routine_step_completions now has % policies (expected 3: select, insert, delete)', v_rsc_policies;
END
$$;

COMMIT;
