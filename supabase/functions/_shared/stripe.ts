// Shared Stripe client for all Edge Functions (decision file §3.3 —
// claude/feature-decisions/PRD-40-COPPA-Compliance.md). Generic — zero
// COPPA-specific or subscription-specific logic lives here. PRD-40's
// stripe-webhook-handler and create-coppa-verification-intent are the first
// consumers; PRD-31's subscription webhook/checkout code reuses this same
// module rather than initializing a second Stripe client.
//
// Deno-specific wiring (official Stripe pattern for edge/Deno runtimes):
//   - httpClient: Stripe.createFetchHttpClient() — Deno has no Node `http`
//     module, so the SDK's default Node http client can't be used.
//   - Signature verification uses `constructEventAsync` + a SubtleCrypto
//     provider (`Stripe.createSubtleCryptoProvider()`), NOT the sync
//     `constructEvent` — Deno's crypto surface is Web Crypto (async) only,
//     the sync Node `crypto` module Stripe's default verifier expects is
//     unavailable.
//
// apiVersion is intentionally left unset: omitting it makes the SDK use the
// version it was built against (a fixed, known-good pin baked into the
// stripe@22.3.1 package itself), which is safer than hand-typing a
// date-versioned string from memory — the exact class of mistake flagged in
// CLAUDE.md's "Hand-typed OpenRouter model IDs" convention (silent failure
// class #8) applies equally to Stripe API version strings.

import Stripe from 'https://esm.sh/stripe@22.3.1?target=deno'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')

if (!STRIPE_SECRET_KEY) {
  // Fail loudly at module load rather than producing confusing downstream
  // errors from every call site — mirrors the `!` non-null assertions used
  // for SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY elsewhere in _shared/.
  throw new Error('STRIPE_SECRET_KEY is not configured (Supabase secret missing)')
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

/** Thrown when webhook signature verification fails or the secret is missing. */
export class StripeWebhookError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StripeWebhookError'
  }
}

/**
 * Verify and construct a Stripe event from a raw (unparsed) request body.
 * MUST be called with the raw text body — Stripe signs the exact bytes it
 * sent, so `req.json()` (which re-serializes) will always fail verification.
 *
 * Usage:
 *   const rawBody = await req.text()
 *   const signature = req.headers.get('Stripe-Signature')
 *   const event = await constructWebhookEvent(rawBody, signature)
 */
export async function constructWebhookEvent(
  rawBody: string,
  signature: string | null,
  // deno-lint-ignore no-explicit-any
): Promise<any> {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new StripeWebhookError('STRIPE_WEBHOOK_SECRET is not configured (Supabase secret missing)')
  }
  if (!signature) {
    throw new StripeWebhookError('Missing Stripe-Signature header')
  }
  try {
    return await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET,
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    throw new StripeWebhookError(`Signature verification failed: ${(err as Error).message}`)
  }
}

/** True if a Stripe error object represents a card decline (vs. a network/API-side failure). */
export function isDeclineError(err: unknown): boolean {
  const e = err as { type?: string; code?: string; decline_code?: string } | null
  return !!e && (e.type === 'StripeCardError' || !!e.decline_code || e.code === 'card_declined')
}
