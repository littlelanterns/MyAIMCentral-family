/**
 * GDCX — Guided Dashboard Completion — EYES-ON TOUR (manual helper, NOT a
 * regression test).
 *
 * Convention #277: Claude performs Mom-UI visual verification via Playwright
 * screenshots + reading them directly, rather than relying on pass/fail
 * assertions alone. Drives Jordan's Guided dashboard through the surfaces
 * this build touched, at desktop and mobile viewports (the mobile pass is
 * the explicit "mobile-behavior check on the Guided nav" the pack called for
 * — a 6th rendered item (5 tabs + More) needed room on a 375px screen).
 *
 * Run with:
 *   $env:EYES_ON_TOUR='1'; npx playwright test tests/e2e/features/gdcx-eyes-on-tour.spec.ts
 *
 * Gated behind EYES_ON_TOUR so it NEVER runs as part of the normal suite.
 */
import { test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsJordan } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

test.skip(!process.env.EYES_ON_TOUR, 'Manual eyes-on tour — set EYES_ON_TOUR=1 to run')

const admin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// Gitignored, survives Playwright's test-results/ wipes between runs.
const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')

async function shot(page: import('@playwright/test').Page, name: string) {
  fs.mkdirSync(SHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
}

test.describe('GDCX eyes-on tour', () => {
  test.describe.configure({ mode: 'serial' })
  test.slow()

  let jordanId = ''
  let originalPersonalPrefs: Record<string, unknown> = {}

  test.beforeAll(async () => {
    const { data: family } = await admin
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    const { data: jordan } = await admin
      .from('family_members')
      .select('id')
      .eq('family_id', family!.id)
      .eq('display_name', 'Jordan')
      .single()
    jordanId = jordan!.id

    const { data: config } = await admin
      .from('dashboard_configs')
      .select('preferences')
      .eq('family_member_id', jordanId)
      .eq('dashboard_type', 'personal')
      .single()
    originalPersonalPrefs = (config?.preferences as Record<string, unknown>) ?? {}

    await admin
      .from('dashboard_configs')
      .update({ preferences: { ...originalPersonalPrefs, reflections_in_celebration: true, reflection_daily_count: 1 } })
      .eq('family_member_id', jordanId)
      .eq('dashboard_type', 'personal')
  })

  test.afterAll(async () => {
    await admin
      .from('dashboard_configs')
      .update({ preferences: originalPersonalPrefs })
      .eq('family_member_id', jordanId)
      .eq('dashboard_type', 'personal')
  })

  test('Stop 1-2 — Guided dashboard: desktop + mobile (NBT card, 5-tab bottom nav)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsJordan(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)
    // NBT fetches (tasks/intentions/family-today) resolve asynchronously —
    // wait for its actual content (not the pulsing skeleton) before shooting.
    await page.getByText(/Do This|Something Else|Nothing on the list right now/i).first().waitFor({ timeout: 15000 })
    await shot(page, 'gdcx-01-dashboard-desktop')

    await page.setViewportSize({ width: 375, height: 812 })
    await page.reload()
    await waitForAppReady(page)
    await page.getByText(/Do This|Something Else|Nothing on the list right now/i).first().waitFor({ timeout: 15000 })
    await shot(page, 'gdcx-02-dashboard-mobile')

    // Scroll the mobile bottom nav fully into view for a clean crop of the
    // 5-tab layout (the mobile-behavior check the pack called for).
    await page.locator('nav').last().scrollIntoViewIfNeeded()
    await shot(page, 'gdcx-02b-bottomnav-mobile')
  })

  test('Stop 3 — DailyCelebration: Reflections step (2.5) at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAsJordan(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await page.getByRole('button', { name: /Celebrate!/i }).click()
    await page.getByText(/Look what you did|Every day is a new chance/i).first().waitFor({ timeout: 12000 })
    await page.getByTestId('celebration-next-button').click()
    await page.getByText(/Let.s think about your day for a moment/i).first().waitFor({ timeout: 10000 })
    // Wait past the "Loading..." state for the actual prompt card (or its
    // empty-state copy) before shooting.
    await page.getByText('Loading...').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {})
    await shot(page, 'gdcx-03-celebration-reflections-mobile')

    await page.getByRole('button', { name: 'Skip', exact: true }).click()
    await page.getByText(/day streak!|You're here today!/i).first().waitFor({ timeout: 10000 })
    await shot(page, 'gdcx-04-celebration-streak-mobile')
  })
})
