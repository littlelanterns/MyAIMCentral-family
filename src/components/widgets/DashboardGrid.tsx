// PRD-10: Dashboard Grid Layout — snap-to-grid widget placement
// Breakpoints: Desktop 4-col, Tablet 3-col, Mobile 2-col
// Sizes: S=1x1, M=2x1, L=2x2
// Edit mode: long-press → wiggle + drag handles + resize + delete
// Auto-arrange default, switches to manual on first user move
// Widget limit: 50 max, warning at 40, lazy loading via IntersectionObserver

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Plus, GripVertical, AlertTriangle } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DashboardWidget, WidgetDataPoint, WidgetSize, DashboardWidgetFolder } from '@/types/widgets'
import { WIDGET_SIZE_MAP } from '@/types/widgets'
import { WidgetCard } from './WidgetCard'
import { WidgetFolderCard } from './WidgetFolderCard'

// ─── Constants ───────────────────────────────────────────────────────────────

const WIDGET_LIMIT = 50
const WIDGET_WARNING_THRESHOLD = 40

// ─── Lazy-loading hook via IntersectionObserver ──────────────────────────────

function useLazyVisible(rootMargin = '200px') {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect() // Once visible, stay visible — no need to re-observe
        }
      },
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return { ref, isVisible }
}

// ─── Widget skeleton placeholder for off-screen widgets ──────────────────────

function WidgetSkeleton({ minHeight }: { minHeight: number }) {
  return (
    <div
      className="rounded-xl animate-pulse"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        minHeight,
      }}
    >
      <div className="p-3 space-y-2">
        <div
          className="h-3 w-2/3 rounded"
          style={{ background: 'var(--color-bg-tertiary)' }}
        />
        <div
          className="h-8 w-full rounded"
          style={{ background: 'var(--color-bg-tertiary)' }}
        />
      </div>
    </div>
  )
}

// ─── Sortable wrapper for a single widget cell ────────────────────────────────

interface SortableWidgetCellProps {
  widget: DashboardWidget
  dataPoints: WidgetDataPoint[]
  isEditMode: boolean
  canReorderOnly: boolean
  onRecordData?: (value: number, metadata?: Record<string, unknown>) => void
  onUpdateConfig?: (config: Record<string, unknown>) => void
  onRemove?: () => void
  onResize?: (size: WidgetSize) => void
  onOpenDetail?: () => void
  onOpenConfig?: () => void
}

function SortableWidgetCell({
  widget,
  dataPoints,
  isEditMode,
  canReorderOnly,
  onRecordData,
  onUpdateConfig,
  onRemove,
  onResize,
  onOpenDetail,
  onOpenConfig,
}: SortableWidgetCellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id })

  const { ref: lazyRef, isVisible } = useLazyVisible()

  const dims = WIDGET_SIZE_MAP[widget.size]
  const cellMinHeight = dims.h === 1 ? 120 : 248

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    gridColumn: `span ${Math.min(dims.w, 2)}`,
    gridRow: `span ${dims.h}`,
    minHeight: cellMinHeight,
    position: 'relative',
  }

  return (
    <div ref={(node) => {
      // Compose both refs
      setNodeRef(node)
      ;(lazyRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    }} style={style} className="group">
      {/* Drag handle — only visible in edit mode */}
      {isEditMode && (
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 p-1 rounded cursor-grab active:cursor-grabbing touch-none"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
      )}
      {isVisible ? (
        <WidgetCard
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          onUpdateConfig={onUpdateConfig}
          isEditMode={isEditMode}
          onRemove={isEditMode && !canReorderOnly ? onRemove : undefined}
          onResize={isEditMode && !canReorderOnly ? onResize : undefined}
          onOpenDetail={onOpenDetail}
          onOpenConfig={onOpenConfig}
        />
      ) : (
        <WidgetSkeleton minHeight={cellMinHeight} />
      )}
    </div>
  )
}

// ─── Main DashboardGrid ───────────────────────────────────────────────────────

