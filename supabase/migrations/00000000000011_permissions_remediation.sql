-- ============================================================================
-- Phase 02: Permissions Remediation
-- Fixes member_permissions schema, creates missing tables, seeds feature_access_v2
-- ============================================================================

-- ============================================================================
-- SECTION 1: Fix member_permissions — add granted_to column (PRD-02)
-- The existing table has granting_member_id + target_member_id but no grantee column.
-- PRD-02 requires: granted_by (mom), granted_to (dad), target_member_id (kid)
-- ============================================================================

ALTER TABLE member_permissions
  ADD COLUMN IF NOT EXISTS granted_to UUID REFERENCES family_members(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'none' NOT NULL
    CHECK (access_level IN ('none', 'view', 'contribute', 'manage'));

-- For any existing rows, set granted_to = target_member_id as a reasonable default
-- (these will need manual correction but prevents nulls)
UPDATE member_permissions SET granted_to = target_member_id WHERE granted_to IS NULL;

CREATE INDEX IF NOT EXISTS idx_mp_granted_to ON member_permissions (family_id, granted_to);
CREATE INDEX IF NOT EXISTS idx_mp_granted_to_target ON member_permissions (family_id, granted_to, target_member_id);

-- ============================================================================
-- SECTION 2: Create mom_self_restrictions (PRD-02)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mom_self_restrictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  primary_parent_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  target_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  restriction_type TEXT DEFAULT 'full' NOT NULL CHECK (restriction_type IN ('full', 'tag')),
  restricted_tags TEXT[] DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (family_id, primary_parent_id, target_member_id, feature_key)
);

ALTER TABLE mom_self_restrictions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_msr_family_target ON mom_self_restrictions (family_id, target_member_id);
CREATE INDEX idx_msr_feature ON mom_self_restrictions (family_id, target_member_id, feature_key);

CREATE TRIGGER trg_msr_updated_at BEFORE UPDATE ON mom_self_restrictions
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE POLICY msr_manage_parent ON mom_self_restrictions FOR ALL USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);

-- ============================================================================
-- SECTION 3: Create special_adult_permissions (PRD-02)
-- ============================================================================

CREATE TABLE IF NOT EXISTS special_adult_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES special_adult_assignments(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  access_level TEXT DEFAULT 'none' NOT NULL CHECK (access_level IN ('none', 'view', 'contribute')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (assignment_id, feature_key)
);

ALTER TABLE special_adult_permissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sap_assignment ON special_adult_permissions (assignment_id);

CREATE TRIGGER trg_sap_updated_at BEFORE UPDATE ON special_adult_permissions
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE POLICY sap_manage_parent ON special_adult_permissions FOR ALL USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);
CREATE POLICY sap_select_own ON special_adult_permissions FOR SELECT USING (
  assignment_id IN (
    SELECT id FROM special_adult_assignments
    WHERE special_adult_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
  )
);

-- ============================================================================
-- SECTION 4: Fix member_feature_toggles — add PRD-31 addendum columns
-- ============================================================================

