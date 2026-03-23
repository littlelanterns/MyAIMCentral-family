-- MyAIM Central v2 — Phase 09: Tasks, Lists & Studio Queue (PRD-09A, PRD-09B, PRD-17)
-- 15 tables covering tasks, routines, opportunities, lists, templates, and universal intake

-- ============================================================
-- Task Templates (PRD-09A)
-- ============================================================

CREATE TABLE public.task_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.family_members(id),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('task','routine','opportunity','habit')),
  config JSONB,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tt_family ON public.task_templates(family_id);
CREATE INDEX idx_tt_type ON public.task_templates(task_type);

CREATE TRIGGER trg_tt_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tt_select_family" ON public.task_templates
  FOR SELECT USING (
    family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
  );

CREATE POLICY "tt_manage_adults" ON public.task_templates
  FOR ALL USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    OR created_by IN (
      SELECT id FROM public.family_members
      WHERE user_id = auth.uid() AND role IN ('primary_parent','additional_adult')
    )
  );

-- ============================================================
-- Task Template Sections & Steps (PRD-09A)
-- ============================================================

CREATE TABLE public.task_template_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tts_template ON public.task_template_sections(template_id);

ALTER TABLE public.task_template_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tts_via_template" ON public.task_template_sections
  FOR ALL USING (
    template_id IN (
      SELECT id FROM public.task_templates
      WHERE family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    )
  );

CREATE TABLE public.task_template_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.task_template_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ttst_section ON public.task_template_steps(section_id);

ALTER TABLE public.task_template_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ttst_via_section" ON public.task_template_steps
  FOR ALL USING (
    section_id IN (
      SELECT tts.id FROM public.task_template_sections tts
      JOIN public.task_templates tt ON tts.template_id = tt.id
      WHERE tt.family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
    )
  );

-- ============================================================
-- Tasks (PRD-09A) — Core task table
-- ============================================================

CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.family_members(id),
  assignee_id UUID REFERENCES public.family_members(id),
  template_id UUID REFERENCES public.task_templates(id),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('task','routine','opportunity','habit')),
  status TEXT NOT NULL CHECK (status IN ('pending','in_progress','completed','cancelled','paused')),
  priority TEXT CHECK (priority IN ('now','next','optional','someday')),
  due_date DATE,
  due_time TIME,
  life_area_tag TEXT,
  points_override INTEGER,
  related_plan_id UUID,
  source TEXT NOT NULL DEFAULT 'manual',
  recurrence_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_family ON public.tasks(family_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due ON public.tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_plan ON public.tasks(related_plan_id) WHERE related_plan_id IS NOT NULL;

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_family" ON public.tasks
  FOR SELECT USING (
    family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
  );

CREATE POLICY "tasks_manage_adults" ON public.tasks
  FOR ALL USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    OR created_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR assignee_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- Task Assignments (PRD-09A)
-- ============================================================

CREATE TABLE public.task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id),
  assigned_by UUID NOT NULL REFERENCES public.family_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ta_task ON public.task_assignments(task_id);
CREATE INDEX idx_ta_member ON public.task_assignments(member_id);

ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ta_via_task" ON public.task_assignments
  FOR ALL USING (
    task_id IN (SELECT id FROM public.tasks WHERE family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    ))
  );

-- ============================================================
-- Task Completions (PRD-09A)
-- ============================================================

CREATE TABLE public.task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence JSONB,
  approved_by UUID REFERENCES public.family_members(id),
  approval_status TEXT CHECK (approval_status IN ('pending','approved','rejected'))
);

CREATE INDEX idx_tc_task ON public.task_completions(task_id);
CREATE INDEX idx_tc_member ON public.task_completions(member_id);
CREATE INDEX idx_tc_completed ON public.task_completions(completed_at DESC);

ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tc_select_family" ON public.task_completions
  FOR SELECT USING (
    task_id IN (SELECT id FROM public.tasks WHERE family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    ))
  );

