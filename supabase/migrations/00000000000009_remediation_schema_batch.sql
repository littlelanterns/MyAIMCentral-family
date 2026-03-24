-- ============================================================================
-- REMEDIATION MIGRATION — Batch Schema Corrections
-- Generated: 2026-03-23 from PRD Consistency Audit
-- Purpose: Add missing columns, create missing tables, fix types
-- Rule: ADDITIVE ONLY. Never DROP columns or tables.
-- ============================================================================

-- ============================================================================
-- SECTION 1: family_members — Add dashboard_mode + PRD-01 missing columns
-- Founder Ruling: 4 roles + separate dashboard_mode
-- ============================================================================

-- Add dashboard_mode column (PRD-01: mom-assigned shell experience)
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS dashboard_mode TEXT
    CHECK (dashboard_mode IN ('adult', 'independent', 'guided', 'play'));

-- Populate dashboard_mode from current role values for non-structural roles
UPDATE family_members SET dashboard_mode = 'independent' WHERE role = 'independent';
UPDATE family_members SET dashboard_mode = 'guided' WHERE role = 'guided';
UPDATE family_members SET dashboard_mode = 'play' WHERE role = 'play';
UPDATE family_members SET dashboard_mode = 'adult' WHERE role IN ('additional_adult', 'special_adult');
-- primary_parent has no dashboard_mode (always MomShell)

-- Add PRD-01 missing columns
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS nicknames TEXT[] DEFAULT '{}' NOT NULL,
  ADD COLUMN IF NOT EXISTS relationship TEXT
    CHECK (relationship IN ('self', 'spouse', 'child', 'special')),
  ADD COLUMN IF NOT EXISTS custom_role TEXT,
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS in_household BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS dashboard_enabled BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS out_of_nest BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS invite_status TEXT
    CHECK (invite_status IN ('pending', 'accepted', 'expired')),
  ADD COLUMN IF NOT EXISTS invite_token TEXT,
  ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false NOT NULL;

-- PRD-03: Theme preferences
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS assigned_color TEXT,
  ADD COLUMN IF NOT EXISTS theme_preferences JSONB DEFAULT '{}' NOT NULL;

-- PRD-04: Layout preferences
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS layout_preferences JSONB DEFAULT '{}' NOT NULL;

-- PRD-10: Game piece
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS assigned_color_token TEXT,
  ADD COLUMN IF NOT EXISTS game_piece_shape TEXT;

-- PRD-24: Streak grace (already has gamification_points etc from migration 01)
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS streak_grace_used_today BOOLEAN DEFAULT false NOT NULL;

-- Member preferences for FeatureGuide dismissals
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}' NOT NULL;

-- Index on invite_token for lookup
CREATE INDEX IF NOT EXISTS idx_fm_invite_token ON family_members (invite_token) WHERE invite_token IS NOT NULL;

-- ============================================================================
-- SECTION 2: families — PRD-01/04 missing columns
-- ============================================================================

ALTER TABLE families
  ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS hub_config JSONB DEFAULT '{}' NOT NULL;

-- ============================================================================
-- SECTION 3: guiding_stars — PRD-06 missing columns
-- ============================================================================

ALTER TABLE guiding_stars
  ADD COLUMN IF NOT EXISTS owner_type TEXT DEFAULT 'member' NOT NULL
    CHECK (owner_type IN ('member', 'family')),
  ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'value' NOT NULL
    CHECK (entry_type IN ('value', 'declaration', 'scripture_quote', 'vision')),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS source_reference_id UUID,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS is_shared_with_partner BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Rename member_id to keep backward compat (add alias column)
-- Note: keeping member_id as-is for now; PRD uses owner_member_id but migration is additive

CREATE INDEX IF NOT EXISTS idx_gs_entry_type ON guiding_stars (family_id, member_id, entry_type, archived_at);
CREATE INDEX IF NOT EXISTS idx_gs_archived ON guiding_stars (family_id, member_id, archived_at);

-- ============================================================================
-- SECTION 4: best_intentions — PRD-06 missing columns
-- ============================================================================

ALTER TABLE best_intentions
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS source_reference_id UUID,
  ADD COLUMN IF NOT EXISTS related_member_ids UUID[],
  ADD COLUMN IF NOT EXISTS tracker_style TEXT DEFAULT 'counter' NOT NULL
    CHECK (tracker_style IN ('counter', 'bar_graph', 'streak')),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS is_shared_with_partner BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bi_active ON best_intentions (family_id, member_id, is_active, archived_at);

