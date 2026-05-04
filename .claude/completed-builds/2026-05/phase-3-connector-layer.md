# Phase 3 — Connector Architecture Worker A+B

## Status: ACTIVE (pending founder approval of pre-build summary)

**PRD:** N/A (cross-PRD infrastructure — connector layer)
**Feature Decision File:** `claude/feature-decisions/Phase-3-Connector-Architecture-Worker-AB.md`

## Source Material Read

- [x] `claude/PRE_BUILD_PROCESS.md`
- [x] `claude/web-sync/Connector-Build-Plan-2026-04-26.md` (§6.2 items 1-6)
- [x] `claude/web-sync/Connector-Architecture-and-Routing-Model.md` (Phase 1 design)
- [x] `claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md` (reward forensic)
- [x] `claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md` (allowance forensic)
- [x] `claude/web-sync/Parallel-Builder-Coordination-Brief-2026-04-26.md` (§2.10 locked source_types)
- [x] `.claude/state/phase3-investigation-dispatch.md` (16 investigations)
- [x] `claude/live_schema.md` (current schema)
- [x] `prds/addenda/PRD-24-Cross-PRD-Impact-Addendum.md`
- [x] `prds/addenda/PRD-28-Cross-PRD-Impact-Addendum.md`

## Tool Health

- codegraph: not checked (infrastructure build, no complex call-graph needed)
- endor-cli-tools: not checked (no new dependencies)
- Override acknowledged: this build is schema + RPC + cron — no external tool dependency

## Pre-Build Summary

### Scope

Worker A+B ships the foundational schema and dispatch infrastructure for the connector layer. 7 commits: 1 preparatory refactor + 6 sub-tasks.

### Preparatory Refactor

Extract `rollGamificationForCompletion` from 3 duplicated locations into `src/lib/gamification/rollGamificationForCompletion.ts`. Identical implementations at:
- `src/hooks/useTaskCompletions.ts` (lines 19-35)
- `src/hooks/useTasks.ts` (lines 43-59)
- `src/hooks/usePractice.ts` (lines 33-49)

Pure refactor, no behavior change. Workers C+D will later replace these calls with deed-firing inserts.

### Sub-Task 1: contracts table (migration 100199)

Central switchboard table with:
- Identity (id, family_id, created_by, timestamps)
- Lifecycle (status: active/recently_deleted/archived, deleted_at, archived_at)
- Deed addressing (source_type CHECK 10 verb-forms, source_id, source_category, family_member_id)
- IF logic (if_pattern CHECK 8 patterns, if_n, if_floor, if_window_kind, if_window_starts_at/ends_at, if_calendar_pattern, if_offset)
- Godmother routing (godmother_type CHECK 9 types, godmother_config_id)
- Payload (payload_amount, payload_text, payload_config)
- stroke_of timing (stroke_of CHECK 6 values, stroke_of_time, recurrence_details)
- Inheritance (inheritance_level CHECK 3 levels, override_mode)
- Presentation (presentation_mode, presentation_config)

Indexes: contract lookup, active listing, inheritance resolution, partial unique per level.
RLS: family-scoped, mom read/write, other roles read-only on affecting contracts.

### Sub-Task 2: deed_firings extension + coloring reveal + allowance collapse (migrations 100200-100202)

Three independent schema changes in one commit:
- **deed_firings:** ADD CHECK constraint with 10 verb-form source_types, add `(family_member_id, source_type, fired_at)` index
- **member_coloring_reveals:** DROP `earning_task_id` FK, ADD `earning_source_type TEXT` + `earning_source_id UUID`. Update 3 RPC locations in `roll_creature_for_completion` + `useCreateColoringReveal` frontend mutation. Zero rows in production = zero risk.
- **allowance_configs:** UPDATE `fixed` → `dynamic`, ALTER CHECK to `('dynamic', 'points_weighted')`. Also ADD `families.allowance_dispatch_via TEXT CHECK ('legacy', 'connector') DEFAULT 'legacy'`.

### Sub-Task 3: godmother config tables (migration 100203)

5 config tables for godmothers needing richer config than inline payload:
- `allowance_godmother_configs` — pool assignment, calculation overrides
- `points_godmother_configs` — base points, streak bonuses, creature roll config
- `prize_godmother_configs` — prize type, pool reference, IOU text, expiry
- `assign_task_godmother_configs` — template_id, assignment mode, due date logic
- `custom_reward_godmother_configs` — delivery mode, list_id

4 godmothers use inline payload only: numerator (amount), money (amount), victory (text), family_victory (no-op).

### Sub-Task 4: compute_streak RPC (migration 100204)

`compute_streak(p_family_member_id, p_source_type, p_source_id DEFAULT NULL)` returns `{current_streak, longest_streak, last_fired_at}`. Reads deed_firings, counts consecutive days, respects gamification_configs.streak_grace_days and streak_schedule_aware.

### Sub-Task 5: cron infrastructure (migration 100205)

- New Edge Function: `evaluate-deferred-contracts`
- Cron `:25` weekly — end_of_week contracts
- Cron `:30` hourly — end_of_day contracts + lifecycle sweep (recently_deleted → archived after 48h)
- Extend `:20` fire-painted-schedules — also check at_specific_time contracts
- Supporting tables: `deferred_grants`, `contract_grant_log`, `allowance_dispatch_audit`
- Convention #246 compliant (util.invoke_edge_function)

### Sub-Task 6: dispatch_godmothers RPC (migration 100206)

Central dispatch logic:
1. Load deed firing
2. Find matching active contracts (source_type, source_id OR NULL, family_member_id OR NULL)
3. Inheritance resolution (deed_override > kid_override > family_default per godmother_type)
4. Evaluate IF patterns (8 patterns)
5. Immediate → invoke godmother; deferred → queue to deferred_grants
6. Record in contract_grant_log (idempotent via UNIQUE on deed_firing_id + contract_id)
7. Graceful no-op for unimplemented godmothers

### Investigation Decisions Applied

| INV | Decision |
|-----|----------|
| 1 | 3 thin wrappers, 3 moderate refactors, 3 new code for godmothers (Workers C+D scope) |
| 2 | task_rewards stays until Worker F cutover |
| 4 | No CHECK conflicts; reward_reveal_attachments stays entity-form |
| 6 | Polymorphic coloring reveal (approved) |
| 7 | Cron at :25 and :30 (approved) |
| 8 | Collapse fixed→dynamic (approved) |
| 10 | Separate contract evaluator from painter (approved) |
| 14 | Feature flag + audit table; hourly discrepancy cron = nice-to-have |

### Constraints

- DO NOT modify BookShelf files
- DO NOT touch godmother implementation (Workers C+D)
- DO NOT remove task_rewards, calculate_allowance_progress, or awardOpportunityEarning (Worker F)
- DO NOT modify 4 gamification hook sites beyond extracting shared utility
- One commit per sub-task (7 total)
- Run `tsc -b` after every commit
- Convention #246 for all cron wiring
- All source_type strings are verb-form per §2.10

### No Mom-UI Surfaces

This build is backend-only (schema + RPC + cron). No mom-UI surfaces affected.
