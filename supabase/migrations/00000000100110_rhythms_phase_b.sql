-- ============================================================
-- Migration 00000000100110: PRD-18 Rhythms Phase B foundation
--
-- Founder-approved 2026-04-07. Implements the schema pieces needed
-- for Phase B sub-phases B2 (Evening Tomorrow Capture + Morning
-- Priorities Recall), B3 (On the Horizon), B4 (Periodic cards +
-- Carry Forward fallback UI). Enhancement Addendum items 1, 5, 8.
--
-- What this migration does:
--   1. Adds 'rhythm_priority' to tasks.source CHECK constraint
--      (Enhancement 1 — auto-created tasks from Evening Tomorrow Capture)
--   2. Adds tasks.carry_forward_override TEXT nullable column
--      (Enhancement 5 — per-task override of member default fallback)
--   3. Registers rhythm_carry_forward_fallback feature key + grants
--   4. Updates auto_provision_member_resources() to seed the
--      morning rhythm with on_the_horizon at order 6, shifting
--      brain_dump → 7 and periodic_cards_slot → 8
--      (Enhancement 8 — new default section for new members)
--   5. Backfills existing adult/independent members' morning
--      rhythm_configs to insert on_the_horizon at order 6 and
--      renumber downstream sections (idempotent — only updates
--      rows whose sections don't already contain on_the_horizon)
--   6. Schedules the rhythm-carry-forward-fallback pg_cron job
--      (Enhancement 5 — hourly at :05, Edge Function handles
--      per-family timezone midnight processing)
--
-- What this migration does NOT do:
--   - MindSweep-Lite (Phase C)
--   - Morning Insight / Feature Discovery (Phase C)
--   - Tracker rhythm_keys config (Phase C)
--   - Teen tailored templates (Phase D)
-- ============================================================


-- ============================================================
-- 1. tasks.source CHECK constraint: add 'rhythm_priority'
--    Previous values from migration 100054. This migration
--    preserves all prior values and appends rhythm_priority.
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
    'rhythm_priority'
  ));


-- ============================================================
-- 2. tasks.carry_forward_override column
--    Nullable TEXT with CHECK constraint. NULL = use member
--    default from family_members.preferences. Set to override
--    on a per-task basis for users who need different behavior
--    on specific tasks.
-- ============================================================
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS carry_forward_override TEXT
    CHECK (carry_forward_override IS NULL OR carry_forward_override IN (
      'stay', 'roll_forward', 'expire', 'backburner'
    ));

-- Partial index so the midnight job can efficiently query tasks
-- with explicit overrides.
CREATE INDEX IF NOT EXISTS idx_tasks_carry_forward_override
  ON public.tasks (family_id, carry_forward_override)
  WHERE carry_forward_override IS NOT NULL;


-- ============================================================
-- 3. Feature key registration + tier grants
--    rhythm_on_the_horizon was already registered in Phase A
--    migration 100103 — only rhythm_carry_forward_fallback is
--    new in Phase B.
-- ============================================================
INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('rhythm_carry_forward_fallback', 'Carry Forward Fallback', 'Automatic behavior applied to overdue tasks at midnight (stay/roll/expire/backburner)', 'PRD-18')
ON CONFLICT (feature_key) DO NOTHING;

INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT fk.feature_key, fk.role_group, st.id, true
FROM (VALUES
  ('rhythm_carry_forward_fallback', 'mom',               'essential'),
  ('rhythm_carry_forward_fallback', 'dad_adults',        'essential'),
  ('rhythm_carry_forward_fallback', 'independent_teens', 'essential'),
  ('rhythm_carry_forward_fallback', 'guided_kids',       'essential'),
  ('rhythm_carry_forward_fallback', 'play_kids',         'essential')
) AS fk(feature_key, role_group, tier_slug)
CROSS JOIN public.subscription_tiers st
WHERE st.slug = fk.tier_slug
ON CONFLICT DO NOTHING;


-- ============================================================
-- 4. Update auto_provision_member_resources() to include
--    on_the_horizon in the adult/independent morning seed.
--    Preserves ALL prior logic from migration 100106 — the only
--    change is inserting on_the_horizon at order 6 and renumbering
--    brain_dump → 7 and periodic_cards_slot → 8 for the adult/
--    independent morning rhythm. Every other branch (Play, Guided
--    morning, Guided evening, adult evening, weekly/monthly/
--    quarterly rhythms) is identical to 100106.
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

    -- Guided: mini evening rhythm (5 sections — preserved from 100106)
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
    -- ('independent'). Teen framing language wires Phase D.

    -- Morning (enabled) — Phase B adds on_the_horizon at order 6
    -- default lookahead window is 7 days (configurable 3-14 per member)
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
        {"section_type":"on_the_horizon","enabled":true,"order":6,"config":{"lookahead_days":7,"max_items":5}},
        {"section_type":"brain_dump","enabled":true,"order":7,"config":{}},
        {"section_type":"periodic_cards_slot","enabled":true,"order":8,"config":{}}
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
-- 5. Backfill: insert on_the_horizon into existing adult/
--    independent morning rhythms at order 6 and renumber
--    brain_dump → 7 and periodic_cards_slot → 8.
--    Idempotent — only updates rows that don't already contain
--    on_the_horizon in their sections array.
-- ============================================================
UPDATE public.rhythm_configs rc
SET sections = '[
  {"section_type":"guiding_star_rotation","enabled":true,"order":1,"config":{}},
  {"section_type":"morning_priorities_recall","enabled":true,"order":2,"config":{}},
  {"section_type":"best_intentions_focus","enabled":true,"order":3,"config":{}},
  {"section_type":"task_preview","enabled":true,"order":4,"config":{}},
  {"section_type":"calendar_preview","enabled":true,"order":5,"config":{}},
  {"section_type":"on_the_horizon","enabled":true,"order":6,"config":{"lookahead_days":7,"max_items":5}},
  {"section_type":"brain_dump","enabled":true,"order":7,"config":{}},
  {"section_type":"periodic_cards_slot","enabled":true,"order":8,"config":{}}
]'::jsonb
FROM public.family_members fm
WHERE rc.member_id = fm.id
  AND fm.is_active = true
  AND (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play'))
  AND rc.rhythm_key = 'morning'
  AND NOT (rc.sections @> '[{"section_type":"on_the_horizon"}]'::jsonb);


-- ============================================================
-- 6. pg_cron job: rhythm-carry-forward-fallback
--    Runs hourly at :05 (offset from mindsweep at :00). The
--    Edge Function checks each family's timezone and only
--    processes members whose local hour === 0 (midnight). Same
--    service-role auth pattern as mindsweep-auto-sweep.
-- ============================================================
SELECT cron.schedule(
  'rhythm-carry-forward-fallback',
  '5 * * * *',  -- every hour at :05
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-carry-forward-fallback',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
