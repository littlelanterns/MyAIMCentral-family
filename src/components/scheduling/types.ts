/**
 * Universal Scheduler Types (PRD-35)
 *
 * Defines the RRULE JSONB output format, internal state, and component props.
 */

// ─── RRULE JSONB Output Format (PRD-35 authoritative) ───────────────────

export interface SchedulerOutput {
  /** RFC 5545 RRULE string, e.g. "FREQ=WEEKLY;BYDAY=TU,WE,TH,FR". Null for custody/completion-dependent. */
  rrule: string | null
  /** DTSTART for the recurrence rule (ISO 8601) */
  dtstart: string
  /** UNTIL date (ISO 8601) or null for ongoing */
  until: string | null
  /** Number of occurrences, or null */
  count: number | null
  /** Exception dates to skip (ISO date strings) */
  exdates: string[]
  /** Additional dates to include (ISO date strings) */
  rdates: string[]
  /** IANA timezone identifier */
  timezone: string
  /** Schedule type discriminator */
  schedule_type: 'fixed' | 'completion_dependent' | 'custody' | 'painted'
  /** Completion-dependent config (only when schedule_type = 'completion_dependent') */
  completion_dependent: CompletionDependentConfig | null
  /** Custody pattern config (only when schedule_type = 'custody') */
  custody_pattern: CustodyPatternConfig | null
  /** Per-date assignee map. Keys are ISO date strings, values are arrays of family_member_id UUIDs. */
  assignee_map?: Record<string, string[]> | null
  /** Time-of-day window start (HH:MM, family timezone). When set, deed firing happens at this time. */
  active_start_time?: string | null
  /** Time-of-day window end (HH:MM, family timezone). */
  active_end_time?: string | null
  /** @deprecated Promoted to top-level column on tasks/lists. Kept temporarily for serialization compat. */
  instantiation_mode?: 'per_assignee_instance' | 'shared_anyone_completes' | null
}

export interface CompletionDependentConfig {
  interval: number
  unit: 'days' | 'weeks' | 'months'
  /** Due window start (days/weeks/months after completion) */
  window_start: number | null
  /** Due window end (days/weeks/months after completion) */
  window_end: number | null
  /** Anchor date for first occurrence */
  anchor_date: string
}

export interface CustodyPatternConfig {
  /** Array of 'A' or 'B' representing the repeating pattern */
  pattern: string[]
  /** Anchor date for pattern start */
  anchor_date: string
  /** Labels for each side */
  labels: { A: string; B: string }
}

// ─── Component Props ────────────────────────────────────────────────────

export type FrequencyType = 'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'pick_dates'

export interface UniversalSchedulerProps {
  /** Current value (RRULE JSONB) */
  value: SchedulerOutput | null
  /** Called when schedule changes */
  onChange: (value: SchedulerOutput) => void
  /** Show time picker by default (true for calendar/meetings, false for tasks) */
  showTimeDefault?: boolean
  /** Compact mode: day-of-week circles only, no advanced options, no calendar preview */
  compactMode?: boolean
  /** Restrict available frequency types */
  allowedFrequencies?: FrequencyType[]
  /** Family timezone (defaults to America/Chicago) */
  timezone?: string
  /** Week start day: 0=Sunday (default), 1=Monday. Passed to WeekdayCircles and MiniCalendarPicker. */
  weekStartDay?: 0 | 1
}

// ─── Internal State ─────────────────────────────────────────────────────

export type MonthlyMode = 'weekday' | 'date'
export type YearlyMode = 'date' | 'weekday'
export type UntilMode = 'ongoing' | 'date' | 'count'
export type AdvancedMode = 'alternating' | 'custody' | 'seasonal' | 'completion_dependent'
export type CustomUnit = 'days' | 'weeks' | 'months' | 'years'
export type CompletionUnit = 'days' | 'weeks' | 'months'

export interface WeekdayRow {
  id: string
  ordinal: number // 1=1st, 2=2nd, 3=3rd, 4=4th, 5=Last
  weekday: number // 0=SU, 1=MO, ... 6=SA
}

export interface SeasonalRange {
  id: string
  from: string
  to: string
  yearly: boolean
}

export interface SchedulerState {
  frequency: FrequencyType
  // One-time
  oneTimeDate: string
  // Weekly
  selectedDays: number[] // 0=SU, 1=MO, ... 6=SA
  // Monthly
  monthlyMode: MonthlyMode
  monthlyWeekdays: WeekdayRow[]
  monthlyDates: number[] // 1-31, -1 for last
  // Yearly
  selectedMonths: number[] // 1-12
  yearlyMode: YearlyMode
  yearlyDates: number[]
  yearlyWeekdays: WeekdayRow[]
  // Custom
  customInterval: number
  customUnit: CustomUnit
  // Advanced
  advancedMode: AdvancedMode | null
  alternatingAnchor: string
  weekADays: number[]
  weekBDays: number[]
  custodyPattern: string[]
  custodyAnchor: string
  custodyLabels: { A: string; B: string }
  seasonalRanges: SeasonalRange[]
  completionInterval: number
  completionUnit: CompletionUnit
  completionWindowEnabled: boolean
  completionWindowStart: number
  completionWindowEnd: number
  completionAnchor: string
  // Pick Dates (painted calendar)
  paintedDates: string[]
  assigneeMap: Record<string, string[]>
  activeStartTime: string
  activeEndTime: string
  showTimeWindow: boolean
  instantiationMode: 'per_assignee_instance' | 'shared_anyone_completes'
  // Time
  showTime: boolean
  time: string
  // Schedule Until
  untilMode: UntilMode
  untilDate: string
  untilCount: number
  // Exceptions
  exdates: string[]
  rdates: string[]
  schoolYearOnly: boolean
}

