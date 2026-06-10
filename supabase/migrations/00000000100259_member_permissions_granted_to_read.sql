-- ============================================================================
-- 00000000100259_member_permissions_granted_to_read.sql
-- ============================================================================
-- Role-Scoping Leak Pass follow-on fix (2026-06-09), caught by Playwright
-- spec tests/e2e/permissions/role-scoping-leak-pass.spec.ts.
--
-- The mp_select policy allowed a member to read member_permissions rows where
-- they are the TARGET or the GRANTER — but NOT rows where they are the
-- GRANTED-TO party. An additional_adult therefore could not load the grants
-- mom gave them: useViewableMembers and usePermission both query
-- `granted_to = <my member id>`, RLS returned zero rows, and the granted
-- path silently behaved as "no grants" (dad saw only himself even after mom
-- granted kids in Permission Hub; parent_child/mentor meeting gates denied).
--
-- Fix: add the granted_to predicate to mp_select. Mom's family-wide read and
-- the existing target/granter paths are unchanged.
-- Idempotent: DROP POLICY IF EXISTS + CREATE.
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS "mp_select" ON public.member_permissions;

CREATE POLICY "mp_select" ON public.member_permissions
  FOR SELECT USING (
    -- Mom: all rows in her family
    family_id IN (
      SELECT families.id FROM public.families
      WHERE families.primary_parent_id = auth.uid()
    )
    OR
    -- Rows about me (I am the target)
    target_member_id IN (
      SELECT family_members.id FROM public.family_members
      WHERE family_members.user_id = auth.uid()
    )
    OR
    -- Rows I granted
    granting_member_id IN (
      SELECT family_members.id FROM public.family_members
      WHERE family_members.user_id = auth.uid()
    )
    OR
    -- Rows granted TO me (the missing path — dad reading his own grants)
    granted_to IN (
      SELECT family_members.id FROM public.family_members
      WHERE family_members.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "mp_select" ON public.member_permissions IS
  'Permission grants read access. Mom reads family-wide; members read rows where they are target, granter, or grantee. granted_to path added 2026-06-09 (leak pass) — without it additional_adults could not load their own grants.';

DO $$
DECLARE v_n INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_n FROM pg_policies
    WHERE schemaname='public' AND tablename='member_permissions' AND policyname='mp_select';
  RAISE NOTICE '[100259] mp_select present: % (expected 1)', v_n;
END $$;

COMMIT;
