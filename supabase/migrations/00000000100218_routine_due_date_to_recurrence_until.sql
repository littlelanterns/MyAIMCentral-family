-- Migration 100218: Move routine due_date → recurrence_details.until
--
-- Routines were using tasks.due_date to store the "run until" end date,
-- but due_date means "deadline" on regular tasks. This caused routines to
-- show as "Overdue" and appear on the calendar's "Tasks Due" surface.
--
-- Fix: move the end-date into recurrence_details.until (where the recurring
-- task filter now reads it), then NULL out due_date so routines never
-- trigger deadline-oriented display logic.
--
-- The recurrence_details.until value is intentionally populated by this
-- migration. Any future schema changes to recurrence_details must preserve
-- this field (it controls routine expiry gating in recurringTaskFilter.ts).
--
-- Data snapshot: 17 routine rows with due_date IS NOT NULL.
-- Zero rows have an existing recurrence_details.until value.
-- Zero non-routine rows are affected.

-- Step 1: Routines WITH existing recurrence_details — merge 'until' into JSONB
UPDATE tasks
SET
  recurrence_details = recurrence_details || jsonb_build_object('until', due_date::text),
  due_date = NULL
WHERE task_type = 'routine'
  AND due_date IS NOT NULL
  AND recurrence_details IS NOT NULL
  AND (recurrence_details->>'until') IS NULL;

-- Step 2: Routines WITHOUT recurrence_details (old deployments) — create JSONB with until
UPDATE tasks
SET
  recurrence_details = jsonb_build_object('until', due_date::text),
  due_date = NULL
WHERE task_type = 'routine'
  AND due_date IS NOT NULL
  AND recurrence_details IS NULL;

-- Step 3: Defensive — if any routine somehow has both until AND due_date, keep due_date as authoritative
UPDATE tasks
SET
  recurrence_details = jsonb_set(recurrence_details, '{until}', to_jsonb(due_date::text)),
  due_date = NULL
WHERE task_type = 'routine'
  AND due_date IS NOT NULL
  AND recurrence_details IS NOT NULL
  AND (recurrence_details->>'until') IS NOT NULL
  AND (recurrence_details->>'until') <> due_date::text;
