/**
 * Universal Scheduler Utilities (PRD-35)
 *
 * Builds RRULE strings from UI state and generates preview instances via rrule.js.
 * This is for the scheduler COMPONENT output — not for evaluating access_schedules.
 */

import { RRule, RRuleSet } from 'rrule'
import type {
  SchedulerState, SchedulerOutput,
} from './types'

// ── RRULE day constants (rrule.js uses RRule.SU=0 etc.) ─────────────────

// RRULE_DAYS available: [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA]
const RRULE_DAY_MAP: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function todayISO(): string {
  return toISODate(new Date())
}

// ── Build SchedulerOutput from internal state ───────────────────────────

export function buildOutput(state: SchedulerState, timezone: string): SchedulerOutput {
  // Completion-dependent
  if (state.advancedMode === 'completion_dependent') {
    return {
      rrule: null,
      dtstart: state.completionAnchor || todayISO(),
      until: null,
      count: null,
      exdates: state.exdates,
      rdates: state.rdates,
      timezone,
      schedule_type: 'completion_dependent',
      completion_dependent: {
        interval: state.completionInterval,
        unit: state.completionUnit,
        window_start: state.completionWindowEnabled ? state.completionWindowStart : null,
        window_end: state.completionWindowEnabled ? state.completionWindowEnd : null,
        anchor_date: state.completionAnchor || todayISO(),
      },
      custody_pattern: null,
    }
  }

  // Custody
  if (state.advancedMode === 'custody') {
    return {
      rrule: null,
      dtstart: state.custodyAnchor || todayISO(),
      until: null,
      count: null,
      exdates: state.exdates,
      rdates: state.rdates,
      timezone,
      schedule_type: 'custody',
      completion_dependent: null,
      custody_pattern: {
        pattern: state.custodyPattern,
        anchor_date: state.custodyAnchor || todayISO(),
        labels: state.custodyLabels,
      },
    }
  }

  // Fixed (RRULE-based)
  const rruleStr = buildRRule(state)
  const dtstart = state.frequency === 'one_time'
    ? (state.oneTimeDate || todayISO())
    : todayISO()

  return {
    rrule: rruleStr,
    dtstart,
    until: state.untilMode === 'date' && state.untilDate ? state.untilDate : null,
    count: state.untilMode === 'count' ? state.untilCount : null,
    exdates: state.exdates,
    rdates: state.rdates,
    timezone,
    schedule_type: 'fixed',
    completion_dependent: null,
    custody_pattern: null,
  }
}

// ── Build RRULE string from state ───────────────────────────────────────

function buildRRule(state: SchedulerState): string {
  const parts: string[] = []

  // Alternating weeks
  if (state.advancedMode === 'alternating') {
    // Represented as FREQ=WEEKLY;INTERVAL=2 with BYDAY for week A
    // Week B is a separate RRULE in practice, but for the JSONB output
    // we store both week patterns in the rrule string using INTERVAL=2
    parts.push('FREQ=WEEKLY', 'INTERVAL=2')
    const allDays = [...new Set([...state.weekADays, ...state.weekBDays])]
    if (allDays.length > 0) {
      parts.push('BYDAY=' + allDays.map(d => dayToRRule(d)).join(','))
    }
    return parts.join(';')
  }

  // Seasonal: generate RRULE for the base frequency, seasonal ranges handled by exdates
  // (seasonal is an overlay on top of the base frequency)

  switch (state.frequency) {
    case 'one_time':
      // One-time has no recurrence — return empty RRULE indicator
      return ''

    case 'daily':
      parts.push('FREQ=DAILY')
      break

    case 'weekly':
      parts.push('FREQ=WEEKLY')
      if (state.selectedDays.length > 0) {
        parts.push('BYDAY=' + state.selectedDays.map(d => dayToRRule(d)).join(','))
      }
      break

    case 'monthly':
      parts.push('FREQ=MONTHLY')
      if (state.monthlyMode === 'weekday' && state.monthlyWeekdays.length > 0) {
        const byDayParts = state.monthlyWeekdays.map(w => {
          const ord = w.ordinal === 5 ? -1 : w.ordinal
          return `${ord}${dayToRRule(w.weekday)}`
        })
        parts.push('BYDAY=' + byDayParts.join(','))
      } else if (state.monthlyMode === 'date' && state.monthlyDates.length > 0) {
        parts.push('BYMONTHDAY=' + state.monthlyDates.join(','))
      }
      break

    case 'yearly':
      parts.push('FREQ=YEARLY')
      if (state.selectedMonths.length > 0) {
        parts.push('BYMONTH=' + state.selectedMonths.join(','))
      }
      if (state.yearlyMode === 'weekday' && state.yearlyWeekdays.length > 0) {
        const byDayParts = state.yearlyWeekdays.map(w => {
          const ord = w.ordinal === 5 ? -1 : w.ordinal
          return `${ord}${dayToRRule(w.weekday)}`
        })
        parts.push('BYDAY=' + byDayParts.join(','))
      } else if (state.yearlyMode === 'date' && state.yearlyDates.length > 0) {
        parts.push('BYMONTHDAY=' + state.yearlyDates.join(','))
      }
      break

    case 'custom': {
      const freqMap: Record<string, string> = {
        days: 'DAILY', weeks: 'WEEKLY', months: 'MONTHLY', years: 'YEARLY',
      }
      parts.push('FREQ=' + freqMap[state.customUnit])
      if (state.customInterval > 1) {
        parts.push('INTERVAL=' + state.customInterval)
      }
      if ((state.customUnit === 'days' || state.customUnit === 'weeks') && state.selectedDays.length > 0) {
        parts.push('BYDAY=' + state.selectedDays.map(d => dayToRRule(d)).join(','))
      }
      if ((state.customUnit === 'months' || state.customUnit === 'years') && state.monthlyMode === 'weekday' && state.monthlyWeekdays.length > 0) {
        const byDayParts = state.monthlyWeekdays.map(w => {
          const ord = w.ordinal === 5 ? -1 : w.ordinal
          return `${ord}${dayToRRule(w.weekday)}`
        })
        parts.push('BYDAY=' + byDayParts.join(','))
      } else if ((state.customUnit === 'months' || state.customUnit === 'years') && state.monthlyMode === 'date' && state.monthlyDates.length > 0) {
        parts.push('BYMONTHDAY=' + state.monthlyDates.join(','))
      }
      break
    }
  }

  if (state.untilMode === 'count' && state.untilCount > 0) {
    parts.push('COUNT=' + state.untilCount)
  }

  return parts.join(';')
}

