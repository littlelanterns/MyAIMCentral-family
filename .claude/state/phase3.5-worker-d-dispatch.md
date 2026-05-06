# Phase 3.5 Worker D — Frontend

## Context

You are Worker D for Phase 3.5 (Multi-Pool Allowance). Workers A, B2, and C are complete:
- **Worker A** (migration 100234): Schema — pool columns on `allowance_configs`, `allowance_periods`, `tasks`, `financial_transactions`
- **Worker B2** (migration 100235): RPC — `calculate_allowance_progress` per-pool, `get_pool_progress`, `calculate_weighted_combination`, recalculate integrity fix, `fixed` collapsed into `dynamic`, `numerator_godmother` records pool_name
- **Worker C** (migration 100236): Edge Function — per-pool period close, combined payout, `pool_contribution` informational transactions, cross-pool penalty/multiplier logic at period close

You build all the frontend surfaces that make multi-pool visible and configurable.

**Read these files before writing any code:**
- `.claude/rules/current-builds/phase-3.5-multi-pool-allowance.md` — active build file (key decisions 1-18, Worker D gaps D-gap-1 through D-gap-4, mom-UI surfaces table)
- `claude/feature-decisions/PRD-28-Phase-3.5-Multi-Pool-Allowance.md` — feature decision file
- `claude/web-sync/Connector-Build-Plan-2026-04-26.md` §7.2 sub-tasks 12-15 + §7.3 (plain English of what mom sees)

**Read for current frontend implementation:**
- `src/hooks/useFinancial.ts` — all allowance hooks (config, periods, transactions, grace days, live progress, bulk configure)
- `src/features/financial/RoutineWeekEditPage.tsx` — recalculate flow (Worker B2 fixed this — now writes adjustment transactions)
- `src/features/financial/FinancialModals.tsx` — PaymentModal (already has partial payment UI)
- `src/pages/PrizeBoard.tsx` — Allowance/Prizes/Balance tabs, KidBalanceCard, TransactionRow
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

### Task 6: Balance tab — PaymentModal wiring + full ledger + kid-visible version

**PaymentModal wiring:**
The `KidBalanceCard` in PrizeBoard.tsx (line 407-418) currently calls `payMutation.mutateAsync` directly with hardcoded full balance. Replace with: open `PaymentModal` (from `src/features/financial/FinancialModals.tsx`) which already has the full/partial radio, amount field, and note field.

**Full ledger:**
Replace the current "Show recent transactions" expandable (20 items, flat list) with a full ledger view:
- Chronological transaction list (newest first) — ALL transactions, not limited to 20
- Each row shows: date, description, amount (+green for deposits, -red for withdrawals), running balance after that transaction
- `pool_contribution` rows (amount=0) render as informational lines showing pool percentage and weight — visually distinct from actual money rows (lighter text, no amount column, or collapsed into a "Period breakdown" expandable group)
- Filter/group options: All, Earnings (allowance_earned + opportunity_earned), Payments (payment_made), Adjustments (adjustment), By Pool (filter by pool_name)
- "Load more" pagination or virtual scroll for families with long history

**Kid-visible version:**
- Kid sees their OWN ledger only (RLS already enforces this via `family_member_id`)
- Same layout as mom's view but read-only (no Pay button, no recalculate)
- Respects `child_can_see_finances` toggle on `allowance_configs`: when false, show percentages only (no dollar amounts anywhere)
- Play shell: percentage only, always (Convention: Play mode override)
- Route: accessible from the kid's dashboard AllowanceCalculatorTracker widget (tap → detail view → "View history" link)

