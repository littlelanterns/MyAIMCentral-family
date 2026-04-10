# Feature Decision File: PRD-23 — BookShelf Platform Library (Phase 1b: Complete the Platform Migration)

> **Created:** 2026-04-08
> **PRD:** `prds/ai-vault/PRD-23-BookShelf.md`
> **Parent Spec:** `specs/BookShelf-Platform-Library-Phase1-Spec.md`
> **Predecessor:** `claude/feature-decisions/PRD-23-BookShelf-Platform-Library-Phase1.md` (Build F, 2026-04-03)
> **Addenda read:**
>   - `prds/addenda/PRD-23-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-23-Session-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
>   - `prds/addenda/PRD-Template-and-Audit-Updates.md`
> **Founder decisions locked in:** 2026-04-08 (Sub-phase 1b-A approval pending fresh-session pre-build presentation)
> **Phase 1b runs BEFORE Build M** (PRD-24/PRD-26 Play Dashboard) — founder ordering confirmed 2026-04-08

---

## Founder Decisions — Locked In 2026-04-08

These decisions are final and must not be re-opened during any sub-phase. The fresh-session Claude Code instance that runs each sub-phase reads this block FIRST.

1. **Cache-hit threshold is title+author embedding similarity only. ISBN is NOT used.** Similarity ≥ 0.9 = clone (cache hit). 0.8 ≤ similarity < 0.9 = uncertain, fresh extraction, NEW cache entry. < 0.8 = different book. Same title/author at ≥ 0.9 shares cache *even if ISBN differs*. Rationale: different editions of the same book are mostly the same content — the whole point of cache sharing.
2. **Dual-write strategy runs through all of Phase 1b.** Every Edge Function that writes BookShelf data writes to BOTH old per-family tables AND the new platform tables from Sub-phase 1b-B onward. Dual-writes stop only at Sub-phase 1b-F with explicit founder approval. Old tables drop in Phase 1c after a 30-day soak.
3. **Sub-phase approval gating.** Founder approves each of the six sub-phases (1b-A → 1b-F) before the next one starts. Each sub-phase ends at a `tsc -b` clean checkpoint plus a defined verification gate.
4. **Book assignment RPC is CUT. Replaced with 4 documented SQL scripts in `docs/bookshelf-bulk-assign/`.** Scope locked 2026-04-08.
   - **Architecture confirmation:** The platform holds exactly one copy of each book's data — chunks, extractions, embeddings all live in `platform_intelligence.*`. Each family gets `bookshelf_items` row(s) that act as pointers to the shared `book_library` entry. Personal curation (hearts, notes, hide state) is stored per-member in `bookshelf_user_state`, which already exists and was populated in Phase 1 with 13 rows. **Assignment is a pointer-create operation — nothing gets copied, no data is duplicated, no AI costs are re-incurred.** The `bookshelf_user_state` rows for a newly-assigned member are created on-demand the first time they heart/hide/annotate — no pre-seeding needed.
   - **The 4 scripts:**
     1. `docs/bookshelf-bulk-assign/by-collection.sql` — assign every book in a given collection to a target family. Parameters: `:target_family_id`, `:source_collection_id`.
     2. `docs/bookshelf-bulk-assign/by-tag.sql` — assign every book tagged with `:tag_name` (across any family's library) to the target family. Parameters: `:target_family_id`, `:tag_name`.
     3. `docs/bookshelf-bulk-assign/by-title-list.sql` — assign a specific list of books by title (or bookshelf_item_id) to the target family. Parameters: `:target_family_id`, `:title_list` (array or temp table).
     4. `docs/bookshelf-bulk-assign/from-source-family.sql` — clone-a-family. Assign every non-archived book that `:source_family_id` has to `:target_family_id`. Parameters: `:target_family_id`, `:source_family_id`.
   - **Shared conventions across all 4 scripts:**
     - **Dry-run default:** Every script starts with `\set DRY_RUN true` (or equivalent). When DRY_RUN is true, the script prints the full list of books that WOULD be assigned — title, author, source, target `bookshelf_items.id` if one would be created — then exits WITHOUT inserting. Flip to `\set DRY_RUN false` to execute.
     - **Silent skip on duplicates:** If the target family already has a `bookshelf_items` row pointing at the same `book_library_id` (regardless of archived state? TBD — my recommendation is active rows only), the script skips silently. No error, no warning, no count inflation.
     - **Before/after row counts:** Every script prints `COUNT(*) FROM bookshelf_items WHERE family_id = :target_family_id AND archived_at IS NULL` before and after execution.
     - **Sample titles:** Every script prints up to 10 sample titles from the assignment set (ORDER BY title).
     - **Atomic transaction:** All assignment work wrapped in a `BEGIN` / `COMMIT` so a mid-script failure rolls back cleanly.
     - **No writes to `bookshelf_user_state`** — personal curation is created on-demand when the assigned member first interacts with a book.
   - **Exact scope of data the scripts write:** Only `INSERT INTO bookshelf_items(...)` rows with `family_id = :target_family_id`, `book_library_id = (existing)`, `uploaded_by_member_id = :assigning_member_id` (a parameter on every script), `extraction_status = 'completed'`, `processing_status = 'completed'`, `intake_completed = true`, `chunk_count` copied from `book_library`, and the title/author copied from `book_library` too. No other tables touched.
   - **Script implementation happens in Sub-phase 1b-C, AFTER the per-row relink migration.** No database migration for the scripts themselves — they are docs.
5. **Go Deeper stub is SKIPPED.** Go Deeper will keep silently dropping Sonnet output until Sub-phase 1b-B lands the `bookshelf-extract` persistence rewire. No temporary "under repair" stub. Founder will manually avoid clicking Go Deeper between now and 1b-B. Acceptable because only the founder has access during beta.
6. **No new book uploads since 2026-03-31.** Answer to audit Open Question #1. Relink migration in Sub-phase 1b-C will be clean (no stuck rows to triage).
7. **Embed polling budget is shared** between old per-family tables and new platform tables on the same pg_cron schedule as today. Revisit only if backlog appears.
8. **Context-assembler access-level enum alignment:** `'hearted_only' | 'all' | 'insights_only' | 'none'` per PRD-23. Fix the `get_bookshelf_context` RPC in Sub-phase 1b-E — not this sub-phase.
9. **Phase 1b runs before Build M** (Play Dashboard + Sticker Book). BookShelf is foundational infrastructure and is actively blocking new book uploads; Build M is a user-facing feature build that can wait.

---

## What Is Being Built

Phase 1b finishes the BookShelf platform migration that Phase 1 started but left half-done. Phase 1 created the `platform_intelligence.book_library / book_chunks / book_extractions / bookshelf_user_state` tables and migrated the existing 559 books' content into them — but the write paths were never rewired, the `embedding` column was never created on `book_extractions`, the cache-hit logic that is the whole economic justification for the platform layer was never built, and six consumers (Edge Functions + context assembler) still read from the OLD per-family tables. Phase 1b adds the embedding column + backfill, rewires the full write path (bookshelf-process + bookshelf-extract), builds the cache-hit mechanism, ships a book-assignment RPC, migrates all remaining consumers to the platform RPCs, and rewires the LiLa context assembler. After Phase 1b, `platform_intelligence.*` is the single source of truth for BookShelf reads and writes. The old per-family tables get marked deprecated for a 30-day soak; drops happen in Phase 1c.

Nothing in this phase is user-facing in the usual sense — no new screens, no new modals, no redesigned pages. It is an infrastructure completion. From the founder's perspective, the visible payoffs are:

1. Morning Insight starts surfacing matches from her library (because the embedding column finally exists and `match_book_extractions` finally works).
2. Go Deeper in ExtractionBrowser stops silently burning Sonnet tokens (because the extraction output actually gets persisted).
3. New book uploads can hit a pre-existing book in `book_library` and short-circuit instantly at zero AI cost — the cross-family sharing vision.
4. A second family can be granted access to an already-extracted book via a documented bulk-assignment SQL script (per founder decision 2026-04-08) without re-uploading or re-extracting. The previously-proposed `assign_book_to_family` RPC was cut in favor of a collection/tag-based SQL script.

---

## Screens & Components

**No new screens. No new modals. No new user-facing surfaces.**

The only frontend change is a one-line fix to [ExtractionBrowser.tsx](src/components/bookshelf/ExtractionBrowser.tsx) `handleGoDeeper` so it picks up the newly-persisted extractions after calling `bookshelf-extract`. The rest of the work is:

- 1 new database migration (embedding column + backfill + HNSW index)
- 1 new database migration (relink + assignment RPC)
- ~8 new SECURITY DEFINER RPCs for Edge Function read/write access to `platform_intelligence.*`
- Rewrites of 6 Edge Functions (`bookshelf-process`, `bookshelf-extract`, `bookshelf-search`, `bookshelf-discuss`, `bookshelf-key-points`, `bookshelf-study-guide`)
- Rewrite of `_shared/context-assembler.ts` `loadBookShelfContext()` function
- Extension of `embed` Edge Function to process platform tables

---

## Confirmed Findings From Pre-Build Audit (2026-04-08)

The audit verified every claim and uncovered four additional gaps. Each finding is cited with exact file paths and line numbers.

### Finding 1 — `platform_intelligence.book_extractions` has NO `embedding` column

Worse than "embeddings were never copied." The column was never created, and the `match_book_extractions` RPC references a column that does not exist.

- [00000000100090_bookshelf_platform_library.sql:86-119](supabase/migrations/00000000100090_bookshelf_platform_library.sql) — `CREATE TABLE book_extractions` enumerates 18 columns. **No `embedding` column.**
- [claude/live_schema.md:2427-2451](claude/live_schema.md) — Live database confirms 20 columns (18 + `source_part_number` + `is_hidden` added later). Still no embedding.
- [00000000100092_bookshelf_platform_rpcs.sql:96, 110, 113](supabase/migrations/00000000100092_bookshelf_platform_rpcs.sql) — The `match_book_extractions` RPC references `be.embedding` three times. Every call has been throwing "column does not exist" at runtime since Phase 1 shipped.
- [MorningInsightSection.tsx:306-352](src/components/rhythms/sections/MorningInsightSection.tsx) — The only caller wraps everything in `try { ... } catch { return [] }` so the error is invisible. Silent bandaid masking a structural bug.

### Finding 1a — `util.queue_embedding_job()` is a no-op stub

Discovered during audit. The whole queue-based embedding pipeline that Phase 1 relied on is fictional.

- [00000000000029_fix_pgmq_permissions.sql:9-20](supabase/migrations/00000000000029_fix_pgmq_permissions.sql) — `util.queue_embedding_job()` was reduced to `PERFORM 1; -- no-op for now — pgmq not configured yet`. The trigger fires and does nothing.
- The actual embedding pipeline is the polling-based `embed` Edge Function ([embed/index.ts:27-85](supabase/functions/embed/index.ts)), not pgmq. It polls every 10 seconds via pg_cron. This was the "massive embedding session" the founder remembered — it's been running continuously against the OLD per-family tables, which is why they have populated embeddings. The founder's memory was correct; I misread which pipeline does the work.

### Finding 2 — Write paths never touch the platform table

**2a. `bookshelf-process` writes only to OLD per-family tables and never sets `book_library_id`.**
- [bookshelf-process/index.ts](supabase/functions/bookshelf-process/index.ts) — grep for `platform_intelligence|book_library|book_extractions|book_chunks|book_cache` returns **zero matches** across 1549 lines.
- Lines 333-335: chapter inserts → `bookshelf_chapters` (old).
- Lines 358-369: chunk inserts → `bookshelf_chunks` (old).
- Lines 803-893: `runClassification` updates `bookshelf_items` only. Never computes `title_author_embedding`, never writes to `book_library`.

**2b. `bookshelf-extract` has no write code at all.**
- [bookshelf-extract/index.ts](supabase/functions/bookshelf-extract/index.ts) — grep for `.insert(|.upsert(|.rpc(` returns **zero matches**. Only three SELECT calls (lines 719, 747, 906).
- Line 1039-1042 and 1146-1149: the function returns `JSON.stringify({ extraction_type, result: resultObj })` to the caller and that's it.
- [ExtractionBrowser.tsx:264](src/components/bookshelf/ExtractionBrowser.tsx) — the caller does `if (resp.ok) await refetch()`. **Never reads `resp.json()`, never persists.**

Go Deeper has been silently dropping every Sonnet extraction since the day it was wired. The `ai_usage_log` will show non-zero `bookshelf_extract` rows from all those wasted calls.

### Finding 3 — No cache-hit logic on upload

- [bookshelf-process/index.ts:803-894](supabase/functions/bookshelf-process/index.ts) — `runClassification` is the only function touching title/author. It updates `bookshelf_items.title/author/genres/tags/ai_summary` and stops. There is no OpenAI embedding of `title + " by " + author`, no query against `book_library` for similar entries, no cache-hit branch.
- [PRD-23:252-261, 1086-1107](prds/ai-vault/PRD-23-BookShelf.md) — cache-hit is specified in the PRD. It is not implemented. Every upload pays full processing cost; no cross-family sharing happens.

### Finding 4 — No book-assignment mechanism

- There is no RPC, Edge Function, or hook that creates a `bookshelf_items` row for family B that points at an existing `book_library_id`. The data shape supports it; the action doesn't exist.
- For founder beta testing of the cache-hit path without a second real family, a **documented SQL script for collection/tag-based bulk assignment** is the mechanism (per founder decision 2026-04-08). The previously-audit-proposed `assign_book_to_family` per-book RPC is cut. The script is invoked manually via psql or Supabase SQL editor and lives in `docs/`.

### Finding 5 — `embed` Edge Function does not know about `platform_intelligence.book_extractions`

- [embed/index.ts:27-85](supabase/functions/embed/index.ts) — `TABLE_CONFIG` enumerates OLD per-family tables only.
- `processBookCache` at [embed/index.ts:179-219](supabase/functions/embed/index.ts) handles the `book_library` table (via the RPCs `get_unembedded_book_cache` + `update_book_cache_embedding`) but only for `title_author_embedding` on the book library row itself — not for the (nonexistent) `embedding` column on `book_extractions`.
- The PostgREST `.from()` API cannot reach `platform_intelligence` schema, so extending TABLE_CONFIG isn't enough. Phase 1b must add new SECURITY DEFINER RPCs (`get_unembedded_book_extractions`, `update_book_extraction_embedding`, etc.) AND new `processBookExtractions` / `processBookChunks` functions modeled on `processBookCache`.

### Finding 6 — Multiple Edge Functions still query OLD per-family tables

**6a. `bookshelf-search`** — [bookshelf-search/index.ts:91, 107](supabase/functions/bookshelf-search/index.ts) calls the old RPCs `match_bookshelf_chunks` + `match_bookshelf_extractions` from [00000000100066_prd23_bookshelf_search_rpcs.sql](supabase/migrations/00000000100066_prd23_bookshelf_search_rpcs.sql). They UNION ALL across the 5 old per-family tables.

**6b. `bookshelf-discuss`** — [bookshelf-discuss/index.ts:304-444](supabase/functions/bookshelf-discuss/index.ts) has 5 direct queries against the old per-family tables. Lines 451-460 and 486-498 use the old RPCs.

**6c. `bookshelf-key-points`** — [bookshelf-key-points/index.ts:25-31](supabase/functions/bookshelf-key-points/index.ts) `EXTRACTION_TABLES` constant lists OLD tables. Lines 58-66, 82-85, 142-146, 149-152, 161-163: all reads and writes to OLD tables.

**6d. `bookshelf-study-guide`** — [bookshelf-study-guide/index.ts:109-132, 250](supabase/functions/bookshelf-study-guide/index.ts) reads + deletes + inserts all go to OLD tables. Study guides use `audience = 'study_guide_{memberId}'` but write to the wrong tables.

**6e. `_shared/context-assembler.ts` `loadBookShelfContext`** — [context-assembler.ts:411-489](supabase/functions/_shared/context-assembler.ts) reads from `bookshelf_summaries / insights / declarations / action_steps` directly. A `get_bookshelf_context` RPC already exists in [00000000100094:190-241](supabase/migrations/00000000100094_bookshelf_phase2_frontend_rpcs.sql) and queries the platform tables correctly — but it is **never called**. Grep confirms zero callers in src/ or supabase/functions/.

### Finding 7 — `useBookUpload` does not set `book_library_id`

- [useBookUpload.ts:117-132](src/hooks/useBookUpload.ts) — new `bookshelf_items` INSERT doesn't include `book_library_id`. This is correct on the frontend (cache-hit should run server-side in bookshelf-process after Haiku classification). But since bookshelf-process doesn't do that, every new upload permanently has `book_library_id IS NULL`.

### Finding 8 — Migration 100090's backfill is incomplete by design

- [00000000100090_bookshelf_platform_library.sql:268-292](supabase/migrations/00000000100090_bookshelf_platform_library.sql) — the backfill UPDATE is guarded by `IF NOT EXISTS (SELECT 1 FROM bookshelf_items WHERE book_library_id IS NOT NULL LIMIT 1)`. If even ONE row has `book_library_id` set, the entire backfill skips. Phase 1b-C must fix this with a per-row idempotent UPDATE.

### Finding 9 — Frontend BookExtraction type exposes `bookshelf_item_id` field that the new RPC cannot return

- [useExtractionData.ts:64](src/hooks/useExtractionData.ts) calls `get_book_extractions` — returns rows keyed by `book_library_id`, not `bookshelf_item_id` (correct: in the new model an extraction belongs to a book, not to a family's view of a book).
- [src/types/bookshelf.ts](src/types/bookshelf.ts) `BookExtraction` type may still expose `bookshelf_item_id`. If any consumer navigates/routes using `bookshelf_item_id` from an extraction row, that path is already broken. Needs audit pass in 1b-D.

### Finding 10 — 88K extraction rows exist but no known code path produced them

- Live schema shows 88,474 rows in `platform_intelligence.book_extractions` matching exactly the Phase 1 migration counts. No function writes to the old per-family tables either (none of the non-key-points write paths I grepped for exist). **Conclusion:** the 88K rows came from StewardShip v1 via `scripts/bookshelf-migrate.cjs`, got moved to the platform table by [00000000100091](supabase/migrations/00000000100091_bookshelf_platform_data_migration.sql). The founder has been unable to extract new books since at least Phase 1. This is a silent block that Phase 1b-B lifts.

---

## Key Decisions (Require Founder Sign-Off)

1. **Dual-write strategy during rewire (1b-B).**
   - **Recommendation:** Write to BOTH the old per-family tables AND the new platform table during Phase 1b. Cost is negligible (disk space), safety is high. Stop dual-writes in 1b-F. Drop old tables in a separate Phase 1c after 30-day soak.
   - **Rationale:** Cutover-at-once is irreversible; dual-write is reversible. The 30-day soak catches any consumer I missed.

2. **Cache-hit similarity threshold — LOCKED 2026-04-08.**
   - Per [PRD-23:1094](prds/ai-vault/PRD-23-BookShelf.md). Similarity ≥ 0.9 = clone (cache hit). 0.8 ≤ similarity < 0.9 = uncertain, fresh extraction, NEW cache entry. < 0.8 = different book, new entry.
   - **Title+author embedding is the single decider. ISBN is NOT used.** Same title/author at ≥ 0.9 similarity shares cache *even if ISBN differs*. (Overrides the original audit recommendation.)
   - Rationale: different editions of the same book are mostly the same content — collapsing them is the point of cache sharing. Simpler logic, fewer edge cases, no ISBN normalization problems.
   - Implementation note: `upsert_book_library` does NOT accept `p_isbn` as a matching parameter. ISBN is still stored on `book_library` for display, but it's not consulted during the cache-hit decision.

3. **Cache-hit transparency.**
   - **Recommendation:** Transparent per [PRD-23:1106-1107](prds/ai-vault/PRD-23-BookShelf.md). No UI badge saying "this book is cached." The user experiences faster-than-expected upload and instant extraction. No change to the upload UI.

4. **Uncertain match (0.8-0.9) handling.**
   - **Recommendation:** Always create a new entry. No user prompt asking "merge with existing?" for Phase 1b. A merge UI is post-MVP.

5. **Book assignment mechanism — FULLY LOCKED 2026-04-08. RPC is CUT, replaced with 4 SQL scripts.**
   - **DO NOT build the `assign_book_to_family` RPC.** Founder direction: **4 documented SQL scripts in `docs/bookshelf-bulk-assign/`** — see the full spec in Founder Decision 4 at the top of this file.
   - Architecture confirmation: platform holds one copy (chunks + extractions + embeddings). Families get `bookshelf_items` pointers. Personal curation (`bookshelf_user_state`) is per-member, created on-demand, NOT touched by the scripts. Zero data copy, zero AI cost on assignment.
   - The 4 scripts cover: by-collection, by-tag, by-title-list, from-source-family. All share: dry-run default, silent skip on duplicates, before/after row counts, sample titles, atomic transaction.
   - Sub-phase 1b-C scope: idempotent per-row relink migration + 4 SQL scripts (pure documentation). The RPC and its migration file entries are removed from 1b-C scope.
   - **No open clarifications remain** as of 2026-04-08.

6. **Go Deeper fix deployment — LOCKED 2026-04-08.**
   - There are no in-flight broken sessions to salvage — Go Deeper has been silently dropping Sonnet output, none of those extractions reached users. The fix lands in Sub-phase 1b-B as part of the `bookshelf-extract` persistence rewire. The fix can deploy cold.
   - **DO NOT build a temporary "under repair" stub for Go Deeper.** Founder will manually avoid clicking Go Deeper between now and 1b-B. Acceptable because only the founder has BookShelf access during beta.

7. **`update_extraction_text` edits.**
   - **Decision:** Verify `SELECT count(*) FROM platform_intelligence.book_extractions WHERE updated_at > created_at` during 1b-A. If 0 (expected — the RPC was never UI-wired), the exact text-match join for embedding backfill works cleanly. If non-zero, re-embed those specific rows via the polling pipeline.

8. **Multi-part book cache-hit behavior.**
   - **Recommendation:** Cache-hit fires on the PARENT book's `title + author` only. Child parts auto-link to the parent's `book_library_id`. Parent cache hit → children skip extraction. Parent cache miss → normal flow.

9. **Context-assembler access-level enum alignment.**
   - [PRD-23](prds/ai-vault/PRD-23-BookShelf.md) + `bookshelf_member_settings.book_knowledge_access` column uses `'hearted_only' | 'all' | 'insights_only' | 'none'`.
   - [00000000100094:193](supabase/migrations/00000000100094_bookshelf_phase2_frontend_rpcs.sql) `get_bookshelf_context` RPC supports `'all_extracted' / 'insights_only' / 'hearted_only'` — `'all_extracted'` doesn't match the PRD.
   - **Decision:** Align to `'hearted_only' | 'all' | 'insights_only' | 'none'` per PRD + existing column. Fix the RPC enum in 1b-E.

10. **Embedding polling budget.**
    - **Recommendation:** Share the polling budget between old per-family tables and new platform tables in the existing `embed` Edge Function. Revisit if backlog appears. No separate pg_cron job yet.

11. **ai_usage_log audit for wasted Go Deeper calls.**
    - **Recommendation:** Document the wasted period in a footnote of the verification table. No backfill possible. Flag for the founder's cost narrative.

12. **Sub-phase approval gating.**
    - **Recommendation:** Founder approves each sub-phase before the next starts. Each sub-phase ends at a `tsc -b` clean checkpoint with a defined verification gate. The cost of gating is small; the safety net is meaningful.

---

## Database Changes Required

### New Migration `00000000100107_bookshelf_phase1b_embeddings.sql` (Phase 1b-A)

**ALTER existing tables:**
- `ALTER TABLE platform_intelligence.book_extractions ADD COLUMN IF NOT EXISTS embedding halfvec(1536);`
- `CREATE INDEX IF NOT EXISTS idx_plbe_embedding ON platform_intelligence.book_extractions USING hnsw (embedding halfvec_cosine_ops) WHERE embedding IS NOT NULL;`

**Backfill (5 UPDATE statements, one per old extraction table):**
- Each UPDATE joins on `(be.book_library_id, be.extraction_type, text-or-declaration_text match, section_title, source_part_number)` and copies `embedding` from the old table row to the matching new platform row.
- `SET statement_timeout = '600s'` per migration 100091 pattern.
- Idempotent via `WHERE be.embedding IS NULL` guard.
- Post-migration NOTICE: rows backfilled per extraction_type.

**New SECURITY DEFINER RPCs (polling pipeline support):**
- `get_unembedded_book_extractions(p_limit INT) RETURNS TABLE(id UUID, text TEXT, declaration_text TEXT, extraction_type TEXT)`
- `update_book_extraction_embedding(p_id UUID, p_embedding halfvec(1536)) RETURNS BOOLEAN`
- `get_unembedded_book_chunks(p_limit INT) RETURNS TABLE(id UUID, text TEXT)`
- `update_book_chunk_embedding(p_id UUID, p_embedding halfvec(1536)) RETURNS BOOLEAN`

### New Migration `00000000100108_bookshelf_phase1b_write_path.sql` (Phase 1b-B)

**New SECURITY DEFINER RPCs (Edge Function write support):**
- `upsert_book_library(p_title, p_author, p_isbn, p_genres, p_tags, p_ai_summary, p_toc, p_title_author_embedding) RETURNS TABLE(library_id UUID, was_cache_hit BOOLEAN, matched_similarity FLOAT)` — atomic cache-hit check + insert.
- `set_bookshelf_item_library_id(p_item_id UUID, p_library_id UUID, p_extraction_status TEXT, p_chunk_count INT) RETURNS BOOLEAN`
- `insert_book_chunks(p_book_library_id UUID, p_chunks JSONB) RETURNS INT` — JSONB array of chunks with `chunk_index, chapter_index, chapter_title, text, tokens_count`.
- `insert_book_extractions(p_book_library_id UUID, p_extractions JSONB, p_audience TEXT DEFAULT 'original') RETURNS INT` — JSONB array of extractions with the full column set.

### New Migration `00000000100109_bookshelf_phase1b_relink.sql` (Phase 1b-C)

**Per-row idempotent UPDATE to fix Finding 8:**
- `UPDATE bookshelf_items SET book_library_id = ... WHERE book_library_id IS NULL AND book_cache_id IS NOT NULL;`
- Multi-part consolidation: child parts point at parent's `book_library_id` (same logic as 100090).
- Any rows with both NULL → NOTICE for manual triage.
- Expected: no-op on the founder's family (no books uploaded since Phase 1, per founder confirmation 2026-04-08). Ships for safety against future similar idempotency-guard bugs.

**No `assign_book_to_family` RPC.** Cut per founder decision 2026-04-08. Replaced by a documented SQL script (see Sub-phase 1b-C scope). The script is not a database migration — it lives in `docs/` and is invoked manually.

### New Migration `00000000100110_bookshelf_phase1b_context_enum_fix.sql` (Phase 1b-E)

**RPC fix for Finding 6e / Decision 9:**
- `CREATE OR REPLACE FUNCTION get_bookshelf_context(...)` — replace `'all_extracted'` with `'all'` to align with PRD + column constraint.

---

## Feature Keys

**No new feature keys required.** Phase 1 already registered `bookshelf_browse`, `bookshelf_upload`, `bookshelf_extract`, `bookshelf_discuss`, `bookshelf_export`. Phase 1b is an infrastructure rewire — no new gated capabilities.

The bulk-assignment SQL script is documentation, not a database object. It has no feature key because it is not invoked from the application layer. When a future UI for book assignment is built, that phase will introduce a new feature key (e.g. `bookshelf_admin_assign`) and a real RPC — this is post-Phase-1b.

---

## Sub-Phase Breakdown (6 sub-phases A → F)

Each sub-phase ends at a `tsc -b` clean checkpoint with a verification gate. Sequencing matters — the order matches the dependency chain, not chronological convenience. **Founder approval required before each sub-phase starts.**

### Sub-Phase 1b-A — Add embedding column + backfill + extend embed pipeline

**Goal:** `match_book_extractions` starts returning real results. Morning Insight stops being empty.

**Scope:**
1. Migration `00000000100107_bookshelf_phase1b_embeddings.sql` as specified above.
2. Extend `embed` Edge Function with `processBookExtractions()` + `processBookChunks()` functions modeled on `processBookCache`. Share polling budget.
3. Post-migration verification query: `SELECT extraction_type, count(*) FILTER (WHERE embedding IS NULL) AS missing, count(*) AS total FROM platform_intelligence.book_extractions GROUP BY extraction_type;`

**Risk:** Medium. Backfill JOIN precision — if text was normalized during 100091 copy, exact-match will miss rows. Mitigation: spot-check data, run in transaction, fall back to polling pipeline for anything not caught.

**Verification:**
- Post-migration NOTICE: ~88,000 embeddings backfilled
- Manual Morning Insight test on founder library — matches surface
- Playwright E2E: invoke `match_book_extractions` via `supabase.rpc(...)` and assert non-empty results
- `tsc -b` zero errors

**Rollback:** `ALTER TABLE DROP COLUMN embedding`. No real loss — source embeddings still live on old tables.

---

### Sub-Phase 1b-B — Rewire WRITE PATH (bookshelf-process + bookshelf-extract)

**Goal:** New book uploads populate the platform layer correctly, with cache-hit short-circuit. Go Deeper persists its Sonnet output.

**Scope:**
1. Migration `00000000100108_bookshelf_phase1b_write_path.sql` — write RPCs.
2. **`bookshelf-process` rewrite:**
   - `runClassification` also embeds `title + " by " + author` via OpenAI.
   - After classification: call `upsert_book_library(...)` which returns `(library_id, was_cache_hit, matched_similarity)`.
   - Call `set_bookshelf_item_library_id(item.id, library_id, ...)`.
   - `runChunkPhase`: if cache hit, SKIP chunk insertion entirely, set `bookshelf_items.chunk_count` from library row. If cache miss, write chunks via `insert_book_chunks(library_id, chunks_jsonb)` AND continue writing to old `bookshelf_chunks` (dual-write per Decision 1).
3. **`bookshelf-extract` rewrite:**
   - At end of `combined_section` branch (line 1039-1042) AND single-tab branches (line 1146-1149): call `insert_book_extractions(book_library_id, extractions_jsonb)`.
   - Edge Function still returns response body to caller (backward compat).
   - Dual-write to old per-family extraction tables per Decision 1.
4. **Frontend fix in `ExtractionBrowser.handleGoDeeper`:**
   - Line 264 already calls `refetch()`. No change needed here — refetch now surfaces the persisted rows. The one-line "fix" is the Edge Function starting to persist. Frontend is already correct.
5. New extractions have NULL embeddings initially → polling pipeline from 1b-A picks them up automatically.

**Risk:** **HIGH.** Cache-hit logic on first deployment will surface edge cases (33 multi-part books in the library — cache-hit must NOT collapse them). If similarity threshold too aggressive, distinct books merge. If too conservative, no cache hits ever fire.

**Mitigation:**
- 0.9 similarity threshold per PRD-23.
- Implement `upsert_book_library` with conservative CASE, log `matched_similarity` to `ai_usage_log.metadata`.
- Test on synthetic uploads BEFORE running on real founder data.
- Three-way branch per PRD-23:1090-1094 (cache hit / uncertain-fresh-new / different).

**Verification:**
- Synthetic upload test 1 (cache miss): New book → `book_library` row created, `book_library_id` set on `bookshelf_items`, chunks in `platform_intelligence.book_chunks`.
- Synthetic upload test 2 (cache hit): Re-upload same file → NO new `book_library` row, NO new chunks, existing library entry reused, `chunk_count` matches.
- Synthetic upload test 3 (uncertain): "Atomic Habits" vs "Atomic Habits — Updated Edition" → new entry created (similarity 0.8-0.9).
- Go Deeper test: open existing book, click Go Deeper → new rows in `book_extractions` with `is_from_go_deeper=true`, visible in UI after refetch.
- `tsc -b` zero errors

**Rollback:** Revert Edge Function code. Drop new RPCs. Dual-write window means no consumer read path depends on the platform-only data yet; orphaned platform-side writes are harmless.

---

### Sub-Phase 1b-C — One-shot relink + 4 documented bulk-assignment SQL scripts

**Goal:** Any stuck `bookshelf_items.book_library_id IS NULL` rows get linked. Founder has four documented SQL scripts covering the bulk-assignment patterns she needs (by collection, by tag, by title list, by source family).

**Scope:**
1. Migration `00000000100109_bookshelf_phase1b_relink.sql` — idempotent per-row relink UPDATE only. Fixes the overly cautious `IF NOT EXISTS (LIMIT 1)` guard in migration 100090. Founder confirmed 2026-04-08 that no books have been uploaded since Phase 1, so the relink will be a no-op on the founder's family — but the migration ships for safety against future similar bugs.
2. **Four documented SQL scripts** in `docs/bookshelf-bulk-assign/` (see Founder Decision 4 at the top of this file for the full architecture + conventions spec). Each script is pointer-create only — no data copy, no AI cost, no `bookshelf_user_state` writes. All four share: dry-run default, silent skip on duplicates, before/after row counts, sample title preview, atomic transaction.
   - `by-collection.sql` — clone every book in a source collection
   - `by-tag.sql` — clone every book tagged X
   - `by-title-list.sql` — clone a specific list of books
   - `from-source-family.sql` — clone every book a source family has
3. **No admin UI.** Scripts are invoked via psql or the Supabase SQL editor.
4. **No database migration for the scripts themselves** — pure documentation.

**Risk:** Low. Pure SQL, no runtime code, no RPC surface area added.

**Verification:**
- `SELECT count(*) FROM bookshelf_items WHERE book_library_id IS NULL AND archived_at IS NULL` → 0 after migration runs (already 0 because no new uploads, but the migration's per-row logic is verified against a synthetic test fixture).
- Dry-run test on each of the 4 scripts against a synthetic target family → verify the dry-run preview prints the correct set of books with correct sample titles and correct before/after row counts (before-count should show no change in dry-run).
- Live execution test on at least one script (by-collection.sql) against a real second family fixture → verify new `bookshelf_items` rows appear pointing at the existing `book_library_id`s with correct `extraction_status`/`chunk_count`/`processing_status`/`intake_completed` values. Verify the BookShelf library page renders the new books without re-processing. Verify `get_book_extractions` returns data for the new rows.
- Duplicate-skip test: re-run the same script a second time → zero new rows created, zero errors.
- Rollback test: run dry-run on by-collection.sql with `DRY_RUN=true`, verify no INSERTs were made to `bookshelf_items`.
- `tsc -b` zero errors (expected — no frontend or Edge Function changes this sub-phase)

**Rollback:** The relink UPDATE is idempotent and benign. The SQL scripts are documentation — nothing to roll back. If a script was run and assigned too much, the cleanup is a simple `DELETE FROM bookshelf_items WHERE family_id = ? AND created_at > ?` — but the dry-run default is the primary safety net.

---

### Sub-Phase 1b-D — Rewire bookshelf-search + bookshelf-discuss

**Goal:** Semantic search and RAG discuss read from the platform layer.

**Scope:**
1. **`bookshelf-search/index.ts:91`** — replace `match_bookshelf_chunks` with `match_book_chunks`. Parameter shape changes: old takes `p_book_ids` (bookshelf_items.id[]), new takes `p_book_library_ids`. Add a helper that resolves item_ids → library_ids before the call.
2. **`bookshelf-search/index.ts:107`** — replace `match_bookshelf_extractions` with `match_book_extractions`. Result shape changes: `table_name` → `extraction_type`.
3. **Result mapping** at lines 96-103 and 113-120 — update to the new shapes. Join `bookshelf_items` in the Edge Function to map `book_library_id` back to the family's `bookshelf_items.id` so response shape stays compatible with existing frontend consumers.
4. **`bookshelf-discuss/index.ts:304-444`** — replace 5 direct queries with a single `get_book_extractions(ARRAY[itemId], memberId)` call. The grouping logic (Hearted Key Insights / Other Key Insights / etc.) simplifies because results are type-discriminated.
5. **`bookshelf-discuss/index.ts:451-498`** — replace old match RPCs with new platform RPCs.
6. **Frontend check (Finding 9):** audit `src/types/bookshelf.ts` + all consumers of `BookExtraction.bookshelf_item_id`. If any navigation/routing uses it, add a resolver layer.

**Risk:** Medium. Degrading RAG quality during cutover is the main risk. Old and new tables share the same source embeddings (1b-A backfill), so results should be comparable.

**Mitigation:**
- Side-by-side comparison: temporarily deploy a `bookshelf-search-v2` test function that calls the new RPCs. Compare results to current on a test query set. Cut over only after parity is confirmed.
- Keep OLD RPCs in the database during this sub-phase — do NOT drop. Dropping happens in Phase 1c after soak.

**Verification:**
- Open a book in discuss view, ask "what's the main idea" → response references content from library
- Search a known phrase in semantic search panel → same matches surface as before
- `tsc -b` zero errors

**Rollback:** Revert Edge Function code. Old RPCs still in place.

---

### Sub-Phase 1b-E — Rewire bookshelf-key-points + bookshelf-study-guide + context-assembler

**Goal:** The remaining three consumers read/write platform tables. LiLa context pipeline is on the platform.

**Scope:**
1. **`bookshelf-key-points/index.ts`** — small function, "fallback only" per Session Addendum. Rewire to use `get_book_extractions` (read) + new `update_book_extraction_key_points(p_ids UUID[], p_is_key_point BOOLEAN)` RPC (write).
2. **`bookshelf-study-guide/index.ts`** — study guides already use `audience = 'study_guide_{memberId}'` which the platform table supports (100090:110).
   - Line 109-118: read existing via `get_book_extractions(..., p_audience := 'original')`.
   - Line 127-132: new `delete_book_extractions_by_audience(p_book_library_id, p_audience)` RPC.
   - Line 250: replace insert with `insert_book_extractions(library_id, extractions, audience := 'study_guide_{member_id}')`.
   - Resolve `bookshelf_item_id` → `book_library_id` via join.
3. **`_shared/context-assembler.ts` `loadBookShelfContext()`** — lines 411-518.
   - Replace ~70 lines of direct old-table queries with a single `get_bookshelf_context(p_family_id, p_member_id, p_access_level, p_max_items := 25)` call.
   - Map RPC result to existing `contextLines: string[]` format.
   - Also apply migration `00000000100110_bookshelf_phase1b_context_enum_fix.sql` to align the RPC enum with the PRD/column (Decision 9).
4. **Order within 1b-E:** ship `bookshelf-key-points` and `bookshelf-study-guide` FIRST (isolated impact). Ship `context-assembler` LAST (critical path — every LiLa conversation).
5. Add temporary console.log instrumentation in context-assembler for the first day post-deploy.

**Risk:** Medium-High. context-assembler is a critical user-facing path — errors silently degrade LiLa response quality.

**Mitigation:**
- Staged rollout within the sub-phase (key-points → study-guide → context-assembler).
- Manual LiLa testing covering book/read/wisdom topic patterns at [context-assembler.ts:116-122](supabase/functions/_shared/context-assembler.ts).
- Old `loadBookShelfContext` code preserved in git history for fast revert.

**Verification:**
- LiLa Drawer conversation mentioning a book topic → book context appears in response.
- BookShelf discuss with a hearted item → assistant references the hearted content.
- Morning Insight question → matches surface (should already work from 1b-A).
- Study guide regeneration for a child → new rows appear in `book_extractions` with new audience marker, child's study guide view renders the new content.
- `tsc -b` zero errors

**Rollback:** Revert per-function. Dual-write is still active, so reverting to old reads stays consistent.

---

### Sub-Phase 1b-F — Deprecation prep + documentation + verification

**Goal:** Mark old tables deprecated, document the canonical platform path, complete the post-build verification table.

**Scope:**
1. **Mark old per-family tables as deprecated in `claude/database_schema.md`:**
   - `bookshelf_summaries`, `bookshelf_insights`, `bookshelf_declarations`, `bookshelf_action_steps`, `bookshelf_questions`, old `bookshelf_chunks`
   - Comment: "DEPRECATED 2026-04-XX. Read-only as of Phase 1b-F. Drop in Phase 1c after 30-day soak. Source of truth is `platform_intelligence.book_extractions` / `platform_intelligence.book_chunks`."
   - Same for old RPCs `match_bookshelf_chunks`, `match_bookshelf_extractions`.
2. **Decision gate: stop dual-writing.** Founder approval required. Once dual-writes stop, any consumer I missed silently breaks. The 30-day soak clock starts here.
3. **STUB_REGISTRY.md updates:**
   - Mark all Phase 1b sub-phase items as Wired.
   - New stub: "Drop OLD per-family extraction tables and old RPCs after 30-day soak — Phase 1c"
4. **CLAUDE.md additions:**
   - "All BookShelf READS go through platform RPCs (`get_book_extractions`, `match_book_chunks`, `match_book_extractions`, `get_bookshelf_context`). Direct queries against `bookshelf_summaries/insights/declarations/action_steps/questions` are deprecated."
   - "All BookShelf WRITES go through SECURITY DEFINER RPCs (`upsert_book_library`, `insert_book_chunks`, `insert_book_extractions`, `set_bookshelf_item_library_id`). Edge Functions cannot use PostgREST `.from()` against `platform_intelligence` schema."
   - "Cache hit threshold: title_author_embedding similarity ≥ 0.9 → clone. 0.8-0.9 → fresh extraction, new cache entry. < 0.8 → different book. ISBN match overrides title similarity."
   - "Multi-part book consolidation: child parts point at parent's `book_library_id`. Chunk ordering uses `(part_number * 100000) + chunk_index`. Extraction ordering uses `source_part_number`."
5. **Rewrite `claude/database_schema.md` BookShelf section** — show platform layer as canonical, old tables marked deprecated, canonical query patterns documented.
6. **Post-Build Verification table** — every requirement from this audit with Wired/Stubbed/Missing status. Zero Missing target.
7. **End-to-end smoke test (manual):**
   - Upload brand new book → cache miss → pipeline → `book_library_id` populated, chunks in platform_intelligence, no extractions yet
   - Trigger extraction → extractions in `book_extractions`, embeddings populating asynchronously
   - Re-upload same book → cache hit → instant, no AI cost, library entry shared
   - Next morning, Morning Insight → passive matches surface
   - BookShelf discuss → RAG context from new chunks
   - Go Deeper → new rows with `is_from_go_deeper=true`
   - Study guide for a child → new rows with `audience='study_guide_xyz'`
   - Heart an extraction → `bookshelf_user_state` row appears
   - Send action step to Tasks → task created + `bookshelf_user_state.sent_to_tasks` updated
   - Run the documented bulk-assignment SQL script against a synthetic second family → verify books appear in their library without re-processing

**Risk:** Low (mostly documentation).

**Verification:** All previous sub-phases pass. Manual smoke test complete. Founder sign-off.

---

## Stubs — Do NOT Build This Phase

- [ ] **Phase 1c: Drop OLD per-family extraction tables** — `bookshelf_summaries`, `bookshelf_insights`, `bookshelf_declarations`, `bookshelf_action_steps`, `bookshelf_questions`, old `bookshelf_chunks`, old RPCs `match_bookshelf_chunks`/`match_bookshelf_extractions`. 30-day soak minimum after Phase 1b-F before drop.
- [ ] **Per-book `assign_book_to_family` RPC** — CUT 2026-04-08. Replaced by a documented collection/tag-based bulk SQL script in `docs/`. Any future admin UI is post-MVP and will introduce its own RPC + feature key.
- [ ] **Cross-family book recommendations** ("families like yours are reading...") — post-MVP.
- [ ] **Shared author features** — post-MVP.
- [ ] **Migration of `bookshelf_chapters`** to platform — chapters stay in old table. Phase 1c cleanup.
- [ ] **Multi-part book `chunk_count` SUM recalculation** — Phase 1b writes new chunks under parent's `book_library_id` and updates count, but does NOT recalculate the already-migrated multi-part chunk_counts.
- [ ] **`book_extractions` deduplication across families** — if two families upload the same book and cache-hit doesn't fire (similarity 0.85), both end up with separate extractions under separate `book_library_id`s. Cleanup post-MVP.
- [ ] **Cache-hit UI indication** — per PRD-23 this is transparent.
- [ ] **`bookshelf_shares` rewire** — 0 rows in production, not in use. Leaving table + existing read paths alone. A future PRD will redesign sharing semantics for the platform model.
- [ ] **`update_extraction_text` UI wiring** — RPC exists (100094) but has no UI consumer yet. Out of Phase 1b scope.
- [ ] **Bulk cache-hit scanner** — scan the founder's existing 559 books for duplicates that should be consolidated under a single `book_library_id`. Post-MVP cleanup.

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Phase 1b platform RPCs | → | PRD-05 (LiLa) | `_shared/context-assembler.ts` calls `get_bookshelf_context` (rewired in 1b-E) |
| Phase 1b platform RPCs | ← | PRD-06 (Guiding Stars) | `guiding_stars.source='bookshelf'`, `source_reference_id=book_extractions.id` — already correct, no change |
| Phase 1b platform RPCs | ← | PRD-08 (Journal) | `journal_prompts.source='bookshelf_extraction'`, `source_reference_id=book_extractions.id` — already correct, no change |
| Phase 1b platform RPCs | ← | PRD-09A (Tasks) | `tasks.source='bookshelf'`, `source_reference_id=book_extractions.id` — already correct, no change |
| Phase 1b platform RPCs | — | PRD-13 (Archives) | `bookshelf_items.folder_id` — unaffected |
| Phase 1b embedding backfill | → | PRD-18 (Rhythms — Morning Insight) | `match_book_extractions` finally works. No code change needed in MorningInsightSection — once 1b-A lands, existing code starts working. |
| Phase 1b context-assembler rewire | → | All PRD-05-driven features (Cyrano, Higgins, Board of Directors, Mediator, etc.) | Every Edge Function using `_shared/context-assembler.ts` benefits from the LLM-context rewire. Verify with manual testing. |
| Phase 1b cache-hit logic | → | Future second-family onboarding | Upload-time cache-hit is the primary cross-family sharing mechanism (transparent, automatic). For founder-initiated bulk grants, the documented collection/tag-based bulk SQL script in `docs/` is the operator interface. |
| Phase 1b | ← | `bookshelf_member_settings.book_knowledge_access` | Decision 9 enum alignment affects `get_bookshelf_context` RPC. |

---

## Things That Connect Back to This Feature Later

- **Phase 1c** — drop old per-family tables after 30-day soak. Owned by this PRD.
- **Admin assignment UI** — post-MVP polish session builds a UI on top of a future RPC (not built in Phase 1b). For now, the bulk SQL script in `docs/` is the admin interface.
- **Multi-family beta onboarding** — when a second family is onboarded, they'll be the first real consumer of cache-hit. Phase 1b must be verified working before that.
- **Platform intelligence pipeline** — `platform_intelligence.book_library` becomes a real shared asset catalog. Future PRDs (recommendations, community curation) build on top.
- **PRD-05 contextual help** — future feature injects LiLa contextual help at rhythm prompts; the BookShelf context pipeline must be working correctly first.
- **Study guide scope expansion** — when study guides get more ambitious (multi-book, audience-aware generation), the platform storage model supports it natively.

---

## Data Migration Risk Assessment

| Sub-phase | Operation | Risk | Reversibility | Mitigation |
|---|---|---|---|---|
| 1b-A | ALTER TABLE add embedding column | Low | Reversible (DROP COLUMN) | Apply during quiet hours; verify with synthetic INSERT |
| 1b-A | Backfill 88K embeddings via JOIN | Medium | Reversible (UPDATE embedding = NULL) | Run in transaction; spot-check count post-backfill; fall back to polling if count < expected |
| 1b-A | New SECURITY DEFINER RPCs (polling) | Low | Reversible (DROP FUNCTION) | Additive only |
| 1b-A | Extend embed Edge Function | Low | Reversible (revert function) | Deploy alongside DB changes |
| 1b-B | New SECURITY DEFINER write RPCs | Low | Reversible (DROP FUNCTION) | Additive only |
| 1b-B | **Rewrite bookshelf-process for cache-hit** | **HIGH** | Reversible (revert function) | Synthetic uploads first; conservative threshold; dual-write |
| 1b-B | **Rewrite bookshelf-extract to persist** | **HIGH** | Reversible (revert function) | Dedicated test book; verify rows in `book_extractions`; dual-write |
| 1b-B | Frontend ExtractionBrowser `refetch` verification | Low | No code change; verification only | — |
| 1b-C | Idempotent relink UPDATE | Low | Reversible | Benign per-row update |
| 1b-C | Documented bulk-assignment SQL script | Low | Not a DB object — pure documentation | Test against a synthetic second family in a staging DB before running on production |
| 1b-D | Rewire bookshelf-search | Medium | Reversible (revert function) | Side-by-side comparison before deploy |
| 1b-D | Rewire bookshelf-discuss | Medium | Reversible (revert function) | Manual LiLa test |
| 1b-E | Rewire bookshelf-key-points | Low | Reversible (revert function) | Fallback function — limited blast radius |
| 1b-E | Rewire bookshelf-study-guide | Medium | Reversible (revert function) | Generate before/after, compare output |
| 1b-E | **Rewire context-assembler** | **MEDIUM-HIGH** | Reversible (revert function) | Roll out LAST in 1b-E; console.log instrumentation; manual LiLa testing |
| 1b-E | Context-assembler enum fix migration | Low | Reversible | Align to PRD enum |
| 1b-F | Documentation + verification | None | N/A | Pure documentation |
| 1b-F | Stop dual-writes | Medium | Reversible if old tables not yet dropped | Founder sign-off required |

**Overall risk:** Medium-High, dominated by Sub-phase 1b-B (cache-hit + extract-persistence rewire) and Sub-phase 1b-E (context-assembler rewire). Both mitigated by the testing strategies above.

---

## Open Questions — Status 2026-04-08

Eleven of twelve original open questions are resolved. One clarification remains; it does not block Sub-phase 1b-A or 1b-B.

### Answered

1. ✅ **No books uploaded since Phase 1 (2026-03-31).** Phase 1b-C relink migration will be a clean no-op on the founder's family. Ships anyway for safety.
2. ✅ **88K extraction rows came from StewardShip v1 via `scripts/bookshelf-migrate.cjs` → old per-family tables → migration 100091 → platform table.** No separate undocumented extraction path.
3. ✅ **No books have been extracted since the `bookshelf-extract` write path broke.** Founder has been blocked on new-book extraction since at least Phase 1.
4. ✅ **Near-term plan: founder wants to upload new books.** Sub-phase 1b-B (cache-hit + persistence) MUST land before new-book uploads. This makes Phase 1b the immediate priority.
5. ✅ **Cache-hit threshold = 0.9 / 0.8-0.9 fresh-new / <0.8 different.** Title+author embedding is the single decider. **ISBN is NOT used.** Same title/author at ≥ 0.9 shares cache even if ISBN differs.
6. ✅ **`assign_book_to_family` RPC is CUT.** Replaced by a documented bulk SQL script. See Sub-phase 1b-C scope.
7. ✅ **Dual-write through Phase 1b, stop at 1b-F with explicit founder approval, drop in Phase 1c after 30-day soak.** Confirmed.
8. ✅ **Sub-phase approval gating confirmed.** Each of the six sub-phases is founder-gated.
9. ✅ **`embed` Edge Function shares polling budget** between old and new tables. Same pg_cron schedule as today. Revisit only if backlog appears.
10. ✅ **Temp audit report file deleted from repo root.**
11. ✅ **Phase 1b runs BEFORE Build M.** BookShelf is foundational and is blocking new book uploads.
12. ✅ **No Go Deeper stub.** Founder will manually avoid clicking Go Deeper until 1b-B lands.

### Still Open

**None.** All 12 original open questions are resolved as of 2026-04-08. The bulk-assignment SQL script interface question was answered by the founder on 2026-04-08 — see Founder Decision 4 at the top of this file for the full spec. Sub-phase 1b-A through 1b-F all have no blocking unknowns.

---

## Founder Confirmation (Pre-Build)

- [x] Pre-build summary reviewed and accurate *(confirmed 2026-04-08 via 1b-A build prompt)*
- [x] All addenda captured above
- [x] Stubs confirmed — nothing extra will be built *(with one clarification pending for 1b-C SQL script)*
- [x] Schema changes correct *(scope reduced: no `assign_book_to_family` RPC migration)*
- [x] Feature keys identified (none new)
- [x] Sub-phase ordering + gating confirmed *(founder approves each of the six sub-phases before the next starts)*
- [x] Dual-write strategy confirmed *(through Phase 1b, stop at 1b-F, drop in Phase 1c after 30-day soak)*
- [x] Cache-hit threshold confirmed *(0.9 / 0.8-0.9 / <0.8; title+author only; ISBN NOT used)*
- [x] Go Deeper stub decision made *(no stub — founder will manually avoid until 1b-B)*
- [x] Phase 1b vs Build M ordering confirmed *(Phase 1b first)*
- [ ] **Approved to build Sub-phase 1b-A** *(pending — to be confirmed after Sub-phase 1b-A pre-build presentation in fresh session)*

---

## Post-Build PRD Verification

> Completed after build, before declaring the phase done.
> Every requirement from the audit — accounted for.
> Zero Missing = Phase 1b complete.

*Table will be populated during Sub-phase 1b-F.*

| Requirement | Source | Status | Notes |
|---|---|---|---|
| *(to be filled during 1b-F)* | | | |

**Status key:** Wired = built and functional · Stubbed = in STUB_REGISTRY.md · Missing = incomplete

### Summary
- Total requirements verified: *TBD*
- Wired: *TBD*
- Stubbed: *TBD*
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs acceptable for Phase 1b and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] 30-day soak clock for Phase 1c drop acknowledged
- [ ] **Phase 1b approved as complete**
- **Completion date:**
