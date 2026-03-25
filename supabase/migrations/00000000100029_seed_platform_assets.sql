-- Seed platform_assets with 144 rows (90 app_icon + 54 vault_thumbnail)
-- Idempotent: uses ON CONFLICT on (feature_key, variant, category) check via WHERE NOT EXISTS

DO $$
BEGIN
  -- Only run if table is empty or missing these rows
  -- We use INSERT ... ON CONFLICT DO NOTHING pattern via a unique-ish check
  NULL;
END $$;

-- ============================================================
-- APP FEATURE ICONS (30 features x 3 variants = 90 rows)
-- ============================================================

-- 1. ai_vault
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'ai_vault', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_ai_vault_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_ai_vault_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_ai_vault_A.png',
  'AI Vault tool library', '["vault","ai","tools","library"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'ai_vault' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'ai_vault', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_ai_vault_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_ai_vault_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_ai_vault_B.png',
  'AI Vault tool library', '["vault","ai","tools","library"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'ai_vault' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'ai_vault', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_ai_vault_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_ai_vault_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_ai_vault_C.png',
  'AI Vault tool library', '["vault","ai","tools","library"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'ai_vault' AND variant = 'C' AND category = 'app_icon');

-- 2. archives
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'archives', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_archives_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_archives_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_archives_A.png',
  'Archives and memory storage', '["archives","memory","history","storage"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'archives' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'archives', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_archives_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_archives_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_archives_B.png',
  'Archives and memory storage', '["archives","memory","history","storage"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'archives' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'archives', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_archives_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_archives_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_archives_C.png',
  'Archives and memory storage', '["archives","memory","history","storage"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'archives' AND variant = 'C' AND category = 'app_icon');

-- 3. bigplans
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'bigplans', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_bigplans_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_bigplans_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_bigplans_A.png',
  'Big plans and long-term goals', '["plans","goals","future","vision"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'bigplans' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'bigplans', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_bigplans_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_bigplans_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_bigplans_B.png',
  'Big plans and long-term goals', '["plans","goals","future","vision"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'bigplans' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'bigplans', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_bigplans_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_bigplans_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_bigplans_C.png',
  'Big plans and long-term goals', '["plans","goals","future","vision"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'bigplans' AND variant = 'C' AND category = 'app_icon');

-- 4. bookshelf
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'bookshelf', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_bookshelf_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_bookshelf_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_bookshelf_A.png',
  'Bookshelf and reading list', '["books","reading","learning","library"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'bookshelf' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'bookshelf', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_bookshelf_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_bookshelf_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_bookshelf_B.png',
  'Bookshelf and reading list', '["books","reading","learning","library"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'bookshelf' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'bookshelf', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_bookshelf_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_bookshelf_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_bookshelf_C.png',
  'Bookshelf and reading list', '["books","reading","learning","library"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'bookshelf' AND variant = 'C' AND category = 'app_icon');

-- 5. calendar
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'calendar', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_calendar_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_calendar_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_calendar_A.png',
  'Calendar and scheduling', '["calendar","schedule","dates","time"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'calendar' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'calendar', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_calendar_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_calendar_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_calendar_B.png',
  'Calendar and scheduling', '["calendar","schedule","dates","time"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'calendar' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'calendar', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_calendar_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_calendar_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_calendar_C.png',
  'Calendar and scheduling', '["calendar","schedule","dates","time"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'calendar' AND variant = 'C' AND category = 'app_icon');

-- 6. command_center
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'command_center', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_command_center_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_command_center_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_command_center_A.png',
  'Central command and control hub', '["command","hub","control","center"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'command_center' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'command_center', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_command_center_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_command_center_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_command_center_B.png',
  'Central command and control hub', '["command","hub","control","center"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'command_center' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'command_center', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_command_center_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_command_center_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_command_center_C.png',
  'Central command and control hub', '["command","hub","control","center"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'command_center' AND variant = 'C' AND category = 'app_icon');

-- 7. dashboard
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'dashboard', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_dashboard_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_dashboard_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_dashboard_A.png',
  'Main dashboard overview', '["dashboard","home","overview","summary"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'dashboard' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'dashboard', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_dashboard_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_dashboard_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_dashboard_B.png',
  'Main dashboard overview', '["dashboard","home","overview","summary"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'dashboard' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'dashboard', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_dashboard_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_dashboard_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_dashboard_C.png',
  'Main dashboard overview', '["dashboard","home","overview","summary"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'dashboard' AND variant = 'C' AND category = 'app_icon');

