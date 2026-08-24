/**
 * PRD-40 Slice 4 — Convention #277 eyes-on tour for Screen 8 (Privacy &
 * Consent) and Screen 9 (Revocation Flow). Claude drives this as mom (plus
 * a zero-surface probe as dad), screenshots every surface at desktop/
 * tablet/mobile, then READS the screenshots and fills the Mom-UI
 * Verification table in the active build file.
 *
 *   $env:EYES_ON_TOUR='1'; npx playwright test tests/e2e/features/coppa-rights-lifecycle-eyes-on-tour.spec.ts
 *
 * Gated behind EYES_ON_TOUR so it never runs in the normal suite. COPPATOUR4
 * fixture prefix, swept in teardown (same discipline as
 * coppa-consent-eyes-on-tour.spec.ts).
 */
import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { loginAsMom, loginAsDad } from '../helpers/auth'

dotenv.config({ path: '.env.local' })

test.skip(!process.env.EYES_ON_TOUR, 'Manual eyes-on tour — set EYES_ON_TOUR=1 to run')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const sr = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true })

async function shot(page: Page, name: string) {
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(SHOT_DIR, `coppa-s4-${name}.png`), fullPage: false })
}

let familyId = ''
let sarahMemberId = ''
const createdMemberIds: string[] = []
const createdConsentIds: string[] = []
const createdVerificationIds: string[] = []

async function setupFixture() {
  const { data: fam } = await sr.from('families').select('id').eq('family_name', 'The Testworth Family').single()
  familyId = fam!.id
  const { data: sarah } = await sr.from('family_members').select('id').eq('family_id', familyId).eq('role', 'primary_parent').single()
  sarahMemberId = sarah!.id
}

async function seedVerification(): Promise<string> {
  const { data: existing } = await sr.from('parent_verifications').select('id').eq('parent_member_id', sarahMemberId).is('revoked_at', null).maybeSingle()
  if (existing) return existing.id
  const { data } = await sr.from('parent_verifications').insert({
    family_id: familyId, parent_member_id: sarahMemberId, verification_method: 'stripe_charge',
    stripe_payment_intent_id: `pi_COPPATOUR4_${Date.now()}`, amount_charged_cents: 100, currency: 'USD',
  }).select('id').single()
  createdVerificationIds.push(data!.id)
  return data!.id
}

async function seedChild(name: string): Promise<string> {
  const { data } = await sr.from('family_members').insert({
    family_id: familyId, display_name: name, role: 'member', dashboard_mode: 'guided', relationship: 'child',
    age: 9, in_household: true, dashboard_enabled: true, auth_method: 'none', is_active: true,
    coppa_age_bracket: 'under_13', member_color: '#68a395',
  }).select('id').single()
  createdMemberIds.push(data!.id)
  return data!.id
}

async function seedConsent(childId: string, verificationId: string, opts: { revoked?: boolean } = {}): Promise<string> {
  const row: Record<string, unknown> = {
    family_id: familyId, child_member_id: childId, parent_member_id: sarahMemberId, verification_id: verificationId,
    consent_version: '1.0.0', acknowledged_sections: ['what_we_collect', 'how_lila_uses', 'who_sees_it', 'your_rights', 'parent_affirmation'],
  }
  if (opts.revoked) {
    row.revoked_at = new Date().toISOString()
    row.scheduled_deletion_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    row.revocation_reason = 'Privacy concerns'
  }
  const { data } = await sr.from('coppa_consents').insert(row).select('id').single()
  createdConsentIds.push(data!.id)
  if (opts.revoked) {
    await sr.from('family_members').update({ is_suspended_for_deletion: true }).eq('id', childId)
  }
  return data!.id
}

async function teardown() {
  if (createdConsentIds.length) await sr.from('coppa_consents').delete().in('id', createdConsentIds)
  if (createdMemberIds.length) {
    // list_shares.shared_with is a FK to family_members with no CASCADE —
    // a member row can pick one up via the app's own default-sharing
    // behavior (or, for the deletion-cascade spec's fixtures, via the
    // reassign-to-mom scrub fallback) and then block the member delete.
    // Clear it first, loudly, before attempting the member delete.
    const dls = await sr.from('list_shares').delete().in('shared_with', createdMemberIds)
    if (dls.error) console.warn('tour sweep: list_shares delete failed:', dls.error.message)
    const dl = await sr.from('lists').delete().in('owner_id', createdMemberIds)
    if (dl.error) console.warn('tour sweep: lists delete failed:', dl.error.message)
    const dm = await sr.from('family_members').delete().in('id', createdMemberIds)
    if (dm.error) console.warn('tour sweep: family_members delete failed:', dm.error.message)
  }
  const { data: strays } = await sr.from('family_members').select('id').like('display_name', 'COPPATOUR4%')
  if (strays?.length) {
    const ids = strays.map((s) => s.id)
    await sr.from('coppa_consents').delete().in('child_member_id', ids)
    await sr.from('list_shares').delete().in('shared_with', ids)
    await sr.from('lists').delete().in('owner_id', ids)
    await sr.from('family_members').delete().in('id', ids)
  }
  if (createdVerificationIds.length) {
    await sr.from('coppa_consents').delete().in('verification_id', createdVerificationIds)
    await sr.from('parent_verifications').delete().in('id', createdVerificationIds)
  }
}

