-- ============================================================================
-- Migration: 00000000100139_opportunity_list_unification.sql
-- Purpose:   Opportunity-List Unification — flag any list as an opportunity
--            board so kids can browse items, claim them, and have tasks
--            spawn on their dashboard with reward info.
--
-- What this adds:
--   1. ALTER lists          — is_opportunity flag + 5 default columns
--   2. ALTER list_items     — opportunity_subtype, reward_type, claim lock cols
--   3. ALTER tasks          — source CHECK gains 'opportunity_list_claim'
--   4. Feature keys + tier grants
--   5. Indexes for opportunity queries
--
-- Idempotent: all ADD COLUMN use IF NOT EXISTS.
-- Baseline: migration 100138 is the highest existing.
-- tasks_source_check baseline = 17 values from migration 100134.
-- ============================================================================

-- ─── 1. ALTER lists — opportunity flag + defaults ──────────────────────────

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS is_opportunity BOOLEAN DEFAULT false;

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS default_opportunity_subtype TEXT;

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS default_reward_type TEXT;

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS default_reward_amount DECIMAL(10,2);

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS default_claim_lock_duration INTEGER;

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS default_claim_lock_unit TEXT;

-- CHECK constraints for new columns (idempotent via IF NOT EXISTS name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lists_default_opportunity_subtype_check'
  ) THEN
    ALTER TABLE public.lists
      ADD CONSTRAINT lists_default_opportunity_subtype_check
      CHECK (default_opportunity_subtype IS NULL OR default_opportunity_subtype IN ('one_time', 'claimable', 'repeatable'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lists_default_reward_type_check'
  ) THEN
    ALTER TABLE public.lists
      ADD CONSTRAINT lists_default_reward_type_check
      CHECK (default_reward_type IS NULL OR default_reward_type IN ('points', 'money', 'privilege', 'custom'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lists_default_claim_lock_unit_check'
  ) THEN
    ALTER TABLE public.lists
      ADD CONSTRAINT lists_default_claim_lock_unit_check
      CHECK (default_claim_lock_unit IS NULL OR default_claim_lock_unit IN ('minutes', 'hours', 'days'));
  END IF;
END $$;


-- ─── 2. ALTER list_items — opportunity metadata ───────────────────────────

ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS opportunity_subtype TEXT;

ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS reward_type TEXT;

-- reward_amount already exists on list_items (verified in live schema)

ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS claim_lock_duration INTEGER;

ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS claim_lock_unit TEXT;

-- CHECK constraints for new list_items columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'list_items_opportunity_subtype_check'
  ) THEN
    ALTER TABLE public.list_items
      ADD CONSTRAINT list_items_opportunity_subtype_check
      CHECK (opportunity_subtype IS NULL OR opportunity_subtype IN ('one_time', 'claimable', 'repeatable'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'list_items_reward_type_check'
  ) THEN
    ALTER TABLE public.list_items
      ADD CONSTRAINT list_items_reward_type_check
      CHECK (reward_type IS NULL OR reward_type IN ('points', 'money', 'privilege', 'custom'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'list_items_claim_lock_unit_check'
  ) THEN
    ALTER TABLE public.list_items
      ADD CONSTRAINT list_items_claim_lock_unit_check
      CHECK (claim_lock_unit IS NULL OR claim_lock_unit IN ('minutes', 'hours', 'days'));
  END IF;
END $$;


-- ─── 3. Rebuild tasks_source_check — add 'opportunity_list_claim' (17 → 18) ──

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_source_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_source_check
  CHECK (source IN (
    'manual',
    'template_deployed',
    'lila_conversation',
    'notepad_routed',
    'review_route',
    'meeting_action',
    'goal_decomposition',
    'project_planner',
    'member_request',
    'sequential_promoted',
    'recurring_generated',
    'guided_form_assignment',
    'list_batch',
    'rhythm_priority',
    'rhythm_mindsweep_lite',
    'randomizer_reveal',
    'allowance_makeup',
    'opportunity_list_claim'
  ));


-- ─── 4. Indexes ───────────────────────────────────────────────────────────

-- Fast query: all opportunity lists for a family
CREATE INDEX IF NOT EXISTS idx_lists_opportunity
  ON public.lists(family_id)
  WHERE is_opportunity = true AND archived_at IS NULL;

-- Fast query: available items in an opportunity list
CREATE INDEX IF NOT EXISTS idx_list_items_opportunity_available
  ON public.list_items(list_id, opportunity_subtype)
  WHERE is_available = true;


-- ─── 5. Feature keys + tier grants ────────────────────────────────────────

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('opportunity_lists', 'Opportunity Lists', 'Flag any list as an opportunity board — kids browse and claim items', 'PRD-09A')
ON CONFLICT (feature_key) DO NOTHING;

-- Grant to all role groups at Essential tier (same pattern as existing feature keys)
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT
  'opportunity_lists',
  rg.role_group,
  (SELECT id FROM public.subscription_tiers WHERE slug = 'essential'),
  true
FROM (VALUES
  ('mom'), ('dad_adults'), ('special_adults'),
  ('independent_teens'), ('guided_kids'), ('play_kids')
) AS rg(role_group)
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_access_v2
  WHERE feature_key = 'opportunity_lists' AND feature_access_v2.role_group = rg.role_group
);


-- ─── Verification ─────────────────────────────────────────────────────────

DO $$
DECLARE
  v_lists_cols INTEGER;
  v_items_cols INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_lists_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'lists'
    AND column_name IN ('is_opportunity', 'default_opportunity_subtype', 'default_reward_type',
                        'default_reward_amount', 'default_claim_lock_duration', 'default_claim_lock_unit');

  SELECT COUNT(*) INTO v_items_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'list_items'
    AND column_name IN ('opportunity_subtype', 'reward_type', 'claim_lock_duration', 'claim_lock_unit');

  RAISE NOTICE '✓ lists opportunity columns: % of 6', v_lists_cols;
  RAISE NOTICE '✓ list_items opportunity columns: % of 4 (reward_amount already exists)', v_items_cols;
END $$;
