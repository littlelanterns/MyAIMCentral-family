// PRD-28 Worker GRACE-CALENDAR (2026-04-25) — Visual calendar grid for
// grace day marking. Replaces the chip strip in per-child
// GraceDaysManager AND the [+ Add another date] picker in the bulk
// configure modal. Single source of truth, both surfaces use this same
// component.
//
// Three states per day cell:
//   - Unmarked       — normal cell, neutral background
//   - Skip           — fully greyed out (full_exclude mode)
//   - Keep credit    — diagonal half-split: brand color top-left,
//                      grey bottom-right (numerator_keep mode)
//
// Tap cycles: unmarked → Skip → Keep credit → unmarked
// (matches founder mental model: tap once = "this day didn't count";
// tap again = "kid still gets credit for what they did"; tap a third
// time to undo).
//
// The calendar is week-grid (Sun..Sat) for the full active period.
// Future days are visually disabled (grace is retroactive only).
//
// Two render modes:
//   variant='single'   — operates on a single child's period;
//                        tap fires the addGraceDay/removeGraceDay
//                        mutation immediately. Used by the per-child
//                        GraceDaysManager.
//   variant='bulk'     — operates on a draft state held by the parent;
//                        tap calls onChange with the new grace_days
//                        array. The parent commits to N children when
//                        mom hits Save. Used by BulkConfigureAllowanceModal.

import { useMemo } from 'react'
import {
  type GraceDayEntry,
  type GraceDayMode,
  normalizeGraceDayEntry,
} from '@/hooks/useFinancial'
import { todayLocalIso } from '@/utils/dates'

interface GraceDayCalendarProps {
  /** Period start (YYYY-MM-DD). Calendar only shows dates within this period. */
  periodStart: string
  /** Period end (YYYY-MM-DD). */
  periodEnd: string
  /** Current grace day entries (legacy strings or {date, mode} objects). */
  graceDays: GraceDayEntry[]
  /**
   * Called whenever the user cycles a day's mode. The parent decides
   * what to do with the new array (write directly via hook, or hold
   * draft state for bulk submission).
   */
  onChange: (next: GraceDayEntry[]) => void
  /** When true, all interaction is suppressed (master toggle off). */
  disabled?: boolean
  /** When true, mutation is in flight — disable taps. */
  pending?: boolean
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function GraceDayCalendar({
  periodStart,
  periodEnd,
  graceDays,
  onChange,
  disabled = false,
  pending = false,
}: GraceDayCalendarProps) {
  const today = todayLocalIso()

  const days = useMemo(() => {
    const out: Array<{
      iso: string
      weekdayIdx: number
      monthDay: number
      isFuture: boolean
    }> = []
    const [sY, sM, sD] = periodStart.split('-').map(Number)
    const [eY, eM, eD] = periodEnd.split('-').map(Number)
    const start = new Date(Date.UTC(sY, sM - 1, sD))
    const end = new Date(Date.UTC(eY, eM - 1, eD))
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      // eslint-disable-next-line no-restricted-syntax -- d is UTC-constructed; UTC slice is correct
      const iso = d.toISOString().slice(0, 10)
      out.push({
        iso,
        weekdayIdx: d.getUTCDay(),
        monthDay: d.getUTCDate(),
        isFuture: iso > today,
      })
    }
    return out
  }, [periodStart, periodEnd, today])

  // Build date → mode lookup tolerating legacy string entries.
  const modeByDate = useMemo(() => {
    const map = new Map<string, GraceDayMode>()
    for (const entry of graceDays) {
      const norm = normalizeGraceDayEntry(entry)
      map.set(norm.date, norm.mode)
    }
    return map
  }, [graceDays])

  // Pad the leading row so weekday columns line up. If period_start
  // isn't a Sunday, render empty cells before it for alignment.
  const leadingPad = days.length > 0 ? days[0].weekdayIdx : 0

  const cycleMode = (iso: string) => {
    if (disabled || pending) return
    const current = modeByDate.get(iso)
    let next: GraceDayEntry[]
    // Strip any existing entry for this date.
    const stripped = graceDays.filter(entry => normalizeGraceDayEntry(entry).date !== iso)
    if (!current) {
      // unmarked → Skip
      next = [...stripped, { date: iso, mode: 'full_exclude' }]
    } else if (current === 'full_exclude') {
      // Skip → Keep credit
      next = [...stripped, { date: iso, mode: 'numerator_keep' }]
    } else {
      // Keep credit → unmarked
      next = stripped
    }
    onChange(next)
  }

