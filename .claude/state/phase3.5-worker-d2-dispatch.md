# Phase 3.5 Worker D2 — Frontend: Ledger, Recalculate, Gap Items

## Context

You are Worker D2 for Phase 3.5 (Multi-Pool Allowance). Workers A, B2, C, and D1 are complete:
- **Worker A** (migration 100234): Schema changes
- **Worker B2** (migration 100235): RPC rewrite + recalculate integrity fix
- **Worker C** (migration 100236): Edge Function per-pool period close + cross-pool logic
- **Worker D1**: Widget per-pool display, ChildAllowanceConfig multi-pool management, BulkConfigureAllowanceModal extension, per-pool breakdown view, pool lifecycle UI

You build the ledger, recalculate flow, and address the gap items from earlier workers.

**Read these files before writing any code:**
- `.claude/rules/current-builds/phase-3.5-multi-pool-allowance.md` — active build file (key decisions 1-18, Worker D gaps D-gap-1 through D-gap-4)
- `claude/feature-decisions/PRD-28-Phase-3.5-Multi-Pool-Allowance.md` — feature decision file

**Read for current frontend implementation:**
- `src/hooks/useFinancial.ts` — all allowance hooks (transactions, grace days, payments, adjustments)
- `src/features/financial/RoutineWeekEditPage.tsx` — recalculate flow (Worker B2 fixed single-pool; you extend for multi-pool)
- `src/features/financial/FinancialModals.tsx` — PaymentModal (already has partial payment UI)
- `src/pages/PrizeBoard.tsx` — Balance tab, KidBalanceCard, TransactionRow

## Deliverables

### Task 1: Balance tab — PaymentModal wiring + full ledger

**PaymentModal wiring:**
The `KidBalanceCard` in PrizeBoard.tsx currently calls `payMutation.mutateAsync` directly with hardcoded full balance. Replace with: open `PaymentModal` (from `src/features/financial/FinancialModals.tsx`) which already has the full/partial radio, amount field, and note field.

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

### Task 2: Negative recalculate mom-choice prompt (Key Decision 16)

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

### Task 3: D-gap-1 — Multi-pool recalculate

`handleRecalculate` in RoutineWeekEditPage currently calls single-pool RPC. For multi-pool members:
1. Iterate all active pool configs for the member
2. Call `calculate_allowance_progress` with each `pool_name`
3. Call `calculate_weighted_combination` to get the new combined percentage
4. Compare each pool's new `total_earned` to old, plus compare new `combined_percentage` to old
5. Write per-pool adjustment transactions where delta is nonzero
6. Write combined adjustment if the combined payout changed
7. Apply the negative-adjustment prompt (Task 2) if the combined delta is negative

**Compute-then-prompt applies here too.** Compute all pools, compute the combined delta, THEN show the prompt if negative. Don't write anything until mom chooses.

### Task 4: D-gap-2 — Grace day sync across pools

When mom adds/removes a grace day via `useAddGraceDay` / `useRemoveGraceDay`:
- These mutations currently update ONE `allowance_periods` row by `periodId`
- For multi-pool, mom marks a grace day on the kid (not on a specific pool) — grace days apply across ALL pools (Key Decision 2)
- The mutation must update ALL active `allowance_periods` rows for that member (across all pool names) with the grace day change
- UI: the grace day picker should appear at the MEMBER level (above the pool list), not inside individual pool configs

**Implementation:** Modify `useAddGraceDay` and `useRemoveGraceDay` to accept `memberId` instead of (or in addition to) `periodId`. Query all active periods for that member, update each one. Invalidate all relevant query keys.

### Task 5: D-gap-3 — Period history pool awareness

`usePeriodHistory` currently returns a flat list of `allowance_periods` rows. For multi-pool:
- Group by period date range (all pools for the same period window shown together)
- Show per-pool breakdown within each period group: pool name, percentage, earned, weight
- Show combined percentage and combined payout
- "Recalculate" button applies to ALL pools in that period simultaneously (Task 3)

**Implementation:** The hook already queries `allowance_periods` for a member. Group the results by `(period_start, period_end)`. Each group is a "period" containing N pool entries.

### Task 6: D-gap-4 — Cross-pool condition authoring (OPTIONAL)

**Drop this if context is getting heavy.** Mom can use `/contracts` page for now.

If you have headroom: add a "Cross-pool conditions" section in ChildAllowanceConfig that shows existing `multi_pool_threshold` contracts for this kid and offers a simple "Add condition" form:
- "If [pool A] is at least [X%] AND [pool B] is at least [Y%] → [bonus $Z / penalty Z%]"
- Creates the contract row with `if_pattern='multi_pool_threshold'`, `stroke_of='end_of_period'`

If skipped, note it as a Worker E gap.

## Verification

- `tsc -b` must pass with zero errors
- Visual verification:
  - PaymentModal opens from Balance tab Pay button (partial amount works)
  - Full ledger shows all transactions with running balance
  - Kid-visible ledger shows own history only, respects `child_can_see_finances`
  - Multi-kid ledger shows combined stream with member colors
  - Negative recalculate shows 3-option prompt (nothing written before mom chooses)
  - Grace day added → all pool periods updated simultaneously
  - Period history grouped by date range with per-pool breakdown
  - `pool_contribution` rows render as informational lines, not money rows

## What NOT To Do

- Do not modify RPCs or migrations
- Do not modify the Edge Function
- Do not rebuild the widget display (Worker D1 already did this)
- Do not rebuild pool config UI (Worker D1 already did this)
- Do not build event-driven pool close triggers (stub)
- Do not build goal-based or self-managed pool UX (deferred)
- Do not build hourly work earning pathway (out of scope — Key Decision 18)
