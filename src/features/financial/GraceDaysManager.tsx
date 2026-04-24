// PRD-28 NEW-GG — Grace Days marking UI (Worker B1b)
//
// Renders a compact day-picker for the active allowance period. Each day
// in the period is a toggleable chip; tapping adds the date to
// `allowance_periods.grace_days` (via useAddGraceDay), tapping again
// removes it (via useRemoveGraceDay). The `calculate_allowance_progress`
// RPC (migration 100172) consumes the array to shrink the denominator
// and numerator on the routine branch.
//
// Scope per orchestrator 2026-04-24: live-period marking only. Retroactive
// marking on PAST calculated periods is filed as follow-up NEW-MM.

import { useMemo } from 'react'
import { useAddGraceDay, useRemoveGraceDay } from '@/hooks/useFinancial'
import { todayLocalIso } from '@/utils/dates'

interface GraceDaysManagerProps {
  periodId: string
  periodStart: string // YYYY-MM-DD
  periodEnd: string   // YYYY-MM-DD
  graceDays: string[] // current ISO YYYY-MM-DD dates
  disabled?: boolean  // when master toggle is off
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
  const today = todayLocalIso()

  const days = useMemo(() => {
    const out: Array<{ iso: string; weekday: string; display: string; isFuture: boolean }> = []
    const [sY, sM, sD] = periodStart.split('-').map(Number)
    const [eY, eM, eD] = periodEnd.split('-').map(Number)
    const start = new Date(Date.UTC(sY, sM - 1, sD))
    const end = new Date(Date.UTC(eY, eM - 1, eD))
    const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = d.toISOString().slice(0, 10)
      out.push({
        iso,
        weekday: WEEKDAYS[d.getUTCDay()],
        display: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
        isFuture: iso > today,
      })
    }
    return out
  }, [periodStart, periodEnd, today])

  const graceSet = useMemo(() => new Set(graceDays), [graceDays])

  const toggle = (iso: string) => {
    if (disabled) return
    if (graceSet.has(iso)) {
      removeGrace.mutate({ periodId, date: iso })
    } else {
      addGrace.mutate({ periodId, date: iso })
    }
  }

  const pending = addGrace.isPending || removeGrace.isPending

  return (
    <div
      data-testid="grace-days-manager"
      style={{ marginTop: '0.75rem', opacity: disabled ? 0.5 : 1 }}
    >
      <div style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-muted)',
        marginBottom: '0.5rem',
      }}>
        {disabled
          ? 'Enable Grace Days above to mark days.'
          : 'Tap a day to mark it as grace. Tap again to unmark. Only past and current days are markable.'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {days.map(day => {
          const isGrace = graceSet.has(day.iso)
          const isDisabled = disabled || day.isFuture || pending
          return (
            <button
              key={day.iso}
              type="button"
              disabled={isDisabled}
              aria-pressed={isGrace}
              data-testid={`grace-day-${day.iso}`}
              onClick={() => toggle(day.iso)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                background: isGrace
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-bg-secondary)',
                color: isGrace
                  ? 'var(--color-text-on-primary)'
                  : 'var(--color-text-primary)',
                border: `1px solid ${isGrace ? 'var(--color-btn-primary-bg)' : 'var(--color-border-default)'}`,
                opacity: day.isFuture ? 0.4 : 1,
                minWidth: '3.5rem',
                textAlign: 'center',
                lineHeight: 1.2,
                transition: 'all 0.15s',
              }}
              title={isGrace
                ? `Grace day marked for ${day.iso}. Tap to unmark.`
                : day.isFuture
                  ? 'Future days cannot be marked yet.'
                  : `Mark ${day.iso} as a grace day.`}
            >
              <div>{day.weekday}</div>
              <div style={{ fontWeight: 600 }}>{day.display}</div>
            </button>
          )
        })}
      </div>
      {graceDays.length > 0 && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
        }}>
          {graceDays.length} day{graceDays.length === 1 ? '' : 's'} marked as grace — those days are excluded from both the denominator and numerator of this week's allowance %.
        </div>
      )}
    </div>
  )
}
