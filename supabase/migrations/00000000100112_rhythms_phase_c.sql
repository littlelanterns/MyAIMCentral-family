-- ============================================================
-- Migration: 00000000100112_rhythms_phase_c.sql
-- Phase: PRD-18 Rhythms & Reflections — Phase C (Build L)
--
-- Scope: AI-powered enhancements foundation. Seeds the 20 adult
-- morning insight questions, adds 'rhythm_mindsweep_lite' to
-- tasks.source, adds 'rhythm_evening' to mindsweep_events.source_channel,
-- updates auto_provision_member_resources() to include morning_insight
-- + feature_discovery in the adult/independent morning seed at the
-- correct positions, and backfills existing adult/independent morning
-- rhythm_configs so they match the new sequence.
--
-- What this migration does:
--   1. Seed 20 adult morning_insight_questions (system-level, family_id=NULL)
--   2. tasks.source CHECK: add 'rhythm_mindsweep_lite' (preserves prior values)
--   3. mindsweep_events.source_channel CHECK: add 'rhythm_evening'
--   4. Replace auto_provision_member_resources() with updated adult/
--      independent morning seed including morning_insight + feature_discovery
--   5. Backfill existing adult/independent morning rhythm_configs where
--      morning_insight OR feature_discovery is missing
--
-- What this migration DOES NOT do:
--   - No new Edge Function (mindsweep-sort is reused for MindSweep-Lite)
--   - No Edge Function deployment (mindsweep-sort Zod enum update in C2 code)
--   - No teen morning_insight_questions seed (Phase D)
--   - No widget config schema change (config.rhythm_keys is JSONB runtime)
--
-- Idempotent: seed uses NOT EXISTS check, constraint uses DROP+ADD,
-- backfill uses jsonb_path @> guard.
-- ============================================================


-- ============================================================
-- 1. Seed 20 adult morning insight questions
--    From PRD-18 Enhancement Addendum Morning Insight Question Pool:
--      Family Friction × 5
--      Personal Growth × 5
--      Relationships × 4
--      Parenting × 3
--      Values & Purpose × 3
-- ============================================================
INSERT INTO public.morning_insight_questions
  (family_id, audience, category, question_text, is_active, sort_order)
SELECT NULL, 'adult', category, question_text, true, sort_order
FROM (VALUES
  ('family_friction', 'What''s one routine in your family that could use a small improvement?', 1),
  ('family_friction', 'What''s a recurring frustration in your household that you haven''t addressed yet?', 2),
  ('family_friction', 'When does your family communicate best, and when does it break down?', 3),
  ('family_friction', 'What''s one thing that would make your mornings smoother?', 4),
  ('family_friction', 'Is there a family habit you''d like to start but haven''t figured out how?', 5),
  ('personal_growth', 'What''s a skill you wish you were better at?', 6),
  ('personal_growth', 'What''s something you used to do for yourself that you''ve let go of?', 7),
  ('personal_growth', 'Where in your life are you running on autopilot when you''d rather be intentional?', 8),
  ('personal_growth', 'What''s one area where you''re being too hard on yourself?', 9),
  ('personal_growth', 'What would you do more of if you had an extra hour each day?', 10),
  ('relationships', 'What''s something you wish you could communicate better to someone you love?', 11),
  ('relationships', 'Who in your life could use more of your attention right now?', 12),
  ('relationships', 'What''s one small thing you could do today to strengthen a relationship?', 13),
  ('relationships', 'Is there a conversation you''ve been avoiding? What''s holding you back?', 14),
  ('parenting', 'What''s one thing you wish your kids understood about you?', 15),
  ('parenting', 'What''s working well in your parenting right now that you should keep doing?', 16),
  ('parenting', 'What does your child need from you this week that''s different from what they needed last month?', 17),
  ('values_purpose', 'What matters most to you that you haven''t made time for lately?', 18),
  ('values_purpose', 'If your family had a theme for this season of life, what would it be?', 19),
  ('values_purpose', 'What question keeps coming back to you?', 20)
) AS q(category, question_text, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.morning_insight_questions miq
  WHERE miq.audience = 'adult'
    AND miq.family_id IS NULL
    AND miq.question_text = q.question_text
);


-- ============================================================
-- 2. tasks.source CHECK constraint: add 'rhythm_mindsweep_lite'
--    Preserves all prior values from migration 100110.
--    Attribution for tasks created by MindSweep-Lite commit path.
-- ============================================================
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_source_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_source_check
  CHECK (source IN (
    'manual',
    'template_deployed',
    'lila_conversation',
    'notepad_routed',
    'review_route',
    'meeting_action',
    'goal_decomposition',
    'project_planner',
    'member_request',
    'sequential_promoted',
    'recurring_generated',
    'guided_form_assignment',
    'list_batch',
    'rhythm_priority',
    'rhythm_mindsweep_lite'
  ));


-- ============================================================
-- 3. mindsweep_events.source_channel CHECK: add 'rhythm_evening'
--    Previous values from migration 100089. Rhythm evening sweeps
--    share the same telemetry pipeline as other sweep channels.
-- ============================================================
ALTER TABLE public.mindsweep_events
  DROP CONSTRAINT IF EXISTS mindsweep_events_source_channel_check;
