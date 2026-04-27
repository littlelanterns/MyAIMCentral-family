-- Worker 5 (Painter / Universal Scheduler Upgrade) — Sub-task 1
--
-- Creates the deed_firings table: the event log for the connector
-- architecture. Every deed (a painted day arriving, a task being
-- completed, a list item being checked off) writes a row here.
-- Phase 3 inherits this table and adds contract evaluation +
-- godmother dispatch on top.
--
-- Worker 5 writes only source_type='scheduled_occurrence_active'.
-- Workers 2+3 add 'list_item_completion' and
-- 'routine_step_completion'. Phase 3 adds the remaining v1 set.
--
-- No CHECK on source_type yet — Phase 3 tightens when the full
-- v1 deed set is wired.

CREATE TABLE IF NOT EXISTS public.deed_firings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  fired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}',
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate firings (same deed, same person, same date)
CREATE UNIQUE INDEX IF NOT EXISTS deed_firings_idempotency_idx
  ON public.deed_firings (idempotency_key);

-- Contract lookup: "find all firings of this source_type for this family"
CREATE INDEX IF NOT EXISTS deed_firings_family_source_type_idx
  ON public.deed_firings (family_id, source_type, fired_at DESC);

-- Per-source per-member history: "what firings has this kid had for this source?"
CREATE INDEX IF NOT EXISTS deed_firings_source_member_idx
  ON public.deed_firings (source_id, family_member_id, fired_at DESC);

-- Chronological family feed: "all recent firings for this family"
CREATE INDEX IF NOT EXISTS deed_firings_family_chrono_idx
  ON public.deed_firings (family_id, fired_at DESC);


-- ── RLS ─────────────────────────────────────────────────────────
ALTER TABLE public.deed_firings ENABLE ROW LEVEL SECURITY;

-- Family members can read their own family's firings
CREATE POLICY deed_firings_select_family ON public.deed_firings
  FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

-- INSERT is service-role only. Deed firings are written by
-- server-side processes (cron Edge Functions, triggers), never
-- directly by the client. The default-deny RLS (no INSERT policy
-- for authenticated role) enforces this.
--
-- Phase 3 may add an INSERT policy if client-side deed firing
-- becomes necessary, but for Worker 5 all writes go through
-- Edge Functions using the service role key.

COMMENT ON TABLE public.deed_firings IS
  'Connector architecture event log. Each row records a deed firing — '
  '"something happened" in a family primitive. Phase 3 evaluates '
  'contracts against these firings and dispatches godmothers.';

COMMENT ON COLUMN public.deed_firings.source_type IS
  'Deed type. Locked to verb-form per Coordination Brief §2.10. '
  'Worker 5: scheduled_occurrence_active. '
  'Workers 2+3: list_item_completion, routine_step_completion. '
  'Phase 3 adds remaining v1 set.';

COMMENT ON COLUMN public.deed_firings.source_id IS
  'Polymorphic reference to the specific source instance '
  '(schedule output ID, task ID, list item ID, etc.).';

COMMENT ON COLUMN public.deed_firings.family_member_id IS
  'The specific family member this firing is for. NULL = family-wide. '
  'For painted schedules: one firing per assignee, each carrying '
  'that kid''s family_member_id.';

COMMENT ON COLUMN public.deed_firings.idempotency_key IS
  'Prevents duplicate firings. Format: '
  '{source_type}:{source_id}:{family_member_id}:{date_iso}. '
  'UNIQUE index enforces at-most-once delivery.';

COMMENT ON COLUMN public.deed_firings.metadata IS
  'Additional context for the firing. For scheduled_occurrence_active: '
  'painted_date, active_start_time, active_end_time, '
  'instantiation_mode, schedule_type.';
