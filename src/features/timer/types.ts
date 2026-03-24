/**
 * Universal Timer Types (PRD-36)
 */

export type TimerMode = 'clock' | 'pomodoro_focus' | 'pomodoro_break' | 'stopwatch' | 'countdown'
export type VisualTimerStyle = 'sand_timer' | 'hourglass' | 'thermometer' | 'arc' | 'filling_jar'

export interface TimeSession {
  id: string
  family_id: string
  family_member_id: string
  started_by: string
  task_id: string | null
  widget_id: string | null
  list_item_id: string | null
  source_type: string | null
  source_reference_id: string | null
  timer_mode: TimerMode
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  is_standalone: boolean
  standalone_label: string | null
  pomodoro_interval_number: number | null
  pomodoro_config: PomodoroConfig | null
  countdown_target_minutes: number | null
  auto_paused: boolean
  edited: boolean
  edited_by: string | null
  edited_at: string | null
  original_timestamps: { started_at: string; ended_at: string } | null
  edit_reason: string | null
  deleted_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface PomodoroConfig {
  focus_minutes: number
  short_break_minutes: number
  long_break_minutes: number
  intervals_before_long_break: number
}

export interface TimerConfig {
  id: string
  family_id: string
  family_member_id: string
  timer_visible: boolean
  idle_reminder_minutes: number
  idle_repeat_minutes: number
  auto_pause_minutes: number
  pomodoro_focus_minutes: number
  pomodoro_short_break_minutes: number
  pomodoro_long_break_minutes: number
  pomodoro_intervals_before_long: number
  pomodoro_break_required: boolean
  can_start_standalone: boolean
  visual_timer_style: VisualTimerStyle
  show_time_as_numbers: boolean
  bubble_position: { x: string; y: string }
  created_at: string
  updated_at: string
}

export interface ActiveTimer {
  session: TimeSession
  /** Client-computed elapsed seconds since started_at */
  elapsed: number
  /** For countdown: remaining seconds */
  remaining: number | null
  /** Display label */
  label: string
}

export const DEFAULT_POMODORO_CONFIG: PomodoroConfig = {
  focus_minutes: 25,
  short_break_minutes: 5,
  long_break_minutes: 15,
  intervals_before_long_break: 4,
}
