-- Phase 3 Connector Architecture — Worker E, Sub-tasks 16 + 16b
-- 1. Extend contracts CHECK: add recognition_godmother + coloring_advance
-- 2. Extend contract_grant_log with presentation columns
-- 3. Create execute_recognition_godmother RPC
-- 4. Update dispatch_godmothers to write presentation fields into grant log

DO $migration$
BEGIN

-- ── 1. Extend contracts CHECKs ──────────────────────────────────────

-- Add recognition_godmother (10th godmother type)
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_godmother_type_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_godmother_type_check
  CHECK (godmother_type IN (
    'allowance_godmother',
    'numerator_godmother',
    'money_godmother',
    'points_godmother',
    'prize_godmother',
    'victory_godmother',
    'family_victory_godmother',
    'custom_reward_godmother',
    'assign_task_godmother',
    'recognition_godmother'
  ));

-- Add coloring_advance (6th presentation mode)
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_presentation_mode_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_presentation_mode_check
  CHECK (presentation_mode IN (
    'silent',
    'toast',
    'reveal_animation',
    'treasure_box',
    'coloring_advance'
  ));

-- ── 2. Extend contract_grant_log ────────────────────────────────────

ALTER TABLE public.contract_grant_log
  ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS presentation_mode TEXT,
  ADD COLUMN IF NOT EXISTS animation_slug TEXT,
  ADD COLUMN IF NOT EXISTS revealed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS contract_grant_log_pending_reveals_idx
  ON public.contract_grant_log (family_member_id, presentation_mode)
  WHERE presentation_mode IS NOT NULL
    AND presentation_mode != 'silent'
    AND revealed_at IS NULL
    AND status = 'granted';

-- RLS: kid reads own pending reveals (contract_grant_log already has family-scoped RLS
-- from migration 100205; add member-scoped SELECT for non-mom roles)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'contract_grant_log'
       AND policyname = 'member_reads_own_reveals'
  ) THEN
    CREATE POLICY member_reads_own_reveals ON public.contract_grant_log
      FOR SELECT USING (
        family_member_id IN (
          SELECT id FROM public.family_members
           WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── 3. execute_recognition_godmother ────────────────────────────────

CREATE OR REPLACE FUNCTION public.execute_recognition_godmother(
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
BEGIN
  RETURN jsonb_build_object(
    'status', 'granted',
    'metadata', jsonb_build_object(
      'type', 'recognition_only',
      'contract_id', p_contract_id,
      'deed_firing_id', p_deed_firing ->> 'id'
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_recognition_godmother IS
  'Phase 3 connector: recognition-only godmother. Does nothing transactional — '
  'logs acknowledgment so the presentation layer can provide kid-visible feedback '
  '(toast, reveal animation, coloring advance) without any monetary/points/prize reward.';

-- ── 4. Update dispatch_godmothers ───────────────────────────────────
-- Re-create with presentation fields written to contract_grant_log.

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
  v_fn_name      TEXT;
  v_fn_exists    BOOLEAN;
  v_deed_json    JSONB;
  v_payload_json JSONB;
  v_anim_slug    TEXT;
BEGIN
  -- Step 1: Load the deed firing
  SELECT * INTO v_firing FROM public.deed_firings WHERE id = p_deed_firing_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'deed_firing_not_found');
  END IF;

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

    -- Resolve animation slug from presentation_config
    v_anim_slug := v_contract.presentation_config ->> 'animation_slug';

    -- Step 5: Route by stroke_of
    IF v_contract.stroke_of = 'immediate' THEN
      v_payload_json := jsonb_build_object(
        'payload_amount', v_contract.payload_amount,
        'payload_text', v_contract.payload_text,
        'payload_config', v_contract.payload_config,
        'godmother_config_id', v_contract.godmother_config_id
      );

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

      INSERT INTO public.contract_grant_log (
        family_id, deed_firing_id, contract_id, godmother_type,
        status, grant_reference, error_message, metadata,
        family_member_id, presentation_mode, animation_slug
      ) VALUES (
        v_firing.family_id, p_deed_firing_id, v_contract.id,
        v_contract.godmother_type, v_grant_status, v_grant_ref,
        v_result ->> 'error_message',
        COALESCE(v_result -> 'metadata', jsonb_build_object(
          'payload_amount', v_contract.payload_amount,
          'payload_text', v_contract.payload_text
        )),
        v_firing.family_member_id,
        v_contract.presentation_mode,
        v_anim_slug
      );

      v_results := v_results || jsonb_build_object(
        'contract_id', v_contract.id,
        'godmother_type', v_contract.godmother_type,
        'status', v_grant_status,
        'presentation_mode', v_contract.presentation_mode
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
        status, metadata,
        family_member_id, presentation_mode, animation_slug
      ) VALUES (
        v_firing.family_id, p_deed_firing_id, v_contract.id,
        v_contract.godmother_type, 'deferred',
        jsonb_build_object('stroke_of', v_contract.stroke_of),
        v_firing.family_member_id,
        v_contract.presentation_mode,
        v_anim_slug
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
  'Phase 3 connector: central dispatch engine (Worker E upgrade). '
  'Now writes presentation_mode, animation_slug, and family_member_id '
  'to contract_grant_log for frontend reveal consumption.';

RAISE NOTICE 'migration 100216: presentation layer + recognition_godmother + dispatch upgrade';

END;
$migration$;
