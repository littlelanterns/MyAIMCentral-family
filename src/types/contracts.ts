export type ContractSourceType =
  | 'task_completion'
  | 'routine_step_completion'
  | 'list_item_completion'
  | 'intention_iteration'
  | 'widget_data_point'
  | 'tracker_widget_event'
  | 'time_session_ended'
  | 'scheduled_occurrence_active'
  | 'opportunity_claimed'
  | 'randomizer_drawn'

export type ContractIfPattern =
  | 'every_time'
  | 'every_nth'
  | 'on_threshold_cross'
  | 'above_daily_floor'
  | 'above_window_floor'
  | 'within_date_range'
  | 'streak'
  | 'calendar'

export type GodmotherType =
  | 'allowance_godmother'
  | 'numerator_godmother'
  | 'money_godmother'
  | 'points_godmother'
  | 'prize_godmother'
  | 'victory_godmother'
  | 'family_victory_godmother'
  | 'custom_reward_godmother'
  | 'assign_task_godmother'
  | 'recognition_godmother'
  | 'creature_godmother'
  | 'page_unlock_godmother'
  | 'coloring_reveal_godmother'
  | 'widget_data_point_godmother'

export type StrokeOf =
  | 'immediate'
  | 'end_of_day'
  | 'end_of_week'
  | 'end_of_period'
  | 'at_specific_time'
  | 'custom'

export type PresentationMode =
  | 'silent'
  | 'toast'
  | 'reveal_animation'
  | 'treasure_box'
  | 'coloring_advance'

export type InheritanceLevel = 'family_default' | 'kid_override' | 'deed_override'
export type OverrideMode = 'replace' | 'add' | 'remove'
export type ContractStatus = 'active' | 'recently_deleted' | 'archived'

export interface Contract {
  id: string
  family_id: string
  created_by: string
  created_at: string
  updated_at: string
  status: ContractStatus
  deleted_at: string | null
  archived_at: string | null

  source_type: ContractSourceType
  source_id: string | null
  source_category: string | null
  family_member_id: string | null

  if_pattern: ContractIfPattern
  if_n: number | null
  if_floor: number | null
  if_window_kind: 'day' | 'week' | 'month' | null
  if_window_starts_at: string | null
  if_window_ends_at: string | null
  if_calendar_pattern: Record<string, unknown> | null
  if_offset: number

  godmother_type: GodmotherType
  godmother_config_id: string | null
  payload_amount: number | null
  payload_text: string | null
  payload_config: Record<string, unknown> | null

  stroke_of: StrokeOf
  stroke_of_time: string | null
  recurrence_details: Record<string, unknown> | null

  inheritance_level: InheritanceLevel
  override_mode: OverrideMode

  presentation_mode: PresentationMode
  presentation_config: Record<string, unknown> | null
}

export interface ContractGrantLog {
  id: string
  family_id: string
  deed_firing_id: string
  contract_id: string
  godmother_type: string
  status: 'granted' | 'no_op' | 'failed' | 'deferred'
  grant_reference: string | null
  error_message: string | null
  metadata: Record<string, unknown>
  created_at: string
  family_member_id: string | null
  presentation_mode: PresentationMode | null
  animation_slug: string | null
  revealed_at: string | null
}

export interface PendingReveal {
  id: string
  presentation_mode: PresentationMode
  animation_slug: string | null
  godmother_type: string
  metadata: Record<string, unknown>
  created_at: string
}
