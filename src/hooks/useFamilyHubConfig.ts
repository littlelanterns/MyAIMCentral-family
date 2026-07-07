/**
 * useFamilyHubConfig — PRD-14D Family Hub
 *
 * CRUD for family_hub_configs table (one row per family).
 * Auto-creates default config on first Hub access (upsert pattern).
 * Also ensures a dashboard_configs row exists for the Hub widget grid.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FamilyHubConfig {
  id: string
  family_id: string
  hub_title: string | null
  theme_override: string | null
  section_order: string[]
  section_visibility: Record<string, boolean>
  victory_settings: {
    show_count?: boolean
    include_teens?: boolean
    celebrate_pin_required?: boolean
  }
  slideshow_config: Record<string, unknown>
  tv_config: Record<string, unknown> | null
  hub_pin: string | null
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

export const HUB_SECTION_KEYS = [
  'family_calendar',
  'family_vision',
  'family_best_intentions',
  'family_goals',
  'victories_summary',
  'countdowns',
  'widget_grid',
] as const

export type HubSectionKey = (typeof HUB_SECTION_KEYS)[number]

export const DEFAULT_SECTION_ORDER: string[] = [...HUB_SECTION_KEYS]

/**
 * FAMILY-GOALS-PRIZES: merge a saved section_order with the registered key
 * set (mirrors src/hooks/useFamilyOverviewConfig.ts's mergeSectionOrder,
 * Convention #178 pattern). The saved order is preserved; any registered key
 * missing from it (e.g. 'family_goals' added after the row was saved) is
 * grafted in at its canonical position — right after the nearest preceding
 * default-order key present in the saved array. Read-time only; never
 * rewrites the stored row.
 */
export function mergeSectionOrder(saved: string[]): string[] {
  if (saved.length === 0) return [...HUB_SECTION_KEYS]
  const merged = [...saved]
  for (let i = 0; i < HUB_SECTION_KEYS.length; i++) {
    const key = HUB_SECTION_KEYS[i]
    if (merged.includes(key)) continue
    let insertAt = 0
    for (let j = i - 1; j >= 0; j--) {
      const prev = HUB_SECTION_KEYS[j]
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

// ─── Read hook ──────────────────────────────────────────────────────────────

export function useFamilyHubConfig(familyId: string | undefined) {
  return useQuery({
    queryKey: ['family-hub-config', familyId],
    queryFn: async () => {
      if (!familyId) return null
      const { data, error } = await supabase
        .from('family_hub_configs')
        .select('*')
        .eq('family_id', familyId)
        .maybeSingle()
      if (error) throw error
      return data as FamilyHubConfig | null
    },
    enabled: !!familyId,
  })
}

// ─── Upsert mutation ────────────────────────────────────────────────────────

export function useUpdateFamilyHubConfig() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      familyId: string
      hubTitle?: string | null
      themeOverride?: string | null
      sectionOrder?: string[]
      sectionVisibility?: Record<string, boolean>
      victorySettings?: Record<string, unknown>
      slideshowConfig?: Record<string, unknown>
      hubPin?: string | null
      preferences?: Record<string, unknown>
    }) => {
      const {
        familyId,
        hubTitle,
        themeOverride,
        sectionOrder,
        sectionVisibility,
        victorySettings,
        slideshowConfig,
        hubPin,
        preferences,
      } = params

      const updates: Record<string, unknown> = {}
      if (hubTitle !== undefined) updates.hub_title = hubTitle
      if (themeOverride !== undefined) updates.theme_override = themeOverride
      if (sectionOrder !== undefined) updates.section_order = sectionOrder
      if (sectionVisibility !== undefined) updates.section_visibility = sectionVisibility
      if (victorySettings !== undefined) updates.victory_settings = victorySettings
      if (slideshowConfig !== undefined) updates.slideshow_config = slideshowConfig
      if (hubPin !== undefined) updates.hub_pin = hubPin
      if (preferences !== undefined) updates.preferences = preferences

      const { data, error } = await supabase
        .from('family_hub_configs')
        .upsert(
          {
            family_id: familyId,
            ...updates,
          },
          { onConflict: 'family_id' }
        )
        .select()
        .single()

      if (error) throw error
      return data as FamilyHubConfig
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['family-hub-config', data.family_id] })
    },
  })
}

// ─── Ensure Hub dashboard_configs exists ─────────────────────────────────────

export function useEnsureHubDashboardConfig(familyId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['hub-dashboard-config', familyId],
    queryFn: async () => {
      if (!familyId || !memberId) return null

      // Check if hub dashboard config exists
      const { data: existing } = await supabase
        .from('dashboard_configs')
        .select('id')
        .eq('family_id', familyId)
        .eq('dashboard_type', 'family_hub')
        .maybeSingle()

      if (existing) return existing

      // Auto-create for mom
      const { data: created, error } = await supabase
        .from('dashboard_configs')
        .insert({
          family_id: familyId,
          family_member_id: memberId,
          dashboard_type: 'family_hub',
          layout: { sections: [], widgets: [] },
          preferences: {},
        })
        .select('id')
        .single()

      if (error) throw error
      return created
    },
    enabled: !!familyId && !!memberId,
    staleTime: Infinity,
  })
}
