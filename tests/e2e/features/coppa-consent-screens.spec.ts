/**
 * PRD-40 COPPA — Slice 3 (Consent UX Screens 1–7 + roster retrofit) pins.
 *
 * Covers: the FamilySetup save gate (held-pending → consent flow), the
 * Screen 7 acknowledgment path end-to-end in the browser, the R-8
 * dormant-block card for non-founding families, the commit_consented_members
 * RPC (R-10 rejections, validation, atomicity, the real commit + PIN
 * pipeline resume), and zero-COPPA-surface probes for non-mom roles.
 *
 * BETA-COHORT (migration 100338, PRD-40 §9 + PRD-31 2026-09-12 addendum):
 * Screen 5's no-charge interim path for founding families while beta cohort
 * mode is on; the "finish verifying" flow on Settings -> Privacy & Consent
 * once the switch flips off (a NEW real verification alongside the
 * immutable interim one — the split-partial-index design); founding-at-
 * signup + its is_test_family opt-out via a real handle_new_user() signup.
 *
 * Requires:
 *   - Migration 00000000100315 applied (commit_consented_members RPC).
 *   - Slice 1 (100305) + Slice 2 (deployed functions) in place.
 *   - The Testworth fixture family (is_founding_family=true — asserted in
 *     beforeAll; the founding exemption is what lets this spec drive the
 *     real flow against the not-yet-lawyer-approved 1.0.0 template, per
 *     ruling R-8).
 *
 * The full Screen-5 payment-element path additionally requires
 * VITE_STRIPE_PUBLISHABLE_KEY (absent at authoring time) — that one test
 * self-skips without it. The commit RPC itself is proven independently of
 * the browser payment step (a service-role-seeded verification row stands
 * in for the webhook write, which Slice 2's own spec already proves).
 *
 * Fixture isolation: every row this spec creates carries the COPPATEST
 * prefix (members) or is tracked by id (verifications, consents, the
 * non-founding fixture family + auth user) and swept in afterAll.
 * Sarah's pre-existing active parent_verifications row, if any, is
 * temporarily revoked and restored around the scenarios that need her
 * unverified (the Slice-2 spec's pattern).
 */
import { test, expect, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import { loginAsMom } from '../helpers/auth'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!

const sr = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const REQUIRED_SECTIONS = ['what_we_collect', 'how_lila_uses', 'who_sees_it', 'your_rights', 'parent_affirmation']

async function signInClient(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: true } })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`signIn ${email}: ${error?.message}`)
  return client
}

/** Browser login for a non-Testworth fixture user (mirrors helpers/auth.ts injectSession). */
async function loginCustomUser(page: Page, email: string, password: string) {
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`login ${email}: ${error?.message}`)
  const session = data.session
  await page.goto('/')
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    ['myaim-auth', JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in || 3600,
      token_type: 'bearer',
      type: 'access',
      user: session.user,
    })],
  )
  await page.reload()
  await page.waitForLoadState('networkidle')
}

// ── Fixture state ──────────────────────────────────────────────────────────
let familyId = ''
let sarahMemberId = ''
let sarahOriginalVerificationId: string | null = null
const createdVerificationIds: string[] = []
const createdMemberIds: string[] = []
const createdConsentIds: string[] = []

// Non-founding fixture family
const NF_EMAIL = `coppatest-nonfounding-${Date.now()}@example.com`
const NF_PASSWORD = 'CoppaTest2026!'
let nfAuthUserId: string | null = null
let nfFamilyId: string | null = null

async function resolveTestworth() {
  const { data: fam, error } = await sr
    .from('families')
    .select('id, is_founding_family')
    .eq('family_name', 'The Testworth Family')
    .single()
  if (error || !fam) throw new Error(`Testworth family not found: ${error?.message}`)
  familyId = fam.id
  expect(fam.is_founding_family, 'Testworth family must be founding — the R-8 exemption this spec drives through').toBe(true)

  const { data: sarah } = await sr
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('role', 'primary_parent')
    .single()
  if (!sarah) throw new Error('Sarah (primary_parent) not found')
  sarahMemberId = sarah.id
}

async function revokeSarahVerification() {
  const { data } = await sr
    .from('parent_verifications')
    .select('id')
    .eq('parent_member_id', sarahMemberId)
    .is('revoked_at', null)
    .maybeSingle()
  if (data) {
    sarahOriginalVerificationId = data.id
    await sr.from('parent_verifications').update({ revoked_at: new Date().toISOString() }).eq('id', data.id)
  }
}

async function restoreSarahVerification() {
  if (sarahOriginalVerificationId) {
    await sr.from('parent_verifications').update({ revoked_at: null }).eq('id', sarahOriginalVerificationId)
    sarahOriginalVerificationId = null
  }
}

/**
 * BETA-COHORT (migration 100338): the single platform-wide switch. Tests
 * that must exercise the REAL Stripe path for a founding family (Testworth
 * is always founding — asserted in resolveTestworth) need this OFF first;
 * tests proving the interim path need it at its default (ON). No client
 * write policy exists on beta_cohort_settings — service-role only, matching
 * every other "seat flips it" table in this codebase.
 */
async function setBetaCohortMode(enabled: boolean) {
  const { data, error } = await sr.from('beta_cohort_settings').select('id').limit(1).single()
  if (error || !data) throw new Error(`beta_cohort_settings row not found — is migration 100338 applied? ${error?.message}`)
  const { error: updateError } = await sr.from('beta_cohort_settings').update({ enabled }).eq('id', data.id)
  if (updateError) throw new Error(`setBetaCohortMode(${enabled}) failed: ${updateError.message}`)
}

