/**
 * PRD-40 — Shared Stripe $1 verification-charge mechanics: create the
 * PaymentIntent, mount the Payment Element, confirm, poll for the webhook-
 * written row, then hand off to the caller's own commit logic.
 *
 * Extracted from CoppaConsentFlow's Screen 5 (BETA-COHORT, 2026-09-12) so the
 * "finish verifying" flow (FinishVerifyingModal, Settings -> Privacy &
 * Consent, offered once the beta-cohort switch flips off) can reuse the
 * IDENTICAL mechanism instead of forking a second copy of this nontrivial
 * async state machine — the two flows diverge only in surrounding UI copy
 * and whether a prior affirmation gates arming the hook.
 *
 * R-13: the verification result is NEVER client-asserted. After
 * stripe.confirmPayment succeeds, this hook polls parent_verifications for
 * the webhook-written row and only then calls onVerificationResolved.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { loadStripe, type Stripe as StripeJs, type StripeElements } from '@stripe/stripe-js'
import { supabase } from '@/lib/supabase/client'
import { pollForVerification } from '@/lib/coppa/useCoppaGate'

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined

let stripePromise: Promise<StripeJs | null> | null = null
function getStripe(): Promise<StripeJs | null> {
  if (!STRIPE_PUBLISHABLE_KEY) return Promise.resolve(null)
  if (!stripePromise) stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  return stripePromise
}

export type StripeVerificationPaymentPhase =
  | { kind: 'idle' }
  | { kind: 'creating_intent' }
  | { kind: 'ready' }
  | { kind: 'confirming' }
  | { kind: 'polling' }
  | { kind: 'committing' }
  | { kind: 'webhook_lag' }
  | { kind: 'error'; message: string }

export interface UseStripeVerificationPaymentOptions {
  /** Start creating the intent + mounting the Payment Element once true. */
  armed: boolean
  /**
   * Called once the webhook-written verification row is observed (real
   * charge, OR the create-coppa-verification-intent already_verified short-
   * circuit). Throwing surfaces the message via the 'error' phase — nothing
   * is assumed saved.
   */
  onVerificationResolved: (verificationId: string) => Promise<void>
}

export function useStripeVerificationPayment({ armed, onVerificationResolved }: UseStripeVerificationPaymentOptions) {
  const elementsRef = useRef<StripeElements | null>(null)
  const stripeRef = useRef<StripeJs | null>(null)
  const paymentIntentIdRef = useRef<string | null>(null)
  const mountNodeRef = useRef<HTMLDivElement>(null)
  const setupStartedRef = useRef(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const [payment, setPayment] = useState<StripeVerificationPaymentPhase>({ kind: 'idle' })

  const keyMissing = !STRIPE_PUBLISHABLE_KEY

  const resolveVerification = useCallback(
    async (verificationId: string) => {
      setPayment({ kind: 'committing' })
      try {
        await onVerificationResolved(verificationId)
        setPayment({ kind: 'idle' })
      } catch (err) {
        setPayment({
          kind: 'error',
          message: `We verified you, but saving hit a snag: ${err instanceof Error ? err.message : 'Unknown error'}. Nothing was saved — you can try again.`,
        })
      }
    },
    [onVerificationResolved],
  )

  // Create the PaymentIntent + mount the Payment Element once armed (the
  // charge itself is the LAST commitment step — the intent charges nothing
  // until confirmed).
  useEffect(() => {
    if (!armed || keyMissing || setupStartedRef.current) return
    setupStartedRef.current = true
    let cancelled = false

    async function setup() {
      setPayment({ kind: 'creating_intent' })
      try {
        const { data, error } = await supabase.functions.invoke('create-coppa-verification-intent', {
          body: {},
        })
        if (cancelled) return
        if (error) throw new Error(error.message ?? 'Could not start verification')
        if (data?.error) {
          throw new Error(data.message ?? data.error)
        }
        if (data?.already_verified && data?.verification_id) {
          // Verified in a previous session — no new charge. Resolve directly.
          await resolveVerification(data.verification_id as string)
          return
        }
        const clientSecret = data?.client_secret as string | undefined
        const paymentIntentId = data?.payment_intent_id as string | undefined
        if (!clientSecret || !paymentIntentId) throw new Error('Verification service returned an unexpected response')
        paymentIntentIdRef.current = paymentIntentId

        const stripe = await getStripe()
        if (cancelled) return
        if (!stripe) throw new Error('Payment form could not load')
        stripeRef.current = stripe

        const rootStyle = getComputedStyle(document.documentElement)
        const elements = stripe.elements({
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: rootStyle.getPropertyValue('--color-btn-primary-bg').trim() || undefined,
            },
          },
        })
        elementsRef.current = elements
        const paymentElement = elements.create('payment')
        if (mountNodeRef.current) {
          paymentElement.mount(mountNodeRef.current)
          setPayment({ kind: 'ready' })
        }
      } catch (err) {
        if (!cancelled) {
          setupStartedRef.current = false
          setPayment({ kind: 'error', message: err instanceof Error ? err.message : 'Could not start verification' })
        }
      }
    }
    void setup()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed, keyMissing, retryNonce])

  const handleVerify = useCallback(async () => {
    const stripe = stripeRef.current
    const elements = elementsRef.current
    const paymentIntentId = paymentIntentIdRef.current
    if (!stripe || !elements || !paymentIntentId) return

    setPayment({ kind: 'confirming' })
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })
    if (error) {
      setPayment({
        kind: 'error',
        message:
          'We couldn’t process that verification charge. Please check your card details and try again, or use a different card.',
      })
      // Re-arm: keep the mounted element so the caller can fix the card and retry.
      setTimeout(() => setPayment({ kind: 'ready' }), 4000)
      return
    }

    // Charge succeeded — now wait for the WEBHOOK-written verification row
    // (R-13: the client never asserts verification; it observes it).
    setPayment({ kind: 'polling' })
    const verification = await pollForVerification(paymentIntentId)
    if (!verification) {
      setPayment({ kind: 'webhook_lag' })
      return
    }
    await resolveVerification(verification.id)
  }, [resolveVerification])

  const retry = useCallback(() => setRetryNonce((n) => n + 1), [])

  return { payment, keyMissing, mountNodeRef, handleVerify, retry }
}
