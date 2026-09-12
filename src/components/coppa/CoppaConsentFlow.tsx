/**
 * PRD-40 Slice 3 — COPPA Consent Flow (Screens 1–6).
 *
 * Full-screen consent modal shown when mom saves a roster batch containing
 * ≥1 under-13 member and has NO active parent verification. Five
 * scroll-enforced, individually-acknowledged disclosure sections (court-
 * defensible scrolled-past-content pattern per the PRD's decision
 * rationale), then Screen 5 (the $1 Stripe verification charge, OR — for a
 * founding family while BETA-COHORT mode is on, PRD-40 §9 — a no-charge
 * "verify later" acknowledgment), then success.
 *
 * Section text comes from the versioned `coppa_consent_templates` row —
 * NEVER hardcoded (the template is the legal audit artifact; edge case
 * "template retired mid-flow" is handled by capturing the template at
 * open time and consenting against the version mom actually saw).
 *
 * The verification result is NEVER client-asserted (ruling R-13): after
 * `stripe.confirmPayment` succeeds, we poll `parent_verifications` for the
 * webhook-written row, and only then does the parent commit the held
 * members via `commit_consented_members`. The Stripe mechanics (create
 * intent -> mount element -> confirm -> poll) live in the shared
 * `useStripeVerificationPayment` hook, reused by the "finish verifying"
 * flow on Settings -> Privacy & Consent post-cutover.
 *
 * R-10: mom's real session only. This component renders nothing inside a
 * View-As scope, and the surfaces that mount it (FamilySetup,
 * FamilyMembers) are already primary-parent-only.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ShieldCheck, Check, Loader, AlertTriangle, ChevronDown, Clock } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { ConsentSectionBody, joinNames } from '@/lib/coppa/consentText'
import { CONSENT_SECTION_KEYS } from '@/lib/coppa/brackets'
import type { CoppaConsentTemplate } from '@/lib/coppa/useCoppaGate'
import { createBetaInterimVerification } from '@/lib/coppa/useCoppaGate'
import { useStripeVerificationPayment } from '@/lib/coppa/useStripeVerificationPayment'

export interface CoppaConsentFlowProps {
  isOpen: boolean
  /** Cancel Family Setup — nothing committed, no charge; preview preserved by the parent. */
  onCancel: () => void
  /** Captured at open time — the version mom actually sees is the version she consents to. */
  template: CoppaConsentTemplate
  /** Display names of the under-13 members in the pending batch. */
  childNames: string[]
  /**
   * BETA-COHORT (PRD-40 §9): true when this family is founding AND the
   * platform-wide beta-cohort switch is on, resolved imperatively by the
   * caller at gate-fire time (mirrors how `template`/founding status are
   * already resolved) — never from possibly-still-loading hook state. When
   * true, Screen 5 offers the no-charge "verify later" acknowledgment
   * instead of the Stripe Payment Element.
   */
  betaInterimEligible: boolean
  /**
   * Called once the webhook-written verification row is observed. The
   * parent runs `commit_consented_members` + resumes the PIN pipeline.
   * Throws on failure (the RPC is atomic — nothing written on throw, so
   * retry is safe).
   */
  onVerified: (verificationId: string, acknowledgedSections: string[]) => Promise<void>
  /** Continue to Family Setup from the success screen. */
  onDone: () => void
}

const SECTION_TITLES: Record<string, string> = {
  what_we_collect: 'What We Collect',
  how_lila_uses: 'How LiLa Uses This',
  who_sees_it: 'Who Sees It',
  your_rights: 'Your Rights',
}

