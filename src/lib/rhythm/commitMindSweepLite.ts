/**
 * PRD-18 Phase C Enhancement 2: Commit MindSweep-Lite
 *
 * Pure commit utility called from RhythmModal.handleComplete AFTER
 * commitTomorrowCapture and BEFORE useCompleteRhythm.mutateAsync.
 *
 * Takes the staged MindSweep-Lite items from MindSweepLiteSection
 * (classified by mindsweep-sort, possibly user-overridden, stored in
 * RhythmMetadataContext) and routes each item per its disposition:
 *
 *   release         → no record (value is in the act of naming/releasing)
 *   task            → INSERT tasks with source='rhythm_mindsweep_lite'
 *   list            → INSERT into member's shopping list (find or skip)
 *   calendar        → route to studio_queue (approval flow — calendar
 *                     parsing is complex and belongs in CalendarTab)
 *   journal         → INSERT journal_entries (private by default)
 *   victory         → INSERT victories
 *   guiding_stars   → INSERT guiding_stars
 *   best_intentions → INSERT best_intentions
 *   backburner      → INSERT into member's backburner list
 *   innerworkings   → INSERT self_knowledge (category='general')
 *   archives        → route to studio_queue (archive folder picker)
 *   recipe          → route to studio_queue (dual routing handled there)
 *   family_request  → INSERT family_requests with source='mindsweep_auto'
 *                     (Build L.1 — PRD-15 delegation wiring, ADULT-ONLY)
 *   talk_to_someone → INSERT journal_entries with content prefixed
 *                     "Reminder to talk to [Name] about: [text]" and
 *                     tags=['rhythm_mindsweep_lite','talk_to_someone'].
 *                     TEEN-ONLY. NEVER writes to family_requests — teen
 *                     delegation is a PRIVATE note the teen sees later,
 *                     not an outbound message. This is the founder-
 *                     critical rule: Phase D teen talk_to_someone and
 *                     Phase C adult family_request must NEVER share a
 *                     code path, because the former is a self-reminder
 *                     and the latter is an outbound cross-member write.
 *
 * Error handling: per-item try/catch. If one item's write fails, its
 * `commit_error` is set and other items continue. The whole function
 * never throws, so a partial failure does NOT block rhythm completion.
 * Failed items are preserved in `rhythm_completions.metadata.mindsweep_items`
 * so the user can see what went wrong.
 *
 * This is a deliberate mirror of `routeDirectly` from useMindSweep.ts
 * rather than a reuse — the rhythm use case needs:
 *   - A different source attribution (`rhythm_mindsweep_lite` vs `mindsweep_auto`)
 *   - Full per-item error isolation (not all-or-nothing)
 *   - Release + family_request as first-class dispositions
 * Mirroring keeps this function self-contained and safe to evolve.
 */

import { supabase } from '@/lib/supabase/client'
import type { RhythmMindSweepItem } from '@/types/rhythms'

export interface StagedMindSweepLiteItem {
  text: string
  disposition: RhythmMindSweepItem['disposition']
  classifier_suggested: RhythmMindSweepItem['disposition']
  classifier_confidence?: string
  destination_detail?: Record<string, unknown> | null
  /**
   * For `family_request` disposition: which family member the request
   * should be sent to. Populated by MindSweepLiteSection when the
   * mindsweep-sort classifier detects a cross-member reference
   * (cross_member_id + cross_member_action='suggest_route'). Required
   * at commit time for family_request items — if missing, the item
   * falls back to `task` disposition to prevent orphan requests.
   */
  recipient_member_id?: string | null
  /** Display name for UI rendering of the recipient chip. */
  recipient_name?: string | null
}

export interface CommitMindSweepLiteParams {
  familyId: string
  memberId: string
  items: StagedMindSweepLiteItem[]
}

/**
 * Commit staged MindSweep-Lite items. Returns the enriched array ready
 * to be stored in rhythm_completions.metadata.mindsweep_items.
 *
 * Partial failures are returned as items with commit_error set —
 * never thrown. The rhythm completion still writes.
 */
