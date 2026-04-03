/**
 * TranslatorModal — PRD-34
 *
 * Single-turn text rewrite tool. NOT a conversation modal.
 * 12 preset tones + custom text field. Uses Haiku model.
 * Saves to lila_messages for history but no conversation continuity.
 *
 * Text labels only on tone buttons — no emoji.
 */

import { useState, useRef, useCallback } from 'react'
import { X, Copy, Check, RefreshCw, PenLine, Loader } from 'lucide-react'
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
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>Translator</h2>
          <button onClick={onClose} className="rounded p-1 hover:opacity-70" style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
        </div>

        {/* Footer actions */}
        {results.length > 0 && (
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
