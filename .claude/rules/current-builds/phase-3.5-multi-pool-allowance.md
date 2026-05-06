# Phase 3.5 — Multi-Pool Allowance

## Status: ACTIVE — Founder approved 2026-05-06 (3 amendments incorporated)

## Source Material

- **Primary spec:** `claude/web-sync/Connector-Build-Plan-2026-04-26.md` §7.1–7.3
- **Ground truth:** `claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md`
- **Parent PRD:** `prds/platform-complete/PRD-28-Tracking-Allowance-Financial.md`
- **Feature decision file:** `claude/feature-decisions/PRD-28-Phase-3.5-Multi-Pool-Allowance.md`

### Addenda Read
- PRD-28-Cross-PRD-Impact-Addendum.md (skimmed — no contradictions with §7.1–7.3)
- PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md (skimmed — no relevance)
- audit/UNRESOLVED_CROSS_PRD_ACTIONS.md (searched for PRD-28/allowance)
- claude/web-sync/TRIAGE_WORKSHEET.md (searched for all allowance-related rows)

### Godmother Signature Verification (Phase 3 → Phase 3.5 handoff)
- `execute_allowance_godmother` (migration 100207): 4-arg `(UUID, JSONB, JSONB, TEXT) → JSONB`. Reads `pool_name` from `allowance_godmother_configs`. Returns metadata with `pool_name`, `is_extra_credit`, `source_type`, `source_id`, `family_member_id`. Accepts `task_completion`, `routine_step_completion`. **Matches plan — no drift.**
- `execute_numerator_godmother` (migration 100208): Same 4-arg signature. Records `boost_weight` (from `payload_amount`, default 1.0). Returns `deferred_to: 'period_close'` + `family_member_id`. Accepts `task_completion`, `routine_step_completion`, `list_item_completion`, `opportunity_claimed`. **Matches plan — no drift.**
- Both record to `contract_grant_log` as dispatch stubs. Phase 3.5 builds the reader side at period close.

---

## Pre-Build Summary

### What This Phase Does (Plain English)

Each kid currently has ONE allowance percentage. After this phase, each kid can have MULTIPLE named pools — "Chores" at 70% weight, "School" at 20%, "Above & Beyond" as measurement-only — each with independent periods, thresholds, and calculation rules. Cross-pool conditions work (e.g., chores must be ≥80% before school pool pays out). Pools can be paused seasonally. The widget shows per-pool breakdowns. The Balance tab becomes a full earnings ledger visible to kids (own only) and mom (all kids).

### Founder's Anchor Use Case
A shared "house jobs" routine assigned to all capable kids. Personal routines define each kid's denominator (their chores pool). The shared routine adds to the NUMERATOR only via `numerator_godmother`, credited to whoever actually completes each step. Kid who does personal chores = 85%. Kid who does personal chores AND claims shared house jobs = 95%+.

### 14 Capabilities (from §7.1)

1. Multi-pool per kid (N pools, independent configs)
2. Per-pool independent configuration (calculation approach, thresholds, period type, payout settings)
3. Measurement-only pools (track without paying out)
4. Cross-pool IF conditions (bonus gating, threshold reads)
5. Cross-pool base-calculation modifiers (multiplicative/subtractive penalties)
6. Term-length pools (start/end dates)
7. Event-driven pool close (sequential list completion, etc.)
8. No privileged "default pool" — all pools architecturally equal
9. Weighted combination of pool percentages into single payout
10. Per-kid fully independent pool configurations
11. Pool lifecycle (active / paused / archived)
12. Goal-based pool variant (schema-only — UX deferred)
13. Self-managed pool ownership (schema-only — UX deferred)
14. Multiple period types coexisting per kid

### Fold-In Items (3 triage rows)

**Row 168 (SCOPE-3.F31) — dead enum cleanup + fixed vs dynamic resolution:**
During RPC rewrite. `fixed` and `dynamic` are mathematically identical in current code — resolve by collapsing or documenting. Check `hourly` and `financial_approval` enum values for consumers; clean if dead.

**Row 193 (NEW-MM) — retroactive grace-day recalc:**
Low risk (one family, one-two completed cycles, test data). The period-close rewrite creates a natural place. Recalc produces adjustment `financial_transactions` row to reconcile over/under-payment.

**Row 203 (NEW-XX) — money-source breakdown on widget:**
Falls out of multi-pool naturally. Per-pool breakdown IS the money-source differentiator. No extra work beyond what multi-pool widget rewrite already produces.

