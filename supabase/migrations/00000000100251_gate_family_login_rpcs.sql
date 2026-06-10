-- ============================================================================
-- Migration: Gate family-login lookup RPCs (Family-Auth-Two-Door, Phase 1)
-- ============================================================================
-- SECURITY FIX (leak closure — ships independently per founder decision #11):
--
-- lookup_family_by_login_name() and get_family_login_members() were
-- SECURITY DEFINER with ZERO auth checks. Any unauthenticated person could
-- type family names at /auth/family-login and harvest full member rosters
-- (names, avatar URLs, auth methods, member colors). Live in production
-- until this migration.
--
-- Phase 1 gate: both RPCs now return rows ONLY to an authenticated caller
-- who belongs to the family in question (member via family_members.user_id,
-- or the primary parent). Unauthenticated / cross-family callers get zero
-- rows — same shape, no error, no enumeration signal.
--
-- Phase 2 (family password) will layer verify_family_login() on top and
-- restore pre-auth family login behind the new family password. Until then,
-- the standalone /auth/family-login flow requires an existing session on
-- the device (already-signed-in members and the hub flow keep working).
--
-- Also adds check_family_login_name_available() — a boolean-only RPC for
-- the FamilyLoginNameSetup uniqueness check, which previously (mis)used the
-- leaky lookup RPC. Returns availability only; never IDs or names.
--
-- Idempotent: CREATE OR REPLACE throughout; safe to re-run.
-- Build file: .claude/rules/current-builds/family-auth-two-door.md
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. lookup_family_by_login_name — own-family only
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lookup_family_by_login_name(login_name TEXT)
RETURNS TABLE(family_id UUID, family_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Unauthenticated callers get nothing (no error — no enumeration signal)
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT f.id, f.family_name
  FROM public.families f
  WHERE f.family_login_name_lower = lower(login_name)
    AND (
      f.primary_parent_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.family_id = f.id
          AND fm.user_id = auth.uid()
          AND fm.is_active = true
      )
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. get_family_login_members — own-family only
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_family_login_members(p_family_id UUID)
RETURNS TABLE(
  member_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  auth_method TEXT,
  member_color TEXT,
  dashboard_mode TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Caller must be authenticated AND belong to this family
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.families f
    WHERE f.id = p_family_id AND f.primary_parent_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = p_family_id
      AND fm.user_id = auth.uid()
      AND fm.is_active = true
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    fm.id,
    fm.display_name,
    fm.avatar_url,
    fm.auth_method,
    fm.member_color,
    fm.dashboard_mode
  FROM public.family_members fm
  WHERE fm.family_id = p_family_id
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
    END;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. check_family_login_name_available — boolean-only uniqueness check
--    (replaces FamilyLoginNameSetup's misuse of the leaky lookup RPC)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_family_login_name_available(p_login_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_taken_by UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT f.id INTO v_taken_by
  FROM public.families f
  WHERE f.family_login_name_lower = lower(p_login_name)
  LIMIT 1;

  -- Available if unused, or used by the caller's own family
  RETURN v_taken_by IS NULL
    OR v_taken_by IN (
      SELECT f2.id FROM public.families f2 WHERE f2.primary_parent_id = auth.uid()
      UNION
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Explicit grants: authenticated only, never anon
-- ----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.lookup_family_by_login_name(TEXT) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_family_login_members(UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_family_login_name_available(TEXT) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.lookup_family_by_login_name(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_family_login_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_family_login_name_available(TEXT) TO authenticated;
