/**
 * PRD-40 COPPA — Slice 2 (Stripe foundation) pins.
 *
 * Covers: _shared/stripe.ts + stripe-webhook-handler + create-coppa-
 * verification-intent, per claude/feature-decisions/PRD-40-COPPA-Compliance.md
 * §3 and the Slice-2 dispatch prompt in
 * .claude/rules/current-builds/PRD-40-coppa.md.
 *
 * Requires (LIVE pins, will fail with a clear message otherwise):
 *   - Migration 00000000100313 applied (reconcile-coppa-verifications cron;
 *     the tables this spec touches — parent_verifications,
 *     parent_verification_attempts, stripe_webhook_events — already exist
 *     from Slice 1, migration 100305).
 *   - stripe-webhook-handler + create-coppa-verification-intent deployed
 *     (--no-verify-jwt, config.toml entries already present).
 *   - STRIPE_SECRET_KEY set as a Supabase secret (already loaded 2026-07-10)
 *     AND present in .env.local for this test's own Stripe API calls.
 *   - STRIPE_WEBHOOK_SECRET set as a Supabase secret AND present in
 *     .env.local with the SAME value (so this spec can sign test events the
 *     deployed function will accept). Signature verification only checks
 *     that the given secret matches what signed the payload — Stripe's
 *     servers are not involved in the check, so a real webhook endpoint
 *     registered in the Stripe Dashboard is NOT required for this spec to
 *     fully exercise the handler (per the dispatch prompt: "simulate the
 *     signed webhook (stripe trigger or a signed replay)"). A live
 *     registered endpoint IS still required for real production traffic —
 *     that is a separate, non-blocking follow-up.
 *
 * Fixture isolation: this spec temporarily revokes (and restores) Sarah's
 * pre-existing active parent_verifications row, if any, around each
 * scenario that needs her "unverified" — Testworth's Sarah is the only
 * primary_parent in the fixture family, so there is no second parent to
 * isolate against. Every row this spec creates (verifications, attempts,
 * stripe_webhook_events) is tracked by id/event_id and swept in afterAll.
 * Real Stripe PaymentIntents/Customers created in TEST mode are left in
 * Stripe (Stripe does not support deleting them; $1 test-card charges have
 * no real-world cost or side effect).
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import dotenv from 'dotenv'
import { TEST_USERS } from '../helpers/seed-testworths-complete'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!
const FN = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`
const FAMILY_PASSWORD = process.env.E2E_TESTWORTH_FAMILY_PASSWORD || 'Lanterns2026'

const sr = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!
const stripe = new Stripe(STRIPE_SECRET_KEY)

async function signInClient(email: string, password: string) {
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: true } })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`signIn ${email}: ${error?.message}`)
  return client
}

async function accessTokenFor(email: string, password: string): Promise<string> {
  const client = await signInClient(email, password)
  const { data } = await client.auth.getSession()
  if (!data.session) throw new Error(`no session for ${email}`)
  return data.session.access_token
}

let familyId = ''
const memberIds: Record<string, string> = {}

async function resolveFamilyId(): Promise<string> {
  if (familyId) return familyId
  const { data, error } = await sr
    .from('families')
    .select('id')
    .eq('family_login_name_lower', 'testworthfamily')
    .single()
  if (error || !data) throw new Error(`Testworth family not found: ${error?.message}`)
  familyId = data.id
  return familyId
}

async function resolveMemberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const fid = await resolveFamilyId()
  const { data, error } = await sr
    .from('family_members')
    .select('id')
    .eq('family_id', fid)
    .eq('display_name', name)
    .single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  return data.id
}

async function getActiveVerification(parentMemberId: string): Promise<{ id: string } | null> {
  const { data } = await sr
    .from('parent_verifications')
    .select('id')
    .eq('parent_member_id', parentMemberId)
    .is('revoked_at', null)
    .maybeSingle()
  return data
}

/** Temporarily revokes Sarah's active verification (if any) for the duration of `fn`, then restores it. */
async function withParentUnverified<T>(parentMemberId: string, fn: () => Promise<T>): Promise<T> {
  const original = await getActiveVerification(parentMemberId)
  if (original) {
    await sr.from('parent_verifications').update({ revoked_at: new Date().toISOString() }).eq('id', original.id)
  }
  try {
    return await fn()
  } finally {
    if (original) {
      await sr.from('parent_verifications').update({ revoked_at: null }).eq('id', original.id)
    }
  }
}

