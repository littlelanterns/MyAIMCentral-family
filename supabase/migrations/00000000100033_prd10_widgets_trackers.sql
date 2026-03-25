-- ============================================================
-- Migration 100033: PRD-10 Widgets, Trackers & Dashboard Layout
-- Creates all 7 widget-related tables + dashboard_configs updates
-- Authoritative source: prds/personal-growth/PRD-10-Widgets-Trackers-Dashboard-Layout.md
-- ============================================================
-- Idempotent: safe to re-run.
-- ============================================================

-- ============================================================
-- SECTION 1: Update dashboard_configs with new columns
-- ============================================================

ALTER TABLE public.dashboard_configs
  ADD COLUMN IF NOT EXISTS layout_mode TEXT NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS grid_columns INTEGER;

-- decorations may already exist as JSONB
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dashboard_configs'
      AND column_name = 'decorations'
  ) THEN
    ALTER TABLE public.dashboard_configs ADD COLUMN decorations JSONB NOT NULL DEFAULT '[]';
  END IF;
END $$;

-- ============================================================
-- SECTION 2: dashboard_widget_folders
-- ============================================================

CREATE TABLE IF NOT EXISTS public.dashboard_widget_folders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.families(id),
  family_member_id UUID NOT NULL REFERENCES public.family_members(id),
  name            TEXT NOT NULL DEFAULT 'Folder',
  position_x      INTEGER NOT NULL DEFAULT 0,
  position_y      INTEGER NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_widget_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dwf_select" ON public.dashboard_widget_folders;