  return (
    <div data-testid="grace-day-calendar" style={{ opacity: disabled ? 0.5 : 1 }}>
      {/* Weekday header row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.25rem',
          marginBottom: '0.25rem',
        }}
      >
        {WEEKDAYS.map(label => (
          <div
            key={label}
            style={{
              textAlign: 'center',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              padding: '0.25rem 0',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.25rem',
        }}
      >
        {Array.from({ length: leadingPad }).map((_, i) => (
          <div key={`pad-${i}`} aria-hidden="true" />
        ))}
        {days.map(day => {
          const mode = modeByDate.get(day.iso)
          const isMarked = !!mode
          const isDisabled = disabled || day.isFuture || pending
          const ariaLabel = isMarked
            ? `${day.iso} marked as ${mode === 'full_exclude' ? 'Skip' : 'Keep credit'}. Tap to ${mode === 'full_exclude' ? 'switch to Keep credit' : 'unmark'}.`
            : day.isFuture
              ? `${day.iso} (future — cannot mark yet)`
              : `${day.iso} unmarked. Tap to mark as Skip.`

          // Visual state:
          //   unmarked → neutral background, primary text
          //   Skip (full_exclude) → solid grey, low-contrast text
          //   Keep credit (numerator_keep) → diagonal half: brand color top-left,
          //     grey bottom-right. Text on brand half (top-left aligned).
          let background: string
          let color: string
          let border: string
          if (mode === 'full_exclude') {
            background = 'var(--color-bg-tertiary, var(--color-bg-secondary))'
            color = 'var(--color-text-muted)'
            border = '1px solid var(--color-border-default, var(--color-border))'
          } else if (mode === 'numerator_keep') {
            // CSS gradient diagonal split — brand on top-left half,
            // grey on bottom-right half. Border in brand color signals
            // "marked but not fully excluded."
            background =
              'linear-gradient(135deg, var(--color-btn-primary-bg) 0%, var(--color-btn-primary-bg) 50%, var(--color-bg-tertiary, var(--color-bg-secondary)) 50%, var(--color-bg-tertiary, var(--color-bg-secondary)) 100%)'
            color = 'var(--color-text-on-primary)'
            border = '1px solid var(--color-btn-primary-bg)'
          } else {
            background = 'var(--color-bg-secondary)'
            color = 'var(--color-text-primary)'
            border = '1px solid var(--color-border-default, var(--color-border))'
          }

          return (
            <button
              key={day.iso}
              type="button"
              disabled={isDisabled}
              data-testid={`grace-cal-day-${day.iso}`}
              data-mode={mode ?? 'unmarked'}
              aria-label={ariaLabel}
              aria-pressed={isMarked}
              onClick={() => cycleMode(day.iso)}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                background,
                color,
                border,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontWeight: isMarked ? 600 : 500,
                opacity: day.isFuture ? 0.35 : 1,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                padding: '0.25rem 0.375rem',
                transition: 'all 0.15s',
                position: 'relative',
                lineHeight: 1.1,
              }}
            >
              <span>{day.monthDay}</span>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      {!disabled && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.875rem',
            marginTop: '0.625rem',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
          }}
        >
          <LegendDot
            background="var(--color-bg-secondary)"
            border="1px solid var(--color-border-default, var(--color-border))"
            label="Unmarked"
          />
          <LegendDot
            background="var(--color-bg-tertiary, var(--color-bg-secondary))"
            border="1px solid var(--color-border-default, var(--color-border))"
            label="Skip — day excluded entirely"
          />
          <LegendDot
            background="linear-gradient(135deg, var(--color-btn-primary-bg) 0%, var(--color-btn-primary-bg) 50%, var(--color-bg-tertiary, var(--color-bg-secondary)) 50%, var(--color-bg-tertiary, var(--color-bg-secondary)) 100%)"
            border="1px solid var(--color-btn-primary-bg)"
            label="Keep credit — kid still gets numerator"
          />
          <span>Tap a day to cycle Unmarked → Skip → Keep credit → Unmarked.</span>
        </div>
      )}
    </div>
  )
}

function LegendDot({
  background,
  border,
  label,
}: {
  background: string
  border: string
  label: string
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '0.875rem',
          height: '0.875rem',
          borderRadius: '4px',
          background,
          border,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  )
}
