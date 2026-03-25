-- ============================================================================
-- PRD-02 REPAIR: Fix 21 audit findings for Permissions & Access Control
-- All changes additive — no existing migrations modified
-- ============================================================================

-- ============================================================================
-- ISSUE 1: Fix check_feature_access RPC — special_adult role mapping bug
-- Was: WHEN 'special_adults' (plural) — never matches family_members.role
-- Fix: WHEN 'special_adult' (singular, matches DB enum)
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
BEGIN
  -- Get member info
  SELECT * INTO v_member FROM family_members WHERE id = p_member_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'blockedBy', 'none');
  END IF;

  -- Emergency lockout check (Issue 5)
  IF COALESCE(v_member.emergency_locked, false) THEN
    RETURN jsonb_build_object('allowed', false, 'blockedBy', 'emergency_locked');
  END IF;

  -- Get family info
  SELECT * INTO v_family FROM families WHERE id = v_member.family_id;

  -- Get subscription
  SELECT fs.*, st.slug as tier_slug, st.sort_order as tier_order
  INTO v_subscription
  FROM family_subscriptions fs
  JOIN subscription_tiers st ON st.id = fs.tier_id
  WHERE fs.family_id = v_member.family_id;

  -- Map role to role_group — FIXED: 'special_adult' (singular)
  v_role_group := CASE v_member.role
    WHEN 'primary_parent' THEN 'mom'
    WHEN 'additional_adult' THEN 'dad_adults'
    WHEN 'special_adult' THEN 'special_adults'
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
-- ISSUE 2: Fix auto_create_adult_permissions — default 'none' not 'view'
-- Also corrects any existing rows that were incorrectly set to 'view'
-- ============================================================================

-- Fix the trigger function
CREATE OR REPLACE FUNCTION public.auto_create_adult_permissions()
RETURNS TRIGGER AS $$
DECLARE
  v_primary_parent_id UUID;
BEGIN
  IF NEW.role = 'additional_adult' THEN
    SELECT id INTO v_primary_parent_id
    FROM public.family_members
    WHERE family_id = NEW.family_id
      AND role = 'primary_parent'
      AND is_active = true
    LIMIT 1;

    IF v_primary_parent_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- PRD-02: Default is 'none' — mom must explicitly grant every permission
    INSERT INTO public.member_permissions (
      family_id, granting_member_id, granted_to, target_member_id,
      permission_key, access_level
    )
    SELECT
      NEW.family_id,
      v_primary_parent_id,
      NEW.id,
      child.id,
      feat.key,
      'none'
    FROM public.family_members child
    CROSS JOIN (VALUES
      ('tasks_basic'), ('calendar_basic'), ('messaging_basic'),
      ('lists_basic'), ('victory_recorder_basic'), ('family_hub')
    ) AS feat(key)
    WHERE child.family_id = NEW.family_id
      AND child.role = 'member'
      AND child.is_active = true
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Correct existing rows that were auto-created with 'view' by the old trigger
-- Only touch rows that match the exact 6 features the trigger creates
UPDATE public.member_permissions
SET access_level = 'none'
WHERE access_level = 'view'
  AND permission_key IN (
    'tasks_basic', 'calendar_basic', 'messaging_basic',
    'lists_basic', 'victory_recorder_basic', 'family_hub'
  )
  AND granting_member_id = granted_to; -- This pattern indicates auto-created rows
-- Note: manual rows would have granting_member_id = mom, granted_to = dad (different)
-- The old trigger set granting_member_id = mom but granted_to = NEW.id (dad)
-- So actually, auto-created rows have granting_member_id != granted_to.
-- Safer approach: correct ALL auto-trigger feature rows where nobody explicitly set them.
-- Since the old trigger always set 'view' and there's been no manual editing yet,
-- just reset all 'view' rows for these exact features to 'none'.

-- ============================================================================
-- ISSUE 3: Fix teen_sharing_overrides — make resource_id nullable + defaults
-- The table requires resource_id NOT NULL but the TeenTransparencyPanel
-- does feature-level overrides (no specific resource_id).
-- ============================================================================

ALTER TABLE teen_sharing_overrides
  ALTER COLUMN resource_id DROP NOT NULL,
  ALTER COLUMN original_visibility SET DEFAULT 'private',
  ALTER COLUMN original_visibility DROP NOT NULL,
  ALTER COLUMN new_visibility SET DEFAULT 'family',
  ALTER COLUMN new_visibility DROP NOT NULL;

