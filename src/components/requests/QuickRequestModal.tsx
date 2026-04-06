/**
 * QuickRequestModal (PRD-15 Screen 7)
 *
 * Transient modal for sending a request to a family member.
 * Accessible from: QuickCreate FAB, Notepad "Send as Request" routing.
 * Pre-fillable with notepad content (title + details).
 * Zero hardcoded colors — all CSS custom properties.
 */

import { useState, useCallback, useEffect } from 'react'
import { HandHelping } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import MemberPillSelector, { type MemberPillItem } from '@/components/shared/MemberPillSelector'
import { useCreateRequest } from '@/hooks/useRequests'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'

interface QuickRequestModalProps {
  isOpen: boolean
  onClose: () => void
  /** Pre-fill title from notepad content */
  prefillTitle?: string
  /** Pre-fill details from notepad content */
  prefillDetails?: string
  /** Source tracking for notepad routing */
  source?: 'quick_request' | 'notepad_route'
  sourceReferenceId?: string
}

export function QuickRequestModal({
  isOpen,
  onClose,
  prefillTitle = '',
  prefillDetails = '',
  source = 'quick_request',
  sourceReferenceId,
}: QuickRequestModalProps) {
  const [title, setTitle] = useState(prefillTitle)
  const [recipientId, setRecipientId] = useState('')
  const [whenText, setWhenText] = useState('')
  const [details, setDetails] = useState(prefillDetails)

  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const { data: allMembers } = useFamilyMembers(currentFamily?.id)
  const createRequest = useCreateRequest()

  // Reset form when opening with new prefills
  useEffect(() => {
    if (isOpen) {
      setTitle(prefillTitle)
      setDetails(prefillDetails)
      setRecipientId('')
      setWhenText('')
    }
  }, [isOpen, prefillTitle, prefillDetails])

  // Filter out current member and inactive members
  const eligibleRecipients: MemberPillItem[] = (allMembers ?? [])
    .filter(m => m.id !== currentMember?.id && m.is_active)
    .map(m => ({
      id: m.id,
      display_name: m.display_name,
      assigned_color: m.assigned_color ?? null,
      calendar_color: m.calendar_color ?? null,
      member_color: m.member_color ?? null,
    }))

  const handleToggleRecipient = useCallback((memberId: string) => {
    // Single selection — toggle or replace
    setRecipientId(prev => prev === memberId ? '' : memberId)
  }, [])

  const canSend = title.trim().length > 0 && recipientId.length > 0

  const handleSend = useCallback(async () => {
    if (!canSend || !currentFamily?.id || !currentMember?.id) return

    await createRequest.mutateAsync({
      familyId: currentFamily.id,
      senderId: currentMember.id,
      senderName: currentMember.display_name,
      data: {
        title: title.trim(),
        recipient_member_id: recipientId,
        details: details.trim() || undefined,
        when_text: whenText.trim() || undefined,
        source,
        source_reference_id: sourceReferenceId,
      },
    })

    onClose()
  }, [canSend, currentFamily?.id, currentMember, title, recipientId, details, whenText, source, sourceReferenceId, createRequest, onClose])

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    borderRadius: 'var(--vibe-radius-input, 8px)',
    border: '1px solid var(--color-border, #ddd)',
    background: 'var(--color-bg-input, var(--color-bg-card))',
    color: 'var(--color-text-primary)',
    fontSize: '0.9375rem',
    lineHeight: '1.4',
    outline: 'none',
  }

  return (
    <ModalV2
      id="quick-request-modal"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="sm"
      title="New Request"
      icon={HandHelping}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend || createRequest.isPending}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: 'none',
              background: canSend
                ? 'var(--surface-primary, var(--color-btn-primary-bg))'
                : 'var(--color-bg-secondary)',
              color: canSend
                ? 'var(--color-text-on-primary, #fff)'
                : 'var(--color-text-secondary)',
              cursor: canSend ? 'pointer' : 'not-allowed',
              opacity: createRequest.isPending ? 0.7 : 1,
              fontWeight: 600,
            }}
          >
            {createRequest.isPending ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
        {/* Title */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            What are you requesting?
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Can I go to Tyler's house Friday?"
            style={inputStyle}
            autoFocus
          />
        </div>

        {/* Recipient */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            Who is this for?
          </label>
          <MemberPillSelector
            members={eligibleRecipients}
            selectedIds={recipientId ? [recipientId] : []}
            onToggle={handleToggleRecipient}
          />
        </div>

        {/* When (optional) */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            When? <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span>
          </label>
          <input
            type="text"
            value={whenText}
            onChange={(e) => setWhenText(e.target.value)}
            placeholder="Friday after practice"
            style={inputStyle}
          />
        </div>

        {/* Details (optional) */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            Details <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span>
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="His mom can pick us up and drop me off by 8pm"
            rows={3}
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: '4rem',
            }}
          />
        </div>
      </div>
    </ModalV2>
  )
}
