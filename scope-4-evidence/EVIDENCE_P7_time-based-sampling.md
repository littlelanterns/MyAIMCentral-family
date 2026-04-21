---
Status: COMPLETE — awaiting orchestrator adjudication
Stage: C
Scope: 4
Pattern: P7 — Time-Based Sampling
Opened: 2026-04-20
ai_patterns.md reference: L199
Dynamic evidence: None (static-only per PLAN §2.7)
---

# Scope 4 — P7 Time-Based Sampling Evidence Pass

## Worker summary

P7 applied correctly looks like: any feature that analyzes patterns across a family's messaging / journaling / tracker / activity-log history processes a **sample** (date window, LIMIT, per-subject scope, or sampling stride) rather than the full corpus. The anti-pattern is an unbounded `SELECT * FROM {large_table} ORDER BY created_at` with no LIMIT, no `WHERE` time filter, and no per-entity scoping — a query whose cost scales linearly with corpus size.

**Method:** Enumerated all 46 Edge Functions in `supabase/functions/`. Grep-filtered for aggregation-shaped names (`summary`, `aggregate`, `digest`, `report`, `bulk`, `monthly`, `scan`, `pattern`) and for direct queries against large-corpus tables (`lila_messages`, `journal_entries`, `activity_log_entries`, `widget_data_points`, `task_completions`, `bookshelf_*`, `homeschool_time_logs`, `financial_transactions`). For each hit, inspected the actual `.select()` call and its filter clauses for date-range, LIMIT, per-entity scope, or RPC-level `match_count`.

**Headline result:** 0 of 9 built aggregation/summary Edge Functions miss P7. Every built aggregation site applies one of: explicit `.limit(N)` (scan-activity-victories L66: LIMIT 100; auto-title-thread L86: LIMIT 4; message-coach L171: LIMIT 6; lila-quality-time L112: LIMIT 30; lila-chat L371: LIMIT 20), date-range windowing (scan-activity-victories L63-64 period bounds; calculate-allowance-period L155 period end bound; process-carry-forward-fallback L302 14-day backlog cutoff), per-entity scope (accrue-loan-interest per-loan iteration; bookshelf-extract per-book `book_cache_id`; mindsweep-auto-sweep per-member `processed_at IS NULL` holding), or RPC-level `match_count` / `.range(offset, offset+999)` paging (bookshelf-search, bookshelf-discuss, bookshelf-key-points).

**Unbuilt features deferred per DECISIONS.md Round 0 F22 re-audit flag:** `monthly-aggregate`, `report-generate`, `safety-classify`, `anonymize`, and any PRD-37 family-feeds bulk-summary Edge Function all absent from `supabase/functions/`. Glob confirms: no matching directory hits. These are the P7-highest-risk surfaces because they operate on cross-corpus scopes (platform anonymization across all families; family-wide monthly rollup; safety classification across all conversations; homeschool compliance report across a full school year). They are also the three features pre-flagged in DECISIONS.md Round 0 for F22 re-audit when they build out. Static audit today; dynamic/telemetry audit when the code lands.

## Site enumeration table

