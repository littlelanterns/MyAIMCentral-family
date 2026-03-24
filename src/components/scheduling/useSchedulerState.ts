/**
 * Universal Scheduler State Management (PRD-35)
 *
 * useReducer-based state for the scheduler component.
 * Produces SchedulerOutput on every state change.
 */

import { useReducer, useEffect, useCallback, useRef } from 'react'
import type {
  SchedulerState, SchedulerAction, SchedulerOutput,
} from './types'
import { buildOutput, outputToState } from './schedulerUtils'

function uid(): string {
  return crypto.randomUUID()
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function createInitialState(showTimeDefault: boolean): SchedulerState {
  return {
    frequency: 'weekly',
    oneTimeDate: todayISO(),
    selectedDays: [],
    monthlyMode: 'weekday',
    monthlyWeekdays: [{ id: uid(), ordinal: 1, weekday: 1 }],
    monthlyDates: [1],
    selectedMonths: [],
    yearlyMode: 'date',
    yearlyDates: [1],
    yearlyWeekdays: [{ id: uid(), ordinal: 1, weekday: 1 }],
    customInterval: 2,
    customUnit: 'weeks',
    advancedMode: null,
    alternatingAnchor: todayISO(),
    weekADays: [],
    weekBDays: [],
    custodyPattern: ['A','A','B','B','A','A','A','B','B','A','A','B','B','B'],
    custodyAnchor: todayISO(),
    custodyLabels: { A: 'Mom', B: 'Co-parent' },
    seasonalRanges: [{ id: uid(), from: '', to: '', yearly: true }],
    completionInterval: 30,
    completionUnit: 'days',
    completionWindowEnabled: false,
    completionWindowStart: 25,
    completionWindowEnd: 35,
    completionAnchor: todayISO(),
    showTime: showTimeDefault,
    time: '09:00',
    untilMode: 'ongoing',
    untilDate: '',
    untilCount: 10,
    exdates: [],
    rdates: [],
    schoolYearOnly: false,
  }
}

function toggleInArray(arr: number[], val: number): number[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val].sort((a, b) => a - b)
}

