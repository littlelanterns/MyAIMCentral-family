-- Migration: 00000000100142_reveal_animations_library.sql
-- Purpose: Universal reveal animation library — platform-level video clips
--          that can be attached to any completable item as a celebration moment.
--          Includes the 2 existing gamification theme reveals plus 29 new videos.
--
-- Architecture: This is the "wrapping paper" library. A separate reward_reveals
--   table (future migration) will handle attaching these to tasks, widgets, lists, etc.
--   with prize content (text, image, randomizer pull, celebration-only).
--
-- Also includes: reveal_type = 'css' for non-video reveals (spinner, card_flip,
--   door_open) that are rendered via CSS/JS animations, not video files.

BEGIN;

-- ============================================================================
-- 1. reveal_animations — platform-level library of reveal clips & effects
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reveal_animations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  description     TEXT,
  -- Category for browsing: paper_craft, minecraft, anime, pokemon, steampunk,
  -- unicorn, candy, dnd, retro, pink_purple, css_effect
  style_category  TEXT NOT NULL,
  -- 'video' = mp4 in Storage, 'css' = rendered by a named component
  reveal_type     TEXT NOT NULL DEFAULT 'video'
                    CHECK (reveal_type IN ('video', 'css')),
  -- For video reveals: full public URL to the mp4
  video_url       TEXT,
  -- For CSS reveals: component key the frontend uses to render
  css_component   TEXT,
  -- Thumbnail for the picker UI (NULL until generated)
  thumbnail_url   TEXT,
  -- Video duration in seconds (NULL for CSS reveals)
  duration_seconds NUMERIC(5,1),
  -- Ordering within style_category
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reveal_animations ENABLE ROW LEVEL SECURITY;

-- Everyone can browse the library
DROP POLICY IF EXISTS "reveal_animations_select_authenticated" ON public.reveal_animations;
CREATE POLICY "reveal_animations_select_authenticated"
  ON public.reveal_animations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_reveal_animations_active
  ON public.reveal_animations(is_active, style_category, sort_order);

COMMENT ON TABLE public.reveal_animations IS
  'Platform-level library of reveal animations (video clips + CSS effects). Universal building blocks for reward reveals on any completable item.';

-- ============================================================================
-- 2. Seed data — 29 uploaded videos + 2 existing gamification reveals + 4 CSS effects
-- ============================================================================

INSERT INTO public.reveal_animations
  (slug, display_name, description, style_category, reveal_type, video_url, css_component, duration_seconds, sort_order)
