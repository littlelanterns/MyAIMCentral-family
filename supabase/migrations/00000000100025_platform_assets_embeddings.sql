-- Platform Assets: Semantic vector search, admin management, and image library growth
-- Enhances the existing platform_assets table with embeddings, display names, and lifecycle status.

-- Step 1 — Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2 — Add new columns to platform_assets
ALTER TABLE platform_assets
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS embedding vector(1536),
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'draft', 'archived'));

-- Step 3 — Create vector similarity index
CREATE INDEX IF NOT EXISTS idx_platform_assets_embedding
  ON platform_assets
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Step 4 — Create match_assets RPC function
CREATE OR REPLACE FUNCTION match_assets(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10,
  filter_category TEXT DEFAULT NULL,
  filter_status TEXT DEFAULT 'active'
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
    (filter_category IS NULL OR pa.category = filter_category)
    AND pa.status = filter_status
    AND pa.embedding IS NOT NULL
    AND 1 - (pa.embedding <=> query_embedding) > match_threshold
  ORDER BY pa.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 5 — Update RLS
GRANT EXECUTE ON FUNCTION match_assets TO authenticated;

-- Step 6 — Column comments
COMMENT ON COLUMN platform_assets.embedding IS
  'OpenAI text-embedding-3-small vector (1536 dims).
   Source text: display_name + description + tags joined as phrases.
   Generated and updated by the asset pipeline script.';

COMMENT ON COLUMN platform_assets.assigned_to IS
  'Optional assignment key in format "category:feature_key",
   e.g. "vault:board_of_directors" or "feature:dashboard".
   Used by admin UI to show which tool/screen an image is assigned to.
   No FK constraint — free-text for flexibility during early development.';

COMMENT ON COLUMN platform_assets.status IS
  'Lifecycle state. active = in use, draft = generated but not yet assigned,
   archived = replaced or retired. Admin UI filters by this field.';

COMMENT ON FUNCTION match_assets IS
  'Semantic similarity search over platform_assets using cosine distance.
   Pass a query_embedding (from OpenAI text-embedding-3-small),
   optional category filter, and desired result count.
   Returns assets ranked by similarity score descending.';
