# Phase 3.5 Worker A — Schema + Migration

## Context

You are Worker A for Phase 3.5 (Multi-Pool Allowance). This phase restructures the allowance system from a single ratio per child to per-pool ratios with independent configurations.

**Read these files before writing any code:**
- `.claude/rules/current-builds/phase-3.5-multi-pool-allowance.md` — active build file (full scope, worker plan, key decisions)
- `claude/feature-decisions/PRD-28-Phase-3.5-Multi-Pool-Allowance.md` — feature decision file (schema changes, stubs, cross-feature connections)
- `claude/web-sync/Connector-Build-Plan-2026-04-26.md` §7.1–7.3 — primary spec (14 capabilities, sub-task detail)
- `claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md` §0.1–0.4 — forensic breakdown of current allowance math

**Read for live schema reference:**
- `claude/live_schema.md` — current database schema (search for `allowance_configs`, `allowance_periods`, `financial_transactions`)

## Your Deliverables

Write migration `00000000100234_multi_pool_allowance.sql` that does ALL of the following:

### 1. Extend `allowance_configs` to per-(kid, pool)

Current state: one row per kid, keyed by `family_member_id` (UNIQUE constraint).

Add columns:
- `pool_name TEXT NOT NULL DEFAULT 'default'`
- `pool_type TEXT NOT NULL DEFAULT 'percentage_pool'` — CHECK `IN ('percentage_pool', 'goal_pool')`
- `payout_mode TEXT NOT NULL DEFAULT 'weekly'` — CHECK `IN ('weekly', 'biweekly', 'monthly', 'term', 'event_driven', 'measurement_only')`
- `pool_status TEXT NOT NULL DEFAULT 'active'` — CHECK `IN ('active', 'paused', 'archived')`
- `pool_weight DECIMAL DEFAULT 1.0`
- `pool_owner_member_id UUID REFERENCES family_members(id)` — nullable, schema-only for future self-managed pools
- `term_start_date DATE` — nullable, for term-length pools
- `term_end_date DATE` — nullable, for term-length pools
- `close_on_event_source_type TEXT` — nullable, for event-driven pools
- `close_on_event_source_id UUID` — nullable, for event-driven pools
- `overage_cap DECIMAL NOT NULL DEFAULT 100` — 100 = no overage (today's behavior, cap at 100%). Values >100 allow the pool to exceed 100% up to the configured cap. E.g., 150 means the pool can reach 150% maximum. The RPC uses `LEAST(numerator/denominator * 100, overage_cap)` instead of `LEAST(..., 100)`.

NOTE: `combined_percentage` does NOT go on this table. It belongs only on `allowance_periods` (the report card, not the rulebook). See Amendment 1 clarification from claude.ai review.

Drop the existing UNIQUE on `(family_member_id)` and replace with UNIQUE on `(family_member_id, pool_name)`.

Existing rows all get `pool_name='default'`, preserving every existing value. No data loss.

### 2. Extend `allowance_periods` to per-(kid, pool, period)

Add columns:
- `pool_name TEXT NOT NULL DEFAULT 'default'`
- `combined_percentage DECIMAL` — nullable, stores the official weighted combination result at close time (Amendment 1). This is the single source of truth for "what was calculated" for this period. Each closed period keeps its own value forever. Recalculate compares against this to produce adjustment transactions.

Existing rows get `pool_name='default'`.

Rebuild indexes to include `pool_name` where relevant. The existing `(family_member_id, period_start, period_end)` pattern likely needs `pool_name` added.

### 3. Per-task pool assignment

Add to `tasks`:
- `pool_id UUID REFERENCES allowance_configs(id)` — nullable. Tasks without pool assignment use default pool routing at calculation time.

### 4. Pool source tracking on transactions

Add to `financial_transactions`:
- `pool_name TEXT` — nullable. Records which pool generated the transaction. Existing rows stay NULL (pre-multi-pool era).

### 5. RLS

All new columns on existing tables inherit existing RLS policies — no new policies needed since the rows are already family-scoped. Verify that existing RLS on `allowance_configs` handles the new UNIQUE constraint correctly (the old policy was probably `family_id`-scoped SELECT + member-scoped INSERT/UPDATE).

### 6. Data migration verification

After migrating existing rows to `pool_name='default'`, add a verification step:
```sql
DO $$ 
DECLARE v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count FROM allowance_configs WHERE pool_name != 'default';
  IF v_count > 0 THEN RAISE EXCEPTION 'Migration error: % rows have non-default pool_name', v_count; END IF;
END $$;
```

### 7. Feature keys

Register in `feature_key_registry`:
- `tracking_allowance_multi_pool` — "Multi-pool allowance configuration" — PRD-28

### Important Constraints

- Migration MUST be idempotent (use `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, etc.)
- Do NOT modify any existing RPC functions — Worker B2 handles the RPC rewrite
- Do NOT modify any Edge Functions — Worker C handles those
- Do NOT modify any frontend files — Worker D handles those
- Do NOT create new tables — all changes are column additions to existing tables
- Convention #223: `financial_transactions` is append-only (INSERT-only RLS)
- The `combined_percentage` column on both `allowance_configs` and `allowance_periods` is the storage location for Amendment 1's "lock at close time" behavior — Workers B2/C will write to it

### TypeScript Types

After the migration, update `src/types/financial.ts` to add the new fields to:
- `AllowanceConfig` interface — add all new pool-related fields: `pool_name`, `pool_type`, `payout_mode`, `pool_status`, `pool_weight`, `pool_owner_member_id`, `term_start_date`, `term_end_date`, `close_on_event_source_type`, `close_on_event_source_id`, `overage_cap`
- `AllowancePeriod` interface — add `pool_name`, `combined_percentage`
- `FinancialTransaction` interface — add `pool_name`

Also add a new `AllowancePool` type alias or interface if it helps organize the pool-specific fields.

### Note on `above_daily_floor` Pattern

The `above_daily_floor` IF pattern already exists in the Phase 3 dispatcher (`dispatch_godmothers`, migration 100207). It counts deeds for the same source_type on the same calendar day and fires only when the count exceeds the floor. No schema changes needed for this pattern — it's a contract configuration concern (Worker B2/D scope), not a schema concern. Worker A does NOT need to do anything for this.

### Verification

- `tsc -b` must pass with zero errors after type updates
- Migration must apply cleanly against the current production schema
- All existing `allowance_configs` rows must have `pool_name='default'` after migration
- All existing `allowance_periods` rows must have `pool_name='default'` after migration
- No existing data should change value — only new columns added with defaults

## What NOT To Do

- Do not write frontend components
- Do not rewrite RPCs
- Do not modify Edge Functions
- Do not create the recalculate path (that's Worker B2/C scope)
- Do not build pool configuration UI
- Do not build the ledger view
