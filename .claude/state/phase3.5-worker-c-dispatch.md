# Phase 3.5 Worker C — Edge Function + Cross-Pool Logic

## Context

You are Worker C for Phase 3.5 (Multi-Pool Allowance). Workers A and B2 are complete:
- **Worker A** (migration 100234): Schema changes — `allowance_configs` has pool columns, `allowance_periods` has `pool_name` + `combined_percentage`, `tasks` has `pool_id`, `financial_transactions` has `pool_name`.
- **Worker B2** (migration 100235): RPC rewrite — `calculate_allowance_progress` accepts `p_pool_name`, `get_pool_progress` thin wrapper, `calculate_weighted_combination` returns combined percentage + pool_details JSONB, `execute_numerator_godmother` records `pool_name` in metadata, recalculate integrity bug fixed, `fixed` collapsed into `dynamic`.

You update the Edge Function to use these new RPCs for per-pool period close, and build the cross-pool penalty/multiplier logic.

**Read these files before writing any code:**
- `.claude/rules/current-builds/phase-3.5-multi-pool-allowance.md` — active build file (full scope, key decisions 1-18)
- `claude/feature-decisions/PRD-28-Phase-3.5-Multi-Pool-Allowance.md` — feature decision file
- `claude/web-sync/Connector-Build-Plan-2026-04-26.md` §7.2 sub-tasks 10-11 — Edge Function + penalty/multiplier spec
- `supabase/functions/calculate-allowance-period/index.ts` — the current Edge Function (read ALL of it)
- `supabase/migrations/00000000100235_multi_pool_rpc_rewrite.sql` — the new RPCs you'll be calling

## Deliverables

### Task 1: Update `calculate-allowance-period` Edge Function for per-pool period close

**Current behavior (single-pool):**
1. Load all families → check local timezone → find active periods past period_end
2. For each period: load config → check calculation_time window → call `calculate_allowance_progress` RPC → close period → write `allowance_earned` transaction → handle loan auto-deduct → open next period

