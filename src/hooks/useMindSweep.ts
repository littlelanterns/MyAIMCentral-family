/**
 * useMindSweep — PRD-17B MindSweep hook
 * Manages settings, triggers sweep, and handles routing results.
 */
import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  MindSweepSettings,
  MindSweepHoldingItem,
  MindSweepAllowedSender,
  MindSweepSortRequest,
  MindSweepSortResponse,
  MindSweepSortResult,
  AggressivenessMode,
  SweepEventSourceChannel,
  SweepInputType,
  FamilyMemberName,
} from '@/types/mindsweep'

// ── Settings ──

export function useMindSweepSettings(memberId: string | undefined) {
  return useQuery({
    queryKey: ['mindsweep-settings', memberId],
    queryFn: async () => {
      if (!memberId) return null

      const { data, error } = await supabase
        .from('mindsweep_settings')
        .select('*')
        .eq('member_id', memberId)
        .maybeSingle()

      if (error) throw error
      return data as MindSweepSettings | null
    },
    enabled: !!memberId,
  })
}

export function useUpdateMindSweepSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      memberId: string
      familyId: string
      updates: Partial<Omit<MindSweepSettings, 'id' | 'family_id' | 'member_id' | 'created_at' | 'updated_at'>>
    }) => {
      const { data, error } = await supabase
        .from('mindsweep_settings')
        .upsert({
          member_id: params.memberId,
          family_id: params.familyId,
          ...params.updates,
        }, { onConflict: 'member_id' })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mindsweep-settings', variables.memberId] })
    },
  })
}

// ── Sweep Email Address ──

export function useSweepEmail(familyId: string | undefined) {
  return useQuery({
    queryKey: ['sweep-email', familyId],
    queryFn: async () => {
      if (!familyId) return null
      const { data, error } = await supabase
        .from('families')
        .select('sweep_email_address, sweep_email_enabled')
        .eq('id', familyId)
        .single()
      if (error) throw error
      return data as { sweep_email_address: string | null; sweep_email_enabled: boolean }
    },
    enabled: !!familyId,
  })
}

export function useUpdateSweepEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { familyId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('families')
        .update({ sweep_email_enabled: params.enabled })
        .eq('id', params.familyId)
      if (error) throw error
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['sweep-email', params.familyId] })
    },
  })
}

// ── Allowed Senders ──

export function useAllowedSenders(familyId: string | undefined) {
  return useQuery({
    queryKey: ['mindsweep-allowed-senders', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('mindsweep_allowed_senders')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data || []) as MindSweepAllowedSender[]
    },
    enabled: !!familyId,
  })
}

export function useAddAllowedSender() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { familyId: string; email: string; addedBy: string }) => {
      const { error } = await supabase
        .from('mindsweep_allowed_senders')
        .insert({
          family_id: params.familyId,
          email_address: params.email.toLowerCase().trim(),
          added_by: params.addedBy,
        })
      if (error) throw error
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['mindsweep-allowed-senders', params.familyId] })
    },
  })
}

export function useRemoveAllowedSender() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string }) => {
      const { error } = await supabase
        .from('mindsweep_allowed_senders')
        .delete()
        .eq('id', params.id)
      if (error) throw error
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['mindsweep-allowed-senders', params.familyId] })
    },
  })
}

// ── Holding Queue ──

export function useMindSweepHolding(familyId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['mindsweep-holding', familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return []

      const { data, error } = await supabase
        .from('mindsweep_holding')
        .select('*')
        .eq('family_id', familyId)
        .eq('member_id', memberId)
        .is('processed_at', null)
        .order('captured_at', { ascending: true })

      if (error) throw error
      return (data || []) as MindSweepHoldingItem[]
    },
    enabled: !!familyId && !!memberId,
  })
}

export function useAddToHolding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: {
      family_id: string
      member_id: string
      content: string
      content_type: MindSweepHoldingItem['content_type']
      source_channel: MindSweepHoldingItem['source_channel']
      link_url?: string
    }) => {
      const { data, error } = await supabase
        .from('mindsweep_holding')
        .insert(item)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['mindsweep-holding', variables.family_id, variables.member_id],
      })
    },
  })
}

// ── Sweep Trigger ──

