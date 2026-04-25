-- Worker ALLOWANCE-COMPLETE / NEW-NN — forward-write idempotency.
--
-- PRD-28 L933 + L1043 + L1070: "When an opportunity task with monetary
-- reward is completed, PRD-28 creates an opportunity_earned financial
-- transaction." This forward path was not built in B1b. Row 194
-- (NEW-NN) ships it.
--
-- Shape contract (per migration 100173 reverse RPC lines 35-43):
--   transaction_type='opportunity_earned'
--   source_type='task_completion'
--   source_reference_id = task_completions.id
--
-- Idempotency rule: AT MOST ONE opportunity_earned transaction per
-- task_completions.id. Enforced here via a partial unique index on
-- source_reference_id for rows where transaction_type='opportunity_earned'
-- AND source_reference_id IS NOT NULL. A retry from the frontend after
-- a transient error will attempt to INSERT a second row and get a
-- unique-violation — which the caller swallows as "already awarded"
-- (same pattern as gamification pipeline awarded_source_id).
--
-- Why a partial unique index here (not just a UNIQUE column):
-- source_reference_id is polymorphic across transaction_type values
-- (loan_issued, allowance_earned, etc.), and we only want uniqueness
-- within the opportunity_earned slice. Partial index matches exactly
-- that semantic.
--
-- NOTE on reversal coexistence: migration 100173 created a similar
-- partial index on metadata->>'reversed_completion_id' WHERE
-- transaction_type='adjustment'. The two indexes are orthogonal and
-- coexist cleanly — forward lives on source_reference_id, reversal
-- lives on metadata. A single completion can have one forward row
-- (this index) AND one reversal row (100173 index) as the append-only
-- ledger shape requires.

CREATE UNIQUE INDEX IF NOT EXISTS uq_financial_transactions_forward_per_completion
  ON public.financial_transactions (source_reference_id)
  WHERE transaction_type = 'opportunity_earned'
    AND source_reference_id IS NOT NULL;

COMMENT ON INDEX public.uq_financial_transactions_forward_per_completion IS
  'NEW-NN idempotency: at most one opportunity_earned transaction per task_completion. Paired with uq_financial_transactions_reversal_per_completion (migration 100173) for reversal idempotency. Together these enforce the append-only ledger invariant: one forward row + at most one reversal row per completion.';

-- Verification
DO $$ BEGIN
  RAISE NOTICE 'migration 100174: forward-write idempotency index created';
  RAISE NOTICE '  uq_financial_transactions_forward_per_completion: %', (
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'financial_transactions'
      AND indexname = 'uq_financial_transactions_forward_per_completion'
  );
END $$;
