/**
 * useAssignableMembers — single frontend authority for "who may the current
 * (effective) member assign NEW tasks to."
 *
 * TS mirror of util.task_assign_allowed() (migration 100262) — the DB enforces
 * the same rule via WITH CHECK on tasks.assignee_id / task_assignments, so a
 * surface that forgets this hook is caught by RLS, not silently leaked.
 *
 * Resolution (RR-DEPLOY-SCOPING, founder decisions 2026-06-10):
 *  - primary_parent   → every active in-nest family member (unchanged behavior)
 *  - additional_adult → self + kids covered by a `task_assignment` grant
 *                       (per-kid row and/or family-wide NULL-target row;
 *                       per-kid row ALWAYS wins, incl. 'none' carve-outs —
 *                       identical shape to financial_tracking, Convention #274)
 *  - everyone else    → self only (teens use the family_request "Ask someone"
 *                       path for cross-member wants — never direct assignment)
 *
 * View-As aware: scopes to the EFFECTIVE member (useEffectiveMember), so a
 * granted dad's inline FO TaskCreationModal and mom's View-As sessions both
 * resolve correctly. Coordination ruling with FO-COMMAND-CENTER (Q1): this is
 * the ONE authority for assigning NEW work; acting on EXISTING tasks stays on
 * the contribute-level viewableLevels check.
 */

import { useMemo } from 'react'
import { useEffectiveMember } from './useEffectiveMember'
import { useViewableMembers } from './useViewableMembers'
import type { FamilyMember } from './useFamilyMember'

export const TASK_ASSIGNMENT_KEY = 'task_assignment'

export interface AssignableMembersResult {
  /** Members the effective member may assign new tasks to (active, in-nest). */
  assignableMembers: FamilyMember[]
  /** Fast lookup of assignable member ids. */
  assignableIds: Set<string>
  /** True when 2+ members are assignable — gates Any/Each + multi-select UI. */
  canAssignOthers: boolean
  /** True when the effective member is the primary parent (gates "Everyone"). */
  isMom: boolean
  isLoading: boolean
}

export function useAssignableMembers(): AssignableMembersResult {
  const { member: effective } = useEffectiveMember()

  const { viewableMembers, isMom, isLoading } = useViewableMembers(
    TASK_ASSIGNMENT_KEY,
    effective ? { id: effective.id, family_id: effective.family_id, role: effective.role } : null,
  )

  const { assignableMembers, assignableIds } = useMemo(() => {
    const members = viewableMembers.filter((m) => m.is_active && !m.out_of_nest)
    return {
      assignableMembers: members,
      assignableIds: new Set(members.map((m) => m.id)),
    }
  }, [viewableMembers])

  return {
    assignableMembers,
    assignableIds,
    canAssignOthers: assignableMembers.length > 1,
    isMom,
    isLoading,
  }
}
