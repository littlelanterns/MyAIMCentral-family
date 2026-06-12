-- Migration: 00000000100272_asset_suggestion_misses.sql
-- Build: KIDS-REWARDS-PAGE — Slice 1 founder addition (2026-06-12)
--
-- Founder request: when an image search has no great match, show the closest
-- we have AND "have the system keep track of which items don't have images
-- so we can later add those."
--
-- This table is that ledger. The pickers log a row (fire-and-forget,
-- session-deduped client-side) whenever a search settles with zero results
-- or only weak semantic matches (top similarity below the good-match bar).
-- The founder reviews it to decide which images to commission next —
-- real demand data for the asset pipeline.

BEGIN;

CREATE TABLE IF NOT EXISTS public.asset_suggestion_misses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id       UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  search_term     TEXT NOT NULL,
  -- Which picker logged it: 'task_icon' | 'reward_image' | 'icon_browse'
  context         TEXT NOT NULL,
  -- Best similarity the library could offer (NULL = zero results at all)
  top_similarity  FLOAT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Review query support: "what are families searching for that we don't have?"
CREATE INDEX IF NOT EXISTS idx_asm_term ON public.asset_suggestion_misses (lower(search_term), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_asm_family ON public.asset_suggestion_misses (family_id, created_at DESC);

ALTER TABLE public.asset_suggestion_misses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS asm_insert_family ON public.asset_suggestion_misses;
CREATE POLICY asm_insert_family ON public.asset_suggestion_misses
  FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS asm_select_family ON public.asset_suggestion_misses;
CREATE POLICY asm_select_family ON public.asset_suggestion_misses
  FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.asset_suggestion_misses IS
  'KIDS-REWARDS-PAGE: image searches with no/weak library matches. The asset '
  'pipeline backlog — review to decide which images to add next.';

COMMIT;
