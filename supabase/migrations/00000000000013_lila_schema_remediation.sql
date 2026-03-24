-- MyAIM Central v2 — LiLa Schema Remediation Phase 2 (PRD-05 authoritative)
-- Migration 9 already added the missing columns. This migration handles:
--   - Dropping fabricated columns
--   - Renaming wrong columns
--   - Fixing defaults/constraints
--   - Populating seed data (opening_messages, parent_mode, model_tier corrections)
--   - Adding new indexes
--   - Adding missing guided modes

-- ============================================================
-- 1. lila_conversations — drop fabricated column, add indexes
-- ============================================================

ALTER TABLE public.lila_conversations
  DROP COLUMN IF EXISTS is_included_in_ai;

CREATE INDEX IF NOT EXISTS idx_lc_member_status_updated
  ON public.lila_conversations(member_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_lc_guided_subtype
  ON public.lila_conversations(member_id, guided_subtype)
  WHERE guided_subtype IS NOT NULL;

-- ============================================================
-- 2. lila_messages — fix metadata default, add token_count, drop message_type
-- ============================================================

ALTER TABLE public.lila_messages
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

UPDATE public.lila_messages SET metadata = '{}'::jsonb WHERE metadata IS NULL;

ALTER TABLE public.lila_messages
  ALTER COLUMN metadata SET NOT NULL;

ALTER TABLE public.lila_messages
  ADD COLUMN IF NOT EXISTS token_count INTEGER;

ALTER TABLE public.lila_messages
  DROP COLUMN IF EXISTS message_type;

-- ============================================================
-- 3. lila_guided_modes — drop old avatar_set if still present, fix constraints
-- ============================================================

-- Migration 9 added avatar_key but didn't drop avatar_set
ALTER TABLE public.lila_guided_modes
  DROP COLUMN IF EXISTS avatar_set;

-- Fix context_sources nullability
UPDATE public.lila_guided_modes
  SET context_sources = '{}' WHERE context_sources IS NULL;

ALTER TABLE public.lila_guided_modes
  ALTER COLUMN context_sources SET DEFAULT '{}',
  ALTER COLUMN context_sources SET NOT NULL;

-- Fix available_to_roles nullability and default
UPDATE public.lila_guided_modes
  SET available_to_roles = '{"mom"}' WHERE available_to_roles IS NULL;

ALTER TABLE public.lila_guided_modes
  ALTER COLUMN available_to_roles SET DEFAULT '{"mom"}',
  ALTER COLUMN available_to_roles SET NOT NULL;

-- Fix system_prompt_key: make NOT NULL with default
UPDATE public.lila_guided_modes
  SET system_prompt_key = mode_key WHERE system_prompt_key IS NULL OR system_prompt_key = '';

ALTER TABLE public.lila_guided_modes
  ALTER COLUMN system_prompt_key SET NOT NULL,
  ALTER COLUMN system_prompt_key SET DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_lgm_active_roles
  ON public.lila_guided_modes(is_active, available_to_roles)
  WHERE is_active = true;

-- ============================================================
-- 4. Fix model_tier for Help and Assist (PRD-05: both are Haiku)
-- ============================================================

UPDATE public.lila_guided_modes
  SET model_tier = 'haiku'
  WHERE mode_key IN ('help', 'assist');

-- ============================================================
-- 5. Populate opening_messages for core 4 modes
-- ============================================================

UPDATE public.lila_guided_modes SET opening_messages = '[
  "Hey! I''m LiLa Help — happy to help with anything. What''s going on?",
  "Hi there! Having trouble with something, or just have a question? I''m here.",
  "Welcome! I can help with account stuff, features, billing — whatever you need. What''s up?"
]'::jsonb, sort_order = 1
WHERE mode_key = 'help';

UPDATE public.lila_guided_modes SET opening_messages = '[
  "Hi! I''m LiLa Assist — your guide to everything in MyAIM. Want to explore something new, or need help with a feature?",
  "Hey! Ready to discover something? I know every corner of this app. What are you working on?",
  "Welcome! Whether you''re setting up something new or want to level up how you use a feature, I''m here. What sounds good?"
]'::jsonb, sort_order = 2
WHERE mode_key = 'assist';

UPDATE public.lila_guided_modes SET opening_messages = '[
  "Hey. What''s on your mind?",
  "Hi there. I''m here whenever you''re ready — no rush.",
  "Hey! Want to think something through, or just need to get something off your chest?"
]'::jsonb, sort_order = 0
WHERE mode_key = 'general';

UPDATE public.lila_guided_modes SET opening_messages = '[
  "Ready to craft the perfect prompt? Tell me what you''re working on and I''ll help you get the most out of any AI.",
  "Hi! Let''s optimize. What prompt are you working with, or what do you need an AI to help you with?"
]'::jsonb, sort_order = 3
WHERE mode_key = 'optimizer';

