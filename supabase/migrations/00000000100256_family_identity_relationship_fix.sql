-- ============================================================================
-- Migration: ensure_family_member_identity — relationship NULL fix
-- ============================================================================
-- Follow-up to 100254. The hidden role='family' identity row was inserted
-- with relationship='family', which violates family_members_relationship_check
-- (allowed: self, spouse, child, special). The Family identity is none of
-- those — use NULL, which passes the CHECK and correctly states "not a
-- person-to-person relationship".
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_family_member_identity(
  p_family_id UUID,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT id INTO v_member_id
  FROM public.family_members
  WHERE family_id = p_family_id AND role = 'family'
  LIMIT 1;

  IF v_member_id IS NOT NULL THEN
    UPDATE public.family_members
    SET user_id = p_user_id, is_active = true
    WHERE id = v_member_id AND (user_id IS DISTINCT FROM p_user_id OR is_active = false);
    RETURN v_member_id;
  END IF;

  INSERT INTO public.family_members (
    family_id, user_id, display_name, role, dashboard_mode,
    relationship, auth_method, dashboard_enabled, in_household, is_active
  )
  VALUES (
    p_family_id, p_user_id, 'Family', 'family', 'adult',
    NULL, NULL, false, false, true
  )
  RETURNING id INTO v_member_id;

  RETURN v_member_id;
END;
$$;
