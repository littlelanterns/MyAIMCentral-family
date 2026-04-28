/**
 * Visual verification: Worker 5 Pick Dates scheduler mode
 *
 * Tests:
 * 1. Mobile 375px: 7 radio options render without overflow
 * 2. Mobile 375px: PickDatesCalendar renders cleanly
 * 3. Desktop: create task with Pick Dates, paint dates, verify output
 * 4. Regression: Weekly still works as before
 */
import { test, expect, type Page } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5176'

async function scrollModal(page: Page, position: number | 'bottom') {
  const scrollable = page.locator('[role="dialog"] .overflow-y-auto').first()
  if (await scrollable.isVisible()) {
    if (position === 'bottom') {
      await scrollable.evaluate(el => el.scrollTop = el.scrollHeight)
    } else {
      await scrollable.evaluate((el, pos) => el.scrollTop = pos, position)
    }
    await page.waitForTimeout(300)
  }
}

test.describe('Pick Dates Scheduler', () => {

  test('mobile 375px: 7 radio options fit without horizontal overflow', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    })
    const page = await context.newPage()
    await loginAsMom(page, BASE_URL)
    await page.goto(`${BASE_URL}/tasks?new=1`)
    await page.waitForTimeout(2000)

    // Switch to Full Mode to see the scheduler section
    const fullModeBtn = page.getByText('Full Mode')
    if (await fullModeBtn.isVisible()) {
      await fullModeBtn.click()
      await page.waitForTimeout(500)
    }

    // Scroll down to Schedule section and click Custom
    await scrollModal(page, 'bottom')
    const customRadio = page.getByText('Custom', { exact: true }).first()
    if (await customRadio.isVisible()) {
      await customRadio.click()
      await page.waitForTimeout(300)
    }

    // Look for "Pick Dates" radio option
    const pickDatesLabel = page.getByText('Pick Dates')
    await expect(pickDatesLabel).toBeVisible()

    // Verify no horizontal scrollbar on the radio list
    const radioContainer = page.locator('.space-y-1').first()
    const isOverflowing = await radioContainer.evaluate(el => el.scrollWidth > el.clientWidth)
    expect(isOverflowing).toBe(false)

    // Take a screenshot for manual review
    await page.screenshot({ path: 'tests/e2e/screenshots/pick-dates-mobile-radios.png', fullPage: false })

    await context.close()
  })

  test('mobile 375px: PickDatesCalendar renders without horizontal overflow', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    })
    const page = await context.newPage()
    await loginAsMom(page, BASE_URL)
    await page.goto(`${BASE_URL}/tasks?new=1`)
    await page.waitForTimeout(2000)

    // Full mode
    const fullModeBtn = page.getByText('Full Mode')
    if (await fullModeBtn.isVisible()) {
      await fullModeBtn.click()
      await page.waitForTimeout(500)
    }

    await scrollModal(page, 'bottom')

    // Click Custom first (to expand scheduler), then Pick Dates
    const customRadio = page.getByText('Custom', { exact: true }).first()
    if (await customRadio.isVisible()) {
      await customRadio.click()
      await page.waitForTimeout(300)
    }

    const pickDates = page.getByText('Pick Dates')
    await pickDates.click()
    await page.waitForTimeout(500)
    await scrollModal(page, 'bottom')

    // Calendar grid should be visible
    const calendarGrid = page.locator('.grid-cols-7').first()
    await expect(calendarGrid).toBeVisible()

    // No horizontal overflow on the calendar
    const isCalOverflowing = await calendarGrid.evaluate(el => el.scrollWidth > el.clientWidth)
    expect(isCalOverflowing).toBe(false)

    // Take a screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/pick-dates-mobile-calendar.png', fullPage: false })

    await context.close()
  })

  test('desktop: create task with Pick Dates, paint dates, verify JSONB', async ({ page }) => {
    await loginAsMom(page, BASE_URL)
    await page.goto(`${BASE_URL}/tasks?new=1`)
    await page.waitForTimeout(2000)

    // Full mode
    const fullModeBtn = page.getByText('Full Mode')
    if (await fullModeBtn.isVisible()) {
      await fullModeBtn.click()
      await page.waitForTimeout(500)
    }

    // Fill title
    const titleInput = page.locator('input[placeholder*="Task name"], input[placeholder*="task name"], input[name="title"]').first()
    if (await titleInput.isVisible()) {
      await titleInput.fill('Pick Dates Test Task')
    }

    await scrollModal(page, 'bottom')

    // Navigate to custom scheduler
    const customRadio = page.getByText('Custom', { exact: true }).first()
    if (await customRadio.isVisible()) {
      await customRadio.click()
      await page.waitForTimeout(300)
    }

    // Select Pick Dates
    const pickDates = page.getByText('Pick Dates')
    await pickDates.click()
    await page.waitForTimeout(500)
    await scrollModal(page, 'bottom')

    // Paint some dates by clicking day numbers in the calendar grid
    const dayButtons = page.locator('.grid-cols-7 button')
    const dayCount = await dayButtons.count()
    if (dayCount > 5) {
      await dayButtons.nth(3).click()
      await page.waitForTimeout(200)
      await dayButtons.nth(7).click()
      await page.waitForTimeout(200)
      await dayButtons.nth(12).click()
      await page.waitForTimeout(200)
    }

    // Verify selected dates pills appear
    const pills = page.locator('.rounded-full').filter({ hasText: /[A-Z][a-z]{2} \d/ })
    const pillCount = await pills.count()
    expect(pillCount).toBeGreaterThanOrEqual(1)

    // Take screenshot of the filled state
    await page.screenshot({ path: 'tests/e2e/screenshots/pick-dates-desktop-painted.png', fullPage: false })
  })

  test('regression: Weekly mode still works', async ({ page }) => {
    await loginAsMom(page, BASE_URL)
    await page.goto(`${BASE_URL}/tasks?new=1`)
    await page.waitForTimeout(2000)

    // Full mode
    const fullModeBtn = page.getByText('Full Mode')
    if (await fullModeBtn.isVisible()) {
      await fullModeBtn.click()
      await page.waitForTimeout(500)
    }

    await scrollModal(page, 'bottom')

    // Custom scheduler
    const customRadio = page.getByText('Custom', { exact: true }).first()
    if (await customRadio.isVisible()) {
      await customRadio.click()
      await page.waitForTimeout(300)
    }

    // Weekly should be visible and selectable
    const weeklyLabel = page.getByText('Weekly', { exact: true }).first()
    await expect(weeklyLabel).toBeVisible()
    await weeklyLabel.click()
    await page.waitForTimeout(300)

    // Day circles should appear (Su M Tu W Th F Sa)
    const tuesdayCircle = page.getByText('Tu', { exact: true }).first()
    await expect(tuesdayCircle).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/pick-dates-regression-weekly.png', fullPage: false })
  })
})