-- ============================================================================
-- SECTION 5: intention_iterations — PRD-06 missing columns
-- ============================================================================

ALTER TABLE intention_iterations
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id),
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES family_members(id),
  ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ADD COLUMN IF NOT EXISTS day_date DATE DEFAULT CURRENT_DATE NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ii_day ON intention_iterations (intention_id, day_date);
CREATE INDEX IF NOT EXISTS idx_ii_member_day ON intention_iterations (member_id, day_date);

-- ============================================================================
-- SECTION 6: self_knowledge — PRD-07 missing columns
-- ============================================================================

ALTER TABLE self_knowledge
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_reference_id UUID,
  ADD COLUMN IF NOT EXISTS file_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- PRD-07 uses is_shared_with_mom/is_shared_with_dad (migration has share_with_mom/share_with_dad)
-- These are functionally equivalent. Keep existing column names for now.

-- ============================================================================
-- SECTION 7: journal_entries — PRD-08 missing columns
-- ============================================================================

ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS life_area_tags TEXT[] DEFAULT '{}' NOT NULL,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual_text' NOT NULL,
  ADD COLUMN IF NOT EXISTS source_reference_id UUID,
  ADD COLUMN IF NOT EXISTS is_shared_with_mom BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS is_shared_with_dad BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS routed_to TEXT[] DEFAULT '{}' NOT NULL,
  ADD COLUMN IF NOT EXISTS routed_reference_ids JSONB DEFAULT '{}' NOT NULL,
  ADD COLUMN IF NOT EXISTS mood_tag TEXT,
  ADD COLUMN IF NOT EXISTS audio_file_path TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_je_life_area ON journal_entries USING gin (life_area_tags);

-- ============================================================================
-- SECTION 8: notepad_tabs — PRD-08 missing columns
-- ============================================================================

ALTER TABLE notepad_tabs
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL
    CHECK (status IN ('active', 'routed', 'archived')),
  ADD COLUMN IF NOT EXISTS routed_to TEXT,
  ADD COLUMN IF NOT EXISTS routed_reference_id UUID,
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual' NOT NULL
    CHECK (source_type IN ('manual', 'voice', 'edit_in_notepad', 'lila_optimizer')),
  ADD COLUMN IF NOT EXISTS source_reference_id UUID,
  ADD COLUMN IF NOT EXISTS is_auto_named BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- ============================================================================
-- SECTION 9: notepad_extracted_items — PRD-08 missing columns
-- ============================================================================

ALTER TABLE notepad_extracted_items
  ADD COLUMN IF NOT EXISTS family_id UUID,
  ADD COLUMN IF NOT EXISTS item_type TEXT
    CHECK (item_type IN ('action_item', 'reflection', 'revelation', 'value', 'victory', 'trackable', 'meeting_followup', 'list_item', 'general')),
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS routed_reference_id UUID;

-- ============================================================================
-- SECTION 10: tasks — PRD-09A missing prioritization columns
-- ============================================================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
  ADD COLUMN IF NOT EXISTS duration_estimate TEXT,
  ADD COLUMN IF NOT EXISTS incomplete_action TEXT DEFAULT 'auto_reschedule' NOT NULL,
  ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id),
  ADD COLUMN IF NOT EXISTS task_breaker_level TEXT
    CHECK (task_breaker_level IN ('quick', 'detailed', 'granular')),
  ADD COLUMN IF NOT EXISTS sequential_collection_id UUID,
  ADD COLUMN IF NOT EXISTS sequential_position INTEGER,
  ADD COLUMN IF NOT EXISTS sequential_is_active BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS max_completions INTEGER,
  ADD COLUMN IF NOT EXISTS claim_lock_duration INTEGER,
  ADD COLUMN IF NOT EXISTS claim_lock_unit TEXT,
  ADD COLUMN IF NOT EXISTS eisenhower_quadrant TEXT,
  ADD COLUMN IF NOT EXISTS frog_rank INTEGER,
  ADD COLUMN IF NOT EXISTS importance_level TEXT,
  ADD COLUMN IF NOT EXISTS big_rock BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS ivy_lee_rank INTEGER,
  ADD COLUMN IF NOT EXISTS abcde_category TEXT,
  ADD COLUMN IF NOT EXISTS moscow_category TEXT,
  ADD COLUMN IF NOT EXISTS impact_effort TEXT,
  ADD COLUMN IF NOT EXISTS kanban_status TEXT DEFAULT 'to_do',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS victory_flagged BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS completion_note TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_reference_id UUID,
  ADD COLUMN IF NOT EXISTS related_intention_id UUID,
  ADD COLUMN IF NOT EXISTS focus_time_seconds INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- PRD-36 additions
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS time_tracking_enabled BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS time_threshold_minutes INTEGER;

CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks (parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_sequential ON tasks (sequential_collection_id, sequential_position);
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks (family_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks (family_id, source);

-- ============================================================================
-- SECTION 11: lila_conversations — PRD-05 missing columns
-- ============================================================================

ALTER TABLE lila_conversations
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'general' NOT NULL,
  ADD COLUMN IF NOT EXISTS guided_subtype TEXT,
  ADD COLUMN IF NOT EXISTS guided_mode_reference_id UUID,
  ADD COLUMN IF NOT EXISTS model_used TEXT,
  ADD COLUMN IF NOT EXISTS context_snapshot JSONB DEFAULT '{}' NOT NULL,
  ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS token_usage JSONB DEFAULT '{"input": 0, "output": 0}' NOT NULL;

-- ============================================================================
-- SECTION 12: lila_guided_modes — PRD-05 missing columns
-- ============================================================================

ALTER TABLE lila_guided_modes
  ADD COLUMN IF NOT EXISTS parent_mode TEXT,
  ADD COLUMN IF NOT EXISTS avatar_key TEXT DEFAULT 'sitting' NOT NULL,
  ADD COLUMN IF NOT EXISTS opening_messages JSONB DEFAULT '[]' NOT NULL,
  ADD COLUMN IF NOT EXISTS system_prompt_key TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS container_preference TEXT DEFAULT 'default'
    CHECK (container_preference IN ('drawer', 'modal', 'default'));

-- ============================================================================
-- SECTION 13: lila_tool_permissions — PRD-21A/21C additions
-- ============================================================================

ALTER TABLE lila_tool_permissions
  ADD COLUMN IF NOT EXISTS context_person_ids UUID[] DEFAULT '{}' NOT NULL,
  ADD COLUMN IF NOT EXISTS include_family_context BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'default'
    CHECK (source IN ('default', 'vault')),
  ADD COLUMN IF NOT EXISTS vault_item_id UUID,
  ADD COLUMN IF NOT EXISTS saved_prompt_id UUID;

-- ============================================================================
-- SECTION 14: journal_visibility_settings — PRD-08 new table
-- ============================================================================

CREATE TABLE IF NOT EXISTS journal_visibility_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  parent_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  child_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL,
  is_visible_to_parent BOOLEAN DEFAULT false NOT NULL,
  is_included_in_ai_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (parent_member_id, child_member_id, entry_type)
);

ALTER TABLE journal_visibility_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_jvs_updated_at BEFORE UPDATE ON journal_visibility_settings
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE POLICY jvs_manage_primary_parent ON journal_visibility_settings
  FOR ALL USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
  );

-- ============================================================================
-- SECTION 15: victories — PRD-11 new table
-- ============================================================================

CREATE TABLE IF NOT EXISTS victories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  celebration_text TEXT,
  life_area_tag TEXT,
  custom_tags TEXT[] DEFAULT '{}' NOT NULL,
  source TEXT NOT NULL CHECK (source IN (
    'manual', 'task_completed', 'tracker_entry', 'intention_iteration',
    'widget_milestone', 'lila_conversation', 'notepad_routed',
    'reflection_routed', 'list_item_completed', 'routine_completion',
    'homeschool_logged', 'plan_completed', 'milestone_completed',
    'family_feed', 'bookshelf'
  )),
  source_reference_id UUID,
  recorder_type TEXT DEFAULT 'myaim' NOT NULL,
  member_type TEXT NOT NULL CHECK (member_type IN ('adult', 'teen', 'guided', 'play')),
  importance TEXT DEFAULT 'standard' NOT NULL CHECK (importance IN ('small_win', 'standard', 'big_win', 'major_achievement')),
  guiding_star_id UUID REFERENCES guiding_stars(id) ON DELETE SET NULL,
  best_intention_id UUID REFERENCES best_intentions(id) ON DELETE SET NULL,
  is_moms_pick BOOLEAN DEFAULT false NOT NULL,
  moms_pick_note TEXT,
  moms_pick_by UUID REFERENCES family_members(id),
  celebration_voice TEXT,
  photo_url TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE victories ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_v_family_member ON victories (family_id, family_member_id, created_at DESC);
