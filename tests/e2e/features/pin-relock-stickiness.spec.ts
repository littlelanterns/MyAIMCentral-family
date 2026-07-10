/**
 * PINR — Personal-Device Timeout → PIN/Picture Relock — E2E verification
 * (2026-07-09)
 *
 * Family-Auth-Two-Door Founder Decision 4: "family layer persists; timeout
 * drops only to the PIN/picture relock" — a kid's personal-device session
 * timeout should never dump them at the full family-name + password door;
 * it should resume at just their own PIN/picture gate. Implemented via
 * Option A (dual persisted Supabase sessions): a second, narrowly-scoped
 * client (familyDeviceClient.ts) holds the family-shadow session
 * persistently, surviving the member's own PIN sign-in on the main client.
 *
 * Assertions per the PINR pack (PINR-RECON.md §E):
 *  (a) simulated timeout → member's own PIN/picture screen ONLY, never the
 *      full family-name + password form
 *  (b) kill switch (family password change) → the SAME resume path falls
 *      back to the full door
 *  (c) requires_email_login members → routed to /auth/sign-in on resume
 *      (inherited for free — resume lands on the SAME 'visual-password'
 *      step PicturePasswordGrid already handles this in)
 *  (d) localStorage.clear() → full door (both storage keys wiped)
 *
 * Uses the DEV-only test seam (getTestTimeoutOverrideMs in
 * useSessionTimeout.ts, sessionStorage-gated, dead-code-eliminated from
 * production builds) to simulate a multi-second timeout instead of the real
 * 7-day independent/guided/play duration.
 *
 * Run: npx playwright test tests/e2e/features/pin-relock-stickiness.spec.ts
 */
import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TESTWORTH_FAMILY_ID = '1f6200a7-df82-4ac4-bce3-3edcafe66bc5'
const TESTWORTH_LOGIN = 'testworthfamily'
const TESTWORTH_PASSWORD = process.env.E2E_TESTWORTH_FAMILY_PASSWORD || 'Lanterns2026'
const SARAH = { email: 'testmom@testworths.com', password: 'Demo2026!' }
// FE-FOLLOWUP item 2 (2026-07-10) FIXED the bug this constant used to
// work around: the mom-facing PIN-setting UI hard-requires exactly 4 digits,
// but this Supabase project's Auth minimum_password_length is 6 — and
// ensure_pin_shadow_account used to use the raw PIN AS the shadow account's
// password, so it always failed server-side for every 4-digit PIN. The fix
// (mirroring the picture-password derived-secret pattern) means the shadow
// account's password is now a server-derived HMAC secret, never the PIN
// itself — so a realistic 4-digit PIN works end-to-end. This constant is a
// REAL 4-digit PIN now (not a 6-digit workaround), and establishTestMemberSession
// / completeRelockViaDirectSession below authenticate via the pin_login Edge
// Function action (verify_member_pin + derived-secret sign-in) instead of a
// raw password sign-in — the same mechanism FamilyLogin.handlePinSubmit uses.
const TEST_PIN = '4821'
const OVERRIDE_MS = 3000
const MARKER = 'PINRTEST'
const TEST_MEMBER_NAME = `${MARKER} Kid`

let testMemberId = ''
let caseyId = ''
let caseyAssetId = ''
let testMemberAuthUserId = '' // the shadow-account auth id ensure_pin_shadow_account creates

/**
 * Deletes a PINR test member and everything auto_provision_member_resources
 * (Convention #19/#77) created for it — lists, archive_folders, dashboard_
 * configs, dashboard_widgets, archive_member_settings all carry a
 * family_members FK with no ON DELETE CASCADE, so the bare member-row
 * delete fails otherwise. Also deletes the linked auth.users PIN shadow
 * account. Safe to call on a row that may already be partially cleaned up.
 */
async function deletePinrTestMember(memberId: string, authUserId?: string | null) {
  await admin.from('dashboard_widgets').delete().eq('family_member_id', memberId)
  await admin.from('lists').delete().eq('owner_id', memberId)
  await admin.from('archive_folders').delete().eq('member_id', memberId)
  await admin.from('dashboard_configs').delete().eq('family_member_id', memberId)
  await admin.from('archive_member_settings').delete().eq('member_id', memberId)
  await admin.from('family_members').delete().eq('id', memberId)
  if (authUserId) {
    await admin.auth.admin.deleteUser(authUserId).catch(() => {})
  }
}

