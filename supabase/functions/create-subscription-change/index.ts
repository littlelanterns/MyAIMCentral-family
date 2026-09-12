// create-subscription-change — PRD-31 Slice 2. Upgrade (immediate,
// prorated) or downgrade (scheduled for end of the current billing period)
// an EXISTING Stripe subscription. Mom-only (R-10-class gate).
//
// This function only talks to Stripe — it never writes to
// family_subscriptions directly. Every write to that table happens inside
// stripe-webhook-handler, driven by the customer.subscription.updated event
// Stripe fires as a result of the API calls this function makes (Convention:
// "Stripe is the single source of payment truth... never update subscription
// status from client-side code").
//
// Upgrade: stripe.subscriptions.update() swaps the price immediately with
// proration_behavior:'create_prorations'. Stripe fires
// customer.subscription.updated with the new price already live; the
// webhook maps price -> tier and writes tier_id directly.
//
// Downgrade: Stripe has no native "change this field at period end" concept
// on a plain subscription update — the documented mechanism is a Subscription
// Schedule with two phases (current price until period end, new price after).
// Creating/updating the schedule does NOT itself change the subscription's
// CURRENT price or fire an event carrying the target tier, so this function
// also writes `pending_tier_id` onto the subscription's own metadata (merged
// with its existing metadata, never replacing it) — that metadata write is a
// real Stripe API call that fires its own customer.subscription.updated
// event, which is what lets the webhook mirror pending_tier_id into
// family_subscriptions for the "Available until [date]" UI (Screen 1,
// Slice 5) without this function touching that table itself.
//
// Founding rate preservation (PRD Founding Status Durability table): if the
// family is currently founding, the NEW tier's founding price is used
// automatically (recalculated by the webhook from founding_discount); a
// non-founding family always pays normal pricing regardless of direction.
//
// Deployed --no-verify-jwt (config.toml) — auth enforced in code.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { stripe } from '../_shared/stripe.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}

interface RequestBody {
  tier_slug?: string
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const auth = await authenticateRequest(req)
  if (auth instanceof Response) return auth