CREATE INDEX idx_v_family_feed ON victories (family_id, created_at DESC);
CREATE INDEX idx_v_source ON victories (family_id, source);
CREATE INDEX idx_v_moms_pick ON victories (family_id, is_moms_pick) WHERE is_moms_pick = true;
CREATE INDEX idx_v_source_ref ON victories (source_reference_id);

CREATE TRIGGER trg_v_updated_at BEFORE UPDATE ON victories
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE POLICY v_manage_own ON victories FOR ALL USING (
  family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY v_select_parent ON victories FOR SELECT USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);

-- ============================================================================
-- SECTION 16: victory_celebrations — PRD-11
-- ============================================================================

CREATE TABLE IF NOT EXISTS victory_celebrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  celebration_date DATE DEFAULT CURRENT_DATE NOT NULL,
  mode TEXT DEFAULT 'individual' NOT NULL CHECK (mode IN ('individual', 'review', 'collection')),
  period TEXT CHECK (period IN ('today', 'this_week', 'this_month', 'custom')),
  narrative TEXT NOT NULL,
  victory_ids UUID[],
  victory_count INTEGER NOT NULL,
  celebration_voice TEXT,
  context_sources JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE victory_celebrations ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_vc_family_member ON victory_celebrations (family_id, family_member_id, created_at DESC);

CREATE POLICY vc_manage_own ON victory_celebrations FOR ALL USING (
  family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
);

-- ============================================================================
-- SECTION 17: victory_voice_preferences — PRD-11
-- ============================================================================

CREATE TABLE IF NOT EXISTS victory_voice_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  selected_voice TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (family_member_id)
);

ALTER TABLE victory_voice_preferences ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_vvp_updated_at BEFORE UPDATE ON victory_voice_preferences
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE POLICY vvp_manage_own ON victory_voice_preferences FOR ALL USING (
  family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
);

-- ============================================================================
-- SECTION 18: activity_log_entries — Cross-feature
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_log_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source_table TEXT,
  source_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE activity_log_entries ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ale_family_member ON activity_log_entries (family_id, member_id);
CREATE INDEX idx_ale_event ON activity_log_entries (event_type);
CREATE INDEX idx_ale_created ON activity_log_entries (created_at DESC);
CREATE INDEX idx_ale_source ON activity_log_entries (source_table, source_id) WHERE source_id IS NOT NULL;

CREATE POLICY ale_select_own ON activity_log_entries FOR SELECT USING (
  member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY ale_select_parent ON activity_log_entries FOR SELECT USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);
CREATE POLICY ale_insert_authenticated ON activity_log_entries FOR INSERT WITH CHECK (true);

-- ============================================================================
-- SECTION 19: feature_demand_responses — PRD-32A (for PlannedExpansionCard)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_demand_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  vote BOOLEAN NOT NULL,
  freeform_note TEXT CHECK (length(freeform_note) <= 500),
  voted_via_view_as BOOLEAN DEFAULT false NOT NULL,
  actual_voter_id UUID REFERENCES family_members(id),
  responded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE feature_demand_responses ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_fdr_member_feature ON feature_demand_responses (family_member_id, feature_key, responded_at DESC);
CREATE INDEX idx_fdr_feature_vote ON feature_demand_responses (feature_key, vote);
CREATE INDEX idx_fdr_family ON feature_demand_responses (family_id);

