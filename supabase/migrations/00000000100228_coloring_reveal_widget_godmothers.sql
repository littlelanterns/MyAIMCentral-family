-- Phase 3 Connector Architecture — Worker H (part 2)
-- Two new godmothers enabling the potty-chart compound reward pattern:
--   1. coloring_reveal_godmother — advances one zone per deed, handles completion + fresh init
--   2. widget_data_point_godmother — auto-writes a tally/star to a tracker widget
-- Also extends contracts.godmother_type CHECK to include both.

-- ── 1. Extend contracts.godmother_type CHECK ────────────────────────

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_godmother_type_check;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_godmother_type_check
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
      'creature_godmother',
      'page_unlock_godmother',
      'coloring_reveal_godmother',
      'widget_data_point_godmother'
    ));

-- ── 2. execute_coloring_reveal_godmother ────────────────────────────
-- Advances one zone on the kid's active coloring reveal.
--
-- payload_config options:
--   target_reveal_id: UUID — specific reveal to advance (optional; defaults to active)
--   auto_init_image_slug: TEXT — if no active reveal exists, initialize one with this image
--   auto_init_step_count: INTEGER — step count for auto-init (default 50)
--   auto_init_lineart: TEXT — lineart preference for auto-init (default 'medium')
--   complete_action: TEXT — 'archive' (default) or 'keep' — what to do when reveal completes
--   grant_fresh_on_complete: BOOLEAN — if true, initialize a fresh reveal on completion
--   fresh_image_slug: TEXT — which image for the fresh reveal (optional; random if omitted)
--   fresh_step_count: INTEGER — step count for fresh reveal (inherits current if omitted)