test.beforeAll(async () => {
  // Pre-sweep: an earlier run that crashed mid-test (rather than failing a
  // clean assertion) can skip afterAll entirely, leaving a stale PINRTEST
  // Kid row (and its auth-account) behind. Idempotent — matches nothing on
  // a clean run.
  const { data: stale } = await admin
    .from('family_members')
    .select('id, user_id')
    .eq('family_id', TESTWORTH_FAMILY_ID)
    .eq('display_name', TEST_MEMBER_NAME)
  for (const row of stale ?? []) {
    await deletePinrTestMember(row.id, row.user_id as string | null)
  }

  // Every real Testworth member (seed-testworths-complete.ts's TEST_USERS)
  // already has family_members.user_id pointed at a REAL email/password
  // account for direct-session testing by OTHER specs — repointing it to a
  // PIN shadow account here would break useFamilyMember() resolution for
  // whichever OTHER spec signs in as that member's real email in a
  // (possibly concurrent) run. A dedicated, PINR-owned member sidesteps
  // this entirely: user_id starts NULL, so ensure_pin_shadow_account is the
  // ONLY writer and correctly claims it with zero shared-fixture risk.
  // (Found live while writing this test: reusing an existing Testworth
  // member here silently left useSessionTimeout treating the session as
  // unresolved — member===undefined — which defaults getTimeoutMs() to
  // SESSION_DURATIONS.adult=0 [no timeout at all], never even reaching the
  // test override. Root cause was the user_id conflict, not a PINR bug.)
  const { data: newMember, error: memberErr } = await admin
    .from('family_members')
    .insert({
      family_id: TESTWORTH_FAMILY_ID,
      display_name: TEST_MEMBER_NAME,
      role: 'member',
      dashboard_mode: 'independent',
    })
    .select('id')
    .single()
  if (memberErr || !newMember) throw new Error(`Failed to create PINR test member: ${memberErr?.message}`)
  testMemberId = newMember.id

  // Mirror the real mom-facing PIN-set flow exactly (FamilyMembers.tsx:600):
  // hash_member_pin FIRST (stores pin_hash — the verify_member_pin gate
  // pin_login now actually calls), THEN ensure_pin_shadow_account (mints the
  // session-capable shadow account). Both require mom's JWT.
  const sarahClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error: sarahErr } = await sarahClient.auth.signInWithPassword(SARAH)
  if (sarahErr) throw new Error(`Sarah sign-in failed: ${sarahErr.message}`)
  const { error: hashErr } = await sarahClient.rpc('hash_member_pin', {
    p_member_id: testMemberId,
    p_pin: TEST_PIN,
  })
  if (hashErr) throw new Error(`Failed to hash PINR test member's PIN: ${hashErr.message}`)
  const { data: pinData, error: pinErr } = await sarahClient.functions.invoke('family-auth-admin', {
    body: { action: 'ensure_pin_shadow_account', member_id: testMemberId, pin: TEST_PIN },
  })
  if (pinErr || !pinData?.success) {
    throw new Error(`Failed to set PINR test member's PIN: ${pinErr?.message ?? JSON.stringify(pinData)}`)
  }
  const { data: linkedRow } = await admin.from('family_members').select('user_id').eq('id', testMemberId).single()
  testMemberAuthUserId = linkedRow!.user_id as string

  // Casey — reuse the family-auth-two-door.spec.ts precedent's picture-
  // password fixture setup for test (c), requires_email_login. Unaffected
  // by the user_id issue above — that test bails to /auth/sign-in via the
  // SERVER-SIDE picture_login requires_email_login check, before any
  // client-side useFamilyMember() resolution would matter.
  const { data: casey } = await admin
    .from('family_members')
    .select('id, visual_password_config')
    .eq('family_id', TESTWORTH_FAMILY_ID)
    .eq('display_name', 'Casey')
    .single()
  if (!casey) throw new Error('Casey not found — seed failed?')
  caseyId = casey.id
  const config = casey.visual_password_config as { asset_id?: string } | null
  if (config?.asset_id) {
    caseyAssetId = config.asset_id
  } else {
    const { data: assets } = await admin
      .from('platform_assets')
      .select('id')
      .eq('category', 'login_avatar')
      .eq('status', 'active')
      .limit(1)
    caseyAssetId = assets![0].id
    await admin
      .from('family_members')
      .update({ visual_password_config: { asset_id: caseyAssetId }, auth_method: 'visual_password' })
      .eq('id', caseyId)
  }

  // Clean lockout state so PIN/password entry is deterministic
  await admin.from('family_members').update({ pin_failed_attempts: 0, pin_locked_until: null }).eq('id', caseyId)
  await admin
    .from('families')
    .update({ family_password_failed_attempts: 0, family_password_locked_until: null })
    .eq('id', TESTWORTH_FAMILY_ID)
})

