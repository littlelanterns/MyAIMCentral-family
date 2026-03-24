-- ============================================================================
-- PRD-01: accept_family_invite RPC
--
-- Called by the /auth/accept-invite page after the user completes
-- signup or sign-in. Links the now-authenticated auth.user to the
-- pending family_members row identified by the invite token.
--
-- SECURITY DEFINER: runs as the function owner so it can UPDATE
-- family_members even though the invitee does not have RLS UPDATE
-- access (only the primary_parent does).
--
-- Guards:
--   - Token must match a row with invite_status = 'pending'
--   - invite_expires_at must be NULL or in the future
--   - user_id on the row must be NULL (not already linked)
--
-- Returns JSONB:
--   { "success": true,  "member_id": uuid, "family_id": uuid, "display_name": text }
--   { "success": false, "reason": "invalid_or_expired" | "already_accepted" }
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_family_invite(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
BEGIN
  -- Require the caller to be authenticated
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  -- Look up the pending invite by token
  SELECT *
  INTO   v_member
  FROM   public.family_members
  WHERE  invite_token  = p_token
    AND  invite_status = 'pending'
    AND  (invite_expires_at IS NULL OR invite_expires_at > now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_or_expired');
  END IF;

  -- Guard: do not overwrite an already-linked user_id
  IF v_member.user_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_accepted');
  END IF;

  -- Link the authenticated user to this family_member row
  UPDATE public.family_members
  SET
    user_id       = auth.uid(),
    invite_status = 'accepted',
    login_method  = 'email',
    invite_token  = NULL,         -- consume the token so it cannot be reused
    updated_at    = now()
  WHERE id = v_member.id;

  RETURN jsonb_build_object(
    'success',      true,
    'member_id',    v_member.id,
    'family_id',    v_member.family_id,
    'display_name', v_member.display_name
  );
END;
$$;

-- Lock down execution: only authenticated users may call this function.
-- The SECURITY DEFINER ensures it still runs with elevated privileges
-- when invoked by an authenticated caller.
REVOKE ALL ON FUNCTION public.accept_family_invite(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.accept_family_invite(TEXT) TO authenticated;
