/**
 * Universal Scheduler Component (PRD-35)
 *
 * Reusable scheduling component embedded in Tasks, Calendar, Meetings, Permissions.
 * Progressive disclosure: Quick Picks → Custom → More Options.
 * Output is RRULE JSONB stored in the consuming feature's column.
 */

import { useState, useCallback } from 'react'
import {
  Clock, Plus, X, ChevronDown, ChevronUp, Calendar as CalendarIcon,
} from 'lucide-react'
import { FeatureGuide } from '@/components/shared'
import type {
  UniversalSchedulerProps, FrequencyType, SchedulerOutput,
} from './types'
import {
  DAY_LABELS_FULL, ORDINAL_LABELS, ORDINAL_VALUES,
  MONTH_LABELS, CUSTODY_PRESETS,
} from './types'
import { useSchedulerState } from './useSchedulerState'
import { WeekdayCircles } from './WeekdayCircles'
import { CalendarPreview } from './CalendarPreview'

const ALL_FREQUENCIES: { value: FrequencyType; label: string }[] = [
  { value: 'one_time', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
]

export function UniversalScheduler({
  value,
  onChange,
  showTimeDefault = false,
  compactMode = false,
  allowedFrequencies,
  timezone = 'America/Chicago',
}: UniversalSchedulerProps) {
  const stableOnChange = useCallback((v: SchedulerOutput) => onChange(v), [onChange])
  const { state, dispatch, output } = useSchedulerState(value, stableOnChange, showTimeDefault, timezone)
  const [showAdvanced, setShowAdvanced] = useState(!!state.advancedMode)
  const [showCalendar, setShowCalendar] = useState(false)

  const frequencies = allowedFrequencies
    ? ALL_FREQUENCIES.filter(f => allowedFrequencies.includes(f.value))
    : ALL_FREQUENCIES

  // ─── Compact Mode: day-of-week circles only ───────────────────
  if (compactMode) {
    return (
      <div className="space-y-2">
        <WeekdayCircles
          selected={state.selectedDays}
          onToggle={(day) => dispatch({ type: 'TOGGLE_DAY', day })}
          label="Repeat on"
        />
      </div>
    )
  }

  const inputStyle = {
    backgroundColor: 'var(--color-bg-primary)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
  }

  return (
    <div className="space-y-4">
      <FeatureGuide
        featureKey="scheduler_basic"
        title="Schedule & Recurrence"
        description="Set when this repeats. Pick a quick option or customize with advanced patterns."
        bullets={[
          'Tap days to select, add time if needed',
          'View your schedule on the calendar preview',
          'Skip specific dates with exceptions',
        ]}
      />

      {/* ── Frequency Picker ── */}
      <div>
        <div className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          How often?
        </div>
        <div className="flex flex-wrap gap-1.5">
          {frequencies.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => dispatch({ type: 'SET_FREQUENCY', frequency: f.value })}
              className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                backgroundColor: state.frequency === f.value ? 'var(--color-sage-teal, #68a395)' : 'transparent',
                color: state.frequency === f.value ? 'white' : 'var(--color-dark-teal, #2a5a4e)',
                border: `1.5px solid var(--color-sage-teal, #68a395)`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Frequency-Specific Config ── */}
      <FrequencyConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />

      {/* ── Time Picker ── */}
      <div>
        {state.showTime ? (
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: 'var(--color-text-secondary)' }} />
            <input
              type="time"
              value={state.time}
              onChange={(e) => dispatch({ type: 'SET_TIME', time: e.target.value })}
              className="px-3 py-1.5 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
            <button type="button" onClick={() => dispatch({ type: 'TOGGLE_TIME' })}
              className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => dispatch({ type: 'TOGGLE_TIME' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
            style={{ border: '1px dashed var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <Plus size={14} /> Add time
          </button>
        )}
      </div>

      {/* ── Schedule Until ── */}
      {state.frequency !== 'one_time' && (
        <div>
          <div className="text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
            Schedule until
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={state.untilMode}
              onChange={(e) => dispatch({ type: 'SET_UNTIL_MODE', mode: e.target.value as 'ongoing' | 'date' | 'count' })}
              className="px-3 py-1.5 rounded-lg text-sm outline-none"
              style={inputStyle}
            >
              <option value="ongoing">Ongoing</option>
              <option value="date">Specific date</option>
              <option value="count">After X times</option>
            </select>
            {state.untilMode === 'date' && (
              <input type="date" value={state.untilDate}
                onChange={(e) => dispatch({ type: 'SET_UNTIL_DATE', date: e.target.value })}
                className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}
              />
            )}
            {state.untilMode === 'count' && (
              <div className="flex items-center gap-1">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>After</span>
                <input type="number" min={1} value={state.untilCount}
                  onChange={(e) => dispatch({ type: 'SET_UNTIL_COUNT', count: parseInt(e.target.value) || 1 })}
                  className="w-16 px-2 py-1.5 rounded-lg text-sm text-center outline-none" style={inputStyle}
                />
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>times</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Advanced Options (under Custom) ── */}
      {state.frequency === 'custom' && (
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-sm font-medium w-full"
            style={{ color: 'var(--color-dark-teal, #2a5a4e)' }}
          >
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            More scheduling options
          </button>
          {showAdvanced && <AdvancedSection state={state} dispatch={dispatch} inputStyle={inputStyle} />}
        </div>
      )}

      {/* ── Exceptions ── */}
      {state.frequency !== 'one_time' && (
        <ExceptionSection state={state} dispatch={dispatch} inputStyle={inputStyle} />
      )}

      {/* ── Calendar Preview Toggle ── */}
      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        className="flex items-center gap-1.5 text-sm font-medium w-full"
        style={{ color: 'var(--color-dark-teal, #2a5a4e)' }}
      >
        {showCalendar ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <CalendarIcon size={14} />
        View on calendar
      </button>
      {showCalendar && (
        <CalendarPreview output={output} dispatch={dispatch} />
      )}
    </div>
  )
}

// ─── Frequency-Specific Configuration ───────────────────────────────────

function FrequencyConfig({ state, dispatch, inputStyle }: {
  state: ReturnType<typeof useSchedulerState>['state']
  dispatch: React.Dispatch<any>
  inputStyle: React.CSSProperties
}) {
  switch (state.frequency) {
    case 'one_time':
      return (
        <div>
          <input type="date" value={state.oneTimeDate}
            onChange={(e) => dispatch({ type: 'SET_ONE_TIME_DATE', date: e.target.value })}
            className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}
          />
        </div>
      )

    case 'daily':
      return null // Daily is daily — no extra config

    case 'weekly':
      return (
        <WeekdayCircles
          selected={state.selectedDays}
          onToggle={(day) => dispatch({ type: 'TOGGLE_DAY', day })}
          label="Repeat on"
        />
      )

    case 'monthly':
      return <MonthlyConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />

    case 'yearly':
      return <YearlyConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />

    case 'custom':
      return <CustomConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />

    default:
      return null
  }
}

// ─── Monthly Config ─────────────────────────────────────────────────────

function MonthlyConfig({ state, dispatch, inputStyle }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <label className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
          <input type="radio" checked={state.monthlyMode === 'weekday'}
            onChange={() => dispatch({ type: 'SET_MONTHLY_MODE', mode: 'weekday' })}
          /> Recurring weekday
        </label>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
          <input type="radio" checked={state.monthlyMode === 'date'}
            onChange={() => dispatch({ type: 'SET_MONTHLY_MODE', mode: 'date' })}
          /> Recurring date
        </label>
      </div>

      {state.monthlyMode === 'weekday' && (
        <div className="space-y-2">
          {state.monthlyWeekdays.map((row: any) => (
            <div key={row.id} className="flex items-center gap-2">
              <select value={row.ordinal}
                onChange={(e) => dispatch({ type: 'UPDATE_MONTHLY_WEEKDAY', id: row.id, ordinal: parseInt(e.target.value) })}
                className="px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}>
                {ORDINAL_VALUES.map((v, i) => <option key={v} value={v}>{ORDINAL_LABELS[i]}</option>)}
              </select>
              <select value={row.weekday}
                onChange={(e) => dispatch({ type: 'UPDATE_MONTHLY_WEEKDAY', id: row.id, weekday: parseInt(e.target.value) })}
                className="px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}>
                {DAY_LABELS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
              {state.monthlyWeekdays.length > 1 && (
                <button type="button" onClick={() => dispatch({ type: 'REMOVE_MONTHLY_WEEKDAY', id: row.id })}
                  className="p-1 rounded" style={{ color: 'var(--color-error, #b25a58)' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => dispatch({ type: 'ADD_MONTHLY_WEEKDAY' })}
            className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-sage-teal, #68a395)' }}>
            <Plus size={14} /> Add another weekday
          </button>
        </div>
      )}

      {state.monthlyMode === 'date' && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 31 }, (_, i) => i + 1).concat([-1]).map(d => (
              <button key={d} type="button"
                onClick={() => dispatch({ type: 'TOGGLE_MONTHLY_DATE', date: d })}
                className="w-9 h-9 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                style={{
                  backgroundColor: state.monthlyDates.includes(d) ? 'var(--color-sage-teal, #68a395)' : 'transparent',
                  color: state.monthlyDates.includes(d) ? 'white' : 'var(--color-text-primary)',
                  border: state.monthlyDates.includes(d) ? '1.5px solid var(--color-sage-teal, #68a395)' : '1.5px solid var(--color-border)',
                }}>
                {d === -1 ? 'Last' : d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Yearly Config ──────────────────────────────────────────────────────

function YearlyConfig({ state, dispatch, inputStyle }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties
}) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          In which months?
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MONTH_LABELS.map((label, i) => {
            const month = i + 1
            const active = state.selectedMonths.includes(month)
            return (
              <button key={month} type="button"
                onClick={() => dispatch({ type: 'TOGGLE_MONTH', month })}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? 'var(--color-sage-teal, #68a395)' : 'transparent',
                  color: active ? 'white' : 'var(--color-text-primary)',
                  border: `1.5px solid ${active ? 'var(--color-sage-teal, #68a395)' : 'var(--color-border)'}`,
                }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          On which day?
        </div>
        <div className="flex gap-3 mb-2">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
            <input type="radio" checked={state.yearlyMode === 'date'}
              onChange={() => dispatch({ type: 'SET_YEARLY_MODE', mode: 'date' })} /> Specific date
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
            <input type="radio" checked={state.yearlyMode === 'weekday'}
              onChange={() => dispatch({ type: 'SET_YEARLY_MODE', mode: 'weekday' })} /> Specific weekday
          </label>
        </div>

        {state.yearlyMode === 'date' && (
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 31 }, (_, i) => i + 1).concat([-1]).map(d => (
              <button key={d} type="button"
                onClick={() => dispatch({ type: 'TOGGLE_YEARLY_DATE', date: d })}
                className="w-8 h-8 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                style={{
                  backgroundColor: state.yearlyDates.includes(d) ? 'var(--color-sage-teal, #68a395)' : 'transparent',
                  color: state.yearlyDates.includes(d) ? 'white' : 'var(--color-text-primary)',
                  border: state.yearlyDates.includes(d) ? '1.5px solid var(--color-sage-teal, #68a395)' : '1.5px solid var(--color-border)',
                }}>
                {d === -1 ? 'Last' : d}
              </button>
            ))}
          </div>
        )}

        {state.yearlyMode === 'weekday' && (
          <div className="space-y-2">
            {state.yearlyWeekdays.map((row: any) => (
              <div key={row.id} className="flex items-center gap-2">
                <select value={row.ordinal}
                  onChange={(e) => dispatch({ type: 'UPDATE_YEARLY_WEEKDAY', id: row.id, ordinal: parseInt(e.target.value) })}
                  className="px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}>
                  {ORDINAL_VALUES.map((v, i) => <option key={v} value={v}>{ORDINAL_LABELS[i]}</option>)}
                </select>
                <select value={row.weekday}
                  onChange={(e) => dispatch({ type: 'UPDATE_YEARLY_WEEKDAY', id: row.id, weekday: parseInt(e.target.value) })}
                  className="px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}>
                  {DAY_LABELS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
                {state.yearlyWeekdays.length > 1 && (
                  <button type="button" onClick={() => dispatch({ type: 'REMOVE_YEARLY_WEEKDAY', id: row.id })}
                    className="p-1 rounded" style={{ color: 'var(--color-error, #b25a58)' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => dispatch({ type: 'ADD_YEARLY_WEEKDAY' })}
              className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-sage-teal, #68a395)' }}>
              <Plus size={14} /> Add another weekday
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Custom Config ──────────────────────────────────────────────────────

function CustomConfig({ state, dispatch, inputStyle }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties
}) {
  // Skip custom config if an advanced mode is active — it handles its own UI
  if (state.advancedMode) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Every</span>
        <input type="number" min={1} value={state.customInterval}
          onChange={(e) => dispatch({ type: 'SET_CUSTOM_INTERVAL', interval: parseInt(e.target.value) || 1 })}
          className="w-16 px-2 py-1.5 rounded-lg text-sm text-center outline-none" style={inputStyle}
        />
        <select value={state.customUnit}
          onChange={(e) => dispatch({ type: 'SET_CUSTOM_UNIT', unit: e.target.value })}
          className="px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}>
          <option value="days">days</option>
          <option value="weeks">weeks</option>
          <option value="months">months</option>
          <option value="years">years</option>
        </select>
      </div>

      {(state.customUnit === 'days' || state.customUnit === 'weeks') && (
        <WeekdayCircles
          selected={state.selectedDays}
          onToggle={(day) => dispatch({ type: 'TOGGLE_DAY', day })}
          label="On these days"
        />
      )}

      {(state.customUnit === 'months' || state.customUnit === 'years') && (
        <MonthlyConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />
      )}
    </div>
  )
}

// ─── Advanced Options Section ───────────────────────────────────────────

function AdvancedSection({ state, dispatch, inputStyle }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties
}) {
  const modes = [
    { value: 'alternating' as const, label: 'Alternating weeks' },
    { value: 'custody' as const, label: 'Multi-week pattern' },
    { value: 'seasonal' as const, label: 'Seasonal / date range' },
    { value: 'completion_dependent' as const, label: 'Completion-dependent' },
  ]

  return (
    <div className="mt-3 space-y-3 pl-2 border-l-2" style={{ borderColor: 'var(--color-border)' }}>
      {modes.map(m => (
        <div key={m.value}>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
            <input type="radio" name="advanced_mode"
              checked={state.advancedMode === m.value}
              onChange={() => dispatch({ type: 'SET_ADVANCED_MODE', mode: state.advancedMode === m.value ? null : m.value })}
            />
            {m.label}
          </label>
          {state.advancedMode === m.value && (
            <div className="mt-2 ml-6">
              {m.value === 'alternating' && <AlternatingConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />}
              {m.value === 'custody' && <CustodyConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />}
              {m.value === 'seasonal' && <SeasonalConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />}
              {m.value === 'completion_dependent' && <CompletionConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AlternatingConfig({ state, dispatch, inputStyle }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Set which days belong to Week A vs Week B. Repeats every 2 weeks from the anchor date.
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Starts</span>
        <input type="date" value={state.alternatingAnchor}
          onChange={(e) => dispatch({ type: 'SET_ALTERNATING_ANCHOR', date: e.target.value })}
          className="px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}
        />
      </div>
      <WeekdayCircles selected={state.weekADays} onToggle={(d) => dispatch({ type: 'TOGGLE_WEEK_A_DAY', day: d })} label="Week A" />
      <WeekdayCircles selected={state.weekBDays} onToggle={(d) => dispatch({ type: 'TOGGLE_WEEK_B_DAY', day: d })} label="Week B" />
    </div>
  )
}

function CustodyConfig({ state, dispatch, inputStyle }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties
}) {
  const patternLen = state.custodyPattern.length
  const weeks = Math.ceil(patternLen / 7)
  const dayHeaders = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        For custody schedules and complex rotations. Pick a preset or tap days to switch.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(CUSTODY_PRESETS).map(([key, pattern]) => (
          <button key={key} type="button"
            onClick={() => dispatch({ type: 'SET_CUSTODY_PATTERN', pattern })}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-golden-honey, #d4a843)',
              color: 'white',
            }}>
            {key === 'week_on_off' ? 'Week on/off' : key}
          </button>
        ))}
        <button type="button"
          onClick={() => dispatch({ type: 'SET_CUSTODY_PATTERN', pattern: Array(14).fill('A') })}
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
          Build my own
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: 'repeat(7, 2.25rem)' }}>
          {dayHeaders.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: 'var(--color-text-secondary)' }}>{d}</div>
          ))}
          {state.custodyPattern.map((side: string, idx: number) => (
            <button key={idx} type="button"
              onClick={() => dispatch({ type: 'TOGGLE_CUSTODY_DAY', index: idx })}
              className="h-9 rounded text-xs font-medium transition-colors flex items-center justify-center"
              style={{
                backgroundColor: side === 'A' ? 'var(--color-sage-teal, #68a395)' : 'var(--color-vintage-plum, #8b5e7e)',
                color: 'white',
              }}>
              {side === 'A' ? state.custodyLabels.A.slice(0, 3) : state.custodyLabels.B.slice(0, 2)}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }} />
          {state.custodyLabels.A}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--color-vintage-plum, #8b5e7e)' }} />
          {state.custodyLabels.B}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pattern starts</span>
        <input type="date" value={state.custodyAnchor}
          onChange={(e) => dispatch({ type: 'SET_CUSTODY_ANCHOR', date: e.target.value })}
          className="px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}
        />
      </div>
    </div>
  )
}

function SeasonalConfig({ state, dispatch, inputStyle }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties
}) {
  return (
    <div className="space-y-2">
      {state.seasonalRanges.map((range: any) => (
        <div key={range.id} className="flex items-center gap-2 flex-wrap">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>From</span>
          <input type="date" value={range.from}
            onChange={(e) => dispatch({ type: 'UPDATE_SEASONAL_RANGE', id: range.id, field: 'from', value: e.target.value })}
            className="px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}
          />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>to</span>
          <input type="date" value={range.to}
            onChange={(e) => dispatch({ type: 'UPDATE_SEASONAL_RANGE', id: range.id, field: 'to', value: e.target.value })}
            className="px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}
          />
          <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={range.yearly}
              onChange={(e) => dispatch({ type: 'UPDATE_SEASONAL_RANGE', id: range.id, field: 'yearly', value: e.target.checked })}
            /> Yearly
          </label>
          {state.seasonalRanges.length > 1 && (
            <button type="button" onClick={() => dispatch({ type: 'REMOVE_SEASONAL_RANGE', id: range.id })}
              className="p-1 rounded" style={{ color: 'var(--color-error, #b25a58)' }}><X size={14} /></button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => dispatch({ type: 'ADD_SEASONAL_RANGE' })}
        className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-sage-teal, #68a395)' }}>
        <Plus size={14} /> Add another range
      </button>
    </div>
  )
}

function CompletionConfig({ state, dispatch, inputStyle }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Next occurrence calculated from when you actually complete this item, not a fixed calendar date.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Every</span>
        <input type="number" min={1} value={state.completionInterval}
          onChange={(e) => dispatch({ type: 'SET_COMPLETION_INTERVAL', interval: parseInt(e.target.value) || 1 })}
          className="w-16 px-2 py-1.5 rounded-lg text-sm text-center outline-none" style={inputStyle}
        />
        <select value={state.completionUnit}
          onChange={(e) => dispatch({ type: 'SET_COMPLETION_UNIT', unit: e.target.value })}
          className="px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}>
          <option value="days">days</option>
          <option value="weeks">weeks</option>
          <option value="months">months</option>
        </select>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>after last completion</span>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
        <input type="checkbox" checked={state.completionWindowEnabled}
          onChange={() => dispatch({ type: 'TOGGLE_COMPLETION_WINDOW' })}
        /> Allow a due window
      </label>

      {state.completionWindowEnabled && (
        <div className="flex items-center gap-2 flex-wrap ml-6">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Due between</span>
          <input type="number" min={1} value={state.completionWindowStart}
            onChange={(e) => dispatch({ type: 'SET_COMPLETION_WINDOW_START', value: parseInt(e.target.value) || 1 })}
            className="w-16 px-2 py-1.5 rounded-lg text-sm text-center outline-none" style={inputStyle}
          />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>and</span>
          <input type="number" min={1} value={state.completionWindowEnd}
            onChange={(e) => dispatch({ type: 'SET_COMPLETION_WINDOW_END', value: parseInt(e.target.value) || 1 })}
            className="w-16 px-2 py-1.5 rounded-lg text-sm text-center outline-none" style={inputStyle}
          />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{state.completionUnit}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>First occurrence from</span>
        <input type="date" value={state.completionAnchor}
          onChange={(e) => dispatch({ type: 'SET_COMPLETION_ANCHOR', date: e.target.value })}
          className="px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}
        />
      </div>
    </div>
  )
}

// ─── Exception Dates Section ────────────────────────────────────────────

function ExceptionSection({ state, dispatch, inputStyle }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties
}) {
  const [newDate, setNewDate] = useState('')

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
        Exceptions
      </div>
      <div className="flex items-center gap-2">
        <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
          className="px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}
        />
        <button type="button"
          onClick={() => { if (newDate) { dispatch({ type: 'ADD_EXDATE', date: newDate }); setNewDate('') } }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm"
          style={{ border: '1px dashed var(--color-border)', color: 'var(--color-text-secondary)' }}>
          <Plus size={14} /> Skip date
        </button>
      </div>
      {state.exdates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {state.exdates.map((d: string) => (
            <span key={d} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
              {d}
              <button type="button" onClick={() => dispatch({ type: 'REMOVE_EXDATE', date: d })}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
        <input type="checkbox" checked={state.schoolYearOnly}
          onChange={() => dispatch({ type: 'TOGGLE_SCHOOL_YEAR_ONLY' })}
        /> School-year only
      </label>
    </div>
  )
}
