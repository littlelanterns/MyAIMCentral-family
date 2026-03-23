-- MyAIM Central v2 — Phase 08: LiLa Core AI System (PRD-05, PRD-05C)
-- Tables: lila_conversations, lila_messages, lila_guided_modes,
--         lila_tool_permissions, lila_member_preferences, ai_usage_tracking

-- ============================================================
-- LiLa Guided Modes Registry
-- ============================================================

CREATE TABLE public.lila_guided_modes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mode_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  model_tier TEXT NOT NULL CHECK (model_tier IN ('sonnet','haiku')),
  avatar_set TEXT,
  context_sources TEXT[],
  person_selector BOOLEAN NOT NULL DEFAULT false,
  available_to_roles TEXT[],
  requires_feature_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lgm_key ON public.lila_guided_modes(mode_key);

ALTER TABLE public.lila_guided_modes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lgm_select_authenticated" ON public.lila_guided_modes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- LiLa Conversations
-- ============================================================

CREATE TABLE public.lila_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  guided_mode TEXT REFERENCES public.lila_guided_modes(mode_key),
  title TEXT,
  container_type TEXT NOT NULL CHECK (container_type IN ('drawer','modal')),
  page_context TEXT,
  is_included_in_ai BOOLEAN NOT NULL DEFAULT true,
  is_safe_harbor BOOLEAN NOT NULL DEFAULT false,
  vault_item_id UUID,
  safety_scanned BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lc_family_member ON public.lila_conversations(family_id, member_id);
CREATE INDEX idx_lc_status ON public.lila_conversations(status);
CREATE INDEX idx_lc_guided ON public.lila_conversations(guided_mode);
CREATE INDEX idx_lc_vault ON public.lila_conversations(vault_item_id)
  WHERE vault_item_id IS NOT NULL;

CREATE TRIGGER trg_lc_updated_at
  BEFORE UPDATE ON public.lila_conversations
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.lila_conversations ENABLE ROW LEVEL SECURITY;

-- Member can manage own conversations
CREATE POLICY "lc_manage_own" ON public.lila_conversations
  FOR ALL USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Parent can read children's conversations (except safe_harbor)
CREATE POLICY "lc_select_parent" ON public.lila_conversations
  FOR SELECT USING (
    is_safe_harbor = false
    AND family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- ============================================================
-- LiLa Messages
-- ============================================================

CREATE TABLE public.lila_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.lila_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  message_type TEXT,
  metadata JSONB,
  safety_scanned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lm_conversation ON public.lila_messages(conversation_id);
CREATE INDEX idx_lm_created ON public.lila_messages(created_at);
CREATE INDEX idx_lm_safety ON public.lila_messages(conversation_id, safety_scanned)
  WHERE safety_scanned = false;

ALTER TABLE public.lila_messages ENABLE ROW LEVEL SECURITY;

-- Inherits from lila_conversations
CREATE POLICY "lm_select_via_conversation" ON public.lila_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.lila_conversations
      WHERE member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    )
    OR conversation_id IN (
      SELECT id FROM public.lila_conversations
      WHERE is_safe_harbor = false
        AND family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    )
  );

CREATE POLICY "lm_insert_own" ON public.lila_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.lila_conversations
      WHERE member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    )
  );

-- ============================================================
-- LiLa Tool Permissions
-- ============================================================

CREATE TABLE public.lila_tool_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  mode_key TEXT NOT NULL REFERENCES public.lila_guided_modes(mode_key),
  is_granted BOOLEAN NOT NULL DEFAULT false,
  granted_by UUID NOT NULL REFERENCES public.family_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ltp_family_member ON public.lila_tool_permissions(family_id, member_id);
CREATE INDEX idx_ltp_mode ON public.lila_tool_permissions(mode_key);

CREATE TRIGGER trg_ltp_updated_at
  BEFORE UPDATE ON public.lila_tool_permissions
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.lila_tool_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ltp_manage_parent" ON public.lila_tool_permissions
  FOR ALL USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

CREATE POLICY "ltp_select_own" ON public.lila_tool_permissions
  FOR SELECT USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- LiLa Member Preferences (PRD-22)
-- ============================================================

