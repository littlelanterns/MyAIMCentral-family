import { useState } from 'react'
import { Copy, FileEdit, ArrowRightLeft, ListTodo, Trophy, Check, Undo2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Tooltip } from '@/components/shared'
import { LilaAvatar } from './LilaAvatar'
import { HumanInTheMix } from '@/components/HumanInTheMix'
import { useNotepadContextSafe } from '@/components/notepad'
import type { LilaMessage } from '@/hooks/useLila'

// PRD-41 retraction copy — mirrors supabase/functions/_shared/ethics-guard.ts
// RETRACTION_NOTICE / RETRACTION_NOTICE_KID verbatim. Duplicated on the
// client because Deno Edge Function shared modules aren't importable into
// the Vite build — same precedent as CRISIS_RESPONSE, which is already
// duplicated between useLila.ts and crisis-detection.ts in this codebase.
// Keep both copies in sync if the wording ever changes.
const ETHICS_RETRACTION_NOTICE =
  "That last reply wasn't advice I should have given — the approach it suggested could hurt more than it helps. Let me try again, or ask me a different way."
const ETHICS_RETRACTION_NOTICE_KID =
  "LiLa took that answer back — it wasn't a good one. Ask me again!"

interface EthicsRetractionMetadata {
  category: string
  tier: number
  retracted_at: string
  rejection_id: string | null
}

/**
 * Message Bubble — PRD-05
 * Renders a single message in the conversation.
 * User messages right-aligned, LiLa left-aligned with avatar.
 * Assistant messages show action chips: Copy, Edit in Notepad, Review & Route, etc.
 * The most recent assistant message shows HumanInTheMix controls.
 */

export type RoutingHandoffTarget = {
  tool: string
  label: string
  purpose: string
  verb: 'switch' | 'open'
}

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
  /** Called when a routing-handoff chip is tapped on an Assist message
   *  carrying metadata.routing. Receives the chosen target or null for
   *  "Stay here". Per PRD-05 Drawer Default + Routing Concierge Addendum. */
  onRoutingHandoff?: (target: RoutingHandoffTarget | null) => void
  /** PRD-41 — Guided/Play surfaces get shorter, agency-on-LiLa retraction
   *  copy. Never true from LilaDrawer (mom-only). LilaModal passes it from
   *  the effective member's dashboard_mode. */
  isKidShell?: boolean
}

export function LilaMessageBubble({
  message,
  avatarKey = 'sitting',
  isLatestAssistant = false,
  isStreaming = false,
  hideHumanInTheMix = false,
  onRegenerate,
  onReject,
  onRoutingHandoff,
  isKidShell = false,
}: LilaMessageBubbleProps) {
  // Routing-handoff chips (PRD-05 addendum sec 4d). Assist pre-scan writes
  // metadata.routing with action='ask' + targets[]. Auto-switch (action='help')
  // is handled upstream in LilaDrawer via the stream metadata event — no chips.
  const routing = (message.metadata as { routing?: { action?: string; targets?: RoutingHandoffTarget[] } } | null)?.routing
  const askTargets = routing?.action === 'ask' ? (routing.targets ?? []) : []
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const isAssistant = message.role === 'assistant'
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  // PRD-41 — a retracted assistant message renders the withdrawal card
  // instead of its content. In the shipped shadow-mode enforcement state
  // this metadata key is never actually set server-side (see
  // ethics-guard.ts ENFORCEMENT_MODE) — this branch exists so the Phase-4
  // flip requires zero client changes.
  const ethicsRetraction = (message.metadata as { ethics_retraction?: EthicsRetractionMetadata } | null)?.ethics_retraction
  const isRetracted = isAssistant && !!ethicsRetraction

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

      {isRetracted && (
        <div className={`max-w-[85%] ${isUser ? '' : 'flex-1'}`}>
          {/* PRD-41 retraction card — replaces content entirely. HITM
              buttons are removed (the platform already rejected this on
              the user's behalf); Regenerate remains as a fresh "Ask again"
              affordance. */}
          <div
            data-testid={`ethics-retraction-${message.id}`}
            className="px-3.5 py-2.5 text-sm leading-relaxed flex items-start gap-2"
            style={{
              backgroundColor: 'var(--color-bg-card, #fff)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default, var(--color-border))',
              borderRadius: '16px 16px 16px 4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}
          >
            <Undo2 size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--color-text-secondary)' }} />
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-text-heading)' }}>
                LiLa took this response back
              </p>
              <p className="whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                {isKidShell ? ETHICS_RETRACTION_NOTICE_KID : ETHICS_RETRACTION_NOTICE}
              </p>
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate()}
                  className="mt-2 px-3 py-1 rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: 'var(--color-btn-primary-bg)',
                    color: 'var(--color-btn-primary-text)',
                  }}
                >
                  Ask again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!isRetracted && (
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

        {/* Routing-handoff chips — Assist three-part pattern per PRD-05 addendum sec 4d */}
        {isAssistant && !isStreaming && askTargets.length > 0 && onRoutingHandoff && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {askTargets.map(target => (
              <button
                key={target.tool}
                onClick={() => onRoutingHandoff(target)}
                className="px-3 py-1 rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                  border: '1px solid var(--color-btn-primary-bg)',
                }}
              >
                {target.label}
              </button>
            ))}
            <button
              onClick={() => onRoutingHandoff(null)}
              className="px-3 py-1 rounded-full text-xs hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Stay here
            </button>
          </div>
        )}

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
      )}
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
