-- Migration: Make list_items.track_duration nullable for per-item inherit semantics.
-- Existing rows keep their current value (false). New items can be NULL = inherit from list default.
-- Companion to migration 100183 (daily progress marking) which added list_items.track_progress as nullable.
--
-- DOWN-MIGRATION (manual):
--   UPDATE list_items SET track_duration = false WHERE track_duration IS NULL;
--   ALTER TABLE list_items ALTER COLUMN track_duration SET NOT NULL;

ALTER TABLE public.list_items
  ALTER COLUMN track_duration DROP NOT NULL;
