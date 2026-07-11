// create-coppa-verification-intent — mints the $1.00 Stripe PaymentIntent
// that establishes a parent as COPPA-verified (decision file §3, item 4:
// claude/feature-decisions/PRD-40-COPPA-Compliance.md).
//
// R-10 (two-door session rule): mom's REAL authenticated session only.
// Family-shadow sessions (role='family', Convention #273) and member-shadow
// sessions (PIN/picture accounts) both fail the `role = 'primary_parent'`
// check below and are rejected — same pattern as every RLS policy in
// migration 100305. View-As does NOT change auth.uid() (mom's real session
// stays authenticated underneath the modal), so "unavailable inside View-As"
// is a FRONTEND-layer restriction (Slice 3's job, per the migration 100305
// comment) — this Edge Function cannot distinguish "mom acting as herself"
// from "mom viewing through the modal" server-side, and does not attempt to.
//
// Rate limiting reads TERMINAL parent_verification_attempts rows (succeeded
// or failed — the attempts table's status CHECK has no "pending" value, so
// there is nothing to log until a Stripe webhook resolves an intent one way
// or the other). This bounds repeated real charge attempts (5/hr, 20/day per
// parent), which is the abuse surface that matters for a $1 verification
// charge; Stripe's own API has its own volumetric protections against raw
// PaymentIntent-creation spam.
//
// Deployed --no-verify-jwt (config.toml) — auth is enforced in code via
// authenticateRequest, matching every other function in this codebase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { stripe } from '../_shared/stripe.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const HOURLY_LIMIT = 5
const DAILY_LIMIT = 20
const VERIFICATION_AMOUNT_CENTS = 100 // $1.00
// `statement_descriptor` (the full-override field) is rejected by Stripe
// for automatic_payment_methods-enabled card charges — "not supported for
// payment_method_type `card`" (found live during E2E proof, 2026-07-10).
// `statement_descriptor_suffix` is the correct field for card charges; it is
// appended to the account's own default statement descriptor and is capped
// at 12 characters — 'MYAIM VERIFY' is exactly 12.
const STATEMENT_DESCRIPTOR_SUFFIX = 'MYAIM VERIFY'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
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
    // ── R-10: caller must be the primary parent of their family ──
    const { data: parentMember, error: parentError } = await supabase
      .from('family_members')
      .select('id, family_id')
      .eq('user_id', auth.user.id)
      .eq('role', 'primary_parent')
      .maybeSingle()

    if (parentError) throw new Error(parentError.message)
    if (!parentMember) {
      return json({ error: 'not_authorized', reason: 'Only the primary parent can start parental verification.' }, 403)
    }

    const parentMemberId = parentMember.id as string
    const familyId = parentMember.family_id as string

    // ── Idempotent short-circuit: already actively verified ──
    const { data: activeVerification, error: activeError } = await supabase
      .from('parent_verifications')
      .select('id, verified_at')
      .eq('parent_member_id', parentMemberId)
      .is('revoked_at', null)
      .maybeSingle()
    if (activeError) throw new Error(activeError.message)
    if (activeVerification) {
      return json({
        already_verified: true,
        verification_id: activeVerification.id,
        verified_at: activeVerification.verified_at,
      })
    }

    // ── Rate limiting (5/hr, 20/day) against terminal attempts ──
    const nowMs = Date.now()
    const oneHourAgo = new Date(nowMs - 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString()

    const { count: hourCount, error: hourError } = await supabase
      .from('parent_verification_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('parent_member_id', parentMemberId)
      .gte('attempted_at', oneHourAgo)
    if (hourError) throw new Error(hourError.message)

    if ((hourCount ?? 0) >= HOURLY_LIMIT) {
      return json(
        { error: 'rate_limited', reason: 'hourly_limit', message: 'Too many verification attempts. Please try again in an hour.' },
        429,
      )
    }

    const { count: dayCount, error: dayError } = await supabase
      .from('parent_verification_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('parent_member_id', parentMemberId)
      .gte('attempted_at', oneDayAgo)
    if (dayError) throw new Error(dayError.message)

    if ((dayCount ?? 0) >= DAILY_LIMIT) {
      return json(
        { error: 'rate_limited', reason: 'daily_limit', message: 'Too many verification attempts today. Please try again tomorrow or contact support.' },
        429,
      )
    }

    // ── Get-or-create the Stripe Customer ──
    const { data: priorCustomerRow, error: priorCustomerError } = await supabase
      .from('parent_verifications')
      .select('stripe_customer_id')
      .eq('parent_member_id', parentMemberId)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (priorCustomerError) throw new Error(priorCustomerError.message)

    let customerId = priorCustomerRow?.stripe_customer_id as string | undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.user.email,
        metadata: { family_id: familyId, parent_member_id: parentMemberId },
      })
      customerId = customer.id
    }

    // ── Create the $1.00 verification PaymentIntent ──
    const paymentIntent = await stripe.paymentIntents.create({
      amount: VERIFICATION_AMOUNT_CENTS,
      currency: 'usd',
      customer: customerId,
      statement_descriptor_suffix: STATEMENT_DESCRIPTOR_SUFFIX,
      metadata: {
        purpose: 'coppa_verification',
        family_id: familyId,
        parent_member_id: parentMemberId,
      },
      // allow_redirects: 'never' restricts to non-redirect payment methods
      // (cards, etc.) — a $1 verification charge has no reason to support
      // redirect-based methods, and this keeps server-side confirmation
      // (no browser return_url available) reliable.
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    })

    return json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('create-coppa-verification-intent error:', message)
    return json({ error: `Server error: ${message}` }, 500)
  }
})