**New behavior (multi-pool):**
1. Same family/timezone loop
2. For each family member with active periods:
   a. Load ALL `allowance_configs` for this member WHERE `pool_status = 'active'` AND `enabled = true`
   b. For EACH pool config, find the matching `allowance_periods` row (keyed by `family_member_id` + `pool_name` + `status = 'active'`)
   c. Check `calculation_time` window per config (existing logic, no change)
   d. Check `payout_mode` to determine if this period is ready to close:
      - `weekly` / `biweekly` / `monthly`: close when `period_end < localDateStr` (existing logic)
      - `term`: close when `term_end_date < localDateStr` (new — read from config)
      - `event_driven`: do NOT close on time — these close via a separate event trigger (stub the check, log skip)
      - `measurement_only`: close on the same schedule as payout pools, but do NOT write a financial transaction
   e. Call `calculate_allowance_progress` with `p_pool_name` for each pool
   f. Close each pool's period row individually (same UPDATE pattern, now with `pool_name` in the write)
   g. **After ALL pools for this member are closed**, call `calculate_weighted_combination` to get the combined percentage
   h. Store `combined_percentage` on each pool's period row (or on a single "combined" period row — see design choice below)
   i. Write ONE `allowance_earned` financial transaction for the combined payout amount, with `pool_name = NULL` (it's the combined total, not a single pool)
   j. Include `pool_name` in per-pool audit data within `calculation_details` JSONB
   k. Loan auto-deduct logic stays the same — deducts from the combined payout

**Design choice on combined_percentage storage:**
The `combined_percentage` column is on `allowance_periods`. Two options:
- (a) Write it on EVERY pool's period row (redundant but every row has the answer)
- (b) Write it only on the `'default'` pool's period row (or create a synthetic "combined" row)

**Recommend option (a)** — it's simpler and avoids "which row do I look at?" ambiguity. The value is the same across all pools for the same member+period.

**Per-pool financial transactions (in addition to combined payout):**
For each non-measurement-only pool, ALSO write a `pool_contribution` financial transaction:
- `transaction_type: 'pool_contribution'` (new type — informational, not balance-affecting)
- `pool_name`: the pool's name
- `amount: 0` (these are informational — they show the percentage, not a separate payout)
- `description: 'Chores pool: 94% (weight 0.7)' ` or similar
- `metadata: { pool_percentage, pool_weight, contribution_to_combined }`

This gives the ledger the per-pool breakdown without creating multiple actual payouts. The REAL money is in the single `allowance_earned` row for the combined amount.

### Task 2: Penalty / multiplier application logic (cross-pool conditions)

**Where this runs:** AFTER all pools are calculated but BEFORE the `allowance_earned` transaction is written.

**How cross-pool conditions work in the connector layer:**
Contracts with `if_pattern = 'multi_pool_threshold'` have IF qualifiers that read live progress from other pools. These contracts evaluate at DEED FIRING time (synchronous, during `dispatch_godmothers`). But penalty/multiplier conditions need to evaluate at PERIOD CLOSE time — they modify the base payout, not individual deed events.

**Implementation approach:**
After `calculate_weighted_combination` returns the combined percentage:
1. Query `contracts` for this member's active penalty/multiplier contracts (identify by a new `stroke_of = 'period_close'` or by `godmother_type = 'allowance_penalty'` — decide which fits the existing architecture better)
2. For each matching contract, evaluate its `multi_pool_threshold` IF condition against the just-computed pool percentages
3. If the condition fires, apply the penalty/multiplier to the combined payout amount:
   - Multiplicative: `combined_amount *= (1 - penalty_rate)` — e.g., school below 70% → 20% penalty on chore allowance
   - Additive: `combined_amount += bonus_amount` — e.g., both pools ≥ 85% → +$5
4. Record the penalty/multiplier in `calculation_details.cross_pool_adjustments` JSONB array

**Important:** Bonus contracts that fire at deed time (e.g., `money_godmother` contracts with `multi_pool_threshold` IF) already write their own `financial_transactions` rows via the connector layer. Period-close penalties/multipliers are a DIFFERENT code path — they modify the base payout, not add separate transactions.

**If the penalty/multiplier architecture doesn't fit cleanly into the existing connector layer (contracts + godmothers), implement it as a dedicated section in the Edge Function rather than forcing it through contracts.** The goal is correct financial math, not architectural purity. Flag to founder if you deviate from the contract-based approach.

### Task 3: Retroactive grace-day recalc (Row 193 — verification only)

Worker B2 fixed the recalculate integrity bug (adjustment transactions now work). The retroactive grace-day recalc path should now work automatically:
1. Mom edits grace days on a past `calculated` period
2. Mom taps "Recalculate" 
3. The fixed `handleRecalculate` re-runs the RPC, computes delta, writes adjustment transaction

**Your task:** Verify this works end-to-end in the per-pool context. Specifically:
- Grace days apply across ALL pools for that kid (Key Decision 2)
- Recalculate on a multi-pool period re-runs each pool AND the weighted combination
- The adjustment transaction reflects the combined delta

If the recalculate path in `RoutineWeekEditPage.tsx` needs to be extended for multi-pool (currently calls single-pool RPC), note the gap and what Worker D needs to handle on the frontend.

## Migration

If you need schema changes (e.g., new `transaction_type` CHECK value for `'pool_contribution'`), write as `00000000100236_multi_pool_edge_function.sql`.

## Edge Function Deployment Note

The updated Edge Function must be deployed with `--no-verify-jwt` per Convention #246 (it's cron-invoked via service role key, not JWT). Do NOT change the cron schedule — it still runs hourly at `:10`.

## Verification

- `tsc -b` must pass with zero errors
- The Edge Function should handle a family with:
  - Kid A: 2 pools (chores weekly, school measurement_only) — chores pays out, school tracked but no payout
  - Kid B: 1 pool (default) — backward compatible, identical to pre-multi-pool behavior
  - Kid C: no allowance config — skipped entirely
- Measurement-only pools close their period (record percentage) but write NO financial transaction
- The combined `allowance_earned` transaction amount should match the weighted combination math
- Per-pool `pool_contribution` informational transactions appear in the ledger (if implemented)
- Loan auto-deduct still works (deducts from combined payout)

## What NOT To Do

- Do not modify frontend components (Worker D scope)
- Do not modify the RPCs (Worker B2 already shipped those)
- Do not build pool lifecycle UI (Worker D scope)
- Do not build the ledger view (Worker D scope)
- Do not build the negative-recalculate mom-choice prompt (Worker D scope — Key Decision 16)
