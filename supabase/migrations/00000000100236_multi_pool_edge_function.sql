-- ============================================================================
-- Phase 3.5 Worker C — Edge Function + Cross-Pool Logic Support
--
-- 1. Add 'pool_contribution' to financial_transactions transaction_type CHECK
-- 2. Add 'multi_pool_threshold' to contracts if_pattern CHECK
-- ============================================================================


-- ============================================================================
-- 1. Extend financial_transactions CHECK for pool_contribution
--    pool_contribution rows are informational (amount = 0) — they record
--    which pool contributed what percentage to the combined payout.
-- ============================================================================

ALTER TABLE public.financial_transactions
  DROP CONSTRAINT IF EXISTS financial_transactions_transaction_type_check;

ALTER TABLE public.financial_transactions
  ADD CONSTRAINT financial_transactions_transaction_type_check
  CHECK (transaction_type = ANY (ARRAY[
    'allowance_earned', 'opportunity_earned', 'payment_made',
    'purchase_deduction', 'loan_issued', 'loan_repayment',
    'interest_accrued', 'adjustment', 'contract_grant',
    'pool_contribution'
  ]));


-- ============================================================================
-- 2. Extend contracts if_pattern CHECK for multi_pool_threshold
--    Used by period-close penalty/multiplier contracts. These contracts are
--    evaluated by the calculate-allowance-period Edge Function at period close,
--    NOT by the deed-firing dispatch pipeline. They use stroke_of='end_of_period'
--    and payload_config JSONB for penalty configuration:
--      { "adjustment_type": "multiplicative" | "additive",
--        "rate": 0.2,
--        "conditions": [{"pool": "school", "operator": "lt", "threshold": 70}] }
-- ============================================================================

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_if_pattern_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_if_pattern_check
  CHECK (if_pattern IN (
    'every_time',
    'every_nth',
    'on_threshold_cross',
    'above_daily_floor',
    'above_window_floor',
    'within_date_range',
    'streak',
    'calendar',
    'multi_pool_threshold'
  ));


-- ============================================================================
-- Verification
-- ============================================================================

DO $$ BEGIN
  RAISE NOTICE 'migration 100236: multi-pool edge function support complete';
  RAISE NOTICE '  pool_contribution in transaction_type CHECK: %',
    EXISTS (
      SELECT 1 FROM information_schema.check_constraints
      WHERE constraint_name = 'financial_transactions_transaction_type_check'
    );
  RAISE NOTICE '  multi_pool_threshold in if_pattern CHECK: %',
    EXISTS (
      SELECT 1 FROM information_schema.check_constraints
      WHERE constraint_name = 'contracts_if_pattern_check'
    );
END $$;
