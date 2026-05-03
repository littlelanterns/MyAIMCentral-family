-- Phase 3 Connector Architecture — Sub-task 2a
-- Add CHECK constraint on deed_firings.source_type with all 10 v1 verb-form types.
-- Worker 5 intentionally deferred this for Phase 3.

ALTER TABLE public.deed_firings
  ADD CONSTRAINT deed_firings_source_type_check
    CHECK (source_type IN (
      'task_completion',
      'routine_step_completion',
      'list_item_completion',
      'intention_iteration',
      'widget_data_point',
      'tracker_widget_event',
      'time_session_ended',
      'scheduled_occurrence_active',
      'opportunity_claimed',
      'randomizer_drawn'
    ));

-- Per-kid deed history index (missing from Worker 5)
CREATE INDEX IF NOT EXISTS deed_firings_member_source_type_idx
  ON public.deed_firings (family_member_id, source_type, fired_at DESC);

-- INSERT policy for authenticated users (needed for client-side deed firing)
CREATE POLICY deed_firings_insert_family ON public.deed_firings
  FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

DO $$ BEGIN RAISE NOTICE 'migration 100200: deed_firings CHECK constraint + index + insert policy added'; END $$;
