// PRD-10: Folder Overlay Modal — shows all widgets in a folder
// Opened when a WidgetFolderCard is tapped.
// Transient modal (click-off closes). Widgets inside remain interactive.

import { ModalV2 } from '@/components/shared'
import { WidgetCard } from './WidgetCard'
import type { DashboardWidget, DashboardWidgetFolder, WidgetDataPoint, WidgetSize } from '@/types/widgets'
import { WIDGET_SIZE_MAP } from '@/types/widgets'

interface FolderOverlayModalProps {
  isOpen: boolean
  onClose: () => void
  folder: DashboardWidgetFolder | null
  widgets: DashboardWidget[]
  dataPointsByWidget: Record<string, WidgetDataPoint[]>
  onRecordData?: (widgetId: string, value: number, metadata?: Record<string, unknown>) => void
  onOpenWidgetDetail?: (widget: DashboardWidget) => void
  onOpenWidgetConfig?: (widget: DashboardWidget) => void
  onRemoveWidget?: (widgetId: string) => void
  onResizeWidget?: (widgetId: string, size: WidgetSize) => void
}

export function FolderOverlayModal({
  isOpen,
  onClose,
  folder,
  widgets,
  dataPointsByWidget,
  onRecordData,
  onOpenWidgetDetail,
  onOpenWidgetConfig,
  onRemoveWidget,
  onResizeWidget,
}: FolderOverlayModalProps) {
  if (!folder) return null

  return (
    <ModalV2
      id={`folder-overlay-${folder.id}`}
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title={folder.name}
    >
      {widgets.length === 0 ? (
        <div
          className="text-center py-8"
          style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}
        >
          No widgets in this folder yet.
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: 'repeat(2, 1fr)',
          }}
        >
          {widgets.map(widget => {
            const dims = WIDGET_SIZE_MAP[widget.size]
            return (
              <div
                key={widget.id}
                style={{
                  gridColumn: `span ${Math.min(dims.w, 2)}`,
                  gridRow: `span ${dims.h}`,
                  minHeight: dims.h === 1 ? 120 : 248,
                }}
              >
                <WidgetCard
                  widget={widget}
                  dataPoints={dataPointsByWidget[widget.id] ?? []}
                  onRecordData={onRecordData ? (v, m) => onRecordData(widget.id, v, m) : undefined}
                  isEditMode={false}
                  onRemove={onRemoveWidget ? () => onRemoveWidget(widget.id) : undefined}
                  onResize={onResizeWidget ? (s) => onResizeWidget(widget.id, s) : undefined}
                  onOpenDetail={() => onOpenWidgetDetail?.(widget)}
                  onOpenConfig={() => onOpenWidgetConfig?.(widget)}
                />
              </div>
            )
          })}
        </div>
      )}
    </ModalV2>
  )
}