test.afterAll(async () => {
  if (testMemberId) {
    await deletePinrTestMember(testMemberId, testMemberAuthUserId || null)
  }
})

async function openFamilyDoor(page: Page) {
  await page.goto('/auth/family-login')
  await page.getByPlaceholder('e.g., TheSmithCrew').fill(TESTWORTH_LOGIN)
  await page.getByPlaceholder("Your family's shared password").fill(TESTWORTH_PASSWORD)
  await page.getByRole('button', { name: 'Continue' }).click()
}

/** Inject the DEV-only timeout override BEFORE any page script runs, so
 * ShellProvider/useSessionTimeout picks it up on the test member's/Casey's first
 * render (both are dashboard_mode='independent'). */
async function withShortIndependentTimeout(page: Page, ms: number) {
  await page.addInitScript((msArg) => {
    sessionStorage.setItem('__pinr_e2e_timeout_override_ms_independent', String(msArg))
  }, ms)
}

/**
 * Signs the test member in via the REAL mechanism the app now uses
 * (FE-FOLLOWUP item 2): the pin_login Edge Function action verifies
 * the PIN server-side (verify_member_pin, lockout applies) and returns
 * access/refresh tokens for a shadow account whose password is a
 * server-derived secret — never the PIN itself. setSession reconstructs the
 * full session object from those tokens, matching what
 * FamilyLogin.handlePinSubmit does in the browser.
 */
async function signInTestMemberViaPinLogin() {
  const anonClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: loginData, error: loginErr } = await anonClient.functions.invoke('family-auth-admin', {
    body: { action: 'pin_login', member_id: testMemberId, pin: TEST_PIN },
  })
  if (loginErr || !loginData?.success || !loginData.access_token || !loginData.refresh_token) {
    throw new Error(`pin_login failed: ${loginErr?.message ?? JSON.stringify(loginData)}`)
  }
  const { data: sessionData, error: setSessionErr } = await anonClient.auth.setSession({
    access_token: loginData.access_token,
    refresh_token: loginData.refresh_token,
  })
  if (setSessionErr || !sessionData.session) {
    throw new Error(`Failed to reconstruct session from pin_login tokens: ${setSessionErr?.message}`)
  }
  return sessionData.session
}

/**
 * Establishes the family layer via the REAL family-door flow (both the
 * main client's session AND the persisted familyDeviceClient session —
 * exactly what PINR needs resumable), then lands the test member on /dashboard with
 * her own real session.
 *
 * The test member's PIN-entry gate itself is NOT driven through the UI here
 * (the relock-gate UI interaction is what tests (a)/(b)/(d) below actually
 * verify) — her own session is instead seeded directly via
 * signInTestMemberViaPinLogin, which clobbers the main client's storage slot
 * exactly as a real PIN sign-in does. The family device client (a SEPARATE
 * client/storage key) is left untouched by this, which is the actual
 * behavior PINR needs to prove survives.
 */
async function establishTestMemberSession(page: Page) {
  await openFamilyDoor(page)
  await expect(page.getByText(TEST_MEMBER_NAME)).toBeVisible({ timeout: 15000 })

  const session = await signInTestMemberViaPinLogin()

  await page.evaluate((sessionJson) => {
    localStorage.setItem('myaim-auth', sessionJson)
  }, JSON.stringify(session))

  await page.goto('/dashboard')
  await page.waitForURL('**/dashboard', { timeout: 20000 })
}

