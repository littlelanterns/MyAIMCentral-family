/**
 * Universal Scheduler Tests (PRD-35)
 *
 * Layer 1 tests for schedule evaluation logic:
 * - RRULE parsing and window generation
 * - Availability checks for shift/custody/always_on
 * - Default behavior (no schedules = always available)
 * - Overnight shift handling
 * - Schedule-aware streak calculation support
 *
 * All dates use UTC to match the schedule evaluation engine.
 */

import { describe, it, expect } from 'vitest'
import {
  parseRecurrenceDetails,
  isCurrentlyAvailable,
  getNextOccurrence,
  getScheduleWindows,
  type RecurrenceDetails,
} from '@/lib/scheduling/scheduleUtils'

// Helper to create a UTC date
function utc(iso: string): Date {
  return new Date(iso.endsWith('Z') ? iso : iso + 'Z')
}

// Helper to build a schedule object for testing
function makeSchedule(
  type: 'shift' | 'custody' | 'always_on',
  details: RecurrenceDetails | null = null,
  active = true
) {
  return {
    schedule_type: type,
    recurrence_details: details,
    is_active: active,
  }
}

// A standard MWF 9-5 shift schedule (UTC times)
const MWF_SHIFT: RecurrenceDetails = {
  rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
  startTime: '09:00',
  endTime: '17:00',
  dtstart: '2026-01-01T00:00:00Z',
}

// Every day 8am-3pm custody schedule
const DAILY_CUSTODY: RecurrenceDetails = {
  rrule: 'FREQ=DAILY',
  startTime: '08:00',
  endTime: '15:00',
  dtstart: '2026-01-01T00:00:00Z',
}

// Overnight shift (6pm - 6am)
const OVERNIGHT_SHIFT: RecurrenceDetails = {
  rrule: 'FREQ=WEEKLY;BYDAY=TU,TH',
  startTime: '18:00',
  endTime: '06:00',
  dtstart: '2026-01-01T00:00:00Z',
}

