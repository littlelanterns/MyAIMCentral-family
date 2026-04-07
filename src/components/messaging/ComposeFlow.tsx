/**
 * ComposeFlow — PRD-15 Screen 5
 *
 * Modal for composing a new message.
 * Member picker filtered by messaging permissions.
 * Single recipient → direct space. Multiple → individual/group/new group.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Send, Loader2, UsersRound } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useMessagingPermissions } from '@/hooks/useMessagingPermissions'
import { useCreateSpace, useConversationSpaces, findOrCreateDirectSpace } from '@/hooks/useConversationSpaces'
import { useCreateThread } from '@/hooks/useConversationThreads'
import type { SpaceType } from '@/types/messaging'

interface ComposeFlowProps {
  isOpen: boolean
  onClose: () => void
  prefillContent?: string
  /** When set, pre-selects the send mode and adapts the modal title.
   *  Use 'new_group' to open the modal as a "New Group" creation flow. */
  initialSendMode?: SendMode
}

type SendMode = 'individual' | 'group' | 'new_group'

export function ComposeFlow({ isOpen, onClose, prefillContent, initialSendMode }: ComposeFlowProps) {
  const navigate = useNavigate()
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const { data: permitted } = useMessagingPermissions()
  const { data: spaces } = useConversationSpaces()
  const createSpace = useCreateSpace()
  const createThread = useCreateThread()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState(prefillContent ?? '')
  const [sendMode, setSendMode] = useState<SendMode>(initialSendMode ?? 'individual')
  const [groupName, setGroupName] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const groupNameRef = useRef<HTMLInputElement>(null)

  const isGroupCreationMode = initialSendMode === 'new_group'

  // Existing groups the user belongs to — hidden when opened as "New Group"
  const existingGroups = useMemo(
    () => (spaces ?? []).filter(s => s.space_type === 'group'),
    [spaces],
  )
  const selectedGroup = useMemo(
    () => existingGroups.find(g => g.id === selectedGroupId) ?? null,
    [existingGroups, selectedGroupId],
  )

  // Auto-focus the group name field when the radio reveals it in group-creation mode
  useEffect(() => {
    if (isGroupCreationMode && selectedIds.size >= 2 && sendMode === 'new_group') {
      groupNameRef.current?.focus()
    }
  }, [isGroupCreationMode, selectedIds.size, sendMode])

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
    if (!memberId || !familyId || !message.trim()) return
    // Valid send states: either a group is selected, or at least one recipient is picked
    if (!selectedGroupId && selectedIds.size === 0) return
    setSending(true)

    try {
      // Send to existing group — create a new thread in the selected group space
      if (selectedGroupId) {
        const thread = await createThread.mutateAsync({
          space_id: selectedGroupId,
          content: message.trim(),
        })
        onClose()
        navigate(`/messages/thread/${thread.id}`)
        return
      }

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
  }, [memberId, familyId, message, selectedIds, selectedGroupId, sendMode, groupName, createThread, createSpace, onClose, navigate])

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
            {isGroupCreationMode ? 'New Group' : 'New Message'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: '0.25rem' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Helper text for group creation mode */}
        {isGroupCreationMode && (
          <div style={{ padding: '0.625rem 1rem', backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, transparent)', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Pick the people you want in this group, then name it and send the first message.
            </p>
          </div>
        )}

        {/* Existing groups — shown in normal compose only (not "New Group" mode) */}
        {!isGroupCreationMode && existingGroups.length > 0 && (
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Send to a group
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {existingGroups.map(g => {
                const selected = selectedGroupId === g.id
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      if (selected) {
                        setSelectedGroupId(null)
                      } else {
                        setSelectedGroupId(g.id)
                        setSelectedIds(new Set()) // clear individual picks when a group is chosen
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.375rem 0.75rem',
                      borderRadius: 999,
                      border: selected ? 'none' : '1.5px solid var(--color-border)',
                      backgroundColor: selected ? 'var(--color-btn-primary-bg)' : 'transparent',
                      color: selected ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-primary)',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    <UsersRound size={13} />
                    {g.name ?? 'Untitled group'}
                    {(g.members?.length ?? 0) > 0 && (
                      <span style={{ opacity: 0.7, fontSize: '0.6875rem' }}>
                        · {g.members?.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedGroup && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                Sending to <strong>{selectedGroup.name}</strong> — the "To" picker is disabled.
              </p>
            )}
          </div>
        )}

        {/* Recipient picker — hidden when an existing group is selected */}
        {!selectedGroupId && (
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {isGroupCreationMode ? 'Members:' : 'To:'}
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
        )}

        {/* Send mode (when 2+ selected and no existing group picked) */}
        {selectedIds.size >= 2 && !selectedGroupId && (
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
                ref={groupNameRef}
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
          {(() => {
            const hasRecipients = selectedGroupId !== null || selectedIds.size > 0
            const canSend = !sending && message.trim().length > 0 && hasRecipients
            return (
              <button
                onClick={handleSend}
                disabled={!canSend}
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
                  cursor: canSend ? 'pointer' : 'default',
                  opacity: canSend ? 1 : 0.5,
                }}
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send
              </button>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
