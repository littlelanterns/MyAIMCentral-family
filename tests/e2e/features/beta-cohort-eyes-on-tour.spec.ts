/**
 * BETA-COHORT (PRD-40 §9 interim consent + PRD-31 founding-at-signup) —
 * Convention #277 eyes-on tour. Claude drives this as mom, screenshots every
 * touched surface at desktop/tablet/mobile, then READS the screenshots and
 * fills the Mom-UI Verification table in .claude/rules/current-builds/BETA-COHORT.md.
 *
 *   $env:EYES_ON_TOUR='1'; npx playwright test tests/e2e/features/beta-cohort-eyes-on-tour.spec.ts
 *
 * Gated behind EYES_ON_TOUR so it never runs in the normal suite. Uses the
 * same COPPATOUR/COPPATEST fixture discipline as the sibling COPPA tours —
 * every created row swept, Sarah's verification state restored, the
 * beta_cohort_settings switch restored to its default (enabled=true).
 *
 * Three surfaces toured (per the seat's explicit ask):
 *   1. Screen 5's interim panel (BetaInterimPanel) — founding family, switch ON.
 *   2. The "You're a founding beta family" badge on Settings → Family Management.
 *   3. The "Finish verifying" prompt + modal on Settings → Privacy & Consent —
 *      interim-only family, switch OFF (the live-cutover state).
 */
import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { loginAsMom } from '../helpers/auth'

dotenv.config({ path: '.env.local' })

test.skip(!process.env.EYES_ON_TOUR, 'Manual eyes-on tour — set EYES_ON_TOUR=1 to run')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const sr = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true })

async function shot(page: Page, name: string) {
  // Let modal fade/settle animations finish — a screenshot taken the moment
  // toBeVisible resolves can catch a mid-fade translucent frame.
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(SHOT_DIR, `beta-cohort-${name}.png`), fullPage: false })
}

let familyId = ''
let sarahMemberId = ''
let sarahOriginalVerificationId: string | null = null
const createdVerificationIds: string[] = []

async function setupFixture() {
  const { data: fam } = await sr.from('families').select('id').eq('family_name', 'The Testworth Family').single()
  familyId = fam!.id
  const { data: sarah } = await sr
    .from('family_members').select('id').eq('family_id', familyId).eq('role', 'primary_parent').single()
  sarahMemberId = sarah!.id
}

async function setBetaCohortMode(enabled: boolean) {
  const { data } = await sr.from('beta_cohort_settings').select('id').limit(1).single()
  await sr.from('beta_cohort_settings').update({ enabled }).eq('id', data!.id)
}

async function ensureUnverified() {
  const { data } = await sr
    .from('parent_verifications').select('id').eq('parent_member_id', sarahMemberId).is('revoked_at', null).maybeSingle()
  if (data) {
    sarahOriginalVerificationId = data.id
    await sr.from('parent_verifications').update({ revoked_at: new Date().toISOString() }).eq('id', data.id)
  }
}

async function restoreVerified() {
  if (sarahOriginalVerificationId) {
    await sr.from('parent_verifications').update({ revoked_at: null }).eq('id', sarahOriginalVerificationId)
    sarahOriginalVerificationId = null
  }
}

async function teardown() {
  await setBetaCohortMode(true)
  if (createdVerificationIds.length) {
    await sr.from('coppa_consents').delete().in('verification_id', createdVerificationIds)
    await sr.from('parent_verifications').delete().in('id', createdVerificationIds)
    createdVerificationIds.length = 0
  }
  await restoreVerified()
  const { data: strays } = await sr.from('family_members').select('id').like('display_name', 'COPPATOUR%')
  if (strays?.length) {
    const ids = strays.map((s) => s.id)
    const dc = await sr.from('coppa_consents').delete().in('child_member_id', ids)
    if (dc.error) console.warn('tour sweep: coppa_consents delete failed:', dc.error.message)
    const dl = await sr.from('lists').delete().in('owner_id', ids)
    if (dl.error) console.warn('tour sweep: lists delete failed:', dl.error.message)
    const dm = await sr.from('family_members').delete().in('id', ids)
    if (dm.error) console.warn('tour sweep: family_members delete failed:', dm.error.message)
  }
}