CREATE POLICY "dwf_select" ON public.dashboard_widget_folders
  FOR SELECT USING (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dwf_insert" ON public.dashboard_widget_folders;
CREATE POLICY "dwf_insert" ON public.dashboard_widget_folders
  FOR INSERT WITH CHECK (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dwf_update" ON public.dashboard_widget_folders;
CREATE POLICY "dwf_update" ON public.dashboard_widget_folders
  FOR UPDATE USING (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dwf_delete" ON public.dashboard_widget_folders;
CREATE POLICY "dwf_delete" ON public.dashboard_widget_folders
  FOR DELETE USING (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_dwf_family_member ON public.dashboard_widget_folders(family_id, family_member_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.trg_dwf_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_dwf_updated_at ON public.dashboard_widget_folders;
CREATE TRIGGER trg_dwf_updated_at BEFORE UPDATE ON public.dashboard_widget_folders
  FOR EACH ROW EXECUTE FUNCTION public.trg_dwf_updated_at();

-- ============================================================
-- SECTION 3: dashboard_widgets
-- ============================================================

CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id               UUID NOT NULL REFERENCES public.families(id),
  family_member_id        UUID NOT NULL REFERENCES public.family_members(id),
  template_type           TEXT NOT NULL,
  visual_variant          TEXT,
  title                   TEXT NOT NULL,
  size                    TEXT NOT NULL DEFAULT 'medium',
  position_x              INTEGER NOT NULL DEFAULT 0,
  position_y              INTEGER NOT NULL DEFAULT 0,
  folder_id               UUID REFERENCES public.dashboard_widget_folders(id) ON DELETE SET NULL,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  widget_config           JSONB NOT NULL DEFAULT '{}',
  data_source_type        TEXT,
  data_source_ids         UUID[] NOT NULL DEFAULT '{}',
  assigned_member_id      UUID REFERENCES public.family_members(id),
  is_active               BOOLEAN NOT NULL DEFAULT true,
  is_on_dashboard         BOOLEAN NOT NULL DEFAULT true,
  is_included_in_ai       BOOLEAN NOT NULL DEFAULT true,
  -- Multiplayer fields
  multiplayer_enabled     BOOLEAN NOT NULL DEFAULT false,
  multiplayer_participants UUID[] NOT NULL DEFAULT '{}',
  multiplayer_config      JSONB NOT NULL DEFAULT '{}',
  linked_widget_id        UUID REFERENCES public.dashboard_widgets(id) ON DELETE SET NULL,
  view_mode               TEXT NOT NULL DEFAULT 'default',
  -- Timestamps
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at             TIMESTAMPTZ,

  CONSTRAINT dw_size_check CHECK (size IN ('small', 'medium', 'large')),
  CONSTRAINT dw_view_mode_check CHECK (view_mode IN ('default', 'family', 'personal'))
);

ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- Owner + primary parent full access
DROP POLICY IF EXISTS "dw_select" ON public.dashboard_widgets;
CREATE POLICY "dw_select" ON public.dashboard_widgets
  FOR SELECT USING (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dw_insert" ON public.dashboard_widgets;
CREATE POLICY "dw_insert" ON public.dashboard_widgets
  FOR INSERT WITH CHECK (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dw_update" ON public.dashboard_widgets;
CREATE POLICY "dw_update" ON public.dashboard_widgets
  FOR UPDATE USING (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dw_delete" ON public.dashboard_widgets;
CREATE POLICY "dw_delete" ON public.dashboard_widgets
  FOR DELETE USING (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_dw_family_member_dashboard ON public.dashboard_widgets(family_id, family_member_id, is_on_dashboard);
CREATE INDEX IF NOT EXISTS idx_dw_assigned_member ON public.dashboard_widgets(family_id, assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_dw_folder ON public.dashboard_widgets(folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dw_archived ON public.dashboard_widgets(family_id, archived_at) WHERE archived_at IS NULL;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.trg_dw_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_dw_updated_at ON public.dashboard_widgets;
CREATE TRIGGER trg_dw_updated_at BEFORE UPDATE ON public.dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION public.trg_dw_updated_at();

-- ============================================================
-- SECTION 4: widget_data_points (append-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.widget_data_points (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id               UUID NOT NULL REFERENCES public.families(id),
  widget_id               UUID NOT NULL REFERENCES public.dashboard_widgets(id) ON DELETE CASCADE,
  family_member_id        UUID NOT NULL REFERENCES public.family_members(id),
  recorded_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  value                   NUMERIC NOT NULL,
  value_type              TEXT NOT NULL DEFAULT 'increment',
  metadata                JSONB NOT NULL DEFAULT '{}',
  recorded_by_member_id   UUID REFERENCES public.family_members(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT wdp_value_type_check CHECK (value_type IN ('increment', 'set', 'boolean', 'mood', 'percentage'))
);

ALTER TABLE public.widget_data_points ENABLE ROW LEVEL SECURITY;

-- Owner + primary parent can read
DROP POLICY IF EXISTS "wdp_select" ON public.widget_data_points;
CREATE POLICY "wdp_select" ON public.widget_data_points
  FOR SELECT USING (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

-- Members can insert own data, primary parent can insert for anyone
DROP POLICY IF EXISTS "wdp_insert" ON public.widget_data_points;
CREATE POLICY "wdp_insert" ON public.widget_data_points
  FOR INSERT WITH CHECK (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

-- No UPDATE or DELETE policies — append-only per PRD-10

CREATE INDEX IF NOT EXISTS idx_wdp_widget_date ON public.widget_data_points(widget_id, recorded_date);
CREATE INDEX IF NOT EXISTS idx_wdp_widget_recorded ON public.widget_data_points(widget_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_wdp_family_member_date ON public.widget_data_points(family_id, family_member_id, recorded_date);

-- ============================================================
-- SECTION 5: widget_templates
-- ============================================================

CREATE TABLE IF NOT EXISTS public.widget_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id         UUID REFERENCES public.families(id),
  family_member_id  UUID REFERENCES public.family_members(id),
  template_type     TEXT NOT NULL,
  category          TEXT NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  default_config    JSONB NOT NULL DEFAULT '{}',
  thumbnail_config  JSONB NOT NULL DEFAULT '{}',
  is_system         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.widget_templates ENABLE ROW LEVEL SECURITY;

-- System templates readable by all authenticated, user templates scoped to family
DROP POLICY IF EXISTS "wt_select" ON public.widget_templates;
CREATE POLICY "wt_select" ON public.widget_templates
  FOR SELECT USING (
    is_system = true
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "wt_insert" ON public.widget_templates;
CREATE POLICY "wt_insert" ON public.widget_templates
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "wt_update" ON public.widget_templates;
CREATE POLICY "wt_update" ON public.widget_templates
  FOR UPDATE USING (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_wt_category_system ON public.widget_templates(category, is_system);
CREATE INDEX IF NOT EXISTS idx_wt_family_member ON public.widget_templates(family_id, family_member_id, is_system);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.trg_wt_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_wt_updated_at ON public.widget_templates;
CREATE TRIGGER trg_wt_updated_at BEFORE UPDATE ON public.widget_templates
  FOR EACH ROW EXECUTE FUNCTION public.trg_wt_updated_at();

-- ============================================================
-- SECTION 6: coloring_image_library (Color-Reveal tracker)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.coloring_image_library (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  color_image_url               TEXT NOT NULL,
  grayscale_image_url           TEXT,
  line_art_url                  TEXT,
  thumbnail_url                 TEXT,
  image_name                    TEXT NOT NULL,
  theme_category                TEXT,
  gamification_theme            TEXT,
  color_zones                   JSONB NOT NULL,
  total_color_zones             INTEGER NOT NULL,
  recommended_min_achievements  INTEGER NOT NULL DEFAULT 5,
  recommended_max_achievements  INTEGER NOT NULL DEFAULT 30,
  supports_gradient_reveals     BOOLEAN NOT NULL DEFAULT true,
  complexity_level              INTEGER NOT NULL DEFAULT 3,
  age_group                     TEXT NOT NULL DEFAULT 'all_ages',
  keywords                      TEXT[] NOT NULL DEFAULT '{}',
  is_available_for_print        BOOLEAN NOT NULL DEFAULT true,
  is_active                     BOOLEAN NOT NULL DEFAULT true,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT cil_age_group_check CHECK (age_group IN ('preschool', 'elementary', 'all_ages')),
  CONSTRAINT cil_complexity_check CHECK (complexity_level BETWEEN 1 AND 5)
);

ALTER TABLE public.coloring_image_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cil_select" ON public.coloring_image_library;
CREATE POLICY "cil_select" ON public.coloring_image_library
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_cil_theme_active ON public.coloring_image_library(theme_category, is_active);
CREATE INDEX IF NOT EXISTS idx_cil_age_active ON public.coloring_image_library(age_group, is_active);

-- ============================================================
-- SECTION 7: color_reveal_progress
-- ============================================================

CREATE TABLE IF NOT EXISTS public.color_reveal_progress (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id               UUID NOT NULL REFERENCES public.dashboard_widgets(id) ON DELETE CASCADE,
  color_zone_index        INTEGER NOT NULL,
  color_hex               TEXT NOT NULL,
  color_name              TEXT,
  revealed_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  revealed_by_member_id   UUID REFERENCES public.family_members(id),
  achievement_count       INTEGER,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT crp_unique_zone UNIQUE (widget_id, color_zone_index)
);

ALTER TABLE public.color_reveal_progress ENABLE ROW LEVEL SECURITY;

-- Inherits access from parent widget
DROP POLICY IF EXISTS "crp_select" ON public.color_reveal_progress;
CREATE POLICY "crp_select" ON public.color_reveal_progress
  FOR SELECT USING (
    widget_id IN (
      SELECT id FROM public.dashboard_widgets
      WHERE family_member_id IN (
        SELECT id FROM public.family_members WHERE user_id = auth.uid()
      )
      OR family_id IN (
        SELECT fm.family_id FROM public.family_members fm
        JOIN public.families f ON f.id = fm.family_id
        WHERE f.primary_parent_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "crp_insert" ON public.color_reveal_progress;
CREATE POLICY "crp_insert" ON public.color_reveal_progress
  FOR INSERT WITH CHECK (
    widget_id IN (
      SELECT id FROM public.dashboard_widgets
      WHERE family_member_id IN (
        SELECT id FROM public.family_members WHERE user_id = auth.uid()
      )
      OR family_id IN (
        SELECT fm.family_id FROM public.family_members fm
        JOIN public.families f ON f.id = fm.family_id
        WHERE f.primary_parent_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_crp_widget ON public.color_reveal_progress(widget_id, color_zone_index);

-- ============================================================
-- SECTION 8: coloring_gallery
-- ============================================================

CREATE TABLE IF NOT EXISTS public.coloring_gallery (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id               UUID NOT NULL REFERENCES public.families(id),
  family_member_id        UUID NOT NULL REFERENCES public.family_members(id),
  widget_id               UUID NOT NULL REFERENCES public.dashboard_widgets(id),
  coloring_image_id       UUID NOT NULL REFERENCES public.coloring_image_library(id),
  image_name              TEXT NOT NULL,
  completed_image_url     TEXT,
  completed_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_achievements      INTEGER NOT NULL,
  achievement_description TEXT,
  is_favorite             BOOLEAN NOT NULL DEFAULT false,
  display_order           INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coloring_gallery ENABLE ROW LEVEL SECURITY;

-- Owner + primary parent can read
DROP POLICY IF EXISTS "cg_select" ON public.coloring_gallery;
CREATE POLICY "cg_select" ON public.coloring_gallery
  FOR SELECT USING (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cg_insert" ON public.coloring_gallery;
CREATE POLICY "cg_insert" ON public.coloring_gallery
  FOR INSERT WITH CHECK (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE f.primary_parent_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_cg_family_member ON public.coloring_gallery(family_id, family_member_id, completed_at DESC);
