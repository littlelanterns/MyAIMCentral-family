-- ============================================================================
-- Restore full archive provisioning in auto_provision_member_resources()
-- ============================================================================
-- Fixes NEW-JJ (auth.admin.createUser: "Database error creating new user")
-- and NEW-KK (auto_provision_member_resources writes invalid folder_type).
-- Shared root cause: both are symptoms of the same regression in migration
-- 00000000100115 (Build M — Play Dashboard + Sticker Book).
--
-- REGRESSION: 100115 replaced auto_provision_member_resources() with a stale
-- snapshot labeled "preserved verbatim from live production" that actually
-- predates migration 00000000100035 (PRD-13 Archives & Context). The stale
-- snapshot:
--   (a) wrote folder_type='family_member' — now rejected by the CHECK
--       constraint added in 100035 (allowed set: member_root, family_overview,
--       system_category, wishlist, custom)
--   (b) dropped the 7 system category subfolders (Preferences, Schedule &
--       Activities, Personality & Traits, Interests & Hobbies, School &
--       Learning, Health & Medical, General) required by Convention #77
--   (c) dropped the wishlist folder required by Convention #77
--   (d) dropped the archive_member_settings seed required by Convention #77
--
-- Chain of failure for NEW-JJ:
--   auth.admin.createUser
--     → on_auth_user_created trigger
--       → handle_new_user()
--         → INSERT INTO public.family_members
--           → auto_provision_member_resources() trigger
--             → INSERT INTO archive_folders (folder_type='family_member')
--               → archive_folders_folder_type_check REJECTS
--                 → transaction rolls back to auth.users
--                   → auth-go surfaces "Database error creating new user"
--
-- This migration restores the full 100035 archive provisioning block verbatim
-- while preserving EVERY non-archive branch of the 100115 function:
--   - Build M gamification_configs + member_sticker_book_state + page unlock
--   - Build N teen (independent dashboard_mode) rhythm branch
--   - Phase C/D adult, play, guided rhythm seeding
--   - dashboard_configs seeding
--   - Backburner + Ideas lists for non-Guided/Play members
--
-- No backfill required: live production has zero rows with the invalid
-- folder_type (CHECK rejects them) and all 18 existing members already have
-- correct member_root folders (created under 100035's trigger before the
-- 100115 regression deployed).
--
-- Migration floor per active build guidance (≥ 100165).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_provision_member_resources()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  dash_type        TEXT;
  root_folder_id   UUID;
  v_woodland_id    UUID;
  v_first_page_id  UUID;
  category_names TEXT[] := ARRAY[
    'Preferences',
    'Schedule & Activities',
    'Personality & Traits',
    'Interests & Hobbies',
    'School & Learning',
    'Health & Medical',
    'General'
  ];
  cat_name TEXT;
  cat_sort INTEGER := 0;
BEGIN
  -- ============================================================
  -- 1. ARCHIVE PROVISIONING (restored from 100035 per Convention #77)
  --    Creates: member_root folder, 7 system category subfolders,
  --             wishlist folder, archive_member_settings record.
  -- ============================================================

  -- 1a. Create member_root archive folder
  INSERT INTO public.archive_folders (family_id, member_id, folder_name, folder_type, is_system)
  VALUES (NEW.family_id, NEW.id, NEW.display_name || '''s Archives', 'member_root', true)
  RETURNING id INTO root_folder_id;

  -- 1b. Create 7 system category subfolders
  FOREACH cat_name IN ARRAY category_names LOOP
    INSERT INTO public.archive_folders (
      family_id, member_id, folder_name, folder_type,
      parent_folder_id, is_system, sort_order
    )
    VALUES (
      NEW.family_id, NEW.id, cat_name, 'system_category',
      root_folder_id, true, cat_sort
    );
    cat_sort := cat_sort + 1;
  END LOOP;

  -- 1c. Create wishlist folder
  INSERT INTO public.archive_folders (
    family_id, member_id, folder_name, folder_type,
    parent_folder_id, is_system, sort_order
  )
  VALUES (
    NEW.family_id, NEW.id, 'Wishlist', 'wishlist',
    root_folder_id, true, cat_sort
  );

  -- 1d. Create archive_member_settings record
  INSERT INTO public.archive_member_settings (family_id, member_id)
  VALUES (NEW.family_id, NEW.id)
  ON CONFLICT (family_id, member_id) DO NOTHING;

  -- ============================================================
  -- 2. dashboard_config (unchanged from 100115)
  -- ============================================================
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

  -- ============================================================
  -- 3. Backburner & Ideas lists for non-Guided/Play members
  --    (unchanged from 100115)
  -- ============================================================
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

  -- ============================================================
  -- 4. Seed default rhythm_configs based on role / dashboard_mode
  --    (unchanged from 100115; preserves Build N teen branch +
  --     Phase C/D adult, play, guided branches verbatim)
  -- ============================================================
  IF NEW.dashboard_mode = 'play' THEN
    -- Play: morning only (simplified sections)
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
    -- Guided: morning rhythm — 3 sections
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

    -- Guided: mini evening rhythm — 5 sections
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
    -- Adult (dashboard_mode IS NULL or 'personal')
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
  -- 5. BUILD M ADDITIONS — gamification + sticker book provisioning
  --    (unchanged from 100115)
  -- ============================================================

  -- 5a. Insert gamification_configs with shell-appropriate defaults
  INSERT INTO public.gamification_configs (
    family_id, family_member_id,
    enabled, base_points_per_task, currency_name, currency_icon
  ) VALUES (
    NEW.family_id, NEW.id,
    CASE WHEN NEW.dashboard_mode IN ('play', 'guided') THEN true ELSE false END,
    CASE WHEN NEW.dashboard_mode = 'play' THEN 1 ELSE 10 END,
    CASE WHEN NEW.dashboard_mode = 'play' THEN 'stars' ELSE 'points' END,
    '⭐'
  )
  ON CONFLICT (family_member_id) DO NOTHING;

  -- 5b. Insert member_sticker_book_state with Woodland Felt as default theme
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

    -- 5c. Bootstrap first sticker page unlock (sort_order=1 for Woodland Felt)
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
  'Restores full archive provisioning (member_root + 7 system categories + wishlist + archive_member_settings) per Convention #19 / #77 while preserving every non-archive branch of 100115 (Build M gamification/sticker book + Build N teen rhythm + Phase C/D adult/play/guided rhythm seeding). Fixes NEW-JJ + NEW-KK shared root cause.';
