/**
 * PRD-14: Dashboard section key constants and types.
 * Sections are data-driven entries in dashboard_configs.layout.sections JSONB.
 */

// ─── Section Keys ────────────────────────────────────────────

export const SECTION_KEYS = {
  GREETING: 'greeting',
  CALENDAR: 'calendar',
  ACTIVE_TASKS: 'active_tasks',
  WIDGET_GRID: 'widget_grid',
  // PRD-25: Guided Dashboard section keys
  BEST_INTENTIONS: 'best_intentions',
  NEXT_BEST_THING: 'next_best_thing',
  CELEBRATE: 'celebrate',
} as const

export type SectionKey = (typeof SECTION_KEYS)[keyof typeof SECTION_KEYS]

// ─── Section Config ──────────────────────────────────────────

export interface SectionConfig {
  key: SectionKey
  order: number
  visible: boolean
  collapsed: boolean
}

// ─── Section Metadata ────────────────────────────────────────

export interface SectionMeta {
  key: SectionKey
  label: string
  icon: string // Lucide icon name
  collapsible: boolean
  hideable: boolean
  draggable: boolean
}

export const SECTION_META: Record<SectionKey, SectionMeta> = {
  greeting: {
    key: 'greeting',
    label: 'Greeting',
    icon: 'hand-wave',
    collapsible: false,
    hideable: false,
    draggable: false,
  },
  calendar: {
    key: 'calendar',
    label: 'Calendar',
    icon: 'calendar',
    collapsible: true,
    hideable: true,
    draggable: true,
  },
  active_tasks: {
    key: 'active_tasks',
    label: 'Tasks',
    icon: 'check-square',
    collapsible: true,
    hideable: true,
    draggable: true,
  },
  widget_grid: {
    key: 'widget_grid',
    label: 'Trackers & Widgets',
    icon: 'layout-grid',
    collapsible: true,
    hideable: true,
    draggable: true,
  },
  // PRD-25: Guided Dashboard sections
  best_intentions: {
    key: 'best_intentions',
    label: 'Best Intentions',
    icon: 'heart',
    collapsible: true,
    hideable: false,
    draggable: true,
  },
  next_best_thing: {
    key: 'next_best_thing',
    label: 'Next Best Thing',
    icon: 'sparkles',
    collapsible: false,
    hideable: false,
    draggable: true,
  },
  celebrate: {
    key: 'celebrate',
    label: 'Celebrate',
    icon: 'trophy',
    collapsible: true,
    hideable: true,
    draggable: true,
  },
}

// ─── Default Sections ────────────────────────────────────────

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: 'greeting', order: 0, visible: true, collapsed: false },
  { key: 'calendar', order: 1, visible: true, collapsed: false },
  { key: 'active_tasks', order: 2, visible: true, collapsed: false },
  { key: 'widget_grid', order: 3, visible: true, collapsed: false },
]

// ─── Helpers ─────────────────────────────────────────────────

/** Get sections from layout JSONB, falling back to defaults */
export function getSections(layout: Record<string, unknown> | null | undefined): SectionConfig[] {
  if (!layout) return DEFAULT_SECTIONS
  const sections = layout.sections as SectionConfig[] | undefined
  if (!Array.isArray(sections) || sections.length === 0) return DEFAULT_SECTIONS
  // Ensure all keys are present (in case new sections were added after user's config was saved)
  const existing = new Set(sections.map(s => s.key))
  const merged = [...sections]
  for (const def of DEFAULT_SECTIONS) {
    if (!existing.has(def.key)) {
      merged.push({ ...def, order: merged.length })
    }
  }
  return merged.sort((a, b) => a.order - b.order)
}

/** Update a single section field and return the full updated array */
export function updateSection(
  sections: SectionConfig[],
  key: SectionKey,
  updates: Partial<SectionConfig>
): SectionConfig[] {
  return sections.map(s => s.key === key ? { ...s, ...updates } : s)
}

/** Reorder sections by moving a key from one position to another */
export function reorderSections(
  sections: SectionConfig[],
  activeKey: SectionKey,
  overKey: SectionKey
): SectionConfig[] {
  const arr = [...sections]
  const fromIdx = arr.findIndex(s => s.key === activeKey)
  const toIdx = arr.findIndex(s => s.key === overKey)
  if (fromIdx === -1 || toIdx === -1) return sections
  const [moved] = arr.splice(fromIdx, 1)
  arr.splice(toIdx, 0, moved)
  // Re-assign order values
  return arr.map((s, i) => ({ ...s, order: i }))
}
