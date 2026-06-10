// PRD-14C: Family Overview config hook
// Reads and writes family_overview_configs for member selection, column order,
// section order, collapse states, and calendar preferences.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

// ─── Section keys ────────────────────────────────────────────────────────────
// FO-COMMAND-CENTER (2026-06-10): added 'routines' + 'sequential' (registered
// TEXT constants per PRD-14C extensibility — no migration). Default order is
// founder-approved Q5: timeline-bound sections rank higher; Best Intentions
// sits right above Trackers.

export const FAMILY_OVERVIEW_SECTION_KEYS = [
  'events',
  'tasks',
  'routines',
  'sequential',
  'opportunities',
  'best_intentions',
  'trackers',
  'weekly_completion',
  'victories',
] as const

export type FamilyOverviewSectionKey = (typeof FAMILY_OVERVIEW_SECTION_KEYS)[number]

/**
 * Merge a saved section_order with the registered key set: the saved order is
 * preserved; any registered key missing from it (e.g. 'routines'/'sequential'
 * added after the row was saved) is inserted at its canonical position —
 * right after the nearest preceding default-order key present in the saved
 * array. Read-time only; never rewrites the stored row.
 */
export function mergeSectionOrder(saved: string[]): string[] {
  if (saved.length === 0) return [...FAMILY_OVERVIEW_SECTION_KEYS]
  const merged = [...saved]
  for (let i = 0; i < FAMILY_OVERVIEW_SECTION_KEYS.length; i++) {
    const key = FAMILY_OVERVIEW_SECTION_KEYS[i]
    if (merged.includes(key)) continue
    // Find nearest preceding default key already in merged
    let insertAt = 0
    for (let j = i - 1; j >= 0; j--) {
      const prev = FAMILY_OVERVIEW_SECTION_KEYS[j]
      const idx = merged.indexOf(prev)
      if (idx !== -1) {
        insertAt = idx + 1
        break
      }
    }
    merged.splice(insertAt, 0, key)
  }
  return merged
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SectionCollapseState {
  collapsed: boolean
  overrides?: Record<string, boolean> // member_id -> override state
}

export interface FamilyOverviewConfig {
  id: string
  family_id: string
  family_member_id: string
  selected_member_ids: string[]
  column_order: string[]
  section_order: string[]
  section_states: Record<string, SectionCollapseState>
  calendar_collapsed: boolean
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ─── Read ────────────────────────────────────────────────────────────────────

export function useFamilyOverviewConfig(
  familyId: string | undefined,
  memberId: string | undefined
) {
  return useQuery({
    queryKey: ['family-overview-config', familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return null
      const { data, error } = await supabase
        .from('family_overview_configs')
        .select('*')
        .eq('family_member_id', memberId)
        .maybeSingle()
      if (error) throw error
      return data as FamilyOverviewConfig | null
    },
    enabled: !!familyId && !!memberId,
  })
}

// ─── Upsert (general update) ─────────────────────────────────────────────────

export function useUpdateFamilyOverviewConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      familyId: string
      memberId: string
      selectedMemberIds?: string[]
      columnOrder?: string[]
      sectionOrder?: string[]
      sectionStates?: Record<string, SectionCollapseState>
      calendarCollapsed?: boolean
      preferences?: Record<string, unknown>
    }) => {
      const {
        familyId,
        memberId,
        selectedMemberIds,
        columnOrder,
        sectionOrder,
        sectionStates,
        calendarCollapsed,
        preferences,
      } = params

      const updates: Record<string, unknown> = {}
      if (selectedMemberIds !== undefined) updates.selected_member_ids = selectedMemberIds
      if (columnOrder !== undefined) updates.column_order = columnOrder
      if (sectionOrder !== undefined) updates.section_order = sectionOrder
      if (sectionStates !== undefined) updates.section_states = sectionStates
      if (calendarCollapsed !== undefined) updates.calendar_collapsed = calendarCollapsed
      if (preferences !== undefined) updates.preferences = preferences

      const { data, error } = await supabase
        .from('family_overview_configs')
        .upsert(
          {
            family_id: familyId,
            family_member_id: memberId,
            ...updates,
          },
          { onConflict: 'family_member_id' }
        )
        .select()
        .single()

      if (error) throw error
      return data as FamilyOverviewConfig
    },
    onSuccess: (data) => {
      qc.invalidateQueries({
        queryKey: ['family-overview-config', data.family_id, data.family_member_id],
      })
    },
  })
}
