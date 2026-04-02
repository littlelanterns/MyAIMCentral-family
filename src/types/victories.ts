// PRD-11: Victory Recorder & Daily Celebration — TypeScript types
// Phase 12A: Core recording, browsing, collection celebration

// ============================================================
// Enums
// ============================================================

export type VictorySource =
  | 'manual'
  | 'task_completed'
  | 'tracker_entry'
  | 'intention_iteration'
  | 'widget_milestone'
  | 'lila_conversation'
  | 'notepad_routed'
  | 'reflection_routed'
  | 'list_item_completed'
  | 'routine_completion'
  | 'reckoning_prompt'
  | 'homeschool_logged'
  | 'plan_completed'
  | 'milestone_completed'
  | 'family_feed'
  | 'bookshelf'

export type VictoryImportance = 'small_win' | 'standard' | 'big_win' | 'major_achievement'

export type MemberType = 'adult' | 'teen' | 'guided' | 'play'

export type CelebrationMode = 'individual' | 'review' | 'collection' | 'monthly'

export type CelebrationPeriod = 'today' | 'this_week' | 'this_month' | 'custom'

// ============================================================
// Table: victories
// ============================================================

export interface Victory {
  id: string
  family_id: string
  family_member_id: string
  description: string
  celebration_text: string | null
  life_area_tag: string | null
  custom_tags: string[]
  source: VictorySource
  source_reference_id: string | null
  recorder_type: string
  member_type: MemberType
  importance: VictoryImportance
  guiding_star_id: string | null
  best_intention_id: string | null
  is_moms_pick: boolean
  moms_pick_note: string | null
  moms_pick_by: string | null
  celebration_voice: string | null
  photo_url: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateVictory {
  family_id: string
  family_member_id: string
  description: string
  life_area_tag?: string | null
  custom_tags?: string[]
  source?: VictorySource
  source_reference_id?: string | null
  member_type: MemberType
  importance?: VictoryImportance
  guiding_star_id?: string | null
  best_intention_id?: string | null
}

export interface UpdateVictory {
  description?: string
  celebration_text?: string | null
  life_area_tag?: string | null
  custom_tags?: string[]
  importance?: VictoryImportance
  guiding_star_id?: string | null
  best_intention_id?: string | null
  is_moms_pick?: boolean
  moms_pick_note?: string | null
  moms_pick_by?: string | null
  archived_at?: string | null
}

// ============================================================
// Table: victory_celebrations
// ============================================================

export interface VictoryCelebration {
  id: string
  family_id: string
  family_member_id: string
  celebration_date: string
  mode: CelebrationMode
  period: CelebrationPeriod | null
  narrative: string
  victory_ids: string[] | null
  victory_count: number
  celebration_voice: string | null
  context_sources: Record<string, unknown>
  created_at: string
}

export interface CreateCelebration {
  family_id: string
  family_member_id: string
  celebration_date?: string
  mode: CelebrationMode
  period?: CelebrationPeriod | null
  narrative: string
  victory_ids?: string[] | null
  victory_count: number
  celebration_voice?: string | null
  context_sources?: Record<string, unknown>
}

// ============================================================
// Table: victory_voice_preferences
// ============================================================

export interface VictoryVoicePreference {
  id: string
  family_id: string
  family_member_id: string
  selected_voice: string
  updated_at: string
}

// ============================================================
// Filter / Query types
// ============================================================

export type VictoryPeriodFilter = 'today' | 'this_week' | 'this_month' | 'all' | 'custom'

export interface VictoryFilters {
  period: VictoryPeriodFilter
  customStart?: string
  customEnd?: string
  lifeAreaTags?: string[]
  specialFilter?: 'best_intentions' | 'guiding_stars' | 'life_lantern' | null
}

// ============================================================
// Edge Function request/response
// ============================================================

export interface CelebrateVictoryRequest {
  family_member_id: string
  mode: 'collection' | 'review' | 'monthly'
  period?: CelebrationPeriod
  victory_ids: string[]
  custom_start?: string
  custom_end?: string
}

export interface CelebrateVictoryResponse {
  narrative: string
  context_sources: Record<string, unknown>
  model_used: string
  token_count: { input: number; output: number }
}

// ============================================================
// Quick-add categories (UI only — maps to life_area_tag)
// ============================================================

export const VICTORY_CATEGORIES = [
  { key: 'helped_someone', label: 'Helped Someone', tag: 'community' },
  { key: 'extra_cleaning', label: 'Extra Cleaning', tag: 'home' },
  { key: 'extra_learning', label: 'Extra Learning', tag: 'education' },
  { key: 'creative_project', label: 'Creative Project', tag: 'creativity' },
  { key: 'act_of_kindness', label: 'Act of Kindness', tag: 'character' },
  { key: 'physical_activity', label: 'Physical Activity', tag: 'health' },
  { key: 'custom', label: 'Custom', tag: null },
] as const

export const IMPORTANCE_OPTIONS: { value: VictoryImportance; label: string }[] = [
  { value: 'small_win', label: 'Small Win' },
  { value: 'standard', label: 'Standard' },
  { value: 'big_win', label: 'Big Win' },
  { value: 'major_achievement', label: 'Major Achievement' },
]

// ============================================================
// Activity scan suggestions (Phase 12B)
// ============================================================

export interface VictorySuggestion {
  description: string
  pattern_note?: string
  life_area_tag: string | null
  guiding_star_id: string | null
  best_intention_id: string | null
  source_log_ids: string[]
}

export interface ScanActivityRequest {
  family_member_id: string
  period: 'today' | 'this_week' | 'this_month' | 'custom'
  custom_start?: string
  custom_end?: string
}

export interface ScanActivityResponse {
  suggestions: VictorySuggestion[]
  model_used: string
  token_count: { input: number; output: number }
}

// Source display mapping for victory cards
export const SOURCE_LABELS: Record<VictorySource, string> = {
  manual: 'Recorded manually',
  task_completed: 'Task completed',
  tracker_entry: 'Tracker entry',
  intention_iteration: 'Best Intention celebrated',
  widget_milestone: 'Widget milestone',
  lila_conversation: 'From LiLa conversation',
  notepad_routed: 'From Notepad',
  reflection_routed: 'From Reflection',
  list_item_completed: 'List item completed',
  routine_completion: 'Routine completed',
  reckoning_prompt: 'What Actually Got Done',
  homeschool_logged: 'Homeschool logged',
  plan_completed: 'Plan completed',
  milestone_completed: 'Milestone completed',
  family_feed: 'Family feed',
  bookshelf: 'From BookShelf',
}
