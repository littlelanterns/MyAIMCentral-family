# BookShelf Platform Library — Phase 1: Schema + Data Migration

> **Status:** Founder-approved architecture spec
> **Scope:** Database migration only — no Edge Functions, no frontend changes
> **Rule:** This document is READ-ONLY source material.

---

## Why This Exists

BookShelf currently stores everything at the family level — chunks, embeddings, extractions all have `family_id` and `family_member_id`. This means every family that uploads the same book would pay the full AI cost again (~$1-2/book), and study guides generated from disconnected extractions produce inaccurate content.

The correct architecture: **books, chunks, embeddings, and extractions live at the platform level.** They're universal knowledge, paid for once. Personal state (hearts, notes, AI inclusion) is per-individual-member and created on-demand only when someone interacts.

This is Phase 1 of 5. It creates the new tables, migrates existing data, and sets up RLS. Frontend and Edge Function changes come in later phases.

---

## Current State (Verified 2026-04-03)

### Data volumes
| Table | Rows | Notes |
|-------|------|-------|
| bookshelf_items (total) | 559 | All uploaded books |
| bookshelf_items (extraction_status='completed') | 228 | Fully extracted with all 5 tables |
| bookshelf_items (extraction_status='none') | 331 | Uploaded + chunked, no extractions yet |
| bookshelf_chunks | 58,115 | Chunks for all 559 books |
| bookshelf_summaries | 21,538 | From the 228 extracted books |
| bookshelf_insights | 23,977 | |
| bookshelf_declarations | 16,931 | |
| bookshelf_action_steps | 16,134 | |
| bookshelf_questions | 9,894 | |
| platform_intelligence.book_cache | 578 | Slightly more than 559 (multi-part/test entries) |
| Distinct families | 1 | |
| Hearted items (across all tables) | 13 | |
| Items with user notes | 0 | |

