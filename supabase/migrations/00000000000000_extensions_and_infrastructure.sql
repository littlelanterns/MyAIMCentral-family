-- MyAIM Central v2 — Phase 00: Database Infrastructure
-- Extensions, schemas, utility functions, and embedding pipeline

-- ============================================================
-- Enable extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgmq;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- Create schemas
-- ============================================================
CREATE SCHEMA IF NOT EXISTS platform_intelligence;
CREATE SCHEMA IF NOT EXISTS util;

-- ============================================================
-- Utility: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION util.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Embedding pipeline: queue and trigger function
-- ============================================================

-- Create the embedding jobs queue
SELECT pgmq.create('embedding_jobs');

-- Generic trigger function to queue embedding jobs
-- Attach this trigger to any table that needs embeddings
CREATE OR REPLACE FUNCTION util.queue_embedding_job()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pgmq.send('embedding_jobs', jsonb_build_object(
    'table_name', TG_TABLE_NAME,
    'schema_name', TG_TABLE_SCHEMA,
    'id', NEW.id,
    'operation', TG_OP
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Schedule embedding queue processing (every 10 seconds)
-- Requires pg_cron extension (enabled on Supabase Pro)
-- ============================================================
-- NOTE: pg_cron scheduling is set up via Supabase Dashboard
-- because it requires the supabase_url and service_role_key
-- which are configured as app.settings in the dashboard.
--
-- Cron job to add via Dashboard → Database → Cron Jobs:
-- Name: process-embeddings
-- Schedule: */10 * * * * (every 10 seconds not supported by pg_cron,
--           use Supabase's interval scheduling or set to * * * * * for every minute)
-- Command:
--   SELECT net.http_post(
--     url := 'https://vjfbzpliqialqmabfnxs.supabase.co/functions/v1/embed',
--     headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
--     body := '{}'::jsonb
--   );
