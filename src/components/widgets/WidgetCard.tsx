// PRD-10: Widget Card — renders a single widget on the dashboard grid
// Handles S/M/L sizing, edit mode indicators, and click-to-detail navigation
// Widgets consume theme tokens exclusively via CSS custom properties

import { GripVertical, X, Settings } from 'lucide-react'
import type { DashboardWidget, WidgetDataPoint, WidgetSize } from '@/types/widgets'
import { WidgetRenderer } from './WidgetRenderer'

interface WidgetCardProps {
  widget: DashboardWidget
  dataPoints: WidgetDataPoint[]
  onRecordData?: (value: number, metadata?: Record<string, unknown>) => void
  onUpdateConfig?: (config: Record<string, unknown>) => void
  isEditMode?: boolean
  onRemove?: () => void
  onResize?: (newSize: WidgetSize) => void
  onOpenDetail?: () => void
  onOpenConfig?: () => void
}

const SIZE_LABELS: Record<WidgetSize, string> = {
  small: 'S',
  medium: 'M',
  large: 'L',
}

const SIZE_CYCLE: WidgetSize[] = ['small', 'medium', 'large']

export function WidgetCard({
  widget,
  dataPoints,
  onRecordData,
  onUpdateConfig,
  isEditMode,
  onRemove,
  onResize,
  onOpenDetail,
  onOpenConfig,
}: WidgetCardProps) {
  const isCompact = widget.size === 'small'

  const handleCycleSize = () => {
    if (!onResize) return
    const currentIdx = SIZE_CYCLE.indexOf(widget.size)
    const nextIdx = (currentIdx + 1) % SIZE_CYCLE.length
    onResize(SIZE_CYCLE[nextIdx])
  }

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden transition-all
        ${isEditMode ? 'animate-[wiggle_0.3s_ease-in-out_infinite]' : ''}
      `}
      style={{
        background: 'var(--color-card-bg, var(--color-bg-secondary))',
        border: '1px solid var(--color-border-default)',
        cursor: isEditMode ? 'grab' : 'pointer',
      }}
      onClick={!isEditMode ? onOpenDetail : undefined}
    >
      {/* Edit mode overlay buttons */}
      {isEditMode && (
        <>
          {/* Delete button — top left */}
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              className="absolute top-1 left-1 z-10 p-1 rounded-full"
              style={{
                background: 'var(--color-error, #ef4444)',
                color: 'white',
              }}
            >
              <X size={12} />
            </button>
          )}

          {/* Drag handle — top center */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 p-0.5 rounded" style={{ color: 'var(--color-text-tertiary)' }}>
            <GripVertical size={14} />
          </div>

          {/* Resize handle — bottom right */}
          {onResize && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCycleSize() }}
              className="absolute bottom-1 right-1 z-10 p-1 rounded text-xs font-bold"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {SIZE_LABELS[widget.size]}
            </button>
          )}
        </>
      )}

      {/* Widget content */}
      <div className="p-3 h-full flex flex-col">
        {/* Title bar */}
        <div className="flex items-center justify-between mb-1.5">
          <h3
            className="text-sm font-semibold truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {widget.title}
          </h3>
          {!isEditMode && onOpenConfig && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenConfig() }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <Settings size={12} />
            </button>
          )}
        </div>

        {/* Tracker content */}
        <div className="flex-1 min-h-0">
          <WidgetRenderer
            widget={widget}
            dataPoints={dataPoints}
            onRecordData={onRecordData}
            onUpdateConfig={onUpdateConfig}
            isCompact={isCompact}
          />
        </div>
      </div>
    </div>
  )
}
