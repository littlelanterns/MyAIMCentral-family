-- ============================================================================
-- PRD-31 Permission Matrix Addendum: Permission Level Profiles
-- Seed data for Light/Balanced/Maximum access levels per role group
-- ============================================================================

CREATE TABLE IF NOT EXISTS permission_level_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_group TEXT NOT NULL CHECK (role_group IN ('dad_adults', 'special_adults', 'independent_teens', 'guided_kids', 'play_kids')),
  level TEXT NOT NULL CHECK (level IN ('light', 'balanced', 'maximum')),
  feature_key TEXT NOT NULL,
  feature_enabled BOOLEAN NOT NULL,
  default_permission_level TEXT DEFAULT 'view' NOT NULL
    CHECK (default_permission_level IN ('none', 'view', 'contribute', 'manage')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (role_group, level, feature_key)
);

ALTER TABLE permission_level_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY plp_select_authenticated ON permission_level_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- SEED DATA: Dad / Additional Adults
-- ============================================================================
INSERT INTO permission_level_profiles (role_group, level, feature_key, feature_enabled, default_permission_level) VALUES
  -- LIGHT Dad: Family logistics only
  ('dad_adults', 'light', 'tasks_basic', true, 'view'),
  ('dad_adults', 'light', 'calendar_basic', true, 'view'),
  ('dad_adults', 'light', 'messaging_basic', true, 'contribute'),
  ('dad_adults', 'light', 'family_hub', true, 'view'),
  ('dad_adults', 'light', 'lists_basic', true, 'view'),
  ('dad_adults', 'light', 'victory_recorder_basic', true, 'contribute'),
  ('dad_adults', 'light', 'widgets', true, 'view'),
  ('dad_adults', 'light', 'lila_help', true, 'view'),
  ('dad_adults', 'light', 'requests_basic', true, 'contribute'),
  ('dad_adults', 'light', 'notifications_basic', true, 'view'),
  ('dad_adults', 'light', 'settings_basic', true, 'manage'),
  -- Light Dad: OFF features
  ('dad_adults', 'light', 'journal_basic', false, 'none'),
  ('dad_adults', 'light', 'notepad_basic', false, 'none'),
  ('dad_adults', 'light', 'guiding_stars_basic', false, 'none'),
  ('dad_adults', 'light', 'best_intentions', false, 'none'),
  ('dad_adults', 'light', 'innerworkings_basic', false, 'none'),
  ('dad_adults', 'light', 'lila_modal_access', false, 'none'),
  ('dad_adults', 'light', 'lila_assist', false, 'none'),
  ('dad_adults', 'light', 'safe_harbor', false, 'none'),
  ('dad_adults', 'light', 'tool_higgins_say', false, 'none'),
  ('dad_adults', 'light', 'archives_browse', false, 'none'),
  ('dad_adults', 'light', 'rhythms_basic', false, 'none'),

  -- BALANCED Dad: Most family tools + personal features
  ('dad_adults', 'balanced', 'tasks_basic', true, 'contribute'),
  ('dad_adults', 'balanced', 'calendar_basic', true, 'contribute'),
  ('dad_adults', 'balanced', 'messaging_basic', true, 'contribute'),
  ('dad_adults', 'balanced', 'family_hub', true, 'contribute'),
  ('dad_adults', 'balanced', 'lists_basic', true, 'contribute'),
  ('dad_adults', 'balanced', 'victory_recorder_basic', true, 'contribute'),
  ('dad_adults', 'balanced', 'widgets', true, 'contribute'),
  ('dad_adults', 'balanced', 'lila_help', true, 'view'),
  ('dad_adults', 'balanced', 'lila_assist', true, 'view'),
  ('dad_adults', 'balanced', 'lila_modal_access', true, 'view'),
  ('dad_adults', 'balanced', 'requests_basic', true, 'contribute'),
  ('dad_adults', 'balanced', 'notifications_basic', true, 'view'),
  ('dad_adults', 'balanced', 'settings_basic', true, 'manage'),
  ('dad_adults', 'balanced', 'notepad_basic', true, 'manage'),
  ('dad_adults', 'balanced', 'guiding_stars_basic', true, 'manage'),
  ('dad_adults', 'balanced', 'best_intentions', true, 'manage'),
  ('dad_adults', 'balanced', 'rhythms_basic', true, 'manage'),
  ('dad_adults', 'balanced', 'tool_higgins_say', true, 'view'),
  -- Balanced Dad: OFF features
  ('dad_adults', 'balanced', 'journal_basic', false, 'none'),
  ('dad_adults', 'balanced', 'innerworkings_basic', false, 'none'),
  ('dad_adults', 'balanced', 'safe_harbor', false, 'none'),
  ('dad_adults', 'balanced', 'archives_browse', false, 'none'),

  -- MAXIMUM Dad: Everything tier allows
  ('dad_adults', 'maximum', 'tasks_basic', true, 'manage'),
  ('dad_adults', 'maximum', 'calendar_basic', true, 'manage'),
  ('dad_adults', 'maximum', 'messaging_basic', true, 'manage'),
  ('dad_adults', 'maximum', 'family_hub', true, 'manage'),
  ('dad_adults', 'maximum', 'lists_basic', true, 'manage'),
  ('dad_adults', 'maximum', 'victory_recorder_basic', true, 'manage'),
  ('dad_adults', 'maximum', 'widgets', true, 'manage'),
  ('dad_adults', 'maximum', 'lila_help', true, 'view'),
  ('dad_adults', 'maximum', 'lila_assist', true, 'view'),
  ('dad_adults', 'maximum', 'lila_modal_access', true, 'view'),
  ('dad_adults', 'maximum', 'lila_optimizer', true, 'view'),
  ('dad_adults', 'maximum', 'requests_basic', true, 'manage'),
  ('dad_adults', 'maximum', 'notifications_basic', true, 'view'),
  ('dad_adults', 'maximum', 'settings_basic', true, 'manage'),
  ('dad_adults', 'maximum', 'notepad_basic', true, 'manage'),
  ('dad_adults', 'maximum', 'guiding_stars_basic', true, 'manage'),
  ('dad_adults', 'maximum', 'best_intentions', true, 'manage'),
  ('dad_adults', 'maximum', 'innerworkings_basic', true, 'manage'),
  ('dad_adults', 'maximum', 'journal_basic', true, 'view'),
  ('dad_adults', 'maximum', 'safe_harbor', true, 'manage'),
  ('dad_adults', 'maximum', 'archives_browse', true, 'view'),
  ('dad_adults', 'maximum', 'rhythms_basic', true, 'manage'),
  ('dad_adults', 'maximum', 'tool_higgins_say', true, 'view'),
  ('dad_adults', 'maximum', 'vault_browse', true, 'view')
