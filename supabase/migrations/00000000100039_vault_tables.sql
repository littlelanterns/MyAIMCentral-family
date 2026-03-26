-- PRD-21A: AI Vault — Browse & Content Delivery
-- 12 new tables + modified tables + seed data
-- Includes future columns from PRD-21B (last_published_at) and PRD-21C (heart_count, comment_count, satisfaction_positive, satisfaction_negative, shared_with_member_id)
-- content_type 'curation' per PRD-21B addendum (renamed from 'tool_collection')

-- ============================================================
-- 1. vault_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vault_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_vault_categories_updated_at
  BEFORE UPDATE ON public.vault_categories
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.vault_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_categories_read_authenticated" ON public.vault_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "vault_categories_admin_write" ON public.vault_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_vc2_slug ON public.vault_categories(slug);
CREATE INDEX IF NOT EXISTS idx_vc2_active ON public.vault_categories(is_active) WHERE is_active = true;

-- ============================================================
-- 2. vault_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vault_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Titles (two-layer: hook visible to all, detail tier-gated)
  display_title TEXT NOT NULL,
  detail_title TEXT,
  short_description TEXT NOT NULL,
  full_description TEXT,
  -- Content type taxonomy (6 types, 'curation' per PRD-21B addendum)
  content_type TEXT NOT NULL CHECK (content_type IN ('tutorial', 'ai_tool', 'prompt_pack', 'curation', 'workflow', 'skill')),
  prompt_format TEXT CHECK (prompt_format IN ('text_llm', 'image_gen', 'video_gen', 'audio_gen')),
  delivery_method TEXT CHECK (delivery_method IN ('native', 'embedded', 'link_out')),
  category_id UUID NOT NULL REFERENCES public.vault_categories(id) ON DELETE RESTRICT,
  ladder_position TEXT CHECK (ladder_position IN ('fun_creative', 'practical', 'creator')),
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  -- Media
  thumbnail_url TEXT,
  preview_image_url TEXT,
  -- Content body
  content_body TEXT,
  content_url TEXT,
  -- Tool-specific fields
  tool_url TEXT,
  guided_mode_key TEXT,
  platform TEXT,
  target_platforms TEXT[] NOT NULL DEFAULT '{}',
  auth_provider TEXT,
  requires_auth BOOLEAN NOT NULL DEFAULT false,
  -- LiLa optimization
  enable_lila_optimization BOOLEAN NOT NULL DEFAULT false,
  lila_optimization_prompt TEXT,
  -- Tier gating
  allowed_tiers TEXT[] NOT NULL DEFAULT '{}',
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  -- Feature flags
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT true,
  first_seen_tracking BOOLEAN NOT NULL DEFAULT true,
  new_badge_duration_days INTEGER NOT NULL DEFAULT 30,
  teen_visible BOOLEAN NOT NULL DEFAULT false,
  -- Seasonal
  seasonal_tags TEXT[] NOT NULL DEFAULT '{}',
  gift_idea_tags TEXT[] NOT NULL DEFAULT '{}',
  seasonal_priority INTEGER NOT NULL DEFAULT 0,
  -- Tool portal
  portal_description TEXT,
  portal_tips TEXT[] NOT NULL DEFAULT '{}',
  prerequisites_text TEXT,
  learning_outcomes TEXT[] NOT NULL DEFAULT '{}',
  estimated_minutes INTEGER,
  -- Usage limits
  enable_usage_limits BOOLEAN NOT NULL DEFAULT false,
  usage_limit_type TEXT CHECK (usage_limit_type IN ('daily', 'weekly', 'monthly', 'total')),
  usage_limit_amount INTEGER,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 60,
  -- Display
  display_order INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  -- Admin
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- PRD-21B future column
  last_published_at TIMESTAMPTZ,
  -- PRD-21C future columns (denormalized engagement counters)
  heart_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  satisfaction_positive INTEGER NOT NULL DEFAULT 0,
  satisfaction_negative INTEGER NOT NULL DEFAULT 0
);

CREATE TRIGGER trg_vault_items_updated_at
  BEFORE UPDATE ON public.vault_items
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

