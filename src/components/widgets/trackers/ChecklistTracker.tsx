// PRD-10: Checklist tracker — daily checklist with checkboxes
// Visual variants: standard_checklist, card_stack
// Resets each day automatically per PRD-10 spec

import { useMemo } from 'react'
import { CheckSquare, Square } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

export function ChecklistTracker({ widget, dataPoints, onRecordData, variant: _variant, isCompact }: TrackerProps) {
  const config = widget.widget_config as {
    checklist_items?: string[]
  }
  const items = config.checklist_items ?? ['Item 1', 'Item 2', 'Item 3']

  // Get today's checked items from data points
  const today = new Date().toISOString().split('T')[0]
  const todayChecked = useMemo(() => {
    const todayPoints = dataPoints.filter(dp => dp.recorded_date === today)
    const checked = new Set<number>()
    for (const dp of todayPoints) {
      const idx = (dp.metadata as { item_index?: number })?.item_index
      if (idx !== undefined && Number(dp.value) > 0) {
        checked.add(idx)
      }
    }
    return checked
  }, [dataPoints, today])

  const completedCount = todayChecked.size
  const totalCount = items.length
  const allDone = completedCount >= totalCount

  const handleToggle = (index: number) => {
    if (!onRecordData) return
    const isChecked = todayChecked.has(index)
    // Record 1 for check, 0 for uncheck
    onRecordData(isChecked ? 0 : 1, {
      item_index: index,
      item_name: items[index],
      type: 'checklist_toggle',
    })
  }

  const displayItems = isCompact ? items.slice(0, 4) : items

  return (
    <div className="flex flex-col h-full gap-1.5">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {completedCount}/{totalCount}
        </span>
        {allDone && (
          <span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
            All done!
          </span>
        )}
      </div>

      {/* Checklist items */}
      <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
        {displayItems.map((item, idx) => {
          const checked = todayChecked.has(idx)
          return (
            <button
              key={idx}
              onClick={() => handleToggle(idx)}
              disabled={!onRecordData}
              className="flex items-center gap-2 px-1.5 py-1 rounded text-left transition-colors hover:opacity-80"
              style={{
                background: checked ? 'var(--color-accent-light, rgba(var(--color-accent-rgb, 0,0,0), 0.08))' : 'transparent',
              }}
            >
              {checked ? (
                <CheckSquare size={isCompact ? 14 : 16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              ) : (
                <Square size={isCompact ? 14 : 16} style={{ color: 'var(--color-border-default)', flexShrink: 0 }} />
              )}
              <span
                className={`text-xs truncate ${checked ? 'line-through' : ''}`}
                style={{ color: checked ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)' }}
              >
                {item}
              </span>
            </button>
          )
        })}
        {isCompact && items.length > 4 && (
          <span className="text-xs pl-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
            +{items.length - 4} more
          </span>
        )}
      </div>
    </div>
  )
}