export function CoppaConsentFlow({
  isOpen,
  onCancel,
  template,
  childNames,
  betaInterimEligible,
  onVerified,
  onDone,
}: CoppaConsentFlowProps) {
  const { isViewingAs } = useViewAs()

  // 0..3 = disclosure sections, 4 = verification (Screen 5), 5 = success (Screen 6)
  const [step, setStep] = useState(0)
  const [acked, setAcked] = useState<boolean[]>([false, false, false, false])
  const [affirmed, setAffirmed] = useState(false)
  // Owned by VerificationStep (real: useStripeVerificationPayment; interim:
  // its own local RPC-in-flight state) and reported up here so the modal's
  // close button can still refuse to abandon mid-charge/mid-commit
  // regardless of which path is active.
  const [busy, setBusy] = useState(false)

  const names = joinNames(childNames)

  const sections = useMemo(
    () => [
      { key: 'what_we_collect', body: template.section_what_we_collect, ackLabel: `I've read what will be collected about ${names}.` },
      { key: 'how_lila_uses', body: template.section_how_lila_uses, ackLabel: `I understand how LiLa and AI features use ${names}'s information.` },
      { key: 'who_sees_it', body: template.section_who_sees_it, ackLabel: `I understand who can see ${names}'s information.` },
      { key: 'your_rights', body: template.section_your_rights, ackLabel: `I understand my rights regarding ${names}'s information.` },
    ],
    [template, names],
  )

  // Reset when (re)opened
  useEffect(() => {
    if (isOpen) {
      setStep(0)
      setAcked([false, false, false, false])
      setAffirmed(false)
      setBusy(false)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    if (busy) return // never abandon mid-charge/mid-commit
    onCancel()
  }, [busy, onCancel])

  // Shared tail for BOTH paths (real Stripe charge, beta-interim ack): call
  // the parent's commit logic, advance to the success screen on success.
  // Errors propagate back to whichever panel is calling this (its own
  // catch shows the "we verified you, but saving hit a snag" message) —
  // nothing here swallows a failure.
  const handleVerificationResolved = useCallback(
    async (verificationId: string) => {
      await onVerified(verificationId, [...CONSENT_SECTION_KEYS])
      setStep(5)
    },
    [onVerified],
  )

  if (isViewingAs) return null // R-10 — COPPA UI never renders inside View-As scope
  if (!isOpen) return null

  const isSuccess = step === 5
  const title = isSuccess
    ? 'Verified!'
    : childNames.length === 1
      ? `Protecting ${childNames[0]}'s Privacy`
      : 'Protecting Your Children’s Privacy'
  // The transient ModalHeader renders title-only, so the PRD's "Section N of
  // 5" indicator lives at the top of the body instead.
  const stepIndicator = isSuccess
    ? null
    : step < 4
      ? `Section ${step + 1} of 5 — ${SECTION_TITLES[sections[step]?.key] ?? ''}`
      : 'Section 5 of 5 — Verify You’re the Parent'

  return (
    <ModalV2
      id="coppa-consent-flow"
      isOpen={isOpen}
      onClose={handleClose}
      type="transient"
      size="lg"
      title={title}
      icon={ShieldCheck}
      mobileStyle="full-screen"
    >
      <div className="density-comfortable space-y-4" data-testid="coppa-consent-flow">
        {stepIndicator && (
          <p
            data-testid="coppa-step-indicator"
            className="font-medium"
            style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}
          >
            {stepIndicator}
          </p>
        )}
        {step < 4 && (
          <DisclosureSection
            key={sections[step].key}
            body={sections[step].body}
            childNames={childNames}
            ackLabel={sections[step].ackLabel}
            acked={acked[step]}
            onAck={(v) => setAcked((prev) => prev.map((a, i) => (i === step ? v : a)))}
            showLawIntro={step === 0}
            names={names}
            footer={
              <StepFooter
                backLabel={step === 0 ? '← Cancel Family Setup' : '← Back'}
                onBack={step === 0 ? handleClose : () => setStep(step - 1)}
                nextLabel={`Continue to ${step + 2} of 5 →`}
                nextEnabled={acked[step]}
                onNext={() => setStep(step + 1)}
              />
            }
          />
        )}

        {step === 4 && (
          <VerificationStep
            template={template}
            childNames={childNames}
            affirmed={affirmed}
            onAffirm={setAffirmed}
            betaInterimEligible={betaInterimEligible}
            onBack={() => setStep(3)}
            onVerificationResolved={handleVerificationResolved}
            onBusyChange={setBusy}
          />
        )}

        {isSuccess && <SuccessScreen childNames={childNames} onDone={onDone} />}
      </div>
    </ModalV2>
  )
}

