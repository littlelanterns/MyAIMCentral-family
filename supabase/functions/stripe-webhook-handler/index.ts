// stripe-webhook-handler — the ONE Stripe webhook endpoint for the whole
// platform (decision file §3, claude/feature-decisions/PRD-40-COPPA-Compliance.md).
//
// Deployed --no-verify-jwt: Stripe sends no JWT — signature verification via
// the raw body + Stripe-Signature header IS the auth (see
// _shared/stripe.ts::constructWebhookEvent). config.toml entry lands in the
// same commit (the PRD-42 lesson — a new function without a config.toml
// entry silently fails `npm run prebuild`'s verify_jwt guard).
//
// Purpose-routed: dispatch key is `${event.type}:${metadata.purpose}`. This
// slice (PRD-40) registers the two coppa_verification events. PRD-31
// registers its five subscription events in the SAME handler map when it
// lands (its own Slice 2) — never a second webhook endpoint, never a second
// Stripe client (shared invariant, decision file §3).
//
// Two layers of idempotency, per decision file §3.3:
//   1. Router-level: stripe_webhook_events keyed on event.id. A row already
//      at status 'processed' or 'unrouted' means this exact event was
//      already fully handled — ack (200) without re-running the handler.
//      A row stuck at 'received' or 'error' (a prior delivery crashed
//      mid-handler) is NOT treated as done — returning 500 lets Stripe's
//      own retry schedule re-attempt it, and the next delivery will find
//      that same non-terminal status and proceed to reprocess.
//   2. Consumer-level: parent_verifications.stripe_payment_intent_id has a
//      partial UNIQUE index (migration 100305) as a second backstop.
//
// Unrouted events (no handler registered for this event.type + purpose)
// are acked with 200 and status='unrouted' — never let Stripe retry-spam a
// purpose we don't handle yet.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonHeaders } from '../_shared/cors.ts'
import { constructWebhookEvent, StripeWebhookError } from '../_shared/stripe.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// deno-lint-ignore no-explicit-any
type StripeEvent = any

interface PaymentIntentLike {
  id: string
  amount: number
  amount_received?: number
  currency: string
  customer: string | { id: string } | null
  metadata?: Record<string, string>
  last_payment_error?: { message?: string; decline_code?: string; code?: string } | null
}

// ──────────────────────────────────────────────────────────────────────────
// Handlers — PRD-40 coppa_verification purpose
// ──────────────────────────────────────────────────────────────────────────

async function handleCoppaVerificationSucceeded(event: StripeEvent): Promise<void> {
  const pi = event.data.object as PaymentIntentLike
  const familyId = pi.metadata?.family_id
  const parentMemberId = pi.metadata?.parent_member_id
  if (!familyId || !parentMemberId) {
    throw new Error(
      `payment_intent.succeeded (${pi.id}) missing coppa_verification metadata (family_id/parent_member_id)`,
    )
  }

  const customerId = typeof pi.customer === 'string' ? pi.customer : (pi.customer?.id ?? null)

  // NOTE: `uq_pv_stripe_payment_intent` (migration 100305) is a PARTIAL
  // unique index (`WHERE stripe_payment_intent_id IS NOT NULL`). PostgREST's
  // `.upsert(..., { onConflict })` compiles to a plain `ON CONFLICT (col)`
  // with no WHERE predicate, which Postgres cannot match against a partial
  // index — it raises "no unique or exclusion constraint matching the ON
  // CONFLICT specification" (found live during E2E proof, 2026-07-10).
  // Select-then-insert-with-catch is the correct pattern against a partial
  // unique index (same idiom already used for stripe_webhook_events dedup in
  // this same file, and for shadow-account upserts in family-auth-admin).
  let verificationId: string | null = null

  const { data: existingByIntent } = await supabase
    .from('parent_verifications')
    .select('id')
    .eq('stripe_payment_intent_id', pi.id)
    .maybeSingle()

  if (existingByIntent) {
    verificationId = existingByIntent.id
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('parent_verifications')
      .insert({
        family_id: familyId,
        parent_member_id: parentMemberId,
        verification_method: 'stripe_charge',
        stripe_payment_intent_id: pi.id,
        stripe_customer_id: customerId,
        amount_charged_cents: pi.amount_received ?? pi.amount,
        currency: (pi.currency || 'usd').toUpperCase(),
      })
      .select('id')
      .maybeSingle()

    if (insertError) {
      if (insertError.code === '23505') {
        // Either (a) a concurrent delivery of this SAME payment_intent won
        // the insert race (uq_pv_stripe_payment_intent), or (b) this parent
        // already has an ACTIVE verification from a DIFFERENT payment_intent
        // (uq_pv_active_per_parent) — e.g. two verification attempts both
        // completed (double-tap, two tabs). Do not fail the webhook (that
        // would retry-loop forever against a constraint that can never
        // resolve) — resolve to whichever row now represents this parent's
        // verification instead. A real double-charge here is a support/
        // refund concern, not a server error.
        const { data: retryByIntent } = await supabase
          .from('parent_verifications')
          .select('id')
          .eq('stripe_payment_intent_id', pi.id)
          .maybeSingle()
        if (retryByIntent) {
          verificationId = retryByIntent.id
        } else {
          const { data: active } = await supabase
            .from('parent_verifications')
            .select('id')
            .eq('parent_member_id', parentMemberId)
            .is('revoked_at', null)
            .maybeSingle()
          verificationId = active?.id ?? null
          console.warn(
            `stripe-webhook-handler: parent ${parentMemberId} already has an active verification; recording attempt only for pi=${pi.id}`,
          )
        }
      } else {
        throw new Error(`parent_verifications insert failed: ${insertError.message}`)
      }
    } else {
      verificationId = inserted?.id ?? null
    }
  }

  const { error: attemptError } = await supabase.from('parent_verification_attempts').insert({
    family_id: familyId,
    parent_member_id: parentMemberId,
    attempt_type: 'stripe_charge',
    status: 'succeeded',
    stripe_payment_intent_id: pi.id,
    verification_id: verificationId,
  })
  if (attemptError) {
    throw new Error(`parent_verification_attempts insert failed: ${attemptError.message}`)
  }
}

