-- ============================================================================
-- FIX: hash_member_pin references old column name login_method → auth_method
-- ============================================================================
-- Bug: Migration 00000000100027_prd01_repair.sql renamed login_method → auth_method
-- but forgot to update the hash_member_pin function. This caused PIN hashing to
-- fail silently during family setup, leaving members with NULL pin_hash.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.hash_member_pin(p_member_id UUID, p_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  caller_family_id UUID;
  member_family_id UUID;
BEGIN
  -- Verify caller is primary parent of the member's family
  SELECT family_id INTO caller_family_id
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