CREATE OR REPLACE FUNCTION public.execute_coloring_reveal_godmother(
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
  v_family_id       UUID;
  v_member_id       UUID;
  v_config          JSONB;
  v_reveal          RECORD;
  v_target_id       UUID;
  v_result          JSONB;
  v_new_reveal_id   UUID;
  v_library         RECORD;
  v_init_slug       TEXT;
  v_init_steps      INTEGER;
  v_init_lineart    TEXT;
  v_complete_action TEXT;
  v_grant_fresh     BOOLEAN;
  v_fresh_slug      TEXT;
  v_fresh_steps     INTEGER;
BEGIN
  v_family_id := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id := (p_deed_firing ->> 'family_member_id')::uuid;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'coloring_reveal_godmother: deed firing has no family_member_id'
    );
  END IF;

  v_config := COALESCE(p_payload -> 'payload_config', '{}'::jsonb);

  -- Parse config
  v_target_id       := (v_config ->> 'target_reveal_id')::uuid;
  v_init_slug       := v_config ->> 'auto_init_image_slug';
  v_init_steps      := COALESCE((v_config ->> 'auto_init_step_count')::integer, 50);
  v_init_lineart    := COALESCE(v_config ->> 'auto_init_lineart', 'medium');
  v_complete_action := COALESCE(v_config ->> 'complete_action', 'archive');
  v_grant_fresh     := COALESCE((v_config ->> 'grant_fresh_on_complete')::boolean, false);
  v_fresh_slug      := v_config ->> 'fresh_image_slug';
  v_fresh_steps     := (v_config ->> 'fresh_step_count')::integer;

  -- Find the target reveal
  IF v_target_id IS NOT NULL THEN
    SELECT * INTO v_reveal
      FROM public.member_coloring_reveals
     WHERE id = v_target_id
       AND family_member_id = v_member_id
       AND is_complete = false;
  ELSE
    SELECT * INTO v_reveal
      FROM public.member_coloring_reveals
     WHERE family_member_id = v_member_id
       AND is_active = true
       AND is_complete = false
     ORDER BY created_at DESC
     LIMIT 1;
  END IF;

  -- Auto-init if no active reveal and slug provided
  IF NOT FOUND AND v_init_slug IS NOT NULL THEN
    SELECT * INTO v_library
      FROM public.coloring_reveal_library
     WHERE slug = v_init_slug
       AND is_active = true;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'status', 'failed',
        'error_message', 'coloring_reveal_godmother: auto_init_image_slug not found: ' || v_init_slug
      );
    END IF;

    INSERT INTO public.member_coloring_reveals (
      family_id, family_member_id, coloring_image_id,
      reveal_step_count, lineart_preference,
      earning_source_type, earning_source_id,
      is_active
    ) VALUES (
      v_family_id, v_member_id, v_library.id,
      v_init_steps, v_init_lineart,
      'contract', p_contract_id,
      true
    )
    RETURNING * INTO v_reveal;

    RETURN jsonb_build_object(
      'status', 'granted',
      'grant_reference', v_reveal.id::text,
      'metadata', jsonb_build_object(
        'action', 'initialized',
        'image_slug', v_init_slug,
        'step_count', v_init_steps,
        'family_member_id', v_member_id
      )
    );
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'metadata', jsonb_build_object('reason', 'no_active_reveal')
    );
  END IF;

  -- Advance one zone using the existing helper RPC
  v_result := public.advance_coloring_reveal(v_reveal.id);

  IF NOT COALESCE((v_result ->> 'advanced')::boolean, false) THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'metadata', jsonb_build_object(
        'reason', 'advance_failed',
        'detail', v_result
      )
    );
  END IF;

  -- Check if this advance completed the reveal
  IF COALESCE((v_result ->> 'is_complete')::boolean, false) THEN
    -- Handle completion
    IF v_complete_action = 'archive' THEN
      UPDATE public.member_coloring_reveals
         SET is_active = false
       WHERE id = v_reveal.id;
    END IF;

    -- Grant fresh reveal on completion if configured
    IF v_grant_fresh THEN
      -- Pick image: explicit slug > random from same theme
      IF v_fresh_slug IS NOT NULL THEN
        SELECT * INTO v_library
          FROM public.coloring_reveal_library
         WHERE slug = v_fresh_slug AND is_active = true;
      ELSE
        SELECT crl.* INTO v_library
          FROM public.coloring_reveal_library crl
         WHERE crl.is_active = true
           AND crl.id != v_reveal.coloring_image_id
         ORDER BY random()
         LIMIT 1;
      END IF;

      IF FOUND THEN
        INSERT INTO public.member_coloring_reveals (
          family_id, family_member_id, coloring_image_id,
          reveal_step_count, lineart_preference,
          earning_source_type, earning_source_id,
          is_active
        ) VALUES (
          v_family_id, v_member_id, v_library.id,
          COALESCE(v_fresh_steps, v_reveal.reveal_step_count),
          v_reveal.lineart_preference,
          'contract', p_contract_id,
          true
        )
        RETURNING id INTO v_new_reveal_id;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'status', 'granted',
    'grant_reference', v_reveal.id::text,
    'metadata', jsonb_build_object(
      'action', 'advanced',
      'new_step', (v_result ->> 'new_step')::integer,
      'total_steps', (v_result ->> 'total_steps')::integer,
      'is_complete', COALESCE((v_result ->> 'is_complete')::boolean, false),
      'image_slug', v_result ->> 'image_slug',
      'newly_revealed_zone_ids', v_result -> 'newly_revealed_zone_ids',
      'fresh_reveal_id', v_new_reveal_id,
      'family_member_id', v_member_id
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_coloring_reveal_godmother IS
  'Phase 3 connector: advances one zone on the active coloring reveal per deed firing. '
  'Handles auto-init on first trigger, completion archiving, and fresh reveal granting. '
  'Enables potty-chart-style "50 trips = fully colored image" patterns.';

-- ── 3. execute_widget_data_point_godmother ──────────────────────────
-- Writes a data point to a dashboard tracker widget on each deed firing.
-- Enables auto-tally star charts, streak trackers, and similar.
--
-- payload_config options:
--   widget_id: UUID (required) — the target dashboard_widgets row
--   value: NUMERIC — the value to record (default 1 for tally/increment)
--   value_type: TEXT — 'increment' (default), 'set', 'boolean'

CREATE OR REPLACE FUNCTION public.execute_widget_data_point_godmother(
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
  v_family_id     UUID;
  v_member_id     UUID;
  v_config        JSONB;
  v_widget_id     UUID;
  v_value         NUMERIC;
  v_value_type    TEXT;
  v_widget        RECORD;
  v_new_id        UUID;
  v_recorded_date DATE;
BEGIN
  v_family_id := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id := (p_deed_firing ->> 'family_member_id')::uuid;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'widget_data_point_godmother: deed firing has no family_member_id'
    );
  END IF;

  v_config := COALESCE(p_payload -> 'payload_config', '{}'::jsonb);

  v_widget_id  := (v_config ->> 'widget_id')::uuid;
  v_value      := COALESCE((v_config ->> 'value')::numeric, 1);
  v_value_type := COALESCE(v_config ->> 'value_type', 'increment');

  IF v_widget_id IS NULL THEN
    -- Fall back to inline payload_amount as widget_id is sometimes passed there
    v_widget_id := (p_payload ->> 'godmother_config_id')::uuid;
  END IF;

  IF v_widget_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'widget_data_point_godmother: no widget_id in payload_config'
    );
  END IF;

  -- Verify widget exists and belongs to this family
  SELECT * INTO v_widget
    FROM public.dashboard_widgets
   WHERE id = v_widget_id
     AND family_id = v_family_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'widget_data_point_godmother: widget not found or wrong family'
    );
  END IF;

  -- Use family timezone for recorded_date
  SELECT (now() AT TIME ZONE COALESCE(f.timezone, 'America/Chicago'))::date
    INTO v_recorded_date
    FROM public.families f
   WHERE f.id = v_family_id;

  INSERT INTO public.widget_data_points (
    family_id, widget_id, family_member_id,
    recorded_date, value, value_type,
    recorded_by_member_id,
    metadata
  ) VALUES (
    v_family_id, v_widget_id, v_member_id,
    v_recorded_date, v_value, v_value_type,
    v_member_id,
    jsonb_build_object(
      'source', 'contract_grant',
      'deed_firing_id', p_deed_firing ->> 'id',
      'contract_id', p_contract_id
    )
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'status', 'granted',
    'grant_reference', v_new_id::text,
    'metadata', jsonb_build_object(
      'widget_id', v_widget_id,
      'value', v_value,
      'value_type', v_value_type,
      'recorded_date', v_recorded_date,
      'family_member_id', v_member_id
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_widget_data_point_godmother IS
  'Phase 3 connector: writes a data point to a dashboard tracker widget on deed firing. '
  'Enables auto-tally star charts tied to task completions or any other deed source.';

DO $$ BEGIN RAISE NOTICE 'migration 100226: coloring_reveal_godmother + widget_data_point_godmother'; END $$;
