-- ============================================================
-- PRD-16: Meetings — Build P Phase A
-- 6 tables + RLS + indexes + triggers + feature keys + seeds
-- Meeting types: couple, parent_child, mentor, family_council, custom
-- (weekly/monthly/quarterly belong to Rhythms PRD-18; business is custom template)
-- ============================================================

-- ── 1. meetings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id),
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('couple', 'parent_child', 'mentor', 'family_council', 'custom')),
  template_id UUID, -- FK → meeting_templates, for custom types
  custom_title TEXT, -- e.g. "Mentor: Jake"
  related_member_id UUID REFERENCES public.family_members(id), -- specific child for parent_child/mentor
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'paused', 'completed', 'cancelled')),
  mode TEXT NOT NULL DEFAULT 'live' CHECK (mode IN ('live', 'record_after')),
  facilitator_member_id UUID REFERENCES public.family_members(id), -- family council facilitator
  started_by UUID NOT NULL REFERENCES public.family_members(id),
  summary TEXT,
  impressions TEXT, -- personal, only visible to the person who ended the meeting
  lila_conversation_id UUID REFERENCES public.lila_conversations(id),
  schedule_id UUID, -- FK → meeting_schedules (added after table creation)
  calendar_event_id UUID REFERENCES public.calendar_events(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_family_type_status ON public.meetings(family_id, meeting_type, status);
CREATE INDEX IF NOT EXISTS idx_meetings_family_completed ON public.meetings(family_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_schedule ON public.meetings(schedule_id) WHERE schedule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meetings_related_member ON public.meetings(related_member_id) WHERE related_member_id IS NOT NULL;

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Mom reads all family meetings
CREATE POLICY meetings_mom_read ON public.meetings FOR SELECT USING (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);
-- NOTE: meetings_participant_read policy created AFTER meeting_participants table (below)
-- Family members can insert meetings for their family
CREATE POLICY meetings_family_insert ON public.meetings FOR INSERT WITH CHECK (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
);
-- The person who started the meeting can update it
CREATE POLICY meetings_starter_update ON public.meetings FOR UPDATE USING (
  started_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
) WITH CHECK (
  started_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
);
-- Mom can update any family meeting
CREATE POLICY meetings_mom_update ON public.meetings FOR UPDATE USING (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
) WITH CHECK (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);

CREATE TRIGGER trg_meetings_updated_at BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 2. meeting_participants ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.family_members(id),
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'facilitator', 'observer')),
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, family_member_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON public.meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_member ON public.meeting_participants(family_member_id, created_at DESC);

ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- Participants can read records for meetings they're in
CREATE POLICY mp_participant_read ON public.meeting_participants FOR SELECT USING (
  family_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  OR meeting_id IN (SELECT meeting_id FROM public.meeting_participants WHERE family_member_id IN (
    SELECT id FROM public.family_members WHERE user_id = auth.uid()
  ))
);
-- Mom reads all
CREATE POLICY mp_mom_read ON public.meeting_participants FOR SELECT USING (
  meeting_id IN (SELECT id FROM public.meetings WHERE family_id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent'
  ))
);
-- Family members can insert (meeting creation adds participants)
CREATE POLICY mp_family_insert ON public.meeting_participants FOR INSERT WITH CHECK (
  meeting_id IN (SELECT id FROM public.meetings WHERE family_id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
  ))
);
-- Mom can delete (remove participants)
CREATE POLICY mp_mom_delete ON public.meeting_participants FOR DELETE USING (
  meeting_id IN (SELECT id FROM public.meetings WHERE family_id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent'
  ))
);

-- Deferred policy: participants read meetings they're in (requires meeting_participants table)
CREATE POLICY meetings_participant_read ON public.meetings FOR SELECT USING (
  id IN (SELECT meeting_id FROM public.meeting_participants WHERE family_member_id IN (
    SELECT id FROM public.family_members WHERE user_id = auth.uid()
  ))
);

-- ── 3. meeting_templates ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meeting_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id),
  name TEXT NOT NULL,
  participant_type TEXT NOT NULL DEFAULT 'personal' CHECK (participant_type IN ('personal', 'two_person', 'group')),
  default_partner_id UUID REFERENCES public.family_members(id), -- for two_person
  default_participant_ids UUID[], -- for group
  created_by UUID NOT NULL REFERENCES public.family_members(id),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_templates_family ON public.meeting_templates(family_id, is_archived);

ALTER TABLE public.meeting_templates ENABLE ROW LEVEL SECURITY;

-- Mom CRUD all
CREATE POLICY mt_mom_all ON public.meeting_templates FOR ALL USING (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
) WITH CHECK (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);
-- Creator can update own
CREATE POLICY mt_creator_update ON public.meeting_templates FOR UPDATE USING (
  created_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
) WITH CHECK (
  created_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
);
-- Participants can read templates for their meetings
CREATE POLICY mt_family_read ON public.meeting_templates FOR SELECT USING (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
);

