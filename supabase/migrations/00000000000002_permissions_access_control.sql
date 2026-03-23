-- MyAIM Central v2 — Phase 02: Permissions & Access Control
-- Tables: member_permissions, staff_permissions, view_as_sessions,
--         feature_access_v2, member_feature_toggles

-- ============================================================
-- member_permissions (per-member, per-kid, per-feature grants)
-- ============================================================
CREATE TABLE public.member_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  granting_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  target_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  permission_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mp_family ON public.member_permissions(family_id);
CREATE INDEX idx_mp_target ON public.member_permissions(target_member_id);
CREATE INDEX idx_mp_key ON public.member_permissions(family_id, permission_key);

CREATE TRIGGER trg_mp_updated_at
  BEFORE UPDATE ON public.member_permissions
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.member_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mp_select" ON public.member_permissions
  FOR SELECT USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    OR target_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR granting_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "mp_manage_primary_parent" ON public.member_permissions
  FOR ALL USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- ============================================================
-- staff_permissions (admin console access)
-- ============================================================
CREATE TABLE public.staff_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  permission_type TEXT NOT NULL CHECK (permission_type IN (
    'super_admin','vault_admin','moderation_admin','system_admin','analytics_admin','feedback_admin'
  )),
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sp_user ON public.staff_permissions(user_id);
CREATE INDEX idx_sp_type ON public.staff_permissions(permission_type);

ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sp_read_own" ON public.staff_permissions
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- view_as_sessions (mom's View As tracking)
-- ============================================================
CREATE TABLE public.view_as_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  viewing_as_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_vas_family ON public.view_as_sessions(family_id);
CREATE INDEX idx_vas_viewer ON public.view_as_sessions(viewer_id);
CREATE INDEX idx_vas_active ON public.view_as_sessions(viewer_id) WHERE ended_at IS NULL;

ALTER TABLE public.view_as_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vas_primary_parent" ON public.view_as_sessions
  FOR ALL USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- ============================================================
-- feature_access_v2 (tier-based feature gating)
-- ============================================================
CREATE TABLE public.feature_access_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL,
  role_group TEXT NOT NULL CHECK (role_group IN (
    'mom','dad_adults','special_adults','independent_teens','guided_kids','play_kids'
  )),
  minimum_tier_id UUID REFERENCES public.subscription_tiers(id),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fav2_key_role ON public.feature_access_v2(feature_key, role_group);

CREATE TRIGGER trg_fav2_updated_at
  BEFORE UPDATE ON public.feature_access_v2
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.feature_access_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fav2_public_read" ON public.feature_access_v2
  FOR SELECT USING (true);

-- ============================================================
-- member_feature_toggles (sparse: rows only when DISABLED)
-- ============================================================
CREATE TABLE public.member_feature_toggles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_disabled BOOLEAN NOT NULL DEFAULT true,
  disabled_by UUID NOT NULL REFERENCES public.family_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mft_family_member ON public.member_feature_toggles(family_id, member_id);
CREATE INDEX idx_mft_feature ON public.member_feature_toggles(feature_key);

ALTER TABLE public.member_feature_toggles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mft_select" ON public.member_feature_toggles
  FOR SELECT USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    OR member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "mft_manage_primary_parent" ON public.member_feature_toggles
  FOR ALL USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- ============================================================
-- Seed initial feature keys for PRD-01 and PRD-02 features
-- ============================================================
INSERT INTO public.feature_key_registry (feature_key, display_name, prd_source) VALUES
  ('family_dashboards', 'Family Member Dashboards', 'PRD-01'),
  ('family_login', 'Family Login Name & PIN Login', 'PRD-01'),
  ('member_account_invites', 'Member Account Invitations', 'PRD-01'),
  ('special_adult_access', 'Special Adult Access', 'PRD-01'),
  ('tablet_hub', 'Family Device Hub', 'PRD-01'),
  ('granular_permissions', 'Per-Feature Permission Control', 'PRD-02'),
  ('view_as_mode', 'View As Mode', 'PRD-02'),
  ('special_adult_shifts', 'Shift-Based Caregiver Access', 'PRD-02'),
  ('teen_transparency_panel', 'Teen Privacy Panel', 'PRD-02'),
  ('mom_self_restrictions', 'Mom Self-Restriction Controls', 'PRD-02')
ON CONFLICT (feature_key) DO NOTHING;
