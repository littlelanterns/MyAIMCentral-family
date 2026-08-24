/**
 * PRD-40 Slice 4 — Screen 9: Revocation Flow.
 *
 * Three steps: (1) what happens, (2) type-to-confirm + optional reason,
 * (3) confirmation with the scheduled deletion date. Type-to-confirm is a
 * FRONTEND-only UX gate (the RPC itself does not re-verify the typed name —
 * see migration 00000000100319's comment) that slows mom down before an
 * action the PRD calls "permanent and cannot be undone" past the grace
 * window.
 *
 * R-10: mounted only from PrivacyConsentPage, which already blocks View-As
 * scope and non-mom shells.
 */

import { useState } from 'react'
import { AlertTriangle, Check, Loader } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useRevokeCoppaConsent } from '@/lib/coppa/useCoppaGate'

const REASON_OPTIONS = [
  { key: 'aging_out', label: 'My child is aging out' },
  { key: 'privacy', label: 'Privacy concerns' },
  { key: 'not_using', label: 'Not using the platform' },
  { key: 'other', label: 'Other' },
] as const

export interface CoppaRevocationModalProps {
  isOpen: boolean
  onClose: () => void
  childMemberId: string
  childName: string
}

type Step = 'warning' | 'confirm' | 'done'

export function CoppaRevocationModal({ isOpen, onClose, childMemberId, childName }: CoppaRevocationModalProps) {
  const [step, setStep] = useState<Step>('warning')
  const [typedName, setTypedName] = useState('')
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [scheduledFor, setScheduledFor] = useState<string | null>(null)
  const revoke = useRevokeCoppaConsent()

  function reset() {
    setStep('warning')
    setTypedName('')
    setSelectedReason(null)
    setScheduledFor(null)
    revoke.reset()
  }

  function handleClose() {
    reset()
    onClose()
  }

  const nameMatches = typedName.trim().toLowerCase() === childName.trim().toLowerCase()

  async function handleRevoke() {
    if (!nameMatches) return
    const reasonLabel = REASON_OPTIONS.find((r) => r.key === selectedReason)?.label
    const result = await revoke.mutateAsync({ childMemberId, reason: reasonLabel })
    setScheduledFor(result.scheduled_deletion_at)
    setStep('done')
  }

  return (
    <ModalV2
      id="coppa-revocation"
      isOpen={isOpen}
      onClose={handleClose}
      type="transient"
      size="md"
      title={`Revoke Consent for ${childName}`}
      icon={AlertTriangle}
    >
      {step === 'warning' && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
            If you revoke consent for {childName}:
          </p>
          <ul className="space-y-2 pl-5 text-sm" style={{ listStyleType: 'disc', color: 'var(--color-text-primary)' }}>
            <li>{childName}'s profile will be removed from your family in 14 days</li>
            <li>All of {childName}'s data will be permanently deleted: tasks, journal entries, LiLa conversations, Archives notes, photos, and everything else listed in your original consent</li>
            <li>Your consent record will be preserved as an audit trail, but marked revoked</li>
            <li>This does NOT affect your other children's data</li>
          </ul>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            You have 14 days to change your mind. After that, deletion is permanent and cannot be undone.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              I'd like to keep things as they are
            </button>
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-error, #d64545)', color: '#fff', border: 'none' }}
            >
              Continue to Revoke
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>Are you sure?</p>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Type {childName} to confirm:
            </label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={childName}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              autoFocus
            />
          </div>
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Optional — tell us why (helps us improve):
            </p>
            <div className="space-y-1.5">
              {REASON_OPTIONS.map((r) => (
                <label key={r.key} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                  <input
                    type="radio"
                    name="revocation-reason"
                    checked={selectedReason === r.key}
                    onChange={() => setSelectedReason(r.key)}
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>
          {revoke.isError && (
            <p className="text-xs" style={{ color: 'var(--color-error, #d64545)' }}>
              {revoke.error instanceof Error ? revoke.error.message : 'Something went wrong. Please try again.'}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={() => setStep('warning')}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              Back
            </button>
            <button
              onClick={handleRevoke}
              disabled={!nameMatches || revoke.isPending}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              style={{
                backgroundColor: nameMatches ? 'var(--color-error, #d64545)' : 'var(--color-bg-secondary)',
                color: nameMatches ? '#fff' : 'var(--color-text-tertiary)',
                border: 'none',
                opacity: revoke.isPending ? 0.7 : 1,
              }}
            >
              {revoke.isPending ? <Loader size={14} className="animate-spin" /> : null}
              Revoke Consent & Start Deletion
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-4 text-center py-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-error, #d64545) 15%, transparent)' }}
          >
            <Check size={28} style={{ color: 'var(--color-error, #d64545)' }} />
          </div>
          <p className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>Consent Revoked</p>
          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
            {childName}'s data will be permanently deleted on{' '}
            {scheduledFor ? new Date(scheduledFor).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'the scheduled date'}.
          </p>
          <div className="text-left text-sm space-y-1 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>During this 14-day window:</p>
            <ul className="pl-5 space-y-1" style={{ listStyleType: 'disc', color: 'var(--color-text-primary)' }}>
              <li>{childName}'s profile is hidden from dashboards</li>
              <li>No new data is collected about them</li>
              <li>You can restore access any time by tapping "Undo Revocation" below</li>
            </ul>
          </div>
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)', border: 'none' }}
          >
            Done
          </button>
        </div>
      )}
    </ModalV2>
  )
}
