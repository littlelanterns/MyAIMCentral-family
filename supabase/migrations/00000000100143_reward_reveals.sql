-- Migration: 00000000100143_reward_reveals.sql
-- Purpose: Reward Reveals — Universal Celebration System
--
--   Mom can attach reveal animations + prize content to any completable
--   item (tasks, widgets, lists, intentions, sequential collections, mastery).
--   When the child completes the item, a celebration video plays and reveals
--   a prize (text, image, randomizer pull, or celebration-only confetti).
--
-- Tables:
--   1. reward_reveals — mom's configured reward reveal combos (inline or library)
--   2. reward_reveal_attachments — links a reveal to a completable source
--   3. congratulations_messages — seeded preset messages + family custom
--
-- Also:
--   4. RLS on all 3 tables
--   5. Feature keys: reward_reveals_basic, reward_reveals_media, reward_reveals_library
--   6. Seed data: ~20 congratulations messages

BEGIN;

-- ============================================================================
-- 1. reward_reveals — Mom's configured reward reveal combos
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reward_reveals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by            UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,

  -- NULL = inline one-off (created alongside an attachment), non-NULL = named library item
  name                  TEXT,

  -- Reveal animation(s) — single or rotating
  animation_ids         UUID[] NOT NULL,
  animation_rotation    TEXT NOT NULL DEFAULT 'sequential'
                          CHECK (animation_rotation IN ('sequential', 'random')),

  -- Prize content mode
  prize_mode            TEXT NOT NULL DEFAULT 'fixed'
                          CHECK (prize_mode IN ('fixed', 'sequential', 'random')),

  -- For fixed mode (single prize):
  prize_type            TEXT NOT NULL
                          CHECK (prize_type IN ('text', 'image', 'platform_image', 'randomizer', 'celebration_only')),
  prize_text            TEXT,
  prize_name            TEXT,
  prize_image_url       TEXT,
  prize_asset_key       TEXT,
  prize_randomizer_list_id UUID REFERENCES public.lists(id) ON DELETE SET NULL,

  -- For sequential/random mode (prize pool):
  -- Array of objects: [{prize_type, prize_text, prize_name, prize_image_url, prize_asset_key}]
  prize_pool            JSONB,

  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reward_reveals ENABLE ROW LEVEL SECURITY;

-- Mom full CRUD, family members read
DROP POLICY IF EXISTS "reward_reveals_select" ON public.reward_reveals;
CREATE POLICY "reward_reveals_select"
  ON public.reward_reveals FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "reward_reveals_insert" ON public.reward_reveals;
CREATE POLICY "reward_reveals_insert"
  ON public.reward_reveals FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role IN ('primary_parent', 'additional_adult')
    )
  );

DROP POLICY IF EXISTS "reward_reveals_update" ON public.reward_reveals;
CREATE POLICY "reward_reveals_update"
  ON public.reward_reveals FOR UPDATE
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role IN ('primary_parent', 'additional_adult')
    )
  );

DROP POLICY IF EXISTS "reward_reveals_delete" ON public.reward_reveals;
CREATE POLICY "reward_reveals_delete"
  ON public.reward_reveals FOR DELETE
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role IN ('primary_parent', 'additional_adult')
    )
  );

CREATE INDEX IF NOT EXISTS idx_reward_reveals_family
  ON public.reward_reveals(family_id);
CREATE INDEX IF NOT EXISTS idx_reward_reveals_family_active
  ON public.reward_reveals(family_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reward_reveals_library
  ON public.reward_reveals(family_id) WHERE name IS NOT NULL;

-- updated_at trigger
CREATE OR REPLACE TRIGGER trg_reward_reveals_updated_at
  BEFORE UPDATE ON public.reward_reveals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.reward_reveals IS
  'Mom-configured reward reveal combos — animation + prize content. Named items are library entries; NULL name = inline one-off.';


-- ============================================================================
-- 2. reward_reveal_attachments — Links a reveal to a completable source
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reward_reveal_attachments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  reward_reveal_id      UUID NOT NULL REFERENCES public.reward_reveals(id) ON DELETE CASCADE,

  -- What this reveal is attached to
  source_type           TEXT NOT NULL
                          CHECK (source_type IN (
                            'task', 'widget', 'list', 'intention',
                            'sequential_collection', 'sequential_interval', 'mastery'
                          )),
  source_id             UUID NOT NULL,

  -- NULL = all assignees, non-NULL = specific child
  family_member_id      UUID REFERENCES public.family_members(id) ON DELETE CASCADE,

  -- Repeating vs one-time
  is_repeating          BOOLEAN NOT NULL DEFAULT true,

  -- When to fire the reveal
  reveal_trigger_mode   TEXT NOT NULL DEFAULT 'on_completion'
                          CHECK (reveal_trigger_mode IN ('on_completion', 'every_n', 'on_goal')),
  reveal_trigger_n      INTEGER,

  -- Tracking how many times it has fired
  times_revealed        INTEGER NOT NULL DEFAULT 0,
  last_revealed_at      TIMESTAMPTZ,

  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reward_reveal_attachments ENABLE ROW LEVEL SECURITY;

-- Mom full CRUD, family members read
DROP POLICY IF EXISTS "reward_reveal_attachments_select" ON public.reward_reveal_attachments;
CREATE POLICY "reward_reveal_attachments_select"
  ON public.reward_reveal_attachments FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "reward_reveal_attachments_insert" ON public.reward_reveal_attachments;
CREATE POLICY "reward_reveal_attachments_insert"
  ON public.reward_reveal_attachments FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role IN ('primary_parent', 'additional_adult')
    )
  );

