-- ============================================================================
-- Migration: 00000000100141_opportunity_list_items_rls.sql
-- Purpose:   Allow family members to READ items from opportunity-flagged lists
--            in their own family. Without this, kids can see the list header
--            (via 100140 policy) but get 0 items back from the list_items query.
-- ============================================================================

-- Idempotent: drop if exists first
DROP POLICY IF EXISTS "li_opportunity_family_read" ON public.list_items;

CREATE POLICY "li_opportunity_family_read" ON public.list_items
  FOR SELECT USING (
    list_id IN (
      SELECT id FROM public.lists
      WHERE is_opportunity = true
        AND family_id IN (
          SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
        )
    )
  );
