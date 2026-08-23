-- ============================================================================
-- TEEN-CRED — Mom-Typed Login Credentials for Family Members
--
-- Founder-requested 2026-07-10/11: a peer action to Set PIN / Set Picture
-- Login in FamilyMembers.tsx that lets mom type real Door-3 credentials
-- (email+password, or username+password for members with no email) directly
-- for a member — instead of generating a link and waiting for the member to
-- complete their own signup. Produces the exact same end-state as
-- accept_family_invite: a real auth.users row, family_members.user_id
-- linked, auth_method = 'full_login'. Rides Door 3 (Convention #273) —
-- unaffected by the family-password kill switch, same as every existing
-- email-invited member today.
--
-- This migration adds ONLY the schema this build needs:
--   1. family_members.login_username — the synthetic-address stand-in for
--      members with no real email. Platform-unique, format-enforced at the
--      DB layer as defense-in-depth (the Edge Function is the primary
--      validator). NULL for members using a real email or no full_login
--      credentials at all.
--   2. username_check_log — a minimal append-only log backing the
--      mom-gated, rate-limited username-availability check action in
--      family-auth-admin. Fully closed to every client role (mirrors
--      stripe_webhook_events, migration 100305) — service role only.
--
-- No new SECURITY DEFINER SQL function is introduced by this build. The
-- create/reset/availability-check logic lives entirely inside the
-- family-auth-admin Edge Function (service-role admin client + explicit
-- authenticateRequest() + explicit primary-parent-of-family ownership
-- check), mirroring the existing set_member_picture / ensure_pin_shadow_
-- account actions exactly. Convention #280 (auth-gate every new
-- SECURITY DEFINER function taking a bare id) therefore does not apply to
-- a NEW SQL function here — there isn't one — but the same discipline is
-- honored in the Edge Function itself.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- 1. family_members.login_username
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS login_username TEXT;

DO $$
BEGIN
  ALTER TABLE public.family_members DROP CONSTRAINT IF EXISTS family_members_login_username_format_check;
  ALTER TABLE public.family_members
    ADD CONSTRAINT family_members_login_username_format_check
    CHECK (login_username IS NULL OR login_username ~ '^[a-z0-9_]{3,20}$');
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_family_members_login_username
  ON public.family_members (login_username)
  WHERE login_username IS NOT NULL;

COMMENT ON COLUMN public.family_members.login_username IS
  'TEEN-CRED: mom-chosen, platform-unique username for members with no real email. Always lowercase alphanumeric+underscore, 3-20 chars (format enforced here AND in family-auth-admin). The Supabase Auth "email" for these accounts is deterministically {login_username}@login.myaimcentral.app, constructed client-side at /auth/sign-in and server-side at credential-creation time — no lookup table, no resolution endpoint. NULL when the member logs in with a real email, a PIN, a picture password, or has no login at all.';

-- ──────────────────────────────────────────────────────────────────────────
-- 2. username_check_log — rate-limit + audit log for the mom-gated
--    check_username_available action. Purely internal plumbing — no
--    authenticated policy of any kind, no client should ever read or write
--    this table (mirrors stripe_webhook_events, migration 100305).
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.username_check_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_by  UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.username_check_log IS
  'TEEN-CRED: append-only log backing the rate limit (20 checks / 60s per calling mom) on family-auth-admin''s check_username_available action. Service-role only — the Edge Function is the only writer/reader.';

CREATE INDEX IF NOT EXISTS idx_username_check_log_checked_by_created_at
  ON public.username_check_log (checked_by, created_at DESC);

ALTER TABLE public.username_check_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.username_check_log FROM authenticated, anon;
-- No policies at all — RLS enabled with zero grants means zero access for
-- any non-service-role caller.
