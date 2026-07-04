/**
 * RequestsTab (PRD-15 Screen 8 + KIDS-REWARDS-PAGE Slice 4)
 *
 * Tab inside UniversalQueueModal for processing family requests.
 * Accept routes to Calendar/Tasks/List/Acknowledge.
 * Decline with optional note. Discuss opens chat (Phase D stub).
 * Snooze with resurface. "Open Messages" shortcut at bottom.
 *
 * KIDS-REWARDS-PAGE Slice 4 (gate §5, R3): kids' reward proposals render here
 * too — one decision inbox (Convention #66). Approve opens the matching
 * EXISTING creation flow prefilled (task / streak tracker / routine) — never
 * silent auto-create; Counter sends revised terms back (ONE round); Decline
 * with optional note. Proposals are primary-parent-only (RLS-scoped).
 *
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState, useCallback } from 'react'
import { HandHelping, MessageCircle, Repeat2 } from 'lucide-react'
import { EmptyState, ModalV2 } from '@/components/shared'
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

import { ProposalCard } from './ProposalCard'
import { ProposalArtifactCreator } from '@/components/rewards/ProposalArtifactCreator'
import { ProposalTermsForm, isProposalTermsComplete } from '@/components/rewards/ProposalTermsForm'
import {
  usePendingProposalsForParent,
  useAcceptRewardProposal,
  useCounterRewardProposal,
  useDeclineRewardProposal,
} from '@/hooks/useRewardProposals'
import { activeProposalTerms } from '@/types/rewardProposals'
import type {
  ProposalArtifactType,
  ProposalTerms,
  RewardProposalWithProposer,
} from '@/types/rewardProposals'

export function RequestsTab() {
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const { data: requests, isLoading } = useRequests(currentFamily?.id, currentMember?.id)

  const acceptRequest = useAcceptRequest()
  const declineRequest = useDeclineRequest()
  const snoozeRequest = useSnoozeRequest()
  const routingToast = useRoutingToast()
  const queryClient = useQueryClient()

  // KIDS-REWARDS-PAGE Slice 4: kid reward proposals — mom's decision inbox.
  // RLS scopes visibility; the enabled flag keeps non-mom viewers query-free.
  const isPrimaryParent = currentMember?.role === 'primary_parent'
  const { data: proposals = [] } = usePendingProposalsForParent(
    currentFamily?.id,
    isPrimaryParent,
  )
  const acceptProposal = useAcceptRewardProposal()
  const counterProposal = useCounterRewardProposal()
  const declineProposal = useDeclineRewardProposal()

  // Proposal processing state
  const [approvingProposal, setApprovingProposal] = useState<RewardProposalWithProposer | null>(null)
  const [counteringProposal, setCounteringProposal] = useState<RewardProposalWithProposer | null>(null)
  const [counterTerms, setCounterTerms] = useState<ProposalTerms | null>(null)
  const [counterNote, setCounterNote] = useState('')

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

  const handleDiscuss = useCallback(async (request: FamilyRequestWithSender) => {
    if (!currentMember?.id || !currentFamily?.id) return

    try {
      // Find or create a direct space with the request sender
      const { findOrCreateDirectSpace } = await import('@/hooks/useConversationSpaces')
      const space = await findOrCreateDirectSpace(
        currentFamily.id,
        currentMember.id,
        request.sender_member_id,
      )

      // Create a thread titled "Regarding: {request.title}"
      const { data: thread, error: thErr } = await supabase
        .from('conversation_threads')
        .insert({
          space_id: space.id,
          title: `Regarding: ${request.title}`,
          started_by: currentMember.id,
          source_type: 'request_discussion',
          source_reference_id: request.id,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (thErr) throw thErr

      // Update the request with the discussion thread id
      await supabase
        .from('family_requests')
        .update({ discussion_thread_id: thread.id })
        .eq('id', request.id)

      // Navigate to the thread
      window.location.href = `/messages/thread/${thread.id}`
    } catch (err) {
      console.error('[RequestsTab] Failed to create discussion thread:', err)
      window.location.href = '/messages'
    }
  }, [currentMember, currentFamily])

  // ── KIDS-REWARDS-PAGE Slice 4: proposal processing ─────────────────

  // Approve / Set-it-up → prefill-confirm (gate §5): the ProposalArtifactCreator
  // opens the matching EXISTING creation flow; the proposal is only stamped
  // 'accepted' after mom actually saves the artifact.
  const handleProposalArtifactCreated = useCallback(
    async (artifactType: ProposalArtifactType, artifactId: string | null) => {
      if (!approvingProposal || !currentMember?.id) return
      await acceptProposal.mutateAsync({
        proposal: approvingProposal,
        processedBy: currentMember.id,
        processorName: currentMember.display_name,
        artifactType,
        artifactId,
      })
      routingToast.show({
        message: `Deal! "${activeProposalTerms(approvingProposal).want_text}" is set up`,
      })
    },
    [approvingProposal, currentMember, acceptProposal, routingToast],
  )

  const handleProposalCounterOpen = useCallback((proposal: RewardProposalWithProposer) => {
    setCounteringProposal(proposal)
    setCounterTerms({ ...proposal.terms })
    setCounterNote('')
  }, [])

  const handleProposalCounterSend = useCallback(async () => {
    if (!counteringProposal || !counterTerms || !currentMember?.id) return
    await counterProposal.mutateAsync({
      proposal: counteringProposal,
      counterTerms: {
        ...counterTerms,
        want_text: counterTerms.want_text.trim(),
        will_text: counterTerms.will_text.trim(),
        params: {
          ...counterTerms.params,
          items: counterTerms.params.items?.map(i => i.trim()).filter(Boolean),
        },
      },
      counterNote,
      processedBy: currentMember.id,
      processorName: currentMember.display_name,
    })
    setCounteringProposal(null)
    setCounterTerms(null)
    routingToast.show({ message: 'Counteroffer sent' })
  }, [counteringProposal, counterTerms, counterNote, currentMember, counterProposal, routingToast])

  const handleProposalDecline = useCallback(
    async (proposal: RewardProposalWithProposer, note?: string) => {
      if (!currentMember?.id) return
      await declineProposal.mutateAsync({
        proposal,
        declineNote: note,
        processedBy: currentMember.id,
        processorName: currentMember.display_name,
      })
      routingToast.show({ message: 'Proposal declined' })
    },
    [currentMember, declineProposal, routingToast],
  )

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
      {pendingRequests.length === 0 && proposals.length === 0 ? (
        <div style={{ padding: '1.25rem 0' }}>
          <EmptyState
            icon={<HandHelping size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />}
            title="No requests waiting."
            description="When your family sends you requests, they'll appear here."
          />
        </div>
      ) : (
        <>
          {/* KIDS-REWARDS-PAGE Slice 4: kid reward proposals (mom only) */}
          {proposals.map(proposal => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onApprove={setApprovingProposal}
              onCounter={handleProposalCounterOpen}
              onDecline={handleProposalDecline}
            />
          ))}

          {pendingRequests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onSnooze={handleSnooze}
              onDiscuss={handleDiscuss}
            />
          ))}
        </>
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

      {/* KIDS-REWARDS-PAGE Slice 4: Approve → prefill-confirm into the matching
          creation flow. counter_accepted rows set up from the COUNTER terms
          (mom's counter replaced the terms — gate §5). Kid deals default
          require_approval ON so the prize fires at mom's approval (Q7 timing);
          she can uncheck it in the modal. */}
      {approvingProposal && currentMember?.id && currentFamily?.id && (
        <ProposalArtifactCreator
          terms={activeProposalTerms(approvingProposal)}
          familyId={currentFamily.id}
          assigneeId={approvingProposal.proposer_member_id}
          creatorId={currentMember.id}
          proposalId={approvingProposal.id}
          requireApprovalDefault={true}
          onCreated={handleProposalArtifactCreated}
          onClose={() => setApprovingProposal(null)}
        />
      )}

      {/* Counteroffer editor — mom edits the kid's terms and sends them back.
          ONE round (gate §5). */}
      {counteringProposal && counterTerms && currentFamily?.id && (
        <ModalV2
          id="proposal-counter-modal"
          isOpen={true}
          onClose={() => {
            setCounteringProposal(null)
            setCounterTerms(null)
          }}
          type="transient"
          size="md"
          title={`Counteroffer for ${counteringProposal.proposer_display_name ?? 'them'}`}
          icon={Repeat2}
          footer={
            <button
              type="button"
              data-testid="proposal-counter-send"
              onClick={handleProposalCounterSend}
              disabled={!isProposalTermsComplete(counterTerms) || counterProposal.isPending}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                minHeight: '44px',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                border: 'none',
                background: 'var(--surface-primary)',
                color: 'var(--color-text-on-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 700,
                cursor: 'pointer',
                opacity:
                  !isProposalTermsComplete(counterTerms) || counterProposal.isPending ? 0.5 : 1,
              }}
            >
              {counterProposal.isPending ? 'Sending...' : 'Send counteroffer'}
            </button>
          }
        >
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}
            >
              Adjust the deal — they'll get to accept or decline your version.
            </p>
            <ProposalTermsForm
              value={counterTerms}
              onChange={setCounterTerms}
              familyId={currentFamily.id}
              audience="kid"
            />
            <div>
              <label
                htmlFor="proposal-counter-note"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.375rem',
                }}
              >
                A note with your counter (optional)
              </label>
              <textarea
                id="proposal-counter-note"
                data-testid="proposal-counter-note"
                rows={2}
                value={counterNote}
                onChange={e => setCounterNote(e.target.value)}
                placeholder="Love this idea — let's make it a full week!"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        </ModalV2>
      )}
    </div>
  )
}
