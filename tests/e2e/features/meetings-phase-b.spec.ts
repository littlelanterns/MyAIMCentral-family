/**
 * PRD-16 Meetings Phase B — E2E visual verification
 *
 * Checks:
 * 1. Schedule Editor modal opens from calendar icon with UniversalScheduler
 * 2. Agenda Section Editor opens from settings icon with built-in sections
 * 3. Section editor supports drag-to-reorder and custom section add
 * 4. Custom Template Creator modal opens and creates a new template
 *
 * Run: npx playwright test tests/e2e/features/meetings-phase-b.spec.ts --headed --project=chromium
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

test.describe('PRD-16 Meetings Phase B', () => {

  test('1. Schedule Editor modal opens from calendar icon', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/meetings`)
    await page.waitForLoadState('networkidle')

    // Wait for Meeting Types section
    await expect(page.locator('h2').filter({ hasText: 'Meeting Types' })).toBeVisible({ timeout: 10000 })

    // Find a calendar icon button on the Couple Meeting row and click it
    // The row contains both the accordion button and the icon buttons
    const coupleRow = page.locator('button').filter({ hasText: 'Couple Meeting' })
    await expect(coupleRow).toBeVisible({ timeout: 5000 })

    // The calendar icon is within the same container but outside the accordion button
    const calendarBtn = coupleRow.locator('button[title="Schedule"]')
    await expect(calendarBtn).toBeVisible({ timeout: 3000 })
    await expect(calendarBtn).toBeEnabled()
    console.log('✓ Schedule button is visible and enabled')

    await calendarBtn.click()
    await page.waitForTimeout(1000)

    // Modal should open with "Schedule:" in the title
    const modal = page.locator('[role="dialog"]').filter({ hasText: 'Schedule:' })
    await expect(modal).toBeVisible({ timeout: 5000 })
    console.log('✓ Schedule Editor modal opened')

    // Should contain the Universal Scheduler (look for the "How Often?" radio buttons)
    const weeklyOption = modal.locator('text=Weekly')
    await expect(weeklyOption).toBeVisible({ timeout: 3000 })
    console.log('✓ Universal Scheduler visible with Weekly option')

    // Check for the calendar integration checkbox
    const calCheckbox = modal.locator('text=Create calendar events automatically')
    await expect(calCheckbox).toBeVisible({ timeout: 3000 })
    console.log('✓ Calendar integration checkbox visible')

    // Check for Save button
    const saveBtn = modal.locator('button').filter({ hasText: /Save Schedule|Update Schedule/ })
    await expect(saveBtn).toBeVisible({ timeout: 3000 })
    console.log('✓ Save Schedule button visible')

    // Close modal
    const cancelBtn = modal.locator('button').filter({ hasText: 'Cancel' })
    await cancelBtn.click()
    await page.waitForTimeout(500)
  })

  test('2. Agenda Section Editor opens with built-in sections', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/meetings`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h2').filter({ hasText: 'Meeting Types' })).toBeVisible({ timeout: 10000 })

    // Click settings icon on Couple Meeting
    const coupleRow = page.locator('button').filter({ hasText: 'Couple Meeting' })
    await expect(coupleRow).toBeVisible({ timeout: 5000 })

    const settingsBtn = coupleRow.locator('button[title="Agenda sections"]')
    await expect(settingsBtn).toBeVisible({ timeout: 3000 })
    await expect(settingsBtn).toBeEnabled()
    console.log('✓ Agenda sections button is visible and enabled')

    await settingsBtn.click()
    await page.waitForTimeout(2000) // Wait for modal open + auto-seed

    // Modal should open with "Agenda Sections:" in the title
    const modal = page.locator('[role="dialog"]').filter({ hasText: 'Agenda Sections:' })
    await expect(modal).toBeVisible({ timeout: 5000 })
    console.log('✓ Agenda Section Editor modal opened')

    // Built-in sections should be auto-seeded for couple meeting (6 sections)
    // Use .first() because prior test runs may have created duplicates
    const checkIn = modal.locator('p.font-medium').filter({ hasText: 'Check-In' }).first()
    await expect(checkIn).toBeVisible({ timeout: 5000 })
    console.log('✓ Check-In section auto-seeded')

    // Check that multiple sections exist (Appreciation may be off-screen)
    const sectionNames = modal.locator('p.font-medium')
    const sectionCount = await sectionNames.count()
    console.log(`✓ Found ${sectionCount} section name(s) in modal`)
    expect(sectionCount).toBeGreaterThanOrEqual(6) // Couple has 6 built-in sections

    // Check for drag handles (GripVertical icons) — at least some should exist
    const dragHandles = modal.locator('[class*="cursor-grab"]')
    const handleCount = await dragHandles.count()
    console.log(`✓ Found ${handleCount} drag handles`)
    expect(handleCount).toBeGreaterThanOrEqual(1)

    // Check for "Add Custom Section" button
    const addBtn = modal.locator('button').filter({ hasText: 'Add Custom Section' })
    await expect(addBtn).toBeVisible({ timeout: 3000 })
    console.log('✓ Add Custom Section button visible')

    // Close modal
    const closeBtn = modal.locator('button[aria-label="Close"]').or(modal.locator('button').filter({ hasText: '×' }))
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click()
    } else {
      await page.keyboard.press('Escape')
    }
    await page.waitForTimeout(500)
  })

  test('3. Section editor supports adding a custom section', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/meetings`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h2').filter({ hasText: 'Meeting Types' })).toBeVisible({ timeout: 10000 })

    // Open section editor for Family Council
    const fcRow = page.locator('button').filter({ hasText: 'Family Council' })
    await expect(fcRow).toBeVisible({ timeout: 5000 })
    const settingsBtn = fcRow.locator('button[title="Agenda sections"]')
    await settingsBtn.click()
    await page.waitForTimeout(2000)

    const modal = page.locator('[role="dialog"]').filter({ hasText: 'Agenda Sections:' })
    await expect(modal).toBeVisible({ timeout: 5000 })
    console.log('✓ Family Council section editor opened')

    // Wait for auto-seed to complete — look for any family council section
    await expect(modal.locator('p.font-medium').filter({ hasText: 'Opening' }).first()).toBeVisible({ timeout: 5000 })
    console.log('✓ Built-in sections seeded')

    // Click "Add Custom Section"
    const addBtn = modal.locator('button').filter({ hasText: 'Add Custom Section' })
    await addBtn.click()
    await page.waitForTimeout(500)

    // Fill in the form
    const nameInput = modal.locator('input[placeholder*="Action Items"]')
    await expect(nameInput).toBeVisible({ timeout: 3000 })
    await nameInput.fill('Weekly Goals Review')

    const promptInput = modal.locator('textarea')
    await promptInput.fill('Review the goals we set last week and discuss progress.')

    // Save
    const saveBtn = modal.locator('button').filter({ hasText: 'Save' })
    await saveBtn.click()
    await page.waitForTimeout(2000)

    // The new section should appear in the list (may need scrolling in the modal)
    const newSection = modal.locator('p.font-medium').filter({ hasText: 'Weekly Goals Review' }).first()
    await newSection.scrollIntoViewIfNeeded()
    await expect(newSection).toBeVisible({ timeout: 5000 })
    console.log('✓ Custom section "Weekly Goals Review" added successfully')

    // Close modal
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  })

  test('4. Custom Template Creator modal opens and creates a template', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/meetings`)
    await page.waitForLoadState('networkidle')

    // Find and click "Create Custom Meeting Type" button
    const createBtn = page.locator('button').filter({ hasText: 'Create Custom Meeting Type' })
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await expect(createBtn).toBeEnabled()
    console.log('✓ Create Custom Meeting Type button is visible and enabled')

    await createBtn.click()
    await page.waitForTimeout(1000)

    // Modal should open
    const modal = page.locator('[role="dialog"]').filter({ hasText: 'Create Custom Meeting Type' })
    await expect(modal).toBeVisible({ timeout: 5000 })
    console.log('✓ Custom Template Creator modal opened')

    // Check for required fields
    const nameInput = modal.locator('input[placeholder*="Monthly Business"]')
    await expect(nameInput).toBeVisible({ timeout: 3000 })
    console.log('✓ Meeting name input visible')

    // Check for participant type options
    const personalOpt = modal.locator('text=Personal')
    const twoPeopleOpt = modal.locator('text=Two People')
    const groupOpt = modal.locator('text=Group')
    await expect(personalOpt).toBeVisible({ timeout: 3000 })
    await expect(twoPeopleOpt).toBeVisible({ timeout: 3000 })
    await expect(groupOpt).toBeVisible({ timeout: 3000 })
    console.log('✓ All three participant type options visible')

    // Check for starting sections options
    const blankOpt = modal.locator('text=Start Blank')
    const copyOpt = modal.locator('text=Copy from Existing')
    await expect(blankOpt).toBeVisible({ timeout: 3000 })
    await expect(copyOpt).toBeVisible({ timeout: 3000 })
    console.log('✓ Section source options visible')

    // Fill in name and create
    const testName = `Business Review ${Date.now()}`
    await nameInput.fill(testName)

    // Select "Personal" type
    await personalOpt.click()
    await page.waitForTimeout(300)

    // Click Create
    const createTemplateBtn = modal.locator('button').filter({ hasText: 'Create Meeting Type' })
    await expect(createTemplateBtn).toBeEnabled({ timeout: 3000 })
    await createTemplateBtn.click()
    await page.waitForTimeout(2000)

    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 5000 })
    console.log('✓ Modal closed after creation')

    // The new template should appear in the Meeting Types section
    const newTemplate = page.locator('button').filter({ hasText: testName })
    await expect(newTemplate).toBeVisible({ timeout: 5000 })
    console.log(`✓ Custom template "${testName.slice(0, 30)}..." appears in Meeting Types`)
  })
})
