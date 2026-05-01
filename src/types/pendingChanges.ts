export type PendingChangeSourceType =
  | 'routine_template' | 'routine_section' | 'routine_step'
  | 'list' | 'list_item'
  | 'sequential_collection' | 'sequential_item'

export type ChangeCategory = 'display' | 'structural' | 'capability' | 'schedule'

export type TriggerMode = 'manual_apply' | 'schedule_activation' | 'scheduled_date'

export interface PendingChange {
  id: string
  family_id: string
  source_type: PendingChangeSourceType
  source_id: string
  change_category: ChangeCategory
  change_payload: Record<string, unknown>
  trigger_mode: TriggerMode
  trigger_at: string | null
  affected_deployment_ids: string[] | null
  affected_member_ids: string[] | null
  created_by: string
  created_at: string
  updated_at: string
  applied_at: string | null
  cancelled_at: string | null
  batch_id: string | null
}

export interface CreatePendingChangeInput {
  source_type: PendingChangeSourceType
  source_id: string
  change_category: ChangeCategory
  change_payload: Record<string, unknown>
  trigger_mode: TriggerMode
  trigger_at?: string | null
  affected_deployment_ids?: string[]
  affected_member_ids?: string[]
  batch_id?: string
}