CREATE TRIGGER trg_meeting_templates_updated_at BEFORE UPDATE ON public.meeting_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Now add FK from meetings to meeting_templates
ALTER TABLE public.meetings
  ADD CONSTRAINT meetings_template_id_fk FOREIGN KEY (template_id) REFERENCES public.meeting_templates(id);

-- ── 4. meeting_schedules ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meeting_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id),
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('couple', 'parent_child', 'mentor', 'family_council', 'custom')),
  template_id UUID REFERENCES public.meeting_templates(id),
  related_member_id UUID REFERENCES public.family_members(id), -- per-child mentor meetings
  recurrence_rule TEXT DEFAULT 'weekly' CHECK (recurrence_rule IN ('daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'yearly', 'custom')),
  recurrence_details JSONB NOT NULL DEFAULT '{}',
  next_due_date TIMESTAMPTZ,
  last_completed_date TIMESTAMPTZ,
  calendar_event_id UUID REFERENCES public.calendar_events(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.family_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_schedules_family_type ON public.meeting_schedules(family_id, meeting_type, is_active);
CREATE INDEX IF NOT EXISTS idx_meeting_schedules_next_due ON public.meeting_schedules(family_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_meeting_schedules_related_member ON public.meeting_schedules(related_member_id) WHERE related_member_id IS NOT NULL;

ALTER TABLE public.meeting_schedules ENABLE ROW LEVEL SECURITY;

-- Mom CRUD all
CREATE POLICY ms_mom_all ON public.meeting_schedules FOR ALL USING (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
) WITH CHECK (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);
-- Dad can CRUD schedules for meetings they participate in
CREATE POLICY ms_dad_manage ON public.meeting_schedules FOR ALL USING (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'additional_adult')
) WITH CHECK (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'additional_adult')
);
-- Teens can read
CREATE POLICY ms_teen_read ON public.meeting_schedules FOR SELECT USING (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
);

CREATE TRIGGER trg_meeting_schedules_updated_at BEFORE UPDATE ON public.meeting_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Now add FK from meetings to meeting_schedules
ALTER TABLE public.meetings
  ADD CONSTRAINT meetings_schedule_id_fk FOREIGN KEY (schedule_id) REFERENCES public.meeting_schedules(id);

-- ── 5. meeting_template_sections ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.meeting_template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id),
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('couple', 'parent_child', 'mentor', 'family_council', 'custom')),
  template_id UUID REFERENCES public.meeting_templates(id), -- for custom type sections
  section_name TEXT NOT NULL,
  prompt_text TEXT, -- LiLa instruction for this section
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false, -- system-seeded
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mts_family_type_active ON public.meeting_template_sections(family_id, meeting_type, is_archived, sort_order);
CREATE INDEX IF NOT EXISTS idx_mts_template ON public.meeting_template_sections(template_id, sort_order) WHERE template_id IS NOT NULL;

ALTER TABLE public.meeting_template_sections ENABLE ROW LEVEL SECURITY;

-- Mom CRUD all
CREATE POLICY mts_mom_all ON public.meeting_template_sections FOR ALL USING (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
) WITH CHECK (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);
-- Dad can manage sections for meeting types they participate in
CREATE POLICY mts_dad_manage ON public.meeting_template_sections FOR ALL USING (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'additional_adult')
) WITH CHECK (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'additional_adult')
);
-- Teens can read
CREATE POLICY mts_teen_read ON public.meeting_template_sections FOR SELECT USING (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
);

CREATE TRIGGER trg_meeting_template_sections_updated_at BEFORE UPDATE ON public.meeting_template_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 6. meeting_agenda_items ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meeting_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id),
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('couple', 'parent_child', 'mentor', 'family_council', 'custom')),
  template_id UUID REFERENCES public.meeting_templates(id), -- for custom types
  related_member_id UUID REFERENCES public.family_members(id), -- per-child meetings
  content TEXT NOT NULL,
  added_by UUID NOT NULL REFERENCES public.family_members(id),
  suggested_by_guided BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'discussed', 'removed')),
  discussed_in_meeting_id UUID REFERENCES public.meetings(id),
  source TEXT NOT NULL DEFAULT 'quick_add' CHECK (source IN ('quick_add', 'notepad_route', 'review_route')),
  source_reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mai_family_type_status ON public.meeting_agenda_items(family_id, meeting_type, status);
CREATE INDEX IF NOT EXISTS idx_mai_family_type_member_status ON public.meeting_agenda_items(family_id, meeting_type, related_member_id, status);
CREATE INDEX IF NOT EXISTS idx_mai_discussed_meeting ON public.meeting_agenda_items(discussed_in_meeting_id) WHERE discussed_in_meeting_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mai_added_by ON public.meeting_agenda_items(added_by);

