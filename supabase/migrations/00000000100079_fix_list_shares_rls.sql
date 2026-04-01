-- Fix list_shares RLS: list owner and primary parent must be able to
-- INSERT/DELETE shares, not just the shared_with target.
--
-- Current "ls_write" policy only allows the shared_with member to write,
-- which means mom (the sharer) can't actually create the share record.

-- Drop the broken write policy
DROP POLICY IF EXISTS "ls_write" ON public.list_shares;

-- Recreate: allow list owner OR primary parent to manage shares
CREATE POLICY "ls_write_owner_or_parent" ON public.list_shares
  FOR ALL USING (
    -- List owner can manage shares on their own lists
    list_id IN (
      SELECT l.id FROM public.lists l
      WHERE l.owner_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    )
    -- Primary parent can manage any shares in the family
    OR list_id IN (
      SELECT l.id FROM public.lists l
      WHERE l.family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    )
    -- Shared-with member can read their own share records
    OR shared_with IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );
