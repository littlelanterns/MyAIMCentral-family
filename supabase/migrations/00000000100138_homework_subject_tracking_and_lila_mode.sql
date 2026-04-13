-- Migration: 00000000100138_homework_subject_tracking_and_lila_mode.sql
-- PRD-28 polish: (1) Per-task subject assignment for auto time logging on completion
--                (2) LiLa homeschool_time_review guided mode for AI subject estimation

-- ============================================================
-- 1. Add homework_subject_ids to tasks + task_templates
-- ============================================================

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS homework_subject_ids UUID[] DEFAULT '{}';

ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS homework_subject_ids UUID[] DEFAULT '{}';

-- ============================================================
-- 2. Register homeschool_time_review guided mode
-- ============================================================

INSERT INTO public.lila_guided_modes (
  mode_key, display_name, parent_mode, avatar_key, model_tier,
  context_sources, person_selector, available_to_roles,
  requires_feature_key, sort_order, is_active,
  opening_messages, system_prompt_key, container_preference
) VALUES (
  'homeschool_time_review',
  'Homework Time Review',
  'assist',
  'assist',
  'haiku',
  '{"homeschool_subjects","homeschool_time_logs"}',
  false,
  '{"mom","dad_adults"}',
  'homeschool_subjects',
  80,
  true,
  '["Let me help estimate how this learning session breaks down by subject.", "I''ll review the description and suggest a subject allocation for you."]',
  'homeschool_time_review',
  'modal'
) ON CONFLICT (mode_key) DO NOTHING;

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'homework_subject_ids column on tasks: %',
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'homework_subject_ids');
  RAISE NOTICE 'homeschool_time_review guided mode: %',
    (SELECT count(*) FROM lila_guided_modes WHERE mode_key = 'homeschool_time_review');
END $$;
