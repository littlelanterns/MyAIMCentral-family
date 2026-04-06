-- PRD-09B Addendum: Reference List Type + Tags + List Organization
-- Adds tags column to lists table, is_hidden to list_shares, and registers feature keys.

-- 1. Add tags to lists (for flexible organization / filtering)
ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_lists_tags ON lists USING GIN (tags);

-- 2. Soft-hide for shared lists (user can leave without losing the share)
ALTER TABLE list_shares
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- 3. Feature key registration
INSERT INTO feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('lists_reference', 'Reference Lists', 'Create and view reference lists with sections', 'PRD-09B'),
  ('lists_tags', 'List Tags', 'Tag lists for flexible organization', 'PRD-09B'),
  ('lists_tag_suggest', 'AI Tag Suggestions', 'AI-suggested tags on list creation', 'PRD-09B')
ON CONFLICT (feature_key) DO NOTHING;
