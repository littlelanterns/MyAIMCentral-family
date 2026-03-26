/**
 * ToolConversationModal — PRD-21
 *
 * Shared modal for all 8 communication/relationship tools.
 * Extends the LiLa conversation engine with:
 * - PersonPillSelector (single/multi-select)
 * - Tool-specific action chips
 * - Routes to tool-specific Edge Functions
 * - Name auto-detection from conversation text
 *
 * Opens for ALL members including mom (container_preference: 'modal').
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { X, Send, Mic, Loader, Copy, FileText, ClipboardCopy, MessageSquare, CheckSquare, BookOpen, Trophy, Gift, Heart } from 'lucide-react'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useQueryClient } from '@tanstack/react-query'
import {
  useLilaMessages,
  useCreateConversation,
  useGuidedMode,
  detectCrisis,
  CRISIS_RESPONSE,
} from '@/hooks/useLila'
import type { LilaConversation } from '@/hooks/useLila'
import { LilaMessageBubble } from './LilaMessageBubble'
import { LilaAvatar } from './LilaAvatar'
import { PersonPillSelector } from './PersonPillSelector'
import { supabase } from '@/lib/supabase/client'
import { useVoiceInput, formatDuration } from '@/hooks/useVoiceInput'
import { FEATURE_FLAGS } from '@/config/featureFlags'

// ── Tool → Edge Function routing ────────────────────────────────

const TOOL_EDGE_FUNCTIONS: Record<string, string> = {
  cyrano: 'lila-cyrano',
  higgins_say: 'lila-higgins-say',
  higgins_navigate: 'lila-higgins-navigate',
  quality_time: 'lila-quality-time',
  gifts: 'lila-gifts',
  observe_serve: 'lila-observe-serve',
  words_affirmation: 'lila-words-affirmation',
  gratitude: 'lila-gratitude',
}

// Tools that produce drafts (show Save Draft / Copy Draft / Send via Message)
const DRAFT_TOOLS = new Set(['cyrano', 'higgins_say'])

// Tools that show "Create Task" action chip
const TASK_TOOLS = new Set(['quality_time', 'gifts', 'observe_serve', 'words_affirmation', 'higgins_say', 'higgins_navigate'])

// Tools that show "Save to Journal"
const JOURNAL_TOOLS = new Set(['gratitude', 'higgins_navigate'])

// Tools that show "Record Victory"
const VICTORY_TOOLS = new Set(['words_affirmation', 'gratitude'])

// Tools that are partner-only (person selector locked to spouse)
const PARTNER_ONLY_TOOLS = new Set(['cyrano'])

// Tools that support multi-select
const MULTI_SELECT_TOOLS = new Set(['higgins_say', 'higgins_navigate'])

// ── Streaming helper ────────────────────────────────────────────

async function streamToolChat(
  edgeFunctionName: string,
  conversationId: string,
  content: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      onError('Not authenticated')
      return
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/${edgeFunctionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ conversation_id: conversationId, content }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      onError(errBody || `HTTP ${response.status}`)
      return
    }

    // Check if it's a JSON response (crisis) vs SSE stream
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const json = await response.json()
      if (json.crisis) {
        onChunk(json.response)
      }
      onDone()
      return
    }

    // SSE streaming
    const reader = response.body?.getReader()
    if (!reader) { onError('No response body'); return }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'chunk' && parsed.content) {
            onChunk(parsed.content)
          }
        } catch { /* skip */ }
      }
    }

    onDone()
  } catch (err) {
    onError(String(err))
  }
}

// ── Component ───────────────────────────────────────────────────

interface ToolConversationModalProps {
  modeKey: string
  onClose: () => void
  existingConversation?: LilaConversation | null
  initialPersonId?: string
}

