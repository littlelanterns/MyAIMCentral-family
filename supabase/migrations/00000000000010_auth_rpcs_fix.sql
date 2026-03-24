-- ============================================================================
-- Fix auth RPCs for Phase 01 remediation
-- ============================================================================

-- Drop and recreate get_family_login_members with new return type
DROP FUNCTION IF EXISTS public.get_family_login_members(UUID);
CREATE FUNCTION public.get_family_login_members(p_family_id UUID)
RETURNS TABLE(
  member_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  login_method TEXT,
  member_color TEXT,
  dashboard_mode TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT fm.id, fm.display_name, fm.avatar_url, fm.login_method, fm.member_color, fm.dashboard_mode
  FROM public.family_members fm
  WHERE fm.family_id = p_family_id
    AND fm.is_active = true
    AND fm.dashboard_enabled = true
  ORDER BY
    CASE fm.role
      WHEN 'primary_parent' THEN 1
      WHEN 'additional_adult' THEN 2
      WHEN 'special_adult' THEN 3
      ELSE 4
    END,
    fm.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create verify_member_pin RPC
-- PRD-01: PIN verification must be server-side. Never send pin_hash to client.
CREATE OR REPLACE FUNCTION public.verify_member_pin(p_member_id UUID, p_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT pin_hash INTO stored_hash
  FROM public.family_members
  WHERE id = p_member_id AND is_active = true;

  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;

  -- Compare using crypt (pgcrypto). If pin_hash was stored with crypt(), this works.
  -- If pin_hash is plain bcrypt or other format, adjust accordingly.
  -- For MVP: simple comparison. Production should use pgcrypto.
  RETURN stored_hash = crypt(p_pin, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_new_user to set dashboard_mode and relationship
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
  new_member_id UUID;
  tier_id UUID;
  user_name TEXT;
  user_tz TEXT;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'Mom');
  user_tz := COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Chicago');

  -- Create family
  INSERT INTO public.families (primary_parent_id, family_name, timezone)
  VALUES (NEW.id, user_name || '''s Family', user_tz)
  RETURNING id INTO new_family_id;

  -- Create primary parent member with PRD-01 columns
  INSERT INTO public.family_members (
    family_id, user_id, display_name, role, dashboard_mode,
    relationship, login_method, dashboard_enabled, in_household
  )
  VALUES (
    new_family_id, NEW.id, user_name, 'primary_parent', NULL,
    'self', 'email', true, true
  )
  RETURNING id INTO new_member_id;

  -- Create subscription (Essential tier default)
  SELECT id INTO tier_id FROM public.subscription_tiers WHERE slug = 'essential' LIMIT 1;

  IF tier_id IS NOT NULL THEN
    INSERT INTO public.family_subscriptions (family_id, tier_id, status)
    VALUES (new_family_id, tier_id, 'active');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
