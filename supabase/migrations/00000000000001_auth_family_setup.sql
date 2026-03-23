-- MyAIM Central v2 — Phase 01: Auth & Family Setup
-- Tables: families, family_members, special_adult_assignments
-- Plus subscription infrastructure (all unlocked for beta)

-- ============================================================
-- families
-- ============================================================
CREATE TABLE public.families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_parent_id UUID NOT NULL REFERENCES auth.users(id),
  family_name TEXT NOT NULL,
  family_login_name TEXT UNIQUE,
  family_login_name_lower TEXT UNIQUE,
  is_founding_family BOOLEAN NOT NULL DEFAULT false,
  founding_family_rates JSONB,
  founding_onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  founding_onboarding_grace_deadline TIMESTAMPTZ,
  founding_family_lost_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  tablet_hub_config JSONB,
  tablet_hub_timeout INTEGER NOT NULL DEFAULT 300,
  sweep_email_address TEXT,
  sweep_email_enabled BOOLEAN NOT NULL DEFAULT false,
  analytics_opt_in BOOLEAN NOT NULL DEFAULT true,
  last_data_export_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_families_login_lower ON public.families(family_login_name_lower);
CREATE INDEX idx_families_primary_parent ON public.families(primary_parent_id);

-- Auto-set lowercase login name
CREATE OR REPLACE FUNCTION public.trg_families_login_lower()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.family_login_name IS NOT NULL THEN
    NEW.family_login_name_lower = lower(NEW.family_login_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_families_login_lower
  BEFORE INSERT OR UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.trg_families_login_lower();

CREATE TRIGGER trg_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- RLS enabled here, policies added after family_members table exists
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- family_members
-- ============================================================
CREATE TABLE public.family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('primary_parent','additional_adult','special_adult','independent','guided','play')),
  avatar_url TEXT,
  pin_hash TEXT,
  visual_password JSONB,
  login_method TEXT CHECK (login_method IN ('email','pin','visual','none')),
  member_color TEXT,
  calendar_color TEXT,
  gamification_points INTEGER NOT NULL DEFAULT 0,
  gamification_level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_task_completion_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fm_family ON public.family_members(family_id);
CREATE INDEX idx_fm_user ON public.family_members(user_id);
CREATE INDEX idx_fm_role ON public.family_members(family_id, role);

CREATE TRIGGER trg_fm_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fm_select_own_family" ON public.family_members
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT id FROM public.families WHERE primary_parent_id = auth.uid()
    )
  );

CREATE POLICY "fm_insert_primary_parent" ON public.family_members
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT id FROM public.families WHERE primary_parent_id = auth.uid()
    )
  );

CREATE POLICY "fm_update_primary_parent" ON public.family_members
  FOR UPDATE USING (
    family_id IN (
      SELECT id FROM public.families WHERE primary_parent_id = auth.uid()
    )
  );

CREATE POLICY "fm_delete_primary_parent" ON public.family_members
  FOR DELETE USING (
    family_id IN (
      SELECT id FROM public.families WHERE primary_parent_id = auth.uid()
    )
  );

-- ============================================================
-- families RLS policies (deferred until family_members exists)
-- ============================================================
CREATE POLICY "families_select_own" ON public.families
  FOR SELECT USING (
    primary_parent_id = auth.uid()
    OR id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "families_update_primary_parent" ON public.families
  FOR UPDATE USING (primary_parent_id = auth.uid());

CREATE POLICY "families_insert_own" ON public.families
  FOR INSERT WITH CHECK (primary_parent_id = auth.uid());

-- ============================================================
-- special_adult_assignments
-- ============================================================
CREATE TABLE public.special_adult_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  special_adult_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(special_adult_id, child_id)
);

CREATE INDEX idx_saa_family ON public.special_adult_assignments(family_id);
CREATE INDEX idx_saa_adult ON public.special_adult_assignments(special_adult_id);
CREATE INDEX idx_saa_child ON public.special_adult_assignments(child_id);

