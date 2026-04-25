// PRD-09A: Tasks, Routines & Opportunities — TypeScript types
// All types match the PRD-09A schema (migration 023) exactly.

// ============================================================
// Enums
// ============================================================

export type TaskType =
  | 'task'
  | 'routine'
  | 'opportunity_repeatable'
  | 'opportunity_claimable'
  | 'opportunity_capped'
  | 'sequential'
  | 'habit'

// Template type has the same values as TaskType (templates are the blueprint)
export type TemplateType = TaskType

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'pending_approval'
  | 'cancelled'
  | 'paused'

export type TaskPriority = 'now' | 'next' | 'optional' | 'someday'

export type IncompleteAction =
  | 'fresh_reset'
  | 'auto_reschedule'
  | 'drop_after_date'
  | 'reassign_until_complete'
  | 'require_decision'
  | 'escalate_to_parent'

export type TaskSource =
  | 'manual'
  | 'template_deployed'
  | 'lila_conversation'
  | 'notepad_routed'
  | 'review_route'
  | 'meeting_action'
  | 'goal_decomposition'
  | 'project_planner'
  | 'member_request'
  | 'sequential_promoted'
  | 'recurring_generated'
  | 'guided_form_assignment'
  | 'list_batch'
  | 'rhythm_priority'
  | 'rhythm_mindsweep_lite'
  | 'randomizer_reveal'
  | 'allowance_makeup'
  | 'opportunity_list_claim'

export type SequentialPromotion = 'immediate' | 'next_day' | 'manual'

export type TaskBreakerLevel = 'quick' | 'detailed' | 'granular'

export type ClaimLockUnit = 'hours' | 'days' | 'weeks'

// ─── Advancement modes (Build J / PRD-09A/09B Linked Steps addendum) ───
export type AdvancementMode = 'complete' | 'practice_count' | 'mastery'
export type MasteryStatus = 'practicing' | 'submitted' | 'approved' | 'rejected'
export type CompletionType = 'complete' | 'practice' | 'mastery_submit'
export type StepType = 'static' | 'linked_sequential' | 'linked_randomizer' | 'linked_task'
export type LinkedSourceType = 'sequential_collection' | 'randomizer_list' | 'recurring_task'

export type DurationEstimate =
  | '5min'
  | '10min'
  | '15min'
  | '30min'
  | '45min'
  | '1hr'
  | '1.5hr'
  | '2hr'
  | 'half_day'
  | 'full_day'
  | 'custom'

export type FrequencyRule = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom'

export type RecurrenceRule =
  | 'daily'
  | 'weekdays'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'yearly'
  | 'completion_dependent'
  | 'custody'
  | 'custom'

// ============================================================
// View Framework Metadata Enums
// ============================================================

export type EisenhowerQuadrant = 'do_now' | 'schedule' | 'delegate' | 'eliminate'

export type ImportanceLevel = 'critical_1' | 'important_3' | 'small_5'

export type AbcdeCategory = 'a' | 'b' | 'c' | 'd' | 'e'

export type MoscowCategory = 'must' | 'should' | 'could' | 'wont'

export type ImpactEffort =
  | 'high_impact_low_effort'
  | 'high_impact_high_effort'
  | 'low_impact_low_effort'
  | 'low_impact_high_effort'

export type KanbanStatus = 'to_do' | 'in_progress' | 'done'

// All supported life area tags (base set; 'custom' used with custom_tag_label)
export type LifeAreaTag =
  | 'spiritual'
  | 'spouse_marriage'
  | 'family'
  | 'career_work'
  | 'home'
  | 'health_physical'
  | 'social'
  | 'financial'
  | 'personal'
  | 'homeschool'
  | 'extracurriculars'
  | 'meal_planning'
  | 'auto_transport'
  | 'digital_tech'
  | 'hobbies'
  | 'custom'

// Reward types for task_rewards
export type RewardType = 'points' | 'money' | 'privilege' | 'custom'

