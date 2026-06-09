-- Row 31 SCOPE-4.F1 (LOCKED Fix Code, founder green-lit 2026-04-20)
-- MindSweep silent failure class — part (a):
--
-- `archive_context_items` was always intended to participate in the embedding
-- pipeline: the `embed` Edge Function lists it in TABLE_CONFIG, and the
-- `classify_by_embedding` RPC (migration 100089) queries `aci.embedding`.
-- But the column was never created. Every classify_by_embedding call has been
-- erroring at runtime ("column aci.embedding does not exist"), and the silent
-- catch in mindsweep-sort/index.ts swallowed it — 100% of MindSweep items fell
-- through to the Haiku LLM path with zero telemetry. This migration restores
-- the embedding-first contract.
--
-- Backfill strategy (Convention #5 — never synchronous): the `embed` Edge
-- Function is poll-based — it scans configured tables for rows with NULL
-- embeddings on its pg_cron schedule and embeds them in batches of 50. Adding
-- the column with NULL values IS the backfill enqueue; the existing async
-- pipeline drains it within a few cron cycles. No synchronous OpenAI calls
-- happen in this migration.

-- 1. Embedding column (idempotent)
ALTER TABLE public.archive_context_items
  ADD COLUMN IF NOT EXISTS embedding halfvec(1536);

-- 2. HNSW index for cosine similarity (matches idx_gs_embedding et al.)
CREATE INDEX IF NOT EXISTS idx_aci_embedding
  ON public.archive_context_items
  USING hnsw (embedding halfvec_cosine_ops);

-- 3. Queue trigger — same generic trigger every embedding table carries.
--    (util.queue_embedding_job() is SECURITY DEFINER; safe no-op if the pgmq
--    path is idle since the embed function backfills by NULL-scan anyway.)
DROP TRIGGER IF EXISTS trg_aci_queue_embedding ON public.archive_context_items;
CREATE TRIGGER trg_aci_queue_embedding
  AFTER INSERT OR UPDATE ON public.archive_context_items
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();
