-- Phase 3 Connector Architecture — Sub-task 2b
-- Replace earning_task_id FK with polymorphic (earning_source_type, earning_source_id).
-- Zero rows in production — zero-risk migration.
-- Enables coloring reveals to be wired to ANY deed, not just task completions.

-- Add polymorphic columns
ALTER TABLE public.member_coloring_reveals
  ADD COLUMN IF NOT EXISTS earning_source_type TEXT,
  ADD COLUMN IF NOT EXISTS earning_source_id UUID;

-- Migrate any existing data (zero rows expected, but defensive)
UPDATE public.member_coloring_reveals
   SET earning_source_type = 'task',
       earning_source_id = earning_task_id
 WHERE earning_task_id IS NOT NULL
   AND earning_source_id IS NULL;

-- Drop the old FK column and its index
DROP INDEX IF EXISTS member_coloring_reveals_earning_task_idx;
ALTER TABLE public.member_coloring_reveals DROP COLUMN IF EXISTS earning_task_id;

-- New index for polymorphic lookup
CREATE INDEX IF NOT EXISTS member_coloring_reveals_earning_source_idx
  ON public.member_coloring_reveals (earning_source_type, earning_source_id)
  WHERE earning_source_id IS NOT NULL AND is_active = true AND is_complete = false;

-- ── Update roll_creature_for_completion RPC ──────────────────────────
-- Only the Step 11 coloring reveal section changes:
-- earning_task_id → earning_source_type = 'task' AND earning_source_id = v_task.id