// ============================================================
// View Types (the 13 prioritization views)
// ============================================================

export type TaskViewType =
  | 'simple_list'
  | 'eisenhower'
  | 'eat_the_frog'
  | 'one_three_five'
  | 'big_rocks'
  | 'ivy_lee'
  | 'by_category'
  | 'abcde'
  | 'kanban'
  | 'moscow'
  | 'impact_effort'
  | 'now_next_optional'
  | 'by_member'

// ============================================================
// RRULE JSONB format (PRD-35 / recurrence_details)
// ============================================================

export interface RecurrenceDetails {
  rrule?: string
  dtstart?: string
  until?: string | null
  count?: number | null
  exdates?: string[]
  rdates?: string[]
  timezone?: string
  schedule_type?: 'recurring' | 'custody' | 'always_on'
  completion_dependent?: boolean
  custody_pattern?: string
  // PRD-09A extended fields within recurrence_details JSONB
  days?: string[]           // ['mon','wed','fri']
  end_date?: string         // ISO date
  school_year_only?: boolean
  rotation?: {
    members: string[]       // family_member UUIDs
    current_index: number
    period: 'weekly' | 'biweekly' | 'monthly' | 'custom'
  }
}

// ============================================================
// Table: task_templates
// ============================================================

export interface TaskTemplate {
  id: string
  family_id: string
  created_by: string
  title: string                    // kept for backward compat with migration 008
  template_name: string            // PRD-09A authoritative name field
  template_type: TemplateType
  description: string | null
  duration_estimate: DurationEstimate | null
  life_area_tag: LifeAreaTag | null
  default_reward_type: string | null
  default_reward_amount: number | null
  default_bonus_threshold: number
  require_approval: boolean
  incomplete_action: IncompleteAction
  image_url: string | null
  max_completions: number | null
  claim_lock_duration: number | null
  claim_lock_unit: ClaimLockUnit | null
  sequential_active_count: number
  sequential_promotion: SequentialPromotion
  display_mode: 'collapsed' | 'expanded'
  usage_count: number
  last_deployed_at: string | null
  archived_at: string | null
  config: Record<string, unknown> | null   // legacy field from migration 008
  is_system: boolean
  // PRD-28 NEW-EE: Extra Credit template flag. When true, tasks deployed from
  // this template default to is_extra_credit=true. Mom can toggle per-task.
  is_extra_credit: boolean
  created_at: string
  updated_at: string
}

export type CreateTaskTemplate = Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'last_deployed_at'>

export type UpdateTaskTemplate = Partial<Omit<TaskTemplate, 'id' | 'family_id' | 'created_by' | 'created_at'>>

// ============================================================
// Table: task_template_sections
// ============================================================

