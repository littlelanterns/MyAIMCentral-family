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
import { X, Send, Mic, Loader, Copy, FileText, ClipboardCopy, MessageSquare, CheckSquare, BookOpen, Trophy, Gift, Heart, Brain, Scale, Compass, RefreshCw } from 'lucide-react'
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
import { useNotepadContextSafe } from '@/components/notepad'
import { StickyNote } from 'lucide-react'
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
  // ThoughtSift (PRD-34)
  decision_guide: 'lila-decision-guide',
  perspective_shifter: 'lila-perspective-shifter',
  mediator: 'lila-mediator',
  board_of_directors: 'lila-board-of-directors',
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

// Tools that support multi-select (all tools except partner-only Cyrano)
const MULTI_SELECT_TOOLS = new Set(['higgins_say', 'higgins_navigate', 'quality_time', 'gifts', 'observe_serve', 'words_affirmation', 'gratitude', 'mediator'])

// ── Streaming helper ────────────────────────────────────────────

async function streamToolChat(
  edgeFunctionName: string,
  conversationId: string,
  content: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  extraPayload?: Record<string, unknown>,
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
      body: JSON.stringify({ conversation_id: conversationId, content, ...extraPayload }),
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
  const notepad = useNotepadContextSafe()
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

  // Decision Guide framework state (PRD-34)
  const pendingSuggestRef = useRef(false)
  const [activeFrameworkKey, setActiveFrameworkKey] = useState<string | null>(null)
  const [activeFrameworkName, setActiveFrameworkName] = useState<string | null>(null)
  const [showFrameworkPicker, setShowFrameworkPicker] = useState(false)
  const [frameworks, setFrameworks] = useState<Array<{ framework_key: string; display_name: string; description: string; best_for: string }>>([])
  const isDecisionGuide = modeKey === 'decision_guide'

  // Load frameworks from DB for Decision Guide
  useEffect(() => {
    if (!isDecisionGuide) return
    supabase
      .from('decision_frameworks')
      .select('framework_key, display_name, description, best_for')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => { if (data) setFrameworks(data) })
  }, [isDecisionGuide])

  // Perspective Shifter lens state (PRD-34)
  const isPerspectiveShifter = modeKey === 'perspective_shifter'
  const [activeLensKey, setActiveLensKey] = useState<string | null>(null)
  const [activeLensName, setActiveLensName] = useState<string | null>(null)
  const [lenses, setLenses] = useState<Array<{ lens_key: string; display_name: string; description: string; lens_type: string }>>([])
  const [showLensLibrary, setShowLensLibrary] = useState(false)

  useEffect(() => {
    if (!isPerspectiveShifter) return
    supabase
      .from('perspective_lenses')
      .select('lens_key, display_name, description, lens_type')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => { if (data) setLenses(data) })
  }, [isPerspectiveShifter])

  // Mediator context mode state (PRD-34)
  const isMediator = modeKey === 'mediator'
  const [mediationContext, setMediationContext] = useState('solo')

  const MEDIATION_CONTEXTS = useMemo(() => [
    { key: 'solo', label: 'Solo — just me processing', needsPerson: false },
    { key: 'spouse_partner', label: 'Me and my spouse/partner', needsPerson: true },
    { key: 'parent_child', label: 'Me and my child', needsPerson: true },
    { key: 'parent_teen', label: 'Me and a teen', needsPerson: true },
    { key: 'sibling_mediation', label: 'Between my children', needsPerson: true },
    { key: 'workplace', label: 'Workplace / non-family', needsPerson: false },
    { key: 'man_vs_self', label: 'Man vs. Self', needsPerson: false },
    { key: 'full_picture', label: 'Full Picture (Mom only)', needsPerson: true, momOnly: true },
  ], [])

  // Check if current user is primary_parent for Full Picture gating
  const isPrimaryParent = member?.role === 'primary_parent'

  const isPartnerOnly = PARTNER_ONLY_TOOLS.has(modeKey)
  const isMultiSelect = MULTI_SELECT_TOOLS.has(modeKey)
  const edgeFunctionName = TOOL_EDGE_FUNCTIONS[modeKey] || 'lila-chat'

  // ── Person selection ──────────────────────────────────────

  // Auto-select partner for Cyrano
  useEffect(() => {
    if (!isPartnerOnly || selectedPersonIds.length > 0) return
    const partner = familyMembers.find(fm =>
      fm.id !== member?.id &&
      fm.role === 'additional_adult'
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
      })
      // Store additional person IDs in context_snapshot for multi-person Higgins
      if (selectedPersonIds.length > 1) {
        await supabase.from('lila_conversations').update({
          context_snapshot: { involved_member_ids: selectedPersonIds },
        }).eq('id', conv.id)
      }
      setConversation(conv)
    }

    // Client-side crisis check (backup)
    if (detectCrisis(messageText)) {
      setStreamingContent(CRISIS_RESPONSE)
      return
    }

    setIsStreaming(true)
    setStreamingContent('')

    const extra: Record<string, unknown> = {}
    if (isDecisionGuide && activeFrameworkKey) {
      extra.framework_key = activeFrameworkKey
    }
    if (isPerspectiveShifter) {
      if (activeLensKey) extra.lens_key = activeLensKey
      if (selectedPersonIds[0]) extra.person_id = selectedPersonIds[0]
    }
    if (isMediator) {
      extra.mediation_context = mediationContext
      if (selectedPersonIds.length > 0) extra.person_ids = selectedPersonIds
    }

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
      Object.keys(extra).length > 0 ? extra : undefined,
    )
  }, [input, member, family, isStreaming, conversation, modeKey, selectedPersonIds, mode, edgeFunctionName, createConversation, queryClient, isDecisionGuide, activeFrameworkKey, isPerspectiveShifter, activeLensKey, isMediator, mediationContext])

  // Auto-send when "Suggest for me" sets input (Decision Guide)
  useEffect(() => {
    if (pendingSuggestRef.current && input.trim()) {
      pendingSuggestRef.current = false
      handleSend()
    }
  }, [input, handleSend])

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

  const handleSaveToNotepad = useCallback((content: string) => {
    if (!notepad) return
    const title = content.split('\n')[0]?.slice(0, 60) || 'From LiLa conversation'
    notepad.openNotepad({ content, title, sourceType: 'lila_conversation' as any, sourceReferenceId: conversation?.id })
    onClose()
  }, [notepad, conversation?.id, onClose])

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

  // ── Decision Guide: framework selection ────────────────────

  const handleSelectFramework = useCallback((frameworkKey: string) => {
    const fw = frameworks.find(f => f.framework_key === frameworkKey)
    if (!fw) return
    setActiveFrameworkKey(frameworkKey)
    setActiveFrameworkName(fw.display_name)
    setShowFrameworkPicker(false)
  }, [frameworks])

  const handleSwitchFramework = useCallback(() => {
    setShowFrameworkPicker(true)
  }, [])

  // ── Perspective Shifter: lens selection ────────────────────

  const handleSelectLens = useCallback((lensKey: string) => {
    const lens = lenses.find(l => l.lens_key === lensKey)
    if (!lens) return
    setActiveLensKey(lensKey)
    setActiveLensName(lens.display_name)
    setShowLensLibrary(false)
  }, [lenses])

  // ── Mediator: context mode selection ──────────────────────

  const handleMediationContextChange = useCallback((contextKey: string) => {
    setMediationContext(contextKey)
    // Clear person selection when switching to modes that don't need it
    const mode = MEDIATION_CONTEXTS.find(m => m.key === contextKey)
    if (!mode?.needsPerson) {
      setSelectedPersonIds([])
    }
  }, [MEDIATION_CONTEXTS])

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
      // ThoughtSift (PRD-34)
      decision_guide: { icon: Compass, label: 'Decision Guide', personLabel: '' },
      perspective_shifter: { icon: Brain, label: 'Perspective Shifter', personLabel: 'Whose perspective?' },
      mediator: { icon: Scale, label: 'Mediator', personLabel: 'Who is involved?' },
      board_of_directors: { icon: Brain, label: 'Board of Directors', personLabel: '' },
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
          <div className="flex items-center gap-2">
            {/* Switch Framework button for Decision Guide */}
            {isDecisionGuide && activeFrameworkKey && !isStreaming && (
              <button
                onClick={handleSwitchFramework}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <RefreshCw size={12} />
                Switch Framework
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isStreaming}
              className="p-1 disabled:opacity-50"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Active Framework Header — Decision Guide (PRD-34) */}
        {isDecisionGuide && activeFrameworkName && (
          <div
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium border-b"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
              borderColor: 'var(--color-border)',
            }}
          >
            <Compass size={14} />
            <span>Working with: {activeFrameworkName}</span>
          </div>
        )}

        {/* Mediator Context Selector — PRD-34 */}
        {isMediator && (
          <div
            className="flex items-center gap-2 px-4 py-2 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Scale size={14} style={{ color: 'var(--color-text-secondary)' }} />
            <select
              value={mediationContext}
              onChange={e => handleMediationContextChange(e.target.value)}
              disabled={isStreaming}
              className="flex-1 rounded-lg px-2 py-1.5 text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              {MEDIATION_CONTEXTS.map(ctx => {
                // Full Picture: only show for primary_parent
                if (ctx.momOnly && !isPrimaryParent) return null
                return (
                  <option key={ctx.key} value={ctx.key}>
                    {ctx.label}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        {/* Person Pill Selector — show for tools that need it, including Mediator context-dependent */}
        {(toolConfig.personLabel || (isMediator && MEDIATION_CONTEXTS.find(c => c.key === mediationContext)?.needsPerson)) && (
          <PersonPillSelector
            members={familyMembers}
            currentMemberId={member?.id || ''}
            selectedIds={selectedPersonIds}
            onToggle={handlePersonToggle}
            multiSelect={isMultiSelect || mediationContext === 'sibling_mediation'}
            partnerOnly={isPartnerOnly || mediationContext === 'spouse_partner'}
            label={isMediator
              ? (mediationContext === 'sibling_mediation' ? 'Which children?' : 'Who is involved?')
              : toolConfig.personLabel
            }
          />
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

          {/* Decision Guide: Suggest/Pick buttons after first assistant response, before framework is selected */}
          {isDecisionGuide && !activeFrameworkKey && messages.length >= 2 && !isStreaming && (
            <div className="flex gap-2 ml-7">
              <button
                onClick={() => {
                  // "Suggest for me" — inject the request and trigger send via ref
                  pendingSuggestRef.current = true
                  setInput('Suggest the best framework for my situation.')
                }}
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                Suggest for me
              </button>
              <button
                onClick={() => setShowFrameworkPicker(true)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                I'll pick my own
              </button>
            </div>
          )}

          {/* Decision Guide: Framework switch divider */}
          {isDecisionGuide && activeFrameworkName && messages.some(m =>
            m.metadata?.active_framework && m.metadata.active_framework !== activeFrameworkKey
          ) && (
            <div
              className="flex items-center gap-2 py-2 text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <div className="flex-1 border-b" style={{ borderColor: 'var(--color-border)' }} />
              <span>Switched to: {activeFrameworkName}</span>
              <div className="flex-1 border-b" style={{ borderColor: 'var(--color-border)' }} />
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

                    {/* Draft tools: Save Draft, Edit in Notepad */}
                    {DRAFT_TOOLS.has(modeKey) && (
                      <>
                        <ActionChip icon={<ClipboardCopy size={12} />} label="Save Draft" onClick={() => handleSaveDraft(msg.content)} />
                        {notepad && (
                          <ActionChip icon={<StickyNote size={12} />} label="Edit in Notepad" onClick={() => handleSaveToNotepad(msg.content)} />
                        )}
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

                    {/* ThoughtSift tools: Save to Notepad */}
                    {(['decision_guide', 'perspective_shifter', 'mediator', 'board_of_directors'].includes(modeKey)) && notepad && (
                      <ActionChip icon={<StickyNote size={12} />} label="Edit in Notepad" onClick={() => handleSaveToNotepad(msg.content)} />
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

        {/* Framework Picker Overlay — Decision Guide (PRD-34) */}
        {isDecisionGuide && showFrameworkPicker && (
          <div
            className="absolute inset-0 z-10 flex flex-col overflow-hidden rounded-xl"
            style={{ backgroundColor: 'var(--color-bg-card)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                Choose a Decision Framework
              </h3>
              <button
                onClick={() => setShowFrameworkPicker(false)}
                className="p-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {frameworks.map((fw) => (
                <button
                  key={fw.framework_key}
                  onClick={() => handleSelectFramework(fw.framework_key)}
                  className="w-full text-left rounded-lg p-3 transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: activeFrameworkKey === fw.framework_key
                      ? 'var(--color-bg-secondary)'
                      : 'transparent',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
                        {fw.display_name}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {fw.description}
                      </p>
                      <p className="mt-1 text-xs italic" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                        Best for: {fw.best_for}
                      </p>
                    </div>
                    {activeFrameworkKey === fw.framework_key && (
                      <span className="shrink-0 mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: 'var(--color-btn-primary-bg)',
                          color: 'var(--color-btn-primary-text)',
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Perspective Shifter Lens Chip Row — PRD-34 (above input) */}
        {isPerspectiveShifter && lenses.length > 0 && (
          <div
            className="flex items-center gap-1 px-4 py-2 border-t overflow-x-auto shrink-0"
            style={{ borderColor: 'var(--color-border)', scrollbarWidth: 'none' }}
          >
            <span className="text-xs shrink-0 mr-1" style={{ color: 'var(--color-text-secondary)' }}>
              Lenses:
            </span>
            {lenses.filter(l => l.lens_type !== 'family_context').slice(0, 8).map(lens => (
              <button
                key={lens.lens_key}
                onClick={() => handleSelectLens(lens.lens_key)}
                disabled={isStreaming}
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap disabled:opacity-50"
                style={{
                  backgroundColor: activeLensKey === lens.lens_key
                    ? 'var(--color-btn-primary-bg)'
                    : 'var(--color-bg-secondary)',
                  color: activeLensKey === lens.lens_key
                    ? 'var(--color-btn-primary-text)'
                    : 'var(--color-text-primary)',
                  border: `1px solid ${activeLensKey === lens.lens_key ? 'transparent' : 'var(--color-border)'}`,
                }}
              >
                {lens.display_name}
              </button>
            ))}
            {/* Family-context lenses — show with member names */}
            {familyMembers.filter(fm => fm.id !== member?.id).slice(0, 3).map(fm => (
              <button
                key={`family-${fm.id}`}
                onClick={() => {
                  setSelectedPersonIds([fm.id])
                  handleSelectLens('family_context_member')
                }}
                disabled={isStreaming}
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap disabled:opacity-50"
                style={{
                  backgroundColor: activeLensKey?.startsWith('family_context') && selectedPersonIds.includes(fm.id)
                    ? 'var(--color-btn-primary-bg)'
                    : 'var(--color-bg-secondary)',
                  color: activeLensKey?.startsWith('family_context') && selectedPersonIds.includes(fm.id)
                    ? 'var(--color-btn-primary-text)'
                    : 'var(--color-text-primary)',
                  border: `1px solid ${activeLensKey?.startsWith('family_context') && selectedPersonIds.includes(fm.id) ? 'transparent' : 'var(--color-border)'}`,
                }}
              >
                How would {fm.display_name} see this?
              </button>
            ))}
            <button
              onClick={() => setShowLensLibrary(true)}
              disabled={isStreaming}
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap disabled:opacity-50"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px dashed var(--color-border)',
              }}
            >
              + More
            </button>
          </div>
        )}

        {/* Perspective Shifter: Active Lens indicator */}
        {isPerspectiveShifter && activeLensName && (
          <div
            className="flex items-center gap-2 px-4 py-1.5 text-xs border-t"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
              borderColor: 'var(--color-border)',
            }}
          >
            <Brain size={12} />
            <span>Active lens: {activeLensName}</span>
          </div>
        )}

        {/* Perspective Shifter: Full Lens Library Overlay */}
        {isPerspectiveShifter && showLensLibrary && (
          <div
            className="absolute inset-0 z-10 flex flex-col overflow-hidden rounded-xl"
            style={{ backgroundColor: 'var(--color-bg-card)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                Choose a Lens
              </h3>
              <button onClick={() => setShowLensLibrary(false)} className="p-1" style={{ color: 'var(--color-text-secondary)' }}>
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {['simple_shift', 'named_framework', 'family_context'].map(lensType => {
                const typeLenses = lenses.filter(l => l.lens_type === lensType)
                if (typeLenses.length === 0 && lensType !== 'family_context') return null
                const typeLabel = lensType === 'simple_shift' ? 'Simple Angle Shifts'
                  : lensType === 'named_framework' ? 'Named Framework Lenses'
                  : 'Family-Context Lenses'
                return (
                  <div key={lensType}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {typeLabel}
                    </h4>
                    <div className="space-y-1.5">
                      {lensType === 'family_context' ? (
                        familyMembers.filter(fm => fm.id !== member?.id).map(fm => (
                          <button
                            key={fm.id}
                            onClick={() => {
                              setSelectedPersonIds([fm.id])
                              handleSelectLens('family_context_member')
                              setShowLensLibrary(false)
                            }}
                            className="w-full text-left rounded-lg p-2.5 transition-colors hover:opacity-90"
                            style={{ border: '1px solid var(--color-border)' }}
                          >
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
                              How would {fm.display_name} see this?
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                              Uses {fm.display_name}'s context from Archives and InnerWorkings
                            </p>
                          </button>
                        ))
                      ) : (
                        typeLenses.map(lens => (
                          <button
                            key={lens.lens_key}
                            onClick={() => { handleSelectLens(lens.lens_key); setShowLensLibrary(false) }}
                            className="w-full text-left rounded-lg p-2.5 transition-colors hover:opacity-90"
                            style={{
                              backgroundColor: activeLensKey === lens.lens_key ? 'var(--color-bg-secondary)' : 'transparent',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
                              {lens.display_name}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                              {lens.description}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
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
