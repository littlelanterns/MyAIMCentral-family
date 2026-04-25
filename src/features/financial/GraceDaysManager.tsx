// PRD-28 NEW-GG → NEW-TT (Worker B1b + ALLOWANCE-COMPLETE Row 7) —
// Grace Days marking UI with per-day mode picker.
//
// Each day in the period is a chip. Three states per chip:
//   1. UNMARKED     — day number only. Tap = mark as Skip (default).
//   2. SKIP         — "[weekday] [m/d] · Skip" + tappable swap icon.
//                      Tap day area = unmark. Tap swap = switch to Keep credit.
//   3. KEEP CREDIT  — "[weekday] [m/d] · Keep credit" + tappable swap icon.
//                      Tap day area = unmark. Tap swap = switch to Skip.
//
// Mode semantics (per RPC migration 100175):
//   - Skip (full_exclude): day removed from BOTH numerator and denominator
//     of the allowance %. As if the day didn't exist.
//   - Keep credit (numerator_keep): day removed from denominator ONLY.
//     Whatever the kid completed that day stays in the numerator.
//
// First-time tooltip: shown on the first chip-mark per session via
// localStorage flag, explains both modes briefly.

import { useMemo, useState, useEffect } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { useAddGraceDay, useRemoveGraceDay } from '@/hooks/useFinancial'
import type { GraceDayEntry, GraceDayMode } from '@/hooks/useFinancial'
import { normalizeGraceDayEntry } from '@/hooks/useFinancial'
import { todayLocalIso } from '@/utils/dates'

interface GraceDaysManagerProps {
  periodId: string
  periodStart: string // YYYY-MM-DD
  periodEnd: string   // YYYY-MM-DD
  graceDays: GraceDayEntry[] // current grace-day entries (string or object form)
  disabled?: boolean         // when master toggle is off
}

