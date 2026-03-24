-- MyAIM Central v2 — Migration 023: PRD-09A Full Task Schema
-- Alters all task tables to match PRD-09A exactly.
-- Does NOT create a task_queue table — studio_queue (PRD-17) is the authoritative intake.
-- References: PRD-09A, PRD-17, UNRESOLVED_CROSS_PRD_ACTIONS.md (PRD-09A section)

-- ============================================================
-- SECTION 1: task_templates — add all missing PRD-09A columns
-- ============================================================

-- The existing migration created: id, family_id, created_by, title, description,
-- task_type, config, is_system, timestamps.
-- PRD-09A names the column template_name and has a richer task_type CHECK.
-- We rename title→template_name via a new column + populate strategy to avoid data loss.

-- Add template_name as alias (title already exists; keep both for compat)
-- Actually: PRD-09A uses template_name. We ADD it and keep title for backward compat.
ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS template_name TEXT,
  ADD COLUMN IF NOT EXISTS template_type TEXT,
  ADD COLUMN IF NOT EXISTS duration_estimate TEXT,
  ADD COLUMN IF NOT EXISTS life_area_tag TEXT,
  ADD COLUMN IF NOT EXISTS default_reward_type TEXT,
  ADD COLUMN IF NOT EXISTS default_reward_amount DECIMAL,
  ADD COLUMN IF NOT EXISTS default_bonus_threshold INTEGER NOT NULL DEFAULT 85,
  ADD COLUMN IF NOT EXISTS require_approval BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS incomplete_action TEXT NOT NULL DEFAULT 'auto_reschedule',
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS max_completions INTEGER,
  ADD COLUMN IF NOT EXISTS claim_lock_duration INTEGER,
  ADD COLUMN IF NOT EXISTS claim_lock_unit TEXT,
  ADD COLUMN IF NOT EXISTS sequential_active_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sequential_promotion TEXT NOT NULL DEFAULT 'immediate',
  ADD COLUMN IF NOT EXISTS display_mode TEXT NOT NULL DEFAULT 'collapsed',
  ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_deployed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Backfill template_name from title for existing rows
UPDATE public.task_templates SET template_name = title WHERE template_name IS NULL;
-- Set template_type from task_type for existing rows
UPDATE public.task_templates SET template_type = task_type WHERE template_type IS NULL;

-- Make template_name NOT NULL after backfill
ALTER TABLE public.task_templates ALTER COLUMN template_name SET NOT NULL;
ALTER TABLE public.task_templates ALTER COLUMN template_type SET NOT NULL;

-- Add CHECK constraints
ALTER TABLE public.task_templates
  DROP CONSTRAINT IF EXISTS task_templates_task_type_check;

ALTER TABLE public.task_templates
  ADD CONSTRAINT task_templates_task_type_check
  CHECK (task_type IN ('task','routine','opportunity','habit'));

ALTER TABLE public.task_templates
  ADD CONSTRAINT task_templates_template_type_check
  CHECK (template_type IN ('task','routine','opportunity_repeatable','opportunity_claimable','opportunity_capped','sequential','habit'));

ALTER TABLE public.task_templates
  ADD CONSTRAINT task_templates_incomplete_action_check
  CHECK (incomplete_action IN ('fresh_reset','auto_reschedule','drop_after_date','reassign_until_complete','require_decision','escalate_to_parent'));

ALTER TABLE public.task_templates
  ADD CONSTRAINT task_templates_sequential_promotion_check
  CHECK (sequential_promotion IN ('immediate','next_day','manual'));

ALTER TABLE public.task_templates
  ADD CONSTRAINT task_templates_display_mode_check
  CHECK (display_mode IN ('collapsed','expanded'));

ALTER TABLE public.task_templates
  ADD CONSTRAINT task_templates_claim_lock_unit_check
  CHECK (claim_lock_unit IS NULL OR claim_lock_unit IN ('hours','days','weeks'));