const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile', width: 375, height: 812 },
] as const

for (const vp of VIEWPORTS) {
  test.describe(`BETA-COHORT tour — ${vp.label}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })
    test.describe.configure({ mode: 'serial' })

    test.beforeAll(async () => {
      await setupFixture()
    })
    test.afterAll(async () => {
      await teardown()
    })

    test(`Screen 5 interim panel — founding family, switch ON (${vp.label})`, async ({ page }) => {
      await setBetaCohortMode(true)
      await ensureUnverified()
      try {
        await loginAsMom(page)
        await page.goto('/family-setup')
        await page.getByRole('button', { name: 'Add One at a Time' }).click()
        await page.getByPlaceholder('Name').last().fill('COPPATOUR InterimKid')
        await page.getByPlaceholder('Or enter age').last().fill('8')
        await page.getByRole('button', { name: /Confirm & Add/ }).click()
        await expect(page.getByTestId('coppa-consent-flow')).toBeVisible()

        for (let i = 0; i < 4; i++) {
          await page.getByTestId('coppa-section-scroll').evaluate((el) => { el.scrollTop = el.scrollHeight })
          await page.getByTestId('coppa-section-ack').check()
          await page.getByTestId('coppa-section-continue').click()
        }
        // Screen 5 — affirm, then the interim panel should render instead of
        // the Stripe Payment Element.
        await expect(page.getByTestId('coppa-affirmation-ack')).toBeVisible()
        await page.getByTestId('coppa-affirmation-ack').check()
        await expect(page.getByTestId('coppa-interim-continue')).toBeVisible()
        await shot(page, `${vp.label}-01-screen5-interim-panel`)
        await page.keyboard.press('Escape')
      } finally {
        await restoreVerified()
      }
    })

    test(`Settings founding-beta-family badge (${vp.label})`, async ({ page }) => {
      await loginAsMom(page)
      await page.goto('/settings')
      // Family Management is a collapsed-by-default accordion section.
      await page.getByRole('button', { name: 'Family Management' }).click()
      await expect(page.getByText('You’re a founding beta family', { exact: false })).toBeVisible()
      await shot(page, `${vp.label}-02-settings-founding-badge`)
    })

    test(`"Finish verifying" prompt + modal — interim-only family, switch OFF (${vp.label})`, async ({ page }) => {
      await ensureUnverified()
      const { data: interim, error } = await sr
        .from('parent_verifications')
        .insert({
          family_id: familyId,
          parent_member_id: sarahMemberId,
          verification_method: 'beta_interim',
          amount_charged_cents: 0,
        })
        .select('id')
        .single()
      if (error || !interim) throw new Error(`tour seed interim verification failed: ${error?.message}`)
      createdVerificationIds.push(interim.id)

      try {
        await setBetaCohortMode(false)
        await loginAsMom(page)
        await page.goto('/settings/privacy-consent')
        await expect(page.getByTestId('coppa-finish-verifying-open')).toBeVisible()
        await shot(page, `${vp.label}-03-finish-verifying-prompt`)
        await page.getByTestId('coppa-finish-verifying-open').click()
        await expect(page.getByTestId('coppa-finish-verifying-modal')).toBeVisible()
        await shot(page, `${vp.label}-04-finish-verifying-modal`)
        await page.keyboard.press('Escape')
      } finally {
        await setBetaCohortMode(true)
        // Cleanup happens in teardown() via createdVerificationIds; restore
        // Sarah's real verification now so later viewport runs start clean.
        await sr.from('coppa_consents').delete().in('verification_id', [interim.id])
        await sr.from('parent_verifications').delete().eq('id', interim.id)
        createdVerificationIds.length = 0
        await restoreVerified()
      }
    })
  })
}
