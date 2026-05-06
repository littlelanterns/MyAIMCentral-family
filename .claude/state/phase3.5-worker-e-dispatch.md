# Phase 3.5 Worker E — Verification via Playwright

## Context

You are Worker E for Phase 3.5 (Multi-Pool Allowance). Workers A through D2 are complete:
- **Worker A** (migration 100234): Schema with pool columns
- **Worker B2** (migration 100235): Per-pool RPC + recalculate integrity fix
- **Worker C** (migration 100236): Edge Function per-pool period close + cross-pool logic
- **Worker D1**: Frontend display + configuration (widget, pool config, bulk configure, lifecycle)
- **Worker D2**: Frontend ledger + recalculate (LedgerView, NegativeRecalculateModal, multi-pool recalc, grace day sync, period grouping)

Founder wants Playwright tests run BEFORE her eyes-on review so bugs are caught and fixed in advance. You write comprehensive Playwright tests using the mom UI on every relevant surface, run them, and produce a bug report.

**Read these files before starting:**
- `.claude/rules/current-builds/phase-3.5-multi-pool-allowance.md` — full build context, all key decisions, mom-UI surfaces table
- `tests/e2e/features/prd28-allowance-financial.spec.ts` — existing pattern for allowance E2E tests
- `tests/e2e/features/allowance-helam-setup.spec.ts` — existing allowance test setup pattern
- `tests/e2e/helpers/auth.ts` — `loginAsMom`, `loginAsAlex`, `loginAsJordan` helpers
- `tests/e2e/helpers/seed-testworths-complete.ts` — test family roster

**Read for code under test:**
- `src/components/widgets/trackers/AllowanceCalculatorTracker.tsx`
- `src/components/widgets/trackers/PoolDetailModal.tsx`
- `src/features/financial/ChildAllowanceConfig.tsx`
- `src/features/financial/BulkConfigureAllowanceModal.tsx`
- `src/features/financial/NegativeRecalculateModal.tsx`
- `src/features/financial/LedgerView.tsx`
- `src/features/financial/RoutineWeekEditPage.tsx`
- `src/pages/PrizeBoard.tsx`
- `src/hooks/useFinancial.ts` (all the new hooks)

## Goal

Write a Playwright spec file `tests/e2e/features/phase3.5-multi-pool-mom-ui.spec.ts` that exercises EVERY mom-UI surface from the build file's verification table, on three viewports (desktop ≥1024px, tablet ~768px, mobile ≤640px), and produces a structured bug report.

The test plan focuses on **mom UI** specifically — testing each surface as mom interacts with it. Founder will do separate kid-shell verification later.

## Surfaces to Test (from build file Mom-UI Verification table)

