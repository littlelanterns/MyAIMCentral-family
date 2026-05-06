-- Phase 3.8: Sequential browse mode + feature key registration
-- Idempotent patterns used throughout

-- 1. Add allow_out_of_order column to sequential_collections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sequential_collections'
      AND column_name = 'allow_out_of_order'
  ) THEN
    ALTER TABLE public.sequential_collections
      ADD COLUMN allow_out_of_order BOOLEAN DEFAULT false;
  END IF;
END $$;

COMMENT ON COLUMN public.sequential_collections.allow_out_of_order
  IS 'Phase 3.8: When true, kids can browse and complete items out of sequential order.';

-- 2. Register feature keys for Phase 3.8 wizards and widget
INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('activity_list_wizard', 'Activity List Wizard', 'Create subject-based activity lists with daily requirements and rewards', 'Phase 3.8'),
  ('shared_task_list_wizard', 'Shared Task List Wizard', 'Create shared to-do lists with claim-to-promote and completion write-back', 'Phase 3.8'),
  ('icon_launcher_widget', 'Icon Launcher Widget', 'Dashboard widget linking to activity lists with icon tiles', 'Phase 3.8')
ON CONFLICT (feature_key) DO NOTHING;
