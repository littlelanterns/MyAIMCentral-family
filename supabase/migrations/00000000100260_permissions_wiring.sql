-- ============================================================================
-- PERMISSIONS-WIRING build (2026-06-09) — founder-approved Checkpoint 1 gate
--
-- 1. member_permissions.target_member_id becomes nullable.
--    NULL target = FAMILY-WIDE grant (founder Decision 1: nullable target shape).
--    Used for family-level management surfaces: 'studio', 'reward_rules'.
-- 2. Register 'studio' + 'reward_rules' feature keys + dad_adults tier access.
-- 3. Seed permission_level_profiles rows for financial_tracking (all levels
--    feature_enabled=false / default 'none') — finance is EXPLICIT-GRANT-ONLY,
--    never auto-granted by a profile apply.
-- 4. Seed hygiene (founder-approved): remove safe_harbor profile rows
--    (PRD-20 backburnered); apply_permission_profile stops creating per-kid
--    settings_basic grants and NEVER touches explicit-grant-only keys
--    (financial_tracking / studio / reward_rules) so a profile reset cannot
--    silently wipe mom's finance or management grants.
-- 5. RLS granted paths (PRD-28 model, founder rulings 2026-06-09):
--    - financial_transactions SELECT: + additional_adult with non-'none'
--      financial_tracking grant for the row's kid
--    - loans SELECT: same granted-read path (loan WRITE stays mom-only —
--      PRD-28: dad never creates loans)
--    - financial_transactions INSERT: + granted adult at contribute/manage
--      (record payments/adjustments — APPEND-ONLY preserved, no UPDATE/DELETE
--      policies are added, Convention #223)
--    - allowance_periods UPDATE: + granted adult at manage only (Allowance
--      tab period ops — founder Decision 2 level mapping)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Nullable target + family-wide uniqueness
-- ----------------------------------------------------------------------------
ALTER TABLE public.member_permissions
  ALTER COLUMN target_member_id DROP NOT NULL;

-- NULL targets bypass uq_mp_granted_to_target_key (NULLs never conflict) —
-- enforce one family-wide row per (family, grantee, key) with a partial index.
CREATE UNIQUE INDEX IF NOT EXISTS uq_mp_family_wide
  ON public.member_permissions (family_id, granted_to, permission_key)
  WHERE target_member_id IS NULL;

-- ----------------------------------------------------------------------------
-- 2. Feature keys + tier access for the grantable management surfaces
-- ----------------------------------------------------------------------------
INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('studio',       'Studio',       'Template workshop — family-wide management surface, grantable to additional adults', 'PRD-09A'),
  ('reward_rules', 'Reward Rules', 'Contracts / reward rules management — family-wide surface, grantable to additional adults', 'PRD-24')
ON CONFLICT (feature_key) DO NOTHING;

DO $$
DECLARE
  v_enhanced UUID;
BEGIN
  SELECT id INTO v_enhanced FROM public.subscription_tiers WHERE slug = 'enhanced' LIMIT 1;
  IF v_enhanced IS NOT NULL THEN
    INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
    VALUES
      ('studio',       'dad_adults', v_enhanced, true),
      ('reward_rules', 'dad_adults', v_enhanced, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. financial_tracking profile rows — explicit-grant-only (never auto-granted)
-- ----------------------------------------------------------------------------
INSERT INTO public.permission_level_profiles
  (role_group, level, feature_key, feature_enabled, default_permission_level)
SELECT 'dad_adults', lvl, 'financial_tracking', false, 'none'
FROM unnest(ARRAY['light', 'balanced', 'maximum']) AS lvl
ON CONFLICT (role_group, level, feature_key) DO UPDATE
  SET feature_enabled = false, default_permission_level = 'none';

-- ----------------------------------------------------------------------------
-- 4a. Seed hygiene: safe_harbor out of profiles (PRD-20 backburnered 2026-06-09)
-- ----------------------------------------------------------------------------
DELETE FROM public.permission_level_profiles WHERE feature_key = 'safe_harbor';

-- ----------------------------------------------------------------------------
-- 4b. apply_permission_profile — preserve explicit-grant-only keys, stop
--     creating meaningless per-kid settings_basic grants
-- ----------------------------------------------------------------------------
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
  -- reset must not wipe mom's finance/management grants (PERMISSIONS-WIRING
  -- build, founder gate 2026-06-09). settings_basic is personal-shaped and
  -- no longer gets per-kid rows.
  IF p_role_group IN ('dad_adults', 'special_adults') AND v_mom_id IS NOT NULL THEN
    DELETE FROM member_permissions
    WHERE family_id = p_family_id
      AND granted_to = p_member_id
      AND permission_key NOT IN ('financial_tracking', 'studio', 'reward_rules');

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
      AND plp.feature_key NOT IN ('settings_basic', 'financial_tracking', 'studio', 'reward_rules')
      AND child.family_id = p_family_id
      AND child.role = 'member'
      AND child.is_active = true
    ON CONFLICT (family_id, granted_to, target_member_id, permission_key) DO UPDATE
    SET access_level = EXCLUDED.access_level;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 5. RLS granted paths
-- ----------------------------------------------------------------------------

-- Reusable predicate pattern (inlined per policy — RLS cannot call volatile
-- helpers cheaply): "the row's family_member_id is a kid the calling
-- additional_adult holds a financial_tracking grant for, at or above <level>".

-- 5a. financial_transactions SELECT — mom all / own rows / granted adult read
DROP POLICY IF EXISTS "ft_scoped_read" ON public.financial_transactions;
CREATE POLICY "ft_scoped_read" ON public.financial_transactions
  FOR SELECT USING (
    -- Mom: all rows in her family
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
    )
    OR
    -- Everyone else: own rows
    family_member_id IN (
      SELECT fm.id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
    OR
    -- Granted additional_adult: rows for kids with a non-'none'
    -- financial_tracking grant (view / contribute / manage all read)
    family_member_id IN (
      SELECT mp.target_member_id
      FROM public.member_permissions mp
      JOIN public.family_members me ON me.id = mp.granted_to
      WHERE me.user_id = auth.uid()
        AND me.role = 'additional_adult'
        AND mp.permission_key = 'financial_tracking'
        AND mp.target_member_id IS NOT NULL
        AND COALESCE(mp.access_level, mp.permission_value->>'access_level', 'none') <> 'none'
    )
  );

-- 5b. loans SELECT — same granted-read path. Loan WRITE policies untouched
--     (mom-only; PRD-28: dad never creates loans).
DROP POLICY IF EXISTS "loans_scoped_read" ON public.loans;
CREATE POLICY "loans_scoped_read" ON public.loans
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
    )
    OR
    family_member_id IN (
      SELECT fm.id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
    OR
    family_member_id IN (
      SELECT mp.target_member_id
      FROM public.member_permissions mp
      JOIN public.family_members me ON me.id = mp.granted_to
      WHERE me.user_id = auth.uid()
        AND me.role = 'additional_adult'
        AND mp.permission_key = 'financial_tracking'
        AND mp.target_member_id IS NOT NULL
        AND COALESCE(mp.access_level, mp.permission_value->>'access_level', 'none') <> 'none'
    )
  );