ALTER TABLE member_feature_toggles
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS blocked_by_tier BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS applied_profile_level TEXT
    CHECK (applied_profile_level IN ('light', 'balanced', 'maximum')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

CREATE TRIGGER trg_mft_updated_at BEFORE UPDATE ON member_feature_toggles
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- ============================================================================
-- SECTION 5: Seed feature_access_v2 with real tier mappings
-- Maps feature_key + role_group to minimum tier
-- tier_id references: essential, enhanced, full_magic, creator
-- For beta: all enabled. This seeds the structure for post-beta tier gating.
-- ============================================================================

-- Add unique constraint for ON CONFLICT to work
CREATE UNIQUE INDEX IF NOT EXISTS idx_fav2_key_role_unique ON feature_access_v2 (feature_key, role_group);

-- Get tier IDs and seed
DO $$
DECLARE
  t_essential UUID;
  t_enhanced UUID;
  t_full_magic UUID;
  t_creator UUID;
BEGIN
  SELECT id INTO t_essential FROM subscription_tiers WHERE slug = 'essential';
  SELECT id INTO t_enhanced FROM subscription_tiers WHERE slug = 'enhanced';
  SELECT id INTO t_full_magic FROM subscription_tiers WHERE slug = 'full_magic';
  SELECT id INTO t_creator FROM subscription_tiers WHERE slug = 'creator';

  -- Core features at Essential for mom
  INSERT INTO feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled) VALUES
    -- Auth & Shell (Essential for all)
    ('family_dashboards', 'mom', t_essential, true),
    ('family_dashboards', 'dad_adults', t_essential, true),
    ('smart_notepad', 'mom', t_essential, true),
    ('smart_notepad', 'dad_adults', t_essential, true),
    ('smart_notepad', 'independent_teens', t_essential, true),
    ('quicktasks', 'mom', t_essential, true),
    ('quicktasks', 'dad_adults', t_essential, true),
    ('quicktasks', 'independent_teens', t_essential, true),
    ('lila_drawer', 'mom', t_essential, true),
    ('lila_help', 'mom', t_essential, true),
    ('lila_assist', 'mom', t_essential, true),
    ('lila_modal_access', 'dad_adults', t_enhanced, true),
    ('lila_modal_access', 'independent_teens', t_enhanced, true),
    ('lila_optimizer', 'mom', t_enhanced, true),

    -- Personal Growth (Essential-Enhanced)
    ('guiding_stars_basic', 'mom', t_essential, true),
    ('guiding_stars_basic', 'dad_adults', t_essential, true),
    ('guiding_stars_basic', 'independent_teens', t_essential, true),
    ('guiding_stars_ai_craft', 'mom', t_enhanced, true),
    ('best_intentions', 'mom', t_essential, true),
    ('best_intentions', 'dad_adults', t_essential, true),
    ('best_intentions', 'independent_teens', t_essential, true),
    ('innerworkings_basic', 'mom', t_essential, true),
    ('innerworkings_basic', 'dad_adults', t_essential, true),
    ('innerworkings_basic', 'independent_teens', t_essential, true),
    ('innerworkings_discovery', 'mom', t_enhanced, true),

    -- Journal & Notepad
    ('notepad_basic', 'mom', t_essential, true),
    ('notepad_basic', 'dad_adults', t_essential, true),
    ('notepad_basic', 'independent_teens', t_essential, true),
    ('notepad_voice', 'mom', t_essential, true),
    ('notepad_review_route', 'mom', t_enhanced, true),
    ('journal_basic', 'mom', t_essential, true),
    ('journal_basic', 'dad_adults', t_essential, true),
    ('journal_basic', 'independent_teens', t_essential, true),
    ('journal_ai_tags', 'mom', t_enhanced, true),

    -- Tasks
    ('tasks_basic', 'mom', t_essential, true),
    ('tasks_basic', 'dad_adults', t_essential, true),
    ('tasks_basic', 'independent_teens', t_essential, true),
    ('tasks_basic', 'guided_kids', t_essential, true),
    ('tasks_basic', 'play_kids', t_essential, true),
    ('tasks_views_full', 'mom', t_enhanced, true),
    ('tasks_family_assignment', 'mom', t_enhanced, true),
    ('tasks_routines', 'mom', t_enhanced, true),
    ('tasks_task_breaker_text', 'mom', t_enhanced, true),
    ('tasks_task_breaker_image', 'mom', t_full_magic, true),

    -- Lists & Studio
    ('lists_basic', 'mom', t_essential, true),
    ('lists_basic', 'dad_adults', t_essential, true),
    ('lists_basic', 'independent_teens', t_essential, true),
    ('studio_browse', 'mom', t_essential, true),

    -- Victories
    ('victory_recorder_basic', 'mom', t_essential, true),
    ('victory_recorder_basic', 'dad_adults', t_essential, true),
    ('victory_recorder_basic', 'independent_teens', t_essential, true),
    ('daily_celebration', 'guided_kids', t_essential, true),
    ('daily_celebration', 'play_kids', t_essential, true),

    -- Calendar
    ('calendar_basic', 'mom', t_essential, true),
    ('calendar_basic', 'dad_adults', t_essential, true),
    ('calendar_basic', 'independent_teens', t_essential, true),
    ('calendar_family', 'mom', t_enhanced, true),
    ('calendar_ai_intake', 'mom', t_full_magic, true),

    -- Permissions features
    ('granular_permissions', 'mom', t_enhanced, true),
    ('view_as_mode', 'mom', t_enhanced, true),
    ('special_adult_shifts', 'mom', t_enhanced, true),
    ('teen_transparency_panel', 'independent_teens', t_enhanced, true),

    -- Settings
    ('settings_basic', 'mom', t_essential, true),
    ('settings_basic', 'dad_adults', t_essential, true),
    ('settings_basic', 'independent_teens', t_essential, true),
    ('settings_family_management', 'mom', t_essential, true),

    -- Archives
    ('archives_browse', 'mom', t_essential, true),
    ('archives_faith_preferences', 'mom', t_essential, true),

    -- Communication tools
    ('tool_quality_time', 'mom', t_enhanced, true),
    ('tool_gifts', 'mom', t_enhanced, true),
    ('tool_cyrano', 'mom', t_enhanced, true),
    ('tool_higgins_say', 'mom', t_enhanced, true),
    ('tool_higgins_say', 'dad_adults', t_enhanced, true),
    ('tool_higgins_navigate', 'mom', t_enhanced, true),

    -- ThoughtSift
    ('thoughtsift_board_of_directors', 'mom', t_full_magic, true),
    ('thoughtsift_perspective_shifter', 'mom', t_enhanced, true),
    ('thoughtsift_decision_guide', 'mom', t_enhanced, true),
    ('thoughtsift_mediator', 'mom', t_enhanced, true),
    ('thoughtsift_translator', 'mom', t_enhanced, true),

    -- Safe Harbor
    ('safe_harbor', 'mom', t_enhanced, true),
    ('safe_harbor', 'dad_adults', t_enhanced, true),
    ('safe_harbor', 'independent_teens', t_enhanced, true),

    -- Vault
    ('vault_browse', 'mom', t_essential, true),
    ('vault_consume', 'mom', t_essential, true),

    -- Messaging
    ('messaging_basic', 'mom', t_essential, true),
    ('messaging_basic', 'dad_adults', t_essential, true),
    ('messaging_basic', 'independent_teens', t_essential, true),
    ('requests_basic', 'mom', t_essential, true),
    ('requests_basic', 'dad_adults', t_essential, true),
    ('requests_basic', 'independent_teens', t_essential, true),
    ('notifications_basic', 'mom', t_essential, true),
    ('notifications_basic', 'dad_adults', t_essential, true),
    ('notifications_basic', 'independent_teens', t_essential, true),

    -- Rhythms
    ('rhythms_basic', 'mom', t_essential, true),
    ('rhythms_basic', 'dad_adults', t_essential, true),
    ('rhythms_basic', 'independent_teens', t_essential, true),
    ('reflections_basic', 'mom', t_essential, true),

    -- Compliance
    ('compliance_esa_invoice', 'mom', t_essential, true)

  ON CONFLICT (feature_key, role_group) DO NOTHING;
END $$;

-- ============================================================================
-- SECTION 6: RPC for permission checking (server-side)
-- ============================================================================

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

  -- Map role to role_group
  v_role_group := CASE v_member.role
    WHEN 'primary_parent' THEN 'mom'
    WHEN 'additional_adult' THEN 'dad_adults'
    WHEN 'special_adults' THEN 'special_adults'
    ELSE CASE v_member.dashboard_mode
      WHEN 'independent' THEN 'independent_teens'
      WHEN 'guided' THEN 'guided_kids'
      WHEN 'play' THEN 'play_kids'
      ELSE 'dad_adults'
    END
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
-- Done. All changes are additive.
-- ============================================================================
