---
Status: COMPLETE — awaiting orchestrator adjudication
Stage: C
Scope: 4
Pattern: P1 — Batch Processing
Opened: 2026-04-20
ai_patterns.md reference: L193 (pattern entry); L222–251 (Embedding Pipeline Infrastructure)
Dynamic evidence: None (static-only per founder dispatch shape, DECISIONS.md §Round 0 2026-04-20)
---

# Scope 4 — P1 Batch Processing Evidence Pass

## Worker summary

**Pattern definition (ai_patterns.md L193):** "Embed 100 items once, not one at a time on write." The applied-correctly shape per PLAN §2.1 is: writes to context-source tables enqueue into a pgmq `embedding_jobs` queue via the generic `util.queue_embedding_job()` trigger; a scheduled consumer (`pg_cron` every 10s + `embed` Edge Function) batches jobs and calls OpenAI once per batch. Never a synchronous OpenAI call on user-write.

**Site enumeration method:** (1) grep migrations for every `halfvec(1536)` and `vector(1536)` column declaration to inventory all embedding-bearing tables; (2) cross-reference against live_schema.md row counts to confirm column existence in production; (3) grep for `util.queue_embedding_job` references to map trigger wiring; (4) read `supabase/functions/embed/index.ts` to characterize consumer; (5) grep `supabase/functions/`, `src/`, and migrations for synchronous OpenAI embedding calls on write paths; (6) cross-reference `ai_usage_tracking` code paths.

**Headline result:** The overall pipeline **is functionally applied** via a consumer-polling architecture — NOT the documented pgmq queue architecture. Every user-write goes to a table; no synchronous OpenAI call fires on any write path; a pg_cron'd `embed` Edge Function polls tables for rows with `embedding IS NULL` and batches OpenAI calls. **Applied correctly at 10 of 11 context-source sites** by functional outcome. One exception (`archive_context_items`) is a documentation/migration gap — the Edge Function's TABLE_CONFIG declares the table, but no migration adds an `embedding` column, so the poll for that table silently no-ops. Two architectural infrastructure issues also surface: (a) `util.queue_embedding_job()` was replaced with a **no-op** in migration 029 (`PERFORM 1; -- no-op for now — pgmq not configured yet`) and the documented pgmq queue pipeline is dormant; (b) `pg_cron` scheduling for the `embed` consumer is not declared in any migration — it lives only as a comment pointing at the Supabase Dashboard.

## Site enumeration table

Expected sites from ai_patterns.md L251 listed first; additional discovered sites below.

| Site (table) | Migration:line | Expected application shape | Actual observed | Verdict | Evidence citation |
|---|---|---|---|---|---|
| `guiding_stars` | `00000000000005_personal_growth_foundation.sql:18,31-33` (column + trigger); `00000000000009:531-532` (halfvec upgrade + HNSW); `00000000000030:7-10` (trigger re-attach) | INSERT/UPDATE trigger → pgmq → consumer | Trigger attached, but function body is no-op (migration 029). Embed Edge Function polls `guiding_stars` in TABLE_CONFIG (embed/index.ts:60-64). 27 rows in live DB. | **Applied** (via polling consumer, not pgmq) | supabase/functions/embed/index.ts:60-64 |
| `best_intentions` | `00000000000005_personal_growth_foundation.sql:63,77-79`; `00000000000009:537-538`; `00000000000030:13-16` | INSERT/UPDATE trigger → pgmq → consumer | Same as above; TABLE_CONFIG embed/index.ts:75-79. 12 live rows. | **Applied** (via polling consumer) | supabase/functions/embed/index.ts:75-79 |
| `self_knowledge` | `00000000000005_personal_growth_foundation.sql:143,157-159`; `00000000000009:543-544`; `00000000000030:19-22` | INSERT/UPDATE trigger → pgmq → consumer | Same as above; TABLE_CONFIG embed/index.ts:65-69. 141 live rows. | **Applied** (via polling consumer) | supabase/functions/embed/index.ts:65-69 |
| `journal_entries` | `00000000000006_journal_notepad.sql:21,36-38`; `00000000000009:549-550`; `00000000000030:25-28` | INSERT/UPDATE trigger → pgmq → consumer | Same as above; TABLE_CONFIG embed/index.ts:70-74. 49 live rows. | **Applied** (via polling consumer) | supabase/functions/embed/index.ts:70-74 |
| `bookshelf_chunks` | `00000000100059_prd23_bookshelf_schema.sql:228,243-245` | INSERT/UPDATE trigger → pgmq → consumer | Trigger attached; function no-op; TABLE_CONFIG embed/index.ts:29-33. 58,379 live rows. | **Applied** (via polling consumer) | supabase/functions/embed/index.ts:29-33 |
| `archive_context_items` | `00000000100035_prd13_archives_context.sql:45-70` (NO embedding column); mindsweep RPC migration `00000000100089:318-322` **references `aci.embedding`** (column-does-not-exist planner risk) | INSERT/UPDATE trigger → pgmq → consumer | **No trigger exists** (no migration ever calls `util.queue_embedding_job()` for this table). **No embedding column exists** in live_schema.md (cols 1-21, no embedding). The embed Edge Function TABLE_CONFIG declares `archive_context_items` (embed/index.ts:80-84), so the poll query `.is('embedding', null)` is made against a table that lacks the column, silently failing and returning 0 rows. 173 live rows, 0 embedded, zero prospect of being embedded in current architecture. | **Not applied** | supabase/functions/embed/index.ts:80-84; supabase/migrations/00000000100035_prd13_archives_context.sql:45-70; supabase/migrations/00000000100089_mindsweep_tables.sql:318-322 |

