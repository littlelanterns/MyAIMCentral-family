-- ============================================================================
-- Fix accept_family_invite to handle members with existing PIN auth accounts
-- ============================================================================
-- When a member has a PIN auth account ({member_id}@pin.myaimcentral.app),
-- the invite flow should still work — it replaces the PIN auth user_id with
-- the new real auth user_id. The old check blocked all members with user_id set.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_family_invite(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_member RECORD;
BEGIN
  SELECT * INTO v_member FROM public.family_members
  WHERE invite_token = p_token
    AND invite_status = 'pending'
    AND (invite_expires_at IS NULL OR invite_expires_at > now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_or_expired');
  END IF;

  -- Allow overwriting PIN auth accounts (email ends with @pin.myaimcentral.app)
  -- but block if a real user is already linked
  IF v_member.user_id IS NOT NULL THEN
    -- Check if the existing auth account is a PIN account
    DECLARE
      v_existing_email TEXT;
    BEGIN
      SELECT email INTO v_existing_email
      FROM auth.users
      WHERE id = v_member.user_id;

      -- If existing account is NOT a PIN account, block (truly already accepted)
      IF v_existing_email IS NOT NULL AND v_existing_email NOT LIKE '%@pin.myaimcentral.app' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_accepted');
      END IF;
    END;
  END IF;

  UPDATE public.family_members
  SET user_id        = auth.uid(),
      invite_status  = 'accepted',
      auth_method    = 'full_login',
      invite_token   = NULL
  WHERE id = v_member.id;

  RETURN jsonb_build_object(
    'success',      true,
    'member_id',    v_member.id,
    'family_id',    v_member.family_id,
    'display_name', v_member.display_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restrict execution to authenticated users only
REVOKE ALL ON FUNCTION public.accept_family_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_family_invite(TEXT) TO authenticated;
