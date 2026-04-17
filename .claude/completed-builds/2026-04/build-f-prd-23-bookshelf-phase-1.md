# Build F: PRD-23 BookShelf Platform Library (Phase 1: Schema + Data Migration) — COMPLETED

### PRD Files
- `prds/ai-vault/PRD-23-BookShelf.md` (full PRD)
- `specs/BookShelf-Platform-Library-Phase1-Spec.md` (founder-approved architecture spec)

### Addenda Read
- `prds/addenda/PRD-23-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-23-Session-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-23-BookShelf-Platform-Library-Phase1.md`

---

### Pre-Build Summary

#### Context
BookShelf currently stores chunks, embeddings, and extractions at the family level — 5 separate extraction tables each with `family_id` and `family_member_id`. Every family uploading the same book pays full AI cost again (~$1-2/book). The correct architecture: books, chunks, and extractions live at the platform level in `platform_intelligence`. Personal state (hearts, notes) moves to `bookshelf_user_state`, created on-demand per member.

This is Phase 1 of 5: database-only. Create new tables, migrate existing data, set up RLS, update RPCs. No Edge Function or frontend changes.

#### Current Data State (Verified from live DB 2026-04-03)

| Table | Rows | Notes |
|---|---|---|
| bookshelf_items (total) | 559 | 348 standalone + 33 parents + 178 child parts |
| bookshelf_items (extracted) | 228 | extraction_status='completed' |
| bookshelf_items (chunked only) | 331 | extraction_status='none' |
| bookshelf_chunks | 58,115 | Platform-level via book_cache_id |
| bookshelf_summaries | 21,538 | 2 hearted |
| bookshelf_insights | 23,977 | 7 hearted |
| bookshelf_declarations | 16,931 | 4 hearted |
| bookshelf_action_steps | 16,134 | 0 hearted |
| bookshelf_questions | 9,894 | 0 hearted |
| platform_intelligence.book_cache | 578 | 19 more than bookshelf_items (orphans) |
| bookshelf_discussions | 4 | 9 messages |
| bookshelf_collections | 15 | 83 items |
| journal_prompts | 2 | |
| bookshelf_member_settings | 3 | |

- **Hearted items:** 13 total (0 user notes, 0 routing flags set)
- **book_cache_id:** populated for ALL 559 items (zero NULLs), 559 distinct values
- **Distinct families:** 1

#### Multi-Part Book Structure (33 parents, 178 children)

33 books were split into 2-9 parts during upload. Parent row has clean title + `part_count`. Child rows have `parent_bookshelf_item_id` + `part_number`. Each has its own unique `book_cache_id`.

**Chunk storage is inconsistent across multi-part books:**
- Some parents have chunks, children don't (e.g., Critical Thinking: 361 parent chunks)
- Some have BOTH duplicated (e.g., Your Forces: 699 parent + 602 child)
- Some have neither (e.g., Actionable Gamification: 0 on both)
- **Extractions always live on CHILD items, not parents** (verified: parent has 0 summaries, child part 2 has 160)

**Founder-approved consolidation decision:** Each parent maps to ONE book_library entry. All child parts' chunks + extractions consolidate under the parent's book_library_id.

#### Dependencies Already Built
- `platform_intelligence.book_cache` table (578 rows, title_author_embedding, ethics_gate_status)
- `bookshelf_items` table (32 cols) with `book_cache_id` FK, `parent_bookshelf_item_id`, `part_number`, `part_count`
- `bookshelf_chunks` table (10 cols: id, book_cache_id, chunk_index, chunk_text, token_count, chapter_title, chapter_index, embedding, metadata, created_at)
- 5 extraction tables — routing columns only on declarations (sent_to_guiding_stars, guiding_star_id), action_steps (sent_to_tasks, task_id), questions (sent_to_prompts, journal_prompt_id, sent_to_tasks, task_id). Summaries and insights have NO routing columns.
- `match_bookshelf_chunks` + `match_bookshelf_extractions` RPCs
- Embedding pipeline (util.queue_embedding_job triggers on all extraction tables)
- Study guide components + Edge Function stub (not affected by Phase 1)

#### Dependencies NOT Yet Built
- `platform_intelligence.book_library` (renamed from book_cache — this phase)
- `platform_intelligence.book_chunks` (new — this phase)
- `platform_intelligence.book_extractions` (new unified table — this phase)
- `bookshelf_user_state` (new — this phase)
- `match_book_chunks` + `match_book_extractions` RPCs (new — this phase)

