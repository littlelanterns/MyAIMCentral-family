/**
 * Worker ROUTINE-PROPAGATION (c2.5, founder D5) — application-layer
 * overlap detection for routine deployments.
 *
 * Lives under src/lib/templates/ (not src/lib/tasks/) per founder D6
 * Thread 1: shared utilities folder so future Worker 2 SHARED-ROUTINES
 * and Worker 3 SHARED-LISTS can reuse the same primitives.
 *
 * Pairs with the prevent_overlapping_routine_assignments trigger
 * (migration 100176). The trigger is the DB backstop; this utility
 * is the UI pre-check so mom sees the warm "which days?" modal
 * instead of a raw 23P10-class Postgres error.
 *
 * Date range semantics match the trigger exactly:
 *   - dtstart = recurrence_details->>'dtstart' (YYYY-MM-DD); NULL falls
 *     back to created_at on the existing row
 *   - end_date = tasks.due_date; NULL = ongoing / +infinity
 *   - Overlap: existing.dtstart <= new.end_date
 *             AND existing.end_date >= new.dtstart
 *
 * Multi-assignee routines are checked one assignee at a time. Returns
 * one entry per (existing-deployment, new-assignee) pair where overlap
 * is detected.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface RoutineOverlapCandidate {
  /** ID of the existing tasks row that overlaps */
  existingTaskId: string
  /** Assignee that has the overlap (one entry per assignee) */
  assigneeId: string
  /** display_name of the assignee, for the modal copy */
  assigneeDisplayName: string
  /** existing routine's dtstart (YYYY-MM-DD) */
  existingDtstart: string
  /** existing routine's due_date (YYYY-MM-DD) or null = ongoing */
  existingEndDate: string | null
  /** existing routine's title (for "Open existing routine" deep link) */
  existingTitle: string
}

export interface DetectRoutineOverlapInput {
  familyId: string
  templateId: string
  /** Proposed assignee IDs (one task row will be inserted per assignee) */
  assigneeIds: string[]
  /** Proposed dtstart for the new deployment (YYYY-MM-DD) */
  newDtstart: string
  /** Proposed end date for the new deployment (YYYY-MM-DD or null = ongoing) */
  newEndDate: string | null
  /**
   * When set, exclude this task ID from the overlap check (used during
   * an UPDATE — mom is editing an existing deployment and shouldn't
   * collide with herself).
   */
  excludeTaskId?: string
}

/**
 * Detect routine deployments that would overlap with the proposed
 * (templateId, assigneeIds, dtstart, endDate). Returns an empty array
 * when no overlaps exist. One entry per overlapping (existing, assignee)
 * pair — multiple assignees may each have their own overlap.
 */
export async function detectRoutineOverlap(
  supabase: SupabaseClient,
  input: DetectRoutineOverlapInput,
): Promise<RoutineOverlapCandidate[]> {
  if (input.assigneeIds.length === 0) return []

  // Fetch all active routine deployments for this template across the
  // requested assignees in one query. Then filter for date-range overlap
  // in JS (the JSONB path makes a pure-SQL filter awkward in PostgREST
  // and the candidate set is small).
  const query = supabase
    .from('tasks')
    .select(
      'id, title, assignee_id, due_date, recurrence_details, created_at',
    )
    .eq('family_id', input.familyId)
    .eq('template_id', input.templateId)
    .eq('task_type', 'routine')
    .is('archived_at', null)
    .in('assignee_id', input.assigneeIds)

  const { data: existingRows, error } = await query
  if (error) throw error
  if (!existingRows || existingRows.length === 0) return []

  // Resolve assignee display names in one round-trip. Missing
  // family_members rows fall back to "this family member".
  const { data: members } = await supabase
    .from('family_members')
    .select('id, display_name')
    .in('id', input.assigneeIds)

  const memberNameById = new Map<string, string>()
  for (const m of members ?? []) {
    if (m.id && m.display_name) memberNameById.set(m.id, m.display_name)
  }

  const candidates: RoutineOverlapCandidate[] = []

  for (const row of existingRows) {
    if (input.excludeTaskId && row.id === input.excludeTaskId) continue
    if (!row.assignee_id) continue

    const recurrenceDetails = row.recurrence_details as
      | Record<string, unknown>
      | null
    const dtstartRaw =
      typeof recurrenceDetails?.dtstart === 'string'
        ? (recurrenceDetails.dtstart as string)
        : null

    // Fallback chain: dtstart on JSONB → created_at date → epoch.
    // Matches the trigger's COALESCE chain exactly.
    let existingDtstart: string
    if (dtstartRaw) {
      existingDtstart = dtstartRaw.slice(0, 10)
    } else if (row.created_at) {
      existingDtstart = (row.created_at as string).slice(0, 10)
    } else {
      existingDtstart = '1970-01-01'
    }

    const existingEndDate = (row.due_date as string | null) ?? null

    // Overlap check (NULL end_date = +infinity on either side)
    const newDtstart = input.newDtstart
    const newEnd = input.newEndDate
    const aStartLeqBEnd = newEnd === null || existingDtstart <= newEnd
    const aEndGeqBStart =
      existingEndDate === null || existingEndDate >= newDtstart

    if (!aStartLeqBEnd || !aEndGeqBStart) continue

    candidates.push({
      existingTaskId: row.id as string,
      assigneeId: row.assignee_id as string,
      assigneeDisplayName:
        memberNameById.get(row.assignee_id as string) ?? 'this family member',
      existingDtstart,
      existingEndDate,
      existingTitle: (row.title as string | null) ?? 'this routine',
    })
  }

  return candidates
}

/**
 * Pure overlap predicate, exported for testing the math without a
 * Supabase round-trip. Mirrors the trigger SQL.
 *
 * @returns true if [aStart, aEnd] overlaps [bStart, bEnd], where NULL
 *          end dates are treated as +infinity.
 */
export function dateRangesOverlap(
  aStart: string,
  aEnd: string | null,
  bStart: string,
  bEnd: string | null,
): boolean {
  const aStartLeqBEnd = bEnd === null || aStart <= bEnd
  const aEndGeqBStart = aEnd === null || aEnd >= bStart
  return aStartLeqBEnd && aEndGeqBStart
}
