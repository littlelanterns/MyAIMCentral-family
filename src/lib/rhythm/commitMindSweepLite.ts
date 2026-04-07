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
 *   release        → no record (value is in the act of naming/releasing)
 *   task           → INSERT tasks with source='rhythm_mindsweep_lite'
 *   list           → INSERT into member's shopping list (find or skip)
 *   calendar       → route to studio_queue (approval flow — calendar
 *                    parsing is complex and belongs in CalendarTab)
 *   journal        → INSERT journal_entries (private by default)
 *   victory        → INSERT victories
 *   guiding_stars  → INSERT guiding_stars
 *   best_intentions → INSERT best_intentions
 *   backburner     → INSERT into member's backburner list
 *   innerworkings  → INSERT self_knowledge (category='general')
 *   archives       → route to studio_queue (archive folder picker)
 *   recipe         → route to studio_queue (dual routing handled there)
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
 *   - Release as a first-class disposition
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
    const base: RhythmMindSweepItem = {
      text: item.text.trim(),
      disposition: item.disposition,
      classifier_suggested: item.classifier_suggested,
      classifier_confidence: item.classifier_confidence,
      destination_detail: item.destination_detail ?? null,
      created_record_id: null,
      created_record_type: null,
    }

    // Release: no record, value is in naming and letting go
    if (item.disposition === 'release') {
      enriched.push(base)
      continue
    }

    try {
      const result = await routeItem(item, familyId, memberId)
      enriched.push({
        ...base,
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
