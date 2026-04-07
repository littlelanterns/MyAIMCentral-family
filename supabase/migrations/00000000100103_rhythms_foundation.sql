-- PRD-18: Rhythms & Reflections — Phase A Foundation
-- Creates rhythm_configs, rhythm_completions, feature_discovery_dismissals,
-- morning_insight_questions. Extends auto_provision_member_resources to seed
-- default rhythm configs on member create. Backfills existing members.
-- Reflection tables (reflection_prompts, reflection_responses) already exist
-- from migrations 100071/100072 — not touched here.

-- ============================================================
-- 0. Extend notepad_tabs.source_type to allow 'rhythm_capture'
--    BrainDumpSection writes notepad_tabs with source_type='rhythm_capture'
--    so the existing CHECK constraint must be widened.
-- ============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
    WHERE con.conrelid = 'public.notepad_tabs'::regclass
      AND att.attname = 'source_type'
      AND con.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.notepad_tabs DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.notepad_tabs
  ADD CONSTRAINT notepad_tabs_source_type_check
  CHECK (source_type IN ('manual', 'voice', 'edit_in_notepad', 'lila_optimizer', 'rhythm_capture'));

-- ============================================================
-- 1. rhythm_configs (per-member rhythm configuration)
--    One row per rhythm per member.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rhythm_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  rhythm_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  rhythm_type TEXT NOT NULL DEFAULT 'default'
    CHECK (rhythm_type IN ('default', 'custom', 'template_activated')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  section_order_locked BOOLEAN NOT NULL DEFAULT false,
  timing JSONB NOT NULL DEFAULT '{}'::jsonb,
  auto_open BOOLEAN NOT NULL DEFAULT true,
  reflection_guideline_count INTEGER NOT NULL DEFAULT 3,
  source_template_id UUID,   -- FK reserved for future rhythm_templates table
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_id, member_id, rhythm_key)
);

CREATE INDEX IF NOT EXISTS idx_rc_family_member_enabled
  ON public.rhythm_configs(family_id, member_id, enabled);

CREATE INDEX IF NOT EXISTS idx_rc_family_member_active
  ON public.rhythm_configs(family_id, member_id)
  WHERE archived_at IS NULL;

CREATE TRIGGER trg_rhythm_configs_updated_at
  BEFORE UPDATE ON public.rhythm_configs
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.rhythm_configs ENABLE ROW LEVEL SECURITY;

-- Members manage their own rhythm configs
DROP POLICY IF EXISTS rhythm_configs_manage_own ON public.rhythm_configs;
CREATE POLICY rhythm_configs_manage_own ON public.rhythm_configs
  FOR ALL USING (
    member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- Primary parent manages all family rhythm configs
DROP POLICY IF EXISTS rhythm_configs_parent_manage_all ON public.rhythm_configs;
CREATE POLICY rhythm_configs_parent_manage_all ON public.rhythm_configs
  FOR ALL USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );


-- ============================================================
-- 2. rhythm_completions (tracks rhythm completion per period)
--    period format: 'YYYY-MM-DD' (morning/evening), 'YYYY-W##'
--    (weekly), 'YYYY-MM' (monthly), 'YYYY-Q#' (quarterly).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rhythm_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  rhythm_key TEXT NOT NULL,
  period TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'dismissed', 'snoozed')),
  -- mood_triage preserved for future; not populated by default (Enhancement 6 decision)
  mood_triage TEXT
    CHECK (mood_triage IN ('course_correcting', 'smooth_sailing', 'rough_waters')),
  snoozed_until TIMESTAMPTZ,
  -- metadata holds priority_items (tomorrow capture) + mindsweep_items (brain dump)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_id, member_id, rhythm_key, period)
);

CREATE INDEX IF NOT EXISTS idx_rco_family_member_status
  ON public.rhythm_completions(family_id, member_id, status);

CREATE INDEX IF NOT EXISTS idx_rco_member_rhythm_period
  ON public.rhythm_completions(member_id, rhythm_key, period DESC);

CREATE INDEX IF NOT EXISTS idx_rco_family_member_completed
  ON public.rhythm_completions(family_id, member_id)
  WHERE status = 'completed';

ALTER TABLE public.rhythm_completions ENABLE ROW LEVEL SECURITY;