CREATE POLICY "tc_insert_own" ON public.task_completions
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "tc_approve_parent" ON public.task_completions
  FOR UPDATE USING (
    task_id IN (SELECT id FROM public.tasks WHERE family_id IN (
      SELECT id FROM public.families WHERE primary_parent_id = auth.uid()
    ))
  );

-- ============================================================
-- Routine Step Completions (PRD-09A)
-- ============================================================

CREATE TABLE public.routine_step_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.task_template_steps(id),
  member_id UUID NOT NULL REFERENCES public.family_members(id),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rsc_task ON public.routine_step_completions(task_id);
CREATE INDEX idx_rsc_step ON public.routine_step_completions(step_id);

ALTER TABLE public.routine_step_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rsc_via_task" ON public.routine_step_completions
  FOR ALL USING (
    task_id IN (SELECT id FROM public.tasks WHERE family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    ))
  );

-- ============================================================
-- Sequential Collections (PRD-09A)
-- ============================================================

CREATE TABLE public.sequential_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  task_ids UUID[] NOT NULL,
  current_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sc_family ON public.sequential_collections(family_id);

CREATE TRIGGER trg_sc_updated_at
  BEFORE UPDATE ON public.sequential_collections
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.sequential_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sc_family" ON public.sequential_collections
  FOR ALL USING (
    family_id IN (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
  );

-- ============================================================
-- Task Claims (PRD-09A) — Opportunity conflict resolution
-- ============================================================

CREATE TABLE public.task_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id),
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('claimed','completed','released'))
);

CREATE INDEX idx_tcl_task ON public.task_claims(task_id);
CREATE INDEX idx_tcl_member ON public.task_claims(member_id);

ALTER TABLE public.task_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tcl_via_task" ON public.task_claims
  FOR ALL USING (
    task_id IN (SELECT id FROM public.tasks WHERE family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    ))
  );

-- ============================================================
-- Task Rewards (PRD-09A) — Gamification stub
-- ============================================================

CREATE TABLE public.task_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('points','money','privilege','custom')),
  reward_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tr_task ON public.task_rewards(task_id);

ALTER TABLE public.task_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tr_via_task" ON public.task_rewards
  FOR ALL USING (
    task_id IN (SELECT id FROM public.tasks WHERE family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    ))
  );

-- ============================================================
-- Lists (PRD-09B)
-- ============================================================

CREATE TABLE public.lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.family_members(id),
  title TEXT NOT NULL,
  list_type TEXT NOT NULL CHECK (list_type IN ('simple','checklist','reference','template','randomizer','backburner')),
  reveal_type TEXT,
  max_respins_per_period INTEGER,
  respin_period TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lists_family ON public.lists(family_id);
CREATE INDEX idx_lists_owner ON public.lists(owner_id);
CREATE INDEX idx_lists_type ON public.lists(list_type);

CREATE TRIGGER trg_lists_updated_at
  BEFORE UPDATE ON public.lists
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lists_manage_own" ON public.lists
  FOR ALL USING (
    owner_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

CREATE POLICY "lists_select_shared" ON public.lists
  FOR SELECT USING (
    id IN (SELECT list_id FROM public.list_shares WHERE shared_with IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    ))
  );

-- ============================================================
-- List Items (PRD-09B)
-- ============================================================

CREATE TABLE public.list_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  section_name TEXT,
  notes TEXT,
  availability_mode TEXT,
  max_instances INTEGER,
  completed_instances INTEGER NOT NULL DEFAULT 0,
  recurrence_config JSONB,
  next_available_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_li_list ON public.list_items(list_id);
CREATE INDEX idx_li_sort ON public.list_items(list_id, sort_order);

