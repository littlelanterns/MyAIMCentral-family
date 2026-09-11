/**
 * NaturalLanguageComposition — Convention 253
 *
 * First-class creation entry point on Studio Browse tab.
 * Mom describes what she wants → nlc-compose (Haiku) identifies the wizard
 * from the FULL creation catalog + extracts pre-fill fields.
 *
 * STUDIO-EXPERIENCE ST-B: rebuilt on a dedicated Edge Function (was ai-parse
 * with a 6-outcome hardcoded prompt that hard-failed or mis-routed common
 * descriptions — F-01). The fallback path per Composition doc §2.9 always
 * restates mom's words and offers the FULL catalog, never "I don't
 * understand." Visible even while Studio's search box has text (F-07).
 */

import { useState, useCallback } from 'react'
import { Sparkles, ArrowRight, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export type WizardMatch =
  | 'rewards_list'
  | 'repeated_action_chart'
  | 'list_reveal_assignment_opportunity'
  | 'list_reveal_assignment_draw'
  | 'activity_list_wizard'
  | 'shared_task_list_wizard'
  | 'universal_list'
  | 'routine_builder'
  | 'sequential_creator'
  | 'star_chart'
  | 'meeting_setup'
  | 'get_to_know'
  | 'gamification_setup'
  | 'task_quick_create'

interface NLCResult {
  wizardType: WizardMatch | 'none_confident'
  preFill: Record<string, unknown>
  confidence: 'high' | 'medium' | 'low'
  description: string
}

interface NaturalLanguageCompositionProps {
  familyMemberNames: string[]
  onOpenWizard: (wizardType: WizardMatch, preFill: Record<string, unknown>) => void
  /** Optional — only used for cost logging + the PRD-41 ethics scan (Convention #4/#248). Omit and the Edge Function simply skips both. */
  familyId?: string
  memberId?: string
}

const WIZARD_LABELS: Record<WizardMatch, string> = {
  rewards_list: 'Create a Rewards List',
  repeated_action_chart: 'Set Up a Progress Chart',
  list_reveal_assignment_opportunity: 'Extra Earning Opportunities',
  list_reveal_assignment_draw: 'Consequence / Activity Spinner',
  activity_list_wizard: 'Set Up Subject Activities',
  shared_task_list_wizard: 'Create a Shared To-Do',
  universal_list: 'Create a List',
  routine_builder: 'Build a Routine',
  sequential_creator: 'Create a Sequential Collection',
  star_chart: 'Set Up a Star Chart',
  meeting_setup: 'Set Up Family Meetings',
  get_to_know: 'Get to Know a Family Member',
  gamification_setup: 'Set Up Points & Rewards',
  task_quick_create: 'Add a Task',
}

const WIZARD_DESCRIPTIONS: Record<WizardMatch, string> = {
  rewards_list: 'Build a list of prizes for treasure boxes, spinners, and milestone charts.',
  repeated_action_chart: 'Track a repeated action with star charts, coloring reveals, and milestone rewards.',
  list_reveal_assignment_opportunity: 'Create an earning board where kids claim jobs for rewards.',
  list_reveal_assignment_draw: 'Create a spinner that picks randomly from your list.',
  activity_list_wizard: 'Build a subject-based activity list with daily requirements, random/browse modes, and rewards.',
  shared_task_list_wizard: 'Create a shared to-do list where family members claim and complete items.',
  universal_list: 'A general-purpose list — shopping, packing, wishlist, expenses, ideas, or a plain to-do.',
  routine_builder: 'Describe a routine in your own words and we\'ll organize it into steps.',
  sequential_creator: 'An ordered collection where each item unlocks the next.',
  star_chart: 'A quick star/sticker/coin tally toward a goal for one person.',
  meeting_setup: 'Bootstrap your whole family meeting calendar — 1:1s, couple time, family council.',
  get_to_know: 'Record what a family member loves — gift ideas, love language, comfort needs.',
  gamification_setup: 'Configure points, sticker books, and creature-earning for a child.',
  task_quick_create: 'Add a single one-off or simple task, no board or chart.',
}

const ALL_WIZARD_TYPES: WizardMatch[] = [
  'universal_list',
  'task_quick_create',
  'routine_builder',
  'rewards_list',
  'repeated_action_chart',
  'star_chart',
  'list_reveal_assignment_opportunity',
  'list_reveal_assignment_draw',
  'activity_list_wizard',
  'shared_task_list_wizard',
  'sequential_creator',
  'meeting_setup',
  'get_to_know',
  'gamification_setup',
]

// Machine-voice giveaways: the model occasionally answers the ROUTING
// question in the description field instead of restating mom ("this phrase
// doesn't match any family management wizard. Please describe..."), which
// renders as "you want to this phrase doesn't match...". Seen live on the
// none_confident path during the ST-B eyes-on tour.
const META_COMMENTARY = /\b(doesn'?t match|does not match|no match|not match any|unable to|cannot determine|can'?t determine|please describe|please provide|for example:|unclear|ambiguous|wizard)\b/i

/**
 * ST-A item 10 (carried forward) + ST-B tour finding: produce a phrase that
 * can safely complete "It sounds like you want to ___".
 *
 * Two defenses, because the sentence frame is mom-facing and must never
 * break no matter what the model returns:
 *  1. Strip third-person lead-ins ("Mom wants to track..." → "track...").
 *  2. Reject anything that isn't usable as a short verb phrase — machine
 *     meta-commentary, multi-sentence answers, or an over-long paragraph —
 *     and fall back to mom's OWN words, which is what Composition doc §2.9
 *     asks the fallback to restate in the first place.
 */
export function normalizeRestate(description: string, momText = ''): string {
  let d = description.trim()
  d = d.replace(/^(mom|she|the mom|the user|you)\s+(wants?|would like|is looking|needs?)\s+(to\s+)?/i, '')
  d = d.replace(/^you\s+want\s+to\s+/i, '')
  d = d.trim()

  const unusable =
    d.length === 0 ||
    d.length > 120 ||
    META_COMMENTARY.test(d) ||
    // More than one sentence — a verb phrase is never multi-sentence.
    /[.!?]\s+\S/.test(d)

  if (unusable && momText.trim().length > 0) d = momText.trim()

  if (d.length > 0) d = d.charAt(0).toLowerCase() + d.slice(1)
  return d
}

export function NaturalLanguageComposition({
  familyMemberNames,
  onOpenWizard,
  familyId,
  memberId,
}: NaturalLanguageCompositionProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ wizardType: WizardMatch; preFill: Record<string, unknown>; confidence: 'medium' | 'low'; description: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [crisisMessage, setCrisisMessage] = useState<string | null>(null)
  // routine_builder's "description passthrough" (Composition doc §2.9) is
  // guaranteed verbatim by using mom's own typed text directly, never the
  // model's echo of it back — live testing found the router doesn't
  // reliably repeat the description field even though the prompt asks for
  // it. Captured at submit time so it survives into the confirmation card's
  // later button clicks even after `input` is cleared/edited.
  const [lastSubmittedText, setLastSubmittedText] = useState('')

  // `text` is passed explicitly rather than closing over `lastSubmittedText`
  // state: the high-confidence auto-open call site below fires within the
  // SAME handleSubmit invocation that just called setLastSubmittedText —
  // state updates don't apply mid-closure, so a version of this function
  // that read the state variable would still see the PREVIOUS value ('' on
  // the very first submit) at that call site. The three later call sites
  // (confirmation-card buttons) run in a subsequent render, after the state
  // update has committed, so they pass `lastSubmittedText` instead.
  const finalizePreFill = useCallback((wizardType: WizardMatch, preFill: Record<string, unknown>, text: string) => {
    if (wizardType !== 'routine_builder') return preFill
    return { ...preFill, description: text }
  }, [])

  const handleSubmit = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setLoading(true)
    setResult(null)
    setError(null)
    setCrisisMessage(null)
    setLastSubmittedText(text)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('nlc-compose', {
        body: { text, familyMemberNames, family_id: familyId, member_id: memberId },
      })
      if (fnError) throw fnError

      if (data?.crisis) {
        setCrisisMessage(data.response)
        return
      }
      if (data?.error) {
        setError(typeof data.error === 'string' ? data.error : "I couldn't quite figure that out.")
        return
      }

      const parsed = data?.result as NLCResult | undefined
      if (!parsed || !parsed.wizardType || !parsed.confidence) {
        setError('I couldn\'t quite figure that out. Try describing it differently, or pick a wizard below.')
        return
      }

      // §2.9 fallback: never a hard "I don't understand" — restate mom's
      // words and offer the full catalog. none_confident always falls
      // through here regardless of the reported confidence.
      if (parsed.confidence === 'high' && parsed.wizardType !== 'none_confident') {
        onOpenWizard(parsed.wizardType, finalizePreFill(parsed.wizardType, parsed.preFill ?? {}, text))
        setInput('')
        setResult(null)
      } else if (parsed.wizardType === 'none_confident') {
        setResult(null)
        setError(null)
        setResult({
          wizardType: 'universal_list',
          preFill: {},
          confidence: 'low',
          description: normalizeRestate(parsed.description ?? text, text),
        })
      } else {
        setResult({
          wizardType: parsed.wizardType,
          preFill: parsed.preFill ?? {},
          confidence: parsed.confidence as 'medium' | 'low',
          description: normalizeRestate(parsed.description ?? '', text),
        })
      }
    } catch {
      // Keep mom's text — she shouldn't have to retype it after a network blip.
      setError('Something went wrong. Try again or pick a wizard from the list below.')
    } finally {
      setLoading(false)
    }
  }, [input, loading, familyMemberNames, familyId, memberId, onOpenWizard, finalizePreFill])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  return (
    <div className="mb-6">
      {/* Input */}
      <div
        className="rounded-xl border p-3 flex items-center gap-3"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <Sparkles
          size={20}
          style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }}
        />
        <input
          type="search"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to create..."
          disabled={loading}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--color-text-primary)' }}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || loading}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-40"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ArrowRight size={14} />
          )}
        </button>
      </div>

      {/* Crisis override (Convention #7 — global, takes priority over everything below) */}
      {crisisMessage && (
        <div
          className="mt-3 rounded-lg p-3 text-sm flex items-start gap-2"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-text-error, #dc2626) 10%, transparent)',
            color: 'var(--color-text-primary)',
          }}
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--color-text-error, #dc2626)' }} />
          <p style={{ whiteSpace: 'pre-line' }}>{crisisMessage}</p>
        </div>
      )}

      {/* Error state — §2.9: never a dead end, always the full catalog */}
      {error && !crisisMessage && (
        <div
          className="mt-3 rounded-lg p-3 text-sm"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 8%, transparent)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <p>{error}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {ALL_WIZARD_TYPES.map(wt => (
              <button
                key={wt}
                onClick={() => {
                  onOpenWizard(wt, finalizePreFill(wt, {}, lastSubmittedText))
                  setError(null)
                  setInput('')
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-bg-card)',
                }}
              >
                {WIZARD_LABELS[wt]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Medium/low confidence — confirmation card */}
      {result && (
        <div
          className="mt-3 rounded-xl border p-4"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          {result.confidence === 'medium' ? (
            <>
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-primary)' }}>
                It sounds like you want to <strong>{result.description}</strong>
              </p>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Open <strong>{WIZARD_LABELS[result.wizardType]}</strong>?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onOpenWizard(result.wizardType, finalizePreFill(result.wizardType, result.preFill ?? {}, lastSubmittedText))
                    setResult(null)
                    setInput('')
                  }}
                  className="rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: 'var(--color-btn-primary-bg)',
                    color: 'var(--color-btn-primary-text)',
                  }}
                >
                  Yes, open it
                </button>
                <button
                  onClick={() => {
                    setResult(null)
                  }}
                  className="rounded-lg px-4 py-2 text-xs font-medium border transition-colors"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <RefreshCw size={12} className="inline mr-1" />
                  Describe differently
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Based on what I'm hearing — you want to <em>{result.description}</em> — these wizards might fit:
              </p>
              <div className="flex flex-col gap-2 mt-3">
                {ALL_WIZARD_TYPES.map(wt => (
                  <button
                    key={wt}
                    onClick={() => {
                      onOpenWizard(wt, finalizePreFill(wt, wt === result.wizardType ? (result.preFill ?? {}) : {}, lastSubmittedText))
                      setResult(null)
                      setInput('')
                    }}
                    className="rounded-lg border p-3 text-left transition-colors hover:border-[var(--color-btn-primary-bg)]"
                    style={{
                      borderColor: wt === result.wizardType ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                      backgroundColor: 'var(--color-bg-primary)',
                    }}
                  >
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
                      {WIZARD_LABELS[wt]}
                    </span>
                    {wt === result.wizardType && (
                      <span
                        className="ml-2 text-[10px] rounded-full px-2 py-0.5"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
                          color: 'var(--color-btn-primary-bg)',
                        }}
                      >
                        Best match
                      </span>
                    )}
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {WIZARD_DESCRIPTIONS[wt]}
                    </p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setResult(null)
                }}
                className="mt-3 text-xs font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <RefreshCw size={12} className="inline mr-1" />
                Describe differently
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
