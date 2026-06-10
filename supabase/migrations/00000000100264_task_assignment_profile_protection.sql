-- ============================================================================
-- 00000000100264_task_assignment_profile_protection.sql
-- ============================================================================
-- Build: RR-DEPLOY-SCOPING (companion to 100262/100263).
--
-- Makes the new `task_assignment` key a first-class explicit-grant-only key:
--
-- 1. feature_access_v2 row for dad_adults (essential tier) so the Permission
--    Hub per-kid grid renders the row as available (getFeatureState).
-- 2. permission_level_profiles rows: feature_enabled=false / 'none' for all
--    three levels — profiles NEVER auto-grant assignment.
-- 3. apply_permission_profile: add 'task_assignment' to BOTH exclusion lists
--    (Convention #274: explicit-grant-only keys are never wiped nor created
--    by a profile apply).
--
-- Idempotent.
-- ============================================================================

BEGIN;

-- 1. Tier access so the Hub per-kid row is interactive for dad_adults
DO $$
DECLARE
  v_essential UUID;
BEGIN
  SELECT id INTO v_essential FROM public.subscription_tiers WHERE slug = 'essential' LIMIT 1;
  IF v_essential IS NOT NULL THEN
    INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
    VALUES ('task_assignment', 'dad_adults', v_essential, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 2. Explicit-grant-only profile rows (never auto-granted)
INSERT INTO public.permission_level_profiles
  (role_group, level, feature_key, feature_enabled, default_permission_level)
SELECT 'dad_adults', lvl, 'task_assignment', false, 'none'
FROM unnest(ARRAY['light', 'balanced', 'maximum']) AS lvl
ON CONFLICT (role_group, level, feature_key) DO UPDATE
  SET feature_enabled = false, default_permission_level = 'none';

-- 3. apply_permission_profile — task_assignment joins the protected list
CREATE OR REPLACE FUNCTION public.apply_permission_profile(
  p_family_id UUID,
  p_member_id UUID,
  p_role_group TEXT,
  p_level TEXT
) RETURNS void AS $$
DECLARE
  v_mom_id UUID;
BEGIN
  SELECT id INTO v_mom_id
  FROM family_members
  WHERE family_id = p_family_id AND role = 'primary_parent' AND is_active = true
  LIMIT 1;

  -- Layer 2: reset toggles from profile
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

  -- Layer 3: reset per-kid grants from profile (adult roles only).
  -- EXPLICIT-GRANT-ONLY keys are never deleted nor created here — a profile
  -- reset must not wipe mom's finance/management/assignment grants
  -- (PERMISSIONS-WIRING 2026-06-09 + RR-DEPLOY-SCOPING 2026-06-10).
  -- settings_basic is personal-shaped and no longer gets per-kid rows.
  IF p_role_group IN ('dad_adults', 'special_adults') AND v_mom_id IS NOT NULL THEN
    DELETE FROM member_permissions
    WHERE family_id = p_family_id
      AND granted_to = p_member_id
      AND permission_key NOT IN ('financial_tracking', 'studio', 'reward_rules', 'task_assignment');

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
      AND plp.feature_key NOT IN ('settings_basic', 'financial_tracking', 'studio', 'reward_rules', 'task_assignment')
      AND child.family_id = p_family_id
      AND child.role = 'member'
      AND child.is_active = true
    ON CONFLICT (family_id, granted_to, target_member_id, permission_key) DO UPDATE
    SET access_level = EXCLUDED.access_level;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification
DO $$
DECLARE
  v_fa INTEGER;
  v_plp INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_fa FROM public.feature_access_v2 WHERE feature_key = 'task_assignment';
  SELECT COUNT(*) INTO v_plp FROM public.permission_level_profiles WHERE feature_key = 'task_assignment';
  RAISE NOTICE '[100264] feature_access_v2 task_assignment rows: % (expected 1)', v_fa;
  RAISE NOTICE '[100264] permission_level_profiles task_assignment rows: % (expected 3)', v_plp;
END
$$;

COMMIT;