-- Published items readable by all authenticated users
CREATE POLICY "vault_items_read_published" ON public.vault_items
  FOR SELECT TO authenticated USING (status = 'published');

-- Draft/archived readable by admin only
CREATE POLICY "vault_items_read_admin" ON public.vault_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
  );

-- Write access admin-only
CREATE POLICY "vault_items_admin_write" ON public.vault_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
  );

-- Also allow service_role inserts (for CLI helper script)
CREATE POLICY "vault_items_service_insert" ON public.vault_items
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_vi_category ON public.vault_items(category_id);
CREATE INDEX IF NOT EXISTS idx_vi_content_type ON public.vault_items(content_type);
CREATE INDEX IF NOT EXISTS idx_vi_status ON public.vault_items(status);
CREATE INDEX IF NOT EXISTS idx_vi_tags_gin ON public.vault_items USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_vi_seasonal_tags_gin ON public.vault_items USING gin(seasonal_tags);
CREATE INDEX IF NOT EXISTS idx_vi_display_order ON public.vault_items(category_id, display_order);
CREATE INDEX IF NOT EXISTS idx_vi_featured ON public.vault_items(is_featured) WHERE is_featured = true;

-- Full-text search: trigger-maintained tsvector column
ALTER TABLE public.vault_items ADD COLUMN IF NOT EXISTS fts_document tsvector;

CREATE OR REPLACE FUNCTION util.vault_items_fts_update() RETURNS trigger AS $$
BEGIN
  NEW.fts_document := to_tsvector('english',
    coalesce(NEW.display_title, '') || ' ' ||
    coalesce(NEW.detail_title, '') || ' ' ||
    coalesce(NEW.short_description, '') || ' ' ||
    coalesce(NEW.full_description, '') || ' ' ||
    array_to_string(NEW.tags, ' ')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vault_items_fts
  BEFORE INSERT OR UPDATE ON public.vault_items
  FOR EACH ROW EXECUTE FUNCTION util.vault_items_fts_update();

CREATE INDEX IF NOT EXISTS idx_vi_fts ON public.vault_items USING gin(fts_document);

-- ============================================================
-- 3. vault_prompt_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vault_prompt_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_item_id UUID NOT NULL REFERENCES public.vault_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  variable_placeholders TEXT[] NOT NULL DEFAULT '{}',
  example_outputs TEXT[] NOT NULL DEFAULT '{}',
  reference_images TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_vault_prompt_entries_updated_at
  BEFORE UPDATE ON public.vault_prompt_entries
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.vault_prompt_entries ENABLE ROW LEVEL SECURITY;

-- Readable by authenticated users who can access parent vault_item (published)
CREATE POLICY "vault_prompt_entries_read" ON public.vault_prompt_entries
  FOR SELECT TO authenticated USING (
    vault_item_id IN (SELECT id FROM public.vault_items WHERE status = 'published')
    OR EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
  );

CREATE POLICY "vault_prompt_entries_admin_write" ON public.vault_prompt_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
  );

CREATE POLICY "vault_prompt_entries_service_insert" ON public.vault_prompt_entries
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_vpe_item ON public.vault_prompt_entries(vault_item_id);
CREATE INDEX IF NOT EXISTS idx_vpe_sort ON public.vault_prompt_entries(vault_item_id, sort_order);

-- ============================================================
-- 4. vault_collection_items (join table for curations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vault_collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.vault_items(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.vault_items(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (collection_id, item_id)
);

ALTER TABLE public.vault_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_collection_items_read" ON public.vault_collection_items
  FOR SELECT TO authenticated USING (
    collection_id IN (SELECT id FROM public.vault_items WHERE status = 'published')
    OR EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
  );

CREATE POLICY "vault_collection_items_admin_write" ON public.vault_collection_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_vci_collection ON public.vault_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_vci_item ON public.vault_collection_items(item_id);

-- ============================================================
-- 5. vault_user_bookmarks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vault_user_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  vault_item_id UUID NOT NULL REFERENCES public.vault_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, vault_item_id)
);

