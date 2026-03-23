/**
 * Schedule Utilities (PRD-35)
 *
 * Client-side RRULE evaluation for access schedules.
 * Uses rrule.js (RFC 5545) for recurrence pattern resolution.
 *
 * All internal date handling uses UTC to avoid timezone drift.
 * The family's timezone is stored in families.timezone and applied
 * at the display layer, not in schedule evaluation.
 */

import { RRule, RRuleSet } from 'rrule'

/**
 * Recurrence details stored in the access_schedules.recurrence_details JSONB column.
 *
 * For shift schedules: defines when the member is ON duty.
 * For custody schedules: defines when the member HAS custody.
 * For always_on: recurrence_details is null (always available).
 */
export interface RecurrenceDetails {
  /** RRULE string (RFC 5545), e.g. "FREQ=WEEKLY;BYDAY=MO,WE,FR" */
  rrule: string
  /** Start time of each occurrence window (HH:MM format, 24h, UTC) */
  startTime: string
  /** End time of each occurrence window (HH:MM format, 24h, UTC) */
  endTime: string
  /** DTSTART for the recurrence rule (ISO 8601) */
  dtstart: string
  /** Optional UNTIL date (ISO 8601) */
  until?: string
  /** Timezone for evaluation */
  timezone?: string
}

export interface ScheduleWindow {
  start: Date
  end: Date
}

/**
 * Parse recurrence details from JSONB into a typed object.
 * Returns null if the data is missing or invalid.
 */
export function parseRecurrenceDetails(raw: unknown): RecurrenceDetails | null {
  if (!raw || typeof raw !== 'object') return null

  const details = raw as Record<string, unknown>
  if (typeof details.rrule !== 'string') return null
  if (typeof details.startTime !== 'string') return null
  if (typeof details.endTime !== 'string') return null
  if (typeof details.dtstart !== 'string') return null

  return {
    rrule: details.rrule,
    startTime: details.startTime,
    endTime: details.endTime,
    dtstart: details.dtstart,
    until: typeof details.until === 'string' ? details.until : undefined,
    timezone: typeof details.timezone === 'string' ? details.timezone : undefined,
  }
}

/**
 * Parse HH:MM time string into hours and minutes.
 */
function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number)
  return { hours: h ?? 0, minutes: m ?? 0 }
}

/**
 * Get schedule windows for a date range using RRULE evaluation.
 * Returns an array of { start, end } windows where the member is available.
 * All dates are in UTC.
 */
export function getScheduleWindows(
  details: RecurrenceDetails,
  rangeStart: Date,
  rangeEnd: Date
): ScheduleWindow[] {
  const rruleSet = new RRuleSet()

  const dtstart = new Date(details.dtstart)
  const rule = RRule.fromString(details.rrule)

  rruleSet.rrule(new RRule({
    ...rule.origOptions,
    dtstart,
    until: details.until ? new Date(details.until) : undefined,
  }))

  // Get all occurrences in the range
  const occurrences = rruleSet.between(rangeStart, rangeEnd, true)

  const { hours: startH, minutes: startM } = parseTime(details.startTime)
  const { hours: endH, minutes: endM } = parseTime(details.endTime)

  return occurrences.map(date => {
    const start = new Date(date)
    start.setUTCHours(startH, startM, 0, 0)

    const end = new Date(date)
    end.setUTCHours(endH, endM, 0, 0)

    // Handle overnight shifts (end time < start time means next day)
    if (end <= start) {
      end.setUTCDate(end.getUTCDate() + 1)
    }

    return { start, end }
  })
}

/**
 * Check if a given time falls within any schedule window.
 * checkTime should be a UTC Date.
 */
export function isCurrentlyAvailable(
  schedules: Array<{
    schedule_type: string
    recurrence_details: unknown
    is_active: boolean
  }>,
  checkTime: Date = new Date()
): boolean {
  const activeSchedules = schedules.filter(s => s.is_active)

  // No schedules = always available (platform default)
  if (activeSchedules.length === 0) return true

  // always_on schedule = always available
  if (activeSchedules.some(s => s.schedule_type === 'always_on')) return true

  // Check shift/custody schedules
  // Look 2 days before and after to catch overnight shifts across range boundaries
  const rangeStart = new Date(checkTime)
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 2)
  rangeStart.setUTCHours(0, 0, 0, 0)
  const rangeEnd = new Date(checkTime)
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 2)
  rangeEnd.setUTCHours(23, 59, 59, 999)

  for (const schedule of activeSchedules) {
    const details = parseRecurrenceDetails(schedule.recurrence_details)
    if (!details) continue

    const windows = getScheduleWindows(details, rangeStart, rangeEnd)
    for (const window of windows) {
      if (checkTime >= window.start && checkTime <= window.end) {
        return true
      }
    }
  }

  return false
}

/**
 * Get the next occurrence window for a member's schedule.
 * Useful for showing "next available at" information.
 */
export function getNextOccurrence(
  schedules: Array<{
    schedule_type: string
    recurrence_details: unknown
    is_active: boolean
  }>,
  after: Date = new Date()
): ScheduleWindow | null {
  const activeSchedules = schedules.filter(s => s.is_active)

  if (activeSchedules.length === 0) return null
  if (activeSchedules.some(s => s.schedule_type === 'always_on')) return null

  const rangeEnd = new Date(after)
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 30)

  let earliest: ScheduleWindow | null = null

  for (const schedule of activeSchedules) {
    const details = parseRecurrenceDetails(schedule.recurrence_details)
    if (!details) continue

    const windows = getScheduleWindows(details, after, rangeEnd)
    for (const window of windows) {
      if (window.start > after) {
        if (!earliest || window.start < earliest.start) {
          earliest = window
        }
        break
      }
    }
  }

  return earliest
}
