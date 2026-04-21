---
Status: COMPLETE — awaiting orchestrator adjudication
Stage: C
Scope: 4
Pattern: P6 — Caching and Reuse
Opened: 2026-04-20
ai_patterns.md reference: L198 (pattern entry); CLAUDE.md Convention #99 (persona caching); Convention #130 (spelling coach 3-tier lookup)
Dynamic evidence: None (static-only per founder dispatch shape, DECISIONS.md §Round 0 2026-04-20)
---

# Scope 4 — P6 Caching and Reuse Evidence Pass

## Worker summary

**Pattern definition (ai_patterns.md L198):** "Cache synthesized frameworks in `platform_intelligence`; do not regenerate." The applied-correctly shape per PLAN §2.6 is: platform-level synthesized content (Board of Directors public personas, book-summary frameworks, persona-classification results) writes to `platform_intelligence` cache tables and reads from cache BEFORE generating anything new. Per CLAUDE.md Convention #99: "always check `board_personas` by name (case-insensitive) before generating a new public persona."

**Site enumeration method:** (1) grep `supabase/functions/` for every Edge Function that writes to `board_personas`, `platform_intelligence.book_library`, `platform_intelligence.book_extractions`, or `spelling_coaching_cache`; (2) read each function end-to-end to trace the cache-check-before-generate flow; (3) grep `src/` and `supabase/` for any consumer of the `board_personas.embedding` column (P1 deferred this question); (4) verify case-insensitive lookup for persona cache per Convention #99; (5) verify 3-tier spelling coach lookup per Convention #130; (6) verify BookShelf cache-miss path sets `extraction_status='completed'` on cache hit and skips chunking.

**Headline result:** **Applied at 2 of 3 expected cache sites; 1 applied with a privacy defect; 1 unexpected finding (dead `board_personas.embedding` column).** Spelling coach 3-tier lookup is clean (static JSON → DB cache → Haiku fallback with write-back). BookShelf cache uses embedding-similarity lookup (0.9 threshold) via `upsert_book_library` RPC and correctly skips chunking on hit. Board of Directors persona cache checks case-insensitively via `.ilike()` BEFORE generation, BUT the cache query filters only by `content_policy_status='approved'` with no `persona_type` or `family_id` scoping — **a personal_custom persona created by Family A can be served as a cached match to Family B requesting a persona with the same name**, a cross-family privacy leak through cache. Separately, `board_personas.embedding` column is declared with HNSW index and (per P1 Round 1) 18 seeded personas exist, but NO consumer anywhere queries the column for semantic similarity, AND the embed Edge Function's TABLE_CONFIG does NOT include `board_personas`, AND the `lila-board-of-directors` generation path does NOT write embeddings on insert. The column is dead weight.

## Site enumeration table

| Site | Cache table | Consumer Edge Function | Cache key | Lookup location | Write-back location | Verdict | Evidence |
|---|---|---|---|---|---|---|---|
| Board of Directors persona generation | `board_personas` | `lila-board-of-directors` | `persona_name` (via `.ilike`) | `index.ts:314-319` (pre-generation check) | `index.ts:341-349` (post-Sonnet insert) | **Partial** — case-insensitive lookup present, but no `persona_type` or `family_id` scoping → cross-family leak | `supabase/functions/lila-board-of-directors/index.ts:313-323` |
| BookShelf title/author cache | `platform_intelligence.book_library` | `bookshelf-process` via `upsert_book_library` RPC | `title_author_embedding` (cosine similarity, 0.9 threshold) | Migration `00000000100125:49-60` (inside RPC) | Migration `00000000100125:63-71` (INSERT branch of same RPC) | **Applied** | `supabase/functions/bookshelf-process/index.ts:155-191`; `supabase/migrations/00000000100125:24-75` |
| BookShelf extraction cache (secondary) | `platform_intelligence.book_extractions` | `bookshelf-extract` writes; `bookshelf-process` skip-chunking on `wasCacheHit` | `book_library_id` FK (set by `upsert_book_library`) | `bookshelf-process/index.ts:357-394` (cache-hit short-circuit marks `extraction_status='completed'`, reuses sibling chunk_count) | Extraction is section-on-demand, writes to `platform_intelligence.book_extractions` via `insert_book_extractions` RPC (`bookshelf-extract/index.ts:258-262`) | **Applied** | `bookshelf-process/index.ts:343-394`; `bookshelf-extract/index.ts:233-278` |
| Spelling coach explanation cache | `spelling_coaching_cache` + static JSON seed | `spelling-coach` Edge Function + `useSpellCheckCoaching` hook | `LOWER(misspelling) + language` | **Tier 1** client: `src/hooks/useSpellCheckCoaching.ts:44-55` (static seed); **Tier 2** client: `ts:58-78` (DB cache); **Tier 3** Edge: `spelling-coach/index.ts:59-65` (cache re-check before Haiku) | `spelling-coach/index.ts:124-141` (upsert on `lower(misspelling),language`) | **Applied** — clean 3-tier; Edge Function also re-checks cache server-side to handle concurrent requests | `src/hooks/useSpellCheckCoaching.ts:30-119`; `supabase/functions/spelling-coach/index.ts:53-137`; `src/data/spelling-coaching-seed.json` (~30 entries) |

