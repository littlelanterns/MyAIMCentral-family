-- ============================================================
-- Migration: 00000000100114_rhythms_phase_d_teen.sql
-- Phase: PRD-18 Rhythms & Reflections — Phase D (Build N)
--
-- Scope: Independent Teen tailored rhythm experience (Enhancement 7).
-- Forks the auto_provision_member_resources trigger to give
-- dashboard_mode='independent' members a purpose-built 7-section
-- morning rhythm and 8-section evening rhythm with teen framing,
-- teen display names ("Morning Check-in" / "Evening Check-in"),
-- reflection_guideline_count=2 (founder can override to 3 per-member
-- via Rhythms Settings). Seeds 15 teen morning insight questions
-- alongside the existing 20 adult rows.
--
-- What this migration does:
--   1. Seed 15 teen morning_insight_questions (system-level, audience='teen')
--   2. Replace auto_provision_member_resources() to add an 'independent'
--      branch BETWEEN the 'guided' branch and the 'adult' ELSE branch.
--      Adult branch unchanged (9 morning + 13 evening sections).
--      Teen branch: 7 morning + 8 evening sections with teen content.
--   3. Backfill existing 35 active independent teens:
--      (a) Loop-INSERT 5 rhythm_configs per teen (morning/evening/weekly/
--          monthly/quarterly) with ON CONFLICT DO NOTHING — adds missing
--          rows for the 28 teens without any rhythm_configs, skips
--          existing rows for the 7 teens who already have them.
--      (b) UPDATE the 7 existing teens' morning + evening rows to
--          rewrite sections → teen content, display_name → teen name,
--          reflection_guideline_count → 2. Gated by display_name !=
--          teen name so the UPDATE is idempotent (running twice is a
--          no-op after the first run).
--   4. Verification NOTICEs.
--
-- What this migration DOES NOT do:
--   - No tasks.source CHECK change (rhythm_priority + rhythm_mindsweep_lite
--     already cover teen Schedule items; they reuse rhythm_mindsweep_lite
--     attribution)
--   - No new tables, no new columns
--   - No Edge Function changes (mindsweep-sort stays platform-level; teen
--     section translates destinations to teen dispositions at display time)
--   - No MindSweepLiteDisposition change in SQL (lives in TypeScript only)
--   - No changes to Play, Guided, or Adult trigger branches
--
-- Idempotent: seed uses NOT EXISTS; trigger is CREATE OR REPLACE; backfill
-- INSERT uses ON CONFLICT DO NOTHING; backfill UPDATE is gated by display_name.
-- ============================================================


-- ============================================================
-- 1. Seed 15 teen morning insight questions
--    From PRD-18 Enhancement Addendum Teen Morning Insight Question Pool:
--      Identity & Growth × 5
--      School & Learning × 4
--      Relationships & Social × 3
--      Life & Future × 3
-- ============================================================
INSERT INTO public.morning_insight_questions
  (family_id, audience, category, question_text, is_active, sort_order)
SELECT NULL, 'teen', category, question_text, true, sort_order
FROM (VALUES
  ('identity_growth', 'What''s something you''re getting better at, even if slowly?', 1),
  ('identity_growth', 'What kind of person do you want to be known as?', 2),
  ('identity_growth', 'What''s one thing about yourself that you''ve started to appreciate?', 3),
  ('identity_growth', 'What''s a strength you have that not everyone notices?', 4),
  ('identity_growth', 'What would you attempt if you knew you couldn''t fail?', 5),
  ('school_learning', 'What''s something you''re studying right now that actually interests you?', 6),
  ('school_learning', 'What''s the hardest thing on your plate this week, and what''s one step toward handling it?', 7),
  ('school_learning', 'What''s something you learned recently that changed how you think?', 8),
  ('school_learning', 'Is there a subject or skill you wish you could explore more deeply?', 9),
  ('relationships_social', 'What makes a good friendship, and are you being that kind of friend?', 10),
  ('relationships_social', 'Is there someone you''ve been meaning to reach out to?', 11),
  ('relationships_social', 'What''s one thing you wish people understood about you?', 12),
  ('life_future', 'What are you looking forward to this week?', 13),
  ('life_future', 'If you could build any skill over the next year, what would it be?', 14),
  ('life_future', 'What''s something you want to do differently than the adults around you?', 15)
) AS q(category, question_text, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.morning_insight_questions miq
  WHERE miq.audience = 'teen'
    AND miq.family_id IS NULL
    AND miq.question_text = q.question_text
);