### Additional Founder Scope (confirmed 2026-05-06)

**Partial payment:** Already built in `src/features/financial/FinancialModals.tsx` (PaymentModal with full/partial radio + amount field + note). But PrizeBoard Balance tab Pay button bypasses it (hardcodes full balance). **Fix: wire Pay button to open PaymentModal.**

**Earnings ledger:** Balance tab already has expandable TransactionRow list (20 items, mom-only). **Enhancement: full chronological ledger with running balance column, per-pool source tags, kid-visible version (own only), dad visible per permissions.** This is an upgrade to existing wiring, not a new surface.

### Worker Dispatch Plan

**Sequencing: A → B1 → [founder gate] → B2 → C → D → E**

---

**Worker A — Schema + Migration**
1. Schema: per-pool restructure of `allowance_configs` (one row per kid per pool)
2. Schema: pool weighting, lifecycle, and ownership fields
3. Schema: per-task pool assignment (`pool_id` on tasks)
4. Schema: per-pool restructure of `allowance_periods` (one row per kid per pool per period)
5. Schema: payout contract reference for weighted combinations — **Option A with recalculate (Amendment 1).** At period close, compute weighted combination of pool percentages → store combined percentage as official record → generate payout transaction. Recalculate: re-run combination math on past period → compare to stored → write adjustment `financial_transaction` (positive or negative). Append-only per Convention #223. Same mechanism used by Row 193 (grace-day recalc).
6. `pool_name` column on `financial_transactions` for source tracking
7. Migration: existing single-pool data → multi-pool shape with verification
8. Migration 100234

**Worker B1 — Recalculate Investigation (Amendment 2) — HARD FOUNDER GATE**
9. Investigate existing single-pool recalculate path:
   - Does it actually recompute the period?
   - Does it write an adjustment transaction, or does it try to UPDATE the existing record?
   - Does it handle the case where a payment was already made from the original calculation?
10. Report findings to founder with recommendation
11. **GATE: Founder reviews findings and approves before B2 dispatches.** If the fix is larger than expected, scope explicitly rather than absorbing silently.

**Worker B2 — RPC Rewrite + Fold-ins (dispatches only after B1 gate passes)**
12. Fix existing recalculate path if broken (per B1 findings)
13. `fixed` vs `dynamic` resolution + dead enum cleanup (Row 168)
14. RPC restructure: `calculate_allowance_progress` becomes per-pool
15. RPC: live cross-pool progress query infrastructure
16. RPC: pool weighting evaluation
17. Recalculate path for multi-pool (Amendment 1 mechanism)

**Worker C — Edge Function + Cross-Pool Logic**
18. Edge Function update: `calculate-allowance-period` for per-pool period close + recalculate path (Amendment 1)
19. Penalty / multiplier application logic (cross-pool conditions)
20. Retroactive grace-day recalc path (Row 193) — uses Amendment 1 recalculate mechanism

**Worker D1 — Frontend: Display + Configuration**
21. AllowanceCalculatorTracker per-pool display + money-source breakdown (Row 203)
22. ChildAllowanceConfig multi-pool management (pool list, add pool, overage cap, term dates)
23. BulkConfigureAllowanceModal multi-pool extension (pool selector dropdown)
24. Per-pool widget breakdown view (detail modal/expansion)
25. Pool lifecycle UI (pause / archive / activate)

**Worker D2 — Frontend: Ledger, Recalculate, Gap Items**
26. Balance tab: wire PaymentModal + full ledger with running balance + kid-visible version
27. Negative recalculate mom-choice prompt: compute-then-prompt, never write-then-undo (Key Decision 16)
28. D-gap-1: Multi-pool recalculate (iterate all pools, combined delta, prompt if negative)
29. D-gap-2: Grace day sync across pools (update ALL pool periods for the member)
30. D-gap-3: Period history pool awareness (group by date range, per-pool breakdown)
31. D-gap-4: Cross-pool condition authoring (OPTIONAL — drop if context heavy, mom uses /contracts)

**Worker E — Verification**
32. Visual verification across multiple kids with different pool setups
33. Founder test with anchor use case (shared routine → numerator → chores pool)
34. `tsc -b` clean

### Out of Scope (Stubs)

- Goal-based pool UX (`pool_type='goal_pool'` — schema-only)
- Self-managed pool UX (ownership by teens/adults — schema-only)
- Pool configuration wizards (Phase 3.7+)
- LiLa-driven pool authoring (post-Gate-2)
- Cross-family pool sharing / community templates
- Alternative weighting formulas
- Term-length pool calendar templates (manual date entry only)
- Offline financial ledger (PRD-33)
- Hourly work earning pathway (time × rate — separate from pool math, uses time_sessions + money_godmother)

