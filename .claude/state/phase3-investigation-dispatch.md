# Phase 3 — Pre-Build Investigation Dispatch (Paste-Ready)

> Paste this entire prompt into a fresh Claude Code session.
> It runs 16 investigations that must complete before any Phase 3 code is written.
> INV 11 (Shared list build status) is already resolved — Workers 2+3 shipped.

---

## Context Briefing

You are running pre-build investigations for Phase 3 of the Connector Architecture build for MyAIM Family. Phase 3 builds a connector layer (contracts table + godmother dispatch engine) that replaces hardcoded reward/allowance/gamification wiring with a composable event-driven system.

**Your job:** Answer 16 research questions by reading code, schema, migrations, and existing docs. Return structured findings for each. Do NOT write any code or migrations — research only.

**Required reading before starting (in order):**
1. `claude/web-sync/Connector-Build-Plan-2026-04-26.md` — the authoritative Phase 3 build plan
2. `claude/web-sync/Connector-Architecture-and-Routing-Model.md` — Phase 1 design (vocabulary, schema)
3. `claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md` — forensic report on existing reward infrastructure
4. `claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md` — forensic report on existing connector-relevant infrastructure
5. `claude/live_schema.md` — current database schema

**Output format:** For each investigation, return a clearly labeled section with structured findings (tables where requested, narrative where appropriate). Flag any surprises or conflicts that would change the Phase 3 sub-task sequence.

---

## INVESTIGATION 1 — Godmother infrastructure inventory

**Plain English of why:** For each of the 9 v1 godmothers, Phase 3 needs to know what already exists to wrap vs. what's net-new. This prevents Phase 3 from rebuilding things or missing things.

For EACH of the 9 v1 godmothers, document:
1. allowance_godmother
2. numerator_godmother
3. money_godmother
4. points_godmother
5. prize_godmother
6. victory_godmother
7. family_victory_godmother
8. custom_reward_godmother
9. assign_task_godmother

For each, report:
- Existing tables/columns this godmother would write to
- Existing RPCs/Edge Functions/hooks that perform similar grants today
- Exact function signatures of any helper that would become part of the wrapper
- Whether the existing logic is generic enough to be called from any deed source_type, or whether it's hardcoded to specific source contexts (e.g., task_completion only)
- Any known defects in the existing surface (cite recon report rows where applicable)
- An honest scope estimate: thin wrapper / moderate refactor / new code

Return as a structured table.

---

## INVESTIGATION 2 — task_rewards full inventory

**Plain English of why:** `task_rewards` is a stub table with 5 columns. Phase 3 either migrates these columns to contracts or to godmother config tables. The migration plan needs the exact column-by-column inventory.

For the task_rewards table, report:
- Every column with its type
- Whether each column is read by any code (cite call sites)
- Whether each column is written by any code (cite call sites)
- For each column, recommend one of:
  - "Migrate to contracts.payload_*" (and which payload column)
  - "Migrate to <godmother>_godmother_configs" (and which table/column)
  - "Drop entirely (dead column)"
  - "Keep as-is (still serves a non-connector purpose)"

Return as a structured table.

---

## INVESTIGATION 3 — calculate_allowance_progress full breakdown

**Plain English of why:** Phase 3.5 restructures the allowance RPC for multi-pool support. The restructure needs the exact field-by-field shape of inputs, accumulators, and the return columns.

For the calculate_allowance_progress RPC (current canonical migration: 00000000100175):
- List every input parameter with type
- List every accumulator variable used inside the function
- List every column in the RETURNS TABLE
- List every read source (other tables/RPCs the function queries)
- Identify which accumulators would need to become per-pool maps under multi-pool restructuring
- Identify which return columns would need to fork per-pool
- Identify any data fetch pattern that would change shape under multi-pool (e.g., the per-task loop)

Return as a structured analysis. The goal is for Phase 3.5 to write the per-pool RPC without surprises.

---

## INVESTIGATION 4 — Polymorphic source_type CHECK constraint audit

**Plain English of why:** The connector layer uses `(source_type, source_id)` polymorphic addressing as its central convention. Several existing tables already use this pattern. Phase 3 needs to know if any existing CHECK constraints on `source_type` would conflict with the v1 source_type set.

For every table in the database that has a `source_type` (or equivalent name) column with a CHECK constraint:
- List the table
- List the CHECK constraint's allowed values
- Identify which v1 source_types (from the list of 10) are already supported, missing, or conflict
- Recommend any CHECK constraint updates needed for Phase 3

The 10 v1 source_types are:
task_completion, routine_step_completion, list_item_completion, intention_iteration, widget_data_point, tracker_widget_event, time_session_ended, scheduled_occurrence_active, opportunity_claimed, randomizer_drawn

Return as a structured audit.

---

## INVESTIGATION 5 — Build M four-hook-site exact location report

**Plain English of why:** Build M's `roll_creature_for_completion` is dispatched from four hardcoded hook sites (per Convention #198). Phase 3 needs the exact files/lines to replace them with deed firings.

