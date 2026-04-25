// PRD-28 NEW-GG → NEW-TT → GRACE-CALENDAR (2026-04-25) —
// Grace Days marking UI with per-day mode picker.
//
// Calendar redesign (2026-04-25): chip strip replaced by visual
// week-grid via shared <GraceDayCalendar>. Cells render in three states:
//   - Unmarked → neutral
//   - Skip (full_exclude) → fully greyed out
//   - Keep credit (numerator_keep) → diagonal half-color/half-grey split
// Tap cycles unmarked → Skip → Keep credit → unmarked.
//
// Mode semantics (per RPC migration 100175):
//   - Skip: day removed from BOTH numerator and denominator. As if the
//     day didn't exist.
//   - Keep credit: day removed from denominator ONLY. Kid keeps any
//     credit they earned that day.

import { useMemo } from 'react'
import {
  useAddGraceDay,
  useRemoveGraceDay,
  type GraceDayEntry,
} from '@/hooks/useFinancial'
import { normalizeGraceDayEntry } from '@/hooks/useFinancial'
import { GraceDayCalendar } from './GraceDayCalendar'

interface GraceDaysManagerProps {
  periodId: string
  periodStart: string // YYYY-MM-DD
  periodEnd: string   // YYYY-MM-DD
  graceDays: GraceDayEntry[]
  disabled?: boolean
}

export function GraceDaysManager({
  periodId,
  periodStart,
  periodEnd,
  graceDays,
  disabled = false,
}: GraceDaysManagerProps) {
  const addGrace = useAddGraceDay()
  const removeGrace = useRemoveGraceDay()

  const pending = addGrace.isPending || removeGrace.isPending

  // Diff old vs new arrays to figure out which mutation to fire. The
  // calendar gives us the FULL desired state on each cycle; we figure
  // out whether that's an add, a mode change, or a remove.
  const handleChange = (next: GraceDayEntry[]) => {
    if (disabled || pending) return

    const oldMap = new Map<string, ReturnType<typeof normalizeGraceDayEntry>['mode']>()
    for (const entry of graceDays) {
      const norm = normalizeGraceDayEntry(entry)
      oldMap.set(norm.date, norm.mode)
    }
    const newMap = new Map<string, ReturnType<typeof normalizeGraceDayEntry>['mode']>()
    for (const entry of next) {
      const norm = normalizeGraceDayEntry(entry)
      newMap.set(norm.date, norm.mode)
    }

    // Find the date that changed (calendar fires one cell per tap).
    for (const [date, newMode] of newMap.entries()) {
      const oldMode = oldMap.get(date)
      if (oldMode !== newMode) {
        addGrace.mutate({ periodId, date, mode: newMode })
        return
      }
    }
    for (const date of oldMap.keys()) {
      if (!newMap.has(date)) {
        removeGrace.mutate({ periodId, date })
        return
      }
    }
  }

  // Counts for the summary line below the calendar.
  const counts = useMemo(() => {
    let skip = 0
    let keep = 0
    for (const entry of graceDays) {
      const norm = normalizeGraceDayEntry(entry)
      if (norm.mode === 'numerator_keep') keep++
      else skip++
    }
    return { skip, keep, total: skip + keep }
  }, [graceDays])

  return (
    <div data-testid="grace-days-manager" style={{ marginTop: '0.75rem' }}>
      <div
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-muted)',
          marginBottom: '0.5rem',
        }}
      >
        {disabled
          ? 'Enable Grace Days above to mark days.'
          : "Tap a day in the calendar to cycle through modes."}
      </div>

      <GraceDayCalendar
        periodStart={periodStart}
        periodEnd={periodEnd}
        graceDays={graceDays}
        onChange={handleChange}
        disabled={disabled}
        pending={pending}
      />

      {counts.total > 0 && (
        <div
          style={{
            marginTop: '0.5rem',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
          }}
        >
          {counts.total} day{counts.total === 1 ? '' : 's'} marked
          {counts.keep > 0 && ` · ${counts.keep} Keep credit`}
          {counts.skip > 0 && ` · ${counts.skip} Skip`}
          {counts.keep > 0
            ? ' — "Keep credit" days shrink the denominator only; "Skip" days shrink both sides.'
            : " — Skip days are excluded from both the denominator and numerator of this week's allowance %."}
        </div>
      )}
    </div>
  )
}