## Case-insensitive lookup check (Convention #99)

`lila-board-of-directors/index.ts:317` uses `.ilike('persona_name', name || '')`. Supabase `.ilike()` with no `%` wildcard behaves as case-insensitive equality — `"Jane Austen"` matches `"jane austen"` and `"JANE AUSTEN"`. Case-insensitivity requirement per Convention #99: **satisfied**.

**However** — two defects in the lookup scope:

1. **No `persona_type` filter.** The lookup returns any row with matching name + `content_policy_status='approved'`. Personal-custom personas have `content_policy_status='approved'` hardcoded at insert (`index.ts:335`, `isPersonal ? 'approved' : 'pending_review'`). This means a Family A's personal "Grandma Rose" (who was a specific real person) can be cache-matched to Family B's request for "Grandma Rose." B gets A's grandma's personality_profile.
2. **No `family_id` filter.** Personal-custom personas store `family_id` (`index.ts:338`), so they CAN be scoped, but the cache lookup at `:314-319` does not apply the scope. Community-generated personas have `family_id=NULL` and `is_public=false` until moderated (`index.ts:336`) — they also pass the cache filter while still pending_review is FALSE, but even approved community personas are `is_public=false` on first insert and only flip to `is_public=true` after moderation. The cache check ignores `is_public` entirely.
3. **`.limit(1)` without `.order()`.** Database chooses an arbitrary row when multiple match. Non-deterministic cache behavior compounds the leak.

Correct filter per PRD-34 + Convention #99 intent: cache should ONLY match PUBLIC system personas, i.e., `.eq('is_public', true).eq('content_policy_status', 'approved')` (Convention #99 says "public persona" explicitly). Personal-custom and community-pending personas must not be served across families.

## `board_personas.embedding` consumer analysis (P1 deferred question)

**Finding: the column is dead weight.**

- Column declared: migration `00000000100049_prd34_thoughtsift_tables.sql:29` (`embedding halfvec(1536)`)
- HNSW cosine index declared: migration `:84-85` (`idx_board_personas_embedding`)
- Seed INSERT at migration `:449` does NOT include `embedding` column → seeded 18 rows have `NULL` embeddings
- No other migration UPDATEs `board_personas` to backfill embeddings (grep of `UPDATE...board_personas` across all migrations returned only the `updated_at` trigger definition, not a data update)
- `supabase/functions/embed/index.ts` TABLE_CONFIG (verified via grep: 0 hits for `board_personas` in `embed/index.ts`) does NOT poll `board_personas` for NULL embeddings
- `lila-board-of-directors/index.ts:329-349` persona INSERT path writes `persona_name`, `personality_profile`, `source_references`, `category`, `content_policy_status`, `is_public`, `created_by`, `family_id` — no `embedding` column
- No RPC or Edge Function queries `board_personas` using `<=>` or embedding-based ORDER BY (grep for `board_personas.*<=>|<=>.*board_personas|match_personas|persona_similarity` returned only PRD-34 planning docs and P1 evidence, no live consumers)
- `BoardOfDirectorsModal.tsx:187-193` loads personas by `usage_count DESC` — frequency, not similarity

