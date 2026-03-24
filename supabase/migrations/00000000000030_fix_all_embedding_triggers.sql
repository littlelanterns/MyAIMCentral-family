-- Fix ALL embedding triggers across all tables that have them.
-- The queue_embedding_job function was recreated as SECURITY DEFINER in migration 029,
-- but existing triggers may still reference the old function version.
-- Drop and recreate all of them to pick up the new SECURITY DEFINER function.

-- guiding_stars
DROP TRIGGER IF EXISTS trg_gs_queue_embedding ON public.guiding_stars;
CREATE TRIGGER trg_gs_queue_embedding
  AFTER INSERT OR UPDATE ON public.guiding_stars
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

-- best_intentions
DROP TRIGGER IF EXISTS trg_bi_queue_embedding ON public.best_intentions;
CREATE TRIGGER trg_bi_queue_embedding
  AFTER INSERT OR UPDATE ON public.best_intentions
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

-- self_knowledge
DROP TRIGGER IF EXISTS trg_sk_queue_embedding ON public.self_knowledge;
CREATE TRIGGER trg_sk_queue_embedding
  AFTER INSERT OR UPDATE ON public.self_knowledge
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

-- journal_entries
DROP TRIGGER IF EXISTS trg_je_queue_embedding ON public.journal_entries;
CREATE TRIGGER trg_je_queue_embedding
  AFTER INSERT OR UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();