-- 5c. financial_transactions INSERT — mom family-wide / granted adult at
--     contribute+ for the kid. APPEND-ONLY: no UPDATE/DELETE policies exist
--     and none are added (Convention #223).
DROP POLICY IF EXISTS "ft_parent_insert" ON public.financial_transactions;
CREATE POLICY "ft_parent_insert" ON public.financial_transactions
  FOR INSERT WITH CHECK (
    -- Mom: any row in her family
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
    )
    OR
    -- Granted additional_adult at contribute/manage: rows for granted kids
    -- in their own family (record payments / Mark Paid / adjustments)
    (
      family_id IN (
        SELECT fm.family_id FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
          AND fm.role = 'additional_adult'
      )
      AND family_member_id IN (
        SELECT mp.target_member_id
        FROM public.member_permissions mp
        JOIN public.family_members me ON me.id = mp.granted_to
        WHERE me.user_id = auth.uid()
          AND me.role = 'additional_adult'
          AND mp.permission_key = 'financial_tracking'
          AND mp.target_member_id IS NOT NULL
          AND COALESCE(mp.access_level, mp.permission_value->>'access_level', 'none')
              IN ('contribute', 'manage')
      )
    )
  );

-- 5d. allowance_periods UPDATE — granted adult at manage only (Allowance tab
--     period ops: grace days, close-out). SELECT already family-wide via
--     ap_family_read; INSERT/DELETE stay mom-only via ap_parent_write.
DROP POLICY IF EXISTS "ap_granted_manage_update" ON public.allowance_periods;
CREATE POLICY "ap_granted_manage_update" ON public.allowance_periods
  FOR UPDATE USING (
    family_member_id IN (
      SELECT mp.target_member_id
      FROM public.member_permissions mp
      JOIN public.family_members me ON me.id = mp.granted_to
      WHERE me.user_id = auth.uid()
        AND me.role = 'additional_adult'
        AND mp.permission_key = 'financial_tracking'
        AND mp.target_member_id IS NOT NULL
        AND COALESCE(mp.access_level, mp.permission_value->>'access_level', 'none') = 'manage'
    )
  )
  WITH CHECK (
    family_member_id IN (
      SELECT mp.target_member_id
      FROM public.member_permissions mp
      JOIN public.family_members me ON me.id = mp.granted_to
      WHERE me.user_id = auth.uid()
        AND me.role = 'additional_adult'
        AND mp.permission_key = 'financial_tracking'
        AND mp.target_member_id IS NOT NULL
        AND COALESCE(mp.access_level, mp.permission_value->>'access_level', 'none') = 'manage'
    )
  );
