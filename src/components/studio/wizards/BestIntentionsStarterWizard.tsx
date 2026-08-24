/**
 * BestIntentionsStarterWizard — STUDIO-EXPERIENCE ST-A (finding F-06).
 *
 * The "Best Intentions Starter" Studio card promised "a wizard that helps you
 * create 3-5 starter intentions across family, personal growth, health, and
 * relationships" — but tapping it just navigated to /guiding-stars. This IS
 * that wizard.
 *
 * Two steps: Pick Intentions (suggestion chips per category + custom entry)
 * → Review & Create. Creates real `best_intentions` rows via the existing
 * useCreateBestIntention hook (source='studio_wizard').
 */

import { useState, useCallback } from 'react'
import { Heart, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SetupWizard, type WizardStep } from './SetupWizard'
import { useCreateBestIntention } from '@/hooks/useBestIntentions'

interface IntentionDraft {
  id: string
  statement: string
  category: string
}

const STEPS: WizardStep[] = [
  { key: 'pick', title: 'Pick Intentions' },
  { key: 'review', title: 'Review' },
]

const CATEGORY_SUGGESTIONS: Array<{ category: string; suggestions: string[] }> = [
  {
    category: 'Family',
    suggestions: [
      'Be patient when the kids are loud',
      'Give each kid one-on-one attention today',
      'Say yes to play when I can',
    ],
  },
  {
    category: 'Personal Growth',
    suggestions: [
      'Pause before reacting',
      'Notice one thing I did well today',
      'Ask for help instead of powering through',
    ],
  },
  {
    category: 'Health',
    suggestions: [
      'Drink water before coffee',
      'Step outside for fresh air',
      'Go to bed instead of one more scroll',
    ],
  },
  {
    category: 'Relationships',
    suggestions: [
      'Put my phone down during dinner',
      'Lead with curiosity, not correction',
      'Say the kind thing out loud',
    ],
  },
]

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

interface BestIntentionsStarterWizardProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
}

export function BestIntentionsStarterWizard({
  isOpen,
  onClose,
  familyId,
  memberId,
}: BestIntentionsStarterWizardProps) {
  const navigate = useNavigate()
  const createIntention = useCreateBestIntention()

  const [step, setStep] = useState(0)
  const [drafts, setDrafts] = useState<IntentionDraft[]>([])
  const [customText, setCustomText] = useState('')
  const [customCategory, setCustomCategory] = useState('Family')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createdCount, setCreatedCount] = useState<number | null>(null)

  const hasSuggestion = useCallback(
    (statement: string) => drafts.some((d) => d.statement === statement),
    [drafts],
  )

  const toggleSuggestion = useCallback((statement: string, category: string) => {
    setDrafts((prev) => {
      const existing = prev.find((d) => d.statement === statement)
      if (existing) return prev.filter((d) => d.id !== existing.id)
      return [...prev, { id: makeId(), statement, category }]
    })
  }, [])

  const addCustom = useCallback(() => {
    const text = customText.trim()
    if (!text) return
    setDrafts((prev) => [...prev, { id: makeId(), statement: text, category: customCategory }])
    setCustomText('')
  }, [customText, customCategory])

  const removeDraft = useCallback((id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const handleCreate = useCallback(async () => {
    if (drafts.length === 0) return
    setIsCreating(true)
    setCreateError('')
    try {
      for (const d of drafts) {
        await createIntention.mutateAsync({
          family_id: familyId,
          member_id: memberId,
          statement: d.statement,
          tags: [d.category.toLowerCase().replace(/\s+/g, '_')],
          source: 'studio_wizard',
        })
      }
      setCreatedCount(drafts.length)
    } catch (err) {
      console.error('[BestIntentionsStarterWizard] create failed:', err)
      setCreateError('Something went wrong creating your intentions. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }, [drafts, familyId, memberId, createIntention])

  const deployed = createdCount !== null

  const renderStep = () => {
    if (deployed) {
      return (
        <div className="text-center py-8 space-y-4">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' }}
          >
            <Heart size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
          </div>
          <h3
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            {createdCount} intention{createdCount === 1 ? '' : 's'} created!
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Tap to celebrate each time you practice one — no guilt when you don't.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => { onClose(); navigate('/guiding-stars?tab=intentions') }}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              See my intentions
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Done
            </button>
          </div>
        </div>
      )
    }

    if (STEPS[step]?.key === 'pick') {
      return (
        <div className="space-y-5">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Best Intentions are things you want to practice being, not tasks to check off.
            Pick 3-5 to start — tap a suggestion or write your own.
          </p>

          {CATEGORY_SUGGESTIONS.map(({ category, suggestions }) => (
            <div key={category}>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {category}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => {
                  const selected = hasSuggestion(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSuggestion(s, category)}
                      className="rounded-full px-3 py-1.5 text-xs font-medium border transition-all text-left"
                      style={{
                        borderColor: selected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                        backgroundColor: selected
                          ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
                          : 'var(--color-bg-card)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {selected && <CheckCircle2 size={12} className="inline mr-1" style={{ color: 'var(--color-btn-primary-bg)' }} />}
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Custom entry */}
          <div
            className="rounded-lg border p-3 space-y-2"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Write your own
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
                placeholder="e.g., Pause before answering"
                className="flex-1 px-3 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <div className="flex gap-2">
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="px-2 py-2 rounded-lg text-xs border"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {CATEGORY_SUGGESTIONS.map((c) => (
                    <option key={c.category} value={c.category}>{c.category}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addCustom}
                  disabled={!customText.trim()}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-btn-primary-bg)',
                    color: 'var(--color-btn-primary-text)',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {drafts.length > 0 && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {drafts.length} picked{drafts.length > 5 ? ' — starting small (3-5) tends to stick best' : ''}
            </p>
          )}
        </div>
      )
    }

    // Review step
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          These will show up on your dashboard as tap-to-celebrate intentions.
        </p>
        <div className="space-y-2">
          {drafts.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-2 p-3 rounded-lg border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
            >
              <Heart size={14} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{d.statement}</p>
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{d.category}</p>
              </div>
              <button
                type="button"
                onClick={() => removeDraft(d.id)}
                className="shrink-0 p-1 rounded"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        {createError && (
          <div
            role="alert"
            className="rounded-lg p-3 text-sm border"
            style={{
              borderColor: 'var(--color-error, #b3261e)',
              color: 'var(--color-error, #b3261e)',
              backgroundColor: 'color-mix(in srgb, var(--color-error, #b3261e) 8%, var(--color-bg-card))',
            }}
          >
            {createError}
          </div>
        )}
      </div>
    )
  }

  return (
    <SetupWizard
      id="best-intentions-starter-wizard"
      isOpen={isOpen}
      onClose={onClose}
      title="Best Intentions Starter"
      subtitle="3-5 things you want to practice — tracked without pressure"
      steps={STEPS}
      currentStep={step}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
      onFinish={handleCreate}
      canAdvance={step !== 0 || drafts.length > 0}
      canFinish={drafts.length > 0}
      isFinishing={isCreating}
      finishLabel="Create Intentions"
      hideNav={deployed}
    >
      {renderStep()}
    </SetupWizard>
  )
}
