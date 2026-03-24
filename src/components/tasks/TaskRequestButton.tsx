/**
 * PRD-09A: Task Request — for teens and family members to send task requests to parents.
 * Creates a studio_queue item with source='member_request'.
 */

import { useState } from 'react'
import { Send, X, Loader2 } from 'lucide-react'
import { createTaskRequest } from '@/lib/routing/taskRouteHandler'
import { useFamilyMember } from '@/hooks/useFamilyMember'

interface TaskRequestButtonProps {
  /** Target parent member ID to receive the request */
  parentMemberId: string
  familyId: string
}

export function TaskRequestButton({ parentMemberId, familyId }: TaskRequestButtonProps) {
  const { data: member } = useFamilyMember()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSend() {
    if (!content.trim() || !member) return
    setSending(true)
    try {
      await createTaskRequest({
        content: content.trim(),
        note: note.trim() || undefined,
        familyId,
        requesterId: member.id,
        targetMemberId: parentMemberId,
      })
      setSent(true)
      setTimeout(() => {
        setOpen(false)
        setContent('')
        setNote('')
        setSent(false)
      }, 1500)
    } catch (err) {
      console.error('Failed to send task request:', err)
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          background: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
          color: 'var(--color-btn-primary-bg)',
          border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)',
        }}
      >
        <Send size={14} />
        Send Request
      </button>
    )
  }

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 4px 12px color-mix(in srgb, var(--color-text-primary) 8%, transparent)',
      }}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          Send Task Request
        </h4>
        <button onClick={() => setOpen(false)} className="p-1">
          <X size={16} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>

      <input
        type="text"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What do you need? (e.g., Pick up poster board)"
        className="w-full px-3 py-2 rounded-lg text-sm"
        style={{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
        autoFocus
      />

      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        rows={2}
        className="w-full px-3 py-2 rounded-lg text-sm resize-none"
        style={{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
      />

      <button
        onClick={handleSend}
        disabled={!content.trim() || sending}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        style={{
          background: sent ? 'var(--color-success, #4a9)' : 'var(--color-btn-primary-bg)',
          color: 'var(--color-btn-primary-text)',
        }}
      >
        {sent ? (
          'Sent!'
        ) : sending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send size={14} />
            Send Request
          </>
        )}
      </button>
    </div>
  )
}
