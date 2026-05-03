-- Phase 3 Connector Architecture — Sub-task 10
-- points_godmother: awards gamification points to a family member.
-- Points only — no creature roll, no page unlock, no coloring advance.
-- Those are separate godmothers (Worker D / future).
-- Also creates the generic grant_points RPC for reuse.

-- ── grant_points ────────────────────────────────────────────────────
-- Generic points grant. Updates family_members.gamification_points.
-- Respects gamification_configs.enabled master toggle.
-- Does NOT touch streaks, creatures, or pages.

CREATE OR REPLACE FUNCTION public.grant_points(
  p_family_id  UUID,
  p_member_id  UUID,
  p_points     INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_config     RECORD;
  v_new_total  INTEGER;
BEGIN
  IF p_points IS NULL OR p_points <= 0 THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'error_message', 'points must be positive'
    );
  END IF;

  SELECT * INTO v_config
    FROM public.gamification_configs
   WHERE family_id = p_family_id
     AND family_member_id = p_member_id;

  IF NOT FOUND OR NOT COALESCE(v_config.enabled, false) THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'error_message', 'gamification disabled for this member'
    );
  END IF;

  UPDATE public.family_members
     SET gamification_points = COALESCE(gamification_points, 0) + p_points
   WHERE id = p_member_id
  RETURNING gamification_points INTO v_new_total;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'member not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'granted',
    'points_awarded', p_points,
    'new_total', v_new_total
  );
END;
$fn$;

-- ── execute_points_godmother ────────────────────────────────────────
-- Connector-layer points godmother. Called by dispatch_godmothers when
-- a contract with godmother_type='points_godmother' fires immediately.
-- Reads points from inline payload or points_godmother_configs.

CREATE OR REPLACE FUNCTION public.execute_points_godmother(
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
  v_family_id  UUID;
  v_member_id  UUID;
  v_points     INTEGER;
  v_config_id  UUID;
  v_config     RECORD;
  v_result     JSONB;
BEGIN
  v_family_id := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id := (p_deed_firing ->> 'family_member_id')::uuid;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'points_godmother: deed firing has no family_member_id'
    );
  END IF;

  -- Resolve points: config table takes precedence over inline payload
  v_config_id := (p_payload ->> 'godmother_config_id')::uuid;
  IF v_config_id IS NOT NULL THEN
    SELECT * INTO v_config
      FROM public.points_godmother_configs
     WHERE id = v_config_id;
    IF FOUND THEN
      v_points := v_config.base_points;
    END IF;
  END IF;

  IF v_points IS NULL THEN
    v_points := (p_payload ->> 'payload_amount')::integer;
  END IF;

  IF v_points IS NULL OR v_points <= 0 THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'error_message', 'points_godmother: no positive points in payload or config'
    );
  END IF;

  v_result := public.grant_points(v_family_id, v_member_id, v_points);

  RETURN jsonb_build_object(
    'status', COALESCE(v_result ->> 'status', 'granted'),
    'grant_reference', v_member_id,
    'metadata', jsonb_build_object(
      'points_awarded', v_points,
      'new_total', (v_result ->> 'new_total')::integer,
      'family_member_id', v_member_id
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.grant_points IS
  'Generic gamification points grant. Updates family_members.gamification_points. '
  'Respects gamification_configs.enabled. Does not touch streaks, creatures, or pages.';

COMMENT ON FUNCTION public.execute_points_godmother IS
  'Phase 3 connector: awards gamification points from contract payload or '
  'points_godmother_configs to a family member via grant_points RPC.';

RAISE NOTICE 'migration 100210: grant_points + execute_points_godmother created';