-- 8. evening_review
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'evening_review', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_evening_review_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_evening_review_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_evening_review_A.png',
  'Evening review and wind-down', '["evening","review","reflection","end"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'evening_review' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'evening_review', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_evening_review_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_evening_review_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_evening_review_B.png',
  'Evening review and wind-down', '["evening","review","reflection","end"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'evening_review' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'evening_review', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_evening_review_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_evening_review_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_evening_review_C.png',
  'Evening review and wind-down', '["evening","review","reflection","end"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'evening_review' AND variant = 'C' AND category = 'app_icon');

-- 9. family_feeds
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'family_feeds', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_feeds_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_family_feeds_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_family_feeds_A.png',
  'Family feeds and memories', '["family","feeds","memories","moments"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'family_feeds' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'family_feeds', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_feeds_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_family_feeds_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_family_feeds_B.png',
  'Family feeds and memories', '["family","feeds","memories","moments"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'family_feeds' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'family_feeds', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_feeds_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_family_feeds_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_family_feeds_C.png',
  'Family feeds and memories', '["family","feeds","memories","moments"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'family_feeds' AND variant = 'C' AND category = 'app_icon');

-- 10. family_hub
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'family_hub', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_hub_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_family_hub_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_family_hub_A.png',
  'Shared family hub', '["family","hub","shared","together"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'family_hub' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'family_hub', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_hub_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_family_hub_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_family_hub_B.png',
  'Shared family hub', '["family","hub","shared","together"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'family_hub' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'family_hub', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_hub_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_family_hub_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_family_hub_C.png',
  'Shared family hub', '["family","hub","shared","together"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'family_hub' AND variant = 'C' AND category = 'app_icon');

-- 11. family_management
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'family_management', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_management_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_family_management_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_family_management_A.png',
  'Family management and organization', '["family","management","organize","household"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'family_management' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'family_management', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_management_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_family_management_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_family_management_B.png',
  'Family management and organization', '["family","management","organize","household"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'family_management' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'family_management', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_family_management_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_family_management_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_family_management_C.png',
  'Family management and organization', '["family","management","organize","household"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'family_management' AND variant = 'C' AND category = 'app_icon');

-- 12. guiding_stars
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'guiding_stars', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_guiding_stars_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_guiding_stars_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_guiding_stars_A.png',
  'Personal guiding stars and values', '["stars","values","north star","purpose"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'guiding_stars' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'guiding_stars', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_guiding_stars_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_guiding_stars_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_guiding_stars_B.png',
  'Personal guiding stars and values', '["stars","values","north star","purpose"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'guiding_stars' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'guiding_stars', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_guiding_stars_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_guiding_stars_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_guiding_stars_C.png',
  'Personal guiding stars and values', '["stars","values","north star","purpose"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'guiding_stars' AND variant = 'C' AND category = 'app_icon');

-- 13. journal
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'journal', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_journal_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_journal_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_journal_A.png',
  'Personal journal and reflections', '["journal","writing","reflection","diary"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'journal' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'journal', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_journal_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_journal_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_journal_B.png',
  'Personal journal and reflections', '["journal","writing","reflection","diary"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'journal' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'journal', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_journal_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_journal_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_journal_C.png',
  'Personal journal and reflections', '["journal","writing","reflection","diary"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'journal' AND variant = 'C' AND category = 'app_icon');

-- 14. lifelantern
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'lifelantern', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lifelantern_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_lifelantern_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_lifelantern_A.png',
  'LifeLantern personal mission', '["lantern","mission","light","purpose"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'lifelantern' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'lifelantern', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lifelantern_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_lifelantern_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_lifelantern_B.png',
  'LifeLantern personal mission', '["lantern","mission","light","purpose"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'lifelantern' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'lifelantern', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lifelantern_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_lifelantern_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_lifelantern_C.png',
  'LifeLantern personal mission', '["lantern","mission","light","purpose"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'lifelantern' AND variant = 'C' AND category = 'app_icon');