| Edge Function | Aggregation target | Query pattern | Verdict | Evidence |
|---|---|---|---|---|
| `scan-activity-victories/index.ts` | `activity_log_entries` + `victories` over period | Windowed (`created_at` gte+lte) + bounded (LIMIT 100) | Applied | L56-67 `loadActivityLog` `.gte('created_at', start).lte('created_at', end)...limit(100)`; L69-79 `loadExistingVictories` date-windowed |
| `celebrate-victory/index.ts` | `victories` by explicit ID set | Bounded by caller-supplied `victory_ids` array | Applied (N/A) | L72-79 `loadVictories` `.in('id', victoryIds)`; all context loaders `.limit(10)` L42/L55/L68 |
| `lila-chat/index.ts` | `lila_messages` conversation history | Bounded (LIMIT 20) + sliding 4-msg window | Applied | L371 `.limit(20)` + L374 `.slice(-4)` |
| `lila-quality-time/index.ts` (representative of all 11 lila-* tool functions) | `lila_messages` conversation history | Bounded (LIMIT 30) | Applied | L112 `.limit(30)` |
| `auto-title-thread/index.ts` | `messages` first N in thread | Per-thread scope + bounded (LIMIT 4) + idempotent skip if title exists | Applied | L80-86 `.eq('thread_id', thread_id)...limit(4)` + L72 skip when `thread.title` set |
| `message-coach/index.ts` | `messages` prior-context window | Bounded (LIMIT 6) | Applied | L167-171 `.limit(6)` |
| `calculate-allowance-period/index.ts` | `tasks`, `routine_step_completions`, `allowance_periods` per period | Windowed (`period.period_end` + `period.period_start` bounds) + per-member scope | Applied | L155 `.lte('created_at', period.period_end...)`; L204-205 `.gte/.lte('period_date', ...)` |
| `accrue-loan-interest/index.ts` | `loans` active, with interest | Per-family iteration + `status='active'` + `interest_rate > 0` filter | Applied (bounded) | L88-93 per-family + per-loan inner iteration |
| `process-carry-forward-fallback/index.ts` | `tasks`, `rhythm_completions`, `list_items` per member | Per-family + per-member iteration; 14-day backlog cutoff; `rhythm_completions` LIMIT 5 | Applied (bounded) | L106 per-family; L186-193 per-member overdue scope; L302 `.lt('due_date', backlogCutoffDate)`; L324 `.limit(5)` |
| `mindsweep-auto-sweep/index.ts` | `mindsweep_holding` unprocessed | `processed_at IS NULL` + per-member scope | Applied (bounded) | L39-43 unprocessed-only; L92-97 per-member `processed_at IS NULL` |
| `bookshelf-extract/index.ts` (`discover_sections`) | `bookshelf_chunks` per book | Per-`book_cache_id` scope (bounded by single book's chunk count) | Applied (bounded) | L988-992 `.eq('book_cache_id', chunkKey)` |
| `bookshelf-key-points/index.ts` | `get_book_extractions` RPC | Per-book + `.range(offset, offset+999)` paging | Applied | L66-70 paginated RPC |
| `bookshelf-discuss/index.ts` | platform RPCs `get_book_extractions`, `match_book_chunks` | Per-book scope + `match_count` param | Applied | L342-348 per-book RPC; L414-423 `match_count: chunkCount` (5 or 8) |
| `bookshelf-search/index.ts` | `match_bookshelf_chunks` / `match_bookshelf_extractions` RPCs | RPC-level `match_count` | Applied | L173/L198 `match_count: limit` |
| `_shared/context-assembler.ts` (Layer 2 loaders) | `guiding_stars`, `self_knowledge`, `archive_context_items`, etc. | Per-member + `.limit(N)` on every loader | Applied | L285 `.limit(maxGuidingStars ?? 5)`, L315, L622, L683 all LIMIT-bounded |
| `extract-insights/index.ts` | Per-document, user-upload | Bounded by single uploaded document text | Applied (N/A) | Per-upload, not corpus aggregation |

## Unbuilt features deferred (per DECISIONS.md Round 0 F22 re-audit flag)

The following P7-eligible features are documented in `claude/architecture.md` (Edge Functions table) or CLAUDE.md (PRD references) but have no corresponding code in `supabase/functions/`. Each is explicitly flagged for a Scope 4 re-audit when it builds out, per DECISIONS.md Round 0 "Scope 4 open flag — F22 homeschool reporting re-audit trigger":

1. **`monthly-aggregate`** — per architecture.md L140: "Monthly data aggregation (billing day trigger)." No directory. Will operate cross-family corpus; P7 invariant critical (must window by billing period, not scan all-time).
2. **`report-generate`** — per architecture.md L141: "Template-based report generation." No directory. PRD-19 / PRD-28B compliance reports. Will aggregate per-student full-year `homeschool_time_logs` / `task_completions` / `activity_log_entries`; P7 invariant critical (must window by school year, not scan lifetime).
3. **`safety-classify`** — per architecture.md L138 and CLAUDE.md PRD-30 reference: "Haiku conversation classification for safety monitoring." No directory. PRD-30 unbuilt per SCOPE-8a.F3. Will operate across `lila_messages` corpus; P7 invariant critical (must window or stride-sample, not scan every message per run).
4. **`anonymize`** — per architecture.md L139: "Platform Intelligence Pipeline anonymization." No directory. Will process conversation/journal/context corpus through 12-channel anonymization; P7 invariant critical (must batch + window, not single-pass all-time scan).
5. **PRD-37 family-feeds bulk summary** — per CLAUDE.md convention-level references to `homeschool_bulk_summary` guided-mode. No Edge Function directory. Will roll up `family_moments` + `homeschool_time_logs` into summaries; P7 invariant critical (must window by configurable period, not full lifetime).

All 5 are in the SCOPE-2 unbuilt inventory (per F22 horizon 2-3 months). When any of these land, a re-opened P7 pass audits that specific function only. Parallel to F22 Fix Next Build cadence, not blocking.

## Unexpected findings

1. **None.** The expected-risk sites (aggregation Edge Functions) either apply P7 correctly or are unbuilt and flagged. No surprise unbounded `SELECT * ORDER BY created_at` hits surfaced in grep of built Edge Functions against the listed large tables (`lila_messages`, `journal_entries`, `activity_log_entries`, `widget_data_points`, `task_completions`, `homeschool_time_logs`, `financial_transactions`). The 11 lila-* tool Edge Functions all follow the same `.limit(20-30)` conversation-history pattern as lila-chat.
2. **Coarse per-loop iteration cost is not a P7 concern.** `accrue-loan-interest`, `process-carry-forward-fallback`, `mindsweep-auto-sweep`, and `calculate-allowance-period` all iterate `families → members` without a family-count LIMIT. At ~3 live families + 18 active members today, this is tolerable; at 100+ founding families with 5-8 members each (~800 member-iterations per cron run), it remains tolerable for hourly crons doing bounded per-member work. Not a P7 miss (each inner loop is scoped + bounded). Flagging here only as "watch at scale" — a cold future concern separate from P7.
3. **`extract-insights/index.ts` is per-document, not aggregation.** Initially flagged because its name suggests aggregation; on inspection it processes a single user-uploaded document, so it's not P7-eligible. Included in the site table for audit trail.

## Proposed consolidation

**No finding — all built P7-eligible aggregation sites apply time-based sampling or equivalent bounding (LIMIT, window, per-entity scope, or RPC `match_count`). Re-audit deferred to F22 build-out timeline per DECISIONS.md Round 0 open flag.**

Rationale per PLAN §5.1 (one finding per pattern-level miss by default): there is no pattern-level miss to emit. Every built Edge Function that touches a large-corpus table applies at least one form of bounding — most apply two (e.g., per-member scope + LIMIT, or date window + LIMIT). The four canonical risk surfaces (`monthly-aggregate`, `report-generate`, `safety-classify`, `anonymize`) plus PRD-37 bulk summary are all unbuilt and already registered in DECISIONS.md Round 0 as triggers for a future Scope 4 re-audit.

**Reiteration of F22 re-audit flag:** when `monthly-aggregate` OR `report-generate` OR any PRD-37 bulk-summary Edge Function OR `safety-classify` OR `anonymize` lands in `supabase/functions/`, reopen `scope-4-evidence/` temporarily, run a targeted P1 + P5 + P7 pass against that function only, and emit any `SCOPE-4.F{N}` addendum findings to AUDIT_REPORT §4. Re-audit is parallel to the F22 Fix Next Build cadence; does not block the launching feature.

**Beta Readiness: N.** P7 has zero finding to flag at beta.

## Orchestrator adjudication

*(blank — to be filled during Round 7 walk-through)*
