# Feature Decision File: PRD-23 — BookShelf Platform Library (Phase 1: Schema + Data Migration)

> **Created:** 2026-04-03
> **PRD:** `prds/ai-vault/PRD-23-BookShelf.md`
> **Spec:** `specs/BookShelf-Platform-Library-Phase1-Spec.md`
> **Addenda read:**
>   - `prds/addenda/PRD-23-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-23-Session-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
> **Founder approved:** 2026-04-03

---

## What Is Being Built

Phase 1 migrates BookShelf from family-scoped storage to platform-level storage. Books, chunks, and extractions become universal knowledge stored once in `platform_intelligence`, shared across all families. Personal state (hearts, notes, AI inclusion) moves to a new `bookshelf_user_state` table. This is database-only — no frontend or Edge Function changes.

---

## Screens & Components

**None.** This is a pure database migration phase. No UI changes.

---

## Data Discovery (Verified from Live DB 2026-04-03)

### The 559 bookshelf_items breakdown

| Category | Count | Description |
|---|---|---|
| Standalone books | 348 | Single item, own chunks + extractions |
| Parent books | 33 | Container with clean title, `part_count` > 1 |
| Child parts | 178 | Linked via `parent_bookshelf_item_id`, each has `part_number` |
| **Total** | **559** | All have `book_cache_id` populated (zero NULLs) |

### Multi-part book structure

33 books were split into 2-9 parts during upload. Each parent and each child has its own `book_cache_id` (all 559 unique). Chunks and extractions are distributed inconsistently:

| Pattern | Example | Parent chunks | Child chunks | Count |
|---|---|---|---|---|
| Parent has chunks, children have none | Critical Thinking (361 chunks) | Yes | 0 | ~some |
| Both parent AND children have chunks (duplicated) | Your Forces (699 parent + 602 child) | Yes | Yes | ~some |
| Neither has chunks | Actionable Gamification, Design of Everyday Things | 0 | 0 | ~some |

**Extractions always live on CHILD items, not parents.** Verified: parent "Your Forces" has 0 summaries; child part 2 has 160 summaries.

### Extraction column inventory (from live DB)

| Table | Columns | Routing columns |
|---|---|---|
| bookshelf_summaries (19 cols) | id, family_id, family_member_id, bookshelf_item_id, section_title, section_index, content_type, text, sort_order, audience, is_key_point, is_hearted, is_deleted, is_from_go_deeper, user_note, is_included_in_ai, embedding, created_at, updated_at | None |
| bookshelf_insights (20 cols) | Same base + `is_user_added` | None |
| bookshelf_declarations (23 cols) | Same base + value_name, declaration_text, style_variant, richness | `sent_to_guiding_stars`, `guiding_star_id` |
| bookshelf_action_steps (21 cols) | Same base | `sent_to_tasks`, `task_id` |
| bookshelf_questions (23 cols) | Same base | `sent_to_prompts`, `journal_prompt_id`, `sent_to_tasks`, `task_id` |

### Row counts and personal state

| Table | Rows | Hearted |
|---|---|---|
| bookshelf_items | 559 | — |
| bookshelf_chunks | 58,115 | — |
| bookshelf_summaries | 21,538 | 2 |
| bookshelf_insights | 23,977 | 7 |
| bookshelf_declarations | 16,931 | 4 |
| bookshelf_action_steps | 16,134 | 0 |
| bookshelf_questions | 9,894 | 0 |
| platform_intelligence.book_cache | 578 | — |
| bookshelf_discussions | 4 | — |
| bookshelf_discussion_messages | 9 | — |
| bookshelf_collections | 15 | — |
| bookshelf_collection_items | 83 | — |
| journal_prompts | 2 | — |
| bookshelf_member_settings | 3 | — |

- **Extraction status:** 228 completed, 331 none
- **User notes:** 0
- **Distinct families:** 1

### bookshelf_items columns (32, from live DB)
`id, family_id, uploaded_by_member_id, title, author, isbn, file_type, file_name, storage_path, text_content, file_size_bytes, genres, tags, folder_group, processing_status, processing_detail, extraction_status, chunk_count, intake_completed, ai_summary, toc, discovered_sections, book_cache_id, title_author_embedding, parent_bookshelf_item_id, part_number, part_count, last_viewed_at, archived_at, created_at, updated_at, folder_id`

### bookshelf_chunks columns (10, from live DB)
`id, book_cache_id, chunk_index, chunk_text, token_count, chapter_title, chapter_index, embedding, metadata, created_at`

Note: spec calls the text column `text` but live DB has `chunk_text`. Token column is `token_count` not `tokens_count`.

---

## Key Decisions

### 1. Multi-part consolidation (Founder-approved)

Each parent book maps to ONE `book_library` entry. All child parts' chunks and extractions consolidate under the parent's `book_library_id`.

**How it works:**
- 348 standalone books → 348 book_library entries (1:1 with their book_cache entry)
- 33 parent books → 33 book_library entries (using the parent's book_cache entry)
- 178 child parts → `book_library_id` points to PARENT's book_library entry, not their own
- Child parts' chunks migrate to `platform_intelligence.book_chunks` with `book_library_id` = parent's ID
- Child parts' extractions migrate to `platform_intelligence.book_extractions` with `book_library_id` = parent's ID
- Chunk ordering within the consolidated book uses `(part_number * 10000) + chunk_index` to maintain correct sequence across parts
- ~19 orphan book_cache entries (578 - 559) remain in book_library but with no linked bookshelf_items

**Migration logic:**
```
For each bookshelf_item:
  IF parent_bookshelf_item_id IS NULL:
    book_library_id = own book_cache_id  (standalone or parent)
  ELSE:
    book_library_id = parent's book_cache_id  (child → parent)