ON CONFLICT (role_group, level, feature_key) DO NOTHING;

-- ============================================================================
-- SEED DATA: Independent Teens
-- ============================================================================
INSERT INTO permission_level_profiles (role_group, level, feature_key, feature_enabled, default_permission_level) VALUES
  -- LIGHT Teen: Basic family participation
  ('independent_teens', 'light', 'tasks_basic', true, 'contribute'),
  ('independent_teens', 'light', 'calendar_basic', true, 'view'),
  ('independent_teens', 'light', 'messaging_basic', true, 'contribute'),
  ('independent_teens', 'light', 'family_hub', true, 'view'),
  ('independent_teens', 'light', 'lists_basic', true, 'contribute'),
  ('independent_teens', 'light', 'victory_recorder_basic', true, 'contribute'),
  ('independent_teens', 'light', 'widgets', true, 'view'),
  ('independent_teens', 'light', 'lila_help', true, 'view'),
  ('independent_teens', 'light', 'notifications_basic', true, 'view'),
  ('independent_teens', 'light', 'settings_basic', true, 'manage'),
  ('independent_teens', 'light', 'requests_basic', true, 'contribute'),
  -- Light Teen: OFF
  ('independent_teens', 'light', 'journal_basic', false, 'none'),
  ('independent_teens', 'light', 'notepad_basic', false, 'none'),
  ('independent_teens', 'light', 'guiding_stars_basic', false, 'none'),
  ('independent_teens', 'light', 'best_intentions', false, 'none'),
  ('independent_teens', 'light', 'innerworkings_basic', false, 'none'),
  ('independent_teens', 'light', 'lila_modal_access', false, 'none'),

  -- BALANCED Teen: Personal growth + LiLa
  ('independent_teens', 'balanced', 'tasks_basic', true, 'contribute'),
  ('independent_teens', 'balanced', 'calendar_basic', true, 'contribute'),
  ('independent_teens', 'balanced', 'messaging_basic', true, 'contribute'),
  ('independent_teens', 'balanced', 'family_hub', true, 'view'),
  ('independent_teens', 'balanced', 'lists_basic', true, 'contribute'),
  ('independent_teens', 'balanced', 'victory_recorder_basic', true, 'contribute'),
  ('independent_teens', 'balanced', 'widgets', true, 'contribute'),
  ('independent_teens', 'balanced', 'lila_help', true, 'view'),
  ('independent_teens', 'balanced', 'lila_assist', true, 'view'),
  ('independent_teens', 'balanced', 'lila_modal_access', true, 'view'),
  ('independent_teens', 'balanced', 'notifications_basic', true, 'view'),
  ('independent_teens', 'balanced', 'settings_basic', true, 'manage'),
  ('independent_teens', 'balanced', 'requests_basic', true, 'contribute'),
  ('independent_teens', 'balanced', 'journal_basic', true, 'manage'),
  ('independent_teens', 'balanced', 'notepad_basic', true, 'manage'),
  ('independent_teens', 'balanced', 'guiding_stars_basic', true, 'manage'),
  ('independent_teens', 'balanced', 'best_intentions', true, 'manage'),
  ('independent_teens', 'balanced', 'rhythms_basic', true, 'manage'),
  -- Balanced Teen: OFF
  ('independent_teens', 'balanced', 'innerworkings_basic', false, 'none'),

  -- MAXIMUM Teen: Everything tier allows
  ('independent_teens', 'maximum', 'tasks_basic', true, 'contribute'),
  ('independent_teens', 'maximum', 'calendar_basic', true, 'contribute'),
  ('independent_teens', 'maximum', 'messaging_basic', true, 'contribute'),
  ('independent_teens', 'maximum', 'family_hub', true, 'view'),
  ('independent_teens', 'maximum', 'lists_basic', true, 'contribute'),
  ('independent_teens', 'maximum', 'victory_recorder_basic', true, 'contribute'),
  ('independent_teens', 'maximum', 'widgets', true, 'contribute'),
  ('independent_teens', 'maximum', 'lila_help', true, 'view'),
  ('independent_teens', 'maximum', 'lila_assist', true, 'view'),
  ('independent_teens', 'maximum', 'lila_modal_access', true, 'view'),
  ('independent_teens', 'maximum', 'notifications_basic', true, 'view'),
  ('independent_teens', 'maximum', 'settings_basic', true, 'manage'),
  ('independent_teens', 'maximum', 'requests_basic', true, 'contribute'),
  ('independent_teens', 'maximum', 'journal_basic', true, 'manage'),
  ('independent_teens', 'maximum', 'notepad_basic', true, 'manage'),
  ('independent_teens', 'maximum', 'guiding_stars_basic', true, 'manage'),
  ('independent_teens', 'maximum', 'best_intentions', true, 'manage'),
  ('independent_teens', 'maximum', 'innerworkings_basic', true, 'manage'),
  ('independent_teens', 'maximum', 'rhythms_basic', true, 'manage'),
  ('independent_teens', 'maximum', 'vault_browse', true, 'view')
