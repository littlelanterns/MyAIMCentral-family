
-- ============================================================================
-- 5. RPC — roll_creature_for_completion(p_task_completion_id UUID)
-- ============================================================================
-- Per Q6 = Option B: PostgreSQL RPC is the authoritative gamification pipeline
-- endpoint. Server-side, transactional, idempotency-safe by awarded_source_id.
-- Called by useCompleteTask + useApproveCompletion in Sub-phase C.
--
-- Returns JSONB with:
--   { points_awarded, new_point_total,
--     creature_awarded, creature: {...} | null,
--     page_unlocked, page: {...} | null,
--     streak_updated, new_streak, streak_milestone }

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
  v_creature           RECORD := NULL;
  v_creature_awarded   BOOLEAN := false;
  v_page               RECORD := NULL;
  v_page_unlocked      BOOLEAN := false;
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
  RETURN jsonb_build_object(
    'points_awarded',    v_points_to_award,
    'new_point_total',   v_new_point_total,
    'creature_awarded',  v_creature_awarded,
    'creature', CASE WHEN v_creature_awarded THEN jsonb_build_object(
      'id',           v_creature.id,
      'slug',         v_creature.slug,
      'display_name', v_creature.display_name,
      'rarity',       v_chosen_rarity,
      'description',  v_creature.description,
      'image_url',    v_creature.image_url
    ) ELSE NULL END,
    'page_unlocked',     v_page_unlocked,
    'page', CASE WHEN v_page_unlocked THEN jsonb_build_object(
      'id',           v_page.id,
      'slug',         v_page.slug,
      'display_name', v_page.display_name,
      'scene',        v_page.scene,
      'season',       v_page.season,
      'image_url',    v_page.image_url
    ) ELSE NULL END,
    'streak_updated',    v_streak_updated,
    'new_streak',        v_new_streak,
    'streak_milestone',  v_streak_milestone
  );
END;
$$;

COMMENT ON FUNCTION public.roll_creature_for_completion(UUID) IS
  'Build M (Q6=B): Authoritative gamification pipeline. Called from useCompleteTask after task completion. Idempotency-safe via awarded_source_id check. Returns JSONB with points/streak/creature/page payload for client modal coordination.';

