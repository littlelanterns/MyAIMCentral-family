-- ============================================================================
-- 00000000100115_play_dashboard_sticker_book.sql
-- ============================================================================
-- Build M Sub-phase A — Play Dashboard + Sticker Book Gamification (Baby Step)
--
-- PRDs:    PRD-24 (Gamification Foundation), PRD-26 (Play Dashboard)
-- Plan:    claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md
-- Status:  ✅ Founder-approved 2026-04-07 (three rounds, see §0)
--
-- This migration is the foundation for Build M. It is large but idempotent
-- and self-contained. Subsequent sub-phases (B–F) build the UI, write path,
-- sticker book modals, mom settings, and verification on top of this schema.
--
-- HIGH-LEVEL CONTENTS:
--   1.  Platform tables          — gamification_themes, creatures, sticker_pages
--   2.  Per-member runtime tables — gamification_configs, member_sticker_book_state,
--                                   member_creature_collection, member_page_unlocks
--   3.  ALTER tasks               — add points_override, icon_asset_key, icon_variant
--   4.  ALTER tasks_source_check  — add 'randomizer_reveal' (15 → 16 values)
--   5.  Theme + creature + page seeds (Woodland Felt: 1 theme + 161 creatures + 26 pages)
--   6.  visual_schedule library seed (328 rows, A2 hybrid — no embeddings)
--   7.  RPC: roll_creature_for_completion(p_task_completion_id UUID) RETURNS JSONB
--   8.  Trigger function rewrite: auto_provision_member_resources
--                                  PRESERVES all 4 existing branches
--                                  (play / guided / independent / adult) verbatim
--                                  ADDS gamification + sticker book provisioning
--   9.  Backfill for 26 existing family_members (idempotent NOT EXISTS guards)
--   10. Feature key registry + tier grants (7 feature keys × 5 role groups)
--   11. RLS policies (5 family roles)
--   12. Verification RAISE NOTICE block
--
-- COLLISION-AVOIDANCE NOTES:
--   - Migration filename collision with Build N (PRD-18 Phase D, which used 100114)
--     was discovered 2026-04-07 and resolved by bumping this build to 100115.
--   - Build N forked auto_provision_member_resources to add an 'independent'
--     teen branch. This migration's CREATE OR REPLACE FUNCTION reproduces all
--     4 existing branches verbatim (live function captured from production via
--     pg_get_functiondef before this migration was written) and only ADDS the
--     gamification rows after the existing branches complete. Adult / independent
--     / guided / play teen rhythm logic is unchanged.
--   - tasks_source_check baseline = 15 values (Build L migration 100112). This
--     migration adds 'randomizer_reveal' for 16 total. All 15 prior values are
--     preserved verbatim.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PLATFORM TABLES (seed-driven, family_id IS NULL, public read)
-- ============================================================================

-- gamification_themes — 1 row this build (Woodland Felt). Future themes append.
CREATE TABLE IF NOT EXISTS public.gamification_themes (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_slug                  TEXT NOT NULL UNIQUE,
  display_name                TEXT NOT NULL,
  description                 TEXT,
  creature_reveal_video_url   TEXT NOT NULL,
  page_reveal_video_url       TEXT NOT NULL,
  thumbnail_image_url         TEXT,
  is_active                   BOOLEAN NOT NULL DEFAULT true,
  sort_order                  INTEGER NOT NULL DEFAULT 0,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gamification_themes_select_authenticated" ON public.gamification_themes;
CREATE POLICY "gamification_themes_select_authenticated"
  ON public.gamification_themes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_gamification_themes_active
  ON public.gamification_themes(is_active, sort_order)
  WHERE is_active = true;

COMMENT ON TABLE public.gamification_themes IS
  'Build M (PRD-24+PRD-26): One row per visual gamification theme. Woodland Felt is the default for all members. Future themes (Pets, Apothecary, Dragons) append rows here.';


-- gamification_creatures — 161 rows seeded from Woodland Felt manifest CSV
CREATE TABLE IF NOT EXISTS public.gamification_creatures (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id                    UUID NOT NULL REFERENCES public.gamification_themes(id) ON DELETE CASCADE,
  slug                        TEXT NOT NULL,
  display_name                TEXT NOT NULL,
  rarity                      TEXT NOT NULL DEFAULT 'common'
                                CHECK (rarity IN ('common','rare','legendary')),
  tags                        TEXT[] NOT NULL DEFAULT '{}',
  description                 TEXT,
  image_url                   TEXT NOT NULL,
  sort_order                  INTEGER NOT NULL DEFAULT 0,
  is_active                   BOOLEAN NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gamification_creatures_unique_theme_slug UNIQUE (theme_id, slug)
);

ALTER TABLE public.gamification_creatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gamification_creatures_select_authenticated" ON public.gamification_creatures;
CREATE POLICY "gamification_creatures_select_authenticated"
  ON public.gamification_creatures FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_gamification_creatures_theme_rarity
  ON public.gamification_creatures(theme_id, rarity)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_gamification_creatures_theme_active
  ON public.gamification_creatures(theme_id, is_active);

COMMENT ON TABLE public.gamification_creatures IS
  'Build M: Per-theme creature catalog. Roll pool for the gamification RPC. Tags are simple text array (no pgvector this build per Override #7).';


-- gamification_sticker_pages — 26 rows seeded from backgrounds manifest CSV
CREATE TABLE IF NOT EXISTS public.gamification_sticker_pages (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id                    UUID NOT NULL REFERENCES public.gamification_themes(id) ON DELETE CASCADE,
  slug                        TEXT NOT NULL,
  display_name                TEXT NOT NULL,
  scene                       TEXT NOT NULL,
  season                      TEXT,
  image_url                   TEXT NOT NULL,
  sort_order                  INTEGER NOT NULL DEFAULT 0,
  is_active                   BOOLEAN NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gamification_sticker_pages_unique_theme_slug UNIQUE (theme_id, slug)
);

ALTER TABLE public.gamification_sticker_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gamification_sticker_pages_select_authenticated" ON public.gamification_sticker_pages;
CREATE POLICY "gamification_sticker_pages_select_authenticated"
  ON public.gamification_sticker_pages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_gamification_sticker_pages_theme_order
  ON public.gamification_sticker_pages(theme_id, sort_order)
  WHERE is_active = true;

COMMENT ON TABLE public.gamification_sticker_pages IS
  'Build M: Per-theme sticker book pages (background scenes). Default unlock order is sort_order ascending. Mom can curate later (page curation UI is a follow-up build).';


-- ============================================================================
-- 2. PER-MEMBER RUNTIME TABLES
-- ============================================================================

-- gamification_configs — full PRD-24 schema (Q2 = Option A)
CREATE TABLE IF NOT EXISTS public.gamification_configs (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                   UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id            UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  enabled                     BOOLEAN NOT NULL DEFAULT true,
  currency_name               TEXT NOT NULL DEFAULT 'stars',
  currency_icon               TEXT NOT NULL DEFAULT '⭐',
  base_points_per_task        INTEGER NOT NULL DEFAULT 1,
  bonus_at_three              INTEGER NOT NULL DEFAULT 3,
  bonus_at_five               INTEGER NOT NULL DEFAULT 5,
  routine_points_mode         TEXT NOT NULL DEFAULT 'per_step'
                                CHECK (routine_points_mode IN ('per_step','on_completion')),
  streak_grace_days           INTEGER NOT NULL DEFAULT 1
                                CHECK (streak_grace_days BETWEEN 0 AND 2),
  streak_schedule_aware       BOOLEAN NOT NULL DEFAULT false,
  streak_pause_enabled        BOOLEAN NOT NULL DEFAULT true,
  streak_paused               BOOLEAN NOT NULL DEFAULT false,
  streak_paused_at            TIMESTAMPTZ,
  visualization_mode          TEXT NOT NULL DEFAULT 'counter',
  level_thresholds            JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gamification_configs_unique_member UNIQUE (family_member_id)
);

ALTER TABLE public.gamification_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gamification_configs_family_read" ON public.gamification_configs;
CREATE POLICY "gamification_configs_family_read"
  ON public.gamification_configs FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "gamification_configs_mom_write" ON public.gamification_configs;
CREATE POLICY "gamification_configs_mom_write"
  ON public.gamification_configs FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  );

CREATE INDEX IF NOT EXISTS idx_gamification_configs_family
  ON public.gamification_configs(family_id);

CREATE INDEX IF NOT EXISTS idx_gamification_configs_member
  ON public.gamification_configs(family_member_id);

DROP TRIGGER IF EXISTS trg_gamification_configs_updated_at ON public.gamification_configs;
CREATE TRIGGER trg_gamification_configs_updated_at
  BEFORE UPDATE ON public.gamification_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.gamification_configs IS
  'Build M (PRD-24 full schema): Per-member gamification settings. Most columns are read-only this build (only enabled, base_points_per_task, currency_*, streak_grace_days are wired). Schema is correct once and forever.';


-- member_sticker_book_state — 1 row per family_member (auto-provisioned)
CREATE TABLE IF NOT EXISTS public.member_sticker_book_state (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                       UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id                UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  active_theme_id                 UUID NOT NULL REFERENCES public.gamification_themes(id),
  active_page_id                  UUID REFERENCES public.gamification_sticker_pages(id),
  page_unlock_mode                TEXT NOT NULL DEFAULT 'every_n_creatures'
                                    CHECK (page_unlock_mode IN ('every_n_creatures','custom_trigger')),
  page_unlock_interval            INTEGER NOT NULL DEFAULT 7
                                    CHECK (page_unlock_interval >= 1),
  rarity_weights                  JSONB NOT NULL DEFAULT '{"common": 85, "rare": 12, "legendary": 3}'::jsonb,
  creature_roll_chance_per_task   INTEGER NOT NULL DEFAULT 40
                                    CHECK (creature_roll_chance_per_task BETWEEN 0 AND 100),
  is_enabled                      BOOLEAN NOT NULL DEFAULT true,
  creatures_earned_total          INTEGER NOT NULL DEFAULT 0,
  pages_unlocked_total            INTEGER NOT NULL DEFAULT 1,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT member_sticker_book_state_unique_member UNIQUE (family_member_id)
);

-- Validate rarity_weights JSONB sums to 100
CREATE OR REPLACE FUNCTION public.validate_rarity_weights()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_sum INTEGER;
BEGIN
  SELECT COALESCE((NEW.rarity_weights->>'common')::int, 0)
       + COALESCE((NEW.rarity_weights->>'rare')::int, 0)
       + COALESCE((NEW.rarity_weights->>'legendary')::int, 0)
    INTO v_sum;
  IF v_sum <> 100 THEN
    RAISE EXCEPTION 'rarity_weights must sum to 100, got %', v_sum;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_rarity_weights ON public.member_sticker_book_state;
CREATE TRIGGER trg_validate_rarity_weights
  BEFORE INSERT OR UPDATE OF rarity_weights ON public.member_sticker_book_state
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_rarity_weights();

ALTER TABLE public.member_sticker_book_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_sticker_book_state_family_read" ON public.member_sticker_book_state;
CREATE POLICY "member_sticker_book_state_family_read"
  ON public.member_sticker_book_state FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "member_sticker_book_state_mom_write" ON public.member_sticker_book_state;
CREATE POLICY "member_sticker_book_state_mom_write"
  ON public.member_sticker_book_state FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  );

CREATE INDEX IF NOT EXISTS idx_member_sticker_book_state_family
  ON public.member_sticker_book_state(family_id);

CREATE INDEX IF NOT EXISTS idx_member_sticker_book_state_member
  ON public.member_sticker_book_state(family_member_id);

DROP TRIGGER IF EXISTS trg_member_sticker_book_state_updated_at ON public.member_sticker_book_state;
CREATE TRIGGER trg_member_sticker_book_state_updated_at
  BEFORE UPDATE ON public.member_sticker_book_state
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.member_sticker_book_state IS
  'Build M: Per-member sticker book state. Active theme, current page, unlock interval, rarity weights, denormalized counters.';


-- member_creature_collection — append-only log of awarded creatures
CREATE TABLE IF NOT EXISTS public.member_creature_collection (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                   UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id            UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  creature_id                 UUID NOT NULL REFERENCES public.gamification_creatures(id),
  sticker_page_id             UUID REFERENCES public.gamification_sticker_pages(id),
  position_x                  REAL CHECK (position_x IS NULL OR (position_x >= 0 AND position_x <= 1)),
  position_y                  REAL CHECK (position_y IS NULL OR (position_y >= 0 AND position_y <= 1)),
  awarded_source_type         TEXT NOT NULL DEFAULT 'task_completion'
                                CHECK (awarded_source_type IN ('task_completion','practice_mastery_approved','manual_award')),
  awarded_source_id           UUID,
  awarded_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.member_creature_collection ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_creature_collection_family_read" ON public.member_creature_collection;
CREATE POLICY "member_creature_collection_family_read"
  ON public.member_creature_collection FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

-- Service role (the RPC) does the inserts. Direct INSERT from client blocked.
DROP POLICY IF EXISTS "member_creature_collection_mom_write" ON public.member_creature_collection;
CREATE POLICY "member_creature_collection_mom_write"
  ON public.member_creature_collection FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  );

CREATE INDEX IF NOT EXISTS idx_member_creature_collection_member_recent
  ON public.member_creature_collection(family_member_id, awarded_at DESC);

CREATE INDEX IF NOT EXISTS idx_member_creature_collection_member_page
  ON public.member_creature_collection(family_member_id, sticker_page_id);

CREATE INDEX IF NOT EXISTS idx_member_creature_collection_source
  ON public.member_creature_collection(awarded_source_id)
  WHERE awarded_source_id IS NOT NULL;

COMMENT ON TABLE public.member_creature_collection IS
  'Build M: Append-only log of creatures awarded to a member. Idempotency via (awarded_source_id) lookup. Position columns support future drag-to-reposition.';


-- member_page_unlocks — append-only log of unlocked sticker pages
CREATE TABLE IF NOT EXISTS public.member_page_unlocks (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                   UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id            UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  sticker_page_id             UUID NOT NULL REFERENCES public.gamification_sticker_pages(id),
  unlocked_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlocked_trigger_type       TEXT NOT NULL DEFAULT 'bootstrap'
                                CHECK (unlocked_trigger_type IN ('bootstrap','creature_count','manual_unlock','streak_milestone','task_completion','tracker_goal')),
  creatures_at_unlock         INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT member_page_unlocks_unique_member_page UNIQUE (family_member_id, sticker_page_id)
);

ALTER TABLE public.member_page_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_page_unlocks_family_read" ON public.member_page_unlocks;
CREATE POLICY "member_page_unlocks_family_read"
  ON public.member_page_unlocks FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "member_page_unlocks_mom_write" ON public.member_page_unlocks;
CREATE POLICY "member_page_unlocks_mom_write"
  ON public.member_page_unlocks FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  );

CREATE INDEX IF NOT EXISTS idx_member_page_unlocks_member_unlocked
  ON public.member_page_unlocks(family_member_id, unlocked_at DESC);

COMMENT ON TABLE public.member_page_unlocks IS
  'Build M: Append-only log of sticker book pages unlocked per member. Bootstrap row inserted by auto_provision_member_resources trigger.';


-- ============================================================================
-- 3. ALTER tasks TABLE
-- ============================================================================

-- 3a. Add points_override (Q4 = Option C) — per-task point value override
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS points_override INTEGER
    CHECK (points_override IS NULL OR points_override >= 0);

COMMENT ON COLUMN public.tasks.points_override IS
  'Build M: Per-task point value. NULL falls through to gamification_configs.base_points_per_task. Used by roll_creature_for_completion RPC.';

-- 3b. Add icon_asset_key + icon_variant (A1 = Option B soft reference)
--     Matches the existing visual_schedule_routine_steps pattern. NOT a UUID FK.
--     Looked up against (category='visual_schedule', feature_key, variant) at render time.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS icon_asset_key TEXT,
  ADD COLUMN IF NOT EXISTS icon_variant TEXT DEFAULT 'B'
    CHECK (icon_variant IS NULL OR icon_variant IN ('A','B','C'));

COMMENT ON COLUMN public.tasks.icon_asset_key IS
  'Build M (§16 addendum, A1 = soft reference): Optional reference to platform_assets.feature_key for the icon used on Play task tiles. Lookup at render time. NULL for non-Play tasks. Pattern matches visual_schedule_routine_steps.';

CREATE INDEX IF NOT EXISTS idx_tasks_icon_asset_key
  ON public.tasks(icon_asset_key)
  WHERE icon_asset_key IS NOT NULL;

-- 3c. Rebuild tasks_source_check adding 'randomizer_reveal' (15 → 16 values)
--     Live baseline = 15 values from migration 100112. Build N (100114) did NOT
--     modify this constraint. Build M adds 'randomizer_reveal' for the future
--     PRD-26 surprise mechanic (the tile is stubbed this build but the source
--     value lands now so the stub can write real data later).
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
    'randomizer_reveal'  -- NEW Build M (PRD-26 stub — tile deferred, enum added now)
  ));


-- ============================================================================
-- 4. SEED — gamification_themes (1 row), creatures (161), sticker_pages (26)
-- ============================================================================
-- The three seed blocks below are generated by scripts/generate-build-m-seeds.cjs
-- from the manifest CSVs in assets/gamification/woodland-felt/. Source of truth:
--   - assets/gamification/woodland-felt/woodland-felt-manifest.csv (creatures)
--   - assets/gamification/woodland-felt/backgrounds-manifest.csv (sticker pages)
--   - assets/gamification/woodland-felt/reveals-manifest.csv (theme videos)

-- Seed Woodland Felt theme row + 2 reveal video URLs
-- Source: assets/gamification/woodland-felt/reveals-manifest.csv (corrected per Build M decision)
INSERT INTO public.gamification_themes
  (theme_slug, display_name, description, creature_reveal_video_url, page_reveal_video_url, is_active, sort_order)
VALUES (
  'woodland_felt',
  'Woodland Felt',
  'Cozy paper-craft woodland creatures and seasonal scene backgrounds. The first gamification theme; default for all members.',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/reveals/Mossy_Chest_Reveal_Video_Ready.mp4',
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/reveals/Fairy_Door_Opens_Magical_Light.mp4',
  true,
  1
)
ON CONFLICT (theme_slug) DO NOTHING;
-- Seed 161 Woodland Felt creatures (125 common + 24 rare + 12 legendary)
-- Source: assets/gamification/woodland-felt/woodland-felt-manifest.csv
DO $$
DECLARE
  v_theme_id UUID;