// ─── Reducer Actions ────────────────────────────────────────────────────

export type SchedulerAction =
  | { type: 'SET_FREQUENCY'; frequency: FrequencyType }
  | { type: 'SET_ONE_TIME_DATE'; date: string }
  | { type: 'TOGGLE_DAY'; day: number }
  | { type: 'SET_MONTHLY_MODE'; mode: MonthlyMode }
  | { type: 'ADD_MONTHLY_WEEKDAY' }
  | { type: 'UPDATE_MONTHLY_WEEKDAY'; id: string; ordinal?: number; weekday?: number }
  | { type: 'REMOVE_MONTHLY_WEEKDAY'; id: string }
  | { type: 'TOGGLE_MONTHLY_DATE'; date: number }
  | { type: 'TOGGLE_MONTH'; month: number }
  | { type: 'SET_YEARLY_MODE'; mode: YearlyMode }
  | { type: 'ADD_YEARLY_WEEKDAY' }
  | { type: 'UPDATE_YEARLY_WEEKDAY'; id: string; ordinal?: number; weekday?: number }
  | { type: 'REMOVE_YEARLY_WEEKDAY'; id: string }
  | { type: 'TOGGLE_YEARLY_DATE'; date: number }
  | { type: 'SET_CUSTOM_INTERVAL'; interval: number }
  | { type: 'SET_CUSTOM_UNIT'; unit: CustomUnit }
  | { type: 'SET_ADVANCED_MODE'; mode: AdvancedMode | null }
  | { type: 'SET_ALTERNATING_ANCHOR'; date: string }
  | { type: 'TOGGLE_WEEK_A_DAY'; day: number }
  | { type: 'TOGGLE_WEEK_B_DAY'; day: number }
  | { type: 'SET_CUSTODY_PATTERN'; pattern: string[] }
  | { type: 'TOGGLE_CUSTODY_DAY'; index: number }
  | { type: 'SET_CUSTODY_ANCHOR'; date: string }
  | { type: 'SET_CUSTODY_LABELS'; labels: { A: string; B: string } }
  | { type: 'ADD_SEASONAL_RANGE' }
  | { type: 'UPDATE_SEASONAL_RANGE'; id: string; field: 'from' | 'to' | 'yearly'; value: string | boolean }
  | { type: 'REMOVE_SEASONAL_RANGE'; id: string }
  | { type: 'SET_COMPLETION_INTERVAL'; interval: number }
  | { type: 'SET_COMPLETION_UNIT'; unit: CompletionUnit }
  | { type: 'TOGGLE_COMPLETION_WINDOW' }
  | { type: 'SET_COMPLETION_WINDOW_START'; value: number }
  | { type: 'SET_COMPLETION_WINDOW_END'; value: number }
  | { type: 'SET_COMPLETION_ANCHOR'; date: string }
  | { type: 'TOGGLE_TIME' }
  | { type: 'SET_TIME'; time: string }
  | { type: 'SET_UNTIL_MODE'; mode: UntilMode }
  | { type: 'SET_UNTIL_DATE'; date: string }
  | { type: 'SET_UNTIL_COUNT'; count: number }
  | { type: 'ADD_EXDATE'; date: string }
  | { type: 'REMOVE_EXDATE'; date: string }
  | { type: 'ADD_RDATE'; date: string }
  | { type: 'REMOVE_RDATE'; date: string }
  | { type: 'TOGGLE_SCHOOL_YEAR_ONLY' }
  | { type: 'TOGGLE_PAINTED_DATE'; date: string }
  | { type: 'SET_PAINTED_DATES'; dates: string[] }
  | { type: 'SET_ASSIGNEE_MAP'; map: Record<string, string[]> }
  | { type: 'SET_DATE_ASSIGNEES'; date: string; memberIds: string[] }
  | { type: 'SET_ACTIVE_START_TIME'; time: string }
  | { type: 'SET_ACTIVE_END_TIME'; time: string }
  | { type: 'TOGGLE_TIME_WINDOW' }
  | { type: 'SET_INSTANTIATION_MODE'; mode: 'per_assignee_instance' | 'shared_anyone_completes' }
  | { type: 'LOAD_FROM_OUTPUT'; output: SchedulerOutput }

// ─── Constants ──────────────────────────────────────────────────────────

export const DAY_LABELS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'] as const
export const DAY_LABELS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
export const MONTH_LABELS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const
export const ORDINAL_LABELS = ['1st', '2nd', '3rd', '4th', 'Last'] as const
export const ORDINAL_VALUES = [1, 2, 3, 4, 5] as const

export const CUSTODY_PRESETS: Record<string, string[]> = {
  '2-2-3': ['A','A','B','B','A','A','A','B','B','A','A','B','B','B'],
  '5-2-5-2': ['A','A','A','A','A','B','B','B','B','B','B','B','A','A'],
  'week_on_off': ['A','A','A','A','A','A','A','B','B','B','B','B','B','B'],
}
