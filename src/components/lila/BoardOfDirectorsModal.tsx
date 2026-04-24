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
import { X, Send, Mic, Loader, Copy, FileText, Plus, UserMinus, Star, StarOff, Search, Users, ChevronRight, Brain, RefreshCw, Check, Edit3 } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useQueryClient } from '@tanstack/react-query'
import {
  useLilaMessages,
  useCreateConversation,
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
  /**
   * Three-tier source marker per Convention #258 two-column polymorphism:
   *   tier1 → board_session_personas.persona_id (personal_custom, public schema)
   *   tier3 → board_session_personas.platform_persona_id (approved shared cache)
   */
  _source?: 'tier1' | 'tier3'
}

interface PersonalityProfile {
  traits?: string[]
  philosophies?: string[]
  communication_style?: string
  reasoning_patterns?: string
  characteristic_language?: string[]
  known_for?: string
}

interface PreviewState {
  name: string
  description: string
  relationship: string
  follow_up: string
  profile: PersonalityProfile
  classifier: { multi_family_relevance: string; confidence: number } | null
}

interface BoardOfDirectorsModalProps {
  onClose: () => void
  existingConversation?: LilaConversation | null
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

export function BoardOfDirectorsModal({ onClose, existingConversation }: BoardOfDirectorsModalProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const createConversation = useCreateConversation()
  const queryClient = useQueryClient()

  const [conversation, setConversation] = useState<LilaConversation | null>(existingConversation || null)
  const [boardSessionId, setBoardSessionId] = useState<string | null>(null)
  const { data: messages = [] } = useLilaMessages(conversation?.id)

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingChunks, setStreamingChunks] = useState<Array<{ personaName: string | null; content: string }>>([])
  const [_currentStreamPersona, setCurrentStreamPersona] = useState<string | null>(null)

  const [seatedPersonas, setSeatedPersonas] = useState<Persona[]>([])
  const [showPersonaSelector, setShowPersonaSelector] = useState(false)
  const [showCreatePersona, setShowCreatePersona] = useState(false)

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

  // HITM gate (SCOPE-8a.F5): preview → review → commit cycle
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [reviewEditing, setReviewEditing] = useState(false)

  // Moderator interjection opt-in toggle (SCOPE-4.F7). Default off.
  const [moderatorEnabled, setModeratorEnabled] = useState(false)

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

  // ── Load personas from both tiers ─────────────────────────
  // Convention #258: Tier-3 approved shared cache lives in
  // platform_intelligence and is exposed via list_approved_personas RPC;
  // Tier-1 personal_custom lives in public.board_personas, family-scoped by RLS.

  useEffect(() => {
    if (!family) return
    async function load() {
      const [tier3, tier1] = await Promise.all([
        supabase.rpc('list_approved_personas'),
        supabase.from('board_personas')
          .select('id, persona_name, personality_profile, persona_type, category, is_public')
          .eq('family_id', family!.id),
      ])
      const merged: Persona[] = []
      if (tier3.data) {
        for (const p of tier3.data as Persona[]) merged.push({ ...p, _source: 'tier3' })
      }
      if (tier1.data) {
        for (const p of tier1.data as Persona[]) merged.push({ ...p, _source: 'tier1' })
      }
      setAllPersonas(merged)
    }
    load().catch(err => console.error('Load personas failed:', err))
  }, [family])

  useEffect(() => {
    if (!member) return
    supabase.from('persona_favorites')
      .select('persona_id, platform_persona_id')
      .eq('member_id', member.id)
      .then(({ data }) => {
        if (data) {
          const favs: string[] = []
          for (const row of data) {
            if (row.persona_id) favs.push(row.persona_id)
            if (row.platform_persona_id) favs.push(row.platform_persona_id)
          }
          setFavorites(favs)
        }
      })
  }, [member])

  // Load moderator preference from family_members.preferences (SCOPE-4.F7)
  useEffect(() => {
    if (!member) return
    const prefs = (member.preferences || {}) as Record<string, unknown>
    setModeratorEnabled(prefs.moderator_interjections_enabled === true)
  }, [member])

