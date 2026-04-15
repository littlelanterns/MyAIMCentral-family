import { useState } from 'react'
import { Copy, FileEdit, ArrowRightLeft, ListTodo, Trophy, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Tooltip } from '@/components/shared'
import { LilaAvatar } from './LilaAvatar'
import { HumanInTheMix } from '@/components/HumanInTheMix'
import { useNotepadContextSafe } from '@/components/notepad'
import type { LilaMessage } from '@/hooks/useLila'

/**
 * Message Bubble — PRD-05
 * Renders a single message in the conversation.
 * User messages right-aligned, LiLa left-aligned with avatar.
 * Assistant messages show action chips: Copy, Edit in Notepad, Review & Route, etc.
 * The most recent assistant message shows HumanInTheMix controls.
 */

interface LilaMessageBubbleProps {
  message: LilaMessage
  avatarKey?: string
  isLatestAssistant?: boolean
  isStreaming?: boolean
  /** When true, hide HumanInTheMix (Edit/Approve/Regenerate/Reject) — used for
   *  conversational modes (help/assist/general) where HITM is confusing. */
  hideHumanInTheMix?: boolean
  onRegenerate?: () => void
  onReject?: () => void
}

export function LilaMessageBubble({
  message,
  avatarKey = 'sitting',
  isLatestAssistant = false,
  isStreaming = false,
  hideHumanInTheMix = false,
  onRegenerate,
  onReject,
}: LilaMessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const isAssistant = message.role === 'assistant'
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  // Safe notepad context access (may not be available in all shells —
  // returns null when used outside a NotepadProvider tree).
  const notepad = useNotepadContextSafe()

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar for assistant messages */}
      {isAssistant && (
        <div className="mt-1 shrink-0">
          <LilaAvatar avatarKey={avatarKey} size={24} className="" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? '' : 'flex-1'}`}>
        {/* Message content */}
        <div
          className="px-3.5 py-2.5 text-sm leading-relaxed"
          style={{
            backgroundColor: isUser
              ? 'var(--color-btn-primary-bg)'
              : isSystem
                ? 'var(--color-bg-secondary)'
                : 'var(--color-bg-card, #fff)',
            color: isUser
              ? 'var(--color-btn-primary-text)'
              : 'var(--color-text-primary)',
            border: isUser ? 'none' : '1px solid var(--color-border)',
            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            boxShadow: isUser ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* Streaming indicator */}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse" style={{ backgroundColor: 'var(--color-text-secondary)' }} />
          )}
        </div>

        {/* Action chips for assistant messages */}
        {isAssistant && !isStreaming && (
          <div className="flex flex-wrap items-center gap-1 mt-1">
            <ActionChip
              icon={copied ? Check : Copy}
              label={copied ? 'Copied' : 'Copy'}
              onClick={handleCopy}
            />
            <ActionChip
              icon={FileEdit}
              label="Edit in Notepad"
              onClick={() => {
                notepad?.openNotepad({
                  content: message.content,
                  sourceType: 'edit_in_notepad',
                  sourceReferenceId: (message as any).conversation_id,
                })
              }}
              disabled={!notepad}
              title="Open in Smart Notepad for editing"
            />
            <ActionChip
              icon={ArrowRightLeft}
              label="Review & Route"
              onClick={() => {
                notepad?.openNotepad({
                  content: message.content,
                  sourceType: 'edit_in_notepad',
                  sourceReferenceId: (message as any).conversation_id,
                })
                // Brief delay to let the tab create, then switch to review-route view
                setTimeout(() => notepad?.setView('review-route'), 300)
              }}
              disabled={!notepad}
              title="Extract items and route to features"
            />
            <ActionChip
              icon={ListTodo}
              label="Create Task"
              onClick={() => {/* STUB: wires to PRD-09A */}}
              disabled
              title="Coming soon — wires to Tasks"
            />
            <ActionChip
              icon={Trophy}
              label="Record Victory"
              onClick={() => {
                // Extract a concise description from the assistant message (first 200 chars)
                const desc = message.content.slice(0, 200).replace(/\n/g, ' ').trim()
                navigate(`/victories?new=1&prefill=${encodeURIComponent(desc)}`)
              }}
              title="Save this as a victory"
            />
          </div>
        )}

        {/* Human-in-the-Mix on latest assistant message — hidden in conversational modes */}
        {isLatestAssistant && !isStreaming && !hideHumanInTheMix && (
          <HumanInTheMix
            onEdit={() => {
              notepad?.openNotepad({
                content: message.content,
                sourceType: 'edit_in_notepad',
              })
            }}
            onApprove={() => {/* Approve = no action needed, message stays */}}
            onRegenerate={() => onRegenerate?.()}
            onReject={() => onReject?.()}
          />
        )}
      </div>
    </div>
  )
}

function ActionChip({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  title,
}: {
  icon: typeof Copy
  label: string
  onClick: () => void
  disabled?: boolean
  title?: string
}) {
  return (
    <Tooltip content={title || label}>
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs hover:opacity-80 transition-opacity disabled:opacity-30"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      <Icon size={10} />
      <span>{label}</span>
    </button>
    </Tooltip>
  )
}
