// Types for PRD-28 Sub-phase B: Homework subject config + time logging

export type TimeAllocationMode = 'full' | 'weighted' | 'strict'
export type LogSource = 'task_completed' | 'child_report' | 'manual_entry' | 'timer_session'
export type LogStatus = 'pending' | 'confirmed' | 'rejected'

export interface HomeschoolSubject {
  id: string
  family_id: string
  name: string
  default_weekly_hours: number | null // nullable: targets are opt-in
  icon_key: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TermBreak {
  name: string
  start_date: string // YYYY-MM-DD
  end_date: string   // YYYY-MM-DD
}

export interface HomeschoolConfig {
  id: string
  family_id: string
  family_member_id: string | null // NULL = family-wide default
  time_allocation_mode: TimeAllocationMode
  allow_subject_overlap: boolean
  subject_hour_overrides: Record<string, number> // subject_id -> weekly_hours
  school_year_start: string | null // YYYY-MM-DD
  school_year_end: string | null
  term_breaks: TermBreak[]
  created_at: string
  updated_at: string
}

export interface HomeschoolTimeLog {
  id: string
  family_id: string
  family_member_id: string
  subject_id: string
  task_id: string | null
  log_date: string // YYYY-MM-DD
  minutes_logged: number
  allocation_mode_used: TimeAllocationMode
  source: LogSource
  source_reference_id: string | null
  status: LogStatus
  description: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

// Computed display type for the Log Learning widget
export interface SubjectProgress {
  subject: HomeschoolSubject
  minutesLogged: number
  targetMinutes: number | null // null when no target set — count-only display
}

// Form data for the Log Learning modal
export interface LogLearningInput {
  description: string
  minutes: number | null // null when using timer (populated on timer completion)
  subject_ids: string[]
  also_add_victory: boolean
  timer_session_id: string | null // populated when [Use Timer] was used
}

// Resolved config after applying child override → family default → system default
export interface ResolvedHomeschoolConfig {
  time_allocation_mode: TimeAllocationMode
  allow_subject_overlap: boolean
  subject_hour_overrides: Record<string, number>
  school_year_start: string | null
  school_year_end: string | null
  term_breaks: TermBreak[]
}

// Display labels
export const TIME_ALLOCATION_MODE_LABELS: Record<TimeAllocationMode, { label: string; description: string }> = {
  full: { label: 'Full', description: 'Every subject gets full session time' },
  weighted: { label: 'Weighted', description: 'Time allocated proportionally (can exceed session)' },
  strict: { label: 'Strict', description: 'Time divided to match actual session duration' },
}

// Suggested default subjects — shipped with NULL targets
export const SUGGESTED_SUBJECTS: { name: string; icon_key: string }[] = [
  { name: 'Math', icon_key: 'Calculator' },
  { name: 'Reading / Language Arts', icon_key: 'BookOpen' },
  { name: 'Science', icon_key: 'FlaskConical' },
  { name: 'History & Geography', icon_key: 'Globe' },
  { name: 'Art', icon_key: 'Palette' },
  { name: 'Music', icon_key: 'Music' },
  { name: 'Physical Education', icon_key: 'Dumbbell' },
]
