-- ============================================================================
-- BETA-COHORT — flag existing beta families founding (PRD-31 2026-09-12
-- addendum item 1: "Existing beta families (e.g. Bridgette's Family) are
-- flagged by the seat in one batch.")
-- ============================================================================
-- Founding-at-signup (migration 100338's handle_new_user() extension) only
-- fires for FUTURE signups. Families that joined beta before this build ship
-- need a one-time retroactive flag. This is a founder-authorized recognition
-- of EXISTING beta users, not a race for new signups against the soft cap —
-- it deliberately does NOT re-check get_founding_family_count() < 100 before
-- flagging (unlike handle_new_user's forward-looking check). Excludes
-- is_test_family (Testworth and any other long-lived fixture family) and any
-- family already flagged founding (idempotent — safe to re-run).
--
-- Seat-gated run:  supabase db query --linked -f scripts/beta-cohort-flag-existing.sql
-- Net effect: families.is_founding_family=true + family_subscriptions
-- (is_founding_family=true, price_adjustment_kind='founding') for every
-- non-test, not-already-founding family. founding_rate_monthly/yearly are
-- deliberately left untouched — they populate for real via a genuine Stripe
-- subscription event later, exactly like signup-time founding (migration
-- 100338's own design decision, not repeated differently here).
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_before_count INTEGER;
  v_flagged_count INTEGER;
  v_after_count INTEGER;
  v_family RECORD;
BEGIN
  SELECT public.get_founding_family_count() INTO v_before_count;
  RAISE NOTICE '[beta-cohort-flag-existing] organic founding count before: %', v_before_count;

  v_flagged_count := 0;

  FOR v_family IN
    SELECT f.id, f.family_name
    FROM public.families f
    WHERE f.is_test_family = false
      AND f.is_founding_family = false
  LOOP
    UPDATE public.families SET is_founding_family = true WHERE id = v_family.id;

    UPDATE public.family_subscriptions
    SET is_founding_family = true, price_adjustment_kind = 'founding'
    WHERE family_id = v_family.id;

    v_flagged_count := v_flagged_count + 1;
    RAISE NOTICE '[beta-cohort-flag-existing] flagged founding: % (%)', v_family.family_name, v_family.id;
  END LOOP;

  SELECT public.get_founding_family_count() INTO v_after_count;

  RAISE NOTICE '[beta-cohort-flag-existing] % family(ies) flagged founding. Organic founding count: % -> %',
    v_flagged_count, v_before_count, v_after_count;
END $$;

COMMIT;
