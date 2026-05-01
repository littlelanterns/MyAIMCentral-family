-- Stage 3 Foundation: pending_changes table for Now/Next cycle staging.
--
-- When mom edits a deployed routine, list, or sequential collection, she
-- chooses whether the change takes effect Now (immediate) or Next cycle
-- (staged until the next deployment trigger). This table holds staged
-- changes until they are applied or cancelled.

CREATE TABLE public.pending_changes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id               UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  source_type             TEXT NOT NULL,
  source_id               UUID NOT NULL,
  change_category         TEXT NOT NULL,
  change_payload          JSONB NOT NULL,
  trigger_mode            TEXT NOT NULL,
  trigger_at              TIMESTAMPTZ,
  affected_deployment_ids UUID[],
  affected_member_ids     UUID[],
  created_by              UUID NOT NULL REFERENCES public.family_members(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at              TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,
  batch_id                UUID
);

ALTER TABLE public.pending_changes ENABLE ROW LEVEL SECURITY;

-- Primary parent: full CRUD (no DELETE — soft delete via cancelled_at)
CREATE POLICY pending_changes_select_parent ON public.pending_changes
  FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

CREATE POLICY pending_changes_insert_parent ON public.pending_changes
  FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

CREATE POLICY pending_changes_update_parent ON public.pending_changes
  FOR UPDATE
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- Other members: can SELECT pending changes affecting their own deployments
CREATE POLICY pending_changes_select_affected ON public.pending_changes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.family_id = pending_changes.family_id
        AND fm.id = ANY(pending_changes.affected_member_ids)
    )
  );

-- Active pending changes for a specific source (most common lookup)
CREATE INDEX pending_changes_active_source_idx
  ON public.pending_changes (source_type, source_id)
  WHERE applied_at IS NULL AND cancelled_at IS NULL;

-- All active pending changes for a family
CREATE INDEX pending_changes_active_family_idx
  ON public.pending_changes (family_id)
  WHERE applied_at IS NULL AND cancelled_at IS NULL;

-- Scheduled changes ready to fire (cron job lookup)
CREATE INDEX pending_changes_scheduled_idx
  ON public.pending_changes (trigger_mode, trigger_at)
  WHERE applied_at IS NULL AND cancelled_at IS NULL;
