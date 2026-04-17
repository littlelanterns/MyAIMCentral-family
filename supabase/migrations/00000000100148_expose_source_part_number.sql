-- ============================================================
-- Expose source_part_number in get_book_extractions RPC
-- ============================================================
-- Migration 100095 added source_part_number to ORDER BY but
-- did not include it in the RETURNS TABLE(...) signature. The
-- frontend sidebar (ExtractionSidebar.tsx) consequently couldn't
-- sort multi-part books by part — it hardcoded partNum: 0, so
-- all section_index=0 rows clustered (Part 1 TOC, Part 2 intro,
-- Part 3 foreword), then all 1s, then 2s, producing visible
-- chapter scrambling across parts.
--
-- This migration drops + recreates the RPC with source_part_number
-- added as the 32nd column in RETURNS TABLE. ORDER BY is unchanged;
-- the column was already present on the table (migration 100095).
--
-- Idempotent via DROP FUNCTION IF EXISTS. Return-type change means
-- CREATE OR REPLACE alone is insufficient — must drop first.
-- ============================================================

DROP FUNCTION IF EXISTS public.get_book_extractions(uuid[], uuid, text);

CREATE FUNCTION public.get_book_extractions(
  p_bookshelf_item_ids UUID[],
  p_member_id UUID,
  p_audience TEXT DEFAULT 'original'
)
RETURNS TABLE (
  id UUID,
  book_library_id UUID,
  extraction_type TEXT,
  text TEXT,
  guided_text TEXT,
  independent_text TEXT,
  content_type TEXT,
  declaration_text TEXT,
  style_variant TEXT,
  value_name TEXT,
  richness TEXT,
  section_title TEXT,
  section_index INTEGER,
  sort_order INTEGER,
  audience TEXT,
  is_key_point BOOLEAN,
  is_from_go_deeper BOOLEAN,
  is_deleted BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_hearted BOOLEAN,
  user_note TEXT,
  is_included_in_ai BOOLEAN,
  is_hidden BOOLEAN,
  sent_to_guiding_stars BOOLEAN,
  guiding_star_id UUID,
  sent_to_tasks BOOLEAN,
  task_id UUID,
  sent_to_prompts BOOLEAN,
  journal_prompt_id UUID,
  user_state_id UUID,
  source_part_number INTEGER
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
  WITH library_ids AS (
    SELECT DISTINCT bi.book_library_id
    FROM bookshelf_items bi
    WHERE bi.id = ANY(p_bookshelf_item_ids)
      AND bi.book_library_id IS NOT NULL
  )
  SELECT
    e.id,
    e.book_library_id,
    e.extraction_type,
    e.text,
    e.guided_text,
    e.independent_text,
    e.content_type,
    e.declaration_text,
    e.style_variant,
    e.value_name,
    e.richness,
    e.section_title,
    e.section_index,
    e.sort_order,
    e.audience,
    e.is_key_point,
    e.is_from_go_deeper,
    e.is_deleted,
    e.created_at,
    e.updated_at,
    COALESCE(us.is_hearted, false),
    us.user_note,
    COALESCE(us.is_included_in_ai, true),
    COALESCE(us.is_hidden, false),
    COALESCE(us.sent_to_guiding_stars, false),
    us.guiding_star_id,
    COALESCE(us.sent_to_tasks, false),
    us.task_id,
    COALESCE(us.sent_to_prompts, false),
    us.journal_prompt_id,
    us.id AS user_state_id,
    e.source_part_number
  FROM platform_intelligence.book_extractions e
  JOIN library_ids li ON e.book_library_id = li.book_library_id
  LEFT JOIN bookshelf_user_state us
    ON us.extraction_id = e.id AND us.member_id = p_member_id
  WHERE e.audience = p_audience
    AND e.is_deleted = false
    AND COALESCE(us.is_hidden, false) = false
  ORDER BY e.source_part_number, e.section_index NULLS LAST, e.sort_order;
$$;
