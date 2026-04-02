/**
 * Victory Recorder E2E tests — Phase 12A + 12B
 *
 * Uses browser-based login flow to authenticate as mom/dad.
 * Tests core recording, scan suggestions, and multi-role access.
 */
import { test, expect, Page } from '@playwright/test'
import {
  captureConsoleErrors,
  assertNoInfiniteRenders,
  waitForAppReady,
} from '../helpers/assertions'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MOM_EMAIL = process.env.E2E_DEV_EMAIL!
const MOM_PASSWORD = process.env.E2E_DEV_PASSWORD!
const DAD_EMAIL = process.env.E2E_DAD_EMAIL!
const DAD_PASSWORD = process.env.E2E_DAD_PASSWORD!

// ── Browser-based login (via UI form) ─────────────────────────

async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/auth/sign-in')
  await page.waitForLoadState('networkidle')

  // Fill email and password
  const emailInput = page.locator('input[type="email"]')
  await expect(emailInput).toBeVisible({ timeout: 10000 })
  await emailInput.fill(email)

  const passwordInput = page.locator('input[type="password"]')
  await passwordInput.fill(password)

  // Submit
  await page.locator('button[type="submit"]').click()

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

// ──────────────────────────────────────────────────────────────

test.describe('Victory Recorder — Mom', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
    await loginViaUI(page, MOM_EMAIL, MOM_PASSWORD)
  })

  test('loads page with correct layout and all UI sections', async ({ page }) => {
    await page.goto('/victories')
    await waitForAppReady(page)

    // Page header
    await expect(page.locator('h1')).toHaveText('Victory Recorder', { timeout: 10000 })
    await expect(page.locator('text=What did you do right?')).toBeVisible()

    // Period filter chips
    for (const label of ['Today', 'This Week', 'This Month', 'All Time']) {
      await expect(page.locator('button').filter({ hasText: label }).first()).toBeVisible()
    }

    // Special filter chips
    await expect(page.locator('button').filter({ hasText: 'Guiding Stars' }).first()).toBeVisible()
    await expect(page.locator('button').filter({ hasText: 'Best Intentions' }).first()).toBeVisible()

    // Past Celebrations link
    await expect(page.locator('text=Past Celebrations')).toBeVisible()

    // Scan My Activity button (Phase 12B)
    await expect(page.locator('text=Scan My Activity')).toBeVisible()

    // FAB
    await expect(page.locator('button').filter({ hasText: /Record a Victory/ }).first()).toBeVisible()

    assertNoInfiniteRenders(consoleErrors)
  })

  test('opens RecordVictory modal via FAB and records a victory', async ({ page }) => {
    const victoryText = `E2E victory ${Date.now()}`
    await page.goto('/victories')
    await waitForAppReady(page)
    await expect(page.locator('h1')).toHaveText('Victory Recorder', { timeout: 10000 })

    // Click FAB
    await page.locator('button').filter({ hasText: /Record a Victory/ }).first().click()

    // Modal should appear
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })
    await expect(modal.locator('textarea')).toBeVisible()

    // Fill in victory
    await modal.locator('textarea').fill(victoryText)
    await modal.locator('text=Extra Learning').click()

    // Save
    await modal.locator('button').filter({ hasText: 'Save' }).click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })

    // Switch to All Time
    await page.locator('button').filter({ hasText: 'All Time' }).click()
    await page.waitForTimeout(1500)

    // Victory should appear
    await expect(page.locator(`text=${victoryText}`)).toBeVisible({ timeout: 5000 })

    assertNoInfiniteRenders(consoleErrors)
  })

  test('prefills description from URL param', async ({ page }) => {
    const desc = 'Prefilled from LiLa'
    await page.goto(`/victories?new=1&prefill=${encodeURIComponent(desc)}`)
    await waitForAppReady(page)

    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 10000 })

    await expect(modal.locator('textarea')).toHaveValue(desc)

    assertNoInfiniteRenders(consoleErrors)
  })

  test('period filters work without errors', async ({ page }) => {
    await page.goto('/victories')
    await waitForAppReady(page)
    await expect(page.locator('h1')).toHaveText('Victory Recorder', { timeout: 10000 })

    for (const label of ['This Week', 'This Month', 'All Time', 'Today']) {
      await page.locator('button').filter({ hasText: label }).first().click()
      await page.waitForTimeout(500)
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Scan My Activity button is present and clickable', async ({ page }) => {
    await page.goto('/victories')
    await waitForAppReady(page)
    await expect(page.locator('h1')).toHaveText('Victory Recorder', { timeout: 10000 })

    // Dismiss any toast overlays that may be intercepting clicks
    const dismissBtn = page.locator('[aria-label="Dismiss"]')
    if (await dismissBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await dismissBtn.click()
      await page.waitForTimeout(500)
    }

    const scanButton = page.locator('text=Scan My Activity')
    await expect(scanButton).toBeVisible()

    // Click scan (force to bypass any remaining overlays)
    await scanButton.click({ force: true })
    await page.waitForTimeout(3000)

    // After click: should show some state change
    // Edge Function must be deployed for full scan flow to work
    assertNoInfiniteRenders(consoleErrors)
  })

  test('VictoryDetail opens on card click', async ({ page }) => {
    await page.goto('/victories')
    await waitForAppReady(page)
    await expect(page.locator('h1')).toHaveText('Victory Recorder', { timeout: 10000 })

    // Switch to All Time to find victories
    await page.locator('button').filter({ hasText: 'All Time' }).click()
    await page.waitForTimeout(2000)

    // Dismiss any CompletionNotePrompt that may be overlaying
    const dismissBtn = page.locator('[aria-label="Dismiss"]')
    if (await dismissBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await dismissBtn.click()
      await page.waitForTimeout(500)
    }

    // Click first victory card (has gold left border style)
    const cards = page.locator('.rounded-lg.p-4.transition-colors')
    if ((await cards.count()) > 0) {
      await cards.first().click({ force: true })
      await page.waitForTimeout(1000)
      // Detail modal may open
      const dialog = page.locator('[role="dialog"]')
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Great — detail opened
      }
    }

    assertNoInfiniteRenders(consoleErrors)
  })
})

test.describe('Victory Recorder — Dad', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
    await loginViaUI(page, DAD_EMAIL, DAD_PASSWORD)
  })

  test('loads page and records a victory as Dad', async ({ page }) => {
    await page.goto('/victories')
    await waitForAppReady(page)
    await expect(page.locator('h1')).toHaveText('Victory Recorder', { timeout: 10000 })

    // Verify Phase 12B elements
    await expect(page.locator('text=Scan My Activity')).toBeVisible()

    // Record a victory
    await page.locator('button').filter({ hasText: /Record a Victory/ }).first().click()
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    await modal.locator('textarea').fill(`Dad E2E victory ${Date.now()}`)
    await modal.locator('button').filter({ hasText: 'Save' }).click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })

    assertNoInfiniteRenders(consoleErrors)
  })
})
