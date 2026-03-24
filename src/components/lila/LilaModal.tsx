import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Mic } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useLilaMessages,
  useCreateConversation,
  useGuidedMode,
  detectCrisis,
  CRISIS_RESPONSE,
  streamLilaChat,
} from '@/hooks/useLila'
import type { LilaConversation } from '@/hooks/useLila'
import { LilaMessageBubble } from './LilaMessageBubble'
import { LilaAvatar } from './LilaAvatar'

/**
 * LiLa Modal — Non-mom members (PRD-05)
 * Same conversation engine as drawer, but in a modal container.
 * Desktop: 800px max-width. Mobile: full-screen.
 * No mode switcher, no context indicator (context auto-assembled by permissions).
 */

interface LilaModalProps {
  modeKey: string
  referenceId?: string
  onClose: () => void
  existingConversation?: LilaConversation | null
}

export function LilaModal({ modeKey, referenceId, onClose, existingConversation }: LilaModalProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: mode } = useGuidedMode(modeKey)
  const [conversation, setConversation] = useState<LilaConversation | null>(existingConversation || null)
  const { data: messages = [] } = useLilaMessages(conversation?.id)
  const createConversation = useCreateConversation()

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [openingMessage, setOpeningMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Select opening message
  useEffect(() => {
    if (messages.length > 0 || !mode) return
    const openers = mode.opening_messages || []
    if (openers.length > 0) {
      setOpeningMessage(openers[Math.floor(Math.random() * openers.length)])
    }
  }, [mode, messages.length])

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isStreaming) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, isStreaming])

  const handleSend = useCallback(async () => {
    if (!input.trim() || !member || !family || isStreaming) return

    const messageText = input.trim()
    setInput('')

    let conv = conversation
    if (!conv) {
      conv = await createConversation.mutateAsync({
        family_id: family.id,
        member_id: member.id,
        mode: 'general',
        guided_mode: modeKey,
        guided_subtype: modeKey,
        guided_mode_reference_id: referenceId,
        container_type: 'modal',
        model_used: mode?.model_tier || 'sonnet',
      })
      setConversation(conv)
    }

    if (detectCrisis(messageText)) {
      setStreamingContent(CRISIS_RESPONSE)
      return
    }

    setIsStreaming(true)
    setStreamingContent('')

    await streamLilaChat(
      conv.id,
      messageText,
      (chunk) => setStreamingContent(prev => prev + chunk),
      () => { setIsStreaming(false); setStreamingContent('') },
      (error) => {
        console.error('LiLa modal error:', error)
        setIsStreaming(false)
        setStreamingContent("I had trouble with that. Want to try again?")
      },
    )
  }, [input, member, family, isStreaming, conversation, modeKey, referenceId, mode, createConversation])

  const avatarKey = mode?.avatar_key || 'sitting'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={() => !isStreaming && onClose()}
      />

      {/* Modal */}
      <div
        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[800px] md:max-h-[80vh] z-50 flex flex-col rounded-xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <LilaAvatar avatarKey={avatarKey} size={20} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
              {mode?.display_name || modeKey}
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={isStreaming}
            className="p-1 disabled:opacity-50"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && openingMessage && !isStreaming && (
            <div className="flex gap-2">
              <LilaAvatar avatarKey={avatarKey} size={16} className="mt-1" />
              <div
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <p>{openingMessage}</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <LilaMessageBubble
              key={msg.id}
              message={msg}
              avatarKey={avatarKey}
              isLatestAssistant={msg.role === 'assistant' && i === messages.length - 1 && !isStreaming}
            />
          ))}

          {isStreaming && streamingContent && (
            <LilaMessageBubble
              message={{
                id: 'streaming',
                conversation_id: conversation?.id || '',
                role: 'assistant',
                content: streamingContent,
                metadata: {},
                token_count: null,
                safety_scanned: false,
                created_at: new Date().toISOString(),
              }}
              avatarKey={avatarKey}
              isStreaming
            />
          )}

          {isStreaming && !streamingContent && (
            <div className="flex items-center gap-2">
              <LilaAvatar avatarKey={avatarKey} size={16} />
              <div className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
                LiLa is thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-t shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button className="p-2 rounded-lg opacity-30" disabled title="Voice input coming soon">
            <Mic size={16} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            disabled={isStreaming}
            className="flex-1 px-3 py-2 rounded-lg text-sm disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="btn-primary p-2 rounded-lg disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  )
}
