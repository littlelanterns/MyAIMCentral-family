# Feature Decision File: PRD-28 Phase 3.5 — Multi-Pool Allowance

> **Created:** 2026-05-06
> **Primary spec:** `claude/web-sync/Connector-Build-Plan-2026-04-26.md` §7.1–7.3
> **Ground truth:** `claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md`
> **Parent PRD:** `prds/platform-complete/PRD-28-Tracking-Allowance-Financial.md`
> **Addenda read:**
>   - `prds/addenda/PRD-28-Cross-PRD-Impact-Addendum.md` — no contradictions with §7.1–7.3
>   - `prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md` — no relevance to multi-pool
>   - `audit/UNRESOLVED_CROSS_PRD_ACTIONS.md` — Row 168 (SCOPE-3.F31) folded in
>   - `claude/web-sync/TRIAGE_WORKSHEET.md` — Rows 168, 193, 203 folded in
> **Founder approved:** 2026-05-06 (with 3 amendments)

---

## What Is Being Built

Restructure the allowance system from a single ratio per child to per-pool ratios with independent configurations. Each kid can have multiple named allowance pools (chores, school, music, etc.) with independent period types, calculation approaches, thresholds, and payout modes. Pools can be measurement-only (track without paying), cross-pool conditions can gate bonuses or apply penalties, and weighted combinations can produce a single payout number. The existing single-pool data migrates to a "default pool" preserving exact values.

Additionally: the Balance tab gets upgraded to show a full earnings ledger (deposits + withdrawals + running balance) visible to mom, dad (per permissions), and kids (own only). The existing Pay button is wired to the already-built PaymentModal for partial payment support.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| AllowanceCalculatorTracker (widget) | Reads per-pool data. Displays per-pool progress. Handles measurement-only pools. Shows per-pool money-source breakdown (Row 203 fold-in). |
| ChildAllowanceConfig (settings) | Per-pool config UI. Add/remove pools, configure each pool's payout mode and thresholds. |
| BulkConfigureAllowanceModal | Extended for multi-pool: per-pool bulk operations across kids. |
| PrizeBoard → Balance tab | Full earnings ledger: chronological transactions with running balance, per-pool source tags. |
| PrizeBoard → Balance tab → Pay button | Wire to existing PaymentModal (partial payment support — already built in FinancialModals.tsx). |
| PrizeBoard → Allowance tab | Per-pool breakdown in period detail. |
| Pool lifecycle UI | Pause / archive / activate pools. Seasonal pool swap UX. |
| Pool detail view | Per-pool current state: percentage, period status, cross-pool conditions, contribution to combined payout. |
| Kid-visible ledger | Read-only transaction history (own only). Deposits and withdrawals with dates. |

---

## Key Decisions (Easy to Miss)

1. **`fixed` and `dynamic` are mathematically identical** in current code (Ground Truth §0.3). Phase 3.5 resolves this: collapse into one approach or document the distinction. Fold-in from Row 168 (SCOPE-3.F31).

2. **Dead enum values** `hourly` and `financial_approval` may be unused — check and clean during RPC rewrite (Row 168).

3. **Extra credit per pool.** The `is_extra_credit` flag on tasks adds to numerator without adding to denominator. Under multi-pool, extra credit is per-pool via `allowance_godmother_configs.is_extra_credit` (already scoped by pool_name).

4. **Grace days are per-period, not per-pool.** A grace day applies across all pools for that child (day excluded from all denominators). The per-day mode (full_exclude / numerator_keep, NEW-TT) is preserved.

5. **Retroactive grace-day recalc** (Row 193 / NEW-MM) folds in. Low risk — one family, one-two completed cycles, effectively test data. The multi-pool period-close rewrite creates a natural place for the recalc path. Uses the same recalculate mechanism as Amendment 1 below.

