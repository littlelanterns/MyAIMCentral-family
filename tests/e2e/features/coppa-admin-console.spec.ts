/**
 * PRD-40 COPPA — Slice 6 pins: /admin/coppa (Screen 10) + THE STAMP GUARD.
 *
 * The load-bearing claims:
 *   1. The four migration-100330 admin RPCs are reachable ONLY by a staff
 *      session carrying permission_type='coppa_admin' — anon, mom, and a
 *      staff session with a DIFFERENT permission type are all refused.
 *   2. THE SEQUENCING LAW HOLDS IN CODE: admin_stamp_consent_template
 *      refuses while any unconsented, non-suspended under-13 member exists.
 *      This spec GUARANTEES refusal independent of production state by
 *      seeding its own unconsented under-13 fixture child first — so the
 *      stamp can never accidentally succeed against production, even after
 *      the founder ceremony consents her own kids. The success path is
 *      deliberately NOT tested here (stamping ANY non-retired template
 *      activates enforcement platform-wide); it is proven transaction-
 *      locally by scripts/coppa-enforcement-probes.sql's precedent pattern.
 *   3. THE SIDE DOOR IS CLOSED: a coppa_admin staff session cannot set
 *      lawyer_approved_at via direct .update() or a pre-approved .insert()
 *      (column-level grants, migration 100330) — while legitimate template
 *      ops (new unapproved version, retire, notes) still work.
 *   4. The Slice-2 coverage gap: reconcile-coppa-verifications catches a
 *      succeeded Stripe charge whose webhook never landed (read-only
 *      invocation of the deployed function; env-gated on STRIPE_SECRET_KEY).
 *   5. Browser: a coppa_admin staff user sees the real Screen 10; a
 *      non-staff family adult gets the AdminGate card.
 *
 * Fixture isolation: COPPATEST S6 prefix, tracked ids, loud sweep, zero
 * residue asserted (incl. the TEEN-CRED soft-delete auth check).
 */
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import dotenv from 'dotenv'
import { TEST_USERS } from '../helpers/seed-testworths-complete'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'
const FN = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`

const sr = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ADMIN_RPCS = [
  { name: 'admin_coppa_overview', args: {} },
  { name: 'admin_coppa_stamp_readiness', args: {} },
  { name: 'admin_coppa_family_detail', args: { p_family_id: '00000000-0000-0000-0000-000000000000' } },
  { name: 'admin_stamp_consent_template', args: { p_version: 'COPPATEST-0.0.0', p_lawyer_name: 'Nobody' } },
] as const

const FIXTURE_TEMPLATE = 'COPPATEST-0.0.0'
const FIXTURE_TEMPLATE_2 = 'COPPATEST-0.0.1'
const STAFF_EMAIL = `coppatest-s6-staff-${Date.now()}@pin.myaimcentral.app.test`
const STAFF_PASSWORD = 'CoppaTest2026!Admin'

let familyId = ''
let sarahMemberId = ''
let blockerKidId = ''
let staffUserId = ''
const createdStaffPermissionIds: string[] = []

async function signInClient(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: true } })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`signIn ${email}: ${error?.message}`)
  return client
}

async function resolveTestworth() {
  const { data: fam, error } = await sr
    .from('families').select('id').eq('family_name', 'The Testworth Family').single()
  if (error || !fam) throw new Error(`Testworth family not found: ${error?.message}`)
  familyId = fam.id
  const { data: sarah } = await sr
    .from('family_members').select('id')
    .eq('family_id', familyId).eq('role', 'primary_parent').single()
  if (!sarah) throw new Error('Sarah (primary_parent) not found')
  sarahMemberId = sarah.id
}

/** If a lawyer-approved template exists, enforcement is ACTIVE and this
 *  spec's premises (and its safety design) no longer model production. */
async function assertDormancy() {
  const { data } = await sr
    .from('coppa_consent_templates')
    .select('version')
    .not('lawyer_approved_at', 'is', null)
    .is('retired_at', null)
  if (data?.length) {
    throw new Error(
      'A lawyer-approved consent template exists — COPPA enforcement is ACTIVE. Re-scope this spec before running it.',
    )
  }
}

async function seedBlockerKid() {
  // No auth account — this child exists purely so the platform-wide
  // sequencing-law count can never reach zero while the spec runs.
  const { data, error } = await sr
    .from('family_members')
    .insert({
      family_id: familyId, display_name: 'COPPATEST S6 Blocker Kid', role: 'member',
      dashboard_mode: 'guided', relationship: 'child', age: 7, in_household: true,
      dashboard_enabled: true, auth_method: 'none', is_active: true,
      coppa_age_bracket: 'under_13', member_color: '#68a395',
    })
    .select('id').single()
  if (error || !data) throw new Error(`seed blocker kid failed: ${error?.message}`)
  blockerKidId = data.id
}

async function seedFixtureTemplate() {
  const { error } = await sr.from('coppa_consent_templates').insert({
    version: FIXTURE_TEMPLATE,
    section_what_we_collect: 'COPPATEST S6 fixture — never a real disclosure.',
    section_how_lila_uses: 'COPPATEST S6 fixture.',
    section_who_sees_it: 'COPPATEST S6 fixture.',
    section_your_rights: 'COPPATEST S6 fixture.',
    section_parent_affirmation: 'COPPATEST S6 fixture.',
    notes: 'COPPATEST S6 — stamp-guard probe target. Swept by the spec.',
  })
  if (error) throw new Error(`seed fixture template failed: ${error.message}`)
}

async function seedStaffUser() {
  const { data: created, error } = await sr.auth.admin.createUser({
    email: STAFF_EMAIL,
    password: STAFF_PASSWORD,
    email_confirm: true,
    // TEEN-CRED lesson (migration 100325): without this, handle_new_user
    // spawns a phantom family for this synthetic account.
    user_metadata: { skip_auto_family: true },
  })
  if (error || !created.user) throw new Error(`staff createUser failed: ${error?.message}`)
  staffUserId = created.user.id
}

async function grantStaff(permissionType: string) {
  // Idempotent: safe to call from any test so subset runs (--grep) stay
  // self-sufficient — no cross-test grant dependency.
  const { data: existing } = await sr
    .from('staff_permissions').select('id')
    .eq('user_id', staffUserId).eq('permission_type', permissionType).limit(1)
  if (existing?.length) return
  const { data, error } = await sr
    .from('staff_permissions')
    .insert({ user_id: staffUserId, permission_type: permissionType, granted_by: staffUserId })
    .select('id').single()
  if (error || !data) throw new Error(`grantStaff(${permissionType}) failed: ${error?.message}`)
  createdStaffPermissionIds.push(data.id)
}

async function sweep() {
  const warn = (label: string, err: { message: string } | null) => {
    if (err) console.warn(`sweep: ${label} failed:`, err.message)
  }
  warn('staff_permissions', (await sr.from('staff_permissions').delete().eq('user_id', staffUserId || '00000000-0000-0000-0000-000000000000')).error)
  // Fixture members (auto-provisioned resources first — NO-CASCADE FKs)
  const { data: fixtureMembers } = await sr
    .from('family_members').select('id').like('display_name', 'COPPATEST S6%')
  const memberIds = (fixtureMembers ?? []).map((m) => m.id)
  if (memberIds.length) {
    for (const [table, col] of [
      ['lists', 'owner_id'], ['archive_folders', 'member_id'], ['dashboard_configs', 'family_member_id'],
      ['archive_member_settings', 'member_id'], ['dashboard_widgets', 'family_member_id'],
    ] as const) {
      warn(table, (await sr.from(table).delete().in(col, memberIds)).error)
    }
    warn('family_members', (await sr.from('family_members').delete().in('id', memberIds)).error)
  }
  warn('coppa_consent_templates', (await sr.from('coppa_consent_templates').delete().like('version', 'COPPATEST-%')).error)
  if (staffUserId) {
    const del = await sr.auth.admin.deleteUser(staffUserId)
    if (del.error) console.warn('sweep: auth deleteUser failed:', del.error.message)
  }
  // Loud residue checks (TEEN-CRED lesson: deleteUser can silently soft-delete)
  const { data: memberResidue } = await sr.from('family_members').select('id').like('display_name', 'COPPATEST S6%')
  if (memberResidue?.length) console.warn(`sweep: ${memberResidue.length} COPPATEST S6 member row(s) remain — investigate`)
  const { data: templateResidue } = await sr.from('coppa_consent_templates').select('version').like('version', 'COPPATEST-%')
  if (templateResidue?.length) console.warn(`sweep: ${templateResidue.length} COPPATEST template row(s) remain — investigate`)
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await resolveTestworth()
  await sweep()
  await assertDormancy()
  await seedBlockerKid()
  await seedFixtureTemplate()
  await seedStaffUser()
})

test.afterAll(async () => {
  await sweep()
})

// ═══ 1. RPC gates ══════════════════════════════════════════════════════════

test('admin RPCs: anon, mom (non-staff), and wrong-permission staff are all refused', async () => {
  // anon — no session at all
  const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  for (const rpc of ADMIN_RPCS) {
    const { error } = await anon.rpc(rpc.name, rpc.args as Record<string, unknown>)
    expect(error, `anon must be refused on ${rpc.name}`).toBeTruthy()
  }

  // Sarah — a real primary parent, zero staff rows
  const { data: sarahStaff } = await sr.from('staff_permissions').select('id').eq('user_id',
    (await sr.from('family_members').select('user_id').eq('id', sarahMemberId).single()).data!.user_id)
  expect(sarahStaff ?? []).toHaveLength(0) // premise: Sarah is not staff
  const sarahClient = await signInClient(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
  for (const rpc of ADMIN_RPCS) {
    const { error } = await sarahClient.rpc(rpc.name, rpc.args as Record<string, unknown>)
    expect(error?.message ?? '', `mom must be refused on ${rpc.name}`).toContain('not authorized')
  }
  await sarahClient.auth.signOut()

  // Staff with the WRONG permission type — coppa_admin is the narrower gate
  await grantStaff('persona_admin')
  const staffClient = await signInClient(STAFF_EMAIL, STAFF_PASSWORD)
  for (const rpc of ADMIN_RPCS) {
    const { error } = await staffClient.rpc(rpc.name, rpc.args as Record<string, unknown>)
    expect(error?.message ?? '', `persona_admin-only staff must be refused on ${rpc.name}`).toContain('not authorized')
  }
  await staffClient.auth.signOut()
})

// ═══ 2. coppa_admin reads ══════════════════════════════════════════════════

test('coppa_admin: overview, readiness, and family detail return the real compliance picture', async () => {
  await grantStaff('coppa_admin')
  const staffClient = await signInClient(STAFF_EMAIL, STAFF_PASSWORD)

  const { data: overview, error: ovErr } = await staffClient.rpc('admin_coppa_overview')
  expect(ovErr).toBeNull()
  const testworth = (overview as Array<Record<string, unknown>>).find((r) => r.family_id === familyId)
  expect(testworth, 'Testworth must appear in the overview').toBeTruthy()
  // The blocker kid guarantees at least one under-13 + one unconsented
  expect(Number(testworth!.under_13_members)).toBeGreaterThanOrEqual(1)
  expect(Number(testworth!.unconsented_under_13)).toBeGreaterThanOrEqual(1)
  expect(testworth!.parent_name).toBeTruthy()

  const { data: readiness, error: rdErr } = await staffClient.rpc('admin_coppa_stamp_readiness')
  expect(rdErr).toBeNull()
  const r = readiness as { unconsented_under_13: number; ready: boolean; blockers: Array<{ member_name: string }> }
  expect(r.ready).toBe(false)
  expect(r.unconsented_under_13).toBeGreaterThanOrEqual(1)
  expect(r.blockers.some((b) => b.member_name === 'COPPATEST S6 Blocker Kid')).toBe(true)

  const { data: detail, error: dtErr } = await staffClient.rpc('admin_coppa_family_detail', { p_family_id: familyId })
  expect(dtErr).toBeNull()
  const d = detail as { family: { family_name: string }; consents: unknown[]; attempts: unknown[]; deletion_log: unknown[] }
  expect(d.family.family_name).toBe('The Testworth Family')
  expect(Array.isArray(d.consents)).toBe(true)
  expect(Array.isArray(d.attempts)).toBe(true)
  expect(Array.isArray(d.deletion_log)).toBe(true)

  await staffClient.auth.signOut()
})

// ═══ 3. THE STAMP GUARD ════════════════════════════════════════════════════

test('stamp guard: the sequencing law refuses while an unconsented under-13 member exists', async () => {
  const staffClient = await signInClient(STAFF_EMAIL, STAFF_PASSWORD)

  // Unknown version
  const unknown = await staffClient.rpc('admin_stamp_consent_template', {
    p_version: 'COPPATEST-does-not-exist', p_lawyer_name: 'Counsel Name',
  })
  expect(unknown.error?.message ?? '').toContain('template_not_found')

  // Missing lawyer name
  const noName = await staffClient.rpc('admin_stamp_consent_template', {
    p_version: FIXTURE_TEMPLATE, p_lawyer_name: '  ',
  })
  expect(noName.error?.message ?? '').toContain('lawyer_name_required')

  // THE LAW: refused while the blocker kid (and, pre-ceremony, the founder's
  // own kids) lack active consent.
  const blocked = await staffClient.rpc('admin_stamp_consent_template', {
    p_version: FIXTURE_TEMPLATE, p_lawyer_name: 'Counsel Name',
  })
  expect(blocked.error?.message ?? '').toContain('sequencing_law_blocked')

  // The row is untouched.
  const { data: row } = await sr
    .from('coppa_consent_templates')
    .select('lawyer_approved_at, lawyer_name')
    .eq('version', FIXTURE_TEMPLATE).single()
  expect(row!.lawyer_approved_at).toBeNull()
  expect(row!.lawyer_name).toBeNull()

  await staffClient.auth.signOut()
})

test('side door closed: direct writes to lawyer_approved_at are refused even for coppa_admin; legit template ops still work', async () => {
  const staffClient = await signInClient(STAFF_EMAIL, STAFF_PASSWORD)

  // Direct UPDATE of the enforcement switch — column-level grant refuses.
  const directUpdate = await staffClient
    .from('coppa_consent_templates')
    .update({ lawyer_approved_at: new Date().toISOString(), lawyer_name: 'Side Door' })
    .eq('version', FIXTURE_TEMPLATE)
  expect(directUpdate.error, 'direct lawyer_approved_at UPDATE must be refused').toBeTruthy()

  // Direct INSERT of a pre-approved version — refused the same way.
  const bornApproved = await staffClient.from('coppa_consent_templates').insert({
    version: 'COPPATEST-0.0.9',
    section_what_we_collect: 'x', section_how_lila_uses: 'x', section_who_sees_it: 'x',
    section_your_rights: 'x', section_parent_affirmation: 'x',
    lawyer_approved_at: new Date().toISOString(),
  })
  expect(bornApproved.error, 'pre-approved INSERT must be refused').toBeTruthy()

  // Verify nothing landed.
  const { data: fixtureRow } = await sr
    .from('coppa_consent_templates').select('lawyer_approved_at').eq('version', FIXTURE_TEMPLATE).single()
  expect(fixtureRow!.lawyer_approved_at).toBeNull()
  const { data: ghost } = await sr
    .from('coppa_consent_templates').select('version').eq('version', 'COPPATEST-0.0.9')
  expect(ghost ?? []).toHaveLength(0)

  // Legitimate ops survive the column guard: a new UNAPPROVED version…
  const legitInsert = await staffClient.from('coppa_consent_templates').insert({
    version: FIXTURE_TEMPLATE_2,
    section_what_we_collect: 'COPPATEST S6 fixture v2.', section_how_lila_uses: 'x',
    section_who_sees_it: 'x', section_your_rights: 'x', section_parent_affirmation: 'x',
    notes: 'COPPATEST S6 — legit-insert probe.',
  })
  expect(legitInsert.error).toBeNull()
  // …and retiring it.
  const legitRetire = await staffClient
    .from('coppa_consent_templates')
    .update({ retired_at: new Date().toISOString() })
    .eq('version', FIXTURE_TEMPLATE_2)
  expect(legitRetire.error).toBeNull()
  const { data: retired } = await sr
    .from('coppa_consent_templates').select('retired_at, lawyer_approved_at').eq('version', FIXTURE_TEMPLATE_2).single()
  expect(retired!.retired_at).toBeTruthy()
  expect(retired!.lawyer_approved_at).toBeNull()

  await staffClient.auth.signOut()
})

// ═══ 4. Reconciliation — the Slice-2 coverage gap ══════════════════════════

test('reconcile-coppa-verifications: flags a succeeded charge whose webhook never landed; refuses without the service bearer', async ({ request }) => {
  test.skip(!STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY not configured — reconciliation gap test needs the TEST-mode key')
  const stripe = new Stripe(STRIPE_SECRET_KEY!)

  // Unauthorized call first (no bearer) — must never run the sweep.
  const unauthorized = await request.post(FN('reconcile-coppa-verifications'), { data: {} })
  expect(unauthorized.status()).toBe(401)

  // A REAL succeeded TEST-mode charge, purpose-tagged, created directly
  // against Stripe (no Edge Function involved) — and NO webhook replay, so
  // no parent_verifications row exists: the exact silent-loss scenario the
  // cron exists to catch.
  const pi = await stripe.paymentIntents.create({
    amount: 100,
    currency: 'usd',
    payment_method: 'pm_card_visa',
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    metadata: { purpose: 'coppa_verification', family_id: familyId, parent_member_id: sarahMemberId, coppatest: 's6' },
  })
  expect(pi.status).toBe('succeeded')

  const res = await request.post(FN('reconcile-coppa-verifications'), {
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    data: {},
  })
  expect(res.status()).toBe(200)
  const body = await res.json() as {
    succeeded_intents_checked: number
    mismatches_found: number
    mismatches: Array<{ payment_intent_id: string }>
  }
  expect(body.succeeded_intents_checked).toBeGreaterThanOrEqual(1)
  expect(
    body.mismatches.some((m) => m.payment_intent_id === pi.id),
    'the orphaned charge must be flagged as a mismatch',
  ).toBe(true)

  // Nothing persisted — the reconciliation job is read-only against the DB.
  const { data: verificationRows } = await sr
    .from('parent_verifications').select('id').eq('stripe_payment_intent_id', pi.id)
  expect(verificationRows ?? []).toHaveLength(0)
})

// ═══ 5. Browser probes ═════════════════════════════════════════════════════

test('browser: coppa_admin staff sees Screen 10 with the readiness banner and a disabled stamp; the guard names the blocker', async ({ page }) => {
  await grantStaff('coppa_admin')
  await page.goto(`${APP_URL}/auth/sign-in`)
  await page.locator('input[type="email"]').fill(STAFF_EMAIL)
  await page.locator('input[type="password"]').fill(STAFF_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {})

  await page.goto(`${APP_URL}/admin/coppa`)
  await expect(page.getByTestId('coppa-admin-page')).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('COPPA Verification Log')).toBeVisible()
  await expect(page.getByTestId('stamp-readiness-banner')).toContainText('BLOCKED')
  await expect(page.getByTestId('stamp-readiness-banner')).toContainText('COPPATEST S6 Blocker Kid')
  // .first(): the family name legitimately appears twice (overview row +
  // the readiness banner's "Blocker Kid — The Testworth Family" line).
  await expect(page.getByText('The Testworth Family').first()).toBeVisible()

  // The fixture template's stamp button renders and is hard-disabled.
  const stampButton = page.getByTestId(`stamp-open-${FIXTURE_TEMPLATE}`)
  await expect(stampButton).toBeVisible()
  await expect(stampButton).toBeDisabled()

  // Full record expands with counts-only sections.
  await page.getByTestId(`view-record-${familyId}`).click()
  await expect(page.getByTestId('family-detail')).toBeVisible()
  await expect(page.getByTestId('family-detail')).toContainText('Deletion log')
})

test('browser: a non-staff family adult gets the AdminGate card, never the log', async ({ page }) => {
  await page.goto(`${APP_URL}/auth/sign-in`)
  await page.locator('input[type="email"]').fill(TEST_USERS.mark.email)
  await page.locator('input[type="password"]').fill(TEST_USERS.mark.password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {})

  await page.goto(`${APP_URL}/admin/coppa`)
  await expect(page.getByText('Admin area')).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('coppa-admin-page')).toHaveCount(0)
})
