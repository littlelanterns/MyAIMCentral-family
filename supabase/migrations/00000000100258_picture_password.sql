-- ============================================================================
-- Migration: Picture password — server-side verification (Phase 4)
-- ============================================================================
-- Founder Decision 13 (2026-06-09): the picture password is a SINGLE-PICTURE
-- pick — each kid has one secret picture (their PIN equivalent); login shows
-- their picture among decoys and the kid taps theirs. The previous
-- 4-picture-SEQUENCE implementation (verified CLIENT-SIDE, with the correct
-- answer downloaded to the browser, no lockout, no session) is replaced.
--
-- visual_password_config shape becomes: {"asset_id": "<platform_assets.id>"}
-- (0 production members used the old sequence shape — no data migration.)
--
-- verify_member_picture_password mirrors verify_member_pin exactly:
-- same lockout columns (pin_failed_attempts / pin_locked_until — a member
-- has either a PIN or a picture, never both), same 5-try/15-minute pattern,
-- same JSONB response shape. The correct asset id never reaches the client;
-- grid composition and session minting live in the family-auth-admin Edge
-- Function.
--
-- Idempotent: CREATE OR REPLACE.
-- Build file: .claude/rules/current-builds/family-auth-two-door.md
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_member_picture_password(
  p_member_id UUID,
  p_asset_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config JSONB;
  v_correct UUID;
  v_failed INTEGER;
  v_locked TIMESTAMPTZ;
BEGIN
  SELECT visual_password_config, pin_failed_attempts, pin_locked_until
  INTO v_config, v_failed, v_locked
  FROM public.family_members
  WHERE id = p_member_id AND is_active = true;

  IF v_config IS NULL OR v_config->>'asset_id' IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_locked IS NOT NULL AND v_locked > now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'locked',
      'locked_until', v_locked,
      'remaining_seconds', EXTRACT(EPOCH FROM (v_locked - now()))::integer
    );
  END IF;

  v_correct := (v_config->>'asset_id')::uuid;

  IF v_correct = p_asset_id THEN
    UPDATE public.family_members
    SET pin_failed_attempts = 0, pin_locked_until = NULL
    WHERE id = p_member_id;
    RETURN jsonb_build_object('success', true);
  END IF;

  v_failed := COALESCE(v_failed, 0) + 1;

  IF v_failed >= 5 THEN
    UPDATE public.family_members
    SET pin_failed_attempts = v_failed,
        pin_locked_until = now() + interval '15 minutes'
    WHERE id = p_member_id;
    RETURN jsonb_build_object(
      'success', false, 'reason', 'locked',
      'locked_until', (now() + interval '15 minutes'),
      'remaining_seconds', 900
    );
  END IF;

  UPDATE public.family_members
  SET pin_failed_attempts = v_failed
  WHERE id = p_member_id;

  RETURN jsonb_build_object(
    'success', false, 'reason', 'invalid',
    'attempts_remaining', 5 - v_failed
  );
END;
$$;

-- Callable pre-session (choice screen) — the lockout is the brute-force gate,
-- and member ids are unguessable UUIDs only revealed behind the family door.
GRANT EXECUTE ON FUNCTION public.verify_member_picture_password(UUID, UUID) TO anon, authenticated;
