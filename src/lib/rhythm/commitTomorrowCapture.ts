/**
 * PRD-18 Enhancement 1: Commit Tomorrow Capture
 *
 * Pure commit utility called from RhythmModal.handleComplete before
 * useCompleteRhythm.mutateAsync. Takes the staged priority items from
 * EveningTomorrowCaptureSection and executes all writes in a single
 * batched sequence:
 *
 *   1. For items with confirmedMatch=true (user said "yes, that's it"):
 *      UPDATE tasks SET priority='now' where id IN (...)
 *
 *   2. For items without a matched task (confirmedMatch=false):
 *      INSERT INTO tasks (..., source='rhythm_priority', due_date=tomorrow)
 *      Return the new IDs so rhythm_completions.metadata can reference them.
 *
 *   3. Return an enriched priority_items array with:
 *      - text                  the user's typed string
 *      - matched_task_id       (if matched)
 *      - matched_task_title    snapshot of title at commit time
 *      - created_task_id       (if newly created)
 *      - focus_selected        mirror from input (overflow picker)
 *      - prompt_variant_index  mirror from input (which rotating prompt)
 *
 * If ANY write fails, the whole function throws. The modal catches it,
 * shows a toast, and does NOT write the completion record — preventing
 * orphaned staged state.
 *
 * This is deliberately not a React hook — it needs to run inside the
 * existing mutation pipeline where imperative sequencing is cleaner
 * than hook composition.
 */

import { supabase } from '@/lib/supabase/client'
import { localIsoDaysFromToday } from '@/utils/dates'
import type { RhythmPriorityItem } from '@/types/rhythms'

export interface StagedPriorityItem {
  text: string
  matchedTaskId: string | null
  matchedTaskTitle: string | null
  focusSelected: boolean
  promptVariantIndex: number
}

export interface CommitTomorrowCaptureParams {
  familyId: string
  memberId: string
  items: StagedPriorityItem[]
}

/**
 * Commit the staged tomorrow capture items to the database. Returns
 * the enriched priority_items array ready to be written into
 * rhythm_completions.metadata.
 *
 * Empty items array returns an empty array without touching the DB.
 *
 * Matched items that already had priority='now' are included in the
 * UPDATE unconditionally — idempotent.
 */
export async function commitTomorrowCapture({
  familyId,
  memberId,
  items,
}: CommitTomorrowCaptureParams): Promise<RhythmPriorityItem[]> {
  // Filter out empty-text items — those are unused input rows
  const populated = items.filter(i => i.text.trim().length > 0)
  if (populated.length === 0) return []

  const tomorrow = localIsoDaysFromToday(1)

  // ─── 1. Bump priority='now' on matched tasks ────────────────
  const matchedIds = populated
    .filter(i => i.matchedTaskId !== null)
    .map(i => i.matchedTaskId as string)

  if (matchedIds.length > 0) {
    const { error } = await supabase
      .from('tasks')
      .update({ priority: 'now' })
      .in('id', matchedIds)

    if (error) {
      throw new Error(
        `Tomorrow Capture: failed to bump priority on matched tasks: ${error.message}`
      )
    }
  }

  // ─── 2. Insert new tasks for unmatched items ────────────────
  const unmatched = populated.filter(i => i.matchedTaskId === null)
  const createdIdByIndex = new Map<number, string>()

  if (unmatched.length > 0) {
    const rows = unmatched.map((item, idx) => ({
      family_id: familyId,
      created_by: memberId,
      assignee_id: memberId,
      title: item.text.trim(),
      task_type: 'task' as const,
      status: 'pending' as const,
      priority: 'now' as const,
      source: 'rhythm_priority' as const,
      due_date: tomorrow,
      sort_order: idx,
    }))

    const { data: inserted, error } = await supabase
      .from('tasks')
      .insert(rows)
      .select('id')

    if (error) {
      throw new Error(
        `Tomorrow Capture: failed to create new tasks: ${error.message}`
      )
    }

    if (inserted && inserted.length === unmatched.length) {
      // Map the returned IDs back to their original positions in the
      // populated array so we can attach them to priority_items.
      let insertIdx = 0
      populated.forEach((item, populatedIdx) => {
        if (item.matchedTaskId === null) {
          createdIdByIndex.set(populatedIdx, inserted[insertIdx].id as string)
          insertIdx++
        }
      })
    }
  }

  // ─── 3. Build enriched priority_items array ─────────────────
  const enriched: RhythmPriorityItem[] = populated.map((item, idx) => ({
    text: item.text.trim(),
    matched_task_id: item.matchedTaskId,
    matched_task_title: item.matchedTaskTitle,
    created_task_id: createdIdByIndex.get(idx) ?? null,
    focus_selected: item.focusSelected,
    prompt_variant_index: item.promptVariantIndex,
  }))

  return enriched
}
