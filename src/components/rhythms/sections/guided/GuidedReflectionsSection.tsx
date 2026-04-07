/**
 * PRD-18 Mini Evening Rhythm for Guided — Reflections
 *
 * Pulls from the existing reflection_prompts library (lazy-seeded by
 * useReflectionPrompts on first call). Filters to 20 sort_orders curated
 * as child-appropriate, picks ONE via date-seeded PRNG, and offers an
 * inline "View All" expander so the kid can browse and pick a different
 * prompt to answer instead.
 *
 * Architecture mirrors the planned teen evening reflection (Enhancement
 * Addendum decision 30: "1-2 reflection questions per evening, pulled
 * from teen-appropriate prompts filtered from the existing pool").
 * Guided gets 1 question by default with the View All escape hatch.
 *
 * Save flow: uses the existing useSaveResponse hook from useReflections,
 * which writes BOTH a reflection_responses row AND a journal_entries row
 * with category-derived tags (e.g. ['reflection','gratitude']). This
 * means mom can find these reflections in (a) /reflections Past tab via
 * View As, AND (b) the kid's journal under the relevant category tag.
 *
 * The 20 child-friendly sort_orders are platform-curated. Mom-controlled
 * curation can come in a Phase B polish pass via preferences.reflection_prompts.
 *
 * Reading Support: Volume2 icon reads the active prompt aloud.
 */

import { useState } from 'react'
import { BookHeart, Volume2, Check, ChevronDown, ChevronUp } from 'lucide-react'
import {
  useReflectionPrompts,
  useTodaysResponses,
  useSaveResponse,
  type ReflectionPrompt,
} from '@/hooks/useReflections'
import { pickOne, rhythmSeed } from '@/lib/rhythm/dateSeedPrng'

/**
 * 20 child-friendly sort_orders from the 32 default reflection_prompts.
 *
 * The default seed (in useReflections.DEFAULT_PROMPTS) assigns sort_orders
 * 1-32 in a stable order. The 20 below are the prompts that read naturally
 * in second-person or present-tense for a child:
 *
 *   1  What am I grateful for today?
 *   2  What did I love about today?
 *   3  What was a moment that inspired awe, wonder, or joy?
 *   4  What made me laugh today?
 *   5  What brought you joy recently?
 *   8  Who made my day better, and do they know it?
 *   9  What obstacle did I face today, and what did I do to overcome it?
 *   12 What goal did I make progress on?
 *   13 What did I do today that was hard but right?
 *   20 What was a moment that made me appreciate another family member?
 *   21 How did I serve today?
 *   22 Who needed me today, and was I there?
 *   24 How did I make someone feel safe or seen?
 *   25 What was something interesting I learned or discovered?
 *   26 What question is still on my mind from today?
 *   28 What was the best part of your day?
 *   29 Was there a moment you were brave today?
 *   30 Did you help someone today? How?
 *   31 What's something you tried that was hard?
 *   32 If you could do one thing over, what would it be?
 *
 * Excluded from the 32: 6 (overlaps with Tomorrow section), 7/10/11/14/15
 * (too adult/judgmental), 16/17/18 (too abstract for guided age), 19
 * (depends on having Guiding Stars), 23 (abstract), 27 (adult).
 */
const GUIDED_REFLECTION_SORT_ORDERS = new Set([
  1, 2, 3, 4, 5, 8, 9, 12, 13, 20, 21, 22, 24, 25, 26, 28, 29, 30, 31, 32,
])

interface Props {
  familyId: string
  memberId: string
  readingSupport?: boolean
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = 0.95
  window.speechSynthesis.speak(utter)
}

