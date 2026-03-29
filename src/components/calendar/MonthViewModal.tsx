/**
 * MonthViewModal — full month calendar in a transient modal overlay.
 *
 * Opened from the Dashboard widget "View Month" button.
 * Shows a month grid with event dots. Click any date → DateDetailModal.
 *
 * PRD-14B, spec: Calendar-System-Build-Spec.md
 */

import { useState, useMemo } from 'react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { MiniCalendarPicker } from '@/components/shared/MiniCalendarPicker'
import { useEventsForRange, useCalendarSettings } from '@/hooks/useCalendarEvents'

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface MonthViewModalProps {
  isOpen: boolean
  onClose: () => void
  onDateSelect: (date: Date) => void
}

export function MonthViewModal({ isOpen, onClose, onDateSelect }: MonthViewModalProps) {
  const { data: settings } = useCalendarSettings()
  const weekStartDay = (settings?.week_start_day ?? 0) as 0 | 1

  const today = new Date()
  const [viewDate, setViewDate] = useState(today)

  // Get first and last day of month for query range
  const monthStart = useMemo(() => new Date(viewDate.getFullYear(), viewDate.getMonth(), 1), [viewDate])
  const monthEnd = useMemo(() => new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0), [viewDate])

  const { data: events } = useEventsForRange(monthStart, monthEnd)

  // Build set of dates that have events
  const datesWithEvents = useMemo(() => {
    const set = new Set<string>()
    for (const ev of events ?? []) {
      set.add(ev.event_date)
    }
    return set
  }, [events])

  // Convert to Date array for MiniCalendarPicker highlights
  const highlightedDates = useMemo(() => {
    const dates: Date[] = []
    for (const dateStr of datesWithEvents) {
      const [y, m, d] = dateStr.split('-').map(Number)
      dates.push(new Date(y, m - 1, d))
    }
    return dates
  }, [datesWithEvents])

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <ModalV2
      id="month-view"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title={monthLabel}
    >
      <div className="flex justify-center p-4">
        <MiniCalendarPicker
          selectedDate={viewDate}
          onDateSelect={(d) => {
            onDateSelect(d)
          }}
          highlightedDates={highlightedDates}
          weekStartDay={weekStartDay}
          showTodayButton
        />
      </div>
    </ModalV2>
  )
}
