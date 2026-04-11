-- ============================================================
-- Phase 1b-C: Per-row relink for bookshelf_items.book_library_id
-- ============================================================
-- Migration 100090 used an IF NOT EXISTS (LIMIT 1) guard that
-- skipped the entire backfill once ANY row had book_library_id
-- set. This meant any bookshelf_items inserted after the first
-- migration run could be left with book_library_id = NULL.
--
-- Founder confirmed 2026-04-08: no new uploads since Phase 1,
-- so this is expected to be a no-op — but ships as a safety net
-- against future similar bugs.
--
-- Logic mirrors 100090 lines 273-292 but runs unconditionally
-- per-row instead of inside an IF gate.
-- ============================================================

-- Standalone books + parent books: book_library_id = own book_cache_id
UPDATE bookshelf_items
SET book_library_id = book_cache_id
WHERE book_library_id IS NULL
  AND book_cache_id IS NOT NULL
  AND parent_bookshelf_item_id IS NULL;

-- Child parts: book_library_id = parent's book_cache_id
UPDATE bookshelf_items child
SET book_library_id = parent.book_cache_id
FROM bookshelf_items parent
WHERE child.book_library_id IS NULL
  AND child.parent_bookshelf_item_id IS NOT NULL
  AND child.parent_bookshelf_item_id = parent.id
  AND parent.book_cache_id IS NOT NULL;

-- Verification
DO $$
DECLARE
  v_null_count INTEGER;
  v_total_count INTEGER;
BEGIN
  SELECT count(*) INTO v_null_count
  FROM bookshelf_items
  WHERE book_library_id IS NULL
    AND archived_at IS NULL
    AND book_cache_id IS NOT NULL;

  SELECT count(*) INTO v_total_count
  FROM bookshelf_items
  WHERE archived_at IS NULL;

  RAISE NOTICE 'Phase 1b-C relink: % active items with NULL book_library_id (expected 0), % total active items',
    v_null_count, v_total_count;
END $$;
