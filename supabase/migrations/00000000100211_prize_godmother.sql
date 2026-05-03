-- Phase 3 Connector Architecture — Sub-task 11
-- prize_godmother: creates prize IOUs and optionally triggers reveal animations.
-- Bridges event-form deed_firings (source_type='task_completion') to
-- entity-form reward_reveal_attachments (source_type='task').

CREATE OR REPLACE FUNCTION public.execute_prize_godmother(
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
  v_config_id       UUID;
  v_config          RECORD;
  v_prize_type      TEXT;
  v_prize_text      TEXT;
  v_prize_image_url TEXT;
  v_prize_name      TEXT;
  v_prize_asset_key TEXT;
  v_animation_slug  TEXT;
  v_reveal_id       UUID;
  v_attachment_id   UUID;
  v_entity_type     TEXT;
  v_entity_id       UUID;
  v_attachment       RECORD;
  v_animation       RECORD;
  v_earned_id       UUID;
BEGIN
  v_family_id := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id := (p_deed_firing ->> 'family_member_id')::uuid;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'prize_godmother: deed firing has no family_member_id'
    );
  END IF;

  -- Resolve config
  v_config_id := (p_payload ->> 'godmother_config_id')::uuid;
  IF v_config_id IS NOT NULL THEN
    SELECT * INTO v_config
      FROM public.prize_godmother_configs
     WHERE id = v_config_id;
  END IF;

  -- Determine prize details from config or inline payload
  IF v_config IS NOT NULL AND v_config.id IS NOT NULL THEN
    v_prize_text      := COALESCE(v_config.iou_text, v_config.prize_text);
    v_prize_image_url := v_config.prize_image_url;
    v_prize_type      := CASE
                           WHEN v_config.prize_mode = 'from_list' THEN 'randomizer'
                           WHEN v_config.prize_image_url IS NOT NULL THEN 'image'
                           ELSE 'text'
                         END;
  ELSE
    v_prize_text := p_payload ->> 'payload_text';
    v_prize_type := 'text';
  END IF;

  IF v_prize_text IS NULL AND v_prize_image_url IS NULL THEN
    v_prize_text := format('Prize earned from contract %s', p_contract_id);
  END IF;

  -- Bridge event→entity for reveal lookup
  v_entity_type := CASE (p_deed_firing ->> 'source_type')
    WHEN 'task_completion'        THEN 'task'
    WHEN 'intention_iteration'    THEN 'intention'
    WHEN 'list_item_completion'   THEN 'list'
    WHEN 'widget_data_point'      THEN 'widget'
    WHEN 'routine_step_completion' THEN 'task'
    ELSE NULL
  END;
  v_entity_id := (p_deed_firing ->> 'source_id')::uuid;

  -- Look up reveal attachment if entity mapping exists
  IF v_entity_type IS NOT NULL AND v_entity_id IS NOT NULL THEN
    SELECT * INTO v_attachment
      FROM public.reward_reveal_attachments
     WHERE source_type = v_entity_type
       AND source_id = v_entity_id
       AND is_active = true
       AND (family_member_id IS NULL OR family_member_id = v_member_id)
     LIMIT 1;

    IF v_attachment.id IS NOT NULL THEN
      v_attachment_id := v_attachment.id;
      v_reveal_id     := v_attachment.reward_reveal_id;

      -- Resolve animation from the reveal
      SELECT ra.slug INTO v_animation_slug
        FROM public.reward_reveals rr
        LEFT JOIN LATERAL (
          SELECT slug FROM public.reveal_animations
           WHERE id = ANY(rr.animation_ids)
           ORDER BY random()
           LIMIT 1
        ) ra ON true
       WHERE rr.id = v_reveal_id;

      -- Resolve prize from the reveal if config didn't provide one
      IF v_prize_text IS NULL OR v_prize_text = format('Prize earned from contract %s', p_contract_id) THEN
        SELECT rr.prize_text, rr.prize_name, rr.prize_image_url, rr.prize_asset_key, rr.prize_type
          INTO v_prize_text, v_prize_name, v_prize_image_url, v_prize_asset_key, v_prize_type
          FROM public.reward_reveals rr
         WHERE rr.id = v_reveal_id;
        v_prize_type := COALESCE(v_prize_type, 'text');
      END IF;

      -- Increment times_revealed on the attachment
      UPDATE public.reward_reveal_attachments
         SET times_revealed = COALESCE(times_revealed, 0) + 1,
             last_revealed_at = now()
       WHERE id = v_attachment_id;
    END IF;
  END IF;

  -- Insert the IOU
  INSERT INTO public.earned_prizes (
    family_id, family_member_id,
    reward_reveal_id, attachment_id,
    source_type, source_id,
    prize_type, prize_text, prize_name, prize_image_url, prize_asset_key, animation_slug
  ) VALUES (
    v_family_id, v_member_id,
    v_reveal_id, v_attachment_id,
    COALESCE(p_deed_firing ->> 'source_type', 'contract_grant'),
    COALESCE(v_entity_id, p_contract_id),
    COALESCE(v_prize_type, 'text'),
    v_prize_text, v_prize_name, v_prize_image_url, v_prize_asset_key, v_animation_slug
  )
  RETURNING id INTO v_earned_id;

  RETURN jsonb_build_object(
    'status', 'granted',
    'grant_reference', v_earned_id,
    'metadata', jsonb_build_object(
      'family_member_id', v_member_id,
      'prize_type', COALESCE(v_prize_type, 'text'),
      'has_animation', v_animation_slug IS NOT NULL,
      'animation_slug', v_animation_slug,
      'reveal_id', v_reveal_id
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_prize_godmother IS
  'Phase 3 connector: creates prize IOUs in earned_prizes. Bridges event-form '
  'deed_firings to entity-form reward_reveal_attachments for animation lookup.';

RAISE NOTICE 'migration 100211: execute_prize_godmother created';
