/**
 * Universal Scheduler Component (PRD-35)
 *
 * Radio-button primary interface ("How Often?") per consolidated update spec.
 * One-Time, Daily, Weekly, Monthly, Yearly as top-level options with inline
 * detail pickers. Custom expands to full scheduling power (intervals, custody,
 * seasonal, completion-dependent).
 *
 * Output is RRULE JSONB stored in the consuming feature's column.
 *
 * Redesigned per specs/Universal-Scheduler-Calendar-Consolidated-Update.md Part 1.
 */

import { useState, useCallback } from 'react'
import {
  Clock, Plus, X, ChevronDown, ChevronUp, Calendar as CalendarIcon,
} from 'lucide-react'
import { FeatureGuide } from '@/components/shared'
import type {
  UniversalSchedulerProps, SchedulerOutput,
} from './types'
import {
  DAY_LABELS_FULL, ORDINAL_LABELS, ORDINAL_VALUES,
  MONTH_LABELS, CUSTODY_PRESETS,
} from './types'
import { useSchedulerState } from './useSchedulerState'
import { WeekdayCircles } from './WeekdayCircles'
import { CalendarPreview } from './CalendarPreview'
import { PickDatesCalendar } from './PickDatesCalendar'

export function UniversalScheduler({
  value,
  onChange,
  showTimeDefault = false,
  compactMode = false,
  allowedFrequencies: _allowedFrequencies,
  timezone = 'America/Chicago',
  weekStartDay = 0,
}: UniversalSchedulerProps) {
  const stableOnChange = useCallback((v: SchedulerOutput) => onChange(v), [onChange])
  const { state, dispatch, output } = useSchedulerState(value, stableOnChange, showTimeDefault, timezone)
  const [showCustomExpanded, setShowCustomExpanded] = useState(!!state.advancedMode)
  const [showCalendar, setShowCalendar] = useState(false)

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-bg-primary)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
  }

  // Determine which radio is selected based on state
  type FreqOption = 'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'pick_dates'
  const activeOption: FreqOption = state.advancedMode ? 'custom' :
    (state.frequency === 'custom' ? 'custom' : state.frequency as FreqOption)

  const selectFrequency = (freq: FreqOption) => {
    if (freq === 'custom') {
      dispatch({ type: 'SET_FREQUENCY', frequency: 'custom' })
      setShowCustomExpanded(true)
    } else {
      dispatch({ type: 'SET_FREQUENCY', frequency: freq })
      dispatch({ type: 'SET_ADVANCED_MODE', mode: null })
      setShowCustomExpanded(false)
    }
  }

  const isRepeating = activeOption !== 'one_time' && activeOption !== 'pick_dates'

  // Radio option definitions
  const radioOptions: { key: FreqOption; label: string; desc: string }[] = compactMode
    ? [
        { key: 'one_time', label: 'One-Time', desc: '' },
        { key: 'daily', label: 'Daily', desc: '' },
        { key: 'weekly', label: 'Weekly', desc: '' },
        { key: 'monthly', label: 'Monthly', desc: '' },
        { key: 'yearly', label: 'Yearly', desc: '' },
        { key: 'custom', label: 'Custom', desc: '' },
        { key: 'pick_dates', label: 'Pick Dates', desc: '' },
      ]
    : [
        { key: 'one_time', label: 'One-Time', desc: 'Something that needs to happen once' },
        { key: 'daily', label: 'Daily', desc: 'Repeats every single day' },
        { key: 'weekly', label: 'Weekly', desc: 'Repeats on specific days each week' },
        { key: 'monthly', label: 'Monthly', desc: 'Repeats each month' },
        { key: 'yearly', label: 'Yearly', desc: 'Repeats once a year' },
        { key: 'custom', label: 'Custom', desc: 'Build your own schedule' },
        { key: 'pick_dates', label: 'Pick Dates', desc: 'Tap specific dates on a calendar' },
      ]

  return (
    <div className="space-y-3">
      {!compactMode && (
        <FeatureGuide
          featureKey="scheduler_basic"
          title="Schedule"
          description="Set when this happens — pick a frequency, choose your days, done."
          bullets={[
            'Pick how often this repeats',
            'Use "Custom" for rotation patterns, seasonal, or interval-based schedules',
            'View your schedule on the calendar preview',
          ]}
        />
      )}

      {/* ── Radio buttons: "How Often?" ── */}
      <div>
        {!compactMode && (
          <div
            className="text-xs font-medium mb-2 uppercase tracking-wider"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            How often?
          </div>
        )}

        <div className="space-y-1">
          {radioOptions.map(opt => (
            <div key={opt.key}>
              {/* Radio button row */}
              <label
                className="flex items-start gap-2.5 rounded-lg px-3 py-2 cursor-pointer transition-colors"
                style={{
                  backgroundColor: activeOption === opt.key ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)' : 'transparent',
                  border: activeOption === opt.key ? '1px solid var(--color-btn-primary-bg)' : '1px solid transparent',
                }}
              >
                <input
                  type="radio"
                  name="scheduler-frequency"
                  checked={activeOption === opt.key}
                  onChange={() => selectFrequency(opt.key)}
                  className="mt-0.5"
                  style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {opt.label}
                  </span>
                  {opt.desc && (
                    <span className="text-xs ml-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                      — {opt.desc}
                    </span>
                  )}
                </div>
              </label>

              {/* ── Inline detail pickers below selected option ── */}
              {activeOption === opt.key && opt.key === 'one_time' && (
                <div className="pl-8 pb-2 flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={state.oneTimeDate}
                    onChange={(e) => dispatch({ type: 'SET_ONE_TIME_DATE', date: e.target.value })}
                    className="px-3 py-1.5 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                  {showTimeDefault || state.showTime ? (
                    <>
                      <input
                        type="time"
                        value={state.time}
                        onChange={(e) => dispatch({ type: 'SET_TIME', time: e.target.value })}
                        className="px-3 py-1.5 rounded-lg text-sm outline-none"
                        style={inputStyle}
                      />
                      {!showTimeDefault && (
                        <button type="button" onClick={() => dispatch({ type: 'TOGGLE_TIME' })} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>remove time</button>
                      )}
                    </>
                  ) : (
                    <button type="button" onClick={() => dispatch({ type: 'TOGGLE_TIME' })} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs" style={{ border: '1px dashed var(--color-border)', color: 'var(--color-text-secondary)' }}>
                      <Clock size={12} /> Add time
                    </button>
                  )}
                </div>
              )}

              {activeOption === opt.key && opt.key === 'daily' && showTimeDefault && (
                <div className="pl-8 pb-2 flex items-center gap-2">
                  <Clock size={14} style={{ color: 'var(--color-text-secondary)' }} />
                  <input type="time" value={state.time} onChange={(e) => dispatch({ type: 'SET_TIME', time: e.target.value })} className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
                </div>
              )}

              {activeOption === opt.key && opt.key === 'weekly' && (
                <div className="pl-8 pb-2 space-y-2">
                  <WeekdayCircles
                    selected={state.selectedDays}
                    onToggle={(day) => dispatch({ type: 'TOGGLE_DAY', day })}
                    label=""
                    weekStartDay={weekStartDay}
                  />
                  {showTimeDefault && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} style={{ color: 'var(--color-text-secondary)' }} />
                      <input type="time" value={state.time} onChange={(e) => dispatch({ type: 'SET_TIME', time: e.target.value })} className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
                    </div>
                  )}
                </div>
              )}

              {activeOption === opt.key && opt.key === 'monthly' && (
                <div className="pl-8 pb-2 space-y-2">
                  <MonthlyConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />
                  {showTimeDefault && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} style={{ color: 'var(--color-text-secondary)' }} />
                      <input type="time" value={state.time} onChange={(e) => dispatch({ type: 'SET_TIME', time: e.target.value })} className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
                    </div>
                  )}
                </div>
              )}

              {activeOption === opt.key && opt.key === 'yearly' && (
                <div className="pl-8 pb-2 space-y-2">
                  <YearlyConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />
                  {showTimeDefault && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} style={{ color: 'var(--color-text-secondary)' }} />
                      <input type="time" value={state.time} onChange={(e) => dispatch({ type: 'SET_TIME', time: e.target.value })} className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
                    </div>
                  )}
                </div>
              )}

              {activeOption === opt.key && opt.key === 'custom' && showCustomExpanded && (
                <div className="pl-8 pb-2 space-y-3">
                  <CustomConfig state={state} dispatch={dispatch} inputStyle={inputStyle} weekStartDay={weekStartDay} />
                  {state.advancedMode && (
                    <AdvancedModeConfig state={state} dispatch={dispatch} inputStyle={inputStyle} weekStartDay={weekStartDay} />
                  )}
                  {/* Advanced patterns */}
                  <RepeatPatternSelector state={state} dispatch={dispatch} inputStyle={inputStyle} />
                  {/* Exceptions */}
                  <ExceptionSection state={state} dispatch={dispatch} inputStyle={inputStyle} />
                  {showTimeDefault && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} style={{ color: 'var(--color-text-secondary)' }} />
                      <input type="time" value={state.time} onChange={(e) => dispatch({ type: 'SET_TIME', time: e.target.value })} className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
                    </div>
                  )}
                </div>
              )}

              {activeOption === opt.key && opt.key === 'pick_dates' && (
                <div className="pl-8 pb-2 space-y-3">
                  <PickDatesCalendar
                    paintedDates={state.paintedDates}
                    dispatch={dispatch}
                    weekStartDay={weekStartDay}
                  />
                  {/* Time-of-day window */}
                  {state.showTimeWindow ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div
                          className="text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          Active window
                        </div>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'TOGGLE_TIME_WINDOW' })}
                          className="text-xs"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          remove
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>From</span>
                        <input
                          type="time"
                          value={state.activeStartTime}
                          onChange={(e) => dispatch({ type: 'SET_ACTIVE_START_TIME', time: e.target.value })}
                          className="px-3 py-1.5 rounded-lg text-sm outline-none"
                          style={inputStyle}
                        />
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>to</span>
                        <input
                          type="time"
                          value={state.activeEndTime}
                          onChange={(e) => dispatch({ type: 'SET_ACTIVE_END_TIME', time: e.target.value })}
                          className="px-3 py-1.5 rounded-lg text-sm outline-none"
                          style={inputStyle}
                        />
                      </div>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        This schedule is only active during this time window on painted dates.
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'TOGGLE_TIME_WINDOW' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                      style={{ border: '1px dashed var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                      <Clock size={14} /> Add time window
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Schedule Until (visible for any repeating option) ── */}
      {isRepeating && (
        <ScheduleUntilSection state={state} dispatch={dispatch} inputStyle={inputStyle} />
      )}

      {/* ── Optional time picker for repeating (when not showTimeDefault) ── */}
      {isRepeating && !showTimeDefault && (
        <div>
          {state.showTime ? (
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: 'var(--color-text-secondary)' }} />
              <input type="time" value={state.time} onChange={(e) => dispatch({ type: 'SET_TIME', time: e.target.value })} className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
              <button type="button" onClick={() => dispatch({ type: 'TOGGLE_TIME' })} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>remove</button>
            </div>
          ) : (
            <button type="button" onClick={() => dispatch({ type: 'TOGGLE_TIME' })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm" style={{ border: '1px dashed var(--color-border)', color: 'var(--color-text-secondary)' }}>
              <Plus size={14} /> Add time
            </button>
          )}
        </div>
      )}

      {/* ── Calendar Preview Toggle ── */}
      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        className="flex items-center gap-1.5 text-sm font-medium w-full"
        style={{ color: 'var(--color-accent, var(--color-sage-teal, #68a395))' }}
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