Identify the exact file paths and line numbers for the four hooks that call roll_creature_for_completion (per Convention #198):
1. useCompleteTask
2. useApproveTaskCompletion
3. useApproveCompletion
4. useApproveMasterySubmission

For each:
- File path and line number of the RPC call
- Surrounding context (what the hook does before/after the call)
- Whether the hook also calls other downstream functions (awardOpportunityEarning, victory inserts, etc.)

Phase 3 will replace these direct RPC calls with deed-firing inserts. The replacements must preserve the hooks' existing semantics for everything else.

---

## INVESTIGATION 6 — Color reveal earning_task_id extension assessment

**Plain English of why:** `member_coloring_reveals.earning_task_id` is a typed FK to tasks today. For the connector layer to support "color reveal tied to ANY deed type" (potty trip, intention iteration, etc.), this either becomes polymorphic or a shim layer translates polymorphic addresses.

For the member_coloring_reveals table:
- Document the current shape (columns, FKs, partial unique indexes)
- Document existing readers and writers
- For polymorphic extension (replacing earning_task_id with source_type + source_id):
  - What schema changes are needed?
  - What code changes are needed (callers of the existing FK)?
  - Migration cost?
- For a shim approach (keeping earning_task_id as is, building a thin layer that translates polymorphic addresses):
  - What new infrastructure is needed?
  - What's the runtime overhead?
  - Migration cost?

Recommend which approach is cheaper given the existing data shape and code patterns. Phase 3 will pick based on this recommendation.

---

## INVESTIGATION 7 — pg_cron scheduled job inventory

**Plain English of why:** Phase 3 adds new cron-driven sweepers for deferred stroke_of values. Need to know what exists today to avoid collision and reuse the existing pattern.

List every active pg_cron schedule:
- Schedule name
- Cron expression
- Function/RPC/Edge Function it invokes
- Frequency (hourly, daily, etc.)
- Whether it's idempotent
- Whether it respects family timezone

Phase 3 will add cron jobs for:
- Deferred stroke_of='custom' firing
- Deferred stroke_of='at_specific_time' firing
- (Possibly) end_of_day / end_of_week sweeps if not handled by existing jobs

Recommend whether new jobs piggy-back on existing schedules or run independently.

---

## INVESTIGATION 8 — calculation_approach='fixed' design intent verification

**Plain English of why:** Per CONNECTOR_GROUND_TRUTH §0.3, `fixed` and `dynamic` are mathematically identical in current code. PRD-28 §168 implies they should differ. Phase 3.5 needs to know whether to preserve the distinction or collapse it.

For allowance_configs.calculation_approach='fixed':
- Document the current code path's behavior (per CONNECTOR_GROUND_TRUTH §0.3, currently identical to 'dynamic')
- Document PRD-28's intent for 'fixed' (§168 — "set a fixed weekly task schedule")
- Recommend whether Phase 3.5 should:
  (a) Preserve 'fixed' as a distinct approach with the originally-intended behavior
  (b) Collapse 'fixed' into 'dynamic' (deprecate the enum value)
  (c) Some other path

Phase 3.5 will pick based on this recommendation.

---

## INVESTIGATION 9 — allowance_configs.task_categories data check

**Plain English of why:** Per CONNECTOR_GROUND_TRUTH §2, the `task_categories` column on `allowance_configs` was specced for category filtering but the live RPC never reads it. Almost certainly empty in the founder's family but needs verification before Phase 3.5 deprecates the column.

Check the allowance_configs table:
- Count rows where task_categories JSONB is non-null and non-empty
- If there are rows with data: sample the data structure, identify any consumers
- Recommend whether Phase 3.5 should:
  (a) Migrate the data to the new category-filter mechanism
  (b) Drop the column (no real consumers)
  (c) Some other path

---

## INVESTIGATION 10 — Active painter discovery

**Plain English of why:** The founder mentioned an "active painter" as a possible alternative to PRD-35 Universal Scheduler for `stroke_of='custom'` firing. Need to verify what it is and whether it's a fit.

Search the codebase, in-flight worker scopes, and recent commits for any tool referred to as "active painter" or similar. Check:
- Worker 5 (Painter / Universal Scheduler Upgrade) — what did it ship?
- `fire-painted-schedules` Edge Function — what does it do?
- `deed_firings` table — what fires into it today?
- `lists.schedule_config` — how is this used?

Assess whether the existing painted-schedule infrastructure could fire deferred-time contracts (specifically `stroke_of='custom'` with recurrence_details JSONB). If so, document the integration path. If not, confirm Phase 3 needs a new cron sweeper.

---

## INVESTIGATION 12 — Treasure box reveal animation availability

**Plain English of why:** The Phase 3.7 Potty Chart template uses a treasure box reveal animation. Need to verify that one exists in `reveal_animations` today.

In the reveal_animations table:
- List all animations with style_category or reveal_type implying treasure-box-style
- For each, identify whether it's a "treasure box opening" pattern specifically
- Sample the animation definitions to verify suitability for the Phase 3.7 Potty Chart template

If no treasure-box-opening animation exists:
- Identify what would be needed to add one (asset generation? schema seed?)
- Estimate the scope

---

## INVESTIGATION 13 — Coloring reveal godmother readiness assessment

**Plain English of why:** The color reveal advancement godmother (advances the kid's coloring page on every deed like a potty trip) is a key Phase 3 deliverable. Need to know what state this infrastructure is in.

For the member_coloring_reveals + coloring_reveal_library + reveal_sequences infrastructure:
- Document current state (built, tested, in production use)
- Document the advancement lifecycle: start fresh, advance one zone per deed, complete after N zones, start new
- Identify what's missing for this to function as a godmother in Phase 3:
  - Does the "auto-start fresh on completion" logic exist?
  - Does the polymorphic source addressing (from investigation 6) need to ship first?
  - Are there any defects in the existing advancement logic?

Recommend the Phase 3 scope for wrapping this as a godmother (or as a presentation_mode of an existing grant-style godmother).

---

## INVESTIGATION 14 — Migration-time verification strategy for connector layer dispatch

**Plain English of why:** Phase 3 ships with a migration-time comparison check between the new connector layer and the existing allowance system. Need to plan the verification mechanics.

Design the migration-time verification mechanics for Phase 3:
- For an in-flight allowance period (already started, not yet closed): how does the migration write contracts that mirror the current allowance config?
- During migration: how do we verify that the new system (contracts evaluating against deed firings) produces the same percentage as the old system (calculate_allowance_progress RPC reading directly)?
- Comparison check at the migration moment: does new equal old to the cent?
- If verification fails at migration: what's the rollback path? (Migration aborts; legacy code stays.)
- Sanity-check pattern for the first few hours/days after migration: log discrepancies, surface to founder.

Return as a structured verification plan.

---

## INVESTIGATION 15 — Pool configuration variation reference set

**Plain English of why:** Phase 3.5's expanded capability set is designed against ten distinct family-configuration scenarios. The implementation needs regression testing against this variation. This investigation documents the test scenarios.

Document the ten family-configuration scenarios from the Phase 2 design (see Connector-Build-Plan-2026-04-26.md §7.1 capability mapping). For each scenario:
- The family setup (kid count, pool count, pool types)
- The expected math behavior at period close
- Cross-pool conditions in play
- Edge cases the scenario exercises (term-length pools, event-driven pools, weighted combinations, penalty applications, measurement-only pools, etc.)

If §7.1 doesn't enumerate ten explicit scenarios, construct them from the 14 capabilities listed in §7.1 such that each scenario exercises a distinct combination. These become the Phase 3.5 regression test set.

Return as a structured scenario catalog.

---

## INVESTIGATION 16 — Cross-pool query performance assessment

**Plain English of why:** When contracts have cross-pool IF conditions, the qualifier reads live progress from multiple pools per evaluation. Need to know the cost shape upfront so caching can be designed in if needed.

Analyze the performance characteristics of cross-pool IF qualifier evaluation:
- For a single qualifier call that needs progress from N pools: what's the cost? (RPC invocations, joins, indexes used.)
- For a deed firing day with M qualifier evaluations across N pools each: total daily cost?
- Are there caching opportunities? (e.g., per-day-per-pool cached progress that invalidates on relevant deed firings)
- Are there lightweight progress estimates that could substitute for full RPC calls in qualifier hot paths?

Recommend whether Phase 3.5 needs a caching layer, lightweight estimator, or other performance infrastructure. If yes, scope the addition.

---

## INVESTIGATION 17 — Pool lifecycle transition design

**Plain English of why:** Moms with seasonal pool composition (school year vs. summer) need pool lifecycle management. When a pool is paused or archived mid-period, in-flight progress and unclosed periods need handling.

For pool status transitions (active → paused, active → archived, paused → active):
- What happens to in-flight allowance_periods rows when a pool is paused mid-period?
- What happens to per-task pool affiliations when a pool is archived?
- For seasonal pool swaps (mom replaces school-year pool composition with summer composition mid-week): how does the migration handle the in-flight period?
- What's the user-visible behavior when mom pauses a pool? (Widget shows pool dimmed? No further period closes? Existing balance preserved?)
- What's the user-visible behavior when mom archives a pool? (Historical data preserved? Pool removed from dashboards? Period rolls over?)
- For event-driven pools, what triggers close? (The event source firing? A specific deed firing pattern? Mom-confirmed close?)

Recommend the lifecycle state machine and migration mechanics for Phase 3.5 implementation.

---

## Output Requirements

After completing all 16 investigations, produce a final **Summary of Surprises** section listing:
- Any finding that contradicts the Phase 3 build plan's assumptions
- Any finding that would change the sub-task sequence
- Any finding where two investigations produced conflicting recommendations
- Any dead infrastructure that should be cleaned up during Phase 3 (opportunistic)

This summary is what the founder reviews before approving Phase 3 worker dispatch.
