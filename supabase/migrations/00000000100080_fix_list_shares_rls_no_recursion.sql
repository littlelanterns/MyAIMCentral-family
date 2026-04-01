-- Fix list_shares RLS again: migration 79 introduced recursion by referencing
-- the lists table from list_shares policy. The cycle:
--   lists policy → list_shares → lists (infinite recursion)
--
-- The correct fix: list_shares policies must NEVER reference the lists table.
-- Instead, allow any family member to manage shares for lists in their family.

-- Drop the broken policy from migration 79
DROP POLICY IF EXISTS "ls_write_owner_or_parent" ON public.list_shares;

-- Also drop the read-only policy from migration 26 (we'll replace with a single combined policy)
DROP POLICY IF EXISTS "ls_read_own_shares" ON public.list_shares;

-- Single policy: family members can manage shares within their family.
-- Uses family_members table only (no lists reference = no recursion).
CREATE POLICY "ls_family_access" ON public.list_shares
  FOR ALL USING (
    -- The shared_with member is in the same family as the current user
    shared_with IN (
      SELECT fm.id FROM public.family_members fm
      WHERE fm.family_id IN (
        SELECT fm2.family_id FROM public.family_members fm2
        WHERE fm2.user_id = auth.uid()
      )
    )
    -- OR the current user is the shared_with target (can read own shares)
    OR shared_with IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );
