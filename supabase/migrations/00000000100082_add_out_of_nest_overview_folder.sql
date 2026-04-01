-- ============================================================
-- Migration: Add "Out of Nest" subfolder to Family Overview
-- Adds a 5th system category subfolder under Family Overview
-- for storing context about out-of-nest family members.
-- ============================================================

-- 1. Update the auto_provision_family_overview trigger function
--    to include "Out of Nest" as a 5th section subfolder.
CREATE OR REPLACE FUNCTION public.auto_provision_family_overview()
RETURNS TRIGGER AS $$
DECLARE
  overview_folder_id UUID;
  section_names TEXT[] := ARRAY[
    'Family Personality',
    'Rhythms & Routines',
    'Current Focus',
    'Faith & Values',
    'Out of Nest'
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

  -- Create section subfolders
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

-- 2. Backfill: Add "Out of Nest" subfolder to existing families
--    that have a Family Overview root but no "Out of Nest" child.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT af.id AS overview_id, af.family_id
    FROM public.archive_folders af
    WHERE af.folder_type = 'family_overview'
      AND af.folder_name = 'Family Overview'
      AND NOT EXISTS (
        SELECT 1 FROM public.archive_folders child
        WHERE child.parent_folder_id = af.id
          AND child.folder_name = 'Out of Nest'
      )
  LOOP
    INSERT INTO public.archive_folders (
      family_id, member_id, folder_name, folder_type,
      parent_folder_id, is_system, sort_order
    )
    VALUES (
      r.family_id, NULL, 'Out of Nest', 'system_category',
      r.overview_id, true, 4
    );
  END LOOP;
END $$;
