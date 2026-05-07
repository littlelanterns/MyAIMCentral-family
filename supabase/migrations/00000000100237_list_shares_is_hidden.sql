-- Add `is_hidden` to `list_shares` to support the soft-hide affordance on
-- shared lists ("hide from my view" without breaking the share).
--
-- The frontend (useLists, useShoppingMode, useHideSharedList, useUnhideSharedList,
-- useHiddenSharedLists) already references this column, but no migration ever
-- created it — every query against `list_shares.is_hidden` was returning a 400
-- because the column doesn't exist. Discovered while debugging the Study Guides
-- page glitch that was producing those 400s in the background.
--
-- Idempotent — safe to re-run.

ALTER TABLE public.list_shares
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Lookup helper: filter shared-with-me lists by visibility quickly.
CREATE INDEX IF NOT EXISTS idx_list_shares_shared_with_visible
  ON public.list_shares (shared_with)
  WHERE is_hidden = false;

COMMENT ON COLUMN public.list_shares.is_hidden IS
  'When true, the shared-with member has hidden this list from their default views. The share itself is preserved; only display visibility changes. Mutated via useHideSharedList / useUnhideSharedList. Default views filter on `is_hidden = false OR is_hidden IS NULL` (the IS NULL leg is defensive — the NOT NULL DEFAULT means new rows always have a value).';
