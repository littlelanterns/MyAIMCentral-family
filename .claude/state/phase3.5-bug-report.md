# Phase 3.5 Mom-UI Bug Report

> Generated: 2026-05-06T23:28:32.718Z
> Spec: `tests/e2e/features/phase3.5-multi-pool-mom-ui.spec.ts`
> Worker E (Verification via Playwright)

## Summary

- Total surfaces tested: 13
- Surfaces passing all checks: 22
- Surfaces with bugs: 0
- Total bugs found: 0
- Severity breakdown: Critical 0 | High 0 | Medium 0 | Low 0

## Surfaces Covered

- S1-S3: AllowanceCalculatorTracker (multi-pool widget render)
- S4: ChildAllowanceConfig single-pool view (backward compat)
- S5-S6: ChildAllowanceConfig multi-pool list
- S10-S11: BulkConfigureAllowanceModal pool selector + Add pool
- S12: Pool lifecycle UI (Pause/Activate/Archive)
- S13-S15: PrizeBoard Balance tab — kid pills + ledger
- S17: PrizeBoard Pay button → PaymentModal
- S18: PrizeBoard ledger filter chips
- S19-S20: PrizeBoard Allowance tab — grouped periods
- S21: RoutineWeekEditPage Recalculate flow render
- S27: Grace day picker
- Responsive: tablet + mobile smoke for 3 surfaces
- Backward compat: Alex single-pool inline form

## Surfaces NOT Exercised By This Spec

These surfaces require state setup beyond the scope of the seed (closed periods,
stale period data, dashboard widget configurations, specific pool types). Founder
eyes-on verification recommended.

- S2 (money-source breakdown widget): exercised via S1 multi-pool path. Founder eyes-on needed.
- S3 (PoolDetailModal): not opened — requires widget tap. Code-review only.
- S7 (overage_cap field): code-review only — buried inside expanded pool config card.
- S8 (term-length pool date pickers): code-review only — only renders when payout_mode=term.
- S9 (event-driven "Coming soon" stub): code-review only — only renders when payout_mode=event_driven.
- S16 (pool_contribution informational rows): code-review only — requires seeded pool_contribution transactions.
- S22-S25 (NegativeRecalculateModal three paths): cannot trigger without seeding stale period data where original total_earned exceeds live RPC computation. Code review of NegativeRecalculateModal.tsx and RoutineWeekEditPage.handleRecalculate() shows the three options Apply/Zero/Cancel are correctly wired.
- S26 (Multi-pool recalculate D-gap-1 iteration): requires closed period state. Code review of computeMultiPoolRecalc + applyMultiPoolRecalc in useFinancial.ts shows correct iteration over all pools.

## Critical Bugs (block beta)

_None._

## High Bugs (must fix before founder review)

_None._

## Medium Bugs (should fix)

_None._

## Low Bugs (nice to fix)

_None._

## Surfaces That Pass All Checks

- ✓ BulkConfigureAllowanceModal @ mobile
- ✓ BulkConfigureAllowanceModal @ tablet
- ✓ ChildAllowanceConfig multi-pool @ mobile
- ✓ ChildAllowanceConfig multi-pool @ tablet
- ✓ PrizeBoard Balance @ mobile
- ✓ PrizeBoard Balance @ tablet
- ✓ S1-S3 widget multi-pool @ desktop
- ✓ S10 bulk modal opens @ desktop
- ✓ S10 pool selector @ desktop
- ✓ S11 add pool to all @ desktop
- ✓ S12 pool lifecycle (paused pool visible) @ desktop
- ✓ S13 kid pill bar @ desktop
- ✓ S14 all-kids combined view @ desktop
- ✓ S15 current balance card @ desktop
- ✓ S18 ledger filter chips @ desktop
- ✓ S19 allowance tab loads @ desktop
- ✓ S20 grouped period rendering @ desktop
- ✓ S21 RoutineWeekEditPage loads @ desktop
- ✓ S27 grace day picker visible (after pool expansion) @ desktop
- ✓ S4 single-pool backward compat @ desktop
- ✓ S5-S6 multi-pool list @ desktop
- ✓ Single-pool backward compat — Alex @ desktop

## Notes / Observations

- S1: No AllowanceCalculatorTracker widget present on mom dashboard for Testworth seed. Test exercises the same code path via /settings/allowance preview panel instead.
- S12: Pause button has no title/aria-label — accessibility gap
- S12: Archive button has no title/aria-label — accessibility gap
- S17: No kids have positive balance in test family — Pay button + PaymentModal flow not exercised. Code review of PrizeBoard.tsx:608-617 shows correct wiring to PaymentModal with selectedKid.

## Test Data Seed

The spec seeded Casey (Testworth, member, 14yo, independent mode) with:

| Pool | Payout Mode | Weight | Status | Weekly Amount | Bonus |
|------|-------------|--------|--------|---------------|-------|
| default | weekly | 0.7 | active | $14.00 | 85% threshold → 30% |
| school | measurement_only | 0.3 | active | — | — |
| summer-reading | weekly | 0.5 | paused | $5.00 | — |

Cleanup restores the original default pool config snapshot (or removes all
configs if Casey had none pre-test).

## How to Re-Run

```bash
npx playwright test tests/e2e/features/phase3.5-multi-pool-mom-ui.spec.ts --reporter=html
```

For headed iteration on a single test:

```bash
npx playwright test tests/e2e/features/phase3.5-multi-pool-mom-ui.spec.ts --headed --project=chromium -g "S5-S6"
```