CREATE OR REPLACE FUNCTION public.roll_creature_for_completion(
  p_task_completion_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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
  v_page               RECORD;
  v_page_unlocked      BOOLEAN := false;
  v_next_page_id       UUID;
  v_position_x         REAL;
  v_position_y         REAL;
  v_common_pct         INTEGER;
  v_rare_pct           INTEGER;
  v_earning_mode       TEXT;
  v_should_award_creature BOOLEAN := false;
  v_segment_completed  BOOLEAN := false;
  v_segment_name       TEXT := NULL;
  v_segment_id         UUID := NULL;
  v_day_completed      BOOLEAN := false;
  v_page_earning_mode  TEXT;
  v_should_unlock_page BOOLEAN := false;
  v_reveal             RECORD;
  v_reveal_result      JSONB;
  v_color_reveals      JSONB := '[]'::jsonb;
  v_should_advance     BOOLEAN;
  v_creature_json      JSONB := NULL;
  v_page_json          JSONB := NULL;
BEGIN
  -- Step 1: Load context
  SELECT * INTO v_completion FROM public.task_completions WHERE id = p_task_completion_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'task_completion_not_found'); END IF;

  SELECT * INTO v_task FROM public.tasks WHERE id = v_completion.task_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'task_not_found'); END IF;

  -- Step 2: Gamification opt-in check
  IF COALESCE(v_task.counts_for_gamification, true) = false THEN
    RETURN jsonb_build_object('skipped_gamification_opt_out', true);
  END IF;

  SELECT * INTO v_member FROM public.family_members WHERE id = v_completion.family_member_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'family_member_not_found'); END IF;

  SELECT * INTO v_config FROM public.gamification_configs WHERE family_member_id = v_member.id;
  IF NOT FOUND OR v_config.enabled = false THEN
    RETURN jsonb_build_object('gamification_disabled', true);
  END IF;

  -- Step 3: Idempotency
  SELECT id INTO v_existing_creature
    FROM public.member_creature_collection
   WHERE awarded_source_id = p_task_completion_id LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'already_processed', true,
      'new_point_total', v_member.gamification_points,
      'new_streak', v_member.current_streak
    );
  END IF;

  -- Step 4: Filter by completion_type
  v_completion_type := COALESCE(v_completion.completion_type, 'complete');
  IF v_completion_type NOT IN ('complete', 'mastery_approved') THEN
    RETURN jsonb_build_object('skipped_completion_type', v_completion_type);
  END IF;

  -- Step 5: Points
  v_points_to_award := COALESCE(v_task.points_override, v_config.base_points_per_task);
  v_new_point_total := COALESCE(v_member.gamification_points, 0) + v_points_to_award;
  UPDATE public.family_members SET gamification_points = v_new_point_total WHERE id = v_member.id;

  -- Step 6: Streak
  IF v_member.last_task_completion_date IS NULL THEN
    v_new_streak := 1; v_streak_updated := true;
  ELSIF v_member.last_task_completion_date = CURRENT_DATE THEN
    v_new_streak := COALESCE(v_member.current_streak, 1); v_streak_updated := false;
  ELSIF v_member.last_task_completion_date = (CURRENT_DATE - INTERVAL '1 day')::date THEN
    v_new_streak := COALESCE(v_member.current_streak, 0) + 1; v_streak_updated := true;
  ELSE
    v_new_streak := 1; v_streak_updated := true;
  END IF;

  IF v_streak_updated THEN
    UPDATE public.family_members
       SET current_streak = v_new_streak,
           longest_streak = GREATEST(COALESCE(longest_streak, 0), v_new_streak),
           last_task_completion_date = CURRENT_DATE
     WHERE id = v_member.id;
  END IF;

  -- Step 7: Sticker book state
  SELECT * INTO v_state FROM public.member_sticker_book_state WHERE family_member_id = v_member.id;
  IF NOT FOUND OR v_state.is_enabled = false THEN
    RETURN jsonb_build_object(
      'points_awarded', v_points_to_award, 'new_point_total', v_new_point_total,
      'creature_awarded', false, 'creature', NULL,
      'page_unlocked', false, 'page', NULL,
      'streak_updated', v_streak_updated, 'new_streak', v_new_streak,
      'streak_milestone', NULL
    );
  END IF;

  -- Step 8: Creature earning
  v_earning_mode := COALESCE(v_state.creature_earning_mode, 'random_per_task');
  CASE v_earning_mode
    WHEN 'random_per_task' THEN
      v_creature_roll := floor(random() * 100)::int + 1;
      IF v_creature_roll <= v_state.creature_roll_chance_per_task THEN
        v_should_award_creature := true;
      END IF;
    WHEN 'every_n_completions' THEN
      UPDATE public.member_sticker_book_state
         SET creature_earning_counter = creature_earning_counter + 1
       WHERE id = v_state.id
       RETURNING creature_earning_counter INTO v_state.creature_earning_counter;
      IF v_state.creature_earning_counter >= v_state.creature_earning_threshold THEN
        v_should_award_creature := true;
        IF v_state.creature_earning_counter_resets THEN
          UPDATE public.member_sticker_book_state SET creature_earning_counter = 0 WHERE id = v_state.id;
        END IF;
      END IF;
    WHEN 'segment_complete' THEN
      IF v_task.task_segment_id IS NOT NULL THEN
        v_segment_completed := public.check_segment_completion(v_task.id);
        IF v_segment_completed THEN
          SELECT id, segment_name INTO v_segment_id, v_segment_name
            FROM public.task_segments WHERE id = v_task.task_segment_id AND is_active = true;
          IF FOUND THEN
            IF array_length(v_state.creature_earning_segment_ids, 1) IS NULL
               OR v_segment_id = ANY(v_state.creature_earning_segment_ids) THEN
              IF (SELECT creature_earning_enabled FROM public.task_segments WHERE id = v_segment_id) THEN
                v_should_award_creature := true;
              END IF;
            END IF;
          END IF;
        END IF;
      END IF;
    WHEN 'complete_the_day' THEN
      v_day_completed := public.check_day_completion(v_member.id);
      IF v_day_completed THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.member_creature_collection
           WHERE family_member_id = v_member.id
             AND awarded_source_type = 'day_complete'
             AND awarded_at::date = CURRENT_DATE
        ) THEN
          v_should_award_creature := true;
        END IF;
      END IF;
  ELSE
    v_should_award_creature := false;
  END CASE;

  -- Step 9: Pick rarity + creature + insert
  IF v_should_award_creature THEN
    v_common_pct := COALESCE((v_state.rarity_weights->>'common')::int, 85);
    v_rare_pct   := COALESCE((v_state.rarity_weights->>'rare')::int, 12);
    v_rarity_roll := floor(random() * 100)::int + 1;
    IF v_rarity_roll <= v_common_pct THEN v_chosen_rarity := 'common';
    ELSIF v_rarity_roll <= (v_common_pct + v_rare_pct) THEN v_chosen_rarity := 'rare';
    ELSE v_chosen_rarity := 'legendary';
    END IF;

    SELECT * INTO v_creature FROM public.gamification_creatures
     WHERE theme_id = v_state.active_theme_id AND rarity = v_chosen_rarity AND is_active = true
     ORDER BY random() LIMIT 1;
    IF NOT FOUND AND v_chosen_rarity = 'legendary' THEN
      SELECT * INTO v_creature FROM public.gamification_creatures
       WHERE theme_id = v_state.active_theme_id AND rarity = 'rare' AND is_active = true
       ORDER BY random() LIMIT 1;
      IF FOUND THEN v_chosen_rarity := 'rare'; END IF;
    END IF;
    IF NOT FOUND AND v_chosen_rarity IN ('rare','legendary') THEN
      SELECT * INTO v_creature FROM public.gamification_creatures
       WHERE theme_id = v_state.active_theme_id AND rarity = 'common' AND is_active = true
       ORDER BY random() LIMIT 1;
      IF FOUND THEN v_chosen_rarity := 'common'; END IF;
    END IF;

    IF FOUND THEN
      v_position_x := random()::real * 0.85 + 0.05;
      v_position_y := random()::real * 0.85 + 0.05;
      v_creature_awarded := true;
      INSERT INTO public.member_creature_collection (
        family_id, family_member_id, creature_id,
        sticker_page_id, position_x, position_y,
        awarded_source_type, awarded_source_id
      ) VALUES (
        v_member.family_id, v_member.id, v_creature.id,
        v_state.active_page_id, v_position_x, v_position_y,
        CASE WHEN v_earning_mode = 'complete_the_day' THEN 'day_complete' ELSE 'task_completion' END,
        p_task_completion_id
      );
      UPDATE public.member_sticker_book_state
         SET creatures_earned_total = creatures_earned_total + 1
       WHERE id = v_state.id;
      v_state.creatures_earned_total := v_state.creatures_earned_total + 1;
      v_creature_json := jsonb_build_object(
        'id', v_creature.id, 'slug', v_creature.slug,
        'display_name', v_creature.display_name, 'rarity', v_chosen_rarity,
        'description', v_creature.description, 'image_url', v_creature.image_url
      );
    END IF;
  END IF;

  -- Step 10: Page earning
  v_page_earning_mode := COALESCE(v_state.page_earning_mode, 'every_n_creatures');
  CASE v_page_earning_mode
    WHEN 'every_n_creatures' THEN
      IF v_creature_awarded AND v_state.creatures_earned_total > 0
         AND v_state.creatures_earned_total % v_state.page_unlock_interval = 0 THEN
        v_should_unlock_page := true;
      END IF;
    WHEN 'every_n_completions' THEN
      UPDATE public.member_sticker_book_state
         SET page_earning_completion_counter = page_earning_completion_counter + 1
       WHERE id = v_state.id
       RETURNING page_earning_completion_counter INTO v_state.page_earning_completion_counter;
      IF v_state.page_earning_completion_counter >= v_state.page_earning_completion_threshold THEN
        v_should_unlock_page := true;
        UPDATE public.member_sticker_book_state SET page_earning_completion_counter = 0 WHERE id = v_state.id;
      END IF;
    WHEN 'tracker_goal' THEN
      IF v_state.page_earning_tracker_widget_id IS NOT NULL THEN
        IF (SELECT count(*) FROM public.widget_data_points
             WHERE widget_id = v_state.page_earning_tracker_widget_id
               AND family_member_id = v_member.id
           ) >= COALESCE(v_state.page_earning_tracker_threshold, 5) THEN
          IF NOT EXISTS (
            SELECT 1 FROM public.member_page_unlocks
             WHERE family_member_id = v_member.id AND unlocked_trigger_type = 'tracker_goal'
               AND creatures_at_unlock = (
                 SELECT count(*) FROM public.widget_data_points
                  WHERE widget_id = v_state.page_earning_tracker_widget_id
                    AND family_member_id = v_member.id)
          ) THEN v_should_unlock_page := true; END IF;
        END IF;
      END IF;
  ELSE
    v_should_unlock_page := false;
  END CASE;

  IF v_should_unlock_page THEN
    SELECT sp.* INTO v_page
      FROM public.gamification_sticker_pages sp
      LEFT JOIN public.member_page_unlocks mpu
        ON mpu.sticker_page_id = sp.id AND mpu.family_member_id = v_member.id
     WHERE sp.theme_id = v_state.active_theme_id AND sp.is_active = true AND mpu.id IS NULL
     ORDER BY sp.sort_order LIMIT 1;
    IF FOUND THEN
      v_page_unlocked := true;
      v_next_page_id := v_page.id;
      INSERT INTO public.member_page_unlocks (
        family_id, family_member_id, sticker_page_id, unlocked_trigger_type, creatures_at_unlock
      ) VALUES (
        v_member.family_id, v_member.id, v_next_page_id,
        CASE v_page_earning_mode
          WHEN 'every_n_creatures' THEN 'creature_count'
          WHEN 'every_n_completions' THEN 'task_completion'
          WHEN 'tracker_goal' THEN 'tracker_goal'
          ELSE 'creature_count'
        END, v_state.creatures_earned_total
      );
      UPDATE public.member_sticker_book_state
         SET pages_unlocked_total = pages_unlocked_total + 1, active_page_id = v_next_page_id
       WHERE id = v_state.id;
      v_page_json := jsonb_build_object(
        'id', v_page.id, 'slug', v_page.slug, 'display_name', v_page.display_name,
        'scene', v_page.scene, 'season', v_page.season, 'image_url', v_page.image_url
      );
    END IF;
  END IF;

  -- Step 11: Advance coloring reveals (POLYMORPHIC: earning_source_type/earning_source_id)
  FOR v_reveal IN
    SELECT mcr.* FROM public.member_coloring_reveals mcr
     WHERE mcr.family_member_id = v_member.id
       AND mcr.is_active = true AND mcr.is_complete = false
  LOOP
    v_should_advance := false;

    -- Source-linked reveals: check if the completed task matches
    IF v_reveal.earning_source_id IS NOT NULL THEN
      IF v_reveal.earning_source_type = 'task' AND v_reveal.earning_source_id = v_task.id THEN
        v_should_advance := true;
      END IF;
    ELSE
      CASE v_reveal.earning_mode
        WHEN 'every_n_completions' THEN
          UPDATE public.member_coloring_reveals
             SET earning_counter = earning_counter + 1
           WHERE id = v_reveal.id
           RETURNING earning_counter INTO v_reveal.earning_counter;
          IF v_reveal.earning_counter >= v_reveal.earning_threshold THEN
            v_should_advance := true;
            UPDATE public.member_coloring_reveals SET earning_counter = 0 WHERE id = v_reveal.id;
          END IF;
        WHEN 'segment_complete' THEN
          IF v_segment_completed AND v_task.task_segment_id IS NOT NULL THEN
            IF array_length(v_reveal.earning_segment_ids, 1) IS NULL
               OR v_task.task_segment_id = ANY(v_reveal.earning_segment_ids) THEN
              v_should_advance := true;
            END IF;
          END IF;
        WHEN 'complete_the_day' THEN
          IF v_day_completed OR public.check_day_completion(v_member.id) THEN
            v_should_advance := true;
          END IF;
        WHEN 'random_per_task' THEN
          IF floor(random() * 100)::int + 1 <= 40 THEN
            v_should_advance := true;
          END IF;
      ELSE
        v_should_advance := false;
      END CASE;
    END IF;

    IF v_should_advance THEN
      v_reveal_result := public.advance_coloring_reveal(v_reveal.id);
      IF (v_reveal_result ->> 'advanced')::boolean IS TRUE THEN
        v_color_reveals := v_color_reveals || jsonb_build_object(
          'reveal_id', v_reveal.id,
          'new_step', (v_reveal_result ->> 'new_step')::int,
          'total_steps', (v_reveal_result ->> 'total_steps')::int,
          'is_complete', (v_reveal_result ->> 'is_complete')::boolean,
          'image_slug', v_reveal_result ->> 'image_slug'
        );
      END IF;
    END IF;
  END LOOP;

  -- Step 12: Return
  RETURN jsonb_build_object(
    'points_awarded', v_points_to_award, 'new_point_total', v_new_point_total,
    'creature_awarded', v_creature_awarded, 'creature', v_creature_json,
    'page_unlocked', v_page_unlocked, 'page', v_page_json,
    'streak_updated', v_streak_updated, 'new_streak', v_new_streak,
    'streak_milestone', v_streak_milestone,
    'segment_completed', CASE WHEN v_segment_completed AND v_segment_id IS NOT NULL
      THEN jsonb_build_object('segment_id', v_segment_id, 'segment_name', v_segment_name)
      ELSE NULL END,
    'coloring_reveals_advanced', v_color_reveals
  );
END;
$fn$;

RAISE NOTICE 'migration 100201: coloring reveal polymorphic extension + RPC update';
