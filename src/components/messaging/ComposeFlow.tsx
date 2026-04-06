/**
 * ComposeFlow — PRD-15 Screen 5
 *
 * Modal for composing a new message.
 * Member picker filtered by messaging permissions.
 * Single recipient → direct space. Multiple → individual/group/new group.
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Send, Loader2 } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useMessagingPermissions } from '@/hooks/useMessagingPermissions'
import { useCreateSpace, findOrCreateDirectSpace } from '@/hooks/useConversationSpaces'
import { useCreateThread } from '@/hooks/useConversationThreads'
import type { SpaceType } from '@/types/messaging'

interface ComposeFlowProps {
  isOpen: boolean
  onClose: () => void
  prefillContent?: string
}

type SendMode = 'individual' | 'group' | 'new_group'

export function ComposeFlow({ isOpen, onClose, prefillContent }: ComposeFlowProps) {
  const navigate = useNavigate()
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const { data: permitted } = useMessagingPermissions()
  const createSpace = useCreateSpace()
  const createThread = useCreateThread()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState(prefillContent ?? '')
  const [sendMode, setSendMode] = useState<SendMode>('individual')
  const [groupName, setGroupName] = useState('')
  const [sending, setSending] = useState(false)

  const memberId = currentMember?.id
  const familyId = currentFamily?.id

  const toggleMember = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSend = useCallback(async () => {
    if (!memberId || !familyId || !message.trim() || selectedIds.size === 0) return
    setSending(true)

    try {
      const ids = [...selectedIds]

      if (ids.length === 1) {
        // Single recipient → find or create direct space, then create thread
        const space = await findOrCreateDirectSpace(familyId, memberId, ids[0])
        const thread = await createThread.mutateAsync({
          space_id: space.id,
          content: message.trim(),
        })
        onClose()
        navigate(`/messages/thread/${thread.id}`)
        return
      }

      // Multiple recipients
      if (sendMode === 'individual') {
        // Send same message as separate threads in each direct space
        for (const otherId of ids) {
          const space = await findOrCreateDirectSpace(familyId, memberId, otherId)
          await createThread.mutateAsync({
            space_id: space.id,
            content: message.trim(),
          })
        }
        onClose()
        navigate('/messages')
      } else if (sendMode === 'group' || sendMode === 'new_group') {
        // Create a group space (or use existing one — for now always create new)
        const space = await createSpace.mutateAsync({
          family_id: familyId,
          space_type: 'group' as SpaceType,
          name: groupName.trim() || `Group (${ids.length + 1})`,
          member_ids: [memberId, ...ids],
        })
        const thread = await createThread.mutateAsync({
          space_id: space.id,
          content: message.trim(),
        })
        onClose()
        navigate(`/messages/thread/${thread.id}`)
      }
    } catch (err) {
      console.error('[ComposeFlow] Send error:', err)
    } finally {
      setSending(false)
    }
  }, [memberId, familyId, message, selectedIds, sendMode, groupName, createThread, createSpace, onClose, navigate])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 80%, transparent)',
        paddingTop: '5vh',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        data-testid="compose-flow-modal"
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '85vh',
          backgroundColor: 'var(--color-bg-primary)',
          borderRadius: 'var(--vibe-radius-card, 12px)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px color-mix(in srgb, var(--color-text-primary) 15%, transparent)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            New Message
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: '0.25rem' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Recipient picker */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            To:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {(permitted ?? []).map(contact => {
              const selected = selectedIds.has(contact.memberId)
              return (
                <button
                  key={contact.memberId}
                  onClick={() => toggleMember(contact.memberId)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: 999,
                    border: selected ? 'none' : `1.5px solid ${contact.assignedColor ?? 'var(--color-border)'}`,
                    backgroundColor: selected ? (contact.assignedColor ?? 'var(--color-btn-primary-bg)') : 'transparent',
                    color: selected ? '#fff' : 'var(--color-text-primary)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  {contact.displayName}
                </button>
              )
            })}
          </div>
        </div>

        {/* Send mode (when 2+ selected) */}
        {selectedIds.size >= 2 && (
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              Send as:
            </p>
            {([
              ['individual', 'Individual messages'] as const,
              ['new_group', 'Group message'] as const,
            ]).map(([mode, label]) => (
              <label
                key={mode}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}
              >
                <input
                  type="radio"
                  name="sendMode"
                  checked={sendMode === mode}
                  onChange={() => setSendMode(mode)}
                  style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                />
                {label}
              </label>
            ))}

            {sendMode === 'new_group' && (
              <input
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Group name..."
                style={{
                  marginTop: '0.25rem',
                  padding: '0.375rem 0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--vibe-radius-input, 6px)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
              />
            )}
          </div>
        )}

        {/* Message */}
        <div style={{ flex: 1, padding: '0.75rem 1rem', minHeight: 120 }}>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message..."
            style={{
              width: '100%',
              height: '100%',
              minHeight: 100,
              resize: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-primary)',
              backgroundColor: 'var(--color-bg-secondary)',
              fontFamily: 'inherit',
              lineHeight: '1.4',
            }}
          />
        </div>

        {/* Send */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSend}
            disabled={sending || !message.trim() || selectedIds.size === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: 'none',
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-text-on-primary, #fff)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: (message.trim() && selectedIds.size > 0) ? 'pointer' : 'default',
              opacity: (message.trim() && selectedIds.size > 0) ? 1 : 0.5,
            }}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
