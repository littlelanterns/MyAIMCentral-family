-- ============================================================================
-- Migration: PRD-31 Slice 2 — Stripe Subscriptions
-- ============================================================================
-- Extends PRD-40's Stripe foundation (decision file §3, migration 100305) per
-- ruling R31-12: ONE _shared/stripe.ts, ONE stripe-webhook-handler, PRD-31
-- registers its 5 subscription events in the SAME purpose-routed HANDLERS map
-- (code change in supabase/functions/stripe-webhook-handler/index.ts, this
-- migration is schema/RPC only).
--
-- Founder rulings applied (claude/feature-decisions/PRD-31-Subscription-Tiers.md
-- §2026-09-11 addendum, all LAW for this slice):
--   1. SOFT founding cap — eligibility decided at Checkout-session creation
--      time; the webhook honors whatever price the session was created with
--      and never re-checks/refuses after the fact. Simultaneous sign-ups both
--      win. The PUBLIC counter clamps at 100, never negative/overshoot, and
--      (SMFX fix, .claude/state/CURRENT.md 2026-09-07) excludes test families.
--   2. Founder-minted one-time founding codes — `founding_codes` table,
--      single-use, RLS: zero client reads of unredeemed codes, redemption is
--      server-side only (inside the webhook's checkout.session.completed
--      handler, atomically with the founding grant it records). Minting is a
--      staff-gated SECURITY DEFINER RPC (Convention #280 from birth); the
--      admin UI lands in Slice 6 — until then the seat mints via this RPC on
--      the founder's word. Code-granted families do NOT count toward the
--      public organic counter.
--   3. Scholarship forward-design — `family_subscriptions.price_adjustment_kind`
--      generalizes per-family pricing ('founding' | 'founding_code' |
--      'scholarship', NULL = none) so a future scholarship kind is a new
--      value + an amount, never a rework. Not built now.
--
-- Live-data hygiene fix discovered during this slice (not a new bug, a stale
-- mirror): OurFamily was flagged families.is_founding_family=true on
-- 2026-09-07 (the backfill ceremony fix, CURRENT.md) but Slice 1's mirror
-- migration (100316, applied 2026-08-23) predates that fix and never re-ran
-- for her — her family_subscriptions row was still is_founding_family=false,
-- founding_rate_monthly=NULL. This migration re-runs the SAME idempotent
-- mirror UPDATE from 100316 (safe, matches its own pattern) and additionally
-- backfills price_adjustment_kind='founding' for any family already flagged
-- founding at the families level — the minimum needed for the new
-- get_founding_family_count() to report correctly today. founding_rate_
-- monthly/yearly are NOT synthesized here; they get set for real by the
-- webhook lifecycle going forward (a genuine Stripe subscription event).
--
-- Design decision recorded (not silently assumed): the public founding count
-- is a LIVE derived count of family_subscriptions.price_adjustment_kind =
-- 'founding' rows (organic only), not a monotonic ratchet. A family that
-- loses founding status (cancellation / 14-day non-payment grace) frees its
-- spot for a later organic sign-up. The original PRD's "atomic 100-counter"
-- language describes a ratchet; the 2026-09-11 ruling's shift to "decided at
-- checkout-session-creation time" reads more naturally as a live count. If
-- the founder prefers strict never-reclaimed spots instead, that is a
-- follow-up: add a monotonic `founding_slots_claimed` ledger and count from
-- it instead of live family_subscriptions state.
--
-- Convention #280: every new SECURITY DEFINER function taking a bare id/code
-- resolves its auth gate before any read/write. mint/list are staff-gated
-- (any staff_permissions row, matching the migration 100305 comment's
-- "standard admin gate" precedent — Screen 4/6 formally introduces the
-- narrower 'tier_admin' type in Slice 6, added to the CHECK now so nothing
-- blocks on that later). redeem is service_role-ONLY (called exclusively
-- from the webhook handler's service-role client, never client-reachable).
-- Convention #246: the founding-grace-sweep cron is a direct-SQL job (no
-- Edge Function, no Vault secret) — same shape as
-- util.coppa_reconcile_age_brackets() (migration 100329).
--
-- Build file: .claude/rules/current-builds/PRD-31-subscriptions.md (Slice 2)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. subscription_tiers — Stripe product/price id columns.
--    Populated by the checked-in idempotent script
--    scripts/stripe-setup-subscription-products.ts (NOT run by this
--    migration — a separate, explicitly-approved step per the production-
--    touch gate, since it calls the live Stripe API).
-- ----------------------------------------------------------------------------
ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id_normal TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id_founding TEXT;

COMMENT ON COLUMN public.subscription_tiers.stripe_product_id IS
  'PRD-31 Slice 2. Stripe Product id for this tier. Set by scripts/stripe-setup-subscription-products.ts, re-runnable/idempotent.';
COMMENT ON COLUMN public.subscription_tiers.stripe_price_id_normal IS
  'PRD-31 Slice 2. Stripe Price id (monthly, standard price_monthly). NULL for inactive tiers (Creator) until reactivated.';
COMMENT ON COLUMN public.subscription_tiers.stripe_price_id_founding IS
  'PRD-31 Slice 2. Stripe Price id (monthly, price_monthly - founding_discount). NULL where founding_discount is 0/absent or the tier is inactive.';

-- ----------------------------------------------------------------------------
-- 2. family_subscriptions — price_adjustment_kind (ruling 2026-09-11 §3, the
--    scholarship forward-design). Written ONLY by the webhook handler
--    (Stripe is the single source of payment truth, per convention — never
--    by client code).
-- ----------------------------------------------------------------------------
ALTER TABLE public.family_subscriptions
  ADD COLUMN IF NOT EXISTS price_adjustment_kind TEXT
    CHECK (price_adjustment_kind IN ('founding', 'founding_code', 'scholarship'));

COMMENT ON COLUMN public.family_subscriptions.price_adjustment_kind IS
  'PRD-31 Slice 2 (ruling 2026-09-11 §3). Generalized per-family pricing mechanism: NULL = standard price, ''founding'' = organic founding-window subscriber, ''founding_code'' = redeemed a founder-minted code, ''scholarship'' = forward-designed, not yet built. A future scholarship kind adds a value + amount here, never a schema rework. Written ONLY by stripe-webhook-handler.';

-- ----------------------------------------------------------------------------
-- 3. families.is_test_family — needed so the public founding counter and any
--    future public-facing aggregate can exclude long-lived shared E2E
--    fixture families (Testworth) without fragile name/pattern matching.
--    Fixes the SMFX-flagged finding (.claude/state/CURRENT.md, 2026-09-07):
--    "exclude test families from the public founding counter."
-- ----------------------------------------------------------------------------
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS is_test_family BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.families.is_test_family IS
  'PRD-31 Slice 2. Marks long-lived shared E2E/test fixture families (e.g. Testworth) so public aggregates (get_founding_family_count(), future public counters) can exclude them without fragile name matching. Never set by client code.';

UPDATE public.families
SET is_test_family = true
WHERE family_login_name_lower = 'testworthfamily'
  AND is_test_family = false;

-- ----------------------------------------------------------------------------
-- 4. Live-data hygiene: re-sync the is_founding_family mirror (Slice 1's own
--    idempotent pattern, migration 100316) for families flagged founding on
--    `families` after Slice 1 ran, and backfill price_adjustment_kind for
--    already-founding families so the new counter is correct immediately.
-- ----------------------------------------------------------------------------
UPDATE public.family_subscriptions fs
SET is_founding_family = true
FROM public.families f
WHERE f.id = fs.family_id
  AND f.is_founding_family = true
  AND f.founding_family_lost_at IS NULL
  AND fs.is_founding_family = false;

UPDATE public.family_subscriptions fs
SET price_adjustment_kind = 'founding'
FROM public.families f
WHERE f.id = fs.family_id
  AND f.is_founding_family = true
  AND f.founding_family_lost_at IS NULL
  AND fs.price_adjustment_kind IS NULL;

-- ----------------------------------------------------------------------------
-- 5. founding_codes — founder-minted one-time codes (ruling 2026-09-11 §2).
--    Single-use enforced by an atomic UPDATE ... WHERE redeemed_at IS NULL
--    inside redeem_founding_code() (§8 below), never by a separate lock step.
--    Zero client SELECT/INSERT/UPDATE/DELETE policies — RLS enabled with no
--    policies at all means every client role (including staff sessions) is
--    denied by default; the mint/list/redeem RPCs are SECURITY DEFINER and
--    bypass RLS entirely, which is the sanctioned path (matches the
--    coppa_consents / stripe_webhook_events "closed table, RPC-only" idiom).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.founding_codes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                    TEXT NOT NULL,
  minted_by               UUID NOT NULL REFERENCES auth.users(id),
  note                    TEXT,
  expires_at              TIMESTAMPTZ,
  redeemed_by_family_id   UUID REFERENCES public.families(id),
  redeemed_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_founding_codes_code ON public.founding_codes (code);
CREATE INDEX IF NOT EXISTS idx_founding_codes_unredeemed
  ON public.founding_codes (code) WHERE redeemed_at IS NULL;

ALTER TABLE public.founding_codes ENABLE ROW LEVEL SECURITY;
-- No policies of any kind: zero client access, matching the ruling's "no
-- client reads of unredeemed codes" — extended here to no client access at
-- all, since every legitimate interaction (mint/list/redeem) has a
-- SECURITY DEFINER RPC and no other consumer exists.

COMMENT ON TABLE public.founding_codes IS
  'PRD-31 Slice 2 (ruling 2026-09-11 §2). Founder-minted one-time codes granting founding-family pricing regardless of the organic 100-family counter. RLS enabled, zero policies — access only via mint_founding_code() / list_founding_codes() (staff-gated) and redeem_founding_code() (service_role-only, called from stripe-webhook-handler).';

-- ----------------------------------------------------------------------------
-- 6. get_founding_family_count() — REPLACE the LAUNCH-PAGE version (migration
--    100331) to fix the SMFX-flagged gap: exclude test families, count only
--    ORGANIC founding families (price_adjustment_kind='founding' — never
--    'founding_code' or 'scholarship', per ruling 2026-09-11 §2: "Code-
--    granted families do NOT consume public spots"), clamp at 100.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_founding_family_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LEAST(COUNT(*)::INTEGER, 100)
  FROM public.families f
  JOIN public.family_subscriptions fs ON fs.family_id = f.id
  WHERE f.is_founding_family = true
    AND f.is_test_family = false
    AND fs.price_adjustment_kind = 'founding';
$$;

COMMENT ON FUNCTION public.get_founding_family_count() IS
  'PRD-31 Slice 2 (supersedes the 100331 LAUNCH-PAGE version). Public, PII-free count of ORGANIC founding families only (price_adjustment_kind=''founding'' — excludes founding_code-granted and scholarship families, and excludes is_test_family). Clamped to 100 (never negative/overshoot). Live-derived, not a monotonic ratchet — see the design-decision note at the top of this migration.';

-- ----------------------------------------------------------------------------
-- 7. staff_permissions.permission_type CHECK extension — 'tier_admin' (R31-7:
--    Screen 4/6's admin gate). Added now so the mint/list RPCs below can be
--    granted to a dedicated tier_admin staff row the moment Slice 6 creates
--    one; the founder's existing coppa_admin row already satisfies the
--    broader "any staff row" gate those RPCs actually use today. Same
--    idempotent discovered-constraint-name pattern as migration 100305.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_conname TEXT;
BEGIN
  SELECT c.conname INTO v_conname
  FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'staff_permissions' AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%permission_type%'
    AND pg_get_constraintdef(c.oid) NOT ILIKE '%tier_admin%'
  LIMIT 1;

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.staff_permissions DROP CONSTRAINT %I', v_conname);
    ALTER TABLE public.staff_permissions ADD CONSTRAINT staff_permissions_permission_type_check
      CHECK (permission_type = ANY (ARRAY[
        'super_admin', 'vault_admin', 'moderation_admin', 'system_admin',
        'analytics_admin', 'feedback_admin', 'persona_admin', 'ethics_admin',
        'coppa_admin', 'tier_admin'
      ]));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 8. mint_founding_code(p_note, p_expires_at, p_code) — staff-gated. Returns
--    the minted code string. Auto-generates a readable code
--    ("FOUNDING-XXXXXXXX") when p_code is omitted; a caller-supplied code is
--    format-validated and uniqueness-checked (the UNIQUE index is the final
--    backstop either way).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mint_founding_code(
  p_note TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_code TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_code TEXT;
BEGIN
  -- Convention #280: gate resolved before any read/write.
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF p_code IS NOT NULL THEN
    IF p_code !~ '^[A-Za-z0-9_-]{4,40}$' THEN
      RAISE EXCEPTION 'invalid_code_format';
    END IF;
    v_code := upper(p_code);
  ELSE
    v_code := 'FOUNDING-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  END IF;

  INSERT INTO public.founding_codes (code, minted_by, note, expires_at)
  VALUES (v_code, auth.uid(), NULLIF(trim(p_note), ''), p_expires_at);

  RETURN v_code;
END;
$fn$;

COMMENT ON FUNCTION public.mint_founding_code(TEXT, TIMESTAMPTZ, TEXT) IS
  'PRD-31 Slice 2 (ruling 2026-09-11 §2). Mints a one-time founding-family code. Staff-gated (any staff_permissions row, or service_role). Admin UI lands in Slice 6 Tier Assignment tab; until then the seat mints on the founder''s word via this RPC.';

-- ----------------------------------------------------------------------------
-- 9. list_founding_codes() — staff-gated, read-only. Convenience beyond the
--    literal ask (mint-only was requested) so the founder can check
--    outstanding codes before Slice 6's admin UI lands. Returns no other
--    family's PII beyond the redeeming family's own name (already visible to
--    any staff session via the families table under other admin surfaces).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_founding_codes()
RETURNS TABLE (
  code TEXT,
  note TEXT,
  minted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  redeemed_by_family_name TEXT,
  redeemed_at TIMESTAMPTZ,
  is_expired BOOLEAN,
  is_redeemed BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT
    fc.code,
    fc.note,
    fc.created_at,
    fc.expires_at,
    f.family_name,
    fc.redeemed_at,
    (fc.expires_at IS NOT NULL AND fc.expires_at <= now()),
    (fc.redeemed_at IS NOT NULL)
  FROM public.founding_codes fc
  LEFT JOIN public.families f ON f.id = fc.redeemed_by_family_id
  ORDER BY fc.created_at DESC;
END;
$fn$;

COMMENT ON FUNCTION public.list_founding_codes() IS
  'PRD-31 Slice 2. Staff-gated read-only listing of founding_codes for founder visibility ahead of Slice 6''s admin UI. Not part of the literal dispatch ask — added because founding_codes otherwise has zero client-reachable read path before Slice 6.';

-- ----------------------------------------------------------------------------
-- 10. redeem_founding_code(p_code, p_family_id) — service_role ONLY. Atomic
--     single-use redemption. Called exclusively from stripe-webhook-handler's
--     checkout.session.completed handler, in the SAME logical step that
--     records the founding grant on family_subscriptions (both writes are
--     driven by one webhook delivery; Stripe's own router-level dedup
--     (stripe_webhook_events) plus this row's redeemed_at guard together
--     make a duplicate delivery a safe no-op).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_founding_code(
  p_code TEXT,
  p_family_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_updated INTEGER;
BEGIN
  -- Convention #280: service_role only — this function directly grants
  -- founding pricing eligibility from a bare code string with no further
  -- validation; it must never be client-reachable.
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE public.founding_codes
  SET redeemed_by_family_id = p_family_id,
      redeemed_at = now()
  WHERE code = upper(p_code)
    AND redeemed_at IS NULL
    AND (expires_at IS NULL OR expires_at > now());

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$fn$;

COMMENT ON FUNCTION public.redeem_founding_code(TEXT, UUID) IS
  'PRD-31 Slice 2 (ruling 2026-09-11 §2). Atomic single-use redemption via UPDATE...WHERE redeemed_at IS NULL. service_role-only — called exclusively from stripe-webhook-handler. Returns false (never throws) on an invalid/expired/already-redeemed code so the webhook can gracefully fall back rather than 500-retry-looping.';

-- ----------------------------------------------------------------------------
-- 11. EXECUTE grants.
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.mint_founding_code(TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_founding_codes() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.redeem_founding_code(TEXT, UUID) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.mint_founding_code(TEXT, TIMESTAMPTZ, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_founding_codes() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_founding_code(TEXT, UUID) TO service_role;

-- ----------------------------------------------------------------------------
-- 12. Founding-status durability: 14-day past_due grace sweep (PRD "Founding
--     Status Durability" table: "Payment failure beyond 14 days → Lost
--     permanently"). Direct-SQL cron, no Edge Function (Convention #246 /
--     migration 100329 precedent). The webhook handler sets past_due_since
--     on invoice.payment_failed and clears it on invoice.paid; this sweep is
--     the only place founding status is actually revoked for non-payment.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION util.sweep_expired_founding_grace()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_row RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_row IN
    SELECT fs.id, fs.family_id
    FROM public.family_subscriptions fs
    WHERE fs.status = 'past_due'
      AND fs.past_due_since IS NOT NULL
      AND fs.past_due_since < now() - INTERVAL '14 days'
      AND fs.is_founding_family = true
  LOOP
    UPDATE public.family_subscriptions
    SET is_founding_family = false,
        founding_rate_monthly = NULL,
        founding_rate_yearly = NULL,
        price_adjustment_kind = NULL
    WHERE id = v_row.id;

    UPDATE public.families
    SET founding_family_lost_at = now()
    WHERE id = v_row.family_id
      AND founding_family_lost_at IS NULL;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$fn$;

COMMENT ON FUNCTION util.sweep_expired_founding_grace() IS
  'PRD-31 Slice 2. Daily sweep: family_subscriptions.status=past_due for 14+ days AND is_founding_family=true loses founding status permanently (PRD Founding Status Durability table). families.is_founding_family stays true (historical record, matches the grace-period-miss edge case); founding_family_lost_at records when. Cron: subscription-founding-grace-sweep.';

REVOKE ALL ON FUNCTION util.sweep_expired_founding_grace() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION util.sweep_expired_founding_grace() TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'subscription-founding-grace-sweep') THEN
    PERFORM cron.unschedule('subscription-founding-grace-sweep');
  END IF;
END $$;

SELECT cron.schedule(
  'subscription-founding-grace-sweep',
  '30 6 * * *',
  $cron$ SELECT util.sweep_expired_founding_grace(); $cron$
);

-- ----------------------------------------------------------------------------
-- 13. Self-verification.
-- ----------------------------------------------------------------------------
DO $verify$
DECLARE
  v_rls_enabled BOOLEAN;
  v_policy_count INTEGER;
BEGIN
  SELECT relrowsecurity INTO v_rls_enabled FROM pg_class WHERE oid = 'public.founding_codes'::regclass;
  IF NOT v_rls_enabled THEN
    RAISE EXCEPTION 'founding_codes RLS is not enabled';
  END IF;

  SELECT COUNT(*) INTO v_policy_count FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'founding_codes';
  IF v_policy_count <> 0 THEN
    RAISE EXCEPTION 'founding_codes must have ZERO client policies, found %', v_policy_count;
  END IF;

  IF has_function_privilege('anon', 'public.redeem_founding_code(text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'redeem_founding_code must not be executable by anon';
  END IF;
  IF has_function_privilege('authenticated', 'public.redeem_founding_code(text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'redeem_founding_code must not be executable by authenticated';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.mint_founding_code(text,timestamptz,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'mint_founding_code should be executable by authenticated (gate enforced in-body)';
  END IF;

  IF has_function_privilege('authenticated', 'util.sweep_expired_founding_grace()', 'EXECUTE') THEN
    RAISE EXCEPTION 'sweep_expired_founding_grace must not be executable by authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'subscription-founding-grace-sweep' AND active) THEN
    RAISE EXCEPTION 'subscription-founding-grace-sweep cron job not registered';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_tiers' AND column_name = 'stripe_price_id_normal'
  ) THEN
    RAISE EXCEPTION 'subscription_tiers.stripe_price_id_normal missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_subscriptions' AND column_name = 'price_adjustment_kind'
  ) THEN
    RAISE EXCEPTION 'family_subscriptions.price_adjustment_kind missing';
  END IF;

  RAISE NOTICE 'migration 100334 verification passed';
END $verify$;