/* ── Screens 1–4: scroll-enforced disclosure section ─────────────────────── */

function DisclosureSection({
  body,
  childNames,
  ackLabel,
  acked,
  onAck,
  showLawIntro,
  names,
  footer,
}: {
  body: string
  childNames: string[]
  ackLabel: string
  acked: boolean
  onAck: (v: boolean) => void
  showLawIntro: boolean
  names: string
  footer: React.ReactNode
}) {
  const { ref, reachedEnd } = useScrollGate()

  return (
    <div className="space-y-4">
      {showLawIntro && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Because {names} {childNames.length === 1 ? 'is' : 'are'} under 13, U.S. federal law
          (COPPA) requires us to tell you exactly what we collect, get your consent, and verify
          you&rsquo;re their parent or legal guardian.
        </p>
      )}

      <div
        ref={ref}
        data-testid="coppa-section-scroll"
        className="overflow-y-auto rounded-xl p-4"
        style={{
          maxHeight: '46vh',
          backgroundColor: 'color-mix(in srgb, var(--color-bg-card) 90%, transparent)',
          border: '1px solid var(--color-border)',
        }}
      >
        <ConsentSectionBody text={body} childNames={childNames} />
      </div>

      {!reachedEnd && (
        <p
          className="flex items-center gap-1.5 justify-center"
          style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}
        >
          <ChevronDown size={14} /> Scroll to the end to continue
        </p>
      )}

      <label
        className="flex items-start gap-3 p-3 rounded-lg cursor-pointer"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          opacity: reachedEnd ? 1 : 0.5,
          cursor: reachedEnd ? 'pointer' : 'not-allowed',
        }}
      >
        <input
          type="checkbox"
          data-testid="coppa-section-ack"
          checked={acked}
          disabled={!reachedEnd}
          onChange={(e) => onAck(e.target.checked)}
          className="mt-0.5 w-4 h-4"
          style={{ accentColor: 'var(--color-btn-primary-bg)' }}
        />
        <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {ackLabel}
        </span>
      </label>

      {footer}
    </div>
  )
}

/**
 * Scrolled-past-content enforcement. Marks reached-end when the container
 * is scrolled to (near) the bottom — or immediately when the content is
 * short enough that no scrolling is possible.
 */
function useScrollGate() {
  const ref = useRef<HTMLDivElement>(null)
  const [reachedEnd, setReachedEnd] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 16) setReachedEnd(true)
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
  }, [])

  return { ref, reachedEnd }
}

function StepFooter({
  backLabel,
  onBack,
  nextLabel,
  nextEnabled,
  onNext,
}: {
  backLabel: string
  onBack: () => void
  nextLabel: string
  nextEnabled: boolean
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <button
        type="button"
        onClick={onBack}
        className="px-4 py-2.5 rounded-lg text-sm font-medium"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
          minHeight: 'var(--touch-target-min, 44px)',
        }}
      >
        {backLabel}
      </button>
      <button
        type="button"
        data-testid="coppa-section-continue"
        onClick={onNext}
        disabled={!nextEnabled}
        className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
        style={{
          background: 'var(--surface-primary)',
          color: 'var(--color-text-on-primary)',
          minHeight: 'var(--touch-target-min, 44px)',
        }}
      >
        {nextLabel}
      </button>
    </div>
  )
}

/* ── Screen 5: affirmation + verification (real $1 charge, or the
   BETA-COHORT interim ack) ─────────────────────────────────────────────── */

