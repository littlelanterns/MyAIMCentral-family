import { useState, useRef, useEffect } from 'react'
import { ChevronUp, ChevronDown, Send, X, MessageCircle } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useLilaMessages,
  useCreateConversation,
  useSendMessage,
  detectCrisis,
  CRISIS_RESPONSE,
} from '@/hooks/useLila'
import type { LilaConversation, LilaMessage } from '@/hooks/useLila'

interface LilaDrawerProps {
  conversation: LilaConversation | null
  onConversationCreated: (conv: LilaConversation) => void
  onClose: () => void
}

/**
 * LiLa bottom drawer — Mom shell only (PRD-04/05).
 * Pull-up conversational AI interface with an edge pull tab.
 */
export function LilaDrawer({ conversation, onConversationCreated, onClose }: LilaDrawerProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: messages = [] } = useLilaMessages(conversation?.id)
  const createConversation = useCreateConversation()
  const sendMessage = useSendMessage()

  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || !member || !family) return

    const messageText = input.trim()
    setInput('')
    setExpanded(true)

    let conv = conversation
    if (!conv) {
      conv = await createConversation.mutateAsync({
        family_id: family.id,
        member_id: member.id,
        container_type: 'drawer',
        guided_mode: 'general',
      })
      onConversationCreated(conv)
    }

    await sendMessage.mutateAsync({
      conversation_id: conv.id,
      role: 'user',
      content: messageText,
    })

    if (detectCrisis(messageText)) {
      await sendMessage.mutateAsync({
        conversation_id: conv.id,
        role: 'system',
        content: CRISIS_RESPONSE,
        message_type: 'crisis_resource',
      })
      return
    }

    // STUB: Call lila-chat Edge Function for AI response
    setIsThinking(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    await sendMessage.mutateAsync({
      conversation_id: conv.id,
      role: 'assistant',
      content: "I'm LiLa, your processing partner. The AI response engine will be connected in a future phase. For now, I'm here as a placeholder.",
    })
    setIsThinking(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:left-[220px]">
      {/* Pull tab — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1 rounded-t-lg text-xs font-medium"
        style={{
          backgroundColor: 'var(--color-btn-primary-bg)',
          color: 'var(--color-btn-primary-text)',
        }}
      >
        <MessageCircle size={12} />
        LiLa
        {expanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      {/* Drawer body */}
      <div
        className="flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          height: expanded ? 'min(50vh, 400px)' : '0px',
          backgroundColor: 'var(--color-bg-card)',
          borderTop: expanded ? '2px solid var(--color-border)' : 'none',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <MessageCircle size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
              LiLa
            </span>
            {conversation?.guided_mode && (
              <span
                className="px-2 py-0.5 rounded text-xs"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
              >
                {conversation.guided_mode}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1" style={{ color: 'var(--color-text-secondary)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              Hi! I'm LiLa, your processing partner. How can I help?
            </p>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isThinking && (
            <div className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
              LiLa is thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-t shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded-lg disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: LilaMessage }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[80%] rounded-lg px-3 py-2 text-sm"
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
      </div>
    </div>
  )
}