**Consequence:** Every seeded persona has a NULL embedding. Every user-generated persona has a NULL embedding. The HNSW index is empty. No code path reads the column. The embedding column, its HNSW index, and whatever backfill effort was originally planned for the 18 seed personas are **orphaned infrastructure** — not broken, but not consumed. If the intent was "embedding-based persona similarity suggestion for Board of Directors seating" (a natural P4 / P2 application where mom types a decision situation and LiLa auto-suggests semantically-matching advisors), that feature was never wired.

**Classification:** Intentional-Document OR Unintentional-Fix-Code, depending on founder intent. If persona similarity suggestion was intended → Fix-Code (wire the feature). If the embedding column was speculative infrastructure for a future feature not yet prioritized → Document (remove column to avoid confusion, or document the gap in ai_patterns.md).

## Unexpected findings

1. **Cross-family persona cache leak** — detailed in §"Case-insensitive lookup check" above. `lila-board-of-directors/index.ts:314-319` cache lookup is scoped only by `content_policy_status='approved'` + case-insensitive name match. Personal-custom personas carry `family_id` but the cache check ignores it. A personal persona from Family A can be returned as a cached match to Family B's creation request with the same name — Family B then sees Family A's personality_profile JSON, which may contain family-specific details (relationship context, speech patterns of an actual deceased relative, etc.). This is both a P6 correctness defect AND a privacy violation. Severity is worse than a simple cache miss: it's an active data cross-contamination.

2. **Missing `is_public=true` filter on public-persona cache check** — per Convention #99 ("before generating a new **public** persona"), the cache SHOULD only match public personas. The current filter (`content_policy_status='approved'`) is a necessary-but-insufficient condition. `personal_custom` inserts carry `content_policy_status='approved'` + `is_public=false`, so they pass the cache gate. Fix: add `.eq('is_public', true).eq('persona_type', 'community_generated')` (or the equivalent system_preloaded check) to the cache query.

3. **`board_personas.embedding` column is dead weight** — analyzed above. Either wire a consumer or remove the column + HNSW index + any seeded backfill. P1 Round 1 deferred this question to P6; this pass confirms no consumer exists.

4. **Board of Directors generation path does NOT write embeddings on INSERT** — even if a consumer were wired to use `board_personas.embedding`, every new persona inserted via `action='create_persona'` at `lila-board-of-directors/index.ts:341-349` would still have `NULL` embedding because the INSERT body omits the column. This is a secondary gap that would block any future consumer from working on the fresh corpus. Related to Finding #3.

5. **Spelling coach cache has belt-and-suspenders re-check** — positive finding. `spelling-coach/index.ts:59-65` re-checks the DB cache AFTER authentication but BEFORE Haiku call, even though the client hook (`useSpellCheckCoaching.ts:58-78`) already did a DB cache lookup. This handles the race condition where two concurrent clients miss the cache simultaneously; the second arriving at the Edge Function finds the first's write. Correct pattern; no finding.

6. **BookShelf cache uses embedding similarity, not exact title match** — positive finding. `upsert_book_library` RPC (migration `100125:48-56`) matches by `title_author_embedding` cosine similarity with a 0.9 threshold. "Atomic Habits by James Clear," "Atomic habits — Clear," "ATOMIC HABITS (JAMES CLEAR)" all collapse to the same cache row. This is strictly better than the Convention #99 case-insensitive-name standard and should be the model the persona cache copies. Not a finding; documented as reference.

## Proposed consolidation

Per PLAN §5.1, default is one finding per pattern-level miss. P6 surfaces distinct defects at a single site (BoD persona caching) with different root causes. Per PLAN §5.2, multiple findings per pattern are valid when distinct root causes require distinct fixes. Proposing **two findings** for P6 — one for the privacy-critical BoD cache leak (requires a scoped query fix + likely a backfill/audit of cross-family contamination to date) and one for the dead `board_personas.embedding` column (requires a design decision first: wire a consumer or drop the column).

### SCOPE-4.F{N} — Board of Directors persona cache is cross-family leak