### Additional discovered embedding-bearing tables (not in expected-sites list)

| Site (table) | Migration:line | Trigger wiring | Consumer wiring | Verdict | Notes |
|---|---|---|---|---|---|
| `bookshelf_summaries` | `00000000100059:296,316-318` | Trigger → no-op util fn | Polled via TABLE_CONFIG embed/index.ts:34-38 | **Applied** (polling) | 21,538 live rows |
| `bookshelf_insights` | `00000000100059:373,394-396` | Trigger → no-op util fn | Polled via TABLE_CONFIG embed/index.ts:39-43 | **Applied** (polling) | 24,360 live rows |
| `bookshelf_declarations` | `00000000100059:455,476-478` | Trigger → no-op util fn | Polled via TABLE_CONFIG embed/index.ts:44-48 | **Applied** (polling) | 16,931 live rows |
| `bookshelf_action_steps` | `00000000100059:534,554-556` | Trigger → no-op util fn | Polled via TABLE_CONFIG embed/index.ts:49-53 | **Applied** (polling) | 16,396 live rows |
| `bookshelf_questions` | `00000000100059:614,634-636` | Trigger → no-op util fn | Polled via TABLE_CONFIG embed/index.ts:54-58 | **Applied** (polling) | 10,168 live rows |
| `bookshelf_items.title_author_embedding` | `00000000100059:22` | No `util.queue_embedding_job` trigger attached (computed by `bookshelf-process` Edge Function as part of async upload pipeline) | Async batch during upload (bookshelf-process/index.ts:104-122) | **Applied** (async-upload pipeline is itself the batch) | 562 live rows |
| `board_personas.embedding` (PRD-34) | `00000000100049_prd34_thoughtsift_tables.sql:29,85` | No trigger attached; seeded directly | Not polled by `embed` Edge Function (not in TABLE_CONFIG) | **Ambiguous** — embedding is populated at INSERT time for 18 seeded personas; pattern for future personas unclear from static inspection. Defer to P2/P6 evidence pass (persona caching). | No write-path sync-call evidence surfaced |
| `platform_intelligence.book_extractions.embedding` | `00000000100122_bookshelf_phase1b_embeddings.sql:27`; trigger `00000000100092:120-122` | Trigger attached → no-op util fn | Polled via dedicated RPC `get_unembedded_book_extractions` (embed/index.ts:225-266) | **Applied** (polling via platform_intelligence RPC) | 89,921 live rows |
| `platform_intelligence.book_chunks.embedding` | `00000000100090_bookshelf_platform_library.sql:39,53` | No trigger | Polled via `get_unembedded_book_chunks` RPC (embed/index.ts:272-312) | **Applied** (polling) | 56,964 live rows |
| `platform_assets.embedding` (migration 100025) | `00000000100025_platform_assets_embeddings.sql:10,18` | No trigger; seeded with pre-computed embeddings via migrations | N/A (admin/seed-time) | **Applied** (batch-seeded, not user-write path) | 622 live rows |

