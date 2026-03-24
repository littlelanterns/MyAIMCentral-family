/**
 * PRD-17 + PRD-09A: Notepad → Tasks routing handler.
 * When RoutingStrip routes to 'tasks' with a sub-type,
 * this creates studio_queue item(s) with destination='task'.
 *
 * Sub-types from RoutingStrip:
 *   'single'     → 1 queue item with structure_flag='single'
 *   'individual'  → N items parsed from content, each with structure_flag='individual'
 *   'ai_sort'     → items with structure_flag='ai_sort'
 *   'sequential'  → 1 item with structure_flag='sequential'
 */

import { supabase } from '@/lib/supabase/client'

interface TaskRouteOptions {
  content: string
  subType: 'single' | 'individual' | 'ai_sort' | 'sequential'
  familyId: string
  memberId: string
  sourceType: string
  sourceReferenceId?: string
}

export async function handleTaskRoute({
  content,
  subType,
  familyId,
  memberId,
  sourceType,
  sourceReferenceId,
}: TaskRouteOptions): Promise<void> {
  const batchId = crypto.randomUUID()

  if (subType === 'single' || subType === 'sequential') {
    // One queue item for the entire content
    const { error } = await supabase.from('studio_queue').insert({
      family_id: familyId,
      owner_id: memberId,
      destination: 'task',
      content: content.trim(),
      content_details: {},
      source: sourceType,
      source_reference_id: sourceReferenceId ?? null,
      structure_flag: subType,
      batch_id: null, // single items don't need batch grouping
    })

    if (error) throw error
    return
  }

  if (subType === 'individual' || subType === 'ai_sort') {
    // Split content into lines, each becomes a separate queue item
    const lines = content
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

    if (lines.length === 0) return

    const items = lines.map(line => ({
      family_id: familyId,
      owner_id: memberId,
      destination: 'task' as const,
      content: line,
      content_details: {},
      source: sourceType,
      source_reference_id: sourceReferenceId ?? null,
      structure_flag: subType,
      batch_id: lines.length > 1 ? batchId : null,
    }))

    const { error } = await supabase.from('studio_queue').insert(items)
    if (error) throw error
    return
  }
}

/**
 * Create a task request from a family member to a parent.
 * Creates a studio_queue item with source='member_request'.
 */
export async function createTaskRequest({
  content,
  note,
  familyId,
  requesterId,
  targetMemberId,
}: {
  content: string
  note?: string
  familyId: string
  requesterId: string
  targetMemberId: string
}): Promise<void> {
  const { error } = await supabase.from('studio_queue').insert({
    family_id: familyId,
    owner_id: targetMemberId, // lands in parent's queue
    destination: 'task',
    content: content.trim(),
    content_details: {},
    source: 'member_request',
    source_reference_id: null,
    structure_flag: 'single',
    batch_id: null,
    requester_id: requesterId,
    requester_note: note?.trim() || null,
  })

  if (error) throw error
}