VALUES
  -- ── Paper Craft style (matches the Woodland Felt gamification theme) ──
  ('paper_craft_gift_box', 'Paper Craft Gift Box', 'A handmade paper gift box unfolds to reveal what''s inside', 'paper_craft', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/paper_craft_gift_box_animation.mp4',
    NULL, 8.0, 1),
  ('paper_craft_treasure_chest', 'Paper Craft Treasure Chest', 'A paper treasure chest opens with a warm glow', 'paper_craft', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/paper_craft_treasure_chest_opens.mp4',
    NULL, 8.0, 2),
  ('paper_envelope', 'Paper Envelope', 'A paper envelope opens to reveal a card inside', 'paper_craft', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/paper_envelope_animation_rendered.mp4',
    NULL, 8.0, 3),
  ('paper_gift_box_alt', 'Paper Gift Box (Alt)', 'Alternative paper gift box with a different opening animation', 'paper_craft', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/paper_gift_box_animation_generated.mp4',
    NULL, 8.0, 4),
  ('paper_chest_short', 'Paper Chest (Short)', 'Quick paper chest opening — 5 seconds', 'paper_craft', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/paper_chest_reveal_short.mp4',
    NULL, 5.0, 5),
  ('paper_box_short', 'Paper Box (Short)', 'Quick paper box opening — 5 seconds', 'paper_craft', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/paperboxshort.mp4',
    NULL, 5.0, 6),
  ('paper_chest_red', 'Red Paper Chest', 'A red-toned paper treasure chest', 'paper_craft', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/paperchestred.mp4',
    NULL, 8.0, 7),

  -- ── Kling-generated paper craft variants ──
  ('kling_paper_a', 'Paper Reveal A', 'Realistic paper craft reveal — style A', 'paper_craft', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/kling_20260411__close_up_s_1386_0.mp4',
    NULL, 5.0, 8),
  ('kling_paper_b', 'Paper Reveal B', 'Realistic paper craft reveal — style B', 'paper_craft', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/kling_20260411__close_up_s_1388_0.mp4',
    NULL, 5.0, 9),
  ('kling_paper_c', 'Paper Reveal C', 'Realistic paper craft reveal — style C', 'paper_craft', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/kling_20260411__close_up_s_1390_0.mp4',
    NULL, 7.0, 10),
  ('kling_paper_d', 'Paper Reveal D', 'Realistic paper craft reveal — style D', 'paper_craft', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/kling_20260411__close_up_s_1392_0.mp4',
    NULL, 7.0, 11),

  -- ── Minecraft style ──
  ('minecraft_chest', 'Minecraft Chest', 'Pixelated chest opens with items spilling out', 'minecraft', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/minecraft_chest.mp4',
    NULL, 10.0, 1),
  ('minecraft_book', 'Minecraft Book', 'Enchanted book opens with a magical glow', 'minecraft', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/minecraft_book_reveal.mp4',
    NULL, 10.0, 2),

  -- ── Anime style ──
  ('anime_chest', 'Anime Chest', 'Anime-styled treasure chest with dramatic lighting', 'anime', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/anime_chest.mp4',
    NULL, 10.0, 1),
  ('anime_envelope', 'Anime Envelope', 'Anime-styled envelope with sparkle effects', 'anime', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/anime_envelope.mp4',
    NULL, 10.0, 2),

  -- ── Pokémon style ──
  ('poke_chest', 'Poké Chest', 'Pokémon-themed treasure chest reveal', 'pokemon', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/poke_chest.mp4',
    NULL, 10.0, 1),
  ('pokeball_reveal', 'Poké Ball', 'A Poké Ball opens with a flash of light', 'pokemon', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/pokeball_reveal.mp4',
    NULL, 10.0, 2),

  -- ── Unicorn / Magical style ──
  ('unicorn_chest', 'Unicorn Chest', 'Rainbow-sparkle treasure chest with unicorn magic', 'unicorn', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/unicorn_chest.mp4',
    NULL, 10.0, 1),
  ('unicorn_envelope', 'Unicorn Envelope', 'Magical envelope with rainbow sparkles', 'unicorn', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/unicorn_envelope.mp4',
    NULL, 10.0, 2),

  -- ── Candy / Sweet style ──
  ('candy_chest', 'Candy Chest', 'Sweet candy-colored treasure chest', 'candy', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/candy_chest.mp4',
    NULL, 10.0, 1),
  ('candygram', 'Candygram', 'Candy-themed letter delivery reveal', 'candy', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/candygram.mp4',
    NULL, 10.0, 2),

  -- ── D&D / Fantasy style ──
  ('dnd_chest', 'D&D Chest', 'Fantasy dungeon chest with golden light', 'dnd', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/dnd_chest.mp4',
    NULL, 10.0, 1),
  ('dnd_dark_chest', 'D&D Dark Chest', 'Dark fantasy chest with mysterious glow', 'dnd', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/dnd_dark_chest.mp4',
    NULL, 10.0, 2),

  -- ── Steampunk style ──
  ('steampunk_cylinder', 'Steampunk Cylinder', 'Brass cylinder mechanism reveals with steam and gears', 'steampunk', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/steampunk_cylinder_reveal.mp4',
    NULL, 10.0, 1),
  ('steampunk_chest', 'Steampunk Chest', 'Brass and leather chest with gear mechanisms', 'steampunk', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/steamunk_chest.mp4',
    NULL, 10.0, 2),

  -- ── Retro / 8-Bit style ──
  ('8bit_chest', '8-Bit Chest', 'Pixel-art treasure chest with retro sound vibe', 'retro', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/8bit_chest.mp4',
    NULL, 10.0, 1),

  -- ── Pink / Purple (girly) style ──
  ('pink_chest', 'Pink Chest', 'Sparkly pink treasure chest', 'pink_purple', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/pink_chest_reveal.mp4',
    NULL, 10.0, 1),
  ('purple_chest', 'Purple Chest', 'Glowing purple treasure chest', 'pink_purple', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/purple_chest_reveal.mp4',
    NULL, 10.0, 2),

  -- ── Ice Cream reward reveals ──
  ('ice_cream_envelope', 'Ice Cream Envelope', 'Envelope opens to reveal an ice cream reward', 'ice_cream', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/ice_cream_envelope_reveal.mp4',
    NULL, 10.0, 1),
  ('ice_cream_treasure_chest', 'Ice Cream Treasure Chest', 'Treasure chest opens to reveal an ice cream reward', 'ice_cream', 'video',
    'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/reveals/ice_cream_treasure_chest_reveal.mp4',
    NULL, 10.0, 2),

  -- ── CSS-based reveals (no video file — rendered by frontend components) ──
  ('spinner', 'Spinner', 'Randomizer wheel spins and lands on the prize', 'css_effect', 'css',
    NULL, 'RandomizerSpinner', NULL, 1),
  ('card_flip', 'Card Flip', 'A mystery card flips over to reveal what''s on the other side', 'css_effect', 'css',
    NULL, 'CardFlipReveal', NULL, 2),
  ('door_open', 'Door Open', 'A door swings open to reveal the prize behind it', 'css_effect', 'css',
    NULL, 'DoorOpenReveal', NULL, 3)

ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 3. Verification
-- ============================================================================

DO $$
DECLARE
  v_total INTEGER;
  v_video INTEGER;
  v_css   INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.reveal_animations;
  SELECT COUNT(*) INTO v_video FROM public.reveal_animations WHERE reveal_type = 'video';
  SELECT COUNT(*) INTO v_css   FROM public.reveal_animations WHERE reveal_type = 'css';

  RAISE NOTICE 'reveal_animations total: % (% video, % css)', v_total, v_video, v_css;
END;
$$;

COMMIT;