ON CONFLICT (role_group, level, feature_key) DO NOTHING;

-- ============================================================================
-- SEED DATA: Guided Kids
-- ============================================================================
INSERT INTO permission_level_profiles (role_group, level, feature_key, feature_enabled, default_permission_level) VALUES
  -- LIGHT Guided: Tasks + gamification core
  ('guided_kids', 'light', 'tasks_basic', true, 'contribute'),
  ('guided_kids', 'light', 'calendar_basic', true, 'view'),
  ('guided_kids', 'light', 'family_hub', true, 'view'),
  ('guided_kids', 'light', 'victory_recorder_basic', true, 'contribute'),
  ('guided_kids', 'light', 'daily_celebration', true, 'view'),

  -- BALANCED Guided: Adds writing + messaging
  ('guided_kids', 'balanced', 'tasks_basic', true, 'contribute'),
  ('guided_kids', 'balanced', 'calendar_basic', true, 'view'),
  ('guided_kids', 'balanced', 'family_hub', true, 'view'),
  ('guided_kids', 'balanced', 'victory_recorder_basic', true, 'contribute'),
  ('guided_kids', 'balanced', 'daily_celebration', true, 'view'),
  ('guided_kids', 'balanced', 'messaging_basic', true, 'contribute'),

  -- MAXIMUM Guided: Adds Guiding Stars view
  ('guided_kids', 'maximum', 'tasks_basic', true, 'contribute'),
  ('guided_kids', 'maximum', 'calendar_basic', true, 'view'),
  ('guided_kids', 'maximum', 'family_hub', true, 'view'),
  ('guided_kids', 'maximum', 'victory_recorder_basic', true, 'contribute'),
  ('guided_kids', 'maximum', 'daily_celebration', true, 'view'),
  ('guided_kids', 'maximum', 'messaging_basic', true, 'contribute'),
  ('guided_kids', 'maximum', 'guiding_stars_basic', true, 'view')