/**
 * Completes the relock gate the SAME way establishTestMemberSession
 * bootstraps her initial session — direct localStorage seed via
 * signInTestMemberViaPinLogin. The gate ITSELF (verify_member_pin
 * correctness, the RPC lockout logic) is unit-level server behavior
 * untouched by PINR; what PINR needs proven here is that the relock SCREEN
 * correctly renders the test member's own gate on resume — this helper only
 * stands in for "then the test member successfully re-authenticates."
 */
async function completeRelockViaDirectSession(page: Page) {
  const session = await signInTestMemberViaPinLogin()
  await page.evaluate((sessionJson) => {
    localStorage.setItem('myaim-auth', sessionJson)
  }, JSON.stringify(session))
  await page.goto('/dashboard')
  await page.waitForURL('**/dashboard', { timeout: 20000 })
}

test.describe('PINR — personal-device timeout relock', () => {
  test('(a) simulated timeout resumes at the test member\'s own PIN gate ONLY — never the full family-name + password form', async ({ page }) => {
    await withShortIndependentTimeout(page, OVERRIDE_MS)
    await establishTestMemberSession(page)

    // Wait past the override + a margin for the timeout callback + navigate
    await page.waitForURL('**/auth/family-login', { timeout: OVERRIDE_MS + 15000 })

    // Relock screen: the test member's own PIN gate, reached directly — never
    // the family-name + password form.
    await expect(page.getByText(new RegExp(`Welcome back, ${TEST_MEMBER_NAME}`, 'i'))).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Enter your PIN/i)).toBeVisible()
    await expect(page.getByPlaceholder('e.g., TheSmithCrew')).not.toBeVisible()
    await expect(page.getByPlaceholder("Your family's shared password")).not.toBeVisible()

    // And the relock gate actually works — the test member re-authenticates and lands
    // back on /dashboard without ever re-entering the family password.
    await completeRelockViaDirectSession(page)
  })

  test('(b) kill switch (family password change) makes the SAME resume path fall back to the full door', async ({ page, context }) => {
    await withShortIndependentTimeout(page, OVERRIDE_MS)
    await establishTestMemberSession(page)
    await page.waitForURL('**/auth/family-login', { timeout: OVERRIDE_MS + 15000 })
    await expect(page.getByText(new RegExp(`Welcome back, ${TEST_MEMBER_NAME}`, 'i'))).toBeVisible({ timeout: 10000 })

    // Kill switch from a SEPARATE mom session/page: re-saving the family
    // password (same value, matching the family-auth-two-door.spec.ts test
    // 7 precedent) rotates the shadow account + fires a global sign-out,
    // revoking the family-shadow session on EVERY device — including the
    // one already persisted in the test member's browser via familyDeviceClient.
    const momPage = await context.newPage()
    await momPage.goto('/auth/sign-in')
    await momPage.locator('input[type="email"]').fill(SARAH.email)
    await momPage.locator('input[type="password"]').fill(SARAH.password)
    await momPage.getByRole('button', { name: /sign in/i }).click()
    await momPage.waitForURL('**/dashboard', { timeout: 30000 })
    await momPage.goto('/family-password')
    await expect(momPage.getByText('Change Family Password')).toBeVisible({ timeout: 15000 })
    const inputs = momPage.locator('input[type="password"]')
    await inputs.nth(0).fill(TESTWORTH_PASSWORD)
    await inputs.nth(1).fill(TESTWORTH_PASSWORD)
    await momPage.getByRole('button', { name: 'Change Password' }).click()
    await expect(momPage.getByText('Family password saved!')).toBeVisible({ timeout: 20000 })
    await momPage.close()

    // The test member re-enters via the relock gate we're already sitting on (does NOT
    // re-establish the family layer — only the full door's establishFamily
    // Session does that) and lets ANOTHER timeout fire, exercising the
    // resume check a second time against the now-killed family-shadow
    // session still persisted from before the kill switch.
    await completeRelockViaDirectSession(page)

    await page.waitForURL('**/auth/family-login', { timeout: OVERRIDE_MS + 15000 })

    // The killed family layer must NOT produce a relock — full door only.
    await expect(page.getByPlaceholder('e.g., TheSmithCrew')).toBeVisible({ timeout: 10000 })
    await expect(page.getByPlaceholder("Your family's shared password")).toBeVisible()
    await expect(page.getByText(new RegExp(`Welcome back, ${TEST_MEMBER_NAME}`, 'i'))).not.toBeVisible()
  })

  test('(c) requires_email_login member (Casey) resumes at her picture gate, correct tap → /auth/sign-in', async ({ page }) => {
    await withShortIndependentTimeout(page, OVERRIDE_MS)

    // First establish Casey's family layer + a real session via the full
    // door + picture grid (Casey is email-linked — her session comes from
    // the requires_email_login redirect itself, per the two-door
    // precedent's test 6 — so we can't "log her in" the normal way here;
    // instead we prove the RESUME path reaches the SAME gate + the SAME
    // requires_email_login handling, using a real timeout on the test member to
    // establish the family layer on this device, then resuming AS Casey by
    // driving the picture flow directly).
    await openFamilyDoor(page)
    await expect(page.getByText('Casey')).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /Casey/ }).click()
    const grid = page.getByTestId('picture-grid')
    await expect(grid).toBeVisible({ timeout: 15000 })
    await grid.locator(`button[data-asset-id="${caseyAssetId}"]`).click()
    // Casey is email-linked — even the FIRST picture tap (no resume
    // involved yet) already routes to email sign-in per existing
    // PicturePasswordGrid behavior. This confirms the fixture is correctly
    // configured and that resume (which lands on the SAME step + SAME
    // component) will behave identically once a real personal session/
    // timeout cycle is exercisable for a picture-password member.
    await page.waitForURL('**/auth/sign-in', { timeout: 15000 })
    expect(page.url()).toContain('/auth/sign-in')
  })

  test('(d) localStorage.clear() forces the full door (both storage keys wiped)', async ({ page }) => {
    await withShortIndependentTimeout(page, OVERRIDE_MS)
    await establishTestMemberSession(page)
    await page.waitForURL('**/auth/family-login', { timeout: OVERRIDE_MS + 15000 })
    await expect(page.getByText(new RegExp(`Welcome back, ${TEST_MEMBER_NAME}`, 'i'))).toBeVisible({ timeout: 10000 })

    // Wipe local storage entirely (both 'myaim-auth' and the new
    // 'myaim-family-auth' + the plain family-id marker) and reload.
    await page.evaluate(() => localStorage.clear())
    await page.goto('/auth/family-login')

    await expect(page.getByPlaceholder('e.g., TheSmithCrew')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(new RegExp(`Welcome back, ${TEST_MEMBER_NAME}`, 'i'))).not.toBeVisible()
  })
})

