-- Migration: Fix journal_entries.entry_type to match PRD-08 authoritative values
--
-- PRD-08 defines 11 journal entry types:
--   journal_entry, gratitude, reflection, quick_note, commonplace,
--   kid_quips, meeting_notes, transcript, lila_conversation, brain_dump, custom
--
-- The DB was built with wrong names from database_schema.md.
-- This migration corrects existing rows and updates the CHECK constraint.
--
-- NOTE: learning_capture is NOT a journal entry type. Homeschool learning capture
-- lives in family_moments (PRD-37) and homeschool_time_logs (PRD-28).
-- Commonplace is a distinct journal type for capturing quotes and ideas from reading.

-- Step 1: Drop existing CHECK constraint FIRST (before updating rows)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
    WHERE con.conrelid = 'journal_entries'::regclass
      AND att.attname = 'entry_type'
      AND con.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE journal_entries DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Step 2: Map existing rows from wrong DB values to correct PRD-08 values
UPDATE journal_entries SET entry_type = 'journal_entry'  WHERE entry_type = 'free_write';
UPDATE journal_entries SET entry_type = 'reflection'     WHERE entry_type = 'daily_reflection';
UPDATE journal_entries SET entry_type = 'commonplace'    WHERE entry_type = 'learning_capture';
UPDATE journal_entries SET entry_type = 'journal_entry'  WHERE entry_type = 'prayer';
UPDATE journal_entries SET entry_type = 'journal_entry'  WHERE entry_type = 'dream';
UPDATE journal_entries SET entry_type = 'journal_entry'  WHERE entry_type = 'letter';
UPDATE journal_entries SET entry_type = 'journal_entry'  WHERE entry_type = 'memory';
UPDATE journal_entries SET entry_type = 'journal_entry'  WHERE entry_type = 'goal_check_in';
UPDATE journal_entries SET entry_type = 'journal_entry'  WHERE entry_type = 'observation';
UPDATE journal_entries SET entry_type = 'reflection'     WHERE entry_type = 'reflection_response';

-- Step 3: Add correct CHECK constraint with PRD-08 values
ALTER TABLE journal_entries
  ADD CONSTRAINT journal_entries_entry_type_check
  CHECK (entry_type IN (
    'journal_entry',
    'gratitude',
    'reflection',
    'quick_note',
    'commonplace',
    'kid_quips',
    'meeting_notes',
    'transcript',
    'lila_conversation',
    'brain_dump',
    'custom'
  ));
