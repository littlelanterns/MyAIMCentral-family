/**
 * BoardOfDirectorsModal — PRD-34 Phase 34C
 *
 * Custom group-chat conversation UI for the Board of Directors tool.
 * NOT a standard ToolConversationModal — has:
 * - Board assembly bar with persona chips
 * - Sequential multi-advisor attributed responses
 * - Persona selector bottom sheet
 * - Prayer Seat cards
 * - Content policy gate (Haiku pre-screen)
 * - Disclaimer tracking (once per session)
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Mic, Loader, Copy, FileText, Plus, UserMinus, Star, StarOff, Search, Users, ChevronRight, Brain } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
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
import { LilaAvatar } from './LilaAvatar'
import { supabase } from '@/lib/supabase/client'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { FEATURE_FLAGS } from '@/config/featureFlags'

const MAX_ADVISORS = 5

interface Persona {
  id: string
  persona_name: string
  personality_profile: Record<string, unknown>
  persona_type: string
  category: string | null
  is_public: boolean
}

interface BoardOfDirectorsModalProps {
  onClose: () => void
}

// ── Streaming helper for BoD (handles multi-advisor SSE) ────

interface StreamEvent {
  type: 'advisor_start' | 'chunk' | 'advisor_end' | 'moderator_start' | 'prayer_seat' | string
  content?: string
  persona_id?: string
  persona_name?: string
  source?: string
}

async function streamBoDChat(
  conversationId: string,
  content: string,
  onEvent: (event: StreamEvent) => void,
  onDone: () => void,
  onError: (error: string) => void,
) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) { onError('Not authenticated'); return }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/lila-board-of-directors`, {
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

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const json = await response.json()
      if (json.crisis) onEvent({ type: 'chunk', content: json.response, source: 'crisis' })
      onDone()
      return
    }

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
        try { onEvent(JSON.parse(data)) } catch { /* skip */ }
      }
    }
    onDone()
  } catch (err) { onError(String(err)) }
}

// ── Edge Function calls for actions ──────────────────────────