6. **Payout contract = Option A with recalculate support (Amendment 1).** At period close, the system computes the weighted combination of all pool percentages into a single combined percentage, stores it as the official record, and generates the payout transaction from it. This locks at close time. Recalculate: when mom navigates to a past period and taps recalculate, the system re-runs the combination math, compares to the stored combined percentage, and writes an adjustment `financial_transaction` (positive or negative) to reconcile. No UPDATE, no DELETE — append-only per Convention #223. The ledger shows the original payout and any corrections as separate line items. This mechanism is shared with Row 193 (grace-day recalc) — both produce adjustment transactions through the same path.

7. **Existing recalculate path must be investigated before multi-pool extension (Amendment 2).** Before building multi-pool period-close, investigate the current single-pool recalculate button: Does it actually recompute? Does it write an adjustment or UPDATE the existing record? Does it handle the case where payment was already made? If broken or violates append-only, fix the foundation first. Flag findings before proceeding — if the fix is larger than expected, scope explicitly.

8. **numerator_godmother is the shared-routine-to-pool connector.** Founder's use case: shared house jobs routine → `numerator_godmother` → adds to specific kid's chores pool numerator without touching denominator. The `family_member_id` in deed metadata credits the actual completer.

9. **Partial payment already built.** `PaymentModal` in `src/features/financial/FinancialModals.tsx` has full/partial radio, amount field, note field. But `PrizeBoard.tsx:407-418` bypasses it with a hardcoded full-balance call. Fix: wire Pay button to open the modal.

10. **Ledger view already partially exists.** Balance tab has expandable `TransactionRow` list (20 items, mom-only). Enhancement: full chronological ledger with running balance column, per-pool source tagging, kid-visible version.

11. **`allowance_godmother` only accepts `task_completion` and `routine_step_completion`** source types. If pools should accept other deed sources (e.g., `list_item_completion`), the godmother function needs extending.

12. **Pool weighting default is linear weighted average.** Alternative formulas deferred.

13. **Overage cap replaces the hardcoded 100% cap.** `allowance_configs.overage_cap DECIMAL DEFAULT 100`. RPC uses `LEAST(numerator/denominator * 100, overage_cap)`. Mom opts in by setting >100 (e.g., 150 = allow up to 150%). Default 100 = today's behavior. One field, no separate toggle — the number IS the toggle.

14. **On-demand daily floor uses `above_daily_floor` IF pattern (already shipped in Phase 3).** Two contracts on the same source: Contract A (`every_time` → `allowance_godmother`) counts all completions normally. Contract B (`above_daily_floor(N)` → `numerator_godmother`) fires only on the (N+1)th completion per day, adding extra numerator boost. First N are required; extras are rewarded more. No schema changes needed — this is contract configuration.

15. **`combined_percentage` lives on `allowance_periods` only, NOT on `allowance_configs`.** Per claude.ai review: config = rulebook (how things should work), periods = report card (what happened). The combined percentage is a "what happened" value — it locks at close time per period. Putting it on the config would overwrite every period close, losing history.

---

## Addendum Rulings

