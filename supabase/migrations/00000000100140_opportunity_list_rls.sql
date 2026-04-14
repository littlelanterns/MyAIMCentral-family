-- ============================================================================
-- Migration: 00000000100140_opportunity_list_rls.sql
-- Purpose:   Allow family members to READ opportunity-flagged lists and their
--            items from their own family. Without this, only the list owner
--            and primary parent can see opportunity lists — kids can't browse.
-- ============================================================================

-- Family members can SELECT opportunity lists from their own family
-- (regardless of ownership). This is the "browse the opportunity board" policy.
CREATE POLICY "lists_opportunity_family_read" ON public.lists
  FOR SELECT USING (
    is_opportunity = true
    AND family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

-- Family members can SELECT items from opportunity lists in their own family.
-- Without this, kids can see the list header but get 0 items back.
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