## Consumer wiring

- **`embed` Edge Function** — `supabase/functions/embed/index.ts`. Polls 11 tables in TABLE_CONFIG for `embedding IS NULL` rows (embed/index.ts:27-85), up to `batchSize` total (default 50, capped 200). Calls `getEmbedding()` → OpenAI `text-embedding-3-small` endpoint (embed/index.ts:90-110). Writes result back via `.update({ [embeddingColumn]: JSON.stringify(embedding) })` (embed/index.ts:157-173). Three platform_intelligence tables (`book_cache`, `book_extractions`, `book_chunks`) are polled via SECURITY DEFINER RPCs because they live in a non-PostgREST schema (embed/index.ts:179-312).
- **pg_cron schedule for `embed`** — NOT present in any migration. Migration `00000000000000_extensions_and_infrastructure.sql:50-68` contains only a comment ("pg_cron scheduling is set up via Supabase Dashboard because it requires the supabase_url and service_role_key"). Live scheduling status therefore depends on Dashboard state, which this static pass cannot verify. Other pg_cron jobs (mindsweep auto-sweep, penciled-in expiry, carry-forward, etc.) ARE declared in migrations via `cron.schedule(...)` — the `embed` cron job is an outlier.
- **Batch size** — 50 rows per invocation (embed/index.ts:16). This is an aggregate across all 11 tables (budget is decremented across the loop), so an individual table sees ≤50 embeddings per consumer cycle. Per-table HNSW indexes make retrieval fast; writes remain single-row `UPDATE`.
- **OpenAI endpoint** — `https://api.openai.com/v1/embeddings` with model `text-embedding-3-small` (embed/index.ts:91-101). One HTTP call per row (not per batch), so the "batch" in P1 is temporal-batching, not request-batching. This is acceptable per P1's intent — the key property is that no synchronous OpenAI call runs on user-write; all embedding work runs in a scheduled consumer cycle.
- **Cost logging** — aggregate `logAICost` call at consumer completion, estimating 500 tokens/row (embed/index.ts:396-405). Single `ai_usage_tracking` row per consumer cycle with `featureKey='embedding_batch'`, `model='text-embedding-3-small'`.
- **Error handling** — try/catch per row (embed/index.ts:345-367); per-table errors caught in `fetchUnembeddedRows` (embed/index.ts:136-139); OpenAI failures surface as `totalFailed` in response but do not halt the batch.

## Synchronous write-path scan

Grep result: `text-embedding-3-small|openai\.com/v1/embeddings|embeddings\.create` across the repo yielded 40 files. Relevant hits (Edge Functions and src/):

| Call site | Path | Classification |
|---|---|---|
| `embed/index.ts:91` | Supabase Edge Function | **Consumer** — correct (batch-polling) |
| `bookshelf-search/index.ts:122` | Supabase Edge Function | **Query-path** — embedding for a user-issued semantic search query, not a write-path enqueue. Returns search results; does not persist embedding. |
| `bookshelf-discuss/index.ts:78` | Supabase Edge Function | **Query-path** — per-turn query embedding for RAG retrieval in discuss mode. Not written to a persistence table. |
| `generate-query-embedding/index.ts:51` | Supabase Edge Function | **Query-path** — frontend ad-hoc query embedding (Morning Insight, etc.). Returns vector to caller; does not persist. |
| `embed-text-admin/index.ts:54` | Supabase Edge Function | **Admin-only service wrapper** — not a user-write path. |
| `bookshelf-process/index.ts:105` | Supabase Edge Function | **Upload-async pipeline** — called during book upload processing, which is itself an async job (not a synchronous user-write). Computes title+author embedding for cache-hit lookup. The function ALSO invokes `embed` at line 598 to trigger chunk embedding asynchronously. |
| `mindsweep-sort/index.ts:467` | Supabase Edge Function | **P2 Embedding-Based Classification** — user input embedded at classification time for pattern-library similarity match. NOT a P1 write-path violation: the embedding is used transiently and is not the persisted column on `mindsweep_events`. Deferred to P2 evidence pass. |