DROP POLICY IF EXISTS "reward_reveal_attachments_update" ON public.reward_reveal_attachments;
CREATE POLICY "reward_reveal_attachments_update"
  ON public.reward_reveal_attachments FOR UPDATE
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role IN ('primary_parent', 'additional_adult')
    )
  );

DROP POLICY IF EXISTS "reward_reveal_attachments_delete" ON public.reward_reveal_attachments;
CREATE POLICY "reward_reveal_attachments_delete"
  ON public.reward_reveal_attachments FOR DELETE
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role IN ('primary_parent', 'additional_adult')
    )
  );

-- One reveal per source per member (NULL member_id = all assignees)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_reveal_attachments_unique
  ON public.reward_reveal_attachments(source_type, source_id, family_member_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_reward_reveal_attachments_source
  ON public.reward_reveal_attachments(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_reward_reveal_attachments_reveal
  ON public.reward_reveal_attachments(reward_reveal_id);
CREATE INDEX IF NOT EXISTS idx_reward_reveal_attachments_family
  ON public.reward_reveal_attachments(family_id);

-- updated_at trigger
CREATE OR REPLACE TRIGGER trg_reward_reveal_attachments_updated_at
  BEFORE UPDATE ON public.reward_reveal_attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.reward_reveal_attachments IS
  'Links a reward_reveals combo to a completable source (task, widget, list, intention, etc.). Tracks times_revealed for rotating animations/prize pools.';


-- ============================================================================
-- 3. congratulations_messages — Seeded preset messages + family custom
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.congratulations_messages (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_text          TEXT NOT NULL,
  category              TEXT NOT NULL
                          CHECK (category IN ('general', 'milestone', 'streak', 'completion', 'effort')),
  is_system             BOOLEAN NOT NULL DEFAULT true,
  family_id             UUID REFERENCES public.families(id) ON DELETE CASCADE,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.congratulations_messages ENABLE ROW LEVEL SECURITY;

-- System messages: everyone reads. Family custom: family-scoped.
DROP POLICY IF EXISTS "congratulations_messages_select" ON public.congratulations_messages;
CREATE POLICY "congratulations_messages_select"
  ON public.congratulations_messages FOR SELECT
  USING (
    is_system = true
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "congratulations_messages_insert" ON public.congratulations_messages;
CREATE POLICY "congratulations_messages_insert"
  ON public.congratulations_messages FOR INSERT
  WITH CHECK (
    is_system = false
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role IN ('primary_parent', 'additional_adult')
    )
  );

DROP POLICY IF EXISTS "congratulations_messages_update" ON public.congratulations_messages;
CREATE POLICY "congratulations_messages_update"
  ON public.congratulations_messages FOR UPDATE
  USING (
    is_system = false
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role IN ('primary_parent', 'additional_adult')
    )
  );

DROP POLICY IF EXISTS "congratulations_messages_delete" ON public.congratulations_messages;
CREATE POLICY "congratulations_messages_delete"
  ON public.congratulations_messages FOR DELETE
  USING (
    is_system = false
    AND family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role IN ('primary_parent', 'additional_adult')
    )
  );

CREATE INDEX IF NOT EXISTS idx_congratulations_messages_system
  ON public.congratulations_messages(is_system, category, sort_order)
  WHERE is_system = true;
CREATE INDEX IF NOT EXISTS idx_congratulations_messages_family
  ON public.congratulations_messages(family_id, category)
  WHERE family_id IS NOT NULL;

COMMENT ON TABLE public.congratulations_messages IS
  'Pre-seeded and family-custom congratulations message templates. Supports {reward} placeholder for prize name substitution.';


-- ============================================================================
-- 4. Seed data: ~20 congratulations messages
-- ============================================================================

INSERT INTO public.congratulations_messages (message_text, category, is_system, sort_order)
VALUES
  -- General
  ('Great job! You earned {reward}!', 'general', true, 1),
  ('You did it! Time for {reward}!', 'general', true, 2),
  ('Amazing work! Here''s your {reward}!', 'general', true, 3),
  ('Way to go! {reward} is yours!', 'general', true, 4),
  ('Look what you earned!', 'general', true, 5),

  -- Milestone
  ('You hit your goal! {reward} time!', 'milestone', true, 1),
  ('All that hard work paid off — {reward}!', 'milestone', true, 2),
  ('Goal reached! You''ve earned {reward}!', 'milestone', true, 3),
  ('What an accomplishment! Enjoy your {reward}!', 'milestone', true, 4),

  -- Streak
  ('You''re on a roll! Here''s {reward}!', 'streak', true, 1),
  ('Another day, another win! {reward} earned!', 'streak', true, 2),
  ('Keeping it up! {reward} is yours!', 'streak', true, 3),

  -- Completion
  ('All done! Time to celebrate with {reward}!', 'completion', true, 1),
  ('Everything checked off — enjoy {reward}!', 'completion', true, 2),
  ('Finished! Here comes {reward}!', 'completion', true, 3),

  -- Effort
  ('So proud of your hard work!', 'effort', true, 1),
  ('You gave it your best — that''s what matters!', 'effort', true, 2),
  ('Look how far you''ve come!', 'effort', true, 3),
  ('Every step counts, and you showed up!', 'effort', true, 4),
  ('That took real effort. Well done!', 'effort', true, 5)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 5. Feature keys
-- ============================================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('reward_reveals_basic', 'Basic Reward Reveals', 'Create text-only reward reveals, attach to tasks and widgets', 'PRD-24'),
  ('reward_reveals_media', 'Media Reward Reveals', 'Upload images, use platform images, randomizer prizes in reveals', 'PRD-24'),
  ('reward_reveals_library', 'Reward Reveals Library', 'Named reusable reward reveal combos at /settings/reward-reveals', 'PRD-24')
ON CONFLICT (feature_key) DO NOTHING;

DO $$
DECLARE
  v_essential UUID;
  v_enhanced  UUID;
BEGIN
  SELECT id INTO v_essential FROM public.subscription_tiers WHERE slug = 'essential' LIMIT 1;
  SELECT id INTO v_enhanced  FROM public.subscription_tiers WHERE slug = 'enhanced' LIMIT 1;

  -- reward_reveals_basic — Essential tier, mom + dad
  INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
  VALUES
    ('reward_reveals_basic', 'mom', v_essential, true),
    ('reward_reveals_basic', 'dad_adults', v_essential, true)
  ON CONFLICT DO NOTHING;

  -- reward_reveals_media — Enhanced tier, mom + dad
  INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
  VALUES
    ('reward_reveals_media', 'mom', v_enhanced, true),
    ('reward_reveals_media', 'dad_adults', v_enhanced, true)
  ON CONFLICT DO NOTHING;

  -- reward_reveals_library — Enhanced tier, mom + dad
  INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
  VALUES
    ('reward_reveals_library', 'mom', v_enhanced, true),
    ('reward_reveals_library', 'dad_adults', v_enhanced, true)
  ON CONFLICT DO NOTHING;
END $$;


-- ============================================================================
-- 6. Verification
-- ============================================================================

DO $$
DECLARE
  v_reveals INTEGER;
  v_attachments INTEGER;
  v_messages INTEGER;
  v_feature_keys INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_reveals FROM public.reward_reveals;
  SELECT COUNT(*) INTO v_attachments FROM public.reward_reveal_attachments;
  SELECT COUNT(*) INTO v_messages FROM public.congratulations_messages WHERE is_system = true;
  SELECT COUNT(*) INTO v_feature_keys
    FROM public.feature_key_registry
    WHERE feature_key IN ('reward_reveals_basic', 'reward_reveals_media', 'reward_reveals_library');

  RAISE NOTICE 'reward_reveals: % rows', v_reveals;
  RAISE NOTICE 'reward_reveal_attachments: % rows', v_attachments;
  RAISE NOTICE 'congratulations_messages (system): % rows', v_messages;
  RAISE NOTICE 'feature_keys registered: %/3', v_feature_keys;
END;
$$;

COMMIT;
