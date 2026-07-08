/**
 * deployQueueItem — shared direct-deploy engine (RR-DEPLOY-SCOPING, 2026-06-10).
 *
 * One authority for "create this reviewed/classified item at its destination
 * with sensible defaults." Consumed by:
 *   - Review & Route (NotepadReviewRoute) — user approved cards = HITM satisfied
 *   - MindSweep auto-route (useMindSweep routeDirectly) — user opted into
 *     trust_obvious / full_autopilot aggressiveness
 *   - FO-COMMAND-CENTER's Queue "Deploy all" button (their build wires the
 *     button; this engine does the writes — coordination file ruling)
 *
 * Contract:
 *   - Handles 'task' and 'list' destinations. Everything else returns
 *     { status: 'skipped' } — destinations needing human context (calendar
 *     dates, archive folders, recipe dual-routing) are NEVER half-created;
 *     callers keep their existing studio_queue path for those.
 *   - Task rows use the proven MindSweep-Lite minimal-row pattern
 *     (commitMindSweepLite.ts): pending / priority 'next' / assigned to the
 *     item's owner. The owner can flesh out details later via task edit.
 *   - List items go to an explicit target list when given (Review & Route
 *     sub-pick), else the owner's shopping list (established Lite behavior),
 *     else fall back to studio_queue so nothing is lost.
 *   - Throws NOTHING: every outcome is a returned status so batch callers
 *     get per-item isolation for free.
 *
 * RLS note: tasks INSERT carries WITH CHECK on assignee targeting
 * (util.task_assign_allowed, migration 100262). Self-deploys always pass;
 * a mom/granted-adult deploying for someone else passes via their authority.
 */

import { supabase } from '@/lib/supabase/client'

export interface DeployableItem {
  /** Normalized destination key ('task'/'tasks', 'list', 'wishlist', or anything else). */
  destination: string
  /** The item text — becomes the task title / list item content. */
  content: string
  /** Member the record is FOR (assignee / list owner scope). */
  ownerId: string
  /** Member performing the deploy (created_by). Defaults to ownerId. */
  actorId?: string
  familyId: string
  /** tasks.source attribution — must be a valid tasks_source_check value. */
  source: 'review_route' | 'mindsweep_auto'
  /** Origin record id (notepad_extracted_items / mindsweep event item). */
  sourceReferenceId?: string | null
  /** Explicit target list (Review & Route which-list sub-pick). */
  targetListId?: string | null
  /**
   * PRD-43 WishLists — explicit target PERSON for the 'wishlist' destination
   * (Review & Route which-person sub-pick, dynamicSubOptions). Defaults to
   * ownerId (self-capture) when not given.
   */
  targetMemberId?: string | null
  /** Sub-type flag preserved on queue fallback rows. */
  structureFlag?: string | null
  /** When deploying an EXISTING studio_queue row, its id — marked processed. */
  queueItemId?: string | null
}

export type DeployOutcome =
  | { status: 'deployed'; recordType: 'task' | 'list_item'; recordId: string }
  | { status: 'queued'; queueId: string }
  | { status: 'skipped'; reason: string }
  | { status: 'error'; error: string }

async function markQueueItemProcessed(queueItemId: string): Promise<void> {
  await supabase
    .from('studio_queue')
    .update({ processed_at: new Date().toISOString() })
    .eq('id', queueItemId)
}

async function fallbackToQueue(item: DeployableItem, destination: string): Promise<DeployOutcome> {
  // Already a queue row? Leave it where it is — that IS the fallback.
  if (item.queueItemId) {
    return { status: 'skipped', reason: `needs a target ${destination} pick` }
  }
  const { data, error } = await supabase
    .from('studio_queue')
    .insert({
      family_id: item.familyId,
      owner_id: item.ownerId,
      destination,
      content: item.content,
      source: item.source,
      source_reference_id: item.sourceReferenceId ?? null,
      structure_flag: item.structureFlag ?? null,
    })
    .select('id')
    .single()
  if (error) return { status: 'error', error: error.message }
  return { status: 'queued', queueId: data.id as string }
}

