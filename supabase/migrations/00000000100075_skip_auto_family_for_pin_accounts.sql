-- ============================================================================
-- Skip auto-family creation for PIN auth accounts
-- ============================================================================
-- When PIN auth accounts are created ({member_id}@pin.myaimcentral.app),
-- the handle_new_user trigger should NOT create a phantom family.
-- These accounts already belong to an existing family via family_members.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
  new_member_id UUID;
  tier_id UUID;
  user_name TEXT;
  user_tz TEXT;
BEGIN
  -- Skip auto-family creation for PIN auth accounts
  IF NEW.email LIKE '%@pin.myaimcentral.app' THEN
    RETURN NEW;
  END IF;

  user_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'Mom');
  user_tz := COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Chicago');

  -- Create family
  INSERT INTO public.families (primary_parent_id, family_name, timezone)
  VALUES (NEW.id, user_name || '''s Family', user_tz)
  RETURNING id INTO new_family_id;

  -- Create primary parent member with PRD-01 required defaults
  INSERT INTO public.family_members (
    family_id, user_id, display_name, role, dashboard_mode,
    relationship, auth_method, dashboard_enabled, in_household
  )
  VALUES (
    new_family_id, NEW.id, user_name, 'primary_parent',
    'adult',
    'self',
    'full_login',
    true, true
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