async function seedSarahVerification(): Promise<string> {
  // Get-or-create: uq_pv_active_per_parent allows only one active
  // verification per parent, and earlier tests in this serial spec may have
  // already seeded it (any active row at this point is ours — test 1 proved
  // Sarah had none pre-spec, since our first seed insert succeeded).
  const { data: existing } = await sr
    .from('parent_verifications')
    .select('id')
    .eq('parent_member_id', sarahMemberId)
    .is('revoked_at', null)
    .maybeSingle()
  if (existing) return existing.id

  const { data, error } = await sr
    .from('parent_verifications')
    .insert({
      family_id: familyId,
      parent_member_id: sarahMemberId,
      verification_method: 'stripe_charge',
      stripe_payment_intent_id: `pi_COPPATEST_${Date.now()}`,
      amount_charged_cents: 100,
      currency: 'USD',
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`seed verification failed: ${error?.message}`)
  createdVerificationIds.push(data.id)
  return data.id
}

/**
 * Delete member rows + their dependents. The auto_provision_member_resources
 * trigger creates system lists OWNED by each new member, and lists.owner_id
 * is a NO-CASCADE FK — the lists must go before the member rows or the
 * delete fails. Every delete error is surfaced loudly (a silent sweep
 * failure caused stray accumulation on 2026-08-23).
 */
async function deleteMemberRows(ids: string[]) {
  if (!ids.length) return
  const dc = await sr.from('coppa_consents').delete().in('child_member_id', ids)
  if (dc.error) console.warn('sweep: coppa_consents delete failed:', dc.error.message)
  const dl = await sr.from('lists').delete().in('owner_id', ids)
  if (dl.error) console.warn('sweep: lists delete failed:', dl.error.message)
  const dm = await sr.from('family_members').delete().in('id', ids)
  if (dm.error) console.warn('sweep: family_members delete failed:', dm.error.message)
}

async function sweep() {
  // Consents first (FK → verifications), then members, then verifications.
  if (createdConsentIds.length) await sr.from('coppa_consents').delete().in('id', createdConsentIds)
  await deleteMemberRows(createdMemberIds)
  // Any COPPATEST-named members that slipped tracking:
  const { data: strays } = await sr.from('family_members').select('id').like('display_name', 'COPPATEST%')
  if (strays?.length) await deleteMemberRows(strays.map((s) => s.id))
  // Loud residue check — a sweep that leaves rows behind must never be silent.
  const { data: residue } = await sr.from('family_members').select('id').like('display_name', 'COPPATEST%')
  if (residue?.length) console.warn(`sweep: ${residue.length} COPPATEST member row(s) COULD NOT be removed — investigate FK blockers`)
  if (createdVerificationIds.length) {
    await sr.from('coppa_consents').delete().in('verification_id', createdVerificationIds)
    await sr.from('parent_verifications').delete().in('id', createdVerificationIds)
  }
  // Non-founding fixture family teardown — the proven FK-order procedure
  // (TEEN-CRED referee catch, 2026-08-24): auto_provision_member_resources
  // creates member-owned rows (lists.owner_id is a NO-CASCADE FK), so the
  // resources must go BEFORE the member rows, the members before the family,
  // and the family before the auth user — otherwise the member delete fails
  // silently, the families delete is FK-blocked, and deleteUser silently
  // SOFT-deletes (scrubbed email, row kept) instead of hard-deleting, which
  // accumulated 21 phantom "Mom's Family" rows in production before it was
  // caught. Every step is loud; the auth delete is verified really gone.
  if (nfFamilyId) {
    const { data: nfMembers } = await sr.from('family_members').select('id').eq('family_id', nfFamilyId)
    const nfIds = (nfMembers ?? []).map((m) => m.id)
    if (nfIds.length) {
      for (const [table, col] of [
        ['lists', 'owner_id'],
        ['archive_folders', 'member_id'],
        ['dashboard_configs', 'family_member_id'],
        ['archive_member_settings', 'member_id'],
        ['dashboard_widgets', 'family_member_id'],
      ] as const) {
        const d = await sr.from(table).delete().in(col, nfIds)
        if (d.error) console.warn(`sweep: NF ${table} delete failed:`, d.error.message)
      }
      const dm = await sr.from('family_members').delete().in('id', nfIds)
      if (dm.error) console.warn('sweep: NF family_members delete failed:', dm.error.message)
    }
    const df = await sr.from('families').delete().eq('id', nfFamilyId)
    if (df.error) console.warn('sweep: NF families delete failed:', df.error.message)
    nfFamilyId = null
  }
  if (nfAuthUserId) {
    const del = await sr.auth.admin.deleteUser(nfAuthUserId)
    if (del.error) console.warn('sweep: NF auth deleteUser failed:', del.error.message)
    // deleteUser falls back to a SOFT delete when a referencing FK survives —
    // verify the user is really gone (a soft-deleted row still resolves).
    const { data: still } = await sr.auth.admin.getUserById(nfAuthUserId)
    if (still?.user) console.warn(`sweep: NF auth user ${nfAuthUserId} still exists (soft-deleted?) — investigate FK blockers`)
    nfAuthUserId = null
  }
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await resolveTestworth()
  await sweep() // clear residue from any prior aborted run
})

test.afterAll(async () => {
  await restoreSarahVerification()
  await sweep()
})

// ── 1. Held-pending: the save gate interrupts, nothing commits ────────────

test('unverified mom adding an under-13 child: save is interrupted by the consent flow; cancel preserves the preview and commits nothing', async ({ page }) => {
  await revokeSarahVerification()
  try {
    await loginAsMom(page)
    await page.goto('/family-setup')
    await page.getByRole('button', { name: 'Add One at a Time' }).click()

    await page.getByPlaceholder('Name').last().fill('COPPATEST HeldKid')
    await page.getByPlaceholder('Or enter age').last().fill('9')

    // Bracket auto-derived to under_13 → the COPPA indicator renders
    await expect(page.getByTestId('coppa-under13-indicator')).toBeVisible()

    await page.getByRole('button', { name: /Confirm & Add/ }).click()

    // Screen 1 of the consent flow appears; the member row is NOT committed.
    await expect(page.getByTestId('coppa-consent-flow')).toBeVisible()
    await expect(page.getByText('Section 1 of 5', { exact: false })).toBeVisible()

    const { data: heldRows } = await sr
      .from('family_members')
      .select('id')
      .eq('display_name', 'COPPATEST HeldKid')
    expect(heldRows ?? []).toHaveLength(0)

    // Scroll enforcement: the ack checkbox is disabled until scrolled to end.
    const ack = page.getByTestId('coppa-section-ack')
    await expect(ack).toBeDisabled()
    await page.getByTestId('coppa-section-scroll').evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await expect(ack).toBeEnabled()

    // Continue stays disabled until the checkbox is checked.
    const cont = page.getByTestId('coppa-section-continue')
    await expect(cont).toBeDisabled()
    await ack.check()
    await expect(cont).toBeEnabled()
    await cont.click()
    await expect(page.getByText('Section 2 of 5', { exact: false })).toBeVisible()

    // Walk sections 2–4 the same way, reaching Screen 5.
    for (let i = 0; i < 3; i++) {
      await page.getByTestId('coppa-section-scroll').evaluate((el) => {
        el.scrollTop = el.scrollHeight
      })
      await page.getByTestId('coppa-section-ack').check()
      await page.getByTestId('coppa-section-continue').click()
    }
    await expect(page.getByText('Section 5 of 5', { exact: false })).toBeVisible()
    await expect(page.getByTestId('coppa-affirmation-ack')).toBeVisible()

    // Cancel mid-flow (modal close): preview intact, nothing committed, no charge.
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('coppa-consent-flow')).not.toBeVisible()
    await expect(page.getByPlaceholder('Name').last()).toHaveValue('COPPATEST HeldKid')

    const { data: afterCancel } = await sr
      .from('family_members')
      .select('id')
      .eq('display_name', 'COPPATEST HeldKid')
    expect(afterCancel ?? []).toHaveLength(0)
  } finally {
    await restoreSarahVerification()
  }
})

