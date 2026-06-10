-- ============================================================================
-- 00000000100262_task_assignment_scoping_and_family_device_writes.sql
-- ============================================================================
-- Build: RR-DEPLOY-SCOPING (2026-06-10, founder-approved)
--
-- Four concerns in one migration (they share helpers and policy restructure):
--
-- 1. NEW permission key `task_assignment` + util.task_assign_allowed():
--    "who can assign NEW tasks to whom." Mom: always. additional_adult:
--    self-only unless mom grants (per-kid row and/or family-wide NULL-target
--    row; per-kid row ALWAYS wins, including an explicit 'none' carve-out —
--    exact mirror of util.finance_grant_level from migration 100261).
--    Teens/guided/play: self-only, flat, not grantable.
--
-- 2. Tasks/task_assignments WRITE-side RLS hardening: WITH CHECK on
--    assignee targeting. Previously tasks_manage_adults allowed any family
--    member to INSERT a task with ANY assignee_id (teens could put tasks on
--    mom's dashboard). Read-side scoping is deliberately NOT touched
--    (Convention #39 per-member-auth migration point).
--
-- 3. Family-device write restoration: true family-shadow sessions
--    (role='family' member row, two-door build 2026-06-09 / Convention #273)
--    were silently blocked by RLS from task_completions, routine_step_
--    completions, intention_iterations, family_intention_iterations, tasks,
--    lists, and list_items writes — pre-two-door, hub devices rested on
--    mom's session which passed every adult check. util.is_family_shadow_of()
--    restores family-scoped access for those tables. Kid identity on family
--    devices is enforced at the app layer (PIN-verified View As
--    member_session) — same trust model as before, now explicit.
--    NOTE: a comprehensive family-device write audit across ALL other tables
--    (journal, victories, widgets, practice_log, messages, ...) is a filed
--    follow-up — this migration covers the tasks/lists/hub-tally domain.
--
-- 4. tasks.source CHECK: add 'mindsweep_auto' (22 values) for MindSweep
--    auto-route direct task creation. 'review_route' already present.
--
-- Idempotent: DROP POLICY IF EXISTS / CREATE OR REPLACE FUNCTION /
-- constraint rebuild / WHERE NOT EXISTS seed.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. tasks.source CHECK — add 'mindsweep_auto' (21 → 22)
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_source_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_source_check
  CHECK (source IN (
    'manual',
    'template_deployed',
    'lila_conversation',
    'notepad_routed',
    'review_route',
    'meeting_action',
    'goal_decomposition',
    'project_planner',
    'member_request',
    'sequential_promoted',
    'recurring_generated',
    'guided_form_assignment',
    'list_batch',
    'rhythm_priority',
    'rhythm_mindsweep_lite',
    'randomizer_reveal',
    'allowance_makeup',
    'opportunity_list_claim',
    'list_promotion',
    'icon_launcher',
    'activity_list',
    'mindsweep_auto'
  ));

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Register the task_assignment permission key
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
SELECT
  'task_assignment',
  'Task Assignment',
  'Grants an additional adult the ability to assign NEW tasks to children. Per-kid rows and/or one family-wide row (target_member_id IS NULL); per-kid row always wins, including an explicit none carve-out. Mom always has full assignment. Acting on EXISTING tasks (complete/approve) remains governed by the contribute-level viewableLevels check.',
  'RR-DEPLOY-SCOPING 2026-06-10 (PRD-02/PRD-09A amendment)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_key_registry WHERE feature_key = 'task_assignment'
);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Helpers
-- ────────────────────────────────────────────────────────────────────────────

-- Is the caller the family-shadow identity ({family_id}@family...) of this family?
CREATE OR REPLACE FUNCTION util.is_family_shadow_of(p_family UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
      AND fm.role = 'family'
      AND fm.family_id = p_family
  );
$$;

REVOKE ALL ON FUNCTION util.is_family_shadow_of(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION util.is_family_shadow_of(UUID) TO authenticated;

COMMENT ON FUNCTION util.is_family_shadow_of(UUID) IS
  'True when auth.uid() is the family-shadow account (role=family member row) of the given family. Family devices rest on this identity (Convention #273); member identity on those devices is PIN-verified at the app layer.';

-- Can the caller (an additional_adult) assign NEW tasks to p_assignee?
-- Mirrors util.finance_grant_level (migration 100261): per-kid row wins
-- (including explicit 'none' carve-out), family-wide NULL-target row covers
-- all role='member' kids. Returns false for every non-additional_adult caller
-- (mom never needs it; teens are never grantable).
CREATE OR REPLACE FUNCTION util.task_assign_allowed(p_assignee UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT fm.id, fm.family_id
    FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
      AND fm.role = 'additional_adult'
    LIMIT 1
  )
  SELECT COALESCE(
    -- 1. Per-kid row wins (any level, including an explicit 'none' carve-out)
    (SELECT COALESCE(mp.access_level, mp.permission_value->>'access_level', 'none')
     FROM public.member_permissions mp, me
     WHERE mp.granted_to = me.id
       AND mp.family_id = me.family_id
       AND mp.permission_key = 'task_assignment'
       AND mp.target_member_id = p_assignee
     LIMIT 1),
    -- 2. Family-wide fallback — applies to KIDS in the adult's family only
    (SELECT COALESCE(mp.access_level, mp.permission_value->>'access_level', 'none')
     FROM public.member_permissions mp
     JOIN me ON mp.granted_to = me.id AND mp.family_id = me.family_id
     JOIN public.family_members kid
       ON kid.id = p_assignee
      AND kid.family_id = me.family_id
      AND kid.role = 'member'
     WHERE mp.permission_key = 'task_assignment'
       AND mp.target_member_id IS NULL
     LIMIT 1),
    'none'
  ) <> 'none';
$$;

REVOKE ALL ON FUNCTION util.task_assign_allowed(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION util.task_assign_allowed(UUID) TO authenticated;

COMMENT ON FUNCTION util.task_assign_allowed(UUID) IS
  'Single authority for "can the calling additional_adult assign NEW tasks to this member" (RR-DEPLOY-SCOPING). Frontend mirror: useAssignableMembers(). Acting on existing tasks stays on the contribute-level check (coordination ruling with FO-COMMAND-CENTER, Q1).';

-- ────────────────────────────────────────────────────────────────────────────
-- 4. tasks — split tasks_manage_adults into scoped INSERT/UPDATE/DELETE
-- ────────────────────────────────────────────────────────────────────────────
-- tasks_select_family (read) is NOT touched — read-side scoping deferred.

DROP POLICY IF EXISTS "tasks_manage_adults" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_scoped" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_scoped" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_scoped" ON public.tasks;

CREATE POLICY "tasks_insert_scoped" ON public.tasks
  FOR INSERT
  WITH CHECK (
    -- Mom: anything within her family
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    OR
    -- Family device: family-scoped (app layer enforces effective member identity)
    util.is_family_shadow_of(family_id)
    OR
    -- Everyone else: must be the creator, in their own family, and the
    -- assignee must be themselves (or empty, for shared tasks whose
    -- assignment rows are guarded separately) or covered by a grant.
    (
      created_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
      AND family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
      AND (
        assignee_id IS NULL
        OR assignee_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
        OR util.task_assign_allowed(assignee_id)
      )
    )
  );

COMMENT ON POLICY "tasks_insert_scoped" ON public.tasks IS
  'RR-DEPLOY-SCOPING: non-mom members can only create tasks assigned to themselves (or NULL assignee — task_assignments rows are guarded by ta_write_scoped) unless util.task_assign_allowed grants the target. Replaces the INSERT reach of tasks_manage_adults, which allowed any family member to assign tasks to anyone.';

CREATE POLICY "tasks_update_scoped" ON public.tasks
  FOR UPDATE
  USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    OR util.is_family_shadow_of(family_id)
    OR created_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR assignee_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    OR util.is_family_shadow_of(family_id)
    OR (
      (
        created_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
        OR assignee_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
      )
      AND (
        assignee_id IS NULL
        OR assignee_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
        OR util.task_assign_allowed(assignee_id)
      )
    )
  );

COMMENT ON POLICY "tasks_update_scoped" ON public.tasks IS
  'RR-DEPLOY-SCOPING: preserves the update reach of tasks_manage_adults (mom / creator / assignee) but blocks non-mom members from reassigning a task to someone else via edit, unless granted. Shared-task secondary assignees are covered by tasks_update_assigned_member.';

CREATE POLICY "tasks_delete_scoped" ON public.tasks
  FOR DELETE
  USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    OR util.is_family_shadow_of(family_id)
    OR created_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR assignee_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

COMMENT ON POLICY "tasks_delete_scoped" ON public.tasks IS
  'RR-DEPLOY-SCOPING: same delete reach as the old tasks_manage_adults (mom / creator / assignee) plus the family-device path.';

-- Tighten tasks_update_assigned_member (migration 100147): keep its USING
-- reach (secondary assignees can complete shared tasks) but add an assignee-
-- targeting guard to WITH CHECK so it cannot be used to redirect assignee_id
-- to an arbitrary member. Reassignment among ALREADY-assigned members of the
-- same task remains allowed (that is the normal shared-completion state).
DROP POLICY IF EXISTS "tasks_update_assigned_member" ON public.tasks;

CREATE POLICY "tasks_update_assigned_member" ON public.tasks
  FOR UPDATE
  USING (
    id IN (
      SELECT ta.task_id
      FROM public.task_assignments ta
      JOIN public.family_members fm ON (fm.id = ta.member_id OR fm.id = ta.family_member_id)
      WHERE fm.user_id = auth.uid()
        AND ta.is_active = true
    )
  )
  WITH CHECK (
    id IN (
      SELECT ta.task_id
      FROM public.task_assignments ta
      JOIN public.family_members fm ON (fm.id = ta.member_id OR fm.id = ta.family_member_id)
      WHERE fm.user_id = auth.uid()
        AND ta.is_active = true
    )
    AND (
      assignee_id IS NULL
      OR assignee_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
      OR assignee_id IN (
        SELECT COALESCE(ta2.member_id, ta2.family_member_id)
        FROM public.task_assignments ta2
        WHERE ta2.task_id = tasks.id
      )
      OR util.task_assign_allowed(assignee_id)
    )
  );

COMMENT ON POLICY "tasks_update_assigned_member" ON public.tasks IS
  'Shared-task secondary assignees can UPDATE the task row (mark complete, update status) — migration 100147 behavior — but RR-DEPLOY-SCOPING adds a WITH CHECK guard: assignee_id may only point at themselves, an already-assigned member of the same task, or a granted target.';

-- ────────────────────────────────────────────────────────────────────────────
-- 5. task_assignments — replace ta_via_task with scoped read/write
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ta_via_task" ON public.task_assignments;
DROP POLICY IF EXISTS "ta_select_family" ON public.task_assignments;
DROP POLICY IF EXISTS "ta_write_scoped" ON public.task_assignments;
DROP POLICY IF EXISTS "ta_update_scoped" ON public.task_assignments;
DROP POLICY IF EXISTS "ta_delete_scoped" ON public.task_assignments;

-- Read stays family-wide (matches tasks_select_family; read-side deferred)
CREATE POLICY "ta_select_family" ON public.task_assignments
  FOR SELECT USING (
    task_id IN (
      SELECT t.id FROM public.tasks t
      WHERE t.family_id IN (
        SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "ta_write_scoped" ON public.task_assignments
  FOR INSERT
  WITH CHECK (
    -- Mom / family device: any assignment within the family
    task_id IN (
      SELECT t.id FROM public.tasks t
      WHERE t.family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
         OR util.is_family_shadow_of(t.family_id)
    )
    OR
    -- Everyone else: task in own family AND the assigned member is self or granted
    (
      task_id IN (
        SELECT t.id FROM public.tasks t
        WHERE t.family_id IN (
          SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
        )
      )
      AND (
        COALESCE(member_id, family_member_id) IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
        OR util.task_assign_allowed(COALESCE(member_id, family_member_id))
      )
    )
  );

CREATE POLICY "ta_update_scoped" ON public.task_assignments
  FOR UPDATE
  USING (
    task_id IN (
      SELECT t.id FROM public.tasks t
      WHERE t.family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
         OR util.is_family_shadow_of(t.family_id)
    )
    OR COALESCE(member_id, family_member_id) IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    task_id IN (
      SELECT t.id FROM public.tasks t
      WHERE t.family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
         OR util.is_family_shadow_of(t.family_id)
    )
    OR (
      COALESCE(member_id, family_member_id) IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
      OR util.task_assign_allowed(COALESCE(member_id, family_member_id))
    )
  );

CREATE POLICY "ta_delete_scoped" ON public.task_assignments
  FOR DELETE
  USING (
    task_id IN (
      SELECT t.id FROM public.tasks t
      WHERE t.family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
         OR util.is_family_shadow_of(t.family_id)
    )
    OR COALESCE(member_id, family_member_id) IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

COMMENT ON POLICY "ta_write_scoped" ON public.task_assignments IS
  'RR-DEPLOY-SCOPING: replaces ta_via_task which let any family member assign any other member. Non-mom can only create assignment rows for themselves or granted targets. Rotation cron runs as service role (bypasses RLS).';

-- ────────────────────────────────────────────────────────────────────────────
-- 6. Family-device write restoration (additive policies, OR semantics)
-- ────────────────────────────────────────────────────────────────────────────

-- task_completions
DROP POLICY IF EXISTS "tc_insert_family_device" ON public.task_completions;
CREATE POLICY "tc_insert_family_device" ON public.task_completions
  FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT m.id FROM public.family_members m
      WHERE util.is_family_shadow_of(m.family_id)
    )
  );

DROP POLICY IF EXISTS "tc_update_family_device" ON public.task_completions;
CREATE POLICY "tc_update_family_device" ON public.task_completions
  FOR UPDATE
  USING (
    task_id IN (SELECT t.id FROM public.tasks t WHERE util.is_family_shadow_of(t.family_id))
  )
  WITH CHECK (
    task_id IN (SELECT t.id FROM public.tasks t WHERE util.is_family_shadow_of(t.family_id))
  );

DROP POLICY IF EXISTS "tc_delete_family_device" ON public.task_completions;
CREATE POLICY "tc_delete_family_device" ON public.task_completions
  FOR DELETE
  USING (
    task_id IN (SELECT t.id FROM public.tasks t WHERE util.is_family_shadow_of(t.family_id))
  );

COMMENT ON POLICY "tc_insert_family_device" ON public.task_completions IS
  'Family-device restoration (RR-DEPLOY-SCOPING): true family-shadow sessions were blocked from completion writes after two-door (2026-06-09) because tc_insert_adult_or_self only matches adult roles or self. Pre-two-door hub devices rested on mom''s session. App layer enforces effective member identity (PIN-verified member_session).';

-- routine_step_completions
DROP POLICY IF EXISTS "rsc_insert_family_device" ON public.routine_step_completions;
CREATE POLICY "rsc_insert_family_device" ON public.routine_step_completions
  FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT m.id FROM public.family_members m
      WHERE util.is_family_shadow_of(m.family_id)
    )
  );

DROP POLICY IF EXISTS "rsc_delete_family_device" ON public.routine_step_completions;
CREATE POLICY "rsc_delete_family_device" ON public.routine_step_completions
  FOR DELETE
  USING (
    task_id IN (SELECT t.id FROM public.tasks t WHERE util.is_family_shadow_of(t.family_id))
  );

-- intention_iterations (personal Best Intentions tally)
DROP POLICY IF EXISTS "ii_insert_family_device" ON public.intention_iterations;
CREATE POLICY "ii_insert_family_device" ON public.intention_iterations
  FOR INSERT
  WITH CHECK (
    intention_id IN (
      SELECT bi.id FROM public.best_intentions bi
      WHERE util.is_family_shadow_of(bi.family_id)
    )
  );

-- family_intention_iterations (Family Hub tally taps — THE family-device surface)
DROP POLICY IF EXISTS "fii_insert_family_device" ON public.family_intention_iterations;
CREATE POLICY "fii_insert_family_device" ON public.family_intention_iterations
  FOR INSERT
  WITH CHECK (
    util.is_family_shadow_of(family_id)
    AND member_id IN (
      SELECT m.id FROM public.family_members m
      WHERE util.is_family_shadow_of(m.family_id)
    )
  );

-- lists + list_items (kid dip-in on the family tablet checking list items;
-- also restores READ, since lists_owner_or_parent never matched the shadow)
DROP POLICY IF EXISTS "lists_family_device" ON public.lists;
CREATE POLICY "lists_family_device" ON public.lists
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

DROP POLICY IF EXISTS "li_family_device" ON public.list_items;
CREATE POLICY "li_family_device" ON public.list_items
  FOR ALL
  USING (
    list_id IN (SELECT l.id FROM public.lists l WHERE util.is_family_shadow_of(l.family_id))
  )
  WITH CHECK (
    list_id IN (SELECT l.id FROM public.lists l WHERE util.is_family_shadow_of(l.family_id))
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 7. Verification
-- ────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_tasks INTEGER;
  v_ta INTEGER;
  v_tc INTEGER;
  v_key INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tasks FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks';
  SELECT COUNT(*) INTO v_ta FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_assignments';
  SELECT COUNT(*) INTO v_tc FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_completions';
  SELECT COUNT(*) INTO v_key FROM public.feature_key_registry WHERE feature_key = 'task_assignment';
  RAISE NOTICE '[100262] tasks policies: % (expected 5: select_family + insert/update/delete_scoped + update_assigned_member)', v_tasks;
  RAISE NOTICE '[100262] task_assignments policies: % (expected 4)', v_ta;
  RAISE NOTICE '[100262] task_completions policies: % (expected 7: select + 3 from 100119 + 3 family_device)', v_tc;
  RAISE NOTICE '[100262] task_assignment feature key rows: % (expected 1)', v_key;
END
$$;

COMMIT;
