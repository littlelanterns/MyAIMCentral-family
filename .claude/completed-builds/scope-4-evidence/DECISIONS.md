---
Status: OPEN — walk-through has not started
Stage: C
Scope: 4 (cost optimization patterns P1–P9)
Opened: 2026-04-20
Related: [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §4; [PLAN.md](PLAN.md); [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 (lines 310–313); [claude/ai_patterns.md](../claude/ai_patterns.md) §"9 AI Cost Optimization Patterns"
---

# Scope 4 — Decisions Log

> **Purpose:** Append-only log of founder decisions per cost-optimization pattern. Orchestrator proposes adjudicated verdicts after reading each `EVIDENCE_P{N}_*.md`; founder confirms, amends, or overrides. Each entry is permanent — if a verdict is later revised, a new entry references the prior one rather than editing history.

## Recovery pointer

If this file is being read by a fresh session: the plan lives at [PLAN.md](PLAN.md); the gameplan source is [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 lines 310–313; pattern definitions live in [claude/ai_patterns.md](../claude/ai_patterns.md) lines 192–202. Findings flow into [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §4 as `SCOPE-4.F{N}`. Dynamic-evidence patterns (P2, P4, P9) require founder approval at dispatch per PLAN §3.1.

## Standing rules

Inherited from Scope 5 walk-through ([WALKTHROUGH_DECISIONS.md](../.claude/completed-builds/scope-5-evidence/WALKTHROUGH_DECISIONS.md)) and Scope 8a adjudication log ([CHECKLIST_DECISIONS.md](../.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md) §Standing rules), amended for Scope 4 content (cost-pattern verification; dynamic-evidence discipline on P2/P4/P9).

1. **Beta Readiness default = N** for Scope 4 findings. Set to Y only when the missing pattern produces a child-facing Sonnet call that should be Haiku, a context-bulk-load on Guided/Play shells, or a projected per-family AI cost >$5/month. Cost patterns are optimization, not beta-blocking by default.
2. **Non-concurrent zones untouched.** Universal-Setup-Wizards design docs and `src/components/studio/wizards/` are read-only.
3. **"If it doesn't work in the app, it is not wired."** Applied especially to P2 (classifier computes embeddings but never queries them) and P9 (assembleContext signature exists but per-turn window not actually slid).
4. **Evidence not intuition.** Every verdict cites file:line, grep hit, ai_patterns.md section reference, or `ai_usage_tracking` query result.
5. **Worker commits, orchestrator adjudicates.** Per-pattern worker runs grep + static inspection + (when approved) dynamic test + writes evidence file.
6. **Grep/Glob primary per Convention 242.** mgrep per-query-approved only.
7. **Dynamic tests require founder approval at dispatch.** Not at plan time — at the moment a worker is ready to run a staged test against `ai_usage_tracking`. Test recipe, expected result, expected row count all surfaced to founder before the test runs.
8. **Do not re-emit Scope 2 or Scope 3+8b findings.** When a Scope 4 miss is already captured by another scope, cite and skip.

## Decision log format

Each pattern round uses the following entry shape. Modeled on [CHECKLIST_DECISIONS.md](../.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md) Round format.

```
## Round {N} — P{N} {pattern name} evidence pass

- **Date:** YYYY-MM-DD
- **Worker pass:** [EVIDENCE_P{N}_{pattern-slug}.md](EVIDENCE_P{N}_{pattern-slug}.md)
- **Static evidence:** {site count examined, sites applying correctly, sites missing}
- **Dynamic evidence:** {test recipe if applicable; `ai_usage_tracking` row counts; expected vs observed}

### Per-site verdict table

| Site | Proposed verdict (applied/not applied/ambiguous) | Expected-vs-observed summary | Cross-ref to other scope findings | Founder decision |
|---|---|---|---|---|
| {site ref} | {applied/not applied} | {one line} | {SCOPE-2.F{N} / SCOPE-3.F{N} if applicable} | (pending) |

### Load-bearing unexpected findings
{numbered list — sites surfaced during grep not on the expected-site list}

### Cross-references
{Scope 2 / Scope 3+8b finding IDs that this pattern round cites}

### Founder adjudication
{one paragraph per decided finding}

### Emission list
{final SCOPE-4.F{N} titles for apply-phase}
```

## Round 0 — Preliminary notes before evidence gathering

### Dynamic-test recipe approval protocol

Per PLAN §3.1, P2 and P9 evidence passes (and optionally P4) require dynamic-test recipes approved by the founder before dispatch. The recipe specifies: test family scope, test member, test input set, expected `ai_usage_tracking` row count under correct pattern application, expected row count under missed pattern, cleanup scope. Orchestrator drafts; founder approves. The dispatch worker does not run the test until approval is captured in this DECISIONS.md under the relevant round.

### Expected misses — priority verification targets

Per Gameplan lines 312–313:
- **P2** — "AI calls that should be using embedding-based classification but aren't." Candidate misses listed in PLAN §2.2 include feedback sentiment, blog comment moderation, routing-suggestion surfaces.
- **P4 / Layered Context Assembly** — "context loading is relevance-filtered, not bulk-loaded." Candidate drift: any lila-* Edge Function that bypasses `assembleContext()`.

Both surface as candidate findings in Round 2 (P2) and Round 4 (P4) kickoff. Orchestrator expects these to be the highest-finding-density patterns.

### Patterns with no dynamic evidence

P1, P3, P5, P6, P7, P8 can close on static evidence alone. If a worker for any of these patterns proposes a dynamic test, orchestrator asks "is static insufficient?" before approving; dynamic is the exception, not the default.

### Cross-pattern finding possibility

Per PLAN §5.3, if a single feature misses 3+ cost patterns at once (most likely: a new Edge Function added since the last audit and not instrumented), emit one feature-level finding listing the missed patterns rather than N per-pattern findings. Orchestrator watches for this during synthesis.

### Founder-set dispatch shape (2026-04-20)

- **Dispatch shape:** parallel static-only for P1, P3, P5, P6, P7, P8. Serial dynamic trio P4 → P9 → P2, using existing `ai_usage_tracking` historical rows only — **no new staged AI calls against production** this pass. This resolves the PLAN §3.1 dynamic-test approval gate for Scope 4: historical-row inspection is pre-approved; any staged call requires re-opened founder approval.
- **Cost-signal prioritization:** none. No specific family-level overage flagged. Default pattern ordering stands.
- **Beta Readiness default:** N per PLAN §7. Y exceptions as defined.

### Scope 4 open flag — F22 homeschool reporting re-audit trigger

When F22 homeschool reporting (PRD-19 reports / PRD-28B compliance) builds out (2–3 month horizon per Scope 2 adjudication), the aggregation + report-generation pipeline requires a targeted Scope 4 re-audit for:
- **P1 Batch Processing** — monthly aggregation path must enqueue embedding jobs through `pgmq`, never synchronous OpenAI on write.
- **P5 On-Demand Secondary Output** — report draft is primary output; extras (tag extraction, alt phrasings, per-subject summaries) must not co-generate on the first call.
- **P7 Time-Based Sampling** — aggregation over a family's corpus must sample or window explicitly; no unbounded `SELECT * ORDER BY created_at` against activity/journal/time-log tables.

Re-audit trigger: `monthly-aggregate` Edge Function build landing OR `report-generate` Edge Function build landing, whichever first. The re-audit worker reopens scope-4-evidence/ temporarily, runs static passes on those two functions only, emits `SCOPE-4.F{N}` findings addendum to AUDIT_REPORT §4. Parallel to F22 Fix Next Build cadence, not blocking.

## Decisions

## Round 1 — P1 Batch Processing evidence pass

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_P1_batch-processing.md](EVIDENCE_P1_batch-processing.md)
- **Static evidence:** 11 context-source tables enumerated (6 expected per ai_patterns.md L251 + 9 additional discovered). Core P1 invariant (no synchronous OpenAI call on user-write) holds across the repo — client-side grep returned 0 hits; Edge Function grep returned only consumer + query-path + admin-only sites; trigger function bodies contain no `pg_net.http_post` to OpenAI.
- **Dynamic evidence:** None. Static-only per founder dispatch shape. Read-only `ai_usage_tracking` query available as walk-through follow-up if needed.

### Founder adjudication (2026-04-20)

Founder accepted orchestrator recommendation to **split the consolidated proposal into three findings**. Each sub-issue has a distinct root cause, distinct fix scope, and different classification. Keeping them bundled risks the `archive_context_items` column gap getting buried under pipeline-architecture narrative. MindSweep RPC failure-mode verification dispatched as a targeted follow-up before Finding A severity locks.

### Emission list

- **SCOPE-4.F1** — `archive_context_items` missing `embedding` column **silently breaks MindSweep embedding-first classification entirely.** Root cause: migration never added the column; 173 archive items are never embedded. Downstream impact: MindSweep cross-source RPC `classify_by_embedding` at migration `00000000100089:234-327` is PL/pgSQL (runtime column resolution), so the CREATE succeeded, but every call raises `SQLSTATE 42703 undefined_column` when the planner binds `aci.embedding`. `supabase/functions/mindsweep-sort/index.ts:129-156` wraps the RPC call in a **bare `try { } catch { }` with no logging** and silently falls through to Haiku. Net effect: the entire UNION ALL query aborts — ALL 5 classifier sources (archive_context_items, guiding_stars, best_intentions, self_knowledge, journal_entries) lose their embedding-first path, not just archives. **100% Haiku fallback rate** on MindSweep embedding classification; CLAUDE.md line 12 architectural claim ("~90% of routine classification uses pgvector, not LLM calls") is currently 0/100. Classification: **Unintentional-Fix-Code**. Severity: **High** (escalated from Medium 2026-04-20 after MindSweep RPC failure-mode verification; the canonical P2 site is totally non-functional, even though MindSweep still classifies correctly via the Haiku fallback). Beta Readiness: **N** (Haiku per-call cost is small; cumulative projects well under the $5/family/month threshold per PLAN §7; functional classification intact). Fix scope (approved 2026-04-20, all founder-green-lit):
  - (a) Migration adding `embedding halfvec(1536)` column + HNSW index + `util.queue_embedding_job()` trigger on `archive_context_items`
  - (b) Backfill embeddings for the 173 existing rows (the embed Edge Function polling path will handle this automatically once column + trigger land, but verify the consumer runs against the newly-migrated column)
  - (c) Add structured logging to `mindsweep-sort/index.ts:129-156` silent `catch {}` so this class of regression never hides again — log `classify_by_embedding RPC error` with the error code + message to `ai_usage_tracking.metadata` or equivalent, fail-open to Haiku as today but surface the error for monitoring. **PLUS: `ai_parse` catchall `feature_key` split** (folded 2026-04-21 per founder adjudication): the `ai_parse` Edge Function currently logs all invocations under `feature_key='ai_parse'` regardless of which sub-classifier runs. Split into per-sub-function feature_keys (`ai_parse:review_route`, `ai_parse:smart_list`, `ai_parse:meeting_action`, etc.) so future P2 audits can measure per-site Haiku-vs-embedding rates cleanly. One telemetry-hardening pass covers both the MindSweep catch-logging gap AND the `ai_parse` observability gap — same build sprint, same PR.
  - (d) Update CLAUDE.md line 12 ("~90% of routine classification uses pgvector, not LLM calls") from aspirational to measured once embeddings actually flow — or replace with an honest "target ~90%, current actual tracked in `ai_usage_tracking`" framing
  - (e) Read-only telemetry confirmation query dispatched against production `ai_usage_tracking` to confirm 0% embedding hit rate; outcome recorded below

#### Telemetry confirmation (2026-04-20)

**Verdict: CONFIRMED.** 0% embedding classification hits, 100% Haiku fallback — matches static F1 finding. Triangulated three ways:

1. **`ai_usage_tracking` pairing check:** 9 events on `mindsweep_sort` between 2026-04-04 and 2026-04-12. Each event has exactly one `text-embedding-3-small` row (embedding generated for the query) paired 1:1 with one `claude-haiku-4.5` row in the same minute. Zero standalone embedding-only events. This is the pattern of "embed the query → call RPC → RPC aborts silently → fall through to Haiku" playing out 9 times.
2. **`mindsweep_events.items_auto_routed = 0`** across all 9 events and 24 items. Auto-routing requires high-confidence embedding classification; zero auto-routes independently corroborates zero embedding hits.
3. **24 / 24 items went to `items_queued`** (Haiku / manual-review path). 0 / 24 went to `items_direct_routed`.

**`lila_messages.metadata.classified_by` telemetry field is unwired** — both `'embedding'` and `'llm'` counts return 0. The field is aspirational in code but never populated. Separate low-priority telemetry gap; mentioned as a downstream observability hardening opportunity but not promoted to its own finding.

**Cost-impact confirmed under threshold:**
- Observed window: 8 days, 9 events, 24 items, $0.00639 total `mindsweep_sort` cost (plus $0.07202 `mindsweep_scan` on a separate Sonnet OCR codepath not part of F1).
- Per-family-per-month extrapolation at current beta volume: ~$0.024/month on MindSweep. **Well under the $1/family/month target.**
- F1-attributable waste specifically: ~$0.005/family/month (the 9 embedding calls that generated query vectors used by an aborted RPC, plus the Haiku calls that should have been $0 under P2 applied correctly).
- Beta Readiness flag **stays N** per PLAN §7 — cost ceiling not breached, functional classification intact.
- **Post-beta scaling warning:** cost scales linearly with MindSweep adoption. Fix scope (a–d) should land before MindSweep graduates from beta usage patterns to regular-adoption volume.

**Beta data size caveat:** only a handful of founding families exercised MindSweep in the observation window. Low-volume data means small cost multiplier; 100× adoption would mean 100× the F1-attributable waste but still comfortably under threshold at pure Haiku pricing.
- **SCOPE-4.F2** — pgmq `embedding_jobs` pipeline dormant; polling-consumer is the real architecture. Migration 029 downgraded `util.queue_embedding_job()` to `PERFORM 1; -- no-op for now — pgmq not configured yet`. The `embed` Edge Function polls tables directly for `embedding IS NULL` rows. Functionally equivalent to P1; `ai_patterns.md §Embedding Pipeline L222-251` describes the wrong architecture. Classification: **Intentional-Document**. Severity: **Low**. Beta Readiness: **N**. Fix scope: `ai_patterns.md` Embedding Pipeline section amendment to describe the polling-consumer architecture (or founder decision to restore the pgmq path — code change instead of doc change).
- **SCOPE-4.F3** — `embed` pg_cron schedule undeclared in migrations. Migration `00000000000000:50-68` is comment-only pointing to Supabase Dashboard. All other cron jobs (mindsweep-auto-sweep, advance_task_rotations, process_carry_forward_fallback, expire_overdue_task_claims, allowance_period_calculation) are declared in migrations via `cron.schedule(...)`. Staging-rebuild risk: a fresh DB rebuilt from migrations alone would have no consumer scheduled. Classification: **Unintentional-Fix-Code**. Severity: **Low**. Beta Readiness: **N**. Fix scope: one migration adding `cron.schedule('process-embeddings', '*/10 * * * * *', ...)` with documented service_role_key access pattern.

### Load-bearing unexpected findings

1. **`board_personas.embedding` consumer unclear.** 18 live rows, no `util.queue_embedding_job()` trigger, not in `embed` Edge Function TABLE_CONFIG. Seeded with pre-computed embeddings, or silently missing from pipeline. Deferred to **P6 Caching & Reuse evidence pass** (persona caching) for adjudication.
2. **Trigger granularity is coarse.** Triggers fire `AFTER INSERT OR UPDATE` without `WHEN (OLD.content IS DISTINCT FROM NEW.content)` — if pgmq pipeline is ever restored (F2 resolution route), unnecessary re-enqueues will fire on non-text metadata updates. Latent tech-debt; invisible while `util.queue_embedding_job()` is a no-op.

### Cross-references

- AUDIT_REPORT_v1.md §2 Batch 3 (Personal Growth) and Batch 7 (Vault/BookShelf) passed through embedding-bearing tables during Scope 2 without surfacing this drift — Scope 2 was PRD-to-code alignment, not pattern verification. No Scope 2 finding supersedes F1/F2/F3.
- PATTERN-FLAG-FOR-SCOPE-4 at AUDIT_REPORT_v1.md §2 line 395 (MindSweep P2 embedding-first) is a separate target; addressed in Round 2 (P2).

### Open follow-up

- **MindSweep RPC failure-mode verification** — dispatched concurrent with Round 1 close. Question: does `match_archive_context_embeddings` (migration 100089) error in prod with "column aci.embedding does not exist," or was it safe-guarded? Outcome locks F1 severity.

## Round 2 — P2 Embedding-Based Classification evidence pass

- **Status:** COMPLETE on re-dispatch 2026-04-21 (original 2026-04-20 worker hit usage cap mid-run; re-dispatch used same scope + prompt).
- **Worker pass:** [EVIDENCE_P2_embedding-based-classification.md](EVIDENCE_P2_embedding-based-classification.md)
- **Static evidence:** Beyond F1 (MindSweep-sort, already adjudicated 2026-04-20), **3 additional active classifier sites miss P2, 2 are unbuilt, 1 is ambiguous.** No classifier site in the codebase currently applies P2 correctly. The 3 active misses are all Haiku-first with no embedding-first pre-screen: (1) Notepad Review & Route (`useExtractContent` → `ai-parse` Edge Function classifier), (2) Smart List Import (`smart-list-import` Edge Function), (3) Post-Meeting Review. Archives BulkAddSort is a fourth would-be site blocked by F1's missing `archive_context_items.embedding` column — one fix unlocks both MindSweep P2 and BulkAddSort P2 (and populates the infrastructure gap in P1).
- **Dynamic evidence (historical telemetry):** `ai_usage_tracking` query drafted but not executed — worker hit sandbox restriction on the `supabase` binary. Recommended follow-up query included in evidence file for orchestrator to run if desired during walk-through; not blocking for finding emission since static evidence is sufficient.
- **Unbuilt deferred:** Feedback sentiment classification (PRD-32 beta glitch reporter extension — unbuilt) and Blog comment moderation (PRD-38 — unbuilt) both match the F22 re-audit pattern. No emission; both flagged for re-audit when their PRDs build.
- **Ambiguous:** Board of Directors `content_policy_check` — tiny Haiku cost per check, sparse corpus (18 platform personas), persona-cache architecture already being restructured by F4/F5. Surfaced for orchestrator adjudication on whether to fold into F4/F5's fix scope or skip entirely.

### Founder adjudication (2026-04-21)

Founder direction: **"I am fine following your suggestions. I do want all of these fixed though."**

All three P2 orchestrator decisions resolved per orchestrator recommendation:
1. **F10 emission shape:** one bundled finding with sub-items (a)–(f). Cleaner apply-phase tracking as "wire embedding-first across all remaining classifier sites."
2. **Board of Directors `content_policy_check`:** fold into **F4 fix scope** as a sub-item. The persona approval pipeline rebuild will wire embedding similarity against already-approved personas alongside the content-policy check. Zero new findings; one coherent rebuild.
3. **`ai_parse` telemetry observability gap:** fold into **F1 fix scope (c)**. One telemetry-hardening pass covers MindSweep silent-catch logging + `ai_parse` feature_key split-by-sub-function.

**Founder "all of these fixed" directive:** no Scope 4 finding gets shelved as "architectural curiosity" or deferred beyond the re-audit-trigger flags (Context Learning P3, feedback sentiment P2, blog moderation P2, F22 homeschool reporting P1/P5/P7). Every emitted F1–F10 has an active fix path on the remediation queue. Apply-phase narrative should reflect this — Scope 4 closes with an executable remediation plan, not an open-ended list of architectural notes.

### Emission list

- **SCOPE-4.F10** — Notepad Review & Route, Smart List Import, and Post-Meeting Review classifiers are Haiku-first with no embedding-first pre-screen. Each classifies user-authored text into one of a small set of category enums (Review & Route destination, list item-type, meeting action-item routing destination). Each call is a Haiku classification with no similarity lookup against prior classifications or pattern library. Classification: **Unintentional-Fix-Code** (P2 pattern applies per ai_patterns.md L194 but not wired at these sites). Severity: **Low** (combined cost impact ~$0.05–0.15/family/month at regular post-beta adoption; well under the $5/family/month Beta Y threshold). Beta Readiness: **N**. Fix scope (pending orchestrator adjudication on one-bundled-finding vs split-per-site; founder decision below):
  - (a) **Notepad Review & Route** — Wire embedding-first classifier against `notepad_routing_stats` (already captures per-member routing frequency; natural reference corpus once embeddings added) or seed a pattern library of canonical "this kind of text routes to X" examples. Haiku fallback when similarity below threshold.
  - (b) **Smart List Import** — Highest-leverage single retrofit per worker analysis. User-authored list item names are a natural pre-embedded corpus (prior list items in the same list type become the reference). Wire embedding similarity against `list_items` already in the target list type; Haiku fallback for novel item categories.
  - (c) **Post-Meeting Review** — Wire against prior meeting action-item routing outcomes as the reference corpus. This has the smallest usage volume today (meetings PRD-16 just-built); low ROI on the retrofit itself but consistency with other classifier sites warrants it.
  - (d) **Shared embedding-first utility.** Given this is now the fourth MindSweep-adjacent classifier (F1 + F10 covers four sites), worker recommends extracting a shared `embedding-first-classifier` helper in `_shared/` so the fifth and sixth classifier sites don't repeat the pattern. Forward-looking guardrail.
  - (e) **Reference corpus seed question.** Some sites (Review & Route) have natural prior-classification corpora; others (Smart List Import) don't unless the family has prior lists in that type. Document the cold-start behavior: fresh family with no prior classifications falls through to Haiku 100% until corpus populates. Acceptable per P2 spec (P2 is "~90% embedding / ~10% Haiku" at steady state, not "never Haiku").
  - (f) **Telemetry instrumentation.** Add per-classifier-site `feature_key` to `ai_usage_tracking` writes so future P2 audits can measure actual embedding/Haiku rate per site. Currently `ai_parse` is a catchall that hides classifier-specific spend.

### Load-bearing unexpected findings

1. **`ai_parse` catchall `feature_key` hides per-classifier spend.** The Edge Function handles Notepad Review & Route classification plus several other parse operations; `ai_usage_tracking` entries all log under `ai_parse` with no sub-classification. This is an observability gap that prevented the worker from running a clean per-site Haiku-volume query. Candidate for folding into F1 fix scope (c) (the MindSweep-sort silent-catch logging fix) OR emitting as its own micro-finding. Orchestrator decision required.
2. **Cross-pattern synthesis opportunity: F1's archive-column fix unlocks three pattern-level improvements at once.** Adding `embedding halfvec(1536)` to `archive_context_items` + populating the consumer: (a) P1 infrastructure applies (embedding-bearing table becomes live), (b) P2 MindSweep classifier starts actually hitting embeddings instead of erroring out, (c) P2 Archives BulkAddSort classifier becomes viable (currently can't even attempt embedding-first because the column doesn't exist). **This is a one-migration fix with three pattern benefits.** Already captured in F1 fix scope (a)(b); worth calling out in the apply-phase narrative as the highest-leverage single change Scope 4 surfaced.
3. **Board of Directors `content_policy_check`** is a persona-name pre-screen before Haiku generation. Cost per check is tiny (~$0.0001 Haiku); corpus is sparse (18 platform personas); F4/F5 are already restructuring the persona architecture. Three options: (a) emit as its own P2 finding (F11), (b) fold into F4 fix scope as a sub-item, (c) skip entirely because F4/F5's architecture rewrite obsoletes the question.

### Cross-references

- **SCOPE-4.F1** — MindSweep-sort P2 state already characterized 2026-04-20 (telemetry confirmed 0% embedding / 100% Haiku); F1 fix scope (a)(b) resolves this at MindSweep + unlocks Archives BulkAddSort as a side effect.
- **SCOPE-2 F22 pattern** — Feedback sentiment + blog comment moderation deferred to when PRDs build; re-audit trigger parallel to F22 shape.
- **CLAUDE.md preamble line 12** — "~90% of routine classification uses pgvector embeddings, not LLM calls" currently 0% MindSweep + 0% across the three F10 sites + blocked at Archives. Consolidated claim-vs-reality gap already captured in F1 fix scope (d) (CLAUDE.md amendment post-remediation).
- **Shared utility recommendation (F10 (d))** — cross-refs future PRDs introducing new classifier sites; forward-looking convention candidate.

## Round 3 — P3 Context Learning Detection evidence pass

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_P3_context-learning-detection.md](EVIDENCE_P3_context-learning-detection.md)
- **Static evidence:** Feature is **unbuilt**. `lila-chat/index.ts` has no post-response Haiku scan; ends after streaming, auto-title (first-turn only), cost logging. No cron-scheduled Edge Function processes `lila_messages` for context-learning. `ContextLearningSaveDialog` (src/components/archives/) is a dead React export — zero importers anywhere in `src/`. `context_learning_dismissals` has 0 live rows; table + RLS are ready but no writer runs. Zero `archive_context_items` writes with `source='lila_detected'` outside the dead component. No embedding-delta mechanic exists anywhere in the repo.
- **Dynamic evidence:** Not applicable — feature unbuilt.

### Founder adjudication (2026-04-20)

Founder direction: **defer until the app has accumulated usage history**. Context Learning requires conversation-pattern baselines (3–6 months of real family LiLa usage with meaningful message volume per member) before the embedding-delta mechanic can generate useful suggestions. Building before that point would produce shallow heuristic suggestions that erode trust in LiLa's intelligence — first suggestion mom rejects is a papercut; first 10 rejects and she stops trusting context suggestions entirely. Orchestrator concurred; no alternative build path recommended. This matches the DECISIONS.md §Round 0 F22 re-audit pattern: unbuilt feature deferred + re-audit trigger scheduled.

### Emission list

No `SCOPE-4.F{N}` finding emitted for P3. Can't audit a cost pattern on code that doesn't run.

### Scope 4 open flag — P3 re-audit trigger

When the Context Learning detector builds out (post-beta, once founding families have accumulated ~3–6 months of conversation history), the P3 pattern audit re-runs on the new detector Edge Function. Re-audit scope: confirm embedding-delta threshold gates Haiku call (not a cron that fires Haiku unconditionally on every batch); confirm the threshold is tunable; confirm `context_learning_dismissals` writes on user dismiss; confirm suggested items write to `archive_context_items` with `source='lila_detected'`. Parallel to the F22 re-audit flag shape.

### Cross-references

- **STUB_REGISTRY.md mislabel** — P3 worker flagged that STUB_REGISTRY row labels the feature "✅ Wired" when it is in fact "⚠️ Partially Wired" (table + RLS exist; no writer). Route this correction through **Scope 5 reconciliation** (housekeeping pass on STUB_REGISTRY accuracy), not as a Scope 4 finding. Apply-phase note: reference the STUB_REGISTRY flip as a Scope 5 follow-up when the apply-phase worker writes the Scope 4 close narrative.
- **PRD-05C** — the founder-decision clarification logged in P3 worker output ("should PRD-05C §9 be amended to reference P3 delta-gate requirement, or is pattern/product layer separation acceptable") is resolved by this defer decision: the delta-gate requirement belongs with the Context Learning build, not pre-emptive PRD amendment today. No PRD-05C amendment needed.

## Round 4 — P4 Semantic Context Compression evidence pass

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_P4_semantic-context-compression.md](EVIDENCE_P4_semantic-context-compression.md)
- **Static evidence:** Shared `_shared/context-assembler.ts` matches ai_patterns.md L96–166 spec exactly (Layer 1 roster always-loaded; Layer 2 name detection at L148–181 + 13 topic-patterns at L85–138; Layer 3 semantic RPCs; baseline fallback at L274; three-tier toggle enforcement; `loadedSources` metadata shape at L53–58). **Applied correctly at 14 of 16 LiLa Edge Functions.** Two sites bypass the shared assembler with parallel context-load helpers.
- **Dynamic evidence (historical telemetry, read-only):** 30-day `lila_*` feature_key usage shows **no monotonic token-rise trends** — `lila_general` dropped 58% March→April. No bulk-load regression signal. `lila_conversations.token_usage` JSONB column is all-NULL (same observability gap previously noted in F11 analysis §4.3 — worker recommends wiring alongside F8 fix).

### Founder adjudication (awaiting walk-through)

**Orchestrator proposal:** accept F8 as worker framed it. The two bypass sites have **zero lifetime production calls** per `ai_usage_tracking` — this is a latent architectural defect, not a live cost leak. Low severity / Beta N is proportional. The Convention #105 amendment is load-bearing: without it, the next bespoke context-load helper lands as a plausible choice rather than a convention violation.

### Emission list

- **SCOPE-4.F8** — ThoughtSift Decision Guide (`lila-decision-guide`) and Board of Directors (`lila-board-of-directors`) bypass the shared 3-layer context assembler. Decision Guide uses a parallel `loadDecisionContext` helper; Board of Directors uses inline `.from().select()` bulk-loads against context-source tables. Both miss: Layer 1 roster (current-user tagging), name-detection + topic-matching relevance filtering, P9 per-turn refresh via sliding 4-message window, `is_privacy_filtered` hard-constraint guard. The shared `_shared/context-assembler.ts` matches ai_patterns.md L96–166 spec exactly and is used correctly by the other 14 lila-* Edge Functions. Classification: **Unintentional-Fix-Code**. Severity: **Low** (zero lifetime production calls on either Edge Function per `ai_usage_tracking` — latent defect; becomes active as soon as either feature sees real usage). Beta Readiness: **N** (no current harm; fix must land before either feature graduates from zero-use state). Fix scope (approved 2026-04-20):
  - (a) **Decision Guide retrofit.** Replace `loadDecisionContext` helper with the existing `_shared/relationship-context.ts` `loadRelationshipContext` helper — the worker noted it's a better-fit shape for values/advisor tools than full `assembleContext`. Wire it through the Edge Function's context-prep path. Remove the parallel helper.
  - (b) **Board of Directors retrofit.** Replace inline `.from().select()` bulk-loads with `assembleContext()` call. Per-tool override: set `alwaysIncludeCategories` to the handful of categories the advisor panel legitimately always needs; let Layer 2 relevance filtering handle the rest. Coordinate with F4 fix (which rewrites the persona-cache pathway) — both sit on the same Edge Function, both should land in one build.
  - (c) **Convention #105 amendment.** Current text names `assembleContext()` as the P9 implementation. Extend it to **explicitly forbid bespoke context-load helpers in lila-* Edge Functions** — if a tool needs extra context, it goes through `assembleContext()` with per-tool overrides (per ai_patterns.md L153–164 per-tool override table), not a parallel helper. Forward-looking guardrail so the next new LiLa tool can't re-introduce the same drift.
  - (d) **`lila_conversations.token_usage` observability wiring.** Worker recommends populating the JSONB column during the F8 retrofit (already surfaced in F11 analysis §4.3 as a latent observability gap). Scope in this finding as a bundled sub-task — when F8 lands, also wire the per-call token capture so future P4/P9 audits have first-class telemetry instead of indirect signals.

### Load-bearing unexpected findings

1. **`lila_conversations.token_usage` is all-NULL in production.** Column exists per live_schema; no writer populates it. Context-assembler's `loadedSources` metadata at context-assembler.ts L53–58 is returned per call but not persisted. Direct consequence: any future P4/P9 cost-pattern audit has to work from indirect signals (aggregate `ai_usage_tracking` token columns) rather than per-call per-source provenance. Bundled into F8 fix scope (d).
2. **`lila_general` token usage dropped 58% March→April.** Worker notes this explicitly rules OUT a silent bulk-load regression (which would cause monotonic rise). Consistent with P4 applied correctly — lighter March usage pattern in lila_general, not heavier context loads.

### P9 dependency flags for Round 9 worker

Both F8 bypass sites (`lila-decision-guide` and `lila-board-of-directors`) **also break P9 per-turn refresh by definition** — no `assembleContext()` call means no sliding 4-message window evaluation. P9 worker can skip per-site re-audit of these two; F8's fix resolves P9 at both. All 14 applied consumers pass the P9 prerequisite (use `userMessage + recentMessages.slice(-4)` for detection text per worker verification).

### Cross-references

- **Scope 2 F11** — closed via `scope-2-evidence/ANALYSIS_F11_CONTEXT_ARCHITECTURE_COMPARISON.md`. F8 does not re-open F11; F8 verifies consistent application of the already-closed-as-correct 3-layer architecture.
- **CLAUDE.md Convention #105** — amendment scoped in F8 (c).
- **SCOPE-4.F4** — Board of Directors persona-cache architecture fix. F8 Board of Directors retrofit should land in the same build sprint as F4 (same Edge Function; shared test surface).

## Round 5 — P5 On-Demand Secondary Output evidence pass

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_P5_on-demand-secondary-output.md](EVIDENCE_P5_on-demand-secondary-output.md)
- **Static evidence:** 37 files hitting OpenRouter/Haiku/Sonnet enumerated; 25 distinct model-calling Edge Functions inspected. **24 of 25 apply P5 correctly.** Each Task Breaker level (quick/detailed/granular) is its own call; BookShelf `combined_section` generates all 5 extraction types in one Sonnet call by design per PRD-23 (the 5-type extraction IS the product unit); Curriculum Parse, celebrate-victory, smart-list-import each produce one primary output; all lila-* conversational modes stream one reply per user turn. One borderline: Board of Directors moderator auto-interjection.
- **Dynamic evidence:** None (P5 is static-only per PLAN §2.5).

