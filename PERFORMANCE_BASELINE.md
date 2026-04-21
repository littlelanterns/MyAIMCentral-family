---
Status: COMPLETE — Scope 7 baseline capture 2026-04-21
Type: Baseline measurements (reporting-only — no optimization during audit)
Feeds: Future optimization work; comparison target for post-remediation re-measurement
Related: [MYAIM_GAMEPLAN_v2.2.md](MYAIM_GAMEPLAN_v2.2.md) Phase 2 lines 324–327; [AUDIT_REPORT_v1.md](AUDIT_REPORT_v1.md); [claude/ai_patterns.md](claude/ai_patterns.md) (< $1/family/month target); [claude/architecture.md](claude/architecture.md)
---

## Summary

Baseline captured **2026-04-21** against production Supabase project `vjfbzpliqialqmabfnxs` via `supabase db query --linked` (read-only). No optimization, no code changes, no synthetic load, no dynamic instrumentation. All numbers come from historical telemetry already being collected by the platform: `ai_usage_tracking` (530 rows, 2026-03-24 → 2026-04-19), `lila_messages` / `lila_conversations` (150 / 72 rows), `pg_stat_statements` (since last stat reset), `cron.job_run_details` (last 7 days), `pg_class` / `pg_indexes` (current state). Sample sizes are small because the platform is in pre-beta with 2 families writing AI-call history; numbers will shift materially once real beta load lands. Re-measure after any optimization work using the same methodology — see **Comparison protocol** at the bottom of this file.

Methodology for AI turn latency: for each assistant message in `lila_messages`, latency is `assistant.created_at − previous_user.created_at` within the same `conversation_id`. This measures full user-perceived turn time (network + context assembly + model inference + stream completion + insert commit). Outliers > 600 s are dropped as stale-conversation continuations.

Methodology for query performance: pulled directly from `pg_stat_statements` (extension version 1.11, installed). Only queries with ≥ 5 calls are reported; Supabase Realtime WAL scans and internal `pg_catalog` / `information_schema` queries are excluded.

---

## Load times

**Not instrumented.** The app is deployed to Vercel (per `claude/architecture.md`) but there is no Vercel Analytics, no Web Vitals reporter, no server-timing header, and no client-side RUM wired today. Every published route would require either (a) a manual DevTools capture per route (one-time, subjective, not a durable baseline), (b) a Playwright-based synthetic run with `page.metrics()` / `performance.timing` capture, or (c) wiring Vercel Analytics and waiting for real traffic.

Option (b) and (c) require dynamic instrumentation, which per the Scope 7 dispatch rule requires founder approval at dispatch time. Approval was not requested this session; load-time baseline is deferred. When it is captured, the following routes are the priority set (ranked by known heaviness based on the static review in [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) and table sizes below): `/dashboard` (~11 parallel data hooks at mount), `/tasks` (~52 hook calls per render, per grep on [src/pages/Tasks.tsx](src/pages/Tasks.tsx)), `/bookshelf` and `/bookshelf/:id` (812 MB + 591 MB tables behind them), `/archives`, `/vault`, `/calendar`.

See **Comparison protocol** below for the recipe to stand up this measurement consistently when it is run.

## Query performance

Top queries by mean execution time, from `pg_stat_statements`. Filtered to user-facing and RPC queries; Realtime WAL decoding, `pg_catalog`, `pg_stat_statements` self-queries, and VACUUM / ANALYZE excluded. Reported columns: call count, mean ms, stddev ms, max ms, total ms (cumulative time spent in this statement since last stat reset).

