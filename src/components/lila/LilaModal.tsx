import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Mic, Loader } from 'lucide-react'
import { Tooltip } from '@/components/shared'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useQueryClient } from '@tanstack/react-query'
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
import { matchHelpPattern } from '@/lib/ai/help-patterns'
import { supabase } from '@/lib/supabase/client'
import { useVoiceInput, formatDuration } from '@/hooks/useVoiceInput'
import { FEATURE_FLAGS } from '@/config/featureFlags'

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
  const { data: familyMembers = [] } = useFamilyMembers(family?.id)
  const [conversation, setConversation] = useState<LilaConversation | null>(existingConversation || null)
  const [selectedPersonId, setSelectedPersonId] = useState<string | undefined>(referenceId)
  const { data: messages = [] } = useLilaMessages(conversation?.id)
  const createConversation = useCreateConversation()
  const queryClient = useQueryClient()

  const {
    state: voiceState,
    duration: voiceDuration,
    interimText,
    startRecording,
    stopRecording,
    isSupported: voiceSupported,
  } = useVoiceInput()

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [openingMessage, setOpeningMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Show interim voice text in input while recording
  useEffect(() => {
    if (voiceState === 'recording' && interimText) {
      setInput(interimText)
    }
  }, [interimText, voiceState])

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

    let conv = conversation
    if (!conv) {
      conv = await createConversation.mutateAsync({
        family_id: family.id,
        member_id: member.id,
        mode: 'general',
        guided_mode: modeKey,
        guided_subtype: modeKey,
        guided_mode_reference_id: selectedPersonId || referenceId,
        container_type: 'modal',
        model_used: mode?.model_tier || 'sonnet',
      })
      setConversation(conv)
    }

    // Help-only pattern matching — check canned responses BEFORE calling AI (PRD-32)
    // Only fires in Help mode. Assist mode is conversational and should always call AI.
    if (modeKey === 'help') {
      const cannedResponse = matchHelpPattern(messageText)
      if (cannedResponse) {
        await supabase.from('lila_messages').insert([
          { conversation_id: conv.id, role: 'user', content: messageText, metadata: {} },
          { conversation_id: conv.id, role: 'assistant', content: cannedResponse, metadata: { source: 'pattern_match' } },
        ])
        queryClient.invalidateQueries({ queryKey: ['lila-messages', conv.id] })
        return
      }
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
      () => {
        setIsStreaming(false)
        setStreamingContent('')
        queryClient.invalidateQueries({ queryKey: ['lila-messages', conv!.id] })
      },
      (error) => {
        console.error('LiLa modal error:', error)
        setIsStreaming(false)
        setStreamingContent('I had trouble with that. Want to try again?')
      },
    )
  }, [input, member, family, isStreaming, conversation, modeKey, referenceId, mode, createConversation, queryClient])

  /** Delete the assistant message and re-send the last user message */
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
          console.error('LiLa modal regenerate error:', error)
          setIsStreaming(false)
          setStreamingContent('I had trouble with that. Want to try again?')
        },
      )
    },
    [conversation, messages, isStreaming, queryClient],
  )

  /** Delete the assistant message */
  const handleReject = useCallback(
    async (messageId: string) => {
      if (!conversation) return
      await supabase.from('lila_messages').delete().eq('id', messageId)
      queryClient.invalidateQueries({ queryKey: ['lila-messages', conversation.id] })
    },
    [conversation, queryClient],
  )

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

        {/* Person selector — shows when guided mode has person_selector: true (PRD-05 §Guided Mode Registry) */}
        {mode?.person_selector && !conversation && familyMembers.length > 0 && (
          <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Who is this about?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {familyMembers
                .filter(fm => fm.id !== member?.id)
                .map(fm => (
                  <button
                    key={fm.id}
                    onClick={() => setSelectedPersonId(fm.id)}
                    className="px-3 py-1.5 rounded-full text-xs transition-all"
                    style={{
                      backgroundColor: selectedPersonId === fm.id
                        ? 'var(--color-btn-primary-bg)'
                        : 'var(--color-bg-secondary)',
                      color: selectedPersonId === fm.id
                        ? 'var(--color-btn-primary-text)'
                        : 'var(--color-text-primary)',
                      border: selectedPersonId === fm.id
                        ? '1px solid var(--color-btn-primary-bg)'
                        : '1px solid var(--color-border)',
                    }}
                  >
                    {fm.display_name}
                  </button>
                ))}
            </div>
          </div>
        )}

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

          {messages.map((msg, i) => {
            const isConversationalMode = ['help', 'assist', 'general', 'optimizer'].includes(modeKey)
            return (
              <LilaMessageBubble
                key={msg.id}
                message={msg}
                avatarKey={avatarKey}
                isLatestAssistant={msg.role === 'assistant' && i === messages.length - 1 && !isStreaming}
                hideHumanInTheMix={isConversationalMode}
                onRegenerate={() => handleRegenerate(msg.id)}
                onReject={() => handleReject(msg.id)}
              />
            )
          })}

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

        {/* Recording status bar */}
        {FEATURE_FLAGS.ENABLE_VOICE_INPUT && (voiceState === 'recording' || voiceState === 'transcribing') && (
          <div
            className="mx-4 mb-1 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
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

        {/* Input */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-t shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {/* Voice input button — hidden behind feature flag */}
          {FEATURE_FLAGS.ENABLE_VOICE_INPUT && (voiceSupported ? (
            <Tooltip content={voiceState === 'recording' ? 'Stop recording' : 'Voice input'}>
            <button
              type="button"
              onClick={handleVoiceMic}
              disabled={voiceState === 'transcribing' || isStreaming}
              className="p-2 rounded-lg transition-colors"
              style={{
                background: voiceState === 'recording' ? 'rgba(220,38,38,0.12)' : 'transparent',
                color: voiceState === 'recording' ? 'var(--color-error, #dc2626)' : 'var(--color-text-secondary)',
                opacity: voiceState === 'transcribing' || isStreaming ? 0.4 : 1,
              }}
            >
              {voiceState === 'transcribing' ? <Loader size={16} className="animate-spin" /> : <Mic size={16} />}
            </button>
            </Tooltip>
          ) : (
            <Tooltip content="Voice input not supported in this browser">
            <button
              className="p-2 rounded-lg opacity-30"
              disabled
            >
              <Mic size={16} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
            </Tooltip>
          ))}

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={voiceState === 'recording' ? 'Listening...' : 'Type a message...'}
            disabled={isStreaming || voiceState === 'transcribing'}
            className="flex-1 px-3 py-2 rounded-lg text-sm disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: voiceState === 'recording' ? '1px solid var(--color-error, #dc2626)' : '1px solid var(--color-border)',
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
