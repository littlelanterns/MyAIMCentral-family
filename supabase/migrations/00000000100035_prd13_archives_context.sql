-- ============================================================================
-- PRD-13: Archives & Context
-- - ALTER archive_folders (add columns, CHECK constraint)
-- - CREATE archive_context_items
-- - CREATE archive_member_settings
-- - CREATE faith_preferences
-- - CREATE context_learning_dismissals
-- - ALTER lists (archive sharing columns)
-- - UPDATE auto_provision_member_resources (full folder tree)
-- - CREATE auto_provision_family_overview (trigger on families)
-- - Backfill existing data
-- ============================================================================

-- ============================================================
-- 1. ALTER archive_folders — add new columns
-- ============================================================
ALTER TABLE public.archive_folders
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS color_hex TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_included_in_ai BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Add CHECK constraint on folder_type.
-- Existing rows use 'family_member' from the original auto-provision trigger.
-- We migrate those to 'member_root' first, then add the constraint.
UPDATE public.archive_folders
  SET folder_type = 'member_root'
  WHERE folder_type = 'family_member';

-- Drop any existing constraint (idempotent)
DO $$ BEGIN
  ALTER TABLE public.archive_folders DROP CONSTRAINT IF EXISTS archive_folders_folder_type_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.archive_folders
  ADD CONSTRAINT archive_folders_folder_type_check
  CHECK (folder_type IN ('member_root','family_overview','system_category','wishlist','custom'));