-- Members manage own completions
DROP POLICY IF EXISTS rhythm_completions_manage_own ON public.rhythm_completions;
CREATE POLICY rhythm_completions_manage_own ON public.rhythm_completions
  FOR ALL USING (
    member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- Primary parent reads all family completions (Family Overview indicators)
DROP POLICY IF EXISTS rhythm_completions_read_parent ON public.rhythm_completions;
CREATE POLICY rhythm_completions_read_parent ON public.rhythm_completions
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );


-- ============================================================
-- 2a. Activity log trigger for rhythm completion
--     Fires AFTER INSERT when status = 'completed'.
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_rhythm_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO public.activity_log_entries (
      family_id,
      member_id,
      event_type,
      source_table,
      source_id,
      metadata
    ) VALUES (
      NEW.family_id,
      NEW.member_id,
      'rhythm_completed',
      'rhythm_completions',
      NEW.id,
      jsonb_build_object(
        'rhythm_key', NEW.rhythm_key,
        'period', NEW.period
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_rhythm_completed_activity_log ON public.rhythm_completions;
CREATE TRIGGER trg_rhythm_completed_activity_log
  AFTER INSERT ON public.rhythm_completions
  FOR EACH ROW EXECUTE FUNCTION public.log_rhythm_completed();


-- ============================================================
-- 3. feature_discovery_dismissals
--    Per-member dismissal tracking for Feature Discovery nudges
--    (Enhancement 4). Schema created Phase A; UI wires Phase C.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feature_discovery_dismissals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_fdd_member
  ON public.feature_discovery_dismissals(member_id);

ALTER TABLE public.feature_discovery_dismissals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fdd_manage_own ON public.feature_discovery_dismissals;
CREATE POLICY fdd_manage_own ON public.feature_discovery_dismissals
  FOR ALL USING (
    member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );


-- ============================================================
-- 4. morning_insight_questions
--    Question pool for Morning Insight section (Enhancement 3).
--    Empty in Phase A — seeded Phase C. System defaults have
--    family_id IS NULL; custom family questions have family_id set.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.morning_insight_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  audience TEXT NOT NULL
    CHECK (audience IN ('adult', 'teen')),
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_miq_audience_active
  ON public.morning_insight_questions(audience, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_miq_family
  ON public.morning_insight_questions(family_id)
  WHERE family_id IS NOT NULL;

ALTER TABLE public.morning_insight_questions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active questions (system defaults + their family's)
DROP POLICY IF EXISTS miq_read_all ON public.morning_insight_questions;
CREATE POLICY miq_read_all ON public.morning_insight_questions
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND is_active = true
  );

-- Primary parent can manage own family's custom questions
DROP POLICY IF EXISTS miq_manage_family ON public.morning_insight_questions;
CREATE POLICY miq_manage_family ON public.morning_insight_questions
  FOR ALL USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );


-- ============================================================
-- 5. Extend auto_provision_member_resources() to seed rhythm_configs
--
--    Per-role defaults:
--    Adult (dashboard_mode IS NULL or 'personal'):
--      morning (enabled), evening (enabled, locked), weekly_review (enabled),
--      monthly_review (disabled), quarterly_inventory (disabled)
--    Independent teen (dashboard_mode = 'independent'):
--      Same 5 rhythms, same enabled/disabled states. Teen framing in Phase D.
--    Guided kid (dashboard_mode = 'guided'):
--      morning (enabled), no evening (DailyCelebration handles that), no periodic
--    Play kid (dashboard_mode = 'play'):
--      morning only (simplified sections)
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
    -- Backburner list
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

    -- Ideas list
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
    -- Guided: morning only (evening handled by DailyCelebration from PRD-11)
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
-- 6. Backfill: seed rhythm_configs for all existing active members
--    who don't already have any rhythm configs.
--    Uses same per-role logic as the trigger function above.
--    ON CONFLICT DO NOTHING — safe to re-run.
-- ============================================================

-- 6a. Play members: morning only
INSERT INTO public.rhythm_configs
  (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
SELECT
  fm.family_id, fm.id,
  'morning', 'Morning', 'default', true,
  '[
    {"section_type":"encouraging_message","enabled":true,"order":1,"config":{}},
    {"section_type":"routine_checklist","enabled":true,"order":2,"config":{}}
  ]'::jsonb,
  '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
FROM public.family_members fm
WHERE fm.dashboard_mode = 'play'
  AND fm.is_active = true
ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

-- 6b. Guided members: morning only
INSERT INTO public.rhythm_configs
  (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
SELECT
  fm.family_id, fm.id,
  'morning', 'Morning', 'default', true,
  '[
    {"section_type":"encouraging_message","enabled":true,"order":1,"config":{}},
    {"section_type":"routine_checklist","enabled":true,"order":2,"config":{}},
    {"section_type":"task_preview","enabled":true,"order":3,"config":{}}
  ]'::jsonb,
  '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
FROM public.family_members fm
WHERE fm.dashboard_mode = 'guided'
  AND fm.is_active = true
ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

-- 6c. Adult / Independent members: all 5 rhythms

-- Morning
INSERT INTO public.rhythm_configs
  (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
SELECT
  fm.family_id, fm.id,
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
FROM public.family_members fm
WHERE (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play'))
  AND fm.is_active = true
ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

-- Evening
INSERT INTO public.rhythm_configs
  (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
   section_order_locked, sections, timing)
SELECT
  fm.family_id, fm.id,
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
FROM public.family_members fm
WHERE (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play'))
  AND fm.is_active = true
ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

-- Weekly Review
INSERT INTO public.rhythm_configs
  (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
SELECT
  fm.family_id, fm.id,
  'weekly_review', 'Weekly Review', 'default', true,
  '[
    {"section_type":"weekly_stats","enabled":true,"order":1,"config":{}},
    {"section_type":"top_victories","enabled":true,"order":2,"config":{}},
    {"section_type":"next_week_preview","enabled":true,"order":3,"config":{}},
    {"section_type":"weekly_reflection_prompt","enabled":true,"order":4,"config":{}},
    {"section_type":"weekly_review_deep_dive","enabled":true,"order":5,"config":{}}
  ]'::jsonb,
  '{"trigger_type":"weekly","day_of_week":5}'::jsonb
FROM public.family_members fm
WHERE (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play'))
  AND fm.is_active = true
ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

-- Monthly Review (disabled by default)
INSERT INTO public.rhythm_configs
  (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
SELECT
  fm.family_id, fm.id,
  'monthly_review', 'Monthly Review', 'default', false,
  '[
    {"section_type":"month_at_a_glance","enabled":true,"order":1,"config":{}},
    {"section_type":"highlight_reel","enabled":true,"order":2,"config":{}},
    {"section_type":"reports_link","enabled":true,"order":3,"config":{}},
    {"section_type":"monthly_review_deep_dive","enabled":true,"order":4,"config":{}}
  ]'::jsonb,
  '{"trigger_type":"monthly","day_of_month":1}'::jsonb
FROM public.family_members fm
WHERE (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play'))
  AND fm.is_active = true
ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

-- Quarterly Inventory (disabled by default)
INSERT INTO public.rhythm_configs
  (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
SELECT
  fm.family_id, fm.id,
  'quarterly_inventory', 'Quarterly Inventory', 'default', false,
  '[
    {"section_type":"stale_areas","enabled":true,"order":1,"config":{}},
    {"section_type":"quick_win_suggestion","enabled":true,"order":2,"config":{}},
    {"section_type":"lifelantern_launch_link","enabled":true,"order":3,"config":{}}
  ]'::jsonb,
  '{"trigger_type":"lifelantern_staleness","interval_days":90}'::jsonb
FROM public.family_members fm
WHERE (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play'))
  AND fm.is_active = true
ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;


-- ============================================================
-- 7. Feature keys for PRD-18 Rhythms & Reflections
--    reflections_basic and reflections_custom already registered
--    in migrations 100071/100072 — excluded here.
-- ============================================================
INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('rhythms_basic',           'Rhythms',                    'Morning and Evening rhythms with default templates',                'PRD-18'),
  ('rhythms_periodic',        'Periodic Rhythms',            'Weekly, Monthly, and Quarterly review rhythms',                    'PRD-18'),
  ('rhythms_custom',          'Custom Rhythms',              'Custom rhythm creation and Studio template activation',            'PRD-18'),
  ('reflections_export',      'Export Reflections',          'Export filtered reflection history as document',                   'PRD-18'),
  ('rhythm_dynamic_prompts',  'AI Dynamic Prompts',          'LiLa-generated contextual reflection prompts',                    'PRD-18'),
  ('rhythm_morning_insight',  'Morning Insight',             'BookShelf-powered morning insight section',                        'PRD-18'),
  ('rhythm_feature_discovery','Feature Discovery',           'Platform onboarding engine via rhythm nudges',                     'PRD-18'),
  ('rhythm_mindsweep_lite',   'MindSweep-Lite',              'Embedded brain dump in evening rhythm',                           'PRD-18'),
  ('rhythm_on_the_horizon',   'On the Horizon',              'Forward-looking 7-day awareness section',                         'PRD-18'),
  ('rhythm_tracker_prompts',  'Rhythm Tracker Prompts',      'Configure any tracker to surface in any rhythm',                  'PRD-18')
ON CONFLICT (feature_key) DO NOTHING;


-- ============================================================
-- 8. Feature access tiers (all return true during beta).
--    Tier mapping:
--      rhythms_basic            → essential  → mom, dad_adults, independent_teens, guided_kids, play_kids
--      rhythms_periodic         → enhanced   → mom, dad_adults, independent_teens
--      rhythms_custom           → enhanced   → mom, dad_adults, independent_teens
--      reflections_export       → full-magic → mom, dad_adults, independent_teens
--      rhythm_dynamic_prompts   → full-magic → mom, dad_adults
--      rhythm_morning_insight   → enhanced   → mom, dad_adults, independent_teens
--      rhythm_feature_discovery → essential  → mom, dad_adults, independent_teens
--      rhythm_mindsweep_lite    → essential  → mom, dad_adults, independent_teens
--      rhythm_on_the_horizon    → essential  → mom, dad_adults, independent_teens, guided_kids
--      rhythm_tracker_prompts   → enhanced   → mom, dad_adults, independent_teens
-- ============================================================
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT fk.feature_key, fk.role_group, st.id, true
FROM (VALUES
  ('rhythms_basic',            'mom',               'essential'),
  ('rhythms_basic',            'dad_adults',        'essential'),
  ('rhythms_basic',            'independent_teens', 'essential'),
  ('rhythms_basic',            'guided_kids',       'essential'),
  ('rhythms_basic',            'play_kids',         'essential'),
  ('rhythms_periodic',         'mom',               'enhanced'),
  ('rhythms_periodic',         'dad_adults',        'enhanced'),
  ('rhythms_periodic',         'independent_teens', 'enhanced'),
  ('rhythms_custom',           'mom',               'enhanced'),
  ('rhythms_custom',           'dad_adults',        'enhanced'),
  ('rhythms_custom',           'independent_teens', 'enhanced'),
  ('reflections_export',       'mom',               'full-magic'),
  ('reflections_export',       'dad_adults',        'full-magic'),
  ('reflections_export',       'independent_teens', 'full-magic'),
  ('rhythm_dynamic_prompts',   'mom',               'full-magic'),
  ('rhythm_dynamic_prompts',   'dad_adults',        'full-magic'),
  ('rhythm_morning_insight',   'mom',               'enhanced'),
  ('rhythm_morning_insight',   'dad_adults',        'enhanced'),
  ('rhythm_morning_insight',   'independent_teens', 'enhanced'),
  ('rhythm_feature_discovery', 'mom',               'essential'),
  ('rhythm_feature_discovery', 'dad_adults',        'essential'),
  ('rhythm_feature_discovery', 'independent_teens', 'essential'),
  ('rhythm_mindsweep_lite',    'mom',               'essential'),
  ('rhythm_mindsweep_lite',    'dad_adults',        'essential'),
  ('rhythm_mindsweep_lite',    'independent_teens', 'essential'),
  ('rhythm_on_the_horizon',    'mom',               'essential'),
  ('rhythm_on_the_horizon',    'dad_adults',        'essential'),
  ('rhythm_on_the_horizon',    'independent_teens', 'essential'),
  ('rhythm_on_the_horizon',    'guided_kids',       'essential'),
  ('rhythm_tracker_prompts',   'mom',               'enhanced'),
  ('rhythm_tracker_prompts',   'dad_adults',        'enhanced'),
  ('rhythm_tracker_prompts',   'independent_teens', 'enhanced')
) AS fk(feature_key, role_group, tier_slug)
CROSS JOIN public.subscription_tiers st
WHERE st.slug = fk.tier_slug
ON CONFLICT DO NOTHING;
