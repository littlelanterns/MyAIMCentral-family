-- PRD-18 Phase A continuation: add guided_reflections section to the
-- mini evening rhythm for Guided members.
--
-- Tenise asked (mid-build, 2026-04-07): "I would like it to have a
-- reflection here, as well, as guided do have access to the reflections
-- questions. It just rotate one at a time, pick between the 20 most
-- child appropriate, and it would also have the option to View All,
-- and answer any of those."
--
-- Implementation:
--   - New section type `guided_reflections` (frontend component pulls
--     from existing reflection_prompts library, filters to 20 child-
--     friendly sort_orders, picks one via date-seeded PRNG, View All
--     expander to swap)
--   - Section sits between Pride and Tomorrow in the narrative arc:
--     Highlights -> Pride -> Reflections -> Tomorrow -> Close
--   - Pride and Tomorrow sections separately gain rotating wordings
--     (frontend-only change, no DB impact)
--
-- This migration:
--   1. Replaces auto_provision_member_resources() to seed the new
--      section in NEW Guided members' evening rhythm config (preserving
--      ALL prior logic for archive folders, dashboard configs, lists,
--      adult/independent rhythms, play rhythm, and existing Guided
--      morning rhythm)
--   2. Backfills existing active Guided members by replacing the
--      sections JSONB on their evening rhythm_config row to include
--      guided_reflections. Idempotent — only updates rows whose
--      sections array doesn't already contain guided_reflections.


-- ============================================================
-- 1. Replace auto_provision_member_resources() with the new
--    Guided evening section sequence (5 sections instead of 4).
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_provision_member_resources()
RETURNS TRIGGER AS $$
DECLARE
  dash_type TEXT;
BEGIN
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
    -- Guided: morning rhythm
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning', 'default', true,
      '[
        {"section_type":"encouraging_message","enabled":true,"order":1,"config":{}},
        {"section_type":"routine_checklist","enabled":true,"order":2,"config":{}},
        {"section_type":"task_preview","enabled":true,"order":3,"config":{}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Guided: mini evening rhythm — 5 sections in fixed narrative arc
    --   Highlights -> Pride -> Reflections -> Tomorrow -> Close
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

  ELSE
    -- Adult (dashboard_mode IS NULL or 'personal') and Independent teen
    -- ('independent'). Same structure — teen framing language wires Phase D.

    -- Morning (enabled)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning Rhythm', 'default', true,
      '[
        {"section_type":"guiding_star_rotation","enabled":true,"order":1,"config":{}},
        {"section_type":"morning_priorities_recall","enabled":true,"order":2,"config":{}},
        {"section_type":"best_intentions_focus","enabled":true,"order":3,"config":{}},
        {"section_type":"task_preview","enabled":true,"order":4,"config":{}},
        {"section_type":"calendar_preview","enabled":true,"order":5,"config":{}},
        {"section_type":"brain_dump","enabled":true,"order":6,"config":{}},
        {"section_type":"periodic_cards_slot","enabled":true,"order":7,"config":{}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Evening (enabled, section_order_locked=true — fixed narrative arc)
    -- carry_forward is off by default per PRD-18 Enhancement 5
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

    -- Weekly Review (enabled, triggers Friday by default)
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

    -- Monthly Review (disabled by default — user opts in)
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

    -- Quarterly Inventory (disabled by default — triggers at ~90-day LifeLantern staleness)
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 2. Backfill: replace the sections JSONB on existing Guided
--    members' evening rhythm_config rows to include the new
--    guided_reflections section in the correct position.
--    Idempotent — only updates rows that don't already contain
--    guided_reflections in their sections array.
-- ============================================================
UPDATE public.rhythm_configs rc
SET sections = '[
  {"section_type":"guided_day_highlights","enabled":true,"order":1,"config":{}},
  {"section_type":"guided_pride_reflection","enabled":true,"order":2,"config":{}},
  {"section_type":"guided_reflections","enabled":true,"order":3,"config":{}},
  {"section_type":"guided_tomorrow_lookahead","enabled":true,"order":4,"config":{}},
  {"section_type":"close_my_day","enabled":true,"order":5,"config":{}}
]'::jsonb
FROM public.family_members fm
WHERE rc.member_id = fm.id
  AND fm.dashboard_mode = 'guided'
  AND fm.is_active = true
  AND rc.rhythm_key = 'evening'
  AND NOT (rc.sections @> '[{"section_type":"guided_reflections"}]'::jsonb);
