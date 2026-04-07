// PRD-09B: Lists, Studio & Templates — TypeScript types

export type ListType =
  | 'simple'
  | 'checklist'
  | 'reference'
  | 'template'
  | 'randomizer'
  | 'backburner'
  | 'shopping'
  | 'wishlist'
  | 'expenses'
  | 'packing'
  | 'todo'
  | 'custom'
  | 'ideas'
  | 'prayer'

export type ListItemPriority = 'low' | 'medium' | 'high' | 'urgent' | 'must_have' | 'would_love' | 'nice_to_have'

export type GuidedFormSubtype = 'sodas' | 'what_if' | 'apology_reflection' | 'custom'

export type PoolMode = 'individual' | 'shared'
export type FrequencyPeriod = 'day' | 'week' | 'month'
export type VictoryMode = 'none' | 'item_completed' | 'list_completed' | 'both'

// ─── PRD-09A/09B Linked Steps (Build J) ─── advancement & draw modes
export type AdvancementMode = 'complete' | 'practice_count' | 'mastery'
export type MasteryStatus = 'practicing' | 'submitted' | 'approved' | 'rejected'
export type DrawMode = 'focused' | 'buffet' | 'surprise'

export interface List {
  id: string
  family_id: string
  owner_id: string
  created_by: string | null
  template_id: string | null
  title: string
  list_name: string | null
  list_type: ListType
  description: string | null
  is_shared: boolean
  victory_on_complete: boolean
  victory_mode: VictoryMode
  is_included_in_ai: boolean
  reveal_type: string | null
  max_respins_per_period: number | null
  respin_period: string | null
  tags: string[]
  pool_mode: PoolMode
  eligible_members: string[] | null
  archived_at: string | null
  // Build J — randomizer-only; NULL for other list types
  draw_mode: DrawMode | null
  max_active_draws: number | null
  default_advancement_mode: AdvancementMode | null
  default_practice_target: number | null
  default_require_approval: boolean | null
  default_require_evidence: boolean | null
  default_track_duration: boolean | null
  created_at: string
  updated_at: string
}

export interface ListItem {
  id: string
  list_id: string
  content: string
  item_name: string | null
  checked: boolean
  checked_by: string | null
  checked_at: string | null
  section_name: string | null
  notes: string | null
  url: string | null
  quantity: number | null
  quantity_unit: string | null
  price: number | null
  currency: string
  category: string | null
  item_date: string | null
  priority: ListItemPriority | null
  gift_for: string | null
  victory_flagged: boolean
  promoted_to_task: boolean
  promoted_task_id: string | null
  is_repeatable: boolean
  is_available: boolean
  parent_item_id: string | null
  availability_mode: string | null
  max_instances: number | null        // serves as lifetime_max
  completed_instances: number         // serves as lifetime_completion_count
  recurrence_config: Record<string, unknown> | null
  next_available_at: string | null    // cooldown result timestamp
  frequency_min: number | null
  frequency_max: number | null
  frequency_period: FrequencyPeriod | null
  cooldown_hours: number | null
  last_completed_at: string | null
  period_completion_count: number
  reward_amount: number | null
  sort_order: number
  // PRD-09A/09B Linked Steps (Build J) — advancement + mastery
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
  created_at: string
  updated_at: string
}

export interface ListShare {
  id: string
  list_id: string
  shared_with: string
  member_id: string | null
  permission: 'view' | 'edit'
  is_individual_copy: boolean
  can_edit: boolean
  is_hidden: boolean
  created_at: string
}

export interface ListTemplate {
  id: string
  family_id: string | null
  created_by: string | null
  title: string
  template_name: string | null
  description: string | null
  list_type: ListType
  default_items: ListTemplateItem[]
  is_system: boolean
  usage_count: number
  last_deployed_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string | null
}

export interface ListTemplateItem {
  item_name: string
  section_name?: string
  is_section_header?: boolean
  notes?: string
  quantity?: number
  quantity_unit?: string
  price?: number
  priority?: string
  category?: string
  is_repeatable?: boolean
  url?: string
}

export interface GuidedFormResponse {
  id: string
  family_id: string
  task_id: string
  family_member_id: string
  section_key: string
  response_content: string
  response_metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface GuidedFormSection {
  section_key: string
  section_title: string
  section_prompt: string
  sort_order: number
  filled_by?: 'mom' | 'child'
}

export interface ListItemMemberTracking {
  id: string
  list_item_id: string
  family_member_id: string
  last_completed_at: string | null
  period_completion_count: number
  lifetime_completion_count: number
  created_at: string
  updated_at: string
}

/** AI-suggested frequency rules from bulk add parsing */
export interface FrequencySuggestion {
  item_name: string
  frequency_min: number | null
  frequency_max: number | null
  frequency_period: FrequencyPeriod | null
  cooldown_hours: number | null
  reward_amount: number | null
}

// Create/update helpers
export type CreateList = Pick<List, 'family_id' | 'owner_id' | 'title' | 'list_type'> & {
  description?: string
  tags?: string[]
  is_shared?: boolean
  pool_mode?: PoolMode
  eligible_members?: string[]
}

export type CreateListItem = Pick<ListItem, 'list_id' | 'content'> & {
  section_name?: string
  notes?: string
  url?: string
  quantity?: number
  quantity_unit?: string
  price?: number
  priority?: ListItemPriority
  gift_for?: string
  sort_order?: number
}

export interface ListFilters {
  listType?: ListType | ListType[]
  isShared?: boolean
  ownerId?: string
}