// ── 2. Screen 7 acknowledgment path, end-to-end in the browser ────────────

test('verified mom adding an under-13 child: Screen 7 acknowledgment → commit RPC → consent row + member + PIN pipeline', async ({ page }) => {
  const verificationId = await seedSarahVerification()

  await loginAsMom(page)
  await page.goto('/family-setup')
  await page.getByRole('button', { name: 'Add One at a Time' }).click()
  await page.getByPlaceholder('Name').last().fill('COPPATEST AckKid')
  await page.getByPlaceholder('Or enter age').last().fill('8')
  await expect(page.getByTestId('coppa-under13-indicator')).toBeVisible()
  await page.getByRole('button', { name: /Confirm & Add/ }).click()

  // Screen 7 — the lightweight acknowledgment, NOT the full flow.
  await expect(page.getByTestId('coppa-acknowledge-modal')).toBeVisible()
  await expect(page.getByText('You verified your parental consent on', { exact: false })).toBeVisible()

  // Expandable review section renders the template text.
  await page.getByRole('button', { name: /Review what’s collected/ }).click()
  await expect(page.getByText('COPPA', { exact: false }).first()).toBeVisible()

  const ackBtn = page.getByTestId('coppa-acknowledge-continue')
  await expect(ackBtn).toBeDisabled()
  await page.getByTestId('coppa-acknowledge-check').check()
  await ackBtn.click()

  // Commit lands on the done screen.
  await expect(page.getByText('Your family is set up!', { exact: false })).toBeVisible({ timeout: 20000 })

  // DB truth: member committed with the bracket; consent row linked to the
  // seeded verification with all five sections; PIN pipeline resumed.
  const { data: kid } = await sr
    .from('family_members')
    .select('id, coppa_age_bracket, pin_hash')
    .eq('display_name', 'COPPATEST AckKid')
    .single()
  expect(kid).toBeTruthy()
  createdMemberIds.push(kid!.id)
  expect(kid!.coppa_age_bracket).toBe('under_13')

  const { data: consent } = await sr
    .from('coppa_consents')
    .select('id, verification_id, consent_version, acknowledged_sections, parent_member_id')
    .eq('child_member_id', kid!.id)
    .single()
  expect(consent).toBeTruthy()
  createdConsentIds.push(consent!.id)
  expect(consent!.verification_id).toBe(verificationId)
  expect(consent!.parent_member_id).toBe(sarahMemberId)
  for (const s of REQUIRED_SECTIONS) expect(consent!.acknowledged_sections).toContain(s)

  // PIN pipeline: hash_member_pin runs right after commit — poll briefly.
  await expect
    .poll(
      async () => {
        const { data } = await sr.from('family_members').select('pin_hash').eq('id', kid!.id).single()
        return data?.pin_hash != null
      },
      { timeout: 15000 },
    )
    .toBe(true)
})

// ── 3. R-8 dormant-block card for a NON-founding family ───────────────────

