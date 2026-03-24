import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronUp, ChevronDown, Send, X, History, Mic, Loader } from 'lucide-react'
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
import { useVoiceInput, formatDuration } from '@/hooks/useVoiceInput'

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
  const queryClient = useQueryClient()

  const {
    state: voiceState,
    duration: voiceDuration,
    interimText,
    startRecording,
    stopRecording,
    isSupported: voiceSupported,
  } = useVoiceInput()

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
      const bundle = await assembleContext(family.id, member.id)
      // snapshot prepared for future use when context_snapshot is wired
      createContextSnapshot(bundle)

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
      })

      // Update context_snapshot via separate call (since insert doesn't support jsonb well in some cases)
      // The Edge Function handles the actual context assembly server-side
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
        setStreamingContent('I had trouble with that. Want to try again?')
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
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 md:left-[220px]">
      {/* Pull tab — folder tab shape with avatar, always visible above drawer */}
      <div className="flex justify-center" style={{ marginBottom: '-1px' }}>
        <button
          onClick={() => setDrawerState(drawerState === 'collapsed' ? 'peek' : 'collapsed')}
          className="relative flex items-center gap-2 text-xs font-semibold transition-all duration-300 hover:brightness-110 group"
          style={{
            background: 'transparent',
            border: 'none',
            minHeight: 'unset',
            padding: '0',
            width: '180px',
            height: '40px',
          }}
        >
          {/* Folder tab SVG — straight top, rounded bottom corners into drawer */}
          <svg
            viewBox="0 0 180 40"
            fill="none"
            className="absolute inset-0 w-full h-full"
            style={{ filter: 'drop-shadow(0 -3px 6px rgba(0,0,0,0.12))' }}
            preserveAspectRatio="none"
          >
            <path
              d="M10 0 L170 0 C176 0, 180 4, 180 10 L180 40 L0 40 L0 10 C0 4, 4 0, 10 0 Z"
              fill="var(--color-btn-primary-bg)"
            />
          </svg>
          <div className="relative z-10 flex items-center gap-2 justify-center w-full" style={{ color: 'var(--color-btn-primary-text)', paddingBottom: '4px' }}>
            <LilaAvatar avatarKey={avatarKey} size={18} />
            <span>LiLa</span>
            <span className="opacity-60 text-[10px]">{modeLabel}</span>
            {drawerState === 'collapsed' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </div>
        </button>
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
            background: 'var(--gradient-primary, linear-gradient(135deg, var(--color-btn-primary-bg), var(--color-accent, #d6a461)))',
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
                <button
                  onClick={() => {
                    setEditingTitle(true)
                    setTitleInput(conversation.title || '')
                  }}
                  className="text-xs truncate max-w-[200px] hover:underline block"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
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
            {/* Expand/collapse toggle */}
            {drawerState === 'peek' && (
              <button
                onClick={() => setDrawerState('full')}
                className="p-1.5 rounded-full"
                style={{ color: 'rgba(255,255,255,0.7)', background: 'transparent', minHeight: 'unset' }}
                title="Expand"
              >
                <ChevronUp size={16} />
              </button>
            )}
            {drawerState === 'full' && (
              <button
                onClick={() => setDrawerState('peek')}
                className="p-1.5 rounded-full"
                style={{ color: 'rgba(255,255,255,0.7)', background: 'transparent', minHeight: 'unset' }}
                title="Shrink"
              >
                <ChevronDown size={16} />
              </button>
            )}

            {/* History button */}
            <button
              onClick={onHistoryOpen}
              className="p-1.5 rounded-full"
              style={{ color: 'rgba(255,255,255,0.7)', background: 'transparent', minHeight: 'unset' }}
              title="Conversation history"
            >
              <History size={16} />
            </button>

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
                  background: 'var(--gradient-primary, linear-gradient(135deg, var(--color-btn-primary-bg), var(--color-accent, #d6a461)))',
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
          {(voiceState === 'recording' || voiceState === 'transcribing') && (
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
            {/* Voice input button — live when supported */}
            {voiceSupported ? (
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
                title={voiceState === 'recording' ? 'Stop recording' : 'Voice input'}
              >
                {voiceState === 'transcribing' ? <Loader size={16} className="animate-spin" /> : <Mic size={16} />}
              </button>
            ) : (
              <button
                className="p-2 rounded-full opacity-30"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                disabled
                title="Voice input not supported in this browser"
              >
                <Mic size={16} />
              </button>
            )}

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
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
                minHeight: 'unset',
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