### Founder adjudication (2026-04-20)

Founder direction on the borderline: **"I don't think I want the moderator interjection unless it is super beneficial."** The current implementation auto-fires a moderator voice at the end of every advisor round without the user asking for it (~$0.01–0.02/session Sonnet cost). This is the opposite shape of P5 — auto-generated secondary output the user didn't request. Emit as a finding; flip default to opt-in.

### Emission list

- **SCOPE-4.F7** — Board of Directors moderator interjection fires automatically at end of every advisor round without explicit user opt-in. Per PRD-34 specification the auto-interjection was intentional behavior, but founder direction 2026-04-20 revokes that default — the interjection should be **opt-in via a "Get moderator summary" button** that mom taps when she actually wants a round-summary. Default behavior: no auto-fire; moderator silent unless invoked. Classification: **Unintentional-Fix-Code** (founder-directed behavior change; PRD-34 needs corresponding amendment). Severity: **Low**. Beta Readiness: **N** (no harm; pure cost + UX quality improvement). Fix scope (approved 2026-04-20):
  - (a) **Remove the auto-interjection trigger** from the Board of Directors Edge Function — the current end-of-round hook that calls the moderator persona.
  - (b) **Add a "Get moderator summary" button** to the Board of Directors conversation UI, visible after the advisor round completes. Tapping fires the moderator voice; not tapping leaves the session alone.
  - (c) **PRD-34 amendment** — update the PRD section describing moderator behavior to match the opt-in-only default. Preserves the feature capability; changes the default invocation pattern.
  - (d) **Cost-impact note.** Prior behavior: ~$0.01–0.02/session Sonnet spend on moderator. New behavior: $0 unless mom opts in. Not beta-blocking but a welcome reduction; aligns with architectural principle "AI shouldn't talk when the user didn't ask."

