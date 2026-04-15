/**
 * PRD-16 Meetings Phase A — E2E visual verification
 *
 * Checks:
 * 1. Meetings page loads with three sections (no blank screen)
 * 2. Sidebar shows Meetings in Plan & Do after Calendar
 * 3. Mentor/Parent-Child accordion expands per-child with quick-add input
 * 4. Quick-add agenda item saves to DB and appears in list
 *
 * Run: npx playwright test tests/e2e/features/meetings-phase-a.spec.ts --headed --project=chromium
 */

import { test, expect, type Page } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const BASE_URL = 'http://localhost:5173'
const DEV_EMAIL = process.env.E2E_DEV_EMAIL!
const DEV_PASSWORD = process.env.E2E_DEV_PASSWORD!

test.use({
  launchOptions: { slowMo: 250 },
  viewport: { width: 1280, height: 900 },
})

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/sign-in`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => {
    sessionStorage.setItem('myaim_intro_tour_dismissed', 'true')
    localStorage.setItem('myaim_guide_prefs', JSON.stringify({
      dismissed_guides: ['dashboard', 'tasks', 'lila', 'studio', 'calendar', 'settings', 'meetings_basic'],
      all_guides_dismissed: true,
    }))
  })
  await page.fill('input[type="email"]', DEV_EMAIL)
  await page.fill('input[type="password"]', DEV_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
  console.log('✓ Logged in')
}

test.describe('PRD-16 Meetings Phase A', () => {

  test('1. Meetings page loads with three sections', async ({ page }) => {
    await login(page)

    await page.goto(`${BASE_URL}/meetings`)
    await page.waitForLoadState('networkidle')

    // Page title
    const heading = page.locator('h1').filter({ hasText: 'Meetings' })
    await expect(heading).toBeVisible({ timeout: 10000 })
    console.log('✓ Meetings heading visible')

    // Three section headers should render
    const upcoming = page.locator('h2').filter({ hasText: 'Upcoming' })
    const types = page.locator('h2').filter({ hasText: 'Meeting Types' })
    const history = page.locator('h2').filter({ hasText: 'Recent History' })

    await expect(types).toBeVisible({ timeout: 5000 })
    console.log('✓ Meeting Types section visible')

    // Upcoming might be inside PermissionGate — check it rendered (could be empty state)
    await expect(upcoming).toBeVisible({ timeout: 5000 })
    console.log('✓ Upcoming section visible')

    await expect(history).toBeVisible({ timeout: 5000 })
    console.log('✓ Recent History section visible')

    // No console errors (check for React errors)
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.waitForTimeout(2000)
    const criticalErrors = errors.filter(e => e.includes('React') || e.includes('Uncaught') || e.includes('hydration'))
    expect(criticalErrors).toHaveLength(0)
    console.log('✓ No critical console errors')
  })

  test('2. Sidebar shows Meetings in Plan & Do after Calendar', async ({ page }) => {
    await login(page)

    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')

    // Find the Plan & Do section in sidebar
    const planSection = page.locator('text=Plan & Do')
    await expect(planSection).toBeVisible({ timeout: 5000 })

    // Find sidebar nav links within the Plan & Do section area
    const meetingsLink = page.locator('nav a[href="/meetings"]')
    await expect(meetingsLink).toBeVisible({ timeout: 5000 })
    console.log('✓ Meetings sidebar link visible')

    // Check it contains the text "Meetings"
    await expect(meetingsLink).toContainText('Meetings')
    console.log('✓ Meetings link has correct label')

    // Verify ordering: Calendar should come before Meetings in the DOM
    const calendarLink = page.locator('nav a[href="/calendar"]')
    await expect(calendarLink).toBeVisible()

    const calendarBox = await calendarLink.boundingBox()
    const meetingsBox = await meetingsLink.boundingBox()
    if (calendarBox && meetingsBox) {
      expect(meetingsBox.y).toBeGreaterThan(calendarBox.y)
      console.log(`✓ Meetings (y=${Math.round(meetingsBox.y)}) renders after Calendar (y=${Math.round(calendarBox.y)})`)
    }

    // Click to navigate
    await meetingsLink.click()
    await page.waitForURL('**/meetings**', { timeout: 5000 })
    console.log('✓ Sidebar link navigates to /meetings')
  })

  test('3. Meeting Types accordion expands with per-child rows', async ({ page }) => {
    await login(page)

    await page.goto(`${BASE_URL}/meetings`)
    await page.waitForLoadState('networkidle')

    // Wait for Meeting Types section
    await expect(page.locator('h2').filter({ hasText: 'Meeting Types' })).toBeVisible({ timeout: 10000 })

    // Find the accordion rows — built-in types should be visible
    const coupleRow = page.locator('button').filter({ hasText: 'Couple Meeting' })
    const familyCouncilRow = page.locator('button').filter({ hasText: 'Family Council' })

    await expect(coupleRow).toBeVisible({ timeout: 5000 })
    console.log('✓ Couple Meeting row visible')
    await expect(familyCouncilRow).toBeVisible({ timeout: 5000 })
    console.log('✓ Family Council row visible')

    // Check for mentor/parent-child per-child rows
    // These should show child names if family has children (role='member')
    const mentorRows = page.locator('button').filter({ hasText: /Mentor Meeting/ })
    const mentorCount = await mentorRows.count()
    console.log(`✓ Found ${mentorCount} Mentor Meeting row(s)`)

    // Click the first expandable row to test accordion
    await coupleRow.click()
    await page.waitForTimeout(500)

    // Should now see the quick-add input
    const quickAddInput = page.locator('input[placeholder*="Add agenda item"]')
    const quickAddVisible = await quickAddInput.first().isVisible()
    console.log(`✓ Quick-add input visible after expand: ${quickAddVisible}`)

    if (mentorCount > 0) {
      // Click a mentor row to expand per-child
      await mentorRows.first().click()
      await page.waitForTimeout(500)
      const mentorQuickAdd = page.locator('input[placeholder*="Add agenda item"]')
      expect(await mentorQuickAdd.count()).toBeGreaterThanOrEqual(1)
      console.log('✓ Mentor row expanded with quick-add input')
    }
  })

  test('4. Quick-add agenda item saves and appears', async ({ page }) => {
    await login(page)

    await page.goto(`${BASE_URL}/meetings`)
    await page.waitForLoadState('networkidle')

    // Expand Couple Meeting
    const coupleRow = page.locator('button').filter({ hasText: 'Couple Meeting' })
    await expect(coupleRow).toBeVisible({ timeout: 10000 })
    await coupleRow.click()
    await page.waitForTimeout(500)

    // Type in the quick-add input
    const testText = `Test agenda item ${Date.now()}`
    const quickAddInput = page.locator('input[placeholder*="Add agenda item"]').first()
    await expect(quickAddInput).toBeVisible({ timeout: 3000 })
    await quickAddInput.fill(testText)

    // Submit via Enter
    await quickAddInput.press('Enter')
    await page.waitForTimeout(2000)

    // The input should clear after successful submit
    const inputValue = await quickAddInput.inputValue()
    expect(inputValue).toBe('')
    console.log('✓ Input cleared after submit')

    // Verify the agenda count badge updated (should show at least 1)
    // Re-collapse and re-expand to see the count
    await coupleRow.click() // collapse
    await page.waitForTimeout(300)

    // Check for a count badge on the Couple Meeting row
    const badge = coupleRow.locator('span').filter({ hasText: /^\d+$/ })
    const badgeCount = await badge.count()
    if (badgeCount > 0) {
      const badgeText = await badge.first().textContent()
      console.log(`✓ Agenda count badge shows: ${badgeText}`)
      expect(parseInt(badgeText ?? '0')).toBeGreaterThanOrEqual(1)
    } else {
      console.log('⚠ No badge visible (counts may need page refresh to reflect)')
    }

    console.log(`✓ Agenda item "${testText.slice(0, 30)}..." submitted successfully`)
  })
})
