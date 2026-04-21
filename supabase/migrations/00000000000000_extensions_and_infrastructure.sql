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
-- Schedule embedding queue processing
-- Requires pg_cron extension (enabled on Supabase Pro)
-- ============================================================
-- The process-embeddings cron job is scheduled by migration 100150, which
-- also creates util.invoke_edge_function (the universal cron → Edge Function
-- bridge that reads URL + service role key from Supabase Vault). All
-- cron-scheduled Edge Function invocations in this codebase go through that
-- helper — do NOT hardcode URLs/keys into cron.job.command, and do NOT use
-- current_setting('app.settings.*') (permission-denied on Supabase hosted).
-- See CLAUDE.md "pg_cron Edge Function invocations" convention for context.