### Key Decisions (Locked)

1. `pool_name` on `allowance_configs` already exists (defaults `'default'`) — extend, not replace
2. Grace days remain per-period, not per-pool — a grace day applies to all pools
3. `numerator_godmother` is the shared-routine-to-pool connector (founder's anchor use case)
4. Partial payment already built — just wire PrizeBoard to use existing PaymentModal
5. Ledger view is an enhancement of existing Balance tab TransactionRow list
6. Per-pool `child_can_see_finances` semantics — each pool inherits from config
7. Financial data remains excluded from LiLa context assembly (Convention #225)
8. `financial_transactions` is append-only (Convention #223) — no UPDATE, no DELETE
9. Migration starting number: `00000000100234` (verified — 100233 is latest committed)
10. Dispatch timing: no allowance-period-close gate — migration handles in-flight data safely
11. **Payout contract = Option A with recalculate (Amendment 1).** Period close stores combined weighted percentage as official record on `allowance_periods.combined_percentage` (NOT on `allowance_configs` — that's the rulebook, not the report card). Recalculate re-runs math → compares → writes adjustment transaction. Append-only. Same mechanism for grace-day recalc (Row 193).
12. **Existing recalculate path must be investigated first (Amendment 2).** Before multi-pool period-close, verify current single-pool recalculate: does it recompute, write adjustment or UPDATE, handle post-payment? Fix if broken before extending. Flag findings.
13. **Overage cap replaces hardcoded 100% cap.** `allowance_configs.overage_cap DECIMAL DEFAULT 100`. Mom opts in by setting >100 (e.g., 150% max). Default 100 = today's behavior. One field, no toggle.
14. **On-demand daily floor uses `above_daily_floor` IF pattern (Phase 3 shipped).** Two contracts on same source: every_time → allowance_godmother (normal credit) + above_daily_floor(N) → numerator_godmother (bonus for extras). No schema changes — contract configuration only.
15. **`combined_percentage` on `allowance_periods` only.** Config = rulebook, periods = report card. Combined percentage is history — lives on the report card.
16. **Negative recalculate adjustment needs mom-choice UI (Worker D).** Backend handles negative deltas correctly (`Math.abs(delta) >= 0.01`, verified in code). But when recalculate produces a LOWER amount, Worker D must show a prompt: "Recalculation shows $X instead of $Y. That's $Z less." with three options: Apply correction (writes negative adjustment), Zero it out (no adjustment, mercy), Cancel. Backend already supports both paths.
17. **Row 168 is PARTIALLY RESOLVED.** `fixed` collapsed into `dynamic`. Dead enums `hourly` and `financial_approval` documented but CHECK constraint cleanup deferred to a future pass.
18. **Hourly work is NOT pool math — out of scope.** Hourly work (time × rate = dollars) is a separate earning pathway using `time_sessions` + `money_godmother`. Shows up in the same financial ledger alongside allowance payouts, but does not participate in pool percentage calculations. Deferred to a future build when founder is ready to set up hourly jobs for older kids.

### Dependencies

- Phase 3 Connector Layer (complete — contracts, deed firings, godmother dispatch all wired)
- `calculate_allowance_progress` RPC (migration 100175 — will be replaced)
- `calculate-allowance-period` Edge Function (will be updated)
- `AllowanceCalculatorTracker.tsx` (will be rewritten for multi-pool)
- `ChildAllowanceConfig.tsx` (will be extended for multi-pool)
- `PrizeBoard.tsx` Balance tab (will be enhanced for ledger + PaymentModal wiring)
- PRD-09B Shopping Mode build (parallel, no conflict — different tables)

---

## Mom-UI Surfaces

| Surface | Shells | New / Modification |
|---|---|---|
| AllowanceCalculatorTracker (widget) — per-pool display | Mom, Adult, Independent | Modification |
| AllowanceCalculatorTracker — money-source breakdown | Mom, Adult, Independent | New |
| ChildAllowanceConfig — multi-pool management | Mom | Modification |
| BulkConfigureAllowanceModal — multi-pool extension | Mom | Modification |
| Pool lifecycle UI (pause/archive/activate) | Mom | New |
| Pool detail breakdown view | Mom | New |
| PrizeBoard Balance tab — full ledger with running balance | Mom, Adult | Modification |
| PrizeBoard Balance tab — wire PaymentModal for partial pay | Mom | Modification (bug fix) |
| Kid-visible earnings ledger | Guided, Independent, Play | New |
| Recalculate negative-adjustment prompt | Mom | New |

## Mom-UI Verification

> Worker E (2026-05-06): Playwright spec `tests/e2e/features/phase3.5-multi-pool-mom-ui.spec.ts` ran 17 tests, all passing, 22 surface checks recorded across 3 viewports. Bug report: `.claude/state/phase3.5-bug-report.md` — 0 bugs.

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| AllowanceCalculatorTracker per-pool | playwright ✓ | (smoke ✓ via config preview) | (smoke ✓ via config preview) | mom (eyes-on TBD) | phase3.5-multi-pool-mom-ui.spec S1-S3 | 2026-05-06 |
| Money-source breakdown | code-complete (exercised via S1 multi-pool path) | code-complete | code-complete | mom (eyes-on TBD) | spec note: founder eyes-on widget on dashboard | 2026-05-06 |
| ChildAllowanceConfig multi-pool | playwright ✓ | playwright ✓ no-overflow | playwright ✓ no-overflow | mom (eyes-on TBD) | spec S5-S6 + responsive smoke | 2026-05-06 |
| ChildAllowanceConfig single-pool backward compat | playwright ✓ | code-complete | code-complete | mom (eyes-on TBD) | spec S4 + Backward compat — Alex | 2026-05-06 |
| BulkConfigureAllowanceModal | playwright ✓ pool selector + add pool | playwright ✓ opens correctly | playwright ✓ opens correctly | mom (eyes-on TBD) | spec S10-S11 + responsive smoke | 2026-05-06 |
| Pool lifecycle UI | playwright ✓ paused pool visible | code-complete | code-complete | mom (eyes-on TBD) | spec S12. Note: Pause/Archive buttons missing aria-label (low) | 2026-05-06 |
| Pool detail view (PoolDetailModal) | code-review only | code-review only | code-review only | mom (eyes-on TBD) | not opened by spec — requires widget tap | 2026-05-06 |
| Balance tab full ledger | playwright ✓ kid pills + ledger filters | playwright ✓ no-overflow | playwright ✓ no-overflow | mom (eyes-on TBD) | spec S13-S15, S18 | 2026-05-06 |
| Balance tab PaymentModal wiring | playwright ✓ wired (no positive balances in seed to click) | code-complete | code-complete | mom (eyes-on TBD) | spec S17 — code review of PrizeBoard.tsx:608-617 confirms wiring | 2026-05-06 |
| Kid-visible ledger | code-complete | code-complete | code-complete | independent/guided (eyes-on TBD) | LedgerView mode='self' branch — requires kid login to verify | 2026-05-06 |
| Negative recalculate prompt | code-review only | code-review only | code-review only | mom (eyes-on TBD) | spec note S22-S25 — requires stale period seed beyond scope | 2026-05-06 |
| Period history pool grouping (Allowance tab) | playwright ✓ no JS errors | code-complete | code-complete | mom (eyes-on TBD) | spec S19-S20 | 2026-05-06 |
| Grace day picker (multi-pool) | playwright ✓ visible after pool expansion | code-complete | code-complete | mom (eyes-on TBD) | spec S27 | 2026-05-06 |
| RoutineWeekEditPage (Recalculate flow) | playwright ✓ loads no JS errors | code-complete | code-complete | mom (eyes-on TBD) | spec S21 | 2026-05-06 |

---

## Worker D2 — Frontend: Ledger, Recalculate, Gap Items (2026-05-06)

### Deliverables status

| Task | Status | Files touched |
|---|---|---|
| Hooks layer extension | **Wired** | `src/hooks/useFinancial.ts` |
| Task 2 — NegativeRecalculateModal | **Wired** | `src/features/financial/NegativeRecalculateModal.tsx` (new) |
| Task 1 — Balance tab full ledger + PaymentModal wiring | **Wired** | `src/pages/PrizeBoard.tsx`, `src/features/financial/LedgerView.tsx` (new) |
| Task 3 — D-gap-1 multi-pool recalculate (compute-then-prompt) | **Wired** | `src/features/financial/RoutineWeekEditPage.tsx`, `src/hooks/useFinancial.ts` (`computeMultiPoolRecalc`, `applyMultiPoolRecalc`) |
| Task 4 — D-gap-2 grace day sync across pools | **Wired** | `src/hooks/useFinancial.ts` (`useAddGraceDayForMember`/`useRemoveGraceDayForMember`), `FinancesTab.tsx` callsite, `BulkConfigureAllowanceModal.tsx` callsite |
| Task 5 — D-gap-3 period history pool awareness | **Wired** | `src/hooks/useFinancial.ts` (`useGroupedPeriodHistory`), `PrizeBoard.tsx` Allowance tab (`PeriodGroupRow`) |
| Task 6 (optional) — D-gap-4 cross-pool condition authoring | **Stubbed** | Deferred per dispatch ("drop if context heavy"). Mom uses `/contracts` page. Worker E gap. |
| `tsc -b` clean | **Wired** | Zero errors |

### Hooks added to `useFinancial.ts`

- `useMemberLedger(memberId, filter?)` — ALL transactions for one member, ascending, used by LedgerView for running-balance compute.
- `useFamilyLedger(familyId, filter?)` — family-wide ledger for "All kids" view (no running balance — per-kid running balances would require per-kid ascending walks).
- `useGroupedPeriodHistory(memberId)` + `groupPeriodsByDateRange()` — period rows grouped by `(period_start, period_end)`.
- `useAddGraceDayForMember()` / `useRemoveGraceDayForMember()` — member-level grace day mutation; iterates ALL active pool periods for the member. Old per-period hooks kept for callers that explicitly target a single period (none in production code now — all swapped).
- `computeMultiPoolRecalc()` (pure async helper, NOT a hook) — calls `calculate_allowance_progress` per pool and `calculate_weighted_combination` once; returns deltas + RPC rows without writing.
- `applyMultiPoolRecalc()` (pure async helper) — applies a previously computed result. Modes `'apply'` (period rows + adjustment txns) and `'zero'` (period rows only, no money correction). Convention #223 honored: append-only writes via INSERT to `financial_transactions`.

### Components added

- `NegativeRecalculateModal.tsx` — three-option compute-then-prompt UI. Renders pool breakdown when multi-pool. No DB writes; pure UI + onChoice callback.
- `LedgerView.tsx` — full ledger surface used in three modes: `mom-per-kid`, `mom-all-kids`, `self`. In-memory filtering by category + by pool. Pagination via "Load more" (50/page). `pool_contribution` rows render distinct (italic, lighter, no amount column).

### Wiring details

- **PrizeBoard Balance tab** rebuilt: `BalanceSection` now branches on `currentMember.role`. Mom/Adult get `ParentBalanceView` with per-kid/all-kids toggle + kid pill bar. Kids get `KidSelfBalanceView` with `hideMoney` driven by Play shell + primary pool's `child_can_see_finances`. Pay button opens `PaymentModal` (was hardcoding full balance into `useCreatePayment` directly).
- **PrizeBoard Allowance tab** rebuilt: `KidAllowanceCard` groups unpaid periods by `(period_start, period_end)` and renders `PeriodGroupRow` (one row per date range, expandable per-pool breakdown). "Paid" button marks ALL pool periods in the date range as `closed`. Single-pool kids see exactly one pool inside the breakdown.
- **RoutineWeekEditPage.handleRecalculate** rewritten as compute-then-prompt:
  1. `computeMultiPoolRecalc` (no writes).
  2. If combined delta < -$0.01 → set `pendingNegativeRecalc`, show modal, await mom's choice.
  3. Otherwise → `applyMultiPoolRecalc(mode='apply')` silently.
  Modal `onChoice('apply' | 'zero' | 'cancel')` writes / partial-writes / does nothing accordingly.
- **Grace day callsites** (`FinancesTab.WeeklyProgressCard`, `BulkConfigureAllowanceModal`) swapped from `useAddGraceDay({periodId, ...})` → `useAddGraceDayForMember({memberId, ...})`. The bulk modal's per-member period lookup loop was removed (the new hook handles it internally).

### Known not-built

- **D-gap-4 cross-pool condition authoring UI** — deferred. Mom can use `/contracts` page. Note this for Worker E.
- **Eyes-on visual verification** — code complete, but founder must verify in browser at desktop / tablet / mobile widths and across mom / kid (independent / guided / play) shells per Mom-UI Verification table.
- **`useFinancialTransactions` and `useFamilyTransactions`** — kept for backward compatibility (TransactionHistory page still uses `useFinancialTransactions`). New ledger hooks coexist; legacy hooks can be removed in a follow-up if no longer needed.
