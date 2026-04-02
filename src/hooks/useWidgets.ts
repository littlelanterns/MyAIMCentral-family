// PRD-10: Widgets, Trackers & Dashboard Layout — core widget hook
// Covers CRUD for dashboard_widgets, widget_data_points, dashboard_widget_folders

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  DashboardWidget,
  DashboardWidgetFolder,
  WidgetDataPoint,
  WidgetStarterConfig,
  CreateWidget,
  UpdateWidget,
  CreateWidgetDataPoint,
  WidgetSize,
} from '@/types/widgets'

// ============================================================
// useWidgets — list widgets for a member's dashboard
// ============================================================

export function useWidgets(familyId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['widgets', familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return []
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .is('archived_at', null)
        .eq('is_on_dashboard', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as DashboardWidget[]
    },
    enabled: !!familyId && !!memberId,
  })
}

// ============================================================
// useAllFamilyWidgets — mom sees all family widgets
// ============================================================

export function useAllFamilyWidgets(familyId: string | undefined) {
  return useQuery({
    queryKey: ['widgets', 'family', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('family_id', familyId)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as DashboardWidget[]
    },
    enabled: !!familyId,
  })
}

// ============================================================
// useWidgetFolders — folders for a member's dashboard
// ============================================================

export function useWidgetFolders(familyId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['widget-folders', familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return []
      const { data, error } = await supabase
        .from('dashboard_widget_folders')
        .select('*')
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as DashboardWidgetFolder[]
    },
    enabled: !!familyId && !!memberId,
  })
}

// ============================================================
// useWidgetData — time-series data for a widget
// ============================================================

export function useWidgetData(
  widgetId: string | undefined,
  options?: { days?: number }
) {
  const days = options?.days ?? 30
  return useQuery({
    queryKey: ['widget-data', widgetId, days],
    queryFn: async () => {
      if (!widgetId) return []
      const since = new Date()
      since.setDate(since.getDate() - days)

      const { data, error } = await supabase
        .from('widget_data_points')
        .select('*')
        .eq('widget_id', widgetId)
        .gte('recorded_at', since.toISOString())
        .order('recorded_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as WidgetDataPoint[]
    },
    enabled: !!widgetId,
  })
}

// ============================================================
// useWidgetStarterConfigs — browse seed starter configs
// ============================================================

export function useWidgetStarterConfigs() {
  return useQuery({
    queryKey: ['widget-starter-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('widget_starter_configs')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as WidgetStarterConfig[]
    },
  })
}

// ============================================================
// Mutations
// ============================================================

export function useCreateWidget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (widget: CreateWidget) => {
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .insert({
          ...widget,
          size: widget.size ?? 'medium',
          position_x: widget.position_x ?? 0,
          position_y: widget.position_y ?? 0,
          widget_config: widget.widget_config ?? {},
          data_source_ids: widget.data_source_ids ?? [],
        })
        .select()
        .single()
      if (error) throw error
      return data as DashboardWidget
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['widgets', data.family_id] })
    },
  })
}

export function useUpdateWidget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateWidget & { id: string }) => {
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as DashboardWidget
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['widgets', data.family_id] })
    },
  })
}

export function useDeleteWidget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, familyId }: { id: string; familyId: string }) => {
      // Soft delete via archived_at
      const { error } = await supabase
        .from('dashboard_widgets')
        .update({ archived_at: new Date().toISOString(), is_on_dashboard: false })
        .eq('id', id)
      if (error) throw error
      return { id, familyId }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['widgets', data.familyId] })
    },
  })
}

export function useRecordWidgetData() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dataPoint: CreateWidgetDataPoint) => {
      const { data, error } = await supabase
        .from('widget_data_points')
        .insert({
          ...dataPoint,
          value_type: dataPoint.value_type ?? 'increment',
          metadata: dataPoint.metadata ?? {},
        })
        .select()
        .single()
      if (error) throw error

      // Activity log entry (fire-and-forget) — enriches data for victory scan
      const widgetLabel = (dataPoint.metadata as Record<string, unknown>)?.widget_name ?? 'Tracker'
      supabase
        .from('activity_log_entries')
        .insert({
          family_id: dataPoint.family_id,
          member_id: dataPoint.family_member_id,
          event_type: 'tracker_entry',
          source_table: 'widget_data_points',
          source_id: data.id,
          source_reference_id: dataPoint.widget_id,
          display_text: `Tracked: ${widgetLabel} (${dataPoint.value})`,
          metadata: { widget_id: dataPoint.widget_id, value: dataPoint.value },
        })
        .then(({ error: logErr }) => {
          if (logErr) console.warn('activity log insert failed:', logErr.message)
        })

      return data as WidgetDataPoint
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['widget-data', data.widget_id] })
    },
  })
}

export function useUpdateDashboardLayout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      updates: { id: string; position_x: number; position_y: number; sort_order: number; size?: WidgetSize }[]
    ) => {
      // Batch update widget positions
      const promises = updates.map(({ id, ...rest }) =>
        supabase
          .from('dashboard_widgets')
          .update(rest)
          .eq('id', id)
      )
      const results = await Promise.all(promises)
      const firstError = results.find(r => r.error)?.error
      if (firstError) throw firstError
      return updates
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['widgets'] })
    },
  })
}

// ============================================================
// Folder mutations
// ============================================================

export function useCreateWidgetFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (folder: { family_id: string; family_member_id: string; name?: string }) => {
      const { data, error } = await supabase
        .from('dashboard_widget_folders')
        .insert({ ...folder, name: folder.name ?? 'Folder' })
        .select()
        .single()
      if (error) throw error
      return data as DashboardWidgetFolder
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['widget-folders', data.family_id] })
    },
  })
}

export function useUpdateWidgetFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; sort_order?: number }) => {
      const { data, error } = await supabase
        .from('dashboard_widget_folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as DashboardWidgetFolder
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['widget-folders', data.family_id] })
    },
  })
}

export function useDeleteWidgetFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, familyId }: { id: string; familyId: string }) => {
      // First ungroup all widgets in this folder
      await supabase
        .from('dashboard_widgets')
        .update({ folder_id: null })
        .eq('folder_id', id)
      // Then delete the folder
      const { error } = await supabase
        .from('dashboard_widget_folders')
        .delete()
        .eq('id', id)
      if (error) throw error
      return { id, familyId }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['widget-folders', data.familyId] })
      qc.invalidateQueries({ queryKey: ['widgets', data.familyId] })
    },
  })
}
