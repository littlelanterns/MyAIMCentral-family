-- Phase 3 Connector Architecture — Sub-task 9
-- money_godmother: awards a dollar amount directly to a kid's financial balance.
-- Also creates the generic grant_money RPC for reuse by both the SQL godmother
-- and the TypeScript client-side helper.

-- ── grant_money ─────────────────────────────────────────────────────
-- Generic financial transaction writer. Computes balance_after from the
-- latest transaction for the member, then inserts an append-only row.
-- Convention #223: financial_transactions is never UPDATEd or DELETEd.
-- Handles duplicate-key violations gracefully (idempotent by source_reference_id).

CREATE OR REPLACE FUNCTION public.grant_money(
  p_family_id          UUID,
  p_member_id          UUID,
  p_amount             DECIMAL,
  p_transaction_type   TEXT DEFAULT 'opportunity_earned',
  p_description        TEXT DEFAULT '',
  p_source_type        TEXT DEFAULT NULL,
  p_source_reference_id UUID DEFAULT NULL,
  p_category           TEXT DEFAULT NULL,
  p_metadata           JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_current_balance DECIMAL(10,2);
  v_new_balance     DECIMAL(10,2);
  v_tx_id           UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'error_message', 'amount must be positive'
    );
  END IF;

  v_current_balance := COALESCE(
    public.calculate_running_balance(p_member_id),
    0.00
  );
  v_new_balance := v_current_balance + p_amount;

  BEGIN
    INSERT INTO public.financial_transactions (
      family_id, family_member_id, transaction_type,
      amount, balance_after, description,
      source_type, source_reference_id, category, metadata
    ) VALUES (
      p_family_id, p_member_id, p_transaction_type,
      p_amount, v_new_balance, p_description,
      p_source_type, p_source_reference_id, p_category, p_metadata
    )
    RETURNING id INTO v_tx_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'status', 'already_awarded',
      'error_message', 'duplicate transaction detected'
    );
  END;

  RETURN jsonb_build_object(
    'status', 'granted',
    'transaction_id', v_tx_id,
    'amount', p_amount,
    'balance_after', v_new_balance
  );
END;
$fn$;

-- ── execute_money_godmother ─────────────────────────────────────────
-- Connector-layer money godmother. Called by dispatch_godmothers when
-- a contract with godmother_type='money_godmother' fires immediately.

CREATE OR REPLACE FUNCTION public.execute_money_godmother(
  p_contract_id  UUID,
  p_deed_firing  JSONB,
  p_payload      JSONB,
  p_stroke_of    TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_family_id   UUID;
  v_member_id   UUID;
  v_amount      DECIMAL;
  v_description TEXT;
  v_result      JSONB;
BEGIN
  v_family_id   := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id   := (p_deed_firing ->> 'family_member_id')::uuid;
  v_amount      := (p_payload ->> 'payload_amount')::decimal;
  v_description := COALESCE(
    p_payload ->> 'payload_text',
    format('Contract grant (%s)', p_contract_id)
  );

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'money_godmother: deed firing has no family_member_id'
    );
  END IF;

  IF v_amount IS NULL OR v_amount <= 0 THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'error_message', 'money_godmother: no positive amount in payload'
    );
  END IF;

  v_result := public.grant_money(
    p_family_id          := v_family_id,
    p_member_id          := v_member_id,
    p_amount             := v_amount,
    p_transaction_type   := 'contract_grant',
    p_description        := v_description,
    p_source_type        := p_deed_firing ->> 'source_type',
    p_source_reference_id := (p_deed_firing ->> 'source_id')::uuid,
    p_metadata           := jsonb_build_object(
      'contract_id', p_contract_id,
      'deed_firing_id', p_deed_firing ->> 'id'
    )
  );

  RETURN jsonb_build_object(
    'status', COALESCE(v_result ->> 'status', 'granted'),
    'grant_reference', (v_result ->> 'transaction_id')::uuid,
    'metadata', jsonb_build_object(
      'amount', v_amount,
      'balance_after', v_result ->> 'balance_after',
      'family_member_id', v_member_id
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.grant_money IS
  'Generic financial transaction writer. Append-only. Handles idempotency '
  'via unique-violation catch. Used by both connector godmothers and client-side helpers.';

COMMENT ON FUNCTION public.execute_money_godmother IS
  'Phase 3 connector: awards a dollar amount from contract payload to a '
  'family member''s financial balance via grant_money RPC.';

DO $$ BEGIN RAISE NOTICE 'migration 100209: grant_money + execute_money_godmother created'; END $$;
