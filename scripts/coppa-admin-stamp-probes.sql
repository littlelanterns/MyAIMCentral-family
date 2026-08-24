-- ============================================================================
-- PRD-40 Slice 6 — stamp-guard SUCCESS-path probes (BEGIN … ROLLBACK)
-- ============================================================================
-- The E2E suite (coppa-admin-console.spec.ts) proves the stamp guard's
-- REFUSAL paths and the closed column-grant side door — it deliberately never
-- tests the success path, because stamping ANY non-retired template activates
-- COPPA enforcement platform-wide the instant it commits. This script proves
-- the success path (and that the switch actually switches) entirely inside
-- one transaction that ends in ROLLBACK — production never observes an
-- enforcement window (the scripts/coppa-enforcement-probes.sql methodology).
--
-- Seat-gated run:   supabase db query --linked -f scripts/coppa-admin-stamp-probes.sql
-- Expected output:  NOTICEs ending in "ALL STAMP-GUARD PROBES PASSED (rolled back)"
-- Net production change: ZERO either way.
--
-- Note on auth: the RPC gate reads auth.uid() from request.jwt.claims, so a
-- transaction-local set_config + a transaction-local staff_permissions row
-- impersonate a coppa_admin session. The live grant/role layer (anon revoke,
-- authenticated EXECUTE, real sessions) is proven by the E2E suite.
-- ============================================================================

BEGIN;

DO $probes$
DECLARE
  v_family_id UUID;
  v_mom_id UUID;
  v_mom_user UUID;
  v_fixture_kid UUID;
  v_late_kid UUID;
  v_verification UUID;
  v_result JSONB;
  v_count BIGINT;
