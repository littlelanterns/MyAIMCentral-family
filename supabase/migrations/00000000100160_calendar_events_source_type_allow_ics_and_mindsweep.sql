-- SCOPE-8b.F7 — PRD-14B .ics import CHECK violation (runtime failure on marquee import feature)
--
-- Migration 00000000100146_meetings.sql widened calendar_events_source_type_check to add
-- 'meeting_schedule' but did not include 'ics_import' or 'mindsweep' — values the live code
-- in src/components/queue/CalendarTab.tsx (L301, L380, L448) writes on approval of .ics and
-- mindsweep-origin queue rows. Every such approval currently throws a CHECK violation.
--
-- Reference: claude/web-sync/AUDIT_REPORT_v1.md §SCOPE-8b.F7.

ALTER TABLE public.calendar_events
  DROP CONSTRAINT IF EXISTS calendar_events_source_type_check;

ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_source_type_check
  CHECK (source_type IN (
    'manual',
    'review_route',
    'image_ocr',
    'lila_guided',
    'task_auto',
    'google_sync',
    'meeting_schedule',
    'ics_import',
    'mindsweep'
  ));
