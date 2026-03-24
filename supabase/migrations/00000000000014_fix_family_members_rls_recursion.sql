-- Fix infinite recursion in family_members RLS policy
-- The SELECT policy references family_members in its own WHERE clause,
-- causing infinite recursion. Fix: use auth.uid() directly on user_id,
-- or look up family_id via the families table (no self-reference).

-- Drop the recursive policy
DROP POLICY IF EXISTS "fm_select_own_family" ON public.family_members;

-- Recreate without self-reference:
-- 1. Members can see their own row (user_id match)
-- 2. Members can see other members in their family (via families table, not self-join)
CREATE POLICY "fm_select_own_row" ON public.family_members
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "fm_select_family_via_parent" ON public.family_members
  FOR SELECT USING (
    family_id IN (
      SELECT id FROM public.families WHERE primary_parent_id = auth.uid()
    )
  );

-- For non-primary-parent members to see their family members,
-- use a security definer function to avoid the recursion
CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM public.family_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE POLICY "fm_select_same_family" ON public.family_members
  FOR SELECT USING (
    family_id = public.get_my_family_id()
  );
