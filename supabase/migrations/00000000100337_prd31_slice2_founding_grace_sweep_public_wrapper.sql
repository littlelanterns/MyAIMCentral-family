-- ============================================================================
-- Migration: PRD-31 Slice 2 fix — a public-schema, RPC-reachable wrapper for
-- the founding-grace sweep
-- ============================================================================
-- Found live during the Slice-2 E2E suite run (2026-09-11): the E2E test for
-- util.sweep_expired_founding_grace() (migration 100334) called it via
-- supabase-js's standard `.rpc('sweep_expired_founding_grace')` and got
-- PGRST202 ("Could not find the function"). Root cause, confirmed live: this
-- Supabase project's PostgREST config exposes ONLY `public` and
-- `graphql_public` to the REST API ("Only the following schemas are exposed:
-- public, graphql_public" — PGRST106 on an explicit `.schema('util')`
-- attempt). `util.*` functions are, by this project's own established
-- convention, invoked exclusively via direct SQL — pg_cron jobs, SQL probe
-- scripts (scripts/coppa-enforcement-probes.sql is the precedent) — never via
-- a client RPC call. util.coppa_reconcile_age_brackets() (migration 100329,
-- the pattern this function was modeled on) has never had a Playwright/RPC
-- test for exactly this reason.
--
-- Fix: a THIN public-schema wrapper, service_role-only (same EXECUTE
-- boundary as the util function it delegates to), giving the E2E suite a
-- genuine, safe, RPC-reachable entry point WITHOUT relocating or duplicating
-- the real logic — util.sweep_expired_founding_grace() stays the single
-- source of truth and remains what the cron job actually calls (migration
-- 100334's cron registration is untouched by this migration).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sweep_expired_founding_grace()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT util.sweep_expired_founding_grace();
$$;

COMMENT ON FUNCTION public.sweep_expired_founding_grace() IS
  'PRD-31 Slice 2. Thin public-schema, RPC-reachable wrapper around util.sweep_expired_founding_grace() (migration 100334) — util schema is not exposed to PostgREST on this project (confirmed live: only public/graphql_public are), so this is the E2E suite''s only client-reachable entry point. service_role-only, matching the underlying function''s own EXECUTE boundary. The cron job continues to call the util-schema function directly.';

REVOKE ALL ON FUNCTION public.sweep_expired_founding_grace() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sweep_expired_founding_grace() TO service_role;

DO $verify$
BEGIN
  IF has_function_privilege('authenticated', 'public.sweep_expired_founding_grace()', 'EXECUTE') THEN
    RAISE EXCEPTION 'public.sweep_expired_founding_grace must not be executable by authenticated';
  END IF;
  IF has_function_privilege('anon', 'public.sweep_expired_founding_grace()', 'EXECUTE') THEN
    RAISE EXCEPTION 'public.sweep_expired_founding_grace must not be executable by anon';
  END IF;
  RAISE NOTICE 'migration 100337 verification passed';
END $verify$;