-- 15. lila_chat
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'lila_chat', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lila_chat_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_lila_chat_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_lila_chat_A.png',
  'LiLa AI assistant chat', '["lila","ai","chat","assistant"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'lila_chat' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'lila_chat', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lila_chat_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_lila_chat_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_lila_chat_B.png',
  'LiLa AI assistant chat', '["lila","ai","chat","assistant"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'lila_chat' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'lila_chat', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lila_chat_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_lila_chat_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_lila_chat_C.png',
  'LiLa AI assistant chat', '["lila","ai","chat","assistant"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'lila_chat' AND variant = 'C' AND category = 'app_icon');

-- 16. lists
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'lists', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lists_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_lists_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_lists_A.png',
  'Lists and quick capture', '["lists","capture","notes","quick"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'lists' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'lists', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lists_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_lists_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_lists_B.png',
  'Lists and quick capture', '["lists","capture","notes","quick"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'lists' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'lists', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_lists_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_lists_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_lists_C.png',
  'Lists and quick capture', '["lists","capture","notes","quick"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'lists' AND variant = 'C' AND category = 'app_icon');

-- 17. meetings
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'meetings', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_meetings_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_meetings_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_meetings_A.png',
  'Meetings and scheduled connections', '["meetings","schedule","connect","gather"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'meetings' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'meetings', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_meetings_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_meetings_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_meetings_B.png',
  'Meetings and scheduled connections', '["meetings","schedule","connect","gather"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'meetings' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'meetings', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_meetings_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_meetings_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_meetings_C.png',
  'Meetings and scheduled connections', '["meetings","schedule","connect","gather"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'meetings' AND variant = 'C' AND category = 'app_icon');

-- 18. messages
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'messages', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_messages_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_messages_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_messages_A.png',
  'Messages and communication', '["messages","communication","chat","connect"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'messages' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'messages', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_messages_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_messages_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_messages_B.png',
  'Messages and communication', '["messages","communication","chat","connect"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'messages' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'messages', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_messages_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_messages_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_messages_C.png',
  'Messages and communication', '["messages","communication","chat","connect"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'messages' AND variant = 'C' AND category = 'app_icon');

-- 19. mindsweep
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'mindsweep', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_mindsweep_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_mindsweep_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_mindsweep_A.png',
  'MindSweep brain dump and capture', '["mindsweep","brain dump","capture","clarity"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'mindsweep' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'mindsweep', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_mindsweep_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_mindsweep_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_mindsweep_B.png',
  'MindSweep brain dump and capture', '["mindsweep","brain dump","capture","clarity"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'mindsweep' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'mindsweep', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_mindsweep_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_mindsweep_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_mindsweep_C.png',
  'MindSweep brain dump and capture', '["mindsweep","brain dump","capture","clarity"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'mindsweep' AND variant = 'C' AND category = 'app_icon');

-- 20. morning_rhythm
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'morning_rhythm', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_morning_rhythm_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_morning_rhythm_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_morning_rhythm_A.png',
  'Morning routine and rhythm', '["morning","routine","rhythm","start"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'morning_rhythm' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'morning_rhythm', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_morning_rhythm_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_morning_rhythm_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_morning_rhythm_B.png',
  'Morning routine and rhythm', '["morning","routine","rhythm","start"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'morning_rhythm' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'morning_rhythm', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_morning_rhythm_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_morning_rhythm_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_morning_rhythm_C.png',
  'Morning routine and rhythm', '["morning","routine","rhythm","start"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'morning_rhythm' AND variant = 'C' AND category = 'app_icon');

-- 21. my_foundation (NOTE: manifest has swapped URLs — A points to _C file, C points to _A file)
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'my_foundation', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_my_foundation_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_my_foundation_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_my_foundation_C.png',
  'Personal foundation and core beliefs', '["foundation","core","beliefs","self"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'my_foundation' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'my_foundation', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_my_foundation_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_my_foundation_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_my_foundation_B.png',
  'Personal foundation and core beliefs', '["foundation","core","beliefs","self"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'my_foundation' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'my_foundation', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_my_foundation_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_my_foundation_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_my_foundation_A.png',
  'Personal foundation and core beliefs', '["foundation","core","beliefs","self"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'my_foundation' AND variant = 'C' AND category = 'app_icon');

