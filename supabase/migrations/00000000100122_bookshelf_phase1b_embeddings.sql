-- ============================================================
-- BookShelf Platform Library — Phase 1b, Sub-phase A
-- Add embedding column to platform_intelligence.book_extractions,
-- backfill 88K embeddings from old per-family tables via exact
-- text-match JOIN, create HNSW index, and ship 4 SECURITY DEFINER
-- RPCs so the embed Edge Function's polling path can process the
-- platform tables.
--
-- Phase 1 (migration 100090) created the book_extractions table
-- without an embedding column. The match_book_extractions RPC
-- (migration 100092) references be.embedding three times, throwing
-- "column does not exist" at runtime. MorningInsightSection swallows
-- the error silently. This migration fixes the structural gap.
--
-- Idempotent: re-running is safe via ADD COLUMN IF NOT EXISTS,
-- WHERE embedding IS NULL guards, and CREATE INDEX IF NOT EXISTS.
-- ============================================================

SET statement_timeout = '600s';

BEGIN;

-- ============================================================
-- 1. Add embedding column
-- ============================================================
ALTER TABLE platform_intelligence.book_extractions
  ADD COLUMN IF NOT EXISTS embedding halfvec(1536);

-- ============================================================
-- 2. Backfill embeddings from old per-family tables
--
-- Strategy: exact text match on (book_library_id, extraction_type,
-- text/declaration_text, section_title). This join strategy was
-- validated via a 100-row spot check during pre-build (100/100 hits).
-- Any rows that fail to join fall through to the polling pipeline,
-- which will re-embed them from scratch.
--
-- Declarations use declaration_text as the semantic key; the other
-- four types use text. This mirrors migration 100091's insert logic.
--
-- Multi-part books: source rows live under the child's
-- bookshelf_item_id, but the platform rows live under the parent's
-- book_library_id. The JOIN via bookshelf_items.book_library_id
-- resolves this correctly (children's book_library_id points at
-- the parent's library entry per migration 100090 section 6).
-- ============================================================
DO $$
DECLARE
  v_count INTEGER;
  v_total INTEGER := 0;
BEGIN
  -- Summaries (~21,538 expected)
  UPDATE platform_intelligence.book_extractions be
  SET embedding = src.embedding
  FROM bookshelf_summaries src
  JOIN bookshelf_items bi ON bi.id = src.bookshelf_item_id
  WHERE be.book_library_id = bi.book_library_id
    AND be.extraction_type = 'summary'
    AND be.text = src.text
    AND COALESCE(be.section_title, '') = COALESCE(src.section_title, '')
    AND be.embedding IS NULL
    AND src.embedding IS NOT NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Summaries backfilled: % rows', v_count;
  v_total := v_total + v_count;

  -- Insights (~23,977 expected)
  UPDATE platform_intelligence.book_extractions be
  SET embedding = src.embedding
  FROM bookshelf_insights src
  JOIN bookshelf_items bi ON bi.id = src.bookshelf_item_id
  WHERE be.book_library_id = bi.book_library_id
    AND be.extraction_type = 'insight'
    AND be.text = src.text
    AND COALESCE(be.section_title, '') = COALESCE(src.section_title, '')
    AND be.embedding IS NULL
    AND src.embedding IS NOT NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Insights backfilled: % rows', v_count;
  v_total := v_total + v_count;

  -- Declarations (~16,931 expected) — join on declaration_text
  UPDATE platform_intelligence.book_extractions be
  SET embedding = src.embedding
  FROM bookshelf_declarations src
  JOIN bookshelf_items bi ON bi.id = src.bookshelf_item_id
  WHERE be.book_library_id = bi.book_library_id
    AND be.extraction_type = 'declaration'
    AND be.declaration_text = src.declaration_text
    AND COALESCE(be.section_title, '') = COALESCE(src.section_title, '')
    AND be.embedding IS NULL
    AND src.embedding IS NOT NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Declarations backfilled: % rows', v_count;
  v_total := v_total + v_count;

  -- Action Steps (~16,134 expected)
  UPDATE platform_intelligence.book_extractions be
  SET embedding = src.embedding
  FROM bookshelf_action_steps src
  JOIN bookshelf_items bi ON bi.id = src.bookshelf_item_id
  WHERE be.book_library_id = bi.book_library_id
    AND be.extraction_type = 'action_step'
    AND be.text = src.text
    AND COALESCE(be.section_title, '') = COALESCE(src.section_title, '')
    AND be.embedding IS NULL
    AND src.embedding IS NOT NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Action steps backfilled: % rows', v_count;
  v_total := v_total + v_count;

  -- Questions (~9,894 expected)
  UPDATE platform_intelligence.book_extractions be
  SET embedding = src.embedding
  FROM bookshelf_questions src
  JOIN bookshelf_items bi ON bi.id = src.bookshelf_item_id
  WHERE be.book_library_id = bi.book_library_id
    AND be.extraction_type = 'question'
    AND be.text = src.text
    AND COALESCE(be.section_title, '') = COALESCE(src.section_title, '')
    AND be.embedding IS NULL
    AND src.embedding IS NOT NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Questions backfilled: % rows', v_count;
  v_total := v_total + v_count;

  RAISE NOTICE 'TOTAL backfilled: % rows (expected ~88,474)', v_total;
END $$;

-- ============================================================
-- 3. Post-backfill NULL count per extraction_type
-- ============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT extraction_type,
           count(*) FILTER (WHERE embedding IS NULL) AS missing,
           count(*) AS total
    FROM platform_intelligence.book_extractions
    GROUP BY extraction_type
    ORDER BY extraction_type
  LOOP
    RAISE NOTICE 'POST-BACKFILL: % | missing=% | total=%',
      r.extraction_type, r.missing, r.total;
  END LOOP;
END $$;

-- ============================================================
-- 4. HNSW index on the populated column
--
-- Built AFTER backfill so all 88K rows populate the index in a
-- single pass. Building it before the backfill would trigger per-row
-- index maintenance on every UPDATE, which is orders of magnitude
-- slower.
-- ============================================================
DO $$ BEGIN
  CREATE INDEX idx_plbe_embedding
    ON platform_intelligence.book_extractions
    USING hnsw (embedding halfvec_cosine_ops)
    WHERE embedding IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- ============================================================
-- 5. Polling pipeline RPCs for the embed Edge Function
--
-- Mirror the existing update_book_cache_embedding pattern:
--   - Parameter is text (caller passes JSON.stringify(embedding))
--   - RPC casts ::halfvec server-side
--   - RETURNS void
--   - LANGUAGE sql, SECURITY DEFINER
--
-- This lets the embed Edge Function reuse its existing call pattern
-- with zero special-casing.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_unembedded_book_extractions(p_limit integer)
  RETURNS TABLE(id uuid, text text, declaration_text text, extraction_type text)
  LANGUAGE sql
  SECURITY DEFINER
AS $$
  SELECT id, text, declaration_text, extraction_type
  FROM platform_intelligence.book_extractions
  WHERE embedding IS NULL
    AND is_deleted = false
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.update_book_extraction_embedding(p_id uuid, p_embedding text)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
AS $$
  UPDATE platform_intelligence.book_extractions
  SET embedding = p_embedding::halfvec
  WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.get_unembedded_book_chunks(p_limit integer)
  RETURNS TABLE(id uuid, text text)
  LANGUAGE sql
  SECURITY DEFINER
AS $$
  SELECT id, text
  FROM platform_intelligence.book_chunks
  WHERE embedding IS NULL
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.update_book_chunk_embedding(p_id uuid, p_embedding text)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
AS $$
  UPDATE platform_intelligence.book_chunks
  SET embedding = p_embedding::halfvec
  WHERE id = p_id;
$$;

COMMIT;

RESET statement_timeout;
