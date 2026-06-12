-- Migration: 00000000100268_custom_reward_godmother_round3.sql
-- Build: KIDS-REWARDS-PAGE — Slice 1 correction (same session as 100266/100267)
--
-- 100266's execute_custom_reward_godmother rewrite was based on the SUPERSEDED
-- 100214 body and accidentally dropped the round-2 hotfix (100223): the
-- v_config_found guard that prevents an unassigned-RECORD crash when a
-- contract has no godmother_config_id (the common inline-payload case — every
-- contract authored by ContractForm today writes godmother_config_id = NULL).
--
-- This round-3 version is the 100223 body PLUS the KIDS-REWARDS-PAGE additions:
--   - image snapshot: per-item list image → config image → contract
--     payload_config image (ContractForm writes {reward_image_url,
--     reward_image_asset_key} into contracts.payload_config; the dispatcher
--     passes it through as p_payload -> 'payload_config')
--   - prize_name snapshot (display fix companion)
--   - visibility='family' + created_by = contract author
--   - source_id COALESCE safety (earned_prizes.source_id is NOT NULL)

BEGIN;

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
  v_list_item      RECORD;
  v_earned_id      UUID;
  v_config_found   BOOLEAN := false;
  v_image_url      TEXT := NULL;
  v_asset_key      TEXT := NULL;
  v_prize_type     TEXT;
  v_created_by     UUID;
BEGIN
  v_family_id := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id := (p_deed_firing ->> 'family_member_id')::uuid;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'custom_reward_godmother: deed firing has no family_member_id'
    );
  END IF;

  -- Resolve config (may be NULL for inline payload contracts — round-2 guard)
  v_config_id := (p_payload ->> 'godmother_config_id')::uuid;
  IF v_config_id IS NOT NULL THEN
    SELECT * INTO v_config
      FROM public.custom_reward_godmother_configs
     WHERE id = v_config_id;
    v_config_found := FOUND;
  END IF;

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

    SELECT id, content, item_name, reward_image_url, reward_image_asset_key INTO v_list_item
      FROM public.list_items
     WHERE list_id = v_list_id
       AND checked = false
       AND (is_available IS NULL OR is_available = true)
     ORDER BY random()
     LIMIT 1;

    IF v_list_item.id IS NULL THEN
      v_prize_text := COALESCE(v_config.reward_text, 'Custom reward (list exhausted)');
    ELSE
      v_prize_text := COALESCE(v_list_item.item_name, v_list_item.content, 'Reward from list');
      -- KIDS-REWARDS-PAGE Q5: per-item reward image wins for list draws
      v_image_url := NULLIF(v_list_item.reward_image_url, '');
      v_asset_key := NULLIF(v_list_item.reward_image_asset_key, '');

      UPDATE public.list_items
         SET checked = true, checked_at = now(), checked_by = v_member_id
       WHERE id = v_list_item.id
         AND (is_repeatable IS NULL OR is_repeatable = false);

      UPDATE public.list_items
         SET period_completion_count = COALESCE(period_completion_count, 0) + 1,
             last_completed_at = now()
       WHERE id = v_list_item.id
         AND is_repeatable = true;
    END IF;
  ELSE
    -- Text mode: use config text (if found) or inline payload
    IF v_config_found THEN
      v_prize_text := COALESCE(v_config.reward_text, p_payload ->> 'payload_text');
    ELSE
      v_prize_text := p_payload ->> 'payload_text';
    END IF;
    IF v_prize_text IS NULL OR v_prize_text = '' THEN
      v_prize_text := format('Custom reward from contract %s', p_contract_id);
    END IF;
  END IF;

  -- KIDS-REWARDS-PAGE Q5a: image fallback chain —
  -- per-item (set above) → config columns (when config exists) →
  -- contract payload_config (inline ContractForm authoring).
  IF v_config_found THEN
    v_image_url := COALESCE(v_image_url, NULLIF(v_config.reward_image_url, ''));
    v_asset_key := COALESCE(v_asset_key, NULLIF(v_config.reward_image_asset_key, ''));
  END IF;
  v_image_url := COALESCE(v_image_url, NULLIF(p_payload -> 'payload_config' ->> 'reward_image_url', ''));
  v_asset_key := COALESCE(v_asset_key, NULLIF(p_payload -> 'payload_config' ->> 'reward_image_asset_key', ''));

  v_prize_type := CASE
    WHEN v_image_url IS NOT NULL THEN 'image'
    WHEN v_asset_key IS NOT NULL THEN 'platform_image'
    ELSE 'text'
  END;

  -- Creator attribution: the contract's author
  SELECT c.created_by INTO v_created_by
    FROM public.contracts c
   WHERE c.id = p_contract_id;

  INSERT INTO public.earned_prizes (
    family_id, family_member_id,
    source_type, source_id,
    prize_type, prize_text, prize_name,
    prize_image_url, prize_asset_key,
    visibility, created_by
  ) VALUES (
    v_family_id, v_member_id,
    COALESCE(p_deed_firing ->> 'source_type', 'contract_grant'),
    COALESCE((p_deed_firing ->> 'source_id')::uuid, p_contract_id),
    v_prize_type, v_prize_text, NULLIF(LEFT(BTRIM(v_prize_text), 80), ''),
    v_image_url, v_asset_key,
    'family', v_created_by
  )
  RETURNING id INTO v_earned_id;

  RETURN jsonb_build_object(
    'status', 'granted',
    'grant_reference', v_earned_id,
    'metadata', jsonb_build_object(
      'family_member_id', v_member_id,
      'delivery_mode', v_delivery_mode,
      'prize_text', v_prize_text,
      'prize_type', v_prize_type,
      'list_item_id', CASE WHEN v_list_item.id IS NOT NULL THEN v_list_item.id ELSE NULL END
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_custom_reward_godmother IS
  'Phase 3 connector: delivers custom rewards via text or list-reference mode. '
  'Round 3 (KIDS-REWARDS-PAGE): round-2 NULL-config guard preserved; snapshots reward image '
  '(per-item list → config → contract payload_config) + prize_name; sets visibility + created_by.';

COMMIT;