export function dayToRRule(day: number): string {
  return ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][day] ?? 'MO'
}

// ── Generate preview instances from output ──────────────────────────────

export function generatePreviewInstances(
  output: SchedulerOutput,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  if (output.schedule_type === 'custody') {
    return generateCustodyInstances(output, rangeStart, rangeEnd)
  }

  if (output.schedule_type === 'completion_dependent') {
    return generateCompletionDependentInstances(output, rangeStart, rangeEnd)
  }

  // One-time
  if (!output.rrule) {
    const d = new Date(output.dtstart + 'T00:00:00')
    if (d >= rangeStart && d <= rangeEnd) return [d]
    return []
  }

  try {
    const rruleSet = new RRuleSet()
    const dtstart = new Date(output.dtstart + 'T00:00:00')

    const ruleOpts = RRule.parseString(output.rrule)
    rruleSet.rrule(new RRule({
      ...ruleOpts,
      dtstart,
      until: output.until ? new Date(output.until + 'T23:59:59') : undefined,
    }))

    // Add RDATEs
    for (const rd of output.rdates) {
      rruleSet.rdate(new Date(rd + 'T00:00:00'))
    }

    // Add EXDATEs
    for (const ex of output.exdates) {
      rruleSet.exdate(new Date(ex + 'T00:00:00'))
    }

    return rruleSet.between(rangeStart, rangeEnd, true)
  } catch {
    return []
  }
}

