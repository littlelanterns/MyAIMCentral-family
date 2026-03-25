-- Add best_intentions asset rows using guiding_stars variant B image (girl with stars)
-- This gives BestIntentions its own feature_key for sidebar + page header lookups

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'best_intentions', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_guiding_stars_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_guiding_stars_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_guiding_stars_B.png',
  'Best intentions and personal goals', '["intentions","goals","purpose","growth"]'::jsonb, NULL, 'active'
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'best_intentions' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'best_intentions', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_guiding_stars_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_guiding_stars_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_guiding_stars_C.png',
  'Best intentions and personal goals', '["intentions","goals","purpose","growth"]'::jsonb, NULL, 'active'
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'best_intentions' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'best_intentions', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_guiding_stars_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_guiding_stars_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_guiding_stars_A.png',
  'Best intentions and personal goals', '["intentions","goals","purpose","growth"]'::jsonb, NULL, 'active'
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'best_intentions' AND variant = 'C' AND category = 'app_icon');
