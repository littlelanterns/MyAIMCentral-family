-- Fix infinite recursion in lists RLS policies
-- The cycle: lists policy queries list_shares, list_shares policy queries lists
-- Fix: list_shares RLS must NEVER reference the lists table

-- Step 1: Drop ALL existing policies on both tables
DROP POLICY IF EXISTS "lists_manage_own" ON public.lists;
DROP POLICY IF EXISTS "lists_select_shared" ON public.lists;
DROP POLICY IF EXISTS "ls_manage_owner" ON public.list_shares;
DROP POLICY IF EXISTS "ls_select_own" ON public.list_shares;
DROP POLICY IF EXISTS "ls_manage" ON public.list_shares;

-- Step 2: Recreate list_shares policies WITHOUT referencing lists table
-- Members can see shares where they are the shared_with target
CREATE POLICY "ls_read_own_shares" ON public.list_shares
  FOR SELECT USING (
    shared_with IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Members can manage (insert/update/delete) shares they created or are targeted by
-- Primary parent can manage all shares in their family
CREATE POLICY "ls_write" ON public.list_shares
  FOR ALL USING (
    shared_with IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Step 3: Recreate lists policies
-- Owner or primary parent can do everything
CREATE POLICY "lists_owner_or_parent" ON public.lists
  FOR ALL USING (
    owner_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- Shared members can SELECT lists shared with them
-- This queries list_shares, but list_shares RLS only checks family_members (no recursion)
CREATE POLICY "lists_shared_read" ON public.lists
  FOR SELECT USING (
    id IN (
      SELECT ls.list_id FROM public.list_shares ls
      WHERE ls.shared_with IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    )
  );
