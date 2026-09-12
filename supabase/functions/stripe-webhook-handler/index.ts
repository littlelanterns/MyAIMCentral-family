// stripe-webhook-handler — the ONE Stripe webhook endpoint for the whole
// platform (decision file §3, claude/feature-decisions/PRD-40-COPPA-Compliance.md).
//
// Deployed --no-verify-jwt: Stripe sends no JWT — signature verification via
// the raw body + Stripe-Signature header IS the auth (see
// _shared/stripe.ts::constructWebhookEvent). config.toml entry lands in the
// same commit (the PRD-42 lesson — a new function without a config.toml
// entry silently fails `npm run prebuild`'s verify_jwt guard).
//
// Purpose-routed: dispatch key is `${event.type}:${metadata.purpose}`. PRD-40
// registered the two coppa_verification events; PRD-31 Slice 2 registers its
// five subscription events in the SAME handler map — never a second webhook
// endpoint, never a second Stripe client (shared invariant, decision file
// §3, ruling R31-12).
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
import { constructWebhookEvent, StripeWebhookError, stripe } from '../_shared/stripe.ts'

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

// PRD-31 Slice 2 — subscription lifecycle types. Loosely typed (matches this
// file's existing PaymentIntentLike style) since only the fields this handler
// touches are declared.
interface CheckoutSessionLike {
  id: string
  customer: string | { id: string } | null
  subscription: string | { id: string } | null
  metadata?: Record<string, string>
}

interface SubscriptionLike {
  id: string
  customer: string | { id: string } | null
  status: string
  // Present at the top level on older Stripe API versions; on newer
  // versions ("flexible billing") these moved to the subscription ITEM
  // level instead. _shared/stripe.ts deliberately does not pin an
  // apiVersion (uses the stripe@22.3.1 SDK's own bundled default), so
  // getSubscriptionPeriod() below checks both locations rather than
  // assuming which shape is live — an unverified assumption here would be
  // exactly the class of silent-failure risk CLAUDE.md's "hand-typed model
  // IDs" convention warns about, applied to an API shape instead of a
  // string constant.
  current_period_start?: number
  current_period_end?: number
  metadata?: Record<string, string>
  items?: { data?: Array<{ price?: { id?: string }; current_period_start?: number; current_period_end?: number }> }
}

/** Defensive against both Stripe API-version shapes for subscription period dates — see the SubscriptionLike comment. */
function getSubscriptionPeriod(subscription: SubscriptionLike): { start: number | undefined; end: number | undefined } {
  const item = subscription.items?.data?.[0]
  return {
    start: subscription.current_period_start ?? item?.current_period_start,
    end: subscription.current_period_end ?? item?.current_period_end,
  }
}

interface InvoiceLike {
  id: string
  customer: string | { id: string } | null
  subscription?: string | { id: string } | null
  metadata?: Record<string, string>
  subscription_details?: { metadata?: Record<string, string> }
  parent?: { subscription_details?: { metadata?: Record<string, string> } }
  last_finalization_error?: { message?: string } | null
}

/**
 * PRD-31 Slice 2. Extracts a `purpose`-tagged metadata bag from a Stripe
 * object, checking every location a subscription-related object might carry
 * it. Checkout Sessions and Subscriptions always carry their own top-level
 * `.metadata` (this handler's session-creation code sets both `metadata` and
 * `subscription_data.metadata` identically at session-creation time — see
 * create-subscription-checkout). Invoices are the one object type where
 * Stripe's metadata-propagation behavior varies by API version, so this
 * checks the newer `parent.subscription_details.metadata` shape, the older
 * `subscription_details.metadata` shape, and finally the invoice's own
 * top-level `.metadata` (in case it was set explicitly), before giving up.
 */
function getEventMetadata(obj: {
  metadata?: Record<string, string>
  subscription_details?: { metadata?: Record<string, string> }
  parent?: { subscription_details?: { metadata?: Record<string, string> } }
} | undefined): Record<string, string> | undefined {
  return (
    obj?.metadata ??
    obj?.parent?.subscription_details?.metadata ??
    obj?.subscription_details?.metadata
  )
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
// Handlers — PRD-31 Slice 2 `subscription` purpose. Registers this build's
// 5 events in the SAME purpose-routed map per ruling R31-12 / decision file
// §3 ("ONE webhook handler, ONE _shared/stripe.ts" — never a second endpoint).
//
// `family_subscriptions` is written ONLY here (never by client code, never
// by create-subscription-checkout/-change/-portal-session — those functions
// only talk to Stripe; Stripe's own webhook delivery is what drives every
// write to this table, per the platform-wide convention: "Stripe is the
// single source of payment truth").
// ──────────────────────────────────────────────────────────────────────────

/** Maps a Stripe subscription status to this platform's family_subscriptions.status CHECK (active/past_due/cancelled/trialing). Unknown/incomplete Stripe statuses fall back to past_due rather than risk a CHECK-violation crash. */
function mapSubscriptionStatus(stripeStatus: string): 'active' | 'past_due' | 'cancelled' | 'trialing' {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'canceled':
      return 'cancelled'
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
    default:
      return 'past_due'
  }
}