export interface SweepParams {
  items: { content: string; content_type: string; id?: string }[]
  familyId: string
  memberId: string
  settings: MindSweepSettings | null
  sourceChannel: SweepEventSourceChannel
  inputType: SweepInputType
  familyMemberNames: FamilyMemberName[]
}

export function useTriggerSweep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: SweepParams): Promise<MindSweepSortResponse> => {
      const settings = params.settings
      const aggressiveness: AggressivenessMode = settings?.aggressiveness || 'always_ask'
      const alwaysReviewRules = settings?.always_review_rules || [
        'emotional_children', 'relationship_dynamics', 'behavioral_notes', 'financial',
      ]
      const customReviewRules = settings?.custom_review_rules || []

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const requestBody: MindSweepSortRequest = {
        items: params.items.map(i => ({
          id: i.id,
          content: i.content,
          content_type: i.content_type as MindSweepSortRequest['items'][0]['content_type'],
        })),
        family_id: params.familyId,
        member_id: params.memberId,
        aggressiveness,
        always_review_rules: alwaysReviewRules,
        custom_review_rules: customReviewRules,
        source_channel: params.sourceChannel,
        input_type: params.inputType,
        family_member_names: params.familyMemberNames,
      }

      const response = await supabase.functions.invoke('mindsweep-sort', {
        body: requestBody,
      })

      if (response.error) throw response.error
      return response.data as MindSweepSortResponse
    },
    onSuccess: (_data, params) => {
      // Note: this fires when the Edge Function returns classifications,
      // BEFORE routeSweepResults writes the rows. The actual studio_queue
      // count invalidation happens in useRunSweep AFTER routeSweepResults
      // completes. We invalidate the list cache here eagerly so that any
      // open Sort tab refreshes its paginated list; the count badge
      // invalidation is deferred to useRunSweep.
      queryClient.invalidateQueries({ queryKey: ['studio-queue'] })
      queryClient.invalidateQueries({ queryKey: ['studio-queue-count'] })
      queryClient.invalidateQueries({ queryKey: ['mindsweep-holding', params.familyId, params.memberId] })
    },
  })
}

// ── Route Results ──
// After sweep, route results based on aggressiveness mode.
// Auto-routed items go directly to destinations or studio_queue.
// Queued items go to studio_queue for manual review.

export async function routeSweepResults(
  results: MindSweepSortResult[],
  aggressiveness: AggressivenessMode,
  familyId: string,
  memberId: string,
  eventId: string | undefined,
): Promise<{ autoRouted: number; queued: number; failed: number; errors: string[] }> {
  let autoRouted = 0
  let queued = 0
  let failed = 0
  const errors: string[] = []

  // Run all inserts concurrently — they're independent.
  // Per-item try/catch: one failure doesn't block the rest, but failures
  // are reported back to the caller so the UI can surface them honestly
  // instead of silently incrementing the counter.
  const promises = results.map(async (result) => {
    const isAutoRoute = shouldAutoRoute(result.confidence, aggressiveness)
    try {
      if (isAutoRoute) {
        await routeDirectly(result, familyId, memberId, eventId)
        autoRouted++
      } else {
        await queueForReview(result, familyId, memberId, eventId)
        queued++
      }
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : String(err)
      errors.push(`[${result.destination}] ${message}`)
      console.error('[MindSweep] routeSweepResults failed for item:', {
        destination: result.destination,
        extracted_text: result.extracted_text?.slice(0, 80),
        error: message,
      })
    }
  })

  await Promise.all(promises)
  return { autoRouted, queued, failed, errors }
}

function shouldAutoRoute(
  confidence: string,
  aggressiveness: AggressivenessMode,
): boolean {
  if (confidence === 'review_required') return false

  switch (aggressiveness) {
    case 'always_ask':
      return false
    case 'trust_obvious':
      return confidence === 'high'
    case 'full_autopilot':
      return confidence === 'high' || confidence === 'medium'
    default:
      return false
  }
}

// Queue-based destinations go through studio_queue
const QUEUE_DESTINATIONS = new Set(['task', 'list', 'calendar'])

