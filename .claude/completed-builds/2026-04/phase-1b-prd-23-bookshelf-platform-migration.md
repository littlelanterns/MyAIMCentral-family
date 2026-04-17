# Phase 1b: PRD-23 BookShelf — Complete the Platform Migration — PRE-BUILD, AUDIT DELIVERED 2026-04-08

> **Archived 2026-04-17 as part of Phase 0.26 S1.** Signed off 2026-04-13 per the CURRENT_BUILD.md top banner. Section header below preserved as-found — it still reads "PRE-BUILD, AUDIT DELIVERED" because it was not updated when the build was signed off. This is an instance of the doc drift Phase 0.26 addresses.

### PRD Files
- `prds/ai-vault/PRD-23-BookShelf.md` (full PRD)
- `specs/BookShelf-Platform-Library-Phase1-Spec.md` (Phase 1 architecture spec — Phase 1b is finishing this)

### Addenda Read
- `prds/addenda/PRD-23-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-23-Session-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- `prds/addenda/PRD-Template-and-Audit-Updates.md`

### Feature Decision File
`claude/feature-decisions/PRD-23-BookShelf-Platform-Library-Phase1b.md` — full pre-build plan, 6 sub-phases, 10 confirmed findings, 12 key decisions, 12 open questions for founder, risk matrix, sub-phase gating recommendation.

### Predecessor
Phase 1 (Build F, completed 2026-04-03). Phase 1 was declared complete with 30+ requirements wired. The Phase 1b audit reopened the verification: **Phase 1 shipped the schema half but left the wiring half broken.** Phase 1b does NOT reopen or undo Phase 1 work — it completes it.

---

### Pre-Build Summary

#### Context

The founder reported that Morning Insight was returning empty when she typed about friction — "it should never say that." Tracing that bug uncovered a structural Phase 1 gap much bigger than the surface symptom: the new `platform_intelligence.book_extractions` table does not even have an `embedding` column. The `match_book_extractions` RPC references `be.embedding` three times (verified at [00000000100092:96, 110, 113](supabase/migrations/00000000100092_bookshelf_platform_rpcs.sql)), throwing "column does not exist" at runtime on every call. Morning Insight's `try { ... } catch { return [] }` at [MorningInsightSection.tsx:306-352](src/components/rhythms/sections/MorningInsightSection.tsx) swallows the error so the user just sees empty results. The founder's reaction: "The priority isn't to have things working now, it is to have them working correctly."

The full audit (pre-build-auditor subagent, 2026-04-08) verified every claim and added four findings the main investigation missed. The complete architectural picture:

1. **Phase 1 added the embedding column to nowhere.** [00000000100090:86-119](supabase/migrations/00000000100090_bookshelf_platform_library.sql) creates `book_extractions` with 18 columns — no `embedding`. [00000000100092](supabase/migrations/00000000100092_bookshelf_platform_rpcs.sql) added a trigger that would queue embedding jobs, but [00000000000029](supabase/migrations/00000000000029_fix_pgmq_permissions.sql) had already reduced `util.queue_embedding_job()` to a no-op stub (`PERFORM 1; -- pgmq not configured yet`). The real embedding pipeline is the polling-based `embed` Edge Function, and its [TABLE_CONFIG at lines 27-85](supabase/functions/embed/index.ts) only lists OLD per-family tables. The new platform table was invisible to the only working pipeline.

2. **The write paths never rewired.** [bookshelf-process/index.ts](supabase/functions/bookshelf-process/index.ts) has ZERO references to `platform_intelligence|book_library|book_extractions` across 1549 lines. [bookshelf-extract/index.ts](supabase/functions/bookshelf-extract/index.ts) has zero `.insert(|.upsert(|.rpc(` calls — it returns AI output in the HTTP response and the caller (ExtractionBrowser) does `if (resp.ok) await refetch()` without ever reading the response body. **Go Deeper has been silently dropping every Sonnet extraction since deployment.**

3. **No cache-hit logic.** [bookshelf-process/index.ts:803-894](supabase/functions/bookshelf-process/index.ts) `runClassification` updates `bookshelf_items.title/author/genres/tags` and stops. No `title_author_embedding` computation. No `book_library` similarity lookup. The cross-family sharing economics that justified the entire Phase 1 migration don't exist in code.

4. **No book-assignment mechanism.** Nothing creates a `bookshelf_items` row for family B pointing at an existing `book_library_id`. The data shape supports it, the action doesn't exist.

5. **Five more consumers still use old tables.** [bookshelf-search](supabase/functions/bookshelf-search/index.ts#L91) (old `match_bookshelf_chunks`/`match_bookshelf_extractions` RPCs), [bookshelf-discuss](supabase/functions/bookshelf-discuss/index.ts#L304-L498) (direct old-table queries + old match RPCs), [bookshelf-key-points](supabase/functions/bookshelf-key-points/index.ts#L25-L31), [bookshelf-study-guide](supabase/functions/bookshelf-study-guide/index.ts#L109-L250), and [_shared/context-assembler.ts](supabase/functions/_shared/context-assembler.ts#L411-L489) `loadBookShelfContext()` — all read from OLD per-family tables. A `get_bookshelf_context` RPC already exists in [00000000100094:190-241](supabase/migrations/00000000100094_bookshelf_phase2_frontend_rpcs.sql) that queries the platform tables correctly, but zero callers — context-assembler never got wired to it.

6. **Latent frontend issues:** [useBookUpload.ts:117-132](src/hooks/useBookUpload.ts) doesn't set `book_library_id` on new rows (correct on frontend, but bookshelf-process never fills it in either). Migration [00000000100090:268-292](supabase/migrations/00000000100090_bookshelf_platform_library.sql) backfill is guarded by an overly cautious `IF NOT EXISTS (SELECT 1 ... book_library_id IS NOT NULL LIMIT 1)` — skips the entire backfill once ANY row has been set, leaving new uploads permanently stuck with NULL.

7. **Silent ongoing cost:** The 88K existing extractions in `book_extractions` came from StewardShip v1 via `scripts/bookshelf-migrate.cjs` → old per-family tables → migration 100091. The founder has had no working new-book extraction since at least Phase 1 (possibly longer). Any Go Deeper clicks have been burning Sonnet for nothing.

#### Dependencies Already Built (reuse wholesale)

- `platform_intelligence.book_library` — 578 rows, `title_author_embedding`, `extraction_status`, `extraction_count`, `discovered_sections`. Reuse as-is.
- `platform_intelligence.book_chunks` — 56,700 rows with populated embeddings (Phase 1 DID copy chunk embeddings, just not extraction embeddings). Reuse as-is.
- `platform_intelligence.book_extractions` — 88,474 rows, 20 columns. Missing `embedding` column. Reuse the structure; ALTER in 1b-A.
- `bookshelf_user_state` — 13 rows, 14 columns including `is_hidden`. RLS correct. Reuse as-is.
- `bookshelf_items.book_library_id` — populated for all 559 existing rows.
- RLS on all platform tables — verified, reuse as-is.
- [src/lib/extractionActions.ts](src/lib/extractionActions.ts) — Layer 1 actions all write to platform or `bookshelf_user_state` correctly.
- [src/hooks/useExtractionData.ts:64](src/hooks/useExtractionData.ts) — reads via `get_book_extractions` RPC, correct.
- ExtractionBrowser, item components, StudyGuideLibrary, ExportDialog — all correct frontend-side.
- RPCs already correct: `match_book_chunks`, `get_book_extractions`, `update_extraction_text`, `create_custom_extraction`, `count_extractions_by_audience`. `match_book_extractions` works as-is AFTER the column exists.
- `get_bookshelf_context` RPC (100094:190-241) — exists, never called. Phase 1b-E wires it.
- `generate-query-embedding` Edge Function — works.
- Migrations 100094 + 100095 — correct, no rework.

#### Dependencies NOT Yet Built

- ALTER TABLE migration adding `embedding halfvec(1536)` + HNSW index + backfill UPDATE from old tables (1b-A)
- New SECURITY DEFINER RPCs for embed Edge Function polling support: `get_unembedded_book_extractions`, `update_book_extraction_embedding`, `get_unembedded_book_chunks`, `update_book_chunk_embedding` (1b-A)
- New SECURITY DEFINER RPCs for Edge Function writes: `upsert_book_library` (atomic cache-hit + insert), `set_bookshelf_item_library_id`, `insert_book_chunks`, `insert_book_extractions` (1b-B)
- Cache-hit logic in bookshelf-process (1b-B)
- Extraction persistence in bookshelf-extract (1b-B)
- Platform table support in `embed` Edge Function (processBookExtractions + processBookChunks) (1b-A)
- Per-row idempotent relink migration (1b-C)
- Documented SQL script for collection/tag-based bulk book assignment, in `docs/` (1b-C) — replaces the cut `assign_book_to_family` RPC per founder decision 2026-04-08
- Rewired `bookshelf-search` (1b-D)
- Rewired `bookshelf-discuss` (1b-D)
- Rewired `bookshelf-key-points` (1b-E)
- Rewired `bookshelf-study-guide` (1b-E)
- Rewired `_shared/context-assembler.ts` `loadBookShelfContext` → `get_bookshelf_context` RPC (1b-E)
- `get_bookshelf_context` enum alignment migration (1b-E)
- Deprecation markings, STUB_REGISTRY updates, CLAUDE.md conventions, rewritten schema doc (1b-F)
- End-to-end smoke test plan (1b-F)

#### Sub-Phases (6, founder-gated)

- **1b-A — Embedding column + backfill + extend embed pipeline.** Risk Medium. Morning Insight starts working. ~1 migration + ~40 lines of Edge Function changes.
- **1b-B — Write path rewire (bookshelf-process cache-hit + bookshelf-extract persistence + Go Deeper fix). Risk HIGH.** ~1 migration + ~300 lines in bookshelf-process + ~50 lines in bookshelf-extract.
- **1b-C — Per-row relink + documented bulk-assignment SQL script.** Risk Low. ~1 migration + `docs/bookshelf-bulk-assign.sql`. RPC was cut per founder decision 2026-04-08.
- **1b-D — Rewire bookshelf-search + bookshelf-discuss to platform RPCs.** Risk Medium. ~60 lines across 2 Edge Functions.
- **1b-E — Rewire bookshelf-key-points + bookshelf-study-guide + context-assembler.** Risk Medium-High (context-assembler last). ~100 lines across 3 consumers + 1 enum-fix migration.
- **1b-F — Deprecation prep + documentation + verification + dual-write stop.** Risk Low. Pure documentation + founder gate.

Each sub-phase ends at a `tsc -b` clean checkpoint + a defined verification gate. **Founder approval required before the next sub-phase starts.**

#### Founder Decisions — LOCKED 2026-04-08

1. **Dual-write through Phase 1b.** Write to BOTH old per-family tables AND new platform tables starting 1b-B. Stop only at 1b-F with explicit founder approval. Drop old tables in Phase 1c after 30-day soak.
2. **Cache-hit threshold — title+author embedding is the single decider. ISBN is NOT used.** ≥ 0.9 = clone. 0.8-0.9 = uncertain → fresh extraction, NEW entry. < 0.8 = different book. Same title/author at ≥ 0.9 shares cache *even if ISBN differs*. Rationale: different editions of the same book are mostly the same content — collapsing them is the point. (Overrides the original audit recommendation that said ISBN match wins.)
3. **Cache-hit transparency.** Per PRD, no UI indication. User experiences instant extraction without knowing why.
4. **Uncertain matches (0.8-0.9).** Always create new entry. No merge UI for Phase 1b.
5. **`assign_book_to_family` RPC is CUT.** Replaced with a **documented SQL script for collection/tag-based bulk assignment** in `docs/`. The script is not a database object. One remaining clarification needed before 1b-C begins (see Open Questions below) — does NOT block 1b-A or 1b-B.
6. **No Go Deeper stub.** Founder will manually avoid clicking Go Deeper until 1b-B lands the `bookshelf-extract` persistence rewire. Acceptable because only the founder has BookShelf access during beta.
7. **Edit text handling.** Verify `SELECT count(*) FROM platform_intelligence.book_extractions WHERE updated_at > created_at` is 0 before backfill join. Expected 0 because `update_extraction_text` RPC was never UI-wired.
8. **Multi-part cache-hit.** Fires on parent's title+author only. Children auto-link to parent's `book_library_id`.
9. **Context-assembler access-level enum** aligned to `'hearted_only' | 'all' | 'insights_only' | 'none'` per PRD. Fix the `get_bookshelf_context` RPC in 1b-E (it currently uses `'all_extracted'`).
10. **Embed polling budget** shared between old and new tables on the same pg_cron schedule. Revisit only if backlog appears.
11. **ai_usage_log audit.** Document the wasted Go Deeper Sonnet period. No backfill possible.
12. **Sub-phase approval gating.** Founder approves each of the six sub-phases before the next starts.
13. **Phase 1b runs before Build M.** BookShelf is foundational and is blocking new book uploads.

#### Open Questions — Fully Resolved 2026-04-08

**All 12 original open questions are answered.** Zero unknowns block any sub-phase. Detailed answers are in the [feature decision file § Open Questions](claude/feature-decisions/PRD-23-BookShelf-Platform-Library-Phase1b.md).

The final answer — the bulk-assignment SQL script scope — was locked 2026-04-08. Summary:
- **Architecture confirmed:** Platform holds one copy of each book's chunks + extractions + embeddings. Families get `bookshelf_items` rows that are pointers. Personal curation (hearts/notes/hide) lives in `bookshelf_user_state` per-member, created on-demand. **Bulk assignment is a pointer-create operation — zero data copy, zero AI cost.**
- **4 scripts in `docs/bookshelf-bulk-assign/`:** `by-collection.sql`, `by-tag.sql`, `by-title-list.sql`, `from-source-family.sql`
- **Shared conventions:** dry-run default (flip `DRY_RUN=false` to execute), silent skip on duplicates, before/after row counts, sample titles preview, atomic transaction, no writes to `bookshelf_user_state`
- **Exact INSERT scope** on each script: only `bookshelf_items` rows with `family_id = :target_family_id`, `book_library_id = (existing)`, title + author copied from library row, `extraction_status='completed'`, `processing_status='completed'`, `intake_completed=true`, `chunk_count` copied from library

**Full audit findings, file-path reference index, risk matrix, and sub-phase specifics are in the [feature decision file](claude/feature-decisions/PRD-23-BookShelf-Platform-Library-Phase1b.md).**

#### What Does NOT Get Built In Phase 1b (stubs)

- Phase 1c drop of OLD per-family tables (30-day soak after 1b-F)
- Admin UI for `assign_book_to_family` (RPC only)
- Cross-family recommendations
- Shared author features
- `bookshelf_chapters` migration to platform
- Multi-part `chunk_count` SUM recalculation
- Cross-family extraction deduplication
- Cache-hit UI indication
- `bookshelf_shares` rewire (0 rows in prod — leave alone)
- `update_extraction_text` UI wiring
- Bulk cache-hit scanner for existing 559 books

---

---

