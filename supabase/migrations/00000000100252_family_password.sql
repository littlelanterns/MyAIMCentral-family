-- ============================================================================
-- Migration: Family password (Family-Auth-Two-Door, Phase 2)
-- ============================================================================
-- The second door of the two-door umbrella model (founder-approved
-- 2026-06-09): family login name + family PASSWORD. A real password
-- (min 8 chars, letters + numbers), bcrypt-hashed, with the standard
-- 5-attempt / 15-minute lockout pattern (mirrors verify_member_pin).
--
-- verify_family_login() is the combined no-enumeration verification step:
-- wrong name and wrong password return the SAME generic response, and the
-- member roster is returned ONLY on a verified family password — restoring
-- pre-auth family login that Phase 1 (migration 100251) locked down.
--
-- set_family_password() is primary-parent-only, server-side hashing
-- (Convention #17 pattern — plain text never stored, never hashed client-side).
--
-- Seeds a generic password for the Testworth test family (founder decision;
-- mom changes it in Settings -> Family Password).
--
-- Idempotent: ADD COLUMN IF NOT EXISTS / CREATE OR REPLACE / guarded seed.
-- Build file: .claude/rules/current-builds/family-auth-two-door.md
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Columns on families
-- ----------------------------------------------------------------------------
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS family_password_hash TEXT;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS family_password_failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS family_password_locked_until TIMESTAMPTZ;

-- ----------------------------------------------------------------------------
-- 2. set_family_password — primary parent only, server-side bcrypt
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_family_password(p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_family_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
  END IF;

  -- Caller must be the primary parent of their family
  SELECT f.id INTO v_family_id
  FROM public.families f
  WHERE f.primary_parent_id = auth.uid()
  LIMIT 1;

  IF v_family_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
  END IF;

  -- Strength: min 8 chars, at least one letter and one number
  IF p_password IS NULL
     OR length(p_password) < 8
     OR p_password !~ '[a-zA-Z]'
     OR p_password !~ '[0-9]' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'weak_password');
  END IF;

  UPDATE public.families
  SET family_password_hash = crypt(p_password, gen_salt('bf')),
      family_password_failed_attempts = 0,
      family_password_locked_until = NULL,
      updated_at = now()
  WHERE id = v_family_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. verify_family_login — combined name + password, no enumeration,
--    roster returned ONLY on success. Anon-callable (this IS the family door).
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

  -- Unknown name OR password not yet set by mom: identical generic response.
  -- No counters touched (nothing to lock), no existence signal leaked.
  IF v_family.id IS NULL OR v_family.family_password_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid');
  END IF;

  -- Lockout window active
  IF v_family.family_password_locked_until IS NOT NULL
     AND v_family.family_password_locked_until > now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'locked',
      'remaining_seconds',
      EXTRACT(EPOCH FROM (v_family.family_password_locked_until - now()))::integer
    );
  END IF;

  -- Password check
  IF v_family.family_password_hash = crypt(coalesce(p_password, ''), v_family.family_password_hash) THEN
    UPDATE public.families
    SET family_password_failed_attempts = 0,
        family_password_locked_until = NULL
    WHERE id = v_family.id;

    -- Roster is released ONLY here — behind a verified family password
    SELECT coalesce(jsonb_agg(m), '[]'::jsonb) INTO v_members
    FROM (
      SELECT
        fm.id AS member_id,
        fm.display_name,
        fm.avatar_url,
        fm.auth_method,
        fm.member_color,
        fm.dashboard_mode
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

  -- Failed attempt: increment, lock at 5 (mirrors verify_member_pin)
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

  RETURN jsonb_build_object(
    'success', false,
    'reason', 'invalid',
    'attempts_remaining', 5 - v_failed
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Grants
-- ----------------------------------------------------------------------------
-- The family door must work on signed-out devices: anon may call verify.
GRANT EXECUTE ON FUNCTION public.verify_family_login(TEXT, TEXT) TO anon, authenticated;

-- Setting the password requires mom's authenticated session.
REVOKE EXECUTE ON FUNCTION public.set_family_password(TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.set_family_password(TEXT) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. Seed: generic password for the Testworth test family (founder decision).
--    Idempotent — only sets when no password exists yet.
-- ----------------------------------------------------------------------------
UPDATE public.families
SET family_password_hash = extensions.crypt('Lanterns2026', extensions.gen_salt('bf')),
    family_password_failed_attempts = 0,
    family_password_locked_until = NULL
WHERE id = '1f6200a7-df82-4ac4-bce3-3edcafe66bc5'
  AND family_password_hash IS NULL;