function generateCustodyInstances(
  output: SchedulerOutput,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  if (!output.custody_pattern) return []
  const { pattern, anchor_date } = output.custody_pattern
  if (pattern.length === 0) return []

  const anchor = new Date(anchor_date + 'T00:00:00')
  const dates: Date[] = []
  const current = new Date(rangeStart)
  current.setHours(0, 0, 0, 0)

  while (current <= rangeEnd) {
    const dayDiff = Math.floor((current.getTime() - anchor.getTime()) / 86400000)
    const idx = ((dayDiff % pattern.length) + pattern.length) % pattern.length
    if (pattern[idx] === 'A') {
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }

  return dates
}

/** For custody: get which side owns each day in a range */
export function getCustodyDayMap(
  output: SchedulerOutput,
  rangeStart: Date,
  rangeEnd: Date,
): Map<string, 'A' | 'B'> {
  const map = new Map<string, 'A' | 'B'>()
  if (!output.custody_pattern) return map
  const { pattern, anchor_date } = output.custody_pattern
  if (pattern.length === 0) return map

  const anchor = new Date(anchor_date + 'T00:00:00')
  const current = new Date(rangeStart)
  current.setHours(0, 0, 0, 0)

  while (current <= rangeEnd) {
    const dayDiff = Math.floor((current.getTime() - anchor.getTime()) / 86400000)
    const idx = ((dayDiff % pattern.length) + pattern.length) % pattern.length
    map.set(toISODate(current), pattern[idx] as 'A' | 'B')
    current.setDate(current.getDate() + 1)
  }

  return map
}

function generateCompletionDependentInstances(
  output: SchedulerOutput,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  if (!output.completion_dependent) return []
  const { interval, unit, anchor_date } = output.completion_dependent
  const dates: Date[] = []
  let current = new Date(anchor_date + 'T00:00:00')

  for (let i = 0; i < 100 && current <= rangeEnd; i++) {
    if (current >= rangeStart) {
      dates.push(new Date(current))
    }
    current = addInterval(current, interval, unit)
  }

  return dates
}

function addInterval(date: Date, interval: number, unit: string): Date {
  const d = new Date(date)
  switch (unit) {
    case 'days': d.setDate(d.getDate() + interval); break
    case 'weeks': d.setDate(d.getDate() + interval * 7); break
    case 'months': d.setMonth(d.getMonth() + interval); break
  }
  return d
}

// ── Parse SchedulerOutput back into SchedulerState ──────────────────────

export function outputToState(output: SchedulerOutput): Partial<SchedulerState> {
  if (output.schedule_type === 'completion_dependent' && output.completion_dependent) {
    const cd = output.completion_dependent
    return {
      frequency: 'custom',
      advancedMode: 'completion_dependent',
      completionInterval: cd.interval,
      completionUnit: cd.unit,
      completionWindowEnabled: cd.window_start != null,
      completionWindowStart: cd.window_start ?? 0,
      completionWindowEnd: cd.window_end ?? 0,
      completionAnchor: cd.anchor_date,
      exdates: output.exdates,
      rdates: output.rdates,
    }
  }

  if (output.schedule_type === 'custody' && output.custody_pattern) {
    return {
      frequency: 'custom',
      advancedMode: 'custody',
      custodyPattern: output.custody_pattern.pattern,
      custodyAnchor: output.custody_pattern.anchor_date,
      custodyLabels: output.custody_pattern.labels,
      exdates: output.exdates,
      rdates: output.rdates,
    }
  }

  if (!output.rrule) {
    return {
      frequency: 'one_time',
      oneTimeDate: output.dtstart,
      exdates: output.exdates,
      rdates: output.rdates,
    }
  }

  try {
    const opts = RRule.parseString(output.rrule)
    const freq = opts.freq as number | undefined
    const interval = opts.interval ?? 1

    const result: Partial<SchedulerState> = {
      exdates: output.exdates,
      rdates: output.rdates,
      untilMode: output.until ? 'date' : output.count ? 'count' : 'ongoing',
      untilDate: output.until ?? '',
      untilCount: output.count ?? 10,
    }

    const byDay = opts.byweekday
    const byMonthDay = opts.bymonthday
    const byMonth = opts.bymonth

    if (freq === RRule.DAILY && interval === 1) {
      result.frequency = 'daily'
    } else if (freq === RRule.WEEKLY && interval <= 2) {
      if (interval === 2) {
        result.frequency = 'custom'
        result.advancedMode = 'alternating'
      } else {
        result.frequency = 'weekly'
      }
      if (byDay) {
        const days = (Array.isArray(byDay) ? byDay : [byDay]).map(d => {
          if (typeof d === 'number') return d
          return RRULE_DAY_MAP[d.toString()] ?? 0
        })
        result.selectedDays = days
      }
    } else if (freq === RRule.MONTHLY) {
      if (interval === 1) {
        result.frequency = 'monthly'
      } else {
        result.frequency = 'custom'
        result.customInterval = interval
        result.customUnit = 'months'
      }
      if (byDay) {
        result.monthlyMode = 'weekday'
      } else if (byMonthDay) {
        result.monthlyMode = 'date'
        result.monthlyDates = Array.isArray(byMonthDay) ? byMonthDay : [byMonthDay]
      }
    } else if (freq === RRule.YEARLY) {
      result.frequency = 'yearly'
      if (byMonth) {
        result.selectedMonths = Array.isArray(byMonth) ? byMonth : [byMonth]
      }
      if (byMonthDay) {
        result.yearlyMode = 'date'
        result.yearlyDates = Array.isArray(byMonthDay) ? byMonthDay : [byMonthDay]
      }
    } else {
      result.frequency = 'custom'
      result.customInterval = interval
      if (freq === RRule.DAILY) result.customUnit = 'days'
      else if (freq === RRule.WEEKLY) result.customUnit = 'weeks'
      else if (freq === RRule.MONTHLY) result.customUnit = 'months'
      else if (freq === RRule.YEARLY) result.customUnit = 'years'
    }

    return result
  } catch {
    return { frequency: 'weekly' }
  }
}
