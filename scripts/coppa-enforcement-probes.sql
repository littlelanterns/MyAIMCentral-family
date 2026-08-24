-- ============================================================================
-- PRD-40 Slice 5 — enforcement-ACTIVE branch probes (BEGIN … ROLLBACK)
-- ============================================================================
-- Proves util.coppa_write_allowed()'s consent branch WITHOUT ever exposing
-- production to an enforcement window: the lawyer_approved_at stamp, the
-- fixture members, and the consent rows all exist ONLY inside this single
-- transaction, which ends in ROLLBACK — other sessions never observe any of
-- it (the rls-verifier single-transaction methodology).
--
-- Founder-gated run:  supabase db query --linked -f scripts/coppa-enforcement-probes.sql
-- Expected output:    a series of NOTICEs ending in
--                     "ALL ENFORCEMENT PROBES PASSED (rolled back)"
-- Any failed probe RAISEs, aborting (and rolling back) the transaction.
-- Net production change: ZERO either way.
-- ============================================================================

BEGIN;

DO $probes$
DECLARE
  v_family_id UUID;
  v_mom_id UUID;
  v_unconsented UUID;
  v_consented UUID;
  v_teen UUID;
  v_suspended UUID;
  v_verification UUID;
BEGIN
  -- Fixture ground: the Testworth E2E family (everything below rolls back).
  SELECT id INTO v_family_id FROM public.families WHERE family_name = 'The Testworth Family';
  IF v_family_id IS NULL THEN RAISE EXCEPTION 'Testworth family not found'; END IF;
  SELECT id INTO v_mom_id FROM public.family_members
   WHERE family_id = v_family_id AND role = 'primary_parent' LIMIT 1;

  -- Probe 0 (pre-activation sanity): dormancy currently holds and every
  -- non-suspended production member passes.
  IF EXISTS (SELECT 1 FROM public.coppa_consent_templates
             WHERE lawyer_approved_at IS NOT NULL AND retired_at IS NULL) THEN
    RAISE EXCEPTION 'PROBE 0: an approved template already exists in production — re-scope these probes';
  END IF;
  IF EXISTS (SELECT 1 FROM public.family_members fm
             WHERE fm.is_suspended_for_deletion = false
               AND util.coppa_write_allowed(fm.id) = false) THEN
    RAISE EXCEPTION 'PROBE 0: INERTNESS VIOLATION — a non-suspended member is blocked under dormancy';
  END IF;
  RAISE NOTICE 'PROBE 0 passed: dormancy holds, every non-suspended member allowed';

  -- In-transaction fixtures
  INSERT INTO public.family_members (family_id, display_name, role, dashboard_mode, relationship, age,
    in_household, dashboard_enabled, is_active, coppa_age_bracket, member_color)
  VALUES
    (v_family_id, 'COPPAPROBE unconsented', 'member', 'guided', 'child', 8,  true, true, true, 'under_13', '#68a395')
  RETURNING id INTO v_unconsented;
  INSERT INTO public.family_members (family_id, display_name, role, dashboard_mode, relationship, age,
    in_household, dashboard_enabled, is_active, coppa_age_bracket, member_color)
  VALUES
    (v_family_id, 'COPPAPROBE consented', 'member', 'guided', 'child', 9,  true, true, true, 'under_13', '#68a395')
  RETURNING id INTO v_consented;
  INSERT INTO public.family_members (family_id, display_name, role, dashboard_mode, relationship, age,
    in_household, dashboard_enabled, is_active, coppa_age_bracket, member_color)
  VALUES
    (v_family_id, 'COPPAPROBE teen', 'member', 'independent', 'child', 15, true, true, true, '13_to_17', '#68a395')
  RETURNING id INTO v_teen;
  INSERT INTO public.family_members (family_id, display_name, role, dashboard_mode, relationship, age,
    in_household, dashboard_enabled, is_active, coppa_age_bracket, is_suspended_for_deletion, member_color)
  VALUES
    (v_family_id, 'COPPAPROBE suspended', 'member', 'guided', 'child', 10, true, true, true, 'under_13', true, '#68a395')
  RETURNING id INTO v_suspended;

  INSERT INTO public.parent_verifications (family_id, parent_member_id, verification_method,
    stripe_payment_intent_id, amount_charged_cents, currency)
  VALUES (v_family_id, v_mom_id, 'stripe_charge', 'pi_COPPAPROBE_' || gen_random_uuid(), 100, 'USD')
  RETURNING id INTO v_verification;

  INSERT INTO public.coppa_consents (family_id, child_member_id, parent_member_id, verification_id,
    consent_version, acknowledged_sections)
  VALUES (v_family_id, v_consented, v_mom_id, v_verification, '1.0.0',
    ARRAY['what_we_collect','how_lila_uses','who_sees_it','your_rights','parent_affirmation']);

  -- Probe 1: dormancy — the unconsented under-13 fixture passes TODAY.
  IF util.coppa_write_allowed(v_unconsented) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'PROBE 1: unconsented under-13 must be allowed under dormancy';
  END IF;
  -- Suspension blocks even under dormancy.
  IF util.coppa_write_allowed(v_suspended) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'PROBE 1: suspended member must be blocked under dormancy';
  END IF;
  RAISE NOTICE 'PROBE 1 passed: dormancy allows unconsented, suspension blocks';

  -- ACTIVATE ENFORCEMENT (transaction-local only — rolled back)
  UPDATE public.coppa_consent_templates SET lawyer_approved_at = now() WHERE retired_at IS NULL;
  IF NOT EXISTS (SELECT 1 FROM public.coppa_consent_templates
                 WHERE lawyer_approved_at IS NOT NULL AND retired_at IS NULL) THEN
    RAISE EXCEPTION 'PROBE 2 setup: could not stamp a template inside the transaction';
  END IF;

  -- Probe 2: under enforcement, unconsented under-13 is BLOCKED …
  IF util.coppa_write_allowed(v_unconsented) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'PROBE 2: unconsented under-13 must be blocked once enforcement is active';
  END IF;
  -- … consented under-13 stays allowed …
  IF util.coppa_write_allowed(v_consented) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'PROBE 2: consented under-13 must remain allowed under enforcement';
  END IF;
  -- … 13-17 / adults are untouched …
  IF util.coppa_write_allowed(v_teen) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'PROBE 2: 13-17 member must remain allowed under enforcement';
  END IF;
  IF util.coppa_write_allowed(v_mom_id) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'PROBE 2: adult must remain allowed under enforcement';
  END IF;
  -- … suspension still blocks.
  IF util.coppa_write_allowed(v_suspended) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'PROBE 2: suspended member must stay blocked under enforcement';
  END IF;
  RAISE NOTICE 'PROBE 2 passed: enforcement blocks unconsented under-13 only';

  -- Probe 3: revoking the consented child's consent flips them to blocked;
  -- superseding (aging out) does the same at the consent layer (the bracket
  -- transition is what actually restores them — the daily job's contract).
  UPDATE public.coppa_consents SET revoked_at = now() WHERE child_member_id = v_consented;
  IF util.coppa_write_allowed(v_consented) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'PROBE 3: revoked consent must block under enforcement';
  END IF;
  RAISE NOTICE 'PROBE 3 passed: revocation removes the consent basis';

  -- Probe 4: the age-transition function walks a crossed member and restores
  -- writability via the bracket (transaction-local: give the unconsented kid
  -- a 13-years-ago DOB, run the reconciler, expect 13_to_17 + allowed).
  UPDATE public.family_members
     SET date_of_birth = (now()::date - INTERVAL '13 years 1 day')::date
   WHERE id = v_unconsented;
  PERFORM util.coppa_reconcile_age_brackets();
  IF (SELECT coppa_age_bracket FROM public.family_members WHERE id = v_unconsented) <> '13_to_17' THEN
    RAISE EXCEPTION 'PROBE 4: 13th-birthday crossing must transition the bracket to 13_to_17';
  END IF;
  IF util.coppa_write_allowed(v_unconsented) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'PROBE 4: an aged-out member must be allowed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.notifications
                 WHERE recipient_member_id = v_mom_id
                   AND notification_type = 'coppa_age_transition'
                   AND source_reference_id = v_unconsented) THEN
    RAISE EXCEPTION 'PROBE 4: the age transition must notify mom (category privacy, normal priority)';
  END IF;
  RAISE NOTICE 'PROBE 4 passed: age transition flips bracket, restores writes, notifies mom';

  RAISE NOTICE 'ALL ENFORCEMENT PROBES PASSED (rolled back)';
END $probes$;

ROLLBACK;
