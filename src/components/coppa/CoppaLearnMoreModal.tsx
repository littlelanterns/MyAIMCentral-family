/**
 * PRD-40 Slice 3 — "Learn what this means" mini-modal.
 *
 * Opened from the "Under 13 — COPPA Consent required" indicator on the
 * FamilySetup preview card (PRD-01 retrofit spec). Explains the upcoming
 * consent flow in plain language before mom saves.
 */

import { ShieldCheck } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'

export function CoppaLearnMoreModal({
  isOpen,
  childName,
  onClose,
}: {
  isOpen: boolean
  childName: string
  onClose: () => void
}) {
  if (!isOpen) return null
  return (
    <ModalV2
      id="coppa-learn-more"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="sm"
      title="Why consent is required"
      icon={ShieldCheck}
    >
      <div className="density-comfortable space-y-3" data-testid="coppa-learn-more">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          Because {childName} is under 13, U.S. federal law (COPPA) requires us to tell you
          exactly what we collect about them, get your consent, and verify you&rsquo;re their
          parent or legal guardian.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          When you save your family, we&rsquo;ll walk you through a short consent review — what
          we collect, how our AI assistant uses it, who can see it, and your rights — and then
          verify you with a one-time $1.00 card charge. You won&rsquo;t be charged again when
          adding more children, and you can review or revoke consent anytime in Settings.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full px-5 py-3 rounded-lg text-sm font-medium"
          style={{
            background: 'var(--surface-primary)',
            color: 'var(--color-text-on-primary)',
            minHeight: 'var(--touch-target-min, 44px)',
          }}
        >
          Got it
        </button>
      </div>
    </ModalV2>
  )
}
