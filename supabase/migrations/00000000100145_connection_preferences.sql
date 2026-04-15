-- ============================================================
-- Connection Preferences: self_knowledge expansion + wishlist AI context
-- Adds 6 new self_knowledge categories for family connection insights
-- Adds mom_connection_insight context_type for private mom observations
-- Adds is_included_in_ai toggle support for lists
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Expand self_knowledge.category CHECK constraint
-- ────────────────────────────────────────────────────────────
-- Current: ('personality_type','trait_tendency','strength','growth_area','general')
-- Adding 6 connection preference categories

ALTER TABLE self_knowledge DROP CONSTRAINT IF EXISTS self_knowledge_category_check;

ALTER TABLE self_knowledge ADD CONSTRAINT self_knowledge_category_check
  CHECK (category IN (
    'personality_type','trait_tendency','strength','growth_area','general',
    'gift_ideas','meaningful_words','helpful_actions',
    'quality_time_ideas','sensitivities','comfort_needs'
  ));

-- ────────────────────────────────────────────────────────────
-- 2. Expand archive_context_items.context_type CHECK constraint
-- ────────────────────────────────────────────────────────────
-- Adding 'mom_connection_insight' for mom's private observations
-- about family members' connection preferences

ALTER TABLE archive_context_items DROP CONSTRAINT IF EXISTS archive_context_items_context_type_check;

ALTER TABLE archive_context_items ADD CONSTRAINT archive_context_items_context_type_check
  CHECK (context_type IN (
    'preference','schedule','personality','interest','academic','medical',
    'wishlist_item','family_personality','family_rhythm','family_focus',
    'faith_context','meeting_note','general',
    'mom_connection_insight'
  ));

-- ────────────────────────────────────────────────────────────
-- 3. Feature keys for connection preferences
-- ────────────────────────────────────────────────────────────

INSERT INTO feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('connection_preferences', 'Connection Preferences', 'Self-knowledge entries about how to connect with each family member — gifts, words, acts of service, quality time, sensitivities, comfort', 'PRD-07'),
  ('wishlist_ai_context', 'Wishlist AI Context', 'Include wishlist items in LiLa AI context for gift suggestions and family awareness', 'PRD-09B')
ON CONFLICT (feature_key) DO NOTHING;

-- Feature access for all role groups at Essential tier
INSERT INTO feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT fk.feature_key, rg.role_group, st.id, true
FROM (VALUES ('connection_preferences'), ('wishlist_ai_context')) AS fk(feature_key)
CROSS JOIN (VALUES ('mom'), ('dad_adults'), ('special_adults'), ('independent_teens'), ('guided_kids')) AS rg(role_group)
CROSS JOIN subscription_tiers st
WHERE st.slug = 'essential'
  AND NOT EXISTS (
    SELECT 1 FROM feature_access_v2 fa
    WHERE fa.feature_key = fk.feature_key AND fa.role_group = rg.role_group
  );

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────

DO $$
DECLARE
  sk_cats TEXT;
  aci_types TEXT;
BEGIN
  -- Verify self_knowledge constraint includes new categories
  SELECT string_agg(conname, ', ')
  INTO sk_cats
  FROM pg_constraint
  WHERE conrelid = 'self_knowledge'::regclass
    AND conname = 'self_knowledge_category_check';

  RAISE NOTICE 'self_knowledge category constraint: %', sk_cats;

  -- Verify archive_context_items constraint
  SELECT string_agg(conname, ', ')
  INTO aci_types
  FROM pg_constraint
  WHERE conrelid = 'archive_context_items'::regclass
    AND conname = 'archive_context_items_context_type_check';

  RAISE NOTICE 'archive_context_items context_type constraint: %', aci_types;
END $$;