### Load-bearing unexpected findings

None surfaced beyond the moderator interjection.

### Cross-references

- **PRD-34 §Board of Directors** — moderator persona specification. Amend to match opt-in default.
- **CLAUDE.md Convention #8 / P5 pattern in ai_patterns.md L197** — this finding is the canonical P5 application example: "never pre-generate options the user didn't ask for."

## Round 6 — P6 Caching and Reuse evidence pass

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_P6_caching-and-reuse.md](EVIDENCE_P6_caching-and-reuse.md)
- **Static evidence:** Three expected cache sites + one deferred-from-P1 column. Spelling coach 3-tier (static JSON → `spelling_coaching_cache` → Haiku) **applied cleanly**; DB re-check before Haiku handles concurrent-request safety. BookShelf title/author cache via `upsert_book_library` RPC + 0.9 embedding-similarity threshold **applied cleanly**; cache-hit skips chunking + marks `extraction_status='completed'`. Board of Directors persona cache is **case-insensitive** via `.ilike()` per Convention #99 — but cache-lookup filter scope is too wide (see F4 below).
- **Dynamic evidence:** None (static-only per founder dispatch shape).

### Founder adjudication (awaiting walk-through)

Two findings proposed. One is a **privacy incident** flagged for potential Beta Readiness Y exception beyond PLAN §7's three literal exception criteria — founder judgment call required.