test('non-founding family adding an under-13 child sees the warm block card; the under-13 member is never committed', async ({ page }) => {
  // Precondition: the active template is still unapproved (dormancy). If a
  // lawyer-approved template exists, this state is legitimately unreachable.
  const { data: tmpl } = await sr
    .from('coppa_consent_templates')
    .select('lawyer_approved_at')
    .is('retired_at', null)
    .order('published_at', { ascending: false })
    .limit(1)
    .single()
  test.skip(!!tmpl?.lawyer_approved_at, 'Template is lawyer-approved — dormancy no longer applies')

  // Fixture: fresh auth user → handle_new_user auto-provisions their family.
  // BETA-COHORT (migration 100338): is_test_family=true keeps handle_new_user's
  // founding-at-signup logic from ever touching this fixture's
  // family_subscriptions row — the force-non-founding UPDATE below only
  // corrects `families`, and without this flag the fixture would be left with
  // family_subscriptions.price_adjustment_kind='founding' while
  // families.is_founding_family=false, a genuinely inconsistent state.
  const { data: created, error: createError } = await sr.auth.admin.createUser({
    email: NF_EMAIL,
    password: NF_PASSWORD,
    email_confirm: true,
    user_metadata: { is_test_family: true },
  })
  if (createError || !created.user) throw new Error(`createUser failed: ${createError?.message}`)
  nfAuthUserId = created.user.id

  // Find the auto-provisioned primary_parent row + family; force non-founding.
  await expect
    .poll(
      async () => {
        const { data } = await sr.from('family_members').select('family_id').eq('user_id', nfAuthUserId!).maybeSingle()
        if (data?.family_id) nfFamilyId = data.family_id
        return !!nfFamilyId
      },
      { timeout: 15000 },
    )
    .toBe(true)
  // Force non-founding + pre-set a family password hash so MomShell's
  // forced Two-Door password-setup modal (which reopens on dismiss) never
  // blocks the setup page for this throwaway fixture family.
  await sr
    .from('families')
    .update({
      is_founding_family: false,
      family_password_hash: '$2a$10$COPPATESTfixturehashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    })
    .eq('id', nfFamilyId!)

  await loginCustomUser(page, NF_EMAIL, NF_PASSWORD)
  await page.goto('/family-setup')
  // Fresh families get the Two-Door forced "Set Your Family Password" modal
  // (MomShell) — dismiss it so the setup page is interactable.
  try {
    await page.getByText('Set Your Family Password').waitFor({ state: 'visible', timeout: 5000 })
    await page.getByLabel('Close').first().click()
  } catch {
    /* modal not shown — fine */
  }
  await page.getByRole('button', { name: 'Add One at a Time' }).click()
  await page.getByPlaceholder('Name').last().fill('COPPATEST BlockedKid')
  await page.getByPlaceholder('Or enter age').last().fill('7')
  await page.getByRole('button', { name: /Confirm & Add/ }).click()

  // The warm card — not the consent flow, not a commit.
  await expect(page.getByTestId('coppa-dormant-card')).toBeVisible()
  await expect(page.getByText('finishing the legal review', { exact: false })).toBeVisible()
  await expect(page.getByTestId('coppa-consent-flow')).not.toBeVisible()

  const { data: blocked } = await sr
    .from('family_members')
    .select('id')
    .eq('display_name', 'COPPATEST BlockedKid')
  expect(blocked ?? []).toHaveLength(0)
})

// ── 4. commit_consented_members RPC probes (R-10 + validation + commit) ───

test('RPC: dad, kid, and family-shadow sessions are all rejected (R-10)', async () => {
  const payload = {
    verification_id: '00000000-0000-0000-0000-000000000000',
    consent_version: '1.0.0',
    acknowledged_sections: REQUIRED_SECTIONS,
    members: [
      {
        display_name: 'COPPATEST Nope',
        role: 'member',
        dashboard_mode: 'guided',
        relationship: 'child',
        date_of_birth: null,
        age: 8,
        member_color: '#68a395',
        custom_role: null,
        coppa_age_bracket: 'under_13',
      },
    ],
  }

  const dad = await signInClient(TEST_USERS.mark.email, TEST_USERS.mark.password)
  const dadRes = await dad.rpc('commit_consented_members', { p_payload: payload })
  expect(dadRes.error?.message).toContain('Not authorized')

  const kid = await signInClient(TEST_USERS.casey.email, TEST_USERS.casey.password)
  const kidRes = await kid.rpc('commit_consented_members', { p_payload: payload })
  expect(kidRes.error?.message).toContain('Not authorized')

  const FAMILY_PASSWORD = process.env.E2E_TESTWORTH_FAMILY_PASSWORD || 'Lanterns2026'
  const shadow = await signInClient(`${familyId}@family.myaimcentral.app`, FAMILY_PASSWORD)
  const shadowRes = await shadow.rpc('commit_consented_members', { p_payload: payload })
  expect(shadowRes.error?.message).toContain('Not authorized')

  // Nothing was written by any of the rejected calls.
  const { data: rows } = await sr.from('family_members').select('id').eq('display_name', 'COPPATEST Nope')
  expect(rows ?? []).toHaveLength(0)
})

test('RPC: validation — inactive verification, missing section, no under-13, and mid-batch atomicity', async ({}, testInfo) => {
  testInfo.setTimeout(60000)
  const verificationId = await seedSarahVerification()
  const mom = await signInClient(TEST_USERS.sarah.email, TEST_USERS.sarah.password)

  const baseKid = {
    display_name: 'COPPATEST RpcKid',
    role: 'member',
    dashboard_mode: 'guided',
    relationship: 'child',
    date_of_birth: null,
    age: 9,
    member_color: '#68a395',
    custom_role: null,
    coppa_age_bracket: 'under_13',
  }

  // Unknown/inactive verification id
  const badVerif = await mom.rpc('commit_consented_members', {
    p_payload: { verification_id: '00000000-0000-0000-0000-000000000000', consent_version: '1.0.0', acknowledged_sections: REQUIRED_SECTIONS, members: [baseKid] },
  })
  expect(badVerif.error?.message).toContain('verification_not_active')

  // Missing acknowledged section
  const missingSection = await mom.rpc('commit_consented_members', {
    p_payload: { verification_id: verificationId, consent_version: '1.0.0', acknowledged_sections: REQUIRED_SECTIONS.slice(0, 4), members: [baseKid] },
  })
  expect(missingSection.error?.message).toContain('parent_affirmation')

  // No under-13 in the batch → this RPC refuses (direct-insert path owns it)
  const noUnder13 = await mom.rpc('commit_consented_members', {
    p_payload: { verification_id: verificationId, consent_version: '1.0.0', acknowledged_sections: REQUIRED_SECTIONS, members: [{ ...baseKid, display_name: 'COPPATEST Teen', age: 15, coppa_age_bracket: '13_to_17', dashboard_mode: 'independent' }] },
  })
  expect(noUnder13.error?.message).toContain('no_consent_needed')

  // Atomicity: valid member first + invalid member second → NOTHING commits
  const atomic = await mom.rpc('commit_consented_members', {
    p_payload: {
      verification_id: verificationId,
      consent_version: '1.0.0',
      acknowledged_sections: REQUIRED_SECTIONS,
      members: [baseKid, { ...baseKid, display_name: 'COPPATEST BadRole', role: 'primary_parent' }],
    },
  })
  expect(atomic.error?.message).toContain('invalid_member')
  const { data: partial } = await sr.from('family_members').select('id').eq('display_name', 'COPPATEST RpcKid')
  expect(partial ?? []).toHaveLength(0)

  // The real commit: mixed batch (under-13 + teen sibling) commits atomically
  // with a consent row for the under-13 child only.
  const ok = await mom.rpc('commit_consented_members', {
    p_payload: {
      verification_id: verificationId,
      consent_version: '1.0.0',
      acknowledged_sections: REQUIRED_SECTIONS,
      members: [baseKid, { ...baseKid, display_name: 'COPPATEST RpcTeen', age: 15, coppa_age_bracket: '13_to_17', dashboard_mode: 'independent' }],
    },
  })
  expect(ok.error).toBeNull()
  expect(ok.data?.success).toBe(true)
  expect(ok.data?.member_ids).toHaveLength(2)
  expect(ok.data?.consent_ids).toHaveLength(1)
  createdMemberIds.push(...(ok.data.member_ids as string[]))
  createdConsentIds.push(...(ok.data.consent_ids as string[]))

  const { data: kidRow } = await sr.from('family_members').select('id, coppa_age_bracket, family_id').eq('display_name', 'COPPATEST RpcKid').single()
  expect(kidRow?.coppa_age_bracket).toBe('under_13')
  expect(kidRow?.family_id).toBe(familyId)
  const { data: teenRow } = await sr.from('family_members').select('coppa_age_bracket').eq('display_name', 'COPPATEST RpcTeen').single()
  expect(teenRow?.coppa_age_bracket).toBe('13_to_17')

  const { data: consent } = await sr.from('coppa_consents').select('id, verification_id').eq('child_member_id', kidRow!.id).single()
  expect(consent?.verification_id).toBe(verificationId)

  // Provisioning trigger fired for RPC-inserted members exactly as for
  // direct inserts (archive folders auto-created).
  const { data: folders } = await sr.from('archive_folders').select('id').eq('member_id', kidRow!.id)
  expect((folders ?? []).length).toBeGreaterThan(0)
})

test('RPC: existing-member path (member-edit → under_13) writes bracket + consent idempotently', async () => {
  const verificationId = await seedSarahVerification()
  const mom = await signInClient(TEST_USERS.sarah.email, TEST_USERS.sarah.password)

  // Seed a 13_to_17 member directly (service role) to "edit" down to under_13.
  const { data: existing } = await sr
    .from('family_members')
    .insert({
      family_id: familyId,
      display_name: 'COPPATEST EditKid',
      role: 'member',
      dashboard_mode: 'guided',
      relationship: 'child',
      age: 12,
      in_household: true,
      dashboard_enabled: true,
      auth_method: 'pin',
      is_active: true,
      coppa_age_bracket: '13_to_17',
    })
    .select('id')
    .single()
  createdMemberIds.push(existing!.id)

  const payload = {
    verification_id: verificationId,
    consent_version: '1.0.0',
    acknowledged_sections: REQUIRED_SECTIONS,
    members: [],
    existing_member_ids: [existing!.id],
  }
  const res = await mom.rpc('commit_consented_members', { p_payload: payload })
  expect(res.error).toBeNull()
  expect(res.data?.consent_ids).toHaveLength(1)
  createdConsentIds.push(...(res.data.consent_ids as string[]))

  const { data: after } = await sr.from('family_members').select('coppa_age_bracket').eq('id', existing!.id).single()
  expect(after?.coppa_age_bracket).toBe('under_13')

  // Idempotent re-run: the existing active consent wins, no duplicate.
  const rerun = await mom.rpc('commit_consented_members', { p_payload: payload })
  expect(rerun.error).toBeNull()
  const { data: consents } = await sr
    .from('coppa_consents')
    .select('id')
    .eq('child_member_id', existing!.id)
    .is('revoked_at', null)
  expect(consents ?? []).toHaveLength(1)
})

// ── 4b. Batch consent UI: several existing under-13 children at once ──────

test('Family Members page: "Set Up Under-13 Consent" batches acknowledgment for several existing children in one pass', async ({ page }) => {
  const verificationId = await seedSarahVerification()

  const { data: batchKids, error: batchInsertError } = await sr
    .from('family_members')
    .insert([
      {
        family_id: familyId,
        display_name: 'COPPATEST Batch1',
        role: 'member',
        dashboard_mode: 'guided',
        relationship: 'child',
        age: 7,
        in_household: true,
        dashboard_enabled: true,
        auth_method: 'pin',
        is_active: true,
        coppa_age_bracket: 'under_13',
      },
      {
        family_id: familyId,
        display_name: 'COPPATEST Batch2',
        role: 'member',
        dashboard_mode: 'guided',
        relationship: 'child',
        age: 9,
        in_household: true,
        dashboard_enabled: true,
        auth_method: 'pin',
        is_active: true,
        coppa_age_bracket: 'under_13',
      },
    ])
    .select('id, display_name')
  expect(batchInsertError).toBeNull()
  expect(batchKids).toHaveLength(2)
  createdMemberIds.push(...batchKids!.map((k) => k.id))
  const [kid1, kid2] = batchKids!

  await loginAsMom(page)
  await page.goto('/family-members')

  await page.getByRole('button', { name: 'Set Up Under-13 Consent' }).click()
  await expect(page.getByTestId('coppa-batch-consent-select')).toBeVisible()

  // Both eligible children render as pills, pre-checked.
  const pill1 = page.getByTestId(`member-pill-${kid1.id}`)
  const pill2 = page.getByTestId(`member-pill-${kid2.id}`)
  await expect(pill1).toBeVisible()
  await expect(pill2).toBeVisible()
  await expect(pill1).toHaveAttribute('data-selected', 'true')
  await expect(pill2).toHaveAttribute('data-selected', 'true')

  await page.getByTestId('coppa-batch-consent-continue').click()

  // Verification already on file → the sequential acknowledgment path, not
  // the full disclosure+charge flow.
  await expect(page.getByTestId('coppa-acknowledge-modal')).toBeVisible()
  await expect(page.getByText('Child 1 of 2', { exact: false })).toBeVisible()
  await page.getByTestId('coppa-acknowledge-check').check()
  await page.getByTestId('coppa-acknowledge-continue').click()

  await expect(page.getByText('Child 2 of 2', { exact: false })).toBeVisible()
  await page.getByTestId('coppa-acknowledge-check').check()
  await page.getByTestId('coppa-acknowledge-continue').click()

  // Both modals close once the batch commits.
  await expect(page.getByTestId('coppa-acknowledge-modal')).not.toBeVisible({ timeout: 20000 })
  await expect(page.getByTestId('coppa-batch-consent-select')).not.toBeVisible()

  // DB truth: one consent row per child, both linked to the SAME
  // verification, all five sections acknowledged, bracket unchanged.
  const { data: consents } = await sr
    .from('coppa_consents')
    .select('id, child_member_id, verification_id, acknowledged_sections')
    .in('child_member_id', [kid1.id, kid2.id])
  expect(consents ?? []).toHaveLength(2)
  createdConsentIds.push(...(consents ?? []).map((c) => c.id))
  for (const c of consents ?? []) {
    expect(c.verification_id).toBe(verificationId)
    for (const s of REQUIRED_SECTIONS) expect(c.acknowledged_sections).toContain(s)
  }

  const { data: after } = await sr
    .from('family_members')
    .select('id, coppa_age_bracket')
    .in('id', [kid1.id, kid2.id])
  for (const m of after ?? []) expect(m.coppa_age_bracket).toBe('under_13')
})

// ── 5. Zero COPPA surface for non-mom roles ───────────────────────────────

test('non-mom roles: no COPPA UI, no COPPA data', async ({ page }) => {
  // Dad in the browser: family-members management is primary-parent-only.
  const { loginAsDad } = await import('../helpers/auth')
  await loginAsDad(page)
  await page.goto('/family-members')
  // The MomOnlyRoute guard fires BEFORE FamilyMembers mounts — dad gets the
  // Parent-only blocked card, an even stronger zero-surface result than the
  // component-level guard message.
  await expect(page.getByText('Parent-only area').first()).toBeVisible()
  await expect(page.getByTestId('coppa-consent-flow')).not.toBeVisible()
  await expect(page.getByTestId('coppa-acknowledge-modal')).not.toBeVisible()

  // Data layer: dad reads zero verification rows (RLS), even though the
  // disclosure TEXT itself is readable by design (cct_select_all).
  const dad = await signInClient(TEST_USERS.mark.email, TEST_USERS.mark.password)
  const { data: pv } = await dad.from('parent_verifications').select('id')
  expect(pv ?? []).toHaveLength(0)
})

// ── 6. Full Screen-5 payment path (needs the publishable key) ─────────────
//
// Testworth is ALWAYS founding (asserted in resolveTestworth). Without
// forcing beta_cohort_settings.enabled=false first, Screen 5 would now
// route Sarah through the BETA-COHORT interim panel instead of the real
// Stripe Payment Element — this is exactly the "founding + switch OFF →
// real $1 step renders" scenario, and this is also the seat's condition-2
// load-bearing pin for the useStripeVerificationPayment extraction.

test('full consent flow with real TEST-mode payment (requires VITE_STRIPE_PUBLISHABLE_KEY + deployed webhook)', async ({ page }, testInfo) => {
  test.skip(!process.env.VITE_STRIPE_PUBLISHABLE_KEY, 'VITE_STRIPE_PUBLISHABLE_KEY not configured')
  testInfo.setTimeout(120000)
  await revokeSarahVerification()
  await setBetaCohortMode(false)
  try {
    await loginAsMom(page)
    await page.goto('/family-setup')
    await page.getByRole('button', { name: 'Add One at a Time' }).click()
    await page.getByPlaceholder('Name').last().fill('COPPATEST PayKid')
    await page.getByPlaceholder('Or enter age').last().fill('6')
    await page.getByRole('button', { name: /Confirm & Add/ }).click()

    // Walk all four sections.
    for (let i = 0; i < 4; i++) {
      await expect(page.getByTestId('coppa-section-scroll')).toBeVisible()
      await page.getByTestId('coppa-section-scroll').evaluate((el) => { el.scrollTop = el.scrollHeight })
      await page.getByTestId('coppa-section-ack').check()
      await page.getByTestId('coppa-section-continue').click()
    }

    // Screen 5: affirm → Payment Element mounts → fill the test card.
    await page.getByTestId('coppa-affirmation-ack').check()
    const stripeFrame = page.frameLocator('[data-testid="coppa-payment-element"] iframe').first()
    // The Payment Element renders an accordion (Card / Bank / Klarna) —
    // expand Card before its inputs exist.
    await stripeFrame.getByText('Card', { exact: true }).first().click({ timeout: 30000 })
    await stripeFrame.locator('input[name="number"]').fill('4242424242424242', { timeout: 30000 })
    await stripeFrame.locator('input[name="expiry"]').fill('12/34')
    await stripeFrame.locator('input[name="cvc"]').fill('123')
    const zip = stripeFrame.locator('input[name="postalCode"]')
    if (await zip.isVisible().catch(() => false)) await zip.fill('63101')

    await page.getByTestId('coppa-verify-continue').click()

    // Webhook → poll → commit → Screen 6.
    await expect(page.getByTestId('coppa-success-screen')).toBeVisible({ timeout: 90000 })
    await page.getByTestId('coppa-success-continue').click()
    await expect(page.getByText('Your family is set up!', { exact: false })).toBeVisible()

    const { data: kid } = await sr
      .from('family_members')
      .select('id')
      .eq('display_name', 'COPPATEST PayKid')
      .single()
    expect(kid).toBeTruthy()
    createdMemberIds.push(kid!.id)
    const { data: consent } = await sr.from('coppa_consents').select('id, verification_id').eq('child_member_id', kid!.id).single()
    expect(consent).toBeTruthy()
    createdConsentIds.push(consent!.id)
    createdVerificationIds.push(consent!.verification_id)
  } finally {
    await restoreSarahVerification()
    await setBetaCohortMode(true)
  }
})

// ── 7. BETA-COHORT: interim consent, finish verifying, founding-at-signup ──
//
// Testworth (Sarah) is always founding. beta_cohort_settings.enabled
// defaults true, so these tests exercise Screen 5's default state directly
// — no toggle needed for test A. Every test below restores Sarah's
// verification state to EXACTLY what it was before it ran (matching the
// revokeSarahVerification/restoreSarahVerification discipline, not
// seedSarahVerification's "leave it for reuse" discipline) — required
// because the split partial indexes only allow ONE active row of each kind,
// and seedSarahVerification's `.maybeSingle()` would throw if a lingering
// interim row from one of these tests survived into a later test.

test('BETA-COHORT: founding family + beta cohort mode ON — Screen 5 offers the no-charge interim path end to end', async ({ page }) => {
  await revokeSarahVerification()
  let interimVerificationId: string | null = null
  let consentId: string | null = null
  try {
    await loginAsMom(page)
    await page.goto('/family-setup')
    await page.getByRole('button', { name: 'Add One at a Time' }).click()
    await page.getByPlaceholder('Name').last().fill('COPPATEST InterimKid')
    await page.getByPlaceholder('Or enter age').last().fill('7')
    await page.getByRole('button', { name: /Confirm & Add/ }).click()

    // Walk all four disclosure sections.
    for (let i = 0; i < 4; i++) {
      await expect(page.getByTestId('coppa-section-scroll')).toBeVisible()
      await page.getByTestId('coppa-section-scroll').evaluate((el) => { el.scrollTop = el.scrollHeight })
      await page.getByTestId('coppa-section-ack').check()
      await page.getByTestId('coppa-section-continue').click()
    }

    // Screen 5: the BETA-COHORT interim panel, NOT the Stripe Payment Element.
    await expect(page.getByText('founding beta families', { exact: false })).toBeVisible()
    await expect(page.getByTestId('coppa-payment-element')).not.toBeVisible()
    const interimContinue = page.getByTestId('coppa-interim-continue')
    await expect(interimContinue).toBeDisabled()
    await page.getByTestId('coppa-affirmation-ack').check()
    await expect(interimContinue).toBeEnabled()
    await interimContinue.click()

    await expect(page.getByTestId('coppa-success-screen')).toBeVisible({ timeout: 20000 })
    await page.getByTestId('coppa-success-continue').click()
    await expect(page.getByText('Your family is set up!', { exact: false })).toBeVisible()

    const { data: kid } = await sr
      .from('family_members')
      .select('id')
      .eq('display_name', 'COPPATEST InterimKid')
      .single()
    expect(kid).toBeTruthy()
    createdMemberIds.push(kid!.id)

    const { data: consent } = await sr
      .from('coppa_consents')
      .select('id, verification_id')
      .eq('child_member_id', kid!.id)
      .single()
    expect(consent).toBeTruthy()
    consentId = consent!.id
    createdConsentIds.push(consent!.id)

    const { data: verification } = await sr
      .from('parent_verifications')
      .select('id, verification_method, amount_charged_cents, stripe_payment_intent_id')
      .eq('id', consent!.verification_id)
      .single()
    expect(verification?.verification_method).toBe('beta_interim')
    expect(verification?.amount_charged_cents).toBe(0)
    expect(verification?.stripe_payment_intent_id).toBeNull()
    interimVerificationId = verification!.id
    createdVerificationIds.push(verification!.id)

    // PIN pipeline resumed exactly as on the real-charge path.
    await expect
      .poll(async () => {
        const { data } = await sr.from('family_members').select('pin_hash').eq('id', kid!.id).single()
        return data?.pin_hash != null
      }, { timeout: 15000 })
      .toBe(true)
  } finally {
    // Clean up THIS test's rows BEFORE restoring Sarah's original
    // verification — coppa_consents.verification_id is ON DELETE RESTRICT,
    // and a lingering active interim row would break every later test's
    // seedSarahVerification() .maybeSingle() call.
    if (consentId) await sr.from('coppa_consents').delete().eq('id', consentId)
    if (interimVerificationId) await sr.from('parent_verifications').delete().eq('id', interimVerificationId)
    await restoreSarahVerification()
  }
})

test('BETA-COHORT: "finish verifying" appears only for interim-only families; completing it records a NEW real verification without touching the interim row', async ({ page }, testInfo) => {
  test.skip(!process.env.VITE_STRIPE_PUBLISHABLE_KEY, 'VITE_STRIPE_PUBLISHABLE_KEY not configured')
  testInfo.setTimeout(120000)

  await revokeSarahVerification()
  const { data: interim, error: interimError } = await sr
    .from('parent_verifications')
    .insert({
      family_id: familyId,
      parent_member_id: sarahMemberId,
      verification_method: 'beta_interim',
      amount_charged_cents: 0,
    })
    .select('id')
    .single()
  if (interimError || !interim) throw new Error(`seed interim verification failed: ${interimError?.message}`)

  let realVerificationId: string | null = null
  try {
    // While the switch is ON (default), no "finish verifying" prompt —
    // interim-only is fine during beta.
    await loginAsMom(page)
    await page.goto('/settings/privacy-consent')
    await expect(page.getByText('Verified on', { exact: false })).toBeVisible()
    await expect(page.getByTestId('coppa-finish-verifying-open')).not.toBeVisible()

    // Flip the switch off (live cutover) — the prompt appears.
    await setBetaCohortMode(false)
    await page.reload()
    await expect(page.getByTestId('coppa-finish-verifying-open')).toBeVisible()

    // Complete it with a real TEST-mode charge — reuses the SAME
    // useStripeVerificationPayment mechanics as Screen 5 (seat condition 2).
    await page.getByTestId('coppa-finish-verifying-open').click()
    await expect(page.getByTestId('coppa-finish-verifying-modal')).toBeVisible()
    await page.getByTestId('coppa-finish-verifying-start').click()

    const stripeFrame = page.frameLocator('[data-testid="coppa-finish-verifying-payment-element"] iframe').first()
    await stripeFrame.getByText('Card', { exact: true }).first().click({ timeout: 30000 })
    await stripeFrame.locator('input[name="number"]').fill('4242424242424242', { timeout: 30000 })
    await stripeFrame.locator('input[name="expiry"]').fill('12/34')
    await stripeFrame.locator('input[name="cvc"]').fill('123')
    const zip = stripeFrame.locator('input[name="postalCode"]')
    if (await zip.isVisible().catch(() => false)) await zip.fill('63101')

    await page.getByTestId('coppa-finish-verifying-charge').click()
    await expect(page.getByText('now fully verified', { exact: false })).toBeVisible({ timeout: 90000 })

    // DB truth: a NEW real row exists; the interim row is untouched
    // (immutability, PRD-40 §9.3); both are simultaneously active (the
    // split uq_pv_active_real_per_parent / uq_pv_active_interim_per_parent
    // design this migration introduces).
    const { data: rows } = await sr
      .from('parent_verifications')
      .select('id, verification_method, revoked_at')
      .eq('parent_member_id', sarahMemberId)
      .is('revoked_at', null)
    expect(rows ?? []).toHaveLength(2)
    const interimRow = rows!.find((r) => r.verification_method === 'beta_interim')
    const realRow = rows!.find((r) => r.verification_method !== 'beta_interim')
    expect(interimRow?.id).toBe(interim.id)
    expect(realRow).toBeTruthy()
    realVerificationId = realRow!.id

    // Real-first lookup: the prompt disappears once a real verification exists.
    await page.reload()
    await expect(page.getByTestId('coppa-finish-verifying-open')).not.toBeVisible()
  } finally {
    await setBetaCohortMode(true)
    if (realVerificationId) await sr.from('parent_verifications').delete().eq('id', realVerificationId)
    await sr.from('parent_verifications').delete().eq('id', interim.id)
    await restoreSarahVerification()
  }
})

test('BETA-COHORT: a real signup is flagged founding-at-signup while the switch is on; is_test_family=true opts out', async () => {
  const stamp = Date.now()
  const foundingEmail = `coppatest-foundingsignup-${stamp}@example.com`
  const testFamilyEmail = `coppatest-testfamilysignup-${stamp}@example.com`
  const FIXTURE_PASSWORD = 'CoppaTest2026!'
  let foundingAuthUserId: string | null = null
  let foundingFamilyId: string | null = null
  let testFamilyAuthUserId: string | null = null
  let testFamilyFamilyId: string | null = null

  try {
    await setBetaCohortMode(true) // this probe requires ON regardless of prior state

    // A real, non-test signup — should be flagged founding at signup.
    // BETA-COHORT-DELIBERATE-REAL-SIGNUP: this call deliberately omits
    // is_test_family/skip_auto_family — it exists specifically to prove
    // founding-at-signup fires for a genuinely real signup (the
    // beta-cohort-auth-user-metadata.test.ts static pin recognizes this
    // exact marker and skips it; every other createUser() call under
    // tests/ must carry one of those two flags). This is ALSO, exactly,
    // the shape of the P0 the rls-verifier pass found live in migration
    // 100338 (2026-09-12): no user_metadata key at all means
    // raw_user_meta_data->>'is_test_family' is SQL NULL, and the original
    // (unfixed) handle_new_user() body assigned that NULL straight into
    // families.is_test_family (NOT NULL) — a 23502 that rolled back every
    // real signup. Migration 100339 hotfixed it with COALESCE; this test
    // proves the fix against the exact real-world shape that broke.
    const { data: created1, error: err1 } = await sr.auth.admin.createUser({
      email: foundingEmail, password: FIXTURE_PASSWORD, email_confirm: true,
    })
    if (err1 || !created1.user) throw new Error(`createUser (founding probe) failed: ${err1?.message}`)
    foundingAuthUserId = created1.user.id

    await expect
      .poll(async () => {
        const { data } = await sr.from('family_members').select('family_id').eq('user_id', foundingAuthUserId!).maybeSingle()
        if (data?.family_id) foundingFamilyId = data.family_id
        return !!foundingFamilyId
      }, { timeout: 15000 })
      .toBe(true)

    const { data: foundingFamily } = await sr
      .from('families')
      .select('is_founding_family, is_test_family')
      .eq('id', foundingFamilyId!)
      .single()
    expect(foundingFamily?.is_founding_family).toBe(true)
    expect(foundingFamily?.is_test_family).toBe(false)

    const { data: foundingSub } = await sr
      .from('family_subscriptions')
      .select('is_founding_family, price_adjustment_kind, founding_rate_monthly')
      .eq('family_id', foundingFamilyId!)
      .single()
    expect(foundingSub?.is_founding_family).toBe(true)
    expect(foundingSub?.price_adjustment_kind).toBe('founding')
    expect(foundingSub?.founding_rate_monthly).toBeNull() // deliberately left NULL at signup — a real Stripe event sets it later

    // A real signup flagged is_test_family=true — never founding.
    const { data: created2, error: err2 } = await sr.auth.admin.createUser({
      email: testFamilyEmail,
      password: FIXTURE_PASSWORD,
      email_confirm: true,
      user_metadata: { is_test_family: true },
    })
    if (err2 || !created2.user) throw new Error(`createUser (is_test_family probe) failed: ${err2?.message}`)
    testFamilyAuthUserId = created2.user.id

    await expect
      .poll(async () => {
        const { data } = await sr.from('family_members').select('family_id').eq('user_id', testFamilyAuthUserId!).maybeSingle()
        if (data?.family_id) testFamilyFamilyId = data.family_id
        return !!testFamilyFamilyId
      }, { timeout: 15000 })
      .toBe(true)

    const { data: testFamily } = await sr
      .from('families')
      .select('is_founding_family, is_test_family')
      .eq('id', testFamilyFamilyId!)
      .single()
    expect(testFamily?.is_test_family).toBe(true)
    expect(testFamily?.is_founding_family).toBe(false)

    const { data: testSub } = await sr
      .from('family_subscriptions')
      .select('is_founding_family, price_adjustment_kind')
      .eq('family_id', testFamilyFamilyId!)
      .single()
    expect(testSub?.is_founding_family).toBe(false)
    expect(testSub?.price_adjustment_kind).toBeNull()
  } finally {
    // FK-order teardown (TEEN-CRED procedure) for both throwaway families —
    // each is a bare primary_parent with no children, so the sweep is short.
    // family_subscriptions/onboarding_milestones cascade via families'
    // ON DELETE CASCADE.
    for (const [famId, authId] of [
      [foundingFamilyId, foundingAuthUserId],
      [testFamilyFamilyId, testFamilyAuthUserId],
    ] as const) {
      if (famId) {
        const { data: members } = await sr.from('family_members').select('id').eq('family_id', famId)
        const ids = (members ?? []).map((m) => m.id)
        if (ids.length) {
          for (const [table, col] of [
            ['lists', 'owner_id'],
            ['archive_folders', 'member_id'],
            ['dashboard_configs', 'family_member_id'],
            ['archive_member_settings', 'member_id'],
            ['dashboard_widgets', 'family_member_id'],
          ] as const) {
            const d = await sr.from(table).delete().in(col, ids)
            if (d.error) console.warn(`sweep: founding-signup probe ${table} delete failed:`, d.error.message)
          }
          const dm = await sr.from('family_members').delete().in('id', ids)
          if (dm.error) console.warn('sweep: founding-signup probe family_members delete failed:', dm.error.message)
        }
        const df = await sr.from('families').delete().eq('id', famId)
        if (df.error) console.warn('sweep: founding-signup probe families delete failed:', df.error.message)
      }
      if (authId) {
        const del = await sr.auth.admin.deleteUser(authId)
        if (del.error) console.warn('sweep: founding-signup probe auth deleteUser failed:', del.error.message)
        const { data: still } = await sr.auth.admin.getUserById(authId)
        if (still?.user) console.warn(`sweep: founding-signup probe auth user ${authId} still exists (soft-deleted?) — investigate FK blockers`)
      }
    }
  }
})