export interface TaskTemplateSection {
  id: string
  template_id: string
  title: string                  // backward compat
  section_name: string           // PRD-09A field
  frequency_rule: FrequencyRule
  frequency_days: string[] | null  // ['mon','wed','fri']
  show_until_complete: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type CreateTaskTemplateSection = Omit<TaskTemplateSection, 'id' | 'created_at' | 'updated_at'>

// ============================================================
// Table: task_template_steps
// ============================================================

export interface TaskTemplateStep {
  id: string
  section_id: string
  title: string                  // backward compat
  step_name: string              // PRD-09A field
  step_notes: string | null
  instance_count: number
  require_photo: boolean
  sort_order: number
  // PRD-09A/09B Linked Steps (Build J)
  step_type: StepType
  linked_source_id: string | null
  linked_source_type: LinkedSourceType | null
  display_name_override: string | null
  created_at: string
  updated_at: string
}

export type CreateTaskTemplateStep = Omit<TaskTemplateStep, 'id' | 'created_at' | 'updated_at'>

// ============================================================
// Table: tasks
// ============================================================

export interface Task {
  id: string
  family_id: string
  created_by: string
  assignee_id: string | null       // legacy single-assignee; use task_assignments for multi
  template_id: string | null
  title: string
  description: string | null
  task_type: TaskType
  status: TaskStatus
  priority: TaskPriority | null
  due_date: string | null
  due_time: string | null
  life_area_tag: LifeAreaTag | null
  points_override: number | null
  related_plan_id: string | null
  source: TaskSource
  recurrence_rule: RecurrenceRule | null
  recurrence_details: RecurrenceDetails | null
  // Task Breaker
  parent_task_id: string | null
  task_breaker_level: TaskBreakerLevel | null
  // Sequential
  sequential_collection_id: string | null
  sequential_position: number | null
  sequential_is_active: boolean
  // Opportunity
  max_completions: number | null
  claim_lock_duration: number | null
  claim_lock_unit: ClaimLockUnit | null
  // Config
  is_shared: boolean
  incomplete_action: IncompleteAction
  require_approval: boolean
  duration_estimate: DurationEstimate | null
  image_url: string | null
  victory_flagged: boolean
  completion_note: string | null
  completed_at: string | null
  source_reference_id: string | null
  related_intention_id: string | null
  focus_time_seconds: number
  archived_at: string | null
  // Timer integration (PRD-36 addenda)
  time_tracking_enabled: boolean
  time_threshold_minutes: number | null
  // PRD-09A/09B Linked Steps & Advancement (Build J)
  advancement_mode: AdvancementMode
  practice_target: number | null
  practice_count: number
  mastery_status: MasteryStatus | null
  mastery_submitted_at: string | null
  mastery_approved_by: string | null
  mastery_approved_at: string | null
  require_mastery_approval: boolean
  require_mastery_evidence: boolean
  track_duration: boolean
  resource_url: string | null
  // PRD-24+PRD-26 Build M Sub-phase A — Play task tile icon (soft reference)
  // Lookup at render time against (category='visual_schedule', feature_key, variant)
  icon_asset_key: string | null
  icon_variant: 'A' | 'B' | 'C' | null
  // List-task link (migration 100054) — task wraps a randomizer/list
  linked_list_id: string | null
  list_delivery_mode: 'checklist' | 'batch' | 'sequential' | null
  // Build M Phase 1 — task segment assignment
  task_segment_id: string | null
  // PRD-28: Task-level tracking flags
  counts_for_allowance: boolean
  counts_for_homework: boolean
  counts_for_gamification: boolean
  allowance_points: number | null
  homework_subject_ids: string[]
  // PRD-28 NEW-EE: Extra Credit designation. When counts_for_allowance=true AND
  // is_extra_credit=true, this task contributes to the numerator of allowance
  // completion % but NOT the denominator. Capped at 100%. Gated by
  // allowance_configs.extra_credit_enabled.
  is_extra_credit: boolean
  // View framework metadata
  eisenhower_quadrant: EisenhowerQuadrant | null
  frog_rank: number | null
  importance_level: ImportanceLevel | null
  big_rock: boolean
  ivy_lee_rank: number | null
  abcde_category: AbcdeCategory | null
  moscow_category: MoscowCategory | null
  impact_effort: ImpactEffort | null
  kanban_status: KanbanStatus | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type CreateTask = Pick<Task,
  'family_id' | 'created_by' | 'title' | 'task_type'
> & Partial<Omit<Task, 'id' | 'family_id' | 'created_by' | 'title' | 'task_type' | 'created_at' | 'updated_at'>>

export type UpdateTask = Partial<Omit<Task, 'id' | 'family_id' | 'created_by' | 'created_at'>>

// Task with joined data
export interface TaskWithAssignments extends Task {
  task_assignments?: TaskAssignment[]
  task_completions?: TaskCompletion[]
}

// ============================================================
// Table: task_assignments
// ============================================================

export interface TaskAssignment {
  id: string
  task_id: string
  member_id: string                // legacy column from migration 008
  family_member_id: string | null  // PRD-09A name (populated via migration backfill)
  assigned_by: string
  assigned_at: string
  start_date: string | null
  end_date: string | null
  rotation_position: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreateTaskAssignment = {
  task_id: string
  member_id: string
  assigned_by: string
  start_date?: string | null
  end_date?: string | null
  rotation_position?: number | null
}

// ============================================================
// Table: task_completions
// ============================================================

export interface TaskCompletion {
  id: string
  task_id: string
  member_id: string                // legacy column
  family_member_id: string | null  // PRD-09A name
  completed_at: string
  completion_note: string | null
  photo_url: string | null
  evidence: Record<string, unknown> | null   // legacy field
  approved_by: string | null
  approved_at: string | null
  approval_status: 'pending' | 'approved' | 'rejected' | null
  rejected: boolean
  rejection_note: string | null
  period_date: string
  // PRD-09A/09B Linked Steps (Build J)
  completion_type: CompletionType
  duration_minutes: number | null
  mastery_evidence_url: string | null
  mastery_evidence_note: string | null
  created_at: string
}

export type CreateTaskCompletion = {
  task_id: string
  member_id: string
  period_date: string
  completion_note?: string | null
  photo_url?: string | null
}

// ============================================================
// Table: routine_step_completions
// ============================================================

export interface RoutineStepCompletion {
  id: string
  task_id: string
  step_id: string
  member_id: string                // legacy
  family_member_id: string | null  // PRD-09A name
  instance_number: number
  period_date: string
  completed_at: string
  photo_url: string | null
  created_at: string
}

export type CreateRoutineStepCompletion = {
  task_id: string
  step_id: string
  member_id: string
  instance_number?: number
  period_date: string
  photo_url?: string | null
  /**
   * Optional explicit completed_at. The migration 100157 trigger derives
   * period_date from completed_at in the family's timezone, so passing an
   * explicit completed_at lets mom credit a past-day check (e.g., kid
   * finished just after midnight). When omitted, the column defaults to
   * NOW() and the trigger maps it to today's local date.
   */
  completed_at?: string
}

// ============================================================
// Table: sequential_collections
// ============================================================

export interface SequentialCollection {
  id: string
  family_id: string
  template_id: string | null
  title: string
  task_ids: string[]             // legacy array from migration 008
  total_items: number
  current_index: number          // legacy from migration 008
  active_count: number
  promotion_timing: SequentialPromotion
  life_area_tag: LifeAreaTag | null
  reward_per_item_type: string | null
  reward_per_item_amount: number | null
  // PRD-09A/09B Linked Steps (Build J) — collection-level advancement defaults
  default_advancement_mode: AdvancementMode
  default_practice_target: number | null
  default_require_approval: boolean
  default_require_evidence: boolean
  default_track_duration: boolean
  created_at: string
  updated_at: string
}

// Build J: the new default_* advancement columns have DB defaults, so they are
// optional on create. Legacy callers don't need to pass them; new callers can.
export type CreateSequentialCollection =
  Omit<SequentialCollection, 'id' | 'created_at' | 'updated_at' | 'default_advancement_mode' | 'default_practice_target' | 'default_require_approval' | 'default_require_evidence' | 'default_track_duration'>
  & Partial<Pick<SequentialCollection, 'default_advancement_mode' | 'default_practice_target' | 'default_require_approval' | 'default_require_evidence' | 'default_track_duration'>>

// ============================================================
// Table: task_claims
// ============================================================

export interface TaskClaim {
  id: string
  task_id: string
  member_id: string                // legacy
  claimed_by: string | null        // PRD-09A field (backfilled from member_id)
  claimed_at: string
  expires_at: string | null
  status: 'claimed' | 'completed' | 'released'
  completed: boolean
  released: boolean
  released_at: string | null
  created_at: string
}

export type CreateTaskClaim = {
  task_id: string
  member_id: string
  expires_at: string
}

// ============================================================
// Table: task_rewards (PRD-09A — stub; superseded by PRD-24 for transactions)
// ============================================================

export interface TaskReward {
  id: string
  task_id: string
  reward_type: RewardType
  reward_value: Record<string, unknown>  // legacy from migration 008
  created_at: string
}

// ============================================================
// Table: activity_log_entries (extended by PRD-09A)
// ============================================================

export interface ActivityLogEntry {
  id: string
  family_id: string
  member_id: string
  event_type: string
  display_text: string | null
  description: string | null
  photo_url: string | null
  source: string | null
  source_table: string | null      // legacy field from migration 009
  source_id: string | null         // legacy field
  source_reference_id: string | null
  shift_session_id: string | null
  hidden: boolean
  metadata: Record<string, unknown> | null
  created_at: string
}

export type CreateActivityLogEntry = Omit<ActivityLogEntry, 'id' | 'created_at'>

// ============================================================
// Studio Queue (PRD-17) — for task destination queries
// ============================================================

export interface StudioQueueItem {
  id: string
  family_id: string
  owner_id: string
  destination: string | null
  content: string
  content_details: Record<string, unknown> | null
  source: string
  source_reference_id: string | null
  structure_flag: string | null
  batch_id: string | null
  requester_id: string | null
  requester_note: string | null
  mindsweep_confidence: 'high' | 'medium' | 'low' | null
  mindsweep_event_id: string | null
  processed_at: string | null
  dismissed_at: string | null
  dismiss_note: string | null
  created_at: string
}

export type ProcessQueueItem = {
  id: string
  processed_at?: string
}

export type DismissQueueItem = {
  id: string
  dismiss_note?: string | null
}

// ============================================================
// Filter types used by hooks
// ============================================================

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[]
  assigneeId?: string
  taskType?: TaskType | TaskType[]
  dueDateStart?: string
  dueDateEnd?: string
  lifeAreaTag?: LifeAreaTag
  archived?: boolean
  viewType?: TaskViewType
}

export interface TasksByView {
  view: TaskViewType
  sections: TaskViewSection[]
}

export interface TaskViewSection {
  key: string
  label: string
  tasks: Task[]
  maxItems?: number
}

// ============================================================
// Build J: Linked Steps, Mastery & Practice Advancement
// Tables: practice_log, randomizer_draws
// ============================================================

export type PracticeType = 'practice' | 'mastery_submit'
export type PracticeSourceType = 'sequential_task' | 'randomizer_item'
export type DrawMode = 'focused' | 'buffet' | 'surprise'
export type DrawSource = 'manual' | 'auto_surprise'
export type RandomizerDrawStatus = 'active' | 'completed' | 'mastered' | 'released' | 'submitted'

export interface PracticeLog {
  id: string
  family_id: string
  family_member_id: string
  source_type: PracticeSourceType
  source_id: string           // polymorphic: tasks.id | list_items.id
  draw_id: string | null      // FK randomizer_draws
  practice_type: PracticeType
  duration_minutes: number | null
  evidence_url: string | null
  evidence_note: string | null
  period_date: string
  rejected: boolean
  rejection_note: string | null
  created_at: string
}

export type CreatePracticeLog = {
  family_id: string
  family_member_id: string
  source_type: PracticeSourceType
  source_id: string
  draw_id?: string | null
  practice_type?: PracticeType
  duration_minutes?: number | null
  evidence_url?: string | null
  evidence_note?: string | null
  period_date?: string
}

export interface RandomizerDraw {
  id: string
  list_id: string
  list_item_id: string
  family_member_id: string
  drawn_at: string
  draw_source: DrawSource
  routine_instance_date: string | null
  status: RandomizerDrawStatus
  completed_at: string | null
  practice_count: number
  created_at: string
}

export type CreateRandomizerDraw = {
  list_id: string
  list_item_id: string
  family_member_id: string
  draw_source?: DrawSource
  routine_instance_date?: string | null
}