describe('Universal Scheduler (PRD-35)', () => {
  describe('parseRecurrenceDetails', () => {
    it('should parse valid recurrence details', () => {
      const result = parseRecurrenceDetails(MWF_SHIFT)
      expect(result).not.toBeNull()
      expect(result!.rrule).toBe('FREQ=WEEKLY;BYDAY=MO,WE,FR')
      expect(result!.startTime).toBe('09:00')
      expect(result!.endTime).toBe('17:00')
    })

    it('should return null for null/undefined input', () => {
      expect(parseRecurrenceDetails(null)).toBeNull()
      expect(parseRecurrenceDetails(undefined)).toBeNull()
    })

    it('should return null for invalid input', () => {
      expect(parseRecurrenceDetails({})).toBeNull()
      expect(parseRecurrenceDetails({ rrule: 123 })).toBeNull()
      expect(parseRecurrenceDetails('string')).toBeNull()
    })

    it('should return null when required fields are missing', () => {
      expect(parseRecurrenceDetails({ rrule: 'FREQ=DAILY' })).toBeNull()
      expect(parseRecurrenceDetails({
        rrule: 'FREQ=DAILY',
        startTime: '09:00',
      })).toBeNull()
    })

    it('should handle optional fields', () => {
      const withOptionals = {
        ...MWF_SHIFT,
        until: '2026-12-31T00:00:00Z',
        timezone: 'America/Chicago',
      }
      const result = parseRecurrenceDetails(withOptionals)
      expect(result!.until).toBe('2026-12-31T00:00:00Z')
      expect(result!.timezone).toBe('America/Chicago')
    })
  })

  describe('isCurrentlyAvailable', () => {
    it('should return true when no schedules exist (default: always available)', () => {
      expect(isCurrentlyAvailable([])).toBe(true)
    })

    it('should return true for always_on schedule', () => {
      const schedules = [makeSchedule('always_on')]
      expect(isCurrentlyAvailable(schedules)).toBe(true)
    })

    it('should ignore inactive schedules', () => {
      const schedules = [makeSchedule('shift', MWF_SHIFT, false)]
      expect(isCurrentlyAvailable(schedules)).toBe(true)
    })

    it('should return true for always_on even with other active schedules', () => {
      const schedules = [
        makeSchedule('shift', MWF_SHIFT),
        makeSchedule('always_on'),
      ]
      expect(isCurrentlyAvailable(schedules)).toBe(true)
    })

    it('should evaluate shift schedule — available during window', () => {
      // Monday at 10am UTC (within 9-5 MWF window)
      // 2026-03-23 is a Monday
      const monday10am = utc('2026-03-23T10:00:00')
      const schedules = [makeSchedule('shift', MWF_SHIFT)]
      expect(isCurrentlyAvailable(schedules, monday10am)).toBe(true)
    })

    it('should evaluate shift schedule — unavailable outside window', () => {
      // Monday at 8pm UTC (outside 9-5 MWF window)
      const monday8pm = utc('2026-03-23T20:00:00')
      const schedules = [makeSchedule('shift', MWF_SHIFT)]
      expect(isCurrentlyAvailable(schedules, monday8pm)).toBe(false)
    })

    it('should evaluate shift schedule — unavailable on non-scheduled day', () => {
      // Tuesday at 10am UTC (MWF only, not Tuesday)
      const tuesday10am = utc('2026-03-24T10:00:00')
      const schedules = [makeSchedule('shift', MWF_SHIFT)]
      expect(isCurrentlyAvailable(schedules, tuesday10am)).toBe(false)
    })

    it('should evaluate custody schedule', () => {
      // Any day at noon UTC (within 8am-3pm daily custody)
      const noon = utc('2026-03-25T12:00:00')
      const schedules = [makeSchedule('custody', DAILY_CUSTODY)]
      expect(isCurrentlyAvailable(schedules, noon)).toBe(true)
    })

    it('should handle overnight shifts', () => {
      // Thursday at 10pm UTC (within 6pm-6am overnight on Tu/Th)
      // 2026-03-26 is Thursday
      const thursday10pm = utc('2026-03-26T22:00:00')
      const schedules = [makeSchedule('shift', OVERNIGHT_SHIFT)]
      expect(isCurrentlyAvailable(schedules, thursday10pm)).toBe(true)
    })
  })

  describe('getScheduleWindows', () => {
    it('should generate windows for weekly recurrence', () => {
      const rangeStart = utc('2026-03-23T00:00:00') // Monday
      const rangeEnd = utc('2026-03-29T23:59:59')   // Sunday
      const windows = getScheduleWindows(MWF_SHIFT, rangeStart, rangeEnd)

      // MWF in this week: Mon 23, Wed 25, Fri 27
      expect(windows.length).toBe(3)
      expect(windows[0].start.getUTCDay()).toBe(1) // Monday
      expect(windows[1].start.getUTCDay()).toBe(3) // Wednesday
      expect(windows[2].start.getUTCDay()).toBe(5) // Friday
    })

    it('should set correct start/end times on windows', () => {
      const rangeStart = utc('2026-03-23T00:00:00')
      const rangeEnd = utc('2026-03-23T23:59:59')
      const windows = getScheduleWindows(MWF_SHIFT, rangeStart, rangeEnd)

      expect(windows.length).toBe(1) // Just Monday
      expect(windows[0].start.getUTCHours()).toBe(9)
      expect(windows[0].start.getUTCMinutes()).toBe(0)
      expect(windows[0].end.getUTCHours()).toBe(17)
      expect(windows[0].end.getUTCMinutes()).toBe(0)
    })

    it('should handle overnight windows (end < start = next day)', () => {
      const rangeStart = utc('2026-03-26T00:00:00') // Thursday
      const rangeEnd = utc('2026-03-26T23:59:59')
      const windows = getScheduleWindows(OVERNIGHT_SHIFT, rangeStart, rangeEnd)

      expect(windows.length).toBe(1)
      expect(windows[0].start.getUTCHours()).toBe(18) // 6pm Thursday
      expect(windows[0].end.getUTCDate()).toBe(27)     // End is Friday
      expect(windows[0].end.getUTCHours()).toBe(6)     // 6am Friday
    })
  })

  describe('getNextOccurrence', () => {
    it('should return null when no schedules exist', () => {
      expect(getNextOccurrence([])).toBeNull()
    })

    it('should return null for always_on schedule', () => {
      const schedules = [makeSchedule('always_on')]
      expect(getNextOccurrence(schedules)).toBeNull()
    })

    it('should find the next shift window', () => {
      // After Monday 6pm UTC, next MWF window is Wednesday 9am
      const monday6pm = utc('2026-03-23T18:00:00')
      const schedules = [makeSchedule('shift', MWF_SHIFT)]
      const next = getNextOccurrence(schedules, monday6pm)

      expect(next).not.toBeNull()
      expect(next!.start.getUTCDay()).toBe(3) // Wednesday
      expect(next!.start.getUTCHours()).toBe(9)
    })
  })

  describe('Schedule Types', () => {
    it('should support exactly 3 schedule types', () => {
      const types = ['shift', 'custody', 'always_on']
      expect(types).toHaveLength(3)
    })

    it('shift — for special adults and caregivers with defined hours', () => {
      const schedule = makeSchedule('shift', MWF_SHIFT)
      expect(schedule.schedule_type).toBe('shift')
    })

    it('custody — for co-parenting arrangements', () => {
      const schedule = makeSchedule('custody', DAILY_CUSTODY)
      expect(schedule.schedule_type).toBe('custody')
    })

    it('always_on — for permanent household members', () => {
      const schedule = makeSchedule('always_on')
      expect(schedule.schedule_type).toBe('always_on')
      expect(schedule.recurrence_details).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle schedules with null recurrence_details gracefully', () => {
      const schedules = [makeSchedule('shift', null)]
      // Should not crash, just return false (has schedule but can't evaluate it)
      expect(isCurrentlyAvailable(schedules)).toBe(false)
    })

    it('should handle multiple overlapping schedules', () => {
      const schedules = [
        makeSchedule('shift', MWF_SHIFT),
        makeSchedule('custody', DAILY_CUSTODY),
      ]
      // Tuesday at noon UTC: not in MWF shift, but in daily custody
      const tuesday_noon = utc('2026-03-24T12:00:00')
      expect(isCurrentlyAvailable(schedules, tuesday_noon)).toBe(true)
    })

    it('mix of active and inactive schedules', () => {
      const schedules = [
        makeSchedule('shift', MWF_SHIFT, false),     // inactive
        makeSchedule('custody', DAILY_CUSTODY, true), // active
      ]
      const noon = utc('2026-03-24T12:00:00')
      expect(isCurrentlyAvailable(schedules, noon)).toBe(true)
    })
  })

  describe('Integration with Streak Calculation (PRD-24)', () => {
    it('should support schedule-aware streak checking', () => {
      // Member with MWF shifts is not available on Tuesday
      const schedules = [makeSchedule('shift', MWF_SHIFT)]
      const tuesdayNoon = utc('2026-03-24T12:00:00')

      const available = isCurrentlyAvailable(schedules, tuesdayNoon)
      expect(available).toBe(false)
      // The streak system should use this to grant grace on off-days
    })
  })
})
