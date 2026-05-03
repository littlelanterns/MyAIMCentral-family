-- Phase 3 Connector Architecture — Sub-task 7
-- allowance_godmother: registers a deed as allowance-eligible.
-- Also upgrades dispatch_godmothers to dynamic godmother routing.

-- ── execute_allowance_godmother ─────────────────────────────────────
-- Phase 3 behavior: registration only.
-- Records that the deed counts toward allowance calculation.
-- The existing calculate_allowance_progress RPC and calculate-allowance-period
-- Edge Function continue to handle the actual math at period close.
-- Phase 3.5 will restructure the allowance math to read from deed firings.

CREATE OR REPLACE FUNCTION public.execute_allowance_godmother(
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
  v_config       RECORD;
  v_config_id    UUID;
  v_pool_name    TEXT := 'default';
  v_is_extra     BOOLEAN := false;
BEGIN
  v_source_type := p_deed_firing ->> 'source_type';

  IF v_source_type NOT IN ('task_completion', 'routine_step_completion') THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'error_message', format('allowance_godmother: unsupported source_type %s', v_source_type)
    );
  END IF;

  v_config_id := (p_payload ->> 'godmother_config_id')::uuid;

  IF v_config_id IS NOT NULL THEN
    SELECT * INTO v_config
      FROM public.allowance_godmother_configs
     WHERE id = v_config_id;
    IF FOUND THEN
      v_pool_name := COALESCE(v_config.pool_name, 'default');
      v_is_extra  := COALESCE(v_config.is_extra_credit, false);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'status', 'granted',
    'metadata', jsonb_build_object(
      'pool_name', v_pool_name,
      'is_extra_credit', v_is_extra,
      'source_type', v_source_type,
      'source_id', p_deed_firing ->> 'source_id',
      'family_member_id', p_deed_firing ->> 'family_member_id'
    )
  );
END;
$fn$;

-- ── Upgrade dispatch_godmothers — dynamic godmother routing ─────────
-- Replaces the no-op stub with a dynamic function lookup.
-- If a function named execute_{godmother_type} exists, it is called.
-- Otherwise the grant logs as no_op (godmother not yet implemented).
-- Future godmother functions auto-register by naming convention.