REVOKE ALL ON FUNCTION public.roll_creature_for_completion(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.roll_creature_for_completion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.roll_creature_for_completion(UUID) TO service_role;


-- ============================================================================
-- 6. TRIGGER FUNCTION REWRITE — auto_provision_member_resources
-- ============================================================================
-- ⚠️ COLLISION-CRITICAL SECTION ⚠️
--
-- The live function (captured 2026-04-07 via pg_get_functiondef before this
-- migration was written) has 4 distinct branches: play, guided, independent
-- (Build N teen Phase D), and adult. Build M's job is to PRESERVE all 4
-- branches verbatim and ADD gamification provisioning at the end.
--
-- Steps added by Build M (after the existing rhythm_configs branches):
--   5. INSERT gamification_configs (shell-appropriate defaults)
--   6. INSERT member_sticker_book_state (Woodland Felt default theme)
--   7. Bootstrap first sticker page unlock + set active_page_id
--
-- All idempotency uses ON CONFLICT DO NOTHING / IF NOT EXISTS so re-running
-- is safe.

CREATE OR REPLACE FUNCTION public.auto_provision_member_resources()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  dash_type        TEXT;
  v_woodland_id    UUID;
  v_first_page_id  UUID;
BEGIN
  -- ============================================================
  -- EXISTING BRANCHES (preserved verbatim from live production)
  -- ============================================================

  -- 1. Create personal archive folder
  INSERT INTO public.archive_folders (family_id, member_id, folder_name, folder_type)
  VALUES (NEW.family_id, NEW.id, NEW.display_name || '''s Archives', 'family_member')
  ON CONFLICT DO NOTHING;

  -- 2. Create dashboard_config if member has a dashboard
  IF NEW.dashboard_enabled IS NOT false THEN
    IF NEW.dashboard_mode = 'play' THEN
      dash_type := 'play';
    ELSIF NEW.dashboard_mode = 'guided' THEN
      dash_type := 'guided';
    ELSE
      dash_type := 'personal';
    END IF;

    INSERT INTO public.dashboard_configs (family_id, family_member_id, dashboard_type)
    VALUES (NEW.family_id, NEW.id, dash_type)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 3. Create Backburner & Ideas lists for non-Guided/Play members
  IF NEW.dashboard_mode IS NULL OR NEW.dashboard_mode NOT IN ('guided', 'play') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.lists
      WHERE family_id = NEW.family_id
        AND owner_id = NEW.id
        AND list_type = 'backburner'
        AND archived_at IS NULL
    ) THEN
      INSERT INTO public.lists (family_id, owner_id, title, list_type)
      VALUES (NEW.family_id, NEW.id, 'Backburner', 'backburner');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.lists
      WHERE family_id = NEW.family_id
        AND owner_id = NEW.id
        AND list_type = 'ideas'
        AND archived_at IS NULL
    ) THEN
      INSERT INTO public.lists (family_id, owner_id, title, list_type)
      VALUES (NEW.family_id, NEW.id, 'Ideas', 'ideas');
    END IF;
  END IF;

  -- 4. Seed default rhythm_configs based on role / dashboard_mode
  IF NEW.dashboard_mode = 'play' THEN
    -- Play: morning only (simplified sections) — unchanged from 100112
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning', 'default', true,
      '[
        {"section_type":"encouraging_message","enabled":true,"order":1,"config":{}},
        {"section_type":"routine_checklist","enabled":true,"order":2,"config":{}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  ELSIF NEW.dashboard_mode = 'guided' THEN
    -- Guided: morning rhythm — 3 sections (unchanged from 100112)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning', 'default', true,
      '[
        {"section_type":"encouraging_message","enabled":true,"order":1,"config":{}},
        {"section_type":"best_intentions_focus","enabled":true,"order":2,"config":{}},
        {"section_type":"calendar_preview","enabled":true,"order":3,"config":{"scope":"member"}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Guided: mini evening rhythm — 5 sections (unchanged from 100112)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       section_order_locked, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'evening', 'Evening', 'default', true, true,
      '[
        {"section_type":"guided_day_highlights","enabled":true,"order":1,"config":{}},
        {"section_type":"guided_pride_reflection","enabled":true,"order":2,"config":{}},
        {"section_type":"guided_reflections","enabled":true,"order":3,"config":{}},
        {"section_type":"guided_tomorrow_lookahead","enabled":true,"order":4,"config":{}},
        {"section_type":"close_my_day","enabled":true,"order":5,"config":{}}
      ]'::jsonb,
      '{"start_hour":18,"end_hour":24,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  ELSIF NEW.dashboard_mode = 'independent' THEN
    -- Phase D (Build N): Independent Teen tailored rhythms (Enhancement 7)
    -- Morning (enabled) — 7 sections, reflection_guideline_count=2,
    -- display_name='Morning Check-in'. No task_preview (front-door rule),
    -- no brain_dump (teens dump in evening MindSweep-Lite, not morning).
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       reflection_guideline_count, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning Check-in', 'default', true, 2,
      '[
        {"section_type":"guiding_star_rotation","enabled":true,"order":1,"config":{"framingText":"You said this matters to you:"}},
        {"section_type":"morning_priorities_recall","enabled":true,"order":2,"config":{}},
        {"section_type":"calendar_preview","enabled":true,"order":3,"config":{"scope":"member"}},
        {"section_type":"on_the_horizon","enabled":true,"order":4,"config":{"lookahead_days":7,"max_items":5}},
        {"section_type":"morning_insight","enabled":true,"order":5,"config":{"audience":"teen"}},
        {"section_type":"feature_discovery","enabled":true,"order":6,"config":{"audience":"teen"}},
        {"section_type":"rhythm_tracker_prompts","enabled":true,"order":7,"config":{}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Evening (enabled, section_order_locked=true) — 8 sections
    -- Teen framing via config: greeting variant, victories title, closing
    -- framing, MindSweep-Lite audience flag. Each section component reads
    -- its config at render time; all adult code paths stay unchanged.
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       reflection_guideline_count, section_order_locked, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'evening', 'Evening Check-in', 'default', true, 2, true,
      '[
        {"section_type":"evening_greeting","enabled":true,"order":1,"config":{"variant":"teen"}},
        {"section_type":"accomplishments_victories","enabled":true,"order":2,"config":{"title":"What went right today"}},
        {"section_type":"evening_tomorrow_capture","enabled":true,"order":3,"config":{}},
        {"section_type":"mindsweep_lite","enabled":true,"order":4,"config":{"collapsed_by_default":true,"audience":"teen"}},
        {"section_type":"reflections","enabled":true,"order":5,"config":{}},
        {"section_type":"closing_thought","enabled":true,"order":6,"config":{"framingText":"Something you believe:"}},
        {"section_type":"rhythm_tracker_prompts","enabled":true,"order":7,"config":{}},
        {"section_type":"close_my_day","enabled":true,"order":8,"config":{}}
      ]'::jsonb,
      '{"start_hour":18,"end_hour":24,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Weekly / Monthly / Quarterly — teens get identical content to adults
    -- (Phase D scope: only morning + evening are teen-differentiated)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'weekly_review', 'Weekly Review', 'default', true,
      '[
        {"section_type":"weekly_stats","enabled":true,"order":1,"config":{}},
        {"section_type":"top_victories","enabled":true,"order":2,"config":{}},
        {"section_type":"next_week_preview","enabled":true,"order":3,"config":{}},
        {"section_type":"weekly_reflection_prompt","enabled":true,"order":4,"config":{}},
        {"section_type":"weekly_review_deep_dive","enabled":true,"order":5,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"weekly","day_of_week":5}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'monthly_review', 'Monthly Review', 'default', false,
      '[
        {"section_type":"month_at_a_glance","enabled":true,"order":1,"config":{}},
        {"section_type":"highlight_reel","enabled":true,"order":2,"config":{}},
        {"section_type":"reports_link","enabled":true,"order":3,"config":{}},
        {"section_type":"monthly_review_deep_dive","enabled":true,"order":4,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"monthly","day_of_month":1}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'quarterly_inventory', 'Quarterly Inventory', 'default', false,
      '[
        {"section_type":"stale_areas","enabled":true,"order":1,"config":{}},
        {"section_type":"quick_win_suggestion","enabled":true,"order":2,"config":{}},
        {"section_type":"lifelantern_launch_link","enabled":true,"order":3,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"lifelantern_staleness","interval_days":90}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  ELSE
    -- Adult (dashboard_mode IS NULL or 'personal') — unchanged from 100112
    -- Morning (enabled) — 9 sections
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning Rhythm', 'default', true,
      '[
        {"section_type":"guiding_star_rotation","enabled":true,"order":1,"config":{}},
        {"section_type":"morning_priorities_recall","enabled":true,"order":2,"config":{}},
        {"section_type":"best_intentions_focus","enabled":true,"order":3,"config":{}},
        {"section_type":"calendar_preview","enabled":true,"order":4,"config":{}},
        {"section_type":"on_the_horizon","enabled":true,"order":5,"config":{"lookahead_days":7,"max_items":5}},
        {"section_type":"morning_insight","enabled":true,"order":6,"config":{}},
        {"section_type":"brain_dump","enabled":true,"order":7,"config":{}},
        {"section_type":"feature_discovery","enabled":true,"order":8,"config":{}},
        {"section_type":"periodic_cards_slot","enabled":true,"order":9,"config":{}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Evening (enabled, section_order_locked=true) — 13 sections
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       section_order_locked, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'evening', 'Evening Rhythm', 'default', true, true,
      '[
        {"section_type":"evening_greeting","enabled":true,"order":1,"config":{}},
        {"section_type":"accomplishments_victories","enabled":true,"order":2,"config":{}},
        {"section_type":"completed_meetings","enabled":true,"order":3,"config":{}},
        {"section_type":"milestone_celebrations","enabled":true,"order":4,"config":{}},
        {"section_type":"carry_forward","enabled":false,"order":5,"config":{}},
        {"section_type":"evening_tomorrow_capture","enabled":true,"order":6,"config":{}},
        {"section_type":"mindsweep_lite","enabled":true,"order":7,"config":{"collapsed_by_default":true}},
        {"section_type":"closing_thought","enabled":true,"order":8,"config":{}},
        {"section_type":"from_your_library","enabled":true,"order":9,"config":{}},
        {"section_type":"before_close_the_day","enabled":true,"order":10,"config":{}},
        {"section_type":"reflections","enabled":true,"order":11,"config":{}},
        {"section_type":"rhythm_tracker_prompts","enabled":true,"order":12,"config":{}},
        {"section_type":"close_my_day","enabled":true,"order":13,"config":{}}
      ]'::jsonb,
      '{"start_hour":18,"end_hour":24,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Weekly / Monthly / Quarterly — unchanged from 100112
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'weekly_review', 'Weekly Review', 'default', true,
      '[
        {"section_type":"weekly_stats","enabled":true,"order":1,"config":{}},
        {"section_type":"top_victories","enabled":true,"order":2,"config":{}},
        {"section_type":"next_week_preview","enabled":true,"order":3,"config":{}},
        {"section_type":"weekly_reflection_prompt","enabled":true,"order":4,"config":{}},
        {"section_type":"weekly_review_deep_dive","enabled":true,"order":5,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"weekly","day_of_week":5}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'monthly_review', 'Monthly Review', 'default', false,
      '[
        {"section_type":"month_at_a_glance","enabled":true,"order":1,"config":{}},
        {"section_type":"highlight_reel","enabled":true,"order":2,"config":{}},
        {"section_type":"reports_link","enabled":true,"order":3,"config":{}},
        {"section_type":"monthly_review_deep_dive","enabled":true,"order":4,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"monthly","day_of_month":1}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'quarterly_inventory', 'Quarterly Inventory', 'default', false,
      '[
        {"section_type":"stale_areas","enabled":true,"order":1,"config":{}},
        {"section_type":"quick_win_suggestion","enabled":true,"order":2,"config":{}},
        {"section_type":"lifelantern_launch_link","enabled":true,"order":3,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"lifelantern_staleness","interval_days":90}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  END IF;

  -- ============================================================
  -- BUILD M ADDITIONS — gamification + sticker book provisioning
  -- ============================================================

  -- 5. Insert gamification_configs with shell-appropriate defaults
  INSERT INTO public.gamification_configs (
    family_id, family_member_id,
    enabled, base_points_per_task, currency_name, currency_icon
  ) VALUES (
    NEW.family_id, NEW.id,
    -- enabled: ON for play/guided, OFF for adult/independent (mom can flip later)
    CASE WHEN NEW.dashboard_mode IN ('play', 'guided') THEN true ELSE false END,
    -- base_points_per_task: 1 for play (small numbers feel big), 10 for everyone else
    CASE WHEN NEW.dashboard_mode = 'play' THEN 1 ELSE 10 END,
    -- currency_name: 'stars' for play, 'points' otherwise
    CASE WHEN NEW.dashboard_mode = 'play' THEN 'stars' ELSE 'points' END,
    '⭐'
  )
  ON CONFLICT (family_member_id) DO NOTHING;

  -- 6. Insert member_sticker_book_state with Woodland Felt as default theme
  SELECT id INTO v_woodland_id
    FROM public.gamification_themes
   WHERE theme_slug = 'woodland_felt'
   LIMIT 1;

  IF v_woodland_id IS NOT NULL THEN
    INSERT INTO public.member_sticker_book_state (
      family_id, family_member_id, active_theme_id
    ) VALUES (
      NEW.family_id, NEW.id, v_woodland_id
    )
    ON CONFLICT (family_member_id) DO NOTHING;

    -- 7. Bootstrap first sticker page unlock (sort_order=1 for Woodland Felt)
    SELECT id INTO v_first_page_id
      FROM public.gamification_sticker_pages
     WHERE theme_id = v_woodland_id
       AND is_active = true
     ORDER BY sort_order
     LIMIT 1;

    IF v_first_page_id IS NOT NULL THEN
      INSERT INTO public.member_page_unlocks (
        family_id, family_member_id, sticker_page_id, unlocked_trigger_type
      ) VALUES (
        NEW.family_id, NEW.id, v_first_page_id, 'bootstrap'
      )
      ON CONFLICT (family_member_id, sticker_page_id) DO NOTHING;

      -- Set active_page_id on the state row to the bootstrapped page
      UPDATE public.member_sticker_book_state
         SET active_page_id = v_first_page_id
       WHERE family_member_id = NEW.id
         AND active_page_id IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.auto_provision_member_resources() IS
  'Build M (collision-resolved): Provisions all per-member resources on family_members INSERT. Preserves Build N teen branch verbatim and adds gamification_configs + member_sticker_book_state + bootstrap page unlock.';


-- ============================================================================
-- 7. BACKFILL — gamification rows for existing 26 family_members
-- ============================================================================
-- Idempotent: every INSERT uses NOT EXISTS guards.

DO $$
DECLARE
  v_woodland_id    UUID;
  v_first_page_id  UUID;
  v_member         RECORD;
BEGIN
  SELECT id INTO v_woodland_id
    FROM public.gamification_themes
   WHERE theme_slug = 'woodland_felt'
   LIMIT 1;

  SELECT id INTO v_first_page_id
    FROM public.gamification_sticker_pages
   WHERE theme_id = v_woodland_id AND is_active = true
   ORDER BY sort_order
   LIMIT 1;

  IF v_woodland_id IS NULL OR v_first_page_id IS NULL THEN
    RAISE EXCEPTION 'Woodland Felt theme or first page missing — seeds did not run before backfill';
  END IF;

  FOR v_member IN
    SELECT id, family_id, dashboard_mode FROM public.family_members WHERE is_active = true
  LOOP
    -- gamification_configs
    INSERT INTO public.gamification_configs (
      family_id, family_member_id,
      enabled, base_points_per_task, currency_name, currency_icon
    )
    SELECT
      v_member.family_id, v_member.id,
      CASE WHEN v_member.dashboard_mode IN ('play','guided') THEN true ELSE false END,
      CASE WHEN v_member.dashboard_mode = 'play' THEN 1 ELSE 10 END,
      CASE WHEN v_member.dashboard_mode = 'play' THEN 'stars' ELSE 'points' END,
      '⭐'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.gamification_configs WHERE family_member_id = v_member.id
    );

    -- member_sticker_book_state
    INSERT INTO public.member_sticker_book_state (
      family_id, family_member_id, active_theme_id, active_page_id
    )
    SELECT
      v_member.family_id, v_member.id, v_woodland_id, v_first_page_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.member_sticker_book_state WHERE family_member_id = v_member.id
    );

    -- Bootstrap page unlock
    INSERT INTO public.member_page_unlocks (
      family_id, family_member_id, sticker_page_id, unlocked_trigger_type
    )
    SELECT
      v_member.family_id, v_member.id, v_first_page_id, 'bootstrap'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.member_page_unlocks
       WHERE family_member_id = v_member.id
         AND sticker_page_id = v_first_page_id
    );
  END LOOP;
END $$;


-- ============================================================================
-- 8. FEATURE KEYS — registry + tier grants
-- ============================================================================

-- Register 7 new feature keys (skipping any that may already exist)
INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('gamification_basic',          'Gamification (Basic)',          'Points earning + naive consecutive-day streak tracking',                'PRD-24'),
  ('gamification_sticker_book',   'Sticker Book',                  'Creature collection + sticker book page unlocks (Woodland Felt theme)', 'PRD-24+PRD-26 Build M'),
  ('play_dashboard',              'Play Dashboard',                'Age-appropriate Play shell dashboard layout',                           'PRD-26'),
  ('play_reveal_tiles',           'Play Reveal Tiles',             'Surprise reveal task tiles on Play Dashboard (STUBBED in Build M)',     'PRD-26'),
  ('play_reading_support',        'Play Reading Support',          'Larger font + TTS icon visibility for early readers',                   'PRD-26'),
  ('play_message_receive',        'Play Message Receive',          'Receive mom messages on the Play Dashboard',                            'PRD-26'),
  ('gamification_streak_milestones','Streak Milestone Bonuses',    'Bonus points at streak milestones (STUBBED in Build M)',                'PRD-24')
ON CONFLICT (feature_key) DO NOTHING;

-- Grant tier access (5 role groups × 7 keys = 35 rows)
-- During beta useCanAccess() returns true for all; this is post-beta infrastructure.
DO $$
DECLARE
  v_essential_id UUID;
  v_enhanced_id  UUID;
  v_full_id      UUID;
BEGIN
  SELECT id INTO v_essential_id FROM public.subscription_tiers WHERE slug = 'essential' LIMIT 1;
  SELECT id INTO v_enhanced_id  FROM public.subscription_tiers WHERE slug = 'enhanced'  LIMIT 1;
  SELECT id INTO v_full_id      FROM public.subscription_tiers WHERE slug = 'full_magic' LIMIT 1;

  -- gamification_basic, gamification_sticker_book, play_dashboard, play_reading_support,
  -- play_message_receive — Essential tier and up for all 5 role groups
  INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
  SELECT fk, rg, v_essential_id, true
  FROM (VALUES
    ('gamification_basic'),
    ('gamification_sticker_book'),
    ('play_dashboard'),
    ('play_reading_support'),
    ('play_message_receive')
  ) AS fks(fk),
  (VALUES
    ('mom'),
    ('dad_adults'),
    ('special_adults'),
    ('independent_teens'),
    ('guided_kids'),
    ('play_kids')
  ) AS rgs(rg)
  ON CONFLICT DO NOTHING;

  -- play_reveal_tiles + gamification_streak_milestones — Enhanced tier and up
  INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
  SELECT fk, rg, v_enhanced_id, true
  FROM (VALUES
    ('play_reveal_tiles'),
    ('gamification_streak_milestones')
  ) AS fks(fk),
  (VALUES
    ('mom'),
    ('dad_adults'),
    ('special_adults'),
    ('independent_teens'),
    ('guided_kids'),
    ('play_kids')
  ) AS rgs(rg)
  ON CONFLICT DO NOTHING;
END $$;


-- ============================================================================
-- 9. VERIFICATION — RAISE NOTICE row counts
-- ============================================================================

DO $$
DECLARE
  v_themes        INTEGER;
  v_creatures     INTEGER;
  v_pages         INTEGER;
  v_configs       INTEGER;
  v_states        INTEGER;
  v_unlocks       INTEGER;
  v_members       INTEGER;
  v_visual_sched  INTEGER;
  v_feature_keys  INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_themes      FROM public.gamification_themes;
  SELECT COUNT(*) INTO v_creatures   FROM public.gamification_creatures;
  SELECT COUNT(*) INTO v_pages       FROM public.gamification_sticker_pages;
  SELECT COUNT(*) INTO v_configs     FROM public.gamification_configs;
  SELECT COUNT(*) INTO v_states      FROM public.member_sticker_book_state;
  SELECT COUNT(*) INTO v_unlocks     FROM public.member_page_unlocks WHERE unlocked_trigger_type = 'bootstrap';
  SELECT COUNT(*) INTO v_members     FROM public.family_members WHERE is_active = true;
  SELECT COUNT(*) INTO v_visual_sched FROM public.platform_assets WHERE category = 'visual_schedule';
  SELECT COUNT(*) INTO v_feature_keys FROM public.feature_key_registry
    WHERE feature_key IN (
      'gamification_basic', 'gamification_sticker_book', 'play_dashboard',
      'play_reveal_tiles', 'play_reading_support', 'play_message_receive',
      'gamification_streak_milestones'
    );

  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Build M Sub-phase A — Migration Verification';
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Themes seeded:                  %  (expected: 1)',   v_themes;
  RAISE NOTICE 'Creatures seeded:               %  (expected: 161)', v_creatures;
  RAISE NOTICE 'Sticker pages seeded:           %  (expected: 26)',  v_pages;
  RAISE NOTICE 'Active family members:          %',                  v_members;
  RAISE NOTICE 'gamification_configs rows:      %  (expected = members)', v_configs;
  RAISE NOTICE 'member_sticker_book_state rows: %  (expected = members)', v_states;
  RAISE NOTICE 'Bootstrap page unlocks:         %  (expected = members)', v_unlocks;
  RAISE NOTICE 'visual_schedule platform_assets: %  (expected: 328)',  v_visual_sched;
  RAISE NOTICE 'New feature keys registered:    %  (expected: 7)',   v_feature_keys;
  RAISE NOTICE '====================================================';

  IF v_themes <> 1 THEN
    RAISE EXCEPTION 'Theme seed failed: got %, expected 1', v_themes;
  END IF;
  IF v_creatures <> 161 THEN
    RAISE EXCEPTION 'Creature seed failed: got %, expected 161', v_creatures;
  END IF;
  IF v_pages <> 26 THEN
    RAISE EXCEPTION 'Sticker page seed failed: got %, expected 26', v_pages;
  END IF;
  IF v_configs < v_members THEN
    RAISE EXCEPTION 'gamification_configs backfill incomplete: got %, expected %', v_configs, v_members;
  END IF;
  IF v_states < v_members THEN
    RAISE EXCEPTION 'member_sticker_book_state backfill incomplete: got %, expected %', v_states, v_members;
  END IF;
  IF v_unlocks < v_members THEN
    RAISE EXCEPTION 'bootstrap page unlocks incomplete: got %, expected %', v_unlocks, v_members;
  END IF;
  IF v_feature_keys <> 7 THEN
    RAISE EXCEPTION 'Feature key registration incomplete: got %, expected 7', v_feature_keys;
  END IF;
END $$;

COMMIT;
