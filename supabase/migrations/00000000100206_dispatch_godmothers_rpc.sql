-- Phase 3 Connector Architecture — Sub-task 6
-- dispatch_godmothers RPC: central dispatch engine.
-- Evaluates contracts against a deed firing and invokes godmothers.

-- ── dispatch_single_grant ────────────────────────────────────────────
-- Helper for the evaluate-deferred-contracts Edge Function.
-- Processes a single deferred_grants row.

CREATE OR REPLACE FUNCTION public.dispatch_single_grant(
  p_deferred_grant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_grant RECORD;
BEGIN
  SELECT * INTO v_grant FROM public.deferred_grants WHERE id = p_deferred_grant_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF v_grant.status != 'pending' THEN
    RETURN jsonb_build_object('status', 'already_processed', 'current_status', v_grant.status);
  END IF;

  -- Mark as granted (godmother implementation in Workers C+D)
  UPDATE public.deferred_grants
     SET status = 'granted', granted_at = now()
   WHERE id = p_deferred_grant_id;

  RETURN jsonb_build_object('status', 'granted', 'grant_id', p_deferred_grant_id);
END;
$fn$;

-- ── dispatch_godmothers ──────────────────────────────────────────────
-- Main dispatch engine. Called after a deed fires.
-- 1. Loads the deed firing
-- 2. Finds matching active contracts
-- 3. Applies inheritance resolution
-- 4. Evaluates IF patterns
-- 5. Immediate → invokes godmother (no-op stub until Workers C+D)
-- 6. Deferred → queues to deferred_grants
-- 7. Records in contract_grant_log (idempotent)

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
  v_existing     UUID;
  v_total_fired  INTEGER := 0;
  v_total_passed INTEGER := 0;
  -- Inheritance resolution: track best contract per godmother_type
  v_best_contracts JSONB := '{}'::jsonb;
  v_best_level   INTEGER;
  v_curr_level   INTEGER;
BEGIN
  -- Step 1: Load the deed firing
  SELECT * INTO v_firing FROM public.deed_firings WHERE id = p_deed_firing_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'deed_firing_not_found');
  END IF;

  -- Step 2+3: Find matching active contracts with inheritance resolution.
  -- Collect all matching contracts, then resolve per godmother_type.
  -- Inheritance priority: deed_override(3) > kid_override(2) > family_default(1)
  FOR v_contract IN
    SELECT c.* FROM public.contracts c
     WHERE c.family_id = v_firing.family_id
       AND c.status = 'active'
       AND c.source_type = v_firing.source_type
       AND (c.source_id IS NULL OR c.source_id = v_firing.source_id)
       AND (c.family_member_id IS NULL OR c.family_member_id = v_firing.family_member_id)
     ORDER BY
       -- Resolve inheritance: most specific first
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

    -- Check if we already have a higher-priority contract for this godmother_type
    v_best_level := COALESCE((v_best_contracts ->> v_contract.godmother_type)::int, 0);

    -- For 'replace' mode: skip if a higher-level contract already claimed this godmother
    IF v_contract.override_mode = 'replace' AND v_curr_level <= v_best_level THEN
      CONTINUE;
    END IF;

    -- Record this as the best level for this godmother_type (unless 'add' mode)
    IF v_contract.override_mode != 'add' THEN
      v_best_contracts := v_best_contracts || jsonb_build_object(v_contract.godmother_type, v_curr_level);
    END IF;

    -- Handle 'remove' mode: skip execution (just blocks lower-level contracts)
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
        -- Calendar pattern evaluation deferred to Phase 3.5 (rrule parsing in SQL is complex)
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
      -- Godmother invocation stub (Workers C+D implement actual godmother logic)
      v_grant_status := 'no_op';

      -- Record in grant log
      INSERT INTO public.contract_grant_log (
        family_id, deed_firing_id, contract_id, godmother_type,
        status, metadata
      ) VALUES (
        v_firing.family_id, p_deed_firing_id, v_contract.id,
        v_contract.godmother_type, v_grant_status,
        jsonb_build_object(
          'reason', 'godmother_not_implemented',
          'payload_amount', v_contract.payload_amount,
          'payload_text', v_contract.payload_text
        )
      );

      v_results := v_results || jsonb_build_object(
        'contract_id', v_contract.id,
        'godmother_type', v_contract.godmother_type,
        'status', v_grant_status,
        'reason', 'godmother_not_implemented'
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

      -- Record in grant log as deferred
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

COMMENT ON FUNCTION public.dispatch_godmothers IS
  'Phase 3 connector: central dispatch engine. Evaluates contracts '
  'against a deed firing, resolves inheritance, evaluates IF patterns, '
  'and either invokes godmothers immediately or queues deferred grants. '
  'Idempotent via contract_grant_log UNIQUE constraint.';

COMMENT ON FUNCTION public.dispatch_single_grant IS
  'Phase 3 connector: processes a single deferred_grants row. '
  'Called by evaluate-deferred-contracts Edge Function.';

RAISE NOTICE 'migration 100206: dispatch_godmothers + dispatch_single_grant RPCs created';