**Visibility rules:**
- Mom: per-kid view (default — select a kid to see their ledger) + "All kids" toggle that shows a single chronological stream with kid name + member color on each row. Kid selector is a pill bar at the top of the Balance tab using the standard member pill pattern (Convention #119). Multi-kid view is a combined stream, not side-by-side columns.
- Dad/Adult: whatever PRD-02 permissions grant for that member — same ledger view, gated by existing access control
- Kid: own ledger only

### Task 7: Negative recalculate mom-choice prompt (Key Decision 16)

**IMPORTANT — compute-then-prompt, never write-then-undo.**
The recalculate flow MUST compute the new values and show the prompt BEFORE writing anything to the database. Do NOT update the period row first and then try to revert on Cancel — that's fragile and error-prone. The pattern is:
1. Call the RPC to get new values
2. Compute the delta
3. If delta is negative → show the prompt and WAIT for mom's choice
4. Only after mom chooses → write the period update + financial transaction (or don't)

**When recalculate produces a LOWER amount (delta < -$0.01):**

Show a prompt (modal or inline confirmation):

> "Recalculation shows $8.46 instead of $9.10. That's $0.64 less than originally calculated."
>
> - **Apply correction** — Updates the period and records a -$0.64 adjustment to the ledger.
> - **Zero it out** — Updates the period percentages but writes no financial correction. The original earned amount stands.
> - **Cancel** — Nothing changes. Period row stays as-is.

"Apply correction" writes BOTH the period row update AND the negative adjustment transaction. "Zero it out" writes the period row update (new percentages) but no financial transaction — the earned amount on the period row stays at the original value. "Cancel" writes nothing at all.

**When delta is POSITIVE:** No prompt needed — write the period update and the positive adjustment silently. More money for the kid is always fine.

**When delta is zero:** No prompt, no transaction. Just show "Recalculation confirms the same result."

### Task 8: Address Worker D gaps (from Workers B1/C)

**D-gap-1: Multi-pool recalculate.**
`handleRecalculate` in RoutineWeekEditPage currently calls single-pool RPC. For multi-pool members:
1. Iterate all active pool configs for the member
2. Call `calculate_allowance_progress` with each `pool_name`
3. Call `calculate_weighted_combination` to get the new combined percentage
4. Compare each pool's new `total_earned` to old, plus compare new `combined_percentage` to old
5. Write per-pool adjustment transactions where delta is nonzero
6. Write combined adjustment if the combined payout changed
7. Apply the negative-adjustment prompt (Task 7) if the combined delta is negative

**D-gap-2: Grace day sync across pools.**
When mom adds/removes a grace day via `useAddGraceDay` / `useRemoveGraceDay`:
- These mutations currently update ONE `allowance_periods` row by `periodId`
- For multi-pool, mom marks a grace day on the kid (not on a specific pool) — grace days apply across ALL pools (Key Decision 2)
- The mutation must update ALL active `allowance_periods` rows for that member (across all pool names) with the grace day change
- UI: the grace day picker should appear at the MEMBER level (above the pool list), not inside individual pool configs

**D-gap-3: Period history pool awareness.**
`usePeriodHistory` currently returns a flat list of `allowance_periods` rows. For multi-pool:
- Group by period date range (all pools for the same period window shown together)
- Show per-pool breakdown within each period group: pool name, percentage, earned, weight
- Show combined percentage and combined payout
- "Recalculate" button applies to ALL pools in that period simultaneously (D-gap-1)

**D-gap-4: Cross-pool condition authoring (OPTIONAL — drop if context is heavy).**
The `/contracts` page can create `multi_pool_threshold` contracts manually today. An OPTIONAL enhancement in ChildAllowanceConfig: a "Cross-pool conditions" section showing existing conditions and a simple "Add condition" form:
- "If [pool A] is at least [X%] AND [pool B] is at least [Y%] → [bonus $Z / penalty Z%]"
- Creates the contract row behind the scenes with `if_pattern='multi_pool_threshold'`, `stroke_of='end_of_period'`
- **This is genuinely optional.** It's a complex UX surface (condition builder with pool selectors, threshold inputs, effect type picker) that could consume disproportionate effort. If context is getting heavy or you're past 7 tasks, skip this entirely and note it as a Worker E gap. Mom can use `/contracts` for now.

## Verification

- `tsc -b` must pass with zero errors
- Visual verification on every Mom-UI surface listed in the build file's verification table
- Test with:
  - Kid with 1 pool (default) — should look IDENTICAL to today
  - Kid with 2+ pools — per-pool breakdown visible on widget, settings show pool list
  - Measurement-only pool — tracked percentage shown, no dollar amount
  - Paused pool — badge shown, excluded from weighted combination
  - Negative recalculate — prompt appears with three options
  - Kid-visible ledger — own history only, respects `child_can_see_finances`
  - PaymentModal — partial payment works from Balance tab Pay button

## What NOT To Do

- Do not modify RPCs (Worker B2 scope, already complete)
- Do not modify the Edge Function (Worker C scope, already complete)
- Do not modify migrations (Workers A/B2/C scope)
- Do not build event-driven pool close triggers (stub — "Coming soon" in the UI)
- Do not build goal-based pool UX (schema-only, deferred)
- Do not build self-managed pool UX (schema-only, deferred)
- Do not build hourly work earning pathway (out of scope — Key Decision 18)
