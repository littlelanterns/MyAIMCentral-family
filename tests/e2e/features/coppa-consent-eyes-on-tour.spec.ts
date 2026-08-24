/**
 * PRD-40 Slice 3 — Convention #277 eyes-on tour for the COPPA consent
 * surfaces. Claude drives this as mom (plus zero-surface probes as dad),
 * screenshots every touched surface at desktop/tablet/mobile, then READS
 * the screenshots and fills the Mom-UI Verification table in the active
 * build file.
 *
 *   $env:EYES_ON_TOUR='1'; npx playwright test tests/e2e/features/coppa-consent-eyes-on-tour.spec.ts
 *
 * Gated behind EYES_ON_TOUR so it never runs in the normal suite. Uses the
 * same COPPATEST fixture discipline as coppa-consent-screens.spec.ts —
 * every created row swept, Sarah's verification state restored.
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
  // Let modal fade/settle animations finish — a screenshot taken the moment
  // toBeVisible resolves can catch a mid-fade translucent frame.
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(SHOT_DIR, `coppa-${name}.png`), fullPage: false })
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

async function ensureUnverified() {
  const { data } = await sr
    .from('parent_verifications').select('id').eq('parent_member_id', sarahMemberId).is('revoked_at', null).maybeSingle()
  if (data) {
    sarahOriginalVerificationId = data.id
    await sr.from('parent_verifications').update({ revoked_at: new Date().toISOString() }).eq('id', data.id)
  }
}

async function ensureVerified() {
  const { data } = await sr
    .from('parent_verifications').select('id').eq('parent_member_id', sarahMemberId).is('revoked_at', null).maybeSingle()
  if (!data) {
    const { data: created } = await sr.from('parent_verifications').insert({
      family_id: familyId,
      parent_member_id: sarahMemberId,
      verification_method: 'stripe_charge',
      stripe_payment_intent_id: `pi_COPPATOUR_${Date.now()}`,
      amount_charged_cents: 100,
      currency: 'USD',
    }).select('id').single()
    createdVerificationIds.push(created!.id)
  }
}

async function teardown() {
  if (createdVerificationIds.length) {
    await sr.from('coppa_consents').delete().in('verification_id', createdVerificationIds)
    await sr.from('parent_verifications').delete().in('id', createdVerificationIds)
  }
  if (sarahOriginalVerificationId) {
    await sr.from('parent_verifications').update({ revoked_at: null }).eq('id', sarahOriginalVerificationId)
    sarahOriginalVerificationId = null
  }
  const { data: strays } = await sr.from('family_members').select('id').like('display_name', 'COPPATOUR%')
  if (strays?.length) {
    const ids = strays.map((s) => s.id)
    // lists.owner_id is a NO-CASCADE FK and the provisioning trigger creates
    // member-owned lists — delete them before the member rows, loudly.
    const dc = await sr.from('coppa_consents').delete().in('child_member_id', ids)
    if (dc.error) console.warn('tour sweep: coppa_consents delete failed:', dc.error.message)
    const dl = await sr.from('lists').delete().in('owner_id', ids)
    if (dl.error) console.warn('tour sweep: lists delete failed:', dl.error.message)
    const dm = await sr.from('family_members').delete().in('id', ids)
    if (dm.error) console.warn('tour sweep: family_members delete failed:', dm.error.message)
  }
}

async function addUnder13Preview(page: Page, name: string) {
  await page.goto('/family-setup')
  await page.getByRole('button', { name: 'Add One at a Time' }).click()
  await page.getByPlaceholder('Name').last().fill(name)
  await page.getByPlaceholder('Or enter age').last().fill('8')
  await expect(page.getByTestId('coppa-under13-indicator')).toBeVisible()
}

const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'tablet', width: 768, height: 1024 },
  { label: 'mobile', width: 375, height: 812 },
] as const

for (const vp of VIEWPORTS) {
  test.describe(`COPPA tour — ${vp.label}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })
    test.describe.configure({ mode: 'serial' })

    test.beforeAll(async () => {
      await setupFixture()
    })
    test.afterAll(async () => {
      await teardown()
    })

    test(`bracket selector + under-13 indicator + learn-more (${vp.label})`, async ({ page }) => {
      await loginAsMom(page)
      await addUnder13Preview(page, 'COPPATOUR Kid')
      await shot(page, `${vp.label}-01-bracket-and-indicator`)
      await page.getByRole('button', { name: 'Learn what this means' }).click()
      await expect(page.getByTestId('coppa-learn-more')).toBeVisible()
      await shot(page, `${vp.label}-02-learn-more`)
      await page.keyboard.press('Escape')
    })

    test(`consent flow Screens 1–5 (${vp.label})`, async ({ page }) => {
      await ensureUnverified()
      try {
        await loginAsMom(page)
        await addUnder13Preview(page, 'COPPATOUR Kid')
        await page.getByRole('button', { name: /Confirm & Add/ }).click()
        await expect(page.getByTestId('coppa-consent-flow')).toBeVisible()
        await shot(page, `${vp.label}-03-screen1-locked`)

        for (let i = 0; i < 4; i++) {
          await page.getByTestId('coppa-section-scroll').evaluate((el) => { el.scrollTop = el.scrollHeight })
          await page.getByTestId('coppa-section-ack').check()
          await shot(page, `${vp.label}-0${4 + i}-screen${i + 1}-acked`)
          await page.getByTestId('coppa-section-continue').click()
        }
        await expect(page.getByTestId('coppa-affirmation-ack')).toBeVisible()
        await shot(page, `${vp.label}-08-screen5-verification`)
        await page.getByTestId('coppa-affirmation-ack').check()
        await page.waitForTimeout(2500) // payment element mount (or the not-configured card)
        await shot(page, `${vp.label}-09-screen5-payment-state`)
        await page.keyboard.press('Escape')
      } finally {
        if (sarahOriginalVerificationId) {
          await sr.from('parent_verifications').update({ revoked_at: null }).eq('id', sarahOriginalVerificationId)
          sarahOriginalVerificationId = null
        }
      }
    })

    test(`Screen 7 acknowledgment (${vp.label})`, async ({ page }) => {
      await ensureVerified()
      await loginAsMom(page)
      await addUnder13Preview(page, 'COPPATOUR AckKid')
      await page.getByRole('button', { name: /Confirm & Add/ }).click()
      await expect(page.getByTestId('coppa-acknowledge-modal')).toBeVisible()
      await shot(page, `${vp.label}-10-screen7-acknowledge`)
      await page.getByRole('button', { name: /Review what’s collected/ }).click()
      await shot(page, `${vp.label}-11-screen7-expanded`)
      await page.keyboard.press('Escape')
    })

    test(`member-edit bracket radio + nudge (${vp.label})`, async ({ page }) => {
      await loginAsMom(page)
      await page.goto('/family-members')
      // Open a CHILD member's edit panel (the bracket selector renders for
      // role='member' only — the first row is dad's, which correctly has none).
      const caseyRow = page.locator('.card-hover').filter({ hasText: 'Casey' }).first()
      await caseyRow.getByTitle('Edit').click()
      await expect(page.getByTestId('coppa-bracket-selector-edit').first()).toBeVisible()
      await shot(page, `${vp.label}-12-member-edit-bracket`)
    })

    test(`zero COPPA surface as dad (${vp.label})`, async ({ page }) => {
      await loginAsDad(page)
      await page.goto('/family-members')
      // MomOnlyRoute blocks dad before the page mounts — the Parent-only card.
      await expect(page.getByText('Parent-only area').first()).toBeVisible()
      await shot(page, `${vp.label}-13-dad-no-coppa-surface`)
    })
  })
}