ALTER TABLE public.vault_user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_bookmarks_own" ON public.vault_user_bookmarks
  FOR ALL USING (
    user_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_vub_user_item ON public.vault_user_bookmarks(user_id, vault_item_id);

-- ============================================================
-- 6. vault_user_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vault_user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  vault_item_id UUID NOT NULL REFERENCES public.vault_items(id) ON DELETE CASCADE,
  progress_status TEXT NOT NULL DEFAULT 'not_started' CHECK (progress_status IN ('not_started', 'in_progress', 'completed')),
  progress_percent INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, vault_item_id)
);

CREATE TRIGGER trg_vault_user_progress_updated_at
  BEFORE UPDATE ON public.vault_user_progress
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.vault_user_progress ENABLE ROW LEVEL SECURITY;

-- Users CRUD their own progress
CREATE POLICY "vault_progress_own" ON public.vault_user_progress
  FOR ALL USING (
    user_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Mom can read all family members' progress
CREATE POLICY "vault_progress_mom_read" ON public.vault_user_progress
  FOR SELECT USING (
    user_id IN (
      SELECT fm.id FROM public.family_members fm
      JOIN public.families f ON fm.family_id = f.id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_vup_user ON public.vault_user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_vup_item ON public.vault_user_progress(vault_item_id);
CREATE INDEX IF NOT EXISTS idx_vup_status ON public.vault_user_progress(user_id, progress_status);

-- ============================================================
-- 7. vault_user_visits
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vault_user_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vault_user_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_visits_own" ON public.vault_user_visits
  FOR ALL USING (
    user_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_vuv_user ON public.vault_user_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_vuv_visited ON public.vault_user_visits(visited_at DESC);

-- ============================================================
-- 8. vault_first_sightings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vault_first_sightings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  vault_item_id UUID NOT NULL REFERENCES public.vault_items(id) ON DELETE CASCADE,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, vault_item_id)
);

ALTER TABLE public.vault_first_sightings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_sightings_own" ON public.vault_first_sightings
  FOR ALL USING (
    user_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_vfs_user_item ON public.vault_first_sightings(user_id, vault_item_id);

-- ============================================================
-- 9. vault_tool_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vault_tool_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  vault_item_id UUID NOT NULL REFERENCES public.vault_items(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.vault_tool_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_sessions_own" ON public.vault_tool_sessions
  FOR ALL USING (
    user_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "vault_sessions_admin_read" ON public.vault_tool_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_vts_token ON public.vault_tool_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_vts_user ON public.vault_tool_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_vts_active ON public.vault_tool_sessions(user_id) WHERE is_active = true;

-- ============================================================
-- 10. vault_copy_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vault_copy_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  vault_item_id UUID NOT NULL REFERENCES public.vault_items(id) ON DELETE CASCADE,
  prompt_entry_id UUID REFERENCES public.vault_prompt_entries(id) ON DELETE SET NULL,
  copied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vault_copy_events ENABLE ROW LEVEL SECURITY;

-- Insert-only for authenticated users
CREATE POLICY "vault_copy_events_insert" ON public.vault_copy_events
  FOR INSERT TO authenticated WITH CHECK (
    user_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Read admin-only
CREATE POLICY "vault_copy_events_admin_read" ON public.vault_copy_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_vce_user ON public.vault_copy_events(user_id);
CREATE INDEX IF NOT EXISTS idx_vce_item ON public.vault_copy_events(vault_item_id);

-- ============================================================
-- 11. user_saved_prompts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_saved_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  source_vault_item_id UUID REFERENCES public.vault_items(id) ON DELETE SET NULL,
  source_prompt_entry_id UUID REFERENCES public.vault_prompt_entries(id) ON DELETE SET NULL,
  is_lila_optimized BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- PRD-21C future column
  shared_with_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL
);

CREATE TRIGGER trg_user_saved_prompts_updated_at
  BEFORE UPDATE ON public.user_saved_prompts
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.user_saved_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_saved_prompts_own" ON public.user_saved_prompts
  FOR ALL USING (
    user_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_usp_user ON public.user_saved_prompts(user_id);

-- ============================================================
-- 12. vault_content_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vault_content_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  description TEXT,
  category_suggestion TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'planned', 'completed', 'declined')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_vault_content_requests_updated_at
  BEFORE UPDATE ON public.vault_content_requests
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.vault_content_requests ENABLE ROW LEVEL SECURITY;

-- Users can create and read their own requests
CREATE POLICY "vault_requests_own" ON public.vault_content_requests
  FOR ALL USING (
    user_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Admin can read/update all
CREATE POLICY "vault_requests_admin" ON public.vault_content_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_vcr_status ON public.vault_content_requests(status);

-- ============================================================
-- ALTER EXISTING TABLES
-- ============================================================

-- lila_tool_permissions: add source, vault_item_id, saved_prompt_id
ALTER TABLE public.lila_tool_permissions
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'default' CHECK (source IN ('default', 'vault')),
  ADD COLUMN IF NOT EXISTS vault_item_id UUID REFERENCES public.vault_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS saved_prompt_id UUID;
  -- saved_prompt_id FK deferred: REFERENCES public.user_saved_prompts(id) ON DELETE SET NULL
  -- (adding as plain UUID to avoid circular dependency issues; FK can be added in a future migration)

-- archive_member_settings: add physical_description, reference_photos
ALTER TABLE public.archive_member_settings
  ADD COLUMN IF NOT EXISTS physical_description TEXT,
  ADD COLUMN IF NOT EXISTS reference_photos TEXT[] DEFAULT '{}';

-- ============================================================
-- SEED CATEGORIES
-- ============================================================
INSERT INTO public.vault_categories (slug, display_name, description, icon, sort_order) VALUES
  ('creative-fun', 'Creative & Fun', 'AI-powered creative projects, coloring pages, storybook characters, and visual design', 'Palette', 1),
  ('home-management', 'Home Management', 'Practical AI tools for meal planning, scheduling, organization, and daily life', 'Home', 2),
  ('ai-learning', 'AI Learning Path', 'Learn AI fundamentals through hands-on tutorials and guided projects', 'GraduationCap', 3),
  ('homeschool', 'Homeschool & Education', 'AI-powered educational tools, curriculum support, and learning resources', 'BookOpen', 4),
  ('ai-skills', 'AI Skills', 'Deployable AI instruction sets for Claude, ChatGPT, and Gemini', 'Wand2', 5),
  ('productivity', 'Productivity & Planning', 'AI workflows for project planning, content creation, and getting things done', 'Target', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- REGISTER FEATURE KEYS
-- ============================================================
INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source) VALUES
  ('vault_browse', 'AI Vault Browse', 'Access to browse the AI Vault content library', 'PRD-21A'),
  ('vault_consume', 'AI Vault Consume', 'Access to open and consume Vault content', 'PRD-21A'),
  ('vault_optimize_lila', 'Vault Optimize with LiLa', 'Access to Optimize with LiLa on Vault items', 'PRD-21A'),
  ('vault_toolbox_assign', 'Vault Toolbox Assign', 'Access to +Add to AI Toolbox assignment', 'PRD-21A'),
  ('vault_prompt_library', 'Personal Prompt Library', 'Access to personal saved prompts', 'PRD-21A'),
  ('vault_request_content', 'Vault Content Requests', 'Access to submit content requests', 'PRD-21A')
ON CONFLICT (feature_key) DO NOTHING;

-- Register feature access for role groups (all enabled during beta)
INSERT INTO public.feature_access_v2 (feature_key, role_group, is_enabled) VALUES
  ('vault_browse', 'mom', true),
  ('vault_browse', 'dad_adults', true),
  ('vault_consume', 'mom', true),
  ('vault_consume', 'dad_adults', true),
  ('vault_consume', 'independent_teens', true),
  ('vault_optimize_lila', 'mom', true),
  ('vault_optimize_lila', 'dad_adults', true),
  ('vault_toolbox_assign', 'mom', true),
  ('vault_prompt_library', 'mom', true),
  ('vault_prompt_library', 'dad_adults', true),
  ('vault_request_content', 'mom', true),
  ('vault_request_content', 'dad_adults', true)
ON CONFLICT DO NOTHING;
