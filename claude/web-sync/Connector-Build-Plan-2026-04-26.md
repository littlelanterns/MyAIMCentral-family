# Connector Architecture — Phase 2 Build Plan

> **Purpose:** This document is the Phase 2 deliverable for the Connector Architecture work. It translates the Phase 1 design (`Connector-Architecture-and-Routing-Model.md`) into an executable build plan for Phase 3, Phase 3.5, and Phase 3.7. It includes audit fold-in mapping, build sequencing, pre-build investigation prompts for Claude Code, a risk and decision log, and three paste-ready dispatch prompts.
>
> **Audience:** Founder (review, dispatch, decisions). Claude.ai web (planning continuity). Claude Code (execution, via the dispatch prompts at the end).
>
> **Status:** Draft, 2026-04-26. Output of Phase 2 of the Connector Architecture work; produced alongside `Parallel-Builder-Coordination-Brief-2026-04-26.md`.
>
> **Doc location:** `claude/web-sync/Connector-Build-Plan-2026-04-26.md` per master plan §6 instructions.
>
> **What this document is NOT:** it is not the Phase 1 design (already locked in `Connector-Architecture-and-Routing-Model.md`). It is not the Phase 3 code (Claude Code writes that). It is not the Coordination Brief (that's its own doc). This is the bridge between design and execution.

---

## Table of Contents

1. Executive summary
2. The mental model (n8n / workflow engine framing)
3. Architecture as locked at end of Phase 2
4. Audit fold-in mapping (triage worksheet scan)
5. Investigation prompts for Claude Code (pre-build)
6. Phase 3 build plan
7. Phase 3.5 build plan
8. Phase 3.7 build plan
9. Risk and decision log
10. Project knowledge sync notes
11. Phase 3 dispatch prompt (paste-ready)
12. Phase 3.5 dispatch prompt (paste-ready)
13. Phase 3.7 dispatch prompt (paste-ready)

---

## 1. Executive Summary

**What Phase 3 is:** The connector layer ships. A `contracts` table becomes the central switchboard wiring deed firings (events from family primitives) to godmothers (actions that grant rewards, create tasks, write victories, etc.). Nine godmothers ship in v1. The existing reward-reveal infrastructure becomes the presentation layer for grant-style godmothers. A mom-functional baseline UI lets mom create contracts directly without wizards. The legacy allowance and reward-routing paths get parallel-verified against the new system, then deleted.

**What Phase 3.5 is:** The allowance system gets restructured for multi-pool support. Today's single ratio per child becomes per-pool ratios, with pool-specific bonus thresholds and configurations. The allowance RPC's accumulators move from scalar singletons to per-pool maps; the return shape changes from a 20-column flat row to a per-pool structure.

**What Phase 3.7 is:** The first wizards ship. Three wizards: a Rewards List Wizard (mom creates shareable rewards lists), a Repeated Action Chart Wizard (potty chart pattern and similar), a List + Reveal + Assignment Wizard (consequence spinner / activity spinner / extra-earning opportunities pattern). Three seeded templates: Potty Chart, Consequence Spinner, Extra Earning Opportunities. Treasure box rotation/tag/pool infrastructure ships as part of this phase.

**What this document delivers:** the executable plan for those three phases, including investigation prompts that need to run before Phase 3 dispatch, a risk log with rollback paths, and three dispatch prompts ready to paste into Claude Code sessions.

**Plain English of what this means for you:** the Phase 1 design said WHAT we're building. This document says HOW to build it, in what order, with what investigations first, with what risks to watch for. When the investigation prompts come back with answers, the dispatch prompts are ready to send.

---

## 2. The Mental Model — Workflow Engine for Family Life

The connector layer is essentially a workflow automation engine for family life — conceptually similar to n8n, Zapier, or other event-driven workflow tools. The vocabulary is family-flavored ("deeds" for events, "godmothers" for actions, "contracts" for if-this-then-that rules) but the architectural shape matches.

**Mapping to n8n vocabulary** (for builders familiar with that mental model):

- **Triggers (n8n) ↔ Deeds (here)** — events that start a workflow
- **Nodes/Actions (n8n) ↔ Godmothers (here)** — what happens in response
- **Conditions/Filters (n8n) ↔ The IF (here)** — qualification logic
- **Workflows (n8n) ↔ Contracts (here)** — the wired rules connecting triggers to actions

**Why this framing matters for the builder:** every architectural decision in Phase 3 should be made with this mental model in hand. Deed firings are LOGGED EVENTS, not synchronous calls. Contract evaluation is FILTERING, not orchestration. Godmother dispatch is INDEPENDENT ACTION, not procedural code. The connector layer's value is composability and explicit data flow — same as n8n.

**Why this framing matters for mom:** she will never see "deeds" or "godmothers" in the UI as raw concepts. The wizards (Phase 3.7 onward) are her opinionated low-code surface. The connector layer is the substrate. Mom's mental model is "I set up X, Y, and Z; the system handles it." The connector layer is what makes that work without hardcoding.

**The architectural risk** (also matching n8n's risk): workflow engines become bewildering when authors create deeply nested logic. The wizards are how we keep mom safe from the engine's own power. **Build the engine to be powerful; build the wizards to keep mom safe from that power.**

---

## 3. Architecture as Locked at End of Phase 2

This section is the authoritative architectural state going into Phase 3. If anything below contradicts the Phase 1 design doc, the Phase 1 design doc is the canonical source for the underlying decisions; this section adds Phase 2 refinements.

### 3.1 — Vocabulary (locked)

- **Deed** — an event that fires from a family primitive (task completion, list draw, opportunity claim, etc.). Has a `(source_type, source_id, family_member_id, fired_at, metadata)` shape.
- **Contract** — a row in the `contracts` table that wires a deed pattern to a godmother. Carries IF qualification logic, stroke_of timing, payload, scope (family default / kid / deed), override_mode.
- **The IF** — qualification logic on a contract that decides whether THIS deed firing qualifies for THIS contract. Patterns include `every_time`, `every_nth` (with optional offset), `on_threshold_cross`, `above_daily_floor`, `above_window_floor`, `within_date_range`, `streak`, `calendar`.
- **Stroke_of** — when the godmother actually fires after qualification. Values: `immediate`, `end_of_day`, `end_of_week`, `end_of_month`, `at_period_close`, `on_threshold_cross`, `custom`, `at_specific_time`.
- **Payload** — what the godmother is told to grant. Lives either inline on the contract (small fields) or via reference to a godmother config table (complex configs).
- **Godmother** — an action that fires in response to a qualified deed. Names use type prefix (`allowance_godmother`, `prize_godmother`, etc.).
- **Godmother config** — per-godmother configuration tables that hold complex payloads (e.g., `allowance_godmother_configs`, `numerator_godmother_configs`, etc.). The reveal-as-presentation infrastructure uses the existing `reward_reveal_attachments` table.

### 3.2 — v1 Godmothers (9 total)

1. **allowance_godmother** — grants binary contribution to a named allowance pool
2. **numerator_godmother** — grants count-based contribution with required floor (above-floor extra-credit pattern)
3. **money_godmother** — grants money to opportunity earnings pool
4. **points_godmother** — grants points to a category-named counter
5. **prize_godmother** — grants an IOU to the reward board, with optional `presentation_mode`
6. **victory_godmother** — writes to Victory Recorder (individual)
7. **family_victory_godmother** — writes to family victories (no-op until PRD-11B ships; placeholder in v1)
8. **custom_reward_godmother** — grants custom text/photo content (text payload OR list reference), with optional `presentation_mode`
9. **assign_task_godmother** — creates new tasks from templates on a kid's dashboard, with optional `presentation_mode`

**Note on assign_task_godmother:** named as one godmother in v1, but Phase 3 implementation may split it into 2-3 focused godmothers (e.g., `assign_from_list_godmother`, `assign_from_template_godmother`, `assign_consequence_godmother`) if the consolidated config schema becomes unwieldy. This decision is left to Phase 3 implementation.

**Note on reveal_godmother (removed):** the original Phase 1 design proposed `reveal_godmother` as a separate godmother. Phase 2 consolidated reveal-as-presentation into a `presentation_mode` config field on grant-style godmothers (prize, custom_reward, assign_task). The existing `reward_reveal_attachments` schema becomes the presentation layer rather than a godmother config table for a separate godmother type. This is a meaningful architectural simplification — it removes the conceptual confusion of "is this godmother granting something or just animating something?" and lets mom configure presentation per grant rather than wiring two contracts (one for the grant, one for the reveal).

### 3.3 — v1 Deed Source Types (10 total)

- `task_completion` (existing pattern)
- `routine_step_completion` (existing pattern)
- `list_item_completion` (existing pattern; checking off a list item, distinct from selecting one)
- `intention_iteration` (existing pattern)
- `widget_data_point` (existing pattern)
- `tracker_widget_event` (existing pattern)
- `time_session_ended` (existing pattern)
- `scheduled_occurrence_active` (Painter coordination — written by Worker 5 when a painted day or scheduled occurrence activates)
- **`opportunity_claimed`** (NEW for v1) — kid claims an opportunity item; reward staging implied
- **`randomizer_drawn`** (NEW for v1) — an item was drawn from a randomizer (consequences, activity spinners, dinner picks, reading suggestions); no reward staging implied

**Why opportunity_claimed and randomizer_drawn are separate:** opportunity claims involve economic transactions (reward staging, lock-out from other claimants, mom-visible accountability). Randomizer draws don't. Different events, different downstream wiring patterns. Keeping them separate at the source_type level is cleaner than collapsing to a single source_type with metadata-based filtering.

### 3.4 — v1 IF Patterns

- `every_time` — fires on every qualifying deed
- `every_nth` (with optional `if_offset INTEGER`) — fires on every Nth deed, optionally offset (so "every 10 starting from 5" = trips 5, 15, 25... using N=10, offset=5)
- `on_threshold_cross` — fires once when cumulative count crosses N
- `above_daily_floor` — fires only when N daily completions exceeded
- `above_window_floor` — fires only when N completions in a configured window exceeded
- `within_date_range` — fires only within a configured date range
- `streak` — fires based on consecutive-day streak length
- `calendar` — fires based on day-of-week / monthly / yearly pattern (uses `if_calendar_pattern JSONB`)

**Note on time-window IF patterns:** deferred from v1. Time-of-day windowing on contracts (`if_pattern='within_time_window'`) is Phase 4 unless a specific use case forces it earlier.

### 3.5 — v1 Stroke_of Values

- `immediate` — fires as soon as contract qualifies
- `end_of_day` — fires at family-local end of day
- `end_of_week` — fires at family-local end of week
- `end_of_month` — fires at family-local end of month
- `at_period_close` — fires when an allowance period closes
- `on_threshold_cross` — fires when cumulative metric crosses a threshold
- `custom` — fires per a Universal Scheduler config (carries `recurrence_details JSONB` in the SchedulerOutput shape)
- `at_specific_time` — fires at a specific time of day (with `stroke_of_time TIME` column on contract)

**Note on custom and the active painter:** Phase 2 commissions an investigation (see §5 below) to determine whether `stroke_of='custom'` routes to PRD-35 Universal Scheduler (default) or to the active painter (alternative if compatible). The investigation runs before Phase 3 dispatch.

### 3.6 — Cross-Cutting Design Principles (full list)

These are documented in detail in the Coordination Brief (§2). Summary list:

1. Polymorphic source addressing — `(source_type, source_id)` for any "points at any kind of thing"
2. Four-mode sharing matrix — single-owner-single-use, single-owner-multi-use, multi-owner-single-use, multi-owner-multi-use
3. Instantiation mode for multi-assignee schedules — per-assignee instance vs shared anyone-completes
4. Source category filter on contracts — `source_category` as alternative to `source_id` for category-level wiring
5. Override mode on contracts — replace vs merge, mom prompted at write time
6. Family timezone for all time-of-day logic
7. Templates designed for future community sharing (template_source field from day one)
8. Presentation mode as config dimension on grant-style godmothers
9. Cross-cutting UI primitives reused, not reinvented (people picker, scheduler, timer, etc.)

### 3.7 — Phase 3 vs Phase 3.5 vs Phase 3.7 Boundaries

**Phase 3 owns:**
- `contracts` table schema (with all cross-cutting columns: override_mode, source_category, if_offset, recurrence_details, stroke_of_time)
- Per-godmother config tables for the 9 v1 godmothers
- Godmother dispatch infrastructure (with idempotency, no-op for unbuilt godmothers)
- Cron infrastructure for deferred stroke_of values (custom, at_specific_time, end-of-period)
- Streak helper RPC
- Mom-functional baseline UI for contract authoring
- Mom-facing IOU surface (for prize_godmother grants)
- Migration of existing partial systems (task_rewards columns, intention_iterations connections, gamification's hardcoded hook sites) to contracts
- Cleanup of `tasks.related_intention_id` (drop column)
- Migration-time verification: at the moment of cutover, new system's calculations match old system's calculations to the cent. If not, migration aborts.
- Legacy code (calculate_allowance_progress RPC, hardcoded gamification hooks) deleted in the same commit sequence as the migration. Phase 3 ships in a single cut.

**Phase 3.5 owns:**
- Multi-pool restructuring of `allowance_configs` (per-pool config rows or per-pool JSONB)
- Per-pool restructuring of `calculate_allowance_progress` RPC (accumulators become per-pool maps; return shape becomes per-pool structure)
- Per-pool bonus threshold/percentage/flat-amount support
- Per-pool restructuring of `allowance_periods` close logic (one row per pool per period, or per-pool sub-structure on existing single row)
- Migration of in-flight allowance data to per-pool shape
- Frontend updates to read per-pool data (`AllowanceCalculatorTracker`, Bulk Configure modal, etc.)

**Phase 3.7 owns:**
- Rewards List Wizard (mom creates shareable rewards lists with sharing-mode setting)
- Repeated Action Chart Wizard (potty chart pattern; produces deployable templates)
- List + Reveal + Assignment Wizard (consequence/activity/opportunity pattern; two paths internally — opportunity flavor with reward staging, draw flavor without)
- Template library infrastructure (table, schema with community-readiness fields, default-seed mechanism)
- Three seeded templates: Potty Chart, Consequence Spinner, Extra Earning Opportunities
- Treasure box rotation/tag/pool infrastructure (animation pool tables, tag column on `reveal_animations`, pool selection UX)
- May split into 3.7a + 3.7b at Claude Code's discretion if the build is large

---

## 4. Audit Fold-In Mapping

Per the master plan (§6), Phase 2 scans the audit/triage worksheet for rows that intersect with the connector layer and decides whether each row collapses into Phase 3/3.5/3.7, handles separately as Phase 0 ongoing work, or defers to a downstream build.

**Per founder direction (Q2.1 + Q3.1):** scan ALL classification categories, fold in by default, only leave rows out if there's a reason not to.

### 4.1 — Folded into Phase 3

| Row | Title | Rationale for fold-in |
|---|---|---|
| **F61** | PRD-24B reveal library cross-feature lego wiring | DIRECT HIT. The existing reward-reveal infrastructure becomes the presentation layer for grant-style godmothers. Phase 3 wires it. |
| **F62** | PRD-24B Color Reveal lego-connector architecture | DIRECT HIT. Color reveal becomes a godmother (or presentation mode of an existing godmother — see investigation §5.6). Phase 3 wires it. |
| **NEW-AA** | Reveals as universal presentation wrappers | DIRECT HIT. Confirmed by Phase 2 architectural decision: presentation_mode is a config dimension on grant-style godmothers. Phase 3 implements. |
| **F30** | PRD-24B superseded architectures (flat library + earning-mode-driven Color Reveal) | Adjacent to F61/F62. Folded in as documentation hygiene during Phase 3. |
| **F58** | PRD-24 reward economy unbuilt | The 7 missing PRD-24 tables (`reward_redemptions`, `treasure_boxes`, `gamification_events`, etc.) are explicitly NOT folded in — they are downstream consumers of the connector layer, not the layer itself. Phase 3 ships the substrate; later builds ship the consumers. **PARTIAL FOLD-IN:** the mom-facing IOU surface (which substitutes for `reward_redemptions` for v1) IS in Phase 3. |
| **NEW-EEE** | reward_reveals settings UI + completion hook | DIRECT HIT. The completion hook is the connector wiring; the settings UI is the mom-functional baseline UI. Both in Phase 3. |
| **NEW-AAA** | Custom Reward double-path fix (mom sets custom inline, no PrizeBox row) | Fixed as part of `custom_reward_godmother`'s wrapping in Phase 3. |
| **F12** | PRD-36 timer events have zero listeners | Phase 3 wires timer events as a deed source_type (`time_session_ended`). |
| **F11** | PRD-24 useUncompleteTask stub stale post-Build-M | Phase 3's deed-firing infrastructure handles undo cascade by design (deed-firing reverse via idempotency keys + reverse RPCs where applicable). Comment hygiene during Phase 3. |
| **F8** | Reusable animation/visual primitive library demo-only | The animation primitives become consumed by the presentation layer in Phase 3. Demo-only status ends. |
| **F28** | PRD-24 integration edges schema/primitive-only | Phase 3 wires the integration edges. |
| **NEW-N** | is_milestone property + Milestone Map surface | Folded in as a connector consumer. Milestone Map is downstream; the `is_milestone` flag becomes a contract IF qualifier in Phase 3. |
| **NEW-O** | tracking_tags property + Finished Products composition pipeline | Same pattern as NEW-N. Tracking tags become contract IF qualifiers; Finished Products is a downstream consumer. |

### 4.2 — Folded into Phase 3.5

| Row | Title | Rationale |
|---|---|---|
| **NEW-YY** | Points categorization — separate pools | DIRECT HIT on Phase 3.5 multi-pool work. Folded in. |
| **NEW-QQ** | Points as a first-class Lego piece in Composition Architecture | Partially resolved (discoverability gap closed). The full points-as-primitive flagship deferred but the multi-pool foundation in Phase 3.5 is the prerequisite. |
| **NEW-VV** | Bulk Configure follow-ups | Folded into Phase 3.5 multi-pool UI updates. |
| **F31** | PRD-28 dead enum values + compliance bundle | Folded in as cleanup during Phase 3.5 RPC restructure. |

### 4.3 — Folded into Phase 3.7

| Row | Title | Rationale |
|---|---|---|
| **NEW-WW** | Per-line-item reward picker on opportunity lists | Folded into the List + Reveal + Assignment Wizard's opportunity path. |
| **NEW-XX** | Tracker money-source differentiator | Folded into the wizards' surface for showing per-pool earnings (post Phase 3.5). |
| **NEW-G** | Opportunity Board dissolves into Lists page | Adjacent. The wizards work with whatever Lists infrastructure Worker 3 ships. |
| **NEW-T** | Linked list items connector (item-level) | Adjacent. The connector layer's polymorphic addressing supports list-item-level wiring; wizards expose it. |
| **NEW-I** | Person-pick-spin per-deploy config | Folded into the Consequence Spinner template (§3.4 pattern). |

### 4.4 — Deferred (not folded in)

| Row | Title | Rationale |
|---|---|---|
| **F60c** | PRD-24A themes + game modes + Game Modes Addendum tables | Downstream consumer of the connector layer. Builds AFTER Phase 3.7. |
| **F29** | PRD-24A overlay-engine architecture superseded | Documentation hygiene; not connector scope. |
| **F6** | PRD-24 family Cross-PRD Impact Addenda pre-Build-M | Documentation hygiene; not connector scope. |
| **F14** | PRD-28 first allowance_periods row never created | RESOLVED 2026-04-24. |

### 4.5 — Documentation-only fold-in

| Row | Title | Rationale |
|---|---|---|
| **NEW-BBB** | Mom-facing IOU/Privilege Delivery surface | Originally a separate item. Folded in as the "mom-facing reward board" in Phase 3 because `prize_godmother` and `custom_reward_godmother` need a place to write to. Documentation note: replaces what NEW-BBB scoped. |

---

## 5. Investigation Prompts for Claude Code (Pre-Build)

Per founder direction, Phase 2 commissions investigation prompts that need to run before Phase 3 dispatch. The founder dispatches these to Claude Code (likely as a single agent-team session); Claude Code investigates and returns answers; Phase 2 build plan is finalized incorporating the answers; Phase 3 dispatches.

**14 investigation prompts total.** Listed below as paste-ready blocks. Each carries a "Plain English of why" explanation so the founder can sequence/skip if needed.

### 5.1 — Existing godmother infrastructure inventory

**Plain English of why:** for each of the 9 v1 godmothers, Phase 3 needs to know what already exists to wrap vs. what's net-new. This prevents Phase 3 from rebuilding things or missing things.

```
INVESTIGATION 1 — Godmother infrastructure inventory.

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
```

### 5.2 — task_rewards column inventory

**Plain English of why:** `task_rewards` is a stub table with 5 columns. Phase 3 either migrates these columns to contracts or to godmother config tables. The migration plan needs the exact column-by-column inventory.

```
INVESTIGATION 2 — task_rewards full inventory.

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
```

### 5.3 — Allowance computation inventory for Phase 3.5

**Plain English of why:** Phase 3.5 restructures the allowance RPC for multi-pool support. The restructure needs the exact field-by-field shape of inputs, accumulators, and the 20-column return.

```
INVESTIGATION 3 — calculate_allowance_progress full breakdown.

For the calculate_allowance_progress RPC (current canonical migration: 00000000100175):
- List every input parameter with type
- List every accumulator variable used inside the function
- List every column in the RETURNS TABLE
- List every read source (other tables/RPCs the function queries)
- Identify which accumulators would need to become per-pool maps under multi-pool restructuring
- Identify which return columns would need to fork per-pool
- Identify any data fetch pattern that would change shape under multi-pool (e.g., the per-task loop)

Return as a structured analysis. The goal is for Phase 3.5 to write the per-pool RPC without surprises.
```

### 5.4 — Polymorphic source addressing existing call sites

**Plain English of why:** the connector layer uses `(source_type, source_id)` polymorphic addressing as its central convention. Several existing tables already use this pattern. Phase 3 needs to know if any existing CHECK constraints on `source_type` would conflict with the v1 source_type set.

```
INVESTIGATION 4 — Polymorphic source_type CHECK constraint audit.

For every table in the database that has a `source_type` (or equivalent name) column with a CHECK constraint:
- List the table
- List the CHECK constraint's allowed values
- Identify which v1 source_types (from the list of 10 in the build plan) are already supported, missing, or conflict
- Recommend any CHECK constraint updates needed for Phase 3

The 10 v1 source_types are:
task_completion, routine_step_completion, list_item_completion, intention_iteration, widget_data_point, tracker_widget_event, time_session_ended, scheduled_occurrence_active, opportunity_claimed, randomizer_drawn

Return as a structured audit.
```

### 5.5 — Gamification four-hook-site map

**Plain English of why:** Build M's `roll_creature_for_completion` is dispatched from "four hardcoded hook sites" per Convention #198. Phase 3 needs the exact files/lines to replace them with deed firings.

```
INVESTIGATION 5 — Build M four-hook-site exact location report.

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
```

### 5.6 — Color reveal extension (polymorphic vs shim)

**Plain English of why:** `member_coloring_reveals.earning_task_id` is a typed FK to tasks today. For the connector layer to support "color reveal tied to ANY deed type" (potty trip, intention iteration, etc.), this either becomes polymorphic or a shim layer translates polymorphic addresses.

```
INVESTIGATION 6 — Color reveal earning_task_id extension assessment.

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
```

### 5.7 — Existing cron / scheduled-job inventory

**Plain English of why:** Phase 3 adds new cron-driven sweepers for deferred stroke_of values. Need to know what exists today to avoid collision and reuse the existing pattern.

```
INVESTIGATION 7 — pg_cron scheduled job inventory.

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
```

### 5.8 — calculation_approach='fixed' vs 'dynamic' real intent

**Plain English of why:** per CONNECTOR_GROUND_TRUTH §0.3, `fixed` and `dynamic` are mathematically identical in current code. PRD-28 §168 implies they should differ. Phase 3.5 needs to know whether to preserve the distinction or collapse it.

```
INVESTIGATION 8 — calculation_approach='fixed' design intent verification.

For allowance_configs.calculation_approach='fixed':
- Document the current code path's behavior (per CONNECTOR_GROUND_TRUTH §0.3, currently identical to 'dynamic')
- Document PRD-28's intent for 'fixed' (§168 — "set a fixed weekly task schedule")
- Recommend whether Phase 3.5 should:
  (a) Preserve 'fixed' as a distinct approach with the originally-intended behavior
  (b) Collapse 'fixed' into 'dynamic' (deprecate the enum value)
  (c) Some other path

Phase 3.5 will pick based on this recommendation.
```

### 5.9 — task_categories JSONB data presence check

**Plain English of why:** per CONNECTOR_GROUND_TRUTH §2, the `task_categories` column on `allowance_configs` was specced for category filtering but the live RPC never reads it. Almost certainly empty in the founder's family but needs verification before Phase 3.5 deprecates the column.

```
INVESTIGATION 9 — allowance_configs.task_categories data check.

Run a query to count rows in allowance_configs where task_categories JSONB is non-null and non-empty.

If there are rows with data:
- Sample the data structure
- Identify any consumers (even if non-RPC, e.g., frontend reads)

Recommend whether Phase 3.5 should:
(a) Migrate the data to the new category-filter mechanism
(b) Drop the column (no real consumers)
(c) Some other path
```

### 5.10 — Active painter API and integration

**Plain English of why:** the founder mentioned an "active painter currently being built" as a possible alternative to PRD-35 Universal Scheduler for `stroke_of='custom'` firing. Need to verify what it is and whether it's a fit.

```
INVESTIGATION 10 — Active painter discovery.

Search the codebase, in-flight worker scopes, and recent commits for any tool referred to as "active painter" or similar. The founder mentioned this in the Phase 2 design conversation as a possible alternative to PRD-35 for `stroke_of='custom'` contract firing.

If found:
- Document its current API
- Document its integration points
- Assess whether it could fire deferred-time contracts (specifically `stroke_of='custom'` with a recurrence_details JSONB)

If not found or not applicable:
- Confirm Phase 3 should use PRD-35 Universal Scheduler-driven cron sweeper for `stroke_of='custom'` firing
- Estimate the cron sweeper implementation scope
```

### 5.11 — Shared list build status

**Plain English of why:** Worker 3 (Shared Lists) is queued. Phase 3.7 wizards reference rewards lists. Need to know Worker 3's current state to decide whether Phase 3.7 inherits its sharing-mode infrastructure or ships with a temporary single-list pattern that retrofits later.

```
INVESTIGATION 11 — Shared list build current state.

For Worker 3 (Shared Lists):
- Document current draft PRD or design doc location (if any)
- Document current schema state (if any)
- Identify whether a sharing-mode shape has been chosen
- Identify the expected ship date (if estimated)

Phase 3.7 needs to know:
- Whether it can rely on Worker 3's shared-list infrastructure being live by the time 3.7 ships
- If not, what stub/temporary shape Phase 3.7 should ship with

Return as a brief status report.
```

### 5.12 — Treasure box reveal animation existence

**Plain English of why:** the Phase 3.7 Potty Chart template uses a treasure box reveal animation. Need to verify that one exists in `reveal_animations` today.

```
INVESTIGATION 12 — Treasure box reveal animation availability.

In the reveal_animations table:
- List all animations with style_category implying treasure-box-style (paper_craft, treasure, etc.)
- For each, identify whether it's a "treasure box opening" pattern specifically
- Sample the animation definitions to verify they're suitable for the Phase 3.7 Potty Chart template

If no treasure-box-opening animation exists:
- Identify what would be needed to add one (asset generation? schema seed?)
- Estimate the scope

Phase 3.7's Potty Chart template depends on this.
```

### 5.13 — member_coloring_reveals godmother readiness

**Plain English of why:** the color reveal advancement godmother (the one that advances the kid's coloring page on every potty trip) is a key Phase 3 deliverable. Need to know what state this infrastructure is in.

```
INVESTIGATION 13 — Coloring reveal godmother readiness assessment.

For the member_coloring_reveals + coloring_reveal_library + reveal_sequences infrastructure:
- Document current state (built, tested, in production use)
- Document the 10-zone-per-page lifecycle: start fresh, advance one zone per trip, complete after 10, start a new one
- Identify what's missing for this to function as a godmother in Phase 3:
  - Does the "auto-start fresh on completion" logic exist?
  - Does the polymorphic source addressing (from investigation 6) need to ship first?
  - Are there any defects in the existing advancement logic?

Recommend the Phase 3 scope for wrapping this as a godmother (or as a presentation_mode of an existing grant-style godmother).
```

### 5.14 — In-flight allowance period verification approach

**Plain English of why:** Phase 3 ships with a migration-time comparison check between the new connector layer and the existing allowance system. Need to plan the verification mechanics: what comparison criteria, what failure modes to watch for, what the rollback path looks like.

```
INVESTIGATION 14 — Migration-time verification strategy for connector layer dispatch.

Design the migration-time verification mechanics for Phase 3:
- For an in-flight allowance period (already started, not yet closed): how does the migration write contracts that mirror the current allowance config?
- During migration: how do we verify that the new system (contracts evaluating against deed firings) produces the same percentage as the old system (calculate_allowance_progress RPC reading directly)?
- Comparison check at the migration moment: does new equal old to the cent?
- If verification fails at migration: what's the rollback path? (Migration aborts; legacy code stays as source of truth until founder fixes the discrepancy.)
- Sanity-check pattern for the first few hours/days after migration: log discrepancies if they appear, surface to founder.

Phase 3 ships with this verification mechanism. There is no week-long parallel verification — verification happens at the migration boundary and via post-dispatch sanity checks. If a discrepancy surfaces post-dispatch, founder debugs as a normal bug.

Return as a structured verification plan.
```

### 5.15 — Per-family pool configuration variation analysis

**Plain English of why:** Phase 3.5's expanded capability set is designed against ten distinct family-configuration scenarios surfaced in Phase 2. The implementation needs to be tested against this variation. This investigation documents the test scenarios for Phase 3.5 implementation.

```
INVESTIGATION 15 — Pool configuration variation reference set.

Document the ten family-configuration scenarios surfaced in Phase 2 design (see Connector-Build-Plan-2026-04-26.md §7.1 for capability mapping, derived from a stress-test conversation that produced ten distinct scenarios). For each scenario, document:
- The family setup (kid count, pool count, pool types)
- The expected math behavior at period close
- Cross-pool conditions in play
- Edge cases the scenario exercises (term-length pools, event-driven pools, weighted combinations, penalty applications, measurement-only pools, etc.)

These scenarios become the Phase 3.5 implementation's regression test set. Every scenario should produce correct math after Phase 3.5 ships.

Return as a structured scenario catalog. Founder can supplement with additional scenarios from real beta-family setups as they surface.
```

### 5.16 — Cross-pool query cost analysis

**Plain English of why:** when contracts have cross-pool IF conditions, the qualifier reads live progress from multiple pools per evaluation. If many contracts wire cross-pool conditions and many deed firings happen per day, this could become expensive. Need to know the cost shape upfront so caching / lightweight estimation can be designed in if needed.

```
INVESTIGATION 16 — Cross-pool query performance assessment.

Analyze the performance characteristics of cross-pool IF qualifier evaluation:
- For a single qualifier call that needs progress from N pools: what's the cost? (RPC invocations, joins, indexes used.)
- For a deed firing day with M qualifier evaluations across N pools each: total daily cost?
- Are there caching opportunities? (e.g., per-day-per-pool cached progress that invalidates on relevant deed firings)
- Are there lightweight progress estimates that could substitute for full RPC calls in qualifier hot paths?

Recommend whether Phase 3.5 needs a caching layer, lightweight estimator, or other performance infrastructure. If yes, scope the addition.
```

### 5.17 — Pool lifecycle and season-transition migration design

**Plain English of why:** moms with seasonal pool composition (school year vs. summer) need pool lifecycle management. When a pool is paused or archived mid-period, in-flight progress and unclosed periods need handling. This investigation designs the lifecycle transition mechanics.

```
INVESTIGATION 17 — Pool lifecycle transition design.

For pool status transitions (active → paused, active → archived, paused → active):
- What happens to in-flight allowance_periods rows when a pool is paused mid-period?
- What happens to per-task pool affiliations when a pool is archived?
- For seasonal pool swaps (mom replaces school-year pool composition with summer composition mid-week): how does the migration handle the in-flight period?
- What's the user-visible behavior when mom pauses a pool? (Widget shows pool dimmed? No further period closes? Existing balance preserved?)
- What's the user-visible behavior when mom archives a pool? (Historical data preserved? Pool removed from dashboards? Period rolls over to a different active pool?)
- For event-driven pools, what triggers close? (The event source firing? A specific deed firing pattern? Mom-confirmed close?)

Recommend the lifecycle state machine and migration mechanics for Phase 3.5 implementation.
```

---

## 6. Phase 3 Build Plan

### 6.1 — Phase 3 structure: single cut, migration-time verification

Phase 3 ships in a single cut. The connector layer becomes the source of truth; legacy code goes away as part of the same commit sequence.

**The structure:**
- New connector layer ships: contracts table, godmother dispatch, godmother config tables, all infrastructure
- Migration writes contracts that mirror current production allowance config and reward routing
- Migration includes a comparison check: at the moment of cutover, does the new system produce the same numbers as the old system? If yes, migration commits. If no, migration aborts and surfaces the discrepancy to the founder.
- After successful migration, the legacy `calculate_allowance_progress` RPC and other legacy paths are removed in the same commit sequence
- Single source of truth: the connector layer

**Plain English of why this is one cut, not two:** the founder's family is the only production family. If a bug surfaces post-dispatch, it's debugged like any other bug — git history has the legacy code if needed for reference. There is no week-long parallel verification; the cost-benefit didn't justify the wait given that allowance discrepancies in this household are not a crisis.

**Verification posture:**
- Migration-time check: numbers match new vs old at cutover
- Post-dispatch sanity checks: log discrepancies during the first few hours/days, surface to founder
- If a discrepancy surfaces: founder fixes it as a normal bug

### 6.2 — Phase 3 sub-task sequence (numbered, in dependency order)

Each sub-task is a discrete commit. Claude Code commits per sub-task and reports back. Founder approves before next sub-task.

1. **Schema: contracts table.** Create the central `contracts` table per the Phase 1 design + Phase 2 refinements (override_mode, source_category, if_offset, recurrence_details, stroke_of_time columns). Indexes, RLS, lifecycle states (active / recently_deleted with 48-hour escape hatch / archived).

2. **Schema: deed firings table — confirm or extend.** Per the 2026-04-26 pre-parallel investigation finding and Coordination Brief §3.1 item 6, **Worker 5 owns deed-firings table creation** and ships it as part of its scope so painted-day firings are observable the day Worker 5 lands. By the time Phase 3 dispatches, the table should already exist with rows accumulating from Workers 5 / 2 / 3. This sub-task confirms the schema matches the Phase 3 design (polymorphic source addressing, indexes for fast contract lookup, idempotency keys) and extends it if needed. If for any reason Worker 5 has not shipped the table by Phase 3 dispatch, this sub-task creates it. All `source_type` strings are locked to verb-form per Coordination Brief §2.10.

3. **Schema: godmother config tables.** Create per-godmother config tables for the 9 v1 godmothers (or fewer if some godmothers fit inline payloads on contracts). The reveal-as-presentation infrastructure uses existing `reward_reveal_attachments` (no new table for that).

4. **Schema: streak helper RPC.** A `compute_streak()` helper that the streak IF pattern relies on. Reuses or replaces any existing streak logic per investigation results.

5. **Cron infrastructure for deferred stroke_of.** New pg_cron + util.invoke_edge_function patterns for `stroke_of='custom'`, `stroke_of='at_specific_time'`, and any end-of-period sweeps not handled by existing jobs. Family timezone respected.

6. **Godmother dispatch infrastructure.** The dispatcher function that takes a deed firing, evaluates contracts, and invokes godmothers. Idempotency via deed_firing_id + contract_id keys. Graceful no-op for unbuilt godmothers (family_victory_godmother).

7. **Godmother implementation: allowance_godmother.** Wrap the existing `calculate_allowance_progress` infrastructure. Refactor as needed for genericity. Most allowance math is preserved — see §6.3 for the move-vs-reshape-vs-new breakdown.

8. **Godmother implementation: numerator_godmother.** New code. Phase 3 ships dispatch logic; Phase 3.5 ships the actual numerator computation in the restructured allowance RPC.

9. **Godmother implementation: money_godmother.** Wrap `awardOpportunityEarning`. Extract the `financial_transactions` write into a generic function callable from outside the opportunity-task gate.

10. **Godmother implementation: points_godmother.** Decompose `roll_creature_for_completion` into smaller pieces; one of them is "just award the points." Wrap that piece.

11. **Godmother implementation: prize_godmother.** Wrap `earned_prizes` writes. Extract a generic "create an IOU" write that doesn't require a reveal to be involved. Build the mom-facing IOU surface (replaces NEW-BBB scope) — a list of unredeemed IOUs across all kids, with mark-paid action.

12. **Godmother implementation: victory_godmother.** Thin wrapper around `useCreateVictory`. Already generic; just wire it.

13. **Godmother implementation: family_victory_godmother.** No-op placeholder. Logs "would have fired family victory" but writes nothing. Until PRD-11B ships.

14. **Godmother implementation: custom_reward_godmother.** Wrap custom reward writes. Fix NEW-AAA defect (mom sets custom inline, no PrizeBox row). Two modes: text payload OR list reference.

15. **Godmother implementation: assign_task_godmother.** New code. Creates new tasks from templates. May split into 2-3 focused godmothers if the consolidated config schema becomes unwieldy.

16. **Presentation layer.** Wire `presentation_mode` config on grant-style godmothers (prize, custom_reward, assign_task). Reuses existing `reward_reveal_attachments` schema. Settings UI for mom to create reveals (NEW-EEE).

17. **Mom-functional baseline UI for contract authoring.** A real working form mom can use to create / edit / pause / delete contracts at family-default, kid, and deed levels. Validates against schema CHECK constraints. Respects inheritance pattern visually (showing what level a contract lives at, what it overrides). Exposes override_mode question per cross-cutting principle §2.5.

18. **Migration: existing partial systems → contracts.** Rewrites `task_rewards` rows that drive allowance into contracts. Replaces the four hardcoded gamification hook sites (per investigation 5) with deed firings. Adds deed-firing call to `useLogIntentionIteration` so contracts wired to Best Intentions can fire. Includes the migration-time comparison check.

19. **Cleanup: drop tasks.related_intention_id.** Per Phase 1 design §5.

20. **Cleanup: delete legacy `calculate_allowance_progress` RPC and legacy hardcoded paths.** Replaced by contract-driven dispatch from sub-tasks 7-15. Same commit sequence as the migration; not a separate Cut 2.

21. **Visual verification.** Founder creates the three first-verification scenarios (Maya doing dishes, Maya going above-and-beyond on baby help, founder's spa-visit Best Intention) plus the Potty Chart deed firings (without the wizard yet). Each fires correctly through contracts.

### 6.3 — What Moves vs Reshapes vs Net-New (Phase 3 calibration)

Phase 3 is calibrated against the realistic understanding that most allowance code is preserved. Here's the breakdown so Claude Code's pre-build plan reflects accurate scope expectations:

**Moves straight over (mostly unchanged):**
- The math itself — Dynamic and Points-Weighted calculation logic, per-task slice math, pool_fraction calculation, routine step deduplication, extra credit handling, bonus threshold evaluation, cap-at-100% rule
- Allowance period mechanics — Sunday-Sunday boundaries, period creation, makeup window logic, grace days handling
- The financial_transactions writes — append-only ledger pattern, allowance_earned and opportunity_earned types, reverse-on-uncomplete logic
- Widget rendering pattern (data shape changes in 3.5; rendering logic preserved)
- Bootstrap logic, loan handling, payment_made transactions, balance computation

**Reshapes (changed but not rewritten):**
- Hardcoded gamification hook sites become deed firings (sub-task 18)
- The `task_rewards` rows that drive allowance migrate to contracts
- Reveal infrastructure becomes the presentation layer (consumed by godmothers via presentation_mode config)
- The `calculate_allowance_progress` RPC stays during Phase 3 wrapped by allowance_godmother; deletes during sub-task 20

**Net-new code:**
- Contracts table + dispatch infrastructure (sub-tasks 1-6)
- Pool definitions and per-pool config (Phase 3.5, not Phase 3)
- `assign_task_godmother` (sub-task 15)
- `numerator_godmother` floor logic (sub-task 8 dispatch in Phase 3; full numerator math in Phase 3.5)
- Mom-facing IOU surface (sub-task 11)
- Mom-functional baseline UI for contract authoring (sub-task 17)

**Plain English of what to expect:** the allowance side of Phase 3 is mostly wrapping. The connector layer infrastructure side is mostly net-new. Plan the build session sizes accordingly.

### 6.4 — Phase 3 Visual Verification Standard

Per Convention #243 and the Pre-Build Process: each sub-task's "wired" status requires eyes-on browser confirmation, not just passing tests. The founder verifies each sub-task before approving the next.

The first-verification scenarios (per Phase 1 design §9.6, with Phase 2 additions):
1. **Maya doing dishes** — task completion fires allowance_godmother contract, allowance pool increments
2. **Maya above-and-beyond on baby help** — task completion fires numerator_godmother contract (numerator boost via above-floor IF pattern)
3. **Founder's spa-visit Best Intention** — intention_iteration fires custom_reward_godmother contract on threshold cross (50 iterations → "shopping trip" IOU on reward board)
4. **Potty trip with deed firings (no wizard yet)** — manually-created contracts fire on test potty events; star-on-chart, color-zone-advance, treasure-box-reveal-on-trip-5 all fire correctly

### 6.5 — Phase 3 Plain English of what mom experiences

After Phase 3 ships:
- Mom sees the same allowance calculations she always saw (same math, now driven by the connector layer instead of the legacy RPC)
- New mom-facing IOU surface shows on her dashboard (initially empty)
- Mom can create contracts directly via the baseline UI (ugly but functional)
- The four existing gamification hook sites still produce creature awards on completion (now via deed firings, but mom doesn't see the difference)
- Mom may notice slightly different timing on some events (deed firings vs. inline RPC calls), but math results identical
- The system is now Lego-composable; future wizards (Phase 3.7) and consumers (PRD-24 reward economy) plug into the connector layer cleanly

---

## 7. Phase 3.5 Build Plan

### 7.1 — Phase 3.5 scope summary

Restructure the allowance system for multi-pool support, with full capability set sized for the realistic variation in how different families configure their allowance. Today's single ratio per child becomes per-pool ratios with extensive per-family flexibility.

**Dispatch timing:** Phase 3.5 ships when the work is done. There is NO allowance-period-close gate on dispatch. The migration is designed to handle in-flight allowance data safely regardless of where the family is in their current period — the safety lives in the migration code (per-pool data shape preserved, parallel-running verification during migration, careful sequence of writes), not in the dispatch timing. Founder launches ASAP when Phase 3.5 is complete.

**Why Phase 3.5 is bigger than the original sketch.** Phase 2 design surfaced (via stress-testing against ten distinct family-configuration scenarios) that allowance pools have substantially more variation than a single founder-family scenario reveals. Designing only for one configuration would force later refactors. Phase 3.5 ships the full foundation, even though that's a larger phase. Splitting across multiple phases would mean each subsequent phase revisits the pool schema, the pool RPC, the pool widget, and the pool configuration UI — which is more total work than doing it once correctly.

**Phase 3.5 v1 capabilities (ship in this phase):**

1. **Multi-pool per kid.** Each kid can have N pools with independent configurations. No assumption about pool count or shape.

2. **Per-pool independent configuration.** Each pool has its own calculation approach, thresholds, period type, and payout settings.

3. **Measurement-only pools.** Pools can be set to `payout_mode='measurement_only'` — they track completion percentages without paying out themselves. Used as inputs to cross-pool conditions, dashboards, and reports.

4. **Cross-pool IF conditions.** Contracts (especially bonus contracts) can have IF qualifiers that read live progress from other pools. Pattern: `multi_pool_threshold` IF supports `{required_pools: [{pool: 'chores', threshold: 90}, {pool: 'school', threshold: 85}]}`.

5. **Cross-pool conditions can affect base calculation, not just bonuses.** Cross-pool conditions can drive multiplicative or subtractive adjustments to the base `calculated_amount`, not only bonus gates. Penalty patterns ("school below 70% → 20% penalty on chore allowance") supported.

6. **Term-length pools.** Pool can have `period_type='term'` with mom-defined start_date and end_date. Term pools close once at term end (or roll into next term per mom config). Used for school-year-aligned payouts, sports-season payouts, summer-program payouts, etc.

7. **Event-driven pool close.** Pool can be configured to close on an event (e.g., "when this sequential list completes") rather than on a time boundary. Pays out at event, restarts or archives per mom config.

8. **Pool roles configurable per family.** No assumption that "chores pool drives allowance." Each family configures which pools pay out, which gate bonuses, which are measurement-only. The "default pool" from migration is not architecturally privileged.

9. **Weighted combination of pool percentages into single payout.** A family that wants `$25 × (chores% × 0.4 + school% × 0.4 + music% × 0.2)` can express it. Pool weights configurable per kid per payout contract.

10. **Per-kid pool configurations fully independent.** Within one family, different kids can have completely different pool structures. No requirement that all kids in a family share pool composition.

11. **Pool lifecycle and seasonal activation.** Pools have status (`active`, `paused`, `archived`). Seasonal swaps (school-year vs summer pool composition) supported without rebuilding from scratch. In-flight transitions designed safely.

12. **Goal-based pool variant (schema permits, implementation deferred).** Schema includes `pool_type ∈ ('percentage_pool', 'goal_pool')` so future goal-based payouts can land without schema migration. Phase 3.5 implements `percentage_pool` only; `goal_pool` (binary-at-threshold count goals) is deferred unless founder explicitly wants it in v1.

13. **Self-managed pool ownership (schema permits, UX deferred).** Schema includes pool ownership/permission fields so Independent teens or adults can own their own pools. Phase 3.5 implements mom-as-owner only; self-managed UX is a later focused build.

14. **Multiple period types coexisting per kid.** Daily, weekly, biweekly, monthly, term-length, and event-driven pool periods can all coexist on one kid. Widget rendering handles mixed cadences.

**Note on capabilities 12 and 13:** these are schema-permissive in Phase 3.5 (so later phases don't need migrations) but their UX/implementation is deferred. Founder can explicitly request inclusion in Phase 3.5 if a real scenario forces it.

**What Phase 3.5 does NOT include:**
- Wizards for allowance pool configuration (those are Phase 3.7 or later)
- LiLa-driven pool authoring (post-Gate-2 flagship work)
- Cross-family pool sharing or community pool templates (future)
- Goal-based pool implementation (schema-permitted; UX deferred)
- Self-managed pool UX (schema-permitted; UX deferred)

### 7.2 — Phase 3.5 sub-task sequence

Phase 3.5 may split into 3.5a + 3.5b at Claude Code's discretion if the build feels too large for a single session. Suggested split: 3.5a = schema + RPC core + migration (sub-tasks 1-9). 3.5b = capability-rich features + frontend + verification (sub-tasks 10-18).

1. **Schema: per-pool restructure of `allowance_configs`.** Move from one row per kid to one row per (kid, pool). Existing single-config rows migrate to "default pool" rows preserving exact values. Per-pool configuration carries: `pool_name`, `pool_type` (percentage_pool / goal_pool), `payout_mode` (weekly / biweekly / monthly / term / event_driven / measurement_only), `weekly_amount` (or period-equivalent), bonus thresholds and percentages/flat amounts, calculation_approach, all existing per-kid fields scoped per-pool.

2. **Schema: pool weighting, lifecycle, and ownership fields.** `pool_status` (active / paused / archived), `pool_owner_member_id` (for self-managed pools — schema only in v1), `term_start_date` and `term_end_date` (for term pools), `close_on_event_source_type` and `close_on_event_source_id` (for event-driven pools).

3. **Schema: per-task pool assignment.** Tasks can carry pool affiliation. New column `pool_id` on tasks (or new join table for multi-pool task contribution if a task can contribute to multiple pools — design decision in Phase 3.5 implementation).

4. **Schema: per-pool restructure of `allowance_periods`.** One row per (kid, pool, period). Migration of existing single-period rows. Indexes preserved or rebuilt per pool key.

5. **Schema: payout contract reference for weighted combinations.** Pools can be combined into a payout contract via the connector layer. The contract carries weighting metadata. The `multi_pool_threshold` IF pattern supports cross-pool gating.

6. **RPC restructure: `calculate_allowance_progress`.** Accumulators become per-pool maps. Return shape becomes per-pool structure (likely a JSONB return or `RETURNS SETOF`). Per investigation 3. Routine-step deduplication, extra-credit handling, grace-day handling all preserved per-pool.

7. **RPC: live cross-pool progress query infrastructure.** Qualifier function for `multi_pool_threshold` IF pattern can call into per-pool progress for any named pool. Cost-conscious per investigation 16.

8. **RPC: pool weighting evaluation.** When a payout contract specifies weighted combination of pool percentages, the evaluation reads per-pool progress and applies the weights. Configurable formula (default: linear weighted average; alternative formulas can be added later).

9. **Migration: existing single-pool data → multi-pool shape.** All existing rows become "default pool" rows. Mom can later add additional pools without affecting the default. Parallel-running verification during migration: new system's calculations match old system's calculations to the cent for default-pool-only setups.

10. **Edge Function update: `calculate-allowance-period`.** Reads per-pool RPC results. Writes per-pool period close data. Per-pool bonus evaluation. Handles term-length and event-driven pool closes (different cadence than the existing weekly cron — investigation 7 result informs whether new cron schedules are needed or existing schedule extends).

11. **Penalty / multiplier application logic.** When cross-pool conditions modify the base calculated_amount (not just gate the bonus), the RPC applies the multiplier or subtraction. Test scenarios include: school-below-threshold → chore allowance penalty; cross-pool bonus boost; combined-weighted-percentage thresholds.

12. **Frontend: `AllowanceCalculatorTracker` updates.** Reads per-pool data. Displays per-pool progress (multiple progress rings or expandable per-pool breakdown). Handles measurement-only pools (no payout displayed; just percentage). Handles weighted combination display ("$X = $Y × combined weighted percentage").

13. **Frontend: Bulk Configure modal updates** (NEW-VV fold-in). Per-pool config UI. Mom can add/remove pools per kid, configure each pool's payout mode and thresholds, set up weighting and cross-pool conditions.

14. **Frontend: per-pool widget breakdown view.** New surface showing each pool's current state (percentage, period status, contribution to combined payout if applicable, cross-pool conditions affecting it). Mom-facing.

15. **Pool lifecycle UI.** Mom can pause / archive / activate pools. Seasonal pool swaps (chore + school during school year; chore + reading + outdoor during summer) supported via lifecycle without rebuilding from scratch.

16. **`fixed` vs `dynamic` resolution.** Per investigation 8. Either preserve as distinct or collapse.

17. **`task_categories` deprecation.** Per investigation 9. Either migrate or drop.

18. **Visual verification.** Founder configures multiple kids with substantially different pool setups (matching the variation in scenarios 1, 3, 4, 5 from the scenario stress-test). Verifies each kid's allowance math, cross-pool conditions, and weighted combinations. Real family use across at least one full week of all pool types active.

### 7.3 — Phase 3.5 Plain English of what mom experiences

After Phase 3.5 ships:
- Each kid can have multiple named allowance pools — chores, school, music, reading, whatever mom invents
- Each pool has its own period type (daily / weekly / biweekly / monthly / term / event-driven)
- Each pool has its own payout mode — pays out, or measurement-only for tracking-and-cross-pool-input
- Cross-pool conditions work — bonus on one pool can be gated by a threshold on another pool, and base calculations can be modified (positively or negatively) by other pools' state
- Weighted combination of pool percentages into a single payout — mom can set up "$25 × (40% chores + 40% school + 20% music)" math
- Pool lifecycle — mom can pause a pool seasonally, archive an old pool, activate a fresh one for summer
- Per-kid completely independent — Maya can have a school-driven allowance with bonus gates; Helam can have a weighted three-pool setup; Mosiah can have just a chores pool; Gideon can have no allowance pools at all
- Term-length pools — quarterly school payouts, sports-season payouts, year-long milestone pools all supported
- Event-driven pools — "this pool closes when Maya finishes Saxon Math 6" supported
- The widget shows per-pool breakdowns
- Mom configures via Bulk Configure modal (extended for multi-pool); future wizards (Phase 3.7+) make the more elaborate setups easier to author
- The category-scoped contracts mom set up in Phase 3 now correctly route to specific pools

---

## 8. Phase 3.7 Build Plan

### 8.1 — Phase 3.7 scope summary

Three wizards, three seeded templates, treasure box rotation/tag/pool infrastructure.

May split into 3.7a + 3.7b at Claude Code's discretion. Suggested split: 3.7a = Rewards List Wizard + treasure box pool/tag infrastructure (data layer + small UI). 3.7b = the two chart wizards (bigger UX flow).

### 8.2 — Phase 3.7 sub-task sequence

1. **Schema: template library table.** With community-readiness fields (template_source, original_author_id, cloned_from_template_id). Per cross-cutting principle §2.7.

2. **Schema: treasure box pool / animation pool tables.** With sharing-mode infrastructure (per cross-cutting principle §2.2). Tag column on `reveal_animations`.

3. **Rewards List Wizard.** Mom creates a shareable rewards list. Sharing-mode setting (four-mode matrix). Inline reward authoring (text + optional photo). Per-list category assignment. Saves to template library and/or deploys directly.

4. **Repeated Action Chart Wizard.** Generic wizard for "kid does the same action repeatedly, here's a chart with milestone rewards." Composes contracts via the connector layer. Walks mom through:
   - Pick an action / source primitive
   - Configure the chart (zones, milestones)
   - Configure milestone rewards (every 5, every 10, special at 50, etc.)
   - Configure presentation modes per milestone
   - Pick or create a rewards list (routes to Rewards List Wizard if needed)
   - Pick or create a treasure box pool
   - Deploy to a kid's dashboard, with assignment mode per cross-cutting principle §2.3

5. **List + Reveal + Assignment Wizard.** Generic wizard for "list of items gets presented dramatically and then assigned." Two paths:
   - Opportunity flavor: kid claims; reward is staged; `opportunity_claimed` deed fires
   - Draw flavor: mom or kid spins/draws; consequence/activity is assigned; `randomizer_drawn` deed fires
   - Walks mom through:
     - Pick a list (or create a new one)
     - Pick a presentation mode (silent / text / reveal animation pool)
     - For opportunity flavor: configure rewards
     - For draw flavor: configure who picks what (person-pick-then-spin, or self-claim, or mom-direct)
     - Deploy to a surface (dashboard widget, routine step, hub element)

6. **Seeded template: Potty Chart.** Pre-configured Repeated Action Chart Wizard template. Star-on-chart + color-reveal-every-trip + treasure-box-prize-on-5/15/25/35/45 + custom-reward-on-50.

7. **Seeded template: Consequence Spinner.** Pre-configured List + Reveal + Assignment Wizard (draw flavor). Person-first picker, spinner reveal, drawn consequence becomes a task on the kid's dashboard with rotation memory.

8. **Seeded template: Extra Earning Opportunities.** Pre-configured List + Reveal + Assignment Wizard (opportunity flavor). Kid browses, claims, reward staged, task lands on dashboard, completion triggers payout.

9. **Visual verification.** Founder uses each wizard to deploy each seeded template. Verifies all three in real family use.

### 8.3 — Phase 3.7 Plain English of what mom experiences

After Phase 3.7 ships:
- Mom uses the Rewards List Wizard to create a "Potty Rewards" list with popsicle, story, chocolate, snuggle, trip to the store
- Mom uses the Repeated Action Chart Wizard, picks the Potty Chart template, customizes for Ruthie, deploys to Ruthie's dashboard
- Ruthie's first potty trip: a star appears on her chart, a color zone fills in on her coloring page
- Trip 5: treasure box reveal opens, popsicle card appears
- Trip 10: color page completes, fresh page starts, no treasure box (per the design)
- Trip 50: special "I DID IT!" treasure box, mom-typed text "shopping trip for big girl underwear" appears, IOU lands on mom's reward board
- Mom delivers the shopping trip later, marks paid in the reward board
- Mom uses the List + Reveal + Assignment Wizard to set up a Consequence Spinner for all four kids
- Mom uses the same wizard to set up an Extra Earning Opportunities list for the older kids

---

## 9. Risk and Decision Log

### 9.1 — Risks

**Risk 1 — Migration-time verification surfaces unexpected discrepancies.** The migration's comparison check at cutover may reveal that the new system produces slightly different math than the legacy system in some edge case. Mitigation: investigation 14 designs the verification mechanism with clear comparison criteria. If migration's comparison check fails, migration aborts; legacy code stays as source of truth until founder fixes the underlying discrepancy. If a discrepancy surfaces in the first few days post-dispatch (after migration succeeded), founder debugs as a normal bug — git history has the legacy code if reference needed.

**Risk 2 — `assign_task_godmother` consolidated config becomes unwieldy.** Phase 3 may discover that one godmother handling consequences + opportunities + spinner draws + direct mom assignments has a config schema that's too complex. Mitigation: founder pre-approved that Phase 3 may split this godmother into 2-3 focused ones during implementation. Decision deferred to Phase 3.

**Risk 3 — Worker 5 (Painter) ships with incompatible architecture.** If Worker 5 builds a standalone Painter primitive (rejecting the Coordination Brief's Shape D guidance), the connector layer will need additional adapter work. Mitigation: Coordination Brief is explicit; founder verifies Worker 5's design before dispatch.

**Risk 4 — Phase 3.5 expanded scope (14 capabilities) increases build complexity and migration surface.** Phase 3.5 is calibrated against ten distinct family-configuration scenarios surfaced in Phase 2. The realistic capability set is meaningfully larger than a single-family scenario would suggest. Mitigation: investigation 15 documents the scenario regression set; investigation 17 designs lifecycle/transition mechanics; the 18 sub-task sequence may split into 3.5a + 3.5b at Claude Code's discretion. Migration handles in-flight allowance data safely — existing single-pool data becomes "default pool" data preserving exact values; parallel-running verification during migration confirms no balance shifts; rollback path exists if verification fails. Phase 3.5 dispatches when work is done; safety is in the migration code, not in the dispatch timing.

**Risk 5 — Phase 3.7 wizard scope grows beyond a single Claude Code session.** The wizards + treasure box infrastructure + three templates is a lot. Mitigation: pre-approved split into 3.7a (data layer) + 3.7b (wizards) at Claude Code's discretion.

**Risk 6 — Investigations return surprising answers that invalidate Phase 3 sub-task sequence.** E.g., investigation 1 reveals that one of the godmothers has no existing infrastructure to wrap and is entirely net-new. Mitigation: founder reviews investigation results before Phase 3 dispatch. Sub-task sequence may be revised based on findings.

### 9.2 — Decisions Deferred to Phase 3 / 3.5 Implementation

**Phase 3:**
- **`assign_task_godmother` split or not.** Phase 3 implementation decides based on config schema complexity.
- **Color reveal extension approach.** Polymorphic vs shim per investigation 6.
- **`stroke_of='custom'` firing mechanism.** PRD-35 vs active painter per investigation 10.
- **`fixed` vs `dynamic` calculation_approach resolution.** Per investigation 8.

**Phase 3.5:**
- **Goal-based pool implementation (Scenario 9 from §7.1).** Schema permits `pool_type='goal_pool'`; UX/implementation deferred unless founder explicitly requests inclusion in v1.
- **Self-managed pool UX (Scenario 6 from §7.1).** Schema permits pool ownership fields; UX deferred to a focused later build for self-tracking adults / Independent teens.
- **Pool weighting algorithm details.** Linear weighted average is the default; alternative formulas (geometric mean, weighted median, etc.) deferred to implementation if needed.
- **Event-driven pool close mechanics.** What constitutes "the close event" — a specific deed firing, a list completion, mom-confirmed close. Phase 3.5 implementation decides specifics per investigation 17.
- **Term-length pool calendar template support.** Whether mom can attach a school-calendar template (start/end dates auto-populated from Aug 28 / Dec 20 / etc.) or just types dates manually. Phase 3.5 ships manual date entry; calendar templates deferred.

### 9.3 — Decisions Deferred to Founder Mid-Build

- **Phase 3 dispatch timing relative to in-flight allowance period.** Founder picks. Any time is fine — migration is designed to handle in-flight period state.
- **Override mode default behavior in baseline UI.** UI nudges toward `'replace'` per Coordination Brief §2.5; founder can adjust default if needed.
- **Worker 3 (Shared Lists) timing relative to Phase 3.7.** Founder decides at Phase 3.7 dispatch time per investigation 11.

### 9.4 — Rollback Paths

- **Phase 3 rollback:** if the migration-time verification check fails, migration aborts; legacy code remains the source of truth. Founder fixes the discrepancy and re-runs migration. If a discrepancy surfaces after migration commits and goes to production, debug as a normal bug — git history has the legacy code if reference needed.
- **Phase 3.5 rollback:** harder still. Multi-pool data migration. Rollback requires re-collapsing per-pool rows back to single-pool rows. Mitigation: migration includes parallel-running verification before legacy single-pool reads are removed. If verification fails, parallel state holds until the discrepancy is resolved.
- **Phase 3.7 rollback:** easiest. Wizards are additive. Disable the wizard pages; mom continues using baseline UI from Phase 3.

---

## 10. Project Knowledge Sync Notes

When Phase 2 documents are committed, update project knowledge:

**ADD:**
- `Connector-Build-Plan-2026-04-26.md` (this document)
- `Parallel-Builder-Coordination-Brief-2026-04-26.md` (drafted alongside)

**DO NOT REMOVE:**
- `Connector-Architecture-Master-Plan.md` (still authoritative for phase structure)
- `Connector-Architecture-and-Routing-Model.md` (still authoritative for design)
- `Composition-Architecture-and-Assembly-Patterns.md` (upstream architectural vision)
- `REWARDS_GROUND_TRUTH_2026-04-25.md` (ground truth on existing reward infrastructure)
- `CONNECTOR_GROUND_TRUTH_2026-04-25.md` (ground truth on existing connector-relevant infrastructure)

**DO NOT SELECT (existing files that are superseded by Phase 2 or no longer relevant):**
- None identified. Phase 2 documents are additive.

---

## 11. Phase 3 Dispatch Prompt (Paste-Ready)

The block below is paste-ready into a fresh Claude Code session for Phase 3 dispatch. Append the relevant Worker 5 / Workers 2+3 coordination sections from the Brief if those builds are also in flight.

```
PHASE 3 — CONNECTOR LAYER BUILD

You are starting Phase 3 of the Connector Architecture work for MyAIM Family.

# Before you do anything else

Read these files in this order:
1. claude/web-sync/Connector-Build-Plan-2026-04-26.md (the Phase 2 build plan, which is your authoritative source for Phase 3 scope)
2. Connector-Architecture-and-Routing-Model.md (the Phase 1 design — vocabulary, schema, decisions)
3. Parallel-Builder-Coordination-Brief-2026-04-26.md (cross-cutting principles you must respect)
4. claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md (ground truth on existing reward infrastructure)
5. claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md (ground truth on existing connector-relevant infrastructure)

Then read claude/PRE_BUILD_PROCESS.md and follow the mandatory pre-build ritual.

# Mental Model

The connector layer is a workflow automation engine for family life — conceptually similar to n8n, Zapier, or other event-driven workflow tools. Vocabulary is family-flavored ("deeds" / "godmothers" / "contracts" / "the IF") but the architectural shape matches. Build the engine to be powerful; build the wizards (later phases) to keep mom safe from that power.

# Important context

- The vocabulary is locked. Use deeds, contracts, the IF, stroke_of, payload, godmothers (with type prefixes), godmother config consistently. Don't invent new terms.
- Plain English is mandatory. Every architectural decision and design choice must include a "Plain English" or "What this means for mom" section alongside the technical content.
- No existing users yet. Founder's family is the only production family. No backward-compatibility scaffolding. No feature flags. No deprecation cycles.
- Pacing is the founder's job. Do not suggest stopping points or breaks. Sequence by dependency only.
- Visual Verification Standard. Each phase requires eyes-on browser confirmation before marking Wired. Passing Playwright tests do not substitute.
- One commit per sub-task. Report back to founder after each commit. Founder approves before next sub-task.

# Your scope (Phase 3)

Phase 3 ships in a single cut.
- Sub-tasks 1-21 from the Phase 2 build plan §6.2
- Migration-time verification: at cutover, new system's calculations match old system's calculations to the cent. If not, migration aborts.
- Legacy code deleted in the same commit sequence (sub-task 20) — not as a separate cut later.
- Post-dispatch sanity checks log discrepancies to founder if any surface; debug as a normal bug.

# Pre-Phase-3 investigation results

Before starting code, the founder will provide investigation results from investigations 1-17 in §5 of the Phase 2 build plan. Read them carefully. They may revise the sub-task sequence. Surface any conflicts to the founder before committing.

# How to proceed

1. Read all reference documents
2. Run pre-build ritual per claude/PRE_BUILD_PROCESS.md
3. Confirm understanding of Phase 3 scope by writing a pre-build plan
4. Wait for founder approval
5. Execute sub-tasks in order
6. Commit per sub-task; report back; wait for founder approval before next

The Coordination Brief tells you what other parallel builders are producing that you'll consume. Respect their schemas. Don't reinvent shared infrastructure.

Good luck.
```

---

## 12. Phase 3.5 Dispatch Prompt (Paste-Ready)

```
PHASE 3.5 — MULTI-POOL ALLOWANCE RESTRUCTURE

You are starting Phase 3.5 of the Connector Architecture work for MyAIM Family.

Phase 3 has shipped. The connector layer is the source of truth. The legacy calculate_allowance_progress RPC is gone. Now you restructure the allowance system for multi-pool support.

# Before you do anything else

Read these files in this order:
1. claude/web-sync/Connector-Build-Plan-2026-04-26.md (Phase 2 build plan, §7 covers Phase 3.5)
2. Connector-Architecture-and-Routing-Model.md (Phase 1 design)
3. claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md (especially §0 on the single-pool allowance math and §2 on multi-pool implications)
4. The Phase 3 sub-task results (which committed the connector layer; you'll integrate with what's there)

Then read claude/PRE_BUILD_PROCESS.md and follow the mandatory pre-build ritual.

# Mental Model

Same as Phase 3 — workflow engine for family life. Phase 3.5 deepens the allowance side of the engine, not the engine itself.

# Important context

- The vocabulary is locked from Phase 1.
- Plain English mandatory.
- No backward-compatibility scaffolding.
- One commit per sub-task; report back; founder approves.
- Ship when work is done. There is no allowance-period-close gate on dispatch. Migration is designed to handle in-flight allowance data safely regardless of where the family is in their current period.

# Your scope (Phase 3.5)

Sub-tasks 1-18 from the Phase 2 build plan §7.2. May split into 3.5a + 3.5b at your discretion if the build feels too large for a single session — see §7.2 for the suggested split.

# How to proceed

1. Read all reference documents
2. Run pre-build ritual
3. Pre-build plan; await approval
4. Execute sub-tasks
5. Commit and report per sub-task

Good luck.
```

---

## 13. Phase 3.7 Dispatch Prompt (Paste-Ready)

```
PHASE 3.7 — REWARDS LIST WIZARD + REPEATED ACTION CHART WIZARD + LIST + REVEAL + ASSIGNMENT WIZARD

You are starting Phase 3.7 of the Connector Architecture work for MyAIM Family.

Phase 3 and Phase 3.5 have shipped. The connector layer is live with multi-pool allowance support. Now you ship the first wizards that compose the connector layer into mom-friendly templates.

# Before you do anything else

Read these files in this order:
1. claude/web-sync/Connector-Build-Plan-2026-04-26.md (Phase 2 build plan, §8 covers Phase 3.7)
2. Connector-Architecture-and-Routing-Model.md (Phase 1 design)
3. Composition-Architecture-and-Assembly-Patterns.md (the broader composition vocabulary the wizards expose to mom)
4. Parallel-Builder-Coordination-Brief-2026-04-26.md (especially §2.7 on community-ready templates and §2.9 on cross-cutting UI primitives)
5. The Phase 3 + Phase 3.5 commit results

Then read claude/PRE_BUILD_PROCESS.md and follow the mandatory pre-build ritual.

# Mental Model

Same workflow engine framing. The wizards are mom's opinionated low-code surface over the engine. Build wizards that produce contracts, contracts that fire deeds, deeds that route to godmothers. The wizards are how mom doesn't have to author raw contracts; they're not optional polish.

# Important context

- Three wizards, three seeded templates, treasure box rotation infrastructure.
- May split into 3.7a (data layer + small UI: Rewards List Wizard + treasure box pool/tag infrastructure) and 3.7b (the two chart wizards) at your discretion if scope feels too large for a single session.
- All wizards produce DEPLOYABLE TEMPLATES that workers can render on multiple surfaces (dashboard widget, routine step, hub element). Don't bake deployment surface into the template.
- All wizards respect the four-mode sharing matrix from the Coordination Brief §2.2.
- Use cross-cutting UI primitives from §2.9 (people picker, presentation mode picker, etc.). Don't reinvent.

# Your scope (Phase 3.7)

Sub-tasks 1-9 from the Phase 2 build plan §8.2.

# Coordination concerns

- Worker 3 (Shared Lists) may or may not have shipped. Per investigation 11 results, either:
  (a) Worker 3 has shipped → wizards use the shared-list infrastructure directly
  (b) Worker 3 hasn't shipped → wizards ship with a temporary single-list pattern; Worker 3 retroactively unifies when it lands
- Worker 5 (Painter) is shipped or in flight. Wizards that produce schedule-attached templates use the existing scheduler with painted-calendar input mode.

# How to proceed

1. Read all reference documents
2. Run pre-build ritual
3. Pre-build plan; await approval
4. Decide whether to split into 3.7a + 3.7b or run as one session
5. Execute sub-tasks
6. Commit and report per sub-task

Good luck.
```

---

> **End of Phase 2 Build Plan.**
>
> This document is paired with `Parallel-Builder-Coordination-Brief-2026-04-26.md`. Together they form the Phase 2 deliverable. Three Claude Code dispatches are ready to run when investigations complete and founder approves. Phase 3 → Phase 3.5 → Phase 3.7 in sequence, with the option to dispatch Worker 5 (Painter) and Workers 2+3 (Shared Routines + Lists) in parallel before Phase 3 starts if their schedules permit.