1. **AllowanceCalculatorTracker (widget) — per-pool display** — Mom dashboard
2. **AllowanceCalculatorTracker — money-source breakdown** — same widget, multi-pool case
3. **PoolDetailModal** — tap a pool name on the widget
4. **ChildAllowanceConfig — single-pool view (backward compat)** — Settings → Allowance & Finances → kid with one pool
5. **ChildAllowanceConfig — "+ Add another pool" entry point** — same surface, transition to multi-pool
6. **ChildAllowanceConfig — multi-pool management** — kid with 2+ pools (pool list, expand cards, lifecycle buttons)
7. **ChildAllowanceConfig — overage cap field** — within an expanded pool card
8. **ChildAllowanceConfig — term-length pool date pickers** — pool with `payout_mode='term'`
9. **ChildAllowanceConfig — event-driven "Coming soon" stub** — pool with `payout_mode='event_driven'`
10. **BulkConfigureAllowanceModal — pool selector dropdown** — bulk configure across kids
11. **BulkConfigureAllowanceModal — Add pool to all selected** — creates new named pool across members
12. **Pool lifecycle UI — Pause / Activate / Archive flows** — confirmation prompts
13. **PrizeBoard Balance tab — kid selector pill bar** — Convention #119 member pills
14. **PrizeBoard Balance tab — "All kids" combined ledger view** — single chronological stream
15. **PrizeBoard Balance tab — full ledger with running balance** — chronological transactions
16. **PrizeBoard Balance tab — pool_contribution informational rows** — visually distinct from money rows
17. **PrizeBoard Balance tab — Pay button opens PaymentModal** — partial payment works
18. **PrizeBoard Balance tab — ledger filters** — All / Earnings / Payments / Adjustments / By Pool
19. **PrizeBoard Allowance tab — period history grouped by date range** — D-gap-3 verification
20. **PrizeBoard Allowance tab — per-pool breakdown within each period** — D-gap-3 verification
21. **RoutineWeekEditPage — recalculate flow (positive delta)** — silent adjustment write
22. **RoutineWeekEditPage — recalculate flow (negative delta) → NegativeRecalculateModal** — three options visible
23. **NegativeRecalculateModal — "Apply correction" path** — writes adjustment + period update
24. **NegativeRecalculateModal — "Zero it out" path** — writes period update only, no transaction
25. **NegativeRecalculateModal — "Cancel" path** — nothing written (compute-then-prompt verified)
26. **Multi-pool recalculate (D-gap-1)** — iterates all pools, computes combined delta
27. **Grace day picker at member level (D-gap-2)** — adding/removing grace day updates ALL pool periods

## Test Setup

**Test data prerequisites:**
You'll need a test member with multiple pools configured. Either:
- (a) Use existing Testworth family kids (Helam has allowance setup per `allowance-helam-setup.spec.ts`)
- (b) Seed a multi-pool config via Supabase admin API at the start of the test suite (preferred — guarantees clean state)

**Recommended approach:** Use a `test.beforeAll` hook to seed Testworth Helam with:
- Pool 1: "chores" (default), `payout_mode='weekly'`, `weekly_amount=14.00`, `pool_weight=0.7`, `bonus_threshold=85`, `bonus_amount=5.00`
- Pool 2: "school", `payout_mode='measurement_only'`, `pool_weight=0.3`
- Pool 3: "summer-reading", `payout_mode='weekly'`, `pool_status='paused'`, for archive/activate testing

Use the service role key for seeding (already available via `SUPABASE_SERVICE_ROLE_KEY`).

**Test data cleanup:** `test.afterAll` hook should restore Helam's allowance_configs to the pre-test state (delete any pools created during the test, restore the original default pool config). Do NOT leave test data in production.

## Viewport Coverage

For each surface, test on:
- **Desktop** — `page.setViewportSize({ width: 1280, height: 800 })`
- **Tablet** — `page.setViewportSize({ width: 768, height: 1024 })`
- **Mobile** — `page.setViewportSize({ width: 375, height: 667 })`

Use `test.describe` blocks per viewport, or a parametrized test function.

## Bug Detection Strategy

For each surface, verify:

### Render correctness
- Component renders without console errors
- All expected text/buttons/labels visible
- Theme tokens used (no hardcoded colors visible — check computed style for hex values)

### Interaction correctness
- Buttons trigger expected actions (modals open, mutations fire, navigation works)
- Form fields accept input and validate (e.g., overage_cap rejects negative numbers)
- Confirmation prompts appear where expected (Pause, Archive)

### Data correctness
- Multi-pool widget shows correct number of pool rows matching seeded data
- Per-pool percentages match expected RPC return values
- Combined percentage matches `calculate_weighted_combination` output
- Measurement-only pools show "Tracked" / "No payout" label, not a dollar amount
- Paused pools show paused badge AND are excluded from combined math

### Backward compatibility
- Single-pool kid (only "default" pool) widget renders IDENTICAL to pre-3.5
- Single-pool kid config screen looks IDENTICAL to pre-3.5 (no pool list visible)
- "+ Add another pool" entry point IS visible at bottom of single-pool config