CREATE TRIGGER trg_li_updated_at
  BEFORE UPDATE ON public.list_items
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "li_via_list" ON public.list_items
  FOR ALL USING (
    list_id IN (
      SELECT id FROM public.lists WHERE owner_id IN (
        SELECT id FROM public.family_members WHERE user_id = auth.uid()
      )
      OR family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    )
    OR list_id IN (
      SELECT list_id FROM public.list_shares WHERE shared_with IN (
        SELECT id FROM public.family_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- List Shares (PRD-09B)
-- ============================================================

CREATE TABLE public.list_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES public.family_members(id),
  permission TEXT NOT NULL CHECK (permission IN ('view','edit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ls_list ON public.list_shares(list_id);
CREATE INDEX idx_ls_shared ON public.list_shares(shared_with);

ALTER TABLE public.list_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ls_manage_owner" ON public.list_shares
  FOR ALL USING (
    list_id IN (
      SELECT id FROM public.lists WHERE owner_id IN (
        SELECT id FROM public.family_members WHERE user_id = auth.uid()
      )
      OR family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
    )
  );

-- ============================================================
-- List Templates (PRD-09B)
-- ============================================================

CREATE TABLE public.list_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  list_type TEXT NOT NULL,
  default_items JSONB,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lt_type ON public.list_templates(list_type);

ALTER TABLE public.list_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lt_select_all" ON public.list_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- Studio Queue (PRD-17 authoritative + PRD-17B)
-- ============================================================

CREATE TABLE public.studio_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.family_members(id),
  destination TEXT,
  content TEXT NOT NULL,
  content_details JSONB,
  source TEXT NOT NULL,
  source_reference_id UUID,
  structure_flag TEXT,
  batch_id UUID,
  requester_id UUID REFERENCES public.family_members(id),
  requester_note TEXT,
  mindsweep_confidence TEXT CHECK (mindsweep_confidence IN ('high','medium','low')),
  mindsweep_event_id UUID,
  processed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismiss_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sq_family_owner ON public.studio_queue(family_id, owner_id);
CREATE INDEX idx_sq_unprocessed ON public.studio_queue(family_id, owner_id)
  WHERE processed_at IS NULL AND dismissed_at IS NULL;
CREATE INDEX idx_sq_batch ON public.studio_queue(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_sq_destination ON public.studio_queue(destination);

ALTER TABLE public.studio_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sq_manage_own" ON public.studio_queue
  FOR ALL USING (
    owner_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "sq_select_parent" ON public.studio_queue
  FOR SELECT USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- ============================================================
-- Feature Key Seeds (PRD-09A, PRD-09B)
-- ============================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source) VALUES
  ('tasks_basic', 'Tasks', 'Create, view, and complete tasks', 'PRD-09A'),
  ('tasks_views_full', 'Task Views', 'Full task views (board, timeline)', 'PRD-09A'),
  ('tasks_family_assignment', 'Task Assignment', 'Assign tasks to family members', 'PRD-09A'),
  ('tasks_routines', 'Routines', 'Multi-step routine creation and tracking', 'PRD-09A'),
  ('tasks_opportunities', 'Opportunities', 'Competitive task type with claims', 'PRD-09A'),
  ('tasks_sequential', 'Sequential Collections', 'Ordered task chains', 'PRD-09A'),
  ('tasks_task_breaker_text', 'Task Breaker (Text)', 'AI-assisted task breakdown', 'PRD-09A'),
  ('tasks_task_breaker_image', 'Task Breaker (Image)', 'AI task breakdown from photos', 'PRD-09A'),
  ('tasks_templates', 'Task Templates', 'Template library for routines', 'PRD-09A'),
  ('tasks_pomodoro', 'Pomodoro Timer', 'Timer integration for tasks', 'PRD-09A'),
  ('studio_queue', 'Studio Queue', 'Universal item intake queue', 'PRD-17'),
  ('queue_modal', 'Queue Modal', 'Queue processing modal', 'PRD-17'),
  ('queue_quick_mode', 'Quick Queue', 'Quick queue processing', 'PRD-17'),
  ('routing_strip', 'RoutingStrip', 'Universal routing grid component', 'PRD-17'),
  ('queue_batch_processing', 'Batch Processing', 'Process multiple queue items at once', 'PRD-17')
ON CONFLICT (feature_key) DO NOTHING;