-- 22. people_relationships
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'people_relationships', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_people_relationships_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_people_relationships_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_people_relationships_A.png',
  'People and relationships management', '["people","relationships","connections","family"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'people_relationships' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'people_relationships', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_people_relationships_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_people_relationships_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_people_relationships_B.png',
  'People and relationships management', '["people","relationships","connections","family"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'people_relationships' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'people_relationships', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_people_relationships_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_people_relationships_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_people_relationships_C.png',
  'People and relationships management', '["people","relationships","connections","family"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'people_relationships' AND variant = 'C' AND category = 'app_icon');

-- 23. safe_harbor
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'safe_harbor', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_safe_harbor_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_safe_harbor_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_safe_harbor_A.png',
  'Safe Harbor personal sanctuary', '["safe","harbor","sanctuary","peace"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'safe_harbor' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'safe_harbor', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_safe_harbor_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_safe_harbor_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_safe_harbor_B.png',
  'Safe Harbor personal sanctuary', '["safe","harbor","sanctuary","peace"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'safe_harbor' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'safe_harbor', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_safe_harbor_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_safe_harbor_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_safe_harbor_C.png',
  'Safe Harbor personal sanctuary', '["safe","harbor","sanctuary","peace"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'safe_harbor' AND variant = 'C' AND category = 'app_icon');

-- 24. settings
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'settings', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_settings_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_settings_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_settings_A.png',
  'Settings and preferences', '["settings","preferences","customize","configure"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'settings' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'settings', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_settings_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_settings_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_settings_B.png',
  'Settings and preferences', '["settings","preferences","customize","configure"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'settings' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'settings', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_settings_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_settings_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_settings_C.png',
  'Settings and preferences', '["settings","preferences","customize","configure"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'settings' AND variant = 'C' AND category = 'app_icon');

-- 25. studio
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'studio', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_studio_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_studio_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_studio_A.png',
  'Creative studio and templates', '["studio","creative","templates","design"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'studio' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'studio', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_studio_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_studio_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_studio_B.png',
  'Creative studio and templates', '["studio","creative","templates","design"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'studio' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'studio', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_studio_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_studio_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_studio_C.png',
  'Creative studio and templates', '["studio","creative","templates","design"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'studio' AND variant = 'C' AND category = 'app_icon');

-- 26. tasks
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'tasks', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_tasks_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_tasks_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_tasks_A.png',
  'Task management and to-dos', '["tasks","todo","checklist","action"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'tasks' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'tasks', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_tasks_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_tasks_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_tasks_B.png',
  'Task management and to-dos', '["tasks","todo","checklist","action"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'tasks' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'tasks', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_tasks_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_tasks_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_tasks_C.png',
  'Task management and to-dos', '["tasks","todo","checklist","action"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'tasks' AND variant = 'C' AND category = 'app_icon');

-- 27. thoughtsift
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'thoughtsift', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_thoughtsift_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_thoughtsift_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_thoughtsift_A.png',
  'ThoughtSift thinking tool', '["thoughtsift","thinking","clarity","process"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'thoughtsift' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'thoughtsift', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_thoughtsift_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_thoughtsift_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_thoughtsift_B.png',
  'ThoughtSift thinking tool', '["thoughtsift","thinking","clarity","process"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'thoughtsift' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'thoughtsift', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_thoughtsift_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_thoughtsift_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_thoughtsift_C.png',
  'ThoughtSift thinking tool', '["thoughtsift","thinking","clarity","process"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'thoughtsift' AND variant = 'C' AND category = 'app_icon');

-- 28. universal_timer
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'universal_timer', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_universal_timer_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_universal_timer_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_universal_timer_A.png',
  'Universal timer and time tools', '["timer","time","countdown","focus"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'universal_timer' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'universal_timer', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_universal_timer_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_universal_timer_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_universal_timer_B.png',
  'Universal timer and time tools', '["timer","time","countdown","focus"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'universal_timer' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'universal_timer', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_universal_timer_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_universal_timer_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_universal_timer_C.png',
  'Universal timer and time tools', '["timer","time","countdown","focus"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'universal_timer' AND variant = 'C' AND category = 'app_icon');

-- 29. victories
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'victories', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_victories_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_victories_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_victories_A.png',
  'Wins and victories log', '["victories","wins","celebration","achievement"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'victories' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'victories', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_victories_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_victories_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_victories_B.png',
  'Wins and victories log', '["victories","wins","celebration","achievement"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'victories' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'victories', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_victories_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_victories_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_victories_C.png',
  'Wins and victories log', '["victories","wins","celebration","achievement"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'victories' AND variant = 'C' AND category = 'app_icon');

