-- ============================================================
-- Migration 100032: Create widget_starter_configs + seed 10 trackers
-- PRD-10 — Widget & Tracker starter configurations for Studio
-- Authoritative source: specs/studio-seed-templates.md Section 3
-- ============================================================
-- This table holds pre-built starter configurations shown in Studio
-- under the "Trackers & Widgets" category. Each config references
-- a tracker_type (data engine) and visual_variant (rendering style).
--
-- The full PRD-10 widget system (dashboard_widgets, widget_templates,
-- widget_data_points, etc.) is not yet built. This migration creates
-- only the starter config catalog so seed data is ready when PRD-10
-- tables are added.
--
-- Idempotent: safe to re-run at any time.
-- ============================================================

-- ============================================================
-- SECTION 1: Create widget_starter_configs table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.widget_starter_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_type    TEXT NOT NULL,
  visual_variant  TEXT NOT NULL,
  config_name     TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  default_config  JSONB NOT NULL DEFAULT '{}',
  is_example      BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint for idempotent seeding
CREATE UNIQUE INDEX IF NOT EXISTS idx_wsc_config_name
  ON public.widget_starter_configs (config_name);

-- RLS: public read, admin write
ALTER TABLE public.widget_starter_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wsc_select_public" ON public.widget_starter_configs;
CREATE POLICY "wsc_select_public" ON public.widget_starter_configs
  FOR SELECT USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.trg_wsc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wsc_updated_at ON public.widget_starter_configs;
CREATE TRIGGER trg_wsc_updated_at
  BEFORE UPDATE ON public.widget_starter_configs
  FOR EACH ROW EXECUTE FUNCTION public.trg_wsc_updated_at();

-- ============================================================
-- SECTION 2: Seed 10 starter configs
-- Deterministic UUIDs derived from md5 hash of config_name
-- so re-runs produce the same IDs.
-- ============================================================

-- Helper: deterministic UUID from a text key
-- md5() returns 32 hex chars; we format as UUID (8-4-4-4-12)
-- This is NOT a cryptographic operation — just stable ID generation.

-- ── 1. Morning Routine Streak ─────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Morning Routine Streak')::uuid,
  'streak',
  'flame_counter',
  'Morning Routine Streak',
  'Tracks consecutive days the morning routine is completed. Current streak shown as a flame counter with milestone celebrations. Longest streak stored. Connects to morning routine task completion automatically.',
  'Daily Life & Routines',
  '{
    "title": "[Name]''s Morning Streak",
    "auto_track_source": "linked_routine",
    "grace_period": 0,
    "celebration_at_milestones": [7, 14, 30, 60, 100],
    "assigned_to": null
  }'::jsonb,
  false,
  1
) ON CONFLICT (config_name) DO NOTHING;

-- ── 2. Daily Habit Grid ───────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Daily Habit Grid')::uuid,
  'grid',
  'bujo_monthly_grid',
  'Daily Habit Grid',
  'A classic bullet-journal-style monthly grid. Each row is a habit, each column is a day. Tap a cell to mark it done. Builds a beautiful visual record over time. Perfect for tracking daily yes/no habits across a month.',
  'Daily Life & Routines',
  '{
    "title": "[Name]''s Habit Grid",
    "grid_size": "monthly",
    "default_habits": ["Make bed", "Read 20 min", "Exercise", "Kind deed"],
    "visual_style": "artistic",
    "reset_period": "monthly"
  }'::jsonb,
  false,
  2
) ON CONFLICT (config_name) DO NOTHING;

-- ── 3. Reading Log (Books) ────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Reading Log (Books)')::uuid,
  'tally',
  'star_chart',
  'Reading Log (Books)',
  'Counts books finished. Each completion adds a star to the chart. Set a goal (20 books this year!) and watch it fill up. Works great as a family race — turn on multiplayer mode and race to the finish together.',
  'Learning & School',
  '{
    "title": "[Name]''s Reading Goal",
    "measurement_unit": "books",
    "target_number": 20,
    "reset_period": "yearly",
    "multiplayer_compatible": true,
    "prize_description": null,
    "celebration_type": "confetti"
  }'::jsonb,
  false,
  3
) ON CONFLICT (config_name) DO NOTHING;

-- ── 4. Homeschool Hours by Subject ────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Homeschool Hours by Subject')::uuid,
  'timer_duration',
  'time_bar_chart',
  'Homeschool Hours by Subject',
  'Tracks time spent on each subject per week. Each bar represents a subject. Mom sees total hours at a glance. Perfect for ESA documentation and for making sure subjects aren''t getting squeezed. Links to task completion timers automatically.',
  'Learning & School',
  '{
    "title": "[Name]''s School Hours",
    "measurement_unit": "hours",
    "subjects": ["Math", "Language Arts", "Science", "History", "Read-Aloud", "Other"],
    "time_range": "weekly",
    "show_total": true,
    "show_average": true,
    "auto_track_source": "focus_timer"
  }'::jsonb,
  false,
  4
) ON CONFLICT (config_name) DO NOTHING;

