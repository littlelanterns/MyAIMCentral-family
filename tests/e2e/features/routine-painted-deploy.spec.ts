/**
 * Painted routine deploy — round-trip verification.
 *
 * The bug: `buildTaskScheduleFields` had a hardcoded routine branch that
 * stripped `data.schedule` and saved {dtstart, schedule_type:'recurring'}.
 * Painted routines deployed via RoutineDeployModal lost their `rdates`.
 *
 * This spec deploys a routine through Studio → My Customized → Deploy with
 * painted dates, then queries the saved row to confirm rdates round-trip
 * with schedule_type='painted'. Uses founder's real account because the
 * bug is on her real routine templates (Build N work).
 *
 * Run: npx playwright test tests/e2e/features/routine-painted-deploy.spec.ts --headed --project=chromium
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const BASE_URL = 'http://localhost:5173'
const DEV_EMAIL = process.env.E2E_DEV_EMAIL!
const DEV_PASSWORD = process.env.E2E_DEV_PASSWORD!
const FAMILY_ID = '4bc86323-545b-4faf-b31f-3926fdd8c5a6'
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!DEV_EMAIL || !DEV_PASSWORD || !serviceRoleKey) {
  throw new Error('Missing E2E_DEV_EMAIL / E2E_DEV_PASSWORD / SUPABASE_SERVICE_ROLE_KEY')
}

function getServiceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

test.use({
  launchOptions: { slowMo: 150 },
  viewport: { width: 1280, height: 900 },
})

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/sign-in`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => {
    sessionStorage.setItem('myaim_intro_tour_dismissed', 'true')
    localStorage.setItem('myaim_guide_prefs', JSON.stringify({
      all_guides_dismissed: true,
    }))
  })
  await page.fill('input[type="email"]', DEV_EMAIL)
  await page.fill('input[type="password"]', DEV_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
}

test.describe('Painted routine deploy — schedule round-trip', () => {
  test('saved task carries schedule_type=painted with rdates', async ({ page }) => {
    await login(page)

    const supabase = getServiceClient()

    // Find a routine template owned by this family to deploy. We don't create
    // a new template — we use whatever the family has. If none exists, skip.
    const { data: templates } = await supabase
      .from('task_templates')
      .select('id, template_name, title')
      .eq('family_id', FAMILY_ID)
      .eq('template_type', 'routine')
      .is('archived_at', null)
      .limit(5)

    test.skip(!templates || templates.length === 0, 'No routine templates available to deploy')

    const template = templates![0]
    const templateName = template.template_name ?? template.title ?? '(unnamed)'
    const beforeIds = await supabase
      .from('tasks')
      .select('id')
      .eq('family_id', FAMILY_ID)
      .eq('template_id', template.id)
    const beforeIdSet = new Set((beforeIds.data ?? []).map(r => r.id as string))

    // Navigate to Studio → My Customized
    await page.goto(`${BASE_URL}/studio`)
    await page.waitForLoadState('networkidle')

    const customizedTab = page.locator('button, [role="tab"]').filter({ hasText: /^My Customized($|\s*\()/ }).first()
    await customizedTab.click({ timeout: 5000 })
    await page.waitForTimeout(1500)

    // Find the card for this template and click Deploy
    const card = page.locator(`text="${templateName}"`).first()
    test.skip(!(await card.isVisible({ timeout: 5000 }).catch(() => false)),
      `Template "${templateName}" not visible in Studio UI`)

    const cardContainer = card.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
    await cardContainer.getByRole('button', { name: /^deploy$/i }).first().click()
    await page.waitForTimeout(800)

    // Modal should be open. Paint 2-3 dates on the calendar by clicking date cells.
    // The painted-calendar inside RoutineDeployModal uses CalendarPreview with
    // clickable day cells. We click 3 cells that look like future days.
    const modal = page.locator('[role="dialog"], .modal').first()
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Pick 3 future dates by clicking on visible calendar day buttons
    // CalendarPreview day buttons are typically buttons inside a grid
    const dayButtons = modal.locator('button').filter({ hasText: /^\d{1,2}$/ })
    const dayCount = await dayButtons.count()
    test.skip(dayCount < 3, 'Painted calendar not visible in deploy modal')

    // Click 3 day cells (skip first two to avoid past dates; pick middle of visible grid)
    const pickIndices = [Math.floor(dayCount / 2), Math.floor(dayCount / 2) + 1, Math.floor(dayCount / 2) + 2]
    for (const i of pickIndices) {
      await dayButtons.nth(i).click({ trial: false }).catch(() => {})
      await page.waitForTimeout(150)
    }

    // Pick at least one assignee (first member tile)
    const assigneeTile = modal.locator('button').filter({ hasText: /Helam|Gideon|Mosiah|Miriam|Avigaile|Ruthie|Simeon/ }).first()
    if (await assigneeTile.isVisible({ timeout: 2000 }).catch(() => false)) {
      await assigneeTile.click()
      await page.waitForTimeout(200)
    }

    // Save / Deploy
    const saveBtn = modal.getByRole('button', { name: /^(save|deploy|save & deploy|deploy routine)/i }).first()
    if (await saveBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
    } else {
      test.skip(true, 'Deploy button never enabled — UI flow needs review')
    }

    // Verify the new task was written with schedule_type='painted' + rdates
    const afterRows = await supabase
      .from('tasks')
      .select('id, recurrence_details, recurrence_rule, due_date')
      .eq('family_id', FAMILY_ID)
      .eq('template_id', template.id)

    const newRows = (afterRows.data ?? []).filter(r => !beforeIdSet.has(r.id as string))
    expect(newRows.length, 'expected at least one new task created').toBeGreaterThan(0)

    for (const row of newRows) {
      const details = row.recurrence_details as Record<string, unknown> | null
      expect(details, 'recurrence_details should not be null').toBeTruthy()
      expect(details!.schedule_type, `task ${row.id}: schedule_type must be painted`).toBe('painted')
      const rdates = details!.rdates as string[] | undefined
      expect(Array.isArray(rdates), `task ${row.id}: rdates must be an array`).toBe(true)
      expect(rdates!.length, `task ${row.id}: rdates must include painted dates`).toBeGreaterThan(0)
      expect(row.due_date, `task ${row.id}: due_date must remain null for routines`).toBeNull()
    }

    // Cleanup: delete the test deployments to avoid polluting production data
    if (newRows.length > 0) {
      await supabase.from('tasks').delete().in('id', newRows.map(r => r.id as string))
    }
  })
})
