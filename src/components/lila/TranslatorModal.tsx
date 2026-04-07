/**
 * TranslatorModal — PRD-34
 *
 * Single-turn text rewrite tool. NOT a conversation modal.
 * 12 preset tones + custom text field. Uses Haiku model.
 * Saves to lila_messages for history — History tab reads those rows back as
 * a per-member log of original text + tone + translated output.
 *
 * Text labels only on tone buttons — no emoji.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Copy, Check, RefreshCw, PenLine, Loader, History, ArrowLeft } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useCreateConversation } from '@/hooks/useLila'
import { supabase } from '@/lib/supabase/client'

const PRESET_TONES = [
  { key: 'pirate', label: 'Pirate' },
  { key: 'medieval', label: 'Medieval' },
  { key: 'gen_z', label: 'Gen Z' },
  { key: 'formal', label: 'Formal' },
  { key: 'five_year_old', label: 'For a 5-year-old' },
  { key: 'softer', label: 'Softer tone' },
  { key: 'shakespeare', label: 'Shakespeare' },
  { key: 'southern', label: 'Southern' },
  { key: 'british', label: 'British' },
  { key: 'sports_announcer', label: 'Sports announcer' },
  { key: 'fairy_tale', label: 'Fairy tale' },
  { key: 'motivational', label: 'Motivational' },
] as const

interface RewriteResult {
  tone: string
  toneLabel: string
  text: string
}

interface HistoryEntry {
  conversationId: string
  createdAt: string
  tone: string
  original: string
  translated: string
}

interface TranslatorModalProps {
  onClose: () => void
}

export function TranslatorModal({ onClose }: TranslatorModalProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const createConversation = useCreateConversation()

  const [input, setInput] = useState('')
  const [results, setResults] = useState<RewriteResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTone, setLoadingTone] = useState<string | null>(null)
  const [customToneOpen, setCustomToneOpen] = useState(false)
  const [customToneText, setCustomToneText] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'compose' | 'history'>('compose')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load this member's translator history when switching to the History tab.
  useEffect(() => {
    if (view !== 'history' || !member?.id) return
    let cancelled = false
    setHistoryLoading(true)
    ;(async () => {
      // Most recent 50 translator conversations for this member.
      const { data: convs, error: convErr } = await supabase
        .from('lila_conversations')
        .select('id, created_at')
        .eq('member_id', member.id)
        .eq('guided_mode', 'translator')
        .order('created_at', { ascending: false })
        .limit(50)
      if (cancelled) return
      if (convErr || !convs || convs.length === 0) {
        setHistory([])
        setHistoryLoading(false)
        return
      }
      const convIds = convs.map(c => c.id)
      const { data: msgs } = await supabase
        .from('lila_messages')
        .select('conversation_id, role, content, metadata, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: true })
      if (cancelled) return
      const byConv = new Map<string, { user?: { content: string; tone: string }; assistant?: { content: string } }>()
      for (const m of msgs ?? []) {
        const entry = byConv.get(m.conversation_id) ?? {}
        if (m.role === 'user') {
          const metaTone = m.metadata && typeof m.metadata === 'object' && 'tone' in m.metadata
            ? String((m.metadata as { tone?: unknown }).tone ?? '')
            : ''
          entry.user = { content: m.content, tone: metaTone }
        } else if (m.role === 'assistant') {
          entry.assistant = { content: m.content }
        }
        byConv.set(m.conversation_id, entry)
      }
      const entries: HistoryEntry[] = convs
        .map(c => {
          const pair = byConv.get(c.id)
          if (!pair?.user || !pair?.assistant) return null
          return {
            conversationId: c.id,
            createdAt: c.created_at,
            tone: pair.user.tone || 'Unknown',
            original: pair.user.content,
            translated: pair.assistant.content,
          }
        })
        .filter((e): e is HistoryEntry => e !== null)
      setHistory(entries)
      setHistoryLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [view, member?.id])

  const handleCopyHistory = useCallback((entry: HistoryEntry) => {
    navigator.clipboard.writeText(entry.translated)
    setCopiedHistoryId(entry.conversationId)
    setTimeout(() => setCopiedHistoryId(null), 2000)
  }, [])

  const callTranslator = useCallback(async (tone: string, toneLabel: string) => {
    if (!input.trim() || !member || !family) return
    setLoading(true)
    setLoadingTone(tone)
    setError(null)

    try {
      // Create a new conversation for this rewrite (or reuse existing)
      let convId: string
      const conv = await createConversation.mutateAsync({
        family_id: family.id,
        member_id: member.id,
        mode: 'general',
        guided_mode: 'translator',
        container_type: 'modal',
      })
      convId = conv.id

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const res = await fetch(`${supabaseUrl}/functions/v1/lila-translator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          conversation_id: convId,
          content: input.trim(),
          tone: toneLabel,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || `HTTP ${res.status}`)
      }

      const json = await res.json()
      if (json.rewrite) {
        setResults(prev => [{ tone, toneLabel, text: json.rewrite }, ...prev])
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
      setLoadingTone(null)
    }
  }, [input, member, family, createConversation])

  const handleCopy = useCallback((idx: number) => {
    const result = results[idx]
    if (!result) return
    navigator.clipboard.writeText(result.text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }, [results])

  const handleEditInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const hasInput = input.trim().length > 0

  return (
    <div data-testid="translator-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl shadow-lg"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-4 py-3 gap-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {view === 'history' && (
              <button
                onClick={() => setView('compose')}
                className="rounded p-1 hover:opacity-70 shrink-0"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                aria-label="Back to compose"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-lg font-semibold truncate" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
              {view === 'history' ? 'Translator History' : 'Translator'}
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {view === 'compose' && (
              <button
                onClick={() => setView('history')}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:opacity-70"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                aria-label="View history"
              >
                <History size={14} />
                History
              </button>
            )}
            <button onClick={onClose} className="rounded p-1 hover:opacity-70" style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {view === 'history' ? (
            <div data-testid="translator-history" className="space-y-3">
              {historyLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader size={20} className="animate-spin" style={{ color: 'var(--color-text-secondary)' }} />
                </div>
              ) : history.length === 0 ? (
                <div className="py-10 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <History size={28} className="mx-auto mb-2 opacity-40" />
                  No translations yet. Your history will show here.
                </div>
              ) : (
                history.map(entry => (
                  <div
                    key={entry.conversationId}
                    data-testid="translator-history-entry"
                    className="rounded-lg border p-3"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
                          color: 'var(--color-btn-primary-bg)',
                        }}
                      >
                        {entry.tone}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {new Date(entry.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        Original
                      </div>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                        {entry.original}
                      </p>
                    </div>
                    <div>
                      <div className="mb-0.5 flex items-center justify-between">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                          Translated
                        </div>
                        <button
                          onClick={() => handleCopyHistory(entry)}
                          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium hover:opacity-70"
                          style={{ color: 'var(--color-btn-primary-bg)' }}
                        >
                          {copiedHistoryId === entry.conversationId ? (
                            <>
                              <Check size={12} />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
                        {entry.translated}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
          <>
          {/* Input area */}
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Paste or type your text:</label>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter text to rewrite..."
              rows={4}
              className="w-full resize-none rounded-lg border p-3 text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Tone buttons */}
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Rewrite as:</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TONES.map(tone => (
                <button
                  key={tone.key}
                  onClick={() => callTranslator(tone.key, tone.label)}
                  disabled={!hasInput || loading}
                  className="rounded-full border px-3 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    borderColor: loadingTone === tone.key
                      ? 'var(--color-btn-primary-bg)'
                      : 'var(--color-border)',
                    backgroundColor: loadingTone === tone.key
                      ? 'var(--color-btn-primary-bg)'
                      : 'transparent',
                    color: loadingTone === tone.key
                      ? 'var(--color-btn-primary-text, #fff)'
                      : 'var(--color-text-primary)',
                  }}
                >
                  {loadingTone === tone.key ? (
                    <span className="flex items-center gap-1">
                      <Loader size={14} className="animate-spin" />
                      {tone.label}
                    </span>
                  ) : (
                    tone.label
                  )}
                </button>
              ))}

              {/* Custom tone */}
              {!customToneOpen ? (
                <button
                  onClick={() => setCustomToneOpen(true)}
                  disabled={!hasInput || loading}
                  className="rounded-full border px-3 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    borderColor: 'var(--color-border)',
                    borderStyle: 'dashed',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Custom...
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Rewrite as:</span>
                  <input
                    type="text"
                    value={customToneText}
                    onChange={e => setCustomToneText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && customToneText.trim()) {
                        callTranslator('custom', customToneText.trim())
                        setCustomToneOpen(false)
                        setCustomToneText('')
                      }
                    }}
                    placeholder="a nature documentary narrator..."
                    className="rounded border px-2 py-1 text-sm focus:outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                      minWidth: '200px',
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (customToneText.trim()) {
                        callTranslator('custom', customToneText.trim())
                        setCustomToneOpen(false)
                        setCustomToneText('')
                      }
                    }}
                    disabled={!customToneText.trim() || loading}
                    className="rounded px-2 py-1 text-sm font-medium disabled:opacity-40"
                    style={{ color: 'var(--color-btn-primary-bg)' }}
                  >
                    Go
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-lg border p-3 text-sm"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 30%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))',
                color: 'var(--color-text-primary)',
              }}
            >
              Something went wrong. Please try again.
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                {results.length === 1 ? 'Result:' : `Results (${results.length}):`}
              </label>
              {results.map((result, idx) => (
                <div
                  key={`${result.tone}-${idx}`}
                  className="rounded-lg border p-3"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                      {result.toneLabel}
                    </span>
                    <button
                      onClick={() => handleCopy(idx)}
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors hover:opacity-70"
                      style={{ color: 'var(--color-btn-primary-bg)' }}
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check size={12} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--color-text-primary)' }}>{result.text}</p>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </div>

        {/* Footer actions */}
        {view === 'compose' && results.length > 0 && (
          <div
            className="flex items-center justify-end gap-3 border-t px-4 py-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <button
              onClick={handleEditInput}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <PenLine size={14} />
              Edit input
            </button>
            <button
              onClick={() => setResults([])}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <RefreshCw size={14} />
              Clear results
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
