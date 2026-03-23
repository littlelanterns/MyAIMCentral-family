-- MyAIM Central v2 — Phase 04: Shell Routing & Layouts
-- Tables: dashboard_configs

CREATE TABLE public.dashboard_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  dashboard_type TEXT NOT NULL CHECK (dashboard_type IN ('personal','family_overview','family_hub','guided','play')),
  layout JSONB,
  layout_mode TEXT,
  decorations JSONB,
  preferences JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dc_family_member ON public.dashboard_configs(family_id, family_member_id);
CREATE INDEX idx_dc_type ON public.dashboard_configs(dashboard_type);

CREATE TRIGGER trg_dc_updated_at
  BEFORE UPDATE ON public.dashboard_configs
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.dashboard_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dc_select_own" ON public.dashboard_configs
  FOR SELECT USING (
    family_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

CREATE POLICY "dc_manage_own" ON public.dashboard_configs
  FOR ALL USING (
    family_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );
