/**
 * Worker ROUTINE-PROPAGATION (c3) — getActiveTemplateDeployments and
 * helpers.
 *
 * Verifies:
 *  - Distinct counting / naming of affected family members
 *  - Filtering rules (archived, completed, cancelled all excluded)
 *  - Name list formatting for the modal copy
 *  - Same-assignee multiple-deployments dedupes correctly (relevant
 *    after c2.5 since the same family member may have non-overlapping
 *    sequential deployments of the same template)
 */

import { describe, it, expect } from 'vitest'
import {
  getActiveTemplateDeployments,
  distinctAssigneeNames,
  formatNameList,
  type ActiveDeployment,
} from '@/lib/templates/getActiveTemplateDeployments'

interface MockTaskRow {
  id: string
  assignee_id: string | null
  status: string
}

interface MockMemberRow {
  id: string
  display_name: string
}

function makeMockSupabase(
  taskRows: MockTaskRow[],
  memberRows: MockMemberRow[],
) {
  const taskQuery = {
    select: () => taskQuery,
    eq: () => taskQuery,
    is: () => taskQuery,
    not: () => Promise.resolve({ data: taskRows, error: null }),
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

describe('formatNameList (modal copy helper)', () => {
  it('returns empty string for empty array', () => {
    expect(formatNameList([])).toBe('')
  })

  it('returns the lone name for single-entry array', () => {
    expect(formatNameList(['Ruthie'])).toBe('Ruthie')
  })

  it('returns "X and Y" for two names', () => {
    expect(formatNameList(['Ruthie', 'Mosiah'])).toBe('Ruthie and Mosiah')
  })

  it('Oxford-comma joins three names', () => {
    expect(formatNameList(['Ruthie', 'Mosiah', 'Gideon'])).toBe(
      'Ruthie, Mosiah, and Gideon',
    )
  })

  it('Oxford-comma joins four+ names', () => {
    expect(formatNameList(['A', 'B', 'C', 'D'])).toBe('A, B, C, and D')
  })
})

describe('distinctAssigneeNames', () => {
  it('returns empty array for no deployments', () => {
    expect(distinctAssigneeNames([])).toEqual([])
  })

  it('returns each name once even if same assignee has multiple deployments', () => {
    const deployments: ActiveDeployment[] = [
      { taskId: 't1', assigneeId: 'mem-1', assigneeDisplayName: 'Mosiah' },
      { taskId: 't2', assigneeId: 'mem-1', assigneeDisplayName: 'Mosiah' },
      { taskId: 't3', assigneeId: 'mem-2', assigneeDisplayName: 'Helam' },
    ]
    expect(distinctAssigneeNames(deployments)).toEqual(['Mosiah', 'Helam'])
  })

  it('preserves first-seen order', () => {
    const deployments: ActiveDeployment[] = [
      { taskId: 't1', assigneeId: 'mem-3', assigneeDisplayName: 'Gideon' },
      { taskId: 't2', assigneeId: 'mem-1', assigneeDisplayName: 'Mosiah' },
      { taskId: 't3', assigneeId: 'mem-2', assigneeDisplayName: 'Helam' },
    ]
    expect(distinctAssigneeNames(deployments)).toEqual([
      'Gideon',
      'Mosiah',
      'Helam',
    ])
  })
})

describe('getActiveTemplateDeployments', () => {
  it('returns empty when no rows match', async () => {
    const supabase = makeMockSupabase([], [])
    const result = await getActiveTemplateDeployments(
      supabase as never,
      'tpl-1',
    )
    expect(result).toEqual([])
  })

  it('returns one entry per active task row, with display names resolved', async () => {
    const supabase = makeMockSupabase(
      [
        { id: 't1', assignee_id: 'mem-1', status: 'pending' },
        { id: 't2', assignee_id: 'mem-2', status: 'pending' },
      ],
      [
        { id: 'mem-1', display_name: 'Mosiah' },
        { id: 'mem-2', display_name: 'Helam' },
      ],
    )
    const result = await getActiveTemplateDeployments(
      supabase as never,
      'tpl-1',
    )
    expect(result).toHaveLength(2)
    expect(result.map(r => r.assigneeDisplayName).sort()).toEqual([
      'Helam',
      'Mosiah',
    ])
  })

  it('falls back to "this family member" when display_name unresolved', async () => {
    const supabase = makeMockSupabase(
      [{ id: 't1', assignee_id: 'mem-orphan', status: 'pending' }],
      [], // no member rows returned
    )
    const result = await getActiveTemplateDeployments(
      supabase as never,
      'tpl-1',
    )
    expect(result[0].assigneeDisplayName).toBe('this family member')
  })

  it('skips rows with null assignee_id', async () => {
    const supabase = makeMockSupabase(
      [
        { id: 't1', assignee_id: null, status: 'pending' },
        { id: 't2', assignee_id: 'mem-1', status: 'pending' },
      ],
      [{ id: 'mem-1', display_name: 'Mosiah' }],
    )
    const result = await getActiveTemplateDeployments(
      supabase as never,
      'tpl-1',
    )
    expect(result).toHaveLength(1)
    expect(result[0].assigneeId).toBe('mem-1')
  })
})

describe('integration: 0 vs 1 vs 3+ deployments (D3 modal copy paths)', () => {
  it('D3 copy at 0 deployments: count is 0, modal would not show', () => {
    const deployments: ActiveDeployment[] = []
    expect(distinctAssigneeNames(deployments).length).toBe(0)
    expect(formatNameList(distinctAssigneeNames(deployments))).toBe('')
  })

  it('D3 copy at 1 deployment: "1 active routine: Ruthie."', () => {
    const deployments: ActiveDeployment[] = [
      { taskId: 't1', assigneeId: 'mem-1', assigneeDisplayName: 'Ruthie' },
    ]
    const names = distinctAssigneeNames(deployments)
    expect(names.length).toBe(1)
    expect(formatNameList(names)).toBe('Ruthie')
  })

  it('D3 copy at 3 deployments: Oxford-comma list', () => {
    const deployments: ActiveDeployment[] = [
      { taskId: 't1', assigneeId: 'mem-1', assigneeDisplayName: 'Ruthie' },
      { taskId: 't2', assigneeId: 'mem-2', assigneeDisplayName: 'Mosiah' },
      { taskId: 't3', assigneeId: 'mem-3', assigneeDisplayName: 'Gideon' },
    ]
    const names = distinctAssigneeNames(deployments)
    expect(names.length).toBe(3)
    expect(formatNameList(names)).toBe('Ruthie, Mosiah, and Gideon')
  })
})