async function callBoD(conversationId: string, action: string, payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const res = await fetch(`${supabaseUrl}/functions/v1/lila-board-of-directors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ conversation_id: conversationId, action, ...payload }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── Main Component ───────────────────────────────────────────

export function BoardOfDirectorsModal({ onClose }: BoardOfDirectorsModalProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: mode } = useGuidedMode('board_of_directors')
  const createConversation = useCreateConversation()
  const queryClient = useQueryClient()

  const [conversation, setConversation] = useState<LilaConversation | null>(null)
  const [boardSessionId, setBoardSessionId] = useState<string | null>(null)
  const { data: messages = [] } = useLilaMessages(conversation?.id)

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingChunks, setStreamingChunks] = useState<Array<{ personaName: string | null; content: string }>>([])
  const [_currentStreamPersona, setCurrentStreamPersona] = useState<string | null>(null)

  const [seatedPersonas, setSeatedPersonas] = useState<Persona[]>([])
  const [showPersonaSelector, setShowPersonaSelector] = useState(false)
  const [showCreatePersona, setShowCreatePersona] = useState(false)
  const [openingMessage, setOpeningMessage] = useState<string | null>(null)

  // Persona selector state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Persona[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [allPersonas, setAllPersonas] = useState<Persona[]>([])
  const [_recentPersonaIds, _setRecentPersonaIds] = useState<string[]>([])

  // Create persona state
  const [newName, setNewName] = useState('')
  const [newRelationship, setNewRelationship] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creatingPersona, setCreatingPersona] = useState(false)
  const [policyMessage, setPolicyMessage] = useState<string | null>(null)

  // Prayer seat state
  const [prayerQuestions, setPrayerQuestions] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    state: voiceState,
    duration: _voiceDuration,
    interimText,
    startRecording,
    stopRecording,
    isSupported: voiceSupported,
  } = useVoiceInput()

  // ── Load personas and favorites ──────────────────────────

  useEffect(() => {
    supabase.from('board_personas')
      .select('id, persona_name, personality_profile, persona_type, category, is_public')
      .or('is_public.eq.true,persona_type.eq.system_preloaded')
      .eq('content_policy_status', 'approved')
      .order('usage_count', { ascending: false })
      .then(({ data }) => { if (data) setAllPersonas(data as Persona[]) })
  }, [])

  useEffect(() => {
    if (!member) return
    supabase.from('persona_favorites')
      .select('persona_id')
      .eq('member_id', member.id)
      .then(({ data }) => { if (data) setFavorites(data.map(f => f.persona_id)) })
  }, [member])

  // ── Opening message ──────────────────────────────────────

  useEffect(() => {
    if (messages.length > 0 || !mode) return
    const openers = mode.opening_messages || []
    if (openers.length > 0) {
      setOpeningMessage(openers[Math.floor(Math.random() * openers.length)] as string)
    }
  }, [mode, messages.length])

  // ── Scroll ───────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingChunks])

  useEffect(() => {
    if (voiceState === 'recording' && interimText) setInput(interimText)
  }, [interimText, voiceState])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) { if (e.key === 'Escape' && !isStreaming) onClose() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, isStreaming])

  // ── Search personas ──────────────────────────────────────

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const q = searchQuery.toLowerCase()
    const results = allPersonas.filter(p =>
      p.persona_name.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    )
    setSearchResults(results)
  }, [searchQuery, allPersonas])

  // ── Seat / unseat persona ────────────────────────────────

  const seatPersona = useCallback(async (persona: Persona) => {
    if (seatedPersonas.length >= MAX_ADVISORS) return
    if (seatedPersonas.some(p => p.id === persona.id)) return

    setSeatedPersonas(prev => [...prev, persona])
    setShowPersonaSelector(false)

    // Persist to board_session_personas if session exists
    if (boardSessionId) {
      await supabase.from('board_session_personas').insert({
        board_session_id: boardSessionId,
        persona_id: persona.id,
        seat_order: seatedPersonas.length + 1,
      })
    }
  }, [seatedPersonas, boardSessionId])

  const unseatPersona = useCallback(async (personaId: string) => {
    setSeatedPersonas(prev => prev.filter(p => p.id !== personaId))
    if (boardSessionId) {
      await supabase.from('board_session_personas')
        .update({ removed_at: new Date().toISOString() })
        .eq('board_session_id', boardSessionId)
        .eq('persona_id', personaId)
    }
  }, [boardSessionId])

  // ── Toggle favorite ──────────────────────────────────────

  const toggleFavorite = useCallback(async (personaId: string) => {
    if (!member) return
    if (favorites.includes(personaId)) {
      setFavorites(prev => prev.filter(id => id !== personaId))
      await supabase.from('persona_favorites').delete().eq('member_id', member.id).eq('persona_id', personaId)
    } else {
      setFavorites(prev => [...prev, personaId])
      await supabase.from('persona_favorites').insert({ member_id: member.id, persona_id: personaId })
    }
  }, [member, favorites])

  // ── Create persona ───────────────────────────────────────

  const handleCreatePersona = useCallback(async () => {
    if (!newName.trim() || !conversation || !member || !family) return
    setCreatingPersona(true)
    setPolicyMessage(null)

    try {
      // Step 1: Content policy check (Haiku — always, for ALL persona types)
      const policyResult = await callBoD(conversation.id, 'content_policy_check', {
        name: newName.trim(),
        description: newDescription.trim(),
      })

      if (policyResult.outcome === 'deity') {
        setPolicyMessage(policyResult.message)
        // Generate prayer seat questions
        const situationText = messages.filter(m => m.role === 'user').map(m => m.content).join(' ')
        const prayerResult = await callBoD(conversation.id, 'generate_prayer_seat', {
          situation: situationText || 'a decision they are working through',
          deity_name: policyResult.deityName || newName.trim(),
        })
        setPrayerQuestions(prayerResult.questions || [])
        setCreatingPersona(false)
        return
      }

      if (policyResult.outcome === 'blocked') {
        setPolicyMessage(policyResult.message)
        setCreatingPersona(false)
        return
      }

      if (policyResult.outcome === 'harmful_description') {
        setPolicyMessage(policyResult.message)
        setCreatingPersona(false)
        return
      }

      // Step 2: Generate persona (Sonnet)
      const result = await callBoD(conversation.id, 'create_persona', {
        name: newName.trim(),
        description: newDescription.trim(),
        relationship: newRelationship || 'advisor',
        follow_up: '', // Could add follow-up Q later
        persona_type: 'personal_custom',
        family_id: family.id,
        member_id: member.id,
      })

      if (result.persona) {
        seatPersona(result.persona)
        setShowCreatePersona(false)
        setNewName('')
        setNewDescription('')
        setNewRelationship('')
      }
    } catch (err) {
      console.error('Create persona error:', err)
      setPolicyMessage('Something went wrong creating this advisor. Please try again.')
    } finally {
      setCreatingPersona(false)
    }
  }, [newName, newDescription, newRelationship, conversation, member, family, messages, seatPersona])

  // ── Add prayer seat to board ─────────────────────────────

  const addPrayerSeat = useCallback(async () => {
    if (!boardSessionId || !conversation) return
    // Create a placeholder persona record for the prayer seat
    const { data: prayerPersona } = await supabase.from('board_personas').insert({
      persona_name: 'Reflection Seat',
      persona_type: 'personal_custom',
      personality_profile: {},
      content_policy_status: 'approved',
      is_public: false,
      created_by: member?.id,
      family_id: family?.id,
    }).select().single()

    if (prayerPersona) {
      await supabase.from('board_session_personas').insert({
        board_session_id: boardSessionId,
        persona_id: prayerPersona.id,
        seat_order: seatedPersonas.length + 1,
        is_prayer_seat: true,
      })
      // Store prayer questions in conversation context_snapshot
      const { data: conv } = await supabase.from('lila_conversations').select('context_snapshot').eq('id', conversation.id).single()
      await supabase.from('lila_conversations').update({
        context_snapshot: { ...(conv?.context_snapshot || {}), prayer_questions: prayerQuestions },
      }).eq('id', conversation.id)
    }

    setPrayerQuestions([])
    setPolicyMessage(null)
    setShowCreatePersona(false)
  }, [boardSessionId, conversation, member, family, seatedPersonas, prayerQuestions])

  // ── Voice ────────────────────────────────────────────────

  const handleVoiceMic = useCallback(async () => {
    if (voiceState === 'recording') {
      const transcribed = await stopRecording()
      if (transcribed) setInput(prev => prev ? prev + ' ' + transcribed : transcribed)
    } else if (voiceState === 'idle') {
      setInput('')
      await startRecording()
    }
  }, [voiceState, stopRecording, startRecording])

  // ── Send message ─────────────────────────────────────────

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
        guided_mode: 'board_of_directors',
        guided_subtype: 'board_of_directors',
        container_type: 'modal',
        model_used: 'sonnet',
      })
      setConversation(conv)

      // Create board_session
      const { data: bs } = await supabase.from('board_sessions').insert({
        conversation_id: conv.id,
        family_id: family.id,
        member_id: member.id,
      }).select().single()
      if (bs) {
        setBoardSessionId(bs.id)
        // Seat any pre-selected personas
        for (let i = 0; i < seatedPersonas.length; i++) {
          await supabase.from('board_session_personas').insert({
            board_session_id: bs.id,
            persona_id: seatedPersonas[i].id,
            seat_order: i + 1,
          })
        }
      }
    }

    if (detectCrisis(messageText)) {
      setStreamingChunks([{ personaName: null, content: CRISIS_RESPONSE }])
      return
    }

    setIsStreaming(true)
    setStreamingChunks([])
    setCurrentStreamPersona(null)

    await streamBoDChat(
      conv.id,
      messageText,
      (event) => {
        if (event.type === 'advisor_start') {
          setCurrentStreamPersona(event.persona_name || null)
          setStreamingChunks(prev => [...prev, { personaName: event.persona_name || null, content: '' }])
        } else if (event.type === 'chunk') {
          setStreamingChunks(prev => {
            const updated = [...prev]
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + (event.content || ''),
              }
            } else {
              updated.push({ personaName: event.source === 'lila' ? 'LiLa' : (event.persona_name || null), content: event.content || '' })
            }
            return updated
          })
        } else if (event.type === 'advisor_end') {
          // advisor done, next one will start fresh
        } else if (event.type === 'moderator_start') {
          setCurrentStreamPersona('LiLa')
          setStreamingChunks(prev => [...prev, { personaName: 'LiLa', content: '' }])
        } else if (event.type === 'prayer_seat') {
          setStreamingChunks(prev => [...prev, { personaName: 'Reflection', content: event.content || '' }])
        }
      },
      () => {
        setIsStreaming(false)
        setStreamingChunks([])
        setCurrentStreamPersona(null)
        queryClient.invalidateQueries({ queryKey: ['lila-messages', conv!.id] })
      },
      (error) => {
        console.error('BoD streaming error:', error)
        setIsStreaming(false)
        setStreamingChunks([{ personaName: 'LiLa', content: 'I had trouble with that. Want to try again?' }])
      },
    )
  }, [input, member, family, isStreaming, conversation, seatedPersonas, createConversation, queryClient])

  // ── Copy handler ─────────────────────────────────────────

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content).catch(() => {})
  }, [])

  // ── Render ───────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !isStreaming && onClose()} />

      {/* Modal */}
      <div
        className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[850px] md:max-h-[88vh] z-50 flex flex-col md:rounded-xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <LilaAvatar avatarKey="sitting" size={20} />
            <Brain size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>Board of Directors</span>
          </div>
          <button onClick={onClose} disabled={isStreaming} className="p-1 disabled:opacity-50" style={{ color: 'var(--color-text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Board Assembly Bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b overflow-x-auto shrink-0" style={{ borderColor: 'var(--color-border)', scrollbarWidth: 'none' }}>
          <span className="text-xs shrink-0" style={{ color: 'var(--color-text-secondary)' }}>Your Board:</span>
          {seatedPersonas.map(persona => (
            <div key={persona.id} className="group relative shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
            >
              <span>{persona.persona_name}</span>
              <button
                onClick={() => unseatPersona(persona.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                style={{ color: 'var(--color-text-secondary)' }}
                title="Remove from board"
              >
                <UserMinus size={10} />
              </button>
            </div>
          ))}
          {seatedPersonas.length < MAX_ADVISORS ? (
            <button
              onClick={() => setShowPersonaSelector(true)}
              disabled={isStreaming}
              className="shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50"
              style={{ border: '1px dashed var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              <Plus size={12} /> Add
            </button>
          ) : (
            <span className="text-xs italic shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
              5 seats filled
            </span>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* Opening message */}
          {messages.length === 0 && openingMessage && !isStreaming && (
            <div className="flex gap-2">
              <LilaAvatar avatarKey="sitting" size={16} className="mt-1" />
              <div className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
                <p>{openingMessage}</p>
              </div>
            </div>
          )}

          {/* Rendered messages */}
          {messages.map((msg, _i) => {
            const meta = (msg.metadata || {}) as Record<string, string | boolean | undefined>
            const isAdvisor = !!meta.persona_name && meta.source !== 'lila_moderator'
            const isLila = meta.source === 'lila_moderator' || !!meta.suggest_board
            const showDiscl = meta.show_disclaimer === true

            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="rounded-lg px-3 py-2 text-sm max-w-[80%]" style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}>
                    {msg.content}
                  </div>
                </div>
              )
            }

            return (
              <div key={msg.id} className="space-y-1">
                {/* Advisor attribution */}
                {isAdvisor && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                    <Users size={12} />
                    {String(meta.persona_name || '')}:
                  </div>
                )}
                {isLila && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <LilaAvatar avatarKey="sitting" size={12} />
                    LiLa:
                  </div>
                )}
                <div className="rounded-lg px-3 py-2 text-sm ml-4" style={{
                  backgroundColor: isLila ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {/* Disclaimer — once per session */}
                  {showDiscl && (
                    <p className="mt-2 text-xs italic" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                      This is an AI interpretation of {String(meta.persona_name || '')} based on publicly available writings and known positions. Not endorsed by or affiliated with {String(meta.persona_name || '')}. For the real thing, read their actual work.
                    </p>
                  )}
                </div>
                {/* Action chips */}
                {msg.role === 'assistant' && !isStreaming && (
                  <div className="flex gap-1.5 ml-4">
                    <button onClick={() => handleCopy(msg.content)} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                      <Copy size={10} /> Copy
                    </button>
                    <button onClick={() => handleCopy(msg.content)} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                      <FileText size={10} /> Save to Notepad
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* Streaming chunks */}
          {isStreaming && streamingChunks.map((chunk, i) => (
            <div key={`stream-${i}`} className="space-y-1">
              {chunk.personaName && (
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                  {chunk.personaName === 'LiLa' ? <LilaAvatar avatarKey="sitting" size={12} /> : <Users size={12} />}
                  {chunk.personaName}:
                </div>
              )}
              <div className="rounded-lg px-3 py-2 text-sm ml-4" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
                <p className="whitespace-pre-wrap">{chunk.content || '...'}</p>
              </div>
            </div>
          ))}

          {isStreaming && streamingChunks.length === 0 && (
            <div className="flex items-center gap-2">
              <LilaAvatar avatarKey="sitting" size={16} />
              <span className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>LiLa is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Persona Selector Overlay */}
        {showPersonaSelector && (
          <div className="absolute inset-0 z-10 flex flex-col overflow-hidden rounded-xl" style={{ backgroundColor: 'var(--color-bg-card)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>Add to Your Board</h3>
              <button onClick={() => { setShowPersonaSelector(false); setShowCreatePersona(false); setPolicyMessage(null); setPrayerQuestions([]) }} className="p-1" style={{ color: 'var(--color-text-secondary)' }}><X size={16} /></button>
            </div>

            {showCreatePersona ? (
              /* Create Persona Form */
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {policyMessage && (
                  <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                    <p>{policyMessage}</p>
                    {prayerQuestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Reflection questions for prayer:</p>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                          {prayerQuestions.map((q, i) => <li key={i}>{q}</li>)}
                        </ol>
                        <div className="flex gap-2 mt-2">
                          <button onClick={addPrayerSeat} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}>
                            Add to Board as Reflection Seat
                          </button>
                          <button onClick={() => handleCopy(prayerQuestions.join('\n'))} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                            Save to Journal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!prayerQuestions.length && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Who do you want at your table?" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Who is this person to you?</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['My grandmother', 'A mentor', 'A pastor/spiritual leader', 'A friend', 'A fictional character', 'Other'].map(rel => (
                          <button key={rel} onClick={() => setNewRelationship(rel)}
                            className="rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: newRelationship === rel ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
                              color: newRelationship === rel ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                              border: `1px solid ${newRelationship === rel ? 'transparent' : 'var(--color-border)'}`,
                            }}
                          >{rel}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Describe them</label>
                      <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={3} placeholder="How do they think, talk, and give advice? What matters most to them?" className="w-full rounded-lg border px-3 py-2 text-sm resize-none" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }} />
                    </div>
                    <button onClick={handleCreatePersona} disabled={!newName.trim() || creatingPersona}
                      className="w-full rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                      style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
                    >
                      {creatingPersona ? <span className="flex items-center justify-center gap-2"><Loader size={14} className="animate-spin" /> Creating...</span> : 'Create Advisor'}
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* Persona Browser */
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search for a person, character, or archetype..." className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }} />
                </div>

                {/* Search results */}
                {searchQuery.trim() && (
                  <div className="space-y-1">
                    {searchResults.length > 0 ? searchResults.map(p => (
                      <PersonaRow key={p.id} persona={p} isFavorite={favorites.includes(p.id)} isSeated={seatedPersonas.some(s => s.id === p.id)} onSeat={() => seatPersona(p)} onToggleFav={() => toggleFavorite(p.id)} />
                    )) : (
                      <div className="text-sm py-2" style={{ color: 'var(--color-text-secondary)' }}>
                        No match for "{searchQuery}".{' '}
                        <button onClick={() => { setNewName(searchQuery); setShowCreatePersona(true) }} className="underline font-medium" style={{ color: 'var(--color-btn-primary-bg)' }}>
                          Want me to create them?
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!searchQuery.trim() && (
                  <>
                    {/* Favorites */}
                    {favorites.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Your Favorites</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {allPersonas.filter(p => favorites.includes(p.id)).map(p => (
                            <button key={p.id} onClick={() => seatPersona(p)} disabled={seatedPersonas.some(s => s.id === p.id)}
                              className="rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-40"
                              style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                            >{p.persona_name}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Platform Library by category */}
                    {['historical', 'literary', 'faith_leader', 'thinker', 'parenting', 'business'].map(cat => {
                      const catPersonas = allPersonas.filter(p => p.category === cat)
                      if (catPersonas.length === 0) return null
                      const catLabel = cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                      return (
                        <div key={cat}>
                          <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{catLabel}</h4>
                          <div className="space-y-1">
                            {catPersonas.map(p => (
                              <PersonaRow key={p.id} persona={p} isFavorite={favorites.includes(p.id)} isSeated={seatedPersonas.some(s => s.id === p.id)} onSeat={() => seatPersona(p)} onToggleFav={() => toggleFavorite(p.id)} />
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    {/* Create Custom */}
                    <button onClick={() => setShowCreatePersona(true)} className="w-full flex items-center justify-between rounded-lg p-3 text-sm font-medium" style={{ border: '1px dashed var(--color-border)', color: 'var(--color-text-primary)' }}>
                      <span>Create someone personal to you</span>
                      <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          {FEATURE_FLAGS.ENABLE_VOICE_INPUT && voiceSupported && (
            <button type="button" onClick={handleVoiceMic} disabled={voiceState === 'transcribing' || isStreaming}
              className="p-2 rounded-lg transition-colors"
              style={{ background: voiceState === 'recording' ? 'rgba(220,38,38,0.12)' : 'transparent', color: voiceState === 'recording' ? 'var(--color-error, #dc2626)' : 'var(--color-text-secondary)' }}
            >
              {voiceState === 'transcribing' ? <Loader size={16} className="animate-spin" /> : <Mic size={16} />}
            </button>
          )}
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder={voiceState === 'recording' ? 'Listening...' : 'Type a message...'} disabled={isStreaming || voiceState === 'transcribing'} className="flex-1 px-3 py-2 rounded-lg text-sm disabled:opacity-50" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          <button onClick={handleSend} disabled={!input.trim() || isStreaming} className="p-2 rounded-lg disabled:opacity-50" style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

// ── Persona Row component ────────────────────────────────────

function PersonaRow({
  persona,
  isFavorite,
  isSeated,
  onSeat,
  onToggleFav,
}: {
  persona: Persona
  isFavorite: boolean
  isSeated: boolean
  onSeat: () => void
  onToggleFav: () => void
}) {
  const profile = persona.personality_profile as { known_for?: string; traits?: string[] }

  return (
    <div className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:opacity-90" style={{ border: '1px solid var(--color-border)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-heading)' }}>{persona.persona_name}</p>
        <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
          {profile.known_for || (profile.traits || []).slice(0, 3).join(', ')}
        </p>
      </div>
      <button onClick={onToggleFav} className="p-1 shrink-0" style={{ color: isFavorite ? 'var(--color-sparkle-gold, #D4AF37)' : 'var(--color-text-secondary)' }}>
        {isFavorite ? <Star size={14} /> : <StarOff size={14} />}
      </button>
      <button onClick={onSeat} disabled={isSeated} className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-40" style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}>
        {isSeated ? 'Seated' : 'Seat'}
      </button>
    </div>
  )
}