CREATE POLICY fdr_insert_own ON feature_demand_responses FOR INSERT WITH CHECK (
  family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY fdr_select_own ON feature_demand_responses FOR SELECT USING (
  family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
);

-- ============================================================================
-- SECTION 20: Seed additional feature keys
-- ============================================================================

INSERT INTO feature_key_registry (feature_key, display_name, description, prd_source) VALUES
  -- PRD-11 Victory Recorder
  ('victory_recorder_basic', 'Victory Recorder', 'Manual entry and auto-routes', 'PRD-11'),
  ('victory_recorder_celebrate', 'Celebration Narratives', 'AI celebration text generation', 'PRD-11'),
  ('victory_moms_picks', 'Mom''s Picks', 'Special victory designation', 'PRD-11'),
  ('daily_celebration', 'DailyCelebration', 'Kid celebration sequence', 'PRD-11'),
  -- PRD-14B Calendar
  ('calendar_basic', 'Personal Calendar', 'Create/view/edit own events', 'PRD-14B'),
  ('calendar_family', 'Family Calendar', 'Family views and filtering', 'PRD-14B'),
  ('calendar_ai_intake', 'AI Event Creation', 'Image-to-event OCR', 'PRD-14B'),
  ('calendar_queue', 'Event Approval Queue', 'Mom approval queue', 'PRD-14B'),
  -- PRD-14C/14D
  ('family_overview', 'Family Overview', 'Aggregated family view', 'PRD-14C'),
  ('family_hub', 'Family Hub', 'Shared family surface', 'PRD-14D'),
  -- PRD-13 Archives
  ('archives_browse', 'Browse Archives', 'Archive browsing access', 'PRD-13'),
  ('archives_faith_preferences', 'Faith Preferences', 'Faith configuration', 'PRD-13'),
  ('archives_context_learning', 'Context Learning', 'LiLa write-back', 'PRD-13'),
  -- PRD-21 Communication Tools
  ('tool_quality_time', 'Quality Time', 'Love Language tool', 'PRD-21'),
  ('tool_gifts', 'Gifts', 'Love Language tool', 'PRD-21'),
  ('tool_observe_serve', 'Observe & Serve', 'Love Language tool', 'PRD-21'),
  ('tool_words_affirmation', 'Words of Affirmation', 'Love Language tool', 'PRD-21'),
  ('tool_gratitude', 'Gratitude', 'Love Language tool', 'PRD-21'),
  ('tool_cyrano', 'Cyrano', 'Romantic communication', 'PRD-21'),
  ('tool_higgins_say', 'Help Me Say Something', 'Communication coaching', 'PRD-21'),
  ('tool_higgins_navigate', 'Help Me Navigate', 'Situation coaching', 'PRD-21'),
  -- PRD-34 ThoughtSift
  ('thoughtsift_board_of_directors', 'Board of Directors', 'Advisory panel', 'PRD-34'),
  ('thoughtsift_perspective_shifter', 'Perspective Shifter', 'Lens reframing', 'PRD-34'),
  ('thoughtsift_decision_guide', 'Decision Guide', 'Decision frameworks', 'PRD-34'),
  ('thoughtsift_mediator', 'Mediator', 'Conflict mediation', 'PRD-34'),
  ('thoughtsift_translator', 'Translator', 'Text rewrite', 'PRD-34'),
  -- PRD-20 Safe Harbor
  ('safe_harbor', 'Safe Harbor', 'Emotional processing space', 'PRD-20'),
  ('safe_harbor_guided', 'Safe Harbor Guided', 'Kid emotional support', 'PRD-20'),
  -- PRD-21A AI Vault
  ('vault_browse', 'Browse AI Vault', 'Vault content access', 'PRD-21A'),
  ('vault_consume', 'Consume Vault Content', 'Use vault items', 'PRD-21A'),
  ('vault_optimize_lila', 'Optimize with LiLa', 'Vault LiLa integration', 'PRD-21A'),
  ('vault_prompt_library', 'Prompt Library', 'Personal prompts', 'PRD-21A'),
  -- PRD-15 Messaging
  ('messaging_basic', 'Basic Messaging', '1-on-1 messaging', 'PRD-15'),
  ('requests_basic', 'Family Requests', 'Send/receive requests', 'PRD-15'),
  ('notifications_basic', 'In-App Notifications', 'Notification tray', 'PRD-15'),
  -- PRD-22 Settings
  ('settings_basic', 'Account Settings', 'Account and appearance', 'PRD-22'),
  ('settings_family_management', 'Family Management', 'Family member management', 'PRD-22'),
  -- PRD-18 Rhythms
  ('rhythms_basic', 'Morning/Evening Rhythms', 'Daily rhythms', 'PRD-18'),
  ('reflections_basic', 'Reflection Prompts', 'Guided reflections', 'PRD-18'),
  -- PRD-28B Compliance
  ('compliance_esa_invoice', 'ESA Invoice Generator', 'ESA-compliant invoicing', 'PRD-28B')
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================================================
-- SECTION 21: Fix embedding column types (vector → halfvec)
-- Note: This requires dropping and recreating indexes
-- ============================================================================

-- guiding_stars
DROP INDEX IF EXISTS idx_gs_embedding;
ALTER TABLE guiding_stars ALTER COLUMN embedding TYPE halfvec(1536);
CREATE INDEX idx_gs_embedding ON guiding_stars USING hnsw (embedding halfvec_cosine_ops)
  WHERE embedding IS NOT NULL;

-- best_intentions
DROP INDEX IF EXISTS idx_bi_embedding;
ALTER TABLE best_intentions ALTER COLUMN embedding TYPE halfvec(1536);
CREATE INDEX idx_bi_embedding ON best_intentions USING hnsw (embedding halfvec_cosine_ops)
  WHERE embedding IS NOT NULL;

-- self_knowledge
DROP INDEX IF EXISTS idx_sk_embedding;
ALTER TABLE self_knowledge ALTER COLUMN embedding TYPE halfvec(1536);
CREATE INDEX idx_sk_embedding ON self_knowledge USING hnsw (embedding halfvec_cosine_ops)
  WHERE embedding IS NOT NULL;

-- journal_entries
DROP INDEX IF EXISTS idx_je_embedding;
ALTER TABLE journal_entries ALTER COLUMN embedding TYPE halfvec(1536);
CREATE INDEX idx_je_embedding ON journal_entries USING hnsw (embedding halfvec_cosine_ops)
  WHERE embedding IS NOT NULL;

-- ============================================================================
-- SECTION 22: PRD-02 missing tables (priority ones for Permission Hub)
-- ============================================================================

-- view_as_permissions (PRD-02 — supplements view_as_sessions)
CREATE TABLE IF NOT EXISTS view_as_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  target_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true NOT NULL,
  excluded_features JSONB DEFAULT '[]' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (family_id, viewer_id, target_member_id)
);

