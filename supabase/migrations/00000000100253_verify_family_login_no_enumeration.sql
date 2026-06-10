-- ============================================================================
-- Migration: verify_family_login — byte-identical failure responses
-- ============================================================================
-- Follow-up to 100252 (Family-Auth-Two-Door Phase 2). The wrong-password
-- branch returned {success:false, reason:'invalid', attempts_remaining:N}
-- while the unknown-name branch returned {success:false, reason:'invalid'}.
-- The extra field let an attacker distinguish a real family name (with a
-- set password) from a fake one by comparing raw response shapes — a
-- one-bit enumeration leak that violates founder decision #2 (wrong name
-- and wrong password must be indistinguishable).
--
-- Fix: drop attempts_remaining from the response entirely. The failed-
-- attempt counter still increments server-side and the 5-try/15-minute
-- lockout still engages; the user-facing UX simply doesn't count down.
-- Residual (accepted): a 'locked' response after 5 failed attempts on a
-- real name does confirm existence — kept because locked-out families need
-- to know to wait, and 5 rate-limited attempts per probe makes bulk
-- enumeration impractical. Mirrors the verify_member_pin tradeoff.
--
-- Idempotent: CREATE OR REPLACE.
-- ============================================================================

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

  -- Failed attempt: increment server-side, lock at 5. The response carries
  -- NO counter — byte-identical to the unknown-name branch.
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
