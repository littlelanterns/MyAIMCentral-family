import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronUp, ChevronDown, Send, X, History, Mic } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useLilaMessages,
  useCreateConversation,
  useGuidedModes,
  useRenameConversation,
  detectCrisis,
  CRISIS_RESPONSE,
  streamLilaChat,
} from '@/hooks/useLila'
import type { LilaConversation, LilaMessage } from '@/hooks/useLila'
import { LilaMessageBubble } from './LilaMessageBubble'
import { LilaModeSwitcher } from './LilaModeSwitcher'
import { LilaAvatar, getAvatarKeyForMode, getModeDisplayName } from './LilaAvatar'
import { LilaContextIndicator } from './LilaContextIndicator'
import { assembleContext, getContextSummary, createContextSnapshot } from '@/lib/ai/context-assembly'
import { FeatureGuide } from '@/components/shared/FeatureGuide'

type DrawerState = 'collapsed' | 'peek' | 'full'

interface LilaDrawerProps {
  conversation: LilaConversation | null
  onConversationCreated: (conv: LilaConversation) => void
  onClose: () => void
  initialMode?: string
  onHistoryOpen?: () => void
  onContextSettingsOpen?: () => void
}

/**
 * LiLa bottom drawer — Mom shell only (PRD-04/05).
 * Three visual states: collapsed (handle only), peek (half screen), full (near full-screen).
 * Features: mode switching, streaming AI response, action chips, HumanInTheMix,
 * opening message rotation, context indicator, conversation history access.
 */
