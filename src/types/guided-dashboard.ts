/**
 * PRD-25: Guided Dashboard types
 * Types for the Guided member dashboard experience (ages 8-12)
 */

// ─── Guided Dashboard Preferences ──────────────────────────

export interface GuidedDashboardPreferences {
  // Reading Support
  reading_support_enabled: boolean
  // Spelling & Grammar Coaching
  spelling_coaching_enabled: boolean
  // Reflections (Phase B)
  reflections_in_drawer: boolean
  reflections_in_celebration: boolean
  reflection_prompts: number[]
  reflection_custom_prompts: Array<{ id: string; text: string }>
  reflection_daily_count: number
  // Next Best Thing
  nbt_last_suggestion_index: number
  nbt_last_suggestion_date: string // ISO date string, reset daily
  // Graduation (Post-MVP)
  graduation_tutorial_completed: boolean
  // Task view
  guided_task_view_default: 'simple_list' | 'now_next_optional'
  // Best Intentions
  child_can_create_best_intentions: boolean
  // LiLa tools (future)
  lila_homework_enabled: boolean
  lila_communication_coach_enabled: boolean
}

export const GUIDED_PREFERENCES_DEFAULTS: GuidedDashboardPreferences = {
  reading_support_enabled: false,
  spelling_coaching_enabled: true,
  reflections_in_drawer: false,
  reflections_in_celebration: false,
  reflection_prompts: [28, 29, 30, 31, 32],
  reflection_custom_prompts: [],
  reflection_daily_count: 1,
  nbt_last_suggestion_index: 0,
  nbt_last_suggestion_date: '',
  graduation_tutorial_completed: false,
  guided_task_view_default: 'simple_list',
  child_can_create_best_intentions: false,
  lila_homework_enabled: false,
  lila_communication_coach_enabled: false,
}

// ─── Guided Section Keys ───────────────────────────────────

export const GUIDED_SECTION_KEYS = [
  'greeting',
  'best_intentions',
  'next_best_thing',
  'calendar',
  'active_tasks',
  'widget_grid',
  'celebrate',
] as const

export type GuidedSectionKey = (typeof GUIDED_SECTION_KEYS)[number]

export interface GuidedSectionConfig {
  key: GuidedSectionKey
  order: number
  visible: boolean
  collapsed: boolean
}

/** Sections that mom cannot hide */
export const GUIDED_UNHIDEABLE_SECTIONS: GuidedSectionKey[] = [
  'greeting',
  'next_best_thing',
  'best_intentions',
]

/** Default section order for new Guided dashboards */
export const GUIDED_DEFAULT_SECTIONS: GuidedSectionConfig[] = GUIDED_SECTION_KEYS.map(
  (key, i) => ({
    key,
    visible: true,
    collapsed: false,
    order: i,
  })
)

// ─── NBT Suggestion Types ──────────────────────────────────

export type NBTSuggestionType =
  | 'overdue_task'
  | 'active_routine'
  | 'time_block'
  | 'mom_priority'
  | 'next_due'
  | 'opportunity'
  | 'unscheduled'
  | 'best_intention'

export interface NBTSuggestion {
  id: string
  type: NBTSuggestionType
  title: string
  subtitle?: string
  aiGlaze?: string
  navigateTo?: string
  entityId?: string
  entityType?: 'task' | 'routine' | 'opportunity' | 'intention'
  pointValue?: number
}

// ─── Section Helpers ───────────────────────────────────────

/** Get sections from layout JSONB, falling back to guided defaults */
export function getGuidedSections(
  layout: Record<string, unknown> | null | undefined
): GuidedSectionConfig[] {
  if (!layout) return GUIDED_DEFAULT_SECTIONS
  const sections = layout.sections as GuidedSectionConfig[] | undefined
  if (!Array.isArray(sections) || sections.length === 0) return GUIDED_DEFAULT_SECTIONS
  // Ensure all guided keys are present
  const existing = new Set(sections.map(s => s.key))
  const merged = [...sections]
  for (const def of GUIDED_DEFAULT_SECTIONS) {
    if (!existing.has(def.key)) {
      merged.push({ ...def, order: merged.length })
    }
  }
  return merged.sort((a, b) => a.order - b.order)
}

/** Reorder guided sections */
export function reorderGuidedSections(
  sections: GuidedSectionConfig[],
  activeKey: GuidedSectionKey,
  overKey: GuidedSectionKey
): GuidedSectionConfig[] {
  const arr = [...sections]
  const fromIdx = arr.findIndex(s => s.key === activeKey)
  const toIdx = arr.findIndex(s => s.key === overKey)
  if (fromIdx === -1 || toIdx === -1) return sections
  const [moved] = arr.splice(fromIdx, 1)
  arr.splice(toIdx, 0, moved)
  return arr.map((s, i) => ({ ...s, order: i }))
}
