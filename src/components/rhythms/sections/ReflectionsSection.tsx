/**
 * PRD-18 Evening Section #11: Reflections (inline)
 *
 * Wraps the existing reflections infrastructure (built in migration
 * 100071/100072 + src/hooks/useReflections.ts + src/pages/ReflectionsPage.tsx).
 *
 * Phase A behavior:
 *   1. Pull all active prompts via useReflectionPrompts
 *   2. Filter to those NOT yet answered today (date-seeded prioritization)
 *   3. Select N (default 3) deterministically via PRNG
 *   4. Render inline textareas; save via useSaveResponse with
 *      source_context='evening_rhythm'
 *   5. "See all questions →" link to /reflections
 *
 * Routing UI is intentionally NOT here — that lives on the standalone
 * Reflections page. Evening rhythm is the lightweight surface; full
 * management is on the page.
 */

import { useState, useEffect } from 'react'
import { BookHeart, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useReflectionPrompts,
  useTodaysResponses,
  useSaveResponse,
  type ReflectionPrompt,
} from '@/hooks/useReflections'
import { pickNPrioritized, rhythmSeed } from '@/lib/rhythm/dateSeedPrng'

interface Props {
  familyId: string
  memberId: string
  /** How many questions to surface inline. Default 3 (1-2 for teens — caller passes). */
  count?: number
}

export function ReflectionsSection({ familyId, memberId, count = 3 }: Props) {
  const { data: prompts = [], isLoading: loadingPrompts } = useReflectionPrompts(familyId, memberId)
  const { data: todaysResponses = [], isLoading: loadingResponses } = useTodaysResponses(
    familyId,
    memberId
  )

  if (loadingPrompts || loadingResponses) return null
  if (prompts.length === 0) return null

  // Build set of prompt IDs already answered today
  const answeredIds = new Set(todaysResponses.map(r => r.prompt_id))

  // Date-seeded selection: prioritize unanswered
  const seed = rhythmSeed(memberId, 'evening:reflections', new Date())
  const selected = pickNPrioritized(
    prompts,
    count,
    p => !answeredIds.has(p.id),
    seed
  )

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookHeart size={18} style={{ color: 'var(--color-accent-deep)' }} />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Tonight's Reflection
          </h3>
        </div>
        <Link
          to="/reflections"
          className="flex items-center gap-1 text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          See all questions
          <ChevronRight size={12} />
        </Link>
      </div>

      <div className="space-y-4">
        {selected.map(prompt => (
          <ReflectionPromptInline
            key={prompt.id}
            prompt={prompt}
            familyId={familyId}
            memberId={memberId}
            existingResponse={todaysResponses.find(r => r.prompt_id === prompt.id)?.response_text}
          />
        ))}
      </div>
    </div>
  )
}

interface InlineProps {
  prompt: ReflectionPrompt
  familyId: string
  memberId: string
  existingResponse?: string
}

function ReflectionPromptInline({ prompt, familyId, memberId, existingResponse }: InlineProps) {
  const [text, setText] = useState(existingResponse ?? '')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const saveResponse = useSaveResponse()

  // Sync local state if the existing response loads after mount
  useEffect(() => {
    if (existingResponse !== undefined) setText(existingResponse)
  }, [existingResponse])

  const handleSave = async () => {
    const trimmed = text.trim()
    if (trimmed.length === 0) return
    await saveResponse.mutateAsync({
      familyId,
      memberId,
      promptId: prompt.id,
      responseText: trimmed,
      promptText: prompt.prompt_text,
      category: prompt.category,
    })
    setSavedAt(Date.now())
    setTimeout(() => setSavedAt(null), 2500)
  }

  const isAnswered = (existingResponse?.length ?? 0) > 0
  const labelColor = isAnswered
    ? 'var(--color-text-secondary)'
    : 'var(--color-text-primary)'

  return (
    <div>
      <p
        className="text-sm font-medium mb-2"
        style={{ color: labelColor }}
      >
        {isAnswered && '✓ '}
        {prompt.prompt_text}
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Your thoughts…"
        rows={2}
        className="w-full text-sm rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2"
        style={{
          backgroundColor: 'var(--color-bg-input)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-input)',
        }}
      />
      <div className="flex items-center justify-between mt-1">
        <span
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {savedAt ? '✓ Saved to journal' : ''}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={text.trim().length === 0 || saveResponse.isPending}
          className="text-xs font-semibold rounded-md px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {saveResponse.isPending ? 'Saving…' : isAnswered ? 'Update' : 'Save'}
        </button>
      </div>
    </div>
  )
}