-- ============================================================
-- 2. CREATE archive_context_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.archive_context_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES public.archive_folders(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  context_field TEXT,
  context_value TEXT NOT NULL,
  context_type TEXT NOT NULL CHECK (context_type IN (
    'preference','schedule','personality','interest','academic','medical',
    'wishlist_item','family_personality','family_rhythm','family_focus',
    'faith_context','meeting_note','general'
  )),
  is_included_in_ai BOOLEAN NOT NULL DEFAULT true,
  is_privacy_filtered BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','lila_detected','review_route','list_shared')),
  source_conversation_id UUID,
  source_reference_id UUID,
  added_by UUID REFERENCES public.family_members(id),
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  link_url TEXT,
  price_range TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aci_folder ON public.archive_context_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_aci_member ON public.archive_context_items(member_id);
CREATE INDEX IF NOT EXISTS idx_aci_family ON public.archive_context_items(family_id);
CREATE INDEX IF NOT EXISTS idx_aci_source ON public.archive_context_items(source);
CREATE INDEX IF NOT EXISTS idx_aci_privacy ON public.archive_context_items(family_id) WHERE is_privacy_filtered = true;
CREATE INDEX IF NOT EXISTS idx_aci_included ON public.archive_context_items(family_id, is_included_in_ai) WHERE is_included_in_ai = true AND archived_at IS NULL;

-- Trigger: updated_at
DO $$ BEGIN
  CREATE TRIGGER trg_aci_updated_at
    BEFORE UPDATE ON public.archive_context_items
    FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS
ALTER TABLE public.archive_context_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "aci_select_own_family" ON public.archive_context_items
    FOR SELECT USING (
      family_id = public.get_my_family_id()
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "aci_manage_primary_parent" ON public.archive_context_items
    FOR ALL USING (
      family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. CREATE archive_member_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.archive_member_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  is_included_in_ai BOOLEAN NOT NULL DEFAULT true,
  overview_card_content TEXT,
  overview_card_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(family_id, member_id)
);

-- Trigger: updated_at
DO $$ BEGIN
  CREATE TRIGGER trg_ams_updated_at
    BEFORE UPDATE ON public.archive_member_settings
    FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS
ALTER TABLE public.archive_member_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "ams_select_own_family" ON public.archive_member_settings
    FOR SELECT USING (
      family_id = public.get_my_family_id()
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ams_manage_primary_parent" ON public.archive_member_settings
    FOR ALL USING (
      family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ams_member_read_own" ON public.archive_member_settings
    FOR SELECT USING (
      member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 4. CREATE faith_preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS public.faith_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE UNIQUE,
  faith_tradition TEXT,
  denomination TEXT,
  observances TEXT[] DEFAULT '{}',
  sacred_texts TEXT[] DEFAULT '{}',
  prioritize_tradition BOOLEAN NOT NULL DEFAULT false,
  include_comparative BOOLEAN NOT NULL DEFAULT false,
  include_secular BOOLEAN NOT NULL DEFAULT false,
  educational_only BOOLEAN NOT NULL DEFAULT false,
  use_our_terminology BOOLEAN NOT NULL DEFAULT false,
  respect_but_dont_assume BOOLEAN NOT NULL DEFAULT true,
  avoid_conflicting BOOLEAN NOT NULL DEFAULT true,
  acknowledge_diversity BOOLEAN NOT NULL DEFAULT false,
  minority_views BOOLEAN NOT NULL DEFAULT false,
  diversity_notes TEXT,
  special_instructions TEXT,
  relevance_setting TEXT NOT NULL DEFAULT 'automatic' CHECK (relevance_setting IN ('automatic','always','manual')),
  is_included_in_ai BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: updated_at
DO $$ BEGIN
  CREATE TRIGGER trg_fp_updated_at
    BEFORE UPDATE ON public.faith_preferences
    FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS
ALTER TABLE public.faith_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "fp_manage_primary_parent" ON public.faith_preferences
    FOR ALL USING (
      family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "fp_read_adults" ON public.faith_preferences
    FOR SELECT USING (
      family_id = public.get_my_family_id()
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 5. CREATE context_learning_dismissals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.context_learning_dismissals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  conversation_id UUID REFERENCES public.lila_conversations(id) ON DELETE SET NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cld_family ON public.context_learning_dismissals(family_id);
CREATE INDEX IF NOT EXISTS idx_cld_hash ON public.context_learning_dismissals(content_hash);

-- RLS
ALTER TABLE public.context_learning_dismissals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "cld_manage_primary_parent" ON public.context_learning_dismissals
    FOR ALL USING (
      family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 6. ALTER lists — add archive sharing columns
-- ============================================================
ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS is_shared_to_archive BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archive_member_id UUID REFERENCES public.family_members(id),
  ADD COLUMN IF NOT EXISTS archive_folder_id UUID REFERENCES public.archive_folders(id);

-- ============================================================
-- 7. UPDATE auto_provision_member_resources
--    Creates: member_root folder, 7 system category subfolders,
--    wishlist folder, archive_member_settings record, dashboard_config
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_provision_member_resources()
RETURNS TRIGGER AS $$
DECLARE
  dash_type TEXT;
  root_folder_id UUID;
  category_names TEXT[] := ARRAY[
    'Preferences',
    'Schedule & Activities',
    'Personality & Traits',
    'Interests & Hobbies',
    'School & Learning',
    'Health & Medical',
    'General'
  ];
  cat_name TEXT;
  cat_sort INTEGER := 0;
BEGIN
  -- 1. Create member_root archive folder
  INSERT INTO public.archive_folders (family_id, member_id, folder_name, folder_type, is_system)
  VALUES (NEW.family_id, NEW.id, NEW.display_name || '''s Archives', 'member_root', true)
  RETURNING id INTO root_folder_id;

  -- 2. Create 7 system category subfolders
  FOREACH cat_name IN ARRAY category_names LOOP
    INSERT INTO public.archive_folders (
      family_id, member_id, folder_name, folder_type,
      parent_folder_id, is_system, sort_order
    )
    VALUES (
      NEW.family_id, NEW.id, cat_name, 'system_category',
      root_folder_id, true, cat_sort
    );
    cat_sort := cat_sort + 1;
  END LOOP;

  -- 3. Create wishlist folder
  INSERT INTO public.archive_folders (
    family_id, member_id, folder_name, folder_type,
    parent_folder_id, is_system, sort_order
  )
  VALUES (
    NEW.family_id, NEW.id, 'Wishlist', 'wishlist',
    root_folder_id, true, cat_sort
  );

  -- 4. Create archive_member_settings record
  INSERT INTO public.archive_member_settings (family_id, member_id)
  VALUES (NEW.family_id, NEW.id)
  ON CONFLICT (family_id, member_id) DO NOTHING;

  -- 5. Create dashboard_config if member has a dashboard
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. Auto-provision family overview folder structure
--    Trigger on families INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_provision_family_overview()
RETURNS TRIGGER AS $$
DECLARE
  overview_folder_id UUID;
  section_names TEXT[] := ARRAY[
    'Family Personality',
    'Rhythms & Routines',
    'Current Focus',
    'Faith & Values'
  ];
  section_name TEXT;
  section_sort INTEGER := 0;
BEGIN
  -- Create Family Overview root folder (member_id = NULL for family-level)
  INSERT INTO public.archive_folders (
    family_id, member_id, folder_name, folder_type, is_system
  )
  VALUES (NEW.id, NULL, 'Family Overview', 'family_overview', true)
  RETURNING id INTO overview_folder_id;

  -- Create 4 section subfolders
  FOREACH section_name IN ARRAY section_names LOOP
    INSERT INTO public.archive_folders (
      family_id, member_id, folder_name, folder_type,
      parent_folder_id, is_system, sort_order
    )
    VALUES (
      NEW.id, NULL, section_name, 'system_category',
      overview_folder_id, true, section_sort
    );
    section_sort := section_sort + 1;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger (drop first for idempotency)
DROP TRIGGER IF EXISTS trg_families_auto_provision_overview ON public.families;
CREATE TRIGGER trg_families_auto_provision_overview
  AFTER INSERT ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.auto_provision_family_overview();

-- ============================================================
-- 9. Backfill existing data
-- ============================================================

-- 9a. Existing 'member_root' folders already migrated in step 1 (UPDATE from 'family_member').
--     Mark them as is_system = true.
UPDATE public.archive_folders
  SET is_system = true
  WHERE folder_type = 'member_root' AND is_system = false;

-- 9b. Create missing system category subfolders for existing members
DO $$
DECLARE
  r RECORD;
  cat_name TEXT;
  category_names TEXT[] := ARRAY[
    'Preferences',
    'Schedule & Activities',
    'Personality & Traits',
    'Interests & Hobbies',
    'School & Learning',
    'Health & Medical',
    'General'
  ];
  cat_sort INTEGER;
BEGIN
  -- For each member_root folder that lacks subfolders
  FOR r IN
    SELECT af.id AS root_id, af.family_id, af.member_id
    FROM public.archive_folders af
    WHERE af.folder_type = 'member_root'
      AND NOT EXISTS (
        SELECT 1 FROM public.archive_folders sub
        WHERE sub.parent_folder_id = af.id
          AND sub.folder_type = 'system_category'
      )
  LOOP
    cat_sort := 0;
    FOREACH cat_name IN ARRAY category_names LOOP
      INSERT INTO public.archive_folders (
        family_id, member_id, folder_name, folder_type,
        parent_folder_id, is_system, sort_order
      )
      VALUES (
        r.family_id, r.member_id, cat_name, 'system_category',
        r.root_id, true, cat_sort
      );
      cat_sort := cat_sort + 1;
    END LOOP;

    -- Also create wishlist folder
    INSERT INTO public.archive_folders (
      family_id, member_id, folder_name, folder_type,
      parent_folder_id, is_system, sort_order
    )
    VALUES (
      r.family_id, r.member_id, 'Wishlist', 'wishlist',
      r.root_id, true, cat_sort
    );
  END LOOP;
END $$;

-- 9c. Create archive_member_settings for existing members that lack them
INSERT INTO public.archive_member_settings (family_id, member_id)
SELECT fm.family_id, fm.id
FROM public.family_members fm
WHERE NOT EXISTS (
  SELECT 1 FROM public.archive_member_settings ams
  WHERE ams.member_id = fm.id
)
ON CONFLICT (family_id, member_id) DO NOTHING;

-- 9d. Create Family Overview structure for existing families that lack it
DO $$
DECLARE
  r RECORD;
  overview_id UUID;
  section_name TEXT;
  section_names TEXT[] := ARRAY[
    'Family Personality',
    'Rhythms & Routines',
    'Current Focus',
    'Faith & Values'
  ];
  section_sort INTEGER;
BEGIN
  FOR r IN
    SELECT f.id AS family_id
    FROM public.families f
    WHERE NOT EXISTS (
      SELECT 1 FROM public.archive_folders af
      WHERE af.family_id = f.id
        AND af.folder_type = 'family_overview'
    )
  LOOP
    INSERT INTO public.archive_folders (
      family_id, member_id, folder_name, folder_type, is_system
    )
    VALUES (r.family_id, NULL, 'Family Overview', 'family_overview', true)
    RETURNING id INTO overview_id;

    section_sort := 0;
    FOREACH section_name IN ARRAY section_names LOOP
      INSERT INTO public.archive_folders (
        family_id, member_id, folder_name, folder_type,
        parent_folder_id, is_system, sort_order
      )
      VALUES (
        r.family_id, NULL, section_name, 'system_category',
        overview_id, true, section_sort
      );
      section_sort := section_sort + 1;
    END LOOP;
  END LOOP;
END $$;