CREATE TABLE public.lila_member_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  tone TEXT NOT NULL DEFAULT 'warm' CHECK (tone IN ('warm','professional','casual')),
  response_length TEXT NOT NULL DEFAULT 'balanced' CHECK (response_length IN ('concise','balanced','detailed')),
  history_retention TEXT NOT NULL DEFAULT 'forever' CHECK (history_retention IN ('forever','90_days','30_days','7_days')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_lmp_family_member ON public.lila_member_preferences(family_id, member_id);

CREATE TRIGGER trg_lmp_updated_at
  BEFORE UPDATE ON public.lila_member_preferences
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.lila_member_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lmp_manage_own" ON public.lila_member_preferences
  FOR ALL USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "lmp_select_parent" ON public.lila_member_preferences
  FOR SELECT USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- ============================================================
-- AI Usage Tracking (PRD-05C)
-- ============================================================

CREATE TABLE public.ai_usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  estimated_cost DECIMAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aut_family ON public.ai_usage_tracking(family_id);
CREATE INDEX idx_aut_member ON public.ai_usage_tracking(member_id);
CREATE INDEX idx_aut_created ON public.ai_usage_tracking(created_at DESC);

ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aut_select_parent" ON public.ai_usage_tracking
  FOR SELECT USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

CREATE POLICY "aut_insert_service" ON public.ai_usage_tracking
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- Seed: Guided Modes (40+ modes from all PRDs)
-- ============================================================

INSERT INTO public.lila_guided_modes (mode_key, display_name, model_tier, avatar_set, context_sources, person_selector, available_to_roles, requires_feature_key) VALUES
  -- Core (PRD-05)
  ('help', 'LiLa Help', 'sonnet', 'happy_to_help', NULL, false, NULL, 'lila_help'),
  ('assist', 'LiLa Assist', 'sonnet', 'your_guide', NULL, false, NULL, 'lila_assist'),
  ('optimizer', 'LiLa Optimizer', 'sonnet', 'smart_ai', NULL, false, NULL, 'lila_optimizer'),
  ('general', 'Sitting LiLa', 'sonnet', 'resting', NULL, false, NULL, NULL),

  -- Relationship / Communication (PRD-21)
  ('quality_time', 'Quality Time', 'sonnet', NULL, '{"guiding_stars","self_knowledge","relationship_notes"}', true, '{"mom","dad_adults"}', 'tool_quality_time'),
  ('gifts', 'Gifts', 'sonnet', NULL, '{"guiding_stars","self_knowledge","relationship_notes"}', true, '{"mom","dad_adults"}', 'tool_gifts'),
  ('observe_serve', 'Observe & Serve', 'sonnet', NULL, '{"guiding_stars","self_knowledge","relationship_notes"}', true, '{"mom","dad_adults"}', 'tool_observe_serve'),
  ('words_affirmation', 'Words of Affirmation', 'sonnet', NULL, '{"guiding_stars","self_knowledge","relationship_notes"}', true, '{"mom","dad_adults"}', 'tool_words_affirmation'),
  ('gratitude', 'Gratitude', 'sonnet', NULL, '{"guiding_stars","self_knowledge"}', true, '{"mom","dad_adults"}', 'tool_gratitude'),
  ('cyrano', 'Cyrano', 'sonnet', NULL, '{"guiding_stars","self_knowledge","relationship_notes"}', true, '{"mom","dad_adults"}', 'tool_cyrano'),
  ('higgins_say', 'What to Say', 'sonnet', NULL, '{"guiding_stars","self_knowledge","relationship_notes"}', true, '{"mom","dad_adults"}', 'tool_higgins_say'),
  ('higgins_navigate', 'How to Navigate', 'sonnet', NULL, '{"guiding_stars","self_knowledge","relationship_notes"}', true, '{"mom","dad_adults"}', 'tool_higgins_navigate'),

  -- Personal Growth (PRD-06, 07, 12A, 12B)
  ('craft_with_lila', 'Craft with LiLa', 'sonnet', NULL, '{"guiding_stars","best_intentions"}', false, NULL, 'guiding_stars_ai_craft'),
  ('self_discovery', 'Self-Discovery', 'sonnet', NULL, '{"self_knowledge"}', false, NULL, 'innerworkings_discovery'),
  ('life_lantern', 'LifeLantern', 'sonnet', NULL, '{"guiding_stars","self_knowledge","life_lantern_areas"}', false, '{"mom","dad_adults","independent_teens"}', 'life_lantern'),
  ('family_vision_quest', 'Family Vision Quest', 'sonnet', NULL, '{"family_vision_statements","guiding_stars"}', false, '{"mom","dad_adults"}', 'family_vision_quest'),

  -- Calendar / Meetings (PRD-14B, PRD-16)
  ('calendar_event_create', 'Calendar Intake', 'sonnet', NULL, '{"calendar_events"}', false, NULL, 'calendar_ai_intake'),
  ('meeting', 'Meeting Facilitator', 'sonnet', NULL, '{"meetings","guiding_stars","family_vision_statements"}', false, '{"mom","dad_adults"}', 'meetings_ai'),

  -- Family Context (PRD-19)
  ('family_context_interview', 'Family Context', 'sonnet', NULL, '{"archive_context_items","self_knowledge"}', true, '{"mom"}', 'archives_guided_interview'),

  -- Safe Harbor (PRD-20)
  ('safe_harbor', 'Safe Harbor', 'sonnet', NULL, NULL, false, '{"mom","dad_adults","independent_teens"}', 'safe_harbor'),
  ('safe_harbor_guided', 'Help Me Talk to Someone', 'haiku', NULL, NULL, false, '{"guided_kids"}', 'safe_harbor_guided'),
  ('safe_harbor_orientation', 'Safe Harbor Orientation', 'sonnet', NULL, NULL, false, '{"mom"}', 'safe_harbor'),
  ('safe_harbor_literacy', 'AI Literacy Module', 'haiku', NULL, NULL, false, '{"independent_teens"}', 'safe_harbor'),

  -- ThoughtSift (PRD-34)
  ('board_of_directors', 'Board of Directors', 'sonnet', NULL, '{"guiding_stars","self_knowledge","best_intentions"}', false, '{"mom","dad_adults"}', 'thoughtsift_board_of_directors'),
  ('perspective_shifter', 'Perspective Shifter', 'sonnet', NULL, '{"guiding_stars","self_knowledge"}', false, '{"mom","dad_adults"}', 'thoughtsift_perspective_shifter'),
  ('decision_guide', 'Decision Guide', 'sonnet', NULL, '{"guiding_stars","self_knowledge","best_intentions"}', false, '{"mom","dad_adults"}', 'thoughtsift_decision_guide'),
  ('mediator', 'Mediator', 'sonnet', NULL, '{"self_knowledge","relationship_notes"}', true, '{"mom","dad_adults"}', 'thoughtsift_mediator'),
  ('translator', 'Translator', 'haiku', NULL, NULL, false, '{"mom","dad_adults","independent_teens"}', 'thoughtsift_translator'),

  -- BigPlans (PRD-29)
  ('bigplans_planning', 'BigPlans', 'sonnet', NULL, '{"guiding_stars","best_intentions"}', false, NULL, 'bigplans_create'),
  ('bigplans_friction_finder', 'Friction Finder', 'sonnet', NULL, '{"guiding_stars","best_intentions"}', false, NULL, 'bigplans_friction_detection'),
  ('bigplans_checkin', 'Check In', 'sonnet', NULL, '{"guiding_stars","best_intentions"}', false, NULL, 'bigplans_check_ins'),
  ('bigplans_system_design_trial', 'System Design Trial', 'sonnet', NULL, NULL, false, NULL, 'bigplans_system_design'),
  ('bigplans_deployed_component', 'Deployed Support', 'sonnet', NULL, NULL, false, NULL, 'bigplans_system_design'),

  -- BookShelf (PRD-23)
  ('book_discussion', 'Book Discussion', 'sonnet', NULL, '{"bookshelf_chunks","bookshelf_summaries"}', false, NULL, 'bookshelf_discuss'),

  -- Compliance / Reporting (PRD-28B, PRD-28, PRD-37)
  ('homeschool_report_generation', 'Report Generation', 'sonnet', NULL, NULL, false, '{"mom","dad_adults"}', 'compliance_ai_reports'),
  ('homeschool_time_review', 'Time Log Review', 'sonnet', NULL, NULL, false, '{"mom","dad_adults"}', 'tracking_homeschool_time'),
  ('homeschool_bulk_summary', 'Bulk Summary', 'sonnet', NULL, NULL, false, '{"mom","dad_adults"}', 'family_feed_bulk_summary');

-- ============================================================
-- Feature Key Seeds (PRD-05, PRD-05C)
-- ============================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source) VALUES
  ('lila_drawer', 'LiLa Drawer', 'Bottom pull-up LiLa drawer (mom shell)', 'PRD-05'),
  ('lila_help', 'LiLa Help', 'Customer support and troubleshooting mode', 'PRD-05'),
  ('lila_assist', 'LiLa Assist', 'Feature guidance and onboarding mode', 'PRD-05'),
  ('lila_modal_access', 'LiLa Modal', 'Modal access to LiLa (non-mom shells)', 'PRD-05'),
  ('lila_optimizer', 'LiLa Optimizer', 'Prompt optimization with family context', 'PRD-05C'),
  ('optimizer_templates', 'Optimizer Templates', 'User prompt template library', 'PRD-05C'),
  ('optimizer_context_presets', 'Context Presets', 'Saved context assembly presets', 'PRD-05C'),
  ('optimizer_credits', 'Optimizer Credits', 'AI credit tracking for optimizer', 'PRD-05C')
ON CONFLICT (feature_key) DO NOTHING;
