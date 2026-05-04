-- Phase 3 Connector Architecture — Worker H
-- Two new godmothers: creature_godmother and page_unlock_godmother.
-- Restores creature rolls + page unlocks lost when roll_creature_for_completion was deleted (Worker F).
-- Also seeds contracts for kids with sticker books enabled.

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
      'page_unlock_godmother'
    ));

-- ── 2. execute_creature_godmother ───────────────────────────────────
-- Rolls for a creature when a deed fires. Replicates the old
-- roll_creature_for_completion Steps 7-9 as a standalone godmother.

CREATE OR REPLACE FUNCTION public.execute_creature_godmother(
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
  v_state         RECORD;
  v_roll_chance   INTEGER;
  v_creature_roll INTEGER;
  v_common_pct    INTEGER;
  v_rare_pct      INTEGER;
  v_rarity_roll   INTEGER;
  v_chosen_rarity TEXT;
  v_creature      RECORD;
  v_position_x    REAL;
  v_position_y    REAL;
  v_new_id        UUID;
BEGIN
  v_family_id := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id := (p_deed_firing ->> 'family_member_id')::uuid;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'creature_godmother: deed firing has no family_member_id'
    );
  END IF;

  -- Load sticker book state
  SELECT * INTO v_state
    FROM public.member_sticker_book_state
   WHERE family_member_id = v_member_id;

  IF NOT FOUND OR NOT COALESCE(v_state.is_enabled, false) THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'metadata', jsonb_build_object('reason', 'sticker_book_disabled')
    );
  END IF;

  -- Determine roll chance: payload > config > sticker book state default
  v_roll_chance := (p_payload ->> 'payload_amount')::integer;

  IF v_roll_chance IS NULL AND (p_payload ->> 'godmother_config_id') IS NOT NULL THEN
    SELECT creature_roll_chance INTO v_roll_chance
      FROM public.points_godmother_configs
     WHERE id = (p_payload ->> 'godmother_config_id')::uuid;
  END IF;

  IF v_roll_chance IS NULL THEN
    v_roll_chance := v_state.creature_roll_chance_per_task;
  END IF;

  -- d100 roll (1-100)
  v_creature_roll := floor(random() * 100)::int + 1;
  IF v_creature_roll > v_roll_chance THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'metadata', jsonb_build_object(
        'reason', 'roll_failed',
        'roll', v_creature_roll,
        'roll_chance', v_roll_chance
      )
    );
  END IF;

  -- Pick rarity from weights
  v_common_pct := COALESCE((v_state.rarity_weights ->> 'common')::int, 85);
  v_rare_pct   := COALESCE((v_state.rarity_weights ->> 'rare')::int, 12);
  v_rarity_roll := floor(random() * 100)::int + 1;

  IF v_rarity_roll <= v_common_pct THEN
    v_chosen_rarity := 'common';
  ELSIF v_rarity_roll <= (v_common_pct + v_rare_pct) THEN
    v_chosen_rarity := 'rare';
  ELSE
    v_chosen_rarity := 'legendary';
  END IF;

  -- Pick creature, fall through to lower tiers if chosen tier is empty
  SELECT * INTO v_creature
    FROM public.gamification_creatures
   WHERE theme_id = v_state.active_theme_id
     AND rarity = v_chosen_rarity
     AND is_active = true
   ORDER BY random()
   LIMIT 1;

  IF NOT FOUND AND v_chosen_rarity = 'legendary' THEN
    SELECT * INTO v_creature
      FROM public.gamification_creatures
     WHERE theme_id = v_state.active_theme_id
       AND rarity = 'rare'
       AND is_active = true
     ORDER BY random()
     LIMIT 1;
    IF FOUND THEN v_chosen_rarity := 'rare'; END IF;
  END IF;

  IF NOT FOUND AND v_chosen_rarity IN ('rare', 'legendary') THEN
    SELECT * INTO v_creature
      FROM public.gamification_creatures
     WHERE theme_id = v_state.active_theme_id
       AND rarity = 'common'
       AND is_active = true
     ORDER BY random()
     LIMIT 1;
    IF FOUND THEN v_chosen_rarity := 'common'; END IF;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'metadata', jsonb_build_object('reason', 'theme_empty')
    );
  END IF;

  -- Place on active page at random position
  v_position_x := random()::real * 0.85 + 0.05;
  v_position_y := random()::real * 0.85 + 0.05;

  INSERT INTO public.member_creature_collection (
    family_id, family_member_id, creature_id,
    sticker_page_id, position_x, position_y,
    awarded_source_type, awarded_source_id
  ) VALUES (
    v_family_id, v_member_id, v_creature.id,
    v_state.active_page_id, v_position_x, v_position_y,
    COALESCE(p_deed_firing ->> 'source_type', 'contract_grant'),
    (p_deed_firing ->> 'id')::uuid
  )
  RETURNING id INTO v_new_id;

  UPDATE public.member_sticker_book_state
     SET creatures_earned_total = creatures_earned_total + 1
   WHERE id = v_state.id;

  RETURN jsonb_build_object(
    'status', 'granted',
    'grant_reference', v_new_id::text,
    'metadata', jsonb_build_object(
      'creature_name', v_creature.display_name,
      'creature_slug', v_creature.slug,
      'rarity', v_chosen_rarity,
      'family_member_id', v_member_id
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_creature_godmother IS
  'Phase 3 connector: rolls for a creature on deed firing. '
  'Replicates roll_creature_for_completion Steps 7-9 as a standalone godmother.';

-- ── 3. execute_page_unlock_godmother ────────────────────────────────
-- Unlocks the next sticker page when conditions are met.
-- Replicates the old roll_creature_for_completion Step 10.

CREATE OR REPLACE FUNCTION public.execute_page_unlock_godmother(
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
  v_family_id      UUID;
  v_member_id      UUID;
  v_state          RECORD;
  v_unlock_mode    TEXT;
  v_unlock_n       INTEGER;
  v_page           RECORD;
  v_new_id         UUID;
BEGIN
  v_family_id := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id := (p_deed_firing ->> 'family_member_id')::uuid;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'page_unlock_godmother: deed firing has no family_member_id'
    );
  END IF;

  -- Load sticker book state
  SELECT * INTO v_state
    FROM public.member_sticker_book_state
   WHERE family_member_id = v_member_id;

  IF NOT FOUND OR NOT COALESCE(v_state.is_enabled, false) THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'metadata', jsonb_build_object('reason', 'sticker_book_disabled')
    );
  END IF;

  -- Determine unlock condition
  v_unlock_mode := COALESCE(
    p_payload #>> '{payload_config,unlock_mode}',
    'every_n_creatures'
  );

  IF v_unlock_mode = 'immediate' THEN
    -- Always unlock (milestone rewards)
    NULL;
  ELSIF v_unlock_mode = 'every_n_creatures' THEN
    v_unlock_n := COALESCE(
      (p_payload #>> '{payload_config,unlock_n}')::integer,
      v_state.page_unlock_interval
    );

    IF v_unlock_n IS NULL OR v_unlock_n < 1 THEN
      v_unlock_n := 7; -- safe default
    END IF;

    IF v_state.creatures_earned_total = 0
       OR v_state.creatures_earned_total % v_unlock_n != 0 THEN
      RETURN jsonb_build_object(
        'status', 'no_op',
        'metadata', jsonb_build_object(
          'reason', 'threshold_not_reached',
          'creatures_earned', v_state.creatures_earned_total,
          'unlock_interval', v_unlock_n
        )
      );
    END IF;
  ELSE
    -- Unknown mode — treat as every_n_creatures with default interval
    v_unlock_n := v_state.page_unlock_interval;
    IF v_state.creatures_earned_total = 0
       OR v_state.creatures_earned_total % v_unlock_n != 0 THEN
      RETURN jsonb_build_object(
        'status', 'no_op',
        'metadata', jsonb_build_object(
          'reason', 'threshold_not_reached',
          'creatures_earned', v_state.creatures_earned_total,
          'unlock_interval', v_unlock_n
        )
      );
    END IF;
  END IF;

  -- Find next locked page by sort_order
  SELECT sp.* INTO v_page
    FROM public.gamification_sticker_pages sp
    LEFT JOIN public.member_page_unlocks mpu
      ON mpu.sticker_page_id = sp.id
     AND mpu.family_member_id = v_member_id
   WHERE sp.theme_id = v_state.active_theme_id
     AND sp.is_active = true
     AND mpu.id IS NULL
   ORDER BY sp.sort_order
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'metadata', jsonb_build_object('reason', 'all_pages_unlocked')
    );
  END IF;

  INSERT INTO public.member_page_unlocks (
    family_id, family_member_id, sticker_page_id,
    unlocked_trigger_type, creatures_at_unlock
  ) VALUES (
    v_family_id, v_member_id, v_page.id,
    'contract_grant', v_state.creatures_earned_total
  )
  RETURNING id INTO v_new_id;

  UPDATE public.member_sticker_book_state
     SET pages_unlocked_total = pages_unlocked_total + 1
   WHERE id = v_state.id;

  RETURN jsonb_build_object(
    'status', 'granted',
    'grant_reference', v_new_id::text,
    'metadata', jsonb_build_object(
      'page_name', v_page.display_name,
      'page_slug', v_page.slug,
      'family_member_id', v_member_id
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_page_unlock_godmother IS
  'Phase 3 connector: unlocks the next sticker page when creature count '
  'reaches the page_unlock_interval threshold. Replicates roll_creature_for_completion Step 10.';

-- ── 4. Seed contracts for kids with sticker books enabled ───────────
-- Restores creature roll + page unlock behavior on task_completion.
-- Each enabled kid gets two contracts: creature_godmother + page_unlock_godmother.

DO $$
DECLARE
  v_state  RECORD;
  v_mom_id UUID;
BEGIN
  FOR v_state IN
    SELECT msbs.family_id, msbs.family_member_id
      FROM public.member_sticker_book_state msbs
     WHERE msbs.is_enabled = true
  LOOP
    -- Find mom's family_members.id (created_by FK references family_members, not auth.users)
    SELECT fm.id INTO v_mom_id
      FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
     WHERE f.id = v_state.family_id
       AND fm.user_id = f.primary_parent_id;

    IF v_mom_id IS NULL THEN
      CONTINUE;
    END IF;

    -- creature_godmother contract (every task completion → roll for creature)
    INSERT INTO public.contracts (
      family_id, created_by, source_type, family_member_id,
      if_pattern, godmother_type, stroke_of,
      inheritance_level, override_mode,
      presentation_mode
    ) VALUES (
      v_state.family_id, v_mom_id, 'task_completion', v_state.family_member_id,
      'every_time', 'creature_godmother', 'immediate',
      'kid_override', 'replace',
      'silent'
    )
    ON CONFLICT DO NOTHING;

    -- page_unlock_godmother contract (every task completion → check page unlock threshold)
    INSERT INTO public.contracts (
      family_id, created_by, source_type, family_member_id,
      if_pattern, godmother_type, stroke_of,
      inheritance_level, override_mode,
      presentation_mode
    ) VALUES (
      v_state.family_id, v_mom_id, 'task_completion', v_state.family_member_id,
      'every_time', 'page_unlock_godmother', 'immediate',
      'kid_override', 'replace',
      'silent'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Seeded creature + page_unlock contracts for enabled sticker books';
END;
$$;

DO $$ BEGIN RAISE NOTICE 'migration 100225: creature_godmother + page_unlock_godmother + seed contracts'; END $$;
