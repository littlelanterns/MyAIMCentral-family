-- MyAIM Central v2 — Phase 06: Personal Growth Foundation (PRD-06, PRD-07)
-- Tables: guiding_stars, best_intentions, intention_iterations, self_knowledge
-- Feature keys seeded into registry

-- ============================================================
-- Guiding Stars (PRD-06)
-- ============================================================

CREATE TABLE public.guiding_stars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  is_included_in_ai BOOLEAN NOT NULL DEFAULT true,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gs_family_member ON public.guiding_stars(family_id, member_id);
CREATE INDEX idx_gs_embedding ON public.guiding_stars USING ivfflat (embedding)
  WHERE embedding IS NOT NULL;

CREATE TRIGGER trg_gs_updated_at
  BEFORE UPDATE ON public.guiding_stars
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE TRIGGER trg_gs_queue_embedding
  AFTER INSERT OR UPDATE ON public.guiding_stars
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

ALTER TABLE public.guiding_stars ENABLE ROW LEVEL SECURITY;

-- Member can manage own
CREATE POLICY "gs_manage_own" ON public.guiding_stars
  FOR ALL USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Primary parent can read all in family
CREATE POLICY "gs_select_parent" ON public.guiding_stars
  FOR SELECT USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- ============================================================
-- Best Intentions (PRD-06)
-- ============================================================

CREATE TABLE public.best_intentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  tags TEXT[],
  source TEXT NOT NULL DEFAULT 'manual',
  celebration_count INTEGER NOT NULL DEFAULT 0,
  iteration_count INTEGER NOT NULL DEFAULT 0,
  is_included_in_ai BOOLEAN NOT NULL DEFAULT true,
  embedding vector(1536),
  last_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bi_family_member ON public.best_intentions(family_id, member_id);
CREATE INDEX idx_bi_embedding ON public.best_intentions USING ivfflat (embedding)
  WHERE embedding IS NOT NULL;

CREATE TRIGGER trg_bi_updated_at
  BEFORE UPDATE ON public.best_intentions
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE TRIGGER trg_bi_queue_embedding
  AFTER INSERT OR UPDATE ON public.best_intentions
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

ALTER TABLE public.best_intentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bi_manage_own" ON public.best_intentions
  FOR ALL USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "bi_select_parent" ON public.best_intentions
  FOR SELECT USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- ============================================================
-- Intention Iterations (PRD-06)
-- ============================================================

CREATE TABLE public.intention_iterations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intention_id UUID NOT NULL REFERENCES public.best_intentions(id) ON DELETE CASCADE,
  victory_reference UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ii_intention ON public.intention_iterations(intention_id);

ALTER TABLE public.intention_iterations ENABLE ROW LEVEL SECURITY;

-- Inherits access from best_intentions via intention_id
CREATE POLICY "ii_select_via_intention" ON public.intention_iterations
  FOR SELECT USING (
    intention_id IN (
      SELECT id FROM public.best_intentions
      WHERE member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    )
    OR intention_id IN (
      SELECT id FROM public.best_intentions
      WHERE family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    )
  );

CREATE POLICY "ii_insert_own" ON public.intention_iterations
  FOR INSERT WITH CHECK (
    intention_id IN (
      SELECT id FROM public.best_intentions
      WHERE member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    )
  );

-- ============================================================
-- Self Knowledge / InnerWorkings (PRD-07)
-- ============================================================

CREATE TABLE public.self_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('personality','strengths','growth_areas','communication_style','how_i_work')),
  content TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('manual','upload','lila_guided','bulk_add')),
  share_with_mom BOOLEAN NOT NULL DEFAULT true,
  share_with_dad BOOLEAN NOT NULL DEFAULT false,
  is_included_in_ai BOOLEAN NOT NULL DEFAULT true,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sk_family_member ON public.self_knowledge(family_id, member_id);
CREATE INDEX idx_sk_category ON public.self_knowledge(category);
CREATE INDEX idx_sk_embedding ON public.self_knowledge USING ivfflat (embedding)
  WHERE embedding IS NOT NULL;

CREATE TRIGGER trg_sk_updated_at
  BEFORE UPDATE ON public.self_knowledge
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE TRIGGER trg_sk_queue_embedding
  AFTER INSERT OR UPDATE ON public.self_knowledge
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

ALTER TABLE public.self_knowledge ENABLE ROW LEVEL SECURITY;

-- Member can manage own
CREATE POLICY "sk_manage_own" ON public.self_knowledge
  FOR ALL USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Primary parent can read if share_with_mom is true
CREATE POLICY "sk_select_mom" ON public.self_knowledge
  FOR SELECT USING (
    share_with_mom = true
    AND family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- Additional adults can read if share_with_dad is true
CREATE POLICY "sk_select_dad" ON public.self_knowledge
  FOR SELECT USING (
    share_with_dad = true
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'additional_adult'
    )
  );

-- ============================================================
-- Feature Key Registry Seeds (PRD-06, PRD-07)
-- ============================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source) VALUES
  ('guiding_stars_basic', 'Guiding Stars', 'Create and manage personal guiding stars', 'PRD-06'),
  ('guiding_stars_ai_craft', 'Craft with LiLa', 'AI-assisted guiding star creation', 'PRD-06'),
  ('best_intentions', 'Best Intentions', 'Create and track best intentions', 'PRD-06'),
  ('innerworkings_basic', 'InnerWorkings', 'Manual self-knowledge entries', 'PRD-07'),
  ('innerworkings_upload', 'InnerWorkings Upload', 'Upload documents for self-knowledge extraction', 'PRD-07'),
  ('innerworkings_discovery', 'Self-Discovery', 'LiLa-guided self-discovery mode', 'PRD-07'),
  ('innerworkings_context', 'InnerWorkings Context', 'Include self-knowledge in LiLa context', 'PRD-07')
ON CONFLICT (feature_key) DO NOTHING;