#### Build Items (Phase 1 — 8 items)

**1. Migration 00000000100090_bookshelf_platform_library.sql**
- Rename `platform_intelligence.book_cache` → `platform_intelligence.book_library`
- Add columns: extraction_status, extraction_count, discovered_sections
- Create `platform_intelligence.book_chunks` (book_library_id, chunk_index, chapter_index, chapter_title, text, embedding, tokens_count)
- Create `platform_intelligence.book_extractions` unified table
  - extraction_type discriminator (summary/insight/declaration/action_step/question)
  - 3 text levels: text, guided_text, independent_text
  - Type-specific nullable columns: content_type, declaration_text, style_variant, value_name, richness
  - Flags: is_key_point, is_from_go_deeper, is_deleted, audience
- Create `bookshelf_user_state` (family_id, member_id, extraction_id, is_hearted, user_note, is_included_in_ai, routing flags, UNIQUE(member_id, extraction_id))
- Add `book_library_id` column to `bookshelf_items`
- RLS + indexes + HNSW embedding indexes + updated_at triggers

**2. Data migration: Link bookshelf_items → book_library (multi-part consolidation)**
- Standalone + parent items: `book_library_id = book_cache_id` (direct 1:1)
- Child parts: `book_library_id = parent's book_cache_id` (consolidate under parent)
- Covers ALL 559 items

**3. Data migration: Chunks to platform level**
- Copy bookshelf_chunks → platform_intelligence.book_chunks
- For multi-part children: remap book_cache_id → parent's book_library_id
- For multi-part chunk ordering: `(part_number * 10000) + chunk_index` preserves sequence
- Preserve embeddings (no re-embedding); disable trigger during bulk insert
- Column mapping: chunk_text → text, token_count → tokens_count, metadata dropped

**4. Data migration: Extractions to platform level**
- Consolidate 5 tables → platform_intelligence.book_extractions
- For multi-part children: remap via bookshelf_item → parent's book_library_id
- Map extraction_type from source table name
- Map type-specific columns (declaration_text, style_variant, value_name, richness)
- **CRITICAL:** Disable embedding triggers during bulk insert to avoid 88K re-embedding jobs

**5. Data migration: Personal state (13 hearted items)**
- Create bookshelf_user_state rows for all 13 hearted items
- Match old extraction rows → new book_extractions rows by text + section_title + extraction_type
- Preserve routing flags (all currently false/null but schema supports them)

**6. Update book_library extraction_status**
- Set extraction_status='completed' and extraction_count for books with extractions
- Multi-part parents: sum extraction counts across all child parts

**7. New RPCs: match_book_chunks + match_book_extractions**
- `match_book_chunks`: queries platform_intelligence.book_chunks, filtered by family's bookshelf_items.book_library_id
- `match_book_extractions`: queries platform_intelligence.book_extractions LEFT JOIN bookshelf_user_state for personal state

**8. Verification queries**
- Row count validation (chunks, extractions, user_state)
- Multi-part consolidation check (parent book_library entries have correct counts)
- RLS check (authenticated read, service write)
- RPC smoke test

### Stubs (NOT Building This Phase)
- Edge Function changes (Phase 3)
- Frontend code changes (Phase 2)
- Old table drops (Phase 4)
- guided_text/independent_text generation (Phase 3 backfill)
- bookshelf-process cache hit/miss wiring (Phase 3)
- Multi-part chunk deduplication (Phase 4 cleanup)

### Key Decisions
1. **Multi-part consolidation** — 33 parent books each map to ONE book_library entry. 178 child parts' chunks + extractions consolidate under parent's book_library_id. Chunk ordering preserved via `(part_number * 10000) + chunk_index`.
2. **Add book_library_id, keep book_cache_id** — new column for new RPCs, old column stays for backward compat. Phase 4 drops book_cache_id.
3. **Copy chunks to new PI table** — HNSW indexes can't be built on views. ~175MB temporary duplication until Phase 4.
4. **Disable embedding triggers during bulk migration** — 88K extractions + 58K chunks would overwhelm queue. Existing embeddings copied directly.
5. **Column name mapping** — bookshelf_chunks.chunk_text → book_chunks.text, token_count → tokens_count, metadata dropped.
6. **Old tables stay functional** — no drops, no FK changes. Frontend continues on old tables until Phase 2.
7. **bookshelf_user_state on-demand only** — 13 rows created for hearted items; future hearts create rows on demand.

---

