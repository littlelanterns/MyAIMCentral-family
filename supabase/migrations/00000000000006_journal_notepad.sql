-- MyAIM Central v2 — Phase 07: Journal & Smart Notepad (PRD-08)
-- Tables: journal_entries, notepad_tabs, notepad_extracted_items, notepad_routing_stats

-- ============================================================
-- Journal Entries (PRD-08)
-- ============================================================

CREATE TABLE public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'daily_reflection','gratitude','learning_capture','prayer','letter',
    'memory','goal_check_in','dream','observation','free_write','reflection_response'
  )),
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  visibility TEXT NOT NULL CHECK (visibility IN ('private','shared_parents','family')),
  related_plan_id UUID,
  is_included_in_ai BOOLEAN NOT NULL DEFAULT true,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_je_family_member ON public.journal_entries(family_id, member_id);
CREATE INDEX idx_je_type ON public.journal_entries(entry_type);
CREATE INDEX idx_je_created ON public.journal_entries(created_at DESC);
CREATE INDEX idx_je_embedding ON public.journal_entries USING ivfflat (embedding)
  WHERE embedding IS NOT NULL;

CREATE TRIGGER trg_je_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE TRIGGER trg_je_queue_embedding
  AFTER INSERT OR UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Member can manage own entries
CREATE POLICY "je_manage_own" ON public.journal_entries
  FOR ALL USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Primary parent can read shared_parents and family visibility entries
CREATE POLICY "je_select_parent" ON public.journal_entries
  FOR SELECT USING (
    visibility IN ('shared_parents', 'family')
    AND family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- Family members can read family-visibility entries
CREATE POLICY "je_select_family" ON public.journal_entries
  FOR SELECT USING (
    visibility = 'family'
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

-- ============================================================
-- Notepad Tabs (PRD-08)
-- ============================================================

CREATE TABLE public.notepad_tabs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nt_family_member ON public.notepad_tabs(family_id, member_id);

CREATE TRIGGER trg_nt_updated_at
  BEFORE UPDATE ON public.notepad_tabs
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.notepad_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nt_manage_own" ON public.notepad_tabs
  FOR ALL USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- Notepad Extracted Items (PRD-08)
-- ============================================================

CREATE TABLE public.notepad_extracted_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tab_id UUID NOT NULL REFERENCES public.notepad_tabs(id) ON DELETE CASCADE,
  routing_destination TEXT NOT NULL,
  extracted_content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','routed','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nei_tab ON public.notepad_extracted_items(tab_id);
CREATE INDEX idx_nei_status ON public.notepad_extracted_items(status);

ALTER TABLE public.notepad_extracted_items ENABLE ROW LEVEL SECURITY;

-- Inherits from notepad_tabs
CREATE POLICY "nei_manage_via_tab" ON public.notepad_extracted_items
  FOR ALL USING (
    tab_id IN (
      SELECT id FROM public.notepad_tabs
      WHERE member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    )
  );

-- ============================================================
-- Notepad Routing Stats (PRD-08)
-- ============================================================

CREATE TABLE public.notepad_routing_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  last_routed_at TIMESTAMPTZ
);

CREATE INDEX idx_nrs_family_member ON public.notepad_routing_stats(family_id, member_id);

ALTER TABLE public.notepad_routing_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nrs_select_own" ON public.notepad_routing_stats
  FOR SELECT USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "nrs_manage_own" ON public.notepad_routing_stats
  FOR ALL USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- Feature Key Seeds (PRD-08)
-- ============================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source) VALUES
  ('notepad_basic', 'Smart Notepad', 'Always-on capture workspace with tabs', 'PRD-08'),
  ('notepad_voice', 'Notepad Voice Input', 'Voice-to-text capture in notepad', 'PRD-08'),
  ('notepad_review_route', 'Review & Route', 'Extract and route notepad items to features', 'PRD-08'),
  ('journal_basic', 'Journal', 'Create and manage journal entries', 'PRD-08'),
  ('journal_ai_tags', 'Journal AI Tags', 'AI auto-tagging of journal entries', 'PRD-08')
ON CONFLICT (feature_key) DO NOTHING;
