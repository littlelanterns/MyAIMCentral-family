// PRD-14C: Family Overview config hook
// Reads and writes family_overview_configs for member selection, column order,
// section order, collapse states, and calendar preferences.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

// ─── Section keys ────────────────────────────────────────────────────────────

export const FAMILY_OVERVIEW_SECTION_KEYS = [
  'events',
  'tasks',
  'best_intentions',
  'trackers',
  'weekly_completion',
  'opportunities',
  'victories',
] as const

export type FamilyOverviewSectionKey = (typeof FAMILY_OVERVIEW_SECTION_KEYS)[number]

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