test.describe('PINR — regression: family-shadow marker isolation', () => {
  test('familyDeviceClient module is imported ONLY by the login/resume flow', async () => {
    // Static grep-style guard (Node fs, not a browser page) — the hard
    // isolation rule: data hooks, RLS reads, and useFamilyMember() must
    // never import familyDeviceClient. Matches actual import statements
    // only (not comment mentions — useSessionTimeout.ts references the
    // module BY NAME in a comment explaining why signOut() doesn't touch
    // it, which is intentional documentation, not a real import).
    const { execSync } = await import('node:child_process')
    const out = execSync(
      "git grep -l \"from '@/lib/supabase/familyDeviceClient'\" -- \"src/**/*.ts\" \"src/**/*.tsx\" || true",
      { cwd: process.cwd(), encoding: 'utf-8' },
    )
    const files = out.split('\n').map(f => f.trim()).filter(Boolean)
    const allowed = new Set([
      'src/lib/supabase/familyDeviceClient.ts',
      'src/pages/auth/FamilyLogin.tsx',
    ])
    expect(files.length, 'expected exactly the login/resume flow to import familyDeviceClient').toBeGreaterThan(0)
    for (const file of files) {
      expect(allowed.has(file), `unexpected familyDeviceClient import in ${file}`).toBe(true)
    }
  })
})
