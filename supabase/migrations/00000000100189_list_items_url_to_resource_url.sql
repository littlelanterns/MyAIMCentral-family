-- Migration: Rename list_items.url → list_items.resource_url
-- Purpose: Align list_items URL column naming with tasks.resource_url (Convention per
--          CLAUDE.md #166) so both tables use the same column name for item URLs.
--          Also updates JSONB keys in list_templates.default_items to match.
-- Reference: Universal Capability Parity Discovery Report 2, V11.

-- Step 1: Rename the column on list_items (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'list_items' AND column_name = 'url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'list_items' AND column_name = 'resource_url'
  ) THEN
    ALTER TABLE public.list_items RENAME COLUMN url TO resource_url;
  END IF;
END $$;

-- Step 2: Update JSONB keys in list_templates.default_items
-- Each element in the JSONB array may have a "url" key that should become "resource_url".
UPDATE public.list_templates
SET default_items = (
  SELECT jsonb_agg(
    CASE
      WHEN elem ? 'url' THEN (elem - 'url') || jsonb_build_object('resource_url', elem->'url')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(default_items) AS elem
)
WHERE default_items IS NOT NULL
  AND default_items::text LIKE '%"url"%';
