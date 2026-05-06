# Phase 3.5 Worker D1 — Frontend: Display + Configuration

## Context

You are Worker D1 for Phase 3.5 (Multi-Pool Allowance). Workers A, B2, and C are complete:
- **Worker A** (migration 100234): Schema — pool columns on `allowance_configs`, `allowance_periods`, `tasks`, `financial_transactions`
- **Worker B2** (migration 100235): RPC — `calculate_allowance_progress` per-pool, `get_pool_progress`, `calculate_weighted_combination`, recalculate integrity fix, `fixed` collapsed into `dynamic`, `numerator_godmother` records pool_name
- **Worker C** (migration 100236): Edge Function — per-pool period close, combined payout, `pool_contribution` informational transactions, cross-pool penalty/multiplier logic at period close

You build the display and configuration surfaces. Worker D2 (separate session) handles the ledger, recalculate flow, and gap items.

**Read these files before writing any code:**
- `.claude/rules/current-builds/phase-3.5-multi-pool-allowance.md` — active build file (key decisions 1-18, mom-UI surfaces table)
- `claude/feature-decisions/PRD-28-Phase-3.5-Multi-Pool-Allowance.md` — feature decision file
- `claude/web-sync/Connector-Build-Plan-2026-04-26.md` §7.2 sub-tasks 12-15 + §7.3 (plain English of what mom sees)

**Read for current frontend implementation:**
- `src/hooks/useFinancial.ts` — all allowance hooks
- `src/components/widgets/trackers/AllowanceCalculatorTracker.tsx` — dashboard widget
- `src/features/financial/ChildAllowanceConfig.tsx` — per-kid allowance settings
- `src/features/financial/BulkConfigureAllowanceModal.tsx` — bulk config across kids

## Deliverables

### Task 1: AllowanceCalculatorTracker — per-pool display + money-source breakdown

**Current state:** Single progress ring/bar showing one percentage for one pool.

**New state:**
- If the kid has ONE pool (default): display exactly as today. No visual change. Backward compatible.
- If the kid has 2+ pools: show a per-pool breakdown. Each pool gets its own progress indicator (mini ring or bar) with pool name label and percentage. Below the individual pools, show the combined percentage and combined payout amount.
- Measurement-only pools display their percentage with a distinct label ("Tracked" or "No payout") — no dollar amount shown for these.
- The Today/Period toggle (NEW-OO, already shipped) works per-pool: Today narrows the date range for ALL pools simultaneously.
- `useLiveAllowanceProgress` already accepts optional `poolName` parameter (Worker B2 added this). Call it once per active pool. Use the existing `useAllowanceConfig` to discover pool names.

**Money-source breakdown (Row 203 / NEW-XX fold-in):**
The per-pool display IS the money-source breakdown. Each pool shows what it contributed to the combined payout. This falls out of the multi-pool display naturally — no separate widget needed.

### Task 2: ChildAllowanceConfig — multi-pool management

**Current state:** One settings screen per kid with one set of config fields.

**New state:**
- Pool list at the top of the config screen. Each pool shown as a card/section with pool name, type badge (percentage/measurement-only), status badge (active/paused/archived), and weight.
- "+ Add Pool" button at the bottom of the pool list. Opens an inline form: pool name (required), payout mode (weekly/biweekly/monthly/term/event-driven/measurement-only), pool weight (default 1.0), overage cap (default 100).
- Each pool card is expandable to show/edit that pool's full config (same fields as today: weekly amount, bonus threshold, bonus type/amount, calculation approach, extra credit enabled, etc.)
- For term-length pools: show term start/end date pickers.
- For event-driven pools: show event source selector (stub — "Coming soon" text for now, since the event-close mechanism is a stub in Worker C).
- Pool status toggle: Active ↔ Paused (with confirmation). Archive button (with "are you sure?"). Archived pools hidden by default, "Show archived" toggle reveals them.
- The "default" pool: when a kid has only the default pool, the config looks IDENTICAL to today (no pool list visible, just the flat config). The pool list UI only appears when mom adds a second pool.
- **Entry point for adding a second pool:** At the bottom of the single-pool config view, show a subtle but discoverable link/button: "+ Add another pool (e.g., school, reading, music)". Tapping it reveals the pool list UI with the existing config shown as the first pool card (now labeled "default" with an inline rename option) and the "+ Add Pool" form below it. Mom shouldn't have to hunt for this — it should be visible in the normal config scroll.