interface DashboardGridProps {
  widgets: DashboardWidget[]
  folders: DashboardWidgetFolder[]
  dataPointsByWidget: Record<string, WidgetDataPoint[]>
  onRecordData?: (widgetId: string, value: number, metadata?: Record<string, unknown>) => void
  onUpdateWidgetConfig?: (widgetId: string, config: Record<string, unknown>) => void
  onOpenWidgetPicker?: () => void
  onOpenWidgetDetail?: (widget: DashboardWidget) => void
  onOpenWidgetConfig?: (widget: DashboardWidget) => void
  onOpenFolder?: (folder: DashboardWidgetFolder) => void
  onRemoveWidget?: (widgetId: string) => void
  onResizeWidget?: (widgetId: string, newSize: WidgetSize) => void
  onUpdateLayout?: (updates: { id: string; position_x: number; position_y: number; sort_order: number }[]) => void
  canEdit?: boolean // false for Play children, Special Adults
  canReorderOnly?: boolean // true for Guided children
  layoutMode?: 'auto' | 'manual'
  onLayoutModeChange?: (mode: 'auto' | 'manual') => void
}

export function DashboardGrid({
  widgets,
  folders,
  dataPointsByWidget,
  onRecordData,
  onUpdateWidgetConfig,
  onOpenWidgetPicker,
  onOpenWidgetDetail,
  onOpenWidgetConfig,
  onOpenFolder,
  onRemoveWidget,
  onResizeWidget,
  onUpdateLayout,
  canEdit = true,
  canReorderOnly = false,
  layoutMode = 'auto',
  onLayoutModeChange,
}: DashboardGridProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  // Local optimistic order for top-level widgets
  const [localOrder, setLocalOrder] = useState<string[] | null>(null)
  // One-time confirmation prompt before switching to manual layout
  const [showManualConfirm, setShowManualConfirm] = useState(false)
  // Stash the pending drag event so we can apply it after user confirms
  const pendingDragRef = useRef<DragEndEvent | null>(null)

  // Widget limit state
  const widgetCount = widgets.length
  const isAtLimit = widgetCount >= WIDGET_LIMIT
  const isNearLimit = widgetCount >= WIDGET_WARNING_THRESHOLD

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

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

  // Auto-unfolder: if a folder has only 1 widget, show it as top-level
  const effectiveFolders = folders.filter(f => (folderWidgets[f.id]?.length ?? 0) > 1)
  const autoUnfolderedWidgets = folders
    .filter(f => (folderWidgets[f.id]?.length ?? 0) === 1)
    .flatMap(f => folderWidgets[f.id] ?? [])

  const baseTopLevel = [...topLevelWidgets, ...autoUnfolderedWidgets]

  // Apply local optimistic ordering when dragging
  const orderedTopLevel = useMemo(() => {
    if (!localOrder) return baseTopLevel
    const map = new Map(baseTopLevel.map(w => [w.id, w]))
    return localOrder.map(id => map.get(id)).filter(Boolean) as DashboardWidget[]
  }, [localOrder, baseTopLevel])

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
    setLocalOrder(null)
  }

  // Applies a drag reorder (used both immediately and after manual-mode confirmation)
  const applyDragReorder = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const currentList = orderedTopLevel
    const oldIndex = currentList.findIndex(w => w.id === active.id)
    const newIndex = currentList.findIndex(w => w.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(currentList, oldIndex, newIndex)

    // Optimistic local update
    setLocalOrder(reordered.map(w => w.id))

    // Persist to DB
    onUpdateLayout?.(
      reordered.map((w, idx) => ({
        id: w.id,
        position_x: idx % 2,
        position_y: Math.floor(idx / 2),
        sort_order: idx,
      }))
    )
  }, [orderedTopLevel, onUpdateLayout])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // If currently in auto mode and this is the first drag, prompt for confirmation
    if (layoutMode === 'auto' && onLayoutModeChange) {
      pendingDragRef.current = event
      setShowManualConfirm(true)
      return
    }

    applyDragReorder(event)
  }, [layoutMode, onLayoutModeChange, applyDragReorder])

  const handleConfirmManualLayout = useCallback(() => {
    onLayoutModeChange?.('manual')
    setShowManualConfirm(false)
    // Apply the stashed drag event
    if (pendingDragRef.current) {
      applyDragReorder(pendingDragRef.current)
      pendingDragRef.current = null
    }
  }, [onLayoutModeChange, applyDragReorder])

  const handleCancelManualLayout = useCallback(() => {
    setShowManualConfirm(false)
    pendingDragRef.current = null
  }, [])

  return (
    <div
      className="relative"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Manual layout confirmation prompt — inline dialog at top of grid */}
      {showManualConfirm && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 mb-3 rounded-lg"
          style={{
            background: 'var(--color-bg-card)',
            border: '2px solid var(--color-accent-deep, var(--color-btn-primary-bg))',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Switching to manual layout
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Widgets will stay where you place them. You can switch back to auto-arrange in settings.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCancelManualLayout}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmManualLayout}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
            >
              Switch to Manual
            </button>
          </div>
        </div>
      )}

      {/* Widget limit warning — shows at 40+ widgets */}
      {isNearLimit && !isAtLimit && (
        <div
          className="flex items-center gap-2 px-4 py-2 mb-3 rounded-lg"
          style={{
            background: 'color-mix(in srgb, var(--color-golden-honey, #d6a461) 15%, var(--color-bg-card))',
            border: '1px solid color-mix(in srgb, var(--color-golden-honey, #d6a461) 40%, transparent)',
          }}
        >
          <AlertTriangle size={16} style={{ color: 'var(--color-golden-honey, #d6a461)', flexShrink: 0 }} />
          <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
            You have {widgetCount} widgets. Maximum is {WIDGET_LIMIT}.
          </span>
        </div>
      )}

      {/* Widget limit reached — shows at 50 widgets */}
      {isAtLimit && (
        <div
          className="flex items-center gap-2 px-4 py-2 mb-3 rounded-lg"
          style={{
            background: 'color-mix(in srgb, var(--color-dusty-rose, #d69a84) 15%, var(--color-bg-card))',
            border: '1px solid color-mix(in srgb, var(--color-dusty-rose, #d69a84) 40%, transparent)',
          }}
        >
          <AlertTriangle size={16} style={{ color: 'var(--color-dusty-rose, #d69a84)', flexShrink: 0 }} />
          <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
            Dashboard is full ({WIDGET_LIMIT} widgets). Remove a widget to add a new one.
          </span>
        </div>
      )}

      {/* Edit mode banner */}
      {isEditMode && (
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2.5 mb-3 rounded-lg shadow-md"
          style={{
            background: 'var(--surface-primary)',
            color: 'var(--color-text-on-primary)',
          }}
        >
          <span className="text-sm font-medium">
            Editing layout{layoutMode === 'manual' ? ' (manual)' : ''} — long press to drag
          </span>
          <button
            onClick={handleExitEditMode}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: 'rgba(255,255,255,0.25)',
              color: 'var(--color-text-on-primary)',
              border: '1px solid rgba(255,255,255,0.4)',
            }}
          >
            Done
          </button>
        </div>
      )}

      {/* Grid */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: 'repeat(var(--grid-cols, 2), minmax(0, 1fr))',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Render folders (not sortable — folders are a separate system) */}
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

        {/* Sortable top-level widgets */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedTopLevel.map(w => w.id)}
            strategy={rectSortingStrategy}
          >
            {orderedTopLevel.map(widget => (
              <SortableWidgetCell
                key={widget.id}
                widget={widget}
                dataPoints={dataPointsByWidget[widget.id] ?? []}
                isEditMode={isEditMode}
                canReorderOnly={canReorderOnly}
                onRecordData={onRecordData ? (v, m) => onRecordData(widget.id, v, m) : undefined}
                onUpdateConfig={onUpdateWidgetConfig ? (c) => onUpdateWidgetConfig(widget.id, c) : undefined}
                onRemove={() => onRemoveWidget?.(widget.id)}
                onResize={(s) => onResizeWidget?.(widget.id, s)}
                onOpenDetail={() => onOpenWidgetDetail?.(widget)}
                onOpenConfig={() => onOpenWidgetConfig?.(widget)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add Widget button — disabled at limit, with tooltip */}
        {canEdit && !canReorderOnly && onOpenWidgetPicker && (
          <div className="relative group/add">
            <button
              onClick={isAtLimit ? undefined : onOpenWidgetPicker}
              disabled={isAtLimit}
              className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors"
              style={{
                borderColor: 'var(--color-border-default)',
                color: isAtLimit ? 'var(--color-text-tertiary)' : 'var(--color-text-tertiary)',
                minHeight: 120,
                opacity: isAtLimit ? 0.5 : 1,
                cursor: isAtLimit ? 'not-allowed' : 'pointer',
              }}
            >
              <Plus size={24} />
              <span className="text-sm">Add Widget</span>
            </button>
            {/* Tooltip on hover when at limit */}
            {isAtLimit && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover/add:opacity-100 transition-opacity pointer-events-none z-30"
                style={{
                  background: 'var(--color-accent-deep, var(--color-btn-primary-bg))',
                  color: 'var(--color-text-on-primary)',
                  border: '1px solid var(--color-border-default)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                Dashboard is full. Remove a widget to add a new one.
              </div>
            )}
          </div>
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