-- 30. widgets_trackers
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'widgets_trackers', 'A', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_widgets_trackers_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_widgets_trackers_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_widgets_trackers_A.png',
  'Widgets and habit trackers', '["widgets","trackers","habits","progress"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'widgets_trackers' AND variant = 'A' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'widgets_trackers', 'B', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_widgets_trackers_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_widgets_trackers_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_widgets_trackers_B.png',
  'Widgets and habit trackers', '["widgets","trackers","habits","progress"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'widgets_trackers' AND variant = 'B' AND category = 'app_icon');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'widgets_trackers', 'C', 'app_icon',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/512/feature_widgets_trackers_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/128/feature_widgets_trackers_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/app-icons/32/feature_widgets_trackers_C.png',
  'Widgets and habit trackers', '["widgets","trackers","habits","progress"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'widgets_trackers' AND variant = 'C' AND category = 'app_icon');


-- ============================================================
-- VAULT THUMBNAILS (18 tools x 3 variants = 54 rows)
-- ============================================================

-- 1. board_of_directors
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'board_of_directors', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_board_of_directors_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_board_of_directors_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_board_of_directors_A.png',
  'Board of Directors thinking tool', '["board","directors","advisors","thinking"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'board_of_directors' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'board_of_directors', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_board_of_directors_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_board_of_directors_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_board_of_directors_B.png',
  'Board of Directors thinking tool', '["board","directors","advisors","thinking"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'board_of_directors' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'board_of_directors', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_board_of_directors_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_board_of_directors_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_board_of_directors_C.png',
  'Board of Directors thinking tool', '["board","directors","advisors","thinking"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'board_of_directors' AND variant = 'C' AND category = 'vault_thumbnail');

-- 2. building_app_ai
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'building_app_ai', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_building_app_ai_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_building_app_ai_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_building_app_ai_A.png',
  'Building an App with AI guide', '["building","app","ai","development"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'building_app_ai' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'building_app_ai', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_building_app_ai_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_building_app_ai_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_building_app_ai_B.png',
  'Building an App with AI guide', '["building","app","ai","development"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'building_app_ai' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'building_app_ai', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_building_app_ai_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_building_app_ai_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_building_app_ai_C.png',
  'Building an App with AI guide', '["building","app","ai","development"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'building_app_ai' AND variant = 'C' AND category = 'vault_thumbnail');

-- 3. consistent_characters
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'consistent_characters', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_consistent_characters_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_consistent_characters_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_consistent_characters_A.png',
  'Consistent Characters AI image tool', '["characters","consistent","ai","image"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'consistent_characters' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'consistent_characters', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_consistent_characters_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_consistent_characters_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_consistent_characters_B.png',
  'Consistent Characters AI image tool', '["characters","consistent","ai","image"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'consistent_characters' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'consistent_characters', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_consistent_characters_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_consistent_characters_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_consistent_characters_C.png',
  'Consistent Characters AI image tool', '["characters","consistent","ai","image"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'consistent_characters' AND variant = 'C' AND category = 'vault_thumbnail');

-- 4. cyrano_higgins
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'cyrano_higgins', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_cyrano_higgins_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_cyrano_higgins_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_cyrano_higgins_A.png',
  'Cyrano & Higgins communication coach', '["cyrano","higgins","coach","communication"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'cyrano_higgins' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'cyrano_higgins', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_cyrano_higgins_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_cyrano_higgins_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_cyrano_higgins_B.png',
  'Cyrano & Higgins communication coach', '["cyrano","higgins","coach","communication"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'cyrano_higgins' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'cyrano_higgins', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_cyrano_higgins_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_cyrano_higgins_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_cyrano_higgins_C.png',
  'Cyrano & Higgins communication coach', '["cyrano","higgins","coach","communication"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'cyrano_higgins' AND variant = 'C' AND category = 'vault_thumbnail');

