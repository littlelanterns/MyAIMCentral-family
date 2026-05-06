# Phase 3.5 Worker B2 — RPC Rewrite + Fold-ins

## Context

You are Worker B2 for Phase 3.5 (Multi-Pool Allowance). Worker A shipped migration 100234 (schema changes). Worker B1 investigated the existing recalculate path and found a financial integrity bug. You fix that bug first, then rewrite the RPC for multi-pool.

**Read these files before writing any code:**
- `.claude/rules/current-builds/phase-3.5-multi-pool-allowance.md` — active build file (full scope, key decisions 1-15, worker plan)
- `claude/feature-decisions/PRD-28-Phase-3.5-Multi-Pool-Allowance.md` — feature decision file
- `claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md` §0.1–0.4 — forensic breakdown of current RPC math (numerator/denominator, routine steps, calculation approaches, extra credit)
- `claude/web-sync/Connector-Build-Plan-2026-04-26.md` §7.2 sub-tasks 6–9 — RPC rewrite spec

**Read for current RPC implementation:**
- `supabase/migrations/00000000100175_per_day_grace_mode.sql` — canonical 4-arg RPC (`calculate_allowance_progress`)
- `src/hooks/useFinancial.ts` — `useLiveAllowanceProgress`, `useCreateAdjustment`, `useAddGraceDay`, `useRemoveGraceDay`
- `src/pages/RoutineWeekEditPage.tsx` — `handleRecalculate()` (the broken recalculate path)

## Deliverables — In Order

### Task 1: Fix the recalculate integrity bug (FIRST — before anything else)

**Location:** `src/pages/RoutineWeekEditPage.tsx` — `handleRecalculate()` function.

**The bug (from B1 findings):** Recalculate updates `allowance_periods` columns (correct) but never writes a corrective `financial_transactions` adjustment entry. The `allowance_earned` transaction from period-close still has the old amount. Running balance becomes inconsistent.

**The fix:**
1. Before the `.update()` call, read the current `total_earned` from the period row
2. After the `.update()` succeeds with new computed values, compute `delta = new_total_earned - old_total_earned`
3. If `delta !== 0`, call the existing `useCreateAdjustment` pattern to insert an adjustment `financial_transaction` row:
   - `transaction_type: 'adjustment'`
   - `amount: delta` (positive if recalc increased earnings, negative if decreased)
   - `description`: something like "Allowance recalculation adjustment" 
   - `source_type: 'allowance_recalculation'`
   - `source_reference_id: period.id`
   - Compute correct `balance_after` from current running balance + delta
4. Convention #223: `financial_transactions` is append-only. INSERT only. No UPDATE, no DELETE.

**This fix also resolves Row 193 (NEW-MM — retroactive grace-day recalc).** Once the adjustment-transaction mechanism works, editing grace days and hitting recalculate naturally produces the correct financial adjustment. No separate work item.

**Verify the fix works:**
- Recalculate a period where grace days were added → delta should be positive (kid earned more because denominator shrank)
- Recalculate a period with no changes → delta should be 0, no adjustment transaction created
- Check that `useRunningBalance` RPC produces the correct total after the adjustment

### Task 2: Resolve `fixed` vs `dynamic` (Row 168 — SCOPE-3.F31)

**From Ground Truth §0.3:** `fixed` and `dynamic` are mathematically identical in current code. Only `points_weighted` branches differently.

**Decision to make:** Collapse `fixed` into `dynamic` (they produce identical results) or document the distinction. The spec says resolve during RPC rewrite.