| # | Query | Calls | Mean ms | Stddev ms | Max ms | Total ms | Notes |
|---|-------|-------|---------|-----------|--------|----------|-------|
| Q1 | `WITH canonical AS (SELECT section_title, MIN(section_index) … FROM platform_intelligence.book_extractions WHERE book_library_id = $1 …)` — book section canonicalization CTE | 147 | **7 113** | 5 387 | **27 133** | 1 045 590 | Originates in `scripts/backfill-section-index.mjs` — one-time backfill, not a user-request path. Still the single-worst query by mean, worth flagging. |
| Q2 | `pg_timezone_names` scan | 184 | 483 | 367 | 1 349 | 88 890 | Called by Supabase dashboard / metadata tooling, not app code. |
| Q3 | `supabase_migrations.schema_migrations` order-by-version | 6 | 460 | 178 | 842 | 2 762 | Dashboard-driven. |
| Q4 | `pg_available_extensions` join | 10 | 357 | 260 | 637 | 3 574 | Dashboard-driven. |
| Q5 | `update_book_extraction_embedding(p_id, p_embedding)` RPC — used by `embed` Edge Function to write HNSW-indexed embeddings back to `platform_intelligence.book_extractions` | 1 454 | **244** | 188 | 1 601 | 355 333 | Dominated by HNSW index-maintenance cost on an 89 921-row table with `idx_plbe_embedding` (HNSW / halfvec_cosine_ops). Runs in the async embedding pipeline, not a user-facing path — latency here does not block UI. |
| Q6 | `WITH canonical AS (… source_part_number, MIN(section_index) …) FROM platform_intelligence.book_extractions` — variant with `source_part_number` | 146 | 115 | 954 | 10 276 | 16 718 | Backfill-script variant. Max 10 s is a tail event, median-ish call is fast. |
| Q7 | `approve_task_completion` RPC (via PostgREST) | 71 | 129 | 296 | 2 004 | 9 178 | Called from task approval flows. p95 proxied via stddev — call cluster is bimodal (most fast, a few slow). |
| Q8 | `expire_overdue_task_claims()` (called hourly by cron + on-demand client sweep) | 341 | 50 | 28 | 196 | 17 109 | Hourly cron + user-triggered; cost acceptable for scan-all-claims pattern. |
| Q9 | `verify_member_pin(p_member_id, p_pin)` RPC | 205 | 39 | 19 | 101 | 7 916 | PIN verification; involves pgcrypto bcrypt compare — ~40 ms is expected for bcrypt. |
| Q10 | `update_book_extraction_embedding` RPC variant (different signature) | 276 | 31 | 66 | 636 | 8 684 | Second embedding-write path. |

Observations:
- **Q1 and Q6 are migration-script queries, not user-facing.** They inflate the "slowest query" list but will not recur after the backfill completes. If the backfill has already run to completion against all 562 `bookshelf_items`, `pg_stat_statements_reset()` after sign-off would give a cleaner baseline.
- **No user-facing query has a mean > 250 ms.** The Q5/Q10 embedding write RPCs are async-pipeline-only.
- **No table scan patterns on `bookshelf_*` user tables surfaced in the top 25.** Heavy tables (591 MB `bookshelf_chunks`, 217 MB `bookshelf_insights`, 199 MB `bookshelf_summaries`) are read via `match_bookshelf_chunks` / `match_book_extractions` semantic-search RPCs, which use the HNSW index and do not appear in the top-cost list.
- **`pg_stat_statements` reset timestamp not captured.** Supabase typically resets on major version restart; totals above represent "all time since last reset" not a fixed 30-day window. For re-measurement, run `SELECT stats_reset FROM pg_stat_statements_info;` (extension version 1.11 exposes this) to anchor the window.

## AI call latency

### Overall AI turn latency (user → assistant round-trip across all modes)

| Sample n | Mean s | Median s | p95 s | p99 s | Min s | Max s |
|---|---|---|---|---|---|---|
| 72 | 6.74 | 6.48 | **17.08** | 20.33 | 1.33 | 22.86 |

p95 of 17 s is the headline. Two Sonnet modes (`assist`, `null`/general-chat) carry almost all of the long-tail weight — see breakdown below. Small sample — any future re-measurement after real beta traffic will give more stable percentiles.

### By mode + model (ordered by sample size; all `source='ai_call'` unless noted)

