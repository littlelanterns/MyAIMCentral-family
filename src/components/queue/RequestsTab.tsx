/**
 * RequestsTab (PRD-15 Screen 8)
 *
 * Tab inside UniversalQueueModal for processing family requests.
 * Accept routes to Calendar/Tasks/List/Acknowledge.
 * Decline with optional note. Discuss opens chat (Phase D stub).
 * Snooze with resurface. "Open Messages" shortcut at bottom.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState, useCallback } from 'react'
import { HandHelping, MessageCircle } from 'lucide-react'
import { EmptyState } from '@/components/shared'
import { RequestCard } from '@/components/requests/RequestCard'
import { useRequests, useAcceptRequest, useDeclineRequest, useSnoozeRequest } from '@/hooks/useRequests'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useRoutingToast } from '@/components/shared'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import type { FamilyRequestWithSender, RequestRoutedTo } from '@/types/messaging'

import { EventCreationModal } from '@/components/calendar/EventCreationModal'
import { ListPickerModal } from '@/components/queue/ListPickerModal'
import type { StudioQueueRecord } from '@/components/queue/QueueCard'

export function RequestsTab() {
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const { data: requests, isLoading } = useRequests(currentFamily?.id, currentMember?.id)

  const acceptRequest = useAcceptRequest()
  const declineRequest = useDeclineRequest()
  const snoozeRequest = useSnoozeRequest()
  const routingToast = useRoutingToast()
  const queryClient = useQueryClient()

  // Modals for accept routing
  const [eventModalRequest, setEventModalRequest] = useState<FamilyRequestWithSender | null>(null)
  const [listModalRequest, setListModalRequest] = useState<FamilyRequestWithSender | null>(null)

  const handleAccept = useCallback(async (request: FamilyRequestWithSender, routedTo: RequestRoutedTo) => {
    if (!currentMember?.id || !currentFamily?.id) return

    switch (routedTo) {
      case 'calendar': {
        // Open EventCreationModal — user fills in date/time, saves creates event
        setEventModalRequest(request)
        return
      }
      case 'tasks': {
        // Create studio_queue item with request content
        const { data, error } = await supabase
          .from('studio_queue')
          .insert({
            family_id: currentFamily.id,
            owner_id: currentMember.id,
            destination: 'task',
            content: request.title,
            content_details: request.details ? { details: request.details, when: request.when_text } : null,
            source: 'member_request',
            source_reference_id: request.id,
            requester_id: request.sender_member_id,
            requester_note: request.details,
          })
          .select('id')
          .single()

        if (error) {
          console.error('[RequestsTab] Failed to create task queue item:', error)
          return
        }

        await acceptRequest.mutateAsync({
          request,
          routedTo: 'tasks',
          routedReferenceId: data.id,
          processedBy: currentMember.id,
          processorName: currentMember.display_name,
        })
        queryClient.invalidateQueries({ queryKey: ['queue-badge-sort'] })
        routingToast.show({ message: `Request accepted → Tasks queue` })
        return
      }
      case 'list': {
        setListModalRequest(request)
        return
      }
      case 'acknowledged': {
        await acceptRequest.mutateAsync({
          request,
          routedTo: 'acknowledged',
          processedBy: currentMember.id,
          processorName: currentMember.display_name,
        })
        routingToast.show({ message: `Request acknowledged` })
        return
      }
    }
  }, [currentMember, currentFamily, acceptRequest, queryClient, routingToast])

  const handleDecline = useCallback(async (request: FamilyRequestWithSender, note?: string) => {
    if (!currentMember?.id) return
    await declineRequest.mutateAsync({
      request,
      declineNote: note,
      processedBy: currentMember.id,
      processorName: currentMember.display_name,
    })
    routingToast.show({ message: `Request declined` })
  }, [currentMember, declineRequest, routingToast])

  const handleSnooze = useCallback(async (request: FamilyRequestWithSender) => {
    await snoozeRequest.mutateAsync({ requestId: request.id })
    routingToast.show({ message: `Request snoozed for 4 hours` })
  }, [snoozeRequest, routingToast])

  const handleDiscuss = useCallback((_request: FamilyRequestWithSender) => {
    // STUB: Phase D creates a conversation thread titled "Regarding: {request.title}"
    // and navigates to that thread. For now, navigate to messages page.
    window.location.href = '/messages'
  }, [])

  // Calendar event created from request accept
  const handleEventCreated = useCallback(async () => {
    if (!eventModalRequest || !currentMember?.id) return
    // The event was just created by EventCreationModal.
    // We mark the request as accepted → calendar
    await acceptRequest.mutateAsync({
      request: eventModalRequest,
      routedTo: 'calendar',
      processedBy: currentMember.id,
      processorName: currentMember.display_name,
    })
    setEventModalRequest(null)
    routingToast.show({ message: `Request accepted → Calendar` })
  }, [eventModalRequest, currentMember, acceptRequest, routingToast])

  // List item added from request accept
  const handleListComplete = useCallback(async (listId: string, listTitle: string) => {
    if (!listModalRequest || !currentMember?.id) return
    await acceptRequest.mutateAsync({
      request: listModalRequest,
      routedTo: 'list',
      routedReferenceId: listId,
      processedBy: currentMember.id,
      processorName: currentMember.display_name,
    })
    setListModalRequest(null)
    routingToast.show({ message: `Request accepted → ${listTitle}` })
  }, [listModalRequest, currentMember, acceptRequest, routingToast])

  if (isLoading) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading requests...
      </div>
    )
  }

  const pendingRequests = requests ?? []

  // Build a compatible StudioQueueRecord for ListPickerModal
  const listPickerItems: StudioQueueRecord[] = listModalRequest ? [{
    id: listModalRequest.id,
    family_id: listModalRequest.family_id,
    owner_id: listModalRequest.recipient_member_id,
    destination: 'list',
    content: listModalRequest.title,
    content_details: listModalRequest.details ? { details: listModalRequest.details } : null,
    source: 'member_request',
    source_reference_id: listModalRequest.id,
    batch_id: null,
    requester_id: listModalRequest.sender_member_id,
    requester_note: listModalRequest.details,
    mindsweep_confidence: null,
    mindsweep_event_id: null,
    created_at: listModalRequest.created_at,
  }] : []

  return (
    <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {pendingRequests.length === 0 ? (
        <div style={{ padding: '1.25rem 0' }}>
          <EmptyState
            icon={<HandHelping size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />}
            title="No requests waiting."
            description="When your family sends you requests, they'll appear here."
          />
        </div>
      ) : (
        pendingRequests.map(request => (
          <RequestCard
            key={request.id}
            request={request}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onSnooze={handleSnooze}
            onDiscuss={handleDiscuss}
          />
        ))
      )}

      {/* "Open Messages" shortcut at bottom — per PRD-15 Screen 8 */}
      <button
        onClick={() => { window.location.href = '/messages' }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.375rem',
          width: '100%',
          padding: '0.5rem',
          borderRadius: 'var(--vibe-radius-input, 8px)',
          border: '1px dashed var(--color-border)',
          background: 'transparent',
          color: 'var(--color-text-secondary)',
          fontSize: '0.8125rem',
          cursor: 'pointer',
          marginTop: '0.25rem',
        }}
      >
        <MessageCircle size={15} /> Open Messages
      </button>

      {/* EventCreationModal for Calendar accept routing — pre-fill title + notes */}
      {eventModalRequest && (
        <EventCreationModal
          isOpen={true}
          onClose={() => setEventModalRequest(null)}
          prefillTitle={eventModalRequest.title}
          prefillNotes={[eventModalRequest.when_text, eventModalRequest.details].filter(Boolean).join(' — ')}
          onCreated={handleEventCreated}
        />
      )}

      {/* ListPickerModal for List accept routing */}
      {listModalRequest && (
        <ListPickerModal
          isOpen={true}
          onClose={() => setListModalRequest(null)}
          items={listPickerItems}
          onComplete={handleListComplete}
        />
      )}
    </div>
  )
}