### Key facts
- Only 1 family (Tenise's) has BookShelf data
- 578 books already in book_cache with title/author/chunk_count
- 13 total hearted items across all extraction tables
- 0 user notes
- book_cache has `title_author_embedding` column for fuzzy matching
- bookshelf_items has `book_cache_id` FK (may or may not be populated)
- All extraction tables have: `family_id`, `family_member_id`, `bookshelf_item_id`, `audience`, `is_hearted`, `user_note`, `is_included_in_ai`, `is_deleted`, `is_key_point`, `is_from_go_deeper`

### Existing platform_intelligence.book_cache schema
```
id UUID PK
title TEXT
author TEXT
isbn TEXT
genres TEXT[]
tags TEXT[]
ai_summary TEXT
toc JSONB
chunk_count INTEGER
title_author_embedding halfvec(1536)
ethics_gate_status TEXT (exempt/pending/approved/failed)
created_at, updated_at
```

---

## Target Schema

### Rename: `platform_intelligence.book_cache` → `platform_intelligence.book_library`

Add columns to existing table (avoid dropping + recreating since it has 578 rows):
```sql
ALTER TABLE platform_intelligence.book_cache RENAME TO book_library;

ALTER TABLE platform_intelligence.book_library
  ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'none'
    CHECK (extraction_status IN ('none','processing','completed','failed')),
  ADD COLUMN IF NOT EXISTS extraction_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discovered_sections JSONB;
```

### Create: `platform_intelligence.book_chunks`

Platform-level chunks. One copy per book, shared across all families.

```sql
CREATE TABLE IF NOT EXISTS platform_intelligence.book_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_library_id UUID NOT NULL REFERENCES platform_intelligence.book_library(id),
  chunk_index INTEGER NOT NULL,
  chapter_index INTEGER,
  chapter_title TEXT,
  text TEXT NOT NULL,
  embedding halfvec(1536),
  tokens_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### Create: `platform_intelligence.book_extractions`

Unified extractions table. Replaces the 5 family-scoped tables. Contains adult + guided + independent text levels.

```sql
CREATE TABLE IF NOT EXISTS platform_intelligence.book_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_library_id UUID NOT NULL REFERENCES platform_intelligence.book_library(id),
  
  -- Type discriminator
  extraction_type TEXT NOT NULL 
    CHECK (extraction_type IN ('summary','insight','declaration','action_step','question')),
  
  -- Content — 3 text levels
  text TEXT NOT NULL,                    -- Adult level (current behavior)
  guided_text TEXT,                      -- Ages 8-12 (NULL until generated)
  independent_text TEXT,                 -- Ages 13-16 (NULL until generated)
  
  -- Type-specific columns (nullable, only populated for matching type)
  content_type TEXT,                     -- For summaries, insights, action_steps, questions
  declaration_text TEXT,                 -- For declarations only
  style_variant TEXT,                    -- For declarations only
  value_name TEXT,                       -- For declarations only
  richness TEXT,                         -- For declarations only
  
  -- Structural
  section_title TEXT,
  section_index INTEGER,
  sort_order INTEGER DEFAULT 0,
  audience TEXT DEFAULT 'original',      -- Keep for backward compat during migration
  
  -- Flags
  is_key_point BOOLEAN DEFAULT false,
  is_from_go_deeper BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,      -- Soft delete at platform level (admin only)
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### Create: `bookshelf_user_state`

Per-member personal state. Created on-demand ONLY when a member interacts with an extraction.

```sql
CREATE TABLE IF NOT EXISTS bookshelf_user_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  member_id UUID NOT NULL REFERENCES family_members(id),
  extraction_id UUID NOT NULL REFERENCES platform_intelligence.book_extractions(id),
  
  -- Personal state
  is_hearted BOOLEAN DEFAULT false,
  user_note TEXT,
  is_included_in_ai BOOLEAN DEFAULT true,
  
  -- Routing tracking
  sent_to_guiding_stars BOOLEAN DEFAULT false,
  guiding_star_id UUID,
  sent_to_tasks BOOLEAN DEFAULT false,
  task_id UUID,
  sent_to_prompts BOOLEAN DEFAULT false,
  journal_prompt_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE (member_id, extraction_id)
);
```

### Update: `bookshelf_items`

Add `book_library_id` FK. This is how families "have access" to a book.

```sql
ALTER TABLE bookshelf_items 
  ADD COLUMN IF NOT EXISTS book_library_id UUID REFERENCES platform_intelligence.book_library(id);
```

---

## Data Migration

### Step 1: Link bookshelf_items → book_library

Match existing bookshelf_items to book_cache/book_library rows by title+author:
```sql
UPDATE bookshelf_items bi
SET book_library_id = bl.id
FROM platform_intelligence.book_library bl
WHERE lower(bi.title) = lower(bl.title)
  AND bi.book_library_id IS NULL;
```

For any unmatched extracted books, create new book_library entries.

### Step 2: Migrate chunks to platform level

For each book_library entry that has a linked bookshelf_item with chunks:
```sql
INSERT INTO platform_intelligence.book_chunks (book_library_id, chunk_index, chapter_index, chapter_title, text, embedding, tokens_count, created_at)
SELECT DISTINCT ON (bl.id, bc.chunk_index)
  bl.id, bc.chunk_index, bc.chapter_index, bc.chapter_title, bc.text, bc.embedding, bc.tokens_count, bc.created_at
FROM bookshelf_chunks bc
JOIN bookshelf_items bi ON bc.bookshelf_item_id = bi.id
JOIN platform_intelligence.book_library bl ON bi.book_library_id = bl.id;
```

### Step 3: Consolidate extractions to platform level

For each of the 5 extraction tables, insert into book_extractions with the type discriminator:
```sql
-- Summaries
INSERT INTO platform_intelligence.book_extractions 
  (book_library_id, extraction_type, text, content_type, section_title, section_index, sort_order, audience, is_key_point, is_from_go_deeper, is_deleted, created_at)
SELECT bl.id, 'summary', s.text, s.content_type, s.section_title, s.section_index, s.sort_order, s.audience, s.is_key_point, s.is_from_go_deeper, s.is_deleted, s.created_at
FROM bookshelf_summaries s
JOIN bookshelf_items bi ON s.bookshelf_item_id = bi.id
JOIN platform_intelligence.book_library bl ON bi.book_library_id = bl.id;

-- Repeat for insights, declarations (with declaration_text, style_variant, value_name, richness), action_steps, questions
```

### Step 4: Migrate personal state (13 hearted items)

```sql
INSERT INTO bookshelf_user_state (family_id, member_id, extraction_id, is_hearted, user_note, is_included_in_ai, sent_to_guiding_stars, guiding_star_id)
SELECT s.family_id, s.family_member_id, be.id, s.is_hearted, s.user_note, s.is_included_in_ai, 
  COALESCE(s.sent_to_guiding_stars, false), s.guiding_star_id
FROM bookshelf_summaries s
JOIN bookshelf_items bi ON s.bookshelf_item_id = bi.id
JOIN platform_intelligence.book_library bl ON bi.book_library_id = bl.id
JOIN platform_intelligence.book_extractions be 
  ON be.book_library_id = bl.id 
  AND be.extraction_type = 'summary'
  AND be.text = s.text 
  AND COALESCE(be.section_title,'') = COALESCE(s.section_title,'')
WHERE s.is_hearted = true OR s.user_note IS NOT NULL;

-- Repeat for other tables with hearted/noted items
```

### Step 5: Update book_library extraction_status

```sql
UPDATE platform_intelligence.book_library bl
SET extraction_status = 'completed',
    extraction_count = (SELECT count(*) FROM platform_intelligence.book_extractions WHERE book_library_id = bl.id)
WHERE EXISTS (SELECT 1 FROM platform_intelligence.book_extractions WHERE book_library_id = bl.id);
```

---

## RLS Policies

### platform_intelligence.book_library
- **Read:** Any authenticated user can read (books are universal)
- **Write:** Service role only (Edge Functions manage this)

### platform_intelligence.book_chunks
- **Read:** Family members can read chunks WHERE book_library_id IN (SELECT book_library_id FROM bookshelf_items WHERE family_id = member's family AND book_library_id IS NOT NULL)
- **Write:** Service role only

### platform_intelligence.book_extractions
- **Read:** Same as chunks — gated by family's bookshelf_items
- **Write:** Service role only

### bookshelf_user_state
- **Read:** Member can read own. Mom can read family's.
- **Write:** Member can manage own.

---

## Indexes

```sql
-- book_chunks
CREATE INDEX idx_plbc_library ON platform_intelligence.book_chunks(book_library_id);
CREATE INDEX idx_plbc_embedding ON platform_intelligence.book_chunks USING hnsw (embedding halfvec_cosine_ops) WHERE embedding IS NOT NULL;

-- book_extractions  
CREATE INDEX idx_plbe_library ON platform_intelligence.book_extractions(book_library_id);
CREATE INDEX idx_plbe_type ON platform_intelligence.book_extractions(extraction_type);
CREATE INDEX idx_plbe_library_type ON platform_intelligence.book_extractions(book_library_id, extraction_type, section_index, sort_order);
CREATE INDEX idx_plbe_key_points ON platform_intelligence.book_extractions(book_library_id) WHERE is_key_point = true;

-- bookshelf_user_state
CREATE INDEX idx_bus_member ON bookshelf_user_state(member_id);
CREATE INDEX idx_bus_extraction ON bookshelf_user_state(extraction_id);
CREATE INDEX idx_bus_hearted ON bookshelf_user_state(member_id) WHERE is_hearted = true;

-- bookshelf_items
CREATE INDEX idx_bsi_library ON bookshelf_items(book_library_id) WHERE book_library_id IS NOT NULL;
```

---

## Updated RPCs

### match_bookshelf_chunks → match_book_chunks
Update to query `platform_intelligence.book_chunks` instead of family-scoped table.

### match_bookshelf_extractions → match_book_extractions  
Update to query `platform_intelligence.book_extractions` instead of 5 family-scoped tables.

---

## What This Phase Does NOT Do

- Does NOT modify any Edge Functions (Phase 3)
- Does NOT modify any frontend code (Phase 2)
- Does NOT drop old tables (Phase 4 — after frontend is verified on new tables)
- Does NOT generate guided_text/independent_text (Phase 3 — backfill)
- Does NOT wire the cache hit/miss in bookshelf-process (Phase 3)
- Old tables remain functional as fallback until Phase 2 completes

---

## Verification

After migration:
1. `platform_intelligence.book_library` has 559+ books — 228 with extraction_status='completed', 331 with 'none'
2. `platform_intelligence.book_chunks` row count matches `bookshelf_chunks` (58,115 — covers all 559 books)
3. `platform_intelligence.book_extractions` row count matches sum of 5 tables (88,474 — from the 228 extracted books)
4. `bookshelf_user_state` has rows for all 13 hearted items
5. `bookshelf_items.book_library_id` populated for all extracted books
6. RLS: authenticated user can read extractions for books their family owns
7. RLS: member can create/update own user_state rows
8. RPCs: match_book_chunks and match_book_extractions return correct results