```

### 2. Add `book_library_id`, keep `book_cache_id`

New column `book_library_id` on `bookshelf_items`. Existing `book_cache_id` stays untouched for backward compatibility. Frontend and old RPCs continue using `book_cache_id`. New RPCs use `book_library_id`. Phase 4 drops `book_cache_id`.

### 3. Copy chunks to new table (not view)

58K chunks copied to `platform_intelligence.book_chunks`. Rationale: HNSW indexes can't be created on views. New table lives in correct schema. Old `bookshelf_chunks` stays functional. Temporary duplication (~175MB) until Phase 4 drops old table.

### 4. Disable embedding triggers during bulk migration

88K extractions + 58K chunks would overwhelm the embedding queue. Migration copies existing embeddings directly. Triggers enabled after migration for future inserts only.

### 5. bookshelf_chunks column name mapping

| Live DB (bookshelf_chunks) | New table (book_chunks) | Notes |
|---|---|---|
| `chunk_text` | `text` | Spec uses `text` |
| `token_count` | `tokens_count` | Spec uses `tokens_count` |
| `book_cache_id` | `book_library_id` | FK target renamed |
| `metadata` | — | Not in spec; drop during migration |

### 6. Routing columns move to bookshelf_user_state

Old per-extraction routing columns → new per-user-state routing columns:

| Old column (on extraction table) | New column (on bookshelf_user_state) |
|---|---|
| declarations.sent_to_guiding_stars | sent_to_guiding_stars |
| declarations.guiding_star_id | guiding_star_id |
| action_steps.sent_to_tasks | sent_to_tasks |
| action_steps.task_id | task_id |
| questions.sent_to_prompts | sent_to_prompts |
| questions.journal_prompt_id | journal_prompt_id |
| questions.sent_to_tasks | sent_to_tasks |
| questions.task_id | task_id |

Only 13 hearted items need user_state rows. 0 items have routing flags set (verified).

### 7. Old tables stay functional

No drops, no FK changes, no breaking changes. Frontend continues reading old tables until Phase 2.

---

## Addendum Rulings

### From PRD-23-Cross-PRD-Impact-Addendum.md:
- BookShelf extraction tables participate in context assembly pipeline
- `match_by_embedding` searches against BookShelf extractions
- Channel E (Book Knowledge Library) uses `book_cache` for platform-level caching
- New RPCs needed for the platform-level tables

### From PRD-23-Session-Addendum.md:
- `audience` column on all 5 extraction tables — preserved in unified table
- `is_key_point` column on all 5 extraction tables — preserved in unified table
- Study guides stored with `audience = 'study_guide_{memberId}'` — unified table supports this
- `bookshelf_member_settings` columns (library_sort, etc.) — not affected by this phase

### From PRD-Audit-Readiness-Addendum.md:
- `bookshelf_insights` is the confirmed table name (not bookshelf_frameworks/principles)
- All audit rulings already applied in existing schema

---

## Schema Diff: What Changes

### Rename
- `platform_intelligence.book_cache` → `platform_intelligence.book_library`

### New columns on `platform_intelligence.book_library`
- `extraction_status TEXT DEFAULT 'none'` (CHECK: none/processing/completed/failed)
- `extraction_count INTEGER DEFAULT 0`
- `discovered_sections JSONB`

### New table: `platform_intelligence.book_chunks`
- book_library_id, chunk_index, chapter_index, chapter_title, text, embedding, tokens_count
- Multi-part books: all parts' chunks consolidated under parent's book_library_id

### New table: `platform_intelligence.book_extractions`
- Unified: book_library_id, extraction_type, text, guided_text, independent_text, content_type, declaration_text, style_variant, value_name, richness, section_title, section_index, sort_order, audience, is_key_point, is_from_go_deeper, is_deleted
- Multi-part books: all parts' extractions consolidated under parent's book_library_id

### New table: `bookshelf_user_state`
- family_id, member_id, extraction_id (FK book_extractions), is_hearted, user_note, is_included_in_ai, routing flags
- UNIQUE(member_id, extraction_id)

### New column on `bookshelf_items`
- `book_library_id UUID` FK to `platform_intelligence.book_library(id)`

### New RPCs
- `match_book_chunks` — queries platform_intelligence.book_chunks
- `match_book_extractions` — queries platform_intelligence.book_extractions + bookshelf_user_state

---

## Stubs (NOT Building This Phase)

- No Edge Function changes (Phase 3)
- No frontend changes (Phase 2)
- No old table drops (Phase 4)
- No guided_text/independent_text generation (Phase 3 backfill)
- No bookshelf-process cache hit/miss wiring (Phase 3)
- No chunk deduplication for multi-part overlap (Phase 4 cleanup)

---

## Post-Build Verification (2026-04-03)

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | book_library renamed from book_cache with new columns | **Wired** | 578 rows, extraction_status + extraction_count + discovered_sections added |
| 2 | book_chunks created + populated | **Wired** | 56,700 rows (1,415 orphan chunks correctly excluded) |
| 3 | book_extractions created + populated | **Wired** | 88,474 rows (21538 + 23977 + 16931 + 16134 + 9894) |
| 4 | bookshelf_user_state created + populated | **Wired** | 13 rows for all hearted items |
| 5 | bookshelf_items.book_library_id populated | **Wired** | 559 linked, 0 null |
| 6 | Multi-part consolidation | **Wired** | Children's book_library_id = parent's book_cache_id (verified) |
| 7 | RLS on book_chunks + book_extractions | **Wired** | Family-gated via bookshelf_items.book_library_id |
| 8 | RLS on bookshelf_user_state | **Wired** | Member own + mom reads family |
| 9 | match_book_chunks RPC | **Wired** | Queries platform_intelligence.book_chunks |
| 10 | match_book_extractions RPC | **Wired** | Queries book_extractions + LEFT JOIN user_state |
| 11 | Embedding trigger on book_extractions | **Wired** | Fires on future inserts only (not migration data) |
| 12 | Old tables remain functional | **Wired** | No drops, old RPCs unchanged |
| 13 | TypeScript check | **Wired** | `tsc -b` zero errors |

### Migration Files
- `00000000100090_bookshelf_platform_library.sql` — DDL + RLS + indexes + bookshelf_items link
- `00000000100091_bookshelf_platform_data_migration.sql` — Batched data migration (600s timeout, per-book loops)
- `00000000100092_bookshelf_platform_rpcs.sql` — RPCs + embedding trigger

### Chunk Count Variance
58,115 old chunks → 56,700 new. Delta of 1,415 are orphan chunks belonging to 19 `book_cache` entries that have no `bookshelf_item`. These are legacy/test data with no family ownership — correctly excluded.
