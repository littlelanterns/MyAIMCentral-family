/**
 * TEEN-CRED — Mom-Typed Login Credentials for Family Members (2026-08-23)
 *
 * A peer action to Set PIN / Set Picture Login: mom types real Door-3
 * credentials for a member directly (email+password, or username+password
 * for members with no email) instead of generating an invite link and
 * waiting. Produces the exact same end-state as accept_family_invite (a
 * real auth.users row, family_members.user_id linked, auth_method =
 * 'full_login'). No PRD exists — migration 00000000100314's header comment
 * is the spec of record.
 *
 * Verifies against the live dev server + production Supabase (Testworth
 * family fixture, same as family-auth-two-door.spec.ts / pin-relock-
 * stickiness.spec.ts):
 *  1. Username-mode create → REAL browser login through /auth/sign-in as
 *     that member → lands on their own dashboard (identity DB-asserted,
 *     not just "some dashboard loaded")
 *  2. Email-mode create → same, with a real email address
 *  3. reset_member_credentials rotates the password (old stops working,
 *     new works)
 *  4. Duplicate username rejected generically (both at create-time and via
 *     the availability check)
 *  5. check_username_available rejects non-mom callers (Casey's own
 *     session, and no auth at all) and rate-limits after 20 checks/60s
 *  6. Already-linked (auth_method='full_login') member is rejected by
 *     set_member_credentials with already_has_credentials — never silently
 *     overwritten
 *  7. Kill switch (family password change) does NOT bounce a full_login
 *     member's session — it rides Door 3, entirely separate from the
 *     family shadow account the kill switch rotates
 *
 * Run: npx playwright test tests/e2e/features/teen-cred-login.spec.ts
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
const CASEY = { email: 'caseytest@testworths.com', password: 'Demo2026!' }

const MARKER = 'TEENCRED'
const USERNAME_KID_NAME = `${MARKER} Username Kid`
const EMAIL_KID_NAME = `${MARKER} Email Kid`
const RESET_KID_NAME = `${MARKER} Reset Kid`
const DUP_KID_1_NAME = `${MARKER} Dup Kid One`
const DUP_KID_2_NAME = `${MARKER} Dup Kid Two`
const KILLSWITCH_KID_NAME = `${MARKER} Killswitch Kid`

const TEST_USERNAME = 'teencredkid2026'
const TEST_EMAIL = 'teencred-email-2026@example.com'
const RESET_OLD_PASSWORD = 'TeenCredOld8'
const RESET_NEW_PASSWORD = 'TeenCredNew9'
const DUP_USERNAME = 'teencreddup2026'
const KILLSWITCH_USERNAME = 'teencredkill2026'
const STRONG_PASSWORD = 'TeenCred8pw'

let sarahClient: ReturnType<typeof createClient>
let caseyClient: ReturnType<typeof createClient>

const createdMemberIds: string[] = []
const createdAuthUserIds: string[] = []

/** Deletes a TEEN-CRED test member and everything auto_provision_member_
 * resources (Convention #19/#77) created for it, plus its linked auth.users
 * row if any. Mirrors the deletePinrTestMember precedent exactly. */
async function deleteTeenCredMember(memberId: string, authUserId?: string | null) {
  await admin.from('dashboard_widgets').delete().eq('family_member_id', memberId)
  await admin.from('lists').delete().eq('owner_id', memberId)
  await admin.from('archive_folders').delete().eq('member_id', memberId)
  await admin.from('dashboard_configs').delete().eq('family_member_id', memberId)
  await admin.from('archive_member_settings').delete().eq('member_id', memberId)
  await admin.from('family_members').delete().eq('id', memberId)
  if (authUserId) {
    // Migration 100325 fixed the root cause (handle_new_user spawning a
    // phantom family for every set_member_credentials-created auth user,
    // which blocked this exact deleteUser call with "Database error
    // deleting user") — this should now succeed cleanly. deletePhantomFamilyIfAny
    // stays as defense-in-depth in case that fix ever regresses. Loud, not
    // silent: a swallowed failure here is exactly what let 6 orphaned
    // auth.users + phantom families survive undetected across a prior run.
    await deletePhantomFamilyIfAny(authUserId)
    const { error } = await admin.auth.admin.deleteUser(authUserId)
    if (error) console.error(`deleteUser(${authUserId}) failed:`, error.message)
  }
}