  try {
    const { data: parentMember, error: parentError } = await supabase
      .from('family_members')
      .select('id, family_id')
      .eq('user_id', auth.user.id)
      .eq('role', 'primary_parent')
      .maybeSingle()
    if (parentError) throw new Error(parentError.message)
    if (!parentMember) {
      return json({ error: 'not_authorized', reason: 'Only the primary parent can manage the family subscription.' }, 403)
    }
    const familyId = parentMember.family_id as string

    const body = (await req.json().catch(() => ({}))) as RequestBody
    const targetSlug = body.tier_slug
    if (!targetSlug) {
      return json({ error: 'invalid_request', reason: 'tier_slug is required' }, 400)
    }

    const { data: currentSub, error: currentSubError } = await supabase
      .from('family_subscriptions')
      .select('tier_id, stripe_subscription_id, is_founding_family, status')
      .eq('family_id', familyId)
      .maybeSingle()
    if (currentSubError) throw new Error(currentSubError.message)
    // stripe_subscription_id stays set on a cancelled row for historical
    // reference (Stripe never deletes the object either) — the status must
    // ALSO be checked, or this function would try to mutate a Stripe
    // subscription that can no longer accept price/item changes.
    if (!currentSub?.stripe_subscription_id || currentSub.status === 'cancelled') {
      return json(
        { error: 'no_active_subscription', reason: 'This family has no active Stripe subscription to change. Use create-subscription-checkout to start one.' },
        400,
      )
    }

    const { data: tiers, error: tiersError } = await supabase
      .from('subscription_tiers')
      .select('id, slug, sort_order, stripe_price_id_normal, stripe_price_id_founding, is_active')
      .in('id', [currentSub.tier_id])
    if (tiersError) throw new Error(tiersError.message)
    const currentTier = tiers?.[0]

    const { data: targetTier, error: targetTierError } = await supabase
      .from('subscription_tiers')
      .select('id, slug, sort_order, stripe_price_id_normal, stripe_price_id_founding, is_active')
      .eq('slug', targetSlug)
      .eq('is_active', true)
      .maybeSingle()
    if (targetTierError) throw new Error(targetTierError.message)
    if (!targetTier) {
      return json({ error: 'invalid_tier', reason: `No active tier found for slug '${targetSlug}'` }, 400)
    }
    if (!currentTier) {
      return json({ error: 'invalid_state', reason: 'Current tier could not be resolved.' }, 500)
    }
    if (targetTier.id === currentTier.id) {
      return json({ error: 'already_on_tier', reason: `Already subscribed to '${targetSlug}'.` }, 400)
    }

    const isFounding = currentSub.is_founding_family === true
    const targetPriceId = isFounding
      ? (targetTier.stripe_price_id_founding ?? targetTier.stripe_price_id_normal)
      : targetTier.stripe_price_id_normal
    if (!targetPriceId) {
      return json(
        { error: 'stripe_not_configured', reason: `No Stripe price configured for tier '${targetSlug}'. Run scripts/stripe-setup-subscription-products.ts first.` },
        500,
      )
    }

    const subscriptionId = currentSub.stripe_subscription_id as string
    const isUpgrade = targetTier.sort_order > currentTier.sort_order

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const existingMetadata = { ...(subscription.metadata ?? {}) }
    const currentItemId = subscription.items.data[0]?.id
    if (!currentItemId) {
      return json({ error: 'invalid_state', reason: 'Stripe subscription has no line items.' }, 500)
    }

    if (isUpgrade) {
      // Release any pending downgrade schedule — mom changed her mind and is
      // upgrading instead; the immediate price swap below supersedes it.
      if (subscription.schedule) {
        const scheduleId = typeof subscription.schedule === 'string' ? subscription.schedule : subscription.schedule.id
        try {
          await stripe.subscriptionSchedules.release(scheduleId)
        } catch (releaseErr) {
          console.warn(`create-subscription-change: failed to release schedule ${scheduleId} before upgrade:`, (releaseErr as Error).message)
        }
      }

      await stripe.subscriptions.update(subscriptionId, {
        items: [{ id: currentItemId, price: targetPriceId }],
        proration_behavior: 'create_prorations',
        metadata: { ...existingMetadata, tier_id: targetTier.id, pending_tier_id: '' },
      })

      return json({ success: true, direction: 'upgrade', tier_slug: targetSlug, effective: 'immediate' })
    }

    // ── Downgrade: schedule the price change for the end of the current
    //    billing period via a Subscription Schedule. ──
    //
    // Phase 1 (the CURRENT phase) is read back from the schedule object
    // Stripe itself just computed (from_subscription auto-derives phase[0]
    // from the subscription's actual current price + period), rather than
    // reconstructed from an independently-fetched Subscription object.
    // Stripe's schedule.update() validates phase[0] against the schedule's
    // own existing phase[0] — passing back its own values sidesteps any
    // drift risk (e.g. a mismatched start_date) that reconstructing it from
    // a separately-timed API call could introduce. Only phase 2 (the target
    // tier) is genuinely new.
    let schedule: Awaited<ReturnType<typeof stripe.subscriptionSchedules.retrieve>>
    if (subscription.schedule) {
      const existingScheduleId = typeof subscription.schedule === 'string' ? subscription.schedule : subscription.schedule.id
      schedule = await stripe.subscriptionSchedules.retrieve(existingScheduleId)
    } else {
      schedule = await stripe.subscriptionSchedules.create({ from_subscription: subscriptionId })
    }
    const scheduleId = schedule.id
    const currentPhase = schedule.phases[0]
    if (!currentPhase) {
      return json({ error: 'invalid_state', reason: 'Could not resolve the current subscription schedule phase.' }, 500)
    }
    const currentPhaseEnd = currentPhase.end_date

    await stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: 'release',
      phases: [
        {
          items: currentPhase.items.map((item) => ({
            price: typeof item.price === 'string' ? item.price : item.price.id,
            quantity: item.quantity,
          })),
          start_date: currentPhase.start_date,
          end_date: currentPhase.end_date,
        },
        {
          items: [{ price: targetPriceId, quantity: 1 }],
        },
      ],
    })

    // Informs the webhook of the pending change via a real Stripe API call
    // (fires its own customer.subscription.updated) — see file header.
    await stripe.subscriptions.update(subscriptionId, {
      metadata: { ...existingMetadata, pending_tier_id: targetTier.id },
    })

    return json({
      success: true,
      direction: 'downgrade',
      tier_slug: targetSlug,
      effective: 'end_of_period',
      current_period_end: currentPhaseEnd,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('create-subscription-change error:', message)
    return json({ error: `Server error: ${message}` }, 500)
  }
})