-- ============================================================
-- 2. Replace auto_provision_member_resources() with teen branch
--    added between Guided and Adult ELSE. All other branches
--    (Play, Guided, Adult) unchanged from migration 100112.
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
    -- Phase D: Independent Teen tailored rhythms (Enhancement 7)
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 3. Backfill existing independent teens
--
-- Two-step process:
--   (a) Loop-INSERT 5 rhythm_configs per active teen via the trigger
--       logic pattern, with ON CONFLICT DO NOTHING. Adds missing
--       rows for teens who never got seeded; skips existing rows.
--   (b) UPDATE the existing teens whose morning + evening rows still
--       carry adult content (detected via display_name). Rewrites
--       sections, display_name, and reflection_guideline_count to
--       the teen values.
-- ============================================================

-- 3a. Insert missing rhythm_configs for all active teens
DO $$
DECLARE
  teen RECORD;
BEGIN
  FOR teen IN
    SELECT id, family_id
    FROM public.family_members
    WHERE dashboard_mode = 'independent'
      AND is_active = true
  LOOP
    -- Morning
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       reflection_guideline_count, sections, timing)
    VALUES (
      teen.family_id, teen.id,
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

    -- Evening
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       reflection_guideline_count, section_order_locked, sections, timing)
    VALUES (
      teen.family_id, teen.id,
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

    -- Weekly Review
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      teen.family_id, teen.id,
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

    -- Monthly Review
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      teen.family_id, teen.id,
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

    -- Quarterly Inventory
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      teen.family_id, teen.id,
      'quarterly_inventory', 'Quarterly Inventory', 'default', false,
      '[
        {"section_type":"stale_areas","enabled":true,"order":1,"config":{}},
        {"section_type":"quick_win_suggestion","enabled":true,"order":2,"config":{}},
        {"section_type":"lifelantern_launch_link","enabled":true,"order":3,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"lifelantern_staleness","interval_days":90}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;
  END LOOP;
END $$;


-- 3b. UPDATE existing teen morning rows that still carry adult content.
-- Idempotent: guarded by display_name != 'Morning Check-in', so running
-- the migration twice touches zero rows on the second run.
UPDATE public.rhythm_configs rc
SET
  sections = '[
    {"section_type":"guiding_star_rotation","enabled":true,"order":1,"config":{"framingText":"You said this matters to you:"}},
    {"section_type":"morning_priorities_recall","enabled":true,"order":2,"config":{}},
    {"section_type":"calendar_preview","enabled":true,"order":3,"config":{"scope":"member"}},
    {"section_type":"on_the_horizon","enabled":true,"order":4,"config":{"lookahead_days":7,"max_items":5}},
    {"section_type":"morning_insight","enabled":true,"order":5,"config":{"audience":"teen"}},
    {"section_type":"feature_discovery","enabled":true,"order":6,"config":{"audience":"teen"}},
    {"section_type":"rhythm_tracker_prompts","enabled":true,"order":7,"config":{}}
  ]'::jsonb,
  display_name = 'Morning Check-in',
  reflection_guideline_count = 2
FROM public.family_members fm
WHERE rc.member_id = fm.id
  AND fm.dashboard_mode = 'independent'
  AND fm.is_active = true
  AND rc.rhythm_key = 'morning'
  AND rc.display_name != 'Morning Check-in';


-- 3c. UPDATE existing teen evening rows that still carry adult content.
UPDATE public.rhythm_configs rc
SET
  sections = '[
    {"section_type":"evening_greeting","enabled":true,"order":1,"config":{"variant":"teen"}},
    {"section_type":"accomplishments_victories","enabled":true,"order":2,"config":{"title":"What went right today"}},
    {"section_type":"evening_tomorrow_capture","enabled":true,"order":3,"config":{}},
    {"section_type":"mindsweep_lite","enabled":true,"order":4,"config":{"collapsed_by_default":true,"audience":"teen"}},
    {"section_type":"reflections","enabled":true,"order":5,"config":{}},
    {"section_type":"closing_thought","enabled":true,"order":6,"config":{"framingText":"Something you believe:"}},
    {"section_type":"rhythm_tracker_prompts","enabled":true,"order":7,"config":{}},
    {"section_type":"close_my_day","enabled":true,"order":8,"config":{}}
  ]'::jsonb,
  display_name = 'Evening Check-in',
  reflection_guideline_count = 2,
  section_order_locked = true
FROM public.family_members fm
WHERE rc.member_id = fm.id
  AND fm.dashboard_mode = 'independent'
  AND fm.is_active = true
  AND rc.rhythm_key = 'evening'
  AND rc.display_name != 'Evening Check-in';