ALTER TABLE public.task_templates
  ADD CONSTRAINT task_templates_duration_estimate_check
  CHECK (duration_estimate IS NULL OR duration_estimate IN ('5min','10min','15min','30min','45min','1hr','1.5hr','2hr','half_day','full_day','custom'));

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_tt_type_family ON public.task_templates(family_id, template_type);
CREATE INDEX IF NOT EXISTS idx_tt_created_by ON public.task_templates(family_id, created_by);
CREATE INDEX IF NOT EXISTS idx_tt_archived ON public.task_templates(family_id, archived_at) WHERE archived_at IS NULL;

-- ============================================================
-- SECTION 2: task_template_sections — add missing PRD-09A columns
-- ============================================================

-- Existing: id, template_id, title, sort_order, created_at
-- PRD-09A uses section_name (= title OK), plus frequency_rule, frequency_days, show_until_complete, updated_at

ALTER TABLE public.task_template_sections
  ADD COLUMN IF NOT EXISTS section_name TEXT,
  ADD COLUMN IF NOT EXISTS frequency_rule TEXT NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS frequency_days TEXT[],
  ADD COLUMN IF NOT EXISTS show_until_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill section_name from title
UPDATE public.task_template_sections SET section_name = title WHERE section_name IS NULL;
ALTER TABLE public.task_template_sections ALTER COLUMN section_name SET NOT NULL;

ALTER TABLE public.task_template_sections
  ADD CONSTRAINT tts_frequency_rule_check
  CHECK (frequency_rule IN ('daily','weekdays','weekly','monthly','custom'));

-- Add updated_at trigger
DROP TRIGGER IF EXISTS trg_tts_updated_at ON public.task_template_sections;
CREATE TRIGGER trg_tts_updated_at
  BEFORE UPDATE ON public.task_template_sections
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- Ordered sections index
CREATE INDEX IF NOT EXISTS idx_tts_template_sort ON public.task_template_sections(template_id, sort_order);

-- ============================================================
-- SECTION 3: task_template_steps — add missing PRD-09A columns
-- ============================================================

-- Existing: id, section_id, title, sort_order, created_at
-- PRD-09A uses step_name (= title OK), step_notes, instance_count, require_photo, updated_at

ALTER TABLE public.task_template_steps
  ADD COLUMN IF NOT EXISTS step_name TEXT,
  ADD COLUMN IF NOT EXISTS step_notes TEXT,
  ADD COLUMN IF NOT EXISTS instance_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS require_photo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill step_name from title
UPDATE public.task_template_steps SET step_name = title WHERE step_name IS NULL;
ALTER TABLE public.task_template_steps ALTER COLUMN step_name SET NOT NULL;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS trg_ttst_updated_at ON public.task_template_steps;
CREATE TRIGGER trg_ttst_updated_at
  BEFORE UPDATE ON public.task_template_steps
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- Ordered steps index
CREATE INDEX IF NOT EXISTS idx_ttst_section_sort ON public.task_template_steps(section_id, sort_order);

-- ============================================================
-- SECTION 4: tasks — add all missing PRD-09A columns and fix CHECKs
-- ============================================================

