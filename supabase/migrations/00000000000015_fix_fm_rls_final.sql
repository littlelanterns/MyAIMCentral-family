-- Final fix for family_members RLS infinite recursion.
-- Drop ALL existing SELECT policies and replace with non-recursive ones.

-- Drop all SELECT policies (any name pattern)
DROP POLICY IF EXISTS "fm_select_own_family" ON public.family_members;
DROP POLICY IF EXISTS "fm_select_own_row" ON public.family_members;
DROP POLICY IF EXISTS "fm_select_family_via_parent" ON public.family_members;
DROP POLICY IF EXISTS "fm_select_same_family" ON public.family_members;

-- The SECURITY DEFINER function from migration 14 already exists.
-- It bypasses RLS on family_members to get the caller's family_id.
-- We only need ONE select policy that uses it.

CREATE POLICY "fm_select" ON public.family_members
  FOR SELECT USING (
    -- You can always see your own row
    user_id = auth.uid()
    -- You can see members in your family (via SECURITY DEFINER function, no recursion)
    OR family_id = public.get_my_family_id()
  );
