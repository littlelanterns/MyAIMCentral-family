-- PRD-06 + PRD-07 Personal Growth Repair Migration
-- Adds missing columns to guiding_stars, best_intentions, intention_iterations
-- Renames InnerWorkings categories to match PRD-07 spec
-- All operations are idempotent (safe to run multiple times)

-- ============================================================
-- GUIDING STARS — Add missing PRD-06 columns
-- ============================================================

ALTER TABLE guiding_stars ADD COLUMN IF NOT EXISTS entry_type TEXT;
ALTER TABLE guiding_stars ADD COLUMN IF NOT EXISTS owner_type TEXT NOT NULL DEFAULT 'member';
ALTER TABLE guiding_stars ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE guiding_stars ADD COLUMN IF NOT EXISTS source_reference_id UUID;
ALTER TABLE guiding_stars ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE guiding_stars ADD COLUMN IF NOT EXISTS is_shared_with_partner BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE guiding_stars ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE guiding_stars ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Backfill entry_type from existing category data
UPDATE guiding_stars SET entry_type = CASE
  WHEN lower(category) = 'value' THEN 'value'
  WHEN lower(category) = 'declaration' THEN 'declaration'
  WHEN lower(category) IN ('scripture', 'scripture_quote') THEN 'scripture_quote'
  WHEN lower(category) = 'vision' THEN 'vision'
  WHEN lower(category) = 'priority' THEN 'value'
  WHEN lower(category) = 'principle' THEN 'value'
  WHEN lower(category) = 'custom' THEN 'value'
  ELSE 'value'
END
WHERE entry_type IS NULL;

-- Add indexes for PRD-06 query patterns
CREATE INDEX IF NOT EXISTS idx_gs_entry_type ON guiding_stars (family_id, member_id, entry_type, archived_at);
CREATE INDEX IF NOT EXISTS idx_gs_owner_type ON guiding_stars (family_id, owner_type, archived_at);
CREATE INDEX IF NOT EXISTS idx_gs_context ON guiding_stars (family_id, is_included_in_ai, archived_at);
CREATE INDEX IF NOT EXISTS idx_gs_sort ON guiding_stars (family_id, member_id, entry_type, sort_order);

-- ============================================================
-- BEST INTENTIONS — Add missing PRD-06 columns
-- ============================================================

ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS related_member_ids UUID[];
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS tracker_style TEXT NOT NULL DEFAULT 'counter';
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS is_shared_with_partner BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS source_reference_id UUID;
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add indexes for PRD-06 query patterns
CREATE INDEX IF NOT EXISTS idx_bi_active ON best_intentions (family_id, member_id, is_active, archived_at);
CREATE INDEX IF NOT EXISTS idx_bi_context ON best_intentions (family_id, is_included_in_ai, is_active, archived_at);
CREATE INDEX IF NOT EXISTS idx_bi_sort ON best_intentions (family_id, member_id, sort_order);

-- ============================================================
-- INTENTION ITERATIONS — Add missing PRD-06 columns
-- ============================================================

ALTER TABLE intention_iterations ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);
ALTER TABLE intention_iterations ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES family_members(id);
ALTER TABLE intention_iterations ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE intention_iterations ADD COLUMN IF NOT EXISTS day_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Add indexes for PRD-06 query patterns
CREATE INDEX IF NOT EXISTS idx_ii_daily ON intention_iterations (intention_id, day_date);
CREATE INDEX IF NOT EXISTS idx_ii_member_day ON intention_iterations (member_id, day_date);
CREATE INDEX IF NOT EXISTS idx_ii_time ON intention_iterations (intention_id, recorded_at);

-- ============================================================
-- SELF_KNOWLEDGE — Update CHECK constraint + rename categories
-- ============================================================

-- Drop old CHECK constraint (inline constraint created in migration 00000000000005)
ALTER TABLE self_knowledge DROP CONSTRAINT IF EXISTS self_knowledge_category_check;

-- Rename category values to match PRD-07 spec
UPDATE self_knowledge SET category = 'personality_type' WHERE category = 'personality';
UPDATE self_knowledge SET category = 'strength' WHERE category = 'strengths';
UPDATE self_knowledge SET category = 'growth_area' WHERE category = 'growth_areas';
UPDATE self_knowledge SET category = 'trait_tendency' WHERE category = 'communication_style';
UPDATE self_knowledge SET category = 'general' WHERE category = 'how_i_work';

-- Add new CHECK constraint with PRD-07 categories
ALTER TABLE self_knowledge ADD CONSTRAINT self_knowledge_category_check
  CHECK (category IN ('personality_type','trait_tendency','strength','growth_area','general'));

-- ============================================================
-- FEATURE KEY SEEDS (idempotent)
-- ============================================================

INSERT INTO feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('guiding_stars_family', 'Family Guiding Stars', 'Family-level Guiding Stars via LifeLantern', 'PRD-06'),
  ('best_intentions_tracker_views', 'Intention Tracker Views', 'Bar graph and streak visualizations for Best Intentions', 'PRD-06')
ON CONFLICT (feature_key) DO NOTHING;