export function ToolConversationModal({
  modeKey,
  onClose,
  existingConversation,
  initialPersonId,
}: ToolConversationModalProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: mode } = useGuidedMode(modeKey)
  const { data: familyMembers = [] } = useFamilyMembers(family?.id)
  const [conversation, setConversation] = useState<LilaConversation | null>(existingConversation || null)
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>(
    initialPersonId ? [initialPersonId] : []
  )
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

  const isPartnerOnly = PARTNER_ONLY_TOOLS.has(modeKey)
  const isMultiSelect = MULTI_SELECT_TOOLS.has(modeKey)
  const edgeFunctionName = TOOL_EDGE_FUNCTIONS[modeKey] || 'lila-chat'

  // ── Person selection ──────────────────────────────────────

  // Auto-select partner for Cyrano
  useEffect(() => {
    if (!isPartnerOnly || selectedPersonIds.length > 0) return
    const partner = familyMembers.find(fm =>
      fm.id !== member?.id &&
      fm.role === 'additional_adult' &&
      (fm.relationship === 'spouse' || fm.relationship === 'partner')
    )
    if (partner) {
      setSelectedPersonIds([partner.id])
    }
  }, [isPartnerOnly, familyMembers, member?.id, selectedPersonIds.length])

  const handlePersonToggle = useCallback((memberId: string) => {
    if (isPartnerOnly) return // Cyrano: locked to partner
    setSelectedPersonIds(prev => {
      if (isMultiSelect) {
        return prev.includes(memberId)
          ? prev.filter(id => id !== memberId)
          : [...prev, memberId]
      } else {
        return prev.includes(memberId) ? [] : [memberId]
      }
    })
  }, [isMultiSelect, isPartnerOnly])

  // ── Opening message ────────────────────────────────────────

  useEffect(() => {
    if (messages.length > 0 || !mode) return
    const openers = mode.opening_messages || []
    if (openers.length > 0) {
      let msg = openers[Math.floor(Math.random() * openers.length)] as string
      // Personalize with selected person name
      const personName = selectedPersonIds.length === 1
        ? familyMembers.find(fm => fm.id === selectedPersonIds[0])?.display_name
        : undefined
      if (personName) {
        msg = msg.replace(/\[Name\]/g, personName).replace(/\[Partner\]/g, personName)
          .replace(/your partner/g, personName)
      }
      setOpeningMessage(msg)
    }
  }, [mode, messages.length, selectedPersonIds, familyMembers])

  // ── Scroll & Escape ────────────────────────────────────────

  useEffect(() => {
    if (voiceState === 'recording' && interimText) setInput(interimText)
  }, [interimText, voiceState])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isStreaming) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, isStreaming])

  // ── Voice ──────────────────────────────────────────────────

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

  // ── Send message ───────────────────────────────────────────

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
        guided_mode_reference_id: selectedPersonIds[0] || undefined,
        container_type: 'modal',
        model_used: mode?.model_tier || 'sonnet',
        context_snapshot: selectedPersonIds.length > 1
          ? { involved_member_ids: selectedPersonIds }
          : {},
      })
      setConversation(conv)
    }

    // Client-side crisis check (backup)
    if (detectCrisis(messageText)) {
      setStreamingContent(CRISIS_RESPONSE)
      return
    }

    setIsStreaming(true)
    setStreamingContent('')

    await streamToolChat(
      edgeFunctionName,
      conv.id,
      messageText,
      (chunk) => setStreamingContent(prev => prev + chunk),
      () => {
        setIsStreaming(false)
        setStreamingContent('')
        queryClient.invalidateQueries({ queryKey: ['lila-messages', conv!.id] })
      },
      (error) => {
        console.error(`${modeKey} error:`, error)
        setIsStreaming(false)
        setStreamingContent('I had trouble with that. Want to try again?')
      },
    )
  }, [input, member, family, isStreaming, conversation, modeKey, selectedPersonIds, mode, edgeFunctionName, createConversation, queryClient])

  // ── Regenerate / Reject ────────────────────────────────────

  const handleRegenerate = useCallback(async (messageId: string) => {
    if (!conversation || isStreaming) return
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMessage) return

    await supabase.from('lila_messages').delete().eq('id', messageId)
    queryClient.invalidateQueries({ queryKey: ['lila-messages', conversation.id] })

    setIsStreaming(true)
    setStreamingContent('')

    await streamToolChat(
      edgeFunctionName,
      conversation.id,
      lastUserMessage.content + '\n\n[Please try a different approach.]',
      (chunk) => setStreamingContent(prev => prev + chunk),
      () => {
        setIsStreaming(false)
        setStreamingContent('')
        queryClient.invalidateQueries({ queryKey: ['lila-messages', conversation.id] })
      },
      (error) => {
        console.error('Regenerate error:', error)
        setIsStreaming(false)
        setStreamingContent('I had trouble with that. Want to try again?')
      },
    )
  }, [conversation, messages, isStreaming, edgeFunctionName, queryClient])

  const handleReject = useCallback(async (messageId: string) => {
    if (!conversation) return
    await supabase.from('lila_messages').delete().eq('id', messageId)
    queryClient.invalidateQueries({ queryKey: ['lila-messages', conversation.id] })
  }, [conversation, queryClient])

  // ── Action Chips ───────────────────────────────────────────

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content).catch(() => {})
  }, [])

  const handleSaveDraft = useCallback(async (draftText: string) => {
    if (!conversation || !member || !family) return
    await supabase.from('communication_drafts').insert({
      family_id: family.id,
      author_id: member.id,
      about_member_id: selectedPersonIds[0] || null,
      tool_mode: modeKey === 'cyrano' ? 'cyrano' : 'higgins_say',
      raw_input: messages.filter(m => m.role === 'user').map(m => m.content).join('\n'),
      crafted_version: draftText,
      status: 'saved_for_later',
      lila_conversation_id: conversation.id,
    })
  }, [conversation, member, family, modeKey, selectedPersonIds, messages])

  const handleSaveToJournal = useCallback(async (content: string) => {
    if (!member || !family) return
    await supabase.from('journal_entries').insert({
      family_id: family.id,
      member_id: member.id,
      entry_type: modeKey === 'gratitude' ? 'gratitude' : 'journal_entry',
      content,
      is_included_in_ai: true,
    })
  }, [member, family, modeKey])

  // ── Tool display config ────────────────────────────────────

  const toolConfig = useMemo(() => {
    const configs: Record<string, { icon: typeof Heart; label: string; personLabel: string }> = {
      cyrano: { icon: FileText, label: 'Cyrano', personLabel: 'Your partner' },
      higgins_say: { icon: MessageSquare, label: 'Higgins — Say Something', personLabel: 'Who is this about?' },
      higgins_navigate: { icon: MessageSquare, label: 'Higgins — Navigate', personLabel: 'Who is involved?' },
      quality_time: { icon: Heart, label: 'Quality Time', personLabel: 'Who is this about?' },
      gifts: { icon: Gift, label: 'Gifts', personLabel: 'Who is this for?' },
      observe_serve: { icon: Heart, label: 'Observe & Serve', personLabel: 'Who is this about?' },
      words_affirmation: { icon: MessageSquare, label: 'Words of Affirmation', personLabel: 'Who is this for?' },
      gratitude: { icon: Heart, label: 'Gratitude', personLabel: 'Who are you grateful for?' },
    }
    return configs[modeKey] || { icon: Heart, label: mode?.display_name || modeKey, personLabel: 'Who is this about?' }
  }, [modeKey, mode])

  const avatarKey = mode?.avatar_key || 'sitting'
  const ToolIcon = toolConfig.icon

  // ── Render ─────────────────────────────────────────────────

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
        className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[800px] md:max-h-[85vh] z-50 flex flex-col md:rounded-xl overflow-hidden shadow-2xl"
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
            <ToolIcon size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
              {toolConfig.label}
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

        {/* Person Pill Selector */}
        <PersonPillSelector
          members={familyMembers}
          currentMemberId={member?.id || ''}
          selectedIds={selectedPersonIds}
          onToggle={handlePersonToggle}
          multiSelect={isMultiSelect}
          partnerOnly={isPartnerOnly}
          label={toolConfig.personLabel}
        />

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
            const isLatestAssistant = msg.role === 'assistant' && i === messages.length - 1 && !isStreaming
            return (
              <div key={msg.id}>
                <LilaMessageBubble
                  message={msg}
                  avatarKey={avatarKey}
                  isLatestAssistant={isLatestAssistant}
                  onRegenerate={() => handleRegenerate(msg.id)}
                  onReject={() => handleReject(msg.id)}
                />
                {/* Action chips — below the latest assistant message */}
                {isLatestAssistant && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-7">
                    {/* Universal: Copy */}
                    <ActionChip icon={<Copy size={12} />} label="Copy" onClick={() => handleCopyMessage(msg.content)} />

                    {/* Draft tools: Save Draft, Copy Draft, Send via Message */}
                    {DRAFT_TOOLS.has(modeKey) && (
                      <>
                        <ActionChip icon={<ClipboardCopy size={12} />} label="Save Draft" onClick={() => handleSaveDraft(msg.content)} />
                      </>
                    )}

                    {/* Task tools: Create Task */}
                    {TASK_TOOLS.has(modeKey) && (
                      <ActionChip icon={<CheckSquare size={12} />} label="Create Task" onClick={() => {
                        // Navigate to task creation with pre-filled title
                        const title = msg.content.split('\n')[0]?.slice(0, 80) || 'From LiLa conversation'
                        window.open(`/tasks?new=1&title=${encodeURIComponent(title)}`, '_self')
                      }} />
                    )}

                    {/* Journal tools: Save to Journal */}
                    {JOURNAL_TOOLS.has(modeKey) && (
                      <ActionChip icon={<BookOpen size={12} />} label="Save to Journal" onClick={() => handleSaveToJournal(msg.content)} />
                    )}

                    {/* Victory tools: Record Victory */}
                    {VICTORY_TOOLS.has(modeKey) && (
                      <ActionChip icon={<Trophy size={12} />} label="Record Victory" onClick={() => {
                        window.open(`/victories?new=1`, '_self')
                      }} />
                    )}

                    {/* Higgins Navigate: pathway to Say */}
                    {modeKey === 'higgins_navigate' && (
                      <ActionChip
                        icon={<MessageSquare size={12} />}
                        label="What do I want to say?"
                        onClick={() => {
                          // Mode switch: close Navigate, open Higgins Say with context
                          onClose()
                          // The parent component should handle opening higgins_say
                          // with the same person IDs. For now, dispatch custom event.
                          window.dispatchEvent(new CustomEvent('lila-mode-switch', {
                            detail: { from: 'higgins_navigate', to: 'higgins_say', personIds: selectedPersonIds },
                          }))
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
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

        {/* Recording status */}
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
          {FEATURE_FLAGS.ENABLE_VOICE_INPUT && (voiceSupported ? (
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
              title={voiceState === 'recording' ? 'Stop recording' : 'Voice input'}
            >
              {voiceState === 'transcribing' ? <Loader size={16} className="animate-spin" /> : <Mic size={16} />}
            </button>
          ) : null)}

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
    </>
  )
}

// ── Action Chip component ────────────────────────────────────

function ActionChip({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors hover:opacity-80"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        color: 'var(--color-text-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