CREATE OR REPLACE FUNCTION public.dispatch_godmothers(
  p_deed_firing_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_firing       RECORD;
  v_contract     RECORD;
  v_if_pass      BOOLEAN;
  v_count        INTEGER;
  v_streak       JSONB;
  v_result       JSONB;
  v_results      JSONB := '[]'::jsonb;
  v_grant_status TEXT;
  v_grant_ref    UUID;
  v_existing     UUID;
  v_total_fired  INTEGER := 0;
  v_total_passed INTEGER := 0;
  v_best_contracts JSONB := '{}'::jsonb;
  v_best_level   INTEGER;
  v_curr_level   INTEGER;
  -- Dynamic dispatch variables
  v_fn_name      TEXT;
  v_fn_exists    BOOLEAN;
  v_deed_json    JSONB;
  v_payload_json JSONB;
BEGIN
  -- Step 1: Load the deed firing
  SELECT * INTO v_firing FROM public.deed_firings WHERE id = p_deed_firing_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'deed_firing_not_found');
  END IF;

  -- Pre-compute deed firing as JSONB for godmother calls
  v_deed_json := jsonb_build_object(
    'id', v_firing.id,
    'family_id', v_firing.family_id,
    'family_member_id', v_firing.family_member_id,
    'source_type', v_firing.source_type,
    'source_id', v_firing.source_id,
    'fired_at', v_firing.fired_at,
    'metadata', v_firing.metadata
  );

  -- Step 2+3: Find matching active contracts with inheritance resolution.
  FOR v_contract IN
    SELECT c.* FROM public.contracts c
     WHERE c.family_id = v_firing.family_id
       AND c.status = 'active'
       AND c.source_type = v_firing.source_type
       AND (c.source_id IS NULL OR c.source_id = v_firing.source_id)
       AND (c.family_member_id IS NULL OR c.family_member_id = v_firing.family_member_id)
     ORDER BY
       CASE c.inheritance_level
         WHEN 'deed_override' THEN 3
         WHEN 'kid_override' THEN 2
         WHEN 'family_default' THEN 1
         ELSE 0
       END DESC,
       c.created_at ASC
  LOOP
    v_curr_level := CASE v_contract.inheritance_level
      WHEN 'deed_override' THEN 3
      WHEN 'kid_override' THEN 2
      WHEN 'family_default' THEN 1
      ELSE 0
    END;

    v_best_level := COALESCE((v_best_contracts ->> v_contract.godmother_type)::int, 0);

    IF v_contract.override_mode = 'replace' AND v_curr_level <= v_best_level THEN
      CONTINUE;
    END IF;

    IF v_contract.override_mode != 'add' THEN
      v_best_contracts := v_best_contracts || jsonb_build_object(v_contract.godmother_type, v_curr_level);
    END IF;

    IF v_contract.override_mode = 'remove' THEN
      CONTINUE;
    END IF;

    v_total_fired := v_total_fired + 1;

    -- Step 4: Evaluate the IF pattern
    v_if_pass := false;

    CASE v_contract.if_pattern
      WHEN 'every_time' THEN
        v_if_pass := true;

      WHEN 'every_nth' THEN
        SELECT count(*) INTO v_count
          FROM public.deed_firings df
         WHERE df.family_id = v_firing.family_id
           AND df.source_type = v_firing.source_type
           AND (v_contract.source_id IS NULL OR df.source_id = v_contract.source_id)
           AND (v_contract.family_member_id IS NULL OR df.family_member_id = v_contract.family_member_id)
           AND df.fired_at <= v_firing.fired_at;
        IF v_count > v_contract.if_offset
           AND ((v_count - v_contract.if_offset) % COALESCE(v_contract.if_n, 1)) = 0 THEN
          v_if_pass := true;
        END IF;

      WHEN 'on_threshold_cross' THEN
        SELECT count(*) INTO v_count
          FROM public.deed_firings df
         WHERE df.family_id = v_firing.family_id
           AND df.source_type = v_firing.source_type
           AND (v_contract.source_id IS NULL OR df.source_id = v_contract.source_id)
           AND (v_contract.family_member_id IS NULL OR df.family_member_id = v_contract.family_member_id)
           AND df.fired_at <= v_firing.fired_at;
        IF v_count = COALESCE(v_contract.if_n, 1) THEN
          v_if_pass := true;
        END IF;

      WHEN 'above_daily_floor' THEN
        SELECT count(*) INTO v_count
          FROM public.deed_firings df
         WHERE df.family_id = v_firing.family_id
           AND df.source_type = v_firing.source_type
           AND (v_contract.source_id IS NULL OR df.source_id = v_contract.source_id)
           AND (v_contract.family_member_id IS NULL OR df.family_member_id = v_contract.family_member_id)
           AND df.fired_at::date = v_firing.fired_at::date;
        IF v_count > COALESCE(v_contract.if_floor, 0) THEN
          v_if_pass := true;
        END IF;

      WHEN 'above_window_floor' THEN
        SELECT count(*) INTO v_count
          FROM public.deed_firings df
         WHERE df.family_id = v_firing.family_id
           AND df.source_type = v_firing.source_type
           AND (v_contract.source_id IS NULL OR df.source_id = v_contract.source_id)
           AND (v_contract.family_member_id IS NULL OR df.family_member_id = v_contract.family_member_id)
           AND df.fired_at >= CASE COALESCE(v_contract.if_window_kind, 'day')
             WHEN 'day' THEN date_trunc('day', v_firing.fired_at)
             WHEN 'week' THEN date_trunc('week', v_firing.fired_at)
             WHEN 'month' THEN date_trunc('month', v_firing.fired_at)
             ELSE date_trunc('day', v_firing.fired_at)
           END;
        IF v_count > COALESCE(v_contract.if_floor, 0) THEN
          v_if_pass := true;
        END IF;

      WHEN 'within_date_range' THEN
        IF v_firing.fired_at >= COALESCE(v_contract.if_window_starts_at, '-infinity'::timestamptz)
           AND v_firing.fired_at <= COALESCE(v_contract.if_window_ends_at, 'infinity'::timestamptz) THEN
          v_if_pass := true;
        END IF;

      WHEN 'streak' THEN
        v_streak := public.compute_streak(
          v_firing.family_member_id,
          v_firing.source_type,
          v_contract.source_id
        );
        IF (v_streak ->> 'current_streak')::int >= COALESCE(v_contract.if_n, 1) THEN
          v_if_pass := true;
        END IF;

      WHEN 'calendar' THEN
        v_if_pass := false;

    ELSE
      v_if_pass := false;
    END CASE;

    IF NOT v_if_pass THEN
      CONTINUE;
    END IF;

    v_total_passed := v_total_passed + 1;

    -- Idempotency check
    SELECT id INTO v_existing
      FROM public.contract_grant_log
     WHERE deed_firing_id = p_deed_firing_id AND contract_id = v_contract.id
     LIMIT 1;
    IF FOUND THEN
      v_results := v_results || jsonb_build_object(
        'contract_id', v_contract.id,
        'godmother_type', v_contract.godmother_type,
        'status', 'already_granted'
      );
      CONTINUE;
    END IF;

    -- Step 5: Route by stroke_of
    IF v_contract.stroke_of = 'immediate' THEN
      -- Build payload for godmother
      v_payload_json := jsonb_build_object(
        'payload_amount', v_contract.payload_amount,
        'payload_text', v_contract.payload_text,
        'payload_config', v_contract.payload_config,
        'godmother_config_id', v_contract.godmother_config_id
      );

      -- Dynamic dispatch: check if godmother function exists
      v_fn_name := 'execute_' || v_contract.godmother_type;
      SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = v_fn_name
      ) INTO v_fn_exists;

      v_result := NULL;
      v_grant_status := 'no_op';
      v_grant_ref := NULL;

      IF v_fn_exists THEN
        BEGIN
          EXECUTE format('SELECT public.%I($1, $2, $3, $4)', v_fn_name)
            USING v_contract.id, v_deed_json, v_payload_json, v_contract.stroke_of
            INTO v_result;
          v_grant_status := COALESCE(v_result ->> 'status', 'granted');
          v_grant_ref := (v_result ->> 'grant_reference')::uuid;
        EXCEPTION WHEN OTHERS THEN
          v_result := jsonb_build_object('status', 'failed', 'error_message', SQLERRM);
          v_grant_status := 'failed';
        END;
      ELSE
        v_result := jsonb_build_object('status', 'no_op', 'reason', 'godmother_not_implemented');
      END IF;

      -- Record in grant log
      INSERT INTO public.contract_grant_log (
        family_id, deed_firing_id, contract_id, godmother_type,
        status, grant_reference, error_message, metadata
      ) VALUES (
        v_firing.family_id, p_deed_firing_id, v_contract.id,
        v_contract.godmother_type, v_grant_status, v_grant_ref,
        v_result ->> 'error_message',
        COALESCE(v_result -> 'metadata', jsonb_build_object(
          'payload_amount', v_contract.payload_amount,
          'payload_text', v_contract.payload_text
        ))
      );

      v_results := v_results || jsonb_build_object(
        'contract_id', v_contract.id,
        'godmother_type', v_contract.godmother_type,
        'status', v_grant_status
      );
    ELSE
      -- Step 6: Queue deferred grant
      INSERT INTO public.deferred_grants (
        family_id, contract_id, deed_firing_id, family_member_id,
        stroke_of, stroke_of_time
      ) VALUES (
        v_firing.family_id, v_contract.id, p_deed_firing_id,
        v_firing.family_member_id, v_contract.stroke_of, v_contract.stroke_of_time
      );

      INSERT INTO public.contract_grant_log (
        family_id, deed_firing_id, contract_id, godmother_type,
        status, metadata
      ) VALUES (
        v_firing.family_id, p_deed_firing_id, v_contract.id,
        v_contract.godmother_type, 'deferred',
        jsonb_build_object('stroke_of', v_contract.stroke_of)
      );

      v_results := v_results || jsonb_build_object(
        'contract_id', v_contract.id,
        'godmother_type', v_contract.godmother_type,
        'status', 'deferred',
        'stroke_of', v_contract.stroke_of
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'deed_firing_id', p_deed_firing_id,
    'source_type', v_firing.source_type,
    'contracts_evaluated', v_total_fired,
    'contracts_passed', v_total_passed,
    'results', v_results
  );
END;
$fn$;

RAISE NOTICE 'migration 100207: execute_allowance_godmother + dispatch_godmothers upgraded to dynamic routing';