| Guided mode | Model | Sample n | Median s | p95 s | Max s | Notes |
|---|---|---|---|---|---|---|
| translator | haiku | 23 | 2.01 | 3.07 | 4.21 | Healthy Haiku baseline — single-turn text rewrite. Matches the "Haiku is fast" architectural assumption. |
| cyrano | sonnet | 16 | 8.40 | 9.65 | 10.30 | Tight stddev; consistently ~8–10 s. Sonnet + spouse-focused context assembly. |
| null (general chat) | sonnet | 12 | 7.93 | **19.29** | 19.30 | Widest tail of any mode. Median is fine; p95 is the user experience that worries. |
| perspective_shifter | sonnet | 11 | 6.65 | 7.19 | 7.26 | Tightest Sonnet mode. |
| assist | **haiku** | 4 | **11.90** | 21.97 | **22.86** | ⚠️ Haiku running > 20 s is anomalous. Expected Haiku mean ≈ 2 s (cf. translator). Likely synchronous context assembly, large prompt, or a Known-Issues keyword-miss-then-retry path. Small n (4) — re-measure. |
| optimizer | sonnet | 2 | 14.53 | 17.01 | 17.29 | Small n. |
| higgins_say | sonnet | 2 | 6.40 | 9.72 | 10.09 | Small n. |
| gratitude | sonnet | 1 | 4.29 | 4.29 | 4.29 | Single sample. |
| words_affirmation | sonnet | 1 | 10.54 | 10.54 | 10.54 | Single sample. |

### By feature_key over the last 30 days (from `ai_usage_tracking`)

| feature_key | Model | Calls 30d | Mean tokens | Sum cost USD |
|---|---|---|---|---|
| `guided_nbt_glaze` | haiku | 177 | 186 | $0.0125 |
| `bookshelf_discuss` | sonnet | 102 | 3 502 | $1.4651 |
| `bookshelf_extract` | sonnet | 63 | 10 055 | $4.8429 |
| `lila_translator` | haiku | 29 | 347 | $0.0040 |
| `lila_cyrano` | sonnet | 20 | 2 724 | $0.2114 |
| `lila_general` | sonnet | 18 | 1 835 | $0.1592 |
| `rhythm_morning_insight` | embedding-3-small | 16 | 15 | $0.0000 |
| `bookshelf_search` | embedding-3-small | 14 | 10 | $0.0000 |
| `mindsweep_scan` | sonnet | 13 | 1 437 | $0.0720 |
| `mindsweep_sort` | haiku | 9 | 1 682 | $0.0064 |
| `mindsweep_sort` | embedding-3-small | 9 | 67 | $0.0000 |
| `lila_higgins_say` | sonnet | 9 | 2 053 | $0.0692 |
| `lila_perspective_shifter` | sonnet | 8 | 1 426 | $0.0532 |
| `lila_gratitude` | sonnet | 7 | 1 502 | $0.0414 |
| `lila_higgins_navigate` | sonnet | 6 | 2 116 | $0.0420 |
| `lila_mediator` | sonnet | 6 | 1 239 | $0.0303 |
| `lila_optimizer` | sonnet | 6 | 2 734 | $0.0749 |

### By model (last 30 days)

| Model | Calls | Mean tokens | Mean cost USD | Sum cost USD |
|---|---|---|---|---|
| `anthropic/claude-sonnet-4` | 268 | 4 439 | $0.026648 | **$7.1415** |
| `anthropic/claude-haiku-4.5` | 224 | 1 770 | $0.000531 | $0.1190 |
| `text-embedding-3-small` | 39 | 25 | $0.0000 | $0.0000 |

Sonnet is ~50× the per-call cost of Haiku and dominates total spend at the current balance. 80 % of Sonnet cost concentrates in two bookshelf features (`bookshelf_discuss` + `bookshelf_extract` = $6.31 of $7.14). This matches the architectural expectation that BookShelf extraction is the most expensive operation and that it is bounded per book upload.

### Per-family cost (last 30 days)

| Family | Calls 30d | Cost 30d USD | Distinct features |
|---|---|---|---|
| `4bc86323-…` (founder / dogfood) | 494 | **$6.8778** | 22 |
| `1f6200a7-…` (second beta) | 37 | $0.3828 | 6 |

The founder family exceeds the **< $1/family/month architectural target** (CLAUDE.md line 12 / `claude/ai_patterns.md`) by 6.9×. This is expected for a dogfood account running BookShelf uploads — `bookshelf_extract` is a one-time-per-book cost of roughly $0.08 per 10 K-token extraction. The second family, with no BookShelf uploads in the window, runs $0.38/30 days, under the target. Re-measure once the founder account's book-upload cadence stabilizes and real beta families land.

