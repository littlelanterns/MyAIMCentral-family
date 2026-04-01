/**
 * PRD-25: Guided Widget Grid
 * Reuses PRD-10 DashboardGrid with canReorderOnly=true.
 * Guided members can drag-reorder but not resize/delete/create.
 */

import { useCallback } from 'react'
import { DashboardGrid } from '@/components/widgets/DashboardGrid'
import { useWidgets, useWidgetFolders, useRecordWidgetData, useUpdateDashboardLayout } from '@/hooks/useWidgets'
import type { WidgetDataPoint } from '@/types/widgets'

interface GuidedWidgetGridProps {
  familyId: string
  memberId: string
}

export function GuidedWidgetGrid({ familyId, memberId }: GuidedWidgetGridProps) {
  const { data: widgets = [] } = useWidgets(familyId, memberId)
  const { data: folders = [] } = useWidgetFolders(familyId, memberId)
  const recordData = useRecordWidgetData()
  const updateLayout = useUpdateDashboardLayout()

  const dataPointsByWidget: Record<string, WidgetDataPoint[]> = {}

  const handleRecordData = useCallback(
    (widgetId: string, value: number, metadata?: Record<string, unknown>) => {
      recordData.mutate({
        family_id: familyId,
        widget_id: widgetId,
        family_member_id: memberId,
        value,
        metadata,
      })
    },
    [recordData, familyId, memberId]
  )

  const handleUpdateLayout = useCallback(
    (updates: { id: string; position_x: number; position_y: number; sort_order: number }[]) => {
      updateLayout.mutate(updates)
    },
    [updateLayout]
  )

  if (widgets.length === 0) {
    return null // No widgets assigned — hide section entirely
  }

  return (
    <DashboardGrid
      widgets={widgets}
      folders={folders}
      dataPointsByWidget={dataPointsByWidget}
      onRecordData={handleRecordData}
      onOpenWidgetPicker={() => {}} // Guided: no picker access
      onOpenWidgetDetail={() => {}} // Guided: no detail view
      onOpenWidgetConfig={() => {}} // Guided: no config access
      onOpenFolder={() => {}}
      onRemoveWidget={() => {}} // Guided: cannot remove
      onResizeWidget={() => {}} // Guided: cannot resize
      onUpdateLayout={handleUpdateLayout}
      canEdit={false}
      canReorderOnly={true}
      layoutMode="manual"
      onLayoutModeChange={() => {}}
    />
  )
}
