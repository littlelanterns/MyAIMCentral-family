-- Migration: 00000000100144_earned_prizes_and_reveal_naming.sql
-- Purpose:
--   1. earned_prizes table — Prize Box for earned but unredeemed rewards
--   2. Fix reveal_animations display_name values to avoid IP references

BEGIN;

-- ============================================================================
-- 1. earned_prizes — snapshot of earned rewards, redeemable by mom
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.earned_prizes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id      UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,

  -- Which reveal fired
  reward_reveal_id      UUID REFERENCES public.reward_reveals(id) ON DELETE SET NULL,
  attachment_id         UUID REFERENCES public.reward_reveal_attachments(id) ON DELETE SET NULL,

  -- What triggered it
  source_type           TEXT NOT NULL,
  source_id             UUID NOT NULL,

  -- Snapshot of the prize at earn time (prize content can change later)
  prize_type            TEXT NOT NULL
                          CHECK (prize_type IN ('text', 'image', 'platform_image', 'randomizer', 'celebration_only')),
  prize_text            TEXT,
  prize_name            TEXT,
  prize_image_url       TEXT,
  prize_asset_key       TEXT,
  animation_slug        TEXT,

  -- Lifecycle
  earned_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at           TIMESTAMPTZ,
  redeemed_by           UUID REFERENCES public.family_members(id) ON DELETE SET NULL,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.earned_prizes ENABLE ROW LEVEL SECURITY;

-- Family members can read own family
DROP POLICY IF EXISTS "earned_prizes_select" ON public.earned_prizes;
CREATE POLICY "earned_prizes_select"
  ON public.earned_prizes FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

-- Mom/dad can insert (system inserts via the reveal pipeline)
DROP POLICY IF EXISTS "earned_prizes_insert" ON public.earned_prizes;
CREATE POLICY "earned_prizes_insert"
  ON public.earned_prizes FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

-- Mom/dad can update (mark as redeemed)
DROP POLICY IF EXISTS "earned_prizes_update" ON public.earned_prizes;
CREATE POLICY "earned_prizes_update"
  ON public.earned_prizes FOR UPDATE
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role IN ('primary_parent', 'additional_adult')
    )
  );

CREATE INDEX IF NOT EXISTS idx_earned_prizes_member
  ON public.earned_prizes(family_member_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_earned_prizes_family
  ON public.earned_prizes(family_id);
CREATE INDEX IF NOT EXISTS idx_earned_prizes_unredeemed
  ON public.earned_prizes(family_member_id)
  WHERE redeemed_at IS NULL;

COMMENT ON TABLE public.earned_prizes IS
  'Prize Box — snapshot of rewards earned via reveal animations. Stays until mom marks redeemed. Kids see their unredeemed prizes; mom sees Mark Redeemed buttons.';


-- ============================================================================
-- 2. Fix reveal_animations display names — remove IP references
-- ============================================================================

-- Minecraft → Pixel Block
UPDATE public.reveal_animations SET display_name = 'Pixel Block Chest'
  WHERE slug = 'minecraft_chest' AND display_name = 'Minecraft Chest';
UPDATE public.reveal_animations SET display_name = 'Pixel Block Book'
  WHERE slug = 'minecraft_book' AND display_name = 'Minecraft Book';

-- Pokémon → Monster Catch
UPDATE public.reveal_animations SET display_name = 'Monster Catch Chest'
  WHERE slug = 'poke_chest' AND display_name = 'Poké Chest';
UPDATE public.reveal_animations SET display_name = 'Monster Ball'
  WHERE slug = 'pokeball_reveal' AND display_name = 'Poké Ball';

-- D&D → Fantasy Quest
UPDATE public.reveal_animations SET display_name = 'Fantasy Quest Chest'
  WHERE slug = 'dnd_chest' AND display_name = 'D&D Chest';
UPDATE public.reveal_animations SET display_name = 'Dark Fantasy Chest'
  WHERE slug = 'dnd_dark_chest' AND display_name = 'D&D Dark Chest';

-- Also fix descriptions that reference IPs
UPDATE public.reveal_animations SET description = 'Pixelated chest opens with items spilling out'
  WHERE slug = 'minecraft_chest';
UPDATE public.reveal_animations SET description = 'Enchanted pixel book opens with a magical glow'
  WHERE slug = 'minecraft_book';
UPDATE public.reveal_animations SET description = 'Monster-catch themed treasure chest reveal'
  WHERE slug = 'poke_chest';
UPDATE public.reveal_animations SET description = 'A capture ball opens with a flash of light'
  WHERE slug = 'pokeball_reveal';
UPDATE public.reveal_animations SET description = 'Fantasy dungeon chest with golden light'
  WHERE slug = 'dnd_chest';
UPDATE public.reveal_animations SET description = 'Dark fantasy chest with mysterious glow'
  WHERE slug = 'dnd_dark_chest';


-- ============================================================================
-- 3. Verification
-- ============================================================================

DO $$
DECLARE
  v_earned INTEGER;
  v_ip_refs INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_earned FROM public.earned_prizes;
  SELECT COUNT(*) INTO v_ip_refs FROM public.reveal_animations
    WHERE display_name ILIKE '%minecraft%'
       OR display_name ILIKE '%pok%'
       OR display_name ILIKE '%d&d%';

  RAISE NOTICE 'earned_prizes: % rows', v_earned;
  RAISE NOTICE 'IP reference display names remaining: % (should be 0)', v_ip_refs;
END;
$$;

COMMIT;
