-- ============================================================
-- archive_context_items: Privacy filter defense-in-depth (RLS)
-- ============================================================
-- Convention #76 (CLAUDE.md): is_privacy_filtered = true items are NEVER
-- included in non-mom context regardless of any toggle state.
-- RECON Decision 7: Database-level enforcement in addition to Edge Function
-- filtering — even if a future query forgets the filter, the database
-- enforces the boundary.
--
-- Policy semantics:
--   Mom (primary_parent) sees all rows.
--   All other roles see only rows where is_privacy_filtered = false.
--
-- RESTRICTIVE clause: this policy is AND'd with the existing PERMISSIVE
-- policies (aci_select_own_family, aci_manage_primary_parent), narrowing
-- visibility for non-mom roles without affecting mom's existing access.
-- A PERMISSIVE policy here would be a no-op because aci_select_own_family
-- already grants ALL family members SELECT on every row.
--
-- Reuses public.is_primary_parent_of(p_family_id) helper from
-- migration 00000000100100_prd15_fix_rls_recursion.sql (STABLE,
-- SECURITY DEFINER, search_path locked).
-- ============================================================

DO $$ BEGIN
  CREATE POLICY "archive_context_items_privacy_filter_role_asymmetric"
    ON public.archive_context_items
    AS RESTRICTIVE
    FOR SELECT
    USING (
      is_privacy_filtered = false
      OR public.is_primary_parent_of(family_id)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON POLICY "archive_context_items_privacy_filter_role_asymmetric"
  ON public.archive_context_items
  IS 'Convention #76 + RECON Decision 7. Defense-in-depth role-asymmetric privacy filter. Mom sees all rows; non-mom roles see only is_privacy_filtered=false rows. RESTRICTIVE — narrows visibility on top of existing PERMISSIVE policies.';