export function LilaDrawer({
  conversation,
  onConversationCreated,
  onClose,
  initialMode,
  onHistoryOpen,
  onContextSettingsOpen,
}: LilaDrawerProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: messages = [] } = useLilaMessages(conversation?.id)
  const { data: guidedModes = [] } = useGuidedModes()
  const createConversation = useCreateConversation()
  const renameConversation = useRenameConversation()

  const [drawerState, setDrawerState] = useState<DrawerState>('collapsed')
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [currentMode, setCurrentMode] = useState(initialMode || 'general')
  const [contextSummary, setContextSummary] = useState('Loading context...')
  const [openingMessage, setOpeningMessage] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Update mode from initialMode prop
  useEffect(() => {
    if (initialMode) {
      setCurrentMode(initialMode)
      setDrawerState('peek')
    }
  }, [initialMode])

  // Load context summary
  useEffect(() => {
    if (!family?.id || !member?.id) {
      setContextSummary('Sign in to load context')
      return
    }
    assembleContext(family.id, member.id)
      .then(bundle => {
        setContextSummary(getContextSummary(bundle))
      })
      .catch(() => {
        setContextSummary('Add Guiding Stars or InnerWorkings to personalize LiLa')
      })
  }, [family?.id, member?.id])

  // Select random opening message when mode changes and no messages yet
  useEffect(() => {
    if (messages.length > 0 || !guidedModes.length) {
      setOpeningMessage(null)
      return
    }
    const mode = guidedModes.find(m => m.mode_key === currentMode)
    const openers = mode?.opening_messages || []
    if (openers.length > 0) {
      setOpeningMessage(openers[Math.floor(Math.random() * openers.length)])
    } else {
      setOpeningMessage("Hey. What's on your mind?")
    }
  }, [currentMode, guidedModes, messages.length])

  const handleSend = useCallback(async () => {
    if (!input.trim() || !member || !family || isStreaming) return

    const messageText = input.trim()
    setInput('')
    setDrawerState('peek')

    let conv = conversation
    if (!conv) {
      // Assemble context snapshot for the new conversation
      const bundle = await assembleContext(family.id, member.id)
      const snapshot = createContextSnapshot(bundle)

      // Determine model from guided mode
      const mode = guidedModes.find(m => m.mode_key === currentMode)
      const modelUsed = mode?.model_tier || 'sonnet'

      conv = await createConversation.mutateAsync({
        family_id: family.id,
        member_id: member.id,
        mode: ['general', 'help', 'assist', 'optimizer'].includes(currentMode)
          ? currentMode as 'general' | 'help' | 'assist' | 'optimizer'
          : 'general',
        guided_mode: currentMode !== 'general' ? currentMode : undefined,
        container_type: 'drawer',
        model_used: modelUsed,
      })

      // Update context_snapshot via separate call (since insert doesn't support jsonb well in some cases)
      // The Edge Function handles the actual context assembly server-side
      onConversationCreated(conv)
    }

    // Client-side crisis detection (Layer 1)
    if (detectCrisis(messageText)) {
      // Edge function also detects, but we show immediately for UX
      setStreamingContent(CRISIS_RESPONSE)
      // The Edge Function will handle saving messages
      await streamLilaChat(
        conv.id,
        messageText,
        () => {}, // Crisis is handled client-side
        () => setStreamingContent(''),
        () => setStreamingContent(''),
      ).catch(() => {})
      return
    }

    // Stream AI response
    setIsStreaming(true)
    setStreamingContent('')

    await streamLilaChat(
      conv.id,
      messageText,
      (chunk) => {
        setStreamingContent(prev => prev + chunk)
      },
      () => {
        setIsStreaming(false)
        setStreamingContent('')
        // Messages will auto-refresh via React Query
      },
      (error) => {
        console.error('LiLa chat error:', error)
        setIsStreaming(false)
        setStreamingContent("I had trouble with that. Want to try again?")
      },
    )
  }, [input, member, family, isStreaming, conversation, currentMode, guidedModes, createConversation, onConversationCreated])

  function handleModeSwitch(modeKey: string) {
    if (modeKey === currentMode) return

    // If there's an active conversation, start a new one in the new mode
    if (conversation && messages.length > 0) {
      onConversationCreated(null as unknown as LilaConversation) // Reset conversation
    }
    setCurrentMode(modeKey)
  }

  function handleTitleSave() {
    if (conversation && titleInput.trim() && member) {
      renameConversation.mutate({
        id: conversation.id,
        title: titleInput.trim(),
        memberId: member.id,
      })
    }
    setEditingTitle(false)
  }

  const avatarKey = getAvatarKeyForMode(currentMode)
  const modeLabel = getModeDisplayName(currentMode, conversation?.guided_subtype || null)

  const heights: Record<DrawerState, string> = {
    collapsed: '0px',
    peek: 'min(50vh, 400px)',
    full: 'min(85vh, 700px)',
  }

  // Placeholder text varies by mode per PRD-05
  const placeholders: Record<string, string> = {
    general: "What's on your mind?",
    help: 'Describe your issue...',
    assist: 'What do you want to learn about?',
    optimizer: 'Paste or describe your prompt...',
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:left-[220px]">
      {/* Pull tab — always visible, positioned ABOVE the drawer body */}
      <div className="flex justify-center" style={{ marginBottom: '-1px' }}>
        <button
          onClick={() => setDrawerState(drawerState === 'collapsed' ? 'peek' : 'collapsed')}
          className="btn-primary flex items-center gap-1.5 px-5 py-1.5 rounded-t-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          <LilaAvatar avatarKey={avatarKey} size={12} />
          LiLa
          {drawerState === 'collapsed' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Drawer body */}
      <div
        className="flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          height: heights[drawerState],
          backgroundColor: 'var(--color-bg-card)',
          borderTop: drawerState !== 'collapsed' ? '2px solid var(--color-border)' : 'none',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <LilaAvatar avatarKey={avatarKey} size={16} />

            {/* Mode label */}
            <span className="text-sm font-medium shrink-0" style={{ color: 'var(--color-text-heading)' }}>
              {modeLabel}
            </span>

            {/* Conversation title (click to rename) */}
            {conversation?.title && !editingTitle && (
              <button
                onClick={() => { setEditingTitle(true); setTitleInput(conversation.title || '') }}
                className="text-xs truncate max-w-[150px] hover:underline"
                style={{ color: 'var(--color-text-secondary)' }}
                title="Click to rename"
              >
                {conversation.title}
              </button>
            )}
            {editingTitle && (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                className="text-xs px-1 py-0.5 rounded max-w-[150px]"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                autoFocus
              />
            )}

            {/* Mode switcher */}
            <LilaModeSwitcher
              currentMode={currentMode}
              modes={guidedModes}
              onModeSelect={handleModeSwitch}
            />
          </div>

          <div className="flex items-center gap-1">
            {/* Expand/collapse toggle */}
            {drawerState === 'peek' && (
              <button onClick={() => setDrawerState('full')} className="p-1" style={{ color: 'var(--color-text-secondary)' }} title="Expand">
                <ChevronUp size={16} />
              </button>
            )}
            {drawerState === 'full' && (
              <button onClick={() => setDrawerState('peek')} className="p-1" style={{ color: 'var(--color-text-secondary)' }} title="Shrink">
                <ChevronDown size={16} />
              </button>
            )}

            {/* History button */}
            <button onClick={onHistoryOpen} className="p-1" style={{ color: 'var(--color-text-secondary)' }} title="Conversation history">
              <History size={16} />
            </button>

            {/* Close */}
            <button onClick={onClose} className="p-1" style={{ color: 'var(--color-text-secondary)' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Feature Guide (dismissable) */}
        <div className="px-4 pt-2">
          <FeatureGuide featureKey="lila" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* Opening message when no conversation — large avatar intro */}
          {messages.length === 0 && openingMessage && !isStreaming && (
            <div className="flex flex-col items-center gap-3 py-4">
              <LilaAvatar avatarKey={avatarKey} size={64} />
              <div
                className="rounded-lg px-4 py-3 text-sm text-center max-w-[85%]"
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

          {messages.map((msg, i) => {
            const isLatestAssistant = msg.role === 'assistant' &&
              i === messages.length - 1 &&
              !isStreaming
            return (
              <LilaMessageBubble
                key={msg.id}
                message={msg}
                avatarKey={avatarKey}
                isLatestAssistant={isLatestAssistant}
                onRegenerate={() => {
                  // STUB: re-send the last user message
                }}
              />
            )
          })}

          {/* Streaming message */}
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

          {/* Thinking indicator */}
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

        {/* Input area */}
        <div className="shrink-0 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {/* Context indicator */}
          <div className="px-4 pt-1">
            <LilaContextIndicator
              summary={contextSummary}
              onClick={onContextSettingsOpen}
            />
          </div>

          <div className="flex items-center gap-2 px-4 py-3">
            {/* Voice input stub */}
            <button
              className="p-2 rounded-lg opacity-30"
              style={{ color: 'var(--color-text-secondary)' }}
              disabled
              title="Voice input coming soon"
            >
              <Mic size={16} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={placeholders[currentMode] || "What's on your mind?"}
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
      </div>
    </div>
  )
}
