-- ============================================================================
-- 00000000100153_auth_is_admin_of_primary_parent_only.sql
-- ============================================================================
--
-- Fix: tighten public.auth_is_admin_of() introduced by migration 100152.
-- The prior version treated additional_adult (Dad) as equivalent to
-- primary_parent (Mom), which is inconsistent with:
--   • CLAUDE.md: "Mom sees all within family. Other roles scoped per PRD-02."
--   • architecture.md: "Dad scoped: Additional adults see data based on
--     member_permissions grants."
--   • The existing tasks_manage_adults policy which treats Dad as admin
--     only for tasks he created or is assigned to.
--
-- Correct rule per founder: "Dad's access should only be according to
-- what permissions mom sets for him." Dad is NOT automatically admin —
-- his elevated access comes from explicit member_permissions grants
-- (PRD-02), not from his role.
--
-- This migration narrows auth_is_admin_of() to primary_parent only.
-- Consequences for the task_assignments RLS policies (100152):
--   • ta_insert admin path: only Mom can assign siblings to tasks.
--   • ta_update admin path: only Mom can update assignments she doesn't own.
--   • ta_delete: only Mom can delete assignment rows.
--
-- Dad falls through to non-admin rules: he can INSERT rows where he is
-- the assignee (self-add), UPDATE rows where he is the assignee, and
-- cannot DELETE any assignment. If he wants to add Junior to a task,
-- he creates the task himself (which makes him the creator, covered by
-- tasks_manage_adults), and self-assigns at creation time. Future work
-- per PRD-02 may honor specific member_permissions grants to widen
-- Dad's write access per feature.
--
-- Idempotent: CREATE OR REPLACE.
-- ============================================================================

BEGIN;

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
      AND role = 'primary_parent'
  )
$$;

COMMENT ON FUNCTION public.auth_is_admin_of(uuid) IS
  'True when the authenticated user is primary_parent in the given family. Dad / additional_adult is NOT automatically admin — his elevated access must be granted explicitly via member_permissions per PRD-02. SECURITY DEFINER so it is safely callable from RLS policies without re-triggering RLS on family_members.';

DO $$
DECLARE
  v_def TEXT;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'auth_is_admin_of';

  IF v_def IS NULL THEN
    RAISE EXCEPTION '[100153] auth_is_admin_of not defined after migration';
  END IF;
  IF v_def ~ 'additional_adult' THEN
    RAISE EXCEPTION '[100153] auth_is_admin_of still admits additional_adult';
  END IF;
  RAISE NOTICE '[100153] auth_is_admin_of narrowed to primary_parent only';
END
$$;

COMMIT;
