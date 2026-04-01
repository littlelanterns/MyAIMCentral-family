-- Migration: Reflections (PRD-18 — Reflections portion)
-- Tables: reflection_prompts, reflection_responses
-- Feature keys: reflections_basic, reflections_custom

-- ============================================================
-- Reflection Prompts — per-member prompt library
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reflection_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  original_text TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'gratitude_joy', 'growth_accountability', 'identity_purpose',
    'relationships_service', 'curiosity_discovery', 'kids_specific', 'custom'
  )),
  source TEXT NOT NULL DEFAULT 'default' CHECK (source IN ('default', 'custom', 'lila_dynamic')),
  is_ephemeral BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reflection_prompts_member_active
  ON public.reflection_prompts (family_id, member_id, archived_at);
CREATE INDEX idx_reflection_prompts_member_category
  ON public.reflection_prompts (family_id, member_id, category);

CREATE TRIGGER set_reflection_prompts_updated_at
  BEFORE UPDATE ON public.reflection_prompts
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.reflection_prompts ENABLE ROW LEVEL SECURITY;

-- Members can CRUD their own prompts
CREATE POLICY "rp_manage_own" ON public.reflection_prompts
  FOR ALL
  USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Mom can CRUD all family members' prompts (for View As curation)
CREATE POLICY "rp_parent_manage_all" ON public.reflection_prompts
  FOR ALL
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- ============================================================
-- Reflection Responses
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reflection_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.reflection_prompts(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  response_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_context TEXT NOT NULL DEFAULT 'reflections_page'
    CHECK (source_context IN ('reflections_page', 'evening_rhythm')),
  journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  routed_destinations JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reflection_responses_member_date
  ON public.reflection_responses (family_id, member_id, response_date);
CREATE UNIQUE INDEX idx_reflection_responses_no_duplicate
  ON public.reflection_responses (family_id, member_id, prompt_id, response_date);

ALTER TABLE public.reflection_responses ENABLE ROW LEVEL SECURITY;

-- Members read/write own responses
CREATE POLICY "rr_manage_own" ON public.reflection_responses
  FOR ALL
  USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Mom reads children's responses (NOT dad's — dad is private per PRD-02)
CREATE POLICY "rr_parent_reads_children" ON public.reflection_responses
  FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
    AND member_id NOT IN (
      SELECT id FROM public.family_members
      WHERE role = 'additional_adult'
        AND family_id = reflection_responses.family_id
    )
  );

-- ============================================================
-- Feature Keys
-- ============================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source) VALUES
  ('reflections_basic', 'Reflections', 'Daily reflection prompts and responses', 'PRD-18'),
  ('reflections_custom', 'Custom Reflections', 'Custom prompt creation and management', 'PRD-18')
ON CONFLICT (feature_key) DO NOTHING;
