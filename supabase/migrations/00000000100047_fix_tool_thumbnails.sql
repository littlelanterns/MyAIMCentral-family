-- Fix tool thumbnails: better image matches for Help Me Say Something, Navigate, and Gratitude

-- Help Me Say Something → cyrano_higgins C (ear + mouth + speech bubbles)
UPDATE public.vault_items SET thumbnail_url = (
  SELECT size_512_url FROM public.platform_assets
  WHERE feature_key = 'cyrano_higgins' AND variant = 'C' AND category = 'vault_thumbnail'
  LIMIT 1
) WHERE guided_mode_key = 'higgins_say';

-- Help Me Navigate This → decision_guide B (compass rose)
UPDATE public.vault_items SET thumbnail_url = (
  SELECT size_512_url FROM public.platform_assets
  WHERE feature_key = 'decision_guide' AND variant = 'B' AND category = 'vault_thumbnail'
  LIMIT 1
) WHERE guided_mode_key = 'higgins_navigate';

-- Gratitude → love_languages_words C (cork board with pinned notes)
UPDATE public.vault_items SET thumbnail_url = (
  SELECT size_512_url FROM public.platform_assets
  WHERE feature_key = 'love_languages_words' AND variant = 'C' AND category = 'vault_thumbnail'
  LIMIT 1
) WHERE guided_mode_key = 'gratitude';
