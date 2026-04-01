-- ============================================================================
-- FIX: hash_member_pin references families.family_id instead of families.id
-- ============================================================================
-- Bug: The function selects `family_id` from the `families` table, but the
-- column is just `id`. This caused "column family_id does not exist" errors,
-- preventing PINs from being set via the UI.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.hash_member_pin(p_member_id UUID, p_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  caller_family_id UUID;
  member_family_id UUID;
BEGIN
  -- Verify caller is primary parent of the member's family
  SELECT id INTO caller_family_id
  FROM public.families
  WHERE primary_parent_id = auth.uid();

  SELECT family_id INTO member_family_id
  FROM public.family_members
  WHERE id = p_member_id;

  IF caller_family_id IS NULL OR caller_family_id != member_family_id THEN
    RAISE EXCEPTION 'Only the primary parent can set PINs';
  END IF;

  -- Validate PIN format: exactly 4 digits
  IF p_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 4 digits';
  END IF;

  -- Hash with pgcrypto bf (bcrypt) and store
  UPDATE public.family_members
  SET pin_hash = crypt(p_pin, gen_salt('bf', 8)),
      auth_method = 'pin'
  WHERE id = p_member_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix verify_member_pin if it has the same issue
CREATE OR REPLACE FUNCTION public.verify_member_pin(p_member_id UUID, p_pin TEXT)
RETURNS JSONB AS $$
DECLARE
  member_record RECORD;
  result JSONB;
BEGIN
  SELECT id, pin_hash, pin_failed_attempts, pin_locked_until
  INTO member_record
  FROM public.family_members
  WHERE id = p_member_id;

  IF member_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'member_not_found');
  END IF;

  -- Check lockout
  IF member_record.pin_locked_until IS NOT NULL AND member_record.pin_locked_until > now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'locked',
      'locked_until', member_record.pin_locked_until,
      'remaining_seconds', EXTRACT(EPOCH FROM (member_record.pin_locked_until - now()))::integer
    );
  END IF;

  -- Check PIN
  IF member_record.pin_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_pin_set');
  END IF;

  IF member_record.pin_hash = crypt(p_pin, member_record.pin_hash) THEN
    -- Success: reset failed attempts
    UPDATE public.family_members
    SET pin_failed_attempts = 0, pin_locked_until = NULL
    WHERE id = p_member_id;

    RETURN jsonb_build_object('success', true);
  ELSE
    -- Failure: increment attempts
    UPDATE public.family_members
    SET pin_failed_attempts = COALESCE(pin_failed_attempts, 0) + 1,
        pin_locked_until = CASE
          WHEN COALESCE(pin_failed_attempts, 0) + 1 >= 5
          THEN now() + interval '15 minutes'
          ELSE NULL
        END
    WHERE id = p_member_id;

    RETURN jsonb_build_object(
      'success', false,
      'reason', 'wrong_pin',
      'attempts_remaining', 5 - (COALESCE(member_record.pin_failed_attempts, 0) + 1)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