async function routeDirectly(
  result: MindSweepSortResult,
  familyId: string,
  memberId: string,
  eventId: string | undefined,
) {
  const destination = result.destination

  if (QUEUE_DESTINATIONS.has(destination) || destination === 'recipe') {
    // Even "auto-routed" queue destinations go to studio_queue with pre-filled details
    const { error } = await supabase.from('studio_queue').insert({
      family_id: familyId,
      owner_id: memberId,
      destination: destination === 'recipe' ? 'list' : destination,
      content: result.extracted_text,
      content_details: result.destination_detail || null,
      source: 'mindsweep_auto',
      mindsweep_confidence: result.confidence === 'review_required' ? null : result.confidence,
      mindsweep_event_id: eventId || null,
    })
    if (error) throw new Error(`studio_queue insert failed: ${error.message}`)
    return
  }

  // Direct routing for non-queue destinations
  switch (destination) {
    case 'journal': {
      const { error } = await supabase.from('journal_entries').insert({
        family_id: familyId,
        member_id: memberId,
        entry_type: 'quick_note',
        content: result.extracted_text,
        visibility: 'private',
      })
      if (error) throw new Error(`journal_entries insert failed: ${error.message}`)
      break
    }

    case 'victory': {
      const { error } = await supabase.from('victories').insert({
        family_id: familyId,
        member_id: memberId,
        title: result.extracted_text.substring(0, 100),
        source: 'manual',
      })
      if (error) throw new Error(`victories insert failed: ${error.message}`)
      break
    }

    case 'guiding_stars': {
      const { error } = await supabase.from('guiding_stars').insert({
        family_id: familyId,
        member_id: memberId,
        content: result.extracted_text,
        source: 'manual',
      })
      if (error) throw new Error(`guiding_stars insert failed: ${error.message}`)
      break
    }

    case 'best_intentions': {
      const { error } = await supabase.from('best_intentions').insert({
        family_id: familyId,
        member_id: memberId,
        statement: result.extracted_text,
        source: 'manual',
      })
      if (error) throw new Error(`best_intentions insert failed: ${error.message}`)
      break
    }

    case 'backburner': {
      // Find or create backburner list for this member
      const { data: backburnerList, error: listErr } = await supabase
        .from('lists')
        .select('id')
        .eq('family_id', familyId)
        .eq('owner_id', memberId)
        .eq('list_type', 'backburner')
        .limit(1)
        .maybeSingle()

      if (listErr) throw new Error(`backburner list lookup failed: ${listErr.message}`)

      if (backburnerList) {
        const { error } = await supabase.from('list_items').insert({
          list_id: backburnerList.id,
          content: result.extracted_text,
        })
        if (error) throw new Error(`backburner list_items insert failed: ${error.message}`)
      } else {
        // Fallback: queue it
        const { error } = await supabase.from('studio_queue').insert({
          family_id: familyId,
          owner_id: memberId,
          destination: 'backburner',
          content: result.extracted_text,
          source: 'mindsweep_auto',
          mindsweep_confidence: result.confidence === 'review_required' ? null : result.confidence,
          mindsweep_event_id: eventId || null,
        })
        if (error) throw new Error(`backburner fallback studio_queue insert failed: ${error.message}`)
      }
      break
    }

    case 'innerworkings': {
      const { error } = await supabase.from('self_knowledge').insert({
        family_id: familyId,
        member_id: memberId,
        content: result.extracted_text,
        category: 'general',
        source_type: 'manual',
      })
      if (error) throw new Error(`self_knowledge insert failed: ${error.message}`)
      break
    }

    case 'archives': {
      // Route to archive_context_items — find member's root folder
      const { error } = await supabase.from('studio_queue').insert({
        family_id: familyId,
        owner_id: memberId,
        destination: 'archives',
        content: result.extracted_text,
        source: 'mindsweep_auto',
        mindsweep_confidence: result.confidence === 'review_required' ? null : result.confidence,
        mindsweep_event_id: eventId || null,
      })
      if (error) throw new Error(`archives studio_queue insert failed: ${error.message}`)
      break
    }

    default:
      // Unknown destination — queue it
      await queueForReview(result, familyId, memberId, eventId)
  }
}

