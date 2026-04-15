/**
 * GetToKnowWizard — Guided walkthrough of 6 connection categories for a family member.
 *
 * Steps: Pick member → Gift Ideas → Meaningful Words → Helpful Actions →
 * Quality Time → Sensitivities → Comfort Needs → Summary.
 *
 * Uses CONNECTION_STARTER_PROMPTS for prompts, useCreateSelfKnowledge for saves.
 * Each step shows 3 rotating prompts and a text input. Mom can add multiple
 * entries per category or skip.
 */

import { useState, useCallback } from 'react'
import { Heart, Users, Plus, X, ChevronRight } from 'lucide-react'
import { SetupWizard, type WizardStep } from './SetupWizard'
import {
  SELF_KNOWLEDGE_CATEGORIES,
  CONNECTION_STARTER_PROMPTS,
  useCreateSelfKnowledge,
  type SelfKnowledgeCategory,
} from '@/hooks/useSelfKnowledge'

const CONNECTION_CATEGORIES = SELF_KNOWLEDGE_CATEGORIES.filter(c => c.group === 'connection')

const CATEGORY_ICONS: Record<string, string> = {
  gift_ideas: 'What would make their day?',
  meaningful_words: 'What words matter most to them?',
  helpful_actions: 'What really helps them?',
  quality_time_ideas: 'How do they like spending time?',
  sensitivities: 'What should you know about them?',
  comfort_needs: 'What helps when they\'re having a rough time?',
}

interface GetToKnowWizardProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  familyMembers: Array<{
    id: string
    display_name: string
    is_active?: boolean
    calendar_color?: string | null
    assigned_color?: string | null
    member_color?: string | null
    dashboard_mode?: string | null
  }>
}

