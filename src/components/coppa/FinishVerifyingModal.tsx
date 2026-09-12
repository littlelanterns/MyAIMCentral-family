/**
 * PRD-40 §9.3 (BETA-COHORT) — "Finish verifying" modal.
 *
 * Offered on Settings -> Privacy & Consent once mom's ONLY active
 * verification is beta_interim AND the platform-wide beta-cohort switch has
 * flipped off (Stripe live) — see needsFinishVerifying() in useCoppaGate.ts.
 * Runs the SAME real-charge mechanics Screen 5 uses via
 * useStripeVerificationPayment (reuse per the seat's condition 2). The
 * interim row is never touched (immutability stands, PRD-40 §9.3) — this
 * records a NEW, real parent_verifications row. There is no batch to commit
 * and no new consent to give here; mom already consented for real — this
 * closes only the identity-verification gap, disclosed as such.
 *
 * R-10: mounted only from PrivacyConsentPage, which already renders nothing
 * inside View-As scope.
 */

import { useState } from 'react'
import { ShieldCheck, Loader, AlertTriangle } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useStripeVerificationPayment } from '@/lib/coppa/useStripeVerificationPayment'

export interface FinishVerifyingModalProps {
  isOpen: boolean
  onClose: () => void
  /** Called once the real verification row lands. */
  onVerified: () => void
}

export function FinishVerifyingModal({ isOpen, onClose, onVerified }: FinishVerifyingModalProps) {
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)

  const stripe = useStripeVerificationPayment({
    armed: started,
    onVerificationResolved: async () => {
      setDone(true)
      onVerified()
    },
  })

  const busy =
    stripe.payment.kind === 'confirming' || stripe.payment.kind === 'polling' || stripe.payment.kind === 'committing'

  function handleClose() {
    if (busy) return // never abandon mid-charge
    onClose()
  }

  if (!isOpen) return null

  return (
    <ModalV2
      id="coppa-finish-verifying"
      isOpen={isOpen}
      onClose={handleClose}
      type="transient"
      size="sm"
      title={done ? 'Verified!' : 'Finish Verifying'}
      icon={ShieldCheck}
    >
      <div className="density-comfortable space-y-4" data-testid="coppa-finish-verifying-modal">
        {done ? (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
            Thank you — your identity is now fully verified. This will appear on your statement
            as &ldquo;MYAIM VERIFY.&rdquo;
          </p>
        ) : !started ? (
          <>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
              During our beta, we skipped the $1 card check so founding families could get started
              right away. We&rsquo;re fully live now — completing that quick identity check
              finishes your COPPA verification for good. Nothing about your family or your
              children&rsquo;s consent changes; this is only about confirming it&rsquo;s really
              you.
            </p>
            <button
              type="button"
              data-testid="coppa-finish-verifying-start"
              onClick={() => setStarted(true)}
              className="w-full px-5 py-3 rounded-lg text-sm font-medium"
              style={{
                background: 'var(--surface-primary)',
                color: 'var(--color-text-on-primary)',
                minHeight: 'var(--touch-target-min, 44px)',
              }}
            >
              Verify with a $1.00 card check
            </button>
          </>
        ) : (
          <FinishVerifyingChargeStep stripe={stripe} />
        )}
      </div>
    </ModalV2>
  )
}

function FinishVerifyingChargeStep({ stripe }: { stripe: ReturnType<typeof useStripeVerificationPayment> }) {
  const { payment, keyMissing, mountNodeRef, handleVerify, retry } = stripe

  if (keyMissing) {
    return (
      <div
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
      >
        <AlertTriangle size={18} style={{ color: 'var(--color-warning, var(--color-text-secondary))', flexShrink: 0 }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Card verification isn&rsquo;t configured in this environment yet. Please contact
          support to finish verifying.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {payment.kind === 'creating_intent' && (
        <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <Loader size={16} className="animate-spin" /> Preparing secure payment form&hellip;
        </p>
      )}
      <div ref={mountNodeRef} data-testid="coppa-finish-verifying-payment-element" />
      {payment.kind === 'ready' && (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
          A $1.00 non-refundable verification charge will appear on your statement as
          &ldquo;MYAIM VERIFY.&rdquo;
        </p>
      )}

      {payment.kind === 'error' && (
        <div
          className="text-sm p-3 rounded-lg space-y-2"
          role="alert"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-error, var(--color-text-primary))' }}
        >
          <p>{payment.message}</p>
          <button
            type="button"
            onClick={retry}
            className="underline text-sm font-medium"
            style={{ color: 'var(--color-btn-primary-bg)' }}
          >
            Try again
          </button>
        </div>
      )}

      {payment.kind === 'webhook_lag' && (
        <p
          className="text-sm p-3 rounded-lg"
          role="status"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
        >
          Your verification charge processed but didn&rsquo;t complete on our end. We&rsquo;ve
          already been notified and will resolve this within 24 hours.
        </p>
      )}

      {(payment.kind === 'polling' || payment.kind === 'committing') && (
        <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <Loader size={16} className="animate-spin" />
          Confirming your verification…
        </p>
      )}

      <button
        type="button"
        data-testid="coppa-finish-verifying-charge"
        onClick={handleVerify}
        disabled={payment.kind !== 'ready'}
        className="w-full px-5 py-3 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        style={{
          background: 'var(--surface-primary)',
          color: 'var(--color-text-on-primary)',
          minHeight: 'var(--touch-target-min, 44px)',
        }}
      >
        {payment.kind === 'confirming' && <Loader size={16} className="animate-spin" />}
        Verify &amp; Finish &rarr;
      </button>
    </div>
  )
}