// Fixture rows this spec creates, tracked for cleanup.
const createdVerificationIds: string[] = []
const createdAttemptIds: string[] = []
const createdWebhookEventIds: string[] = []

test.afterAll(async () => {
  if (createdAttemptIds.length) await sr.from('parent_verification_attempts').delete().in('id', createdAttemptIds)
  if (createdVerificationIds.length) await sr.from('parent_verifications').delete().in('id', createdVerificationIds)
  if (createdWebhookEventIds.length) await sr.from('stripe_webhook_events').delete().in('event_id', createdWebhookEventIds)
})

test.describe.serial('PRD-40 COPPA Slice 2 — Stripe foundation', () => {
  let fid: string
  let sarahId: string

  test.beforeAll(async () => {
    fid = await resolveFamilyId()
    sarahId = await resolveMemberId('Sarah')
  })

  // ── R-10: unauthorized-caller probes ──────────────────────────────────

  test('create-coppa-verification-intent: kid session (Casey, role=member) is rejected (403)', async () => {
    const token = await accessTokenFor(TEST_USERS.casey.email, TEST_USERS.casey.password)
    const res = await fetch(FN('create-coppa-verification-intent'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
    })
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('not_authorized')
  })

  test('create-coppa-verification-intent: additional_adult session (Mark/dad) is rejected (403 — mom-only per R-10)', async () => {
    const token = await accessTokenFor(TEST_USERS.mark.email, TEST_USERS.mark.password)
    const res = await fetch(FN('create-coppa-verification-intent'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
    })
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('not_authorized')
  })

  test('create-coppa-verification-intent: family-shadow session (role=family, Convention #273) is rejected (403)', async () => {
    const token = await accessTokenFor(`${fid}@family.myaimcentral.app`, FAMILY_PASSWORD)
    const res = await fetch(FN('create-coppa-verification-intent'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
    })
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('not_authorized')
  })

  test('create-coppa-verification-intent: no Authorization header is rejected (401)', async () => {
    const res = await fetch(FN('create-coppa-verification-intent'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    expect(res.status).toBe(401)
  })

  // ── Note on View-As: per the migration 100305 comment, View-As does NOT
  // change auth.uid() (mom's real session stays authenticated underneath
  // the modal), so this Edge Function cannot distinguish "mom acting as
  // herself" from "mom viewing through View-As" server-side — that
  // distinction is a FRONTEND-layer restriction Slice 3 owns (hiding/
  // disabling the entry point while a View-As session is active). No
  // server-side probe for it is architecturally possible at this layer. ──

  // ── Rate limiting (5/hr) ───────────────────────────────────────────────

  test('create-coppa-verification-intent: 5 terminal attempts in the last hour blocks a 6th (429 hourly_limit)', async () => {
    await withParentUnverified(sarahId, async () => {
      const fakeRows = Array.from({ length: 5 }, (_, i) => ({
        family_id: fid,
        parent_member_id: sarahId,
        attempt_type: 'stripe_charge',
        status: 'failed_other',
        stripe_payment_intent_id: `pi_test_ratelimit_${Date.now()}_${i}`,
        failure_reason: 'E2E rate-limit fixture (coppa-stripe-foundation.spec.ts)',
      }))
      const { data: inserted, error } = await sr.from('parent_verification_attempts').insert(fakeRows).select('id')
      if (error) throw error
      const fixtureIds = (inserted ?? []).map((r) => r.id)

      try {
        const token = await accessTokenFor(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
        const res = await fetch(FN('create-coppa-verification-intent'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: '{}',
        })
        expect(res.status).toBe(429)
        const body = await res.json()
        expect(body.reason).toBe('hourly_limit')
      } finally {
        await sr.from('parent_verification_attempts').delete().in('id', fixtureIds)
      }
    })
  })

  // ── Idempotent short-circuit ───────────────────────────────────────────

  test('create-coppa-verification-intent: an existing active verification short-circuits without a new charge', async () => {
    await withParentUnverified(sarahId, async () => {
      const { data: fakeVer, error } = await sr
        .from('parent_verifications')
        .insert({
          family_id: fid,
          parent_member_id: sarahId,
          verification_method: 'stripe_charge',
          amount_charged_cents: 100,
          currency: 'USD',
        })
        .select('id, verified_at')
        .single()
      if (error) throw error

      try {
        const token = await accessTokenFor(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
        const res = await fetch(FN('create-coppa-verification-intent'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: '{}',
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.already_verified).toBe(true)
        expect(body.verification_id).toBe(fakeVer.id)
      } finally {
        await sr.from('parent_verifications').delete().eq('id', fakeVer.id)
      }
    })
  })

  // ── Real Stripe TEST-mode flow + signed-replay duplicate-event probe ──

  test('real $1 TEST-mode verification: create-intent -> Stripe confirm -> signed webhook replay (x2, dedup asserted)', async () => {
    test.skip(!STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET not present in .env.local for this environment')

    await withParentUnverified(sarahId, async () => {
      // 1. Create the real PaymentIntent through OUR deployed Edge Function.
      const token = await accessTokenFor(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
      const createRes = await fetch(FN('create-coppa-verification-intent'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}',
      })
      expect(createRes.status).toBe(200)
      const createBody = await createRes.json()
      expect(createBody.payment_intent_id).toBeTruthy()
      const paymentIntentId = createBody.payment_intent_id as string

      // 2. Confirm it for real against Stripe's TEST-mode API with a test card.
      const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: 'pm_card_visa',
      })
      expect(confirmed.status).toBe('succeeded')
      expect(confirmed.metadata.purpose).toBe('coppa_verification')
      expect(confirmed.metadata.parent_member_id).toBe(sarahId)

      // 3. Simulate the webhook via a signed replay (decision file §3 /
      //    dispatch prompt: "stripe trigger or a signed replay"). NOTE: a
      //    REAL, live-registered TEST-mode Stripe Dashboard endpoint now
      //    also points at this handler (required for real production
      //    traffic) — Stripe's own system independently delivers a REAL
      //    payment_intent.succeeded event (with its OWN event.id) the
      //    moment `confirm()` above succeeds, racing with this manual
      //    replay. That real delivery is legitimate, non-duplicate
      //    processing (a genuinely distinct event.id) and is EXPECTED to
      //    also produce a parent_verification_attempts row — the
      //    idempotency guarantee under test is narrower and still fully
      //    provable: THIS SPECIFIC fabricated event.id, delivered twice,
      //    must produce ZERO incremental effect on the second delivery.
      const eventId = `evt_test_success_${confirmed.id}`
      const payload = JSON.stringify({
        id: eventId,
        object: 'event',
        type: 'payment_intent.succeeded',
        data: { object: confirmed },
      })

      const countAttempts = async () => {
        const { count } = await sr
          .from('parent_verification_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('stripe_payment_intent_id', confirmed.id)
        return count ?? 0
      }

      const header = stripe.webhooks.generateTestHeaderString({ payload, secret: STRIPE_WEBHOOK_SECRET })
      const webhookRes1 = await fetch(FN('stripe-webhook-handler'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Stripe-Signature': header },
        body: payload,
      })
      expect(webhookRes1.status).toBe(200)
      const webhookBody1 = await webhookRes1.json()
      expect(webhookBody1.routed).toBe(true)
      createdWebhookEventIds.push(eventId)
      const countAfterFirstReplay = await countAttempts()

      // 4. DUPLICATE delivery of the SAME event id — the mandatory
      //    idempotency probe. Must be deduped, not reprocessed: the count
      //    must NOT grow between the first and second delivery of THIS
      //    event.id (whatever Stripe's own independent live delivery may
      //    have already contributed by this point is captured in the
      //    "after first replay" baseline, not attributed to this delta).
      const header2 = stripe.webhooks.generateTestHeaderString({ payload, secret: STRIPE_WEBHOOK_SECRET })
      const webhookRes2 = await fetch(FN('stripe-webhook-handler'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Stripe-Signature': header2 },
        body: payload,
      })
      expect(webhookRes2.status).toBe(200)
      const webhookBody2 = await webhookRes2.json()
      expect(webhookBody2.deduped).toBe(true)
      const countAfterSecondReplay = await countAttempts()
      expect(countAfterSecondReplay).toBe(countAfterFirstReplay)

      // 5. Regardless of how many legitimate distinct deliveries occurred
      //    (our manual replay + Stripe's own live delivery to the real
      //    registered endpoint both independently qualify), the load-
      //    bearing guarantee is a SINGLE parent_verifications row per
      //    payment_intent — never a second verification for a second
      //    delivery of the same underlying charge.
      const { data: verRows } = await sr
        .from('parent_verifications')
        .select('id, family_id, parent_member_id, amount_charged_cents, currency, stripe_payment_intent_id')
        .eq('stripe_payment_intent_id', confirmed.id)
      expect(verRows).toHaveLength(1)
      expect(verRows![0].family_id).toBe(fid)
      expect(verRows![0].parent_member_id).toBe(sarahId)
      expect(verRows![0].amount_charged_cents).toBe(100)
      expect(verRows![0].currency).toBe('USD')
      createdVerificationIds.push(verRows![0].id)

      // Every attempt row produced (1 from this manual replay, possibly +1
      // more from Stripe's own independent live delivery) must be
      // consistent: all 'succeeded', all pointing at the SAME verification.
      const { data: attemptRows } = await sr
        .from('parent_verification_attempts')
        .select('id, status, verification_id')
        .eq('stripe_payment_intent_id', confirmed.id)
      expect((attemptRows ?? []).length).toBeGreaterThanOrEqual(1)
      expect((attemptRows ?? []).length).toBeLessThanOrEqual(2)
      for (const row of attemptRows ?? []) {
        expect(row.status).toBe('succeeded')
        expect(row.verification_id).toBe(verRows![0].id)
      }
      if (attemptRows) createdAttemptIds.push(...attemptRows.map((r) => r.id))

      const { data: webhookEventRow } = await sr
        .from('stripe_webhook_events')
        .select('status')
        .eq('event_id', eventId)
        .maybeSingle()
      expect(webhookEventRow?.status).toBe('processed')
    })
  })

  test('real Stripe TEST-mode declined charge: signed payment_intent.payment_failed replay creates a failed_declined attempt, no verification row', async () => {
    test.skip(!STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET not present in .env.local for this environment')

    // Created directly via the Stripe API (not through create-intent) so
    // this test is independent of Sarah's current verification state —
    // Testworth has only one primary_parent, so a real decline flow via
    // the create-intent function itself would require a second parent.
    let declinedPI: Stripe.PaymentIntent | undefined
    try {
      await stripe.paymentIntents.create({
        amount: 100,
        currency: 'usd',
        payment_method: 'pm_card_visa_chargeDeclined',
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        metadata: { purpose: 'coppa_verification', family_id: fid, parent_member_id: sarahId },
      })
      throw new Error('expected the test card to decline, but the charge succeeded')
    } catch (err) {
      const raw = (err as { raw?: { payment_intent?: Stripe.PaymentIntent } }).raw
      declinedPI = raw?.payment_intent
      if (!declinedPI) throw err
    }

    const eventId = `evt_test_failed_${declinedPI.id}`
    const payload = JSON.stringify({
      id: eventId,
      object: 'event',
      type: 'payment_intent.payment_failed',
      data: { object: declinedPI },
    })
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: STRIPE_WEBHOOK_SECRET })

    const webhookRes = await fetch(FN('stripe-webhook-handler'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Stripe-Signature': header },
      body: payload,
    })
    expect(webhookRes.status).toBe(200)
    createdWebhookEventIds.push(eventId)

    // As with the succeeded-flow test above: the live-registered Stripe
    // endpoint independently delivers its OWN real payment_intent.payment_failed
    // event for this same decline (a distinct, legitimate event.id), which
    // may race with this manual replay — tolerate 1-2 consistent rows rather
    // than asserting a single delivery path.
    const { data: attemptRows } = await sr
      .from('parent_verification_attempts')
      .select('id, status, failure_reason')
      .eq('stripe_payment_intent_id', declinedPI.id)
    expect((attemptRows ?? []).length).toBeGreaterThanOrEqual(1)
    expect((attemptRows ?? []).length).toBeLessThanOrEqual(2)
    for (const row of attemptRows ?? []) {
      expect(row.status).toBe('failed_declined')
    }
    if (attemptRows) createdAttemptIds.push(...attemptRows.map((r) => r.id))

    const { data: verRows } = await sr
      .from('parent_verifications')
      .select('id')
      .eq('stripe_payment_intent_id', declinedPI.id)
    expect(verRows).toHaveLength(0)
  })

  // ── Signature verification itself ─────────────────────────────────────

  test('stripe-webhook-handler: an unsigned/forged request is rejected (400), nothing persists', async () => {
    const payload = JSON.stringify({
      id: `evt_test_forged_${Date.now()}`,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_forged', metadata: { purpose: 'coppa_verification', family_id: fid, parent_member_id: sarahId } } },
    })
    const res = await fetch(FN('stripe-webhook-handler'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Stripe-Signature': 'deadbeef,v1=00000000000000000000000000000000000000000000000000000000000000' },
      body: payload,
    })
    expect(res.status).toBe(400)

    const { data } = await sr.from('parent_verifications').select('id').eq('stripe_payment_intent_id', 'pi_forged')
    expect(data).toHaveLength(0)
  })
})
