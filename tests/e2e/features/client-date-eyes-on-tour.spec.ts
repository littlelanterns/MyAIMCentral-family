/**
 * CLIENT-DATE-REMEDIATION EYES-ON TOUR
 *
 * Visual verification of the 4 remediation surfaces per Convention #277.
 * - Tracker widgets record + immediately show today's entry (evening-hour class)
 * - Guided dashboard streak/points display (W4 surface)
 * - Play dashboard task tiles (R3 surface) + streak display
 * - Practice log daily tally (W1 dual-write surface)
 *
 * Triggered by the post-build retroactive verification worker (Haiku, Convention #277).
 *
 * Run with:
 *   $env:EYES_ON_TOUR='1'; npx playwright test tests/e2e/features/client-date-eyes-on-tour.spec.ts
 */
import { test, expect } from '@playwright/test'
import { loginAsMom, loginAsJordan, loginAsRiley, loginAsCasey } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

test.skip(!process.env.EYES_ON_TOUR, 'Manual eyes-on tour — set EYES_ON_TOUR=1 to run')

// Screenshots saved to repo-root eyes-on-tour/ (gitignored, survives Playwright wipes)
const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')

async function shot(page: import('@playwright/test').Page, name: string) {
  fs.mkdirSync(SHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
}

/** Linger so founder can observe when watching live */
async function linger(page: import('@playwright/test').Page, ms = 2000) {
  await page.waitForTimeout(ms)
}

test.use({ launchOptions: { slowMo: 300 }, viewport: { width: 1440, height: 900 } })

test.describe('Eyes-on tour — CLIENT-DATE-REMEDIATION mom-UI verification', () => {
  test.describe.configure({ timeout: 120_000, retries: 1 })

  // ── Stop 1: Mom dashboard — tracker widget record + immediate render ────────
  test('Stop 1 — Mom dashboard (desktop, tablet, mobile): tracker widget record/display', async ({
    page,
  }) => {
    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Desktop: full page screenshot of dashboard with tracker widgets
    await shot(page, 'cd-01-mom-dashboard-desktop')
    await linger(page)

    // Look for a recordable tracker widget (Streak Tracker, Habit Grid, etc.)
    // If visible, tap the record/increment button once to trigger the recording
    const recordButtons = await page.getByRole('button').filter({ hasText: /record|add|increment|log|\+/i })
    const firstRecord = recordButtons.first()
    const isVisible = await firstRecord.isVisible().catch(() => false)

    if (isVisible) {
      await firstRecord.click()
      await page.waitForTimeout(1000) // Wait for the UI to update
      await shot(page, 'cd-04-tracker-after-tap')
      await linger(page)
    }

    // Tablet: 768x1024
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500) // Layout shift
    await shot(page, 'cd-02-mom-dashboard-tablet')
    await linger(page)

    // Mobile: 375x812
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(500)
    await shot(page, 'cd-03-mom-dashboard-mobile')
    await linger(page)
  })

  // ── Stop 2: Guided dashboard (Jordan) — streak/points rendering ─────────────
  test('Stop 2 — Guided dashboard: Jordan (desktop/mobile) streak & points display', async ({
    page,
  }) => {
    // Reset to desktop for this stop
    await page.setViewportSize({ width: 1440, height: 900 })

    await loginAsJordan(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Guided dashboard should render
    await expect(page.getByText(/dashboard|home|tasks/i).first()).toBeVisible({ timeout: 15000 })
    await shot(page, 'cd-05-jordan-guided-dashboard-desktop')
    await linger(page)

    // Mobile view
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(500)
    await shot(page, 'cd-06-jordan-guided-dashboard-mobile')
    await linger(page)
  })

  // ── Stop 3: Play dashboard (Riley) — task tiles + streak display ───────────
  test('Stop 3 — Play dashboard: Riley task tiles & streak display', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })

    await loginAsRiley(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Play dashboard should render with task tiles and streak
    await shot(page, 'cd-07-riley-play-dashboard-desktop')
    await linger(page)

    // Mobile view
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(500)
    await shot(page, 'cd-07b-riley-play-dashboard-mobile')
    await linger(page)
  })

  // ── Stop 4: Streak rendering (live hook, not frozen column) ────────────────
  test('Stop 4 — Streak display (useMemberStreak hook, not frozen column)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })

    // Login as Casey to check their streak on /my-rewards or dashboard
    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)

    // Screenshot showing streak rendering
    await expect(page.getByText(/streak|points|reward/i).first()).toBeVisible({ timeout: 15000 })
    await shot(page, 'cd-08-casey-streak-surface')
    await linger(page)
  })
})