const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'tablet', width: 768, height: 1024 },
  { label: 'mobile', width: 375, height: 812 },
] as const

for (const vp of VIEWPORTS) {
  test.describe(`COPPA Slice 4 tour — ${vp.label}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })
    test.describe.configure({ mode: 'serial' })

    test.beforeAll(async () => {
      await setupFixture()
      await teardown()
    })

    test.afterAll(async () => {
      await teardown()
    })

    test(`[${vp.label}] Screen 8 — active consent row + pending-deletion row + consent replay modal`, async ({ page }) => {
      const verificationId = await seedVerification()
      const activeChild = await seedChild('COPPATOUR4 Active Kid')
      await seedConsent(activeChild, verificationId)
      const revokedChild = await seedChild('COPPATOUR4 Revoked Kid')
      await seedConsent(revokedChild, verificationId, { revoked: true })

      await loginAsMom(page)
      await page.goto('/settings/privacy-consent')
      await page.waitForLoadState('networkidle')
      await shot(page, `${vp.label}-01-screen8-overview`)

      // Consent replay modal (audit-replay).
      const reviewButtons = page.getByRole('button', { name: /Review what I consented to/ })
      if (await reviewButtons.first().isVisible().catch(() => false)) {
        await reviewButtons.first().click()
        await expect(page.getByText('What We Collect', { exact: false })).toBeVisible({ timeout: 10000 })
        await shot(page, `${vp.label}-02-consent-replay-modal`)
        await page.keyboard.press('Escape')
      }
    })

    test(`[${vp.label}] Screen 9 — revocation flow 3 steps`, async ({ page }) => {
      const verificationId = await seedVerification()
      const child = await seedChild('COPPATOUR4 Flow Kid')
      await seedConsent(child, verificationId)

      await loginAsMom(page)
      await page.goto('/settings/privacy-consent')
      await page.waitForLoadState('networkidle')

      const revokeBtn = page.getByRole('button', { name: /Revoke consent & delete data/ }).first()
      await revokeBtn.click()
      await expect(page.getByText('If you revoke consent', { exact: false })).toBeVisible({ timeout: 10000 })
      await shot(page, `${vp.label}-03-screen9-step1-warning`)

      await page.getByRole('button', { name: /Continue to Revoke/ }).click()
      await expect(page.getByText('Are you sure?', { exact: false })).toBeVisible()
      await shot(page, `${vp.label}-04-screen9-step2-confirm-empty`)

      await page.getByPlaceholder('COPPATOUR4 Flow Kid').fill('COPPATOUR4 Flow Kid')
      await page.getByText('Privacy concerns').click()
      await shot(page, `${vp.label}-05-screen9-step2-confirm-filled`)

      await page.getByRole('button', { name: /Revoke Consent & Start Deletion/ }).click()
      await expect(page.getByText('Consent Revoked', { exact: false })).toBeVisible({ timeout: 10000 })
      await shot(page, `${vp.label}-06-screen9-step3-done`)

      await page.getByRole('button', { name: 'Done' }).click()
      // .first() — the Screen 8 test earlier in this same viewport describe
      // already seeded a SECOND "Pending Deletion" fixture row (Revoked
      // Kid), so this text now legitimately matches twice on the page.
      await expect(page.getByText('Deletion scheduled', { exact: false }).first()).toBeVisible({ timeout: 10000 })
      await shot(page, `${vp.label}-07-screen8-pending-deletion-after-revoke`)
    })

    test(`[${vp.label}] zero COPPA surface as dad`, async ({ page }) => {
      await loginAsDad(page)
      await page.goto('/settings/privacy-consent')
      await page.waitForLoadState('networkidle')
      await shot(page, `${vp.label}-08-zero-surface-dad`)
      await expect(page.getByText('Parent-only', { exact: false }).first()).toBeVisible()
    })
  })
}
