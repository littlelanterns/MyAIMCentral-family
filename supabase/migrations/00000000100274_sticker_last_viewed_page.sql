-- Migration: 00000000100274_sticker_last_viewed_page.sql
-- Build: KIDS-REWARDS-PAGE — Slice 3 (Creature pages + Coloring section + Dashboard Doors)
--
-- Founder gate R5 (KIDS-REWARDS-PAGE-Gate-Decisions §13): the creature page is a
-- horizontal SWIPE STRIP of unlocked backgrounds. `last_viewed_page_id` records
-- which background in the strip the member was last on, so returning to the page
-- (or the dashboard "door" widget miniature) restores that swipe position.
--
-- This is DELIBERATELY SEPARATE from `active_page_id`, whose semantics
-- (award-landing page for new creatures/page unlocks) are untouched (R5).
--
-- Note on dashboard doors: the two door widgets (sticker page + coloring page)
-- are modelled as INFO_DISPLAY widgets (view-only viewports — the founder's
-- "a window, not a toy" framing, gate Section 4). Info widgets are registered in
-- code via INFO_WIDGET_REGISTRY, NOT through `widget_starter_configs` rows (that
-- table seeds TRACKER types only). So no starter-config seed rows are added here
-- — the dispatch note's "widget_starter_configs seed rows" assumed the tracker
-- modelling; the info_display modelling is the better fit for a read-only door
-- and needs no DB seed. (Flagged for founder in the Slice 3 recon notes.)

BEGIN;

ALTER TABLE public.member_sticker_book_state
  ADD COLUMN IF NOT EXISTS last_viewed_page_id UUID
    REFERENCES public.gamification_sticker_pages(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.member_sticker_book_state.last_viewed_page_id IS
  'KIDS-REWARDS-PAGE Slice 3 (R5): which unlocked background the member last '
  'viewed in the creature swipe strip — restores swipe position on return. '
  'Separate from active_page_id (the award-landing page), which is untouched.';

COMMIT;
