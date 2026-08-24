/**
 * STUDIO-EXPERIENCE ST-A — mobile eyes-on tour (Convention #277).
 *
 * MANUAL TOUR HELPER, NOT A REGRESSION TEST. Gated behind EYES_ON_TOUR=1.
 * Captures the two most-changed ST-A dialogs at a 375px mobile viewport so
 * the Mom-UI Verification table's mobile column rests on read screenshots,
 * not inference: (1) the new BestIntentionsStarterWizard, (2) the
 * ListReveal "Who Can Browse" step with its kid-scoped pills.
 * Desktop coverage comes from the STUDIO_AUDIT Pass A tour.
 */
import { test } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { loginAsMom } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'

dotenv.config({ path: '.env.local' })

test.skip(!process.env.EYES_ON_TOUR, 'Manual eyes-on tour — set EYES_ON_TOUR=1 to run')

const OUT_DIR = process.env.EYES_ON_TOUR_OUT
  ? process.env.EYES_ON_TOUR_OUT
  : path.join(process.cwd(), 'eyes-on-tour')

test.use({ viewport: { width: 375, height: 812 } })
test.describe.configure({ timeout: 180_000 })

test('ST-A mobile shots: Best Intentions wizard + board sharing step', async ({ page }) => {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const consoleErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)) })
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + String(e).slice(0, 300)))
  await loginAsMom(page)
  await page.goto('/studio')
  await waitForAppReady(page)
  await page.waitForTimeout(1000)

  // 1. Best Intentions Starter (Growth section)
  const growth = page
    .locator('h2')
    .filter({ hasText: 'Growth' })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "mb-8")]')
  const biDialog = page.locator('[role="dialog"]').first()
  for (let attempt = 0; attempt < 3; attempt++) {
    const biCard = growth.locator('div.snap-start').filter({ hasText: 'Best Intentions Starter' }).first()
    await biCard.scrollIntoViewIfNeeded().catch(() => {})
    await biCard.click().catch(() => {})
    await page.waitForTimeout(500)
    await biCard.getByRole('button', { name: /^customize$/i }).first().click({ force: true }).catch(() => {})
    await page.waitForTimeout(1500)
    if (await biDialog.isVisible().catch(() => false)) break
  }
  console.log('[tour] BI dialog count:', await page.locator('[role="dialog"]').count())
  console.log('[tour] BI wizard heading present:', await page.getByText('Pick Intentions').count())
  console.log('[tour] console errors so far:', JSON.stringify(consoleErrors))
  await page.screenshot({ path: path.join(OUT_DIR, 'sta-mobile-1-best-intentions-wizard.png') })

  // Control probe: Get to Know (untouched pre-ST-A code, same Growth section)
  // — distinguishes an ST-A defect from pre-existing mobile section behavior.
  await page.keyboard.press('Escape').catch(() => {})
  await page.goto('/studio')
  await waitForAppReady(page)
  await page.waitForTimeout(1000)
  const growth2 = page
    .locator('h2')
    .filter({ hasText: 'Growth' })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "mb-8")]')
  const gtkCard = growth2.locator('div.snap-start').filter({ hasText: 'Get to Know Your Family' }).first()
  await gtkCard.scrollIntoViewIfNeeded().catch(() => {})
  await gtkCard.click().catch(() => {})
  await page.waitForTimeout(500)
  await gtkCard.getByRole('button', { name: /^customize$/i }).first().click({ force: true }).catch(() => {})
  await page.waitForTimeout(1500)
  console.log('[tour] GTK (control) dialog count:', await page.locator('[role="dialog"]').count())
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(500)

  // 2. Extra House Jobs Board → sharing step (kid-scoped pills)
  await page.goto('/studio')
  await waitForAppReady(page)
  await page.waitForTimeout(1000)
  const tasksSection = page
    .locator('h2')
    .filter({ hasText: 'Task & Chore Templates' })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "mb-8")]')
  const accordion = tasksSection.locator('button').filter({ hasText: /Example Templates \(/ }).first()
  if (await accordion.isVisible().catch(() => false)) {
    await accordion.click().catch(() => {})
    await page.waitForTimeout(500)
  }
  const boardCard = tasksSection.locator('div.snap-start').filter({ hasText: 'Extra House Jobs Board' }).first()
  await boardCard.scrollIntoViewIfNeeded().catch(() => {})
  await boardCard.click().catch(() => {})
  await page.waitForTimeout(500)
  await boardCard.getByRole('button', { name: /use as-is/i }).first().click({ force: true }).catch(() => {})
  await page.waitForTimeout(1500)
  // Use-as-is opens at the sharing step; expand "Specific people" for pills
  const dialog = page.locator('[role="dialog"]').first()
  await dialog.getByText('Specific people').click().catch(() => {})
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT_DIR, 'sta-mobile-2-board-sharing-step.png') })
})