export async function commitMindSweepLite({
  familyId,
  memberId,
  items,
}: CommitMindSweepLiteParams): Promise<RhythmMindSweepItem[]> {
  const populated = items.filter(i => i.text.trim().length > 0)
  if (populated.length === 0) return []

  const enriched: RhythmMindSweepItem[] = []

  for (const item of populated) {
    // Preserve recipient metadata on the enriched record so audit
    // history + future rendering can show who the request went to.
    const detailWithRecipient: Record<string, unknown> = {
      ...(item.destination_detail ?? {}),
    }
    if (item.recipient_member_id) {
      detailWithRecipient.recipient_member_id = item.recipient_member_id
    }
    if (item.recipient_name) {
      detailWithRecipient.recipient_name = item.recipient_name
    }

    const base: RhythmMindSweepItem = {
      text: item.text.trim(),
      disposition: item.disposition,
      classifier_suggested: item.classifier_suggested,
      classifier_confidence: item.classifier_confidence,
      destination_detail:
        Object.keys(detailWithRecipient).length > 0 ? detailWithRecipient : null,
      created_record_id: null,
      created_record_type: null,
    }

    // Release: no record, value is in naming and letting go
    if (item.disposition === 'release') {
      enriched.push(base)
      continue
    }

    // Family request without a resolved recipient can't be routed —
    // fall back to a task so the intent isn't lost. The recipient
    // name (if known) is preserved in destination_detail for context.
    let effectiveItem = item
    if (item.disposition === 'family_request' && !item.recipient_member_id) {
      effectiveItem = { ...item, disposition: 'task' }
    }

    try {
      const result = await routeItem(effectiveItem, familyId, memberId)
      enriched.push({
        ...base,
        // Reflect the effective disposition if it was auto-downgraded
        disposition: effectiveItem.disposition,
        created_record_id: result.id,
        created_record_type: result.type,
      })
    } catch (err) {
      enriched.push({
        ...base,
        commit_error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return enriched
}

interface RouteResult {
  id: string
  type: RhythmMindSweepItem['created_record_type']
}

/**
 * Route a single non-release item to its destination. Throws on any
 * write error — the caller wraps in try/catch for per-item isolation.
 */
async function routeItem(
  item: StagedMindSweepLiteItem,
  familyId: string,
  memberId: string,
): Promise<RouteResult> {
  const content = item.text.trim()

  switch (item.disposition) {
    case 'task': {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          family_id: familyId,
          created_by: memberId,
          assignee_id: memberId,
          title: content,
          task_type: 'task',
          status: 'pending',
          priority: 'next',
          source: 'rhythm_mindsweep_lite',
        })
        .select('id')
        .single()
      if (error) throw error
      return { id: data.id as string, type: 'task' }
    }

    case 'family_request': {
      // PRD-18 Phase C follow-up (Build L.1) — Build M wiring of the
      // MindSweep-Lite delegate disposition into PRD-15's family_requests
      // table. The caller guarantees recipient_member_id is present
      // (the wrapper downgrades to 'task' if it isn't), so this path
      // can trust the value. source='mindsweep_auto' matches the
      // PRD-17B cross-PRD impact addendum convention for cross-member
      // items originated by the sweep pipeline.
      if (!item.recipient_member_id) {
        // Defensive — the wrapper should have downgraded to 'task'
        throw new Error('family_request missing recipient_member_id')
      }
      // family_requests has a separate title + details split. Keep the
      // title short; put the full text in details if longer than the
      // title limit so nothing is truncated silently.
      const title = content.length <= 200 ? content : content.slice(0, 197) + '…'
      const { data, error } = await supabase
        .from('family_requests')
        .insert({
          family_id: familyId,
          sender_member_id: memberId,
          recipient_member_id: item.recipient_member_id,
          title,
          details: content.length > 200 ? content : null,
          status: 'pending',
          source: 'mindsweep_auto',
        })
        .select('id')
        .single()
      if (error) throw error
      return { id: data.id as string, type: 'family_request' }
    }

    case 'journal': {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          family_id: familyId,
          member_id: memberId,
          entry_type: 'brain_dump',
          content,
          visibility: 'private',
          tags: ['rhythm_mindsweep_lite'],
        })
        .select('id')
        .single()
      if (error) throw error
      return { id: data.id as string, type: 'journal_entry' }
    }

    case 'talk_to_someone': {
      // PRD-18 Phase D Enhancement 7 — TEEN-ONLY disposition.
      //
      // CRITICAL RULE: this path MUST NEVER reach 'family_request'
      // logic. Teen "talk to someone" is a PRIVATE self-reminder,
      // not an outbound request. The recipient_name is preserved in
      // the content so the teen can find it later when they decide
      // how to bring it up. Nothing leaves the teen's journal.
      //
      // Content format (founder approved 2026-04-07):
      //   "Reminder to talk to [Name] about: [original text]"
      //   "Reminder to talk to someone about: [original text]"  (if no recipient)
      //
      // Tags allow the teen to filter/find these notes later via the
      // journal tag system built in PRD-08.
      const recipientLabel = item.recipient_name?.trim() || 'someone'
      const noteContent = `Reminder to talk to ${recipientLabel} about: ${content}`
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          family_id: familyId,
          member_id: memberId,
          entry_type: 'brain_dump',
          content: noteContent,
          visibility: 'private',
          tags: ['rhythm_mindsweep_lite', 'talk_to_someone'],
        })
        .select('id')
        .single()
      if (error) throw error
      return { id: data.id as string, type: 'journal_entry' }
    }

    case 'victory': {
      const { data, error } = await supabase
        .from('victories')
        .insert({
          family_id: familyId,
          family_member_id: memberId,
          description: content.slice(0, 500),
          source: 'manual',
        })
        .select('id')
        .single()
      if (error) throw error
      return { id: data.id as string, type: 'victory' }
    }

    case 'guiding_stars': {
      const { data, error } = await supabase
        .from('guiding_stars')
        .insert({
          family_id: familyId,
          member_id: memberId,
          content,
          source: 'manual',
        })
        .select('id')
        .single()
      if (error) throw error
      return { id: data.id as string, type: 'guiding_star' }
    }

    case 'best_intentions': {
      const { data, error } = await supabase
        .from('best_intentions')
        .insert({
          family_id: familyId,
          member_id: memberId,
          statement: content,
          source: 'manual',
        })
        .select('id')
        .single()
      if (error) throw error
      return { id: data.id as string, type: 'best_intention' }
    }

    case 'innerworkings': {
      const { data, error } = await supabase
        .from('self_knowledge')
        .insert({
          family_id: familyId,
          member_id: memberId,
          content,
          category: 'general',
          source_type: 'manual',
        })
        .select('id')
        .single()
      if (error) throw error
      return { id: data.id as string, type: 'self_knowledge' }
    }

    case 'backburner': {
      // Find member's backburner list (auto-provisioned by trigger on member insert)
      const { data: list, error: listErr } = await supabase
        .from('lists')
        .select('id')
        .eq('family_id', familyId)
        .eq('owner_id', memberId)
        .eq('list_type', 'backburner')
        .is('archived_at', null)
        .limit(1)
        .maybeSingle()
      if (listErr) throw listErr
      if (!list) {
        // Fallback: route to studio_queue so nothing is lost
        return routeToStudioQueue(content, familyId, memberId, 'backburner')
      }
      const { data, error } = await supabase
        .from('list_items')
        .insert({
          list_id: list.id,
          content,
        })
        .select('id')
        .single()
      if (error) throw error
      return { id: data.id as string, type: 'list_item' }
    }

    case 'list': {
      // Route to the member's shopping list if it exists, otherwise
      // fall back to studio_queue for the user to pick a list.
      const { data: shoppingList } = await supabase
        .from('lists')
        .select('id')
        .eq('family_id', familyId)
        .eq('owner_id', memberId)
        .eq('list_type', 'shopping')
        .is('archived_at', null)
        .limit(1)
        .maybeSingle()

      if (shoppingList) {
        const { data, error } = await supabase
          .from('list_items')
          .insert({
            list_id: shoppingList.id,
            content,
          })
          .select('id')
          .single()
        if (error) throw error
        return { id: data.id as string, type: 'list_item' }
      }

      return routeToStudioQueue(content, familyId, memberId, 'list')
    }

    case 'calendar':
      // Calendar items have parsed destination_detail with
      // calendar_subtype + events array. Routing those correctly is
      // complex (single vs multi-day vs recurring vs options vs series)
      // and duplicates the existing CalendarTab approval flow. Phase C
      // routes them to studio_queue for that flow to handle.
      return routeToStudioQueue(content, familyId, memberId, 'calendar', item.destination_detail)

    case 'archives':
      // Archives need folder selection — route to queue for triage
      return routeToStudioQueue(content, familyId, memberId, 'archives')

    case 'recipe':
      // Recipes dual-route (archive + shopping list) — handled by queue
      return routeToStudioQueue(content, familyId, memberId, 'list')

    case 'release':
      // Unreachable — filtered before routeItem — but TypeScript exhaustiveness
      throw new Error('release should be filtered before routeItem')

    default: {
      const exhaustive: never = item.disposition
      throw new Error(`Unknown disposition: ${String(exhaustive)}`)
    }
  }
}

/**
 * Fall back to studio_queue when a direct write isn't safe/possible.
 * Matches the attribution pattern used by the existing mindsweep
 * pipeline — studio_queue.source='mindsweep_auto' — and tags the
 * content_details with a rhythm_evening flag for audit.
 */
async function routeToStudioQueue(
  content: string,
  familyId: string,
  memberId: string,
  destination: string,
  detail?: Record<string, unknown> | null,
): Promise<RouteResult> {
  const { data, error } = await supabase
    .from('studio_queue')
    .insert({
      family_id: familyId,
      owner_id: memberId,
      destination,
      content,
      content_details: {
        ...(detail ?? {}),
        source_context: 'rhythm_evening',
      },
      source: 'mindsweep_auto',
    })
    .select('id')
    .single()
  if (error) throw error
  return { id: data.id as string, type: 'studio_queue' }
}