BEGIN
  SELECT id INTO v_family_id FROM public.families WHERE family_name = 'The Testworth Family';
  IF v_family_id IS NULL THEN RAISE EXCEPTION 'Testworth family not found'; END IF;
  SELECT id, user_id INTO v_mom_id, v_mom_user FROM public.family_members
   WHERE family_id = v_family_id AND role = 'primary_parent' LIMIT 1;

  -- Probe 0: dormancy holds in production.
  IF EXISTS (SELECT 1 FROM public.coppa_consent_templates
             WHERE lawyer_approved_at IS NOT NULL AND retired_at IS NULL) THEN
    RAISE EXCEPTION 'PROBE 0: an approved template already exists in production — re-scope these probes';
  END IF;
  RAISE NOTICE 'PROBE 0 passed: dormancy holds';

  -- Transaction-local coppa_admin impersonation.
  INSERT INTO public.staff_permissions (user_id, permission_type, granted_by)
  VALUES (v_mom_user, 'coppa_admin', v_mom_user);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_mom_user, 'role', 'authenticated')::text, true);

  -- Transaction-local fixture: a template to stamp + one unconsented
  -- under-13 kid guaranteeing the guard has something to refuse over.
  INSERT INTO public.coppa_consent_templates
    (version, section_what_we_collect, section_how_lila_uses, section_who_sees_it,
     section_your_rights, section_parent_affirmation, notes)
  VALUES ('COPPAPROBE-S6', 'probe', 'probe', 'probe', 'probe', 'probe', 'stamp-guard probe — rolled back');

  INSERT INTO public.family_members (family_id, display_name, role, dashboard_mode, relationship, age,
    in_household, dashboard_enabled, is_active, coppa_age_bracket, member_color)
  VALUES (v_family_id, 'COPPAPROBE S6 kid', 'member', 'guided', 'child', 8, true, true, true, 'under_13', '#68a395')
  RETURNING id INTO v_fixture_kid;

  -- Probe 1: the sequencing law refuses (production's unconsented under-13
  -- members + the fixture kid all count).
  BEGIN
    PERFORM public.admin_stamp_consent_template('COPPAPROBE-S6', 'Probe Counsel');
    RAISE EXCEPTION 'PROBE 1 FAILED: stamp succeeded while unconsented under-13 members exist';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'sequencing_law_blocked%' THEN
      RAISE EXCEPTION 'PROBE 1 FAILED: expected sequencing_law_blocked, got: %', SQLERRM;
    END IF;
  END;
  RAISE NOTICE 'PROBE 1 passed: stamp refused under the sequencing law';

  -- Transaction-locally satisfy the law: every OTHER under-13 member steps
  -- out of the bracket; the fixture kid gets a real-shaped consent.
  UPDATE public.family_members SET coppa_age_bracket = '13_to_17'
   WHERE coppa_age_bracket = 'under_13' AND id <> v_fixture_kid;

  SELECT id INTO v_verification FROM public.parent_verifications
   WHERE parent_member_id = v_mom_id AND revoked_at IS NULL;
  IF v_verification IS NULL THEN
    INSERT INTO public.parent_verifications (family_id, parent_member_id, verification_method,
      stripe_payment_intent_id, amount_charged_cents, currency)
    VALUES (v_family_id, v_mom_id, 'stripe_charge', 'pi_COPPAPROBE_S6_' || gen_random_uuid(), 100, 'USD')
    RETURNING id INTO v_verification;
  END IF;
  INSERT INTO public.coppa_consents (family_id, child_member_id, parent_member_id, verification_id,
    consent_version, acknowledged_sections)
  VALUES (v_family_id, v_fixture_kid, v_mom_id, v_verification, '1.0.0',
    ARRAY['what_we_collect','how_lila_uses','who_sees_it','your_rights','parent_affirmation']);

  -- Probe 2: readiness flips, and the stamp now succeeds.
  SELECT public.admin_coppa_stamp_readiness() INTO v_result;
  IF (v_result->>'ready')::boolean IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'PROBE 2 FAILED: readiness not ready after consenting: %', v_result;
  END IF;
  SELECT public.admin_stamp_consent_template('COPPAPROBE-S6', 'Probe Counsel') INTO v_result;
  IF (v_result->>'success')::boolean IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'PROBE 2 FAILED: stamp did not succeed: %', v_result;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.coppa_consent_templates
                 WHERE version = 'COPPAPROBE-S6' AND lawyer_approved_at IS NOT NULL
                   AND lawyer_name = 'Probe Counsel') THEN
    RAISE EXCEPTION 'PROBE 2 FAILED: lawyer_approved_at/lawyer_name not written';
  END IF;
  RAISE NOTICE 'PROBE 2 passed: ceremony-complete state unblocks the stamp';

  -- Probe 3: THE SWITCH ACTUALLY SWITCHED — with an approved template live
  -- (transaction-locally), a NEW unconsented under-13 member is write-blocked.
  INSERT INTO public.family_members (family_id, display_name, role, dashboard_mode, relationship, age,
    in_household, dashboard_enabled, is_active, coppa_age_bracket, member_color)
  VALUES (v_family_id, 'COPPAPROBE S6 late kid', 'member', 'guided', 'child', 6, true, true, true, 'under_13', '#68a395')
  RETURNING id INTO v_late_kid;
  IF util.coppa_write_allowed(v_late_kid) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'PROBE 3 FAILED: enforcement did not activate for a new unconsented under-13 member';
  END IF;
  IF util.coppa_write_allowed(v_fixture_kid) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'PROBE 3 FAILED: the consented kid must remain allowed under enforcement';
  END IF;
  RAISE NOTICE 'PROBE 3 passed: stamping activates enforcement; consented kids unaffected';

  -- Probe 4: re-stamp refused.
  BEGIN
    PERFORM public.admin_stamp_consent_template('COPPAPROBE-S6', 'Probe Counsel');
    RAISE EXCEPTION 'PROBE 4 FAILED: re-stamp succeeded';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'template_already_approved%' THEN
      RAISE EXCEPTION 'PROBE 4 FAILED: expected template_already_approved, got: %', SQLERRM;
    END IF;
  END;
  RAISE NOTICE 'PROBE 4 passed: re-stamp refused';

  -- Sanity: production's real template untouched inside this transaction.
  SELECT COUNT(*) INTO v_count FROM public.coppa_consent_templates
   WHERE version = '1.0.0' AND lawyer_approved_at IS NOT NULL;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'SANITY FAILED: the real 1.0.0 template got stamped';
  END IF;

  RAISE NOTICE 'ALL STAMP-GUARD PROBES PASSED (rolled back)';
END;
$probes$;

ROLLBACK;
