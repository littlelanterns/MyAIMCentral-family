-- Migration: 00000000100269_custom_reward_godmother_round4.sql
-- Build: KIDS-REWARDS-PAGE — Slice 1 correction (caught by the Playwright
--        NULL-guard pin in tests/e2e/features/kids-rewards-slice1.spec.ts)
--
-- Round 3 (100268) restored the round-2 v_config NULL-guard (100223) but
-- reintroduced Bug C3 (originally fixed by 100224): it declares
-- `v_list_item RECORD` and references `v_list_item.id` in the final RETURN's
-- metadata. In text mode — the inline-payload path, i.e. EVERY contract
-- ContractForm authors today — the record is never assigned, and plpgsql
-- raises `record "v_list_item" is not assigned yet`. The dispatcher's
-- exception handler swallowed it into contract_grant_log status='failed',
-- so every inline custom_reward contract silently failed.
--
-- Round 4 = round 3 body with the 100224 fix re-applied: per-item values are
-- copied into pre-initialized scalars (v_list_item_id / v_list_item_name)
-- inside the list branch; the RETURN references only the scalars.
--
-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ GUARD LEDGER — execute_custom_reward_godmother                         ║
-- ║ This function has regressed THREE times (100214→100223→100224→100268). ║
-- ║ Every rewrite MUST preserve ALL of the following, and every guard has  ║
-- ║ an individual regression pin in                                        ║
-- ║ tests/e2e/features/kids-rewards-slice1.spec.ts (tests 1a–1g):          ║
-- ║                                                                         ║
-- ║  G1 (100223): NULL godmother_config_id / missing config → text         ║
-- ║      fallback, never an unassigned v_config reference.       [pin 1a]  ║
-- ║  G2 (100224): text mode never references an unassigned list-item       ║
-- ║      record — scalars only outside the list branch.    [pins 1a, 1c]   ║
-- ║  G3 (100214): deed firing without family_member_id → graceful          ║
-- ║      status='failed', never a crash.                          [pin 1f] ║
-- ║  G4 (100214): list_reference mode without reward_list_id →             ║
-- ║      graceful status='failed', never a crash.                 [pin 1e] ║
-- ║  G5 (100268): contract payload_config image snapshot                   ║
-- ║      (inline ContractForm authoring).                         [pin 1b] ║
-- ║  G6 (100266/100268): config-level image snapshot.             [pin 1c] ║
-- ║  G7 (100266/100268): per-item list image WINS over config image;       ║
-- ║      drawn item is checked / repeatable counted.              [pin 1d] ║
-- ║  G8 (100214): empty payload_text → generated fallback text.   [pin 1g] ║
-- ║                                                                         ║
-- ║ If you rewrite this function, base it on THIS file (highest round),    ║
-- ║ keep this ledger in the new migration, and run the spec before         ║
-- ║ declaring done. Rounds 3 happened because rewrites copied from         ║
-- ║ superseded bodies.                                                      ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

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
  -- Bug C3 fix (100224, re-applied): pre-initialized scalars, never an
  -- unassigned RECORD reference outside the list branch.
  v_list_item_id        UUID := NULL;
  v_list_item_name      TEXT := NULL;
  v_list_item_content   TEXT := NULL;
  v_list_item_image     TEXT := NULL;
  v_list_item_asset_key TEXT := NULL;
  v_list_repeatable     BOOLEAN := NULL;
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

    SELECT li.id, li.content, li.item_name,
           li.reward_image_url, li.reward_image_asset_key, li.is_repeatable
      INTO v_list_item_id, v_list_item_content, v_list_item_name,
           v_list_item_image, v_list_item_asset_key, v_list_repeatable
      FROM public.list_items li
     WHERE li.list_id = v_list_id
       AND li.checked = false
       AND (li.is_available IS NULL OR li.is_available = true)
     ORDER BY random()
     LIMIT 1;

    IF v_list_item_id IS NULL THEN
      v_prize_text := COALESCE(v_config.reward_text, 'Custom reward (list exhausted)');
    ELSE
      v_prize_text := COALESCE(v_list_item_name, v_list_item_content, 'Reward from list');
      -- KIDS-REWARDS-PAGE Q5: per-item reward image wins for list draws
      v_image_url := NULLIF(v_list_item_image, '');
      v_asset_key := NULLIF(v_list_item_asset_key, '');

      UPDATE public.list_items
         SET checked = true, checked_at = now(), checked_by = v_member_id
       WHERE id = v_list_item_id
         AND (is_repeatable IS NULL OR is_repeatable = false);

      UPDATE public.list_items
         SET period_completion_count = COALESCE(period_completion_count, 0) + 1,
             last_completed_at = now()
       WHERE id = v_list_item_id
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
      'list_item_id', v_list_item_id
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_custom_reward_godmother IS
  'Phase 3 connector: delivers custom rewards via text or list-reference mode. '
  'Round 4 (KIDS-REWARDS-PAGE): round-2 NULL-config guard + round-3 image chain '
  '(per-item list → config → contract payload_config) + Bug C3 scalar fix (100224) '
  're-applied — text mode never references an unassigned list-item record.';

COMMIT;
