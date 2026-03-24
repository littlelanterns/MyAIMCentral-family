-- Platform Assets: Central registry of all platform-managed visual assets
-- Stores Supabase Storage URLs, metadata, descriptions,
-- and generation prompts for all paper craft illustrations.

CREATE TABLE IF NOT EXISTS platform_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B', 'C')),
  category TEXT NOT NULL CHECK (category IN (
    'app_icon',
    'vault_thumbnail',
    'visual_schedule',
    'login_avatar'
  )),
  size_512_url TEXT,
  size_128_url TEXT,
  size_32_url TEXT,
  description TEXT,
  generation_prompt TEXT,
  tags JSONB DEFAULT '[]',
  vibe_compatibility TEXT[] DEFAULT ARRAY['classic_myaim'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feature_key, variant, category)
);

-- Index for fast tag search
CREATE INDEX IF NOT EXISTS idx_platform_assets_tags
  ON platform_assets USING GIN (tags);

-- Index for category + feature lookups
CREATE INDEX IF NOT EXISTS idx_platform_assets_category_feature
  ON platform_assets (category, feature_key);

-- Index for vibe compatibility
CREATE INDEX IF NOT EXISTS idx_platform_assets_vibe
  ON platform_assets USING GIN (vibe_compatibility);

-- RLS
ALTER TABLE platform_assets ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read platform assets
DROP POLICY IF EXISTS "Platform assets are readable by all authenticated users" ON platform_assets;
CREATE POLICY "Platform assets are readable by all authenticated users"
  ON platform_assets FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update/delete

COMMENT ON TABLE platform_assets IS
  'Central registry of all platform-managed visual assets.
   Stores Supabase Storage URLs, metadata, descriptions,
   and generation prompts for all paper craft illustrations.
   Used for feature icons, vault thumbnails, visual schedule
   catalog, and login avatar selection.';

COMMENT ON COLUMN platform_assets.vibe_compatibility IS
  'Array of vibe keys that display illustrated icons.
   classic_myaim = paper craft images shown.
   clean_modern = falls back to Lucide icons.';

COMMENT ON COLUMN platform_assets.tags IS
  'JSONB array of semantic tags for AI-assisted image selection.
   Used by LiLa to match images to contexts, tasks, and features.';
