/**
 * Worker ROUTINE-PROPAGATION (c2) — buildTaskScheduleFields routine
 * branch.
 *
 * Verifies the routine path persists recurrence_details.dtstart so
 * recurringTaskFilter can gate visibility. Per founder D1+D2:
 *   - dtstart = data.startDate when "Schedule to start later" is on
 *   - dtstart = familyToday when toggle is off (silent default = today)
 *   - data.dueDate (the "Run until" end date) is preserved unchanged
 *   - is_shared, RRULE, and other fields are not invented here — the
 *     routine path uses the per-section-frequency model (no rrule
 *     string on tasks)
 */

import { describe, it, expect } from 'vitest'
import { buildTaskScheduleFields } from '@/utils/buildTaskScheduleFields'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'

const FAMILY_TODAY = '2026-04-25'

function routineData(overrides: Partial<CreateTaskData> = {}): CreateTaskData {
  return {
    title: 'Test routine',
    description: '',
    durationEstimate: '',
    customDuration: '',
    lifeAreaTag: '',
    customLifeArea: '',
    taskType: 'routine',
    opportunitySubType: 'repeatable',
    maxCompletions: '',
    claimLockDuration: '',
    claimLockUnit: 'hours',
    assignments: [],
    wholeFamily: false,
    assignMode: 'each',
    rotationEnabled: false,
    rotationFrequency: 'weekly',
    schedule: null,
    incompleteAction: 'auto_reschedule',
    reward: {
      rewardType: '' as never,
      rewardAmount: '',
      bonusThreshold: '85',
      bonusPercentage: '20',
      requireApproval: false,
      trackAsWidget: false,
      flagAsVictory: false,
    },
    listSource: 'new',
    listDeliveryMode: 'checklist',
    newListName: '',
    newListItems: [],
    saveAsTemplate: false,
    templateName: '',
    countsForAllowance: false,
    countsForHomework: false,
    countsForGamification: true,
    isExtraCredit: false,
    homeworkSubjectIds: [],
    ...overrides,
  } as CreateTaskData
}

describe('buildTaskScheduleFields — routine branch (c2)', () => {
  it('writes dtstart=familyToday when startDate is undefined (toggle off)', () => {
    const result = buildTaskScheduleFields(routineData(), FAMILY_TODAY)
    expect(result.recurrence_details).toEqual({
      dtstart: FAMILY_TODAY,
      schedule_type: 'recurring',
    })
    expect(result.recurrence_rule).toBeNull()
    expect(result.due_date).toBeNull()
  })

  it('writes dtstart=startDate when toggle is on and date is picked', () => {
    const result = buildTaskScheduleFields(
      routineData({ startDate: '2026-05-01' }),
      FAMILY_TODAY,
    )
    expect(result.recurrence_details).toEqual({
      dtstart: '2026-05-01',
      schedule_type: 'recurring',
    })
  })

  it('falls back to familyToday when startDate is empty string', () => {
    const result = buildTaskScheduleFields(
      routineData({ startDate: '' }),
      FAMILY_TODAY,
    )
    // Empty string is falsy — dtstart should NOT be empty in storage.
    expect((result.recurrence_details as Record<string, unknown>).dtstart).toBe(
      FAMILY_TODAY,
    )
  })

  it('preserves "Run until" dueDate alongside dtstart', () => {
    const result = buildTaskScheduleFields(
      routineData({ startDate: '2026-05-01', dueDate: '2026-08-01' }),
      FAMILY_TODAY,
    )
    expect(result.due_date).toBe('2026-08-01')
    expect(
      (result.recurrence_details as Record<string, unknown>).dtstart,
    ).toBe('2026-05-01')
  })

  it('treats empty dueDate ("") as null (Ongoing)', () => {
    const result = buildTaskScheduleFields(
      routineData({ dueDate: '' }),
      FAMILY_TODAY,
    )
    expect(result.due_date).toBeNull()
  })

  it('non-routine task types do NOT trigger the routine branch', () => {
    // Standard one-time task path — no recurrence_details should be
    // emitted just because the routine branch was added.
    const data = routineData({
      taskType: 'task',
      scheduleMode: 'one_time',
      dueDate: '2026-05-15',
    })
    const result = buildTaskScheduleFields(data, FAMILY_TODAY)
    expect(result.recurrence_details).toBeNull()
    expect(result.due_date).toBe('2026-05-15')
  })

  it('non-routine daily task path is unchanged', () => {
    const data = routineData({
      taskType: 'task',
      scheduleMode: 'daily',
    })
    const result = buildTaskScheduleFields(data, FAMILY_TODAY)
    expect(result.recurrence_rule).toBe('daily')
    expect(
      (result.recurrence_details as Record<string, unknown>).rrule,
    ).toBe('FREQ=DAILY')
  })
})
