-- Add in_progress_member_id to list_items for shared list claim semantics.
-- When a member starts working on a shared list item, they claim it.
-- Other members see the claim. Completing (checking) clears the claim.
ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS in_progress_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL;
