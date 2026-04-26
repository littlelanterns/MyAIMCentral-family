/**
 * Worker ROUTINE-PROPAGATION (c2.5) — overlap detection utility.
 *
 * Tests the pure dateRangesOverlap predicate (the math) and the full
 * detectRoutineOverlap function (mocking the supabase client).
 *
 * Mirrors the SQL trigger in migration 100176 — both must agree on
 * the overlap rule, since application is the warm path and trigger
 * is the backstop.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  dateRangesOverlap,
  detectRoutineOverlap,
} from '@/lib/templates/detectRoutineOverlap'

describe('dateRangesOverlap (pure predicate)', () => {
  it('returns true when ranges share days', () => {
    expect(
      dateRangesOverlap('2026-05-01', '2026-05-31', '2026-05-15', '2026-06-15'),
    ).toBe(true)
  })

  it('returns false when proposed range is entirely after existing', () => {
    expect(
      dateRangesOverlap('2026-06-01', '2026-06-30', '2026-05-01', '2026-05-31'),
    ).toBe(false)
  })

  it('returns false when proposed range is entirely before existing', () => {
    expect(
      dateRangesOverlap('2026-04-01', '2026-04-30', '2026-05-01', '2026-05-31'),
    ).toBe(false)
  })

  it('returns true when ranges share exactly the boundary day', () => {
    // Existing ends on May 15, new starts on May 15 → overlap on May 15.
    expect(
      dateRangesOverlap('2026-05-15', '2026-05-31', '2026-05-01', '2026-05-15'),
    ).toBe(true)
  })

  it('treats null end_date on existing as +infinity (always overlaps when start <= existing.start)', () => {
    expect(
      dateRangesOverlap('2026-06-01', '2026-06-30', '2026-05-01', null),
    ).toBe(true)
  })

  it('treats null end_date on proposed as +infinity', () => {
    expect(
      dateRangesOverlap('2026-05-01', null, '2026-04-01', '2026-04-30'),
    ).toBe(false)
    expect(
      dateRangesOverlap('2026-05-01', null, '2026-05-15', '2026-05-31'),
    ).toBe(true)
  })

  it('returns true when both end dates are null and starts are valid', () => {
    expect(dateRangesOverlap('2026-05-01', null, '2026-06-01', null)).toBe(true)
  })

  it('returns false when proposed ends exactly the day before existing starts', () => {
    expect(
      dateRangesOverlap('2026-04-01', '2026-04-30', '2026-05-01', '2026-05-31'),
    ).toBe(false)
  })
})

// ─── detectRoutineOverlap (with mocked supabase) ────────────────────

interface MockTaskRow {
  id: string
  title: string | null
  assignee_id: string | null
  due_date: string | null
  recurrence_details: Record<string, unknown> | null
  created_at: string
}

interface MockMemberRow {
  id: string
  display_name: string
}

function makeMockSupabase(
  taskRows: MockTaskRow[],
  memberRows: MockMemberRow[],
) {
  // Minimal Supabase shape: from(table).select(...).eq(...).is(...).in(...).
  // We use a type assertion at the call site so we don't have to
  // implement the entire SupabaseClient surface.
  const taskQuery = {
    select: () => taskQuery,
    eq: () => taskQuery,
    is: () => taskQuery,
    in: () => Promise.resolve({ data: taskRows, error: null }),
  }
  const memberQuery = {
    select: () => memberQuery,
    in: () => Promise.resolve({ data: memberRows, error: null }),
  }

  return {
    from: (table: string) => {
      if (table === 'tasks') return taskQuery
      if (table === 'family_members') return memberQuery
      throw new Error(`Unexpected table: ${table}`)
    },
  }
}

describe('detectRoutineOverlap', () => {
  it('returns empty array when no existing rows match', async () => {
    const supabase = makeMockSupabase([], [])
    const result = await detectRoutineOverlap(supabase as never, {
      familyId: 'fam-1',
      templateId: 'tpl-1',
      assigneeIds: ['mem-1'],
      newDtstart: '2026-05-15',
      newEndDate: null,
    })
    expect(result).toEqual([])
  })

  it('returns empty when existing range does not overlap proposed', async () => {
    const supabase = makeMockSupabase(
      [
        {
          id: 'task-1',
          title: 'Bathroom',
          assignee_id: 'mem-1',
          due_date: '2026-04-30',
          recurrence_details: { dtstart: '2026-04-01' },
          created_at: '2026-04-01T00:00:00Z',
        },
      ],
      [{ id: 'mem-1', display_name: 'Mosiah' }],
    )
    const result = await detectRoutineOverlap(supabase as never, {
      familyId: 'fam-1',
      templateId: 'tpl-1',
      assigneeIds: ['mem-1'],
      newDtstart: '2026-05-01',
      newEndDate: null,
    })
    expect(result).toEqual([])
  })

  it('detects overlap and returns assignee display name', async () => {
    const supabase = makeMockSupabase(
      [
        {
          id: 'task-1',
          title: 'Bathroom',
          assignee_id: 'mem-1',
          due_date: null, // ongoing
          recurrence_details: { dtstart: '2026-04-01' },
          created_at: '2026-04-01T00:00:00Z',
        },
      ],
      [{ id: 'mem-1', display_name: 'Mosiah' }],
    )
    const result = await detectRoutineOverlap(supabase as never, {
      familyId: 'fam-1',
      templateId: 'tpl-1',
      assigneeIds: ['mem-1'],
      newDtstart: '2026-05-15',
      newEndDate: '2026-08-01',
    })
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      existingTaskId: 'task-1',
      assigneeId: 'mem-1',
      assigneeDisplayName: 'Mosiah',
      existingDtstart: '2026-04-01',
      existingEndDate: null,
      existingTitle: 'Bathroom',
    })
  })

  it('falls back to created_at when recurrence_details.dtstart is missing', async () => {
    // Legacy row from before c2 — no dtstart on the JSONB. The
    // overlap math should fall back to created_at::date.
    const supabase = makeMockSupabase(
      [
        {
          id: 'task-legacy',
          title: 'Legacy routine',
          assignee_id: 'mem-1',
          due_date: '2026-05-31',
          recurrence_details: null,
          created_at: '2026-04-15T08:30:00Z',
        },
      ],
      [{ id: 'mem-1', display_name: 'Helam' }],
    )
    const result = await detectRoutineOverlap(supabase as never, {
      familyId: 'fam-1',
      templateId: 'tpl-1',
      assigneeIds: ['mem-1'],
      newDtstart: '2026-05-01',
      newEndDate: '2026-06-30',
    })
    expect(result).toHaveLength(1)
    expect(result[0].existingDtstart).toBe('2026-04-15')
  })

  it('skips the excluded task ID (UPDATE path)', async () => {
    const supabase = makeMockSupabase(
      [
        {
          id: 'task-self',
          title: 'Bathroom',
          assignee_id: 'mem-1',
          due_date: null,
          recurrence_details: { dtstart: '2026-04-01' },
          created_at: '2026-04-01T00:00:00Z',
        },
      ],
      [{ id: 'mem-1', display_name: 'Mosiah' }],
    )
    const result = await detectRoutineOverlap(supabase as never, {
      familyId: 'fam-1',
      templateId: 'tpl-1',
      assigneeIds: ['mem-1'],
      newDtstart: '2026-05-15',
      newEndDate: null,
      excludeTaskId: 'task-self',
    })
    expect(result).toEqual([])
  })

  it('returns empty when assigneeIds is empty (no rows to insert)', async () => {
    const supabase = {
      from: vi.fn(() => {
        throw new Error('should not query')
      }),
    }
    const result = await detectRoutineOverlap(supabase as never, {
      familyId: 'fam-1',
      templateId: 'tpl-1',
      assigneeIds: [],
      newDtstart: '2026-05-01',
      newEndDate: null,
    })
    expect(result).toEqual([])
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('handles multi-assignee deployment with overlap on subset', async () => {
    // Mom deploys to 3 family members; only Helam already has it.
    const supabase = makeMockSupabase(
      [
        {
          id: 'task-helam',
          title: 'Bathroom',
          assignee_id: 'mem-helam',
          due_date: null,
          recurrence_details: { dtstart: '2026-04-01' },
          created_at: '2026-04-01T00:00:00Z',
        },
      ],
      [
        { id: 'mem-helam', display_name: 'Helam' },
        { id: 'mem-mosiah', display_name: 'Mosiah' },
        { id: 'mem-gideon', display_name: 'Gideon' },
      ],
    )
    const result = await detectRoutineOverlap(supabase as never, {
      familyId: 'fam-1',
      templateId: 'tpl-1',
      assigneeIds: ['mem-helam', 'mem-mosiah', 'mem-gideon'],
      newDtstart: '2026-05-01',
      newEndDate: null,
    })
    expect(result).toHaveLength(1)
    expect(result[0].assigneeDisplayName).toBe('Helam')
  })
})
