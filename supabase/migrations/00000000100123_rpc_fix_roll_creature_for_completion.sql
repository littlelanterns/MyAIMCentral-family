-- Migration: Fix PL/pgSQL RECORD bug in roll_creature_for_completion
-- Problem: v_page RECORD is only assigned inside Step 10's IF FOUND block.
--          Step 11's CASE expression accesses v_page.id even when the CASE
--          branch evaluates to false, but PL/pgSQL inspects the tuple structure
--          statically and throws "record v_page is not assigned yet" (~85-100%
--          of calls, since page unlock only fires every N creatures).
-- Fix:     Pre-declare v_creature_jsonb / v_page_jsonb as JSONB := NULL.
--          Populate them inside the respective IF FOUND blocks.
--          Step 11 RETURN uses the JSONB variables instead of RECORD field access.
-- Scope:   CREATE OR REPLACE — safe, replaces the function in-place.

CREATE OR REPLACE FUNCTION public.roll_creature_for_completion(
  p_task_completion_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completion         RECORD;
  v_task               RECORD;
  v_member             RECORD;
  v_config             RECORD;
  v_state              RECORD;
  v_existing_creature  UUID;
  v_completion_type    TEXT;
  v_points_to_award    INTEGER := 0;
  v_new_point_total    INTEGER := 0;
  v_streak_updated     BOOLEAN := false;
  v_new_streak         INTEGER := 0;
  v_streak_milestone   INTEGER := NULL;
  v_creature_roll      INTEGER;
  v_rarity_roll        INTEGER;
  v_chosen_rarity      TEXT := NULL;
  v_creature           RECORD;
  v_creature_awarded   BOOLEAN := false;
  v_creature_jsonb     JSONB := NULL;       -- FIX: safe JSONB holder
  v_page               RECORD;
  v_page_unlocked      BOOLEAN := false;
  v_page_jsonb         JSONB := NULL;       -- FIX: safe JSONB holder
  v_next_page_id       UUID;
  v_position_x         REAL;
  v_position_y         REAL;
  v_common_pct         INTEGER;
  v_rare_pct           INTEGER;
BEGIN
  -- Step 1: Load task_completion + task + member context
  SELECT * INTO v_completion
    FROM public.task_completions
   WHERE id = p_task_completion_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'task_completion_not_found');
  END IF;

  SELECT * INTO v_task FROM public.tasks WHERE id = v_completion.task_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'task_not_found');
  END IF;

  SELECT * INTO v_member
    FROM public.family_members
   WHERE id = v_completion.family_member_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'family_member_not_found');
  END IF;

  SELECT * INTO v_config
    FROM public.gamification_configs
   WHERE family_member_id = v_member.id;
  IF NOT FOUND OR v_config.enabled = false THEN
    RETURN jsonb_build_object('gamification_disabled', true);
  END IF;

  -- Step 2: Idempotency — has this completion already been processed?
  SELECT id INTO v_existing_creature
    FROM public.member_creature_collection
   WHERE awarded_source_id = p_task_completion_id
   LIMIT 1;
  IF FOUND THEN
    -- Already processed. Return current state without re-awarding.
    RETURN jsonb_build_object(
      'already_processed', true,
      'new_point_total', v_member.gamification_points,
      'new_streak', v_member.current_streak
    );
  END IF;

  -- Step 3: Filter by completion_type
  -- (PRD-09A/09B Build J added completion_type for practice/mastery flows)
  v_completion_type := COALESCE(v_completion.completion_type, 'complete');
  IF v_completion_type NOT IN ('complete', 'mastery_approved') THEN
    -- Practice / mastery_submit / other types do NOT trigger the pipeline.
    -- Per Q8 = Option C.
    RETURN jsonb_build_object(
      'skipped_completion_type', v_completion_type
    );
  END IF;

  -- Step 4: Calculate points (points_override on task wins, fallback to config)
  v_points_to_award := COALESCE(v_task.points_override, v_config.base_points_per_task);
  v_new_point_total := COALESCE(v_member.gamification_points, 0) + v_points_to_award;

  UPDATE public.family_members
     SET gamification_points = v_new_point_total
   WHERE id = v_member.id;

  -- Step 5: Update streak (naive consecutive-day per Q5 = Option B)
  IF v_member.last_task_completion_date IS NULL THEN
    v_new_streak := 1;
    v_streak_updated := true;
  ELSIF v_member.last_task_completion_date = CURRENT_DATE THEN
    -- Already completed a task today; streak unchanged
    v_new_streak := COALESCE(v_member.current_streak, 1);
    v_streak_updated := false;
  ELSIF v_member.last_task_completion_date = (CURRENT_DATE - INTERVAL '1 day')::date THEN
    -- Yesterday — increment
    v_new_streak := COALESCE(v_member.current_streak, 0) + 1;
    v_streak_updated := true;
  ELSE
    -- Gap — reset to 1
    v_new_streak := 1;
    v_streak_updated := true;
  END IF;

  IF v_streak_updated THEN
    UPDATE public.family_members
       SET current_streak = v_new_streak,
           longest_streak = GREATEST(COALESCE(longest_streak, 0), v_new_streak),
           last_task_completion_date = CURRENT_DATE
     WHERE id = v_member.id;
  END IF;

  -- Step 6: Roll creature (only if sticker book enabled)
  SELECT * INTO v_state
    FROM public.member_sticker_book_state
   WHERE family_member_id = v_member.id;
  IF NOT FOUND OR v_state.is_enabled = false THEN
    -- Points + streak only, no creature roll
    RETURN jsonb_build_object(
      'points_awarded',    v_points_to_award,
      'new_point_total',   v_new_point_total,
      'creature_awarded',  false,
      'creature',          NULL,
      'page_unlocked',     false,
      'page',              NULL,
      'streak_updated',    v_streak_updated,
      'new_streak',        v_new_streak,
      'streak_milestone',  NULL
    );
  END IF;

  -- d100 vs creature_roll_chance_per_task (default 40)
  v_creature_roll := floor(random() * 100)::int + 1;
  IF v_creature_roll > v_state.creature_roll_chance_per_task THEN
    -- Roll failed — points + streak only
    RETURN jsonb_build_object(
      'points_awarded',    v_points_to_award,
      'new_point_total',   v_new_point_total,
      'creature_awarded',  false,
      'creature',          NULL,
      'page_unlocked',     false,
      'page',              NULL,
      'streak_updated',    v_streak_updated,
      'new_streak',        v_new_streak,
      'streak_milestone',  NULL
    );
  END IF;

  -- Step 7: Pick rarity from weights JSONB
  v_common_pct := COALESCE((v_state.rarity_weights->>'common')::int, 85);
  v_rare_pct   := COALESCE((v_state.rarity_weights->>'rare')::int, 12);
  v_rarity_roll := floor(random() * 100)::int + 1;
  IF v_rarity_roll <= v_common_pct THEN
    v_chosen_rarity := 'common';
  ELSIF v_rarity_roll <= (v_common_pct + v_rare_pct) THEN
    v_chosen_rarity := 'rare';
  ELSE
    v_chosen_rarity := 'legendary';
  END IF;

  -- Step 8: Pick a creature from the rarity pool. Fall through to lower tiers
  -- if the chosen tier has no creatures.
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

  IF NOT FOUND AND v_chosen_rarity IN ('rare','legendary') THEN
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
    -- Theme has zero active creatures — degrade gracefully
    RETURN jsonb_build_object(
      'points_awarded',    v_points_to_award,
      'new_point_total',   v_new_point_total,
      'creature_awarded',  false,
      'creature',          NULL,
      'page_unlocked',     false,
      'page',              NULL,
      'streak_updated',    v_streak_updated,
      'new_streak',        v_new_streak,
      'streak_milestone',  NULL
    );
  END IF;

  -- Step 9: Write creature award + auto-place on active page
  v_position_x := random()::real * 0.85 + 0.05;  -- 0.05–0.90
  v_position_y := random()::real * 0.85 + 0.05;
  v_creature_awarded := true;

  -- FIX: Build creature JSONB while RECORD is in scope
  v_creature_jsonb := jsonb_build_object(
    'id',           v_creature.id,
    'slug',         v_creature.slug,
    'display_name', v_creature.display_name,
    'rarity',       v_chosen_rarity,
    'description',  v_creature.description,
    'image_url',    v_creature.image_url
  );

  INSERT INTO public.member_creature_collection (
    family_id, family_member_id, creature_id,
    sticker_page_id, position_x, position_y,
    awarded_source_type, awarded_source_id
  ) VALUES (
    v_member.family_id, v_member.id, v_creature.id,
    v_state.active_page_id, v_position_x, v_position_y,
    'task_completion', p_task_completion_id
  );

  UPDATE public.member_sticker_book_state
     SET creatures_earned_total = creatures_earned_total + 1
   WHERE id = v_state.id;

  -- Refresh the running total for the unlock check
  v_state.creatures_earned_total := v_state.creatures_earned_total + 1;

  -- Step 10: Check for page unlock
  IF v_state.page_unlock_mode = 'every_n_creatures'
     AND v_state.creatures_earned_total > 0
     AND v_state.creatures_earned_total % v_state.page_unlock_interval = 0 THEN

    -- Find the next locked page (next sort_order without an unlock row)
    SELECT sp.* INTO v_page
      FROM public.gamification_sticker_pages sp
      LEFT JOIN public.member_page_unlocks mpu
        ON mpu.sticker_page_id = sp.id
       AND mpu.family_member_id = v_member.id
     WHERE sp.theme_id = v_state.active_theme_id
       AND sp.is_active = true
       AND mpu.id IS NULL
     ORDER BY sp.sort_order
     LIMIT 1;

    IF FOUND THEN
      v_page_unlocked := true;
      v_next_page_id := v_page.id;

      -- FIX: Build page JSONB while RECORD is in scope
      v_page_jsonb := jsonb_build_object(
        'id',           v_page.id,
        'slug',         v_page.slug,
        'display_name', v_page.display_name,
        'scene',        v_page.scene,
        'season',       v_page.season,
        'image_url',    v_page.image_url
      );

      INSERT INTO public.member_page_unlocks (
        family_id, family_member_id, sticker_page_id,
        unlocked_trigger_type, creatures_at_unlock
      ) VALUES (
        v_member.family_id, v_member.id, v_next_page_id,
        'creature_count', v_state.creatures_earned_total
      );

      UPDATE public.member_sticker_book_state
         SET pages_unlocked_total = pages_unlocked_total + 1,
             active_page_id = v_next_page_id
       WHERE id = v_state.id;
    END IF;
  END IF;

  -- Step 11: Return the full payload for client modal coordination
  -- FIX: Use pre-built JSONB variables instead of accessing RECORD fields
  --      in CASE expressions (avoids "record is not assigned yet" error)
  RETURN jsonb_build_object(
    'points_awarded',    v_points_to_award,
    'new_point_total',   v_new_point_total,
    'creature_awarded',  v_creature_awarded,
    'creature',          v_creature_jsonb,
    'page_unlocked',     v_page_unlocked,
    'page',              v_page_jsonb,
    'streak_updated',    v_streak_updated,
    'new_streak',        v_new_streak,
    'streak_milestone',  v_streak_milestone
  );
END;
$$ ;