export function GuidedReflectionsSection({ familyId, memberId, readingSupport }: Props) {
  const { data: prompts = [], isLoading } = useReflectionPrompts(familyId, memberId)
  const { data: todaysResponses = [] } = useTodaysResponses(familyId, memberId)
  const saveResponse = useSaveResponse()

  const [text, setText] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [showAllPrompts, setShowAllPrompts] = useState(false)
  const [overrideId, setOverrideId] = useState<string | null>(null)

  if (isLoading) return null

  // Filter the loaded prompts to the 20 child-friendly sort_orders
  const childFriendly = prompts.filter(p => GUIDED_REFLECTION_SORT_ORDERS.has(p.sort_order))
  if (childFriendly.length === 0) return null // safety: lazy seed hasn't fired yet

  // Build set of prompt IDs already answered today (so we can show indicators)
  const answeredIds = new Set(todaysResponses.map(r => r.prompt_id))

  // Date-seeded daily pick. Override (kid tapped a specific prompt from View All)
  // takes priority. Falls back to PRNG, which falls back to the first prompt.
  const seed = rhythmSeed(memberId, 'evening:guided_reflections', new Date())
  const seededPrompt = pickOne(childFriendly, seed)
  const activePrompt: ReflectionPrompt | undefined =
    (overrideId ? childFriendly.find(p => p.id === overrideId) : null)
    ?? seededPrompt
    ?? childFriendly[0]

  if (!activePrompt) return null

  const handleSave = async () => {
    const trimmed = text.trim()
    if (trimmed.length === 0) return
    await saveResponse.mutateAsync({
      familyId,
      memberId,
      promptId: activePrompt.id,
      responseText: trimmed,
      promptText: activePrompt.prompt_text,
      category: activePrompt.category,
    })
    setText('')
    setSavedAt(Date.now())
    setTimeout(() => setSavedAt(null), 4000)
  }

  const handleSelectFromList = (promptId: string) => {
    setOverrideId(promptId)
    setShowAllPrompts(false)
    setText('')
    setSavedAt(null)
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <BookHeart size={22} style={{ color: 'var(--color-accent-deep)' }} />
        <h3
          className="text-base font-semibold flex-1"
          style={{
            color: 'var(--color-text-heading)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {activePrompt.prompt_text}
        </h3>
        {readingSupport && (
          <button
            type="button"
            onClick={() => speak(activePrompt.prompt_text)}
            className="rounded-md p-1"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Read prompt aloud"
          >
            <Volume2 size={20} />
          </button>
        )}
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Take your time."
        rows={3}
        className="w-full text-base rounded-lg p-3 resize-none focus:outline-none focus:ring-2"
        style={{
          backgroundColor: 'var(--color-bg-input)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-input)',
        }}
      />

      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={() => setShowAllPrompts(v => !v)}
          className="text-sm inline-flex items-center gap-1 rounded-md px-2 py-1"
          style={{
            color: 'var(--color-text-secondary)',
            backgroundColor: 'transparent',
          }}
        >
          {showAllPrompts ? (
            <>
              <ChevronUp size={14} />
              Hide list
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              View all questions
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          {savedAt && (
            <span
              className="text-sm inline-flex items-center gap-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Check size={14} />
              Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={text.trim().length === 0 || saveResponse.isPending}
            className="text-base font-semibold rounded-md px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
              minHeight: 48,
            }}
          >
            {saveResponse.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* View All — inline expander listing the 20 child-friendly prompts */}
      {showAllPrompts && (
        <div
          className="mt-4 pt-4 border-t space-y-1"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <p
            className="text-xs uppercase tracking-wide mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Pick any question to answer
          </p>
          {childFriendly.map(prompt => {
            const isActive = prompt.id === activePrompt.id
            const isAnswered = answeredIds.has(prompt.id)
            return (
              <button
                key={prompt.id}
                type="button"
                onClick={() => handleSelectFromList(prompt.id)}
                className="w-full text-left text-sm rounded-md px-3 py-2 transition-colors"
                style={{
                  backgroundColor: isActive
                    ? 'var(--color-bg-secondary)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-secondary)',
                  minHeight: 44,
                }}
              >
                {isAnswered && '✓ '}
                {prompt.prompt_text}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