function VerificationStep({
  template,
  childNames,
  affirmed,
  onAffirm,
  betaInterimEligible,
  onBack,
  onVerificationResolved,
  onBusyChange,
}: {
  template: CoppaConsentTemplate
  childNames: string[]
  affirmed: boolean
  onAffirm: (v: boolean) => void
  betaInterimEligible: boolean
  onBack: () => void
  onVerificationResolved: (verificationId: string) => Promise<void>
  onBusyChange: (busy: boolean) => void
}) {
  // Always called (rules of hooks) — its internal effect only ever fires
  // when armed, i.e. on the real-charge path with the affirmation checked.
  // While betaInterimEligible is true, `armed` is always false and this
  // hook stays fully inert.
  const stripe = useStripeVerificationPayment({
    armed: affirmed && !betaInterimEligible,
    onVerificationResolved,
  })

  const [interimPhase, setInterimPhase] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [interimError, setInterimError] = useState<string | null>(null)

  async function handleInterimContinue() {
    setInterimPhase('submitting')
    setInterimError(null)
    try {
      const result = await createBetaInterimVerification()
      await onVerificationResolved(result.verification_id)
      setInterimPhase('idle')
    } catch (err) {
      setInterimPhase('error')
      setInterimError(
        `We recorded your interim verification, but saving hit a snag: ${err instanceof Error ? err.message : 'Unknown error'}. Nothing was saved — you can try again.`,
      )
    }
  }

  const busy = betaInterimEligible
    ? interimPhase === 'submitting'
    : stripe.payment.kind === 'confirming' || stripe.payment.kind === 'polling' || stripe.payment.kind === 'committing'

  useEffect(() => {
    onBusyChange(busy)
  }, [busy, onBusyChange])

  return (
    <div className="space-y-4">
      {/* Parent affirmation — text from the versioned template */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-bg-card) 90%, transparent)',
          border: '1px solid var(--color-border)',
        }}
      >
        <ConsentSectionBody text={template.section_parent_affirmation} childNames={childNames} />
      </div>

      <label
        className="flex items-start gap-3 p-3 rounded-lg cursor-pointer"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <input
          type="checkbox"
          data-testid="coppa-affirmation-ack"
          checked={affirmed}
          disabled={busy}
          onChange={(e) => onAffirm(e.target.checked)}
          className="mt-0.5 w-4 h-4"
          style={{ accentColor: 'var(--color-btn-primary-bg)' }}
        />
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          I affirm that I am the parent or legal guardian of {joinNames(childNames)} and every
          child I add to this family, and I consent to the collection and use of their
          information as described in the previous sections.
        </span>
      </label>

      {betaInterimEligible ? (
        <BetaInterimPanel
          affirmed={affirmed}
          phase={interimPhase}
          error={interimError}
          onContinue={handleInterimContinue}
          onBack={onBack}
        />
      ) : (
        <RealStripeVerificationPanel affirmed={affirmed} stripe={stripe} onBack={onBack} />
      )}
    </div>
  )
}

/* ── Screen 5, real-charge branch ─────────────────────────────────────────── */

