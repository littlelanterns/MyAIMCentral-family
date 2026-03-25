// PRD-10: Dashboard Grid Layout — snap-to-grid widget placement
// Breakpoints: Desktop 4-col, Tablet 3-col, Mobile 2-col
// Sizes: S=1x1, M=2x1, L=2x2
// Edit mode: long-press → wiggle + drag handles + resize + delete
// Auto-arrange default, switches to manual on first user move

import { useState, useCallback, useMemo } from 'react'
import { Plus } from 'lucide-react'
import type { DashboardWidget, WidgetDataPoint, WidgetSize, DashboardWidgetFolder } from '@/types/widgets'
import { WIDGET_SIZE_MAP } from '@/types/widgets'
import { WidgetCard } from './WidgetCard'
import { WidgetFolderCard } from './WidgetFolderCard'

interface DashboardGridProps {
  widgets: DashboardWidget[]
  folders: DashboardWidgetFolder[]
  dataPointsByWidget: Record<string, WidgetDataPoint[]>
  onRecordData?: (widgetId: string, value: number, metadata?: Record<string, unknown>) => void
  onOpenWidgetPicker?: () => void
  onOpenWidgetDetail?: (widget: DashboardWidget) => void
  onOpenWidgetConfig?: (widget: DashboardWidget) => void
  onOpenFolder?: (folder: DashboardWidgetFolder) => void
  onRemoveWidget?: (widgetId: string) => void
  onResizeWidget?: (widgetId: string, newSize: WidgetSize) => void
  onUpdateLayout?: (updates: { id: string; position_x: number; position_y: number; sort_order: number }[]) => void
  canEdit?: boolean // false for Play children, Special Adults
  canReorderOnly?: boolean // true for Guided children
}

export function DashboardGrid({
  widgets,
  folders,
  dataPointsByWidget,
  onRecordData,
  onOpenWidgetPicker,
  onOpenWidgetDetail,
  onOpenWidgetConfig,
  onOpenFolder,
  onRemoveWidget,
  onResizeWidget,
  onUpdateLayout: _onUpdateLayout,
  canEdit = true,
  canReorderOnly = false,
}: DashboardGridProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  // Separate widgets: top-level vs in folders
  const topLevelWidgets = useMemo(
    () => widgets.filter(w => !w.folder_id).sort((a, b) => a.sort_order - b.sort_order),
    [widgets]
  )

  const folderWidgets = useMemo(() => {
    const map: Record<string, DashboardWidget[]> = {}
    for (const w of widgets) {
      if (w.folder_id) {
        if (!map[w.folder_id]) map[w.folder_id] = []
        map[w.folder_id].push(w)
      }
    }
    return map
  }, [widgets])

  // Long-press to enter edit mode
  const handlePointerDown = useCallback(() => {
    if (!canEdit || canReorderOnly) return
    const timer = setTimeout(() => {
      setIsEditMode(true)
    }, 600)
    setLongPressTimer(timer)
  }, [canEdit, canReorderOnly])

  const handlePointerUp = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }, [longPressTimer])

  const handleExitEditMode = () => {
    setIsEditMode(false)
  }

  // Auto-unfolder: if a folder has only 1 widget, show it as top-level
  const effectiveFolders = folders.filter(f => (folderWidgets[f.id]?.length ?? 0) > 1)
  const autoUnfolderedWidgets = folders
    .filter(f => (folderWidgets[f.id]?.length ?? 0) === 1)
    .flatMap(f => folderWidgets[f.id] ?? [])

  const allTopLevel = [...topLevelWidgets, ...autoUnfolderedWidgets]

  return (
    <div
      className="relative"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Edit mode banner */}
      {isEditMode && (
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2 mb-3 rounded-lg"
          style={{ background: 'var(--color-bg-tertiary)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Editing layout
          </span>
          <button
            onClick={handleExitEditMode}
            className="px-3 py-1 rounded-lg text-sm font-medium"
            style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Done
          </button>
        </div>
      )}

      {/* Grid */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: 'repeat(var(--grid-cols, 2), 1fr)',
        }}
      >
        {/* Render folders */}
        {effectiveFolders.map(folder => (
          <div
            key={`folder-${folder.id}`}
            className="col-span-1 row-span-1"
            style={{ minHeight: 120 }}
          >
            <WidgetFolderCard
              folder={folder}
              widgets={folderWidgets[folder.id] ?? []}
              isEditMode={isEditMode}
              onOpen={() => onOpenFolder?.(folder)}
            />
          </div>
        ))}

        {/* Render top-level widgets */}
        {allTopLevel.map(widget => {
          const dims = WIDGET_SIZE_MAP[widget.size]
          return (
            <div
              key={widget.id}
              className="group"
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
                isEditMode={isEditMode}
                onRemove={isEditMode && !canReorderOnly ? () => onRemoveWidget?.(widget.id) : undefined}
                onResize={isEditMode && !canReorderOnly ? (s) => onResizeWidget?.(widget.id, s) : undefined}
                onOpenDetail={() => onOpenWidgetDetail?.(widget)}
                onOpenConfig={() => onOpenWidgetConfig?.(widget)}
              />
            </div>
          )
        })}

        {/* Add Widget button */}
        {canEdit && !canReorderOnly && onOpenWidgetPicker && (
          <button
            onClick={onOpenWidgetPicker}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors hover:opacity-80"
            style={{
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-tertiary)',
              minHeight: 120,
            }}
          >
            <Plus size={24} />
            <span className="text-sm">Add Widget</span>
          </button>
        )}
      </div>

      {/* Empty state */}
      {widgets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Your dashboard is empty
          </div>
          <div className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
            Add widgets to track what matters to you
          </div>
          {onOpenWidgetPicker && canEdit && (
            <button
              onClick={onOpenWidgetPicker}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
            >
              Add your first widget
            </button>
          )}
        </div>
      )}
    </div>
  )
}
