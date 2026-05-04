/**
 * NaturalLanguageComposition — Convention 253
 *
 * First-class creation entry point on Studio Browse tab.
 * Mom describes what she wants → Haiku identifies the wizard + extracts pre-fill fields.
 */

import { useState, useCallback } from 'react'
import { Sparkles, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'

type WizardMatch =
  | 'rewards_list'
  | 'repeated_action_chart'
  | 'list_reveal_assignment_opportunity'
  | 'list_reveal_assignment_draw'

interface NLCResult {
  wizardType: WizardMatch
  preFill: Record<string, unknown>
  confidence: 'high' | 'medium' | 'low'
  description: string
}

interface NaturalLanguageCompositionProps {
  familyMemberNames: string[]
  onOpenWizard: (wizardType: WizardMatch, preFill: Record<string, unknown>) => void
}

const WIZARD_LABELS: Record<WizardMatch, string> = {
  rewards_list: 'Create a Rewards List',
  repeated_action_chart: 'Set Up a Progress Chart',
  list_reveal_assignment_opportunity: 'Extra Earning Opportunities',
  list_reveal_assignment_draw: 'Consequence / Activity Spinner',
}

const WIZARD_DESCRIPTIONS: Record<WizardMatch, string> = {
  rewards_list: 'Build a list of prizes for treasure boxes, spinners, and milestone charts.',
  repeated_action_chart: 'Track a repeated action with star charts, coloring reveals, and milestone rewards.',
  list_reveal_assignment_opportunity: 'Create an earning board where kids claim jobs for rewards.',
  list_reveal_assignment_draw: 'Create a spinner that picks randomly from your list.',
}

const SYSTEM_PROMPT = `You are a family management wizard router. A mom is describing what she wants to create for her family. Your job is to identify which wizard best matches her description and extract any pre-fillable fields.

Available wizards:
1. "rewards_list" — A list of prizes/rewards for treasure boxes, spinners, milestone charts. Use when mom wants to create a list of things kids can earn.
2. "repeated_action_chart" — Star charts, potty charts, coloring reveals. Tracks a single repeated action (potty trips, piano practice, chores) with visual progress and milestone rewards. Use when mom wants to track/reward a repeated behavior.
3. "list_reveal_assignment_opportunity" — Opportunity/earning board where kids claim jobs for money or prizes. Use when mom wants extra earning jobs, bonus chores, or a job board.
4. "list_reveal_assignment_draw" — Consequence spinner or activity picker. A randomizer wheel that picks from a list. Use when mom wants a consequence wheel, activity picker, or random selection tool.

Family member names for reference: {FAMILY_MEMBERS}

Respond with ONLY valid JSON (no markdown fences):
{
  "wizardType": "rewards_list" | "repeated_action_chart" | "list_reveal_assignment_opportunity" | "list_reveal_assignment_draw",
  "preFill": {
    // For rewards_list: { "listName": string, "items": string[] }
    // For repeated_action_chart: { "chartName": string, "actionTaskName": string, "memberName": string }
    // For list_reveal_assignment_opportunity: { "listName": string, "items": [{ "name": string, "amount": number }] }
    // For list_reveal_assignment_draw: { "listName": string, "items": string[] }
    // Only include fields you can confidently extract. Omit uncertain fields.
  },
  "confidence": "high" | "medium" | "low",
  "description": "One sentence restating what mom wants in plain language"
}`

export function NaturalLanguageComposition({
  familyMemberNames,
  onOpenWizard,
}: NaturalLanguageCompositionProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NLCResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const prompt = SYSTEM_PROMPT.replace('{FAMILY_MEMBERS}', familyMemberNames.join(', ') || 'none provided')
      const response = await sendAIMessage(
        prompt,
        [{ role: 'user', content: text }],
        1024,
        'haiku',
      )

      const parsed = extractJSON<NLCResult>(response)
      if (!parsed || !parsed.wizardType || !parsed.confidence) {
        setError('I couldn\'t quite figure that out. Try describing it differently, or pick a wizard below.')
        return
      }

      if (parsed.confidence === 'high') {
        onOpenWizard(parsed.wizardType, parsed.preFill ?? {})
        setInput('')
        setResult(null)
      } else {
        setResult(parsed)
      }
    } catch {
      setError('Something went wrong. Try again or pick a wizard from the list below.')
    } finally {
      setLoading(false)
    }
  }, [input, loading, familyMemberNames, onOpenWizard])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const allWizardTypes: WizardMatch[] = [
    'rewards_list',
    'repeated_action_chart',
    'list_reveal_assignment_opportunity',
    'list_reveal_assignment_draw',
  ]

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

      {/* Error state */}
      {error && (
        <div
          className="mt-3 rounded-lg p-3 text-sm"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 8%, transparent)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <p>{error}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {allWizardTypes.map(wt => (
              <button
                key={wt}
                onClick={() => {
                  onOpenWizard(wt, {})
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
                    onOpenWizard(result.wizardType, result.preFill ?? {})
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
                    setInput('')
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
                Based on what I'm hearing — <em>{result.description}</em> — these wizards might fit:
              </p>
              <div className="flex flex-col gap-2 mt-3">
                {allWizardTypes.map(wt => (
                  <button
                    key={wt}
                    onClick={() => {
                      onOpenWizard(wt, wt === result.wizardType ? (result.preFill ?? {}) : {})
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
                  setInput('')
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