const FIRST_USE_KEY = 'myaim:grace_mode_first_use_seen'

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

  // First-time tooltip flag — show once per browser then suppress.
  const [showFirstUseTip, setShowFirstUseTip] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = window.localStorage.getItem(FIRST_USE_KEY)
    if (!seen) setShowFirstUseTip(true)
  }, [])

  const days = useMemo(() => {
    const out: Array<{ iso: string; weekday: string; display: string; isFuture: boolean }> = []
    const [sY, sM, sD] = periodStart.split('-').map(Number)
    const [eY, eM, eD] = periodEnd.split('-').map(Number)
    const start = new Date(Date.UTC(sY, sM - 1, sD))
    const end = new Date(Date.UTC(eY, eM - 1, eD))
    const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      // eslint-disable-next-line no-restricted-syntax -- d is explicitly UTC-constructed; UTC slice is correct here
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

  // Build a date -> mode lookup that tolerates legacy string entries.
  const modeByDate = useMemo(() => {
    const map = new Map<string, GraceDayMode>()
    for (const entry of graceDays) {
      const norm = normalizeGraceDayEntry(entry)
      map.set(norm.date, norm.mode)
    }
    return map
  }, [graceDays])

  const dismissFirstUseTip = () => {
    setShowFirstUseTip(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FIRST_USE_KEY, '1')
    }
  }

  const handleDayTap = (iso: string) => {
    if (disabled) return
    const mode = modeByDate.get(iso)
    if (mode) {
      // Already marked → unmark.
      removeGrace.mutate({ periodId, date: iso })
    } else {
      // Not marked → mark as Skip (default). Show first-use tip if needed.
      addGrace.mutate({ periodId, date: iso, mode: 'full_exclude' })
      if (showFirstUseTip) {
        // Keep the tip visible briefly so mom sees it surface near the
        // chip she just tapped; she dismisses by tapping again.
      }
    }
  }

  const handleSwapMode = (iso: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    const current = modeByDate.get(iso)
    if (!current) return // can't swap an unmarked day
    const next: GraceDayMode = current === 'full_exclude' ? 'numerator_keep' : 'full_exclude'
    addGrace.mutate({ periodId, date: iso, mode: next })
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
          : 'Tap a day to mark it. Tap the swap icon on a marked day to switch between Skip and Keep credit.'}
      </div>

      {/* First-use tooltip — explains both modes. Dismisses on tap. */}
      {!disabled && showFirstUseTip && (
        <div
          role="note"
          data-testid="grace-mode-first-use-tip"
          onClick={dismissFirstUseTip}
          style={{
            marginBottom: '0.625rem',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            background: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 35%, transparent)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-primary)',
            lineHeight: 1.4,
            cursor: 'pointer',
          }}
        >
          <strong>Two modes per grace day:</strong>{' '}
          <em>Skip</em> = day doesn't count at all (denominator + numerator both shrink).{' '}
          <em>Keep credit</em> = denominator shrinks but kid keeps any credit they earned that day.
          Tap the swap icon on a marked chip to switch. Tap this message to dismiss.
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {days.map(day => {
          const mode = modeByDate.get(day.iso)
          const isMarked = !!mode
          const isDisabled = disabled || day.isFuture || pending
          const modeLabel =
            mode === 'numerator_keep' ? 'Keep credit' : mode === 'full_exclude' ? 'Skip' : ''

          return (
            <div
              key={day.iso}
              data-testid={`grace-day-chip-${day.iso}`}
              style={{
                display: 'inline-flex',
                alignItems: 'stretch',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                background: isMarked
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-bg-secondary)',
                border: `1px solid ${isMarked ? 'var(--color-btn-primary-bg)' : 'var(--color-border-default)'}`,
                opacity: day.isFuture ? 0.4 : 1,
                overflow: 'hidden',
                transition: 'all 0.15s',
              }}
            >
              {/* Day-tap area: toggles marked/unmarked. */}
              <button
                type="button"
                disabled={isDisabled}
                aria-pressed={isMarked}
                aria-label={
                  isMarked
                    ? `${day.iso} marked as ${modeLabel}. Tap to unmark.`
                    : day.isFuture
                      ? `${day.iso} (future — cannot mark yet)`
                      : `Mark ${day.iso} as a grace day.`
                }
                data-testid={`grace-day-${day.iso}`}
                onClick={() => handleDayTap(day.iso)}
                style={{
                  padding: '0.5rem 0.625rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  color: isMarked
                    ? 'var(--color-text-on-primary)'
                    : 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem',
                  minWidth: '3.5rem',
                }}
              >
                <div>{day.weekday}</div>
                <div style={{ fontWeight: 600 }}>{day.display}</div>
                {isMarked && (
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      opacity: 0.95,
                    }}
                  >
                    {modeLabel}
                  </div>
                )}
              </button>

              {/* Mode-swap icon — only on marked chips. Tappable, separate
                  click area from the day toggle. */}
              {isMarked && !disabled && (
                <button
                  type="button"
                  disabled={pending}
                  data-testid={`grace-day-swap-${day.iso}`}
                  aria-label={
                    mode === 'full_exclude'
                      ? `Switch ${day.iso} to Keep credit mode`
                      : `Switch ${day.iso} to Skip mode`
                  }
                  title={
                    mode === 'full_exclude'
                      ? 'Currently Skip — tap to switch to Keep credit'
                      : 'Currently Keep credit — tap to switch to Skip'
                  }
                  onClick={(e) => handleSwapMode(day.iso, e)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: 'color-mix(in srgb, var(--color-text-on-primary) 18%, transparent)',
                    border: 'none',
                    borderLeft: '1px solid color-mix(in srgb, var(--color-text-on-primary) 25%, transparent)',
                    color: 'var(--color-text-on-primary)',
                    cursor: pending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  <ArrowLeftRight size={12} aria-hidden="true" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {graceDays.length > 0 && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
        }}>
          {graceDays.length} day{graceDays.length === 1 ? '' : 's'} marked.
          {' '}
          {Array.from(modeByDate.values()).filter(m => m === 'numerator_keep').length > 0
            ? '"Keep credit" days shrink the denominator only — kid keeps what they did. "Skip" days shrink both sides.'
            : '"Skip" days are excluded from both the denominator and numerator of this week\'s allowance %.'}
        </div>
      )}
    </div>
  )
}
