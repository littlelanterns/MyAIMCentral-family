// create-subscription-portal-session — PRD-31 Slice 2. Generates a Stripe
// Customer Portal session URL (Screen 1's "Manage Payment Method" /
// "Billing History" buttons — PRD: "Stripe's hosted Customer Portal handles:
// payment method updates, billing history / receipt downloads, subscription
// cancellation"). Mom-only (R-10-class gate).
//
// Deployed --no-verify-jwt (config.toml) — auth enforced in code.

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
      return json({ error: 'not_authorized', reason: 'Only the primary parent can manage billing.' }, 403)
    }

    const { data: sub, error: subError } = await supabase
      .from('family_subscriptions')
      .select('stripe_customer_id')
      .eq('family_id', parentMember.family_id)
      .maybeSingle()
    if (subError) throw new Error(subError.message)
    if (!sub?.stripe_customer_id) {
      return json({ error: 'no_stripe_customer', reason: 'No billing account found yet. Subscribe to a plan first.' }, 400)
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${APP_URL}/settings/subscription`,
    })

    return json({ portal_url: portalSession.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('create-subscription-portal-session error:', message)
    return json({ error: `Server error: ${message}` }, 500)
  }
})