async function queueForReview(
  result: MindSweepSortResult,
  familyId: string,
  memberId: string,
  eventId: string | undefined,
) {
  // If cross-member detected with suggest_route, route to that member's queue
  const ownerId = (result.cross_member_action === 'suggest_route' && result.cross_member_id)
    ? result.cross_member_id
    : memberId

  const { error } = await supabase.from('studio_queue').insert({
    family_id: familyId,
    owner_id: ownerId,
    destination: result.destination,
    content: result.extracted_text,
    content_details: {
      ...result.destination_detail,
      mindsweep_category: result.category,
      sensitivity_reason: result.sensitivity_reason || null,
      cross_member: result.cross_member || null,
    },
    source: 'mindsweep_queued',
    source_reference_id: null,
    requester_id: ownerId !== memberId ? memberId : null,
    requester_note: ownerId !== memberId
      ? `From ${result.cross_member ? 'MindSweep' : 'auto-sort'}: ${result.extracted_text.substring(0, 80)}`
      : null,
    mindsweep_confidence: result.confidence === 'review_required' ? null : result.confidence,
    mindsweep_event_id: eventId || null,
  })
  if (error) throw new Error(`studio_queue insert failed (owner=${ownerId}): ${error.message}`)
}

// ── Record Approval Pattern (learning data for future recommendations) ──

export function useRecordApprovalPattern() {
  return useMutation({
    mutationFn: async (params: {
      familyId: string
      memberId: string
      contentCategory: string
      actionTaken: 'approved_unchanged' | 'approved_edited' | 'rerouted' | 'dismissed'
      suggestedDestination: string | null
      actualDestination: string | null
    }) => {
      const { error } = await supabase
        .from('mindsweep_approval_patterns')
        .insert({
          family_id: params.familyId,
          member_id: params.memberId,
          content_category: params.contentCategory,
          action_taken: params.actionTaken,
          suggested_destination: params.suggestedDestination,
          actual_destination: params.actualDestination,
        })
      if (error) throw error
    },
  })
}

// ── Delete Holding Item (with cache invalidation) ──

export function useDeleteHolding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; familyId: string; memberId: string }) => {
      const { error } = await supabase
        .from('mindsweep_holding')
        .delete()
        .eq('id', params.id)
      if (error) throw error
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({
        queryKey: ['mindsweep-holding', params.familyId, params.memberId],
      })
    },
  })
}

// ── Mark Holding Items Processed (with cache invalidation) ──

export function useMarkHoldingProcessed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { ids: string[]; familyId: string; memberId: string }) => {
      const { error } = await supabase
        .from('mindsweep_holding')
        .update({ processed_at: new Date().toISOString() })
        .in('id', params.ids)
      if (error) throw error
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({
        queryKey: ['mindsweep-holding', params.familyId, params.memberId],
      })
    },
  })
}

// ── Shared Sweep Runner ──
// Used by both NotepadDrawer and MindSweepCapture to avoid duplicating the orchestration.

/** Map holding-queue content_type → Edge Function input_type.
 *  Holding uses fine-grained types (voice_short, scan_extracted) but the
 *  Edge Function Zod schema expects coarse categories (voice, image, text). */
function mapContentTypeToInputType(contentType: string): SweepInputType {
  switch (contentType) {
    case 'voice_short':
    case 'voice_long':
      return 'voice'
    case 'scan_extracted':
      return 'image'
    case 'link':
      return 'link'
    case 'email':
      return 'email'
    case 'calendar_file':
      return 'text'
    default:
      return 'text'
  }
}

export function useRunSweep() {
  const triggerSweep = useTriggerSweep()
  const sweepStatus = useSweepStatus()
  const queryClient = useQueryClient()

  const run = useCallback(async (params: {
    items: { content: string; content_type: string }[]
    familyId: string
    memberId: string
    settings: MindSweepSettings | null
    sourceChannel: SweepEventSourceChannel
    familyMemberNames: FamilyMemberName[]
  }): Promise<{ autoRouted: number; queued: number; failed: number; errors: string[]; totalItems: number } | null> => {
    sweepStatus.startSweep()

    try {
      const aggressiveness: AggressivenessMode = params.settings?.aggressiveness || 'always_ask'

      const response = await triggerSweep.mutateAsync({
        items: params.items.map(i => ({
          content: i.content,
          content_type: i.content_type as MindSweepSortRequest['items'][0]['content_type'],
        })),
        familyId: params.familyId,
        memberId: params.memberId,
        settings: params.settings,
        sourceChannel: params.sourceChannel,
        inputType: params.items.length > 1 ? 'mixed' : mapContentTypeToInputType(params.items[0].content_type),
        familyMemberNames: params.familyMemberNames,
      })

      const routeResult = await routeSweepResults(
        response.results,
        aggressiveness,
        params.familyId,
        params.memberId,
        response.event_id,
      )

      // Invalidate badge + list caches now that writes are actually done.
      // useTriggerSweep.onSuccess only invalidates ['studio-queue'], but the
      // badge query uses key ['studio-queue-count'] and never refreshes
      // otherwise until the 30s refetch interval ticks. This is the only
      // place where we know routeSweepResults has actually finished writing.
      queryClient.invalidateQueries({ queryKey: ['studio-queue'] })
      queryClient.invalidateQueries({ queryKey: ['studio-queue-count'] })

      sweepStatus.completeSweep(routeResult)
      return { ...routeResult, totalItems: response.results.length }
    } catch {
      sweepStatus.errorSweep()
      return null
    }
  }, [triggerSweep, sweepStatus, queryClient])

  return { run, status: sweepStatus }
}