export function GetToKnowWizard({
  isOpen,
  onClose,
  familyId,
  memberId,
  familyMembers,
}: GetToKnowWizardProps) {
  const [step, setStep] = useState(0)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  // Track entries per category: { category: string[] }
  const [entries, setEntries] = useState<Record<string, string[]>>({})
  // Current input per category
  const [currentInput, setCurrentInput] = useState('')
  // Which prompt to show per category
  const [promptIndex, setPromptIndex] = useState<Record<string, number>>({})

  const createEntry = useCreateSelfKnowledge()
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const selectedMember = familyMembers.find(m => m.id === selectedMemberId)
  const isGuided = selectedMember?.dashboard_mode === 'guided' || selectedMember?.dashboard_mode === 'play'

  // Build steps dynamically
  const steps: WizardStep[] = [
    { key: 'member', title: 'Pick a Person' },
    ...CONNECTION_CATEGORIES.map(c => ({
      key: c.value,
      title: c.label,
      optional: true,
    })),
    { key: 'summary', title: 'Done' },
  ]

  const currentCategory = step > 0 && step <= CONNECTION_CATEGORIES.length
    ? CONNECTION_CATEGORIES[step - 1]
    : null

  const prompts = currentCategory
    ? CONNECTION_STARTER_PROMPTS[currentCategory.value]
    : null

  const currentPromptList = prompts
    ? (isGuided ? prompts.guided : prompts.adult)
    : []

  const currentPromptIdx = currentCategory
    ? (promptIndex[currentCategory.value] ?? 0)
    : 0

  const activePrompt = currentPromptList[currentPromptIdx % currentPromptList.length] ?? ''

  const categoryEntries = currentCategory
    ? (entries[currentCategory.value] ?? [])
    : []

  const totalEntries = Object.values(entries).reduce((sum, arr) => sum + arr.length, 0)

  const addEntry = useCallback(() => {
    if (!currentCategory || !currentInput.trim()) return
    setEntries(prev => ({
      ...prev,
      [currentCategory.value]: [...(prev[currentCategory.value] ?? []), currentInput.trim()],
    }))
    setCurrentInput('')
    // Rotate to next prompt
    setPromptIndex(prev => ({
      ...prev,
      [currentCategory.value]: (prev[currentCategory.value] ?? 0) + 1,
    }))
  }, [currentCategory, currentInput])

  const removeEntry = useCallback((category: string, index: number) => {
    setEntries(prev => ({
      ...prev,
      [category]: (prev[category] ?? []).filter((_, i) => i !== index),
    }))
  }, [])

  const reset = useCallback(() => {
    setStep(0)
    setSelectedMemberId(null)
    setEntries({})
    setCurrentInput('')
    setPromptIndex({})
    setSaved(false)
    setIsSaving(false)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const canAdvance = (() => {
    if (step === 0) return !!selectedMemberId
    return true // category steps are optional
  })()

  const handleFinish = useCallback(async () => {
    if (isSaving || !selectedMemberId) return
    setIsSaving(true)

    try {
      for (const [category, items] of Object.entries(entries)) {
        for (const content of items) {
          await createEntry.mutateAsync({
            family_id: familyId,
            member_id: selectedMemberId,
            category: category as SelfKnowledgeCategory,
            content,
            source_type: 'manual',
            source: 'studio_wizard',
          })
        }
      }
      setSaved(true)
    } catch (err) {
      console.error('[GetToKnowWizard] Save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }, [isSaving, selectedMemberId, entries, familyId, createEntry])

  const handleNext = useCallback(() => {
    // If there's unsaved input in the text field, add it before advancing
    if (currentInput.trim() && currentCategory) {
      setEntries(prev => ({
        ...prev,
        [currentCategory.value]: [...(prev[currentCategory.value] ?? []), currentInput.trim()],
      }))
      setCurrentInput('')
    }
    setStep(s => s + 1)
  }, [currentInput, currentCategory])

  const activeMembers = familyMembers.filter(m => m.is_active !== false && m.id !== memberId)

  // Saved success screen
  if (saved) {
    return (
      <SetupWizard
        id="get-to-know-wizard"
        isOpen={isOpen}
        onClose={handleClose}
        title="Get to Know Your Family"
        steps={steps}
        currentStep={steps.length - 1}
        onBack={() => {}}
        onNext={() => {}}
        onFinish={handleClose}
        hideNav
      >
        <div className="text-center py-8">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' }}
          >
            <Heart size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
          </div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            {totalEntries} things saved for {selectedMember?.display_name}
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            LiLa now knows {selectedMember?.display_name} better. This context will help personalize
            gift ideas, communication style, and family interactions.
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-2 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            Done
          </button>
        </div>
      </SetupWizard>
    )
  }

  return (
    <SetupWizard
      id="get-to-know-wizard"
      isOpen={isOpen}
      onClose={handleClose}
      title={`Get to Know ${selectedMember?.display_name ?? 'Your Family'}`}
      subtitle={selectedMember ? `Building context for ${selectedMember.display_name}` : undefined}
      steps={steps}
      currentStep={step}
      onBack={() => { setCurrentInput(''); setStep(s => s - 1) }}
      onNext={handleNext}
      onFinish={handleFinish}
      canAdvance={canAdvance}
      canFinish={totalEntries > 0}
      isFinishing={isSaving}
      finishLabel={`Save ${totalEntries} Entries`}
    >
      {/* Step 0: Member picker */}
      {step === 0 && (
        <div>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Who do you want to learn more about? This walks you through the same
            Connection Preferences you'll find in InnerWorkings for each person.
            Everything you add here shows up there too.
          </p>
          <div className="flex flex-wrap gap-2">
            {activeMembers.map(m => {
              const isSelected = selectedMemberId === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className="rounded-full px-4 py-2.5 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--color-btn-primary-bg)'
                      : 'var(--color-bg-secondary)',
                    color: isSelected
                      ? 'var(--color-btn-primary-text)'
                      : 'var(--color-text-primary)',
                    border: isSelected
                      ? '2px solid var(--color-btn-primary-bg)'
                      : '2px solid var(--color-border)',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {m.display_name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Category steps (1-6) */}
      {currentCategory && (
        <div>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            {CATEGORY_ICONS[currentCategory.value] ?? 'Tell us about them.'}
          </p>

          {/* Prompt card */}
          <div
            className="rounded-xl p-4 mb-4"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))',
              border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)',
            }}
          >
            <p className="text-sm italic" style={{ color: 'var(--color-text-primary)' }}>
              "{activePrompt}"
            </p>
            {currentPromptList.length > 1 && (
              <button
                onClick={() => setPromptIndex(prev => ({
                  ...prev,
                  [currentCategory.value]: (prev[currentCategory.value] ?? 0) + 1,
                }))}
                className="flex items-center gap-1 mt-2 text-xs font-medium"
                style={{ color: 'var(--color-btn-primary-bg)' }}
              >
                Try a different prompt
                <ChevronRight size={12} />
              </button>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={currentInput}
              onChange={e => setCurrentInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && currentInput.trim()) addEntry() }}
              placeholder={`Type something about ${selectedMember?.display_name ?? 'them'}...`}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
              autoFocus
            />
            <button
              onClick={addEntry}
              disabled={!currentInput.trim()}
              className="rounded-lg px-3 py-2.5 transition-colors disabled:opacity-40"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Entries added so far */}
          {categoryEntries.length > 0 && (
            <div className="space-y-1.5">
              {categoryEntries.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <Heart size={14} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }} />
                  <span className="flex-1">{entry}</span>
                  <button
                    onClick={() => removeEntry(currentCategory.value, i)}
                    className="p-0.5 rounded hover:opacity-70"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {categoryEntries.length === 0 && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
              Add as many as you'd like, or skip to the next category.
            </p>
          )}
        </div>
      )}

      {/* Summary step */}
      {step === steps.length - 1 && !saved && (
        <div>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Here's what you've captured for {selectedMember?.display_name}:
          </p>
          {totalEntries === 0 ? (
            <div
              className="rounded-xl p-6 text-center"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <Users size={32} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                No entries added yet. Go back and add some!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {CONNECTION_CATEGORIES.map(cat => {
                const items = entries[cat.value] ?? []
                if (items.length === 0) return null
                return (
                  <div
                    key={cat.value}
                    className="rounded-xl p-3"
                    style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
                  >
                    <h4
                      className="text-xs font-semibold uppercase mb-1.5"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {cat.label} ({items.length})
                    </h4>
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
                          <Heart size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--color-btn-primary-bg)' }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </SetupWizard>
  )
}
