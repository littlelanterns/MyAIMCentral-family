-- ============================================================================
-- TEEN-CRED — handle_new_user must skip the new login.myaimcentral.app
-- shadow domain (and any explicitly-flagged account), mirroring the
-- @pin/@family skips from migrations 100075/100254.
--
-- Found live during TEEN-CRED E2E proof, 2026-08-23/24: every
-- set_member_credentials call (both username AND email mode) invokes
-- admin.auth.admin.createUser(), which fires this AFTER INSERT ON
-- auth.users trigger unconditionally. Before this fix, EVERY teen/kid
-- given real login credentials silently spawned a PHANTOM family +
-- primary_parent family_members row + Essential subscription for their own
-- brand-new auth.users id — a real product defect, not a test artifact.
-- It was masked in testing because the resulting orphan rows (a families
-- row + a primary_parent family_members row referencing the auth.users id)
-- caused subsequent admin.auth.admin.deleteUser() calls to fail with
-- "Database error deleting user" — GoTrue's user deletion could not
-- cascade past the FK from families.primary_parent_id — which is exactly
-- how this was caught: cleanup of test fixtures started failing instead of
-- silently succeeding.
--
-- Fix: extend the skip condition two ways —
--   1. Domain match for the new synthetic username-mode address
--      ({username}@login.myaimcentral.app, migration 100314) — mirrors the
--      existing @pin/@family pattern exactly.
--   2. An explicit `skip_auto_family: true` user_metadata flag, set by
--      family-auth-admin's set_member_credentials action on EVERY account
--      it creates (both modes) — this is what actually covers email mode,
--      since a real email (mode='email') has no synthetic domain to match
--      against. The domain check remains for username mode as
--      defense-in-depth even though the flag alone would suffice.
--
-- CREATE OR REPLACE is based on the LIVE production body (verified via
-- `pg_get_functiondef` immediately before authoring this migration, not an
-- older migration file) — it already carries PRD-31 Slice 1's
-- onboarding_milestones seed (migration 100316). That insert is preserved
-- verbatim; only the skip condition changes.
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
  -- Skip auto-family creation for shadow / non-primary-parent auth accounts:
  -- {member_id}@pin.myaimcentral.app (member PIN sessions),
  -- {family_id}@family.myaimcentral.app (family identity sessions),
  -- {username}@login.myaimcentral.app (TEEN-CRED username-mode members),
  -- and any account explicitly flagged skip_auto_family=true at creation
  -- (TEEN-CRED email-mode members — a real email has no domain to match).
  IF NEW.email LIKE '%@pin.myaimcentral.app'
     OR NEW.email LIKE '%@family.myaimcentral.app'
     OR NEW.email LIKE '%@login.myaimcentral.app'
     OR NEW.raw_user_meta_data->>'skip_auto_family' = 'true' THEN
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

  -- PRD-31: seed the first onboarding milestone. The ROW exists from account
  -- one; credit awards (0 during beta) are computed by later PRD-31 slices.
  INSERT INTO public.onboarding_milestones (family_id, milestone_key, completed_at, credits_awarded)
  VALUES (new_family_id, 'account_created', now(), 0)
  ON CONFLICT (family_id, milestone_key) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
