-- ============================================================================
-- Universal cron → Edge Function invocation helper
-- ============================================================================
--
-- Context: Supabase hosted BLOCKS `ALTER DATABASE ... SET app.settings.*`
-- (permission denied for every role, including the Dashboard SQL Editor).
-- The original cron jobs built their target URL via
-- `current_setting('app.settings.supabase_url')` — which silently failed on
-- every run for 7+ days because the GUC could never be set. See
-- PERFORMANCE_BASELINE.md issue #1.
--
-- Design: one helper function, callable by cron jobs. Reads the project URL
-- and service role key from Supabase Vault (encrypted at rest, managed via
-- Dashboard → Database → Vault). Secrets stay OUT of `cron.job.command`,
-- stay OUT of migration files, and are rotatable in one place.
--
-- Required vault secrets (must be created BEFORE any migration that schedules
-- a cron job that calls this helper):
--   - 'supabase_url'       : e.g. 'https://<ref>.supabase.co'
--   - 'service_role_key'   : the project's current service_role key
--
-- One-time Vault setup (run once per environment via Dashboard → SQL Editor
-- or pooler connection):
--   SELECT vault.create_secret('https://<ref>.supabase.co', 'supabase_url',
--     'Base URL for the project. Used by util.invoke_edge_function.');
--   SELECT vault.create_secret('<service_role_key>', 'service_role_key',
--     'Service role key for cron-invoked Edge Functions.');
--
-- Usage from any cron job:
--   SELECT cron.schedule('my-job', '0 * * * *', $$
--     SELECT util.invoke_edge_function('my-edge-function');
--   $$);
-- ============================================================================

CREATE OR REPLACE FUNCTION util.invoke_edge_function(
  p_function_name TEXT,
  p_body JSONB DEFAULT '{}'::jsonb
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_url  TEXT;
  v_key  TEXT;
  v_req  BIGINT;
BEGIN
  SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_url'
    LIMIT 1;

  SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE EXCEPTION
      'util.invoke_edge_function: vault is missing supabase_url or service_role_key. '
      'Run vault.create_secret for both before scheduling cron jobs that call this helper.';
  END IF;

  SELECT net.http_post(
    url     := v_url || '/functions/v1/' || p_function_name,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := p_body
  ) INTO v_req;

  RETURN v_req;
END;
$$;

REVOKE ALL ON FUNCTION util.invoke_edge_function(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION util.invoke_edge_function(TEXT, JSONB) TO postgres;

COMMENT ON FUNCTION util.invoke_edge_function(TEXT, JSONB) IS
  'Universal cron → Edge Function bridge. Reads URL + service role key from '
  'Supabase Vault (secrets named supabase_url and service_role_key). All '
  'pg_cron jobs that invoke an Edge Function MUST use this helper — do NOT '
  'hardcode the URL/key into cron.job.command, and do NOT rely on '
  'current_setting(''app.settings.*'') which is permission-denied on '
  'Supabase hosted.';

-- ============================================================================
-- Migrate existing cron jobs to use the helper.
-- Idempotent: unschedule-if-exists then schedule fresh. Safe to re-run.
-- ============================================================================

-- 1. process-embeddings (was working via hardcoded URL/key — now consistent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-embeddings') THEN
    PERFORM cron.unschedule('process-embeddings');
  END IF;
END $$;

SELECT cron.schedule(
  'process-embeddings',
  '* * * * *',  -- every minute (was every 60 s via pg_net timer; cron minute granularity is fine)
  $cron$
  SELECT util.invoke_edge_function('embed', '{"batch_size": 200}'::jsonb);
  $cron$
);

-- 2. mindsweep-auto-sweep (was failing — unrecognized configuration parameter)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mindsweep-auto-sweep') THEN
    PERFORM cron.unschedule('mindsweep-auto-sweep');
  END IF;
END $$;

SELECT cron.schedule(
  'mindsweep-auto-sweep',
  '0 * * * *',
  $cron$
  SELECT util.invoke_edge_function('mindsweep-auto-sweep');
  $cron$
);

-- 3. rhythm-carry-forward-fallback (was failing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rhythm-carry-forward-fallback') THEN
    PERFORM cron.unschedule('rhythm-carry-forward-fallback');
  END IF;
END $$;

SELECT cron.schedule(
  'rhythm-carry-forward-fallback',
  '5 * * * *',
  $cron$
  SELECT util.invoke_edge_function('process-carry-forward-fallback');
  $cron$
);

-- 4. calculate-allowance-period (was failing — founder's kids' allowance)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'calculate-allowance-period') THEN
    PERFORM cron.unschedule('calculate-allowance-period');
  END IF;
END $$;

SELECT cron.schedule(
  'calculate-allowance-period',
  '10 * * * *',
  $cron$
  SELECT util.invoke_edge_function('calculate-allowance-period');
  $cron$
);

-- 5. accrue-loan-interest (was failing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'accrue-loan-interest') THEN
    PERFORM cron.unschedule('accrue-loan-interest');
  END IF;
END $$;

SELECT cron.schedule(
  'accrue-loan-interest',
  '15 * * * *',
  $cron$
  SELECT util.invoke_edge_function('accrue-loan-interest');
  $cron$
);
