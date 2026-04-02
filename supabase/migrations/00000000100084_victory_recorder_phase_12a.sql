-- ============================================================================
-- PRD-11 Phase 12A: Victory Recorder Core
-- Tables already exist (migration 00000000000009). This migration adds:
--   1. 'monthly' mode to victory_celebrations CHECK
--   2. Missing life_area_tag index on victories
--   3. Mom INSERT/UPDATE RLS policies on victories
--   4. Parent SELECT RLS policy on victory_celebrations
--   5. Activity log trigger on victories INSERT
-- ============================================================================

-- 1. Add 'monthly' to victory_celebrations mode CHECK
-- Drop existing constraint and recreate with 'monthly' included
ALTER TABLE victory_celebrations DROP CONSTRAINT IF EXISTS victory_celebrations_mode_check;
ALTER TABLE victory_celebrations ADD CONSTRAINT victory_celebrations_mode_check
  CHECK (mode IN ('individual', 'review', 'collection', 'monthly'));

-- 2. Missing index for life area filtering (PRD-11 spec)
CREATE INDEX IF NOT EXISTS idx_v_member_area
  ON victories (family_id, family_member_id, life_area_tag);

-- 3. Mom INSERT policy — mom can record victories for any family member
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'v_insert_parent' AND tablename = 'victories'
  ) THEN
    CREATE POLICY v_insert_parent ON victories FOR INSERT
      WITH CHECK (family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      ));
  END IF;
END $$;

-- 4. Mom UPDATE policy — mom can update any family member's victories (Mom's Picks, editing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'v_update_parent' AND tablename = 'victories'
  ) THEN
    CREATE POLICY v_update_parent ON victories FOR UPDATE
      USING (family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      ));
  END IF;
END $$;

-- 5. Parent SELECT on victory_celebrations — mom can read children's celebrations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'vc_select_parent' AND tablename = 'victory_celebrations'
  ) THEN
    CREATE POLICY vc_select_parent ON victory_celebrations FOR SELECT
      USING (family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      ));
  END IF;
END $$;

-- 6. Parent manage on victory_voice_preferences — mom can set voice for children
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'vvp_manage_parent' AND tablename = 'victory_voice_preferences'
  ) THEN
    CREATE POLICY vvp_manage_parent ON victory_voice_preferences FOR ALL
      USING (family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      ));
  END IF;
END $$;

-- 7. Activity log trigger — fires on victory INSERT
CREATE OR REPLACE FUNCTION public.log_victory_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_log_entries (
    family_id,
    member_id,
    event_type,
    source_table,
    source_id,
    source_reference_id,
    display_text,
    description,
    metadata
  ) VALUES (
    NEW.family_id,
    NEW.family_member_id,
    'victory_recorded',
    'victories',
    NEW.id,
    NEW.source_reference_id,
    'Recorded a victory',
    NEW.description,
    jsonb_build_object(
      'source', NEW.source,
      'importance', NEW.importance,
      'life_area_tag', NEW.life_area_tag
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_victory_activity_log ON victories;
CREATE TRIGGER trg_victory_activity_log
  AFTER INSERT ON victories
  FOR EACH ROW EXECUTE FUNCTION public.log_victory_created();
