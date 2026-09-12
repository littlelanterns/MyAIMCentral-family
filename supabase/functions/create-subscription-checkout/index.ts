// create-subscription-checkout — PRD-31 Slice 2. Creates the Stripe Checkout
// Session that starts (or restarts, after cancellation) a family's paid
// subscription. Mom-only (R-10-class gate, same pattern as
// create-coppa-verification-intent).
//
// FOUNDING ELIGIBILITY IS DECIDED HERE, AT SESSION-CREATION TIME (founder
// ruling 2026-09-11 §1 — the SOFT cap). The webhook (stripe-webhook-handler)
// honors whatever price this session was created with and never re-checks
// eligibility after the fact — two families completing checkout at the same
// instant, both under the 100-spot line, both win.
//
// Founding codes (ruling 2026-09-11 §2) are validated here (read-only —
// exists, unredeemed, not expired) purely so an invalid code fails fast for
// mom instead of after she pays. The code is NOT consumed here — redemption
// is atomic, service-role-only, and happens inside the webhook's
// checkout.session.completed handler, in the same step that records the
// founding grant (see redeem_founding_code() in migration 100334 and
// stripe-webhook-handler's handleCheckoutSessionCompleted). This avoids
// burning a code on an abandoned checkout.
//
// Re-subscription after cancellation NEVER gets founding pricing, regardless
// of the organic cap or a founding code — this is an explicit PRD durability
// rule ("Re-subscribe after cancellation → Normal pricing. Founding status
// cannot be restored.") that must not be gameable by cancelling and then
// applying a fresh code.
//
// Deployed --no-verify-jwt (config.toml) — auth is enforced in code via
// authenticateRequest, matching every other client-invoked function in this
// codebase (create-coppa-verification-intent is the direct precedent).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { stripe } from '../_shared/stripe.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://myaimcentral.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}

interface RequestBody {
  tier_slug?: string
  founding_code?: string
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
    // ── R-10-class gate: caller must be the primary parent of their family ──
    const { data: parentMember, error: parentError } = await supabase
      .from('family_members')
      .select('id, family_id, family:families!inner(is_founding_family, founding_family_lost_at, is_test_family)')
      .eq('user_id', auth.user.id)
      .eq('role', 'primary_parent')
      .maybeSingle()

    if (parentError) throw new Error(parentError.message)
    if (!parentMember) {
      return json({ error: 'not_authorized', reason: 'Only the primary parent can manage the family subscription.' }, 403)
    }

    const parentMemberId = parentMember.id as string
    const familyId = parentMember.family_id as string
    // deno-lint-ignore no-explicit-any
    const familyRow = (parentMember as any).family as { is_founding_family: boolean; founding_family_lost_at: string | null; is_test_family: boolean }
    const foundingPermanentlyLost = !!familyRow?.founding_family_lost_at

    const body = (await req.json().catch(() => ({}))) as RequestBody
    const tierSlug = body.tier_slug
    const foundingCodeInput = body.founding_code?.trim()

    if (!tierSlug) {
      return json({ error: 'invalid_request', reason: 'tier_slug is required' }, 400)
    }

    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('id, slug, price_monthly, price_yearly, founding_discount, stripe_price_id_normal, stripe_price_id_founding, is_active')
      .eq('slug', tierSlug)
      .eq('is_active', true)
      .maybeSingle()
    if (tierError) throw new Error(tierError.message)
    if (!tier) {
      return json({ error: 'invalid_tier', reason: `No active tier found for slug '${tierSlug}'` }, 400)
    }

    const { data: existingSub, error: existingSubError } = await supabase
      .from('family_subscriptions')
      .select('id, stripe_subscription_id, status')
      .eq('family_id', familyId)
      .maybeSingle()
    if (existingSubError) throw new Error(existingSubError.message)

    if (existingSub?.stripe_subscription_id && ['active', 'trialing', 'past_due'].includes(existingSub.status)) {
      return json(
        { error: 'already_subscribed', reason: 'This family already has an active subscription. Use the tier-change flow to upgrade or downgrade.' },
        409,
      )
    }