-- ============================================================
-- 6. Populate parent_mode for guided modes
-- ============================================================

UPDATE public.lila_guided_modes SET parent_mode = 'relationship_action', sort_order = 10
  WHERE mode_key IN ('quality_time','gifts','observe_serve','words_affirmation','gratitude','cyrano')
  AND parent_mode IS NULL;

UPDATE public.lila_guided_modes SET parent_mode = 'crew_action', sort_order = 20
  WHERE mode_key IN ('higgins_say','higgins_navigate') AND parent_mode IS NULL;

UPDATE public.lila_guided_modes SET parent_mode = 'personal_growth', sort_order = 30
  WHERE mode_key IN ('craft_with_lila','self_discovery','life_lantern','family_vision_quest') AND parent_mode IS NULL;

UPDATE public.lila_guided_modes SET parent_mode = 'calendar_meeting', sort_order = 40
  WHERE mode_key IN ('calendar_event_create','meeting') AND parent_mode IS NULL;

UPDATE public.lila_guided_modes SET parent_mode = 'family_context', sort_order = 50
  WHERE mode_key = 'family_context_interview' AND parent_mode IS NULL;

UPDATE public.lila_guided_modes SET parent_mode = 'safe_harbor', sort_order = 60
  WHERE mode_key IN ('safe_harbor','safe_harbor_guided','safe_harbor_orientation','safe_harbor_literacy') AND parent_mode IS NULL;

UPDATE public.lila_guided_modes SET parent_mode = 'inner_wisdom', sort_order = 70
  WHERE mode_key IN ('board_of_directors','perspective_shifter','decision_guide','mediator','translator') AND parent_mode IS NULL;

UPDATE public.lila_guided_modes SET parent_mode = 'bigplans', sort_order = 80
  WHERE mode_key IN ('bigplans_planning','bigplans_friction_finder','bigplans_checkin','bigplans_system_design_trial','bigplans_deployed_component') AND parent_mode IS NULL;

UPDATE public.lila_guided_modes SET parent_mode = 'bookshelf', sort_order = 90
  WHERE mode_key = 'book_discussion' AND parent_mode IS NULL;

UPDATE public.lila_guided_modes SET parent_mode = 'compliance', sort_order = 100
  WHERE mode_key IN ('homeschool_report_generation','homeschool_time_review','homeschool_bulk_summary') AND parent_mode IS NULL;

-- ============================================================
-- 7. lila_tool_permissions — rename is_granted, drop granted_by
-- ============================================================

-- Rename is_granted → is_enabled (only if is_granted still exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lila_tool_permissions' AND column_name='is_granted' AND table_schema='public') THEN
    ALTER TABLE public.lila_tool_permissions RENAME COLUMN is_granted TO is_enabled;
  END IF;
END $$;

ALTER TABLE public.lila_tool_permissions
  ALTER COLUMN is_enabled SET DEFAULT true;

ALTER TABLE public.lila_tool_permissions
  DROP COLUMN IF EXISTS granted_by;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ltp_member_mode
  ON public.lila_tool_permissions(family_id, member_id, mode_key);

-- ============================================================
-- 8. Add missing guided modes (PRD-25)
-- ============================================================

INSERT INTO public.lila_guided_modes (mode_key, display_name, model_tier, avatar_key, context_sources, person_selector, available_to_roles, requires_feature_key, parent_mode, sort_order, opening_messages, system_prompt_key)
VALUES
  ('guided_homework_help', 'Homework Help', 'haiku', 'sitting', '{}', false, '{"guided_kids"}', 'safe_harbor_guided', 'guided_tools', 110,
   '["Need help with homework? I can help you figure out how to approach it — let''s think through it together!", "Hi! Tell me what you''re working on and I''ll help you think it through."]'::jsonb, 'guided_homework_help'),
  ('guided_communication_coach', 'Talk It Out', 'haiku', 'sitting', '{"self_knowledge"}', false, '{"guided_kids"}', 'safe_harbor_guided', 'guided_tools', 111,
   '["Want to practice saying something tricky? I can help you figure out how to bring it up.", "Hi! Sometimes it helps to practice what you want to say. What''s on your mind?"]'::jsonb, 'guided_communication_coach')
ON CONFLICT (mode_key) DO NOTHING;

-- ============================================================
-- 9. Add feature key
-- ============================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES ('lila_family_drawer', 'LiLa Family Drawer', 'Full drawer access for dad/teens (Full Magic tier)', 'PRD-05')
ON CONFLICT (feature_key) DO NOTHING;
