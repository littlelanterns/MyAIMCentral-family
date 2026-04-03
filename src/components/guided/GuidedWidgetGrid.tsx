/**
 * PRD-25: Guided Widget Grid
 * Reuses PRD-10 DashboardGrid with canReorderOnly=true.
 * Guided members can drag-reorder but not resize/delete/create.
 */

import { useCallback, useMemo } from 'react'
import { DashboardGrid } from '@/components/widgets/DashboardGrid'
import { useWidgets, useWidgetFolders, useRecordWidgetData, useUpdateDashboardLayout } from '@/hooks/useWidgets'
import type { WidgetDataPoint } from '@/types/widgets'

const NO_OP = () => {}

interface GuidedWidgetGridProps {
  familyId: string
  memberId: string
}

export function GuidedWidgetGrid({ familyId, memberId }: GuidedWidgetGridProps) {
  const { data: widgets = [] } = useWidgets(familyId, memberId)
  const { data: folders = [] } = useWidgetFolders(familyId, memberId)
  const recordData = useRecordWidgetData()
  const updateLayout = useUpdateDashboardLayout()

  const dataPointsByWidget = useMemo<Record<string, WidgetDataPoint[]>>(() => ({}), [])

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
      onOpenWidgetPicker={NO_OP}
      onOpenWidgetDetail={NO_OP}
      onOpenWidgetConfig={NO_OP}
      onOpenFolder={NO_OP}
      onRemoveWidget={NO_OP}
      onResizeWidget={NO_OP}
      onUpdateLayout={handleUpdateLayout}
      canEdit={false}
      canReorderOnly={true}
      layoutMode="manual"
      onLayoutModeChange={NO_OP}
    />
  )
}