// ─── Repeat Pattern Selector (switch between pattern types) ──────────────

function RepeatPatternSelector({ state, dispatch, inputStyle: _inputStyle }: {
  state: any
  dispatch: React.Dispatch<any>
  inputStyle: React.CSSProperties
}) {
  type PatternOption = {
    key: string
    label: string
    description: string
    isActive: boolean
    onSelect: () => void
  }

  const patterns: PatternOption[] = [
    {
      key: 'daily',
      label: 'Every day',
      description: 'Repeats daily',
      isActive: state.frequency === 'daily',
      onSelect: () => dispatch({ type: 'SET_FREQUENCY', frequency: 'daily' }),
    },
    {
      key: 'monthly',
      label: 'Monthly',
      description: 'On a specific date or weekday each month',
      isActive: state.frequency === 'monthly',
      onSelect: () => dispatch({ type: 'SET_FREQUENCY', frequency: 'monthly' }),
    },
    {
      key: 'yearly',
      label: 'Yearly',
      description: 'On specific months and dates each year',
      isActive: state.frequency === 'yearly',
      onSelect: () => dispatch({ type: 'SET_FREQUENCY', frequency: 'yearly' }),
    },
    {
      key: 'custom_interval',
      label: 'Custom interval',
      description: 'Every X days, weeks, or months',
      isActive: state.frequency === 'custom' && !state.advancedMode,
      onSelect: () => {
        dispatch({ type: 'SET_FREQUENCY', frequency: 'custom' })
        dispatch({ type: 'SET_ADVANCED_MODE', mode: null })
      },
    },
    {
      key: 'alternating',
      label: 'Every other week',
      description: 'Different days on Week A and Week B',
      isActive: state.advancedMode === 'alternating',
      onSelect: () => {
        dispatch({ type: 'SET_FREQUENCY', frequency: 'custom' })
        dispatch({ type: 'SET_ADVANCED_MODE', mode: 'alternating' })
      },
    },
    {
      key: 'custody',
      label: 'Rotation schedule',
      description: 'Multi-week patterns (like shared parenting schedules)',
      isActive: state.advancedMode === 'custody',
      onSelect: () => {
        dispatch({ type: 'SET_FREQUENCY', frequency: 'custom' })
        dispatch({ type: 'SET_ADVANCED_MODE', mode: 'custody' })
      },
    },
    {
      key: 'seasonal',
      label: 'Seasonal / date range',
      description: 'Only active during specific date ranges',
      isActive: state.advancedMode === 'seasonal',
      onSelect: () => {
        dispatch({ type: 'SET_FREQUENCY', frequency: 'custom' })
        dispatch({ type: 'SET_ADVANCED_MODE', mode: 'seasonal' })
      },
    },
    {
      key: 'completion',
      label: 'After completion',
      description: 'Next one appears X days after you finish this one',
      isActive: state.advancedMode === 'completion_dependent',
      onSelect: () => {
        dispatch({ type: 'SET_FREQUENCY', frequency: 'custom' })
        dispatch({ type: 'SET_ADVANCED_MODE', mode: 'completion_dependent' })
      },
    },
  ]

  // Only show patterns that are NOT the currently-active default weekly view
  // Always show them if the user is already in an advanced mode
  const showablePatterns = patterns.filter(_p => {
    // If weekly is active (the default repeat), show all patterns as switchable options
    if (state.frequency === 'weekly') return true
    // Otherwise always show
    return true
  })

  return (
    <div>
      <div
        className="text-xs font-medium mb-2 uppercase tracking-wider"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Repeat pattern
      </div>
      <div className="flex flex-wrap gap-1.5">
        {/* Weekly is always the first option */}
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'SET_FREQUENCY', frequency: 'weekly' })
            dispatch({ type: 'SET_ADVANCED_MODE', mode: null })
          }}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          style={{
            backgroundColor: state.frequency === 'weekly' ? 'var(--color-accent, var(--color-sage-teal, #68a395))' : 'transparent',
            color: state.frequency === 'weekly' ? 'var(--color-text-on-primary, white)' : 'var(--color-text-primary)',
            border: `1.5px solid ${state.frequency === 'weekly' ? 'var(--color-accent, var(--color-sage-teal, #68a395))' : 'var(--color-border)'}`,
          }}
        >
          Weekly
        </button>
        {showablePatterns.map(p => (
          <button
            key={p.key}
            type="button"
            onClick={p.onSelect}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            title={p.description}
            style={{
              backgroundColor: p.isActive ? 'var(--color-accent, var(--color-sage-teal, #68a395))' : 'transparent',
              color: p.isActive ? 'var(--color-text-on-primary, white)' : 'var(--color-text-primary)',
              border: `1.5px solid ${p.isActive ? 'var(--color-accent, var(--color-sage-teal, #68a395))' : 'var(--color-border)'}`,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Schedule Until ──────────────────────────────────────────────────────

function ScheduleUntilSection({ state, dispatch, inputStyle }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties
}) {
  return (
    <div>
      <div
        className="text-xs font-medium mb-1.5 uppercase tracking-wider"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Ends
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={state.untilMode}
          onChange={(e) => dispatch({ type: 'SET_UNTIL_MODE', mode: e.target.value as 'ongoing' | 'date' | 'count' })}
          className="px-3 py-1.5 rounded-lg text-sm outline-none"
          style={inputStyle}
        >
          <option value="ongoing">Never (ongoing)</option>
          <option value="date">On a specific date</option>
          <option value="count">After a number of times</option>
        </select>
        {state.untilMode === 'date' && (
          <input
            type="date"
            value={state.untilDate}
            onChange={(e) => dispatch({ type: 'SET_UNTIL_DATE', date: e.target.value })}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        )}
        {state.untilMode === 'count' && (
          <div className="flex items-center gap-1">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>After</span>
            <input
              type="number"
              min={1}
              value={state.untilCount}
              onChange={(e) => dispatch({ type: 'SET_UNTIL_COUNT', count: parseInt(e.target.value) || 1 })}
              className="w-16 px-2 py-1.5 rounded-lg text-sm text-center outline-none"
              style={inputStyle}
            />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>times</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Advanced Mode Config (renders the active advanced sub-config) ───────

function AdvancedModeConfig({ state, dispatch, inputStyle, weekStartDay = 0 }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties; weekStartDay?: 0 | 1
}) {
  switch (state.advancedMode) {
    case 'alternating':
      return <AlternatingConfig state={state} dispatch={dispatch} inputStyle={inputStyle} weekStartDay={weekStartDay} />
    case 'custody':
      return <CustodyConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />
    case 'seasonal':
      return <SeasonalConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />
    case 'completion_dependent':
      return <CompletionConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />
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
        <label
          className="flex items-center gap-1.5 text-sm cursor-pointer"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <input
            type="radio"
            checked={state.monthlyMode === 'weekday'}
            onChange={() => dispatch({ type: 'SET_MONTHLY_MODE', mode: 'weekday' })}
          />
          On a weekday
        </label>
        <label
          className="flex items-center gap-1.5 text-sm cursor-pointer"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <input
            type="radio"
            checked={state.monthlyMode === 'date'}
            onChange={() => dispatch({ type: 'SET_MONTHLY_MODE', mode: 'date' })}
          />
          On a date
        </label>
      </div>

      {state.monthlyMode === 'weekday' && (
        <div className="space-y-2">
          {state.monthlyWeekdays.map((row: any) => (
            <div key={row.id} className="flex items-center gap-2">
              <select
                value={row.ordinal}
                onChange={(e) => dispatch({ type: 'UPDATE_MONTHLY_WEEKDAY', id: row.id, ordinal: parseInt(e.target.value) })}
                className="px-2 py-1.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              >
                {ORDINAL_VALUES.map((v, i) => (
                  <option key={v} value={v}>{ORDINAL_LABELS[i]}</option>
                ))}
              </select>
              <select
                value={row.weekday}
                onChange={(e) => dispatch({ type: 'UPDATE_MONTHLY_WEEKDAY', id: row.id, weekday: parseInt(e.target.value) })}
                className="px-2 py-1.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              >
                {DAY_LABELS_FULL.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
              {state.monthlyWeekdays.length > 1 && (
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'REMOVE_MONTHLY_WEEKDAY', id: row.id })}
                  className="p-1 rounded"
                  style={{ color: 'var(--color-error, #b25a58)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => dispatch({ type: 'ADD_MONTHLY_WEEKDAY' })}
            className="flex items-center gap-1 text-sm"
            style={{ color: 'var(--color-accent, var(--color-sage-teal, #68a395))' }}
          >
            <Plus size={14} /> Add another
          </button>
        </div>
      )}

      {state.monthlyMode === 'date' && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 31 }, (_, i) => i + 1).concat([-1]).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => dispatch({ type: 'TOGGLE_MONTHLY_DATE', date: d })}
                className="w-9 h-9 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                style={{
                  backgroundColor: state.monthlyDates.includes(d) ? 'var(--color-accent, var(--color-sage-teal, #68a395))' : 'transparent',
                  color: state.monthlyDates.includes(d) ? 'var(--color-text-on-primary, white)' : 'var(--color-text-primary)',
                  border: state.monthlyDates.includes(d)
                    ? '1.5px solid var(--color-accent, var(--color-sage-teal, #68a395))'
                    : '1.5px solid var(--color-border)',
                }}
              >
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
        <div
          className="text-xs font-medium mb-1.5 uppercase tracking-wider"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Which months?
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MONTH_LABELS.map((label, i) => {
            const month = i + 1
            const active = state.selectedMonths.includes(month)
            return (
              <button
                key={month}
                type="button"
                onClick={() => dispatch({ type: 'TOGGLE_MONTH', month })}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? 'var(--color-accent, var(--color-sage-teal, #68a395))' : 'transparent',
                  color: active ? 'var(--color-text-on-primary, white)' : 'var(--color-text-primary)',
                  border: `1.5px solid ${active ? 'var(--color-accent, var(--color-sage-teal, #68a395))' : 'var(--color-border)'}`,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div
          className="text-xs font-medium mb-1.5 uppercase tracking-wider"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Which day?
        </div>
        <div className="flex gap-3 mb-2">
          <label
            className="flex items-center gap-1.5 text-sm cursor-pointer"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <input
              type="radio"
              checked={state.yearlyMode === 'date'}
              onChange={() => dispatch({ type: 'SET_YEARLY_MODE', mode: 'date' })}
            />
            A specific date
          </label>
          <label
            className="flex items-center gap-1.5 text-sm cursor-pointer"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <input
              type="radio"
              checked={state.yearlyMode === 'weekday'}
              onChange={() => dispatch({ type: 'SET_YEARLY_MODE', mode: 'weekday' })}
            />
            A specific weekday
          </label>
        </div>

        {state.yearlyMode === 'date' && (
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 31 }, (_, i) => i + 1).concat([-1]).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => dispatch({ type: 'TOGGLE_YEARLY_DATE', date: d })}
                className="w-8 h-8 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                style={{
                  backgroundColor: state.yearlyDates.includes(d) ? 'var(--color-accent, var(--color-sage-teal, #68a395))' : 'transparent',
                  color: state.yearlyDates.includes(d) ? 'var(--color-text-on-primary, white)' : 'var(--color-text-primary)',
                  border: state.yearlyDates.includes(d)
                    ? '1.5px solid var(--color-accent, var(--color-sage-teal, #68a395))'
                    : '1.5px solid var(--color-border)',
                }}
              >
                {d === -1 ? 'Last' : d}
              </button>
            ))}
          </div>
        )}

        {state.yearlyMode === 'weekday' && (
          <div className="space-y-2">
            {state.yearlyWeekdays.map((row: any) => (
              <div key={row.id} className="flex items-center gap-2">
                <select
                  value={row.ordinal}
                  onChange={(e) => dispatch({ type: 'UPDATE_YEARLY_WEEKDAY', id: row.id, ordinal: parseInt(e.target.value) })}
                  className="px-2 py-1.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                >
                  {ORDINAL_VALUES.map((v, i) => (
                    <option key={v} value={v}>{ORDINAL_LABELS[i]}</option>
                  ))}
                </select>
                <select
                  value={row.weekday}
                  onChange={(e) => dispatch({ type: 'UPDATE_YEARLY_WEEKDAY', id: row.id, weekday: parseInt(e.target.value) })}
                  className="px-2 py-1.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                >
                  {DAY_LABELS_FULL.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
                {state.yearlyWeekdays.length > 1 && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'REMOVE_YEARLY_WEEKDAY', id: row.id })}
                    className="p-1 rounded"
                    style={{ color: 'var(--color-error, #b25a58)' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => dispatch({ type: 'ADD_YEARLY_WEEKDAY' })}
              className="flex items-center gap-1 text-sm"
              style={{ color: 'var(--color-accent, var(--color-sage-teal, #68a395))' }}
            >
              <Plus size={14} /> Add another
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Custom Config ──────────────────────────────────────────────────────

function CustomConfig({ state, dispatch, inputStyle, weekStartDay = 0 }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties; weekStartDay?: 0 | 1
}) {
  if (state.advancedMode) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Every</span>
        <input
          type="number"
          min={1}
          value={state.customInterval}
          onChange={(e) => dispatch({ type: 'SET_CUSTOM_INTERVAL', interval: parseInt(e.target.value) || 1 })}
          className="w-16 px-2 py-1.5 rounded-lg text-sm text-center outline-none"
          style={inputStyle}
        />
        <select
          value={state.customUnit}
          onChange={(e) => dispatch({ type: 'SET_CUSTOM_UNIT', unit: e.target.value })}
          className="px-2 py-1.5 rounded-lg text-sm outline-none"
          style={inputStyle}
        >
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
          weekStartDay={weekStartDay}
        />
      )}

      {(state.customUnit === 'months' || state.customUnit === 'years') && (
        <MonthlyConfig state={state} dispatch={dispatch} inputStyle={inputStyle} />
      )}
    </div>
  )
}

// ─── Alternating Weeks Config ───────────────────────────────────────────

function AlternatingConfig({ state, dispatch, inputStyle, weekStartDay = 0 }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties; weekStartDay?: 0 | 1
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Pick which days belong to Week A and Week B. The pattern alternates every two weeks.
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Starts</span>
        <input
          type="date"
          value={state.alternatingAnchor}
          onChange={(e) => dispatch({ type: 'SET_ALTERNATING_ANCHOR', date: e.target.value })}
          className="px-2 py-1.5 rounded-lg text-sm outline-none"
          style={inputStyle}
        />
      </div>
      <WeekdayCircles
        selected={state.weekADays}
        onToggle={(d) => dispatch({ type: 'TOGGLE_WEEK_A_DAY', day: d })}
        label="Week A"
        weekStartDay={weekStartDay}
      />
      <WeekdayCircles
        selected={state.weekBDays}
        onToggle={(d) => dispatch({ type: 'TOGGLE_WEEK_B_DAY', day: d })}
        label="Week B"
        weekStartDay={weekStartDay}
      />
    </div>
  )
}

// ─── Custody / Rotation Config ──────────────────────────────────────────

function CustodyConfig({ state, dispatch, inputStyle }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties
}) {
  const dayHeaders = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Build a multi-week rotation pattern. Pick a preset or tap days to switch sides.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(CUSTODY_PRESETS).map(([key, pattern]) => (
          <button
            key={key}
            type="button"
            onClick={() => dispatch({ type: 'SET_CUSTODY_PATTERN', pattern })}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-golden-honey, #d4a843)',
              color: 'white',
            }}
          >
            {key === 'week_on_off' ? 'Week on / week off' : key}
          </button>
        ))}
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_CUSTODY_PATTERN', pattern: Array(14).fill('A') })}
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          Build my own
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: 'repeat(7, 2.25rem)' }}>
          {dayHeaders.map(d => (
            <div
              key={d}
              className="text-center text-xs font-medium py-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {d}
            </div>
          ))}
          {state.custodyPattern.map((side: string, idx: number) => (
            <button
              key={idx}
              type="button"
              onClick={() => dispatch({ type: 'TOGGLE_CUSTODY_DAY', index: idx })}
              className="h-9 rounded text-xs font-medium transition-colors flex items-center justify-center"
              style={{
                backgroundColor: side === 'A'
                  ? 'var(--color-accent, var(--color-sage-teal, #68a395))'
                  : 'var(--color-vintage-plum, #8b5e7e)',
                color: 'white',
              }}
            >
              {side === 'A' ? state.custodyLabels.A.slice(0, 3) : state.custodyLabels.B.slice(0, 2)}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded"
            style={{ backgroundColor: 'var(--color-accent, var(--color-sage-teal, #68a395))' }}
          />
          {state.custodyLabels.A}
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded"
            style={{ backgroundColor: 'var(--color-vintage-plum, #8b5e7e)' }}
          />
          {state.custodyLabels.B}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pattern starts</span>
        <input
          type="date"
          value={state.custodyAnchor}
          onChange={(e) => dispatch({ type: 'SET_CUSTODY_ANCHOR', date: e.target.value })}
          className="px-2 py-1.5 rounded-lg text-sm outline-none"
          style={inputStyle}
        />
      </div>
    </div>
  )
}

// ─── Seasonal Config ────────────────────────────────────────────────────

function SeasonalConfig({ state, dispatch, inputStyle }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties
}) {
  return (
    <div className="space-y-2">
      {state.seasonalRanges.map((range: any) => (
        <div key={range.id} className="flex items-center gap-2 flex-wrap">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>From</span>
          <input
            type="date"
            value={range.from}
            onChange={(e) => dispatch({ type: 'UPDATE_SEASONAL_RANGE', id: range.id, field: 'from', value: e.target.value })}
            className="px-2 py-1.5 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>to</span>
          <input
            type="date"
            value={range.to}
            onChange={(e) => dispatch({ type: 'UPDATE_SEASONAL_RANGE', id: range.id, field: 'to', value: e.target.value })}
            className="px-2 py-1.5 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
          <label
            className="flex items-center gap-1 text-xs cursor-pointer"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <input
              type="checkbox"
              checked={range.yearly}
              onChange={(e) => dispatch({ type: 'UPDATE_SEASONAL_RANGE', id: range.id, field: 'yearly', value: e.target.checked })}
            />
            Repeats yearly
          </label>
          {state.seasonalRanges.length > 1 && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'REMOVE_SEASONAL_RANGE', id: range.id })}
              className="p-1 rounded"
              style={{ color: 'var(--color-error, #b25a58)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => dispatch({ type: 'ADD_SEASONAL_RANGE' })}
        className="flex items-center gap-1 text-sm"
        style={{ color: 'var(--color-accent, var(--color-sage-teal, #68a395))' }}
      >
        <Plus size={14} /> Add another range
      </button>
    </div>
  )
}

// ─── Completion-Dependent Config ────────────────────────────────────────

function CompletionConfig({ state, dispatch, inputStyle }: {
  state: any; dispatch: React.Dispatch<any>; inputStyle: React.CSSProperties
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        The next one appears based on when you finish this one, not a fixed calendar date.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Every</span>
        <input
          type="number"
          min={1}
          value={state.completionInterval}
          onChange={(e) => dispatch({ type: 'SET_COMPLETION_INTERVAL', interval: parseInt(e.target.value) || 1 })}
          className="w-16 px-2 py-1.5 rounded-lg text-sm text-center outline-none"
          style={inputStyle}
        />
        <select
          value={state.completionUnit}
          onChange={(e) => dispatch({ type: 'SET_COMPLETION_UNIT', unit: e.target.value })}
          className="px-2 py-1.5 rounded-lg text-sm outline-none"
          style={inputStyle}
        >
          <option value="days">days</option>
          <option value="weeks">weeks</option>
          <option value="months">months</option>
        </select>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>after finishing</span>
      </div>

      <label
        className="flex items-center gap-2 text-sm cursor-pointer"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <input
          type="checkbox"
          checked={state.completionWindowEnabled}
          onChange={() => dispatch({ type: 'TOGGLE_COMPLETION_WINDOW' })}
        />
        Allow a due window
      </label>

      {state.completionWindowEnabled && (
        <div className="flex items-center gap-2 flex-wrap ml-6">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Due between</span>
          <input
            type="number"
            min={1}
            value={state.completionWindowStart}
            onChange={(e) => dispatch({ type: 'SET_COMPLETION_WINDOW_START', value: parseInt(e.target.value) || 1 })}
            className="w-16 px-2 py-1.5 rounded-lg text-sm text-center outline-none"
            style={inputStyle}
          />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>and</span>
          <input
            type="number"
            min={1}
            value={state.completionWindowEnd}
            onChange={(e) => dispatch({ type: 'SET_COMPLETION_WINDOW_END', value: parseInt(e.target.value) || 1 })}
            className="w-16 px-2 py-1.5 rounded-lg text-sm text-center outline-none"
            style={inputStyle}
          />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{state.completionUnit}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>First one starts from</span>
        <input
          type="date"
          value={state.completionAnchor}
          onChange={(e) => dispatch({ type: 'SET_COMPLETION_ANCHOR', date: e.target.value })}
          className="px-2 py-1.5 rounded-lg text-sm outline-none"
          style={inputStyle}
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
      <div
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Skip specific dates
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="px-2 py-1.5 rounded-lg text-sm outline-none"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => {
            if (newDate) {
              dispatch({ type: 'ADD_EXDATE', date: newDate })
              setNewDate('')
            }
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm"
          style={{ border: '1px dashed var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          <Plus size={14} /> Skip this date
        </button>
      </div>
      {state.exdates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {state.exdates.map((d: string) => (
            <span
              key={d}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
            >
              {d}
              <button type="button" onClick={() => dispatch({ type: 'REMOVE_EXDATE', date: d })}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <label
        className="flex items-center gap-2 text-sm cursor-pointer"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <input
          type="checkbox"
          checked={state.schoolYearOnly}
          onChange={() => dispatch({ type: 'TOGGLE_SCHOOL_YEAR_ONLY' })}
        />
        School-year only
      </label>
    </div>
  )
}