-- Existing columns: id, family_id, created_by, assignee_id, template_id, title,
-- description, task_type, status, priority, due_date, due_time, life_area_tag,
-- points_override, related_plan_id, source, recurrence_details, timestamps.
--
-- Missing per PRD-09A (after addenda from UNRESOLVED_CROSS_PRD_ACTIONS.md):
--   task_type CHECK needs expanded values
--   status CHECK needs 'pending_approval' (PRD-09A Screen 8)
--   recurrence_rule TEXT (simple schedule picker value)
--   parent_task_id (Task Breaker subtasks)
--   task_breaker_level
--   sequential_collection_id
--   sequential_position
--   sequential_is_active
--   max_completions
--   claim_lock_duration
--   claim_lock_unit
--   is_shared
--   incomplete_action
--   require_approval
--   duration_estimate
--   image_url
--   victory_flagged
--   completion_note
--   completed_at
--   source_reference_id
--   related_intention_id
--   focus_time_seconds (PRD-09A Pomodoro)
--   archived_at
--   eisenhower_quadrant, frog_rank, importance_level, big_rock, ivy_lee_rank
--   abcde_category, moscow_category, impact_effort, kanban_status, sort_order
--   time_tracking_enabled (PRD-36 Addendum #1)
--   time_threshold_minutes (PRD-36 Addendum #2)

-- Drop ALL constraints first for idempotency (some may already exist from partial runs)
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_incomplete_action_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_breaker_level_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_claim_lock_unit_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_eisenhower_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_importance_level_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_abcde_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_moscow_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_impact_effort_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_kanban_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_source_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_duration_estimate_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_recurrence_rule_check;

-- Step 1: recreate task_type CHECK with expanded enum
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_task_type_check
  CHECK (task_type IN ('task','routine','opportunity_repeatable','opportunity_claimable','opportunity_capped','sequential','habit'));

-- Step 2: drop and recreate status CHECK with pending_approval
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('pending','in_progress','completed','pending_approval','cancelled','paused'));

-- Step 3: add all missing columns
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
  ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS task_breaker_level TEXT,
  ADD COLUMN IF NOT EXISTS sequential_collection_id UUID REFERENCES public.sequential_collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sequential_position INTEGER,
  ADD COLUMN IF NOT EXISTS sequential_is_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_completions INTEGER,
  ADD COLUMN IF NOT EXISTS claim_lock_duration INTEGER,
  ADD COLUMN IF NOT EXISTS claim_lock_unit TEXT,
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS incomplete_action TEXT NOT NULL DEFAULT 'auto_reschedule',
  ADD COLUMN IF NOT EXISTS require_approval BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duration_estimate TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS victory_flagged BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completion_note TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_reference_id UUID,
  ADD COLUMN IF NOT EXISTS related_intention_id UUID REFERENCES public.best_intentions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS focus_time_seconds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  -- View framework metadata
  ADD COLUMN IF NOT EXISTS eisenhower_quadrant TEXT,
  ADD COLUMN IF NOT EXISTS frog_rank INTEGER,
  ADD COLUMN IF NOT EXISTS importance_level TEXT,
  ADD COLUMN IF NOT EXISTS big_rock BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ivy_lee_rank INTEGER,
  ADD COLUMN IF NOT EXISTS abcde_category TEXT,
  ADD COLUMN IF NOT EXISTS moscow_category TEXT,
  ADD COLUMN IF NOT EXISTS impact_effort TEXT,
  ADD COLUMN IF NOT EXISTS kanban_status TEXT DEFAULT 'to_do',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  -- Timer integration (PRD-36 addenda)
  ADD COLUMN IF NOT EXISTS time_tracking_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS time_threshold_minutes INTEGER;

-- Add CHECK constraints for new columns
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_incomplete_action_check
  CHECK (incomplete_action IN ('fresh_reset','auto_reschedule','drop_after_date','reassign_until_complete','require_decision','escalate_to_parent'));

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_task_breaker_level_check
  CHECK (task_breaker_level IS NULL OR task_breaker_level IN ('quick','detailed','granular'));

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_claim_lock_unit_check
  CHECK (claim_lock_unit IS NULL OR claim_lock_unit IN ('hours','days','weeks'));

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_eisenhower_check
  CHECK (eisenhower_quadrant IS NULL OR eisenhower_quadrant IN ('do_now','schedule','delegate','eliminate'));

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_importance_level_check
  CHECK (importance_level IS NULL OR importance_level IN ('critical_1','important_3','small_5'));

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_abcde_check
  CHECK (abcde_category IS NULL OR abcde_category IN ('a','b','c','d','e'));

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_moscow_check
  CHECK (moscow_category IS NULL OR moscow_category IN ('must','should','could','wont'));

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_impact_effort_check
  CHECK (impact_effort IS NULL OR impact_effort IN ('high_impact_low_effort','high_impact_high_effort','low_impact_low_effort','low_impact_high_effort'));

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_kanban_check
  CHECK (kanban_status IS NULL OR kanban_status IN ('to_do','in_progress','done'));

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_source_check
  CHECK (source IN ('manual','template_deployed','lila_conversation','notepad_routed','review_route','meeting_action','goal_decomposition','project_planner','member_request','sequential_promoted','recurring_generated'));

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_duration_estimate_check
  CHECK (duration_estimate IS NULL OR duration_estimate IN ('5min','10min','15min','30min','45min','1hr','1.5hr','2hr','half_day','full_day','custom'));

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_recurrence_rule_check
  CHECK (recurrence_rule IS NULL OR recurrence_rule IN ('daily','weekdays','weekly','biweekly','monthly','yearly','completion_dependent','custody','custom'));

-- Add missing indexes from PRD-09A
CREATE INDEX IF NOT EXISTS idx_tasks_status_due ON public.tasks(family_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON public.tasks(family_id, task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_template ON public.tasks(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_sequential ON public.tasks(sequential_collection_id, sequential_position) WHERE sequential_collection_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_source ON public.tasks(family_id, source);
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON public.tasks(family_id, archived_at) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_intention ON public.tasks(related_intention_id) WHERE related_intention_id IS NOT NULL;

-- ============================================================
-- SECTION 5: task_assignments — add missing PRD-09A columns
-- ============================================================

-- Existing: id, task_id, member_id (was family_member_id in PRD), assigned_by, created_at
-- PRD-09A uses family_member_id; existing migration used member_id — we add family_member_id as alias
-- and add: assigned_at, start_date, end_date, rotation_position, is_active, updated_at

ALTER TABLE public.task_assignments
  ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES public.family_members(id),
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS rotation_position INTEGER,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill family_member_id from member_id
UPDATE public.task_assignments SET family_member_id = member_id WHERE family_member_id IS NULL AND member_id IS NOT NULL;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS trg_ta_updated_at ON public.task_assignments;
CREATE TRIGGER trg_ta_updated_at
  BEFORE UPDATE ON public.task_assignments
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- Add indexes from PRD-09A
CREATE INDEX IF NOT EXISTS idx_ta_task_active ON public.task_assignments(task_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ta_member_active ON public.task_assignments(member_id, is_active);

-- ============================================================
-- SECTION 6: task_completions — add missing PRD-09A columns
-- ============================================================

-- Existing: id, task_id, member_id, completed_at, evidence, approved_by, approval_status
-- PRD-09A uses family_member_id; existing uses member_id.
-- Need: completion_note, photo_url, approved_at, rejected BOOLEAN, rejection_note, period_date

ALTER TABLE public.task_completions
  ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES public.family_members(id),
  ADD COLUMN IF NOT EXISTS completion_note TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_note TEXT,
  ADD COLUMN IF NOT EXISTS period_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Backfill family_member_id from member_id
UPDATE public.task_completions SET family_member_id = member_id WHERE family_member_id IS NULL AND member_id IS NOT NULL;

-- Add indexes from PRD-09A
CREATE INDEX IF NOT EXISTS idx_tc_task_period ON public.task_completions(task_id, period_date);
CREATE INDEX IF NOT EXISTS idx_tc_member_period ON public.task_completions(member_id, period_date);

-- ============================================================
-- SECTION 7: routine_step_completions — add missing PRD-09A columns
-- ============================================================

-- Existing: id, task_id, step_id, member_id, completed_at
-- PRD-09A uses family_member_id; need: instance_number, period_date, photo_url

ALTER TABLE public.routine_step_completions
  ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES public.family_members(id),
  ADD COLUMN IF NOT EXISTS instance_number INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS period_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Backfill family_member_id from member_id
UPDATE public.routine_step_completions SET family_member_id = member_id WHERE family_member_id IS NULL AND member_id IS NOT NULL;

-- Add indexes from PRD-09A
CREATE INDEX IF NOT EXISTS idx_rsc_task_member_date ON public.routine_step_completions(task_id, member_id, period_date);
CREATE INDEX IF NOT EXISTS idx_rsc_step_member_date ON public.routine_step_completions(step_id, member_id, period_date, instance_number);

-- ============================================================
-- SECTION 8: sequential_collections — add missing PRD-09A columns
-- ============================================================

-- Existing: id, family_id, title, task_ids, current_index, timestamps
-- PRD-09A needs: template_id, total_items, active_count, promotion_timing,
--               life_area_tag, reward_per_item_type, reward_per_item_amount

ALTER TABLE public.sequential_collections
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_items INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS promotion_timing TEXT NOT NULL DEFAULT 'immediate',
  ADD COLUMN IF NOT EXISTS life_area_tag TEXT,
  ADD COLUMN IF NOT EXISTS reward_per_item_type TEXT,
  ADD COLUMN IF NOT EXISTS reward_per_item_amount DECIMAL;

-- Backfill total_items from task_ids array length for existing rows
UPDATE public.sequential_collections
  SET total_items = array_length(task_ids, 1)
  WHERE total_items = 0 AND task_ids IS NOT NULL;

ALTER TABLE public.sequential_collections
  ADD CONSTRAINT sc_promotion_timing_check
  CHECK (promotion_timing IN ('immediate','next_day','manual'));

CREATE INDEX IF NOT EXISTS idx_sc_template ON public.sequential_collections(template_id) WHERE template_id IS NOT NULL;

-- ============================================================
-- SECTION 9: task_claims — add missing PRD-09A columns and rename claimed_by
-- ============================================================

-- Existing: id, task_id, member_id, claimed_at, status CHECK('claimed','completed','released')
-- PRD-09A uses claimed_by (not member_id), and needs: expires_at, completed BOOLEAN,
--   released BOOLEAN, released_at
-- We keep member_id for backward compat and add claimed_by as alias + new columns.

ALTER TABLE public.task_claims
  ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES public.family_members(id),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS released BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;

-- Backfill claimed_by from member_id
UPDATE public.task_claims SET claimed_by = member_id WHERE claimed_by IS NULL AND member_id IS NOT NULL;

-- Update status CHECK — keep backward compat
ALTER TABLE public.task_claims DROP CONSTRAINT IF EXISTS task_claims_status_check;
ALTER TABLE public.task_claims
  ADD CONSTRAINT task_claims_status_check
  CHECK (status IN ('claimed','completed','released'));

-- Add indexes from PRD-09A
CREATE INDEX IF NOT EXISTS idx_tcl_task_active ON public.task_claims(task_id, completed, released);
CREATE INDEX IF NOT EXISTS idx_tcl_claimed_active ON public.task_claims(claimed_by, completed) WHERE claimed_by IS NOT NULL;

-- ============================================================
-- SECTION 10: activity_log_entries — add PRD-09A-specific columns
-- ============================================================

-- Existing: id, family_id, member_id, event_type, source_table, source_id, metadata, created_at
-- PRD-09A needs: display_text, description, photo_url, source, source_reference_id,
--               shift_session_id, hidden

ALTER TABLE public.activity_log_entries
  ADD COLUMN IF NOT EXISTS display_text TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_reference_id UUID,
  ADD COLUMN IF NOT EXISTS shift_session_id UUID,
  ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false;

-- Backfill display_text from event_type for existing rows that have no display_text
UPDATE public.activity_log_entries
  SET display_text = event_type
  WHERE display_text IS NULL;

-- ============================================================
-- SECTION 11: feature_key_registry — add missing task keys from PRD-09A
-- ============================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source) VALUES
  ('tasks_rotation', 'Rotating Assignments', 'Cycle tasks through multiple assignees on a schedule', 'PRD-09A'),
  ('tasks_approval_workflows', 'Task Approval', 'Require parent approval before task counts as complete', 'PRD-09A'),
  ('tasks_queue', 'Task Queue', 'Task Creation Queue for processing drafts', 'PRD-09A'),
  ('tasks_teen_studio', 'Teen Studio Access', 'Teen access to Studio for self-customization', 'PRD-09A')
ON CONFLICT (feature_key) DO NOTHING;
