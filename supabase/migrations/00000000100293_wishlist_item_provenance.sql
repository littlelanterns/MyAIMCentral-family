-- ============================================================================
-- 00000000100293_wishlist_item_provenance.sql
-- ============================================================================
-- PRD-43 WishLists Phase A follow-up: `list_items.source_list_item_id`.
--
-- A mom's "Considering" copy in a gift_ideas list (PRD §6.4) is itself a
-- list_items row — it needs to point back at the original wishlist item it
-- was copied from ("From R's wishlist · added by R · Mar 4", "view current").
-- Self-referential nullable FK, general-purpose (also usable by any future
-- copy-with-provenance pattern, not wishlist-specific by name).
-- ============================================================================

BEGIN;

ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS source_list_item_id UUID REFERENCES public.list_items(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.list_items.source_list_item_id IS
  'Self-referential provenance FK. PRD-43: a gift_ideas "Considering" copy points back at the wishlist item it was copied from. NULL for items with no source (the common case).';

CREATE INDEX IF NOT EXISTS idx_list_items_source_list_item_id ON public.list_items (source_list_item_id) WHERE source_list_item_id IS NOT NULL;

COMMIT;