Client-side (`src/`) grep for `text-embedding-3-small|openai\.com/v1/embeddings|embeddings\.create`: **0 hits**. No browser-side OpenAI embedding calls exist.

Trigger/function body scan: `util.queue_embedding_job()` body (migration 029:9-20) contains `PERFORM 1; -- no-op for now — pgmq not configured yet`. No `pg_net.http_post` or equivalent synchronous OpenAI call exists inside any trigger function. **Zero synchronous write-path OpenAI call sites** disqualifying to P1 were found.

## Historical telemetry

Static pass; no SQL queries executed against production per founder dispatch shape (DECISIONS.md §Round 0 2026-04-20: "no new staged AI calls against production this pass"). `ai_usage_tracking` SELECT is a read-only query, but orchestrator did not pre-approve running it in this worker's scope and the evidence file is drafted static-only. Live schema row count for `ai_usage_tracking` is 531 rows (live_schema.md). A recommended follow-up (for either orchestrator adjudication or a later static-enrichment pass) is a single read-only query: `SELECT feature_key, COUNT(*), SUM(tokens_used) FROM ai_usage_tracking WHERE feature_key IN ('embedding_batch','generate_query_embedding','bookshelf_search','bookshelf_discuss') GROUP BY feature_key` — this would confirm whether the `embed` consumer is firing in production and at what cadence. Defer to walk-through if the orchestrator wants to escalate.

## Unexpected findings

1. **`util.queue_embedding_job()` was downgraded to a no-op in migration 029** (`00000000000029_fix_pgmq_permissions.sql:9-20`). The documented pgmq `embedding_jobs` pipeline (ai_patterns.md L237 "Pipeline Flow") is **not active** in production. The actual pipeline is a consumer-polling model that reads tables directly for NULL embeddings. Functionally equivalent P1 behavior results, but the documented architecture diverges from reality. Migration 030 re-attaches triggers to the now-no-op function — a sequence that suggests the drift happened under time pressure rather than by design (migration 029 comment "pgmq not configured yet" implies an intended revisit that never landed). **Documentation-reality drift, not a P1 functional miss.**
2. **`archive_context_items` missing embedding column.** ai_patterns.md L251 lists the table as embedding-bearing; the embed Edge Function TABLE_CONFIG declares it; the MindSweep RPC in migration 100089:318-322 references `aci.embedding`; but no migration ever adds the column. live_schema.md confirms no `embedding` column (21 columns listed, no `embedding`). Impact: 173 live archive context items are never embedded; the mindsweep cross-source search RPC cannot match against them; LiLa context assembly loses one of its 6 advertised context sources from semantic routing. **This is a P1 functional miss at one of six expected sites.**
3. **`pg_cron` schedule for `embed` consumer is undeclared in migrations.** Every other cron job in the codebase (`mindsweep-auto-sweep`, `advance_task_rotations`, `process_carry_forward_fallback`, `expire_overdue_task_claims`, `allowance_period_calculation`, etc.) is installed via `cron.schedule(...)` in a migration. The `embed` consumer schedule lives only as a comment in migration `00000000000000_extensions_and_infrastructure.sql:50-68` pointing at the Supabase Dashboard. If someone rebuilds a staging environment from migrations alone, the consumer would not be scheduled and every embedding-bearing table would stop receiving embeddings. **Infrastructure-as-code gap, not a P1 functional miss in production.**
4. **Trigger granularity is coarse.** Triggers fire `AFTER INSERT OR UPDATE` without a `WHEN (OLD.content IS DISTINCT FROM NEW.content)` clause on the text column. If the trigger function body were restored from the no-op, updates that touch only metadata columns (e.g., `is_included_in_ai` toggles, sort_order changes) would re-enqueue unnecessary embedding jobs. This is latent tech-debt made invisible by the current no-op; surfaces only if the pgmq pipeline is restored.
5. **`board_personas` embedding column is polled by no consumer.** TABLE_CONFIG in embed/index.ts does not include `board_personas`. Live DB has 18 rows. If personas are seeded with pre-computed embeddings (P6 caching pattern), no further action is needed. Defer to P6 evidence pass for adjudication.