ALTER TABLE view_as_permissions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_vap_updated_at BEFORE UPDATE ON view_as_permissions
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE POLICY vap_manage_parent ON view_as_permissions FOR ALL USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);

-- permission_presets (PRD-02)
CREATE TABLE IF NOT EXISTS permission_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES family_members(id),
  preset_name TEXT NOT NULL,
  target_role TEXT NOT NULL CHECK (target_role IN ('additional_adult', 'special_adult')),
  permissions_config JSONB NOT NULL,
  is_system_preset BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE permission_presets ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_pp_updated_at BEFORE UPDATE ON permission_presets
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE POLICY pp_manage_parent ON permission_presets FOR ALL USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);

-- shift_sessions (PRD-02)
CREATE TABLE IF NOT EXISTS shift_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  special_adult_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ended_at TIMESTAMPTZ,
  started_by TEXT DEFAULT 'manual' NOT NULL CHECK (started_by IN ('manual', 'scheduled', 'mom', 'auto_custody')),
  ended_by TEXT CHECK (ended_by IN ('manual', 'scheduled', 'mom')),
  summary_compiled BOOLEAN DEFAULT false NOT NULL,
  summary_text TEXT,
  is_co_parent_session BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE shift_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ss_family_adult ON shift_sessions (family_id, special_adult_id);
CREATE INDEX idx_ss_active ON shift_sessions (special_adult_id, ended_at) WHERE ended_at IS NULL;

CREATE POLICY ss_manage_parent ON shift_sessions FOR ALL USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);
CREATE POLICY ss_manage_own ON shift_sessions FOR ALL USING (
  special_adult_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
);

-- teen_sharing_overrides (PRD-02)
CREATE TABLE IF NOT EXISTS teen_sharing_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  resource_id UUID NOT NULL,
  original_visibility TEXT NOT NULL,
  new_visibility TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE teen_sharing_overrides ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tso_member ON teen_sharing_overrides (member_id, feature_key);

CREATE POLICY tso_manage_own ON teen_sharing_overrides FOR ALL USING (
  member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
);
CREATE POLICY tso_select_parent ON teen_sharing_overrides FOR SELECT USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);

-- ============================================================================
-- Done. All changes are additive.
-- ============================================================================
