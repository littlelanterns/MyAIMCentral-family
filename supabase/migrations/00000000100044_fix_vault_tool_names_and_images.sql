-- ============================================================================
-- Fix vault item names and add thumbnail images for PRD-21 tools
-- Display names per PRD-21 spec. Images from platform_assets seed data.
-- ============================================================================

-- Cyrano — display_title per PRD: "Cyrano"
UPDATE public.vault_items SET
  display_title = 'Cyrano',
  detail_title = 'Cyrano — Spouse Message Crafting',
  thumbnail_url = (
    SELECT size_512_url FROM public.platform_assets
    WHERE feature_key = 'cyrano_higgins' AND variant = 'A' AND category = 'vault_thumbnail'
    LIMIT 1
  )
WHERE guided_mode_key = 'cyrano';

-- Higgins Say — display_title per PRD: "Help Me Say Something"
UPDATE public.vault_items SET
  display_title = 'Help Me Say Something',
  detail_title = 'Higgins — Help Me Say Something',
  thumbnail_url = (
    SELECT size_512_url FROM public.platform_assets
    WHERE feature_key = 'cyrano_higgins' AND variant = 'B' AND category = 'vault_thumbnail'
    LIMIT 1
  )
WHERE guided_mode_key = 'higgins_say';

-- Higgins Navigate — display_title per PRD: "Help Me Navigate This"
UPDATE public.vault_items SET
  display_title = 'Help Me Navigate This',
  detail_title = 'Higgins — Help Me Navigate This',
  thumbnail_url = (
    SELECT size_512_url FROM public.platform_assets
    WHERE feature_key = 'cyrano_higgins' AND variant = 'C' AND category = 'vault_thumbnail'
    LIMIT 1
  )
WHERE guided_mode_key = 'higgins_navigate';

-- Quality Time — display_title per PRD: "Quality Time"
UPDATE public.vault_items SET
  display_title = 'Quality Time',
  detail_title = 'Quality Time — Meaningful Activity Planner',
  thumbnail_url = (
    SELECT size_512_url FROM public.platform_assets
    WHERE feature_key = 'love_languages_time' AND variant = 'A' AND category = 'vault_thumbnail'
    LIMIT 1
  )
WHERE guided_mode_key = 'quality_time';

-- Gifts — display_title per PRD: "Gifts"
UPDATE public.vault_items SET
  display_title = 'Gifts',
  detail_title = 'Gifts — Personalized Gift Finder',
  thumbnail_url = (
    SELECT size_512_url FROM public.platform_assets
    WHERE feature_key = 'love_languages_gifts' AND variant = 'A' AND category = 'vault_thumbnail'
    LIMIT 1
  )
WHERE guided_mode_key = 'gifts';

-- Observe & Serve — display_title per PRD: "Observe & Serve"
UPDATE public.vault_items SET
  display_title = 'Observe & Serve',
  detail_title = 'Observe & Serve — Hidden Need Detector',
  thumbnail_url = (
    SELECT size_512_url FROM public.platform_assets
    WHERE feature_key = 'love_languages_service' AND variant = 'A' AND category = 'vault_thumbnail'
    LIMIT 1
  )
WHERE guided_mode_key = 'observe_serve';

-- Words of Affirmation — display_title per PRD: "Words of Affirmation"
UPDATE public.vault_items SET
  display_title = 'Words of Affirmation',
  detail_title = 'Words of Affirmation — Specific Encouragement Crafter',
  thumbnail_url = (
    SELECT size_512_url FROM public.platform_assets
    WHERE feature_key = 'love_languages_words' AND variant = 'A' AND category = 'vault_thumbnail'
    LIMIT 1
  )
WHERE guided_mode_key = 'words_affirmation';

-- Gratitude — display_title per PRD: "Gratitude"
-- No dedicated platform_asset for gratitude; use love_languages_words variant B as fallback
UPDATE public.vault_items SET
  display_title = 'Gratitude',
  detail_title = 'Gratitude — Deepen Your Thankfulness',
  thumbnail_url = (
    SELECT size_512_url FROM public.platform_assets
    WHERE feature_key = 'love_languages_words' AND variant = 'B' AND category = 'vault_thumbnail'
    LIMIT 1
  )
WHERE guided_mode_key = 'gratitude';
