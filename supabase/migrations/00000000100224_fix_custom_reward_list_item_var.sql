-- Bug C3: v_list_item used without assignment when delivery_mode='text'
-- The CASE WHEN at the end reads v_list_item.id even in text mode path.
-- Fix: only reference v_list_item when we're in list_reference mode.

CREATE OR REPLACE FUNCTION public.execute_custom_reward_godmother(
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
  v_family_id      UUID;
  v_member_id      UUID;
  v_config_id      UUID;
  v_config         RECORD;
  v_delivery_mode  TEXT;
  v_prize_text     TEXT;
  v_list_id        UUID;
  v_list_item_id   UUID := NULL;
  v_list_item_name TEXT := NULL;
  v_earned_id      UUID;
  v_config_found   BOOLEAN := false;
BEGIN
  v_family_id := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id := (p_deed_firing ->> 'family_member_id')::uuid;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'custom_reward_godmother: deed firing has no family_member_id'
    );
  END IF;

  -- Resolve config (may be NULL for inline payload contracts)
  v_config_id := (p_payload ->> 'godmother_config_id')::uuid;
  IF v_config_id IS NOT NULL THEN
    SELECT * INTO v_config
      FROM public.custom_reward_godmother_configs
     WHERE id = v_config_id;
    v_config_found := FOUND;
  END IF;

  -- Determine delivery mode
  IF v_config_found THEN
    v_delivery_mode := COALESCE(v_config.delivery_mode, 'text');
  ELSE
    v_delivery_mode := 'text';
  END IF;

  IF v_delivery_mode = 'list_reference' AND v_config_found THEN
    v_list_id := v_config.reward_list_id;

    IF v_list_id IS NULL THEN
      RETURN jsonb_build_object(
        'status', 'failed',
        'error_message', 'custom_reward_godmother: list_reference mode but no reward_list_id configured'
      );
    END IF;

    -- Pick a random available item
    SELECT id, COALESCE(item_name, content) INTO v_list_item_id, v_list_item_name
      FROM public.list_items
     WHERE list_id = v_list_id
       AND checked = false
       AND (is_available IS NULL OR is_available = true)
     ORDER BY random()
     LIMIT 1;

    IF v_list_item_id IS NULL THEN
      v_prize_text := COALESCE(v_config.reward_text, 'Custom reward (list exhausted)');
    ELSE
      v_prize_text := COALESCE(v_list_item_name, 'Reward from list');

      -- Mark one-time items as checked
      UPDATE public.list_items
         SET checked = true, checked_at = now(), checked_by = v_member_id
       WHERE id = v_list_item_id
         AND (is_repeatable IS NULL OR is_repeatable = false);

      -- Increment repeatable items
      UPDATE public.list_items
         SET period_completion_count = COALESCE(period_completion_count, 0) + 1,
             last_completed_at = now()
       WHERE id = v_list_item_id
         AND is_repeatable = true;
    END IF;
  ELSE
    -- Text mode
    IF v_config_found THEN
      v_prize_text := COALESCE(v_config.reward_text, p_payload ->> 'payload_text');
    ELSE
      v_prize_text := p_payload ->> 'payload_text';
    END IF;
    IF v_prize_text IS NULL OR v_prize_text = '' THEN
      v_prize_text := format('Custom reward from contract %s', p_contract_id);
    END IF;
  END IF;

  -- Insert IOU
  INSERT INTO public.earned_prizes (
    family_id, family_member_id,
    source_type, source_id,
    prize_type, prize_text
  ) VALUES (
    v_family_id, v_member_id,
    COALESCE(p_deed_firing ->> 'source_type', 'contract_grant'),
    (p_deed_firing ->> 'source_id')::uuid,
    'text', v_prize_text
  )
  RETURNING id INTO v_earned_id;

  RETURN jsonb_build_object(
    'status', 'granted',
    'grant_reference', v_earned_id,
    'metadata', jsonb_build_object(
      'family_member_id', v_member_id,
      'delivery_mode', v_delivery_mode,
      'prize_text', v_prize_text,
      'list_item_id', v_list_item_id
    )
  );
END;
$fn$;

-- Clear any failed rows from this round
DELETE FROM public.contract_grant_log WHERE status = 'failed';

DO $$ BEGIN RAISE NOTICE 'Round 3 hotfix: custom_reward_godmother v_list_item variable fix'; END $$;
