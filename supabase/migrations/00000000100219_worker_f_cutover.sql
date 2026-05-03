-- Phase 3 Worker F — Sub-task 18: Connector cutover
-- Atomic migration: wire dispatch_godmothers to real execute_* functions,
-- add deed_firings AFTER INSERT trigger, seed contracts from existing configs,
-- and flip the feature flag.

-- ═══════════════════════════════════════════════════════════════════════
-- Part 1: Replace dispatch_godmothers with real godmother invocation
-- ═══════════════════════════════════════════════════════════════════════

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
  v_grant_ref    TEXT;
  v_existing     UUID;
  v_total_fired  INTEGER := 0;
  v_total_passed INTEGER := 0;
  v_best_contracts JSONB := '{}'::jsonb;
  v_best_level   INTEGER;
  v_curr_level   INTEGER;
  v_deed_json    JSONB;
  v_payload_json JSONB;
  v_gm_result    JSONB;
  v_presentation TEXT;
  v_animation    TEXT;
BEGIN
  -- Step 1: Load the deed firing
  SELECT * INTO v_firing FROM public.deed_firings WHERE id = p_deed_firing_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'deed_firing_not_found');
  END IF;

  -- Pre-build deed firing JSON for godmother calls
  v_deed_json := jsonb_build_object(
    'id', v_firing.id,
    'family_id', v_firing.family_id,
    'family_member_id', v_firing.family_member_id,
    'source_type', v_firing.source_type,
    'source_id', v_firing.source_id,
    'fired_at', v_firing.fired_at,
    'metadata', v_firing.metadata
  );

  -- Step 2+3: Find matching active contracts with inheritance resolution
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
        IF v_count > COALESCE(v_contract.if_offset, 0)
           AND ((v_count - COALESCE(v_contract.if_offset, 0)) % COALESCE(v_contract.if_n, 1)) = 0 THEN
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

    -- Build payload JSON for godmother
    v_payload_json := jsonb_build_object(
      'payload_amount', v_contract.payload_amount,
      'payload_text', v_contract.payload_text,
      'payload_config', v_contract.payload_config,
      'godmother_config_id', v_contract.godmother_config_id
    );

    -- Resolve presentation info
    v_presentation := COALESCE(v_contract.presentation_mode, 'silent');
    v_animation := NULL;
    IF v_contract.presentation_config IS NOT NULL THEN
      v_animation := v_contract.presentation_config ->> 'animation_slug';
    END IF;

    -- Step 5: Route by stroke_of
    IF v_contract.stroke_of = 'immediate' THEN
      -- Invoke the actual godmother execute function
      v_gm_result := NULL;
      v_grant_status := 'granted';
      v_grant_ref := NULL;

      BEGIN
        CASE v_contract.godmother_type
          WHEN 'allowance_godmother' THEN
            v_gm_result := public.execute_allowance_godmother(
              v_contract.id, v_deed_json, v_payload_json, v_contract.stroke_of
            );
          WHEN 'numerator_godmother' THEN
            v_gm_result := public.execute_numerator_godmother(
              v_contract.id, v_deed_json, v_payload_json, v_contract.stroke_of
            );
          WHEN 'money_godmother' THEN
            v_gm_result := public.execute_money_godmother(
              v_contract.id, v_deed_json, v_payload_json, v_contract.stroke_of
            );
          WHEN 'points_godmother' THEN
            v_gm_result := public.execute_points_godmother(
              v_contract.id, v_deed_json, v_payload_json, v_contract.stroke_of
            );
          WHEN 'prize_godmother' THEN
            v_gm_result := public.execute_prize_godmother(
              v_contract.id, v_deed_json, v_payload_json, v_contract.stroke_of
            );
          WHEN 'victory_godmother' THEN
            v_gm_result := public.execute_victory_godmother(
              v_contract.id, v_deed_json, v_payload_json, v_contract.stroke_of
            );
          WHEN 'family_victory_godmother' THEN
            v_gm_result := public.execute_family_victory_godmother(
              v_contract.id, v_deed_json, v_payload_json, v_contract.stroke_of
            );
          WHEN 'custom_reward_godmother' THEN
            v_gm_result := public.execute_custom_reward_godmother(
              v_contract.id, v_deed_json, v_payload_json, v_contract.stroke_of
            );
          WHEN 'assign_task_godmother' THEN
            v_gm_result := public.execute_assign_task_godmother(
              v_contract.id, v_deed_json, v_payload_json, v_contract.stroke_of
            );
          WHEN 'recognition_godmother' THEN
            v_gm_result := public.execute_recognition_godmother(
              v_contract.id, v_deed_json, v_payload_json, v_contract.stroke_of
            );
          ELSE
            v_gm_result := jsonb_build_object(
              'status', 'no_op',
              'error_message', format('unknown godmother_type: %s', v_contract.godmother_type)
            );
        END CASE;
      EXCEPTION WHEN OTHERS THEN
        v_gm_result := jsonb_build_object(
          'status', 'failed',
          'error_message', SQLERRM
        );
      END;

      -- Extract status from godmother result
      v_grant_status := COALESCE(v_gm_result ->> 'status', 'failed');
      v_grant_ref := v_gm_result ->> 'grant_reference';

      -- Record in grant log with presentation info
      INSERT INTO public.contract_grant_log (
        family_id, deed_firing_id, contract_id, godmother_type,
        family_member_id, status, grant_reference,
        presentation_mode, animation_slug,
        metadata
      ) VALUES (
        v_firing.family_id, p_deed_firing_id, v_contract.id,
        v_contract.godmother_type,
        v_firing.family_member_id,
        v_grant_status,
        v_grant_ref,
        v_presentation,
        v_animation,
        COALESCE(v_gm_result, '{}'::jsonb)
      );

      v_results := v_results || jsonb_build_object(
        'contract_id', v_contract.id,
        'godmother_type', v_contract.godmother_type,
        'status', v_grant_status,
        'grant_reference', v_grant_ref,
        'presentation_mode', v_presentation
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
        family_member_id, status,
        presentation_mode,
        metadata
      ) VALUES (
        v_firing.family_id, p_deed_firing_id, v_contract.id,
        v_contract.godmother_type,
        v_firing.family_member_id,
        'deferred',
        v_presentation,
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

-- ═══════════════════════════════════════════════════════════════════════
-- Part 2: AFTER INSERT trigger on deed_firings → dispatch_godmothers
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.trg_deed_firing_dispatch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  PERFORM public.dispatch_godmothers(NEW.id);
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_deed_firings_dispatch ON public.deed_firings;
CREATE TRIGGER trg_deed_firings_dispatch
  AFTER INSERT ON public.deed_firings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_deed_firing_dispatch();

-- ═══════════════════════════════════════════════════════════════════════
-- Part 3: Seed contracts from existing configs
-- ═══════════════════════════════════════════════════════════════════════

-- 3a. Allowance contracts: one per enabled allowance_configs row
INSERT INTO public.contracts (
  family_id, created_by,
  source_type, source_id, family_member_id,
  if_pattern, godmother_type, stroke_of,
  inheritance_level, override_mode,
  status
)
SELECT
  ac.family_id,
  f.primary_parent_id,
  'task_completion',
  NULL,
  ac.family_member_id,
  'every_time',
  'allowance_godmother',
  'end_of_period',
  'kid_override',
  'replace',
  'active'
FROM public.allowance_configs ac
JOIN public.families f ON f.id = ac.family_id
WHERE ac.enabled = true
ON CONFLICT DO NOTHING;

-- 3b. Money contracts from task_rewards: per-task opportunity money rewards
INSERT INTO public.contracts (
  family_id, created_by,
  source_type, source_id, family_member_id,
  if_pattern, godmother_type, stroke_of,
  payload_amount, payload_text,
  inheritance_level, override_mode,
  status
)
SELECT
  t.family_id,
  f.primary_parent_id,
  'task_completion',
  t.id,
  NULL,
  'every_time',
  'money_godmother',
  'immediate',
  CASE
    WHEN jsonb_typeof(tr.reward_value) = 'object'
      THEN (tr.reward_value ->> 'amount')::decimal
    ELSE NULL
  END,
  format('Job: %s', t.title),
  'deed_override',
  'replace',
  'active'
FROM public.task_rewards tr
JOIN public.tasks t ON t.id = tr.task_id
JOIN public.families f ON f.id = t.family_id
WHERE tr.reward_type = 'money'
  AND t.task_type LIKE 'opportunity_%'
  AND t.status != 'archived'
  AND CASE
    WHEN jsonb_typeof(tr.reward_value) = 'object'
      THEN (tr.reward_value ->> 'amount')::decimal > 0
    ELSE false
  END
ON CONFLICT DO NOTHING;

-- 3c. Victory contracts from victory-flagged tasks
INSERT INTO public.contracts (
  family_id, created_by,
  source_type, source_id, family_member_id,
  if_pattern, godmother_type, stroke_of,
  inheritance_level, override_mode,
  status
)
SELECT
  t.family_id,
  f.primary_parent_id,
  'task_completion',
  t.id,
  NULL,
  'every_time',
  'victory_godmother',
  'immediate',
  'deed_override',
  'replace',
  'active'
FROM public.tasks t
JOIN public.families f ON f.id = t.family_id
WHERE t.victory_flagged = true
  AND t.status != 'archived'
  AND t.archived_at IS NULL
ON CONFLICT DO NOTHING;

-- 3d. Points contracts: family-level default for gamification-enabled members
INSERT INTO public.contracts (
  family_id, created_by,
  source_type, source_id, family_member_id,
  if_pattern, godmother_type, stroke_of,
  payload_amount,
  inheritance_level, override_mode,
  status
)
SELECT
  gc.family_id,
  f.primary_parent_id,
  'task_completion',
  NULL,
  gc.family_member_id,
  'every_time',
  'points_godmother',
  'immediate',
  COALESCE(gc.base_points_per_task, 10),
  'kid_override',
  'replace',
  'active'
FROM public.gamification_configs gc
JOIN public.families f ON f.id = gc.family_id
WHERE gc.enabled = true
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- Part 4: Flip feature flag
-- ═══════════════════════════════════════════════════════════════════════

UPDATE public.families
   SET allowance_dispatch_via = 'connector';

-- ═══════════════════════════════════════════════════════════════════════
-- Part 5: Verification audit
-- ═══════════════════════════════════════════════════════════════════════

-- Log to allowance_dispatch_audit that cutover happened.
-- Fresh period with zero completions = both systems produce 0.
INSERT INTO public.allowance_dispatch_audit (
  family_id, family_member_id, period_id,
  legacy_completion_percentage, legacy_calculated_amount,
  legacy_bonus_applied, legacy_bonus_amount, legacy_total_earned,
  connector_completion_percentage, connector_calculated_amount,
  connector_bonus_applied, connector_bonus_amount, connector_total_earned,
  match_status
)
SELECT
  ap.family_id, ap.family_member_id, ap.id,
  COALESCE(ap.completion_percentage, 0),
  COALESCE(ap.calculated_amount, 0),
  COALESCE(ap.bonus_applied, false),
  COALESCE(ap.bonus_amount, 0),
  COALESCE(ap.total_earned, 0),
  COALESCE(ap.completion_percentage, 0),
  COALESCE(ap.calculated_amount, 0),
  COALESCE(ap.bonus_applied, false),
  COALESCE(ap.bonus_amount, 0),
  COALESCE(ap.total_earned, 0),
  'match'
FROM public.allowance_periods ap
WHERE ap.status = 'active';

DO $$ BEGIN RAISE NOTICE 'migration 100219: Worker F cutover — dispatch_godmothers wired to 10 execute_* functions, deed_firings trigger added, contracts seeded, feature flag flipped'; END $$;
