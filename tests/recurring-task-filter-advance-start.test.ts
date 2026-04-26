/**
 * Worker ROUTINE-PROPAGATION (c1) — advance-start gating in
 * recurringTaskFilter.
 *
 * Covers two paths:
 *   (a) RRULE routines — dtstart in recurrence_details controls
 *       RRule.between window, so future dtstart returns no occurrences
 *       for today.
 *   (b) Per-section-frequency routines (no rrule string) — bypassed
 *       the visibility filter entirely before this build. Now the
 *       filter checks recurrence_details.dtstart for these too.
 *
 * Both code paths must also work when task.is_shared=true. Shared
 * routines render on every assignee's dashboard; the start date must
 * apply uniformly.
 */

import { describe, it, expect } from 'vitest'
import { isRecurringTaskVisibleToday } from '@/lib/tasks/recurringTaskFilter'
import type { Task } from '@/types/tasks'

// Frozen "today" for deterministic tests. Use mid-day local to avoid
// any timezone wobble at midnight boundaries.
const TODAY = new Date(2026, 4, 15, 12, 0, 0) // 2026-05-15 12:00 local

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function makeRoutineWithRRule(opts: {
  dtstart: string
  rrule?: string
  isShared?: boolean
}): Task {
  return {
    id: 'task-1',
    family_id: 'fam-1',
    title: 'Test routine',
    task_type: 'routine',
    status: 'pending',
    recurrence_rule: 'daily',
    recurrence_details: {
      dtstart: opts.dtstart,
      rrule: opts.rrule ?? 'FREQ=DAILY',
      schedule_type: 'recurring',
    },
    is_shared: opts.isShared ?? false,
  } as unknown as Task
}

function makePerSectionRoutine(opts: {
  dtstart?: string
  isShared?: boolean
  dueDate?: string
}): Task {
  return {
    id: 'task-2',
    family_id: 'fam-1',
    title: 'Per-section routine',
    task_type: 'routine',
    status: 'pending',
    recurrence_rule: null,
    recurrence_details: opts.dtstart
      ? { dtstart: opts.dtstart, schedule_type: 'recurring' }
      : null,
    due_date: opts.dueDate ?? null,
    is_shared: opts.isShared ?? false,
  } as unknown as Task
}

describe('recurringTaskFilter — advance-start gating (c1)', () => {
  describe('RRULE routines', () => {
    it('hides today when dtstart is in the future', () => {
      // dtstart = today + 7 days
      const task = makeRoutineWithRRule({ dtstart: ymd(2026, 5, 22) })
      expect(isRecurringTaskVisibleToday(task, TODAY)).toBe(false)
    })

    it('shows today when dtstart is in the past', () => {
      const task = makeRoutineWithRRule({ dtstart: ymd(2026, 5, 1) })
      expect(isRecurringTaskVisibleToday(task, TODAY)).toBe(true)
    })

    it('shows today when dtstart equals today', () => {
      const task = makeRoutineWithRRule({ dtstart: ymd(2026, 5, 15) })
      expect(isRecurringTaskVisibleToday(task, TODAY)).toBe(true)
    })
  })

  describe('per-section-frequency routines (no RRULE)', () => {
    it('hides today when dtstart is in the future', () => {
      const task = makePerSectionRoutine({ dtstart: ymd(2026, 5, 22) })
      expect(isRecurringTaskVisibleToday(task, TODAY)).toBe(false)
    })

    it('shows today when dtstart is in the past', () => {
      const task = makePerSectionRoutine({ dtstart: ymd(2026, 5, 1) })
      expect(isRecurringTaskVisibleToday(task, TODAY)).toBe(true)
    })

    it('shows today when dtstart equals today', () => {
      const task = makePerSectionRoutine({ dtstart: ymd(2026, 5, 15) })
      expect(isRecurringTaskVisibleToday(task, TODAY)).toBe(true)
    })

    it('shows today when no recurrence_details at all (legacy data)', () => {
      const task = makePerSectionRoutine({})
      expect(isRecurringTaskVisibleToday(task, TODAY)).toBe(true)
    })
  })

  describe('is_shared=true routines (Worker 1 audit check for Worker 2)', () => {
    it('honors future dtstart on shared RRULE routine', () => {
      const task = makeRoutineWithRRule({
        dtstart: ymd(2026, 5, 22),
        isShared: true,
      })
      expect(isRecurringTaskVisibleToday(task, TODAY)).toBe(false)
    })

    it('honors future dtstart on shared per-section routine', () => {
      const task = makePerSectionRoutine({
        dtstart: ymd(2026, 5, 22),
        isShared: true,
      })
      expect(isRecurringTaskVisibleToday(task, TODAY)).toBe(false)
    })

    it('shows shared routine when dtstart is in the past', () => {
      const task = makePerSectionRoutine({
        dtstart: ymd(2026, 5, 1),
        isShared: true,
      })
      expect(isRecurringTaskVisibleToday(task, TODAY)).toBe(true)
    })
  })

  describe('end-date gating still works alongside advance-start', () => {
    it('hides routine past its end date even with valid dtstart', () => {
      const task = makePerSectionRoutine({
        dtstart: ymd(2026, 5, 1),
        dueDate: ymd(2026, 5, 10), // ended 5 days ago
      })
      expect(isRecurringTaskVisibleToday(task, TODAY)).toBe(false)
    })

    it('shows routine within its date window', () => {
      const task = makePerSectionRoutine({
        dtstart: ymd(2026, 5, 1),
        dueDate: ymd(2026, 5, 30), // ends 15 days from now
      })
      expect(isRecurringTaskVisibleToday(task, TODAY)).toBe(true)
    })
  })
})
