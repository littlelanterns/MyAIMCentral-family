-- GDCX (Guided Dashboard Completion, PRD-25 residuals) — Slice 3
--
-- PRD-25 Screen 6 (DailyCelebration Reflections Step 2.5) specifies celebration-
-- originated reflection answers must be distinguishable from Write-drawer /
-- evening-rhythm answers. reflection_responses.source_context is CHECK-
-- constrained (migration 00000000100071) to ('reflections_page',
-- 'evening_rhythm') — this migration additively extends it to accept
-- 'daily_celebration' as a third legal value. No data migration, no
-- destructive change, no new table.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'reflection_responses'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%source_context%'
  LOOP
    EXECUTE format('ALTER TABLE public.reflection_responses DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.reflection_responses
  ADD CONSTRAINT reflection_responses_source_context_check
  CHECK (source_context IN ('reflections_page', 'evening_rhythm', 'daily_celebration'));