async function handleCoppaVerificationFailed(event: StripeEvent): Promise<void> {
  const pi = event.data.object as PaymentIntentLike
  const familyId = pi.metadata?.family_id
  const parentMemberId = pi.metadata?.parent_member_id
  if (!familyId || !parentMemberId) {
    throw new Error(`payment_intent.payment_failed (${pi.id}) missing coppa_verification metadata`)
  }

  const lastError = pi.last_payment_error
  const status = lastError?.decline_code || lastError?.code === 'card_declined' ? 'failed_declined' : 'failed_other'

  const { error } = await supabase.from('parent_verification_attempts').insert({
    family_id: familyId,
    parent_member_id: parentMemberId,
    attempt_type: 'stripe_charge',
    status,
    stripe_payment_intent_id: pi.id,
    failure_reason: lastError?.message ?? 'Payment failed (no error detail provided by Stripe)',
  })
  if (error) throw new Error(`parent_verification_attempts insert failed: ${error.message}`)
}

// ──────────────────────────────────────────────────────────────────────────
// Purpose-routed dispatch registry. PRD-31 (subscription lifecycle) adds
// its five events here in its own Slice 2 — same map, same file, per the
// decision file's "ONE webhook handler" invariant.
// ──────────────────────────────────────────────────────────────────────────

const HANDLERS: Record<string, (event: StripeEvent) => Promise<void>> = {
  'payment_intent.succeeded:coppa_verification': handleCoppaVerificationSucceeded,
  'payment_intent.payment_failed:coppa_verification': handleCoppaVerificationFailed,
}

function routeKey(event: StripeEvent): string {
  const obj = event.data?.object as { metadata?: Record<string, string> } | undefined
  const purpose = obj?.metadata?.purpose ?? 'none'
  return `${event.type}:${purpose}`
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const signature = req.headers.get('Stripe-Signature')
  const rawBody = await req.text()

  let event: StripeEvent
  try {
    event = await constructWebhookEvent(rawBody, signature)
  } catch (err) {
    if (err instanceof StripeWebhookError) {
      console.error('stripe-webhook-handler: signature verification failed:', err.message)
      return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: jsonHeaders })
    }
    console.error('stripe-webhook-handler: unexpected error during verification:', (err as Error).message)
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500, headers: jsonHeaders })
  }

  const purpose = (event.data?.object as { metadata?: Record<string, string> } | undefined)?.metadata?.purpose ?? null

  // ── Router-level dedup ──
  const { data: existing, error: selectError } = await supabase
    .from('stripe_webhook_events')
    .select('status')
    .eq('event_id', event.id)
    .maybeSingle()

  if (selectError) {
    console.error('stripe-webhook-handler: dedup lookup failed:', selectError.message)
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500, headers: jsonHeaders })
  }

  if (existing && (existing.status === 'processed' || existing.status === 'unrouted')) {
    return new Response(JSON.stringify({ received: true, deduped: true }), { headers: jsonHeaders })
  }

  if (!existing) {
    const { error: insertError } = await supabase
      .from('stripe_webhook_events')
      .insert({ event_id: event.id, type: event.type, purpose, status: 'received' })
    if (insertError && insertError.code !== '23505') {
      // 23505 = a concurrent delivery of the same event won the insert
      // race — safe to continue; whichever request runs the handler first
      // will mark it processed.
      console.error('stripe-webhook-handler: dedup insert failed:', insertError.message)
      return new Response(JSON.stringify({ error: 'internal error' }), { status: 500, headers: jsonHeaders })
    }
  }

  const key = routeKey(event)
  const handler = HANDLERS[key]

  if (!handler) {
    await supabase
      .from('stripe_webhook_events')
      .update({ status: 'unrouted', processed_at: new Date().toISOString() })
      .eq('event_id', event.id)
    return new Response(JSON.stringify({ received: true, routed: false }), { headers: jsonHeaders })
  }

  try {
    await handler(event)
    await supabase
      .from('stripe_webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString(), error: null })
      .eq('event_id', event.id)
    return new Response(JSON.stringify({ received: true, routed: true }), { headers: jsonHeaders })
  } catch (err) {
    const message = (err as Error).message
    console.error(`stripe-webhook-handler: handler failed for ${key}:`, message)
    await supabase
      .from('stripe_webhook_events')
      .update({ status: 'error', error: message })
      .eq('event_id', event.id)
    // 500 so Stripe retries — the dedup check above sees status='error'
    // (non-terminal) on the retry and re-runs the handler.
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: jsonHeaders })
  }
})