**Overage cap UI:**
In each pool's expanded config, add a field: "Max percentage" with a number input defaulting to 100. Helper text: "100% = standard cap. Set higher to reward extra effort (e.g., 150% allows up to 50% bonus from extra work)."

### Task 3: BulkConfigureAllowanceModal — multi-pool extension

**Current state:** Apply config fields across multiple kids at once for a single pool.

**New state:**
- Pool selector at the top of the modal: dropdown of pool names that exist across selected kids. Default = "default" pool.
- When a pool name is selected, the bulk config fields apply to that specific pool across all selected kids.
- If a selected kid doesn't have the chosen pool, the bulk config creates it for them.
- The "+ Add pool to all selected kids" action creates a new pool with the chosen name across all selected members.

### Task 4: Per-pool widget breakdown view

**New surface:** A detail view accessible from the AllowanceCalculatorTracker widget (tap to expand, or tap a pool name). Shows:
- Per-pool progress with percentage, earned amount, weight, and contribution to combined
- Combined percentage and combined payout amount
- Cross-pool conditions status: which conditions are met/unmet, what their effect is
- Per-pool task list: which tasks contributed to this pool's numerator/denominator (read from the RPC's task walk — or surface from `calculation_details` if available)

This can be a modal (transient, size md) or an inline expansion below the widget.

### Task 5: Pool lifecycle UI

**Pause:** Mom taps "Pause" on a pool → confirmation prompt → pool status becomes `paused`. Paused pools:
- Stop generating new periods
- Current active period stays open (not force-closed)
- Not included in the weighted combination
- Show a "Paused" badge on the widget

**Archive:** Mom taps "Archive" → confirmation ("This pool's history will be preserved but it won't appear in active views") → pool status becomes `archived`. Archived pools:
- Same as paused, plus hidden from the default pool list
- Visible via "Show archived" toggle in settings
- Can be re-activated

**Seasonal swap pattern:** Mom pauses "School" pool in June, activates "Summer Reading" pool. In September, reverses. No special UI — just pause/activate on individual pools. The fact that paused pools don't contribute to weighted combination makes this work automatically.

## Hooks You May Need to Add/Modify

- `useAllowanceConfigs` — may need to return pool-grouped data (all configs for a member, grouped by pool_name)
- `useUpsertAllowanceConfig` — now keyed on `(family_member_id, pool_name)`, not just `family_member_id`
- `useLiveAllowanceProgress` — already accepts `poolName` from Worker B2. Call once per pool.
- `usePoolLifecycle` (new) — mutations for pause/archive/activate (UPDATE `pool_status` on `allowance_configs`)
- `useBulkUpsertAllowanceConfig` — needs pool_name support in the batch upsert

## Verification

- `tsc -b` must pass with zero errors
- Visual verification:
  - Kid with 1 pool (default) — widget looks IDENTICAL to today
  - Kid with 2+ pools — per-pool breakdown visible on widget
  - Measurement-only pool — percentage shown, no dollar amount
  - Paused pool — badge shown on widget, excluded from combined
  - ChildAllowanceConfig single-pool view — no pool list visible
  - ChildAllowanceConfig single-pool → tap "+ Add another pool" → pool list appears
  - BulkConfigureAllowanceModal — pool selector dropdown works

## What NOT To Do

- Do not modify RPCs or migrations
- Do not build the ledger view (Worker D2)
- Do not build the recalculate prompt (Worker D2)
- Do not wire PaymentModal (Worker D2)
- Do not address D-gap-1/2/3/4 (Worker D2)
- Do not build event-driven pool close triggers (stub — "Coming soon")
- Do not build goal-based or self-managed pool UX (deferred)