### Mobile/responsive
- 375px viewport: nothing overflows horizontally, modals fit, buttons tappable (44px+ touch targets)
- 768px viewport: layout adapts smoothly, no awkward gaps or stacking issues
- All interactive elements remain accessible across viewports

### Accessibility-adjacent
- Focus management: modals trap focus, Escape closes them
- Buttons have accessible names (no icon-only buttons without aria-label)
- Color contrast: don't audit deeply, but note obvious low-contrast issues

### Critical regression checks
- Existing single-pool allowance widget (`tests/e2e/features/prd28-allowance-financial.spec.ts`) STILL PASSES — no breakage
- Existing `allowance-helam-setup.spec.ts` STILL PASSES — no breakage
- `tsc -b` clean

## Bug Report Format

After running the test suite, produce a structured report saved to `.claude/state/phase3.5-bug-report.md`:

```markdown
# Phase 3.5 Mom-UI Bug Report

## Summary
- Total surfaces tested: N
- Surfaces passing all checks: N
- Surfaces with bugs: N
- Total bugs found: N
- Severity breakdown: Critical X | High Y | Medium Z | Low W

## Critical Bugs (block beta)
[Bugs that prevent core functionality, data corruption risks, security issues]

### Bug 1: [Title]
- **Surface:** [which UI surface]
- **Viewport:** [where reproducible]
- **Steps to reproduce:** [numbered list]
- **Expected:** [what should happen]
- **Actual:** [what happens]
- **Evidence:** [screenshot path, console error text]
- **Suspected cause:** [if known]

## High Bugs (must fix before founder review)
[Bugs that significantly affect mom's workflow]

## Medium Bugs (should fix)
[Bugs that affect UX but workarounds exist]

## Low Bugs (nice to fix)
[Cosmetic issues, edge cases]

## Surfaces That Pass All Checks
[Clean checklist of what's working]

## Notes / Observations
[Things that aren't bugs but worth flagging — e.g., unclear copy, suggested improvements]
```

## Running Tests

```bash
npx playwright test tests/e2e/features/phase3.5-multi-pool-mom-ui.spec.ts --reporter=html
```

If individual tests fail, capture screenshots automatically (already configured in `playwright.config.ts` via `screenshot: 'only-on-failure'`). Reference screenshot paths in the bug report.

For quick iteration during development:
```bash
npx playwright test tests/e2e/features/phase3.5-multi-pool-mom-ui.spec.ts --headed --project=chromium -g "specific test name"
```

## Verification Gate

After producing the bug report:
1. **If bugs found:** Stop and present the bug report to founder. Do NOT attempt fixes — that's a separate worker dispatch. Founder reviews and decides which bugs go to a fix-worker.
2. **If zero bugs found:** Run `tsc -b` to confirm clean. Update the build file's Mom-UI Verification table with timestamps and "Wired" status. Present the verification table to founder for sign-off.

## What NOT To Do

- Do not write fixes for bugs you find — only document them. Founder dispatches a fix-worker if needed.
- Do not modify production code — tests only.
- Do not skip viewport coverage — mobile/tablet/desktop are all required.
- Do not use hardcoded `waitForTimeout` longer than 1000ms — use proper wait conditions (`waitForSelector`, `waitForResponse`, etc.).
- Do not leave test data in the database — clean up in `afterAll`.
- Do not commit the bug report or the test file together with fixes — keep verification and fixes as separate commits.

## Important Test Stability Notes

- Theme tokens: when checking colors, use `getComputedStyle()` to read CSS variable values. Don't expect literal hex codes — themes resolve to different colors per family/member.
- Modals: `ModalV2` is portal-rendered. Use `page.locator('[role="dialog"]')` not container scopes.
- Animation: some interactions have transitions (max-height for sidebar sections, modal entry/exit). Wait for `transitionend` or use a brief `page.waitForTimeout(300)` after triggering.
- Auth caching: `loginAsMom` caches sessions in `tests/e2e/.auth/`. If a test fails with auth issues, clear that directory.