  const toggleModerator = useCallback(async () => {
    if (!member) return
    const next = !moderatorEnabled
    setModeratorEnabled(next)
    const prefs = { ...(member.preferences as Record<string, unknown> || {}), moderator_interjections_enabled: next }
    await supabase.from('family_members').update({ preferences: prefs }).eq('id', member.id)
  }, [member, moderatorEnabled])

  // Static intro (replaces AI opening messages)

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

    // Dual-column write per Convention #258. Fallback for personas without
    // _source marker: derive from persona_type.
    const source: 'tier1' | 'tier3' = persona._source
      ? persona._source
      : persona.persona_type === 'personal_custom' ? 'tier1' : 'tier3'

    if (boardSessionId) {
      await supabase.from('board_session_personas').insert({
        board_session_id: boardSessionId,
        persona_id: source === 'tier1' ? persona.id : null,
        platform_persona_id: source === 'tier3' ? persona.id : null,
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
        .or(`persona_id.eq.${personaId},platform_persona_id.eq.${personaId}`)
    }
  }, [boardSessionId])

  // ── Toggle favorite ──────────────────────────────────────

  const toggleFavorite = useCallback(async (personaId: string) => {
    if (!member) return
    const existing = allPersonas.find(p => p.id === personaId)
    const source: 'tier1' | 'tier3' = existing?._source
      ? existing._source
      : existing?.persona_type === 'personal_custom' ? 'tier1' : 'tier3'

    if (favorites.includes(personaId)) {
      setFavorites(prev => prev.filter(id => id !== personaId))
      await supabase.from('persona_favorites').delete().eq('member_id', member.id)
        .or(`persona_id.eq.${personaId},platform_persona_id.eq.${personaId}`)
    } else {
      setFavorites(prev => [...prev, personaId])
      await supabase.from('persona_favorites').insert({
        member_id: member.id,
        persona_id: source === 'tier1' ? personaId : null,
        platform_persona_id: source === 'tier3' ? personaId : null,
      })
    }
  }, [member, favorites, allPersonas])

  // ── Create persona ───────────────────────────────────────

  // SCOPE-8a.F5 HITM: preview → review → commit. generate_persona_preview
  // does all pipeline steps but NO DB writes. Server returns phase:
  //   silent_seat  → auto-seat existing Tier-3 persona
  //   suggest      → show suggestion card (near-miss)
  //   blocked      → show policy message (harm-screen rejected)
  //   preview      → show review panel with Edit/Approve/Regenerate/Reject
  const handleGeneratePreview = useCallback(async () => {
    if (!newName.trim() || !conversation || !member || !family) return
    setCreatingPersona(true)
    setPolicyMessage(null)
    setPreview(null)

    try {
      const result = await callBoD(conversation.id, 'generate_persona_preview', {
        name: newName.trim(),
        description: newDescription.trim(),
        relationship: newRelationship || 'advisor',
        follow_up: '',
      })

      if (result.crisis) {
        setPolicyMessage(result.response || 'If you are in crisis, please reach out to 988.')
        return
      }

      if (result.phase === 'silent_seat' && result.persona) {
        seatPersona({ ...result.persona, _source: 'tier3' })
        setShowCreatePersona(false)
        setNewName(''); setNewDescription(''); setNewRelationship('')
        return
      }

      if (result.phase === 'suggest' && result.suggestion) {
        setPolicyMessage(
          `We already have ${result.suggestion.persona_name} in the library. Seat them, or keep going to create a fresh version.`,
        )
        return
      }

      if (result.phase === 'blocked' && result.policy) {
        const policy = result.policy as { outcome: string; message?: string; deityName?: string }
        setPolicyMessage(policy.message || 'That request does not fit the platform.')
        if (policy.outcome === 'deity') {
          const situationText = messages.filter(m => m.role === 'user').map(m => m.content).join(' ')
          const prayerResult = await callBoD(conversation.id, 'generate_prayer_seat', {
            situation: situationText || 'a decision they are working through',
            deity_name: policy.deityName || newName.trim(),
          })
          setPrayerQuestions(prayerResult.questions || [])
        }
        return
      }

      if (result.phase === 'preview' && result.profile) {
        setPreview({
          name: newName.trim(),
          description: newDescription.trim(),
          relationship: newRelationship || 'advisor',
          follow_up: '',
          profile: result.profile as PersonalityProfile,
          classifier: result.classifier || null,
        })
      }
    } catch (err) {
      console.error('Preview error:', err)
      setPolicyMessage('Something went wrong drafting this advisor. Please try again.')
    } finally {
      setCreatingPersona(false)
    }
  }, [newName, newDescription, newRelationship, conversation, member, family, messages, seatPersona])

