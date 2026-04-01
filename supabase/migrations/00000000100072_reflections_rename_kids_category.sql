-- Rename kids_specific → daily_life in reflection_prompts category
-- These questions are universal, not kids-only.

-- Step 1: Drop existing CHECK constraint
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
    WHERE con.conrelid = 'reflection_prompts'::regclass
      AND att.attname = 'category'
      AND con.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE reflection_prompts DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Step 2: Update existing rows
UPDATE reflection_prompts SET category = 'daily_life' WHERE category = 'kids_specific';

-- Step 3: Add new CHECK constraint
ALTER TABLE reflection_prompts
  ADD CONSTRAINT reflection_prompts_category_check
  CHECK (category IN (
    'gratitude_joy', 'growth_accountability', 'identity_purpose',
    'relationships_service', 'curiosity_discovery', 'daily_life', 'custom'
  ));