-- ============================================================
-- 4. Verification NOTICEs
-- ============================================================
DO $$
DECLARE
  teen_seed_count INTEGER;
  teen_members_total INTEGER;
  teen_morning_count INTEGER;
  teen_morning_named_correctly INTEGER;
  teen_evening_count INTEGER;
  teen_evening_named_correctly INTEGER;
  teen_reflection_count_2 INTEGER;
  adult_morning_unchanged INTEGER;
  adult_evening_unchanged INTEGER;
BEGIN
  SELECT COUNT(*) INTO teen_seed_count
    FROM public.morning_insight_questions
    WHERE audience = 'teen' AND family_id IS NULL AND is_active = true;

  SELECT COUNT(*) INTO teen_members_total
    FROM public.family_members
    WHERE dashboard_mode = 'independent' AND is_active = true;

  SELECT COUNT(*) INTO teen_morning_count
    FROM public.rhythm_configs rc
    JOIN public.family_members fm ON fm.id = rc.member_id
    WHERE fm.dashboard_mode = 'independent'
      AND fm.is_active = true
      AND rc.rhythm_key = 'morning';

  SELECT COUNT(*) INTO teen_morning_named_correctly
    FROM public.rhythm_configs rc
    JOIN public.family_members fm ON fm.id = rc.member_id
    WHERE fm.dashboard_mode = 'independent'
      AND fm.is_active = true
      AND rc.rhythm_key = 'morning'
      AND rc.display_name = 'Morning Check-in';

  SELECT COUNT(*) INTO teen_evening_count
    FROM public.rhythm_configs rc
    JOIN public.family_members fm ON fm.id = rc.member_id
    WHERE fm.dashboard_mode = 'independent'
      AND fm.is_active = true
      AND rc.rhythm_key = 'evening';

  SELECT COUNT(*) INTO teen_evening_named_correctly
    FROM public.rhythm_configs rc
    JOIN public.family_members fm ON fm.id = rc.member_id
    WHERE fm.dashboard_mode = 'independent'
      AND fm.is_active = true
      AND rc.rhythm_key = 'evening'
      AND rc.display_name = 'Evening Check-in';

  SELECT COUNT(*) INTO teen_reflection_count_2
    FROM public.rhythm_configs rc
    JOIN public.family_members fm ON fm.id = rc.member_id
    WHERE fm.dashboard_mode = 'independent'
      AND fm.is_active = true
      AND rc.rhythm_key IN ('morning', 'evening')
      AND rc.reflection_guideline_count = 2;

  SELECT COUNT(*) INTO adult_morning_unchanged
    FROM public.rhythm_configs rc
    JOIN public.family_members fm ON fm.id = rc.member_id
    WHERE (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play', 'independent'))
      AND fm.is_active = true
      AND rc.rhythm_key = 'morning'
      AND jsonb_array_length(rc.sections) = 9;

  SELECT COUNT(*) INTO adult_evening_unchanged
    FROM public.rhythm_configs rc
    JOIN public.family_members fm ON fm.id = rc.member_id
    WHERE (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play', 'independent'))
      AND fm.is_active = true
      AND rc.rhythm_key = 'evening'
      AND jsonb_array_length(rc.sections) = 13;

  RAISE NOTICE '─── PRD-18 Phase D verification ───';
  RAISE NOTICE 'Teen morning insight questions seeded: % (expected >= 15)', teen_seed_count;
  RAISE NOTICE 'Active independent teens in DB: %', teen_members_total;
  RAISE NOTICE 'Teen morning rhythm_configs: % (expected = %)', teen_morning_count, teen_members_total;
  RAISE NOTICE 'Teen morning display_name = "Morning Check-in": % (expected = %)', teen_morning_named_correctly, teen_members_total;
  RAISE NOTICE 'Teen evening rhythm_configs: % (expected = %)', teen_evening_count, teen_members_total;
  RAISE NOTICE 'Teen evening display_name = "Evening Check-in": % (expected = %)', teen_evening_named_correctly, teen_members_total;
  RAISE NOTICE 'Teen morning+evening with reflection_guideline_count=2: % (expected = %)', teen_reflection_count_2, teen_members_total * 2;
  RAISE NOTICE 'Adult morning rhythms with 9 sections (unchanged): %', adult_morning_unchanged;
  RAISE NOTICE 'Adult evening rhythms with 13 sections (unchanged): %', adult_evening_unchanged;
END $$;
