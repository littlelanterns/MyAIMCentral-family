---
Status: DRAFT — awaiting founder approval before any evidence pass begins
Stage: C
Scope: 4 (cost optimization patterns P1–P9)
Opened: 2026-04-20
Related: [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §4; [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 (lines 310–313); [claude/ai_patterns.md](../claude/ai_patterns.md) §"9 AI Cost Optimization Patterns" lines 192–202
---

# Scope 4 — Cost Optimization Pattern Verification Plan

> Orchestration plan for the 9 cost optimization patterns P1–P9 defined in [claude/ai_patterns.md](../claude/ai_patterns.md). Scope 4 verifies each pattern is applied where it should be applied. Unlike Scopes 2, 3, and 8a/8b, some Scope 4 findings require dynamic evidence (staged AI call counts vs `ai_usage_tracking` rows) rather than static code inspection. Dynamic-evidence workers touch production and must be dispatched with care.

## 1 — Purpose

Per Gameplan lines 310–313:
- Verify each of P1–P9 is applied where it should be
- Identify AI calls that should be using embedding-based classification but aren't
- Check context loading is relevance-filtered, not bulk-loaded (Layered Context Assembly per [claude/ai_patterns.md](../claude/ai_patterns.md) lines 96–166)

A missing pattern at a single call site is a local defect. A missing pattern across many call sites (e.g., multiple Edge Functions calling Sonnet where Haiku would suffice) is a systemic defect. Scope 4 surfaces both.

**Scope boundary vs Scope 2 and Scope 3+8b:**
- Scope 2: a PRD spec says "use embeddings here" and the code doesn't → captured in Scope 2's PRD-to-code alignment.
- Scope 4: the PRD is silent on cost patterns but `claude/ai_patterns.md` says "pattern P2 applies to this shape of problem" → captured here.
- Scope 3+8b: cost-pattern drift on a cross-PRD integration seam → primary in Scope 3; Scope 4 captures same-site patterns.

When Scope 4 identifies a call-site miss already surfaced by Scope 2 or 3, it cites the other scope's finding and does not re-emit.

## 2 — Pattern inventory — 9 patterns

Sourced from [claude/ai_patterns.md](../claude/ai_patterns.md) lines 192–202 (the "9 AI Cost Optimization Patterns" table). Per-pattern section below defines: (a) what "applied correctly" looks like, (b) what sites should apply it, (c) verification mechanic.

### 2.1 P1 — Batch Processing

*Definition (ai_patterns.md L193):* "Embed 100 items once, not one at a time on write."

**Applied correctly looks like:** writes to context-source tables enqueue into `pgmq` `embedding_jobs` queue; a scheduled consumer (`pg_cron` + `embed` Edge Function) batches jobs and calls OpenAI once per batch. Never a synchronous OpenAI call on user-write request. Per ai_patterns.md L237 ("Pipeline Flow") + CLAUDE.md Convention #5 ("Never synchronous AI calls on write").

**Sites that should apply it:**
- All tables listed in ai_patterns.md L251 ("Tables Receiving Embeddings"): `archive_context_items`, `best_intentions`, `self_knowledge`, `guiding_stars`, `journal_entries`, `bookshelf_chunks`
- Plus any new context-source table introduced since ai_patterns.md was last edited (requires grep for all columns of type `halfvec(1536)` or `vector`)

**Verification mechanic:**
- **Static (primary):** grep every INSERT/UPDATE trigger for `util.queue_embedding_job()` call. Grep every INSERT path for direct `openai.com` call (disqualifying — must go through queue).
- **Dynamic (optional):** issue a test write to one table of each kind, query `pgmq.q_embedding_jobs` within 5 seconds to confirm enqueue, wait for consumer cycle, query row to confirm embedding populated. Reserved for a single representative site per table type — not every row.

### 2.2 P2 — Embedding-Based Classification

*Definition (ai_patterns.md L194):* "Replace Haiku classifier calls with pgvector semantic queries."

**Applied correctly looks like:** classification of user-input text uses embedding similarity against a reference corpus (pattern library, template examples, prior-classified items) before falling back to Haiku. MindSweep is the canonical example per ai_patterns.md L220 ("MindSweep classification | Embedding-first, Haiku fallback").

**Sites that should apply it:**
- MindSweep classifier (`supabase/functions/mindsweep-sort/`)
- Sentiment classification for feedback submissions (per ai_patterns.md L221)
- Blog comment moderation (currently Haiku per ai_patterns.md L218 — confirm whether embedding-first pre-screen would reduce Haiku volume)
- Any routing decision that picks between N options based on content (Studio Queue destination suggestion, Review & Route destination suggestion per PRD-08, MindSweep-Lite classification per PRD-18 Phase C)
- Board of Directors persona pre-screen? — ai_patterns.md is ambiguous; flag for orchestrator adjudication

**Verification mechanic:**
- **Static (primary):** grep for `mindsweep-sort` call-site consumers. For each suspected classifier site, read the code: does it call Haiku unconditionally, or does it try embedding similarity first?
- **Dynamic (priority):** stage N test inputs per classifier site; count rows added to `ai_usage_tracking` during the staged run; compare against the "P2 applied correctly" expectation of ~90% embedding hits / ~10% Haiku fallback per CLAUDE.md's "~90% of routine classification uses pgvector embeddings, not LLM calls" claim. A site that returns 100% Haiku indicates P2 not applied.

Gameplan line 312 calls this out as a priority verification target: "Identify AI calls that should be using embedding-based classification but aren't."

### 2.3 P3 — Context Learning Detection

*Definition (ai_patterns.md L195):* "Only trigger Haiku when embedding delta exceeds threshold."

**Applied correctly looks like:** context learning system (detects patterns in family behavior to generate new archive context suggestions) compares the current conversation's embedding against the family's prior-conversations centroid. Only when the delta exceeds a threshold (novelty detection) does Haiku get called to synthesize a new context insight.

**Sites that should apply it:**
- Whatever implements "context learning" per ai_patterns.md — likely lila-chat post-conversation processing
- `context_learning_dismissals` table exists (0 rows) which suggests the learning trigger is wired somewhere; needs grep to locate
- Any async Haiku call in background cron jobs that processes conversation batches

**Verification mechanic:**
- **Static (primary):** grep for any Haiku call inside a cron-triggered Edge Function and verify each is preceded by an embedding-delta check.
- **Dynamic (optional):** stage a high-repetition conversation pattern (same topic repeated 5x), then stage a genuinely novel conversation, measure how many Haiku calls fire against `ai_usage_tracking` for each case. P3 applied correctly means novel triggers 1 Haiku call, repetition triggers 0.

### 2.4 P4 — Semantic Context Compression

*Definition (ai_patterns.md L196):* "Embeddings reduce context tokens sent to reasoning model."

**Applied correctly looks like:** the context assembler retrieves the *most relevant* context items per query via embedding similarity rather than stuffing the prompt with every `is_included_in_ai=true` item in the family's archive. Per ai_patterns.md Layered Context Assembly (lines 96–166): Layer 1 always loaded (~200 tokens); Layer 2 on-demand by relevance (name detection + topic matching); Layer 3 search-only.

**Sites that should apply it:**
- `_shared/context-assembler.ts` in `supabase/functions/`
- Every LiLa Edge Function that calls `assembleContext()` (lila-chat, lila-mediator, lila-board-of-directors, all other lila-* functions)
- BookShelf Discuss (`bookshelf-discuss` Edge Function)

**Verification mechanic:**
- **Static (primary):** read `_shared/context-assembler.ts`. Confirm Layer 1/Layer 2/Layer 3 structure matches ai_patterns.md lines 98–125. Confirm name-detection and topic-matching trigger logic is present. Confirm no path exists that loads *all* `is_included_in_ai=true` items regardless of relevance.
- **Static (secondary):** for each lila-* Edge Function, confirm it invokes `assembleContext()` rather than building its own context-load path.
- **Dynamic (optional):** stage a LiLa conversation, inspect the token count sent to the model in `lila_conversations.token_usage` or `ai_usage_tracking.tokens_used`. Expected: tokens scale with conversation topic relevance, not with family archive size.

Gameplan line 313 calls this out as a priority verification target: "Check context loading is relevance-filtered, not bulk-loaded."

### 2.5 P5 — On-Demand Secondary Output

*Definition (ai_patterns.md L197):* "Generate primary output only; extras (alt titles, tags) on request."

**Applied correctly looks like:** AI feature generates the minimum viable output on first call; user has to request tags, alt titles, or additional variants explicitly. Never pre-generate options the user didn't ask for.

**Sites that should apply it:**
- Any feature with multiple optional outputs (Task Breaker with 3 levels — confirm each level is its own call, not one call producing all three)
- Victory celebration narrative — is the narrative the only output, or does it auto-generate tags too?
- Guiding Star craft — confirm no auto-generated related stars or alt phrasings unless requested
- Board of Directors — confirm one persona-response per seat-turn, not pre-generating follow-up turns

**Verification mechanic:**
- **Static only:** read each AI-output feature's Edge Function. Confirm single primary output per call. Flag any multi-output generation.

### 2.6 P6 — Caching and Reuse

*Definition (ai_patterns.md L198):* "Cache synthesized frameworks in `platform_intelligence`; do not regenerate."

**Applied correctly looks like:** platform-level synthesized content (Board of Directors public personas, book-summary frameworks, persona-classification results) writes to `platform_intelligence` cache tables and reads from cache before generating anything new. Per CLAUDE.md PRD-34 convention #99: "Persona caching (P8 pattern): always check `board_personas` by name (case-insensitive) before generating a new public persona."

**Sites that should apply it:**
- Board of Directors persona generation (`lila-board-of-directors` Edge Function) — check `board_personas` table before Haiku content policy screen + Sonnet generation
- BookShelf extraction pipeline — `platform_intelligence.book_library` + `platform_intelligence.book_extractions` cache per book cache_id
- Spelling coach — `spelling_coaching_cache` table (30 rows per live_schema) — confirm lookup order per CLAUDE.md convention #130 (static JSON > `spelling_coaching_cache` > Haiku AI)
- Any other "check cache first" pattern that surfaces during grep

**Verification mechanic:**
- **Static (primary):** for each known cache site, read the Edge Function. Confirm a cache-lookup precedes any model call. Confirm cache-write happens after model call succeeds.
- **Dynamic (optional):** stage a generation that should hit cache (e.g., request the same BoD persona that another user has generated); confirm 0 rows added to `ai_usage_tracking` for that session.

### 2.7 P7 — Time-Based Sampling

*Definition (ai_patterns.md L199):* "Process a sample of messages for patterns, extrapolate."

**Applied correctly looks like:** any "analyze patterns across the family's messaging / journaling / tracker history" feature processes a sample (e.g., every 10th message, or last 30 days only) rather than the full corpus.

**Sites that should apply it:**
- Safety monitoring Layer 2 Haiku classifier (per CLAUDE.md PRD-30 — but PRD-30 unbuilt per SCOPE-8a.F3, so no site to verify yet)
- Weekly/monthly aggregation features (`monthly-aggregate` Edge Function per architecture.md)
- Any "give me a summary of this week" feature

**Verification mechanic:**
- **Static only:** read each aggregation Edge Function. Confirm sampling or windowing is explicit. Flag any `SELECT * FROM ... ORDER BY created_at` with no LIMIT and no date-range clause.

### 2.8 P8 — User-Controlled Scope

*Definition (ai_patterns.md L200):* "Let users opt in/out of specific AI features via toggles."

**Applied correctly looks like:** every AI-consuming feature has a user-visible toggle to disable its AI usage. The three-tier `is_included_in_ai` toggle chain (person/category/item) is the flagship implementation. Per-member `lila_tool_permissions` rows gate per-tool access.

**Sites that should apply it:**
- Every context-source table's `is_included_in_ai` column + consuming UI toggle
- Every LiLa mode's `lila_tool_permissions` row + Settings → Family Members → per-member AI tools UI
- Message coaching toggle (`message_coaching_settings.is_enabled`)
- Any new AI-consuming feature that ships without a toggle

**Verification mechanic:**
- **Static only:** grep every feature that calls a model and confirm a user-visible toggle exists in `src/components/settings/` or equivalent. No dynamic evidence needed.

### 2.9 P9 — Per-Turn Semantic Refresh

*Definition (ai_patterns.md L201):* "Sliding 4-message detection window re-evaluates context relevance each turn (implemented via `assembleContext()`)."

**Applied correctly looks like:** context relevance is recomputed on every conversation turn against a sliding 4-message window, not cached for the whole conversation. If mom mentions a new child's name mid-conversation, that child's context is loaded on the next turn — not delayed until a new conversation. Per ai_patterns.md Layer 2 "Trigger A: Name Detection" and "Trigger B: Topic Matching."

**Sites that should apply it:**
- `_shared/context-assembler.ts` `assembleContext()` function — the definition site per ai_patterns.md
- Every lila-* Edge Function that passes turn-by-turn messages through `assembleContext()`
- BookShelf Discuss per-turn context assembly

**Verification mechanic:**
- **Static (primary):** read `assembleContext()` and confirm it receives the current message + last 4 messages window. Confirm it re-runs name detection and topic matching on each invocation, not just first-turn.
- **Dynamic (priority):** stage a conversation where topic shifts between turn 2 and turn 3; inspect the Layer 2 context actually loaded per turn (via added instrumentation or via ai_usage_tracking token deltas) and confirm the context changed.

## 3 — Static-vs-dynamic classification

Per Gameplan line 310, some Scope 4 verifications require dynamic evidence. Summary:

| Pattern | Verification mechanic | Dynamic evidence needed? | Priority target per Gameplan |
|---|---|---|---|
| P1 Batch Processing | Static primary; dynamic optional (single test write per table type) | Optional | — |
| P2 Embedding-Based Classification | Static primary; dynamic priority (stage test inputs, measure AI call counts) | **Yes — priority** | **Yes — line 312** |
| P3 Context Learning Detection | Static primary; dynamic optional | Optional | — |
| P4 Semantic Context Compression | Static primary; dynamic optional (token count inspection) | Optional but valuable | **Yes — line 313** |
| P5 On-Demand Secondary Output | Static only | No | — |
| P6 Caching and Reuse | Static primary; dynamic optional | Optional | — |
| P7 Time-Based Sampling | Static only | No | — |
| P8 User-Controlled Scope | Static only | No | — |
| P9 Per-Turn Semantic Refresh | Static primary; dynamic priority (turn-by-turn context inspection) | **Yes — priority** | Aligned with line 313 |

### 3.1 Dynamic evidence discipline

Dynamic evidence workers touch production or near-production surfaces. Rules:

- **Scoped test inputs only.** Each dynamic test uses a pre-agreed test family and test member (set up at test-harness creation time), never a real family's data.
- **Low-volume.** A single dynamic test per pattern per site is sufficient. Do not loop.
- **Logged.** Every dynamic test records its `ai_usage_tracking` rows (cost observed vs cost expected under correct pattern application).
- **Founder approval required at dispatch time.** The orchestrator drafts the dynamic-test recipe; founder approves before the worker runs.
- **No destructive state changes.** Dynamic tests may insert test rows; those rows must be explicitly cleaned up or flagged in the test family's scope.

## 4 — Per-pattern packet format

Each of the 9 patterns produces one evidence file:

```
scope-4-evidence/EVIDENCE_P{N}_{pattern-slug}.md
```

Example filenames:
- `EVIDENCE_P1_batch-processing.md`
- `EVIDENCE_P2_embedding-based-classification.md`
- `EVIDENCE_P3_context-learning-detection.md`
- `EVIDENCE_P4_semantic-context-compression.md`
- `EVIDENCE_P5_on-demand-secondary-output.md`
- `EVIDENCE_P6_caching-and-reuse.md`
- `EVIDENCE_P7_time-based-sampling.md`
- `EVIDENCE_P8_user-controlled-scope.md`
- `EVIDENCE_P9_per-turn-semantic-refresh.md`

### 4.1 Evidence file structure

Per file:

1. **Frontmatter** — Status, Stage, Scope (4), Opened date, pattern ID, pattern name, ai_patterns.md line reference.
2. **Worker cover paragraph (10–20 lines)** — pattern definition re-stated, site enumeration method used, headline result (applied correctly at N of M sites).
3. **Site enumeration table** — columns: `site (file:line or Edge Function name) × expected application shape × actual observed × verdict (applied / not applied / ambiguous) × evidence citation`.
4. **Dynamic evidence section** (for P2, P4, P9): test recipe, expected result, observed result, `ai_usage_tracking` row counts, discrepancy.
5. **Unexpected findings list** — sites surfaced during grep that were not on the expected-site list.
6. **Proposed consolidation** — one finding per pattern-level miss by default (§5).
7. **Orchestrator adjudication table** — filled during walk-through.

### 4.2 Worker prompt shape

Per-pattern worker prompt template (for dispatch during Stage C execution; NOT drafted now):

> "Read [claude/ai_patterns.md](../claude/ai_patterns.md) §{pattern-section}. Read this PLAN's §2.{N} for the pattern's expected sites and verification mechanic. Enumerate all call sites across `supabase/functions/`, `src/lib/`, and relevant hooks. For each site, assess whether the pattern is applied correctly per the 'applied correctly looks like' criteria. Grep-primary per Convention 242. Produce the site enumeration table. Flag misses. Emit `SCOPE-4.F{N}` at the pattern level (one finding per pattern-level miss, not per-site), following the consolidation rules in §5. If this pattern requires dynamic evidence (P2, P4, P9), propose a dynamic test recipe and surface to founder for approval before running."

## 5 — Consolidation discipline

### 5.1 Per-pattern consolidation — one finding per pattern-level miss

**Default:** one `SCOPE-4.F{N}` finding per pattern. The finding body names which sites are affected and which sites apply correctly; individual sites are listed in the evidence file.

Example: "SCOPE-4.F2 P2 embedding-first classification applied at MindSweep, not applied at feedback sentiment or blog comment moderation — 2 of 5 classifier sites miss."

### 5.2 When to emit multiple findings per pattern

Rare. Valid cases:
- **Same pattern, two root causes.** E.g., P4 Semantic Context Compression applied correctly in `assembleContext()` but an entirely parallel context-load path exists in a non-shared Edge Function — two different root causes require two different fixes.
- **Static miss + dynamic drift.** Static inspection passes but dynamic measurement shows drift (e.g., P9 wired correctly in code but `ai_usage_tracking` shows context tokens climbing unboundedly mid-conversation, indicating a failure mode the code analysis missed).

### 5.3 Cross-pattern finding — "all cost patterns missed on feature X"

If a single feature (new Edge Function, new AI integration) misses 3+ cost patterns at once, emit one finding naming the feature and listing the missed patterns, rather than N per-pattern findings. Rationale: one fix scope (instrument the feature properly) addresses all N patterns.

## 6 — Expected misses

Gameplan lines 312–313 pre-flag two priority verification targets. These are expected-miss candidates:

1. **P2 Embedding-Based Classification misses** — Gameplan line 312: "AI calls that should be using embedding-based classification but aren't." Candidate sites: feedback sentiment, blog comment moderation, any routing-suggestion surface (Review & Route destination, Studio Queue destination suggestion, MindSweep-Lite teen disposition translation).
2. **P4 Semantic Context Compression / Layered Context Assembly** — Gameplan line 313: "context loading is relevance-filtered, not bulk-loaded." Candidate drift: any lila-* Edge Function that bypasses `assembleContext()` and loads context directly.

## 7 — Beta Readiness flag default

**Default: N for all Scope 4 findings.** Cost patterns are optimization; they don't block beta by default.

**Exception: Y flag** when the missing pattern causes:
- Sonnet call on a child-facing surface that would be Haiku-class under correct pattern application — beta-cost ceiling concern for founding-family sustainability
- Context-bulk-load on a surface exposed to Guided/Play shells — token-cost concern that scales per family per day
- Any pattern miss that cumulatively projects per-family AI cost >$5/month against the <$1/family/month target per CLAUDE.md architectural principles line 12

Worker default: N. Flag Y requires a 1-sentence rationale.

## 8 — Standing rules

Inherited from Scope 5 walk-through and Scope 8a adjudication log. Same seed list as Scope 2 and Scope 3+8b.

1. **Evidence not intuition.** Every verdict cites migration SHA / file:line / grep hit / ai_patterns.md section reference / `ai_usage_tracking` query result.
2. **If it doesn't work in the app, it is not wired.** Applies especially to P2 (embedding classifier site wired to compute embeddings but never queries them) and P9 (assembleContext wired to function signature but per-turn window not actually slid).
3. **Non-concurrent zones untouched** per AUDIT_REPORT_v1.md §0.
4. **Worker commits, orchestrator adjudicates.** Per-pattern worker runs grep + reads + tests + writes evidence file.
5. **Grep/Glob primary per Convention 242.** mgrep per-query-approved only.
6. **Consolidate per pattern** (§5).
7. **Dynamic tests require founder approval at dispatch.** Not at plan time — at the moment the worker is ready to run a staged test.
8. **Do not re-emit Scope 2 or Scope 3 findings.** When a Scope 4 site miss is already captured by another scope's finding, cite and skip.

## 9 — Handoff to apply-phase

Once all 9 pattern evidence files walk-through close, an apply-phase worker appends `SCOPE-4.F{N}` findings to [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §4 (currently the stub "*Not yet started. Stage C.*" at line 395).

Apply-phase worker scope:
- Reads DECISIONS.md for adjudicated verdicts
- Reads each `EVIDENCE_P{N}_*.md` for finding bodies
- Writes findings into §4
- Updates Beta Readiness index (Appendix C) for any Y-flagged Scope 4 findings (expected to be few)
- Commits with message `docs(audit): apply Scope 4 findings F{N}–F{M} — cost pattern P{A}–P{B} coverage`

## 10 — Sequencing

Scope 4 is independent of Scope 2 and Scope 3+8b. It can run after Scope 2 closes OR interleaved with Scope 3+8b.

**Recommended sequence:** run Scope 4 after Scope 2 closes, because Scope 2 will have enumerated every built Edge Function and AI-calling surface in code. Scope 4 can then use the Scope 2 site inventory as its starting corpus rather than re-discovering sites from scratch.

**Minimum blocker for Scope 4 dynamic evidence:** tool health at dispatch time. AURI/mgrep/codegraph status must be green at the moment a dynamic test runs, because a dynamic test is a production-touching action. Dynamic-test dispatch runs a Step 0 hygiene check equivalent.

### 10.1 Pattern ordering within Scope 4

All 9 patterns can run in parallel (no inter-pattern dependencies). Walk-through is serial (one pattern per session) to preserve orchestrator context. Recommended walk-through order: P1 → P4 → P9 → P6 → P2 → P3 → P5 → P7 → P8 (starts with infrastructure patterns, then the flagship Layered Context Assembly patterns, then caching, then classification, then the lighter-weight patterns).

### 10.2 Stage C close gate

Scope 4 close is one of three Stage C close gates (with Scope 2 and Scope 3+8b). Stage C close unlocks Stage D (Scope 6 + Scope 7).

## 11 — Success criteria

Scope 4 closes when:

- All 9 pattern evidence files committed in `scope-4-evidence/`
- Dynamic-evidence patterns (P2, P4, P9) have recipe + result documented; founder-approved test runs completed
- DECISIONS.md contains per-pattern round entries with founder decisions
- Apply-phase worker has landed all SCOPE-4.F{N} findings into §4 of AUDIT_REPORT_v1.md
- Beta Readiness index (Appendix C) updated with Y-flagged Scope 4 findings if any
- `scope-4-evidence/` moved to `.claude/completed-builds/scope-4-evidence/` per archival pattern