**Root cause:** `lila-board-of-directors/index.ts:314-319` cache query filters only by `content_policy_status='approved'` + case-insensitive name match; does NOT filter by `is_public=true` and does NOT scope by `family_id` for personal-custom personas. Personal-custom personas carry `content_policy_status='approved'` by default (`index.ts:335`), so they pass the cache gate. Family A's "Grandma Rose" personal persona can be served as Family B's cached match.

**Classification:** **Unintentional-Fix-Code** (Convention #99 says "public persona"; the cache-query scope drifted from the convention at implementation time).

**Severity:** **High** — not cost-blocking, but privacy-blocking. A family's personal-custom persona's `personality_profile` JSON can leak to an unrelated family through cache match. Affects any family that creates a personal_custom persona with a name that another family might also request (first names, common-relative titles like "Grandma," "Papa," shared public figures used as personal). This is a data cross-contamination, not a cost leak.

**Beta Readiness:** **Y** — flagging because the leak is user-data-visible in production. Any founding family that creates a personal persona today is at risk if a second family chooses the same name tomorrow. Should be remediated before beta widens. Note: Beta Readiness default for Scope 4 is N per PLAN §7, but the exception criterion "any pattern miss that cumulatively projects per-family AI cost >$5/month" does not apply here; the rationale for Y is privacy-surface rather than cost. If orchestrator rules privacy concerns are not a valid Scope 4 Beta Readiness trigger, recommend N with a sibling Scope 5 / Scope 6 escalation.

**Fix scope:**
- (a) Amend cache query at `lila-board-of-directors/index.ts:314-319` to `.eq('is_public', true).eq('persona_type', 'community_generated')` (or include `'system_preloaded'` via `.in('persona_type', [...])` if system-preloaded personas are cache-eligible); keep `.ilike('persona_name', name || '')` + `.eq('content_policy_status', 'approved')`
- (b) Add a deterministic `.order()` (e.g., `.order('usage_count', { ascending: false })`) so cache returns the most-used matching persona consistently
- (c) Forensic audit: query production `board_personas` for duplicate `persona_name` across different `family_id` + `persona_type='personal_custom'` rows to identify any cross-family contamination that already happened via this bug. Surface results to founder for per-family data remediation.
- (d) Test: add an E2E test creating a personal persona "Test Name" in Family A, then attempting to create a personal persona "Test Name" in Family B — expected result is Family B gets its own generation, not Family A's cached row

### SCOPE-4.F{N+1} — `board_personas.embedding` column is orphaned infrastructure

**Root cause:** Migration `00000000100049:29` declares `embedding halfvec(1536)` with HNSW index at `:84-85`. Seeds at `:449` don't populate it. No migration backfills it. `embed` Edge Function TABLE_CONFIG does not include `board_personas`. `lila-board-of-directors` generation INSERT does not write the column. No code path queries the column for semantic similarity. The column exists; the consumer does not.

**Classification:** **Ambiguous — Document or Fix-Code per founder intent.** If persona-similarity suggestion ("type your decision context, LiLa suggests semantically-matching advisors from the library") was intended as a PRD-34 feature and was dropped during build, this is Fix-Code (wire the feature). If the column was speculative and the feature was descoped, this is Document (drop the column + HNSW index + the NULL embeddings on 18 seeded rows).

**Severity:** **Low** — no functional impact today. HNSW index is empty, so no query-plan degradation. Dead storage is trivial (1536 halfvec × 18 rows). The only cost is developer confusion (future builder sees the column, assumes a consumer exists, wastes time tracing).

**Beta Readiness:** **N** — pure tech debt, no user-visible effect.

**Fix scope (Document path):** Drop `embedding` column + `idx_board_personas_embedding` HNSW index in a cleanup migration; note in `ai_patterns.md` that persona similarity lookup is currently out-of-scope.
**Fix scope (Fix-Code path):** (a) Add `board_personas` to `embed/index.ts` TABLE_CONFIG; (b) Amend `lila-board-of-directors` persona INSERT to enqueue embedding generation (or backfill via consumer); (c) Backfill 18 seeded personas' embeddings via one-time script or migration; (d) Wire a consumer in `BoardOfDirectorsModal.tsx` (e.g., "suggest advisors for this situation" using user's current conversation content as query vector against personas).

## Orchestrator adjudication

*(leave blank)*
