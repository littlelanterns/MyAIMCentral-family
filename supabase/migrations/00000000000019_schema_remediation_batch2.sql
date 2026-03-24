-- ============================================================================
-- Schema Remediation Batch 2
-- Fixes all schema issues across completed phases:
--   PRD-36: Create time_sessions + timer_configs (from scratch)
--   PRD-35: Fix access_schedules (missing columns, enum fix)
--   PRD-35: Add recurrence_rule CHECK on tasks
--   PRD-01: Fix family_members role enum (6→4 values)
--   PRD-01: Fix families.tablet_hub_timeout (INTEGER→TEXT enum)
--   PRD-02: Create permission_presets table + seed system presets
--   PRD-05: Verify lila_conversations (no fabricated columns found)
--   Seed all new feature keys
-- ============================================================================

-- ============================================================================
-- SECTION 1: PRD-36 — Create time_sessions table
-- Timestamp-based time tracking engine. One row per start/stop cycle.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.time_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  started_by UUID NOT NULL REFERENCES public.family_members(id),
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  -- widget_id UUID — FK to dashboard_widgets deferred (table created in Phase 11)
  widget_id UUID,
  list_item_id UUID REFERENCES public.list_items(id) ON DELETE SET NULL,
  source_type TEXT,
  source_reference_id UUID,
  timer_mode TEXT NOT NULL DEFAULT 'clock'
    CHECK (timer_mode IN ('clock', 'pomodoro_focus', 'pomodoro_break', 'stopwatch', 'countdown')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  is_standalone BOOLEAN NOT NULL DEFAULT false,
  standalone_label TEXT,
  pomodoro_interval_number INTEGER,
  pomodoro_config JSONB,
  countdown_target_minutes INTEGER,
  auto_paused BOOLEAN NOT NULL DEFAULT false,
  edited BOOLEAN NOT NULL DEFAULT false,
  edited_by UUID REFERENCES public.family_members(id),
  edited_at TIMESTAMPTZ,
  original_timestamps JSONB,
  edit_reason TEXT,
  deleted_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes per PRD-36
CREATE INDEX IF NOT EXISTS idx_ts_member_ended
  ON public.time_sessions(family_member_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_ts_task_member
  ON public.time_sessions(task_id, family_member_id, created_at)
  WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ts_widget_member
  ON public.time_sessions(widget_id, family_member_id, created_at)
  WHERE widget_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ts_list_member
  ON public.time_sessions(list_item_id, family_member_id, created_at)
  WHERE list_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ts_source
  ON public.time_sessions(source_type, source_reference_id)
  WHERE source_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ts_family_ended
  ON public.time_sessions(family_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_ts_member_mode
  ON public.time_sessions(family_member_id, timer_mode, created_at);
CREATE INDEX IF NOT EXISTS idx_ts_auto_paused
  ON public.time_sessions(auto_paused)
  WHERE auto_paused = true;
CREATE INDEX IF NOT EXISTS idx_ts_active
  ON public.time_sessions(family_member_id)
  WHERE ended_at IS NULL AND deleted_at IS NULL;

-- RLS: Family-scoped. Mom full access. Members own sessions.
ALTER TABLE public.time_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ts_manage_primary_parent" ON public.time_sessions
  FOR ALL USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

CREATE POLICY "ts_select_own" ON public.time_sessions
  FOR SELECT USING (
    family_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "ts_insert_own" ON public.time_sessions
  FOR INSERT WITH CHECK (
    family_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR started_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "ts_update_own" ON public.time_sessions
  FOR UPDATE USING (
    family_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Auto-calculate duration_minutes on session end
CREATE OR REPLACE FUNCTION public.trg_time_session_calc_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  END IF;
  -- Recalculate if timestamps edited
  IF NEW.edited = true AND NEW.ended_at IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ts_calc_duration
  BEFORE UPDATE ON public.time_sessions
  FOR EACH ROW EXECUTE FUNCTION public.trg_time_session_calc_duration();

-- ============================================================================
-- SECTION 2: PRD-36 — Create timer_configs table
-- Per-member timer configuration. One record per family member.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.timer_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  timer_visible BOOLEAN NOT NULL DEFAULT true,
  idle_reminder_minutes INTEGER NOT NULL DEFAULT 120,
  idle_repeat_minutes INTEGER NOT NULL DEFAULT 60,
  auto_pause_minutes INTEGER NOT NULL DEFAULT 0,
  pomodoro_focus_minutes INTEGER NOT NULL DEFAULT 25,
  pomodoro_short_break_minutes INTEGER NOT NULL DEFAULT 5,
  pomodoro_long_break_minutes INTEGER NOT NULL DEFAULT 15,
  pomodoro_intervals_before_long INTEGER NOT NULL DEFAULT 4,
  pomodoro_break_required BOOLEAN NOT NULL DEFAULT false,
  can_start_standalone BOOLEAN NOT NULL DEFAULT true,
  visual_timer_style TEXT NOT NULL DEFAULT 'sand_timer'
    CHECK (visual_timer_style IN ('sand_timer', 'hourglass', 'thermometer', 'arc', 'filling_jar')),
  show_time_as_numbers BOOLEAN NOT NULL DEFAULT true,
  bubble_position JSONB NOT NULL DEFAULT '{"x": "right", "y": "bottom"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_member_id)
);

-- Indexes per PRD-36
CREATE INDEX IF NOT EXISTS idx_tc_family_member
  ON public.timer_configs(family_member_id);
CREATE INDEX IF NOT EXISTS idx_tc_family
  ON public.timer_configs(family_id);

-- updated_at trigger
CREATE TRIGGER trg_tc_updated_at
  BEFORE UPDATE ON public.timer_configs
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- RLS: Family-scoped. Mom full CRUD. Members read own.
ALTER TABLE public.timer_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tc_manage_primary_parent" ON public.timer_configs
  FOR ALL USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

CREATE POLICY "tc_select_own" ON public.timer_configs
  FOR SELECT USING (
    family_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- ============================================================================
-- SECTION 3: PRD-35 — Fix access_schedules table
-- Add missing columns: schedule_name, start_time, end_time
-- Fix schedule_type enum: replace 'shift' with 'recurring'
-- ============================================================================

-- Add missing columns
ALTER TABLE public.access_schedules
  ADD COLUMN IF NOT EXISTS schedule_name TEXT,
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME;

-- Fix schedule_type enum: migrate 'shift' → 'recurring'
UPDATE public.access_schedules
SET schedule_type = 'recurring'
WHERE schedule_type = 'shift';

-- Drop old CHECK constraint and add corrected one
ALTER TABLE public.access_schedules
  DROP CONSTRAINT IF EXISTS access_schedules_schedule_type_check;

ALTER TABLE public.access_schedules
  ADD CONSTRAINT access_schedules_schedule_type_check
  CHECK (schedule_type IN ('recurring', 'custody', 'always_on'));

-- Add index on (special_adult_id alias = member_id, is_active) per PRD-35
CREATE INDEX IF NOT EXISTS idx_as_member_active
  ON public.access_schedules(member_id, is_active)
  WHERE is_active = true;

-- ============================================================================
-- SECTION 4: PRD-35 — Add recurrence_rule CHECK on tasks table
-- Expand with: yearly, completion_dependent, custody, one_time
-- ============================================================================

-- The recurrence_rule column was added in migration 9 without a CHECK.
-- Add the full PRD-35 expanded CHECK constraint.
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_recurrence_rule_check
  CHECK (recurrence_rule IS NULL OR recurrence_rule IN (
    'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'yearly',
    'custom', 'completion_dependent', 'custody', 'one_time'
  ));

-- ============================================================================
-- SECTION 5: PRD-35 — Drop shift_schedules if exists
-- Replaced by access_schedules per PRD-35
-- ============================================================================

DROP TABLE IF EXISTS public.shift_schedules CASCADE;

-- ============================================================================
-- SECTION 6: PRD-01 — Fix family_members role enum
-- Current: 6 values (primary_parent, additional_adult, special_adult,
--          independent, guided, play)
-- Target:  4 values (primary_parent, additional_adult, special_adult, member)
-- The dashboard_mode column (adult, independent, guided, play) already exists.
-- ============================================================================

-- Step 1: Migrate data — set dashboard_mode from role for child roles
UPDATE public.family_members
SET dashboard_mode = 'independent'
WHERE role = 'independent' AND (dashboard_mode IS NULL OR dashboard_mode = '');

UPDATE public.family_members
SET dashboard_mode = 'guided'
WHERE role = 'guided' AND (dashboard_mode IS NULL OR dashboard_mode = '');

UPDATE public.family_members
SET dashboard_mode = 'play'
WHERE role = 'play' AND (dashboard_mode IS NULL OR dashboard_mode = '');

-- Also set dashboard_mode for adults who don't have it yet
UPDATE public.family_members
SET dashboard_mode = 'adult'
WHERE role = 'additional_adult' AND (dashboard_mode IS NULL OR dashboard_mode = '');

-- Step 2: Consolidate child roles → 'member'
UPDATE public.family_members
SET role = 'member'
WHERE role IN ('independent', 'guided', 'play');

-- Step 3: Drop old CHECK constraint, add new one with 4 values
ALTER TABLE public.family_members
  DROP CONSTRAINT IF EXISTS family_members_role_check;

ALTER TABLE public.family_members
  ADD CONSTRAINT family_members_role_check
  CHECK (role IN ('primary_parent', 'additional_adult', 'special_adult', 'member'));

-- ============================================================================
-- SECTION 7: PRD-01 — Fix families.tablet_hub_timeout
-- Current: INTEGER NOT NULL DEFAULT 300
-- Target:  TEXT NOT NULL DEFAULT 'never'
-- PRD-01 enum: 'never', '15min', '30min', '1hr', '4hr'
-- ============================================================================

ALTER TABLE public.families
  ALTER COLUMN tablet_hub_timeout TYPE TEXT
  USING 'never';

ALTER TABLE public.families
  ALTER COLUMN tablet_hub_timeout SET DEFAULT 'never';

ALTER TABLE public.families
  ADD CONSTRAINT families_tablet_hub_timeout_check
  CHECK (tablet_hub_timeout IN ('never', '15min', '30min', '1hr', '4hr'));

-- ============================================================================
-- SECTION 8: PRD-01 — Update RPCs for new 4-value role model
-- ============================================================================

-- Fix get_family_login_members to sort by role + dashboard_mode
CREATE OR REPLACE FUNCTION public.get_family_login_members(p_family_id UUID)
RETURNS TABLE(
  member_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  login_method TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT fm.id, fm.display_name, fm.avatar_url, fm.login_method
  FROM public.family_members fm
  WHERE fm.family_id = p_family_id
    AND fm.is_active = true
  ORDER BY
    CASE fm.role
      WHEN 'primary_parent' THEN 1
      WHEN 'additional_adult' THEN 2
      WHEN 'special_adult' THEN 3
      WHEN 'member' THEN
        CASE fm.dashboard_mode
          WHEN 'adult' THEN 4
          WHEN 'independent' THEN 5
          WHEN 'guided' THEN 6
          WHEN 'play' THEN 7
          ELSE 8
        END
      ELSE 9
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix check_feature_access: fix 'special_adults' typo → 'special_adult'
CREATE OR REPLACE FUNCTION public.check_feature_access(
  p_member_id UUID,
  p_feature_key TEXT
) RETURNS JSONB AS $$
DECLARE
  v_member RECORD;
  v_family RECORD;
  v_subscription RECORD;
  v_role_group TEXT;
  v_access RECORD;
  v_toggle RECORD;
  v_is_founding BOOLEAN;
  v_result JSONB;
BEGIN
  -- Get member info
  SELECT * INTO v_member FROM family_members WHERE id = p_member_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'blockedBy', 'none');
  END IF;

  -- Get family info
  SELECT * INTO v_family FROM families WHERE id = v_member.family_id;

  -- Get subscription
  SELECT fs.*, st.slug as tier_slug, st.sort_order as tier_order
  INTO v_subscription
  FROM family_subscriptions fs
  JOIN subscription_tiers st ON st.id = fs.tier_id
  WHERE fs.family_id = v_member.family_id;

  -- Map role to role_group (supports 4-value role model)
  v_role_group := CASE v_member.role
    WHEN 'primary_parent' THEN 'mom'
    WHEN 'additional_adult' THEN 'dad_adults'
    WHEN 'special_adult' THEN 'special_adults'
    WHEN 'member' THEN
      CASE v_member.dashboard_mode
        WHEN 'independent' THEN 'independent_teens'
        WHEN 'guided' THEN 'guided_kids'
        WHEN 'play' THEN 'play_kids'
        WHEN 'adult' THEN 'dad_adults'
        ELSE 'dad_adults'
      END
    ELSE 'dad_adults'
  END;

  -- Founding family check: bypasses tier gating
  v_is_founding := COALESCE(v_family.is_founding_family, false)
    AND COALESCE(v_subscription.status, '') = 'active';

  -- Layer 1: Tier check via feature_access_v2
  SELECT * INTO v_access
  FROM feature_access_v2
  WHERE feature_key = p_feature_key AND role_group = v_role_group;

  IF NOT FOUND THEN
    -- No access record = not available for this role
    RETURN jsonb_build_object('allowed', false, 'blockedBy', 'tier');
  END IF;

  IF NOT v_access.is_enabled THEN
    RETURN jsonb_build_object('allowed', false, 'blockedBy', 'never');
  END IF;

  -- Check tier threshold (skip if founding family)
  IF NOT v_is_founding AND v_access.minimum_tier_id IS NOT NULL THEN
    DECLARE
      v_min_tier_order INTEGER;
    BEGIN
      SELECT sort_order INTO v_min_tier_order FROM subscription_tiers WHERE id = v_access.minimum_tier_id;
      IF COALESCE(v_subscription.tier_order, 0) < COALESCE(v_min_tier_order, 0) THEN
        RETURN jsonb_build_object('allowed', false, 'blockedBy', 'tier',
          'upgradeTier', (SELECT slug FROM subscription_tiers WHERE id = v_access.minimum_tier_id));
      END IF;
    END;
  END IF;

  -- Layer 2: Member toggle check
  SELECT * INTO v_toggle
  FROM member_feature_toggles
  WHERE member_id = p_member_id AND feature_key = p_feature_key;

  IF FOUND THEN
    IF v_toggle.is_disabled = true OR (v_toggle.enabled IS NOT NULL AND v_toggle.enabled = false) THEN
      RETURN jsonb_build_object('allowed', false, 'blockedBy', 'toggle');
    END IF;
    IF v_toggle.blocked_by_tier = true AND NOT v_is_founding THEN
      RETURN jsonb_build_object('allowed', false, 'blockedBy', 'tier');
    END IF;
  END IF;

  -- All layers passed
  RETURN jsonb_build_object('allowed', true, 'blockedBy', 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 9: PRD-02 — Create permission_presets table
-- Named presets: Full Partner, Active Helper, Observer (adults)
--                Babysitter, Grandparent, Tutor (special adults)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.permission_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.family_members(id),
  preset_name TEXT NOT NULL,
  target_role TEXT NOT NULL CHECK (target_role IN ('additional_adult', 'special_adult')),
  permissions_config JSONB NOT NULL,
  is_system_preset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pp_family_role
  ON public.permission_presets(family_id, target_role);

CREATE TRIGGER trg_pp_updated_at
  BEFORE UPDATE ON public.permission_presets
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.permission_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pp_select_authenticated" ON public.permission_presets
  FOR SELECT USING (
    is_system_preset = true
    OR family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

CREATE POLICY "pp_manage_primary_parent" ON public.permission_presets
  FOR ALL USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- Seed 6 system presets (PRD-02)
INSERT INTO public.permission_presets (preset_name, target_role, permissions_config, is_system_preset)
VALUES
  -- Additional Adult presets
  ('Full Partner', 'additional_adult', '{
    "tasks": "manage", "calendar": "manage", "messaging": "manage",
    "lists": "manage", "victories": "manage", "widgets": "manage",
    "journal": "view", "notepad": "manage", "guiding_stars": "manage",
    "best_intentions": "manage", "innerworkings": "manage",
    "safe_harbor": "manage", "archives": "view", "rhythms": "manage",
    "vault": "view", "lila": "view"
  }', true),
  ('Active Helper', 'additional_adult', '{
    "tasks": "contribute", "calendar": "contribute", "messaging": "contribute",
    "lists": "contribute", "victories": "contribute", "widgets": "contribute",
    "notepad": "manage", "guiding_stars": "manage", "best_intentions": "manage",
    "rhythms": "manage", "lila": "view"
  }', true),
  ('Observer', 'additional_adult', '{
    "tasks": "view", "calendar": "view", "messaging": "contribute",
    "lists": "view", "victories": "contribute", "widgets": "view",
    "lila": "view"
  }', true),
  -- Special Adult presets
  ('Babysitter', 'special_adult', '{
    "tasks_routines": "contribute", "trackable_events": "contribute",
    "notes_instructions": "view", "shift_notes": "contribute",
    "calendar": "view"
  }', true),
  ('Grandparent', 'special_adult', '{
    "tasks_routines": "contribute", "trackable_events": "contribute",
    "notes_instructions": "view", "shift_notes": "contribute",
    "calendar": "view", "messaging": "contribute"
  }', true),
  ('Tutor', 'special_adult', '{
    "tasks_routines": "view", "notes_instructions": "view",
    "shift_notes": "contribute"
  }', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 10: PRD-05 — Verify lila_conversations
-- Checking for fabricated columns: container_preference, source, saved_prompt_id
-- Result: NONE of these exist on lila_conversations. No drops needed.
-- Cross-PRD columns (is_safe_harbor, vault_item_id, safety_scanned) are
-- legitimate additions from PRD-20, PRD-21A, PRD-30.
-- The 7 Phase 08 remediation columns are all present:
--   mode, guided_subtype, guided_mode_reference_id, model_used,
--   context_snapshot, message_count, token_usage
-- No action required.
-- ============================================================================

-- ============================================================================
-- SECTION 11: Seed feature keys for new features
-- ============================================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, prd_source) VALUES
  -- PRD-36: Universal Timer
  ('timer_basic', 'Clock in/out, single active timer, basic bubble', 'PRD-36'),
  ('timer_advanced', 'Pomodoro, concurrent timers, standalone, session editing', 'PRD-36'),
  ('timer_visual', 'Visual timer styles for Play/Guided shells', 'PRD-36'),
  -- PRD-35: Universal Scheduler
  ('scheduler_basic', 'Quick picks: one-time, daily, weekly, monthly, yearly', 'PRD-35'),
  ('scheduler_custom', 'Custom intervals, alternating weeks', 'PRD-35'),
  ('scheduler_advanced', 'Custody patterns, completion-dependent, seasonal blocks', 'PRD-35'),
  ('scheduler_lila_extract', 'LiLa bulk schedule extraction from text', 'PRD-35')
ON CONFLICT (feature_key) DO NOTHING;

-- Seed feature_access_v2 for timer and scheduler
DO $$
DECLARE
  t_essential UUID;
  t_enhanced UUID;
  t_full_magic UUID;
BEGIN
  SELECT id INTO t_essential FROM subscription_tiers WHERE slug = 'essential';
  SELECT id INTO t_enhanced FROM subscription_tiers WHERE slug = 'enhanced';
  SELECT id INTO t_full_magic FROM subscription_tiers WHERE slug = 'full_magic';

  INSERT INTO feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled) VALUES
    -- Timer: Essential for mom/dad/teen, enhanced for advanced
    ('timer_basic', 'mom', t_essential, true),
    ('timer_basic', 'dad_adults', t_essential, true),
    ('timer_basic', 'independent_teens', t_essential, true),
    ('timer_basic', 'guided_kids', t_essential, true),
    ('timer_basic', 'play_kids', t_essential, true),
    ('timer_advanced', 'mom', t_enhanced, true),
    ('timer_advanced', 'dad_adults', t_enhanced, true),
    ('timer_advanced', 'independent_teens', t_enhanced, true),
    ('timer_visual', 'mom', t_enhanced, true),
    ('timer_visual', 'guided_kids', t_enhanced, true),
    ('timer_visual', 'play_kids', t_enhanced, true),
    -- Scheduler: Essential for basic, Enhanced/Full Magic for advanced
    ('scheduler_basic', 'mom', t_essential, true),
    ('scheduler_basic', 'dad_adults', t_essential, true),
    ('scheduler_basic', 'independent_teens', t_essential, true),
    ('scheduler_custom', 'mom', t_enhanced, true),
    ('scheduler_custom', 'dad_adults', t_enhanced, true),
    ('scheduler_advanced', 'mom', t_full_magic, true),
    ('scheduler_lila_extract', 'mom', t_full_magic, true)
  ON CONFLICT (feature_key, role_group) DO NOTHING;
END $$;

-- ============================================================================
-- Done. All changes are additive where possible, guarded with IF EXISTS/IF NOT EXISTS.
-- ============================================================================