### Emission list

- **SCOPE-4.F4** — Board of Directors persona cache architecture is incorrect at the **platform policy layer**, not just at the tenancy-filter layer. Founder direction 2026-04-20: **platform personas (the shared cache) must only contain personas that Tenise / the platform team has specifically approved for reuse**. Personal-custom personas (e.g., "Grandma Rose") must NEVER enter the shared cache — they stay scoped to the family that created them and are invisible to other families entirely, not just filtered out at lookup time. Founder-directed architecture:
  1. **Personal-custom personas live fully family-scoped.** `persona_type='personal_custom'` rows write to `board_personas` with `family_id=requestingFamily` AND `is_public=false`. They are only readable by that family. They do NOT participate in the cache lookup that other families see.
  2. **Approval queue for platform promotion.** When a personal-custom persona references a figure that could plausibly apply to multiple families (e.g., a well-known author, speaker, historical figure, or a figure that multiple families have independently created), the content-policy screener flags it and routes it to a **platform-approval queue** for Tenise / the platform team to review. Items in the queue are reviewed, possibly improved for reusability, and either (a) promoted to platform persona (`is_public=true`, `family_id=NULL`), (b) kept as personal-only for the requesting family, or (c) rejected.
  3. **The shared cache contains platform-approved personas only.** Cache-lookup query filters strictly on `is_public=true AND content_policy_status='approved' AND family_id IS NULL`. No personal persona ever cache-hits for another family. No approval bypass route exists.

  Current implementation is **wrong on all three tiers:**
  - Cache lookup filters only by `.ilike(name)` + `content_policy_status='approved'` — no `is_public`, no `family_id` scope.
  - Content-policy screen approves personal-custom personas at insert time under the same approval bar as public personas, so they become cache-hit-eligible for every other family querying the same name.
  - No platform-approval queue exists in code or schema for "this persona might be worth promoting" — the mechanism is entirely unbuilt.

  Classification: **Unintentional-Fix-Code** (code deviation from founder-intended architecture). Severity: **High** (current implementation leaks personal persona content across families if the feature gets used). Beta Readiness: **Y** (founder-approved exception beyond PLAN §7's three literal criteria — cross-family data leak via pattern implementation defect is now a fourth Y-flag exception category for Scope 4; recorded in §Standing rules below). Current exposure is low (`board_sessions` 0 live rows, feature built but unused in beta); fix must land before Board of Directors sees real usage.

  Fix scope (approved 2026-04-20):
  - (a) **Cache-lookup rewrite.** `board_personas` cache query restricted to `is_public=true AND family_id IS NULL AND content_policy_status='approved'`. Personal personas are invisible to the cache pathway entirely — not "filtered out at lookup," but never a cache candidate.
  - (b) **Personal persona write path.** Creation of `persona_type='personal_custom'` writes `is_public=false`, `family_id=requestingFamily`, with RLS policies ensuring the row is only readable by that family.
  - (c) **Platform-approval queue.** New table (or repurpose existing — design decision for pre-build audit): `persona_promotion_queue` capturing candidate personal personas flagged by the content-policy screen as "might apply to multiple families." Admin surface in the Admin Console (PRD-32) for Tenise to review, improve, approve/reject. Approval path writes a NEW `board_personas` row with `is_public=true`, `family_id=NULL`, not a mutation of the original personal row (to preserve the originating family's personal reference).
  - (d) **Content-policy screen extension.** The existing content-policy gate stays (harm screening), with an added step: after harm screen passes, classify whether the persona name/description references a multi-family-relevant figure. Yes → route to promotion queue. No → personal-only, no queue entry. This classification is itself a cost-pattern question (Haiku classification per insert) — deferred to pre-build audit when F4 fix is scheduled.
  - (e) **Seeded-persona audit.** Verify the 18 currently-seeded `board_personas` rows are all `is_public=true, family_id=NULL` (platform personas). If any rows exist with `persona_type='personal_custom'` or missing the public/platform scope, isolate them before the cache-lookup rewrite lands.
  - (f) **Regression test fixture.** "Family A personal persona must NOT cache-hit for Family B query with the same name." + "Family A personal persona must NOT be readable by Family B via any direct query." Covers both the cache path AND the base-table RLS path.
  - (g) **CLAUDE.md Convention #99 amendment.** Current text ("always check `board_personas` by name case-insensitively before generating a new public persona") is silent on tenancy scope and the approval queue. Amend to document the three-tier architecture: personal scoped, promotion queue for candidate shared, cache only for approved shared.
  - (h) **`content_policy_check` embedding pre-screen** (folded 2026-04-21 per founder P2 adjudication from Round 2): the persona content-policy check is currently Haiku-first with no similarity lookup against already-approved personas. Wire embedding-first against the platform-approved persona corpus (F5's consumer): (i) generate embedding of the requested persona name + description, (ii) query similarity against approved personas, (iii) if top-N similarity exceeds threshold → suggest the existing approved persona instead of generating new (leverages F5 substitution pipeline), (iv) if below threshold → continue to content-policy harm screen + promotion-queue classification. Integrates cleanly with the F4 architecture rewrite and the F5 alternative-suggestion consumer. Zero new findings — one coherent rebuild across F4 + F5 + content-policy check.

  **Adjacent build surfaces this touches:** PRD-34 ThoughtSift (the feature); PRD-32 Admin Console (the approval queue UI); PRD-05 LiLa (the generation Edge Function); CLAUDE.md (convention).
- **SCOPE-4.F5** — `board_personas.embedding` column is intended product infrastructure for persona-substitution, not orphaned dead weight. Founder clarification 2026-04-20: the embedding column was designed so that when a user requests a persona the platform can't generate (e.g., "Brené Brown" — currently blocked or restricted for IP/content-policy reasons), the system uses embedding similarity to suggest **approved platform personas that are similar in vibe** ("we can't do Brené Brown directly, but here are three platform-approved personas who share her research/empathy approach — pick one"). This is a real product capability that was architected-in but never wired. Current state: column + HNSW index exist in schema (migration `00000000100049`); the 18 seeded personas have NULL embeddings; `embed` Edge Function TABLE_CONFIG does not poll `board_personas`; the blocked-persona code path in the content-policy screen has no alternative-suggestion branch. Classification: **Unintentional-Fix-Code**. Severity: **Medium** (product feature specified in original architecture missing; user-visible experience when someone requests a blocked persona is a hard-block with no substitution offer). Beta Readiness: **N** (no current harm; feature just not available yet). Fix scope (approved 2026-04-20):
  - (a) **Add `board_personas` to `embed` Edge Function TABLE_CONFIG** so the polling consumer populates embeddings. Once wired, existing 18 personas get embeddings on the next consumer cycle. New platform-approved personas (via the F4 promotion queue path) get embeddings automatically post-approval.
  - (b) **Wire the alternative-suggestion consumer.** In the persona-generation Edge Function, when the content-policy screen blocks a requested persona OR when the user explicitly says "suggest similar," run an embedding-similarity query against platform personas (`is_public=true AND family_id IS NULL AND content_policy_status='approved'`) scoped to top N results above a similarity threshold. Return the suggestions to the UI as "We can't do [X], but here are three platform-approved personas who share similar qualities."
  - (c) **UI surface for suggestions** in ThoughtSift Board of Directors persona-add flow. When a request is blocked or declined, show the suggestion cards with personas' display names, categories, icon_emoji, and a one-line description of why this persona matches. Mom picks one or goes back to try a different request.
  - (d) **Backfill embedding generation** for the 18 seeded personas before the suggestion feature goes live, so the first query after launch returns meaningful results rather than an empty set.
  - (e) **Ordering dependency on F4.** This fix assumes F4's platform-approval architecture is in place — the suggestion query filters on `is_public=true AND family_id IS NULL` which only carries meaning once F4 lands. Build F4 first, F5 second.

### Load-bearing unexpected findings

1. **`board_personas` tenancy semantics reliance on `is_public` + `family_id`.** `is_public` boolean exists but the cache-lookup doesn't filter by it. `family_id` column exists (live_schema confirms) but the cache-lookup doesn't scope by it. The lookup is effectively flat across all families for the persona namespace, relying only on content-policy approval + name match. This is a multitenancy bug, not a cost-pattern miss — but it was surfaced by the P6 cost-pattern pass because Convention #99's P6 cache implementation is where the defect lives.
2. **Content-policy approval gate gets personal personas past the cache-eligibility bar.** The worker notes "personal-custom personas pass the cache gate (`content_policy_status='approved'` at insert)." This implies the content-policy screen runs on all persona types uniformly and approves when the content is non-harmful. The approval was intended to mean "safe to generate" not "safe to share across families" — but the cache query conflates the two.

### Cross-references

- **CLAUDE.md Convention #99** — P6 persona caching convention. This finding documents the convention is case-insensitive-correct but tenancy-scope-incomplete. Convention text may need amendment alongside the code fix.
- **Scope 2 F39/F16/F18/F22/F23** — "mom-decides-privacy-with-transparency architecture cross-PRD cascade" PATTERN-FLAG (AUDIT_REPORT_v1.md §2 line 396). This cache leak is the inverse failure mode of that cascade: instead of mom not seeing what she's allowed to see, Family B sees what Family A's mom privately created. The two cascades intersect on the PRD-34 surface.
- **Scope 3+8b** — this finding could alternately land as a Scope 3+8b RLS/privacy finding rather than Scope 4. Surfacing here because the P6 evidence pass is what found it; orchestrator recommends it stays as SCOPE-4.F4 rather than shifting scopes (keeps the evidence trail coherent); apply-phase can cross-ref into Scope 3+8b index if that scope surfaces related findings.

## Round 7 — P7 Time-Based Sampling evidence pass

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_P7_time-based-sampling.md](EVIDENCE_P7_time-based-sampling.md)
- **Static evidence:** All 46 Edge Functions enumerated; 16 sites touching large-corpus tables inspected. Every built aggregation/summary site applies at least one bounding mechanism (explicit LIMIT, date window, per-entity scope, or RPC `match_count`). Examples: `scan-activity-victories` LIMIT 100 + period bounds, `lila-chat` history LIMIT 20, `message-coach` LIMIT 6, `auto-title-thread` LIMIT 4, `calculate-allowance-period` per-period, `process-carry-forward-fallback` 14-day cutoff, `accrue-loan-interest` per-loan, `mindsweep-auto-sweep` per-member unprocessed, `bookshelf-extract` per-book cache_id, `bookshelf-search/discuss` + context-assembler Layer-2 via RPC `match_count`.
- **Dynamic evidence:** None (P7 is static-only per PLAN §2.7).

### Founder adjudication (awaiting walk-through)

**Orchestrator proposal: accept worker verdict — no SCOPE-4.F emission for P7.** All built aggregation paths apply P7 correctly. No defect surfaced. Five unbuilt P7-eligible features (`monthly-aggregate`, `report-generate`, `safety-classify`, `anonymize`, PRD-37 family-feeds bulk-summary) are already captured by the F22 re-audit open flag in Round 0 — they get a targeted P1/P5/P7 re-audit when they build out, per DECISIONS.md §Round 0 "Scope 4 open flag — F22 homeschool reporting re-audit trigger."

### Emission list

None. P7 adds nothing to the apply-phase write-up beyond a one-line "P7 clean pass across 16 built sites; 5 unbuilt deferred to F22 re-audit" summary for AUDIT_REPORT §4 closing narrative.

## Round 8 — P8 User-Controlled Scope evidence pass

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_P8_user-controlled-scope.md](EVIDENCE_P8_user-controlled-scope.md)
- **Static evidence:** P8 applied at 15 of 21 context-source sites. Three-tier archive chain (person / folder / item) via `archive_member_settings` + `archive_folders` + `archive_context_items` is fully wired with Heart/HeartOff UI in `MemberArchiveDetail.tsx`. All 21 AI-consuming Edge Functions either honor `is_included_in_ai=true` via `_shared/context-assembler.ts`, `_shared/relationship-context.ts`, or direct filters (6 sites) — or operate exclusively on user-initiated text input (no persistent context leak). No recent-2026-04-build regressions.
- **Six UI gaps:** `journal_entries` (column filtered server-side; no Heart UI on entries), `family_best_intentions` (mutation hook exists, UI missing), `book_knowledge_access` (hook exists, picker component never shipped), `faith_preferences` (column exists; `relevance_setting='manual'` acts as the exposed proxy, not a Heart), `calendar_events` + `dashboard_widgets` (defensive columns; not yet consumed by any Edge Function — vacuously compliant).

### Founder adjudication (2026-04-20)

Founder direction: **"The hearts should work anywhere/everywhere."** No deferral for calendar/widget surfaces on the grounds that "nothing reads them yet" — if the column exists, the Heart toggle exists. Consistency beats lazy-rollout. This extends the flagship three-tier Heart/HeartOff pattern uniformly across every context-source surface.

### Emission list

- **SCOPE-4.F6** — Heart/HeartOff UI toggle gaps across six context-source surfaces. `is_included_in_ai` column exists and the server-side filter is honored, but mom has no UI lever to exclude specific items on six surfaces. Default state is `is_included_in_ai=true`, so the gap is **"mom can't opt out selectively"** not **"AI fires without consent"** — lower severity than if defaults were inverted. Founder-expanded fix scope: hearts everywhere the column lives. Classification: **Unintentional-Fix-Code**. Severity: **Low**. Beta Readiness: **N** (no forced-AI behavior; defaults are user-positive). Fix scope (approved 2026-04-20, all six sites included):
  - (a) **Journal entries** — add Heart/HeartOff toggle on each journal entry card. Mom can mark specific entries (e.g., a tough processing entry, a venting entry she doesn't want LiLa reading back) as HeartOff. Cross-ref SCOPE-2.F18 (different angle on journal UI polish); no re-emission, but coordinate fixes if both land in the same build sprint.
  - (b) **Family Best Intentions** — wire the existing mutation hook to a Heart/HeartOff icon on each family-intention card. Per-intention opt-out parallels the per-item pattern on personal Best Intentions.
  - (c) **Book knowledge access** — ship the picker component that consumes the existing hook. Per-member control over whether BookShelf content surfaces in their LiLa context (already backed by `bookshelf_member_settings.book_knowledge_access` enum).
  - (d) **Faith preferences** — add Heart/HeartOff alongside the existing `relevance_setting` dropdown. The two controls mean different things: Heart = is faith context in LiLa at all; relevance_setting = when/how it surfaces. Both stay.
  - (e) **Calendar events** — add Heart/HeartOff toggle on each event card. Defensive wiring today; when LiLa calendar-context loading ships (post-MVP), the toggle is already in place and no retrofit needed.
  - (f) **Dashboard widgets** — add Heart/HeartOff toggle in widget configuration/settings surface. Same "wire it now, LiLa consumes later" rationale as (e).
  - (g) **Pattern convention anchor.** CLAUDE.md Convention #8 ("Every context source has `is_included_in_ai` boolean") paired with CLAUDE.md Icon Semantics ("Heart / HeartOff = include/exclude from LiLa context — used on EVERY context-eligible item across the entire platform") already mandates this. This finding enforces the existing convention rather than creating a new rule. Audit trail: if a future context-source table ships without a Heart, the F6 precedent is the reason to block the build.

### Load-bearing unexpected findings

1. **`bookshelf_user_state` table shipped but `is_included_in_ai` per-extraction toggle not universally surfaced.** Worker noted 47 live rows; the hook + column wire through to the flagship Heart pattern on BookShelf extraction cards, but some surfaces (e.g., Book Discussion history) may not expose the toggle. Deferred as a BookShelf polish item; SCOPE-4.F6 text can be extended in the apply-phase if orchestrator judges it load-bearing enough to call out.
2. **`message_coaching_settings.is_enabled`** has a UI toggle but lives outside the Heart/HeartOff visual vocabulary (it's a settings checkbox). Acceptable per Convention #Icon Semantics "Heart = LiLa context inclusion"; message coaching is an active-AI feature, not a context source. Not a defect; recording as a distinction for the apply-phase narrative.

### Cross-references

- **SCOPE-2.F18** — journal UI (different angle). Coordinate fix if both land in the same build.
- **CLAUDE.md Convention #8** + Icon Semantics section — this finding reinforces existing convention; no new convention needed.

## Round 9 — P9 Per-Turn Semantic Refresh evidence pass

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_P9_per-turn-semantic-refresh.md](EVIDENCE_P9_per-turn-semantic-refresh.md)
- **Static evidence:** Shared `assembleContext()` + `loadRelationshipContext()` helpers implement sliding-4-window detection correctly. Detection text is `userMessage + recentMessages.slice(-4)`, stateless, re-runs per turn. Convention #74 (three-tier toggles), #76 (privacy-filtered hard constraint), #96 (Safe Harbor exempt), #105 (P9 itself) invariants are all evaluated per turn inside the shared helpers. `lila_conversations.context_snapshot` JSONB is a flag-carrier (`safety_triggered`, `prayer_questions`, `involved_member_ids`), NOT a context cache — does not conflict with P9. **Applied correctly at 13 of 14 F8-applied consumers.**
- **Dynamic evidence (historical telemetry, read-only):** `lila_messages.metadata` does not expose per-turn `loaded_sources` (observability gap already bundled into F8 fix scope (d)). No monotonic token-rise pattern in per-conversation turn data. Consistent with P9 applied; absence of per-turn variance evidence is an observability limitation, not a P9 defect signal.
- **F8 dependency flag resolved:** `lila-decision-guide` and `lila-board-of-directors` bypass `assembleContext()` entirely → by definition break P9 → **not re-emitted; cited as P9-resolved-by-F8**.

### Founder adjudication (awaiting walk-through)

**Orchestrator proposal:** accept F9 as worker framed it. This is a subtle partial miss — the outer P9 invariant is intact (per-turn invocation), but a single consumer accidentally shrinks the detection window from 5 messages to 1 by omitting the `recentMessages` parameter. `alwaysIncludeMembers: participantIds` covers the participant case; the hole is cross-turn mentions of non-participants ("remember when Aunt Sarah said..." mid-conversation won't load Aunt Sarah's context on the next turn, where a correctly-wired consumer would). One-line fix.

### Emission list

- **SCOPE-4.F9** — `lila-message-respond` Edge Function invokes `assembleContext()` per turn (outer P9 invariant intact) but **omits the `recentMessages` parameter entirely**, shrinking the effective name/topic detection window from 5 messages (current + last 4) to 1 message (current only). The `alwaysIncludeMembers: participantIds` override papers over the defect for thread participants — participants' context loads regardless of detection — but **non-participant mentions from prior turns don't load.** Concrete failure mode: mom in a thread with her teen mentions her mother ("Grandma Linda") on turn 3; on turn 4, turn-4's user message no longer references Grandma Linda directly; without the sliding window, Grandma Linda's archive context doesn't carry forward; LiLa feels like she forgot. Classification: **Unintentional-Fix-Code** (single-line wiring defect; 13 of 14 other consumers wire the parameter correctly). Severity: **Low** (partial miss, not total; bypass-by-omission, not bypass-by-design; `alwaysIncludeMembers` mitigates the most common case). Beta Readiness: **N** (no forced-AI harm; UX continuity issue on non-participant cross-turn references). Fix scope (approved 2026-04-20):
  - (a) **Single-line retrofit.** Add `recentMessages: recentMessages.slice(-4)` (or equivalent — use the same shape the other 13 consumers pass) to the `assembleContext()` call in `lila-message-respond`. One line.
  - (b) **Regression test fixture.** "In a multi-turn thread, a non-participant member mentioned on turn N must still have their context loaded on turn N+1 even if turn N+1's message doesn't directly name them." Covers the exact UX continuity gap.
  - (c) **Convention #105 amendment (coordinated with F8 (c)).** The F8 amendment already forbids bespoke context-load helpers; extend it to explicitly require the `recentMessages` sliding-window parameter in every `assembleContext()` call. Forward-looking guardrail.

### Load-bearing unexpected findings

1. **`context_snapshot` is a flag-carrier, not a cache.** This distinction was a genuine risk per the P9 worker prompt (the column could have been a cache that broke P9 structurally). Worker confirmed it carries single-event flags (`safety_triggered` per Convention #96, `prayer_questions`, `involved_member_ids`) that are looked up on subsequent turns but do NOT replace re-running context assembly. Good separation of concerns; no defect.
2. **Observability gap carried forward from F8 (d).** Per-turn `loaded_sources` metadata capture is not wired. P9 audit had to infer per-turn variance from token deltas (mostly absent due to column being NULL). F8 (d) fix resolves this for future P9 audits.

### P2 scope-narrowing verdict

Worker explicitly confirms **no P2 narrowing needed.** P2 (embedding-first classification) is an independent pattern — the classifier sites (MindSweep-sort, any other classifier Edge Function, feedback sentiment, routing suggestion surfaces) are distinct from the context-assembly sites P4/P9 cover. P2 worker can dispatch at full expected-site breadth with the F1 MindSweep finding already known (widened scope per founder direction 2026-04-20 — focus on the other classifier surfaces).

### Cross-references

- **SCOPE-4.F8** — resolves P9 miss at `lila-decision-guide` and `lila-board-of-directors`; both cited as P9-resolved-by-F8.
- **CLAUDE.md Convention #105** — extended by F9 (c) to explicitly require `recentMessages` sliding-window parameter.
- **F8 (d) observability wiring** — enables future P9 audits to work from first-class telemetry instead of inferred signals.

## Synthesis pass

*(optional — if a cross-pattern feature-level finding emerges per PLAN §5.3, captured here. Modeled on WALKTHROUGH_DECISIONS.md aggregate findings section.)*