function schedulerReducer(state: SchedulerState, action: SchedulerAction): SchedulerState {
  switch (action.type) {
    case 'SET_FREQUENCY':
      return { ...state, frequency: action.frequency, advancedMode: null }
    case 'SET_ONE_TIME_DATE':
      return { ...state, oneTimeDate: action.date }
    case 'TOGGLE_DAY':
      return { ...state, selectedDays: toggleInArray(state.selectedDays, action.day) }
    case 'SET_MONTHLY_MODE':
      return { ...state, monthlyMode: action.mode }
    case 'ADD_MONTHLY_WEEKDAY':
      return { ...state, monthlyWeekdays: [...state.monthlyWeekdays, { id: uid(), ordinal: 1, weekday: 1 }] }
    case 'UPDATE_MONTHLY_WEEKDAY':
      return {
        ...state,
        monthlyWeekdays: state.monthlyWeekdays.map(w =>
          w.id === action.id
            ? { ...w, ...(action.ordinal !== undefined && { ordinal: action.ordinal }), ...(action.weekday !== undefined && { weekday: action.weekday }) }
            : w
        ),
      }
    case 'REMOVE_MONTHLY_WEEKDAY':
      return { ...state, monthlyWeekdays: state.monthlyWeekdays.filter(w => w.id !== action.id) }
    case 'TOGGLE_MONTHLY_DATE':
      return { ...state, monthlyDates: toggleInArray(state.monthlyDates, action.date) }
    case 'TOGGLE_MONTH':
      return { ...state, selectedMonths: toggleInArray(state.selectedMonths, action.month) }
    case 'SET_YEARLY_MODE':
      return { ...state, yearlyMode: action.mode }
    case 'ADD_YEARLY_WEEKDAY':
      return { ...state, yearlyWeekdays: [...state.yearlyWeekdays, { id: uid(), ordinal: 1, weekday: 1 }] }
    case 'UPDATE_YEARLY_WEEKDAY':
      return {
        ...state,
        yearlyWeekdays: state.yearlyWeekdays.map(w =>
          w.id === action.id
            ? { ...w, ...(action.ordinal !== undefined && { ordinal: action.ordinal }), ...(action.weekday !== undefined && { weekday: action.weekday }) }
            : w
        ),
      }
    case 'REMOVE_YEARLY_WEEKDAY':
      return { ...state, yearlyWeekdays: state.yearlyWeekdays.filter(w => w.id !== action.id) }
    case 'TOGGLE_YEARLY_DATE':
      return { ...state, yearlyDates: toggleInArray(state.yearlyDates, action.date) }
    case 'SET_CUSTOM_INTERVAL':
      return { ...state, customInterval: Math.max(1, action.interval) }
    case 'SET_CUSTOM_UNIT':
      return { ...state, customUnit: action.unit }
    case 'SET_ADVANCED_MODE':
      return { ...state, advancedMode: action.mode, frequency: action.mode ? 'custom' : state.frequency }
    case 'SET_ALTERNATING_ANCHOR':
      return { ...state, alternatingAnchor: action.date }
    case 'TOGGLE_WEEK_A_DAY':
      return { ...state, weekADays: toggleInArray(state.weekADays, action.day) }
    case 'TOGGLE_WEEK_B_DAY':
      return { ...state, weekBDays: toggleInArray(state.weekBDays, action.day) }
    case 'SET_CUSTODY_PATTERN':
      return { ...state, custodyPattern: action.pattern }
    case 'TOGGLE_CUSTODY_DAY': {
      const newPattern = [...state.custodyPattern]
      newPattern[action.index] = newPattern[action.index] === 'A' ? 'B' : 'A'
      return { ...state, custodyPattern: newPattern }
    }
    case 'SET_CUSTODY_ANCHOR':
      return { ...state, custodyAnchor: action.date }
    case 'SET_CUSTODY_LABELS':
      return { ...state, custodyLabels: action.labels }
    case 'ADD_SEASONAL_RANGE':
      return { ...state, seasonalRanges: [...state.seasonalRanges, { id: uid(), from: '', to: '', yearly: true }] }
    case 'UPDATE_SEASONAL_RANGE':
      return {
        ...state,
        seasonalRanges: state.seasonalRanges.map(r =>
          r.id === action.id ? { ...r, [action.field]: action.value } : r
        ),
      }
    case 'REMOVE_SEASONAL_RANGE':
      return { ...state, seasonalRanges: state.seasonalRanges.filter(r => r.id !== action.id) }
    case 'SET_COMPLETION_INTERVAL':
      return { ...state, completionInterval: Math.max(1, action.interval) }
    case 'SET_COMPLETION_UNIT':
      return { ...state, completionUnit: action.unit }
    case 'TOGGLE_COMPLETION_WINDOW':
      return { ...state, completionWindowEnabled: !state.completionWindowEnabled }
    case 'SET_COMPLETION_WINDOW_START':
      return { ...state, completionWindowStart: action.value }
    case 'SET_COMPLETION_WINDOW_END':
      return { ...state, completionWindowEnd: action.value }
    case 'SET_COMPLETION_ANCHOR':
      return { ...state, completionAnchor: action.date }
    case 'TOGGLE_TIME':
      return { ...state, showTime: !state.showTime }
    case 'SET_TIME':
      return { ...state, time: action.time }
    case 'SET_UNTIL_MODE':
      return { ...state, untilMode: action.mode }
    case 'SET_UNTIL_DATE':
      return { ...state, untilDate: action.date }
    case 'SET_UNTIL_COUNT':
      return { ...state, untilCount: Math.max(1, action.count) }
    case 'ADD_EXDATE':
      return { ...state, exdates: state.exdates.includes(action.date) ? state.exdates : [...state.exdates, action.date].sort() }
    case 'REMOVE_EXDATE':
      return { ...state, exdates: state.exdates.filter(d => d !== action.date) }
    case 'ADD_RDATE':
      return { ...state, rdates: state.rdates.includes(action.date) ? state.rdates : [...state.rdates, action.date].sort() }
    case 'REMOVE_RDATE':
      return { ...state, rdates: state.rdates.filter(d => d !== action.date) }
    case 'TOGGLE_SCHOOL_YEAR_ONLY':
      return { ...state, schoolYearOnly: !state.schoolYearOnly }
    case 'LOAD_FROM_OUTPUT': {
      const partial = outputToState(action.output)
      return { ...state, ...partial }
    }
    default:
      return state
  }
}

export function useSchedulerState(
  initialValue: SchedulerOutput | null,
  onChange: (value: SchedulerOutput) => void,
  showTimeDefault: boolean,
  timezone: string,
) {
  const [state, dispatch] = useReducer(schedulerReducer, showTimeDefault, createInitialState)

  // Load initial value once
  const loadedRef = useRef(false)
  useEffect(() => {
    if (initialValue && !loadedRef.current) {
      loadedRef.current = true
      dispatch({ type: 'LOAD_FROM_OUTPUT', output: initialValue })
    }
  }, [initialValue])

  // Emit output on state changes
  const prevOutputRef = useRef<string>('')
  useEffect(() => {
    const output = buildOutput(state, timezone)
    const serialized = JSON.stringify(output)
    if (serialized !== prevOutputRef.current) {
      prevOutputRef.current = serialized
      onChange(output)
    }
  }, [state, timezone, onChange])

  const output = buildOutput(state, timezone)

  return { state, dispatch, output }
}
