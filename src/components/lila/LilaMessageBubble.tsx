import { useState } from 'react'
import { Copy, FileEdit, ArrowRightLeft, ListTodo, Trophy, Check } from 'lucide-react'
import { LilaAvatar } from './LilaAvatar'
import { HumanInTheMix } from '@/components/HumanInTheMix'
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
  onRegenerate?: () => void
}

export function LilaMessageBubble({
  message,
  avatarKey = 'sitting',
  isLatestAssistant = false,
  isStreaming = false,
  onRegenerate,
}: LilaMessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const isAssistant = message.role === 'assistant'
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar for assistant messages */}
      {isAssistant && (
        <LilaAvatar avatarKey={avatarKey} size={16} className="mt-1" />
      )}

      <div className={`max-w-[80%] ${isUser ? '' : 'flex-1'}`}>
        {/* Message content */}
        <div
          className="rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: isUser
              ? 'var(--color-btn-primary-bg)'
              : isSystem
                ? 'var(--color-bg-secondary)'
                : 'var(--color-bg-primary)',
            color: isUser
              ? 'var(--color-btn-primary-text)'
              : 'var(--color-text-primary)',
            border: isUser ? 'none' : '1px solid var(--color-border)',
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
              onClick={() => {/* STUB: wires to PRD-08 */}}
              disabled
              title="Coming soon — wires to Smart Notepad"
            />
            <ActionChip
              icon={ArrowRightLeft}
              label="Review & Route"
              onClick={() => {/* STUB: wires to PRD-08 */}}
              disabled
              title="Coming soon — wires to Review & Route"
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
              onClick={() => {/* STUB: wires to PRD-11 */}}
              disabled
              title="Coming soon — wires to Victory Recorder"
            />
          </div>
        )}

        {/* Human-in-the-Mix on latest assistant message */}
        {isLatestAssistant && !isStreaming && (
          <HumanInTheMix
            onEdit={() => {/* STUB: open content in notepad for editing */}}
            onApprove={() => {/* Approve = no action needed, message stays */}}
            onRegenerate={() => onRegenerate?.()}
            onReject={() => {/* STUB: remove message from conversation */}}
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
    <button
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs hover:opacity-80 transition-opacity disabled:opacity-30"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      <Icon size={10} />
      <span>{label}</span>
    </button>
  )
}