-- 5. decision_guide
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'decision_guide', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_decision_guide_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_decision_guide_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_decision_guide_A.png',
  'Decision Guide decision-making tool', '["decision","guide","choice","framework"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'decision_guide' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'decision_guide', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_decision_guide_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_decision_guide_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_decision_guide_B.png',
  'Decision Guide decision-making tool', '["decision","guide","choice","framework"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'decision_guide' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'decision_guide', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_decision_guide_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_decision_guide_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_decision_guide_C.png',
  'Decision Guide decision-making tool', '["decision","guide","choice","framework"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'decision_guide' AND variant = 'C' AND category = 'vault_thumbnail');

-- 6. getting_started_ai
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'getting_started_ai', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_getting_started_ai_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_getting_started_ai_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_getting_started_ai_A.png',
  'Getting Started with AI guide', '["getting started","ai","guide","beginner"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'getting_started_ai' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'getting_started_ai', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_getting_started_ai_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_getting_started_ai_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_getting_started_ai_B.png',
  'Getting Started with AI guide', '["getting started","ai","guide","beginner"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'getting_started_ai' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'getting_started_ai', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_getting_started_ai_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_getting_started_ai_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_getting_started_ai_C.png',
  'Getting Started with AI guide', '["getting started","ai","guide","beginner"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'getting_started_ai' AND variant = 'C' AND category = 'vault_thumbnail');

-- 7. image_style_library
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'image_style_library', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_image_style_library_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_image_style_library_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_image_style_library_A.png',
  'Image Style Library visual reference', '["image","style","library","visual"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'image_style_library' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'image_style_library', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_image_style_library_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_image_style_library_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_image_style_library_B.png',
  'Image Style Library visual reference', '["image","style","library","visual"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'image_style_library' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'image_style_library', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_image_style_library_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_image_style_library_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_image_style_library_C.png',
  'Image Style Library visual reference', '["image","style","library","visual"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'image_style_library' AND variant = 'C' AND category = 'vault_thumbnail');

-- 8. love_languages_gifts
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_gifts', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_gifts_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_gifts_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_gifts_A.png',
  'Love Languages: Receiving Gifts', '["love","gifts","receiving","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_gifts' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_gifts', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_gifts_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_gifts_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_gifts_B.png',
  'Love Languages: Receiving Gifts', '["love","gifts","receiving","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_gifts' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_gifts', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_gifts_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_gifts_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_gifts_C.png',
  'Love Languages: Receiving Gifts', '["love","gifts","receiving","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_gifts' AND variant = 'C' AND category = 'vault_thumbnail');

-- 9. love_languages_service
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_service', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_service_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_service_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_service_A.png',
  'Love Languages: Acts of Service', '["love","service","acts","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_service' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_service', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_service_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_service_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_service_B.png',
  'Love Languages: Acts of Service', '["love","service","acts","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_service' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_service', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_service_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_service_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_service_C.png',
  'Love Languages: Acts of Service', '["love","service","acts","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_service' AND variant = 'C' AND category = 'vault_thumbnail');

-- 10. love_languages_time
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_time', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_time_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_time_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_time_A.png',
  'Love Languages: Quality Time', '["love","time","quality","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_time' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_time', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_time_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_time_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_time_B.png',
  'Love Languages: Quality Time', '["love","time","quality","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_time' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_time', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_time_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_time_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_time_C.png',
  'Love Languages: Quality Time', '["love","time","quality","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_time' AND variant = 'C' AND category = 'vault_thumbnail');

-- 11. love_languages_touch
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_touch', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_touch_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_touch_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_touch_A.png',
  'Love Languages: Physical Touch', '["love","touch","physical","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_touch' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_touch', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_touch_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_touch_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_touch_B.png',
  'Love Languages: Physical Touch', '["love","touch","physical","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_touch' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_touch', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_touch_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_touch_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_touch_C.png',
  'Love Languages: Physical Touch', '["love","touch","physical","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_touch' AND variant = 'C' AND category = 'vault_thumbnail');

-- 12. love_languages_words
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_words', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_words_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_words_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_words_A.png',
  'Love Languages: Words of Affirmation', '["love","words","affirmation","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_words' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_words', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_words_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_words_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_words_B.png',
  'Love Languages: Words of Affirmation', '["love","words","affirmation","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_words' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'love_languages_words', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_love_languages_words_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_love_languages_words_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_love_languages_words_C.png',
  'Love Languages: Words of Affirmation', '["love","words","affirmation","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'love_languages_words' AND variant = 'C' AND category = 'vault_thumbnail');

