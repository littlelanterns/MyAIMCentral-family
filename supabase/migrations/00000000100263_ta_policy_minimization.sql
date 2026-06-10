-- ============================================================================
-- 00000000100263_ta_policy_minimization.sql
-- ============================================================================
-- Corrective follow-up to 100262 (same build: RR-DEPLOY-SCOPING).
--
-- Discovery during 100262 verification: migration 100152 had ALREADY split
-- task_assignments into scoped policies (ta_select / ta_insert / ta_update /
-- ta_delete) using auth_is_admin_of() — which 100153 narrowed to primary
-- parent only. That set already enforces: mom assigns anyone; non-admins
-- self-only; ta_delete deliberately admin-only ("prevents children from
-- removing themselves or siblings from tasks their parents assigned").
--
-- 100262's four ta_*_scoped policies were therefore redundant — and
-- ta_delete_scoped LOOSENED the 100152 rule by letting members delete their
-- own assignment rows. This migration drops all four and replaces them with
-- the two genuinely-new additive paths:
--
--   1. ta_insert_granted — additional_adult with a task_assignment grant
--      (util.task_assign_allowed, migration 100262) can create assignment
--      rows for granted kids.
--   2. ta_family_device — family-shadow sessions (Convention #273) get
--      family-scoped access, restoring pre-two-door hub-device behavior.
--
-- Idempotent.
-- ============================================================================

BEGIN;

-- Drop 100262's redundant/loosening set
DROP POLICY IF EXISTS "ta_select_family" ON public.task_assignments;
DROP POLICY IF EXISTS "ta_write_scoped" ON public.task_assignments;
DROP POLICY IF EXISTS "ta_update_scoped" ON public.task_assignments;
DROP POLICY IF EXISTS "ta_delete_scoped" ON public.task_assignments;

-- Additive: granted additional_adult INSERT for granted kids
DROP POLICY IF EXISTS "ta_insert_granted" ON public.task_assignments;
CREATE POLICY "ta_insert_granted" ON public.task_assignments
  FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT t.id FROM public.tasks t
      WHERE t.family_id IN (
        SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    )
    AND util.task_assign_allowed(COALESCE(member_id, family_member_id))
  );

COMMENT ON POLICY "ta_insert_granted" ON public.task_assignments IS
  'RR-DEPLOY-SCOPING: additional_adult with a task_assignment grant (per-kid or family-wide, per-kid wins) can create assignment rows for granted kids. Complements 100152''s ta_insert (mom: anyone; non-admins: self-only).';

-- Additive: family-device sessions (role='family' shadow) — family-scoped.
DROP POLICY IF EXISTS "ta_family_device" ON public.task_assignments;
CREATE POLICY "ta_family_device" ON public.task_assignments
  FOR ALL
  USING (
    task_id IN (SELECT t.id FROM public.tasks t WHERE util.is_family_shadow_of(t.family_id))
  )
  WITH CHECK (
    task_id IN (SELECT t.id FROM public.tasks t WHERE util.is_family_shadow_of(t.family_id))
  );

COMMENT ON POLICY "ta_family_device" ON public.task_assignments IS
  'Family-device restoration (RR-DEPLOY-SCOPING): pre-two-door hub devices rested on mom''s session. App layer enforces effective member identity.';

-- Verification
DO $$
DECLARE
  v_ta INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_ta FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_assignments';
  RAISE NOTICE '[100263] task_assignments policies: % (expected 6: ta_select/insert/update/delete from 100152 + ta_insert_granted + ta_family_device)', v_ta;
END
$$;

COMMIT;
