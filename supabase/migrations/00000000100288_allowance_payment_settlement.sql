-- ============================================================================
-- ALLOWANCE-RECONCILIATION (2026-07-07) — payment ↔ period settlement
--
-- Root cause fixed by this migration + the paired client change: the platform
-- tracked "what mom owes" in TWO places — unpaid allowance_periods rows
-- (status='calculated', shown on the Prize Board Allowance tab) AND the
-- financial_transactions ledger (shown on the Balance tab) — but only ONE of
-- the three payment entry points (the Allowance tab's targeted "Paid" button)
-- updated both. Payments recorded from the Balance tab "Pay" button or the
-- Family Overview Finances "Pay All" left periods 'calculated' forever, so
-- the Allowance tab permanently overstated what was owed (found live:
-- Gideon $35.41, Helam $23.22 of already-paid periods still showing owed).
--
-- Two changes:
--
-- 1. settle_calculated_allowance_periods() — one server-side settlement
--    routine every payment path calls after recording a payment. Two modes:
--      explicit  (p_period_ids)      — Allowance tab: close exactly the
--                                      periods mom marked paid.
--      allocate  (p_allocate_amount) — Balance tab / FO Pay All: allocate the
--                                      paid amount against 'calculated'
--                                      periods oldest-first, closing every
--                                      period fully covered. $0.00-earned
--                                      periods always close (they are
--                                      unpayable dead rows otherwise — the
--                                      payment guard blocks $0 payments).
--    SECURITY DEFINER with an in-function permission check matching
--    Convention #274's "Mark Paid = contribute" ruling: primary_parent of the
--    kid's family, OR an additional_adult whose util.finance_grant_level for
--    the kid is contribute/manage. (The raw allowance_periods UPDATE policy
--    stays manage-only — settlement-after-payment is the one contribute-level
--    period write, and it only ever moves calculated → closed.)
--
-- 2. calculate_running_balance() rewritten from "balance_after of the newest
--    row by created_at" to SUM(amount). The old form was fragile: rows
--    written in the same millisecond tie nondeterministically (observed live
--    2026-07-07 on same-transaction inserts), and any writer that computes
--    balance_after from a stale read corrupts the reported balance forever.
--    SUM(amount) is order-independent and is the ground truth per Convention
--    #223 ("if SUM(amount) != latest balance_after, there is a data
--    integrity issue"). balance_after stays on every row as the per-row
--    audit trail; it just no longer defines the live balance. Verified at
--    migration time: SUM(amount) == latest balance_after for every member
--    (drift 0.00 across the board), so this is a behavioral no-op today.
--    pool_contribution rows carry amount=0, so no type exclusion is needed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Settlement RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.settle_calculated_allowance_periods(
  p_member_id UUID,
  p_period_ids UUID[] DEFAULT NULL,
  p_allocate_amount NUMERIC DEFAULT NULL
)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_kid_family UUID;
  v_is_authorized BOOLEAN := false;
  v_closed UUID[] := '{}';
  v_to_close UUID[] := '{}';
  v_remaining NUMERIC;
  v_stopped BOOLEAN := false;
  v_row RECORD;
BEGIN
  SELECT family_id INTO v_kid_family
  FROM public.family_members
  WHERE id = p_member_id;

  IF v_kid_family IS NULL THEN
    RETURN '{}';
  END IF;

  -- Permission: mom (primary_parent of the kid's family), or an
  -- additional_adult holding a contribute+ finance grant for this kid
  -- (Convention #274: contribute = record payments / Mark Paid).
  SELECT EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
      AND fm.family_id = v_kid_family
      AND fm.role = 'primary_parent'
  ) OR (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.family_id = v_kid_family
        AND fm.role = 'additional_adult'
    )
    AND util.finance_grant_level(p_member_id) IN ('contribute', 'manage')
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Not authorized to settle allowance periods for this member';
  END IF;

  IF p_period_ids IS NOT NULL THEN
    -- Explicit mode: close exactly the named periods (must belong to the
    -- member and still be awaiting payment).
    WITH closed AS (
      UPDATE public.allowance_periods
      SET status = 'closed', closed_at = now()
      WHERE family_member_id = p_member_id
        AND status = 'calculated'
        AND id = ANY(p_period_ids)
      RETURNING id
    )
    SELECT COALESCE(array_agg(id), '{}') INTO v_closed FROM closed;

  ELSIF p_allocate_amount IS NOT NULL THEN
    -- Allocate mode: walk 'calculated' periods oldest-first. Close every
    -- period the paid amount fully covers; once a (nonzero) period does not
    -- fit, no newer nonzero period settles either (never settle a newer week
    -- while an older one stays open). $0.00-earned periods always close.
    v_remaining := p_allocate_amount + 0.005; -- cent-rounding epsilon

    FOR v_row IN
      SELECT id, total_earned
      FROM public.allowance_periods
      WHERE family_member_id = p_member_id
        AND status = 'calculated'
      ORDER BY period_start, pool_name
    LOOP
      IF COALESCE(v_row.total_earned, 0) = 0 THEN
        v_to_close := array_append(v_to_close, v_row.id);
      ELSIF NOT v_stopped AND v_row.total_earned <= v_remaining THEN
        v_remaining := v_remaining - v_row.total_earned;
        v_to_close := array_append(v_to_close, v_row.id);
      ELSE
        v_stopped := true;
      END IF;
    END LOOP;

    IF array_length(v_to_close, 1) IS NOT NULL THEN
      WITH closed AS (
        UPDATE public.allowance_periods
        SET status = 'closed', closed_at = now()
        WHERE id = ANY(v_to_close)
          AND status = 'calculated'
        RETURNING id
      )
      SELECT COALESCE(array_agg(id), '{}') INTO v_closed FROM closed;
    END IF;
  END IF;

  RETURN v_closed;
END;
$fn$;

REVOKE ALL ON FUNCTION public.settle_calculated_allowance_periods(UUID, UUID[], NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.settle_calculated_allowance_periods(UUID, UUID[], NUMERIC) FROM anon;
GRANT EXECUTE ON FUNCTION public.settle_calculated_allowance_periods(UUID, UUID[], NUMERIC) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. Running balance = SUM(amount) (ground truth, order-independent)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_running_balance(
  p_member_id UUID
)
RETURNS DECIMAL(10,2)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $fn$
  SELECT COALESCE(SUM(amount), 0.00)::DECIMAL(10,2)
  FROM public.financial_transactions
  WHERE family_member_id = p_member_id;
$fn$;

-- ----------------------------------------------------------------------------
-- Verification (raises on failure so a broken apply is loud)
-- ----------------------------------------------------------------------------
DO $verify$
DECLARE
  v_bad INTEGER;
BEGIN
  -- SUM(amount) must agree with the latest balance_after for every member
  -- with transactions (drift would mean pre-existing corruption this
  -- migration would surface, not create).
  SELECT COUNT(*) INTO v_bad
  FROM (
    SELECT ft.family_member_id,
           SUM(ft.amount) AS sum_amount,
           (SELECT ft2.balance_after FROM public.financial_transactions ft2
            WHERE ft2.family_member_id = ft.family_member_id
            ORDER BY ft2.created_at DESC LIMIT 1) AS latest_after
    FROM public.financial_transactions ft
    GROUP BY ft.family_member_id
  ) x
  WHERE ABS(COALESCE(x.sum_amount, 0) - COALESCE(x.latest_after, 0)) > 0.005;

  IF v_bad > 0 THEN
    RAISE WARNING 'calculate_running_balance: % member(s) have SUM(amount) != latest balance_after — pre-existing ledger drift, investigate', v_bad;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'settle_calculated_allowance_periods'
  ) THEN
    RAISE EXCEPTION 'settle_calculated_allowance_periods was not created';
  END IF;
END;
$verify$;
