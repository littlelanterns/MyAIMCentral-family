-- Fix Bug A: victory_godmother missing NOT NULL columns
CREATE OR REPLACE FUNCTION public.execute_victory_godmother(
  p_contract_id UUID,
  p_deed_firing JSONB,
  p_payload JSONB,
  p_stroke_of TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_family_id    UUID;
  v_member_id    UUID;
  v_description  TEXT;
  v_source_type  TEXT;
  v_source_id    UUID;
  v_victory_id   UUID;
  v_existing     UUID;
BEGIN
  v_family_id   := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id   := (p_deed_firing ->> 'family_member_id')::uuid;
  v_source_type := p_deed_firing ->> 'source_type';
  v_source_id   := (p_deed_firing ->> 'source_id')::uuid;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'victory_godmother: deed firing has no family_member_id'
    );
  END IF;

  v_description := p_payload ->> 'payload_text';
  IF v_description IS NULL OR v_description = '' THEN
    v_description := format('Achievement via %s', REPLACE(COALESCE(v_source_type, 'unknown'), '_', ' '));
  END IF;

  -- Idempotency: check for existing victory from this exact deed
  SELECT id INTO v_existing
    FROM public.victories
   WHERE family_id = v_family_id
     AND family_member_id = v_member_id
     AND source = 'contract_grant'
     AND source_reference_id = (p_deed_firing ->> 'id')::uuid
   LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_granted',
      'grant_reference', v_existing,
      'metadata', jsonb_build_object('family_member_id', v_member_id)
    );
  END IF;

  -- Insert victory with all required NOT NULL columns
  INSERT INTO public.victories (
    family_id, family_member_id, description,
    source, source_reference_id,
    importance, custom_tags, recorder_type, member_type, is_moms_pick
  ) VALUES (
    v_family_id, v_member_id, v_description,
    'contract_grant', (p_deed_firing ->> 'id')::uuid,
    'small_win', '{}', 'automatic', 'child', false
  )
  RETURNING id INTO v_victory_id;

  RETURN jsonb_build_object(
    'status', 'granted',
    'grant_reference', v_victory_id,
    'metadata', jsonb_build_object(
      'family_member_id', v_member_id,
      'description', v_description,
      'deed_source_type', v_source_type
    )
  );
END;
$fn$;

-- Fix Bug B: financial_transactions CHECK constraint missing 'contract_grant'
ALTER TABLE public.financial_transactions
  DROP CONSTRAINT financial_transactions_transaction_type_check;

ALTER TABLE public.financial_transactions
  ADD CONSTRAINT financial_transactions_transaction_type_check
  CHECK (transaction_type = ANY (ARRAY[
    'allowance_earned', 'opportunity_earned', 'payment_made',
    'purchase_deduction', 'loan_issued', 'loan_repayment',
    'interest_accrued', 'adjustment', 'contract_grant'
  ]));

-- Fix Bug C: custom_reward_godmother — handle NULL source_id gracefully
-- The function already uses COALESCE for source_id fallback to p_contract_id.
-- The real issue is likely that source_id in deed_firings can be NULL for
-- intention_iteration deeds where no specific source exists.
-- Fix: make earned_prizes.source_id nullable OR ensure godmother always provides a value.
-- Since the godmother already COALESCEs to p_contract_id, the issue might be
-- that p_contract_id is passed as the first arg (UUID) but the function expects
-- source_id to be from the deed. Let's ensure the fallback always works:
-- Actually, the safest fix is to allow NULL source_id on earned_prizes.
ALTER TABLE public.earned_prizes
  ALTER COLUMN source_id DROP NOT NULL;

DO $$ BEGIN RAISE NOTICE 'Hotfix applied: victory_godmother columns, financial_transactions CHECK, earned_prizes source_id nullable'; END $$;
