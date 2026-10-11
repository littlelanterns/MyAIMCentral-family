-- ============================================================================
-- 00000000100341 — Disk IO relief: partial "needs embedding" indexes +
--                  every-minute cron cadence widened + cron-history pruning
-- ============================================================================
-- Founder-approved 2026-10-10 after a month-long production incident: the
-- Supabase instance exhausted its Disk IO budget daily WITH ZERO USERS, and
-- PostgREST returned 503 ("Could not query the database for the schema
-- cache") on every request — an infinite sign-in spinner for the founder.
--
-- Root cause (pg_stat_statements, read 2026-10-10): eight of the top nine
-- disk-reading statements were the every-minute `embed` poller's
-- `WHERE embedding IS NULL LIMIT n` probes against the BookShelf / platform
-- content tables. With NO partial index on that predicate, and every row
-- already embedded, each probe was a full heap scan that found nothing and
-- ran again 60 seconds later — ~10 TB of disk reads over the period. The #1
-- statement was pg_net's own response-log purge against a 328 MB heap holding
-- 1,169 live rows (bloat from the same every-minute churn; truncated as a
-- one-time op the same session, not in this migration).
--
-- This migration makes each probe a single index lookup and cuts the
-- background cadence 5–15x. No table is dropped, no data changes.
-- Idempotent: every CREATE INDEX is IF NOT EXISTS; alter_job is a plain set.
-- NOTE: CREATE INDEX (not CONCURRENTLY) so the file can run inside the CLI's
-- transaction; the tables see no user writes while idle, and the partial
-- indexes are tiny (zero or near-zero qualifying rows).
-- ============================================================================

-- ---- 1. Partial indexes: public tables polled by supabase/functions/embed ----
CREATE INDEX IF NOT EXISTS idx_bookshelf_chunks_needs_embedding        ON public.bookshelf_chunks        (id) WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookshelf_summaries_needs_embedding     ON public.bookshelf_summaries     (id) WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookshelf_insights_needs_embedding      ON public.bookshelf_insights      (id) WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookshelf_declarations_needs_embedding  ON public.bookshelf_declarations  (id) WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookshelf_action_steps_needs_embedding  ON public.bookshelf_action_steps  (id) WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookshelf_questions_needs_embedding     ON public.bookshelf_questions     (id) WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS idx_guiding_stars_needs_embedding           ON public.guiding_stars           (id) WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS idx_self_knowledge_needs_embedding          ON public.self_knowledge          (id) WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_needs_embedding         ON public.journal_entries         (id) WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS idx_best_intentions_needs_embedding         ON public.best_intentions         (id) WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS idx_archive_context_items_needs_embedding   ON public.archive_context_items   (id) WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS idx_recipes_needs_embedding                 ON public.recipes                 (id) WHERE embedding IS NULL;

-- ---- 2. Partial indexes: platform_intelligence tables behind the
--         get_unembedded_* RPCs (migrations 100122 / 100286) ----
CREATE INDEX IF NOT EXISTS idx_pi_book_chunks_needs_embedding          ON platform_intelligence.book_chunks            (id) WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS idx_pi_book_extractions_needs_embedding     ON platform_intelligence.book_extractions       (id) WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS idx_pi_ethics_patterns_needs_embedding      ON platform_intelligence.ethics_pattern_library (id) WHERE embedding IS NULL;

-- ---- 3. Widen the three every-minute crons ----
-- process-embeddings: content is embedded by trigger-queued jobs; a 15-minute
-- sweep is ample for stragglers. safety-classify / validate-ai-output: 5 min —
-- PRD-30 Layer 2 already waits 30 min of conversation quiet, and PRD-41 scans
-- are post-hoc; a ≤5-minute pickup is well inside both contracts.
SELECT cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'process-embeddings'), schedule := '*/15 * * * *');
SELECT cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'safety-classify'),    schedule := '*/5 * * * *');
SELECT cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'validate-ai-output'), schedule := '*/5 * * * *');

-- ---- 4. Prune cron history daily (pg_cron never purges job_run_details) ----
SELECT cron.unschedule('cron-history-prune') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cron-history-prune');
SELECT cron.schedule('cron-history-prune', '0 4 * * *', $cron$
  DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days';
$cron$);

-- ---- 5. Verification ----
DO $$
DECLARE
  idx_count INT;
  bad_sched INT;
BEGIN
  SELECT count(*) INTO idx_count FROM pg_indexes WHERE indexname LIKE 'idx_%_needs_embedding';
  IF idx_count < 15 THEN
    RAISE EXCEPTION 'expected 15 needs_embedding partial indexes, found %', idx_count;
  END IF;
  SELECT count(*) INTO bad_sched FROM cron.job
   WHERE jobname IN ('process-embeddings','safety-classify','validate-ai-output') AND schedule = '* * * * *';
  IF bad_sched > 0 THEN
    RAISE EXCEPTION '% every-minute cron(s) still scheduled', bad_sched;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cron-history-prune') THEN
    RAISE EXCEPTION 'cron-history-prune not scheduled';
  END IF;
  RAISE NOTICE '100341 verified: % partial indexes, every-minute crons widened, history prune scheduled', idx_count;
END $$;