### From PRD-28-Cross-PRD-Impact-Addendum.md:
- `child_can_see_finances` on `allowance_configs` controls whether children see dollar amounts or percentage only — this applies per-pool under multi-pool.
- Play mode override: regardless of toggle, Play children ALWAYS see percentage only.
- Financial data excluded from LiLa context assembly (Convention #225) — unchanged.

### From TRIAGE_WORKSHEET.md fold-ins:
- **Row 168 (SCOPE-3.F31):** Dead enum cleanup (`hourly`, `financial_approval`) + `fixed` vs `dynamic` resolution during RPC rewrite.
- **Row 193 (NEW-MM):** Retroactive grace-day recalc on past calculated periods. Low risk — one family, test data.
- **Row 203 (NEW-XX):** Money-source breakdown on widget. Falls out of multi-pool work naturally — per-pool breakdown IS the money-source differentiator.

---

## Database Changes Required

### Modified Tables

**`allowance_configs`** — becomes per-(kid, pool):
- ADD `pool_name TEXT NOT NULL DEFAULT 'default'`
- ADD `pool_type TEXT NOT NULL DEFAULT 'percentage_pool'` CHECK `('percentage_pool', 'goal_pool')`
- ADD `payout_mode TEXT NOT NULL DEFAULT 'weekly'` CHECK `('weekly', 'biweekly', 'monthly', 'term', 'event_driven', 'measurement_only')`
- ADD `pool_status TEXT NOT NULL DEFAULT 'active'` CHECK `('active', 'paused', 'archived')`
- ADD `pool_weight DECIMAL DEFAULT 1.0`
- ADD `pool_owner_member_id UUID` (schema-only for self-managed pools)
- ADD `term_start_date DATE`
- ADD `term_end_date DATE`
- ADD `close_on_event_source_type TEXT`
- ADD `close_on_event_source_id UUID`
- ADD `overage_cap DECIMAL NOT NULL DEFAULT 100` — 100 = no overage (cap at 100%, today's behavior). Values >100 allow the pool to exceed 100% up to the cap. RPC uses `LEAST(numerator/denominator * 100, overage_cap)`.
- Existing rows migrate to `pool_name='default'`, preserving all existing values
- UNIQUE constraint changes from `(family_member_id)` to `(family_member_id, pool_name)`

**`allowance_periods`** — becomes per-(kid, pool, period):
- ADD `pool_name TEXT NOT NULL DEFAULT 'default'`
- ADD `combined_percentage DECIMAL` — nullable, stores the official weighted combination result at close time (Amendment 1). Single source of truth for "what was calculated." NOT on `allowance_configs` — that's the rulebook, not the report card.
- Existing rows get `pool_name='default'`
- Indexes rebuilt per pool key

**`tasks`** — pool affiliation:
- ADD `pool_id UUID` FK to `allowance_configs.id` (nullable — tasks without pool assignment use default pool routing)

**`financial_transactions`** — pool source tracking:
- ADD `pool_name TEXT` (nullable — records which pool generated the transaction)

### New Tables
- None required — existing tables extend cleanly.

### Migrations
- `00000000100234_multi_pool_allowance.sql` — schema changes + data migration + RPC rewrite + index rebuilds

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `tracking_allowance` | Essential | parents, member | Already registered — multi-pool is an enhancement |
| `tracking_allowance_multi_pool` | Enhanced | parents | New — gates multi-pool config UI |

---

## Stubs — Do NOT Build This Phase

- [ ] Goal-based pool implementation (`pool_type='goal_pool'` — schema permits, UX deferred)
- [ ] Self-managed pool UX (pool ownership by teens/adults — schema permits, UX deferred)
- [ ] Wizards for pool configuration (Phase 3.7+ scope)
- [ ] LiLa-driven pool authoring (post-Gate-2)
- [ ] Cross-family pool sharing / community templates
- [ ] Alternative weighting formulas (geometric mean, weighted median)
- [ ] Term-length pool calendar templates (manual date entry ships; calendar templates deferred)
- [ ] Offline financial ledger (PRD-33)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Multi-pool allowance | ← reads | Connector Layer (Phase 3) | `contract_grant_log` entries from `allowance_godmother` and `numerator_godmother` |
| Multi-pool allowance | ← reads | Tasks / Routines | `tasks.counts_for_allowance`, `routine_step_completions` |
| Multi-pool allowance | → writes | `financial_transactions` | Period-close payouts, per-pool |
| Multi-pool allowance | → writes | `allowance_periods` | Per-pool period records |
| Ledger view | ← reads | `financial_transactions` | All transaction types for display |
| Ledger view | → | Kid dashboard | Kid-visible read-only version (own only) |
| Widget breakdown | ← reads | Per-pool progress RPC | Money-source differentiation |
| PaymentModal | → writes | `financial_transactions` | Partial/full payment records |

---

## Things That Connect Back to This Feature Later

- **Points categorization (NEW-YY):** Points-as-pools may follow the same multi-pool architecture pattern
- **PRD-24 reward economy (SCOPE-2.F58):** Reward redemption may interact with pool balances
- **PRD-28B compliance reporting:** Per-pool data feeds into compliance report generation
- **Phase 3.7 wizards:** "Set Up Allowance for Mosiah" wizard wraps pool configuration

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> To be completed after build.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