function RealStripeVerificationPanel({
  affirmed,
  stripe,
  onBack,
}: {
  affirmed: boolean
  stripe: ReturnType<typeof useStripeVerificationPayment>
  onBack: () => void
}) {
  const { payment, keyMissing, mountNodeRef, handleVerify, retry } = stripe
  const busy = payment.kind === 'confirming' || payment.kind === 'polling' || payment.kind === 'committing'

  return (
    <>
      {keyMissing ? (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
        >
          <AlertTriangle size={18} style={{ color: 'var(--color-warning, var(--color-text-secondary))', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Card verification isn&rsquo;t configured in this environment yet. Your family
            hasn&rsquo;t been changed — please contact support to finish verifying.
          </p>
        </div>
      ) : (
        affirmed && (
          <div className="space-y-3">
            {payment.kind === 'creating_intent' && (
              <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <Loader size={16} className="animate-spin" /> Preparing secure payment form&hellip;
              </p>
            )}
            <div ref={mountNodeRef} data-testid="coppa-payment-element" />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
              By tapping Verify &amp; Continue, you authorize a $1.00 non-refundable verification
              charge to the card above. It will appear on your statement as &ldquo;MYAIM
              VERIFY.&rdquo;
            </p>
          </div>
        )
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
          already been notified and will resolve this within 24 hours. You can continue using
          the app in the meantime.
        </p>
      )}

      {(payment.kind === 'polling' || payment.kind === 'committing') && (
        <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <Loader size={16} className="animate-spin" />
          {payment.kind === 'polling' ? 'Confirming your verification…' : 'Saving your family…'}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            minHeight: 'var(--touch-target-min, 44px)',
          }}
        >
          &larr; Back
        </button>
        <button
          type="button"
          data-testid="coppa-verify-continue"
          onClick={handleVerify}
          disabled={keyMissing || !affirmed || payment.kind !== 'ready'}
          className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          style={{
            background: 'var(--surface-primary)',
            color: 'var(--color-text-on-primary)',
            minHeight: 'var(--touch-target-min, 44px)',
          }}
        >
          {payment.kind === 'confirming' && <Loader size={16} className="animate-spin" />}
          Verify &amp; Continue &rarr;
        </button>
      </div>
    </>
  )
}

/* ── Screen 5, BETA-COHORT interim branch (PRD-40 §9) ────────────────────── */

function BetaInterimPanel({
  affirmed,
  phase,
  error,
  onContinue,
  onBack,
}: {
  affirmed: boolean
  phase: 'idle' | 'submitting' | 'error'
  error: string | null
  onContinue: () => void
  onBack: () => void
}) {
  const busy = phase === 'submitting'

  return (
    <>
      <div
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
      >
        <Clock size={18} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: 2 }} />
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          You&rsquo;re one of our founding beta families, so there&rsquo;s no card charge right
          now. We&rsquo;ll ask you to verify your identity with a quick $1.00 card check once we
          go fully live — until then, this acknowledgment is what confirms your consent.
        </p>
      </div>

      {phase === 'error' && error && (
        <p
          className="text-sm p-3 rounded-lg"
          role="alert"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-error, var(--color-text-primary))' }}
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            minHeight: 'var(--touch-target-min, 44px)',
          }}
        >
          &larr; Back
        </button>
        <button
          type="button"
          data-testid="coppa-interim-continue"
          onClick={onContinue}
          disabled={!affirmed || busy}
          className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          style={{
            background: 'var(--surface-primary)',
            color: 'var(--color-text-on-primary)',
            minHeight: 'var(--touch-target-min, 44px)',
          }}
        >
          {busy && <Loader size={16} className="animate-spin" />}
          Continue &rarr;
        </button>
      </div>
    </>
  )
}

/* ── Screen 6: success ───────────────────────────────────────────────────── */

function SuccessScreen({ childNames, onDone }: { childNames: string[]; onDone: () => void }) {
  return (
    <div className="space-y-4 text-center py-4" data-testid="coppa-success-screen">
      <div
        className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
        style={{ background: 'var(--surface-primary)' }}
      >
        <Check size={28} style={{ color: 'var(--color-text-on-primary)' }} />
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
        Thank you for taking the time to protect your family&rsquo;s privacy. Consent records
        for the following {childNames.length === 1 ? 'child have' : 'children have'} been saved:
      </p>
      <ul className="space-y-1">
        {childNames.map((n) => (
          <li key={n} className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            {n}
          </li>
        ))}
      </ul>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        You can review or manage consent anytime in Settings &rarr; Privacy &amp; Consent. The
        $1.00 verification charge will appear on your statement as &ldquo;MYAIM VERIFY.&rdquo;
      </p>
      <button
        type="button"
        data-testid="coppa-success-continue"
        onClick={onDone}
        className="px-6 py-3 rounded-lg font-medium"
        style={{
          background: 'var(--surface-primary)',
          color: 'var(--color-text-on-primary)',
          minHeight: 'var(--touch-target-min, 44px)',
        }}
      >
        Continue to Family Setup &rarr;
      </button>
    </div>
  )
}
