-- Migration: 00000000100270_match_assets_filter_categories.sql
-- Build: KIDS-REWARDS-PAGE — Slice 1 founder addition (2026-06-12)
--
-- Founder request: the reward/task image picker should also surface tool
-- icons (category='app_icon') and sign-in pictures (category='login_avatar')
-- — e.g. typing "pizza" or "unicorn" should find the vp_pizza / vp_unicorn
-- login-avatar assets (which carry the "reward" tag by design).
--
-- match_assets only supported a single filter_category. This adds
-- filter_categories TEXT[] alongside it:
--   - filter_categories provided → category = ANY(filter_categories)
--   - filter_categories NULL     → legacy behavior (filter_category or all)
--
-- DROP + CREATE (not CREATE OR REPLACE) because adding a parameter would
-- otherwise create an ambiguous overload for PostgREST named-arg dispatch.
-- All existing callers pass named args that still resolve (new param has a
-- default).

BEGIN;

DROP FUNCTION IF EXISTS public.match_assets(vector, FLOAT, INT, TEXT, TEXT);

CREATE FUNCTION public.match_assets(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10,
  filter_category TEXT DEFAULT NULL,
  filter_status TEXT DEFAULT 'active',
  filter_categories TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  feature_key TEXT,
  variant TEXT,
  category TEXT,
  display_name TEXT,
  description TEXT,
  tags JSONB,
  size_512_url TEXT,
  size_128_url TEXT,
  size_32_url TEXT,
  assigned_to TEXT,
  status TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.id,
    pa.feature_key,
    pa.variant,
    pa.category,
    pa.display_name,
    pa.description,
    pa.tags,
    pa.size_512_url,
    pa.size_128_url,
    pa.size_32_url,
    pa.assigned_to,
    pa.status,
    1 - (pa.embedding <=> query_embedding) AS similarity
  FROM platform_assets pa
  WHERE
    (
      CASE
        WHEN filter_categories IS NOT NULL THEN pa.category = ANY(filter_categories)
        WHEN filter_category IS NOT NULL THEN pa.category = filter_category
        ELSE TRUE
      END
    )
    AND pa.status = filter_status
    AND pa.embedding IS NOT NULL
    AND 1 - (pa.embedding <=> query_embedding) > match_threshold
  ORDER BY pa.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_assets TO authenticated;

COMMENT ON FUNCTION public.match_assets IS
  'Semantic search over platform_assets embeddings. filter_categories TEXT[] '
  '(KIDS-REWARDS-PAGE) searches multiple categories at once — used by the '
  'reward/task image pickers to span visual_schedule + login_avatar + app_icon. '
  'filter_category (single) kept for legacy callers; categories array wins when both set.';

COMMIT;
