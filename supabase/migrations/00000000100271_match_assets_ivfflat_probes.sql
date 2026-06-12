-- Migration: 00000000100271_match_assets_ivfflat_probes.sql
-- Build: KIDS-REWARDS-PAGE — Slice 1 founder addition, correctness fix
--
-- Found while verifying the widened picker (100270): platform_assets had an
-- IVFFlat embedding index (lists=100), and `ivfflat.probes` defaults to 1 —
-- each ANN scan visits ONE of 100 clusters. With only 622 rows that's a
-- lottery: most queries missed the cluster holding the true nearest
-- neighbors and match_assets returned EMPTY or partial results. Symptom:
-- filter_categories=['login_avatar'] found Pizza (planner skipped the ANN
-- index → exact scan) while the superset ['visual_schedule','login_avatar',
-- 'app_icon'] returned ZERO rows (planner used the index → wrong cluster).
-- This silently degraded Build M task-icon suggestions since 100025.
--
-- First fix attempt (function-scoped SET ivfflat.probes = 100) is
-- permission-denied on Supabase hosted (GUC restriction — same class as the
-- Convention #246 app.settings.* lesson).
--
-- Structural fix: DROP the index. 622 rows × cosine distance is microseconds
-- as an exact scan, always correct. lists=100 was misconfigured for this
-- scale anyway (rule of thumb: lists ≈ rows/1000). If the asset library ever
-- grows to tens of thousands of rows, add a properly tuned HNSW index then —
-- and re-verify match_assets returns complete results with filters.

BEGIN;

DROP INDEX IF EXISTS public.idx_platform_assets_embedding;

-- Function body unchanged from 100270 (recreate defensively so this
-- migration is self-contained if 100270's function was ever modified).
DROP FUNCTION IF EXISTS public.match_assets(vector, FLOAT, INT, TEXT, TEXT, TEXT[]);

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
  'Semantic search over platform_assets embeddings (exact scan — the IVFFlat '
  'index was dropped in 100271 because probes=1 returned empty/partial results '
  'at this table size). filter_categories TEXT[] (KIDS-REWARDS-PAGE) spans '
  'multiple categories; filter_category kept for legacy callers (array wins).';

COMMIT;