// ── Sweep Status ──

export type SweepStatus = 'idle' | 'processing' | 'complete' | 'error'

const AUTO_RESET_MS = 8000

export function useSweepStatus() {
  const [status, setStatus] = useState<SweepStatus>('idle')
  const [lastResult, setLastResult] = useState<{ autoRouted: number; queued: number; failed: number; errors: string[] } | null>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const clearResetTimer = useCallback(() => {
    if (resetTimer.current) {
      clearTimeout(resetTimer.current)
      resetTimer.current = undefined
    }
  }, [])

  const startSweep = useCallback(() => {
    clearResetTimer()
    setStatus('processing')
  }, [clearResetTimer])

  const completeSweep = useCallback((result: { autoRouted: number; queued: number; failed: number; errors: string[] }) => {
    setLastResult(result)
    setStatus('complete')
    clearResetTimer()
    resetTimer.current = setTimeout(() => {
      setStatus('idle')
      setLastResult(null)
    }, AUTO_RESET_MS)
  }, [clearResetTimer])

  const errorSweep = useCallback(() => {
    setStatus('error')
    clearResetTimer()
    resetTimer.current = setTimeout(() => {
      setStatus('idle')
      setLastResult(null)
    }, AUTO_RESET_MS)
  }, [clearResetTimer])

  const resetSweep = useCallback(() => {
    clearResetTimer()
    setStatus('idle')
    setLastResult(null)
  }, [clearResetTimer])

  return { status, lastResult, startSweep, completeSweep, errorSweep, resetSweep }
}

// ── Calendar Import ──

/**
 * Import parsed .ics events directly into studio_queue as calendar items.
 * These show up in the CalendarTab of the Review Queue for approval.
 */
export function useImportCalendarEvents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      events: Array<{
        title: string
        event_date: string
        start_time: string | null
        end_time: string | null
        end_date: string | null
        is_all_day: boolean
        location: string | null
        description: string | null
        recurrence_rule: string | null
        reminder_minutes: number | null
        ics_uid?: string | null
      }>
      familyId: string
      memberId: string
    }) => {
      const rows = params.events.map(event => ({
        family_id: params.familyId,
        owner_id: params.memberId,
        destination: 'calendar',
        content: event.title + (event.location ? ` at ${event.location}` : ''),
        content_details: {
          parsed_event: {
            title: event.title,
            event_date: event.event_date,
            start_time: event.start_time,
            end_time: event.end_time,
            end_date: event.end_date,
            is_all_day: event.is_all_day,
            location: event.location,
            description: event.description,
            recurrence_rule: event.recurrence_rule,
            reminder_minutes: event.reminder_minutes,
          },
          source_type: 'ics_import' as const,
          ics_uid: event.ics_uid || undefined,
        },
        source: 'mindsweep_auto',
        mindsweep_confidence: 'high',
      }))

      const { error } = await supabase.from('studio_queue').insert(rows)
      if (error) throw error
      return { count: rows.length }
    },
    onSuccess: () => {
      // useStudioQueueCount uses key ['studio-queue-count', familyId, destination].
      // The previous ['queue-badge'] / ['queue-badge-calendar'] keys are
      // ghosts — no query ever registered under them, so they invalidated
      // nothing. Fixed 2026-04-08 alongside the MindSweep cross-member bug.
      queryClient.invalidateQueries({ queryKey: ['studio-queue'] })
      queryClient.invalidateQueries({ queryKey: ['studio-queue-count'] })
    },
  })
}