ALTER TABLE public.meeting_agenda_items ENABLE ROW LEVEL SECURITY;

-- Mom reads all
CREATE POLICY mai_mom_read ON public.meeting_agenda_items FOR SELECT USING (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);
-- Participants read pending items for meetings they're part of
CREATE POLICY mai_family_read ON public.meeting_agenda_items FOR SELECT USING (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
);
-- Family members can add agenda items
CREATE POLICY mai_family_insert ON public.meeting_agenda_items FOR INSERT WITH CHECK (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
);
-- Adder can update/remove own items
CREATE POLICY mai_adder_update ON public.meeting_agenda_items FOR UPDATE USING (
  added_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
) WITH CHECK (
  added_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
);
-- Mom can update/remove any item
CREATE POLICY mai_mom_update ON public.meeting_agenda_items FOR UPDATE USING (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
) WITH CHECK (
  family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
);

CREATE TRIGGER trg_meeting_agenda_items_updated_at BEFORE UPDATE ON public.meeting_agenda_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 7. Constraint updates on existing tables ─────────────────

-- calendar_events.source_type: add 'meeting_schedule'
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_source_type_check;
ALTER TABLE public.calendar_events ADD CONSTRAINT calendar_events_source_type_check
  CHECK (source_type IN ('manual', 'review_route', 'image_ocr', 'lila_guided', 'task_auto', 'google_sync', 'meeting_schedule'));

-- conversation_threads.source_type: add 'meeting_summary'
ALTER TABLE public.conversation_threads DROP CONSTRAINT IF EXISTS conversation_threads_source_type_check;
ALTER TABLE public.conversation_threads ADD CONSTRAINT conversation_threads_source_type_check
  CHECK (source_type IN ('manual', 'request_discussion', 'notepad_route', 'system', 'meeting_summary'));

-- ── 8. Feature keys ──────────────────────────────────────────

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('meetings_basic', 'Meetings — Basic', 'Personal review meetings, agenda capture, meeting history', 'PRD-16'),
  ('meetings_shared', 'Meetings — Shared', 'Couple, parent-child, mentor, family council meetings with multi-participant agenda', 'PRD-16'),
  ('meetings_ai', 'Meetings — AI Facilitation', 'LiLa guided facilitation, context-aware prompts, action item extraction', 'PRD-16'),
  ('meetings_custom_templates', 'Meetings — Custom Templates', 'Custom meeting templates with LiLa section suggestions', 'PRD-16'),
  ('meetings_facilitator_rotation', 'Meetings — Facilitator Rotation', 'Child facilitator designation with adaptive LiLa guidance', 'PRD-16')
ON CONFLICT (feature_key) DO NOTHING;

-- Feature access grants per role group
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT fk.feature_key, rg.role_group, st.id, true
FROM (VALUES
  ('meetings_basic', 'mom'),
  ('meetings_basic', 'dad_adults'),
  ('meetings_basic', 'independent_teens'),
  ('meetings_basic', 'guided_kids'),
  ('meetings_basic', 'play_kids'),
  ('meetings_shared', 'mom'),
  ('meetings_shared', 'dad_adults'),
  ('meetings_shared', 'independent_teens'),
  ('meetings_ai', 'mom'),
  ('meetings_ai', 'dad_adults'),
  ('meetings_custom_templates', 'mom'),
  ('meetings_custom_templates', 'dad_adults'),
  ('meetings_facilitator_rotation', 'mom')
) AS fk(feature_key, role_group)
CROSS JOIN LATERAL (SELECT role_group) AS rg(role_group)
CROSS JOIN LATERAL (
  SELECT id FROM public.subscription_tiers WHERE slug = CASE
    WHEN fk.feature_key = 'meetings_basic' THEN 'essential'
    WHEN fk.feature_key = 'meetings_shared' THEN 'enhanced'
    WHEN fk.feature_key = 'meetings_ai' THEN 'enhanced'
    WHEN fk.feature_key = 'meetings_custom_templates' THEN 'full-magic'
    WHEN fk.feature_key = 'meetings_facilitator_rotation' THEN 'full-magic'
  END
) AS st(id)
ON CONFLICT DO NOTHING;

-- ── 9. Verification ──────────────────────────────────────────

DO $$
DECLARE
  table_count INTEGER;
  fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('meetings', 'meeting_participants', 'meeting_templates', 'meeting_schedules', 'meeting_template_sections', 'meeting_agenda_items');
  RAISE NOTICE 'PRD-16 tables created: %/6', table_count;

  SELECT COUNT(*) INTO fk_count
  FROM public.feature_key_registry
  WHERE feature_key LIKE 'meetings_%';
  RAISE NOTICE 'PRD-16 feature keys: %/5', fk_count;
END $$;