BEGIN
  SELECT id INTO v_theme_id FROM public.gamification_themes WHERE theme_slug = 'woodland_felt';
  IF v_theme_id IS NULL THEN
    RAISE EXCEPTION 'gamification_themes row for woodland_felt missing — must be inserted before creatures';
  END IF;

  INSERT INTO public.gamification_creatures
    (theme_id, slug, display_name, rarity, tags, description, image_url, sort_order)
  VALUES
  (v_theme_id, 'woodland_felt_baby_badger_mushroom', 'Mushroom Baby Badger', 'common', '{"badger","woodland","mushroom","baby","foraging"}'::text[], 'A baby badger who found its very first mushroom and is enormously proud.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_badger_mushroom.png', 1),
  (v_theme_id, 'woodland_felt_baby_bear_honey_jar', 'Honey Jar Baby Bear', 'common', '{"bear","woodland","honey","baby","sweet"}'::text[], 'A baby bear with its nose deep in a honey jar, blissfully unaware of the mess.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_bear_honey_jar.png', 2),
  (v_theme_id, 'woodland_felt_baby_bear_honey_jar_standing', 'Standing Honey Baby Bear', 'common', '{"bear","woodland","honey","standing","baby","sweet"}'::text[], 'A baby bear standing with a honey jar, face already sticky with happiness.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_bear_honey_jar_standing.png', 3),
  (v_theme_id, 'woodland_felt_baby_beaver_twig', 'Twig Baby Beaver', 'common', '{"beaver","woodland","twig","baby","builder"}'::text[], 'A baby beaver carrying a twig, already dreaming of the dam it will one day build.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_beaver_twig.png', 4),
  (v_theme_id, 'woodland_felt_baby_chipmunk_seed', 'Seed Baby Chipmunk', 'common', '{"chipmunk","woodland","seed","baby","autumn"}'::text[], 'A baby chipmunk carefully inspecting its very first seed with great seriousness.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_chipmunk_seed.png', 5),
  (v_theme_id, 'woodland_felt_baby_chipmunk_seed_standing', 'Standing Seed Baby Chipmunk', 'common', '{"chipmunk","woodland","seed","standing","baby","autumn"}'::text[], 'A baby chipmunk standing with a seed, cheeks already planning where to store it.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_chipmunk_seed_standing.png', 6),
  (v_theme_id, 'woodland_felt_baby_fawn_daisy', 'Daisy Baby Fawn', 'common', '{"deer","fawn","woodland","daisy","baby","spring"}'::text[], 'A newborn fawn with wobbly legs, holding a daisy bigger than its nose.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_fawn_daisy.png', 7),
  (v_theme_id, 'woodland_felt_baby_fawn_daisy_standing', 'Standing Daisy Fawn', 'common', '{"deer","fawn","woodland","daisy","standing","baby","spring"}'::text[], 'A baby fawn standing with a daisy, still figuring out how all four legs work.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_fawn_daisy_standing.png', 8),
  (v_theme_id, 'woodland_felt_baby_hare_carrot', 'Carrot Baby Hare', 'common', '{"hare","woodland","carrot","baby","spring"}'::text[], 'A baby hare clutching a carrot nearly as tall as itself with both little paws.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_hare_carrot.png', 9),
  (v_theme_id, 'woodland_felt_baby_hare_carrot_standing', 'Standing Carrot Baby Hare', 'common', '{"hare","woodland","carrot","standing","baby","spring"}'::text[], 'A baby hare standing with a carrot, ears perked and nose twitching with delight.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_hare_carrot_standing.png', 10),
  (v_theme_id, 'woodland_felt_baby_hedgehog_leaf', 'Leaf Baby Hedgehog', 'common', '{"hedgehog","woodland","leaf","baby","autumn"}'::text[], 'A baby hedgehog curled up inside a fallen leaf like the coziest little nest.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_hedgehog_leaf.png', 11),
  (v_theme_id, 'woodland_felt_baby_hedgehog_leaf_standing', 'Standing Leaf Baby Hedgehog', 'common', '{"hedgehog","woodland","leaf","standing","baby","autumn"}'::text[], 'A baby hedgehog standing in a pile of leaves, poking its little nose out curiously.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_hedgehog_leaf_standing.png', 12),
  (v_theme_id, 'woodland_felt_baby_moose_leaf', 'Leaf Baby Moose', 'common', '{"moose","woodland","leaf","baby","autumn"}'::text[], 'A wobbly baby moose carrying a single autumn leaf like a very important flag.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_moose_leaf.png', 13),
  (v_theme_id, 'woodland_felt_baby_moose_leaf_standing', 'Standing Leaf Baby Moose', 'common', '{"moose","woodland","leaf","standing","baby","autumn"}'::text[], 'A baby moose standing with a leaf, its long legs still getting used to the world.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_moose_leaf_standing.png', 14),
  (v_theme_id, 'woodland_felt_baby_otter_pebble', 'Pebble Baby Otter', 'common', '{"otter","woodland","pebble","baby","river"}'::text[], 'A baby otter clutching its favorite smooth pebble like a precious treasure.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_otter_pebble.png', 15),
  (v_theme_id, 'woodland_felt_baby_otter_pebble_standing', 'Standing Pebble Baby Otter', 'common', '{"otter","woodland","pebble","standing","baby","river"}'::text[], 'A baby otter standing with its pebble, the most important pebble in the river.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_otter_pebble_standing.png', 16),
  (v_theme_id, 'woodland_felt_baby_owl_moon', 'Moon Baby Owl', 'common', '{"owl","woodland","moon","baby","night"}'::text[], 'A fluffy baby owl gazing at a tiny moon, already in love with the night sky.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_owl_moon.png', 17),
  (v_theme_id, 'woodland_felt_baby_owl_moon_standing', 'Standing Moon Baby Owl', 'common', '{"owl","woodland","moon","standing","baby","night"}'::text[], 'A baby owl standing with a moon charm, blinking slowly at the starry sky.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_owl_moon_standing.png', 18),
  (v_theme_id, 'woodland_felt_baby_raccoon_acorn', 'Acorn Baby Raccoon', 'common', '{"raccoon","woodland","acorn","baby","autumn"}'::text[], 'A baby raccoon clutching an acorn with both tiny masked paws.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_raccoon_acorn.png', 19),
  (v_theme_id, 'woodland_felt_baby_raccoon_mask', 'Masked Baby Raccoon', 'common', '{"raccoon","woodland","mask","baby","mischief"}'::text[], 'A baby raccoon already practicing its best mysterious masked expression.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_raccoon_mask.png', 20),
  (v_theme_id, 'woodland_felt_baby_robin_worm', 'Worm Baby Robin', 'common', '{"robin","woodland","bird","worm","baby","spring"}'::text[], 'A fluffy baby robin who caught its very first worm and could not be more proud.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_robin_worm.png', 21),
  (v_theme_id, 'woodland_felt_baby_robin_worm_standing', 'Standing Worm Baby Robin', 'common', '{"robin","woodland","bird","worm","standing","baby","spring"}'::text[], 'A baby robin standing with a worm, the proudest little bird in the whole wood.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_robin_worm_standing.png', 22),
  (v_theme_id, 'woodland_felt_baby_squirrel_nut', 'Nutty Baby Squirrel', 'common', '{"squirrel","woodland","nut","baby","autumn"}'::text[], 'A baby squirrel holding a nut almost as big as its whole fluffy body.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_squirrel_nut.png', 23),
  (v_theme_id, 'woodland_felt_baby_squirrel_nut_standing', 'Standing Nutty Baby Squirrel', 'common', '{"squirrel","woodland","nut","standing","baby","autumn"}'::text[], 'A baby squirrel standing with a nut, tail fluffed up with tremendous pride.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_squirrel_nut_standing.png', 24),
  (v_theme_id, 'woodland_felt_baby_wolf_stick', 'Stick Baby Wolf', 'common', '{"wolf","woodland","stick","baby","playful"}'::text[], 'A baby wolf pup dragging a stick twice its size through the forest with great pride.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_wolf_stick.png', 25),
  (v_theme_id, 'woodland_felt_baby_wolf_stick_standing', 'Standing Stick Baby Wolf', 'common', '{"wolf","woodland","stick","standing","baby","playful"}'::text[], 'A baby wolf standing with its stick, practicing its most ferocious expression.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_wolf_stick_standing.png', 26),
  (v_theme_id, 'woodland_felt_baby_wren_berry', 'Berry Baby Wren', 'common', '{"wren","woodland","bird","berry","baby"}'::text[], 'A tiny baby wren carrying a berry that took three whole tries to pick up.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_wren_berry.png', 27),
  (v_theme_id, 'woodland_felt_baby_wren_berry_standing', 'Standing Berry Baby Wren', 'common', '{"wren","woodland","bird","berry","standing","baby"}'::text[], 'A baby wren standing with a berry, singing a song about how good it tastes.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_baby_wren_berry_standing.png', 28),
  (v_theme_id, 'woodland_felt_badger_walking_stick', 'Walking Stick Badger', 'common', '{"badger","woodland","walking stick","adventure"}'::text[], 'A wise old badger setting off on a woodland adventure with his trusty stick.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_badger_walking_stick.png', 29),
  (v_theme_id, 'woodland_felt_badger_walking_stick_standing', 'Standing Badger Explorer', 'common', '{"badger","woodland","walking stick","standing","adventure"}'::text[], 'A badger standing tall with its walking stick, ready for a grand forest expedition.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_badger_walking_stick_standing.png', 30),
  (v_theme_id, 'woodland_felt_barn_owl_lantern', 'Lantern Owl', 'common', '{"owl","barn owl","woodland","lantern","night"}'::text[], 'A barn owl carrying a tiny lantern, lighting the way home through the trees.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_barn_owl_lantern.png', 31),
  (v_theme_id, 'woodland_felt_barn_owl_lantern_perched', 'Perched Lantern Owl', 'common', '{"owl","barn owl","woodland","lantern","perched","night"}'::text[], 'A barn owl perched with a lantern, keeping watch over the sleeping forest.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_barn_owl_lantern_perched.png', 32),
  (v_theme_id, 'woodland_felt_bear_cub_honeypot', 'Honeypot Bear Cub', 'common', '{"bear","bear cub","woodland","honey","sweet"}'::text[], 'A round little bear cub clutching a honey pot with both sticky paws.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_bear_cub_honeypot.png', 33),
  (v_theme_id, 'woodland_felt_bear_cub_honeypot_standing', 'Standing Honeypot Bear', 'common', '{"bear","bear cub","woodland","honey","standing","sweet"}'::text[], 'A bear cub standing with a honeypot, sticky-pawed and absolutely delighted.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_bear_cub_honeypot_standing.png', 34),
  (v_theme_id, 'woodland_felt_beaver_log', 'Log Beaver', 'common', '{"beaver","woodland","log","builder"}'::text[], 'A proud beaver carrying a freshly gnawed log for the day''s big project.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_beaver_log.png', 35),
  (v_theme_id, 'woodland_felt_beaver_log_standing', 'Standing Log Beaver', 'common', '{"beaver","woodland","log","standing","builder"}'::text[], 'A beaver standing upright with a log under one arm, always building something new.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_beaver_log_standing.png', 36),
  (v_theme_id, 'woodland_felt_blue_tit_seed', 'Seed Blue Tit', 'common', '{"blue tit","woodland","bird","seed","spring"}'::text[], 'A bright blue tit balancing a seed with the greatest of care.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_blue_tit_seed.png', 37),
  (v_theme_id, 'woodland_felt_blue_tit_seed_standing', 'Standing Seed Blue Tit', 'common', '{"blue tit","woodland","bird","seed","standing","spring"}'::text[], 'A blue tit standing with a seed, its bright colors lighting up the grey morning.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_blue_tit_seed_standing.png', 38),
  (v_theme_id, 'woodland_felt_bobcat_kitten_leaf', 'Leaf Bobcat Kitten', 'common', '{"bobcat","bobcat kitten","woodland","leaf","playful"}'::text[], 'A spotted bobcat kitten pouncing on a fallen leaf with full hunting intensity.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_bobcat_kitten_leaf.png', 39),
  (v_theme_id, 'woodland_felt_bobcat_kitten_leaf_standing', 'Standing Leaf Bobcat', 'common', '{"bobcat","bobcat kitten","woodland","leaf","standing","playful"}'::text[], 'A bobcat kitten standing with a leaf, spots twitching with barely contained energy.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_bobcat_kitten_leaf_standing.png', 40),
  (v_theme_id, 'woodland_felt_bumblebee_flower', 'Flower Bumblebee', 'common', '{"bumblebee","woodland","flower","pollinator","spring"}'::text[], 'A round bumblebee clutching a flower, buzzing with the joy of a perfect spring day.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_bumblebee_flower.png', 41),
  (v_theme_id, 'woodland_felt_canada_goose_scarf', 'Scarf Canada Goose', 'common', '{"goose","canada goose","woodland","scarf","migration"}'::text[], 'A Canada goose in a cozy scarf, pausing its migration for a well-earned rest.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_canada_goose_scarf.png', 42),
  (v_theme_id, 'woodland_felt_canada_lynx_snowflake', 'Snowflake Canada Lynx', 'common', '{"lynx","canada lynx","woodland","snowflake","winter"}'::text[], 'A fluffy Canada lynx catching a snowflake on its enormous fuzzy paw.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_canada_lynx_snowflake.png', 43),
  (v_theme_id, 'woodland_felt_canada_lynx_snowflake_standing', 'Standing Snowflake Lynx', 'common', '{"lynx","canada lynx","woodland","snowflake","standing","winter"}'::text[], 'A Canada lynx standing with a snowflake, enormous paws perfect for the deep snow.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_canada_lynx_snowflake_standing.png', 44),
  (v_theme_id, 'woodland_felt_chickadee_berry', 'Berry Chickadee', 'common', '{"chickadee","woodland","bird","berry","winter"}'::text[], 'A cheerful chickadee clutching a bright red berry against the winter cold.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_chickadee_berry.png', 45),
  (v_theme_id, 'woodland_felt_chickadee_berry_standing', 'Standing Berry Chickadee', 'common', '{"chickadee","woodland","bird","berry","standing","winter"}'::text[], 'A chickadee standing with a berry, singing its cheerful song into the cold air.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_chickadee_berry_standing.png', 46),
  (v_theme_id, 'woodland_felt_chipmunk_nut', 'Nutty Chipmunk', 'common', '{"chipmunk","woodland","nut","autumn"}'::text[], 'A cheerful chipmunk with cheeks full of promise and a nut to spare.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_chipmunk_nut.png', 47),
  (v_theme_id, 'woodland_felt_chipmunk_nut_standing', 'Standing Nutty Chipmunk', 'common', '{"chipmunk","woodland","nut","standing","autumn"}'::text[], 'A chipmunk standing at attention, nut in hand, ready for whatever comes next.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_chipmunk_nut_standing.png', 48),
  (v_theme_id, 'woodland_felt_dormouse_hazelnut', 'Hazelnut Dormouse', 'common', '{"dormouse","woodland","hazelnut","sleepy"}'::text[], 'A drowsy dormouse clutching a hazelnut, already dreaming of hibernation.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_dormouse_hazelnut.png', 49),
  (v_theme_id, 'woodland_felt_elk_calf_acorn', 'Acorn Elk Calf', 'common', '{"elk","elk calf","woodland","acorn","autumn"}'::text[], 'A young elk calf discovering its very first acorn with wide, wondering eyes.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_elk_calf_acorn.png', 50),
  (v_theme_id, 'woodland_felt_fawn_flower_crown', 'Flower Crown Fawn', 'common', '{"deer","fawn","woodland","flower crown","spring"}'::text[], 'A gentle fawn wearing a crown of wildflowers, soft as a morning meadow.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_fawn_flower_crown.png', 51),
  (v_theme_id, 'woodland_felt_fawn_flower_crown_standing', 'Standing Flower Fawn', 'common', '{"deer","fawn","woodland","flower crown","standing","spring"}'::text[], 'A fawn standing tall and proud in its flower crown, the belle of the meadow.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_fawn_flower_crown_standing.png', 52),
  (v_theme_id, 'woodland_felt_field_mouse_berry', 'Berry Mouse', 'common', '{"mouse","field mouse","woodland","berry","foraging"}'::text[], 'A tiny field mouse who found the sweetest berry in the whole meadow.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_field_mouse_berry.png', 53),
  (v_theme_id, 'woodland_felt_field_mouse_berry_standing', 'Standing Berry Mouse', 'common', '{"mouse","field mouse","woodland","berry","standing","foraging"}'::text[], 'A field mouse standing on tiptoe, berry held high like a tiny trophy.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_field_mouse_berry_standing.png', 54),
  (v_theme_id, 'woodland_felt_fisher_cat_berry', 'Berry Fisher Cat', 'common', '{"fisher cat","woodland","berry","forest"}'::text[], 'A bold fisher cat presenting a cluster of wild berries from deep in the pines.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_fisher_cat_berry.png', 55),
  (v_theme_id, 'woodland_felt_fisher_cat_berry_standing', 'Standing Berry Fisher Cat', 'common', '{"fisher cat","woodland","berry","standing","forest"}'::text[], 'A fisher cat standing with berries, king of the deep pine forest.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_fisher_cat_berry_standing.png', 56),
  (v_theme_id, 'woodland_felt_flying_squirrel_lantern', 'Lantern Flying Squirrel', 'common', '{"flying squirrel","woodland","lantern","night","glide"}'::text[], 'A flying squirrel gliding through the night with a tiny lantern lighting the way.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_flying_squirrel_lantern.png', 57),
  (v_theme_id, 'woodland_felt_flying_squirrel_lantern_standing', 'Standing Lantern Flying Squirrel', 'common', '{"flying squirrel","woodland","lantern","standing","night","glide"}'::text[], 'A flying squirrel standing with a lantern, ready to glide off into the starry night.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_flying_squirrel_lantern_standing.png', 58),
  (v_theme_id, 'woodland_felt_fox_bowtie', 'Bowtie Fox', 'common', '{"fox","woodland","bowtie","formal"}'::text[], 'A dapper fox in his finest woodland bowtie, ready for the autumn ball.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_fox_bowtie.png', 59),
  (v_theme_id, 'woodland_felt_fox_bowtie_sitting', 'Sitting Bowtie Fox', 'common', '{"fox","woodland","bowtie","sitting","formal"}'::text[], 'A fox sitting very properly in its bowtie, waiting for the forest gala to begin.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_fox_bowtie_sitting.png', 60),
  (v_theme_id, 'woodland_felt_fox_kit_berry', 'Berry Fox Kit', 'common', '{"fox","fox kit","woodland","berry","baby"}'::text[], 'A tiny fox kit discovering berries for the very first time, eyes wide with wonder.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_fox_kit_berry.png', 61),
  (v_theme_id, 'woodland_felt_fox_kit_berry_standing', 'Standing Berry Fox Kit', 'common', '{"fox","fox kit","woodland","berry","standing","baby"}'::text[], 'A fox kit standing with a berry, tail wagging, absolutely thrilled with life.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_fox_kit_berry_standing.png', 62),
  (v_theme_id, 'woodland_felt_garden_snail_shell', 'Shell Garden Snail', 'common', '{"snail","garden snail","woodland","shell","slow","peaceful"}'::text[], 'A garden snail carrying its beautiful spiral home wherever the path may lead.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_garden_snail_shell.png', 63),
  (v_theme_id, 'woodland_felt_great_horned_owl_book', 'Bookworm Owl', 'common', '{"owl","great horned owl","woodland","book","wise"}'::text[], 'A great horned owl deep in a tiny book, learning all the forest''s secrets.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_great_horned_owl_book.png', 64),
  (v_theme_id, 'woodland_felt_great_horned_owl_book_standing', 'Standing Bookworm Owl', 'common', '{"owl","great horned owl","woodland","book","standing","wise"}'::text[], 'A great horned owl standing with a tiny book, the wisest creature in the whole wood.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_great_horned_owl_book_standing.png', 65),
  (v_theme_id, 'woodland_felt_grey_fox_acorn', 'Acorn Grey Fox', 'common', '{"fox","grey fox","woodland","acorn","autumn"}'::text[], 'A silver-grey fox balancing an acorn on its nose just to show it can.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_grey_fox_acorn.png', 66),
  (v_theme_id, 'woodland_felt_grey_fox_acorn_standing', 'Standing Acorn Grey Fox', 'common', '{"fox","grey fox","woodland","acorn","standing","autumn"}'::text[], 'A grey fox standing with an acorn, silver fur glowing in the autumn light.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_grey_fox_acorn_standing.png', 67),
  (v_theme_id, 'woodland_felt_hedgehog_scarf', 'Scarf Hedgehog', 'common', '{"hedgehog","woodland","scarf","cozy","winter"}'::text[], 'A cozy hedgehog wrapped in a knitted scarf, ready for the first frost.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_hedgehog_scarf.png', 68),
  (v_theme_id, 'woodland_felt_hedgehog_scarf_green', 'Green Scarf Hedgehog', 'common', '{"hedgehog","woodland","scarf","green","cozy","winter"}'::text[], 'A hedgehog bundled in a forest-green scarf, perfectly matching the pine trees.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_hedgehog_scarf_green.png', 69),
  (v_theme_id, 'woodland_felt_lynx_kitten_bell', 'Bell Lynx Kitten', 'common', '{"lynx","lynx kitten","woodland","bell","curious"}'::text[], 'A tufted lynx kitten batting at a tiny bell with irresistible curiosity.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_lynx_kitten_bell.png', 70),
  (v_theme_id, 'woodland_felt_lynx_kitten_bell_standing', 'Standing Bell Lynx', 'common', '{"lynx","lynx kitten","woodland","bell","standing","curious"}'::text[], 'A lynx kitten standing with a tiny bell, ears perked at every forest sound.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_lynx_kitten_bell_standing.png', 71),
  (v_theme_id, 'woodland_felt_mallard_duck_hat', 'Hat Mallard Duck', 'common', '{"duck","mallard","woodland","hat","dapper"}'::text[], 'A mallard duck in a dashing hat, taking a leisurely stroll along the riverbank.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_mallard_duck_hat.png', 72),
  (v_theme_id, 'woodland_felt_mink_feather', 'Feather Mink', 'common', '{"mink","woodland","feather","sleek"}'::text[], 'A sleek mink twirling a feather with effortless woodland elegance.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_mink_feather.png', 73),
  (v_theme_id, 'woodland_felt_mink_feather_standing', 'Standing Feather Mink', 'common', '{"mink","woodland","feather","standing","sleek"}'::text[], 'A sleek mink standing with a feather, the most graceful creature on the riverbank.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_mink_feather_standing.png', 74),
  (v_theme_id, 'woodland_felt_mole_shovel', 'Shovel Mole', 'common', '{"mole","woodland","shovel","digger"}'::text[], 'A hardworking mole with a tiny shovel, always ready to dig something wonderful.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_mole_shovel.png', 75),
  (v_theme_id, 'woodland_felt_mole_shovel_standing', 'Standing Shovel Mole', 'common', '{"mole","woodland","shovel","standing","digger"}'::text[], 'A mole standing with its shovel, proud of every tunnel it has ever dug.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_mole_shovel_standing.png', 76),
  (v_theme_id, 'woodland_felt_moose_calf_leaf_crown', 'Leaf Crown Moose', 'common', '{"moose","moose calf","woodland","leaf crown","autumn"}'::text[], 'A gangly moose calf wearing a crown of autumn leaves with quiet dignity.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_moose_calf_leaf_crown.png', 77),
  (v_theme_id, 'woodland_felt_moose_calf_leaf_crown_standing', 'Standing Leaf Crown Moose', 'common', '{"moose","moose calf","woodland","leaf crown","standing","autumn"}'::text[], 'A moose calf standing tall in its leaf crown, the most regal creature in the glen.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_moose_calf_leaf_crown_standing.png', 78),
  (v_theme_id, 'woodland_felt_mountain_hare_scarf', 'Scarf Mountain Hare', 'common', '{"hare","mountain hare","woodland","scarf","winter"}'::text[], 'A mountain hare wrapped in a warm scarf, perfectly camouflaged for the snow.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_mountain_hare_scarf.png', 79),
  (v_theme_id, 'woodland_felt_mountain_hare_scarf_standing', 'Standing Scarf Hare', 'common', '{"hare","mountain hare","woodland","scarf","standing","winter"}'::text[], 'A mountain hare standing in its scarf, ready to bound across the snowy hillside.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_mountain_hare_scarf_standing.png', 80),
  (v_theme_id, 'woodland_felt_nuthatch_pinecone', 'Pinecone Nuthatch', 'common', '{"nuthatch","woodland","bird","pinecone","autumn"}'::text[], 'A nimble nuthatch balancing upside-down with a pinecone just because it can.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_nuthatch_pinecone.png', 81),
  (v_theme_id, 'woodland_felt_otter_fish', 'Fishing Otter', 'common', '{"otter","woodland","fish","river"}'::text[], 'A playful otter who caught the biggest fish in the whole river today.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_otter_fish.png', 82),
  (v_theme_id, 'woodland_felt_otter_fish_standing', 'Standing Fishing Otter', 'common', '{"otter","woodland","fish","standing","river"}'::text[], 'A river otter standing proudly with today''s catch, grinning from ear to ear.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_otter_fish_standing.png', 83),
  (v_theme_id, 'woodland_felt_pine_marten_feather', 'Feather Pine Marten', 'common', '{"pine marten","woodland","feather","elegant"}'::text[], 'An elegant pine marten twirling a feather it found on the forest path.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_pine_marten_feather.png', 84),
  (v_theme_id, 'woodland_felt_pine_marten_feather_standing', 'Standing Feather Pine Marten', 'common', '{"pine marten","woodland","feather","standing","elegant"}'::text[], 'A pine marten standing with a feather, the most graceful creature in the canopy.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_pine_marten_feather_standing.png', 85),
  (v_theme_id, 'woodland_felt_porcupine_quill', 'Quill Porcupine', 'common', '{"porcupine","woodland","quill","writing"}'::text[], 'A thoughtful porcupine using one of its own quills as a writing pen.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_porcupine_quill.png', 86),
  (v_theme_id, 'woodland_felt_porcupine_quill_standing', 'Standing Quill Porcupine', 'common', '{"porcupine","woodland","quill","standing","writing"}'::text[], 'A porcupine standing with quill in hand, composing a letter to the whole forest.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_porcupine_quill_standing.png', 87),
  (v_theme_id, 'woodland_felt_raccoon_acorn', 'Acorn Raccoon', 'common', '{"raccoon","woodland","acorn","autumn"}'::text[], 'A curious raccoon clutching a prized acorn like the treasure it truly is.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_raccoon_acorn.png', 88),
  (v_theme_id, 'woodland_felt_raccoon_acorn_standing', 'Standing Acorn Raccoon', 'common', '{"raccoon","woodland","acorn","standing","autumn"}'::text[], 'A raccoon standing upright, holding its acorn up to the light with great pride.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_raccoon_acorn_standing.png', 89),
  (v_theme_id, 'woodland_felt_red_deer_stag_pinecone', 'Pinecone Stag', 'common', '{"deer","red deer","stag","woodland","pinecone","autumn"}'::text[], 'A noble red deer stag presenting a pinecone with quiet woodland dignity.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_red_deer_stag_pinecone.png', 90),
  (v_theme_id, 'woodland_felt_red_deer_stag_pinecone_standing', 'Standing Pinecone Stag', 'common', '{"deer","red deer","stag","woodland","pinecone","standing","autumn"}'::text[], 'A red deer stag standing with a pinecone, surveying the autumn forest with quiet pride.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_red_deer_stag_pinecone_standing.png', 91),
  (v_theme_id, 'woodland_felt_red_panda_bamboo', 'Bamboo Red Panda', 'common', '{"red panda","woodland","bamboo","cozy"}'::text[], 'A fluffy red panda nibbling on a bamboo shoot in the afternoon sun.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_red_panda_bamboo.png', 92),
  (v_theme_id, 'woodland_felt_red_panda_bamboo_standing', 'Standing Bamboo Red Panda', 'common', '{"red panda","woodland","bamboo","standing","cozy"}'::text[], 'A red panda standing with bamboo, perfectly content in its high forest home.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_red_panda_bamboo_standing.png', 93),
  (v_theme_id, 'woodland_felt_red_squirrel_bamboo', 'Bamboo Red Squirrel', 'common', '{"squirrel","red squirrel","woodland","bamboo","curious"}'::text[], 'A red squirrel who wandered far and found a bamboo shoot — a woodland mystery.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_red_squirrel_bamboo.png', 94),
  (v_theme_id, 'woodland_felt_red_squirrel_pinecone', 'Pinecone Red Squirrel', 'common', '{"squirrel","red squirrel","woodland","pinecone","autumn"}'::text[], 'A bright-eyed red squirrel proudly presenting the season''s finest pinecone.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_red_squirrel_pinecone.png', 95),
  (v_theme_id, 'woodland_felt_red_squirrel_pinecone_standing', 'Standing Pinecone Squirrel', 'common', '{"squirrel","red squirrel","woodland","pinecone","standing","autumn"}'::text[], 'A red squirrel standing tall, pinecone in paws, surveying its woodland kingdom.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_red_squirrel_pinecone_standing.png', 96),
  (v_theme_id, 'woodland_felt_robin_worm', 'Worm Robin', 'common', '{"robin","woodland","bird","worm","spring"}'::text[], 'An early robin who definitely caught the worm this morning.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_robin_worm.png', 97),
  (v_theme_id, 'woodland_felt_robin_worm_standing', 'Standing Worm Robin', 'common', '{"robin","woodland","bird","worm","standing","spring"}'::text[], 'A robin standing bright and cheerful, worm dangling, ready for breakfast.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_robin_worm_standing.png', 98),
  (v_theme_id, 'woodland_felt_salamander_dewdrop', 'Dewdrop Salamander', 'common', '{"salamander","woodland","dewdrop","morning"}'::text[], 'A spotted salamander cradling a perfect dewdrop from the morning ferns.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_salamander_dewdrop.png', 99),
  (v_theme_id, 'woodland_felt_screech_owl_moon', 'Moon Screech Owl', 'common', '{"owl","screech owl","woodland","moon","night"}'::text[], 'A screech owl gazing at a tiny moon charm, dreaming of midnight flights.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_screech_owl_moon.png', 100),
  (v_theme_id, 'woodland_felt_screech_owl_moon_standing', 'Standing Moon Owl', 'common', '{"owl","screech owl","woodland","moon","standing","night"}'::text[], 'A screech owl standing with a moon charm, counting the hours until nightfall.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_screech_owl_moon_standing.png', 101),
  (v_theme_id, 'woodland_felt_shrew_berry', 'Berry Shrew', 'common', '{"shrew","woodland","berry","tiny"}'::text[], 'The tiniest shrew in the forest, carrying the biggest berry she could find.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_shrew_berry.png', 102),
  (v_theme_id, 'woodland_felt_shrew_berry_standing', 'Standing Berry Shrew', 'common', '{"shrew","woodland","berry","standing","tiny"}'::text[], 'A shrew standing upright, berry in paws, absolutely certain it is the biggest creature here.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_shrew_berry_standing.png', 103),
  (v_theme_id, 'woodland_felt_skunk_flower', 'Flower Skunk', 'common', '{"skunk","woodland","flower","sweet"}'::text[], 'A sweet skunk offering a flower — proof that first impressions aren''t everything.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_skunk_flower.png', 104),
  (v_theme_id, 'woodland_felt_skunk_flower_standing', 'Standing Flower Skunk', 'common', '{"skunk","woodland","flower","standing","sweet"}'::text[], 'A skunk standing with a flower, hoping it will make a good first impression.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_skunk_flower_standing.png', 105),
  (v_theme_id, 'woodland_felt_snowy_owl_snowflake', 'Snowflake Snowy Owl', 'common', '{"owl","snowy owl","woodland","snowflake","winter"}'::text[], 'A snowy owl catching a single perfect snowflake on its wing.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_snowy_owl_snowflake.png', 106),
  (v_theme_id, 'woodland_felt_snowy_owl_snowflake_standing', 'Standing Snowflake Owl', 'common', '{"owl","snowy owl","woodland","snowflake","standing","winter"}'::text[], 'A snowy owl standing with a snowflake, perfectly at home in the winter white.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_snowy_owl_snowflake_standing.png', 107),
  (v_theme_id, 'woodland_felt_squirrel_acorn', 'Acorn Squirrel', 'common', '{"squirrel","woodland","acorn","autumn"}'::text[], 'A grey squirrel carefully storing away the season''s finest acorn.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_squirrel_acorn.png', 108),
  (v_theme_id, 'woodland_felt_squirrel_acorn_grey', 'Grey Acorn Squirrel', 'common', '{"squirrel","grey squirrel","woodland","acorn","autumn"}'::text[], 'A grey squirrel with the most important acorn in the whole autumn forest.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_squirrel_acorn_grey.png', 109),
  (v_theme_id, 'woodland_felt_stoat_scarf', 'Scarf Stoat', 'common', '{"stoat","woodland","scarf","winter"}'::text[], 'A sleek stoat bundled up in a cozy scarf for the cold season.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_stoat_scarf.png', 110),
  (v_theme_id, 'woodland_felt_stoat_scarf_standing', 'Standing Scarf Stoat', 'common', '{"stoat","woodland","scarf","standing","winter"}'::text[], 'A stoat standing elegantly in its scarf, the most fashionable creature in the snow.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_stoat_scarf_standing.png', 111),
  (v_theme_id, 'woodland_felt_toad_umbrella', 'Umbrella Toad', 'common', '{"toad","woodland","umbrella","rain"}'::text[], 'A prepared toad with a tiny umbrella, never caught off guard by a spring shower.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_toad_umbrella.png', 112),
  (v_theme_id, 'woodland_felt_toad_umbrella_standing', 'Standing Umbrella Toad', 'common', '{"toad","woodland","umbrella","standing","rain"}'::text[], 'A toad standing with its umbrella, completely unbothered by the drizzle.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_toad_umbrella_standing.png', 113),
  (v_theme_id, 'woodland_felt_vole_seed', 'Seed Vole', 'common', '{"vole","woodland","seed","meadow"}'::text[], 'A round little vole clutching a seed for the winter ahead.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_vole_seed.png', 114),
  (v_theme_id, 'woodland_felt_vole_seed_standing', 'Standing Seed Vole', 'common', '{"vole","woodland","seed","standing","meadow"}'::text[], 'A vole standing with a seed, making very careful plans for the winter ahead.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_vole_seed_standing.png', 115),
  (v_theme_id, 'woodland_felt_weasel_mushroom', 'Mushroom Weasel', 'common', '{"weasel","woodland","mushroom","foraging"}'::text[], 'A quick-footed weasel who found a perfect mushroom on the forest floor.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_weasel_mushroom.png', 116),
  (v_theme_id, 'woodland_felt_weasel_mushroom_standing', 'Standing Mushroom Weasel', 'common', '{"weasel","woodland","mushroom","standing","foraging"}'::text[], 'A weasel standing with a mushroom, having already eaten three others on the way here.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_weasel_mushroom_standing.png', 117),
  (v_theme_id, 'woodland_felt_wild_boar_mushroom', 'Mushroom Boar', 'common', '{"boar","wild boar","woodland","mushroom","foraging"}'::text[], 'A sturdy wild boar who nosed out the finest mushroom in the whole forest.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_wild_boar_mushroom.png', 118),
  (v_theme_id, 'woodland_felt_wolf_pup_stick', 'Stick Wolf Pup', 'common', '{"wolf","wolf pup","woodland","stick","playful"}'::text[], 'A wolf pup who found the best stick in the whole forest and will not share it.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_wolf_pup_stick.png', 119),
  (v_theme_id, 'woodland_felt_wolf_pup_stick_standing', 'Standing Stick Wolf Pup', 'common', '{"wolf","wolf pup","woodland","stick","standing","playful"}'::text[], 'A wolf pup standing with its favorite stick, daring anyone to try and take it.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_wolf_pup_stick_standing.png', 120),
  (v_theme_id, 'woodland_felt_wood_duck_lily_pad', 'Lily Pad Wood Duck', 'common', '{"duck","wood duck","woodland","lily pad","pond"}'::text[], 'A wood duck balancing on a lily pad, admiring its own reflection in the still water.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_wood_duck_lily_pad.png', 121),
  (v_theme_id, 'woodland_felt_wood_mouse_acorn_cap', 'Acorn Cap Mouse', 'common', '{"mouse","wood mouse","woodland","acorn cap","hat"}'::text[], 'A wood mouse wearing an acorn cap as a hat, the height of forest fashion.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_wood_mouse_acorn_cap.png', 122),
  (v_theme_id, 'woodland_felt_woodpecker_acorn', 'Acorn Woodpecker', 'common', '{"woodpecker","woodland","bird","acorn","autumn"}'::text[], 'A determined woodpecker who traded its tap-tap-tapping for a fine acorn today.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_woodpecker_acorn.png', 123),
  (v_theme_id, 'woodland_felt_wren_leaf', 'Leaf Wren', 'common', '{"wren","woodland","bird","leaf","autumn"}'::text[], 'A tiny wren carrying a leaf nearly as big as itself.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_wren_leaf.png', 124),
  (v_theme_id, 'woodland_felt_wren_leaf_standing', 'Standing Leaf Wren', 'common', '{"wren","woodland","bird","leaf","standing","autumn"}'::text[], 'A tiny wren standing with a leaf, looking far more dignified than its size suggests.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_wren_leaf_standing.png', 125),
  (v_theme_id, 'woodland_felt_aurora_bear_glowing_honey', 'Aurora Bear', 'rare', '{"bear","woodland","aurora","honey","rare","magical"}'::text[], 'A bear cub whose fur shimmers with the northern lights, carrying a softly glowing honey jar.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_aurora_bear_glowing_honey.png', 126),
  (v_theme_id, 'woodland_felt_bloom_badger_flower_bouquet', 'Bloom Badger', 'legendary', '{"badger","woodland","bloom","flowers","bouquet","legendary","magical"}'::text[], 'A badger with flowers woven through its fur, carrying a bouquet that never wilts.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_bloom_badger_flower_bouquet.png', 127),
  (v_theme_id, 'woodland_felt_celestial_rabbit_moon_sliver', 'Celestial Rabbit', 'legendary', '{"rabbit","woodland","celestial","moon","stars","legendary","magical"}'::text[], 'A rabbit with midnight-blue fur and silver star markings, holding a sliver of the moon itself.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_celestial_rabbit_moon_sliver.png', 128),
  (v_theme_id, 'woodland_felt_constellation_owl_moon_staff', 'Constellation Owl', 'rare', '{"owl","woodland","constellation","moon","staff","rare","magical"}'::text[], 'An owl whose feathers map the constellations, carrying a crescent moon staff through the night.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_constellation_owl_moon_staff.png', 129),
  (v_theme_id, 'woodland_felt_copper_beaver_enchanted_belt', 'Copper Beaver', 'rare', '{"beaver","woodland","copper","enchanted","belt","rare","magical"}'::text[], 'A beaver with warm copper fur and an enchanted tool belt that builds things all on its own.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_copper_beaver_enchanted_belt.png', 130),
  (v_theme_id, 'woodland_felt_crystal_deer_antlers', 'Crystal Deer', 'rare', '{"deer","woodland","crystal","antlers","rare","magical"}'::text[], 'A deer whose antlers are made of pale crystal, catching every color of the morning light.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_crystal_deer_antlers.png', 131),
  (v_theme_id, 'woodland_felt_crystal_stag_amethyst_antlers', 'Crystal Stag', 'rare', '{"deer","stag","woodland","crystal","amethyst","antlers","rare","mythical"}'::text[], 'A miniature stag with faceted amethyst antlers that scatter soft purple light.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_crystal_stag_amethyst_antlers.png', 132),
  (v_theme_id, 'woodland_felt_dawn_squirrel_sunbeam_acorn', 'Dawn Squirrel', 'legendary', '{"squirrel","woodland","dawn","sunbeam","acorn","legendary","magical"}'::text[], 'A squirrel with rose-gold fur holding an acorn that captures the first light of dawn.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_dawn_squirrel_sunbeam_acorn.png', 133),
  (v_theme_id, 'woodland_felt_dusk_raccoon_twilight_lantern', 'Dusk Raccoon', 'legendary', '{"raccoon","woodland","dusk","twilight","lantern","legendary","magical"}'::text[], 'A raccoon with deep twilight-purple fur, carrying a lantern that glows at dusk.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_dusk_raccoon_twilight_lantern.png', 134),
  (v_theme_id, 'woodland_felt_ember_fox_flame_wisps', 'Ember Fox', 'legendary', '{"fox","woodland","ember","flame","legendary","magical"}'::text[], 'A fox with crimson and ember fur, leaving tiny warm wisps of flame in its wake.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_ember_fox_flame_wisps.png', 135),
  (v_theme_id, 'woodland_felt_fairy_hedgehog_iridescent_wings', 'Fairy Hedgehog', 'rare', '{"hedgehog","woodland","fairy","wings","iridescent","rare","mythical"}'::text[], 'A hedgehog with tiny iridescent wings, hovering just above the forest floor.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_fairy_hedgehog_iridescent_wings.png', 136),
  (v_theme_id, 'woodland_felt_frost_owl_ice_crystals', 'Frost Owl', 'legendary', '{"owl","woodland","frost","ice","crystal","legendary","magical"}'::text[], 'An owl whose feathers end in ice crystals, bringing the first frost wherever it flies.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_frost_owl_ice_crystals.png', 137),
  (v_theme_id, 'woodland_felt_galaxy_fox_crystal', 'Galaxy Fox', 'rare', '{"fox","woodland","galaxy","crystal","rare","magical"}'::text[], 'A fox whose fur holds the whole night sky, wearing a crystal pendant that catches starlight.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_galaxy_fox_crystal.png', 138),
  (v_theme_id, 'woodland_felt_golden_squirrel_glowing_acorn', 'Golden Squirrel', 'rare', '{"squirrel","woodland","golden","acorn","rare","magical"}'::text[], 'A squirrel with shimmering golden fur, holding an acorn that glows like a tiny sun.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_golden_squirrel_glowing_acorn.png', 139),
  (v_theme_id, 'woodland_felt_hollow_owl_glowing_mushroom', 'Hollow Owl', 'legendary', '{"owl","woodland","hollow","mushroom","glow","legendary","magical"}'::text[], 'An owl with bark-textured feathers, carrying a glowing mushroom from the deepest hollow.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_hollow_owl_glowing_mushroom.png', 140),
  (v_theme_id, 'woodland_felt_jackalope_spring_antlers', 'Jackalope', 'rare', '{"jackalope","woodland","antlers","spring","flowers","rare","mythical"}'::text[], 'A fluffy jackalope with branching antlers blooming with tiny spring flowers.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_jackalope_spring_antlers.png', 141),
  (v_theme_id, 'woodland_felt_kitsune_two_tails_blossoms', 'Kitsune', 'rare', '{"kitsune","fox","woodland","two tails","cherry blossom","rare","mythical"}'::text[], 'A kitsune with two fluffy tails, surrounded by drifting cherry blossom petals.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_kitsune_two_tails_blossoms.png', 142),
  (v_theme_id, 'woodland_felt_lavender_rabbit_flower_cloak', 'Lavender Rabbit', 'rare', '{"rabbit","woodland","lavender","flower","cloak","rare","magical"}'::text[], 'A rabbit in soft lavender fur, wrapped in a cloak woven entirely from wildflowers.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_lavender_rabbit_flower_cloak.png', 143),
  (v_theme_id, 'woodland_felt_moon_hare_crescent_markings', 'Moon Hare', 'rare', '{"hare","rabbit","woodland","moon","crescent","rare","mythical"}'::text[], 'A hare with blue-white fur and crescent moon markings, born from a moonlit meadow.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_moon_hare_crescent_markings.png', 144),
  (v_theme_id, 'woodland_felt_moss_turtle_flower_shell', 'Moss Turtle', 'rare', '{"turtle","woodland","moss","flowers","shell","rare","mythical"}'::text[], 'A turtle whose shell is a tiny garden of moss and wildflowers in full bloom.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_moss_turtle_flower_shell.png', 145),
  (v_theme_id, 'woodland_felt_mushroom_sprite_toadstool', 'Mushroom Sprite', 'rare', '{"sprite","woodland","mushroom","toadstool","rare","mythical"}'::text[], 'A tiny sprite peeking out from under a red-spotted toadstool cap with enormous curious eyes.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_mushroom_sprite_toadstool.png', 146),
  (v_theme_id, 'woodland_felt_pearl_mouse_sparkling_dandelion', 'Pearl Mouse', 'rare', '{"mouse","woodland","pearl","dandelion","rare","magical"}'::text[], 'A mouse with pearlescent fur holding a dandelion whose seeds sparkle like tiny stars.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_pearl_mouse_sparkling_dandelion.png', 147),
  (v_theme_id, 'woodland_felt_petal_deer_daisy_crown', 'Petal Deer', 'legendary', '{"deer","fawn","woodland","petal","daisy","crown","legendary","magical"}'::text[], 'A fawn whose spots are flower petals, wearing a daisy crown that blooms in spring.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_petal_deer_daisy_crown.png', 148),
  (v_theme_id, 'woodland_felt_phoenix_chick_ember_wings', 'Phoenix Chick', 'rare', '{"phoenix","bird","woodland","ember","wings","rare","mythical"}'::text[], 'A downy phoenix chick with tiny ember-tipped wings, warm as a campfire on a cold night.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_phoenix_chick_ember_wings.png', 149),
  (v_theme_id, 'woodland_felt_plum_badger_crystal_staff', 'Plum Badger', 'rare', '{"badger","woodland","plum","crystal","staff","rare","magical"}'::text[], 'A badger with deep plum and silver fur, carrying a staff topped with a wrapped crystal.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_plum_badger_crystal_staff.png', 150),
  (v_theme_id, 'woodland_felt_rosegold_hedgehog_gem_crown', 'Rose Gold Hedgehog', 'rare', '{"hedgehog","woodland","rose gold","gem","crown","rare","magical"}'::text[], 'A hedgehog with rose-gold quills and a crown of tiny gems, the jewel of the forest.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_rosegold_hedgehog_gem_crown.png', 151),
  (v_theme_id, 'woodland_felt_shimmer_wren_rainbow_dewdrop', 'Shimmer Wren', 'legendary', '{"wren","woodland","bird","shimmer","rainbow","dewdrop","legendary","magical"}'::text[], 'A wren with iridescent rainbow feathers, holding a dewdrop that contains a tiny rainbow.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_shimmer_wren_rainbow_dewdrop.png', 152),
  (v_theme_id, 'woodland_felt_silver_raccoon_jeweled_mask', 'Silver Raccoon', 'rare', '{"raccoon","woodland","silver","jeweled","mask","rare","magical"}'::text[], 'A raccoon with silver-tipped fur and a mask that sparkles with tiny jewels.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_silver_raccoon_jeweled_mask.png', 153),
  (v_theme_id, 'woodland_felt_star_fox_constellation_fur', 'Star Fox', 'rare', '{"fox","woodland","star","constellation","rare","mythical"}'::text[], 'A fox with deep navy fur mapped with constellations, a guide for lost travelers.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_star_fox_constellation_fur.png', 154),
  (v_theme_id, 'woodland_felt_starweave_chipmunk_star_charms', 'Starweave Chipmunk', 'legendary', '{"chipmunk","woodland","star","weave","charms","legendary","magical"}'::text[], 'A chipmunk with midnight-blue fur adorned with tiny woven star charms that chime softly.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_starweave_chipmunk_star_charms.png', 155),
  (v_theme_id, 'woodland_felt_sunset_chipmunk_glowing_satchel', 'Sunset Chipmunk', 'rare', '{"chipmunk","woodland","sunset","satchel","rare","magical"}'::text[], 'A chipmunk with sunset-gradient fur carrying a tiny satchel filled with glowing seeds.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_sunset_chipmunk_glowing_satchel.png', 156),
  (v_theme_id, 'woodland_felt_tanuki_leaf_hat', 'Tanuki', 'rare', '{"tanuki","raccoon dog","woodland","leaf","hat","rare","mythical"}'::text[], 'A round cheerful tanuki with a leaf balanced on its head, full of forest magic.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_tanuki_leaf_hat.png', 157),
  (v_theme_id, 'woodland_felt_tide_otter_glowing_pearl', 'Tide Otter', 'legendary', '{"otter","woodland","tide","pearl","glow","legendary","magical"}'::text[], 'An otter with iridescent blue-green fur, holding a pearl that glows with the tides.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_tide_otter_glowing_pearl.png', 158),
  (v_theme_id, 'woodland_felt_verdant_bear_moss_flowers', 'Verdant Bear', 'legendary', '{"bear","woodland","verdant","moss","flowers","legendary","magical"}'::text[], 'A bear cub covered in soft living moss and sprouting flowers, a piece of the forest itself.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_verdant_bear_moss_flowers.png', 159),
  (v_theme_id, 'woodland_felt_wisp_mouse_glowing_orb', 'Will-o-Wisp Mouse', 'rare', '{"mouse","woodland","wisp","orb","glow","rare","mythical"}'::text[], 'A mouse holding a pale glowing orb, leading wanderers safely through the dark forest.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_wisp_mouse_glowing_orb.png', 160),
  (v_theme_id, 'woodland_felt_wolpertinger_wings_antlers', 'Wolpertinger', 'rare', '{"wolpertinger","rabbit","woodland","wings","antlers","rare","mythical"}'::text[], 'A mischievous wolpertinger with tiny wings and antler nubs, impossible and irresistible.', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/rare/woodland_felt_wolpertinger_wings_antlers.png', 161)
  ON CONFLICT (theme_id, slug) DO NOTHING;
END $$;
-- Seed 26 Woodland Felt sticker book pages (background scenes)
-- Source: assets/gamification/woodland-felt/backgrounds-manifest.csv
DO $$
DECLARE
  v_theme_id UUID;
BEGIN
  SELECT id INTO v_theme_id FROM public.gamification_themes WHERE theme_slug = 'woodland_felt';
  IF v_theme_id IS NULL THEN
    RAISE EXCEPTION 'gamification_themes row for woodland_felt missing — must be inserted before sticker pages';
  END IF;

  INSERT INTO public.gamification_sticker_pages
    (theme_id, slug, display_name, scene, season, image_url, sort_order)
  VALUES
  (v_theme_id, 'woodland_bg_cherry_blossom_01', 'Cherry Blossom', 'cherry blossom', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_cherry_blossom_01.png', 1),
  (v_theme_id, 'woodland_bg_christmas_01', 'Christmas', 'christmas', 'winter', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_christmas_01.png', 2),
  (v_theme_id, 'woodland_bg_christmas_02', 'Christmas 2', 'christmas', 'winter', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_christmas_02.png', 3),
  (v_theme_id, 'woodland_bg_christmas_03', 'Christmas 3', 'christmas', 'winter', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_christmas_03.png', 4),
  (v_theme_id, 'woodland_bg_fall_golden_hour_01', 'Fall Golden Hour', 'fall golden hour', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_fall_golden_hour_01.png', 5),
  (v_theme_id, 'woodland_bg_fall_golden_hour_02', 'Fall Golden Hour 2', 'fall golden hour', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_fall_golden_hour_02.png', 6),
  (v_theme_id, 'woodland_bg_fall_golden_hour_03', 'Fall Golden Hour 3', 'fall golden hour', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_fall_golden_hour_03.png', 7),
  (v_theme_id, 'woodland_bg_fall_golden_hour_04', 'Fall Golden Hour 4', 'fall golden hour', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_fall_golden_hour_04.png', 8),
  (v_theme_id, 'woodland_bg_firefly_dusk_01', 'Firefly Dusk', 'firefly dusk', 'summer', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_firefly_dusk_01.png', 9),
  (v_theme_id, 'woodland_bg_harvest_festival_01', 'Harvest Festival', 'harvest festival', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_harvest_festival_01.png', 10),
  (v_theme_id, 'woodland_bg_harvest_festival_02', 'Harvest Festival 2', 'harvest festival', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_harvest_festival_02.png', 11),
  (v_theme_id, 'woodland_bg_harvest_festival_03', 'Harvest Festival 3', 'harvest festival', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_harvest_festival_03.png', 12),
  (v_theme_id, 'woodland_bg_harvest_festival_04', 'Harvest Festival 4', 'harvest festival', 'autumn', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_harvest_festival_04.png', 13),
  (v_theme_id, 'woodland_bg_moonlit_night_01', 'Moonlit Night', 'moonlit night', 'night', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_moonlit_night_01.png', 14),
  (v_theme_id, 'woodland_bg_moonlit_night_02', 'Moonlit Night 2', 'moonlit night', 'night', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_moonlit_night_02.png', 15),
  (v_theme_id, 'woodland_bg_rainy_day_01', 'Rainy Day', 'rainy day', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_rainy_day_01.png', 16),
  (v_theme_id, 'woodland_bg_rainy_day_02', 'Rainy Day 2', 'rainy day', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_rainy_day_02.png', 17),
  (v_theme_id, 'woodland_bg_rainy_day_03', 'Rainy Day 3', 'rainy day', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_rainy_day_03.png', 18),
  (v_theme_id, 'woodland_bg_spring_meadow_01', 'Spring Meadow', 'spring meadow', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_spring_meadow_01.png', 19),
  (v_theme_id, 'woodland_bg_spring_meadow_02', 'Spring Meadow 2', 'spring meadow', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_spring_meadow_02.png', 20),
  (v_theme_id, 'woodland_bg_spring_meadow_03', 'Spring Meadow 3', 'spring meadow', 'spring', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_spring_meadow_03.png', 21),
  (v_theme_id, 'woodland_bg_summer_sunrise_01', 'Summer Sunrise', 'summer sunrise', 'summer', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_summer_sunrise_01.png', 22),
  (v_theme_id, 'woodland_bg_summer_sunrise_02', 'Summer Sunrise 2', 'summer sunrise', 'summer', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_summer_sunrise_02.png', 23),
  (v_theme_id, 'woodland_bg_summer_sunrise_03', 'Summer Sunrise 3', 'summer sunrise', 'summer', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_summer_sunrise_03.png', 24),
  (v_theme_id, 'woodland_bg_summer_sunrise_04', 'Summer Sunrise 4', 'summer sunrise', 'summer', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_summer_sunrise_04.png', 25),
  (v_theme_id, 'woodland_bg_winter_wonderland_01', 'Winter Wonderland', 'winter wonderland', 'winter', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/backgrounds/woodland_bg_winter_wonderland_01.png', 26)
  ON CONFLICT (theme_id, slug) DO NOTHING;
END $$;
-- ============================================================
-- Build M Sub-phase A — visual_schedule library seed (A2 hybrid)
-- ============================================================
-- Per addendum §16.2 Gap #1 + addendum question A2 (hybrid decision):
-- The 328 visual_schedule rows in production were added by an external
-- asset pipeline that is not in git. This INSERT block makes them
-- reproducible from versioned migrations going forward.
--
-- WITHOUT EMBEDDINGS — embedding column stays NULL on these inserts.
-- Tag-based search via searchVisualScheduleAssets() works immediately
-- in any environment. Embedding-based search via match_assets() works
-- only after the embeddings are backfilled (separate manual process).
--
-- ON CONFLICT DO NOTHING — this migration is a no-op against the live
-- DB where these rows already exist with embeddings populated. It only
-- inserts rows in fresh dev environments.
-- ============================================================

INSERT INTO public.platform_assets (
  id, feature_key, variant, category,
  size_512_url, size_128_url, size_32_url,
  description, generation_prompt,
  tags, vibe_compatibility,
  display_name, assigned_to, status
) VALUES
  ('52fb5fd9-d6df-423e-b0be-500364a7c3a9'::uuid, 'vs_arcade_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_arcade_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_arcade_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_arcade_A.png', 'Child playing an arcade game, joystick, minimal background', 'Paper-craft illustration of Child playing an arcade game, joystick, minimal background', '["reward","arcade","games","fun","outing","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Arcade — A', 'visual_schedule:vs_arcade', 'active'),
  ('4a27455a-0a8d-4f26-887e-76b2718a6b04'::uuid, 'vs_arcade_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_arcade_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_arcade_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_arcade_B.png', 'Child at an arcade, tokens, game machines, some context', 'Paper-craft illustration of Child at an arcade, tokens, game machines, some context', '["reward","arcade","games","fun","outing","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Arcade — B', 'visual_schedule:vs_arcade', 'active'),
  ('d944fa79-d284-4ed9-a363-702ff0f87fd4'::uuid, 'vs_arcade_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_arcade_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_arcade_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_arcade_C.png', 'Child at a colorful arcade, multiple games, tickets, prizes, full scene', 'Paper-craft illustration of Child at a colorful arcade, multiple games, tickets, prizes, full scene', '["reward","arcade","games","fun","outing","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Arcade — C', 'visual_schedule:vs_arcade', 'active'),
  ('c276ab34-5d32-43c9-a965-3a181c85c798'::uuid, 'vs_art_project_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_art_project_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_art_project_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_art_project_A.png', 'Child drawing or painting at an art table, minimal background', 'Paper-craft illustration of Child drawing or painting at an art table, minimal background', '["learning","art","painting","creative","project","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Art Project — A', 'visual_schedule:vs_art_project', 'active'),
  ('417e21bf-2d26-4ba5-bb9d-697b7e290d2e'::uuid, 'vs_art_project_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_art_project_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_art_project_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_art_project_B.png', 'Child painting at an easel with a brush, some art room context', 'Paper-craft illustration of Child painting at an easel with a brush, some art room context', '["learning","art","painting","creative","project","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Art Project — B', 'visual_schedule:vs_art_project', 'active'),
  ('8215a6cc-b541-4a20-bda9-278de9e4d23c'::uuid, 'vs_art_project_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_art_project_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_art_project_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_art_project_C.png', 'Child painting at an easel, colorful artwork, art supplies, full scene', 'Paper-craft illustration of Child painting at an easel, colorful artwork, art supplies, full scene', '["learning","art","painting","creative","project","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Art Project — C', 'visual_schedule:vs_art_project', 'active'),
  ('c26fc98c-e78e-4552-b517-38191f8a0e3a'::uuid, 'vs_bath_dry_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_dry_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_dry_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_dry_A.png', 'A brown-haired girl drying herself with a large towel, paper-craft dimensional style.', NULL, '["bath","drying","towel","after bath"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Drying with Towel', 'routine:bath_time', 'active'),
  ('028c0f8a-fb15-4ae2-8c5d-b3d890f1a8c1'::uuid, 'vs_bath_dry_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_dry_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_dry_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_dry_B.png', 'A blonde girl with a towel wrapped around her hair in a turban, smiling after bath.', NULL, '["bath","towel","hair","turban","blonde girl","after bath"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Blonde Girl Towel Turban', 'routine:bath_time', 'active'),
  ('663b5041-43b8-4dc2-af5c-1805ec51e350'::uuid, 'vs_bath_enter_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_enter_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_enter_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_enter_C.png', 'A child in the bathtub surrounded by white bubble foam and a rubber duck, paper-craft style.', NULL, '["bath","bathtub","bubbles","rubber duck","bath time"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Child in Tub with Bubbles', 'routine:bath_time', 'active'),
  ('bab6f49f-b699-4f5d-9772-fe98723e89ef'::uuid, 'vs_bath_hang_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_hang_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_hang_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_hang_A.png', 'A dark-skinned child wrapped in a large fluffy towel around their head and body, after bath.', NULL, '["bath","towel","wrapped","after bath","dry"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Dark-Skin Child in Towel', 'routine:bath_time', 'active'),
  ('d0131d66-2b9b-4476-b3df-185414f9581f'::uuid, 'vs_bath_hang_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_hang_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_hang_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_hang_B.png', 'A light-skinned child wrapped snugly in a bath towel, smiling, paper-craft style.', NULL, '["bath","towel","wrapped","smiling","after bath"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Child in Towel Wrap', 'routine:bath_time', 'active'),
  ('a5527360-11c3-43e6-8abc-74c53fe58bbb'::uuid, 'vs_bath_hang_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_hang_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_hang_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_hang_C.png', 'A child in a white hooded bath towel, cozy and dry after bath time.', NULL, '["bath","towel","hooded","cozy","after bath"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Hooded Towel Child', 'routine:bath_time', 'active'),
  ('bbb350c4-fb17-4fbe-bf12-abde5d503bbf'::uuid, 'vs_bath_object_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_object_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_object_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_object_A.png', 'A paper-craft bar of soap with white bubble foam around it, object view on cream background.', NULL, '["bath","soap","bubbles","object"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Soap Bar', 'routine:bath_time', 'active'),
  ('fec83899-f5e1-4dca-bd1a-76fe6d7e49f2'::uuid, 'vs_bath_prepare_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_prepare_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_prepare_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_prepare_A.png', 'A child standing at the bathroom mirror, getting ready for bath time, paper-craft style.', NULL, '["bath","mirror","bathroom","getting ready"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Child at Mirror', 'routine:bath_time', 'active'),
  ('d2149342-5c39-4e11-abea-49acb2e39d96'::uuid, 'vs_bath_prepare_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_prepare_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_prepare_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_prepare_B.png', 'A paper-craft bathtub filled with white bubble foam and a yellow rubber duck, warm tones.', NULL, '["bath","bathtub","bubbles","rubber duck","object"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Bathtub with Bubbles', 'routine:bath_time', 'active'),
  ('968524ea-24cb-4d4d-97ef-e9e66ee174c7'::uuid, 'vs_bath_prepare_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_prepare_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_prepare_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_prepare_C.png', 'A dark-skinned child in a fluffy white robe walking toward the bathroom for bath time.', NULL, '["bath","robe","walking","bathroom","getting ready"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Child in Robe Walking', 'routine:bath_time', 'active'),
  ('4ba22ac8-fe14-4101-b8a5-9db2dcce1115'::uuid, 'vs_bath_rinse_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_rinse_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_rinse_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_rinse_A.png', 'A dark-skinned girl with water being poured over her hair from a pitcher, eyes closed, covered.', NULL, '["bath","hair","rinsing","pitcher","water"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Rinsing Hair', 'routine:bath_time', 'active'),
  ('73cc00ab-428e-4559-83e9-b98911609c03'::uuid, 'vs_bath_rinse_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_rinse_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_rinse_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_rinse_B.png', 'A paper-craft towel hanging neatly on a bathroom towel bar, ready for after bath.', NULL, '["bath","towel","rack","bathroom","object"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Towel on Rack', 'routine:bath_time', 'active'),
  ('24f7b032-5739-4ad0-ad6c-ad9d23a82771'::uuid, 'vs_bath_shampoo_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_shampoo_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_shampoo_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_shampoo_C.png', 'A paper-craft shampoo bottle with bubbles, object view on a warm background.', NULL, '["bath","shampoo","bottle","object","hair washing"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Shampoo Bottle', 'routine:bath_time', 'active'),
  ('2030d4dd-d008-4922-aed2-459d24958f92'::uuid, 'vs_bath_towel_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_towel_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_towel_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_towel_A.png', 'A child wrapped in a large bath towel from head to toe, stepping out of the tub.', NULL, '["bath","towel","wrapped","getting out","dry"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Wrapped in Towel', 'routine:bath_time', 'active'),
  ('f3a2181f-b692-483e-b304-54d670bce785'::uuid, 'vs_bath_towel_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_towel_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_towel_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_towel_B.png', 'A child in a hooded bath towel, smiling, paper-craft dimensional style.', NULL, '["bath","towel","hooded","smiling","dry"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Hooded Towel', 'routine:bath_time', 'active'),
  ('c0e4e139-401d-4e8b-98e7-9f8c1609972a'::uuid, 'vs_bath_towel_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_towel_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_towel_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_towel_C.png', 'A dark-skinned child in a bear-ear hooded bath towel, adorable paper-craft style.', NULL, '["bath","towel","bear","hooded","cute","dry"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Bear Towel Hoodie', 'routine:bath_time', 'active'),
  ('0ee044b3-7889-4c6f-a022-5ff3f6946e30'::uuid, 'vs_bath_undress_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_undress_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_undress_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_undress_A.png', 'A light-skinned child in a bathrobe holding a toy boat, ready for bath time.', NULL, '["bath","robe","toy","getting ready","bathrobe"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Child in Robe with Toy', 'routine:bath_time', 'active'),
  ('0d74b625-9ce5-4cc8-bae4-b718a4ec5f6e'::uuid, 'vs_bath_undress_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_undress_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_undress_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_undress_B.png', 'A child in a robe sitting on the edge of the bathtub, paper-craft dimensional style.', NULL, '["bath","robe","bathtub","sitting","getting ready"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Sitting on Tub Edge', 'routine:bath_time', 'active'),
  ('71a957d6-ea36-40cf-8c17-dd5ecdf5e985'::uuid, 'vs_bath_undress_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bath_undress_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_undress_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bath_undress_C.png', 'A dark-skinned child in a robe leaning over to fill the bathtub with water, full scene.', NULL, '["bath","filling tub","water","robe","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Bath — Filling the Tub', 'routine:bath_time', 'active'),
  ('75921cee-f3f4-416f-9c88-137b81fdb0cb'::uuid, 'vs_biking_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_biking_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_biking_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_biking_A.png', 'Child riding a bicycle with a helmet, minimal background', 'Paper-craft illustration of Child riding a bicycle with a helmet, minimal background', '["outdoor","biking","bicycle","helmet","exercise","reward","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Biking — A', 'visual_schedule:vs_biking', 'active'),
  ('f90c013e-d847-4f32-b98a-141c526fabda'::uuid, 'vs_biking_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_biking_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_biking_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_biking_B.png', 'Child riding a bike on a path, helmet, some outdoor context', 'Paper-craft illustration of Child riding a bike on a path, helmet, some outdoor context', '["outdoor","biking","bicycle","helmet","exercise","reward","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Biking — B', 'visual_schedule:vs_biking', 'active'),
  ('996232a2-4eee-4d55-9890-373e810f2e85'::uuid, 'vs_biking_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_biking_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_biking_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_biking_C.png', 'Child riding a bike on a neighborhood path, helmet, trees, full scene', 'Paper-craft illustration of Child riding a bike on a neighborhood path, helmet, trees, full scene', '["outdoor","biking","bicycle","helmet","exercise","reward","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Biking — C', 'visual_schedule:vs_biking', 'active'),
  ('b68654ab-a46b-4922-abce-4d7dbde6874e'::uuid, 'vs_birdwatching_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_birdwatching_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_birdwatching_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_birdwatching_A.png', 'Child looking through binoculars at a bird in a tree', 'Paper-craft illustration of Child looking through binoculars at a bird in a tree', '["outdoor","nature","birds","binoculars","explore","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Birdwatching — A', 'visual_schedule:vs_birdwatching', 'active'),
  ('f7a38fc8-327c-4adb-88ce-e346631651e0'::uuid, 'vs_birdwatching_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_birdwatching_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_birdwatching_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_birdwatching_B.png', 'Child birdwatching with binoculars outdoors, some nature context', 'Paper-craft illustration of Child birdwatching with binoculars outdoors, some nature context', '["outdoor","nature","birds","binoculars","explore","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Birdwatching — B', 'visual_schedule:vs_birdwatching', 'active'),
  ('46a08bac-5264-4a0a-a38e-ed89ed462466'::uuid, 'vs_birdwatching_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_birdwatching_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_birdwatching_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_birdwatching_C.png', 'Child birdwatching in a park, binoculars, bird field guide, birds in trees', 'Paper-craft illustration of Child birdwatching in a park, binoculars, bird field guide, birds in trees', '["outdoor","nature","birds","binoculars","explore","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Birdwatching — C', 'visual_schedule:vs_birdwatching', 'active'),
  ('600c090b-ce7d-4f2b-bbae-0de0ce450ec5'::uuid, 'vs_birthday_party_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_birthday_party_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_birthday_party_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_birthday_party_A.png', 'Child blowing out candles on a birthday cake, minimal background', 'Paper-craft illustration of Child blowing out candles on a birthday cake, minimal background', '["reward","birthday","celebration","party","cake","fun","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Birthday Party — A', 'visual_schedule:vs_birthday_party', 'active'),
  ('8a02b007-af33-4a5e-a748-9b7b25478a00'::uuid, 'vs_birthday_party_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_birthday_party_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_birthday_party_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_birthday_party_B.png', 'Child at a birthday party with balloons and cake', 'Paper-craft illustration of Child at a birthday party with balloons and cake', '["reward","birthday","celebration","party","cake","fun","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Birthday Party — B', 'visual_schedule:vs_birthday_party', 'active'),
  ('4004aaab-d18d-49f6-9d7d-68a66983e497'::uuid, 'vs_birthday_party_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_birthday_party_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_birthday_party_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_birthday_party_C.png', 'Birthday party scene, children, balloons, cake, streamers, full scene', 'Paper-craft illustration of Birthday party scene, children, balloons, cake, streamers, full scene', '["reward","birthday","celebration","party","cake","fun","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Birthday Party — C', 'visual_schedule:vs_birthday_party', 'active'),
  ('40cf7caa-586b-4468-824e-075bc54929fb'::uuid, 'vs_bowling_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bowling_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bowling_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bowling_A.png', 'Child holding a bowling ball at a lane, minimal background', 'Paper-craft illustration of Child holding a bowling ball at a lane, minimal background', '["reward","bowling","fun","activity","outing","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Bowling — A', 'visual_schedule:vs_bowling', 'active'),
  ('374eb544-d1d8-4a79-bcf6-c4b92c3d04f3'::uuid, 'vs_bowling_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bowling_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bowling_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bowling_B.png', 'Child bowling, ball rolling toward pins, some bowling alley context', 'Paper-craft illustration of Child bowling, ball rolling toward pins, some bowling alley context', '["reward","bowling","fun","activity","outing","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Bowling — B', 'visual_schedule:vs_bowling', 'active'),
  ('5d90413f-cdd7-4c61-a4a7-7d77834098de'::uuid, 'vs_bowling_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bowling_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bowling_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bowling_C.png', 'Child bowling, pins flying, colorful bowling alley, full scene', 'Paper-craft illustration of Child bowling, pins flying, colorful bowling alley, full scene', '["reward","bowling","fun","activity","outing","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Bowling — C', 'visual_schedule:vs_bowling', 'active'),
  ('62ea0d7d-5803-4daf-9027-a424ca478f45'::uuid, 'vs_bug_catching_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bug_catching_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bug_catching_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bug_catching_A.png', 'Child holding a jar with a bug inside, minimal background', 'Paper-craft illustration of Child holding a jar with a bug inside, minimal background', '["outdoor","nature","bugs","net","explore","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Bug Catching — A', 'visual_schedule:vs_bug_catching', 'active'),
  ('0f65ddb9-c87a-4b9b-ab94-27e38d5aa09a'::uuid, 'vs_bug_catching_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bug_catching_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bug_catching_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bug_catching_B.png', 'Child catching bugs with a net in a meadow, some context', 'Paper-craft illustration of Child catching bugs with a net in a meadow, some context', '["outdoor","nature","bugs","net","explore","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Bug Catching — B', 'visual_schedule:vs_bug_catching', 'active'),
  ('1cf1abb4-103c-4bb8-813a-ade7e831ca09'::uuid, 'vs_bug_catching_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_bug_catching_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bug_catching_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_bug_catching_C.png', 'Child catching bugs in a meadow, net, jar, flowers, full outdoor scene', 'Paper-craft illustration of Child catching bugs in a meadow, net, jar, flowers, full outdoor scene', '["outdoor","nature","bugs","net","explore","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Bug Catching — C', 'visual_schedule:vs_bug_catching', 'active'),
  ('433fd740-bdd5-4cfd-9b77-0d31dc941caa'::uuid, 'vs_building_blocks_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_building_blocks_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_building_blocks_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_building_blocks_A.png', 'Child stacking or building with blocks, minimal background', 'Paper-craft illustration of Child stacking or building with blocks, minimal background', '["learning","building","blocks","LEGO","creative play","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Building Blocks — A', 'visual_schedule:vs_building_blocks', 'active'),
  ('a0da6619-aac6-4433-8d6c-638e1d4f9cb4'::uuid, 'vs_building_blocks_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_building_blocks_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_building_blocks_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_building_blocks_B.png', 'Child building with LEGO bricks on a table, some context', 'Paper-craft illustration of Child building with LEGO bricks on a table, some context', '["learning","building","blocks","LEGO","creative play","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Building Blocks — B', 'visual_schedule:vs_building_blocks', 'active'),
  ('14b98e90-c13a-44b6-931e-366e1371ff97'::uuid, 'vs_building_blocks_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_building_blocks_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_building_blocks_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_building_blocks_C.png', 'Child building an elaborate LEGO or block structure, full scene', 'Paper-craft illustration of Child building an elaborate LEGO or block structure, full scene', '["learning","building","blocks","LEGO","creative play","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Building Blocks — C', 'visual_schedule:vs_building_blocks', 'active'),
  ('86d8bc3e-fae1-45ac-9172-7cf33067c072'::uuid, 'vs_clay_sculpting_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clay_sculpting_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clay_sculpting_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clay_sculpting_A.png', 'Child rolling clay into a ball, minimal background', 'Paper-craft illustration of Child rolling clay into a ball, minimal background', '["art","clay","sculpting","crafts","creative","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Clay Sculpting — A', 'visual_schedule:vs_clay_sculpting', 'active'),
  ('ec043b4f-08dc-4ebb-ba2a-c18dca0f9a09'::uuid, 'vs_clay_sculpting_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clay_sculpting_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clay_sculpting_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clay_sculpting_B.png', 'Child shaping clay at a table, some craft context', 'Paper-craft illustration of Child shaping clay at a table, some craft context', '["art","clay","sculpting","crafts","creative","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Clay Sculpting — B', 'visual_schedule:vs_clay_sculpting', 'active'),
  ('5f05931e-b90b-41b6-a364-c56a2a4af0fc'::uuid, 'vs_clay_sculpting_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clay_sculpting_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clay_sculpting_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clay_sculpting_C.png', 'Child making clay figures at a craft table, tools, colorful clay', 'Paper-craft illustration of Child making clay figures at a craft table, tools, colorful clay', '["art","clay","sculpting","crafts","creative","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Clay Sculpting — C', 'visual_schedule:vs_clay_sculpting', 'active'),
  ('b732a5d6-07e3-4c7c-a7c7-d2049f2f4cf0'::uuid, 'vs_clean_baseboards_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_baseboards_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_baseboards_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_baseboards_A.png', 'Child kneeling with a cloth wiping a baseboard', 'Paper-craft illustration of Child kneeling with a cloth wiping a baseboard', '["cleaning","baseboards","chores","deep clean","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Clean Baseboards — A', 'visual_schedule:vs_clean_baseboards', 'active'),
  ('b5928b8c-c80f-4d7e-83a0-4ffde3054c3c'::uuid, 'vs_clean_baseboards_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_baseboards_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_baseboards_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_baseboards_B.png', 'Child wiping baseboards along a hallway with a damp cloth', 'Paper-craft illustration of Child wiping baseboards along a hallway with a damp cloth', '["cleaning","baseboards","chores","deep clean","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Clean Baseboards — B', 'visual_schedule:vs_clean_baseboards', 'active'),
  ('0d7e6a45-6210-41f4-9bb7-0163340a8782'::uuid, 'vs_clean_baseboards_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_baseboards_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_baseboards_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_baseboards_C.png', 'Child cleaning baseboards in a full room, bucket, cloth, full scene', 'Paper-craft illustration of Child cleaning baseboards in a full room, bucket, cloth, full scene', '["cleaning","baseboards","chores","deep clean","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Clean Baseboards — C', 'visual_schedule:vs_clean_baseboards', 'active'),
  ('a8387740-91c2-4942-b834-9e765ebd668a'::uuid, 'vs_clean_coop_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_coop_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_coop_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_coop_A.png', 'Child holding a broom inside a chicken coop', 'Paper-craft illustration of Child holding a broom inside a chicken coop', '["farm","chickens","coop","cleaning","homestead","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Clean Coop — A', 'visual_schedule:vs_clean_coop', 'active'),
  ('c817489d-b9a7-4844-b270-53cd5e85bcff'::uuid, 'vs_clean_coop_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_coop_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_coop_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_coop_B.png', 'Child sweeping and cleaning a chicken coop with a broom and bucket', 'Paper-craft illustration of Child sweeping and cleaning a chicken coop with a broom and bucket', '["farm","chickens","coop","cleaning","homestead","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Clean Coop — B', 'visual_schedule:vs_clean_coop', 'active'),
  ('8cee10d2-aa1b-45eb-b77d-c31e40bdf940'::uuid, 'vs_clean_coop_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_coop_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_coop_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_coop_C.png', 'Child thoroughly cleaning a chicken coop, fresh bedding, full scene', 'Paper-craft illustration of Child thoroughly cleaning a chicken coop, fresh bedding, full scene', '["farm","chickens","coop","cleaning","homestead","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Clean Coop — C', 'visual_schedule:vs_clean_coop', 'active'),
  ('733b35d3-ffa4-443c-8ceb-a4966395e881'::uuid, 'vs_clean_oven_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_oven_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_oven_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_oven_A.png', 'Child holding a sponge near an oven door, minimal background', 'Paper-craft illustration of Child holding a sponge near an oven door, minimal background', '["cleaning","oven","kitchen","chores","deep clean","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Clean Oven — A', 'visual_schedule:vs_clean_oven', 'active'),
  ('8fff537f-523f-492c-acad-bd9739f9f80f'::uuid, 'vs_clean_oven_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_oven_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_oven_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_oven_B.png', 'Child cleaning the inside of an oven with cleaning spray', 'Paper-craft illustration of Child cleaning the inside of an oven with cleaning spray', '["cleaning","oven","kitchen","chores","deep clean","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Clean Oven — B', 'visual_schedule:vs_clean_oven', 'active'),
  ('e1418dd3-74be-4d6b-9c72-05a8a4bb86d2'::uuid, 'vs_clean_oven_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_oven_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_oven_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_oven_C.png', 'Child cleaning a full oven, gloves, spray, scrubbing, kitchen scene', 'Paper-craft illustration of Child cleaning a full oven, gloves, spray, scrubbing, kitchen scene', '["cleaning","oven","kitchen","chores","deep clean","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Clean Oven — C', 'visual_schedule:vs_clean_oven', 'active'),
  ('e3c86c07-a678-46c5-bd19-50262d0cd3fb'::uuid, 'vs_clean_toilet_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_toilet_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_toilet_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_toilet_A.png', 'Child holding a toilet brush next to a toilet, minimal background', 'Paper-craft illustration of Child holding a toilet brush next to a toilet, minimal background', '["cleaning","bathroom","toilet","chores","deep clean","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Clean Toilet — A', 'visual_schedule:vs_clean_toilet', 'active'),
  ('79ef6cc2-a0f2-45f2-83e2-43d181a3b94e'::uuid, 'vs_clean_toilet_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_toilet_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_toilet_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_toilet_B.png', 'Child cleaning a toilet with a brush and cleaning spray', 'Paper-craft illustration of Child cleaning a toilet with a brush and cleaning spray', '["cleaning","bathroom","toilet","chores","deep clean","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Clean Toilet — B', 'visual_schedule:vs_clean_toilet', 'active'),
  ('53d44069-4eda-4070-9828-1a2bad1deeff'::uuid, 'vs_clean_toilet_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_toilet_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_toilet_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_toilet_C.png', 'Child cleaning a full bathroom toilet, supplies, sparkling result', 'Paper-craft illustration of Child cleaning a full bathroom toilet, supplies, sparkling result', '["cleaning","bathroom","toilet","chores","deep clean","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Clean Toilet — C', 'visual_schedule:vs_clean_toilet', 'active'),
  ('2afd954d-2e8a-4a7c-bf0c-572a4341b230'::uuid, 'vs_clean_windows_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_windows_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_windows_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_windows_A.png', 'Child holding a squeegee or spray bottle at a window', 'Paper-craft illustration of Child holding a squeegee or spray bottle at a window', '["cleaning","windows","chores","deep clean","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Clean Windows — A', 'visual_schedule:vs_clean_windows', 'active'),
  ('dcffc0e4-161d-4ccf-84d0-7b51ccd3502d'::uuid, 'vs_clean_windows_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_windows_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_windows_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_windows_B.png', 'Child cleaning a window with a spray bottle and cloth', 'Paper-craft illustration of Child cleaning a window with a spray bottle and cloth', '["cleaning","windows","chores","deep clean","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Clean Windows — B', 'visual_schedule:vs_clean_windows', 'active'),
  ('7ccc0b15-2c6c-4cff-9a6f-35a1f39f636f'::uuid, 'vs_clean_windows_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_clean_windows_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_windows_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_clean_windows_C.png', 'Child cleaning windows in a full room scene, spray, squeegee, sunshine', 'Paper-craft illustration of Child cleaning windows in a full room scene, spray, squeegee, sunshine', '["cleaning","windows","chores","deep clean","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Clean Windows — C', 'visual_schedule:vs_clean_windows', 'active'),
  ('6183c682-38be-4da5-bdc0-fac570ea832e'::uuid, 'vs_collect_eggs_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_collect_eggs_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_collect_eggs_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_collect_eggs_A.png', 'Child reaching into a nesting box to collect a brown egg', 'Paper-craft illustration of Child reaching into a nesting box to collect a brown egg', '["farm","eggs","chickens","coop","homestead","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Collect Eggs — A', 'visual_schedule:vs_collect_eggs', 'active'),
  ('55acb323-1513-4e88-846f-f9824ec27a1f'::uuid, 'vs_collect_eggs_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_collect_eggs_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_collect_eggs_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_collect_eggs_B.png', 'Child collecting eggs from a chicken coop with a small basket', 'Paper-craft illustration of Child collecting eggs from a chicken coop with a small basket', '["farm","eggs","chickens","coop","homestead","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Collect Eggs — B', 'visual_schedule:vs_collect_eggs', 'active'),
  ('756e6a41-124e-4c92-9525-45da9de35e39'::uuid, 'vs_collect_eggs_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_collect_eggs_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_collect_eggs_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_collect_eggs_C.png', 'Child collecting eggs in a cozy chicken coop, basket full of colorful eggs', 'Paper-craft illustration of Child collecting eggs in a cozy chicken coop, basket full of colorful eggs', '["farm","eggs","chickens","coop","homestead","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Collect Eggs — C', 'visual_schedule:vs_collect_eggs', 'active'),
  ('76772bd9-6a6c-4afb-bc0e-c6674e478eaa'::uuid, 'vs_computer_time_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_computer_time_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_computer_time_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_computer_time_A.png', 'Child typing on a laptop computer, minimal background', 'Paper-craft illustration of Child typing on a laptop computer, minimal background', '["learning","computer","technology","education","screen time","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Computer Time — A', 'visual_schedule:vs_computer_time', 'active'),
  ('dee34916-9f4a-45a5-82ed-0bb1b73f6c6b'::uuid, 'vs_computer_time_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_computer_time_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_computer_time_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_computer_time_B.png', 'Child using a computer at a desk, some desk context', 'Paper-craft illustration of Child using a computer at a desk, some desk context', '["learning","computer","technology","education","screen time","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Computer Time — B', 'visual_schedule:vs_computer_time', 'active'),
  ('2a97e174-5d4a-4c7c-839c-7626cc158c92'::uuid, 'vs_computer_time_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_computer_time_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_computer_time_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_computer_time_C.png', 'Child doing computer work at a desk, monitor, keyboard, cozy home office', 'Paper-craft illustration of Child doing computer work at a desk, monitor, keyboard, cozy home office', '["learning","computer","technology","education","screen time","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Computer Time — C', 'visual_schedule:vs_computer_time', 'active'),
  ('a41d03de-2d97-4c03-a756-64275b18f312'::uuid, 'vs_cooking_together_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_cooking_together_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_cooking_together_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_cooking_together_A.png', 'Child stirring a bowl while cooking with a parent, minimal background', 'Paper-craft illustration of Child stirring a bowl while cooking with a parent, minimal background', '["reward","cooking","family","kitchen","together","fun","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Cooking Together — A', 'visual_schedule:vs_cooking_together', 'active'),
  ('7d2ebbd6-21ea-4d88-91dc-e720eee13f1c'::uuid, 'vs_cooking_together_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_cooking_together_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_cooking_together_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_cooking_together_B.png', 'Child helping cook in the kitchen, apron, some kitchen context', 'Paper-craft illustration of Child helping cook in the kitchen, apron, some kitchen context', '["reward","cooking","family","kitchen","together","fun","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Cooking Together — B', 'visual_schedule:vs_cooking_together', 'active'),
  ('cc6f4ec6-b54c-4d9a-ba72-4c50cd4db202'::uuid, 'vs_cooking_together_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_cooking_together_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_cooking_together_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_cooking_together_C.png', 'Child and parent cooking together in a warm kitchen, aprons, pots, full scene', 'Paper-craft illustration of Child and parent cooking together in a warm kitchen, aprons, pots, full scene', '["reward","cooking","family","kitchen","together","fun","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Cooking Together — C', 'visual_schedule:vs_cooking_together', 'active'),
  ('1b30e062-4eac-4b02-aa84-b77a41d9ee35'::uuid, 'vs_drawing_coloring_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_drawing_coloring_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_drawing_coloring_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_drawing_coloring_A.png', 'Child drawing with crayons on paper, minimal background', 'Paper-craft illustration of Child drawing with crayons on paper, minimal background', '["art","drawing","coloring","crayons","creative","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Drawing and Coloring — A', 'visual_schedule:vs_drawing_coloring', 'active'),
  ('bdc07b05-ea0a-415d-884d-92ec76302d1e'::uuid, 'vs_drawing_coloring_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_drawing_coloring_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_drawing_coloring_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_drawing_coloring_B.png', 'Child coloring a picture at a table with crayons, some context', 'Paper-craft illustration of Child coloring a picture at a table with crayons, some context', '["art","drawing","coloring","crayons","creative","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Drawing and Coloring — B', 'visual_schedule:vs_drawing_coloring', 'active'),
  ('a59a2a2d-6d94-4bd3-a66e-f41b70f7fdc2'::uuid, 'vs_drawing_coloring_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_drawing_coloring_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_drawing_coloring_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_drawing_coloring_C.png', 'Child coloring at a table, crayons spread out, colorful artwork', 'Paper-craft illustration of Child coloring at a table, crayons spread out, colorful artwork', '["art","drawing","coloring","crayons","creative","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Drawing and Coloring — C', 'visual_schedule:vs_drawing_coloring', 'active'),
  ('a63e3f19-0bdb-4249-9957-c2cb76e186d6'::uuid, 'vs_dress_accessories_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_accessories_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_accessories_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_accessories_A.png', 'Paper-craft belt, hair clips, and bow accessories laid on a wooden surface, object view.', NULL, '["dressing","accessories","belt","hair clips","bow","object"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Belt and Hair Clips', 'routine:getting_dressed', 'active'),
  ('68a29dc7-4c20-4f06-bfed-8e51e45bc6aa'::uuid, 'vs_dress_jacket_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_jacket_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_jacket_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_jacket_A.png', 'A light-skinned child zipping up a teal hoodie jacket, paper-craft dimensional style.', NULL, '["dressing","jacket","zipper","zipping","hoodie"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Child Zipping Jacket', 'routine:getting_dressed', 'active'),
  ('3c0d6999-37b0-4904-a158-02ba8c39a413'::uuid, 'vs_dress_jacket_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_jacket_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_jacket_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_jacket_B.png', 'A dark-skinned child in a teal hoodie zipping it up, smiling, paper-craft style.', NULL, '["dressing","jacket","hoodie","zipping","smiling"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Dark-Skin Child in Jacket', 'routine:getting_dressed', 'active'),
  ('cc039cfe-313b-448d-b416-258a43140ece'::uuid, 'vs_dress_jacket_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_jacket_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_jacket_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_jacket_C.png', 'A paper-craft blue and white hoodie jacket laid flat, object view.', NULL, '["dressing","jacket","hoodie","clothing","object"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Jacket Object', 'routine:getting_dressed', 'active'),
  ('1eed746d-7f27-4a52-b0b3-406195243e88'::uuid, 'vs_dress_mirror_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_mirror_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_mirror_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_mirror_B.png', 'A light-skinned child standing in front of a full-length mirror checking their outfit.', NULL, '["dressing","mirror","checking outfit","dressed","ready"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Child at Mirror', 'routine:getting_dressed', 'active'),
  ('b2caaaa2-3f57-4d60-a6a4-253b720a126d'::uuid, 'vs_dress_mirror_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_mirror_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_mirror_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_mirror_C.png', 'A girl in a dress standing at a full-length mirror checking her outfit, full bedroom scene.', NULL, '["dressing","mirror","girl","dress","checking outfit","bedroom"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Girl at Mirror', 'routine:getting_dressed', 'active'),
  ('a8359c39-76c5-4215-a65a-2022dc043efe'::uuid, 'vs_dress_pants_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_pants_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_pants_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_pants_A.png', 'Paper-craft brown jeans/trousers, flat object view on a warm background.', NULL, '["dressing","pants","jeans","clothing","object"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Pants', 'routine:getting_dressed', 'active'),
  ('afb2fd24-cc0a-4cd6-89be-8d4eaf5979bf'::uuid, 'vs_dress_pants_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_pants_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_pants_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_pants_B.png', 'A child stepping one leg into a pair of pants, paper-craft dimensional style.', NULL, '["dressing","pants","stepping in","putting on"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Stepping into Pants', 'routine:getting_dressed', 'active'),
  ('3f6458ba-f756-466e-b404-45c60994dec9'::uuid, 'vs_dress_pants_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_pants_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_pants_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_pants_C.png', 'A child in pants standing confidently, fully dressed from waist down, paper-craft style.', NULL, '["dressing","pants","dressed","standing"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Pants On', 'routine:getting_dressed', 'active'),
  ('6434dd3b-1303-4518-b45f-5eb5a5126a68'::uuid, 'vs_dress_shirt_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_shirt_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_shirt_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_shirt_A.png', 'A paper-craft teal t-shirt, flat object view on a warm cream background.', NULL, '["dressing","shirt","t-shirt","clothing","object"]'::jsonb, '{classic_myaim}'::text[], 'Dress — T-Shirt', 'routine:getting_dressed', 'active'),
  ('29dfea81-9e01-4a90-b9f8-39c6dc67f8fe'::uuid, 'vs_dress_shirt_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_shirt_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_shirt_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_shirt_C.png', 'A child in a white collared shirt buttoning it up, paper-craft dimensional style.', NULL, '["dressing","shirt","buttoning","putting on"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Putting on Shirt', 'routine:getting_dressed', 'active'),
  ('956d1e5e-5009-4e5a-86ed-cc7ee697a85b'::uuid, 'vs_dress_shoes_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_shoes_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_shoes_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_shoes_A.png', 'Paper-craft sneakers on a wooden floor, object view, warm tones.', NULL, '["dressing","shoes","sneakers","object"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Shoes', 'routine:getting_dressed', 'active'),
  ('2fe3f29f-e551-49ab-a2c6-be2370a49f4c'::uuid, 'vs_dress_shoes_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_shoes_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_shoes_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_shoes_B.png', 'A child seated on the floor tying their shoelaces, paper-craft dimensional style.', NULL, '["dressing","shoes","tying","shoelaces","seated"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Tying Shoes', 'routine:getting_dressed', 'active'),
  ('b495fe49-9229-4a51-a30b-a8f3affe6db8'::uuid, 'vs_dress_shoes_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_shoes_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_shoes_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_shoes_C.png', 'A blonde girl in overalls sitting on a bench tying her shoes, full outdoor scene.', NULL, '["dressing","shoes","tying","blonde girl","overalls","bench"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Blonde Girl Tying Shoes', 'routine:getting_dressed', 'active'),
  ('dca7675c-db4e-4122-9d7a-03b39ce2292f'::uuid, 'vs_dress_socks_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_socks_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_socks_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_socks_A.png', 'A pair of paper-craft striped socks, object view on a warm background.', NULL, '["dressing","socks","clothing","object"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Socks', 'routine:getting_dressed', 'active'),
  ('280f99e6-c1d7-4a12-8249-9ff4a15c1b4d'::uuid, 'vs_dress_socks_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_socks_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_socks_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_socks_B.png', 'A child seated on the floor pulling a sock onto their foot, paper-craft style.', NULL, '["dressing","socks","putting on","seated"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Putting on Socks', 'routine:getting_dressed', 'active'),
  ('cfa35671-ff7a-4236-a078-381d828a966c'::uuid, 'vs_dress_socks_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_socks_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_socks_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_socks_C.png', 'A child sitting on the bed putting on socks, full bedroom scene, paper-craft dimensional.', NULL, '["dressing","socks","bed","bedroom","putting on"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Socks on Bed', 'routine:getting_dressed', 'active'),
  ('4cb04354-5620-4a0c-b4f0-5ca8f9e0da0d'::uuid, 'vs_dress_underwear_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_underwear_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_underwear_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_underwear_A.png', 'Paper-craft underwear/briefs with blue trim, object view on warm cream background.', NULL, '["dressing","underwear","clothing","object"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Underwear', 'routine:getting_dressed', 'active'),
  ('75830cc8-112c-42ff-a6fa-2dd260c7e298'::uuid, 'vs_dress_zipper_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_dress_zipper_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_zipper_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_dress_zipper_A.png', 'Close-up paper-craft zipper on a blue jacket, showing the zipper pull and teeth detail.', NULL, '["dressing","zipper","jacket","close-up","fine motor"]'::jsonb, '{classic_myaim}'::text[], 'Dress — Zipper Close-Up', 'routine:getting_dressed', 'active'),
  ('d3ef1501-5af7-4b10-b4ef-1be7f2b4c93a'::uuid, 'vs_face_lotion_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_face_lotion_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_lotion_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_lotion_A.png', 'Paper-craft lotion tube and cream jar on a bathroom counter, object view.', NULL, '["face","lotion","moisturizer","cream","object"]'::jsonb, '{classic_myaim}'::text[], 'Face — Lotion and Cream', 'routine:morning_routine', 'active'),
  ('c3d2297d-ca59-407e-ae77-1a9210d0a511'::uuid, 'vs_face_lotion_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_face_lotion_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_lotion_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_lotion_B.png', 'A dark-skinned child applying lotion to their face with both hands, paper-craft style.', NULL, '["face","lotion","moisturizer","applying","skincare"]'::jsonb, '{classic_myaim}'::text[], 'Face — Applying Lotion', 'routine:morning_routine', 'active'),
  ('6ca0b361-9012-4bb8-8052-9686b05c2035'::uuid, 'vs_face_lotion_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_face_lotion_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_lotion_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_lotion_C.png', 'A blonde girl applying lotion to her face at the bathroom mirror, full scene.', NULL, '["face","lotion","moisturizer","blonde girl","mirror","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Face — Blonde Girl Moisturizing', 'routine:morning_routine', 'active'),
  ('9e92fe44-752f-402a-9d83-d4ffbc679398'::uuid, 'vs_face_object_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_face_object_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_object_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_object_A.png', 'Paper-craft soap bar and liquid cleanser bottle side by side, object view on warm background.', NULL, '["face","soap","cleanser","object","washing"]'::jsonb, '{classic_myaim}'::text[], 'Face — Soap and Cleanser', 'routine:morning_routine', 'active'),
  ('7b49591a-5a68-4389-8a85-786ad38a40be'::uuid, 'vs_face_rinse_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_face_rinse_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_rinse_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_rinse_A.png', 'A light-skinned child rinsing their face at the bathroom sink, mirror visible, paper-craft.', NULL, '["face","rinsing","sink","mirror","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Face — Child Rinsing at Sink', 'routine:morning_routine', 'active'),
  ('6d41f7d8-b3d4-4d84-a93e-c924aae7c9bd'::uuid, 'vs_face_rinse_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_face_rinse_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_rinse_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_rinse_B.png', 'A neatly folded paper-craft washcloth, object view on a clean background.', NULL, '["face","washcloth","towel","object"]'::jsonb, '{classic_myaim}'::text[], 'Face — Folded Washcloth', 'routine:morning_routine', 'active'),
  ('d2484fef-155b-40df-9d79-c24d5b628ab8'::uuid, 'vs_face_rinse_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_face_rinse_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_rinse_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_rinse_C.png', 'A dark-skinned child patting their face dry with a small towel, paper-craft style.', NULL, '["face","drying","towel","patting","after washing"]'::jsonb, '{classic_myaim}'::text[], 'Face — Dark-Skin Child Drying', 'routine:morning_routine', 'active'),
  ('d849c349-3e23-4c58-9a98-a6104517fb95'::uuid, 'vs_face_wash_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_face_wash_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_wash_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_wash_B.png', 'A dark-skinned child leaning over the bathroom sink to wash their face, paper-craft style.', NULL, '["face","washing","sink","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Face — Child at Sink', 'routine:morning_routine', 'active'),
  ('27bb7335-decf-4051-a6d5-0d70de7c151e'::uuid, 'vs_face_wash_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_face_wash_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_wash_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_face_wash_C.png', 'A light-skinned child splashing water on their face at the bathroom sink, full scene.', NULL, '["face","washing","water","splashing","sink","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Face — Splashing Water', 'routine:morning_routine', 'active'),
  ('12c82aaf-0928-425f-9248-9b03f3ed7c12'::uuid, 'vs_feed_chickens_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_feed_chickens_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_chickens_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_chickens_A.png', 'Child carrying a bucket of feed walking toward chickens in a yard', 'Paper-craft illustration of Child carrying a bucket of feed walking toward chickens in a yard', '["farm","chickens","feeding","chores","homestead","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Feed Chickens — A', 'visual_schedule:vs_feed_chickens', 'active'),
  ('1dc08166-cdfe-4d87-858a-590967dec27e'::uuid, 'vs_feed_chickens_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_feed_chickens_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_chickens_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_chickens_B.png', 'Child scattering grain to a flock of chickens in a farmyard', 'Paper-craft illustration of Child scattering grain to a flock of chickens in a farmyard', '["farm","chickens","feeding","chores","homestead","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Feed Chickens — B', 'visual_schedule:vs_feed_chickens', 'active'),
  ('645d9678-aed4-4507-800f-69c73e646c03'::uuid, 'vs_feed_chickens_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_feed_chickens_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_chickens_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_chickens_C.png', 'Child feeding chickens in a full farmyard scene with a coop and fence', 'Paper-craft illustration of Child feeding chickens in a full farmyard scene with a coop and fence', '["farm","chickens","feeding","chores","homestead","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Feed Chickens — C', 'visual_schedule:vs_feed_chickens', 'active'),
  ('1b68929b-d39e-4673-bb20-09e34a32997f'::uuid, 'vs_feed_goats_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_feed_goats_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_goats_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_goats_A.png', 'Child holding out feed to a friendly goat over a fence', 'Paper-craft illustration of Child holding out feed to a friendly goat over a fence', '["farm","goats","feeding","chores","homestead","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Feed Goats — A', 'visual_schedule:vs_feed_goats', 'active'),
  ('df3b233c-366d-4764-96a8-3a88c9b03628'::uuid, 'vs_feed_goats_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_feed_goats_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_goats_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_goats_B.png', 'Child feeding goats in a pen, goats eagerly eating from hand', 'Paper-craft illustration of Child feeding goats in a pen, goats eagerly eating from hand', '["farm","goats","feeding","chores","homestead","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Feed Goats — B', 'visual_schedule:vs_feed_goats', 'active'),
  ('4793d7a9-ed66-471c-bda3-2ac0a9848af0'::uuid, 'vs_feed_goats_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_feed_goats_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_goats_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_goats_C.png', 'Child feeding a group of goats in a full farm pen scene', 'Paper-craft illustration of Child feeding a group of goats in a full farm pen scene', '["farm","goats","feeding","chores","homestead","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Feed Goats — C', 'visual_schedule:vs_feed_goats', 'active'),
  ('6778f769-5912-44b8-a8b0-cb02d952045b'::uuid, 'vs_feed_pigs_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_feed_pigs_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_pigs_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_pigs_A.png', 'Child carrying a slop bucket toward a pig pen', 'Paper-craft illustration of Child carrying a slop bucket toward a pig pen', '["farm","pigs","feeding","chores","homestead","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Feed Pigs — A', 'visual_schedule:vs_feed_pigs', 'active'),
  ('14723d1f-6cda-408a-8a35-cc087171fbf0'::uuid, 'vs_feed_pigs_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_feed_pigs_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_pigs_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_pigs_B.png', 'Child pouring feed into a pig trough, pigs eating eagerly', 'Paper-craft illustration of Child pouring feed into a pig trough, pigs eating eagerly', '["farm","pigs","feeding","chores","homestead","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Feed Pigs — B', 'visual_schedule:vs_feed_pigs', 'active'),
  ('a955f6e1-0f81-4aaf-b924-e59e8f6d80f2'::uuid, 'vs_feed_pigs_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_feed_pigs_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_pigs_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_pigs_C.png', 'Child feeding pigs in a full muddy pig pen scene with a barn', 'Paper-craft illustration of Child feeding pigs in a full muddy pig pen scene with a barn', '["farm","pigs","feeding","chores","homestead","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Feed Pigs — C', 'visual_schedule:vs_feed_pigs', 'active'),
  ('b8affd2e-a46c-47f5-9855-de8ebebb77e6'::uuid, 'vs_feed_rabbits_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_feed_rabbits_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_rabbits_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_rabbits_A.png', 'Child holding a carrot out to a fluffy rabbit in a hutch', 'Paper-craft illustration of Child holding a carrot out to a fluffy rabbit in a hutch', '["farm","rabbits","feeding","chores","homestead","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Feed Rabbits — A', 'visual_schedule:vs_feed_rabbits', 'active'),
  ('0ce725ac-a93b-4fbd-927f-63c278b5b858'::uuid, 'vs_feed_rabbits_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_feed_rabbits_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_rabbits_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_rabbits_B.png', 'Child feeding rabbits in a hutch, vegetables and hay visible', 'Paper-craft illustration of Child feeding rabbits in a hutch, vegetables and hay visible', '["farm","rabbits","feeding","chores","homestead","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Feed Rabbits — B', 'visual_schedule:vs_feed_rabbits', 'active'),
  ('16996f1b-e549-4083-b527-508ba36aa210'::uuid, 'vs_feed_rabbits_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_feed_rabbits_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_rabbits_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_feed_rabbits_C.png', 'Child tending to rabbits in a full hutch scene with food and bedding', 'Paper-craft illustration of Child tending to rabbits in a full hutch scene with food and bedding', '["farm","rabbits","feeding","chores","homestead","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Feed Rabbits — C', 'visual_schedule:vs_feed_rabbits', 'active'),
  ('c9167854-18ed-4578-91a4-ec53f9d967a2'::uuid, 'vs_groom_horse_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_groom_horse_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_groom_horse_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_groom_horse_A.png', 'Child holding a brush next to a horse, minimal background', 'Paper-craft illustration of Child holding a brush next to a horse, minimal background', '["farm","horse","grooming","chores","homestead","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Groom Horse — A', 'visual_schedule:vs_groom_horse', 'active'),
  ('8e62cbc7-15ad-45e0-8a98-d14f9d098080'::uuid, 'vs_groom_horse_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_groom_horse_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_groom_horse_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_groom_horse_B.png', 'Child brushing a horse in a stable, horse standing calmly', 'Paper-craft illustration of Child brushing a horse in a stable, horse standing calmly', '["farm","horse","grooming","chores","homestead","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Groom Horse — B', 'visual_schedule:vs_groom_horse', 'active'),
  ('d88713cb-5ca7-4e3d-9fc5-9b2e36d3bd90'::uuid, 'vs_groom_horse_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_groom_horse_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_groom_horse_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_groom_horse_C.png', 'Child grooming a horse in a full stable scene, brushes, buckets, hay', 'Paper-craft illustration of Child grooming a horse in a full stable scene, brushes, buckets, hay', '["farm","horse","grooming","chores","homestead","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Groom Horse — C', 'visual_schedule:vs_groom_horse', 'active'),
  ('cd6f7ea2-a072-4619-858b-89c10f5a2536'::uuid, 'vs_hair_blonde_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_hair_blonde_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hair_blonde_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hair_blonde_B.png', 'A blonde girl in a pink outfit brushing her long blonde hair, paper-craft dimensional style.', NULL, '["hair","brushing","blonde girl","pink","grooming"]'::jsonb, '{classic_myaim}'::text[], 'Hair — Blonde Girl Brushing', 'routine:morning_routine', 'active'),
  ('ad1c5e40-3850-4afd-8643-9dca45d68535'::uuid, 'vs_hair_brush_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_hair_brush_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hair_brush_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hair_brush_B.png', 'A light-skinned child in pajamas brushing their hair with a hairbrush, paper-craft style.', NULL, '["hair","brushing","hairbrush","pajamas","grooming"]'::jsonb, '{classic_myaim}'::text[], 'Hair — Child Brushing Hair', 'routine:morning_routine', 'active'),
  ('ad08ac98-0fd2-4583-9cd3-96f8ba315a9c'::uuid, 'vs_hair_brush_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_hair_brush_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hair_brush_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hair_brush_C.png', 'A dark-skinned girl with long hair brushing it in front of a bathroom mirror, full scene.', NULL, '["hair","brushing","mirror","girl","long hair","grooming"]'::jsonb, '{classic_myaim}'::text[], 'Hair — Dark-Skin Girl at Mirror', 'routine:morning_routine', 'active'),
  ('219ae3e5-763d-4f11-ab63-f41d57f263df'::uuid, 'vs_hair_object_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_hair_object_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hair_object_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hair_object_A.png', 'A paper-craft wooden hairbrush on a dresser surface, object view.', NULL, '["hair","hairbrush","object","grooming"]'::jsonb, '{classic_myaim}'::text[], 'Hair — Hairbrush', 'routine:morning_routine', 'active'),
  ('b16dc2ce-a016-40ba-9b9f-53756f340884'::uuid, 'vs_handwash_dry_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_dry_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_dry_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_dry_A.png', 'Paper-craft hands pressing against a hanging towel to dry, warm cream tones.', NULL, '["handwashing","drying","towel","hands"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Drying on Towel', 'routine:handwashing', 'active'),
  ('e5cf9df7-6191-4183-addd-4b0a39555a1e'::uuid, 'vs_handwash_dry_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_dry_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_dry_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_dry_B.png', 'A dark-skinned child drying hands on a towel hanging from a wall ring in the bathroom.', NULL, '["handwashing","drying","towel","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Drying with Towel Ring', 'routine:handwashing', 'active'),
  ('78c7022b-3d68-4846-8d56-1af6059e7cf7'::uuid, 'vs_handwash_dry_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_dry_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_dry_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_dry_C.png', 'A light-skinned child drying hands with a paper towel at the sink, full bathroom scene.', NULL, '["handwashing","drying","towel","sink","done"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Drying Hands', 'routine:handwashing', 'active'),
  ('153c8543-bc84-4592-b453-05f5650094e7'::uuid, 'vs_handwash_object_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_object_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_object_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_object_A.png', 'Paper-craft hands under a running faucet with blue paper-cut water drops falling.', NULL, '["handwashing","water","faucet","hands","object"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Water on Hands', 'routine:handwashing', 'active'),
  ('a0fdc2a3-f3bb-440a-a38a-31932e14be33'::uuid, 'vs_handwash_rinse_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_rinse_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_rinse_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_rinse_A.png', 'A child rinsing hands under a running faucet, paper-craft water drops visible.', NULL, '["handwashing","rinsing","water","faucet"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Rinsing', 'routine:handwashing', 'active'),
  ('f7c46f5a-d6b1-4fc9-a389-834e99d7367f'::uuid, 'vs_handwash_rinse_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_rinse_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_rinse_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_rinse_B.png', 'Close-up paper-craft hands held under a running faucet with blue water splashing.', NULL, '["handwashing","rinsing","water","faucet","hands"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Hands Under Faucet', 'routine:handwashing', 'active'),
  ('7b5c9f11-cc4a-424f-93db-c58b7eadd36b'::uuid, 'vs_handwash_rinse_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_rinse_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_rinse_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_rinse_C.png', 'A light-skinned child rinsing both hands under running water at the bathroom sink, full scene.', NULL, '["handwashing","rinsing","sink","water","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Rinsing at Sink', 'routine:handwashing', 'active'),
  ('1001d1a3-2002-4979-aee2-5f3613c13c33'::uuid, 'vs_handwash_scrub_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_scrub_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_scrub_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_scrub_A.png', 'Close-up paper-craft hands scrubbing together with white foam bubbles between them.', NULL, '["handwashing","scrubbing","soap","bubbles","hands"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Scrubbing Hands', 'routine:handwashing', 'active'),
  ('6439ff6d-6369-46df-9d05-0ef1a724fe08'::uuid, 'vs_handwash_scrub_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_scrub_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_scrub_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_scrub_B.png', 'A dark-skinned child scrubbing hands with soap bubbles at the sink, side view.', NULL, '["handwashing","scrubbing","bubbles","sink"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Scrubbing with Bubbles', 'routine:handwashing', 'active'),
  ('41982cd2-e8ba-45c8-92ba-9343a0d75e90'::uuid, 'vs_handwash_scrub_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_scrub_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_scrub_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_scrub_C.png', 'A child scrubbing soapy hands at a paper-craft bathroom sink with bubbles, full scene.', NULL, '["handwashing","scrubbing","soap","bubbles","sink"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Scrubbing at Sink', 'routine:handwashing', 'active'),
  ('6fc0c437-c4a2-4789-be1f-9b3e44e7e87c'::uuid, 'vs_handwash_soap_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_soap_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_soap_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_soap_A.png', 'A paper-craft soap dispenser pump bottle, warm cream tones on a clean background.', NULL, '["handwashing","soap","dispenser","object"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Soap Dispenser', 'routine:handwashing', 'active'),
  ('e1667c9d-d4fa-4cf5-b087-3fec059a7d79'::uuid, 'vs_handwash_soap_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_soap_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_soap_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_soap_B.png', 'A warm-toned child pumping liquid soap from a dispenser into their palm at the sink.', NULL, '["handwashing","soap","pumping","sink"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Pumping Soap', 'routine:handwashing', 'active'),
  ('d9233bb7-e15a-40bc-b380-410bd5f7279a'::uuid, 'vs_handwash_soap_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_soap_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_soap_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_soap_C.png', 'A light-skinned child at a bathroom sink with soap in hand, ready to scrub, full bathroom scene.', NULL, '["handwashing","soap","sink","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Soap at Sink', 'routine:handwashing', 'active'),
  ('ee80fc43-0b29-4067-97bd-4f5d823e5d31'::uuid, 'vs_handwash_water_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_water_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_water_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_water_B.png', 'A dark-skinned child turning on a paper-craft faucet at the bathroom sink.', NULL, '["handwashing","faucet","water","sink","turning on"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Turning on Water', 'routine:handwashing', 'active'),
  ('6907496e-25e9-48a4-890e-b3ae9a317ac8'::uuid, 'vs_handwash_water_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_handwash_water_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_water_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_handwash_water_C.png', 'A light-skinned child reaching up to turn on the faucet at a tall bathroom sink, full scene.', NULL, '["handwashing","faucet","reaching","sink","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Handwashing — Reaching Faucet', 'routine:handwashing', 'active'),
  ('913134d3-4b8a-44f0-b5da-46e910a407c1'::uuid, 'vs_hiking_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_hiking_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hiking_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hiking_A.png', 'Child hiking up a trail with a walking stick, minimal background', 'Paper-craft illustration of Child hiking up a trail with a walking stick, minimal background', '["outdoor","hiking","trail","nature","exercise","reward","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Hiking — A', 'visual_schedule:vs_hiking', 'active'),
  ('3ffcaa13-41a9-4f80-a0db-6fff611f9091'::uuid, 'vs_hiking_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_hiking_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hiking_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hiking_B.png', 'Child hiking on a mountain trail with a backpack', 'Paper-craft illustration of Child hiking on a mountain trail with a backpack', '["outdoor","hiking","trail","nature","exercise","reward","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Hiking — B', 'visual_schedule:vs_hiking', 'active'),
  ('9d235d9d-1b2b-4c45-b6e6-7ef9463cf605'::uuid, 'vs_hiking_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_hiking_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hiking_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_hiking_C.png', 'Child hiking through a forest trail, backpack, trees, full nature scene', 'Paper-craft illustration of Child hiking through a forest trail, backpack, trees, full nature scene', '["outdoor","hiking","trail","nature","exercise","reward","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Hiking — C', 'visual_schedule:vs_hiking', 'active'),
  ('68c332fb-9933-4bd9-8ade-367b8a59330e'::uuid, 'vs_ice_cream_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_ice_cream_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_ice_cream_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_ice_cream_A.png', 'Child eating a scoop of ice cream cone, minimal background', 'Paper-craft illustration of Child eating a scoop of ice cream cone, minimal background', '["reward","treat","ice cream","food","fun","celebration","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Ice Cream — A', 'visual_schedule:vs_ice_cream', 'active'),
  ('522bbf9e-d1bd-46c4-9e95-d6afdec18b1a'::uuid, 'vs_ice_cream_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_ice_cream_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_ice_cream_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_ice_cream_B.png', 'Child at an ice cream shop choosing flavors', 'Paper-craft illustration of Child at an ice cream shop choosing flavors', '["reward","treat","ice cream","food","fun","celebration","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Ice Cream — B', 'visual_schedule:vs_ice_cream', 'active'),
  ('c3da338e-1afd-4ee3-b97a-bb654dbb012e'::uuid, 'vs_ice_cream_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_ice_cream_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_ice_cream_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_ice_cream_C.png', 'Child at an ice cream parlor, colorful scoops, toppings, full shop scene', 'Paper-craft illustration of Child at an ice cream parlor, colorful scoops, toppings, full shop scene', '["reward","treat","ice cream","food","fun","celebration","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Ice Cream — C', 'visual_schedule:vs_ice_cream', 'active'),
  ('84e5e67f-3e30-4689-be86-710f83a9ef95'::uuid, 'vs_knitting_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_knitting_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_knitting_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_knitting_A.png', 'Child holding knitting needles with yarn, minimal background', 'Paper-craft illustration of Child holding knitting needles with yarn, minimal background', '["crafts","knitting","yarn","needles","creative","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Knitting — A', 'visual_schedule:vs_knitting', 'active'),
  ('902f6402-bb9a-4242-8d9a-b6d922b2326a'::uuid, 'vs_knitting_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_knitting_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_knitting_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_knitting_B.png', 'Child knitting with colorful yarn, some cozy context', 'Paper-craft illustration of Child knitting with colorful yarn, some cozy context', '["crafts","knitting","yarn","needles","creative","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Knitting — B', 'visual_schedule:vs_knitting', 'active'),
  ('de31a284-cdf8-444b-9a2d-f7fd72968dfb'::uuid, 'vs_knitting_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_knitting_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_knitting_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_knitting_C.png', 'Child knitting in a cozy chair, yarn basket, full warm scene', 'Paper-craft illustration of Child knitting in a cozy chair, yarn basket, full warm scene', '["crafts","knitting","yarn","needles","creative","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Knitting — C', 'visual_schedule:vs_knitting', 'active'),
  ('52c798e0-3f1a-4404-b2ca-d963ded910db'::uuid, 'vs_laundry_basket_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_basket_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_basket_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_basket_A.png', 'A paper-craft wicker laundry basket overflowing with colorful clothes, object view.', NULL, '["laundry","basket","clothes","object"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Full Basket', 'routine:chores', 'active'),
  ('63133681-e011-47a6-bb29-8bf8e4afedb3'::uuid, 'vs_laundry_carry_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_carry_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_carry_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_carry_B.png', 'A light-skinned child carrying a laundry basket with clothes, paper-craft style.', NULL, '["laundry","basket","carrying","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Carrying Basket', 'routine:chores', 'active'),
  ('8d4fbd9a-c971-4aec-bf5a-03fa8702b73d'::uuid, 'vs_laundry_carry_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_carry_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_carry_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_carry_C.png', 'A dark-skinned child carrying a laundry basket toward the washing machine, full scene.', NULL, '["laundry","basket","carrying","washing machine","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Carrying to Washer', 'routine:chores', 'active'),
  ('178acdd1-0364-4d46-b539-fbfb390a19d4'::uuid, 'vs_laundry_detergent_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_detergent_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_detergent_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_detergent_A.png', 'A paper-craft laundry detergent bottle and pod, object view on clean background.', NULL, '["laundry","detergent","bottle","object"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Detergent Bottle', 'routine:chores', 'active'),
  ('69c0f516-0d86-4945-b111-43ae2398f41b'::uuid, 'vs_laundry_dryer_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_dryer_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_dryer_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_dryer_A.png', 'A paper-craft front-loading dryer, object view on a clean background.', NULL, '["laundry","dryer","appliance","object"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Dryer', 'routine:chores', 'active'),
  ('5fa11a2b-0827-4bf1-9b02-e8956660da63'::uuid, 'vs_laundry_fold_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_fold_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_fold_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_fold_A.png', 'A neat stack of paper-craft folded clothes in pastel colors, object view.', NULL, '["laundry","folding","folded clothes","stack","object"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Folded Clothes Stack', 'routine:chores', 'active'),
  ('161920af-1554-4d93-8cbd-13af71f244d2'::uuid, 'vs_laundry_fold_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_fold_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_fold_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_fold_B.png', 'A child seated on the floor folding a piece of clothing, paper-craft dimensional style.', NULL, '["laundry","folding","floor","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Child Folding', 'routine:chores', 'active'),
  ('d365a84a-660d-4884-8287-ce703cbf9c33'::uuid, 'vs_laundry_fold_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_fold_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_fold_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_fold_C.png', 'A light-skinned child folding laundry on their bed, full bedroom scene.', NULL, '["laundry","folding","bed","bedroom","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Folding on Bed', 'routine:chores', 'active'),
  ('0dbac1f5-2958-475c-a742-6174e9ba5341'::uuid, 'vs_laundry_hang_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_hang_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_hang_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_hang_B.png', 'A light-skinned child hanging clothes on an outdoor clothesline, paper-craft style.', NULL, '["laundry","clothesline","hanging","outdoor","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Child Hanging Clothes', 'routine:chores', 'active'),
  ('0b9b0bed-cbbf-4d27-94a0-286d75391e6a'::uuid, 'vs_laundry_line_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_line_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_line_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_line_A.png', 'Paper-craft clothes hanging on a clothesline with wooden pegs, object view.', NULL, '["laundry","clothesline","hanging","drying","object"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Clothes on Line', 'routine:chores', 'active'),
  ('12c0b569-695e-464d-bdaa-8bbc14e3126c'::uuid, 'vs_laundry_load_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_load_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_load_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_load_B.png', 'A light-skinned child loading clothes into the washing machine, paper-craft style.', NULL, '["laundry","washing machine","loading","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Loading Washer', 'routine:chores', 'active'),
  ('12c274fd-fa83-46cc-a4da-1b8b083d6a1a'::uuid, 'vs_laundry_load_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_load_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_load_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_load_C.png', 'A dark-skinned child loading laundry into a front-loading washer, full laundry room scene.', NULL, '["laundry","washing machine","loading","laundry room","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Child at Washer', 'routine:chores', 'active'),
  ('c98148c0-f6ed-4e8d-9139-b9dae93ae750'::uuid, 'vs_laundry_pour_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_pour_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_pour_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_pour_B.png', 'A child pouring liquid detergent into the washing machine drawer, paper-craft style.', NULL, '["laundry","detergent","pouring","washing machine","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Pouring Detergent', 'routine:chores', 'active'),
  ('fa7546ab-97da-4ee7-8fac-109270455c61'::uuid, 'vs_laundry_pour_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_pour_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_pour_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_pour_C.png', 'A child holding a detergent bottle next to the washing machine, paper-craft style.', NULL, '["laundry","detergent","washing machine","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Child with Detergent', 'routine:chores', 'active'),
  ('c71bd2ce-047e-4045-a681-8a26bfa789f4'::uuid, 'vs_laundry_sort_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_sort_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_sort_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_sort_A.png', 'Paper-craft piles of sorted laundry — light and dark clothes separated, object view.', NULL, '["laundry","sorting","piles","clothes","object"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Sorted Piles', 'routine:chores', 'active'),
  ('a735b49f-423e-4fd2-b8dd-17e3dd24d52b'::uuid, 'vs_laundry_sort_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_sort_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_sort_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_sort_B.png', 'A child seated on the floor sorting laundry into piles, paper-craft dimensional style.', NULL, '["laundry","sorting","floor","piles","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Child Sorting', 'routine:chores', 'active'),
  ('e8561e79-2e4b-4b07-899d-ef1162035717'::uuid, 'vs_laundry_sort_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_sort_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_sort_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_sort_C.png', 'A child standing next to a laundry basket sorting clothes, full laundry room scene.', NULL, '["laundry","sorting","basket","laundry room","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Child with Basket', 'routine:chores', 'active'),
  ('f371f0a3-6d93-45ed-8d74-62fbd1b5d254'::uuid, 'vs_laundry_start_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_start_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_start_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_start_A.png', 'A hand pressing the start button on a paper-craft washing machine, close-up view.', NULL, '["laundry","washing machine","start button","pressing"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Starting Washer', 'routine:chores', 'active'),
  ('6f470a31-626b-4f4b-9706-06cd43949bda'::uuid, 'vs_laundry_start_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_start_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_start_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_start_B.png', 'A child pressing the button to start the washing machine, paper-craft dimensional style.', NULL, '["laundry","washing machine","start","pressing button","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Child Starting Washer', 'routine:chores', 'active'),
  ('971fd12e-856c-4008-89a9-7e7f68da7724'::uuid, 'vs_laundry_start_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_start_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_start_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_start_C.png', 'A blonde girl in overalls pressing the start button on the washing machine, full scene.', NULL, '["laundry","washing machine","start","blonde girl","overalls","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Blonde Girl at Washer', 'routine:chores', 'active'),
  ('6c2b238c-e747-4bef-ae82-0c01bdf90c4b'::uuid, 'vs_laundry_transfer_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_transfer_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_transfer_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_transfer_C.png', 'A dark-skinned child transferring clean laundry from the dryer to a basket, full scene.', NULL, '["laundry","dryer","basket","transferring","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Transferring to Basket', 'routine:chores', 'active'),
  ('6db61266-12ea-464a-836f-daed7a4913ef'::uuid, 'vs_laundry_unload_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_unload_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_unload_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_unload_B.png', 'A light-skinned child pulling warm clothes out of the dryer, paper-craft style.', NULL, '["laundry","dryer","unloading","warm clothes","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Unloading Dryer', 'routine:chores', 'active'),
  ('902c801f-37fe-4698-8cce-6b23b5361884'::uuid, 'vs_laundry_unload_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_unload_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_unload_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_unload_C.png', 'A dark-skinned child unloading laundry from the dryer, full laundry room scene.', NULL, '["laundry","dryer","unloading","laundry room","helping"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Child at Dryer', 'routine:chores', 'active'),
  ('8106397d-211c-47e1-9cd9-22ef771dfdcc'::uuid, 'vs_laundry_washer_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_laundry_washer_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_washer_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_laundry_washer_A.png', 'A paper-craft front-loading washing machine with open door, object view.', NULL, '["laundry","washing machine","object","appliance"]'::jsonb, '{classic_myaim}'::text[], 'Laundry — Washing Machine', 'routine:chores', 'active'),
  ('91928956-a788-4925-a1d7-7231255810a0'::uuid, 'vs_library_visit_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_library_visit_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_library_visit_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_library_visit_A.png', 'Child picking out a book at a library, minimal background', 'Paper-craft illustration of Child picking out a book at a library, minimal background', '["reward","library","books","reading","outing","learning","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Library Visit — A', 'visual_schedule:vs_library_visit', 'active'),
  ('48ece2ca-301b-4ed4-94a6-3a98e4469d05'::uuid, 'vs_library_visit_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_library_visit_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_library_visit_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_library_visit_B.png', 'Child at a library reading table, books, some library context', 'Paper-craft illustration of Child at a library reading table, books, some library context', '["reward","library","books","reading","outing","learning","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Library Visit — B', 'visual_schedule:vs_library_visit', 'active'),
  ('f16a5d0a-8931-415d-a91b-893cf13dfb13'::uuid, 'vs_library_visit_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_library_visit_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_library_visit_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_library_visit_C.png', 'Child at a cozy library, bookshelves, reading nook, full warm scene', 'Paper-craft illustration of Child at a cozy library, bookshelves, reading nook, full warm scene', '["reward","library","books","reading","outing","learning","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Library Visit — C', 'visual_schedule:vs_library_visit', 'active'),
  ('9bd095c9-ffd0-4831-9c2c-288326eabfb1'::uuid, 'vs_math_practice_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_math_practice_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_math_practice_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_math_practice_A.png', 'Child counting on fingers or with blocks, minimal background', 'Paper-craft illustration of Child counting on fingers or with blocks, minimal background', '["learning","math","counting","education","practice","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Math Practice — A', 'visual_schedule:vs_math_practice', 'active'),
  ('be6d7206-5045-46ca-ab74-bc6ba81d36d7'::uuid, 'vs_math_practice_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_math_practice_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_math_practice_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_math_practice_B.png', 'Child doing math with manipulatives on a table', 'Paper-craft illustration of Child doing math with manipulatives on a table', '["learning","math","counting","education","practice","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Math Practice — B', 'visual_schedule:vs_math_practice', 'active'),
  ('9d62a559-96b4-4837-bc23-8feb36984da5'::uuid, 'vs_math_practice_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_math_practice_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_math_practice_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_math_practice_C.png', 'Child doing math at a desk, number cards, pencil, classroom scene', 'Paper-craft illustration of Child doing math at a desk, number cards, pencil, classroom scene', '["learning","math","counting","education","practice","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Math Practice — C', 'visual_schedule:vs_math_practice', 'active'),
  ('97e3aa2e-3922-4886-bf88-920641418b7a'::uuid, 'vs_milk_cow_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_milk_cow_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_milk_cow_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_milk_cow_A.png', 'Child sitting on a stool next to a cow with a bucket', 'Paper-craft illustration of Child sitting on a stool next to a cow with a bucket', '["farm","cow","milking","chores","homestead","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Milk Cow — A', 'visual_schedule:vs_milk_cow', 'active'),
  ('04366004-c11e-41c7-9d50-c4d53da3c96e'::uuid, 'vs_milk_cow_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_milk_cow_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_milk_cow_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_milk_cow_B.png', 'Child milking a cow in a barn stall, bucket filling with milk', 'Paper-craft illustration of Child milking a cow in a barn stall, bucket filling with milk', '["farm","cow","milking","chores","homestead","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Milk Cow — B', 'visual_schedule:vs_milk_cow', 'active'),
  ('3b03eab6-d1ce-4f22-88d7-cdf84b143e88'::uuid, 'vs_milk_cow_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_milk_cow_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_milk_cow_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_milk_cow_C.png', 'Child milking a cow in a full cozy barn scene, hay, lantern, full scene', 'Paper-craft illustration of Child milking a cow in a full cozy barn scene, hay, lantern, full scene', '["farm","cow","milking","chores","homestead","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Milk Cow — C', 'visual_schedule:vs_milk_cow', 'active'),
  ('c248a2b7-9c01-4296-bbc6-8a64d440be00'::uuid, 'vs_mini_golf_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_mini_golf_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_mini_golf_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_mini_golf_A.png', 'Child putting a golf ball on mini golf course, minimal background', 'Paper-craft illustration of Child putting a golf ball on mini golf course, minimal background', '["reward","mini golf","fun","activity","outing","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Mini Golf — A', 'visual_schedule:vs_mini_golf', 'active'),
  ('458ff495-e1c4-4fc7-acc8-a964d312d693'::uuid, 'vs_mini_golf_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_mini_golf_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_mini_golf_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_mini_golf_B.png', 'Child playing mini golf, windmill obstacle, some course context', 'Paper-craft illustration of Child playing mini golf, windmill obstacle, some course context', '["reward","mini golf","fun","activity","outing","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Mini Golf — B', 'visual_schedule:vs_mini_golf', 'active'),
  ('7e4bc87a-7c73-46d6-9e0b-4be0ce74365f'::uuid, 'vs_mini_golf_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_mini_golf_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_mini_golf_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_mini_golf_C.png', 'Child playing mini golf, colorful course, obstacles, full outdoor scene', 'Paper-craft illustration of Child playing mini golf, colorful course, obstacles, full outdoor scene', '["reward","mini golf","fun","activity","outing","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Mini Golf — C', 'visual_schedule:vs_mini_golf', 'active'),
  ('929d4f6d-d67a-4e9a-b514-73f149de1e04'::uuid, 'vs_mop_floor_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_mop_floor_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_mop_floor_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_mop_floor_A.png', 'Child holding a mop on a clean floor, minimal background', 'Paper-craft illustration of Child holding a mop on a clean floor, minimal background', '["cleaning","mop","floor","chores","deep clean","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Mop Floor — A', 'visual_schedule:vs_mop_floor', 'active'),
  ('34615544-fc93-41cd-9f91-52313826dc6e'::uuid, 'vs_mop_floor_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_mop_floor_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_mop_floor_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_mop_floor_B.png', 'Child mopping a kitchen floor with a bucket of soapy water', 'Paper-craft illustration of Child mopping a kitchen floor with a bucket of soapy water', '["cleaning","mop","floor","chores","deep clean","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Mop Floor — B', 'visual_schedule:vs_mop_floor', 'active'),
  ('a5289945-4e60-43e1-801a-d613f87985e2'::uuid, 'vs_mop_floor_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_mop_floor_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_mop_floor_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_mop_floor_C.png', 'Child mopping a full kitchen floor, bucket, sudsy water, clean tiles', 'Paper-craft illustration of Child mopping a full kitchen floor, bucket, sudsy water, clean tiles', '["cleaning","mop","floor","chores","deep clean","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Mop Floor — C', 'visual_schedule:vs_mop_floor', 'active'),
  ('0b796ea2-464e-4e6b-803d-225c43135a1e'::uuid, 'vs_movie_night_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_movie_night_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_movie_night_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_movie_night_A.png', 'Child watching a movie with popcorn on a couch', 'Paper-craft illustration of Child watching a movie with popcorn on a couch', '["reward","movie","popcorn","cozy","fun","family","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Movie Night — A', 'visual_schedule:vs_movie_night', 'active'),
  ('ecf9e6ae-f43c-4f7f-9e24-ff4f459d17e4'::uuid, 'vs_movie_night_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_movie_night_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_movie_night_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_movie_night_B.png', 'Child watching movie night at home, blanket, popcorn', 'Paper-craft illustration of Child watching movie night at home, blanket, popcorn', '["reward","movie","popcorn","cozy","fun","family","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Movie Night — B', 'visual_schedule:vs_movie_night', 'active'),
  ('df653516-1cb1-452e-8d73-3fee60871555'::uuid, 'vs_movie_night_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_movie_night_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_movie_night_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_movie_night_C.png', 'Family movie night, couch, blanket, popcorn, TV, full cozy scene', 'Paper-craft illustration of Family movie night, couch, blanket, popcorn, TV, full cozy scene', '["reward","movie","popcorn","cozy","fun","family","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Movie Night — C', 'visual_schedule:vs_movie_night', 'active'),
  ('21258e39-107c-4ebd-b1a2-40ab4bf41d00'::uuid, 'vs_muck_stall_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_muck_stall_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_muck_stall_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_muck_stall_A.png', 'Child holding a pitchfork in a barn stall, minimal background', 'Paper-craft illustration of Child holding a pitchfork in a barn stall, minimal background', '["farm","barn","cleaning","chores","homestead","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Muck Stall — A', 'visual_schedule:vs_muck_stall', 'active'),
  ('790aa243-73df-46ef-b036-f03d9b249209'::uuid, 'vs_muck_stall_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_muck_stall_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_muck_stall_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_muck_stall_B.png', 'Child mucking out a horse stall with a pitchfork and wheelbarrow', 'Paper-craft illustration of Child mucking out a horse stall with a pitchfork and wheelbarrow', '["farm","barn","cleaning","chores","homestead","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Muck Stall — B', 'visual_schedule:vs_muck_stall', 'active'),
  ('054b891c-1f6a-4688-a948-52c10280f078'::uuid, 'vs_muck_stall_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_muck_stall_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_muck_stall_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_muck_stall_C.png', 'Child cleaning a full barn stall, pitchfork, wheelbarrow, hay, full scene', 'Paper-craft illustration of Child cleaning a full barn stall, pitchfork, wheelbarrow, hay, full scene', '["farm","barn","cleaning","chores","homestead","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Muck Stall — C', 'visual_schedule:vs_muck_stall', 'active'),
  ('396fffe7-5f4b-4544-bcd9-436306265eab'::uuid, 'vs_nature_walk_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_nature_walk_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_nature_walk_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_nature_walk_A.png', 'Child walking on a nature trail with a stick, minimal background', 'Paper-craft illustration of Child walking on a nature trail with a stick, minimal background', '["outdoor","nature","walking","explore","trail","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Nature Walk — A', 'visual_schedule:vs_nature_walk', 'active'),
  ('b6263355-8636-4c10-b21c-cde79ebf0ab2'::uuid, 'vs_nature_walk_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_nature_walk_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_nature_walk_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_nature_walk_B.png', 'Child exploring nature, collecting leaves, some trail context', 'Paper-craft illustration of Child exploring nature, collecting leaves, some trail context', '["outdoor","nature","walking","explore","trail","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Nature Walk — B', 'visual_schedule:vs_nature_walk', 'active'),
  ('89d4bf0d-dc6d-454c-bd4e-88064ac4ab06'::uuid, 'vs_nature_walk_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_nature_walk_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_nature_walk_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_nature_walk_C.png', 'Child on a nature walk, collecting specimens, backpack, full forest trail', 'Paper-craft illustration of Child on a nature walk, collecting specimens, backpack, full forest trail', '["outdoor","nature","walking","explore","trail","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Nature Walk — C', 'visual_schedule:vs_nature_walk', 'active'),
  ('e45c87f5-84d7-4065-9ebb-996e0101ab39'::uuid, 'vs_paper_crafts_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_paper_crafts_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_paper_crafts_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_paper_crafts_A.png', 'Child cutting paper with safety scissors, minimal background', 'Paper-craft illustration of Child cutting paper with safety scissors, minimal background', '["art","crafts","scissors","glue","paper","creative","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Paper Crafts — A', 'visual_schedule:vs_paper_crafts', 'active'),
  ('786e061c-f221-450c-a492-34ff5ab76231'::uuid, 'vs_paper_crafts_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_paper_crafts_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_paper_crafts_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_paper_crafts_B.png', 'Child cutting and gluing paper shapes, some craft table context', 'Paper-craft illustration of Child cutting and gluing paper shapes, some craft table context', '["art","crafts","scissors","glue","paper","creative","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Paper Crafts — B', 'visual_schedule:vs_paper_crafts', 'active'),
  ('bb50fb60-24c0-4b23-b1f0-4f991687de70'::uuid, 'vs_paper_crafts_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_paper_crafts_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_paper_crafts_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_paper_crafts_C.png', 'Child making a paper collage, scissors, glue, colorful paper pieces', 'Paper-craft illustration of Child making a paper collage, scissors, glue, colorful paper pieces', '["art","crafts","scissors","glue","paper","creative","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Paper Crafts — C', 'visual_schedule:vs_paper_crafts', 'active'),
  ('04bce55c-b774-4dec-9e6a-1190981e7ced'::uuid, 'vs_park_outing_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_park_outing_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_park_outing_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_park_outing_A.png', 'Child feeding ducks at a pond in a park, minimal background', 'Paper-craft illustration of Child feeding ducks at a pond in a park, minimal background', '["reward","park","outdoor","family","fun","outing","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Park Outing — A', 'visual_schedule:vs_park_outing', 'active'),
  ('cc050c3c-b151-4cba-8909-97565edccd95'::uuid, 'vs_park_outing_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_park_outing_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_park_outing_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_park_outing_B.png', 'Child playing frisbee in a park, some park context', 'Paper-craft illustration of Child playing frisbee in a park, some park context', '["reward","park","outdoor","family","fun","outing","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Park Outing — B', 'visual_schedule:vs_park_outing', 'active'),
  ('34e9b96c-dc1c-4b73-b2e3-380b78295687'::uuid, 'vs_park_outing_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_park_outing_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_park_outing_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_park_outing_C.png', 'Family picnic in a park, blanket, basket, trees, full sunny outdoor scene', 'Paper-craft illustration of Family picnic in a park, blanket, basket, trees, full sunny outdoor scene', '["reward","park","outdoor","family","fun","outing","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Park Outing — C', 'visual_schedule:vs_park_outing', 'active'),
  ('291f1d9c-e457-456c-8b81-b23c3b5fce5f'::uuid, 'vs_piano_practice_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_piano_practice_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_piano_practice_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_piano_practice_A.png', 'Child sitting at a piano playing keys, minimal background', 'Paper-craft illustration of Child sitting at a piano playing keys, minimal background', '["learning","music","piano","practice","instrument","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Piano Practice — A', 'visual_schedule:vs_piano_practice', 'active'),
  ('cd8ca9ce-055e-4acb-805d-6501c88d30fb'::uuid, 'vs_piano_practice_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_piano_practice_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_piano_practice_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_piano_practice_B.png', 'Child practicing piano at an upright piano, some room context', 'Paper-craft illustration of Child practicing piano at an upright piano, some room context', '["learning","music","piano","practice","instrument","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Piano Practice — B', 'visual_schedule:vs_piano_practice', 'active'),
  ('fa878b12-0ebd-451d-9df9-cca46a51f6b8'::uuid, 'vs_piano_practice_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_piano_practice_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_piano_practice_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_piano_practice_C.png', 'Child practicing piano in a cozy music room, sheet music, lamp', 'Paper-craft illustration of Child practicing piano in a cozy music room, sheet music, lamp', '["learning","music","piano","practice","instrument","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Piano Practice — C', 'visual_schedule:vs_piano_practice', 'active'),
  ('90e452de-5638-437b-8b94-e85f2ced5333'::uuid, 'vs_plant_garden_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_plant_garden_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_plant_garden_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_plant_garden_A.png', 'Child holding a small plant or seed packet, minimal background', 'Paper-craft illustration of Child holding a small plant or seed packet, minimal background', '["garden","planting","outdoor","chores","homestead","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Plant Garden — A', 'visual_schedule:vs_plant_garden', 'active'),
  ('69cbfbdf-738b-41aa-808e-6ca5f8d13088'::uuid, 'vs_plant_garden_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_plant_garden_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_plant_garden_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_plant_garden_B.png', 'Child planting seedlings in a garden bed with a trowel', 'Paper-craft illustration of Child planting seedlings in a garden bed with a trowel', '["garden","planting","outdoor","chores","homestead","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Plant Garden — B', 'visual_schedule:vs_plant_garden', 'active'),
  ('664a91ce-972f-4978-8e9d-3d344a054d82'::uuid, 'vs_plant_garden_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_plant_garden_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_plant_garden_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_plant_garden_C.png', 'Child planting a full garden, rows of seedlings, watering can, full scene', 'Paper-craft illustration of Child planting a full garden, rows of seedlings, watering can, full scene', '["garden","planting","outdoor","chores","homestead","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Plant Garden — C', 'visual_schedule:vs_plant_garden', 'active'),
  ('930eba11-e23b-4972-ad0f-1c16f79c671b'::uuid, 'vs_playground_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_playground_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_playground_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_playground_A.png', 'Child on a swing at a playground, minimal background', 'Paper-craft illustration of Child on a swing at a playground, minimal background', '["outdoor","playground","play","fun","reward","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Playground — A', 'visual_schedule:vs_playground', 'active'),
  ('3d990391-457e-4c84-abda-6e8128922f87'::uuid, 'vs_playground_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_playground_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_playground_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_playground_B.png', 'Child playing on a playground slide, some playground context', 'Paper-craft illustration of Child playing on a playground slide, some playground context', '["outdoor","playground","play","fun","reward","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Playground — B', 'visual_schedule:vs_playground', 'active'),
  ('d1f03124-881d-45df-9bc2-0faacfd5706a'::uuid, 'vs_playground_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_playground_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_playground_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_playground_C.png', 'Child playing at a full playground, swings, slide, other children', 'Paper-craft illustration of Child playing at a full playground, swings, slide, other children', '["outdoor","playground","play","fun","reward","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Playground — C', 'visual_schedule:vs_playground', 'active'),
  ('e9e6085d-522e-44e9-9537-17553498cfa6'::uuid, 'vs_potty_approach_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_approach_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_approach_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_approach_B.png', 'A dark-skinned child in a patterned shirt walking toward a paper-craft toilet in a tiled bathroom.', NULL, '["potty","bathroom","walking","toilet"]'::jsonb, '{classic_myaim}'::text[], 'Potty — Walking to Toilet', 'routine:potty_routine', 'active'),
  ('5662afc4-332c-45d1-9a43-10f507004ffa'::uuid, 'vs_potty_approach_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_approach_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_approach_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_approach_C.png', 'A child in a striped shirt sitting on a paper-craft toilet in a fully detailed tiled bathroom scene.', NULL, '["potty","bathroom","sitting","toilet"]'::jsonb, '{classic_myaim}'::text[], 'Potty — Sitting Down', 'routine:potty_routine', 'active'),
  ('920c79da-ac0a-4f2c-990f-27f2690f9f22'::uuid, 'vs_potty_flush_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_flush_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_flush_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_flush_B.png', 'A dark-skinned child walking toward a paper-craft bathroom sink to wash hands after using the toilet.', NULL, '["potty","handwashing","sink","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Potty — Walking to Sink', 'routine:potty_routine', 'active'),
  ('0ee36922-5af0-43dd-b6b4-d21cc999a3a6'::uuid, 'vs_potty_flush_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_flush_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_flush_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_flush_C.png', 'A light-skinned child smiling at the bathroom sink, hands clean, all done with potty routine.', NULL, '["potty","done","smiling","bathroom","success"]'::jsonb, '{classic_myaim}'::text[], 'Potty — Done, Smiling', 'routine:potty_routine', 'active'),
  ('39bf79f4-1438-4ec8-9e86-65335a9f7c90'::uuid, 'vs_potty_object_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_object_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_object_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_object_A.png', 'A paper-craft toilet paper roll on a warm cream background, dimensional layered paper texture.', NULL, '["potty","bathroom","toilet paper","object"]'::jsonb, '{classic_myaim}'::text[], 'Potty — Object', 'routine:potty_routine', 'active'),
  ('98e98cef-48ca-422a-8b2d-0edc66618d0f'::uuid, 'vs_potty_sit_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_sit_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_sit_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_sit_A.png', 'A close-up paper-craft toilet paper roll mounted on a wall holder, warm cream tones.', NULL, '["potty","toilet paper","bathroom","object"]'::jsonb, '{classic_myaim}'::text[], 'Potty — Toilet Paper', 'routine:potty_routine', 'active'),
  ('be512e35-711c-4f3f-9e37-569b63fd80ef'::uuid, 'vs_potty_sit_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_sit_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_sit_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_sit_B.png', 'A dark-skinned child reaching up to pull toilet paper from a wall-mounted holder in a bathroom.', NULL, '["potty","toilet paper","reaching","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Potty — Reaching for Paper', 'routine:potty_routine', 'active'),
  ('dd6ae7f1-b2d3-4b91-80ca-265107c32442'::uuid, 'vs_potty_sit_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_sit_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_sit_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_sit_C.png', 'A light-skinned child pulling a length of toilet paper from a roll, paper-craft bathroom scene.', NULL, '["potty","toilet paper","wiping","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Potty — Pulling Paper', 'routine:potty_routine', 'active'),
  ('ef492fe2-26e2-4f7a-ad6d-e0e26361c21c'::uuid, 'vs_potty_wash_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_wash_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_wash_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_wash_A.png', 'A child in overalls standing confidently, paper-craft style, representing completion of the potty routine.', NULL, '["potty","done","standing","overalls","success"]'::jsonb, '{classic_myaim}'::text[], 'Potty — Standing Ready', 'routine:potty_routine', 'active'),
  ('418f4301-2bbf-41b1-ad6c-4c8439a8f2db'::uuid, 'vs_potty_wash_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_wash_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_wash_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_wash_B.png', 'A child walking toward the sink after using the toilet, paper-craft bathroom background.', NULL, '["potty","handwashing","walking","sink"]'::jsonb, '{classic_myaim}'::text[], 'Potty — Walking to Sink', 'routine:potty_routine', 'active'),
  ('535f9749-fe46-4233-9379-b1ecde707571'::uuid, 'vs_potty_wash_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_wash_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_wash_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_wash_C.png', 'A smiling child in a bright bathroom, all done with the potty routine, paper-craft dimensional style.', NULL, '["potty","done","smiling","bathroom","success"]'::jsonb, '{classic_myaim}'::text[], 'Potty — All Done', 'routine:potty_routine', 'active'),
  ('11d68726-bea6-488d-bd64-2366d288d065'::uuid, 'vs_potty_wipe_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_wipe_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_wipe_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_wipe_A.png', 'A dark-skinned child wiping with toilet paper, shown from the waist up in a paper-craft style.', NULL, '["potty","wiping","hygiene","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Potty — Wiping', 'routine:potty_routine', 'active'),
  ('634b0ee7-6b54-4a84-bbd7-ecf218e13749'::uuid, 'vs_potty_wipe_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_wipe_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_wipe_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_wipe_B.png', 'A child reaching to flush a paper-craft toilet, side view with tiled bathroom background.', NULL, '["potty","flushing","toilet","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Potty — Flushing', 'routine:potty_routine', 'active'),
  ('c390759d-3bd5-441d-84ae-beb57d94e084'::uuid, 'vs_potty_wipe_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_potty_wipe_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_wipe_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_potty_wipe_C.png', 'A paper-craft toilet with a blue swirling water graphic, showing the flushing action.', NULL, '["potty","flushing","toilet","water"]'::jsonb, '{classic_myaim}'::text[], 'Potty — Toilet with Swirl', 'routine:potty_routine', 'active'),
  ('a536954c-b732-4f8b-87d7-0aa20103f890'::uuid, 'vs_puzzle_time_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_puzzle_time_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_puzzle_time_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_puzzle_time_A.png', 'Child working on a jigsaw puzzle, minimal background', 'Paper-craft illustration of Child working on a jigsaw puzzle, minimal background', '["learning","puzzle","concentration","play","quiet time","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Puzzle Time — A', 'visual_schedule:vs_puzzle_time', 'active'),
  ('0c6b2347-2c3f-4b8e-be10-ca3bb4c03d12'::uuid, 'vs_puzzle_time_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_puzzle_time_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_puzzle_time_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_puzzle_time_B.png', 'Child doing a puzzle on a table, some pieces visible', 'Paper-craft illustration of Child doing a puzzle on a table, some pieces visible', '["learning","puzzle","concentration","play","quiet time","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Puzzle Time — B', 'visual_schedule:vs_puzzle_time', 'active'),
  ('7ff36f08-9fe1-4a06-b0a8-e224964e9876'::uuid, 'vs_puzzle_time_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_puzzle_time_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_puzzle_time_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_puzzle_time_C.png', 'Child completing a large jigsaw puzzle, many pieces, full cozy scene', 'Paper-craft illustration of Child completing a large jigsaw puzzle, many pieces, full cozy scene', '["learning","puzzle","concentration","play","quiet time","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Puzzle Time — C', 'visual_schedule:vs_puzzle_time', 'active'),
  ('cb73cbb2-fca8-4e4e-aa02-e6d6c4c8ea91'::uuid, 'vs_read_book_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_read_book_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_read_book_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_read_book_A.png', 'Child sitting cross-legged reading a book, minimal background', 'Paper-craft illustration of Child sitting cross-legged reading a book, minimal background', '["learning","reading","books","education","quiet time","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Read Book — A', 'visual_schedule:vs_read_book', 'active'),
  ('0282f678-5032-499c-8246-22fc39f12f68'::uuid, 'vs_read_book_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_read_book_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_read_book_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_read_book_B.png', 'Child reading a book at a table with a lamp, cozy context', 'Paper-craft illustration of Child reading a book at a table with a lamp, cozy context', '["learning","reading","books","education","quiet time","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Read Book — B', 'visual_schedule:vs_read_book', 'active'),
  ('ec1af82c-059c-487e-af24-1ea8591ba6dd'::uuid, 'vs_read_book_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_read_book_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_read_book_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_read_book_C.png', 'Child reading in a cozy nook with bookshelves, full scene', 'Paper-craft illustration of Child reading in a cozy nook with bookshelves, full scene', '["learning","reading","books","education","quiet time","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Read Book — C', 'visual_schedule:vs_read_book', 'active'),
  ('a1ea2e1a-82c5-409d-a4bd-747cb725a81c'::uuid, 'vs_science_experiment_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_science_experiment_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_science_experiment_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_science_experiment_A.png', 'Child looking through a magnifying glass at a leaf', 'Paper-craft illustration of Child looking through a magnifying glass at a leaf', '["learning","science","experiment","education","explore","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Science Experiment — A', 'visual_schedule:vs_science_experiment', 'active'),
  ('dd329fe9-57b7-4250-89bc-ac850117b905'::uuid, 'vs_science_experiment_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_science_experiment_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_science_experiment_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_science_experiment_B.png', 'Child doing a simple science experiment with cups and water', 'Paper-craft illustration of Child doing a simple science experiment with cups and water', '["learning","science","experiment","education","explore","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Science Experiment — B', 'visual_schedule:vs_science_experiment', 'active'),
  ('3f90ae9b-d825-413e-a73b-13bddb1af05b'::uuid, 'vs_science_experiment_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_science_experiment_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_science_experiment_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_science_experiment_C.png', 'Child doing a science experiment, test tubes, magnifying glass, notebook', 'Paper-craft illustration of Child doing a science experiment, test tubes, magnifying glass, notebook', '["learning","science","experiment","education","explore","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Science Experiment — C', 'visual_schedule:vs_science_experiment', 'active'),
  ('b485f04b-876d-4cec-bfaa-6c70a04520fa'::uuid, 'vs_scrub_tub_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_scrub_tub_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_scrub_tub_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_scrub_tub_A.png', 'Child holding a scrub brush next to a bathtub', 'Paper-craft illustration of Child holding a scrub brush next to a bathtub', '["cleaning","bathroom","tub","scrub","deep clean","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Scrub Tub — A', 'visual_schedule:vs_scrub_tub', 'active'),
  ('95a5b71a-7ff2-4713-be21-0dcd0bbf47f3'::uuid, 'vs_scrub_tub_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_scrub_tub_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_scrub_tub_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_scrub_tub_B.png', 'Child scrubbing a bathtub with a brush and cleaning spray', 'Paper-craft illustration of Child scrubbing a bathtub with a brush and cleaning spray', '["cleaning","bathroom","tub","scrub","deep clean","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Scrub Tub — B', 'visual_schedule:vs_scrub_tub', 'active'),
  ('38dbf607-20fb-47dd-af15-46fb5d1019be'::uuid, 'vs_scrub_tub_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_scrub_tub_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_scrub_tub_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_scrub_tub_C.png', 'Child scrubbing a full bathtub, cleaning supplies, sparkling clean result', 'Paper-craft illustration of Child scrubbing a full bathtub, cleaning supplies, sparkling clean result', '["cleaning","bathroom","tub","scrub","deep clean","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Scrub Tub — C', 'visual_schedule:vs_scrub_tub', 'active'),
  ('c57c2384-90d8-484f-b1d3-ad2c86a38369'::uuid, 'vs_sewing_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_sewing_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_sewing_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_sewing_A.png', 'Child threading a needle or sewing fabric, minimal background', 'Paper-craft illustration of Child threading a needle or sewing fabric, minimal background', '["crafts","sewing","needle","fabric","creative","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Sewing — A', 'visual_schedule:vs_sewing', 'active'),
  ('9b306d2e-6315-4064-a413-426caba465a0'::uuid, 'vs_sewing_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_sewing_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_sewing_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_sewing_B.png', 'Child hand-sewing a simple project, some craft table context', 'Paper-craft illustration of Child hand-sewing a simple project, some craft table context', '["crafts","sewing","needle","fabric","creative","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Sewing — B', 'visual_schedule:vs_sewing', 'active'),
  ('f4ffc1c5-1032-4c97-916f-a99192baad5c'::uuid, 'vs_sewing_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_sewing_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_sewing_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_sewing_C.png', 'Child sewing at a table, fabric, thread, needles, full cozy craft scene', 'Paper-craft illustration of Child sewing at a table, fabric, thread, needles, full cozy craft scene', '["crafts","sewing","needle","fabric","creative","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Sewing — C', 'visual_schedule:vs_sewing', 'active'),
  ('8fbb7e74-8a22-41eb-b805-61aef6d5665b'::uuid, 'vs_soccer_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_soccer_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_soccer_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_soccer_A.png', 'Child kicking a soccer ball, minimal background', 'Paper-craft illustration of Child kicking a soccer ball, minimal background', '["outdoor","soccer","sports","exercise","reward","fun","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Soccer — A', 'visual_schedule:vs_soccer', 'active'),
  ('2dcdb763-bcd7-410b-9834-f38d7e1deea0'::uuid, 'vs_soccer_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_soccer_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_soccer_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_soccer_B.png', 'Child playing soccer in a field, some field context', 'Paper-craft illustration of Child playing soccer in a field, some field context', '["outdoor","soccer","sports","exercise","reward","fun","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Soccer — B', 'visual_schedule:vs_soccer', 'active'),
  ('d1891e5a-601e-43d4-9f7a-2383a1776145'::uuid, 'vs_soccer_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_soccer_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_soccer_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_soccer_C.png', 'Child playing soccer, goal, teammates, full outdoor field scene', 'Paper-craft illustration of Child playing soccer, goal, teammates, full outdoor field scene', '["outdoor","soccer","sports","exercise","reward","fun","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Soccer — C', 'visual_schedule:vs_soccer', 'active'),
  ('46f98155-77d6-47dd-b155-f787d2571d68'::uuid, 'vs_stamp_art_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_stamp_art_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_stamp_art_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_stamp_art_A.png', 'Child stamping with a stamp and ink pad, minimal background', 'Paper-craft illustration of Child stamping with a stamp and ink pad, minimal background', '["art","stamps","ink","crafts","creative","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Stamp Art — A', 'visual_schedule:vs_stamp_art', 'active'),
  ('c6359e7a-5b51-4cb0-94cd-095ea0cc0500'::uuid, 'vs_stamp_art_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_stamp_art_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_stamp_art_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_stamp_art_B.png', 'Child doing stamp art, ink pads, paper, some craft context', 'Paper-craft illustration of Child doing stamp art, ink pads, paper, some craft context', '["art","stamps","ink","crafts","creative","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Stamp Art — B', 'visual_schedule:vs_stamp_art', 'active'),
  ('a7585dc4-9e33-4f11-9d16-f78cb40cb92a'::uuid, 'vs_stamp_art_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_stamp_art_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_stamp_art_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_stamp_art_C.png', 'Child doing stamp art project, multiple stamps, ink pads, colorful results', 'Paper-craft illustration of Child doing stamp art project, multiple stamps, ink pads, colorful results', '["art","stamps","ink","crafts","creative","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Stamp Art — C', 'visual_schedule:vs_stamp_art', 'active'),
  ('f7cf2c23-13ee-4c02-87f1-6af956506e65'::uuid, 'vs_swimming_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_swimming_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_swimming_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_swimming_A.png', 'Child in swimsuit jumping into a pool, minimal background', 'Paper-craft illustration of Child in swimsuit jumping into a pool, minimal background', '["outdoor","swimming","pool","exercise","reward","fun","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Swimming — A', 'visual_schedule:vs_swimming', 'active'),
  ('00ecf1cb-911c-42dd-9da5-25c6a667bdfb'::uuid, 'vs_swimming_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_swimming_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_swimming_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_swimming_B.png', 'Child swimming in a pool, arms in freestyle stroke', 'Paper-craft illustration of Child swimming in a pool, arms in freestyle stroke', '["outdoor","swimming","pool","exercise","reward","fun","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Swimming — B', 'visual_schedule:vs_swimming', 'active'),
  ('e445269a-f1cd-4553-a844-eaf66e0e1818'::uuid, 'vs_swimming_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_swimming_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_swimming_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_swimming_C.png', 'Child swimming in a pool, lane lines, splash, full outdoor pool scene', 'Paper-craft illustration of Child swimming in a pool, lane lines, splash, full outdoor pool scene', '["outdoor","swimming","pool","exercise","reward","fun","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Swimming — C', 'visual_schedule:vs_swimming', 'active'),
  ('96fd02fb-b783-48d8-b1a0-0bd0b3373161'::uuid, 'vs_teeth_bottom_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_bottom_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_bottom_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_bottom_A.png', 'A dark-skinned child brushing the bottom row of teeth with a toothbrush, paper-craft style.', NULL, '["teeth","brushing","bottom teeth","toothbrush"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Brushing Bottom Teeth', 'routine:brushing_teeth', 'active'),
  ('5233d638-0f4a-4c8d-b231-54f62c3b2c4d'::uuid, 'vs_teeth_bottom_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_bottom_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_bottom_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_bottom_B.png', 'Close-up paper-craft open mouth with a toothbrush brushing the bottom row of teeth.', NULL, '["teeth","brushing","bottom teeth","mouth","close-up"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Open Mouth Bottom', 'routine:brushing_teeth', 'active'),
  ('3b5b4633-5316-4263-9e69-3a4b3e2e18de'::uuid, 'vs_teeth_bottom_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_bottom_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_bottom_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_bottom_C.png', 'A dark-skinned girl brushing teeth at the bathroom sink with a pink toothbrush, full scene.', NULL, '["teeth","brushing","girl","sink","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Dark-Skin Girl Brushing', 'routine:brushing_teeth', 'active'),
  ('095bbc9f-482d-4256-a039-e7affccbdf70'::uuid, 'vs_teeth_done_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_done_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_done_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_done_A.png', 'A paper-craft toothbrush placed back in its holder cup, routine complete.', NULL, '["teeth","toothbrush","holder","done","object"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Toothbrush in Holder', 'routine:brushing_teeth', 'active'),
  ('6eb6568c-efdd-48f1-a376-dc293d5fe96d'::uuid, 'vs_teeth_done_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_done_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_done_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_done_B.png', 'A child brushing teeth in front of a bathroom mirror, paper-craft dimensional style.', NULL, '["teeth","brushing","mirror","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Brushing at Mirror', 'routine:brushing_teeth', 'active'),
  ('cc4b1a7d-e178-458a-94f5-8273889153a1'::uuid, 'vs_teeth_done_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_done_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_done_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_done_C.png', 'A toothbrush and cup on the bathroom counter, all done, clean and tidy.', NULL, '["teeth","toothbrush","cup","done","object"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Toothbrush and Cup Done', 'routine:brushing_teeth', 'active'),
  ('4b014ce6-88d5-4c32-a270-55399c3614b1'::uuid, 'vs_teeth_object_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_object_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_object_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_object_A.png', 'A paper-craft toothbrush standing in a ceramic cup on a bathroom counter, warm tones.', NULL, '["teeth","toothbrush","cup","object","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Toothbrush in Cup', 'routine:brushing_teeth', 'active'),
  ('b7ba2b56-c872-491c-bb6e-40cca63b7a99'::uuid, 'vs_teeth_paste_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_paste_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_paste_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_paste_A.png', 'A paper-craft toothpaste tube squeezing blue-green toothpaste onto a toothbrush, object view.', NULL, '["teeth","toothpaste","toothbrush","object"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Toothpaste Tube', 'routine:brushing_teeth', 'active'),
  ('20db8c40-ce1e-463a-86d2-9b2aef9bfda6'::uuid, 'vs_teeth_paste_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_paste_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_paste_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_paste_B.png', 'A dark-skinned child squeezing toothpaste onto a toothbrush, paper-craft dimensional style.', NULL, '["teeth","toothpaste","toothbrush","squeezing"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Putting on Toothpaste', 'routine:brushing_teeth', 'active'),
  ('0f3e3a70-7804-46fe-89bd-5b5fc24067df'::uuid, 'vs_teeth_paste_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_paste_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_paste_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_paste_C.png', 'A blonde girl in a blue shirt squeezing toothpaste onto her toothbrush at the bathroom sink.', NULL, '["teeth","toothpaste","toothbrush","blonde girl","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Blonde Girl with Toothpaste', 'routine:brushing_teeth', 'active'),
  ('e32a3864-83a3-48c9-b23a-48378d3945bd'::uuid, 'vs_teeth_pickup_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_pickup_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_pickup_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_pickup_B.png', 'A dark-skinned child holding a toothbrush and cup, ready to brush teeth, paper-craft style.', NULL, '["teeth","toothbrush","getting ready","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Getting Toothbrush', 'routine:brushing_teeth', 'active'),
  ('0ebecd0b-32d1-4293-bd65-4dbd8cb27cf7'::uuid, 'vs_teeth_pickup_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_pickup_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_pickup_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_pickup_C.png', 'A light-skinned child standing at the bathroom sink holding a toothbrush, full scene.', NULL, '["teeth","toothbrush","sink","bathroom","getting ready"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — At Sink with Toothbrush', 'routine:brushing_teeth', 'active'),
  ('d853af0d-5111-49d0-bb53-3f2dabe52add'::uuid, 'vs_teeth_rinse_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_rinse_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_rinse_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_rinse_A.png', 'A blonde child leaning over the sink to rinse mouth after brushing, warm-toned paper-craft.', NULL, '["teeth","rinsing","sink","mouth","after brushing"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Rinsing', 'routine:brushing_teeth', 'active'),
  ('53d930cd-c7d4-40e9-9b17-5cb22509c92f'::uuid, 'vs_teeth_rinse_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_rinse_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_rinse_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_rinse_B.png', 'A dark-skinned child holding a cup of water to rinse mouth after brushing teeth.', NULL, '["teeth","rinsing","cup","water","after brushing"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Rinsing with Cup', 'routine:brushing_teeth', 'active'),
  ('12bb540a-a03a-4a3a-8434-87d3db371a46'::uuid, 'vs_teeth_rinse_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_rinse_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_rinse_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_rinse_C.png', 'A girl rinsing her mouth at the bathroom sink with the mirror visible, full scene.', NULL, '["teeth","rinsing","girl","mirror","sink","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Girl Rinsing at Mirror', 'routine:brushing_teeth', 'active'),
  ('f9cf8d94-6307-4142-880c-ab53012b57a4'::uuid, 'vs_teeth_spit_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_spit_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_spit_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_spit_A.png', 'Paper-craft toothbrush and rinse cup on the bathroom counter, object view.', NULL, '["teeth","toothbrush","cup","object","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Toothbrush and Cup', 'routine:brushing_teeth', 'active'),
  ('7b0bfd7f-c1f8-498b-a499-1742b42a7e2d'::uuid, 'vs_teeth_spit_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_spit_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_spit_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_spit_B.png', 'A child placing their toothbrush back in the cup holder after brushing, paper-craft style.', NULL, '["teeth","toothbrush","putting away","done"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Putting Toothbrush Away', 'routine:brushing_teeth', 'active'),
  ('bb92f79a-cda7-44b4-bc80-373ef9f09e11'::uuid, 'vs_teeth_spit_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_spit_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_spit_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_spit_C.png', 'A toothbrush being rinsed under a running tap, paper-craft water drops visible.', NULL, '["teeth","toothbrush","rinsing","faucet","water"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Rinsing Toothbrush', 'routine:brushing_teeth', 'active'),
  ('3d43715a-f863-48c1-806e-a07ca4d7e445'::uuid, 'vs_teeth_tongue_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_tongue_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_tongue_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_tongue_A.png', 'Close-up paper-craft open mouth with tongue extended and a toothbrush brushing the tongue.', NULL, '["teeth","tongue","brushing","mouth","close-up"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Brushing Tongue', 'routine:brushing_teeth', 'active'),
  ('ad199647-2b3e-4cf3-9512-06cf45f858be'::uuid, 'vs_teeth_tongue_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_tongue_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_tongue_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_tongue_B.png', 'A dark-skinned boy brushing teeth with a colorful toothbrush, paper-craft dimensional style.', NULL, '["teeth","brushing","boy","toothbrush"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Dark-Skin Boy Brushing', 'routine:brushing_teeth', 'active'),
  ('e3cae395-df44-455e-8bae-b6bb9de6c9af'::uuid, 'vs_teeth_tongue_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_tongue_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_tongue_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_tongue_C.png', 'A light-brown haired girl brushing teeth at the bathroom sink, smiling, full scene.', NULL, '["teeth","brushing","girl","sink","bathroom","smiling"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Light-Brown Girl at Sink', 'routine:brushing_teeth', 'active'),
  ('d4e645e3-7560-4d86-8c79-6eb60234d321'::uuid, 'vs_teeth_top_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_top_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_top_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_top_A.png', 'Close-up paper-craft open mouth with a toothbrush brushing the top row of teeth.', NULL, '["teeth","brushing","top teeth","mouth","close-up"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Brushing Top Teeth', 'routine:brushing_teeth', 'active'),
  ('bff28d55-2f43-4fd6-9090-55adee5b9725'::uuid, 'vs_teeth_top_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_top_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_top_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_top_B.png', 'A child brushing teeth with a blue toothbrush, paper-craft style, bathroom mirror visible.', NULL, '["teeth","brushing","toothbrush","bathroom"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Child Brushing', 'routine:brushing_teeth', 'active'),
  ('8e0f7a4c-be77-4b27-a018-cd2de2f3dafb'::uuid, 'vs_teeth_top_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_teeth_top_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_top_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_teeth_top_C.png', 'A dark-skinned child brushing teeth in front of a bathroom mirror, full scene.', NULL, '["teeth","brushing","mirror","bathroom","toothbrush"]'::jsonb, '{classic_myaim}'::text[], 'Teeth — Brushing at Mirror', 'routine:brushing_teeth', 'active'),
  ('1a8a175b-e807-472b-bc46-37f640ad87c6'::uuid, 'vs_tidy_bed_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_tidy_bed_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_tidy_bed_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_tidy_bed_A.png', 'A dark-skinned child pulling the blanket up to make their bed, paper-craft style.', NULL, '["tidying","bed","making bed","blanket","bedroom"]'::jsonb, '{classic_myaim}'::text[], 'Tidy — Making the Bed', 'routine:chores', 'active'),
  ('cac77f96-8ec4-42e0-ad8b-6f7fe8046457'::uuid, 'vs_tidy_done_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_tidy_done_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_tidy_done_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_tidy_done_C.png', 'A dark-skinned boy standing in a clean tidy bedroom with a smile, all done.', NULL, '["tidying","done","tidy room","bedroom","success","smiling"]'::jsonb, '{classic_myaim}'::text[], 'Tidy — Tidy Room Done', 'routine:chores', 'active'),
  ('ec549d07-d0a2-4933-9049-304050eba564'::uuid, 'vs_tidy_drawer_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_tidy_drawer_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_tidy_drawer_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_tidy_drawer_A.png', 'A paper-craft dresser drawer open showing neatly folded clothes inside, object view.', NULL, '["tidying","drawer","dresser","clothes","organized","object"]'::jsonb, '{classic_myaim}'::text[], 'Tidy — Open Drawer with Clothes', 'routine:chores', 'active'),
  ('7b61c219-49d4-483e-8921-2624164f5e3f'::uuid, 'vs_tidy_drawer_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_tidy_drawer_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_tidy_drawer_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_tidy_drawer_B.png', 'A light-skinned child placing folded clothes into a dresser drawer, paper-craft style.', NULL, '["tidying","drawer","dresser","putting away","clothes"]'::jsonb, '{classic_myaim}'::text[], 'Tidy — Child Putting in Drawer', 'routine:chores', 'active'),
  ('7b0781d5-37a1-4874-b369-dd3983a78aa5'::uuid, 'vs_tidy_drawer_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_tidy_drawer_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_tidy_drawer_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_tidy_drawer_C.png', 'A light-skinned child putting clothes away in a dresser, full bedroom scene.', NULL, '["tidying","drawer","dresser","bedroom","putting away"]'::jsonb, '{classic_myaim}'::text[], 'Tidy — Child at Dresser', 'routine:chores', 'active'),
  ('27c55c68-dc0d-48a1-9047-372cdec7c49a'::uuid, 'vs_tidy_floor_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_tidy_floor_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_tidy_floor_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_tidy_floor_A.png', 'Paper-craft toys and clothes scattered on a bedroom floor, representing a messy room.', NULL, '["tidying","messy","floor","toys","clothes","bedroom"]'::jsonb, '{classic_myaim}'::text[], 'Tidy — Messy Floor', 'routine:chores', 'active'),
  ('7e918362-adbe-44ed-986a-28288642c080'::uuid, 'vs_violin_practice_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_violin_practice_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_violin_practice_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_violin_practice_A.png', 'Child holding a violin and bow, minimal background', 'Paper-craft illustration of Child holding a violin and bow, minimal background', '["learning","music","violin","practice","instrument","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Violin Practice — A', 'visual_schedule:vs_violin_practice', 'active'),
  ('d0a6cfea-fdd6-4c56-b8c4-4b870d32a921'::uuid, 'vs_violin_practice_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_violin_practice_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_violin_practice_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_violin_practice_B.png', 'Child playing violin, standing, some music room context', 'Paper-craft illustration of Child playing violin, standing, some music room context', '["learning","music","violin","practice","instrument","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Violin Practice — B', 'visual_schedule:vs_violin_practice', 'active'),
  ('c0912431-cd76-44f1-9dc6-66e21ea4ef30'::uuid, 'vs_violin_practice_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_violin_practice_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_violin_practice_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_violin_practice_C.png', 'Child playing violin in a music room, music stand, sheet music', 'Paper-craft illustration of Child playing violin in a music room, music stand, sheet music', '["learning","music","violin","practice","instrument","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Violin Practice — C', 'visual_schedule:vs_violin_practice', 'active'),
  ('e6556148-0584-45b8-96ca-7731dcdedf59'::uuid, 'vs_wash_walls_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_wash_walls_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_wash_walls_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_wash_walls_A.png', 'Child with a sponge wiping a wall, minimal background', 'Paper-craft illustration of Child with a sponge wiping a wall, minimal background', '["cleaning","walls","chores","deep clean","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Wash Walls — A', 'visual_schedule:vs_wash_walls', 'active'),
  ('c185a77d-22da-497b-b1a7-9332c20450fc'::uuid, 'vs_wash_walls_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_wash_walls_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_wash_walls_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_wash_walls_B.png', 'Child washing a wall with a sponge and bucket of soapy water', 'Paper-craft illustration of Child washing a wall with a sponge and bucket of soapy water', '["cleaning","walls","chores","deep clean","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Wash Walls — B', 'visual_schedule:vs_wash_walls', 'active'),
  ('d962993a-a0f3-48a2-ad31-1ffba15c2cb4'::uuid, 'vs_wash_walls_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_wash_walls_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_wash_walls_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_wash_walls_C.png', 'Child washing walls in a full room, bucket, sponge, clean streaks', 'Paper-craft illustration of Child washing walls in a full room, bucket, sponge, clean streaks', '["cleaning","walls","chores","deep clean","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Wash Walls — C', 'visual_schedule:vs_wash_walls', 'active'),
  ('b8d9e0c3-ea1e-4259-a1cb-5b84d45cddd5'::uuid, 'vs_water_animals_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_water_animals_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_water_animals_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_water_animals_A.png', 'Child carrying a water bucket toward an animal trough', 'Paper-craft illustration of Child carrying a water bucket toward an animal trough', '["farm","water","animals","chores","homestead","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Water Animals — A', 'visual_schedule:vs_water_animals', 'active'),
  ('2642e304-dbf0-44ca-b691-c26e7cd276ea'::uuid, 'vs_water_animals_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_water_animals_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_water_animals_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_water_animals_B.png', 'Child filling a water trough for farm animals', 'Paper-craft illustration of Child filling a water trough for farm animals', '["farm","water","animals","chores","homestead","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Water Animals — B', 'visual_schedule:vs_water_animals', 'active'),
  ('24387f95-5696-4f6f-a0f9-58e791a84d3a'::uuid, 'vs_water_animals_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_water_animals_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_water_animals_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_water_animals_C.png', 'Child watering multiple farm animals in a full farmyard scene', 'Paper-craft illustration of Child watering multiple farm animals in a full farmyard scene', '["farm","water","animals","chores","homestead","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Water Animals — C', 'visual_schedule:vs_water_animals', 'active'),
  ('356842dd-4f47-4fbd-b133-cff5b23407be'::uuid, 'vs_water_garden_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_water_garden_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_water_garden_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_water_garden_A.png', 'Child holding a watering can over a plant, minimal background', 'Paper-craft illustration of Child holding a watering can over a plant, minimal background', '["garden","watering","outdoor","chores","homestead","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Water Garden — A', 'visual_schedule:vs_water_garden', 'active'),
  ('bd9c69ec-6922-4b08-8112-16fa44908bc0'::uuid, 'vs_water_garden_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_water_garden_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_water_garden_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_water_garden_B.png', 'Child watering a garden bed with a watering can', 'Paper-craft illustration of Child watering a garden bed with a watering can', '["garden","watering","outdoor","chores","homestead","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Water Garden — B', 'visual_schedule:vs_water_garden', 'active'),
  ('f4ebdbf0-52d5-4afd-ac13-b09f23ec07ff'::uuid, 'vs_water_garden_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_water_garden_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_water_garden_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_water_garden_C.png', 'Child watering a full garden, rows of plants, sunshine, full outdoor scene', 'Paper-craft illustration of Child watering a full garden, rows of plants, sunshine, full outdoor scene', '["garden","watering","outdoor","chores","homestead","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Water Garden — C', 'visual_schedule:vs_water_garden', 'active'),
  ('9f22f864-5ada-4c19-bce8-91a1ec04cc94'::uuid, 'vs_watercolor_painting_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_watercolor_painting_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_watercolor_painting_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_watercolor_painting_A.png', 'Child painting with watercolors, brush in hand, minimal background', 'Paper-craft illustration of Child painting with watercolors, brush in hand, minimal background', '["art","painting","watercolor","brush","creative","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Watercolor Painting — A', 'visual_schedule:vs_watercolor_painting', 'active'),
  ('e3418a95-1a4a-46fa-9097-072310f36a6e'::uuid, 'vs_watercolor_painting_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_watercolor_painting_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_watercolor_painting_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_watercolor_painting_B.png', 'Child painting at a table with watercolor set, some context', 'Paper-craft illustration of Child painting at a table with watercolor set, some context', '["art","painting","watercolor","brush","creative","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Watercolor Painting — B', 'visual_schedule:vs_watercolor_painting', 'active'),
  ('6fcfa4e4-d952-47c5-b1e4-573f497bef72'::uuid, 'vs_watercolor_painting_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_watercolor_painting_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_watercolor_painting_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_watercolor_painting_C.png', 'Child painting a watercolor picture, paints, brushes, water cup', 'Paper-craft illustration of Child painting a watercolor picture, paints, brushes, water cup', '["art","painting","watercolor","brush","creative","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Watercolor Painting — C', 'visual_schedule:vs_watercolor_painting', 'active'),
  ('bcf05bd6-90c7-45ec-a6e9-6116cc358e39'::uuid, 'vs_weed_garden_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_weed_garden_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_weed_garden_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_weed_garden_A.png', 'Child pulling a weed from the ground, minimal background', 'Paper-craft illustration of Child pulling a weed from the ground, minimal background', '["garden","weeding","outdoor","chores","homestead","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Weed Garden — A', 'visual_schedule:vs_weed_garden', 'active'),
  ('962179f0-3be7-4196-96ae-0c0e094bd289'::uuid, 'vs_weed_garden_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_weed_garden_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_weed_garden_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_weed_garden_B.png', 'Child weeding a garden bed, pile of pulled weeds beside them', 'Paper-craft illustration of Child weeding a garden bed, pile of pulled weeds beside them', '["garden","weeding","outdoor","chores","homestead","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Weed Garden — B', 'visual_schedule:vs_weed_garden', 'active'),
  ('8118fec4-54e9-41c4-8042-cb3a6837f15e'::uuid, 'vs_weed_garden_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_weed_garden_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_weed_garden_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_weed_garden_C.png', 'Child weeding a full vegetable garden, kneeling, gloves, full scene', 'Paper-craft illustration of Child weeding a full vegetable garden, kneeling, gloves, full scene', '["garden","weeding","outdoor","chores","homestead","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Weed Garden — C', 'visual_schedule:vs_weed_garden', 'active'),
  ('df74f1d5-efae-46f6-b1cb-85a60c617ac9'::uuid, 'vs_writing_practice_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_writing_practice_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_writing_practice_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_writing_practice_A.png', 'Child writing in a notebook with a pencil, minimal background', 'Paper-craft illustration of Child writing in a notebook with a pencil, minimal background', '["learning","writing","homework","education","practice","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Writing Practice — A', 'visual_schedule:vs_writing_practice', 'active'),
  ('21bcaad6-7b7f-44ae-8e42-965f4b8a3001'::uuid, 'vs_writing_practice_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_writing_practice_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_writing_practice_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_writing_practice_B.png', 'Child writing at a desk, pencil in hand, some desk context', 'Paper-craft illustration of Child writing at a desk, pencil in hand, some desk context', '["learning","writing","homework","education","practice","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Writing Practice — B', 'visual_schedule:vs_writing_practice', 'active'),
  ('f95a6533-0bf7-453c-9b1a-919bf597bdb4'::uuid, 'vs_writing_practice_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_writing_practice_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_writing_practice_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_writing_practice_C.png', 'Child doing homework at a desk, books, pencils, lamp, full scene', 'Paper-craft illustration of Child doing homework at a desk, books, pencils, lamp, full scene', '["learning","writing","homework","education","practice","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Writing Practice — C', 'visual_schedule:vs_writing_practice', 'active'),
  ('c6dd9658-a0a7-481b-9947-712b5e721449'::uuid, 'vs_zoo_trip_A', 'A', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_zoo_trip_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_zoo_trip_A.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_zoo_trip_A.png', 'Child looking at a giraffe at the zoo, minimal background', 'Paper-craft illustration of Child looking at a giraffe at the zoo, minimal background', '["reward","zoo","animals","outing","fun","adventure","variant_A"]'::jsonb, '{classic_myaim}'::text[], 'Zoo Trip — A', 'visual_schedule:vs_zoo_trip', 'active'),
  ('aacd43c2-97d9-4e22-bbfb-f3ce23832346'::uuid, 'vs_zoo_trip_B', 'B', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_zoo_trip_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_zoo_trip_B.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_zoo_trip_B.png', 'Child at the zoo looking at animals, some zoo context', 'Paper-craft illustration of Child at the zoo looking at animals, some zoo context', '["reward","zoo","animals","outing","fun","adventure","variant_B"]'::jsonb, '{classic_myaim}'::text[], 'Zoo Trip — B', 'visual_schedule:vs_zoo_trip', 'active'),
  ('9643b879-da59-46e0-be9b-a81cb603af44'::uuid, 'vs_zoo_trip_C', 'C', 'visual_schedule', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/512/vs_zoo_trip_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_zoo_trip_C.png', 'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/platform-assets/visual-schedule/128/vs_zoo_trip_C.png', 'Child at the zoo, multiple animals, paths, full colorful zoo scene', 'Paper-craft illustration of Child at the zoo, multiple animals, paths, full colorful zoo scene', '["reward","zoo","animals","outing","fun","adventure","variant_C"]'::jsonb, '{classic_myaim}'::text[], 'Zoo Trip — C', 'visual_schedule:vs_zoo_trip', 'active')
ON CONFLICT (feature_key, variant, category) DO NOTHING;

-- ============================================================================
-- 5. RPC — roll_creature_for_completion(p_task_completion_id UUID)
-- ============================================================================
-- Per Q6 = Option B: PostgreSQL RPC is the authoritative gamification pipeline
-- endpoint. Server-side, transactional, idempotency-safe by awarded_source_id.
-- Called by useCompleteTask + useApproveCompletion in Sub-phase C.
--
-- Returns JSONB with:
--   { points_awarded, new_point_total,
--     creature_awarded, creature: {...} | null,
--     page_unlocked, page: {...} | null,
--     streak_updated, new_streak, streak_milestone }

CREATE OR REPLACE FUNCTION public.roll_creature_for_completion(
  p_task_completion_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completion         RECORD;
  v_task               RECORD;
  v_member             RECORD;
  v_config             RECORD;
  v_state              RECORD;
  v_existing_creature  UUID;
  v_completion_type    TEXT;
  v_points_to_award    INTEGER := 0;
  v_new_point_total    INTEGER := 0;
  v_streak_updated     BOOLEAN := false;
  v_new_streak         INTEGER := 0;
  v_streak_milestone   INTEGER := NULL;
  v_creature_roll      INTEGER;
  v_rarity_roll        INTEGER;
  v_chosen_rarity      TEXT := NULL;
  v_creature           RECORD := NULL;
  v_creature_awarded   BOOLEAN := false;
  v_page               RECORD := NULL;
  v_page_unlocked      BOOLEAN := false;
  v_next_page_id       UUID;
  v_position_x         REAL;
  v_position_y         REAL;
  v_common_pct         INTEGER;
  v_rare_pct           INTEGER;
BEGIN
  -- Step 1: Load task_completion + task + member context
  SELECT * INTO v_completion
    FROM public.task_completions
   WHERE id = p_task_completion_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'task_completion_not_found');
  END IF;

  SELECT * INTO v_task FROM public.tasks WHERE id = v_completion.task_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'task_not_found');
  END IF;

  SELECT * INTO v_member
    FROM public.family_members
   WHERE id = v_completion.family_member_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'family_member_not_found');
  END IF;

  SELECT * INTO v_config
    FROM public.gamification_configs
   WHERE family_member_id = v_member.id;
  IF NOT FOUND OR v_config.enabled = false THEN
    RETURN jsonb_build_object('gamification_disabled', true);
  END IF;

  -- Step 2: Idempotency — has this completion already been processed?
  SELECT id INTO v_existing_creature
    FROM public.member_creature_collection
   WHERE awarded_source_id = p_task_completion_id
   LIMIT 1;
  IF FOUND THEN
    -- Already processed. Return current state without re-awarding.
    RETURN jsonb_build_object(
      'already_processed', true,
      'new_point_total', v_member.gamification_points,
      'new_streak', v_member.current_streak
    );
  END IF;

  -- Step 3: Filter by completion_type
  -- (PRD-09A/09B Build J added completion_type for practice/mastery flows)
  v_completion_type := COALESCE(v_completion.completion_type, 'complete');
  IF v_completion_type NOT IN ('complete', 'mastery_approved') THEN
    -- Practice / mastery_submit / other types do NOT trigger the pipeline.
    -- Per Q8 = Option C.
    RETURN jsonb_build_object(
      'skipped_completion_type', v_completion_type
    );
  END IF;

  -- Step 4: Calculate points (points_override on task wins, fallback to config)
  v_points_to_award := COALESCE(v_task.points_override, v_config.base_points_per_task);
  v_new_point_total := COALESCE(v_member.gamification_points, 0) + v_points_to_award;

  UPDATE public.family_members
     SET gamification_points = v_new_point_total
   WHERE id = v_member.id;

  -- Step 5: Update streak (naive consecutive-day per Q5 = Option B)
  IF v_member.last_task_completion_date IS NULL THEN
    v_new_streak := 1;
    v_streak_updated := true;
  ELSIF v_member.last_task_completion_date = CURRENT_DATE THEN
    -- Already completed a task today; streak unchanged
    v_new_streak := COALESCE(v_member.current_streak, 1);
    v_streak_updated := false;
  ELSIF v_member.last_task_completion_date = (CURRENT_DATE - INTERVAL '1 day')::date THEN
    -- Yesterday — increment
    v_new_streak := COALESCE(v_member.current_streak, 0) + 1;
    v_streak_updated := true;
  ELSE
    -- Gap — reset to 1
    v_new_streak := 1;
    v_streak_updated := true;
  END IF;

  IF v_streak_updated THEN
    UPDATE public.family_members
       SET current_streak = v_new_streak,
           longest_streak = GREATEST(COALESCE(longest_streak, 0), v_new_streak),
           last_task_completion_date = CURRENT_DATE
     WHERE id = v_member.id;
  END IF;

  -- Step 6: Roll creature (only if sticker book enabled)
  SELECT * INTO v_state
    FROM public.member_sticker_book_state
   WHERE family_member_id = v_member.id;
  IF NOT FOUND OR v_state.is_enabled = false THEN
    -- Points + streak only, no creature roll
    RETURN jsonb_build_object(
      'points_awarded',    v_points_to_award,
      'new_point_total',   v_new_point_total,
      'creature_awarded',  false,
      'creature',          NULL,
      'page_unlocked',     false,
      'page',              NULL,
      'streak_updated',    v_streak_updated,
      'new_streak',        v_new_streak,
      'streak_milestone',  NULL
    );
  END IF;

  -- d100 vs creature_roll_chance_per_task (default 40)
  v_creature_roll := floor(random() * 100)::int + 1;
  IF v_creature_roll > v_state.creature_roll_chance_per_task THEN
    -- Roll failed — points + streak only
    RETURN jsonb_build_object(
      'points_awarded',    v_points_to_award,
      'new_point_total',   v_new_point_total,
      'creature_awarded',  false,
      'creature',          NULL,
      'page_unlocked',     false,
      'page',              NULL,
      'streak_updated',    v_streak_updated,
      'new_streak',        v_new_streak,
      'streak_milestone',  NULL
    );
  END IF;

  -- Step 7: Pick rarity from weights JSONB
  v_common_pct := COALESCE((v_state.rarity_weights->>'common')::int, 85);
  v_rare_pct   := COALESCE((v_state.rarity_weights->>'rare')::int, 12);
  v_rarity_roll := floor(random() * 100)::int + 1;
  IF v_rarity_roll <= v_common_pct THEN
    v_chosen_rarity := 'common';
  ELSIF v_rarity_roll <= (v_common_pct + v_rare_pct) THEN
    v_chosen_rarity := 'rare';
  ELSE
    v_chosen_rarity := 'legendary';
  END IF;

  -- Step 8: Pick a creature from the rarity pool. Fall through to lower tiers
  -- if the chosen tier has no creatures.
  SELECT * INTO v_creature
    FROM public.gamification_creatures
   WHERE theme_id = v_state.active_theme_id
     AND rarity = v_chosen_rarity
     AND is_active = true
   ORDER BY random()
   LIMIT 1;

  IF NOT FOUND AND v_chosen_rarity = 'legendary' THEN
    SELECT * INTO v_creature
      FROM public.gamification_creatures
     WHERE theme_id = v_state.active_theme_id
       AND rarity = 'rare'
       AND is_active = true
     ORDER BY random()
     LIMIT 1;
    IF FOUND THEN v_chosen_rarity := 'rare'; END IF;
  END IF;

  IF NOT FOUND AND v_chosen_rarity IN ('rare','legendary') THEN
    SELECT * INTO v_creature
      FROM public.gamification_creatures
     WHERE theme_id = v_state.active_theme_id
       AND rarity = 'common'
       AND is_active = true
     ORDER BY random()
     LIMIT 1;
    IF FOUND THEN v_chosen_rarity := 'common'; END IF;
  END IF;

  IF NOT FOUND THEN
    -- Theme has zero active creatures — degrade gracefully
    RETURN jsonb_build_object(
      'points_awarded',    v_points_to_award,
      'new_point_total',   v_new_point_total,
      'creature_awarded',  false,
      'creature',          NULL,
      'page_unlocked',     false,
      'page',              NULL,
      'streak_updated',    v_streak_updated,
      'new_streak',        v_new_streak,
      'streak_milestone',  NULL
    );
  END IF;

  -- Step 9: Write creature award + auto-place on active page
  v_position_x := random()::real * 0.85 + 0.05;  -- 0.05–0.90
  v_position_y := random()::real * 0.85 + 0.05;
  v_creature_awarded := true;

  INSERT INTO public.member_creature_collection (
    family_id, family_member_id, creature_id,
    sticker_page_id, position_x, position_y,
    awarded_source_type, awarded_source_id
  ) VALUES (
    v_member.family_id, v_member.id, v_creature.id,
    v_state.active_page_id, v_position_x, v_position_y,
    'task_completion', p_task_completion_id
  );

  UPDATE public.member_sticker_book_state
     SET creatures_earned_total = creatures_earned_total + 1
   WHERE id = v_state.id;

  -- Refresh the running total for the unlock check
  v_state.creatures_earned_total := v_state.creatures_earned_total + 1;

  -- Step 10: Check for page unlock
  IF v_state.page_unlock_mode = 'every_n_creatures'
     AND v_state.creatures_earned_total > 0
     AND v_state.creatures_earned_total % v_state.page_unlock_interval = 0 THEN

    -- Find the next locked page (next sort_order without an unlock row)
    SELECT sp.* INTO v_page
      FROM public.gamification_sticker_pages sp
      LEFT JOIN public.member_page_unlocks mpu
        ON mpu.sticker_page_id = sp.id
       AND mpu.family_member_id = v_member.id
     WHERE sp.theme_id = v_state.active_theme_id
       AND sp.is_active = true
       AND mpu.id IS NULL
     ORDER BY sp.sort_order
     LIMIT 1;

    IF FOUND THEN
      v_page_unlocked := true;
      v_next_page_id := v_page.id;

      INSERT INTO public.member_page_unlocks (
        family_id, family_member_id, sticker_page_id,
        unlocked_trigger_type, creatures_at_unlock
      ) VALUES (
        v_member.family_id, v_member.id, v_next_page_id,
        'creature_count', v_state.creatures_earned_total
      );

      UPDATE public.member_sticker_book_state
         SET pages_unlocked_total = pages_unlocked_total + 1,
             active_page_id = v_next_page_id
       WHERE id = v_state.id;
    END IF;
  END IF;

  -- Step 11: Return the full payload for client modal coordination
  RETURN jsonb_build_object(
    'points_awarded',    v_points_to_award,
    'new_point_total',   v_new_point_total,
    'creature_awarded',  v_creature_awarded,
    'creature', CASE WHEN v_creature_awarded THEN jsonb_build_object(
      'id',           v_creature.id,
      'slug',         v_creature.slug,
      'display_name', v_creature.display_name,
      'rarity',       v_chosen_rarity,
      'description',  v_creature.description,
      'image_url',    v_creature.image_url
    ) ELSE NULL END,
    'page_unlocked',     v_page_unlocked,
    'page', CASE WHEN v_page_unlocked THEN jsonb_build_object(
      'id',           v_page.id,
      'slug',         v_page.slug,
      'display_name', v_page.display_name,
      'scene',        v_page.scene,
      'season',       v_page.season,
      'image_url',    v_page.image_url
    ) ELSE NULL END,
    'streak_updated',    v_streak_updated,
    'new_streak',        v_new_streak,
    'streak_milestone',  v_streak_milestone
  );
END;
$$;

COMMENT ON FUNCTION public.roll_creature_for_completion(UUID) IS
  'Build M (Q6=B): Authoritative gamification pipeline. Called from useCompleteTask after task completion. Idempotency-safe via awarded_source_id check. Returns JSONB with points/streak/creature/page payload for client modal coordination.';

REVOKE ALL ON FUNCTION public.roll_creature_for_completion(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.roll_creature_for_completion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.roll_creature_for_completion(UUID) TO service_role;


-- ============================================================================
-- 6. TRIGGER FUNCTION REWRITE — auto_provision_member_resources
-- ============================================================================
-- ⚠️ COLLISION-CRITICAL SECTION ⚠️
--
-- The live function (captured 2026-04-07 via pg_get_functiondef before this
-- migration was written) has 4 distinct branches: play, guided, independent
-- (Build N teen Phase D), and adult. Build M's job is to PRESERVE all 4
-- branches verbatim and ADD gamification provisioning at the end.
--
-- Steps added by Build M (after the existing rhythm_configs branches):
--   5. INSERT gamification_configs (shell-appropriate defaults)
--   6. INSERT member_sticker_book_state (Woodland Felt default theme)
--   7. Bootstrap first sticker page unlock + set active_page_id
--
-- All idempotency uses ON CONFLICT DO NOTHING / IF NOT EXISTS so re-running
-- is safe.

CREATE OR REPLACE FUNCTION public.auto_provision_member_resources()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  dash_type        TEXT;
  v_woodland_id    UUID;
  v_first_page_id  UUID;
BEGIN
  -- ============================================================
  -- EXISTING BRANCHES (preserved verbatim from live production)
  -- ============================================================

  -- 1. Create personal archive folder
  INSERT INTO public.archive_folders (family_id, member_id, folder_name, folder_type)
  VALUES (NEW.family_id, NEW.id, NEW.display_name || '''s Archives', 'family_member')
  ON CONFLICT DO NOTHING;

  -- 2. Create dashboard_config if member has a dashboard
  IF NEW.dashboard_enabled IS NOT false THEN
    IF NEW.dashboard_mode = 'play' THEN
      dash_type := 'play';
    ELSIF NEW.dashboard_mode = 'guided' THEN
      dash_type := 'guided';
    ELSE
      dash_type := 'personal';
    END IF;

    INSERT INTO public.dashboard_configs (family_id, family_member_id, dashboard_type)
    VALUES (NEW.family_id, NEW.id, dash_type)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 3. Create Backburner & Ideas lists for non-Guided/Play members
  IF NEW.dashboard_mode IS NULL OR NEW.dashboard_mode NOT IN ('guided', 'play') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.lists
      WHERE family_id = NEW.family_id
        AND owner_id = NEW.id
        AND list_type = 'backburner'
        AND archived_at IS NULL
    ) THEN
      INSERT INTO public.lists (family_id, owner_id, title, list_type)
      VALUES (NEW.family_id, NEW.id, 'Backburner', 'backburner');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.lists
      WHERE family_id = NEW.family_id
        AND owner_id = NEW.id
        AND list_type = 'ideas'
        AND archived_at IS NULL
    ) THEN
      INSERT INTO public.lists (family_id, owner_id, title, list_type)
      VALUES (NEW.family_id, NEW.id, 'Ideas', 'ideas');
    END IF;
  END IF;

  -- 4. Seed default rhythm_configs based on role / dashboard_mode
  IF NEW.dashboard_mode = 'play' THEN
    -- Play: morning only (simplified sections) — unchanged from 100112
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning', 'default', true,
      '[
        {"section_type":"encouraging_message","enabled":true,"order":1,"config":{}},
        {"section_type":"routine_checklist","enabled":true,"order":2,"config":{}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  ELSIF NEW.dashboard_mode = 'guided' THEN
    -- Guided: morning rhythm — 3 sections (unchanged from 100112)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning', 'default', true,
      '[
        {"section_type":"encouraging_message","enabled":true,"order":1,"config":{}},
        {"section_type":"best_intentions_focus","enabled":true,"order":2,"config":{}},
        {"section_type":"calendar_preview","enabled":true,"order":3,"config":{"scope":"member"}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Guided: mini evening rhythm — 5 sections (unchanged from 100112)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       section_order_locked, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'evening', 'Evening', 'default', true, true,
      '[
        {"section_type":"guided_day_highlights","enabled":true,"order":1,"config":{}},
        {"section_type":"guided_pride_reflection","enabled":true,"order":2,"config":{}},
        {"section_type":"guided_reflections","enabled":true,"order":3,"config":{}},
        {"section_type":"guided_tomorrow_lookahead","enabled":true,"order":4,"config":{}},
        {"section_type":"close_my_day","enabled":true,"order":5,"config":{}}
      ]'::jsonb,
      '{"start_hour":18,"end_hour":24,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  ELSIF NEW.dashboard_mode = 'independent' THEN
    -- Phase D (Build N): Independent Teen tailored rhythms (Enhancement 7)
    -- Morning (enabled) — 7 sections, reflection_guideline_count=2,
    -- display_name='Morning Check-in'. No task_preview (front-door rule),
    -- no brain_dump (teens dump in evening MindSweep-Lite, not morning).
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       reflection_guideline_count, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning Check-in', 'default', true, 2,
      '[
        {"section_type":"guiding_star_rotation","enabled":true,"order":1,"config":{"framingText":"You said this matters to you:"}},
        {"section_type":"morning_priorities_recall","enabled":true,"order":2,"config":{}},
        {"section_type":"calendar_preview","enabled":true,"order":3,"config":{"scope":"member"}},
        {"section_type":"on_the_horizon","enabled":true,"order":4,"config":{"lookahead_days":7,"max_items":5}},
        {"section_type":"morning_insight","enabled":true,"order":5,"config":{"audience":"teen"}},
        {"section_type":"feature_discovery","enabled":true,"order":6,"config":{"audience":"teen"}},
        {"section_type":"rhythm_tracker_prompts","enabled":true,"order":7,"config":{}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Evening (enabled, section_order_locked=true) — 8 sections
    -- Teen framing via config: greeting variant, victories title, closing
    -- framing, MindSweep-Lite audience flag. Each section component reads
    -- its config at render time; all adult code paths stay unchanged.
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       reflection_guideline_count, section_order_locked, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'evening', 'Evening Check-in', 'default', true, 2, true,
      '[
        {"section_type":"evening_greeting","enabled":true,"order":1,"config":{"variant":"teen"}},
        {"section_type":"accomplishments_victories","enabled":true,"order":2,"config":{"title":"What went right today"}},
        {"section_type":"evening_tomorrow_capture","enabled":true,"order":3,"config":{}},
        {"section_type":"mindsweep_lite","enabled":true,"order":4,"config":{"collapsed_by_default":true,"audience":"teen"}},
        {"section_type":"reflections","enabled":true,"order":5,"config":{}},
        {"section_type":"closing_thought","enabled":true,"order":6,"config":{"framingText":"Something you believe:"}},
        {"section_type":"rhythm_tracker_prompts","enabled":true,"order":7,"config":{}},
        {"section_type":"close_my_day","enabled":true,"order":8,"config":{}}
      ]'::jsonb,
      '{"start_hour":18,"end_hour":24,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Weekly / Monthly / Quarterly — teens get identical content to adults
    -- (Phase D scope: only morning + evening are teen-differentiated)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'weekly_review', 'Weekly Review', 'default', true,
      '[
        {"section_type":"weekly_stats","enabled":true,"order":1,"config":{}},
        {"section_type":"top_victories","enabled":true,"order":2,"config":{}},
        {"section_type":"next_week_preview","enabled":true,"order":3,"config":{}},
        {"section_type":"weekly_reflection_prompt","enabled":true,"order":4,"config":{}},
        {"section_type":"weekly_review_deep_dive","enabled":true,"order":5,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"weekly","day_of_week":5}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'monthly_review', 'Monthly Review', 'default', false,
      '[
        {"section_type":"month_at_a_glance","enabled":true,"order":1,"config":{}},
        {"section_type":"highlight_reel","enabled":true,"order":2,"config":{}},
        {"section_type":"reports_link","enabled":true,"order":3,"config":{}},
        {"section_type":"monthly_review_deep_dive","enabled":true,"order":4,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"monthly","day_of_month":1}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'quarterly_inventory', 'Quarterly Inventory', 'default', false,
      '[
        {"section_type":"stale_areas","enabled":true,"order":1,"config":{}},
        {"section_type":"quick_win_suggestion","enabled":true,"order":2,"config":{}},
        {"section_type":"lifelantern_launch_link","enabled":true,"order":3,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"lifelantern_staleness","interval_days":90}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  ELSE
    -- Adult (dashboard_mode IS NULL or 'personal') — unchanged from 100112
    -- Morning (enabled) — 9 sections
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning Rhythm', 'default', true,
      '[
        {"section_type":"guiding_star_rotation","enabled":true,"order":1,"config":{}},
        {"section_type":"morning_priorities_recall","enabled":true,"order":2,"config":{}},
        {"section_type":"best_intentions_focus","enabled":true,"order":3,"config":{}},
        {"section_type":"calendar_preview","enabled":true,"order":4,"config":{}},
        {"section_type":"on_the_horizon","enabled":true,"order":5,"config":{"lookahead_days":7,"max_items":5}},
        {"section_type":"morning_insight","enabled":true,"order":6,"config":{}},
        {"section_type":"brain_dump","enabled":true,"order":7,"config":{}},
        {"section_type":"feature_discovery","enabled":true,"order":8,"config":{}},
        {"section_type":"periodic_cards_slot","enabled":true,"order":9,"config":{}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Evening (enabled, section_order_locked=true) — 13 sections
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       section_order_locked, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'evening', 'Evening Rhythm', 'default', true, true,
      '[
        {"section_type":"evening_greeting","enabled":true,"order":1,"config":{}},
        {"section_type":"accomplishments_victories","enabled":true,"order":2,"config":{}},
        {"section_type":"completed_meetings","enabled":true,"order":3,"config":{}},
        {"section_type":"milestone_celebrations","enabled":true,"order":4,"config":{}},
        {"section_type":"carry_forward","enabled":false,"order":5,"config":{}},
        {"section_type":"evening_tomorrow_capture","enabled":true,"order":6,"config":{}},
        {"section_type":"mindsweep_lite","enabled":true,"order":7,"config":{"collapsed_by_default":true}},
        {"section_type":"closing_thought","enabled":true,"order":8,"config":{}},
        {"section_type":"from_your_library","enabled":true,"order":9,"config":{}},
        {"section_type":"before_close_the_day","enabled":true,"order":10,"config":{}},
        {"section_type":"reflections","enabled":true,"order":11,"config":{}},
        {"section_type":"rhythm_tracker_prompts","enabled":true,"order":12,"config":{}},
        {"section_type":"close_my_day","enabled":true,"order":13,"config":{}}
      ]'::jsonb,
      '{"start_hour":18,"end_hour":24,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Weekly / Monthly / Quarterly — unchanged from 100112
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'weekly_review', 'Weekly Review', 'default', true,
      '[
        {"section_type":"weekly_stats","enabled":true,"order":1,"config":{}},
        {"section_type":"top_victories","enabled":true,"order":2,"config":{}},
        {"section_type":"next_week_preview","enabled":true,"order":3,"config":{}},
        {"section_type":"weekly_reflection_prompt","enabled":true,"order":4,"config":{}},
        {"section_type":"weekly_review_deep_dive","enabled":true,"order":5,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"weekly","day_of_week":5}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'monthly_review', 'Monthly Review', 'default', false,
      '[
        {"section_type":"month_at_a_glance","enabled":true,"order":1,"config":{}},
        {"section_type":"highlight_reel","enabled":true,"order":2,"config":{}},
        {"section_type":"reports_link","enabled":true,"order":3,"config":{}},
        {"section_type":"monthly_review_deep_dive","enabled":true,"order":4,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"monthly","day_of_month":1}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'quarterly_inventory', 'Quarterly Inventory', 'default', false,
      '[
        {"section_type":"stale_areas","enabled":true,"order":1,"config":{}},
        {"section_type":"quick_win_suggestion","enabled":true,"order":2,"config":{}},
        {"section_type":"lifelantern_launch_link","enabled":true,"order":3,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"lifelantern_staleness","interval_days":90}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  END IF;

  -- ============================================================
  -- BUILD M ADDITIONS — gamification + sticker book provisioning
  -- ============================================================

  -- 5. Insert gamification_configs with shell-appropriate defaults
  INSERT INTO public.gamification_configs (
    family_id, family_member_id,
    enabled, base_points_per_task, currency_name, currency_icon
  ) VALUES (
    NEW.family_id, NEW.id,
    -- enabled: ON for play/guided, OFF for adult/independent (mom can flip later)
    CASE WHEN NEW.dashboard_mode IN ('play', 'guided') THEN true ELSE false END,
    -- base_points_per_task: 1 for play (small numbers feel big), 10 for everyone else
    CASE WHEN NEW.dashboard_mode = 'play' THEN 1 ELSE 10 END,
    -- currency_name: 'stars' for play, 'points' otherwise
    CASE WHEN NEW.dashboard_mode = 'play' THEN 'stars' ELSE 'points' END,
    '⭐'
  )
  ON CONFLICT (family_member_id) DO NOTHING;

  -- 6. Insert member_sticker_book_state with Woodland Felt as default theme
  SELECT id INTO v_woodland_id
    FROM public.gamification_themes
   WHERE theme_slug = 'woodland_felt'
   LIMIT 1;

  IF v_woodland_id IS NOT NULL THEN
    INSERT INTO public.member_sticker_book_state (
      family_id, family_member_id, active_theme_id
    ) VALUES (
      NEW.family_id, NEW.id, v_woodland_id
    )
    ON CONFLICT (family_member_id) DO NOTHING;

    -- 7. Bootstrap first sticker page unlock (sort_order=1 for Woodland Felt)
    SELECT id INTO v_first_page_id
      FROM public.gamification_sticker_pages
     WHERE theme_id = v_woodland_id
       AND is_active = true
     ORDER BY sort_order
     LIMIT 1;

    IF v_first_page_id IS NOT NULL THEN
      INSERT INTO public.member_page_unlocks (
        family_id, family_member_id, sticker_page_id, unlocked_trigger_type
      ) VALUES (
        NEW.family_id, NEW.id, v_first_page_id, 'bootstrap'
      )
      ON CONFLICT (family_member_id, sticker_page_id) DO NOTHING;

      -- Set active_page_id on the state row to the bootstrapped page
      UPDATE public.member_sticker_book_state
         SET active_page_id = v_first_page_id
       WHERE family_member_id = NEW.id
         AND active_page_id IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.auto_provision_member_resources() IS
  'Build M (collision-resolved): Provisions all per-member resources on family_members INSERT. Preserves Build N teen branch verbatim and adds gamification_configs + member_sticker_book_state + bootstrap page unlock.';


-- ============================================================================
-- 7. BACKFILL — gamification rows for existing 26 family_members
-- ============================================================================
-- Idempotent: every INSERT uses NOT EXISTS guards.

DO $$
DECLARE
  v_woodland_id    UUID;
  v_first_page_id  UUID;
  v_member         RECORD;
BEGIN
  SELECT id INTO v_woodland_id
    FROM public.gamification_themes
   WHERE theme_slug = 'woodland_felt'
   LIMIT 1;

  SELECT id INTO v_first_page_id
    FROM public.gamification_sticker_pages
   WHERE theme_id = v_woodland_id AND is_active = true
   ORDER BY sort_order
   LIMIT 1;

  IF v_woodland_id IS NULL OR v_first_page_id IS NULL THEN
    RAISE EXCEPTION 'Woodland Felt theme or first page missing — seeds did not run before backfill';
  END IF;

  FOR v_member IN
    SELECT id, family_id, dashboard_mode FROM public.family_members WHERE is_active = true
  LOOP
    -- gamification_configs
    INSERT INTO public.gamification_configs (
      family_id, family_member_id,
      enabled, base_points_per_task, currency_name, currency_icon
    )
    SELECT
      v_member.family_id, v_member.id,
      CASE WHEN v_member.dashboard_mode IN ('play','guided') THEN true ELSE false END,
      CASE WHEN v_member.dashboard_mode = 'play' THEN 1 ELSE 10 END,
      CASE WHEN v_member.dashboard_mode = 'play' THEN 'stars' ELSE 'points' END,
      '⭐'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.gamification_configs WHERE family_member_id = v_member.id
    );

    -- member_sticker_book_state
    INSERT INTO public.member_sticker_book_state (
      family_id, family_member_id, active_theme_id, active_page_id
    )
    SELECT
      v_member.family_id, v_member.id, v_woodland_id, v_first_page_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.member_sticker_book_state WHERE family_member_id = v_member.id
    );

    -- Bootstrap page unlock
    INSERT INTO public.member_page_unlocks (
      family_id, family_member_id, sticker_page_id, unlocked_trigger_type
    )
    SELECT
      v_member.family_id, v_member.id, v_first_page_id, 'bootstrap'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.member_page_unlocks
       WHERE family_member_id = v_member.id
         AND sticker_page_id = v_first_page_id
    );
  END LOOP;
END $$;


-- ============================================================================
-- 8. FEATURE KEYS — registry + tier grants
-- ============================================================================

-- Register 7 new feature keys (skipping any that may already exist)
INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('gamification_basic',          'Gamification (Basic)',          'Points earning + naive consecutive-day streak tracking',                'PRD-24'),
  ('gamification_sticker_book',   'Sticker Book',                  'Creature collection + sticker book page unlocks (Woodland Felt theme)', 'PRD-24+PRD-26 Build M'),
  ('play_dashboard',              'Play Dashboard',                'Age-appropriate Play shell dashboard layout',                           'PRD-26'),
  ('play_reveal_tiles',           'Play Reveal Tiles',             'Surprise reveal task tiles on Play Dashboard (STUBBED in Build M)',     'PRD-26'),
  ('play_reading_support',        'Play Reading Support',          'Larger font + TTS icon visibility for early readers',                   'PRD-26'),
  ('play_message_receive',        'Play Message Receive',          'Receive mom messages on the Play Dashboard',                            'PRD-26'),
  ('gamification_streak_milestones','Streak Milestone Bonuses',    'Bonus points at streak milestones (STUBBED in Build M)',                'PRD-24')
ON CONFLICT (feature_key) DO NOTHING;

-- Grant tier access (5 role groups × 7 keys = 35 rows)
-- During beta useCanAccess() returns true for all; this is post-beta infrastructure.
DO $$
DECLARE
  v_essential_id UUID;
  v_enhanced_id  UUID;
  v_full_id      UUID;
BEGIN
  SELECT id INTO v_essential_id FROM public.subscription_tiers WHERE slug = 'essential' LIMIT 1;
  SELECT id INTO v_enhanced_id  FROM public.subscription_tiers WHERE slug = 'enhanced'  LIMIT 1;
  SELECT id INTO v_full_id      FROM public.subscription_tiers WHERE slug = 'full_magic' LIMIT 1;

  -- gamification_basic, gamification_sticker_book, play_dashboard, play_reading_support,
  -- play_message_receive — Essential tier and up for all 5 role groups
  INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
  SELECT fk, rg, v_essential_id, true
  FROM (VALUES
    ('gamification_basic'),
    ('gamification_sticker_book'),
    ('play_dashboard'),
    ('play_reading_support'),
    ('play_message_receive')
  ) AS fks(fk),
  (VALUES
    ('mom'),
    ('dad_adults'),
    ('special_adults'),
    ('independent_teens'),
    ('guided_kids'),
    ('play_kids')
  ) AS rgs(rg)
  ON CONFLICT DO NOTHING;

  -- play_reveal_tiles + gamification_streak_milestones — Enhanced tier and up
  INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
  SELECT fk, rg, v_enhanced_id, true
  FROM (VALUES
    ('play_reveal_tiles'),
    ('gamification_streak_milestones')
  ) AS fks(fk),
  (VALUES
    ('mom'),
    ('dad_adults'),
    ('special_adults'),
    ('independent_teens'),
    ('guided_kids'),
    ('play_kids')
  ) AS rgs(rg)
  ON CONFLICT DO NOTHING;
END $$;


-- ============================================================================
-- 9. VERIFICATION — RAISE NOTICE row counts
-- ============================================================================

DO $$
DECLARE
  v_themes        INTEGER;
  v_creatures     INTEGER;
  v_pages         INTEGER;
  v_configs       INTEGER;
  v_states        INTEGER;
  v_unlocks       INTEGER;
  v_members       INTEGER;
  v_visual_sched  INTEGER;
  v_feature_keys  INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_themes      FROM public.gamification_themes;
  SELECT COUNT(*) INTO v_creatures   FROM public.gamification_creatures;
  SELECT COUNT(*) INTO v_pages       FROM public.gamification_sticker_pages;
  SELECT COUNT(*) INTO v_configs     FROM public.gamification_configs;
  SELECT COUNT(*) INTO v_states      FROM public.member_sticker_book_state;
  SELECT COUNT(*) INTO v_unlocks     FROM public.member_page_unlocks WHERE unlocked_trigger_type = 'bootstrap';
  SELECT COUNT(*) INTO v_members     FROM public.family_members WHERE is_active = true;
  SELECT COUNT(*) INTO v_visual_sched FROM public.platform_assets WHERE category = 'visual_schedule';
  SELECT COUNT(*) INTO v_feature_keys FROM public.feature_key_registry
    WHERE feature_key IN (
      'gamification_basic', 'gamification_sticker_book', 'play_dashboard',
      'play_reveal_tiles', 'play_reading_support', 'play_message_receive',
      'gamification_streak_milestones'
    );

  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Build M Sub-phase A — Migration Verification';
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Themes seeded:                  %  (expected: 1)',   v_themes;
  RAISE NOTICE 'Creatures seeded:               %  (expected: 161)', v_creatures;
  RAISE NOTICE 'Sticker pages seeded:           %  (expected: 26)',  v_pages;
  RAISE NOTICE 'Active family members:          %',                  v_members;
  RAISE NOTICE 'gamification_configs rows:      %  (expected = members)', v_configs;
  RAISE NOTICE 'member_sticker_book_state rows: %  (expected = members)', v_states;
  RAISE NOTICE 'Bootstrap page unlocks:         %  (expected = members)', v_unlocks;
  RAISE NOTICE 'visual_schedule platform_assets: %  (expected: 328)',  v_visual_sched;
  RAISE NOTICE 'New feature keys registered:    %  (expected: 7)',   v_feature_keys;
  RAISE NOTICE '====================================================';

  IF v_themes <> 1 THEN
    RAISE EXCEPTION 'Theme seed failed: got %, expected 1', v_themes;
  END IF;
  IF v_creatures <> 161 THEN
    RAISE EXCEPTION 'Creature seed failed: got %, expected 161', v_creatures;
  END IF;
  IF v_pages <> 26 THEN
    RAISE EXCEPTION 'Sticker page seed failed: got %, expected 26', v_pages;
  END IF;
  IF v_configs < v_members THEN
    RAISE EXCEPTION 'gamification_configs backfill incomplete: got %, expected %', v_configs, v_members;
  END IF;
  IF v_states < v_members THEN
    RAISE EXCEPTION 'member_sticker_book_state backfill incomplete: got %, expected %', v_states, v_members;
  END IF;
  IF v_unlocks < v_members THEN
    RAISE EXCEPTION 'bootstrap page unlocks incomplete: got %, expected %', v_unlocks, v_members;
  END IF;
  IF v_feature_keys <> 7 THEN
    RAISE EXCEPTION 'Feature key registration incomplete: got %, expected 7', v_feature_keys;
  END IF;
END $$;

COMMIT;