**Recommended approach:** In the new per-pool RPC, support two calculation approaches: `dynamic` (default, today's behavior for both fixed and dynamic) and `points_weighted`. If any existing `allowance_configs` rows have `calculation_approach = 'fixed'`, migrate them to `'dynamic'` in the same migration. Remove the dead branch from the RPC.

**Dead enum check:** Search the codebase for `'hourly'` and `'financial_approval'` as enum values. If no consumers, note them as dead in the migration comments. Actual enum cleanup is a separate migration if CHECK constraints need updating.

### Task 3: Rewrite `calculate_allowance_progress` for per-pool

**Current state (migration 100175):** Single function, 4 args `(member_id, period_start, period_end, grace_days)`. Walks all tasks with `counts_for_allowance = true` for that member. Returns a 20-column result set.

**New state:** The RPC accepts a `pool_name` parameter. It filters tasks by pool affiliation:
- Tasks with `pool_id` pointing to an `allowance_configs` row with matching `pool_name` → counted in that pool
- Tasks with `pool_id IS NULL` → counted in the `'default'` pool (backward compatible)

**Per-pool accumulators:** `v_total_assigned`, `v_total_completed`, `v_total_points`, `v_completed_points` all become pool-scoped. The existing accumulation logic (routine step walking, DOW frequency filtering, grace day handling, pool_fraction calculation) stays the same — it just runs per pool.

**New parameter:** `p_pool_name TEXT DEFAULT 'default'`
**New return column:** `pool_name TEXT` in the RETURNS TABLE
**Overage cap:** Replace `LEAST(..., 100)` with `LEAST(..., v_overage_cap)` where `v_overage_cap` is read from `allowance_configs.overage_cap` for the matching pool.

**Numerator boost integration:** At the end of the per-pool calculation (after walking tasks), query `contract_grant_log` for entries where:
- `godmother_type = 'numerator'`
- `metadata->>'family_member_id' = p_member_id`
- `metadata->>'pool_name'` matches the current pool (this requires the numerator_godmother to record pool_name — see note below)
- The deed firing's `fired_at` falls within the period date range

For each matching entry, add `boost_weight` to the numerator. Do NOT add to the denominator.

**Note on numerator_godmother pool_name:** The current `execute_numerator_godmother` (migration 100208) does not record `pool_name` in its metadata. It records `boost_weight`, `source_type`, `source_id`, `family_member_id`. The pool_name needs to come from the contract's `godmother_config_id` → `allowance_godmother_configs.pool_name`. Either:
- (a) Update `execute_numerator_godmother` to read pool_name from the config and include it in metadata, OR
- (b) At period-close query time, join `contract_grant_log` → `contracts` → `allowance_godmother_configs` to resolve pool_name

Option (a) is cleaner — the metadata becomes self-contained. This means a small amendment to migration 100208 (CREATE OR REPLACE the function to also read config and include `pool_name` in the returned metadata). This is safe because the function is idempotent and the new metadata field is additive.

### Task 4: Cross-pool progress query infrastructure

**New RPC:** `get_pool_progress(p_member_id UUID, p_pool_name TEXT, p_period_start DATE, p_period_end DATE)`

Returns the current completion percentage for a specific pool. Used by:
- The `multi_pool_threshold` IF pattern in `dispatch_godmothers` to evaluate cross-pool conditions at deed-firing time
- The period-close Edge Function to compute weighted combinations
- The frontend widget to display per-pool breakdowns

This is a thin wrapper around `calculate_allowance_progress` that returns just the percentage (not the full 20-column result). Keep it lightweight — it will be called N times (once per pool) when cross-pool conditions evaluate.

### Task 5: Pool weighting evaluation

**New RPC or function:** `calculate_weighted_combination(p_member_id UUID, p_period_start DATE, p_period_end DATE)`

Reads all active pools for the member from `allowance_configs WHERE pool_status = 'active'`. For each pool, calls `calculate_allowance_progress` to get the pool's percentage. Applies `pool_weight` to each percentage. Returns the weighted combination.

Formula: `combined_pct = SUM(pool_pct * pool_weight) / SUM(pool_weight)` for all pools where `payout_mode != 'measurement_only'`.

Measurement-only pools are calculated (for cross-pool condition evaluation and display) but excluded from the weighted combination payout math.

The result is what gets stored in `allowance_periods.combined_percentage` at period close.

### Task 6: Update numerator_godmother to record pool_name

If you chose option (a) in Task 3, update `execute_numerator_godmother` to:
1. Read `godmother_config_id` from `p_payload`
2. If present, look up `allowance_godmother_configs` for `pool_name`
3. Include `pool_name` in the returned metadata JSONB

This is a `CREATE OR REPLACE FUNCTION` — idempotent, additive metadata field.

## Migration

Write as `00000000100235_multi_pool_rpc_rewrite.sql`. This migration:
- DROP + CREATE `calculate_allowance_progress` with the new `p_pool_name` parameter
- CREATE `get_pool_progress` (thin wrapper)
- CREATE `calculate_weighted_combination`
- UPDATE any `allowance_configs` rows with `calculation_approach = 'fixed'` to `'dynamic'` (Row 168)
- CREATE OR REPLACE `execute_numerator_godmother` with pool_name in metadata (if option a)

## Verification

- `tsc -b` must pass with zero errors
- Test the recalculate fix: verify that `financial_transactions` gets an adjustment row when recalculate changes the total
- Test per-pool RPC: call with `p_pool_name='default'` and verify results match the old single-pool RPC for existing data
- Test overage cap: verify that a pool with `overage_cap=150` allows percentages above 100%
- Test weighted combination: verify the math with 2+ pools at different weights

## What NOT To Do

- Do not modify frontend components (Worker D scope)
- Do not modify the Edge Function (Worker C scope)
- Do not build pool lifecycle UI (Worker D scope)
- Do not build the ledger view (Worker D scope)
- Do not create pool configuration UI (Worker D scope)
