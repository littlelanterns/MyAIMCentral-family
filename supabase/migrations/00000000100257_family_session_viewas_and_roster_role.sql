-- ============================================================================
-- Migration: Family session — View As policies + roster role field (Phase 3)
-- ============================================================================
-- Two enablers for hub-resting family devices:
--
-- 1. view_as_sessions / view_as_feature_exclusions are mom-only by RLS
--    (vas_primary_parent / vafe_manage_parent). The hub dip-in flow (kid taps
--    avatar + PIN → member_session View As) inserts a view_as_sessions row,
--    which fails under a family-identity session. New policies let the
--    role='family' identity manage member_session rows for its own family.
--    Mom-initiated mom_viewing sessions remain mom-only.
--
-- 2. verify_family_login's members payload gains `role` so the choice screen
--    can gate the primary parent's tile behind HER OWN auth (Founder
--    Decision 5: the family password never opens mom's command center).
--
-- Idempotent throughout.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1a. Family identity may manage member_session View As rows for its family
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "vas_family_device" ON public.view_as_sessions;
CREATE POLICY "vas_family_device" ON public.view_as_sessions
  FOR ALL USING (
    origin = 'member_session'
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'family'
    )
  )
  WITH CHECK (
    origin = 'member_session'
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'family'
    )
  );

-- ----------------------------------------------------------------------------
-- 1b. Same for per-session feature exclusions
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "vafe_family_device" ON public.view_as_feature_exclusions;
CREATE POLICY "vafe_family_device" ON public.view_as_feature_exclusions
  FOR ALL USING (
    session_id IN (
      SELECT vas.id FROM public.view_as_sessions vas
      WHERE vas.origin = 'member_session'
        AND vas.family_id IN (
          SELECT fm.family_id FROM public.family_members fm
          WHERE fm.user_id = auth.uid() AND fm.role = 'family'
        )
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT vas.id FROM public.view_as_sessions vas
      WHERE vas.origin = 'member_session'
        AND vas.family_id IN (
          SELECT fm.family_id FROM public.family_members fm
          WHERE fm.user_id = auth.uid() AND fm.role = 'family'
        )
    )
  );

-- ----------------------------------------------------------------------------
-- 2. verify_family_login members payload gains `role`
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_family_login(p_login_name TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_family RECORD;
  v_failed INTEGER;
  v_members JSONB;
BEGIN
  SELECT f.id, f.family_name, f.family_password_hash,
         f.family_password_failed_attempts, f.family_password_locked_until
  INTO v_family
  FROM public.families f
  WHERE f.family_login_name_lower = lower(coalesce(p_login_name, ''));

  IF v_family.id IS NULL OR v_family.family_password_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid');
  END IF;

  IF v_family.family_password_locked_until IS NOT NULL
     AND v_family.family_password_locked_until > now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'locked',
      'remaining_seconds',
      EXTRACT(EPOCH FROM (v_family.family_password_locked_until - now()))::integer
    );
  END IF;

  IF v_family.family_password_hash = crypt(coalesce(p_password, ''), v_family.family_password_hash) THEN
    UPDATE public.families
    SET family_password_failed_attempts = 0,
        family_password_locked_until = NULL
    WHERE id = v_family.id;

    SELECT coalesce(jsonb_agg(m), '[]'::jsonb) INTO v_members
    FROM (
      SELECT
        fm.id AS member_id,
        fm.display_name,
        fm.avatar_url,
        fm.auth_method,
        fm.member_color,
        fm.dashboard_mode,
        fm.role
      FROM public.family_members fm
      WHERE fm.family_id = v_family.id
        AND fm.is_active = true
        AND fm.dashboard_enabled = true
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
        END
    ) m;

    RETURN jsonb_build_object(
      'success', true,
      'family_id', v_family.id,
      'family_name', v_family.family_name,
      'members', v_members
    );
  END IF;

  v_failed := coalesce(v_family.family_password_failed_attempts, 0) + 1;

  IF v_failed >= 5 THEN
    UPDATE public.families
    SET family_password_failed_attempts = v_failed,
        family_password_locked_until = now() + interval '15 minutes'
    WHERE id = v_family.id;
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'locked',
      'remaining_seconds', 900
    );
  END IF;

  UPDATE public.families
  SET family_password_failed_attempts = v_failed
  WHERE id = v_family.id;

  RETURN jsonb_build_object('success', false, 'reason', 'invalid');
END;
$$;