-- 13. meal_planning
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'meal_planning', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_meal_planning_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_meal_planning_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_meal_planning_A.png',
  'Meal Planning assistant', '["meal","planning","food","cooking"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'meal_planning' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'meal_planning', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_meal_planning_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_meal_planning_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_meal_planning_B.png',
  'Meal Planning assistant', '["meal","planning","food","cooking"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'meal_planning' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'meal_planning', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_meal_planning_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_meal_planning_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_meal_planning_C.png',
  'Meal Planning assistant', '["meal","planning","food","cooking"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'meal_planning' AND variant = 'C' AND category = 'vault_thumbnail');

-- 14. mediator
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'mediator', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_mediator_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_mediator_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_mediator_A.png',
  'Mediator conflict resolution tool', '["mediator","conflict","resolution","balance"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'mediator' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'mediator', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_mediator_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_mediator_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_mediator_B.png',
  'Mediator conflict resolution tool', '["mediator","conflict","resolution","balance"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'mediator' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'mediator', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_mediator_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_mediator_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_mediator_C.png',
  'Mediator conflict resolution tool', '["mediator","conflict","resolution","balance"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'mediator' AND variant = 'C' AND category = 'vault_thumbnail');

-- 15. perspective_shifter
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'perspective_shifter', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_perspective_shifter_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_perspective_shifter_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_perspective_shifter_A.png',
  'Perspective Shifter reframing tool', '["perspective","reframe","shift","viewpoint"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'perspective_shifter' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'perspective_shifter', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_perspective_shifter_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_perspective_shifter_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_perspective_shifter_B.png',
  'Perspective Shifter reframing tool', '["perspective","reframe","shift","viewpoint"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'perspective_shifter' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'perspective_shifter', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_perspective_shifter_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_perspective_shifter_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_perspective_shifter_C.png',
  'Perspective Shifter reframing tool', '["perspective","reframe","shift","viewpoint"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'perspective_shifter' AND variant = 'C' AND category = 'vault_thumbnail');

-- 16. photoshoot
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'photoshoot', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_photoshoot_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_photoshoot_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_photoshoot_A.png',
  'Photoshoot AI photography tool', '["photoshoot","photography","ai","image"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'photoshoot' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'photoshoot', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_photoshoot_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_photoshoot_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_photoshoot_B.png',
  'Photoshoot AI photography tool', '["photoshoot","photography","ai","image"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'photoshoot' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'photoshoot', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_photoshoot_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_photoshoot_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_photoshoot_C.png',
  'Photoshoot AI photography tool', '["photoshoot","photography","ai","image"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'photoshoot' AND variant = 'C' AND category = 'vault_thumbnail');

-- 17. task_breaker
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'task_breaker', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_task_breaker_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_task_breaker_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_task_breaker_A.png',
  'Task Breaker project planning tool', '["task","breaker","planning","project"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'task_breaker' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'task_breaker', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_task_breaker_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_task_breaker_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_task_breaker_B.png',
  'Task Breaker project planning tool', '["task","breaker","planning","project"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'task_breaker' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'task_breaker', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_task_breaker_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_task_breaker_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_task_breaker_C.png',
  'Task Breaker project planning tool', '["task","breaker","planning","project"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'task_breaker' AND variant = 'C' AND category = 'vault_thumbnail');

-- 18. translator
INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'translator', 'A', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_translator_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_translator_A.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_translator_A.png',
  'Translator communication bridge tool', '["translator","communication","bridge","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'translator' AND variant = 'A' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'translator', 'B', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_translator_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_translator_B.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_translator_B.png',
  'Translator communication bridge tool', '["translator","communication","bridge","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'translator' AND variant = 'B' AND category = 'vault_thumbnail');

INSERT INTO platform_assets (feature_key, variant, category, size_512_url, size_128_url, size_32_url, description, tags, display_name, status)
SELECT 'translator', 'C', 'vault_thumbnail',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/512/vault_thumb_translator_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/128/vault_thumb_translator_C.png',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/vault-thumbnails/32/vault_thumb_translator_C.png',
  'Translator communication bridge tool', '["translator","communication","bridge","language"]'::jsonb, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM platform_assets WHERE feature_key = 'translator' AND variant = 'C' AND category = 'vault_thumbnail');
