// PRD-10 / PRD-14: Dashboard config hook
// Reads and writes dashboard_configs for layout persistence.
// Grid columns are stored in preferences.grid_columns.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface DashboardConfigPreferences {
  grid_columns?: number
  [key: string]: unknown
}

export interface DashboardConfig {
  id: string
  family_id: string
  family_member_id: string
  dashboard_type: string
  layout: Record<string, unknown> | null
  layout_mode: 'auto' | 'manual' | null
  decorations: Record<string, unknown> | null
  preferences: DashboardConfigPreferences | null
  created_at: string
  updated_at: string
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export function useDashboardConfig(
  familyId: string | undefined,
  memberId: string | undefined,
  dashboardType: string = 'personal'
) {
  return useQuery({
    queryKey: ['dashboard-config', familyId, memberId, dashboardType],
    queryFn: async () => {
      if (!familyId || !memberId) return null
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('*')
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .eq('dashboard_type', dashboardType)
        .maybeSingle()
      if (error) throw error
      return data as DashboardConfig | null
    },
    enabled: !!familyId && !!memberId,
  })
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

export function useUpdateDashboardConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      familyId: string
      memberId: string
      dashboardType?: string
      layout?: Record<string, unknown>
      layoutMode?: 'auto' | 'manual'
      preferences?: DashboardConfigPreferences
    }) => {
      const { familyId, memberId, dashboardType = 'personal', layout, layoutMode, preferences } = params

      // Build the update object — only include defined fields
      const updates: Record<string, unknown> = {}
      if (layout !== undefined) updates.layout = layout
      if (layoutMode !== undefined) updates.layout_mode = layoutMode
      if (preferences !== undefined) updates.preferences = preferences

      const { data, error } = await supabase
        .from('dashboard_configs')
        .upsert(
          {
            family_id: familyId,
            family_member_id: memberId,
            dashboard_type: dashboardType,
            ...updates,
          },
          { onConflict: 'family_member_id,dashboard_type' }
        )
        .select()
        .single()

      if (error) throw error
      return data as DashboardConfig
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['dashboard-config', data.family_id, data.family_member_id] })
    },
  })
}
