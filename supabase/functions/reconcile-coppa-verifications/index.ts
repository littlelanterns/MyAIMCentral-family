// reconcile-coppa-verifications — daily reconciliation cron (decision file
// §3, item 5: claude/feature-decisions/PRD-40-COPPA-Compliance.md).
//
// Lists recent succeeded Stripe PaymentIntents tagged
// metadata.purpose='coppa_verification' and cross-references them against
// parent_verifications. The failure mode this guards against: a webhook
// delivery is lost or silently errors and a real $1 charge succeeds while
// no consent/verification row is ever created — a parent believes they
// verified (or was charged trying) but the platform never recorded it.
// This is the second-line catch for that class of silent failure (the
// stripe_webhook_events dedup/status table is the first line — a stuck
// 'error'/'received' row is retried by Stripe itself; this cron catches the
// case where Stripe never retried, or the webhook was never reachable).
//
// Mismatches are logged (console.error, visible in Supabase function logs)
// and returned in the response body. No new persistence table was built for
// this — the existing audit surfaces (parent_verifications,
// stripe_webhook_events) are the source of truth this job reads, and a
// found mismatch is rare/manual-follow-up by design (a real double-failure:
// Stripe succeeded AND our webhook never landed). If mismatches become
// routine, promote this to a persisted table + admin surface — flagged as a
// forward note, not built here (scope discipline).
//
// Cron-invoked (Convention #246, util.invoke_edge_function, daily), deployed
// --no-verify-jwt with the same in-code service-role bearer check used by
// safety-weekly-digest / fire-painted-schedules.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Generous overlap window — the cron runs once daily, but we look back
// further than 24h so a delayed webhook (or a prior run that errored before
// finishing its pagination) never leaves a gap uninspected.
const LOOKBACK_HOURS = 48

interface Mismatch {
  payment_intent_id: string
  family_id?: string
  parent_member_id?: string
  amount: number
  currency: string
  created: number
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const sinceEpochSeconds = Math.floor(Date.now() / 1000) - LOOKBACK_HOURS * 60 * 60

    const succeededIntents: Array<{
      id: string
      metadata: Record<string, string>
      amount: number
      currency: string
      created: number
    }> = []

    // Paginate through all PaymentIntents created in the lookback window.
    // Stripe's list API has no server-side metadata filter, so we filter
    // client-side for purpose='coppa_verification' + status='succeeded'.
    let startingAfter: string | undefined
    for (;;) {
      const page = await stripe.paymentIntents.list({
        created: { gte: sinceEpochSeconds },
        limit: 100,
        starting_after: startingAfter,
      })
      for (const pi of page.data) {
        if (pi.status === 'succeeded' && pi.metadata?.purpose === 'coppa_verification') {
          succeededIntents.push({
            id: pi.id,
            metadata: pi.metadata as Record<string, string>,
            amount: pi.amount,
            currency: pi.currency,
            created: pi.created,
          })
        }
      }
      if (!page.has_more || page.data.length === 0) break
      startingAfter = page.data[page.data.length - 1].id
    }

    const mismatches: Mismatch[] = []

    for (const pi of succeededIntents) {
      const { data: row, error } = await supabase
        .from('parent_verifications')
        .select('id')
        .eq('stripe_payment_intent_id', pi.id)
        .maybeSingle()

      if (error) {
        console.error(`reconcile-coppa-verifications: lookup failed for ${pi.id}:`, error.message)
        continue
      }

      if (!row) {
        mismatches.push({
          payment_intent_id: pi.id,
          family_id: pi.metadata?.family_id,
          parent_member_id: pi.metadata?.parent_member_id,
          amount: pi.amount,
          currency: pi.currency,
          created: pi.created,
        })
      }
    }

    if (mismatches.length > 0) {
      console.error(
        `reconcile-coppa-verifications: ${mismatches.length} succeeded Stripe charge(s) with no matching parent_verifications row:`,
        JSON.stringify(mismatches),
      )
    }

    const summary = {
      window_hours: LOOKBACK_HOURS,
      succeeded_intents_checked: succeededIntents.length,
      mismatches_found: mismatches.length,
      mismatches,
    }
    console.log(`reconcile-coppa-verifications: ${JSON.stringify({ ...summary, mismatches: undefined })}`)
    return new Response(JSON.stringify(summary), { headers: jsonHeaders })
  } catch (err) {
    console.error('reconcile-coppa-verifications fatal error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: jsonHeaders })
  }
})