export async function deployQueueItem(item: DeployableItem): Promise<DeployOutcome> {
  const content = item.content.trim()
  if (!content) return { status: 'skipped', reason: 'empty content' }

  const destination = item.destination === 'tasks' ? 'task' : item.destination

  try {
    switch (destination) {
      case 'task': {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            family_id: item.familyId,
            created_by: item.actorId ?? item.ownerId,
            assignee_id: item.ownerId,
            title: content,
            task_type: 'task',
            status: 'pending',
            priority: 'next',
            source: item.source,
            source_reference_id: item.sourceReferenceId ?? null,
          })
          .select('id')
          .single()
        if (error) return { status: 'error', error: error.message }
        if (item.queueItemId) await markQueueItemProcessed(item.queueItemId)
        return { status: 'deployed', recordType: 'task', recordId: data.id as string }
      }

      case 'list': {
        let listId = item.targetListId ?? null

        if (!listId) {
          // Established MindSweep-Lite behavior: classifier 'list' items go to
          // the owner's shopping list when one exists.
          const { data: shoppingList } = await supabase
            .from('lists')
            .select('id')
            .eq('family_id', item.familyId)
            .eq('owner_id', item.ownerId)
            .eq('list_type', 'shopping')
            .is('archived_at', null)
            .limit(1)
            .maybeSingle()
          listId = (shoppingList?.id as string | undefined) ?? null
        }

        if (!listId) return fallbackToQueue(item, 'list')

        const { data, error } = await supabase
          .from('list_items')
          .insert({ list_id: listId, content })
          .select('id')
          .single()
        if (error) return { status: 'error', error: error.message }
        if (item.queueItemId) await markQueueItemProcessed(item.queueItemId)
        return { status: 'deployed', recordType: 'list_item', recordId: data.id as string }
      }

      case 'wishlist': {
        const targetMemberId = item.targetMemberId ?? item.ownerId

        const { data: existingWishlist } = await supabase
          .from('lists')
          .select('id')
          .eq('family_id', item.familyId)
          .eq('owner_id', targetMemberId)
          .eq('list_type', 'wishlist')
          .is('archived_at', null)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        let listId = existingWishlist?.id as string | undefined
        if (!listId) {
          const { data: createdList, error: createErr } = await supabase
            .from('lists')
            .insert({
              family_id: item.familyId,
              owner_id: targetMemberId,
              title: 'My Wish List',
              list_type: 'wishlist',
              is_included_in_ai: true,
            })
            .select('id')
            .single()
          if (createErr) return { status: 'error', error: createErr.message }
          listId = createdList.id as string
        }

        const isUrl = /^https?:\/\/\S+$/i.test(content)
        const { data, error } = await supabase
          .from('list_items')
          .insert({
            list_id: listId,
            content,
            resource_url: isUrl ? content : null,
            wishlist_state: 'active',
            is_included_in_ai: true,
            added_by: item.actorId ?? item.ownerId,
          })
          .select('id')
          .single()
        if (error) return { status: 'error', error: error.message }
        if (item.queueItemId) await markQueueItemProcessed(item.queueItemId)
        return { status: 'deployed', recordType: 'list_item', recordId: data.id as string }
      }

      default:
        // Calendar / archives / recipe / message / track / agenda / optimizer —
        // human context required. Never half-create.
        return { status: 'skipped', reason: `${destination} needs review context` }
    }
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : String(err) }
  }
}

/** Batch helper — per-item isolation, summarized counts for confirmation UI. */
export interface DeploySummary {
  deployed: DeployOutcome[]
  queued: DeployOutcome[]
  skipped: DeployOutcome[]
  errors: DeployOutcome[]
  taskCount: number
  listItemCount: number
}

export async function deployQueueItems(items: DeployableItem[]): Promise<DeploySummary> {
  const outcomes: DeployOutcome[] = []
  for (const item of items) {
    outcomes.push(await deployQueueItem(item))
  }
  const deployed = outcomes.filter(o => o.status === 'deployed')
  return {
    deployed,
    queued: outcomes.filter(o => o.status === 'queued'),
    skipped: outcomes.filter(o => o.status === 'skipped'),
    errors: outcomes.filter(o => o.status === 'error'),
    taskCount: deployed.filter(o => o.status === 'deployed' && o.recordType === 'task').length,
    listItemCount: deployed.filter(o => o.status === 'deployed' && o.recordType === 'list_item').length,
  }
}