## Infrastructure baselines

### Extensions installed

| Extension | Version | Purpose |
|---|---|---|
| `pg_cron` | 1.6.4 | Scheduled job runner |
| `pg_net` | 0.20.0 | HTTP from Postgres (used by embedding pipeline + cron → Edge Function calls) |
| `pg_stat_statements` | 1.11 | Query performance telemetry |
| `pgmq` | 1.5.1 | Message queue for async embedding jobs |
| `vector` | 0.8.0 | pgvector / halfvec for embeddings |

### pgmq embedding queue

| Queue | Depth | Archive |
|---|---|---|
| `embedding_jobs` | **0** rows | 0 rows |

Queue is draining fully every consumer cycle. No backlog. The `process-embeddings` cron (jobid 1) runs every 60 s and completes in a mean of **13 ms** (max 185 ms) across 10 080 runs in 7 days — zero failures, zero lag.

### pg_cron jobs (last 7 days)

| jobid | jobname | Schedule | Runs 7d | Succeeded | **Failed** | Mean dur s | Max dur s |
|---|---|---|---|---|---|---|---|
| 1 | process-embeddings | `* * * * *` | 10 080 | 10 080 | 0 | 0.013 | 0.185 |
| 2 | mindsweep-auto-sweep | `0 * * * *` | 168 | 0 | **168** | 0.010 | 0.103 |
| 3 | expire-penciled-in-events | `0 2 * * *` | 7 | 7 | 0 | 0.070 | 0.130 |
| 4 | expire-overdue-task-claims | `0 * * * *` | 168 | 168 | 0 | 0.069 | 0.223 |
| 5 | rhythm-carry-forward-fallback | `5 * * * *` | 168 | 0 | **168** | 0.006 | 0.032 |
| 6 | advance-task-rotations | `15 0 * * *` | 7 | 7 | 0 | 0.125 | 0.181 |
| 7 | calculate-allowance-period | `10 * * * *` | 168 | 0 | **168** | 0.007 | 0.032 |
| 8 | accrue-loan-interest | `15 * * * *` | 168 | 0 | **168** | 0.006 | 0.033 |

**Four jobs (2, 5, 7, 8) are failing 100 % of runs with identical error:**
```
ERROR:  unrecognized configuration parameter "app.settings.supabase_url"
```

All four compose their Edge-Function URL via `current_setting('app.settings.supabase_url')` at runtime. The `app.settings.supabase_url` custom GUC has never been set in the database. Jobid 1 hardcodes the URL directly and works; jobs 2 / 5 / 7 / 8 do not. This is a single ALTER DATABASE … SET … line of configuration, but for 7 days running those jobs have silently done nothing. See issue #1 below.

### Connection pool

| max_connections | Total client connections | Active | Idle | Idle in txn |
|---|---|---|---|---|
| 60 | 21 | 1 | 20 | 0 |

Healthy at rest. No idle-in-transaction leaks. Pool headroom is 39 slots; under real beta load this will be the ceiling to watch, especially against the Dashboard's ~11 parallel hooks × concurrent sessions scenario.

### Heaviest tables (total size including indexes + toast)

| Table | Schema | Est. rows | Total size |
|---|---|---|---|
| `book_extractions` | platform_intelligence | 89 921 | **812 MB** |
| `bookshelf_chunks` | public | 58 115 | **591 MB** |
| `book_chunks` | platform_intelligence | 56 700 | **533 MB** |
| `bookshelf_insights` | public | 24 159 | 217 MB |
| `bookshelf_summaries` | public | 21 689 | 199 MB |
| `bookshelf_declarations` | public | 17 031 | 150 MB |
| `bookshelf_action_steps` | public | 16 225 | 147 MB |
| `bookshelf_items` | public | 562 | 109 MB |
| `bookshelf_questions` | public | 9 913 | 90 MB |
| `platform_assets` | public | 603 | 13 MB |
| `meeting_template_sections` | public | 31 158 | 8 MB |
| `daily_holidays` | public | 1 502 | 0.5 MB |
| `ai_usage_tracking` | public | 528 | 0.5 MB |

