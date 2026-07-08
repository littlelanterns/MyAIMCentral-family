/**
 * PRD-30 Safety Monitoring SM-B — Convention #277 eyes-on tour (EYES_ON_TOUR=1
 * gated). Drives every new mom-facing surface + the teen disclosure row and
 * screenshots them to eyes-on-tour/ (gitignored) for reading + judgment.
 *
 *   sm-01..03  Settings → Safety Monitoring section (mom), POPULATED —
 *              desktop / tablet / mobile. Proves: recipient toggles, delivery
 *              channels, per-member monitored list with gear icons.
 *   sm-04      Sensitivity modal (mom, desktop) — 3 Lock pills + 5 adjustable
 *              segmented controls.
 *   sm-05      Flag detail, NO-EXCERPT mode (mom, desktop) — severity banner,
 *              plain-language category, starter, resources, Acknowledge/Dismiss.
 *   sm-06..08  Flag history at /safety-flags (mom) — desktop / tablet / mobile.
 *   sm-09      Family Overview safety_monitoring column section (mom, desktop).
 *   sm-10..11  Teen What's Shared disclosure row (Alex, independent) —
 *              desktop / mobile.
 *
 * No model calls — all fixtures are service-role inserts (real flag rows), no
 * live safety-classify sweep needed for these screenshots.
 * Run: EYES_ON_TOUR=1 npx playwright test tests/e2e/features/safety-monitoring-eyes-on-tour.spec.ts
 */
import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { loginAsMom, loginAsAlex } from '../helpers/auth'

const RUN_TOUR = process.env.EYES_ON_TOUR === '1'
const admin = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')
const DESKTOP = { width: 1440, height: 900 }
const TABLET = { width: 768, height: 1024 }
const MOBILE = { width: 390, height: 844 }

let familyId = ''
let jordanId = ''
let flagId = ''

async function shot(page: Page, name: string) {
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
}

async function resolve() {
  const { data: fam } = await admin.from('families').select('id').ilike('family_name', '%testworth%').single()
  familyId = fam!.id
  const { data: jordan } = await admin.from('family_members').select('id').eq('family_id', familyId).eq('display_name', 'Jordan').single()
  jordanId = jordan!.id
}

async function seedFlag() {
  const { data } = await admin
    .from('safety_flags')
    .insert({
      family_id: familyId,
      flagged_member_id: jordanId,
      surface: 'lila-chat',
      category: 'bullying',
      severity: 'warning',
      detection_layer: 'keyword',
      conversation_starter: "I noticed you might be dealing with something tough at school. I'm here if you want to talk about it — no pressure, whenever you're ready.",
    })
    .select('id')
    .single()
  flagId = data!.id
}

async function sweep() {
  if (flagId) {
    await admin.from('notifications').delete().eq('source_reference_id', flagId)
    await admin.from('safety_flags').delete().eq('id', flagId)
  }
}

test.describe('PRD-30 SM-B eyes-on tour', () => {
  test.skip(!RUN_TOUR, 'EYES_ON_TOUR=1 not set')
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(120_000)

  test.beforeAll(async () => {
    await resolve()
    await seedFlag()
  })

  test.afterAll(async () => {
    await sweep()
  })

  test('Settings → Safety Monitoring section', async ({ page }) => {
    await loginAsMom(page)
    for (const [name, vp] of [['sm-01-settings-desktop', DESKTOP], ['sm-02-settings-tablet', TABLET], ['sm-03-settings-mobile', MOBILE]] as const) {
      await page.setViewportSize(vp)
      await page.goto('/settings')
      await page.waitForLoadState('networkidle')
      const header = page.getByRole('button', { name: /Safety Monitoring/i }).first()
      await expect(header).toBeVisible({ timeout: 15_000 })
      await header.click()
      await expect(page.getByText("Who's monitored")).toBeVisible({ timeout: 10_000 })
      await page.waitForTimeout(300)
      await shot(page, name)
    }
  })

  test('Sensitivity modal — locked + adjustable categories', async ({ page }) => {
    await loginAsMom(page)
    await page.setViewportSize(DESKTOP)
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /Safety Monitoring/i }).first().click()
    await page.getByTestId(`safety-sensitivity-gear-${jordanId}`).click()
    await expect(page.getByTestId('safety-sensitivity-locked-self_harm')).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(300)
    await shot(page, 'sm-04-sensitivity-modal-desktop')
  })

  test('Flag detail — no-excerpt mode', async ({ page }) => {
    await loginAsMom(page)
    await page.setViewportSize(DESKTOP)
    await page.goto(`/safety-flags?flag=${flagId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('safety-flag-detail-body')).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(300)
    await shot(page, 'sm-05-flag-detail-desktop')
  })

  test('Flag history at /safety-flags', async ({ page }) => {
    await loginAsMom(page)
    for (const [name, vp] of [['sm-06-history-desktop', DESKTOP], ['sm-07-history-tablet', TABLET], ['sm-08-history-mobile', MOBILE]] as const) {
      await page.setViewportSize(vp)
      await page.goto('/safety-flags')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: 'Safety Flag History' })).toBeVisible({ timeout: 15_000 })
      await expect(page.getByTestId(`safety-flag-row-${flagId}`)).toBeVisible({ timeout: 10_000 })
      await page.waitForTimeout(300)
      await shot(page, name)
    }
  })

  test('Family Overview safety_monitoring column section', async ({ page }) => {
    await loginAsMom(page)
    await page.setViewportSize(DESKTOP)
    await page.goto('/dashboard?view=family_overview')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    const reviewLink = page.getByTestId(`fo-safety-review-${jordanId}`)
    await expect(reviewLink).toBeVisible({ timeout: 15_000 })
    await reviewLink.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await shot(page, 'sm-09-fo-safety-section-desktop')
  })

  test('Teen What\'s Shared disclosure row (Alex)', async ({ page }) => {
    await loginAsAlex(page)
    for (const [name, vp] of [['sm-10-teen-disclosure-desktop', DESKTOP], ['sm-11-teen-disclosure-mobile', MOBILE]] as const) {
      await page.setViewportSize(vp)
      await page.goto('/settings')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: /What's Shared/i }).first().click()
      const row = page.getByTestId('teen-safety-disclosure-row')
      await expect(row).toBeVisible({ timeout: 10_000 })
      await row.scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
      await shot(page, name)
    }
  })
})
