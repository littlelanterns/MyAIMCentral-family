/**
 * WizardDraftReopenPrompt + WizardDraftClosePrompt — STUDIO-EXPERIENCE ST-C.
 *
 * Shared UI for the Composition doc §2.2 save-and-return flow. Rendered
 * from inside SetupWizard so every wizard built on it gets this for free.
 * Mirrors the ModalV2 confirm pattern already established for Studio's
 * Archive confirmation (ST-A F-09 — no window.confirm, no reload).
 */

import { useState, useEffect } from 'react'
import { ModalV2 } from '@/components/shared/ModalV2'
import type { WizardDraftSummary } from './useWizardDraft'

function formatLastSaved(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

interface WizardDraftReopenPromptProps {
  isOpen: boolean
  drafts: WizardDraftSummary[]
  onContinue: (draftId: string) => void
  onStartFresh: () => void
}

export function WizardDraftReopenPrompt({
  isOpen,
  drafts,
  onContinue,
  onStartFresh,
}: WizardDraftReopenPromptProps) {
  if (!isOpen) return null
  return (
    <ModalV2
      id="wizard-draft-reopen-prompt"
      isOpen={isOpen}
      onClose={onStartFresh}
      title="Continue where you left off?"
      type="transient"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          We saved this from last time. Want to keep working, or start fresh?
        </p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {drafts.map((d) => (
            <button
              key={d.id}
              type="button"
              data-testid={`wizard-draft-continue-${d.id}`}
              onClick={() => onContinue(d.id)}
              className="w-full text-left p-3 rounded-lg border transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                {d.title || 'Untitled'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Saved {formatLastSaved(d.lastSaved)}
              </p>
            </button>
          ))}
        </div>
        <div className="flex justify-end pt-1">
          <button
            type="button"
            data-testid="wizard-draft-start-fresh"
            onClick={onStartFresh}
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            Start Fresh
          </button>
        </div>
      </div>
    </ModalV2>
  )
}

interface WizardDraftClosePromptProps {
  isOpen: boolean
  isSaving: boolean
  onSaveAndClose: () => void
  onDiscardAndClose: () => void
  onKeepWorking: () => void
}

export function WizardDraftClosePrompt({
  isOpen,
  isSaving,
  onSaveAndClose,
  onDiscardAndClose,
  onKeepWorking,
}: WizardDraftClosePromptProps) {
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)

  // Reset the sub-state whenever the prompt closes so it doesn't reopen
  // mid-confirmation next time.
  useEffect(() => {
    if (!isOpen) setConfirmingDiscard(false)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <ModalV2
      id="wizard-draft-close-prompt"
      isOpen={isOpen}
      onClose={onSaveAndClose}
      title={confirmingDiscard ? 'Discard for good?' : 'Save as a draft to come back to?'}
      type="transient"
      size="sm"
    >
      {!confirmingDiscard ? (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Your progress can be saved so you can pick it up later from Studio → Drafts.
          </p>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              data-testid="wizard-draft-discard"
              onClick={() => setConfirmingDiscard(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              No, discard
            </button>
            <button
              type="button"
              data-testid="wizard-draft-keep-working"
              onClick={onKeepWorking}
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Keep working
            </button>
            <button
              type="button"
              data-testid="wizard-draft-save"
              disabled={isSaving}
              onClick={onSaveAndClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
            >
              {isSaving ? 'Saving…' : 'Yes, save as draft'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
            This can't be undone — your progress will be gone for good.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              data-testid="wizard-draft-discard-cancel"
              onClick={() => setConfirmingDiscard(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Go back
            </button>
            <button
              type="button"
              data-testid="wizard-draft-discard-confirm"
              onClick={onDiscardAndClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ backgroundColor: 'var(--color-error, #dc2626)', color: '#ffffff' }}
            >
              Discard for good
            </button>
          </div>
        </div>
      )}
    </ModalV2>
  )
}
