/**
 * TEEN-CRED — eyes-on tour (Convention #277).
 *
 * MANUAL TOUR HELPER, NOT A REGRESSION TEST. Gated behind EYES_ON_TOUR=1.
 * Captures the new "Set Login" peer action + SetLoginModal (create state,
 * username availability feedback, reset state, success screen) at desktop
 * and mobile viewports, plus the widened /auth/sign-in field.
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

test.describe.configure({ timeout: 120_000 })

for (const [label, viewport] of Object.entries({
  desktop: { width: 1440, height: 900 },
  mobile: { width: 375, height: 812 },
})) {
  test(`TEEN-CRED ${label} shots: Set Login peer action + modal`, async ({ browser }) => {
    fs.mkdirSync(OUT_DIR, { recursive: true })
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    await loginAsMom(page)
    await page.goto('/family-members')
    await waitForAppReady(page)
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(OUT_DIR, `teencred-${label}-1-member-list.png`), fullPage: true })

    // Open Set Login for the first non-mom member row
    const loginButton = page.locator('button[title="Set Login"]').first()
    await loginButton.scrollIntoViewIfNeeded().catch(() => {})
    await loginButton.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(OUT_DIR, `teencred-${label}-2-modal-email-mode.png`) })

    // Switch to username mode, type a candidate, wait for the debounced
    // availability check to resolve
    await page.getByRole('button', { name: /username/i }).click()
    await page.locator('input[placeholder*="ruthie2026"]').fill('teencredtourshot')
    await page.waitForTimeout(1200)
    await page.screenshot({ path: path.join(OUT_DIR, `teencred-${label}-3-username-availability.png`) })

    await page.keyboard.press('Escape').catch(() => {})
    await context.close()
  })
}
