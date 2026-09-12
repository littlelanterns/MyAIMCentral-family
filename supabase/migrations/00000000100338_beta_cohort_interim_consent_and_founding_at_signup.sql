-- ============================================================================
-- Migration: BETA-COHORT — PRD-40 §9 interim consent + PRD-31 founding-at-
--            signup (founder rulings 2026-09-12, both LAW for this build)
-- ============================================================================
-- Two causally-linked beta-cohort behaviors, gated by ONE server-side switch
-- (public.beta_cohort_settings.enabled):
--
--   1. Under-13 consent gets an INTERIM verification path. A founding family
--      adding an under-13 child while beta cohort mode is ON sees the real
--      consent flow (Screens 1-4 disclosures, Screen 7 acknowledgment,
--      commit_consented_members) with Screen 5's $1 Stripe charge replaced
--      by an explicit "verify later" acknowledgment. That records a NEW,
--      forever-distinguishable parent_verifications row
--      (verification_method='beta_interim', amount_charged_cents=0) — never
--      a disclaimer, never a bare checkbox outside the flow, never a
--      weakening of the immutability rules (decision file PRD-40 §9.2).
--
--   2. Founding-at-signup is re-enabled (PRD-31 2026-09-12 addendum item 6):
--      because the interim path removes the TEST-mode payment dead-end,
--      every new, non-test signup is flagged founding at signup while beta
--      cohort mode is on, subject to the SAME soft cap PRD-31 Slice 2's
--      Stripe Checkout path already uses (organic count < 100 at the
--      instant of signup; ties both win — no locking).
--
-- THE SCHEMA WRINKLE (found by tracing the real code paths, not assumed):
-- PRD-40 §9.3 requires the interim row to be IMMUTABLE and a NEW row to be
-- recorded at "finish verifying" — meaning a parent can hold two
-- simultaneously-ACTIVE (revoked_at IS NULL) parent_verifications rows (one
-- interim, one real) once she completes the real $1 charge post-cutover.
-- The original uq_pv_active_per_parent (migration 100305) allows only ONE
-- active row per parent, and useParentVerification()/fetchParentVerification()
-- call .maybeSingle() (throws on >1 row). This migration splits that index
-- into two partials — one constraining REAL verifications, one constraining
-- INTERIM verifications — so both concerns stay independently unique without
-- ever colliding with each other. The webhook handler's existing 23505
-- double-real-charge fallback (stripe-webhook-handler/index.ts) is UNCHANGED
-- and still correct: it only ever fires for a genuine two-real-charges race,
-- which the new uq_pv_active_real_per_parent still catches exactly as before.
--
-- Convention #280 (auth gate before any read/write) + Convention #257
-- (server-derived request metadata, never client-supplied) apply throughout.
-- Seat conditions applied verbatim (checkpoint approval, 2026-09-12):
--   1. create_beta_interim_verification() is idempotent + minimal: refuses
--      (already_verified) if a REAL active verification exists; returns the
--      EXISTING row's id if an interim one already exists (never a second
--      interim row); gate order is real session -> founding -> switch ON ->
--      only then the insert.
--   2. (Frontend/proof condition — see useStripeVerificationPayment.ts and
--      the extended coppa-consent-screens.spec.ts test 8.)
--   3. (Test-fixture condition — see the 4 updated fixture files + the new
--      vitest static pin, tests/beta-cohort-auth-user-metadata.test.ts.)
--
-- Build file: .claude/rules/current-builds/BETA-COHORT.md
-- Authority: claude/feature-decisions/PRD-40-COPPA-Compliance.md §9,
--            claude/feature-decisions/PRD-31-Subscription-Tiers.md
--            (2026-09-12 addendum).
--
-- Idempotent: safe to re-run.
-- ============================================================================

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- 1. beta_cohort_settings — the ONE platform-wide switch. Single row,
--    plain and explicit (no PK-trickery singleton idiom — matches this
--    schema's style). Zero client policies: RLS enabled, no grants at all
--    (the founding_codes / stripe_webhook_events "closed table, RPC-only"
--    idiom). Reads go through get_beta_cohort_mode() below. Writes are
--    NEVER client-reachable — the seat flips it at live cutover via a
--    plain `UPDATE public.beta_cohort_settings SET enabled = false;`
--    (service-role / SQL editor), no redeploy needed.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.beta_cohort_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled     BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.beta_cohort_settings IS
  'BETA-COHORT (2026-09-12). Single-row platform switch: while enabled=true, (a) under-13 consent may use the beta_interim verification path (PRD-40 §9) and (b) new non-test signups are flagged founding-at-signup subject to the soft cap (PRD-31 2026-09-12 addendum). The seat flips this OFF at live cutover with a plain UPDATE — no migration, no redeploy. Zero client policies; read via get_beta_cohort_mode(), never a direct SELECT.';

INSERT INTO public.beta_cohort_settings (enabled)
SELECT true
WHERE NOT EXISTS (SELECT 1 FROM public.beta_cohort_settings);

ALTER TABLE public.beta_cohort_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.beta_cohort_settings FROM authenticated, anon;
-- No policies of any kind — matches founding_codes (migration 100334) and
-- stripe_webhook_events (migration 100305).

DO $$ BEGIN
  CREATE TRIGGER trg_bcs_updated_at
    BEFORE UPDATE ON public.beta_cohort_settings
    FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. get_beta_cohort_mode() — the narrow read RPC every client surface uses
--    to decide whether to offer the interim path / show the finish-
--    verifying prompt. Non-sensitive (just "are we still in beta"), but
--    kept authenticated-only rather than anon — this build has no public-
--    facing use case for it (unlike get_founding_family_count(), which the
--    launch page needs).
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_beta_cohort_mode()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT enabled FROM public.beta_cohort_settings LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_beta_cohort_mode() IS
  'BETA-COHORT. Narrow read of beta_cohort_settings.enabled — the single source of truth for whether the platform is still in beta-cohort mode (interim consent path available, founding-at-signup active). authenticated-only.';

REVOKE ALL ON FUNCTION public.get_beta_cohort_mode() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_beta_cohort_mode() TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- 3. parent_verifications.verification_method — add 'beta_interim'.
--    Idempotent discovered-constraint-name pattern (migration 100305/100290
--    precedent — never guess the constraint name).
-- ──────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_conname TEXT;
BEGIN
  SELECT c.conname INTO v_conname
  FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'parent_verifications' AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%verification_method%'
    AND pg_get_constraintdef(c.oid) NOT ILIKE '%beta_interim%'
  LIMIT 1;

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.parent_verifications DROP CONSTRAINT %I', v_conname);
    ALTER TABLE public.parent_verifications ADD CONSTRAINT parent_verifications_verification_method_check
      CHECK (verification_method IN (
        'stripe_charge', 'id_check', 'knowledge_based', 'subscription_payment', 'beta_interim'
      ));
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 4. Split uq_pv_active_per_parent into two partials — the schema wrinkle
--    documented at the top of this file. A parent may hold at most one
--    ACTIVE REAL verification AND at most one ACTIVE INTERIM verification
--    simultaneously, but never two of either kind.
-- ──────────────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS public.uq_pv_active_per_parent;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pv_active_real_per_parent
  ON public.parent_verifications (parent_member_id)
  WHERE revoked_at IS NULL AND verification_method <> 'beta_interim';

CREATE UNIQUE INDEX IF NOT EXISTS uq_pv_active_interim_per_parent
  ON public.parent_verifications (parent_member_id)
  WHERE revoked_at IS NULL AND verification_method = 'beta_interim';

COMMENT ON INDEX public.uq_pv_active_real_per_parent IS
  'BETA-COHORT. Supersedes uq_pv_active_per_parent (100305). Preserves the original double-real-charge race protection (stripe-webhook-handler''s 23505 fallback) while allowing a real verification to coexist with an already-recorded beta_interim row for the same parent.';
COMMENT ON INDEX public.uq_pv_active_interim_per_parent IS
  'BETA-COHORT. At most one active interim verification per parent — the DB-level backstop behind create_beta_interim_verification()''s app-level idempotent short-circuit.';

-- ──────────────────────────────────────────────────────────────────────────
-- 5. create_beta_interim_verification() — THE gated write path (seat
--    condition 1, verbatim). Convention #280: gate resolved fully — real
--    session, then founding, then switch — BEFORE any read of existing
--    verification state or any write.
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_beta_interim_verification()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_uid                  UUID;
  v_parent_member_id     UUID;
  v_family_id            UUID;
  v_is_founding          BOOLEAN;
  v_beta_mode            BOOLEAN;
  v_existing_real        UUID;
  v_existing_interim     UUID;
  v_existing_verified_at TIMESTAMPTZ;
  v_new_id               UUID;
  v_new_verified_at      TIMESTAMPTZ;
  v_headers              JSONB;
  v_ip                   TEXT;
  v_user_agent           TEXT;
BEGIN
  -- ── Gate order (seat condition 1): real session -> founding -> switch ──
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fm.id, fm.family_id INTO v_parent_member_id, v_family_id
  FROM public.family_members fm
  WHERE fm.user_id = v_uid
    AND fm.role = 'primary_parent'
    AND fm.is_active = true
  LIMIT 1;

  IF v_parent_member_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT f.is_founding_family INTO v_is_founding
  FROM public.families f WHERE f.id = v_family_id;

  IF COALESCE(v_is_founding, false) = false THEN
    RAISE EXCEPTION 'not_founding_family';
  END IF;

  SELECT enabled INTO v_beta_mode FROM public.beta_cohort_settings LIMIT 1;
  IF COALESCE(v_beta_mode, false) = false THEN
    RAISE EXCEPTION 'beta_cohort_mode_disabled';
  END IF;

  -- ── Only now: read existing verification state ──
  -- Already has an active REAL verification? Refuse. The outer client-side
  -- gate (useMemberSaveAndConsentGate / FamilySetup) already routes a mom
  -- holding ANY active verification to Screen 7, never to this RPC — hitting
  -- this is an anomalous/defensive case, not normal operation.
  SELECT id INTO v_existing_real
  FROM public.parent_verifications
  WHERE parent_member_id = v_parent_member_id
    AND revoked_at IS NULL
    AND verification_method <> 'beta_interim'
  LIMIT 1;

  IF v_existing_real IS NOT NULL THEN
    RAISE EXCEPTION 'already_verified';
  END IF;

  -- Already has an active interim row? Idempotent — return it, never a
  -- second one (seat condition 1, backed by uq_pv_active_interim_per_parent).
  SELECT id, verified_at INTO v_existing_interim, v_existing_verified_at
  FROM public.parent_verifications
  WHERE parent_member_id = v_parent_member_id
    AND revoked_at IS NULL
    AND verification_method = 'beta_interim'
  LIMIT 1;

  IF v_existing_interim IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'verification_id', v_existing_interim,
      'verified_at', v_existing_verified_at,
      'existing', true
    );
  END IF;

  -- ── Server-derived request metadata (Convention #257 discipline) ──
  BEGIN
    v_headers    := current_setting('request.headers', true)::jsonb;
    v_ip         := COALESCE(v_headers->>'x-forwarded-for', v_headers->>'x-real-ip');
    v_user_agent := v_headers->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL; v_user_agent := NULL;
  END;

  INSERT INTO public.parent_verifications (
    family_id, parent_member_id, verification_method, amount_charged_cents,
    ip_address, user_agent
  ) VALUES (
    v_family_id, v_parent_member_id, 'beta_interim', 0, v_ip, v_user_agent
  ) RETURNING id, verified_at INTO v_new_id, v_new_verified_at;

  RETURN jsonb_build_object(
    'success', true,
    'verification_id', v_new_id,
    'verified_at', v_new_verified_at,
    'existing', false
  );
END;
$fn$;

COMMENT ON FUNCTION public.create_beta_interim_verification() IS
  'PRD-40 §9 (BETA-COHORT). Records a no-charge interim parent_verifications row for a founding family while beta_cohort_settings.enabled=true. Idempotent (returns the existing interim row rather than duplicating) and refuses if a real verification already exists. Gate order per seat condition 1: real primary_parent session -> is_founding_family -> beta cohort mode ON -> only then reads/writes verification state.';

REVOKE ALL ON FUNCTION public.create_beta_interim_verification() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_beta_interim_verification() TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- 6. handle_new_user() — founding-at-signup (PRD-31 2026-09-12 addendum
--    item 6). CREATE OR REPLACE based on the LIVE production body (read via
--    pg_get_functiondef immediately before authoring this migration, NOT a
--    stale migration copy — the TEEN-CRED lesson). The skip_auto_family /
--    domain-skip block and the PRD-31 onboarding_milestones seed are
--    preserved VERBATIM; only the founding-at-signup block is new, inserted
--    after the subscription insert and before the milestone seed.
-- ──────────────────────────────────────────────────────────────────────────

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
  v_is_test_family := (NEW.raw_user_meta_data->>'is_test_family' = 'true');

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

-- ──────────────────────────────────────────────────────────────────────────
-- 7. admin_coppa_stamp_readiness() — add interim_verifications_owed
--    (informational ONLY — PRD-40 §9.4: interim-consented children already
--    have real coppa_consents rows and never block the stamp; this field
--    exists purely so /admin/coppa can show "N families still owe real
--    verification"). CREATE OR REPLACE of the migration-100330 function;
--    every other field/behavior preserved verbatim.
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_coppa_stamp_readiness()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_blockers JSONB;
  v_count BIGINT;
  v_interim_owed BIGINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.staff_permissions
    WHERE user_id = auth.uid() AND permission_type = 'coppa_admin'
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT COUNT(*), COALESCE(jsonb_agg(jsonb_build_object(
           'family_name', f.family_name, 'member_name', fm.display_name
         ) ORDER BY f.family_name, fm.display_name), '[]'::jsonb)
    INTO v_count, v_blockers
    FROM public.family_members fm
    JOIN public.families f ON f.id = fm.family_id
   WHERE fm.coppa_age_bracket = 'under_13'
     AND fm.role <> 'family'
     AND fm.is_suspended_for_deletion = false
     AND NOT EXISTS (
       SELECT 1 FROM public.coppa_consents c
       WHERE c.child_member_id = fm.id AND c.revoked_at IS NULL AND c.superseded_at IS NULL
     );

  -- BETA-COHORT (PRD-40 §9.4): count of families whose ONLY active
  -- verification is beta_interim — they still owe a real $1 identity check
  -- once the switch flips off. Their consent rows are real either way
  -- (counted, or not, entirely independently above) — this NEVER blocks.
  SELECT COUNT(DISTINCT pv.family_id) INTO v_interim_owed
    FROM public.parent_verifications pv
   WHERE pv.revoked_at IS NULL
     AND pv.verification_method = 'beta_interim'
     AND NOT EXISTS (
       SELECT 1 FROM public.parent_verifications pv2
       WHERE pv2.parent_member_id = pv.parent_member_id
         AND pv2.revoked_at IS NULL
         AND pv2.verification_method <> 'beta_interim'
     );

  RETURN jsonb_build_object(
    'unconsented_under_13', v_count,
    'blockers', v_blockers,
    'ready', v_count = 0,
    'interim_verifications_owed', v_interim_owed
  );
END;
$fn$;

COMMENT ON FUNCTION public.admin_coppa_stamp_readiness() IS
  'PRD-40 sequencing law counter (migration 100330) + BETA-COHORT interim_verifications_owed (informational, never a blocker — PRD-40 §9.4). ready=true only when unconsented_under_13=0 (founder backfill ceremony complete). Gate: coppa_admin.';

REVOKE ALL ON FUNCTION public.admin_coppa_stamp_readiness() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_coppa_stamp_readiness() TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- 8. Self-verification.
-- ──────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_row_count INTEGER;
  v_check_def TEXT;
BEGIN
  -- beta_cohort_settings: exactly one row, RLS on, zero policies.
  SELECT COUNT(*) INTO v_row_count FROM public.beta_cohort_settings;
  IF v_row_count <> 1 THEN
    RAISE EXCEPTION '[100338] expected exactly 1 beta_cohort_settings row, found %', v_row_count;
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.beta_cohort_settings'::regclass) THEN
    RAISE EXCEPTION '[100338] beta_cohort_settings RLS not enabled';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beta_cohort_settings') THEN
    RAISE EXCEPTION '[100338] beta_cohort_settings must have ZERO client policies';
  END IF;
  IF has_table_privilege('authenticated', 'public.beta_cohort_settings', 'SELECT') THEN
    RAISE EXCEPTION '[100338] authenticated must not have direct SELECT on beta_cohort_settings';
  END IF;

  -- get_beta_cohort_mode(): authenticated yes, anon no.
  IF NOT has_function_privilege('authenticated', 'public.get_beta_cohort_mode()', 'EXECUTE') THEN
    RAISE EXCEPTION '[100338] get_beta_cohort_mode should be executable by authenticated';
  END IF;
  IF has_function_privilege('anon', 'public.get_beta_cohort_mode()', 'EXECUTE') THEN
    RAISE EXCEPTION '[100338] get_beta_cohort_mode must not be executable by anon';
  END IF;

  -- verification_method CHECK includes beta_interim.
  SELECT pg_get_constraintdef(c.oid) INTO v_check_def
  FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'parent_verifications' AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%verification_method%'
  LIMIT 1;
  IF v_check_def IS NULL OR v_check_def NOT ILIKE '%beta_interim%' THEN
    RAISE EXCEPTION '[100338] parent_verifications.verification_method CHECK missing beta_interim';
  END IF;

  -- Split indexes exist; the old combined one is gone.
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uq_pv_active_real_per_parent') THEN
    RAISE EXCEPTION '[100338] uq_pv_active_real_per_parent missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uq_pv_active_interim_per_parent') THEN
    RAISE EXCEPTION '[100338] uq_pv_active_interim_per_parent missing';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uq_pv_active_per_parent') THEN
    RAISE EXCEPTION '[100338] uq_pv_active_per_parent should have been dropped';
  END IF;

  -- create_beta_interim_verification(): SECURITY DEFINER, authenticated yes, anon no.
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'create_beta_interim_verification' AND p.prosecdef
  ) THEN
    RAISE EXCEPTION '[100338] create_beta_interim_verification missing or not SECURITY DEFINER';
  END IF;
  IF has_function_privilege('anon', 'public.create_beta_interim_verification()', 'EXECUTE') THEN
    RAISE EXCEPTION '[100338] create_beta_interim_verification must not be executable by anon';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.create_beta_interim_verification()', 'EXECUTE') THEN
    RAISE EXCEPTION '[100338] create_beta_interim_verification should be executable by authenticated (gate enforced in-body)';
  END IF;

  -- admin_coppa_stamp_readiness(): still coppa-admin-gated, still SECURITY DEFINER.
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_coppa_stamp_readiness' AND p.prosecdef
  ) THEN
    RAISE EXCEPTION '[100338] admin_coppa_stamp_readiness missing or not SECURITY DEFINER after replace';
  END IF;
  IF has_function_privilege('anon', 'public.admin_coppa_stamp_readiness()', 'EXECUTE') THEN
    RAISE EXCEPTION '[100338] admin_coppa_stamp_readiness must not be executable by anon';
  END IF;

  -- handle_new_user(): still a valid SECURITY DEFINER trigger function.
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user' AND p.prosecdef
  ) THEN
    RAISE EXCEPTION '[100338] handle_new_user missing or not SECURITY DEFINER after replace';
  END IF;

  RAISE NOTICE '[100338] BETA-COHORT schema verified: beta_cohort_settings (1 row, enabled), beta_interim verification_method + split indexes, create_beta_interim_verification, handle_new_user founding-at-signup, admin_coppa_stamp_readiness.interim_verifications_owed.';
END $$;

COMMIT;