/** Finds and deletes an orphan auth.users row by exact email — covers a
 * crashed prior run that created the auth user but never got to link it
 * (set_member_credentials itself rolls back on a failed link, but a hard
 * process kill mid-test could still leave one). Also removes any phantom
 * family handle_new_user may have spawned for it (pre-migration-100325
 * residue, or any future regression of that fix) so deleteUser isn't
 * blocked by the families.primary_parent_id FK. */
async function deleteOrphanAuthUserByEmail(email: string) {
  let page = 1
  for (;;) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (!data) return
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (hit) {
      await deletePhantomFamilyIfAny(hit.id)
      const { error } = await admin.auth.admin.deleteUser(hit.id)
      if (error) console.error(`deleteOrphanAuthUserByEmail(${email}) deleteUser failed:`, error.message)
      return
    }
    if (data.users.length < 200) return
    page += 1
  }
}

/** Removes a phantom families/family_members/family_subscriptions/
 * onboarding_milestones set that handle_new_user would have spawned for
 * this auth user id BEFORE migration 100325 (or would spawn again if that
 * fix ever regresses) — clears the FK that otherwise blocks deleteUser. */
async function deletePhantomFamilyIfAny(authUserId: string) {
  const { data: fam } = await admin.from('families').select('id').eq('primary_parent_id', authUserId).maybeSingle()
  if (!fam) return
  await admin.from('family_subscriptions').delete().eq('family_id', fam.id)
  await admin.from('onboarding_milestones').delete().eq('family_id', fam.id)
  const { data: members } = await admin.from('family_members').select('id').eq('family_id', fam.id)
  for (const m of members ?? []) {
    await admin.from('dashboard_widgets').delete().eq('family_member_id', m.id)
    await admin.from('lists').delete().eq('owner_id', m.id)
    await admin.from('archive_folders').delete().eq('member_id', m.id)
    await admin.from('dashboard_configs').delete().eq('family_member_id', m.id)
    await admin.from('archive_member_settings').delete().eq('member_id', m.id)
  }
  await admin.from('family_members').delete().eq('family_id', fam.id)
  await admin.from('families').delete().eq('id', fam.id)
}

async function sweepByName(name: string) {
  const { data } = await admin
    .from('family_members')
    .select('id, user_id')
    .eq('family_id', TESTWORTH_FAMILY_ID)
    .eq('display_name', name)
  for (const row of data ?? []) {
    await deleteTeenCredMember(row.id as string, row.user_id as string | null)
  }
}

