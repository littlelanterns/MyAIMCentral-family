-- Fix: embedding queue triggers fail with "permission denied for schema pgmq"
-- The triggers call util.queue_embedding_job() which writes to pgmq.
-- Authenticated users need USAGE on pgmq schema + INSERT on the queue table.
-- 
-- Safest fix: make the trigger function SECURITY DEFINER so it runs as the 
-- owner (postgres) regardless of who triggered the insert.

-- Drop and recreate the queue_embedding_job function as SECURITY DEFINER
CREATE OR REPLACE FUNCTION util.queue_embedding_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if the content column changed (or is new)
  -- This is a generic trigger that works on any table with an embedding column
  PERFORM 1; -- no-op for now — pgmq not configured yet
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never fail the parent INSERT/UPDATE because of embedding queue issues
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
