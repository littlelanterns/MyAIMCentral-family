// PRD-10 Screen 7: Widget Detail View
// Full-size rendering + history view (7/14/30/all time)
// Edit Widget button, Remove from Dashboard button

import { useState } from 'react'
import { X, Settings, Trash2, Clock } from 'lucide-react'
import type { DashboardWidget } from '@/types/widgets'
import { WidgetRenderer } from './WidgetRenderer'
import { useWidgetData } from '@/hooks/useWidgets'

interface WidgetDetailViewProps {
  widget: DashboardWidget
  isOpen: boolean
  onClose: () => void
  onRecordData?: (value: number, metadata?: Record<string, unknown>) => void
  onEdit?: () => void
  onRemove?: () => void
}

const HISTORY_RANGES = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: 'All time', days: 365 },
]

export function WidgetDetailView({
  widget,
  isOpen,
  onClose,
  onRecordData,
  onEdit,
  onRemove,
}: WidgetDetailViewProps) {
  const [historyRange, setHistoryRange] = useState(30)
  const { data: dataPoints = [] } = useWidgetData(widget.id, { days: historyRange })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl mx-4"
        style={{ background: 'var(--color-bg-primary)' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b"
          style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-default)' }}
        >
          <h2 className="text-lg font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {widget.title}
          </h2>
          <div className="flex items-center gap-1">
            {onEdit && (
              <button onClick={onEdit} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
                <Settings size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Full-size widget rendering */}
        <div className="p-6" style={{ minHeight: 200 }}>
          <WidgetRenderer
            widget={widget}
            dataPoints={dataPoints}
            onRecordData={onRecordData}
          />
        </div>

        {/* History section */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>History</span>
          </div>

          {/* Range selector */}
          <div className="flex gap-1 mb-3">
            {HISTORY_RANGES.map(range => (
              <button
                key={range.days}
                onClick={() => setHistoryRange(range.days)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: historyRange === range.days ? 'var(--surface-primary)' : 'var(--color-bg-secondary)',
                  color: historyRange === range.days ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                }}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Data summary */}
          <div className="rounded-lg p-3" style={{ background: 'var(--color-bg-secondary)' }}>
            {dataPoints.length > 0 ? (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Data points</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{dataPoints.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Total</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {dataPoints.reduce((sum, dp) => sum + Number(dp.value), 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-text-secondary)' }}>First entry</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {new Date(dataPoints[0].recorded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-center py-2" style={{ color: 'var(--color-text-tertiary)' }}>
                No data yet — check off your first item to see progress!
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {onRemove && (
          <div className="px-4 pb-4">
            <button
              onClick={() => { onRemove(); onClose() }}
              className="flex items-center gap-2 text-sm"
              style={{ color: 'var(--color-error, #ef4444)' }}
            >
              <Trash2 size={14} />
              Remove from Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