ON CONFLICT (role_group, level, feature_key) DO NOTHING;

-- ============================================================================
-- SEED DATA: Play Kids
-- ============================================================================
INSERT INTO permission_level_profiles (role_group, level, feature_key, feature_enabled, default_permission_level) VALUES
  -- LIGHT Play: Tasks + gamification
  ('play_kids', 'light', 'tasks_basic', true, 'contribute'),
  ('play_kids', 'light', 'family_hub', true, 'view'),
  ('play_kids', 'light', 'daily_celebration', true, 'view'),

  -- BALANCED Play: Adds calendar
  ('play_kids', 'balanced', 'tasks_basic', true, 'contribute'),
  ('play_kids', 'balanced', 'family_hub', true, 'view'),
  ('play_kids', 'balanced', 'daily_celebration', true, 'view'),
  ('play_kids', 'balanced', 'calendar_basic', true, 'view'),

  -- MAXIMUM Play: Same as balanced (few features available)
  ('play_kids', 'maximum', 'tasks_basic', true, 'contribute'),
  ('play_kids', 'maximum', 'family_hub', true, 'view'),
  ('play_kids', 'maximum', 'daily_celebration', true, 'view'),
  ('play_kids', 'maximum', 'calendar_basic', true, 'view')
ON CONFLICT (role_group, level, feature_key) DO NOTHING;

-- ============================================================================
-- SEED DATA: Special Adults
-- ============================================================================
INSERT INTO permission_level_profiles (role_group, level, feature_key, feature_enabled, default_permission_level) VALUES
  -- LIGHT Special Adult: Basics during shift
  ('special_adults', 'light', 'tasks_basic', true, 'view'),
  ('special_adults', 'light', 'calendar_basic', true, 'view'),
  ('special_adults', 'light', 'lila_help', true, 'view'),

  -- BALANCED Special Adult: Adds messaging
  ('special_adults', 'balanced', 'tasks_basic', true, 'contribute'),
  ('special_adults', 'balanced', 'calendar_basic', true, 'view'),
  ('special_adults', 'balanced', 'messaging_basic', true, 'contribute'),
  ('special_adults', 'balanced', 'lila_help', true, 'view'),

  -- MAXIMUM Special Adult: Same as balanced (shift-scoped controls)
  ('special_adults', 'maximum', 'tasks_basic', true, 'contribute'),
  ('special_adults', 'maximum', 'calendar_basic', true, 'view'),
  ('special_adults', 'maximum', 'messaging_basic', true, 'contribute'),
  ('special_adults', 'maximum', 'lila_help', true, 'view')
ON CONFLICT (role_group, level, feature_key) DO NOTHING;

-- ============================================================================
-- RPC: Apply a permission profile to a member
-- ============================================================================
CREATE OR REPLACE FUNCTION public.apply_permission_profile(
  p_family_id UUID,
  p_member_id UUID,
  p_role_group TEXT,
  p_level TEXT
) RETURNS void AS $$
BEGIN
  -- Delete existing toggles for this member
  DELETE FROM member_feature_toggles
  WHERE family_id = p_family_id AND member_id = p_member_id;

  -- Insert new toggles from the profile
  INSERT INTO member_feature_toggles (family_id, member_id, feature_key, is_disabled, enabled, blocked_by_tier, applied_profile_level, disabled_by)
  SELECT
    p_family_id,
    p_member_id,
    plp.feature_key,
    NOT plp.feature_enabled, -- is_disabled is inverse of enabled
    plp.feature_enabled,
    false, -- blocked_by_tier recalculated separately
    p_level,
    p_member_id -- disabled_by = the member (placeholder, should be mom's ID)
  FROM permission_level_profiles plp
  WHERE plp.role_group = p_role_group AND plp.level = p_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
