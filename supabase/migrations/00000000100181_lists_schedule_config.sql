-- Worker 5 (Painter / Universal Scheduler Upgrade) — Sub-task 2
--
-- Adds schedule_config JSONB to the lists table so a list can have
-- a painted or recurring schedule attached. When present, the
-- schedule controls when the list is "active" (display-only badge
-- in Worker 5; visibility gating deferred to Phase 3).
--
-- NULL = no schedule attached, list always active (backward compatible).
--
-- The column stores a full SchedulerOutput blob:
--   { rrule, dtstart, until, count, exdates, rdates, timezone,
--     schedule_type, completion_dependent, custody_pattern,
--     assignee_map, active_start_time, active_end_time,
--     instantiation_mode }
--
-- Example painted schedule:
--   { "rrule": null, "schedule_type": "painted",
--     "rdates": ["2026-05-03","2026-05-10","2026-05-17","2026-05-24"],
--     "dtstart": "2026-05-03", "timezone": "America/Chicago",
--     "exdates": [], "until": null, "count": null,
--     "completion_dependent": null, "custody_pattern": null }

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS schedule_config JSONB DEFAULT NULL;

COMMENT ON COLUMN public.lists.schedule_config IS
  'Optional SchedulerOutput JSONB blob. When present, controls when '
  'this list is "active." NULL = always active (no schedule). '
  'Worker 5 adds display-only "Active today" badge; Phase 3 adds '
  'visibility gating.';
