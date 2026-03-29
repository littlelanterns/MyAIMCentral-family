import { useState, useRef, useEffect, useCallback, type TouchEvent as ReactTouchEvent } from 'react'
import { ChevronUp, ChevronDown, Send, X, History, Mic, Loader, Maximize2 } from 'lucide-react'
import { Tooltip } from '@/components/shared'
import { useLocation } from 'react-router-dom'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useQueryClient } from '@tanstack/react-query'
import {
  useLilaMessages,
  useCreateConversation,
  useGuidedModes,
  useRenameConversation,
  detectCrisis,
  CRISIS_RESPONSE,
  streamLilaChat,
} from '@/hooks/useLila'
import type { LilaConversation } from '@/hooks/useLila'
import { LilaMessageBubble } from './LilaMessageBubble'
import { LilaModeSwitcher } from './LilaModeSwitcher'
import { LilaAvatar, getAvatarKeyForMode, getModeDisplayName } from './LilaAvatar'
import { LilaContextIndicator } from './LilaContextIndicator'
import { assembleContext, getContextSummary, createContextSnapshot } from '@/lib/ai/context-assembly'
import { matchHelpPattern } from '@/lib/ai/help-patterns'
import { supabase } from '@/lib/supabase/client'
import { FeatureGuide } from '@/components/shared/FeatureGuide'
import { PullTab } from '@/components/shared/PullTab'
import { useVoiceInput, formatDuration } from '@/hooks/useVoiceInput'
import { FEATURE_FLAGS } from '@/config/featureFlags'

type DrawerState = 'collapsed' | 'peek' | 'full'