  const handleRegeneratePreview = useCallback(async () => {
    if (!preview || !conversation) return
    setCreatingPersona(true)
    try {
      const result = await callBoD(conversation.id, 'regenerate_persona', {
        name: preview.name,
        description: preview.description,
        relationship: preview.relationship,
        follow_up: preview.follow_up,
      })
      if (result.crisis) {
        setPolicyMessage(result.response || 'If you are in crisis, please reach out to 988.')
        setPreview(null)
        return
      }
      if (result.phase === 'preview' && result.profile) {
        setPreview({ ...preview, profile: result.profile as PersonalityProfile })
      }
    } catch (err) {
      console.error('Regenerate error:', err)
      setPolicyMessage('Regeneration failed. Please try again.')
    } finally {
      setCreatingPersona(false)
    }
  }, [preview, conversation])

  const handleCommitPersona = useCallback(async () => {
    if (!preview || !conversation || !member || !family) return
    setCreatingPersona(true)
    try {
      const result = await callBoD(conversation.id, 'commit_persona', {
        name: preview.name,
        description: preview.description,
        relationship: preview.relationship,
        follow_up: preview.follow_up,
        profile: preview.profile,
        classifier: preview.classifier,
        family_id: family.id,
        member_id: member.id,
      })
      if (result.crisis) {
        setPolicyMessage(result.response || 'If you are in crisis, please reach out to 988.')
        return
      }
      if (result.policy) {
        setPolicyMessage(result.policy.message || 'That request does not fit the platform.')
        return
      }
      if (result.persona) {
        seatPersona({ ...result.persona, _source: 'tier1' })
        setShowCreatePersona(false)
        setPreview(null)
        setReviewEditing(false)
        setNewName(''); setNewDescription(''); setNewRelationship('')
      }
    } catch (err) {
      console.error('Commit error:', err)
      setPolicyMessage('Commit failed. Please try again.')
    } finally {
      setCreatingPersona(false)
    }
  }, [preview, conversation, member, family, seatPersona])