## Proposed consolidation

Per PLAN §5.1, default is one `SCOPE-4.F{N}` finding per pattern at most. One pattern-level finding proposed, capturing all three above (the three are related root causes of the same architectural drift between documented pgmq pipeline and actual polling-consumer pipeline):

**Finding body draft — SCOPE-4.F{N} (number assigned during apply-phase):**

- **Title:** P1 Batch Processing — embedding pipeline applied via polling-consumer architecture, not the documented pgmq queue; one expected site (`archive_context_items`) missing embedding column; pg_cron schedule for `embed` consumer undeclared in migrations
- **Severity proposal:** Medium. No synchronous OpenAI call on any write path (the core P1 invariant holds). `archive_context_items` miss produces a real functional gap (semantic search across 173 archive items is broken and the MindSweep cross-source RPC is silently degraded), but the remaining 10 embedding-bearing tables process correctly. The pg_cron infrastructure-as-code gap is a staging-reproducibility risk, not a production outage.
- **Classification:** Mixed — `archive_context_items` column gap is **Unintentional-Fix-Code** (add `embedding halfvec(1536)` column + HNSW index + trigger; one migration). pgmq→polling drift is **Intentional-Document** (the polling architecture works; ai_patterns.md should be updated to describe the real pipeline OR the no-op function should be restored to the pgmq path — founder's call). pg_cron-undeclared is **Unintentional-Fix-Code** (add `cron.schedule('process-embeddings', ...)` to a migration).
- **Beta Readiness flag proposal:** N. None of the three sub-issues cross PLAN §7 exception thresholds — no Sonnet-on-child-surface, no context-bulk-load, no cost-ceiling concern. Actual embedding cost is bounded by rows-with-NULL-embedding polling which is self-limiting.
- **Sites affected:** `archive_context_items` (missing column). pipeline-documentation drift affects all 11 tables in TABLE_CONFIG. pg_cron-undeclared affects all 11 tables in staging-rebuild scenarios.
- **Sites applying correctly:** `guiding_stars`, `best_intentions`, `self_knowledge`, `journal_entries`, `bookshelf_chunks`, `bookshelf_summaries`, `bookshelf_insights`, `bookshelf_declarations`, `bookshelf_action_steps`, `bookshelf_questions`, `platform_intelligence.book_extractions`, `platform_intelligence.book_chunks`, `bookshelf_items.title_author_embedding`, `platform_assets.embedding`.
- **Cross-refs to Scope 2 / Scope 3+8b findings:** No Scope 2 finding was emitted on this surface (Scope 2 batches ran PRD-to-code alignment, not pattern verification). AUDIT_REPORT_v1.md §2 Batch 3 (Personal Growth — PRD-06, PRD-07, PRD-08) and Batch 7 (Vault/BookShelf — PRD-23) both pass through the embedding-bearing tables without surfacing this drift. PATTERN-FLAG-FOR-SCOPE-4 line 395 of AUDIT_REPORT_v1.md mentions "MindSweep P2 embedding-first classification verification against production `ai_usage_tracking` data" but that is a P2 target, distinct from this P1 finding.

### Alternative: three separate findings

If orchestrator judges the three sub-issues have meaningfully different root causes and fix scopes:
- **Finding A:** `archive_context_items` missing embedding column — Unintentional-Fix-Code, Medium severity
- **Finding B:** pgmq pipeline dormant / polling-consumer architecture undocumented — Intentional-Document, Low severity
- **Finding C:** `embed` pg_cron schedule undeclared in migrations — Unintentional-Fix-Code, Low severity

Recommend single consolidated finding per §5.1 default; orchestrator can split during walk-through if preferred.

## Orchestrator adjudication

*(filled during walk-through — Round 1 of DECISIONS.md)*