ALTER TABLE public.special_adult_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saa_select_own_family" ON public.special_adult_assignments
  FOR SELECT USING (
    family_id IN (
      SELECT id FROM public.families WHERE primary_parent_id = auth.uid()
    )
    OR special_adult_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "saa_manage_primary_parent" ON public.special_adult_assignments
  FOR ALL USING (
    family_id IN (
      SELECT id FROM public.families WHERE primary_parent_id = auth.uid()
    )
  );

-- ============================================================
-- subscription_tiers (seed data)
-- ============================================================
CREATE TABLE public.subscription_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_monthly DECIMAL NOT NULL,
  price_yearly DECIMAL NOT NULL,
  founding_discount DECIMAL,
  monthly_ai_allotment INTEGER NOT NULL,
  features_summary JSONB,
  sort_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_st_slug ON public.subscription_tiers(slug);
CREATE INDEX idx_st_active ON public.subscription_tiers(is_active) WHERE is_active = true;

CREATE TRIGGER trg_st_updated_at
  BEFORE UPDATE ON public.subscription_tiers
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "st_public_read" ON public.subscription_tiers
  FOR SELECT USING (true);

-- Seed tiers (PRD-31 authoritative pricing)
INSERT INTO public.subscription_tiers (name, slug, price_monthly, price_yearly, founding_discount, monthly_ai_allotment, sort_order) VALUES
  ('Essential', 'essential', 9.99, 99.99, 2.00, 100, 1),
  ('Enhanced', 'enhanced', 16.99, 169.99, 3.00, 300, 2),
  ('Full Magic', 'full_magic', 24.99, 249.99, 4.00, 750, 3),
  ('Creator', 'creator', 39.99, 399.99, 5.00, 2000, 4);

-- ============================================================
-- family_subscriptions
-- ============================================================
CREATE TABLE public.family_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL UNIQUE REFERENCES public.families(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),
  status TEXT NOT NULL CHECK (status IN ('active','past_due','cancelled','trialing')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  pending_tier_id UUID REFERENCES public.subscription_tiers(id),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  past_due_since TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fs_family ON public.family_subscriptions(family_id);
CREATE INDEX idx_fs_stripe_cust ON public.family_subscriptions(stripe_customer_id);
CREATE INDEX idx_fs_status ON public.family_subscriptions(status);

CREATE TRIGGER trg_fs_updated_at
  BEFORE UPDATE ON public.family_subscriptions
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.family_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fs_select_own_family" ON public.family_subscriptions
  FOR SELECT USING (
    family_id IN (
      SELECT id FROM public.families WHERE primary_parent_id = auth.uid()
    )
  );

-- ============================================================
-- feature_key_registry
-- ============================================================
CREATE TABLE public.feature_key_registry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  prd_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fkr_key ON public.feature_key_registry(feature_key);

ALTER TABLE public.feature_key_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fkr_public_read" ON public.feature_key_registry
  FOR SELECT USING (true);

-- ============================================================
-- Auto-create family + member on auth signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
  default_tier_id UUID;
BEGIN
  -- Create family
  INSERT INTO public.families (primary_parent_id, family_name, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'My Family'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Chicago')
  )
  RETURNING id INTO new_family_id;

  -- Create mom's family_member record
  INSERT INTO public.family_members (
    family_id, user_id, display_name, role, login_method
  )
  VALUES (
    new_family_id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Mom'),
    'primary_parent',
    'email'
  );

  -- Create subscription on Essential tier (all features enabled during beta)
  SELECT id INTO default_tier_id FROM public.subscription_tiers
    WHERE slug = 'essential' LIMIT 1;

  IF default_tier_id IS NOT NULL THEN
    INSERT INTO public.family_subscriptions (family_id, tier_id, status)
    VALUES (new_family_id, default_tier_id, 'active');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Lookup family by login name (for PIN login flow)
-- ============================================================
CREATE OR REPLACE FUNCTION public.lookup_family_by_login_name(login_name TEXT)
RETURNS TABLE(family_id UUID, family_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.family_name
  FROM public.families f
  WHERE f.family_login_name_lower = lower(login_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Get family members for PIN login (public, no auth required)
-- Returns only active members with their login method
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_family_login_members(p_family_id UUID)
RETURNS TABLE(
  member_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  login_method TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT fm.id, fm.display_name, fm.avatar_url, fm.login_method
  FROM public.family_members fm
  WHERE fm.family_id = p_family_id
    AND fm.is_active = true
  ORDER BY
    CASE fm.role
      WHEN 'primary_parent' THEN 1
      WHEN 'additional_adult' THEN 2
      WHEN 'special_adult' THEN 3
      WHEN 'independent' THEN 4
      WHEN 'guided' THEN 5
      WHEN 'play' THEN 6
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
