-- ============================================================================
-- 00000000100339 — BETA-COHORT HOTFIX: handle_new_user() NULL is_test_family
-- ============================================================================
-- Migration 100338 derived v_is_test_family as
--   (NEW.raw_user_meta_data->>'is_test_family' = 'true')
-- which is SQL NULL (not false) whenever the key is absent — the shape of EVERY
-- real signup (src/lib/supabase/auth.ts sends no such key). families.is_test_family
-- is NOT NULL, so the INSERT failed (23502) and the whole signup rolled back. Found
-- live by the rls-verifier pass 2026-09-12 and reproduced by the seat with a
-- rolled-back real-shape signup. Fix: COALESCE to 'false'. Function body otherwise
-- IDENTICAL to 100338. Idempotent (CREATE OR REPLACE).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_family_id UUID;
  new_member_id UUID;
  tier_id UUID;
  user_name TEXT;
  user_tz TEXT;
  v_is_test_family BOOLEAN;
  v_beta_mode BOOLEAN;
  v_founding_count INTEGER;
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
  -- BETA-COHORT: is_test_family is set the same way skip_auto_family is —
  -- a raw_user_meta_data flag at createUser() time — so test/E2E fixture
  -- signups never consume a real founding slot. See the seat condition-3
  -- fixture updates + tests/beta-cohort-auth-user-metadata.test.ts.
  v_is_test_family := (COALESCE(NEW.raw_user_meta_data->>'is_test_family', 'false') = 'true');

  -- Create family
  INSERT INTO public.families (primary_parent_id, family_name, timezone, is_test_family)
  VALUES (NEW.id, user_name || '''s Family', user_tz, v_is_test_family)
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

  -- BETA-COHORT (PRD-31 2026-09-12 addendum item 6): every new, non-test
  -- signup is flagged founding at signup while beta cohort mode is on,
  -- subject to the SAME soft cap PRD-31 Slice 2's Stripe Checkout path
  -- already uses (organic count < 100 at the instant of signup; ties both
  -- win by construction — no locking, no re-check after the fact).
  -- founding_rate_monthly/yearly are deliberately left NULL here — they are
  -- populated for real by a genuine Stripe subscription event later,
  -- exactly like organic/code-granted signups in PRD-31 Slice 2.
  IF NOT v_is_test_family THEN
    SELECT enabled INTO v_beta_mode FROM public.beta_cohort_settings LIMIT 1;
    IF COALESCE(v_beta_mode, false) THEN
      SELECT public.get_founding_family_count() INTO v_founding_count;
      IF COALESCE(v_founding_count, 0) < 100 THEN
        UPDATE public.families SET is_founding_family = true WHERE id = new_family_id;
        UPDATE public.family_subscriptions
          SET is_founding_family = true, price_adjustment_kind = 'founding'
          WHERE family_id = new_family_id;
      END IF;
    END IF;
  END IF;

  -- PRD-31: seed the first onboarding milestone. The ROW exists from account
  -- one; credit awards (0 during beta) are computed by later PRD-31 slices.
  INSERT INTO public.onboarding_milestones (family_id, milestone_key, completed_at, credits_awarded)
  VALUES (new_family_id, 'account_created', now(), 0)
  ON CONFLICT (family_id, milestone_key) DO NOTHING;

  RETURN NEW;
END;
$function$;

DO $verify$
DECLARE v_def TEXT;
BEGIN
  SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure) INTO v_def;
  IF v_def NOT LIKE '%COALESCE(NEW.raw_user_meta_data->>''is_test_family'', ''false'')%' THEN
    RAISE EXCEPTION 'handle_new_user() does not carry the COALESCE fix';
  END IF;
  RAISE NOTICE 'migration 100339 verification passed';
END $verify$;
