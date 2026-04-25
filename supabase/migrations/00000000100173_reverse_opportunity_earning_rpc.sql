-- Worker B1b / NEW-HH — Unmark / rollback cascade for opportunity earnings.
--
-- PRD-28 L991 (authoritative): when mom unmarks a task completion, the
-- system MUST update the active allowance_periods running count AND
-- reverse any opportunity_earned transaction by creating a NEGATIVE
-- adjustment transaction. Append-only ledger preserved (Convention #223
-- — never UPDATE, never DELETE; reversals are new records).
--
-- Scope per orchestrator 2026-04-24 (Option A — strict NEW-HH): wire
-- the reversal hook only. The forward write (opportunity completion ->
-- opportunity_earned transaction) is not in B1b scope; the reversal
-- becomes correctly active the moment that forward path lands. Today
-- the RPC is a no-op against the typical case (no forward rows exist),
-- which is the desired safe-by-default behavior.
--
-- Allowance recount on unmark: NOT done via direct write. The
-- calculate_allowance_progress RPC recomputes effective tally on every
-- read against `tasks` + `task_completions` + `routine_step_completions`,
-- so once those rows are removed/reset by useUncompleteTask, the next
-- live widget read returns the correct value automatically. The
-- allowance_periods.tasks_completed snapshot column is recomputed at
-- next period close. Per NEW-HH triage row text: "tolerable for live
-- widget since RPC recomputes."
--
-- ── Idempotency ──────────────────────────────────────────────────
--
-- Reversal must be idempotent: re-firing on the same task_completions.id
-- (e.g. mom undoes-undoes-undoes) must not produce duplicate negative
-- adjustments. Enforced via a partial unique index on
-- financial_transactions.metadata->>'reversed_completion_id' for rows
-- with transaction_type='adjustment' AND a non-null reversed_completion_id.
-- Re-fire returns NULL with status='already_reversed' instead of insert.
--
-- ── Forward-write detection ──────────────────────────────────────
--
-- The RPC looks up the prior forward transaction by:
--   transaction_type='opportunity_earned'
--   AND source_type='task_completion'
--   AND source_reference_id = p_completion_id
-- This convention matches the Build O acceptance criterion (PRD-28
-- L1070). When the forward path is built, it must populate
-- source_reference_id with the task_completions.id for this RPC to
-- find a row to reverse.

-- 1. Idempotency index (partial — only active reversal adjustments).
CREATE UNIQUE INDEX IF NOT EXISTS uq_financial_transactions_reversal_per_completion
  ON public.financial_transactions ((metadata->>'reversed_completion_id'))
  WHERE transaction_type = 'adjustment'
    AND metadata ? 'reversed_completion_id';

COMMENT ON INDEX public.uq_financial_transactions_reversal_per_completion IS
  'NEW-HH idempotency: at most one reversal adjustment per task_completion. Enforces idempotency on reverse_opportunity_earning RPC.';

-- 2. The reversal RPC.
CREATE OR REPLACE FUNCTION public.reverse_opportunity_earning(
  p_completion_id UUID
)
RETURNS TABLE (
  status TEXT,
  reversal_id UUID,
  reversed_amount DECIMAL,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completion RECORD;
  v_forward RECORD;
  v_existing_reversal_id UUID;
  v_member_family UUID;
  v_authorized BOOLEAN := FALSE;
  v_current_balance DECIMAL(10, 2);
  v_new_balance DECIMAL(10, 2);
  v_reversal_id UUID;
BEGIN
  -- Authorization: caller must be in the same family as the completion.
  SELECT tc.family_member_id, fm.family_id
  INTO v_completion
  FROM public.task_completions tc
  JOIN public.family_members fm ON fm.id = tc.family_member_id
  WHERE tc.id = p_completion_id;

  IF NOT FOUND THEN
    -- Completion may have already been hard-deleted by useUncompleteTask
    -- before this RPC is invoked (the caller deletes first, then calls
    -- this). In that case, look up the family via the original forward
    -- transaction's family_id below.
    v_member_family := NULL;
  ELSE
    v_member_family := v_completion.family_id;
  END IF;

  -- Find the forward transaction (if any). source_reference_id is the
  -- canonical link from financial_transactions back to task_completions.
  SELECT *
  INTO v_forward
  FROM public.financial_transactions
  WHERE source_reference_id = p_completion_id
    AND transaction_type = 'opportunity_earned'
  ORDER BY created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    -- No forward transaction = nothing to reverse. This is the typical
    -- case in the current codebase (forward write isn't built yet).
    RETURN QUERY SELECT
      'no_forward_transaction'::TEXT,
      NULL::UUID,
      0::DECIMAL,
      'No opportunity_earned transaction found for this completion. Nothing to reverse.'::TEXT;
    RETURN;
  END IF;

  -- Resolve family_id from the forward transaction if completion lookup
  -- failed (e.g. completion was hard-deleted before this call).
  IF v_member_family IS NULL THEN
    v_member_family := v_forward.family_id;
  END IF;

  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.family_members caller
      WHERE caller.family_id = v_member_family
        AND caller.user_id = auth.uid()
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized to reverse this transaction';
  END IF;

  -- Idempotency check: existing reversal?
  SELECT id INTO v_existing_reversal_id
  FROM public.financial_transactions
  WHERE transaction_type = 'adjustment'
    AND metadata->>'reversed_completion_id' = p_completion_id::TEXT
  LIMIT 1;

  IF v_existing_reversal_id IS NOT NULL THEN
    RETURN QUERY SELECT
      'already_reversed'::TEXT,
      v_existing_reversal_id,
      0::DECIMAL,
      'This completion was already reversed. No-op.'::TEXT;
    RETURN;
  END IF;

  -- Compute new balance after reversal.
  SELECT COALESCE(SUM(amount), 0)
  INTO v_current_balance
  FROM public.financial_transactions
  WHERE family_member_id = v_forward.family_member_id;

  v_new_balance := v_current_balance + (-1 * v_forward.amount);

  -- Insert the reversal as an adjustment (append-only).
  INSERT INTO public.financial_transactions (
    family_id,
    family_member_id,
    transaction_type,
    amount,
    balance_after,
    description,
    source_type,
    source_reference_id,
    category,
    metadata
  )
  VALUES (
    v_forward.family_id,
    v_forward.family_member_id,
    'adjustment',
    -1 * v_forward.amount,
    v_new_balance,
    'Reversal: ' || v_forward.description,
    'task_completion_unmark',
    p_completion_id,
    v_forward.category,
    jsonb_build_object(
      'reversed_completion_id', p_completion_id::TEXT,
      'reversed_transaction_id', v_forward.id::TEXT,
      'reason', 'unmark_cascade',
      'reversed_at', NOW()
    )
  )
  RETURNING id INTO v_reversal_id;

  RETURN QUERY SELECT
    'reversed'::TEXT,
    v_reversal_id,
    (-1 * v_forward.amount)::DECIMAL,
    ('Reversed $' || v_forward.amount::TEXT || ' opportunity earning.')::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reverse_opportunity_earning(UUID)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.reverse_opportunity_earning(UUID) IS
  'Worker B1b / NEW-HH. Idempotent reversal of an opportunity_earned financial transaction by inserting a negative adjustment row. Append-only ledger preserved (Convention #223). Returns status=reversed | already_reversed | no_forward_transaction. Called from useUncompleteTask after the task_completions row is deleted. Today the typical return value is no_forward_transaction since the forward write path (opportunity completion -> opportunity_earned row) is not yet built; this RPC becomes correctly active the moment that lands.';