-- ── 5. Sticker Chart ──────────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Sticker Chart')::uuid,
  'collection',
  'animated_sticker_grid',
  'Sticker Chart',
  'The digital version of a classic sticker chart. Each earned sticker gets placed with a satisfying animation. Set a goal number and a prize. Perfect for young kids building a habit or earning toward something special. Mom awards stickers manually.',
  'Chores & Responsibility',
  '{
    "title": "[Name]''s Sticker Chart",
    "sticker_type": "star",
    "target_number": 15,
    "grid_columns": 5,
    "prize_description": null,
    "celebration_type": "confetti",
    "manual_award": true,
    "visual_style": "kid_friendly"
  }'::jsonb,
  false,
  5
) ON CONFLICT (config_name) DO NOTHING;

-- ── 6. IEP / ISP Goal Progress ────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::IEP / ISP Goal Progress')::uuid,
  'tally',
  'progress_bar_multi',
  'IEP / ISP Goal Progress',
  'One progress bar per goal. Track measurable IEP or ISP goals alongside daily life — not buried in a folder. Mom updates progress; therapists and aides can log during sessions. Pulls into monthly SDS/disability reports automatically. Create one instance per active goal.',
  'Special Needs & Therapy',
  '{
    "title": "[Goal Name]",
    "measurement_unit": "trials",
    "target_number": null,
    "show_percent": true,
    "notes_enabled": true,
    "auto_include_in_reports": true,
    "reset_period": "never"
  }'::jsonb,
  false,
  6
) ON CONFLICT (config_name) DO NOTHING;

-- ── 7. Weekly Chore Completion ────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Weekly Chore Completion')::uuid,
  'percentage',
  'donut_completion',
  'Weekly Chore Completion',
  'Shows what percentage of assigned chores were completed this week. Auto-calculates from linked routine tasks — mom doesn''t enter anything. Great for connecting to allowance: "You completed 80% of your chores, so you earned 80% of your allowance." Links directly to the Allowance Calculator.',
  'Chores & Responsibility',
  '{
    "title": "[Name]''s Chores This Week",
    "calculation_source": "linked_routines",
    "goal_percentage": 100,
    "reset_period": "weekly",
    "connect_to_allowance": true,
    "visual_style": "modern"
  }'::jsonb,
  false,
  7
) ON CONFLICT (config_name) DO NOTHING;

-- ── 8. Independence Skills Path ───────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Independence Skills Path')::uuid,
  'sequential_path',
  'staircase',
  'Independence Skills Path',
  'An ordered set of skills that unlock one at a time. Each step represents a milestone on the way to independence — getting dressed alone, making a simple meal, doing laundry, etc. When one skill is mastered, the next step lights up. Perfect for special needs families and any child building independence over time.',
  'Special Needs & Therapy',
  '{
    "title": "[Name]''s Independence Path",
    "visual_variant": "staircase",
    "steps": [],
    "completion_condition": "manual",
    "prize_at_end": null,
    "multiplayer_compatible": false
  }'::jsonb,
  false,
  8
) ON CONFLICT (config_name) DO NOTHING;

-- ── 9. Family Reading Race ────────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Family Reading Race')::uuid,
  'tally',
  'colored_bars_competitive',
  'Family Reading Race',
  'A multiplayer reading tracker where every family member has their own colored bar racing toward the same goal. Who finishes 20 books first? Each person logs their own books. Mom sees everyone''s progress at a glance on the Family Overview. Brings healthy competition and family connection to reading.',
  'Family & Multiplayer',
  '{
    "title": "Family Reading Race",
    "measurement_unit": "books",
    "target_number": 20,
    "multiplayer_mode": "competitive",
    "members": [],
    "reset_period": "yearly",
    "celebration_type": "confetti",
    "show_on_family_overview": true
  }'::jsonb,
  false,
  9
) ON CONFLICT (config_name) DO NOTHING;

-- ── 10. Daily Mood Check-In ───────────────────────────────────

INSERT INTO public.widget_starter_configs (
  id, tracker_type, visual_variant, config_name, description,
  category, default_config, is_example, sort_order
) VALUES (
  md5('widget_starter::Daily Mood Check-In')::uuid,
  'dot_circle',
  'year_in_pixels_weekly',
  'Daily Mood Check-In',
  'A row of colored circles, one per day. Each day, tap your mood level (1–5 scale). Over time, the pattern reveals energy rhythms, hard seasons, and good stretches. Works for mom tracking her own patterns, or for older kids and teens building emotional self-awareness. Not shared by default — this one is personal.',
  'Personal Wellbeing',
  '{
    "title": "My Daily Check-In",
    "scale_type": "1-5",
    "scale_labels": ["Rough", "Low", "Okay", "Good", "Great"],
    "visual_style": "artistic",
    "sharing_enabled": false,
    "notes_enabled": true,
    "month_view": true,
    "assigned_to": null
  }'::jsonb,
  false,
  10
) ON CONFLICT (config_name) DO NOTHING;

-- ============================================================
-- VERIFY: Count should be 10
-- ============================================================
-- SELECT count(*) FROM public.widget_starter_configs;
-- Expected: 10