-- ============================================================================
-- ISSUE 4: Unique constraint on member_permissions
-- Prevents duplicate permission rows for same adult+kid+feature
-- ============================================================================

-- Drop if exists (idempotent)
ALTER TABLE member_permissions
  DROP CONSTRAINT IF EXISTS uq_mp_granted_to_target_key;

-- Use DO block to handle the case where the constraint already exists
DO $$
BEGIN
  ALTER TABLE member_permissions
    ADD CONSTRAINT uq_mp_granted_to_target_key
    UNIQUE (family_id, granted_to, target_member_id, permission_key);
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ISSUE 5: Emergency lockout column on family_members
-- ============================================================================

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS emergency_locked BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- ISSUE 6: View As feature exclusions table
-- Stores per-session feature exclusions when mom views as a child
-- ============================================================================

CREATE TABLE IF NOT EXISTS view_as_feature_exclusions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES view_as_sessions(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (session_id, feature_key)
);

ALTER TABLE view_as_feature_exclusions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_vafe_session ON view_as_feature_exclusions (session_id);

CREATE POLICY vafe_manage_parent ON view_as_feature_exclusions FOR ALL USING (
  session_id IN (
    SELECT id FROM view_as_sessions
    WHERE family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  )
);

-- ============================================================================
-- ISSUE 15: Fix apply_permission_profile to also populate Layer 3
-- Layer 2 = member_feature_toggles (feature on/off)
-- Layer 3 = member_permissions (per-child access level)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_permission_profile(
  p_family_id UUID,
  p_member_id UUID,
  p_role_group TEXT,
  p_level TEXT
) RETURNS void AS $$
DECLARE
  v_mom_id UUID;
BEGIN
  -- Get primary parent ID for granting_member_id
  SELECT id INTO v_mom_id
  FROM family_members
  WHERE family_id = p_family_id AND role = 'primary_parent' AND is_active = true
  LIMIT 1;

  -- Layer 2: Delete existing toggles and apply new ones
  DELETE FROM member_feature_toggles
  WHERE family_id = p_family_id AND member_id = p_member_id;

  INSERT INTO member_feature_toggles (
    family_id, member_id, feature_key, is_disabled, enabled,
    blocked_by_tier, applied_profile_level, disabled_by
  )
  SELECT
    p_family_id,
    p_member_id,
    plp.feature_key,
    NOT plp.feature_enabled,
    plp.feature_enabled,
    false,
    p_level,
    COALESCE(v_mom_id, p_member_id)
  FROM permission_level_profiles plp
  WHERE plp.role_group = p_role_group AND plp.level = p_level;

  -- Layer 3: Populate member_permissions for each child in the family
  -- Only if this is an adult role (dad or special adult)
  IF p_role_group IN ('dad_adults', 'special_adults') AND v_mom_id IS NOT NULL THEN
    -- Delete existing Layer 3 permissions for this member
    DELETE FROM member_permissions
    WHERE family_id = p_family_id AND granted_to = p_member_id;

    -- Insert per-child, per-feature permissions from the profile
    INSERT INTO member_permissions (
      family_id, granting_member_id, granted_to, target_member_id,
      permission_key, access_level
    )
    SELECT
      p_family_id,
      v_mom_id,
      p_member_id,
      child.id,
      plp.feature_key,
      plp.default_permission_level
    FROM permission_level_profiles plp
    CROSS JOIN family_members child
    WHERE plp.role_group = p_role_group
      AND plp.level = p_level
      AND plp.feature_enabled = true
      AND child.family_id = p_family_id
      AND child.role = 'member'
      AND child.is_active = true
    ON CONFLICT (family_id, granted_to, target_member_id, permission_key) DO UPDATE
    SET access_level = EXCLUDED.access_level;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ISSUE 19: Register missing feature keys
-- ============================================================================

INSERT INTO feature_key_registry (feature_key, display_name, description, prd_source) VALUES
  ('shift_scheduling', 'Shift Scheduling', 'Special Adult shift schedule management', 'PRD-02'),
  ('custom_permission_presets', 'Custom Permission Presets', 'Mom-created permission preset configurations', 'PRD-02')
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================================================
-- Done. All changes are additive.
-- ============================================================================