BookShelf tables dominate the database at ~2.7 GB combined. All carry HNSW embedding indexes (verified on `book_extractions`: `idx_plbe_embedding USING hnsw (embedding halfvec_cosine_ops)`). Growth is bounded by real-world book count, not by user actions per family — 562 `bookshelf_items` today implies a long-tail: most reads are via `match_*` RPCs (which use the HNSW index), not by table scan.

## Obvious performance issues flagged for triage

These are flags, not findings. They inform a future triage pass — they are not `SCOPE-7.F{N}` audit findings. Sorted by severity.

1. **[HIGH] Four pg_cron jobs failing 100% of runs for the observed window.**
   - Jobs: `mindsweep-auto-sweep` (jobid 2), `rhythm-carry-forward-fallback` (jobid 5), `calculate-allowance-period` (jobid 7), `accrue-loan-interest` (jobid 8).
   - Error: `unrecognized configuration parameter "app.settings.supabase_url"`.
   - Impact: auto-sweep never runs (MindSweep PRD-17B feature silently broken), carry-forward fallback never runs (rhythm PRD-18 Phase B Convention 171 silently broken), allowance periods never auto-calculate (PRD-28), loan interest never accrues (PRD-28). Functional impact, not just performance. These are not caught by any test because they only fire in production on cron.
   - Recommended next step: `ALTER DATABASE postgres SET app.settings.supabase_url = 'https://vjfbzpliqialqmabfnxs.supabase.co';` OR update each cron job to hardcode the URL (matching jobid 1's pattern). One-line fix; verify by watching `cron.job_run_details` for 2 successful runs.

2. **[MEDIUM] `assist` mode p95 at 21.97 s (Haiku) is off-pattern.**
   - Other Haiku modes (`translator`) run median 2 s / p95 3 s. `assist` is 10× slower despite using the same model.
   - Candidate causes: (a) synchronous Known-Issues keyword-miss path falling back to Haiku with a large context prompt; (b) assist-mode system prompt + context assembly being substantially larger than translator's; (c) a cold-start Edge Function penalty concentrated in a low-traffic feature.
   - Sample is small (n=4). Re-measure after real beta traffic before acting.
   - Recommended next step: add a server-timing header split (context-assembly vs model-inference) to the `lila-chat` Edge Function for the `assist` mode_key, then re-measure.

3. **[MEDIUM] `lila_general` mode p95 at 19.29 s (Sonnet) with wide stddev.**
   - Median 7.93 s is in line with Cyrano / Perspective Shifter, but max 19.30 s / p95 19.29 s suggests a distinct slow-tail cluster. Likely either (a) long context assembly for free-form chat (general mode triggers name detection + topic matching + potentially multiple Layer 2 archive loads — per `claude/ai_patterns.md` layered context architecture), or (b) model streaming stalls.
   - Recommended next step: instrument context-assembly tokens and pre-inference prompt size in `_shared/context-assembler.ts`; correlate to turn latency.

4. **[LOW] Dashboard.tsx mounts ~11 parallel data hooks on first render.**
   - By grep: `useFamilyMember`, `useFamily`, `useFamilyMembers`, `useWidgets`, `useWidgetFolders`, `useWidgetStarterConfigs`, `useDashboardConfig`, `usePendingCounts`, `useGamificationConfig`, `useMemberColoringReveals`, `useTasks` — each a separate Supabase REST round-trip. Tasks.tsx shows ~52 `use*(` calls by grep — mostly React primitives but likely includes multiple data hooks too.
   - At current beta volume the connection pool is fine, but at projected beta scale (100 founding families × 5 members × peak-hour concurrent sessions) this will be the first TTI pain point to surface.
   - Recommended next step: once load-time instrumentation exists (see below), capture a `/dashboard` Network waterfall in DevTools and count blocking round-trips. Either batch into an RPC or consolidate into a single `GET /dashboard-bundle` Edge Function.

5. **[LOW] `platform_intelligence.book_extractions` canonicalization CTE at mean 7.1 s, max 27 s.**
   - Source: one-time backfill script `scripts/backfill-section-index.mjs`, not a user-facing query.
   - Flag only because it is the single-worst query by mean in `pg_stat_statements`. Will disappear from the top-costs list once backfill completes + `SELECT pg_stat_statements_reset()` is run.
   - Recommended next step: verify backfill completion (all `book_extractions.section_index IS NOT NULL` for `audience='original'` rows where `section_title IS NOT NULL`), then reset pg_stat_statements before re-measuring.

6. **[LOW] HNSW embedding-write RPC `update_book_extraction_embedding` at mean 244 ms (p-max 1.6 s, 1 454 calls).**
   - Background-only — runs inside the `embed` Edge Function via pgmq consumer cycle. Zero user-facing impact.
   - Cost is HNSW index-maintenance on an 89 921-row table; expected behavior.
   - Recommended next step: none. Documented here so future re-measurement does not flag it as a regression.

7. **[INFO] Load-time baseline not captured this session.**
   - Vercel Analytics / Web Vitals / server-timing are not wired. Capturing TTI / p95-navigation for production routes would require either dynamic instrumentation (Playwright-driven) or waiting for real user telemetry. Dynamic instrumentation requires founder approval at dispatch per Scope 7 rules; approval was not requested.
   - Recommended next step: before the next Beta Readiness Gate, either (a) wire Vercel Speed Insights (1-line change in `vercel.json`) and accumulate 7 days of RUM; or (b) stand up a Playwright run that navigates each route logged in while measuring `page.evaluate(() => performance.getEntriesByType('navigation')[0])`.

8. **[INFO] `pg_stat_statements` observation window is "since last stat reset", not a fixed 30-day window.**
   - Totals above represent cumulative execution time since the last Postgres restart or manual reset. For clean re-measurement, run `SELECT stats_reset FROM pg_stat_statements_info;` to anchor the window, or `SELECT pg_stat_statements_reset()` to start a fresh window.

## Comparison protocol

To re-run this baseline after optimization work (or quarterly against drift):

1. **Anchor the window.** Run `SELECT stats_reset FROM pg_stat_statements_info;` to capture when the current window started. For a fresh window, run `SELECT pg_stat_statements_reset();` and wait at least 24 h of traffic before re-measuring.
2. **Re-run the five SQL probes** used for this baseline. They live in `c:/tmp/scope7/` during the capture session; move any you want to keep into `scripts/` for reuse:
   - `baseline_ai_latency.sql` — overall AI turn latency via consecutive user→assistant message deltas.
   - `baseline_ai_by_mode.sql` — same, bucketed by `guided_mode` / `model_used` / `metadata.source`.
   - `ai_by_model.sql`, `ai_by_feature.sql`, `ai_cost_per_family.sql` — AI usage volume + cost aggregates over the last 30 days.
   - `pg_stat_top.sql` + `pg_stat_top_volume.sql` — top queries by mean and total exec time.
   - `infra_cron_runtime.sql` + `infra_cron_failures.sql` — cron job health.
   - `infra_queue_depth2.sql` — pgmq embedding queue depth.
   - `infra_conn2.sql` — connection pool snapshot.
   - `infra_tables.sql` — heaviest tables by size.
3. **Use the same methodology for AI turn latency** (assistant message `created_at` minus preceding user message `created_at` in the same conversation; drop rows where the gap exceeds 600 s). This is a user-perceived round-trip proxy, not a pure model-inference measurement — it includes context assembly, network, stream, and insert commit.
4. **Report the same columns** in each table (count, mean, median, p95, max, min) so post-optimization numbers line up row-for-row against this baseline. Do not add or rename columns without noting the schema change at the top of the re-run document.
5. **If load-time measurements are added**, anchor on TTI (time-to-interactive) plus LCP (largest contentful paint) as the two primary signals; record both median and p95 per route with sample n. Capture on the same device / network profile every re-run.
6. **Flag any baseline-vs-current delta > 20 %** in either direction. A > 20 % regression is a triage item. A > 20 % improvement is an opportunity to check whether the measurement methodology drifted (e.g. someone reset `pg_stat_statements` mid-window).