  const handleRejectPreview = useCallback(() => {
    setPreview(null)
    setReviewEditing(false)
  }, [])

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
        data-testid="board-of-directors-modal"
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
          <div className="flex items-center gap-3">
            {/* SCOPE-4.F7: moderator interjection opt-in toggle. Default off. */}
            <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--color-text-secondary)' }} title="When on, LiLa offers a brief synthesis between advisor rounds.">
              <input type="checkbox" checked={moderatorEnabled} onChange={toggleModerator} className="accent-current" />
              <span>LiLa synthesis</span>
            </label>
            <button onClick={onClose} disabled={isStreaming} className="p-1 disabled:opacity-50" style={{ color: 'var(--color-text-secondary)' }}>
              <X size={18} />
            </button>
          </div>
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
          {/* Static intro card */}
          {messages.length === 0 && !isStreaming && (
            <div
              className="rounded-xl px-4 py-3 text-sm space-y-2"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              <p>Seat your advisors, then share what you are working through. Each advisor will respond from their own perspective.</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Try something like: <span className="italic">&ldquo;I am thinking about starting a business — is this the right time?&rdquo;</span>
              </p>
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

                {/* HITM Review Panel (SCOPE-8a.F5) */}
                {preview && !prayerQuestions.length && (
                  <div className="space-y-3 rounded-lg p-3" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                        Review {preview.name}
                      </h4>
                      <button onClick={() => setReviewEditing(v => !v)} className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <Edit3 size={12} /> {reviewEditing ? 'Done editing' : 'Edit'}
                      </button>
                    </div>
                    <p className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
                      LiLa drafted this advisor. Review before seating — edit anything that doesn't sound right, regenerate for a different take, or approve to add them to your board.
                    </p>
                    <div className="space-y-2 text-sm">
                      <PreviewField label="Known for" value={preview.profile.known_for || ''} editing={reviewEditing} onChange={(v) => setPreview(p => p ? { ...p, profile: { ...p.profile, known_for: v } } : p)} />
                      <PreviewField label="Communication style" value={preview.profile.communication_style || ''} editing={reviewEditing} multiline onChange={(v) => setPreview(p => p ? { ...p, profile: { ...p.profile, communication_style: v } } : p)} />
                      <PreviewField label="Reasoning patterns" value={preview.profile.reasoning_patterns || ''} editing={reviewEditing} multiline onChange={(v) => setPreview(p => p ? { ...p, profile: { ...p.profile, reasoning_patterns: v } } : p)} />
                      <PreviewListField label="Traits" values={preview.profile.traits || []} editing={reviewEditing} onChange={(v) => setPreview(p => p ? { ...p, profile: { ...p.profile, traits: v } } : p)} />
                      <PreviewListField label="Philosophies" values={preview.profile.philosophies || []} editing={reviewEditing} onChange={(v) => setPreview(p => p ? { ...p, profile: { ...p.profile, philosophies: v } } : p)} />
                      <PreviewListField label="Characteristic language" values={preview.profile.characteristic_language || []} editing={reviewEditing} onChange={(v) => setPreview(p => p ? { ...p, profile: { ...p.profile, characteristic_language: v } } : p)} />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button onClick={handleCommitPersona} disabled={creatingPersona} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50" style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}>
                        <Check size={12} /> Approve & Seat
                      </button>
                      <button onClick={handleRegeneratePreview} disabled={creatingPersona} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                        <RefreshCw size={12} /> Regenerate
                      </button>
                      <button onClick={handleRejectPreview} disabled={creatingPersona} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50" style={{ backgroundColor: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        <X size={12} /> Reject
                      </button>
                    </div>
                    {preview.classifier?.multi_family_relevance === 'yes' && (
                      <p className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
                        We'll also suggest this advisor for other families — a reviewer looks at it first before they see it.
                      </p>
                    )}
                  </div>
                )}

                {!prayerQuestions.length && !preview && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Who do you want at your table?" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Who is this person to you?</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['A historical/public figure', 'A fictional character', 'My grandmother', 'A mentor', 'A pastor/spiritual leader', 'A friend', 'Other'].map(rel => (
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
                    <button onClick={handleGeneratePreview} disabled={!newName.trim() || creatingPersona}
                      className="w-full rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                      style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
                    >
                      {creatingPersona ? <span className="flex items-center justify-center gap-2"><Loader size={14} className="animate-spin" /> Drafting...</span> : 'Preview Advisor'}
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

// ── HITM Review helpers (SCOPE-8a.F5) ────────────────────────

function PreviewField({
  label, value, editing, multiline, onChange,
}: { label: string; value: string; editing: boolean; multiline?: boolean; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</div>
      {editing ? (
        multiline ? (
          <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
            className="w-full rounded border px-2 py-1 text-sm resize-none"
            style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }} />
        ) : (
          <input type="text" value={value} onChange={e => onChange(e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
            style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }} />
        )
      ) : (
        <div className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {value || <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}
        </div>
      )}
    </div>
  )
}

function PreviewListField({
  label, values, editing, onChange,
}: { label: string; values: string[]; editing: boolean; onChange: (v: string[]) => void }) {
  return (
    <div>
      <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</div>
      {editing ? (
        <textarea
          value={values.join('\n')}
          onChange={e => onChange(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
          rows={Math.max(values.length, 2)}
          placeholder="One per line"
          className="w-full rounded border px-2 py-1 text-sm resize-none"
          style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        />
      ) : (
        <ul className="list-disc list-inside text-sm space-y-0.5" style={{ color: 'var(--color-text-primary)' }}>
          {values.length > 0 ? values.map((v, i) => <li key={i}>{v}</li>) : <li style={{ color: 'var(--color-text-secondary)' }}>—</li>}
        </ul>
      )}
    </div>
  )
}

