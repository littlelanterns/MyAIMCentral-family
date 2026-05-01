import type { ChangeCategory } from '@/types/pendingChanges'

const STRUCTURAL_FIELDS = new Set([
  'sections', 'sort_order', 'step_type', 'linked_source_id',
  'linked_source_type', 'active_count', 'promotion_timing',
  'total_items',
])

const SCHEDULE_FIELDS = new Set([
  'frequency_rule', 'frequency_days', 'recurrence_details',
  'recurrence_rule', 'due_date', 'due_time', 'schedule_config',
])

const CAPABILITY_FIELDS = new Set([
  'counts_for_allowance', 'counts_for_homework', 'counts_for_gamification',
  'victory_flagged', 'require_approval', 'advancement_mode',
  'practice_target', 'require_mastery_approval', 'require_mastery_evidence',
  'track_duration', 'track_progress', 'reward_type', 'reward_amount',
  'is_shared', 'instantiation_mode', 'collaboration_mode',
])

export const DISPLAY_FIELDS = new Set([
  'title', 'description', 'notes', 'step_notes',
  'display_name_override', 'section_name', 'content', 'template_name',
])

export function classifyChangeCategory(changedFields: string[]): ChangeCategory {
  let hasStructural = false
  let hasSchedule = false
  let hasCapability = false

  for (const field of changedFields) {
    if (STRUCTURAL_FIELDS.has(field)) hasStructural = true
    else if (SCHEDULE_FIELDS.has(field)) hasSchedule = true
    else if (CAPABILITY_FIELDS.has(field)) hasCapability = true
  }

  if (hasStructural) return 'structural'
  if (hasSchedule) return 'schedule'
  if (hasCapability) return 'capability'
  return 'display'
}