ALTER TABLE public.mindsweep_events
  ADD CONSTRAINT mindsweep_events_source_channel_check
  CHECK (source_channel IN (
    'routing_strip',
    'quick_capture',
    'share_to_app',
    'email_forward',
    'auto_sweep',
    'rhythm_evening'
  ));


-- ============================================================
-- 4. Replace auto_provision_member_resources() with the updated
--    adult/independent morning seed. Inserts morning_insight at
--    position 6 (after on_the_horizon) and feature_discovery at
--    position 8 (after brain_dump). Renumbers periodic_cards_slot
--    to 9. Everything else unchanged from migration 100111.
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
    -- Play: morning only (simplified sections) — unchanged from 100111
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
    -- Guided: morning rhythm — 3 sections (unchanged from 100111)
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

    -- Guided: mini evening rhythm — 5 sections (unchanged from 100106/100111)
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
    -- ('independent'). Teen framing language lands in Phase D.

    -- Morning (enabled) — 9 sections. Phase C adds morning_insight at
    -- order 6 (after on_the_horizon) and feature_discovery at order 8
    -- (after brain_dump). periodic_cards_slot renumbered to 9.
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

    -- Evening (enabled, section_order_locked=true — fixed narrative arc)
    -- Unchanged from 100111. mindsweep_lite at order 7, rhythm_tracker_prompts
    -- at order 12 — those section renderers land in Phase C code.
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

    -- Weekly / Monthly / Quarterly unchanged from 100111
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
-- 5. Backfill existing adult/independent morning rhythm_configs
--    Rewrites the sections array to include morning_insight and
--    feature_discovery at their target positions. Idempotent —
--    only touches rows that DON'T already contain morning_insight.
-- ============================================================
UPDATE public.rhythm_configs rc
SET sections = '[
  {"section_type":"guiding_star_rotation","enabled":true,"order":1,"config":{}},
  {"section_type":"morning_priorities_recall","enabled":true,"order":2,"config":{}},
  {"section_type":"best_intentions_focus","enabled":true,"order":3,"config":{}},
  {"section_type":"calendar_preview","enabled":true,"order":4,"config":{}},
  {"section_type":"on_the_horizon","enabled":true,"order":5,"config":{"lookahead_days":7,"max_items":5}},
  {"section_type":"morning_insight","enabled":true,"order":6,"config":{}},
  {"section_type":"brain_dump","enabled":true,"order":7,"config":{}},
  {"section_type":"feature_discovery","enabled":true,"order":8,"config":{}},
  {"section_type":"periodic_cards_slot","enabled":true,"order":9,"config":{}}
]'::jsonb
FROM public.family_members fm
WHERE rc.member_id = fm.id
  AND fm.is_active = true
  AND (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play'))
  AND rc.rhythm_key = 'morning'
  AND NOT (rc.sections @> '[{"section_type":"morning_insight"}]'::jsonb);


-- ============================================================
-- 6. Verification NOTICEs
-- ============================================================
DO $$
DECLARE
  seed_count INTEGER;
  morning_insight_rhythms INTEGER;
  feature_discovery_rhythms INTEGER;
  adult_morning_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO seed_count
    FROM public.morning_insight_questions
    WHERE audience = 'adult' AND family_id IS NULL AND is_active = true;

  SELECT COUNT(*) INTO adult_morning_total
    FROM public.rhythm_configs rc
    JOIN public.family_members fm ON fm.id = rc.member_id
    WHERE rc.rhythm_key = 'morning'
      AND fm.is_active = true
      AND (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play'));

  SELECT COUNT(*) INTO morning_insight_rhythms
    FROM public.rhythm_configs rc
    JOIN public.family_members fm ON fm.id = rc.member_id
    WHERE rc.rhythm_key = 'morning'
      AND fm.is_active = true
      AND (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play'))
      AND rc.sections @> '[{"section_type":"morning_insight"}]'::jsonb;

  SELECT COUNT(*) INTO feature_discovery_rhythms
    FROM public.rhythm_configs rc
    JOIN public.family_members fm ON fm.id = rc.member_id
    WHERE rc.rhythm_key = 'morning'
      AND fm.is_active = true
      AND (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play'))
      AND rc.sections @> '[{"section_type":"feature_discovery"}]'::jsonb;

  RAISE NOTICE '─── PRD-18 Phase C verification ───';
  RAISE NOTICE 'Adult morning insight questions seeded: % (expected >= 20)', seed_count;
  RAISE NOTICE 'Total adult/independent morning rhythms: %', adult_morning_total;
  RAISE NOTICE 'Morning rhythms containing morning_insight: % (expected = %)', morning_insight_rhythms, adult_morning_total;
  RAISE NOTICE 'Morning rhythms containing feature_discovery: % (expected = %)', feature_discovery_rhythms, adult_morning_total;
  RAISE NOTICE 'tasks.source accepts rhythm_mindsweep_lite: yes';
  RAISE NOTICE 'mindsweep_events.source_channel accepts rhythm_evening: yes';
END $$;