interface LilaDrawerProps {
  conversation: LilaConversation | null
  onConversationCreated: (conv: LilaConversation) => void
  onClose: () => void
  initialMode?: string
  onHistoryOpen?: () => void
  onContextSettingsOpen?: () => void
  onExpandToModal?: () => void
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
  onExpandToModal,
}: LilaDrawerProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: messages = [] } = useLilaMessages(conversation?.id)
  const { data: guidedModes = [] } = useGuidedModes()
  const createConversation = useCreateConversation()
  const renameConversation = useRenameConversation()
  const queryClient = useQueryClient()
  const location = useLocation()

  const {
    state: voiceState,
    duration: voiceDuration,
    interimText,
    startRecording,
    stopRecording,
    isSupported: voiceSupported,
  } = useVoiceInput()

  const [drawerState, setDrawerState] = useState<DrawerState>('collapsed')

  // Swipe up/down to control drawer height states (PRD-04)
  const lilaSwipeStart = useRef<{ x: number; y: number } | null>(null)
  const handleLilaTouchStart = useCallback((e: ReactTouchEvent) => {
    lilaSwipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])
  const handleLilaTouchEnd = useCallback((e: ReactTouchEvent) => {
    if (!lilaSwipeStart.current) return
    const dy = e.changedTouches[0].clientY - lilaSwipeStart.current.y
    const dx = Math.abs(e.changedTouches[0].clientX - lilaSwipeStart.current.x)
    lilaSwipeStart.current = null
    // Must be predominantly vertical and > 50px
    if (Math.abs(dy) < 50 || dx > Math.abs(dy)) return
    if (dy < 0) {
      // Swipe up — expand
      setDrawerState(prev => prev === 'collapsed' ? 'peek' : prev === 'peek' ? 'full' : prev)
    } else {
      // Swipe down — collapse
      setDrawerState(prev => prev === 'full' ? 'peek' : prev === 'peek' ? 'collapsed' : prev)
    }
  }, [])

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [currentMode, setCurrentMode] = useState(initialMode || 'general')
  const [contextSummary, setContextSummary] = useState('Loading context...')
  const [openingMessage, setOpeningMessage] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Show interim voice text in input while recording
  useEffect(() => {
    if (voiceState === 'recording' && interimText) {
      setInput(interimText)
    }
  }, [interimText, voiceState])

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

  // Auto-expand when a conversation is loaded (e.g., from history)
  useEffect(() => {
    if (conversation?.id) {
      setDrawerState('peek')
    }
  }, [conversation?.id])

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
  // Includes empty-context acknowledgment for guided modes (PRD-05 §Edge Cases)
  useEffect(() => {
    if (messages.length > 0 || !guidedModes.length) {
      setOpeningMessage(null)
      return
    }
    const mode = guidedModes.find(m => m.mode_key === currentMode)
    const openers = mode?.opening_messages || []

    let opener: string
    if (openers.length > 0) {
      opener = openers[Math.floor(Math.random() * openers.length)]
    } else {
      opener = "Hey. What's on your mind?"
    }

    // Empty-context acknowledgment: if this is a guided mode that uses context
    // but we have very little, append a gentle note
    if (mode && mode.context_sources.length > 0 && contextSummary === 'No context loaded') {
      opener += "\n\nI don't have much family context loaded right now. I'll do my best with what I know — and anything you share, I can help you save for next time."
    }

    setOpeningMessage(opener)
  }, [currentMode, guidedModes, messages.length, contextSummary])

  const handleVoiceMic = useCallback(async () => {
    if (voiceState === 'recording') {
      const transcribed = await stopRecording()
      if (transcribed) {
        setInput(prev => {
          const base = prev.replace(interimText, '').trimEnd()
          return base ? base + ' ' + transcribed : transcribed
        })
      }
    } else if (voiceState === 'idle') {
      setInput('')
      await startRecording()
    }
  }, [voiceState, stopRecording, startRecording, interimText])

  const handleSend = useCallback(async () => {
    if (!input.trim() || !member || !family || isStreaming) return

    const messageText = input.trim()
    setInput('')
    setDrawerState('peek')

    let conv = conversation
    if (!conv) {
      // Assemble context snapshot for the new conversation
      const bundle = await assembleContext(family.id, member.id, member.role, location.pathname)
      const snapshot = createContextSnapshot(bundle)

      // Determine model from guided mode
      const mode = guidedModes.find(m => m.mode_key === currentMode)
      const modelUsed = mode?.model_tier || 'sonnet'

      conv = await createConversation.mutateAsync({
        family_id: family.id,
        member_id: member.id,
        mode: ['general', 'help', 'assist', 'optimizer'].includes(currentMode)
          ? (currentMode as 'general' | 'help' | 'assist' | 'optimizer')
          : 'general',
        guided_mode: currentMode !== 'general' ? currentMode : undefined,
        container_type: 'drawer',
        model_used: modelUsed,
        page_context: location.pathname,
      })

      // Save context_snapshot to the conversation record (PRD-05: context snapshot stored on creation)
      await supabase
        .from('lila_conversations')
        .update({ context_snapshot: snapshot })
        .eq('id', conv.id)

      onConversationCreated(conv)
    }

    // Help/Assist pattern matching — check canned responses BEFORE calling AI (PRD-32)
    if (currentMode === 'help' || currentMode === 'assist') {
      const cannedResponse = matchHelpPattern(messageText)
      if (cannedResponse) {
        // Insert user message first, then the canned assistant response — no AI call
        await supabase.from('lila_messages').insert([
          { conversation_id: conv.id, role: 'user', content: messageText, metadata: {} },
          { conversation_id: conv.id, role: 'assistant', content: cannedResponse, metadata: { source: 'pattern_match' } },
        ])
        queryClient.invalidateQueries({ queryKey: ['lila-messages', conv.id] })
        return
      }
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
        () => {
          setStreamingContent('')
          queryClient.invalidateQueries({ queryKey: ['lila-messages', conv!.id] })
        },
        () => {
          setStreamingContent('')
          queryClient.invalidateQueries({ queryKey: ['lila-messages', conv!.id] })
        },
      ).catch(() => {})
      return
    }

    // Stream AI response
    setIsStreaming(true)
    setStreamingContent('')
    setErrorMessage(null)

    await streamLilaChat(
      conv.id,
      messageText,
      (chunk) => {
        setStreamingContent(prev => prev + chunk)
      },
      () => {
        setIsStreaming(false)
        setStreamingContent('')
        // Refetch messages from DB — edge function saved both user + assistant messages
        queryClient.invalidateQueries({ queryKey: ['lila-messages', conv!.id] })
      },
      (error) => {
        console.error('LiLa chat error:', error)
        setIsStreaming(false)
        setStreamingContent('')
        setErrorMessage(error.message || 'I had trouble with that. Want to try again?')
        // Still refetch — the user message was saved by the Edge Function
        queryClient.invalidateQueries({ queryKey: ['lila-messages', conv!.id] })
      },
    )
  }, [input, member, family, isStreaming, conversation, currentMode, guidedModes, createConversation, onConversationCreated, queryClient, location.pathname])

  /** Delete the assistant message and re-send the last user message (PRD-05 HumanInTheMix) */
  const handleRegenerate = useCallback(
    async (messageId: string) => {
      if (!conversation || isStreaming) return

      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
      if (!lastUserMessage) return

      await supabase.from('lila_messages').delete().eq('id', messageId)
      queryClient.invalidateQueries({ queryKey: ['lila-messages', conversation.id] })

      setIsStreaming(true)
      setStreamingContent('')

      await streamLilaChat(
        conversation.id,
        lastUserMessage.content + '\n\n[Please try a different approach.]',
        (chunk) => setStreamingContent(prev => prev + chunk),
        () => {
          setIsStreaming(false)
          setStreamingContent('')
          queryClient.invalidateQueries({ queryKey: ['lila-messages', conversation.id] })
        },
        (error) => {
          console.error('LiLa drawer regenerate error:', error)
          setIsStreaming(false)
          setStreamingContent('I had trouble with that. Want to try again?')
        },
      )
    },
    [conversation, messages, isStreaming, queryClient],
  )

  /** Delete the assistant message (PRD-05 HumanInTheMix Reject) */
  const handleReject = useCallback(
    async (messageId: string) => {
      if (!conversation) return
      await supabase.from('lila_messages').delete().eq('id', messageId)
      queryClient.invalidateQueries({ queryKey: ['lila-messages', conversation.id] })
    },
    [conversation, queryClient],
  )

  const [pendingModeSwitch, setPendingModeSwitch] = useState<string | null>(null)

  function handleModeSwitch(modeKey: string) {
    if (modeKey === currentMode) return

    // If there's an active conversation with messages, show confirmation (PRD-05 Mode Conflict)
    if (conversation && messages.length > 0) {
      setPendingModeSwitch(modeKey)
      return
    }
    setCurrentMode(modeKey)
  }

  function confirmModeSwitch() {
    if (!pendingModeSwitch) return
    onConversationCreated(null as unknown as LilaConversation)
    setCurrentMode(pendingModeSwitch)
    setPendingModeSwitch(null)
  }

  function cancelModeSwitch() {
    setPendingModeSwitch(null)
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
    <div
      className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 md:left-[220px]"
      onTouchStart={handleLilaTouchStart}
      onTouchEnd={handleLilaTouchEnd}
    >
      {/* Pull tab — vibe-aware, always visible above drawer */}
      <div className="flex justify-center" style={{ marginBottom: '-1px' }}>
        <PullTab
          orientation="bottom"
          onClick={() => setDrawerState(drawerState === 'collapsed' ? 'peek' : 'collapsed')}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <LilaAvatar avatarKey={avatarKey} size={18} />
            <span>LiLa</span>
            <span className="opacity-60 text-[10px]">{modeLabel}</span>
            {drawerState === 'collapsed' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </div>
        </PullTab>
      </div>

      {/* Drawer body — overflow-hidden on wrapper for height animation,
           but children manage their own scrolling */}
      <div
        className="flex flex-col transition-all duration-300 ease-in-out"
        style={{
          height: heights[drawerState],
          overflow: 'hidden',
          backgroundColor: 'var(--color-bg-card)',
          boxShadow: drawerState !== 'collapsed' ? '0 -8px 32px rgba(0, 0, 0, 0.15)' : 'none',
          borderRadius: drawerState !== 'collapsed' ? '16px 16px 0 0' : '0',
        }}
      >
        {/* Header — gradient banner with avatar */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            borderRadius: '16px 16px 0 0',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.3)',
              }}
            >
              <LilaAvatar avatarKey={avatarKey} size={24} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-btn-primary-text, #fff)' }}>
                  {modeLabel}
                </span>
                <LilaModeSwitcher
                  currentMode={currentMode}
                  modes={guidedModes}
                  onModeSelect={handleModeSwitch}
                />
              </div>

              {/* Conversation title (click to rename) */}
              {conversation?.title && !editingTitle && (
                <Tooltip content="Click to rename">
                <button
                  onClick={() => {
                    setEditingTitle(true)
                    setTitleInput(conversation.title || '')
                  }}
                  className="text-xs truncate max-w-[200px] hover:underline block"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  {conversation.title}
                </button>
                </Tooltip>
              )}
              {editingTitle && (
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                  className="text-xs px-1.5 py-0.5 rounded max-w-[200px]"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'var(--color-btn-primary-text, #fff)',
                  }}
                  autoFocus
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Expand to fullscreen modal */}
            {onExpandToModal && conversation && (
              <Tooltip content="Expand to fullscreen">
              <button
                onClick={onExpandToModal}
                className="p-1.5 rounded-full"
                style={{ color: 'rgba(255,255,255,0.7)', background: 'transparent', minHeight: 'unset' }}
              >
                <Maximize2 size={14} />
              </button>
              </Tooltip>
            )}

            {/* Expand/collapse toggle */}
            {drawerState === 'peek' && (
              <Tooltip content="Expand">
              <button
                onClick={() => setDrawerState('full')}
                className="p-1.5 rounded-full"
                style={{ color: 'rgba(255,255,255,0.7)', background: 'transparent', minHeight: 'unset' }}
              >
                <ChevronUp size={16} />
              </button>
              </Tooltip>
            )}
            {drawerState === 'full' && (
              <Tooltip content="Shrink">
              <button
                onClick={() => setDrawerState('peek')}
                className="p-1.5 rounded-full"
                style={{ color: 'rgba(255,255,255,0.7)', background: 'transparent', minHeight: 'unset' }}
              >
                <ChevronDown size={16} />
              </button>
              </Tooltip>
            )}

            {/* History button */}
            <Tooltip content="Conversation history">
            <button
              onClick={onHistoryOpen}
              className="p-1.5 rounded-full"
              style={{ color: 'rgba(255,255,255,0.7)', background: 'transparent', minHeight: 'unset' }}
            >
              <History size={16} />
            </button>
            </Tooltip>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              style={{ color: 'rgba(255,255,255,0.7)', background: 'transparent', minHeight: 'unset' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Feature Guide (dismissable) */}
        <div className="px-4 pt-2">
          <FeatureGuide featureKey="lila" />
        </div>

        {/* Messages — min-h-0 is critical for flex child scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
          {/* Opening message when no conversation — speech bubble with avatar */}
          {messages.length === 0 && openingMessage && !isStreaming && (
            <div className="flex flex-col items-center gap-2 py-6 animate-fadeIn">
              <LilaAvatar avatarKey={avatarKey} size={72} />
              <div
                className="relative rounded-2xl px-5 py-4 text-sm text-center max-w-[85%]"
                style={{
                  background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                  color: 'var(--color-btn-primary-text, #fff)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                }}
              >
                {/* Speech arrow pointing up */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: '8px solid var(--color-btn-primary-bg)',
                  }}
                />
                <p className="leading-relaxed">{openingMessage}</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isLatestAssistant = msg.role === 'assistant' && i === messages.length - 1 && !isStreaming
            return (
              <LilaMessageBubble
                key={msg.id}
                message={msg}
                avatarKey={avatarKey}
                isLatestAssistant={isLatestAssistant}
                onRegenerate={() => handleRegenerate(msg.id)}
                onReject={() => handleReject(msg.id)}
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

          {/* Error message — persists until next send */}
          {errorMessage && !isStreaming && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <LilaAvatar avatarKey={avatarKey} size={16} />
              <div>
                <p>I had trouble with that. Want to try again?</p>
                <p className="text-xs mt-1 opacity-60">{errorMessage}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area — warm footer */}
        <div
          className="shrink-0"
          style={{
            background: 'linear-gradient(to top, var(--color-bg-card), rgba(255,255,255,0.5))',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {/* Context indicator */}
          <div className="px-4 pt-2">
            <LilaContextIndicator summary={contextSummary} onClick={onContextSettingsOpen} />
          </div>

          {/* Recording status bar — visible only while recording or transcribing */}
          {FEATURE_FLAGS.ENABLE_VOICE_INPUT && (voiceState === 'recording' || voiceState === 'transcribing') && (
            <div
              className="mx-4 mt-1.5 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{
                backgroundColor: voiceState === 'recording' ? 'rgba(220,38,38,0.1)' : 'var(--color-bg-secondary)',
                color: voiceState === 'recording' ? 'var(--color-error, #dc2626)' : 'var(--color-text-secondary)',
              }}
            >
              {voiceState === 'recording' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Recording — {formatDuration(voiceDuration)} — tap mic to finish</span>
                </>
              )}
              {voiceState === 'transcribing' && (
                <>
                  <Loader size={12} className="animate-spin" />
                  <span>Transcribing...</span>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-3">
            {/* Voice input button — hidden behind feature flag */}
            {FEATURE_FLAGS.ENABLE_VOICE_INPUT && (voiceSupported ? (
              <Tooltip content={voiceState === 'recording' ? 'Stop recording' : 'Voice input'}>
              <button
                type="button"
                onClick={handleVoiceMic}
                disabled={voiceState === 'transcribing' || isStreaming}
                className="p-2 rounded-full transition-colors"
                style={{
                  background: voiceState === 'recording' ? 'rgba(220,38,38,0.12)' : 'transparent',
                  color: voiceState === 'recording' ? 'var(--color-error, #dc2626)' : 'var(--color-text-secondary)',
                  minHeight: 'unset',
                  opacity: voiceState === 'transcribing' || isStreaming ? 0.4 : 1,
                }}
              >
                {voiceState === 'transcribing' ? <Loader size={16} className="animate-spin" /> : <Mic size={16} />}
              </button>
              </Tooltip>
            ) : (
              <Tooltip content="Voice input not supported in this browser">
              <button
                className="p-2 rounded-full opacity-30"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                disabled
              >
                <Mic size={16} />
              </button>
              </Tooltip>
            ))}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={voiceState === 'recording' ? 'Listening...' : placeholders[currentMode] || "What's on your mind?"}
              disabled={isStreaming || voiceState === 'transcribing'}
              className="flex-1 px-4 py-2.5 rounded-full text-sm disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: voiceState === 'recording' ? '1px solid var(--color-error, #dc2626)' : '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="btn-primary p-2.5 rounded-full disabled:opacity-50 transition-all hover:scale-105"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
                minHeight: 'unset',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Mode conflict confirmation dialog (PRD-05 §Mode Conflict) */}
      {pendingModeSwitch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onClick={cancelModeSwitch}
        >
          <div
            className="mx-4 max-w-sm w-full rounded-xl p-5 shadow-xl"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>
              Switch modes?
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Switching modes will start a new conversation. Your current conversation will be saved.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={cancelModeSwitch}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModeSwitch}
                className="btn-primary px-3 py-1.5 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
