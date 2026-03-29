/**
 * MiniCalendarPicker — shared compact month grid with fast date navigation.
 *
 * Used by:
 * - Calendar page toolbar (jump-to-date popup)
 * - DateDetailModal header (jump-to-date popup)
 * - Calendar Dashboard Widget (jump-to-date popup)
 * - Universal Scheduler (calendar preview under Custom)
 *
 * Features:
 * - Clickable month name → dropdown of 12 months
 * - Clickable year → inline editable text field
 * - Prev/next month arrows
 * - Optional "Today" button
 * - Respects weekStartDay (0=Sunday, 1=Monday)
 * - Highlights selected date, today, and optional highlighted/exception/manual dates
 * - All colors via CSS custom properties
 *
 * Spec: specs/Universal-Scheduler-Calendar-Consolidated-Update.md → Part 2
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface MiniCalendarPickerProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  /** Dates to highlight (e.g., RRULE instances in scheduler preview) */
  highlightedDates?: Date[]
  /** Exception dates (EXDATE in scheduler preview — shown dimmed with strikethrough) */
  exceptionDates?: Date[]
  /** Manual dates (RDATE in scheduler preview) */
  manualDates?: Date[]
  /** Enable click-to-toggle exceptions/manual dates in scheduler mode */
  allowToggleExceptions?: boolean
  /** Callback when a date is toggled as exception or manual */
  onToggleDate?: (date: Date, action: 'add_exception' | 'remove_exception' | 'add_manual' | 'remove_manual') => void
  /** 0=Sunday, 1=Monday */
  weekStartDay?: 0 | 1
  /** Show "Today" button */
  showTodayButton?: boolean
  /** Smaller cells for inline embedding */
  compact?: boolean
  /** Custom highlight color per date (e.g., custody pattern colors) */
  highlightColor?: (date: Date) => string | undefined
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const DAY_LABELS_SUN = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']
const DAY_LABELS_MON = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su']

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildDateSet(dates?: Date[]): Set<string> {
  const s = new Set<string>()
  if (dates) {
    for (const d of dates) s.add(toDateKey(d))
  }
  return s
}