async function handleCheckoutSessionCompleted(event: StripeEvent): Promise<void> {
  const session = event.data.object as CheckoutSessionLike
  const meta = getEventMetadata(session) ?? {}
  const familyId = meta.family_id
  const tierId = meta.tier_id
  const foundingKind = meta.founding_kind === 'founding' || meta.founding_kind === 'founding_code' ? meta.founding_kind : null
  const foundingCode = meta.founding_code

  if (!familyId || !tierId) {
    throw new Error(`checkout.session.completed (${session.id}) missing subscription metadata (family_id/tier_id)`)
  }

  const customerId = typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? null)
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : (session.subscription?.id ?? null)
  if (!subscriptionId) {
    throw new Error(`checkout.session.completed (${session.id}) has no subscription id — expected mode:'subscription'`)
  }

  // Retrieve the full Subscription object — the Session itself does not
  // carry period dates or line-item price ids.
  const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as SubscriptionLike

  const { data: tier, error: tierError } = await supabase
    .from('subscription_tiers')
    .select('price_monthly, price_yearly, founding_discount')
    .eq('id', tierId)
    .maybeSingle()
  if (tierError) throw new Error(`subscription_tiers lookup failed: ${tierError.message}`)
  if (!tier) throw new Error(`subscription_tiers row not found for tier_id=${tierId}`)

  // ── Resolve the actual founding kind. Organic: honored unconditionally
  //    (soft cap — "the webhook honors whatever price the session was
  //    created with and never refuses after the fact", ruling 2026-09-11 §1).
  //    Code: redeemed atomically here; on a race (code consumed by a
  //    different delivery between session-creation and this webhook) the
  //    charge already happened at the founding price, so it is still
  //    honored — a double-redemption race is a support/audit concern, not a
  //    reason to silently downgrade a mom who was already charged the lower
  //    price (mirrors this file's own payment_intent 23505 handling
  //    philosophy: never punish the customer for a server-side race). ──
  let resolvedKind: 'founding' | 'founding_code' | null = null
  if (foundingKind === 'founding') {
    resolvedKind = 'founding'
  } else if (foundingKind === 'founding_code' && foundingCode) {
    const { data: redeemed, error: redeemError } = await supabase.rpc('redeem_founding_code', {
      p_code: foundingCode,
      p_family_id: familyId,
    })
    if (redeemError) {
      console.error(`stripe-webhook-handler: redeem_founding_code failed for ${foundingCode}:`, redeemError.message)
    }
    // Honored regardless of the redemption outcome — see the comment above.
    resolvedKind = 'founding_code'
    if (redeemed !== true) {
      console.warn(
        `stripe-webhook-handler: founding code ${foundingCode} was already redeemed/invalid by webhook time for family ${familyId} — honoring the already-charged founding price anyway.`,
      )
    }
  }

  const foundingRateMonthly = resolvedKind ? Number(tier.price_monthly) - Number(tier.founding_discount ?? 0) : null
  const foundingRateYearly = resolvedKind && tier.price_yearly != null
    ? Number(tier.price_yearly) - Number(tier.founding_discount ?? 0) * 10
    : null

  const period = getSubscriptionPeriod(subscription)
  const { error: updateError } = await supabase
    .from('family_subscriptions')
    .update({
      tier_id: tierId,
      status: mapSubscriptionStatus(subscription.status),
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_start: period.start ? new Date(period.start * 1000).toISOString() : null,
      current_period_end: period.end ? new Date(period.end * 1000).toISOString() : null,
      is_founding_family: resolvedKind !== null,
      founding_rate_monthly: foundingRateMonthly,
      founding_rate_yearly: foundingRateYearly,
      price_adjustment_kind: resolvedKind,
      pending_tier_id: null,
      cancelled_at: null,
      past_due_since: null,
    })
    .eq('family_id', familyId)
  if (updateError) throw new Error(`family_subscriptions update failed: ${updateError.message}`)

  if (resolvedKind !== null) {
    const { error: familiesError } = await supabase
      .from('families')
      .update({ is_founding_family: true })
      .eq('id', familyId)
      .eq('is_founding_family', false)
    if (familiesError) {
      console.error(`stripe-webhook-handler: families.is_founding_family mirror update failed for ${familyId}:`, familiesError.message)
    }
  }
}

