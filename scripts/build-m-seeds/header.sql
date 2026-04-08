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

