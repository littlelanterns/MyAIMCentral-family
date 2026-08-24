/**
 * PRD-40 COPPA — Slice 3 (Consent UX Screens 1–7 + roster retrofit) pins.
 *
 * Covers: the FamilySetup save gate (held-pending → consent flow), the
 * Screen 7 acknowledgment path end-to-end in the browser, the R-8
 * dormant-block card for non-founding families, the commit_consented_members
 * RPC (R-10 rejections, validation, atomicity, the real commit + PIN
 * pipeline resume), and zero-COPPA-surface probes for non-mom roles.
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
  // Non-founding fixture family teardown
  if (nfFamilyId) {
    await sr.from('family_members').delete().eq('family_id', nfFamilyId)
    await sr.from('families').delete().eq('id', nfFamilyId)
    nfFamilyId = null
  }
  if (nfAuthUserId) {
    await sr.auth.admin.deleteUser(nfAuthUserId)
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
  const { data: created, error: createError } = await sr.auth.admin.createUser({
    email: NF_EMAIL,
    password: NF_PASSWORD,
    email_confirm: true,
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

test('full consent flow with real TEST-mode payment (requires VITE_STRIPE_PUBLISHABLE_KEY + deployed webhook)', async ({ page }, testInfo) => {
  test.skip(!process.env.VITE_STRIPE_PUBLISHABLE_KEY, 'VITE_STRIPE_PUBLISHABLE_KEY not configured')
  testInfo.setTimeout(120000)
  await revokeSarahVerification()
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
  }
})
