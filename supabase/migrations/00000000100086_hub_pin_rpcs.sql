-- ============================================================================
-- PRD-14D: Hub PIN RPCs for Hub Mode kiosk lock
-- hash_hub_pin: Set/change the Hub PIN (primary parent only)
-- verify_hub_pin: Verify PIN to exit Hub Mode
-- ============================================================================

-- Hash and store Hub PIN
CREATE OR REPLACE FUNCTION public.hash_hub_pin(p_family_id UUID, p_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  caller_family_id UUID;
BEGIN
  -- Verify caller is primary parent of this family
  SELECT id INTO caller_family_id
  FROM public.families
  WHERE id = p_family_id AND primary_parent_id = auth.uid();

  IF caller_family_id IS NULL THEN
    RAISE EXCEPTION 'Only the primary parent can set the Hub PIN';
  END IF;

  -- Validate PIN format: exactly 4 digits
  IF p_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 4 digits';
  END IF;

  -- Hash with pgcrypto bcrypt and store
  UPDATE public.family_hub_configs
  SET hub_pin = crypt(p_pin, gen_salt('bf', 8))
  WHERE family_id = p_family_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify Hub PIN (for exiting Hub Mode)
CREATE OR REPLACE FUNCTION public.verify_hub_pin(p_family_id UUID, p_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT hub_pin INTO stored_hash
  FROM public.family_hub_configs
  WHERE family_id = p_family_id;

  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;

  RETURN stored_hash = crypt(p_pin, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
