-- ============================================================
-- LAUNCH-PAGE — public marketing site for aimagicformoms.com
--
-- Founder-directed standalone build (no PRD). Purpose: (a) give the
-- business a real public front door, (b) satisfy Stripe's business-
-- activation review, which requires a reachable page describing the
-- product, pricing, and contact info. Will later be ABSORBED by
-- PRD-38 Cookie Dough & Contingency Plans (approved pack,
-- claude/dispatch-factory/PRD38.md, sequenced after PRD-32/21C) — this
-- build does not fight that future; waitlist_signups and the marketing
-- route tree are meant to be inherited, not replaced, when PRD-38 lands.
--
-- Two pieces:
--   1. waitlist_signups — anonymous-capture table for the public landing
--      page's waitlist form. No email sending (Resend doesn't exist yet
--      per PRD-30/PRD-40 stub notes) — capture only. RLS mirrors the
--      `username_check_log` pattern (migration 100314): RLS enabled,
--      INSERT-only for anon+authenticated, ZERO read policies for any
--      client role. The founder reads submissions later via service
--      role / a future admin surface — never via the anon key.
--   2. get_founding_family_count() — a narrow, PII-free SECURITY DEFINER
--      RPC so the public pricing section can show "N of 100 founding
--      spots taken" without granting anon any read access to `families`
--      (which holds real family names/login names and must stay
--      unreadable — Convention #273's no-enumeration rule). Returns an
--      integer count only, nothing else. STABLE, empty search_path.
-- ============================================================

-- ----------------------------------------------------------------------------
-- 1. waitlist_signups
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  interested_pillars TEXT[] NOT NULL DEFAULT '{}',
  source_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Defense-in-depth format check (mirrors the login_username format-CHECK
-- precedent, migration 100314) — a malformed value can never reach the
-- table even if a future client bug skips the frontend's own validation.
ALTER TABLE public.waitlist_signups
  ADD CONSTRAINT waitlist_signups_email_format
  CHECK (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

-- Rate-limit-friendly shape: re-submitting the same email is a harmless
-- no-op collision, not a fresh row, so a spam script gains nothing by
-- resubmitting and the table can't balloon from one address hammering it.
CREATE UNIQUE INDEX IF NOT EXISTS uq_waitlist_signups_email_lower
  ON public.waitlist_signups (lower(email));

CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at
  ON public.waitlist_signups (created_at DESC);

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Anyone visiting the public marketing site (signed in or not) may add
-- themselves to the waitlist. No client role may read the table back —
-- this is capture-only, matching username_check_log's zero-policy-for-
-- reads shape. A duplicate email upsert-conflict is handled client-side
-- (caught and shown as a friendly "you're already on the list" state).
CREATE POLICY waitlist_signups_insert_public ON public.waitlist_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

COMMENT ON TABLE public.waitlist_signups IS
  'Public marketing-site waitlist capture (LAUNCH-PAGE build). Anon/authenticated INSERT only — no client SELECT/UPDATE/DELETE policy exists. Founder reads via service role. Slated for absorption into PRD-38 Cookie Dough when that build lands.';

-- ----------------------------------------------------------------------------
-- 2. get_founding_family_count() — PII-free public count for the pricing
--    section's "N of 100 founding spots" framing.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_founding_family_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.families WHERE is_founding_family = true;
$$;

COMMENT ON FUNCTION public.get_founding_family_count() IS
  'Public, PII-free count of families with is_founding_family=true. Used by the marketing pricing section. Returns only an integer — never exposes family names, login names, or any other row data (Convention #273 no-enumeration discipline).';

REVOKE ALL ON FUNCTION public.get_founding_family_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_founding_family_count() TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Self-verification (fails the migration loudly if anything is wrong)
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  v_insert_policy_count INTEGER;
  v_other_policy_count INTEGER;
  v_rls_enabled BOOLEAN;
  v_func_secdef BOOLEAN;
  v_anon_execute BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO v_rls_enabled
  FROM pg_class WHERE oid = 'public.waitlist_signups'::regclass;
  IF NOT v_rls_enabled THEN
    RAISE EXCEPTION 'waitlist_signups RLS is not enabled';
  END IF;

  SELECT COUNT(*) INTO v_insert_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'waitlist_signups' AND cmd = 'INSERT';
  IF v_insert_policy_count <> 1 THEN
    RAISE EXCEPTION 'waitlist_signups expected exactly 1 INSERT policy, found %', v_insert_policy_count;
  END IF;

  SELECT COUNT(*) INTO v_other_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'waitlist_signups' AND cmd <> 'INSERT';
  IF v_other_policy_count <> 0 THEN
    RAISE EXCEPTION 'waitlist_signups must have zero SELECT/UPDATE/DELETE policies, found %', v_other_policy_count;
  END IF;

  SELECT prosecdef INTO v_func_secdef
  FROM pg_proc WHERE oid = 'public.get_founding_family_count()'::regprocedure;
  IF NOT v_func_secdef THEN
    RAISE EXCEPTION 'get_founding_family_count is not SECURITY DEFINER';
  END IF;

  SELECT has_function_privilege('anon', 'public.get_founding_family_count()', 'EXECUTE')
    INTO v_anon_execute;
  IF NOT v_anon_execute THEN
    RAISE EXCEPTION 'anon lacks EXECUTE on get_founding_family_count()';
  END IF;

  RAISE NOTICE 'LAUNCH-PAGE migration self-verify: PASS (RLS on, 1 INSERT policy, 0 read policies, RPC is SECURITY DEFINER with anon EXECUTE)';
END $$;