export function MiniCalendarPicker({
  selectedDate,
  onDateSelect,
  highlightedDates,
  exceptionDates,
  manualDates,
  allowToggleExceptions,
  onToggleDate,
  weekStartDay = 0,
  showTodayButton = false,
  compact = false,
  highlightColor,
}: MiniCalendarPickerProps) {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth())
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [editingYear, setEditingYear] = useState(false)
  const [yearInput, setYearInput] = useState(String(selectedDate.getFullYear()))
  const yearInputRef = useRef<HTMLInputElement>(null)
  const monthDropdownRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const todayKey = toDateKey(today)
  const selectedKey = toDateKey(selectedDate)

  const highlightSet = buildDateSet(highlightedDates)
  const exceptionSet = buildDateSet(exceptionDates)
  const manualSet = buildDateSet(manualDates)

  const cellSize = compact ? 28 : 32

  // Close month dropdown on outside click
  useEffect(() => {
    if (!showMonthDropdown) return
    function handleClick(e: MouseEvent) {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setShowMonthDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMonthDropdown])

  // Focus year input when editing
  useEffect(() => {
    if (editingYear && yearInputRef.current) {
      yearInputRef.current.focus()
      yearInputRef.current.select()
    }
  }, [editingYear])

  const goToPrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(y => y - 1)
    } else {
      setViewMonth(m => m - 1)
    }
  }, [viewMonth])

  const goToNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(y => y + 1)
    } else {
      setViewMonth(m => m + 1)
    }
  }, [viewMonth])

  const goToToday = useCallback(() => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }, [today])

  const handleMonthSelect = useCallback((month: number) => {
    setViewMonth(month)
    setShowMonthDropdown(false)
  }, [])

  const handleYearSubmit = useCallback(() => {
    const parsed = parseInt(yearInput, 10)
    if (!isNaN(parsed) && parsed > 1900 && parsed < 2200) {
      setViewYear(parsed)
    } else {
      setYearInput(String(viewYear))
    }
    setEditingYear(false)
  }, [yearInput, viewYear])

  function handleDayClick(date: Date) {
    const key = toDateKey(date)

    if (allowToggleExceptions && onToggleDate) {
      if (exceptionSet.has(key)) {
        onToggleDate(date, 'remove_exception')
        return
      }
      if (highlightSet.has(key)) {
        onToggleDate(date, 'add_exception')
        return
      }
      if (manualSet.has(key)) {
        onToggleDate(date, 'remove_manual')
        return
      }
      onToggleDate(date, 'add_manual')
      return
    }

    onDateSelect(date)
  }

  // Build the calendar grid
  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startDow = firstOfMonth.getDay() // 0=Sun

  // Offset to align with weekStartDay
  const offset = (startDow - weekStartDay + 7) % 7
  const dayLabels = weekStartDay === 1 ? DAY_LABELS_MON : DAY_LABELS_SUN

  // Build 6 weeks of cells (42 cells max)
  const cells: (Date | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewYear, viewMonth, d))
  }
  while (cells.length < 42 && cells.length % 7 !== 0) {
    cells.push(null)
  }

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  // Remove trailing empty weeks
  while (weeks.length > 0 && weeks[weeks.length - 1].every(c => c === null)) {
    weeks.pop()
  }

  return (
    <div
      style={{
        width: compact ? `${cellSize * 7 + 12}px` : `${cellSize * 7 + 24}px`,
        padding: compact ? '6px' : '12px',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--vibe-radius-card, 12px)',
        border: '1px solid var(--color-border)',
        fontFamily: 'var(--font-body)',
        userSelect: 'none',
      }}
    >
      {/* Header: arrows + month + year */}
      <div className="flex items-center justify-between" style={{ marginBottom: compact ? '4px' : '8px' }}>
        <button
          onClick={goToPrevMonth}
          className="flex items-center justify-center rounded-full"
          style={{
            width: compact ? '24px' : '28px',
            height: compact ? '24px' : '28px',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            border: 'none',
            minHeight: 'unset',
            cursor: 'pointer',
          }}
          aria-label="Previous month"
        >
          <ChevronLeft size={compact ? 14 : 16} />
        </button>

        <div className="flex items-center gap-1">
          {/* Clickable month name → dropdown */}
          <div className="relative" ref={monthDropdownRef}>
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="text-xs font-semibold"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-heading)',
                cursor: 'pointer',
                minHeight: 'unset',
                padding: '2px 4px',
                borderRadius: '4px',
              }}
            >
              {compact ? MONTH_SHORT[viewMonth] : MONTH_NAMES[viewMonth]}
            </button>
            {showMonthDropdown && (
              <div
                className="absolute z-50 grid grid-cols-3 gap-0.5 p-1"
                style={{
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  boxShadow: 'var(--shadow-md)',
                  minWidth: '140px',
                }}
              >
                {MONTH_SHORT.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => handleMonthSelect(i)}
                    className="text-xs rounded px-2 py-1"
                    style={{
                      background: i === viewMonth ? 'var(--color-btn-primary-bg)' : 'transparent',
                      color: i === viewMonth ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                      border: 'none',
                      minHeight: 'unset',
                      cursor: 'pointer',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clickable year → editable text field */}
          {editingYear ? (
            <input
              ref={yearInputRef}
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              onBlur={handleYearSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleYearSubmit()
                if (e.key === 'Escape') {
                  setYearInput(String(viewYear))
                  setEditingYear(false)
                }
              }}
              className="text-xs font-semibold text-center"
              style={{
                width: '50px',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                color: 'var(--color-text-heading)',
                padding: '1px 4px',
                minHeight: 'unset',
              }}
            />
          ) : (
            <button
              onClick={() => {
                setYearInput(String(viewYear))
                setEditingYear(true)
              }}
              className="text-xs font-semibold"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-heading)',
                cursor: 'pointer',
                minHeight: 'unset',
                padding: '2px 4px',
                borderRadius: '4px',
              }}
            >
              {viewYear}
            </button>
          )}
        </div>

        <button
          onClick={goToNextMonth}
          className="flex items-center justify-center rounded-full"
          style={{
            width: compact ? '24px' : '28px',
            height: compact ? '24px' : '28px',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            border: 'none',
            minHeight: 'unset',
            cursor: 'pointer',
          }}
          aria-label="Next month"
        >
          <ChevronRight size={compact ? 14 : 16} />
        </button>
      </div>

      {/* Today button */}
      {showTodayButton && (
        <div className="flex justify-center" style={{ marginBottom: compact ? '4px' : '6px' }}>
          <button
            onClick={goToToday}
            className="text-[10px] font-medium rounded-full px-2 py-0.5"
            style={{
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              minHeight: 'unset',
              cursor: 'pointer',
            }}
          >
            Today
          </button>
        </div>
      )}

      {/* Day-of-week header */}
      <div className="grid grid-cols-7" style={{ gap: 0, marginBottom: '2px' }}>
        {dayLabels.map((label, i) => (
          <div
            key={`${label}-${i}`}
            className="flex items-center justify-center text-[10px] font-medium"
            style={{
              width: `${cellSize}px`,
              height: '20px',
              color: 'var(--color-text-secondary)',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7" style={{ gap: 0 }}>
          {week.map((date, di) => {
            if (!date) {
              return <div key={`empty-${wi}-${di}`} style={{ width: `${cellSize}px`, height: `${cellSize}px` }} />
            }

            const key = toDateKey(date)
            const isToday = key === todayKey
            const isSelected = key === selectedKey
            const isHighlighted = highlightSet.has(key)
            const isException = exceptionSet.has(key)
            const isManual = manualSet.has(key)
            const customColor = highlightColor?.(date)

            let bg = 'transparent'
            let color = 'var(--color-text-primary)'
            let border = 'none'
            let textDecoration: string | undefined
            let opacity: number | undefined

            if (isSelected) {
              bg = 'var(--color-btn-primary-bg)'
              color = 'var(--color-btn-primary-text)'
            } else if (isException) {
              textDecoration = 'line-through'
              opacity = 0.4
            } else if (customColor) {
              bg = customColor
              color = 'var(--color-btn-primary-text)'
            } else if (isHighlighted || isManual) {
              bg = 'color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)'
            }

            if (isToday && !isSelected) {
              border = '2px solid var(--color-accent, var(--color-btn-primary-bg))'
            }

            return (
              <button
                key={key}
                onClick={() => handleDayClick(date)}
                className="flex items-center justify-center rounded-full text-xs transition-colors"
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  background: bg,
                  color,
                  border,
                  minHeight: 'unset',
                  cursor: 'pointer',
                  textDecoration,
                  opacity,
                  fontWeight: isToday ? 700 : 400,
                  fontSize: compact ? '0.65rem' : '0.75rem',
                }}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