    // ── Determine founding eligibility ──
    let foundingKind: 'founding' | 'founding_code' | null = null
    let foundingCode: string | undefined

    if (foundingPermanentlyLost) {
      // PRD durability rule: founding status can never be restored after
      // being lost (cancellation or 14-day non-payment). No organic check,
      // no code redemption — normal pricing, full stop.
      foundingKind = null
    } else if (foundingCodeInput) {
      const normalizedCode = foundingCodeInput.toUpperCase()
      const { data: codeRow, error: codeError } = await supabase
        .from('founding_codes')
        .select('code, redeemed_at, expires_at')
        .eq('code', normalizedCode)
        .maybeSingle()
      if (codeError) throw new Error(codeError.message)

      if (!codeRow) {
        return json({ error: 'invalid_founding_code', reason: 'That founding code was not found.' }, 400)
      }
      if (codeRow.redeemed_at) {
        return json({ error: 'invalid_founding_code', reason: 'That founding code has already been used.' }, 400)
      }
      if (codeRow.expires_at && new Date(codeRow.expires_at) <= new Date()) {
        return json({ error: 'invalid_founding_code', reason: 'That founding code has expired.' }, 400)
      }
      foundingKind = 'founding_code'
      foundingCode = normalizedCode
    } else {
      // Soft organic cap: decided live, right now, at session-creation time.
      // Excludes test families (matches get_founding_family_count()'s own
      // exclusion) and only counts organic ('founding') families, never
      // code-granted ones (they don't consume public spots).
      const { count: organicCount, error: countError } = await supabase
        .from('family_subscriptions')
        .select('family_id, families!inner(is_test_family)', { count: 'exact', head: true })
        .eq('price_adjustment_kind', 'founding')
        .eq('families.is_test_family', false)
      if (countError) throw new Error(countError.message)

      if ((organicCount ?? 0) < 100) {
        foundingKind = 'founding'
      }
    }

    const priceId = foundingKind ? tier.stripe_price_id_founding : tier.stripe_price_id_normal
    if (!priceId) {
      return json(
        {
          error: 'stripe_not_configured',
          reason: `No Stripe price configured for tier '${tierSlug}'${foundingKind ? ' (founding)' : ''}. Run scripts/stripe-setup-subscription-products.ts first.`,
        },
        500,
      )
    }

    // ── Get-or-create the Stripe Customer (reuse from either COPPA
    //    verification or a prior subscription, matching
    //    create-coppa-verification-intent's own reuse pattern) ──
    let customerId: string | undefined

    const { data: existingSubCustomer } = await supabase
      .from('family_subscriptions')
      .select('stripe_customer_id')
      .eq('family_id', familyId)
      .not('stripe_customer_id', 'is', null)
      .maybeSingle()
    customerId = existingSubCustomer?.stripe_customer_id ?? undefined

    if (!customerId) {
      const { data: verificationRow } = await supabase
        .from('parent_verifications')
        .select('stripe_customer_id')
        .eq('parent_member_id', parentMemberId)
        .not('stripe_customer_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      customerId = verificationRow?.stripe_customer_id ?? undefined
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.user.email,
        metadata: { family_id: familyId, parent_member_id: parentMemberId },
      })
      customerId = customer.id
    }

    const sessionMetadata: Record<string, string> = {
      purpose: 'subscription',
      family_id: familyId,
      parent_member_id: parentMemberId,
      tier_id: tier.id,
      founding_kind: foundingKind ?? '',
      founding_code: foundingCode ?? '',
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: sessionMetadata,
      // Mirrored onto the created Subscription object so subsequent
      // customer.subscription.* / invoice.* events also carry purpose +
      // business fields for routing (decision file §3 purpose-routing).
      subscription_data: { metadata: sessionMetadata },
      success_url: `${APP_URL}/settings/subscription?checkout=success`,
      cancel_url: `${APP_URL}/settings/subscription?checkout=cancelled`,
    })

    return json({ checkout_url: session.url, founding_kind: foundingKind })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('create-subscription-checkout error:', message)
    return json({ error: `Server error: ${message}` }, 500)
  }
})