async function handleSubscriptionUpdated(event: StripeEvent): Promise<void> {
  const subscription = event.data.object as SubscriptionLike
  const meta = getEventMetadata(subscription) ?? {}
  const familyId = meta.family_id
  if (!familyId) {
    throw new Error(`customer.subscription.updated (${subscription.id}) missing family_id metadata`)
  }

  const currentPriceId = subscription.items?.data?.[0]?.price?.id
  const { data: existing, error: existingError } = await supabase
    .from('family_subscriptions')
    .select('tier_id, is_founding_family, price_adjustment_kind')
    .eq('family_id', familyId)
    .maybeSingle()
  if (existingError) throw new Error(`family_subscriptions lookup failed: ${existingError.message}`)
  if (!existing) throw new Error(`family_subscriptions row not found for family_id=${familyId}`)

  let resolvedTierId = existing.tier_id
  if (currentPriceId) {
    const { data: matchedTier, error: matchError } = await supabase
      .from('subscription_tiers')
      .select('id, price_monthly, price_yearly, founding_discount')
      .or(`stripe_price_id_normal.eq.${currentPriceId},stripe_price_id_founding.eq.${currentPriceId}`)
      .maybeSingle()
    if (matchError) throw new Error(`subscription_tiers price lookup failed: ${matchError.message}`)
    if (matchedTier) {
      resolvedTierId = matchedTier.id
      // Founding rate recalculates for the new tier (PRD Founding Status
      // Durability table) — only when currently founding; price_adjustment_kind
      // itself is untouched by a tier change.
      if (existing.is_founding_family) {
        const foundingRateMonthly = Number(matchedTier.price_monthly) - Number(matchedTier.founding_discount ?? 0)
        const foundingRateYearly = matchedTier.price_yearly != null
          ? Number(matchedTier.price_yearly) - Number(matchedTier.founding_discount ?? 0) * 10
          : null
        const { error: rateError } = await supabase
          .from('family_subscriptions')
          .update({ founding_rate_monthly: foundingRateMonthly, founding_rate_yearly: foundingRateYearly })
          .eq('family_id', familyId)
        if (rateError) console.error(`stripe-webhook-handler: founding rate recalculation failed for ${familyId}:`, rateError.message)
      }
    }
  }

  // Downgrade-scheduling metadata trick (create-subscription-change): the
  // pending tier is cleared automatically once it becomes the CURRENT tier.
  const metaPendingTierId = meta.pending_tier_id || null
  const pendingTierId = metaPendingTierId && metaPendingTierId !== resolvedTierId ? metaPendingTierId : null

  const period = getSubscriptionPeriod(subscription)
  const { error: updateError } = await supabase
    .from('family_subscriptions')
    .update({
      tier_id: resolvedTierId,
      status: mapSubscriptionStatus(subscription.status),
      pending_tier_id: pendingTierId,
      current_period_start: period.start ? new Date(period.start * 1000).toISOString() : null,
      current_period_end: period.end ? new Date(period.end * 1000).toISOString() : null,
    })
    .eq('family_id', familyId)
  if (updateError) throw new Error(`family_subscriptions update failed: ${updateError.message}`)
}

async function handleSubscriptionDeleted(event: StripeEvent): Promise<void> {
  const subscription = event.data.object as SubscriptionLike
  const meta = getEventMetadata(subscription) ?? {}
  const familyId = meta.family_id
  if (!familyId) {
    throw new Error(`customer.subscription.deleted (${subscription.id}) missing family_id metadata`)
  }

  const { data: existing, error: existingError } = await supabase
    .from('family_subscriptions')
    .select('is_founding_family')
    .eq('family_id', familyId)
    .maybeSingle()
  if (existingError) throw new Error(`family_subscriptions lookup failed: ${existingError.message}`)

  const wasFounding = existing?.is_founding_family === true

  // Explicit cancellation: founding status LOST PERMANENTLY (PRD Founding
  // Status Durability table). families.is_founding_family stays true as a
  // historical record (mirrors the grace-period-miss edge case's own
  // language); founding_family_lost_at is the durable "when it was lost"
  // marker the override-check logic consults going forward.
  const { error: updateError } = await supabase
    .from('family_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      is_founding_family: false,
      founding_rate_monthly: null,
      founding_rate_yearly: null,
      price_adjustment_kind: null,
      pending_tier_id: null,
    })
    .eq('family_id', familyId)
  if (updateError) throw new Error(`family_subscriptions update failed: ${updateError.message}`)

  if (wasFounding) {
    const { error: familiesError } = await supabase
      .from('families')
      .update({ founding_family_lost_at: new Date().toISOString() })
      .eq('id', familyId)
      .is('founding_family_lost_at', null)
    if (familiesError) {
      console.error(`stripe-webhook-handler: founding_family_lost_at update failed for ${familyId}:`, familiesError.message)
    }
  }
}