async function createTestMember(name: string): Promise<string> {
  const { data, error } = await admin
    .from('family_members')
    .insert({
      family_id: TESTWORTH_FAMILY_ID,
      display_name: name,
      role: 'member',
      dashboard_mode: 'independent',
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Failed to create ${name}: ${error?.message}`)
  const id = data.id as string
  createdMemberIds.push(id)
  return id
}

async function callFamilyAuthAdmin(
  client: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
) {
  return client.functions.invoke('family-auth-admin', { body })
}

test.beforeAll(async () => {
  // Pre-sweep: a prior crashed run can leave stale rows behind.
  for (const name of [
    USERNAME_KID_NAME,
    EMAIL_KID_NAME,
    RESET_KID_NAME,
    DUP_KID_1_NAME,
    DUP_KID_2_NAME,
    KILLSWITCH_KID_NAME,
  ]) {
    await sweepByName(name)
  }
  // Every fixed literal identifier this file uses — a crashed prior run
  // (or, before migration 100325, the phantom-family bug) can leave an
  // orphaned auth.users row behind that a fresh set_member_credentials
  // call would then reject as taken.
  for (const email of [
    TEST_EMAIL,
    'teencred-reset-2026@example.com',
    `${TEST_USERNAME}@login.myaimcentral.app`,
    `${DUP_USERNAME}@login.myaimcentral.app`,
    `${KILLSWITCH_USERNAME}@login.myaimcentral.app`,
    'teencredalready2026@login.myaimcentral.app',
  ]) {
    await deleteOrphanAuthUserByEmail(email)
  }

  sarahClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error: sarahErr } = await sarahClient.auth.signInWithPassword(SARAH)
  if (sarahErr) throw new Error(`Sarah sign-in failed: ${sarahErr.message}`)

  caseyClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error: caseyErr } = await caseyClient.auth.signInWithPassword(CASEY)
  if (caseyErr) throw new Error(`Casey sign-in failed: ${caseyErr.message}`)

  // Clean lockout state so the kill-switch test's family-door reopen is deterministic
  await admin
    .from('families')
    .update({ family_password_failed_attempts: 0, family_password_locked_until: null })
    .eq('id', TESTWORTH_FAMILY_ID)
})

test.afterAll(async () => {
  for (const id of createdMemberIds) {
    const { data } = await admin.from('family_members').select('user_id').eq('id', id).maybeSingle()
    await deleteTeenCredMember(id, (data?.user_id as string | null) ?? null)
  }
  for (const id of createdAuthUserIds) {
    await admin.auth.admin.deleteUser(id).catch(() => {})
  }
  // Residue check — both family_members AND the auth.users rows they
  // linked to. The latter is the one that actually went undetected before
  // migration 100325 (a "Database error deleting user" from a phantom
  // handle_new_user family silently swallowed by a bare .catch(() => {})).
  const { data: leftover } = await admin
    .from('family_members')
    .select('id')
    .eq('family_id', TESTWORTH_FAMILY_ID)
    .ilike('display_name', `${MARKER}%`)
  expect(leftover ?? [], 'expected zero TEENCRED fixture residue in family_members').toHaveLength(0)

  let page = 1
  const leftoverAuthUsers: string[] = []
  for (;;) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (!data) break
    leftoverAuthUsers.push(...data.users.filter((u) => (u.email ?? '').includes('teencred')).map((u) => u.email!))
    if (data.users.length < 200) break
    page += 1
  }
  expect(leftoverAuthUsers, 'expected zero TEENCRED fixture residue in auth.users').toHaveLength(0)
})

async function signInThroughDoor(page: Page, identifier: string, password: string) {
  await page.goto('/auth/sign-in')
  await page.locator('input[type="email"]').fill(identifier)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
}

test.describe('TEEN-CRED — mom-typed login credentials', () => {
  test('1. username mode: create → REAL browser login → own dashboard (identity DB-asserted)', async ({ page }) => {
    const memberId = await createTestMember(USERNAME_KID_NAME)

    const { data, error } = await callFamilyAuthAdmin(sarahClient, {
      action: 'set_member_credentials',
      member_id: memberId,
      mode: 'username',
      username: TEST_USERNAME,
      password: STRONG_PASSWORD,
    })
    expect(error).toBeFalsy()
    expect(data?.success).toBe(true)

    const { data: linked } = await admin.from('family_members').select('user_id, auth_method, login_username').eq('id', memberId).single()
    expect(linked?.auth_method).toBe('full_login')
    expect(linked?.login_username).toBe(TEST_USERNAME)
    const linkedUserId = linked?.user_id as string

    // Real browser login using the USERNAME (no '@') — the field is
    // labeled "Email or Username" and accepts both.
    await signInThroughDoor(page, TEST_USERNAME, STRONG_PASSWORD)
    await page.waitForURL('**/dashboard', { timeout: 20000 })
    expect(page.url()).toContain('/dashboard')

    // Identity assertion: the session that landed belongs to THIS member's
    // linked auth user, not merely "some" successful login.
    const sessionRaw = await page.evaluate(() => localStorage.getItem('myaim-auth'))
    expect(sessionRaw).toBeTruthy()
    const accessToken = JSON.parse(sessionRaw!).access_token as string
    const { data: verifiedUser } = await admin.auth.getUser(accessToken)
    expect(verifiedUser.user?.id).toBe(linkedUserId)
  })

  test('2. email mode: create → REAL browser login → own dashboard', async ({ page }) => {
    const memberId = await createTestMember(EMAIL_KID_NAME)

    const { data, error } = await callFamilyAuthAdmin(sarahClient, {
      action: 'set_member_credentials',
      member_id: memberId,
      mode: 'email',
      email: TEST_EMAIL,
      password: STRONG_PASSWORD,
    })
    expect(error).toBeFalsy()
    expect(data?.success).toBe(true)
    expect(data?.email).toBe(TEST_EMAIL)

    const { data: linked } = await admin.from('family_members').select('user_id, auth_method, login_username').eq('id', memberId).single()
    expect(linked?.auth_method).toBe('full_login')
    expect(linked?.login_username).toBeNull()
    const linkedUserId = linked?.user_id as string

    await signInThroughDoor(page, TEST_EMAIL, STRONG_PASSWORD)
    await page.waitForURL('**/dashboard', { timeout: 20000 })
    expect(page.url()).toContain('/dashboard')

    const sessionRaw = await page.evaluate(() => localStorage.getItem('myaim-auth'))
    const accessToken = JSON.parse(sessionRaw!).access_token as string
    const { data: verifiedUser } = await admin.auth.getUser(accessToken)
    expect(verifiedUser.user?.id).toBe(linkedUserId)
  })

  test('3. reset_member_credentials rotates the password (old stops working, new works)', async () => {
    const memberId = await createTestMember(RESET_KID_NAME)
    const resetEmail = 'teencred-reset-2026@example.com'

    const created = await callFamilyAuthAdmin(sarahClient, {
      action: 'set_member_credentials',
      member_id: memberId,
      mode: 'email',
      email: resetEmail,
      password: RESET_OLD_PASSWORD,
    })
    expect(created.data?.success).toBe(true)

    // Old password works before reset
    const preReset = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const preCheck = await preReset.auth.signInWithPassword({ email: resetEmail, password: RESET_OLD_PASSWORD })
    expect(preCheck.error).toBeFalsy()

    const reset = await callFamilyAuthAdmin(sarahClient, {
      action: 'reset_member_credentials',
      member_id: memberId,
      password: RESET_NEW_PASSWORD,
    })
    expect(reset.error).toBeFalsy()
    expect(reset.data?.success).toBe(true)

    // Old password now fails
    const postOld = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const oldCheck = await postOld.auth.signInWithPassword({ email: resetEmail, password: RESET_OLD_PASSWORD })
    expect(oldCheck.error).toBeTruthy()

    // New password works
    const postNew = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const newCheck = await postNew.auth.signInWithPassword({ email: resetEmail, password: RESET_NEW_PASSWORD })
    expect(newCheck.error).toBeFalsy()
  })

  test('4. duplicate username rejected generically (create-time + availability check)', async () => {
    const memberId1 = await createTestMember(DUP_KID_1_NAME)
    const memberId2 = await createTestMember(DUP_KID_2_NAME)

    const first = await callFamilyAuthAdmin(sarahClient, {
      action: 'set_member_credentials',
      member_id: memberId1,
      mode: 'username',
      username: DUP_USERNAME,
      password: STRONG_PASSWORD,
    })
    expect(first.data?.success).toBe(true)

    // Availability check reports it taken
    const avail = await callFamilyAuthAdmin(sarahClient, {
      action: 'check_username_available',
      username: DUP_USERNAME,
    })
    expect(avail.data?.success).toBe(true)
    expect(avail.data?.available).toBe(false)

    // A second member cannot claim the same username
    const second = await callFamilyAuthAdmin(sarahClient, {
      action: 'set_member_credentials',
      member_id: memberId2,
      mode: 'username',
      username: DUP_USERNAME,
      password: STRONG_PASSWORD,
    })
    expect(second.data?.success).toBe(false)
    expect(second.data?.reason).toBe('username_taken')

    // memberId2 was never linked
    const { data: unlinkedCheck } = await admin.from('family_members').select('user_id, auth_method').eq('id', memberId2).single()
    expect(unlinkedCheck?.user_id).toBeNull()
    expect(unlinkedCheck?.auth_method).not.toBe('full_login')
  })

  test('5. check_username_available rejects non-mom callers and rate-limits', async () => {
    // No auth at all
    const anon = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const noAuth = await callFamilyAuthAdmin(anon, { action: 'check_username_available', username: 'whatever123' })
    expect(noAuth.data?.success ?? false).toBe(false)

    // A real, authenticated, non-mom member (Casey — role='member'). The
    // action returns 403 for not_authorized, which supabase-js surfaces as
    // a FunctionsHttpError with `data: null` — the JSON body lives on
    // error.context (the raw Response), not on `.data`.
    const asCasey = await callFamilyAuthAdmin(caseyClient, { action: 'check_username_available', username: 'whatever123' })
    expect(asCasey.data?.success ?? false).toBe(false)
    expect(asCasey.error).toBeTruthy()
    const caseyBody = await (asCasey.error as { context: Response }).context.json()
    expect(caseyBody.reason).toBe('not_authorized')

    // Rate limit: 20 checks/60s per calling mom. Clean up the log rows this
    // burst creates so it doesn't bleed into other tests' 60s windows.
    const burstStart = new Date().toISOString()
    let lastResult: { success?: boolean; reason?: string; available?: boolean } | null = null
    for (let i = 0; i < 21; i++) {
      const res = await callFamilyAuthAdmin(sarahClient, {
        action: 'check_username_available',
        username: `ratelimitcheck${i}`,
      })
      lastResult = res.data
    }
    expect(lastResult?.success).toBe(false)
    expect(lastResult?.reason).toBe('rate_limited')

    const { data: sarahUser } = await sarahClient.auth.getUser()
    await admin.from('username_check_log').delete().eq('checked_by', sarahUser.user!.id).gte('created_at', burstStart)
  })

  test('6. already-linked member rejected by set_member_credentials (never silently overwritten)', async () => {
    // Self-contained (no cross-test dependency): create a fresh member,
    // give it real credentials, then try to set credentials on it AGAIN.
    const memberId = await createTestMember(`${MARKER} Already-Linked Kid`)
    const first = await callFamilyAuthAdmin(sarahClient, {
      action: 'set_member_credentials',
      member_id: memberId,
      mode: 'username',
      username: 'teencredalready2026',
      password: STRONG_PASSWORD,
    })
    expect(first.data?.success).toBe(true)

    const { data: existing } = await admin.from('family_members').select('id, user_id').eq('id', memberId).single()
    expect(existing).toBeTruthy()
    const originalUserId = existing!.user_id

    const attempt = await callFamilyAuthAdmin(sarahClient, {
      action: 'set_member_credentials',
      member_id: memberId,
      mode: 'email',
      email: 'should-not-be-linked@example.com',
      password: STRONG_PASSWORD,
    })
    expect(attempt.data?.success).toBe(false)
    expect(attempt.data?.reason).toBe('already_has_credentials')

    // Original credentials untouched
    const { data: unchanged } = await admin.from('family_members').select('user_id').eq('id', memberId).single()
    expect(unchanged?.user_id).toBe(originalUserId)
  })

  test('7. kill switch (family password change) does NOT bounce a full_login member session', async ({ page, context }) => {
    const memberId = await createTestMember(KILLSWITCH_KID_NAME)
    const created = await callFamilyAuthAdmin(sarahClient, {
      action: 'set_member_credentials',
      member_id: memberId,
      mode: 'username',
      username: KILLSWITCH_USERNAME,
      password: STRONG_PASSWORD,
    })
    expect(created.data?.success).toBe(true)

    // Establish the member's real personal-device session
    await signInThroughDoor(page, KILLSWITCH_USERNAME, STRONG_PASSWORD)
    await page.waitForURL('**/dashboard', { timeout: 20000 })

    // Kill switch from a SEPARATE mom session/device — a genuinely isolated
    // browser context (its own storage), NOT context.newPage(), which would
    // share this test's localStorage/cookies with the member's page above.
    // SignIn.tsx redirects an already-authenticated session straight to
    // /dashboard, so a same-context "mom page" would never even render the
    // sign-in form while the member's session is still active — this bit
    // during authoring (input[type="email"] timed out because momPage was
    // silently redirected). Re-saving the family password (same value)
    // rotates the FAMILY shadow account and fires a global sign-out for
    // THAT account only. The member's session rides an entirely different
    // auth.users row (Door 3) and must be unaffected.
    const momContext = await context.browser()!.newContext()
    const momPage = await momContext.newPage()
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
    await momContext.close()

    // The member's own session survives — reload and stay on /dashboard,
    // never bounced to /auth/family-login or /auth/sign-in.
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/dashboard')
    expect(page.url()).not.toContain('/auth/')
  })
})
