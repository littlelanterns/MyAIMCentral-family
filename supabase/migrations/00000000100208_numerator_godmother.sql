-- Phase 3 Connector Architecture — Sub-task 8
-- numerator_godmother: dispatch stub for above-and-beyond credit.
-- Phase 3 records that the deed qualifies as a numerator boost.
-- Phase 3.5 will read these grant log entries at period close to
-- compute the boosted numerator inside the restructured allowance RPC.

CREATE OR REPLACE FUNCTION public.execute_numerator_godmother(
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
  v_source_type  TEXT;
  v_boost_weight DECIMAL;
BEGIN
  v_source_type := p_deed_firing ->> 'source_type';

  IF v_source_type NOT IN (
    'task_completion', 'routine_step_completion',
    'list_item_completion', 'opportunity_claimed'
  ) THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'error_message', format('numerator_godmother: unsupported source_type %s', v_source_type)
    );
  END IF;

  v_boost_weight := COALESCE((p_payload ->> 'payload_amount')::decimal, 1.0);

  RETURN jsonb_build_object(
    'status', 'granted',
    'metadata', jsonb_build_object(
      'boost_weight', v_boost_weight,
      'deferred_to', 'period_close',
      'source_type', v_source_type,
      'source_id', p_deed_firing ->> 'source_id',
      'family_member_id', p_deed_firing ->> 'family_member_id'
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_numerator_godmother IS
  'Phase 3 connector: records above-and-beyond credit for allowance '
  'numerator boost. Phase 3.5 will read contract_grant_log entries '
  'with this godmother_type at period close to compute boosted numerators.';

RAISE NOTICE 'migration 100208: execute_numerator_godmother created';