async function handleInvoicePaymentFailed(event: StripeEvent): Promise<void> {
  const invoice = event.data.object as InvoiceLike
  const meta = getEventMetadata(invoice) ?? {}
  const familyId = meta.family_id
  if (!familyId) {
    // Non-subscription invoices (none exist on this platform today) or a
    // metadata-propagation gap on an older Stripe API version — ack without
    // erroring rather than retry-looping on something we can't resolve.
    console.warn(`stripe-webhook-handler: invoice.payment_failed (${invoice.id}) has no resolvable family_id metadata — skipping`)
    return
  }

  const { data: existing, error: existingError } = await supabase
    .from('family_subscriptions')
    .select('past_due_since')
    .eq('family_id', familyId)
    .maybeSingle()
  if (existingError) throw new Error(`family_subscriptions lookup failed: ${existingError.message}`)

  const { error: updateError } = await supabase
    .from('family_subscriptions')
    .update({
      status: 'past_due',
      // Only the FIRST failure starts the 14-day grace clock — a retry
      // failing again must not push the deadline back out indefinitely.
      past_due_since: existing?.past_due_since ?? new Date().toISOString(),
    })
    .eq('family_id', familyId)
  if (updateError) throw new Error(`family_subscriptions update failed: ${updateError.message}`)

  const { data: parentRow } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('role', 'primary_parent')
    .maybeSingle()
  if (parentRow) {
    const { error: notifyError } = await supabase.from('notifications').insert({
      family_id: familyId,
      recipient_member_id: parentRow.id,
      notification_type: 'subscription_payment_failed',
      category: 'billing',
      title: 'A payment didn’t go through',
      body: 'We couldn’t process your subscription payment. Please update your payment method in Settings within the next 14 days to avoid losing access.',
      priority: 'normal',
    })
    if (notifyError) console.error(`stripe-webhook-handler: past-due notification failed for ${familyId}:`, notifyError.message)
  }
}

async function handleInvoicePaid(event: StripeEvent): Promise<void> {
  const invoice = event.data.object as InvoiceLike
  const meta = getEventMetadata(invoice) ?? {}
  const familyId = meta.family_id
  if (!familyId) {
    console.warn(`stripe-webhook-handler: invoice.paid (${invoice.id}) has no resolvable family_id metadata — skipping`)
    return
  }

  const { error: updateError } = await supabase
    .from('family_subscriptions')
    .update({ status: 'active', past_due_since: null })
    .eq('family_id', familyId)
  if (updateError) throw new Error(`family_subscriptions update failed: ${updateError.message}`)
}

// ──────────────────────────────────────────────────────────────────────────
// Purpose-routed dispatch registry. PRD-31's five subscription events
// register here (same map, same file, per the decision file's "ONE webhook
// handler" invariant).
// ──────────────────────────────────────────────────────────────────────────

const HANDLERS: Record<string, (event: StripeEvent) => Promise<void>> = {
  'payment_intent.succeeded:coppa_verification': handleCoppaVerificationSucceeded,
  'payment_intent.payment_failed:coppa_verification': handleCoppaVerificationFailed,
  'checkout.session.completed:subscription': handleCheckoutSessionCompleted,
  'customer.subscription.updated:subscription': handleSubscriptionUpdated,
  'customer.subscription.deleted:subscription': handleSubscriptionDeleted,
  'invoice.payment_failed:subscription': handleInvoicePaymentFailed,
  'invoice.paid:subscription': handleInvoicePaid,
}

function routeKey(event: StripeEvent): string {
  const obj = event.data?.object as Parameters<typeof getEventMetadata>[0]
  const purpose = getEventMetadata(obj)?.purpose ?? 'none'
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

  // Uses the same fallback chain as routeKey() so the diagnostic `purpose`
  // column stored on stripe_webhook_events matches what actually got routed
  // — without this, invoice.* events (whose purpose may only be resolvable
  // via the parent.subscription_details.metadata fallback) would record
  // purpose=null here even when they were correctly routed to a handler.
  const purpose = getEventMetadata(event.data?.object as Parameters<typeof getEventMetadata>[0])?.purpose ?? null

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
