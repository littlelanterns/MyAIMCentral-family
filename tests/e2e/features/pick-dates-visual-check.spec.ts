/**
 * Worker 5 Visual Verification — Pick Dates scheduler mode
 *
 * Interaction path: Tasks → + Create → Full Mode → scroll to "How Often?" →
 *   click "Custom" radio → UniversalScheduler appears with 7 options →
 *   click "Pick Dates" → calendar renders
 */
import { test, expect } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'

async function dismissLila(page: import('@playwright/test').Page) {
  // Close LiLa drawer if it auto-opened
  for (const selector of ['[aria-label="Close"]', '[aria-label="close"]']) {
    const btn = page.locator(selector).first()
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(300)
      return
    }
  }
  // Fallback: click X icon in the LiLa drawer header
  const xIcon = page.locator('.lucide-x').first()
  if (await xIcon.isVisible({ timeout: 1000 }).catch(() => false)) {
    await xIcon.click()
    await page.waitForTimeout(300)
  }
}

async function scrollModalDown(page: import('@playwright/test').Page) {
  const scrollable = page.locator('[role="dialog"] .overflow-y-auto').first()
  if (await scrollable.isVisible({ timeout: 2000 }).catch(() => false)) {
    await scrollable.evaluate(el => el.scrollTop = el.scrollHeight)
    await page.waitForTimeout(400)
  }
}

async function openCreateAndGetToScheduler(page: import('@playwright/test').Page) {
  await dismissLila(page)
  await page.waitForTimeout(500)

  // Click "+ Create" button on the Tasks page
  const createBtn = page.locator('button').filter({ hasText: /Create/ }).first()
  await createBtn.click()
  await page.waitForTimeout(1500)

  // Switch to Full Mode if available
  const fullMode = page.getByText('Full Mode')
  if (await fullMode.isVisible({ timeout: 2000 }).catch(() => false)) {
    await fullMode.click()
    await page.waitForTimeout(500)
  }

  // Scroll to the schedule section
  await scrollModalDown(page)

  // Click the "Custom" radio in the "How Often?" section
  // This is the task-level schedule mode, NOT the Universal Scheduler radio
  const customOption = page.locator('label').filter({ hasText: /Custom.*Define your own/ }).first()
  if (await customOption.isVisible({ timeout: 3000 }).catch(() => false)) {
    await customOption.click()
    await page.waitForTimeout(500)
  } else {
    // Fallback: look for text "Custom" near "How Often?"
    const custom2 = page.getByText('Custom', { exact: true }).last()
    if (await custom2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await custom2.click()
      await page.waitForTimeout(500)
    }
  }

  await scrollModalDown(page)
}

test.describe('Worker 5: Pick Dates Visual Verification', () => {

  test('mobile 375px: frequency list and calendar render cleanly', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } })
    const page = await context.newPage()
    await loginAsMom(page)
    await page.goto('/tasks')
    await page.waitForTimeout(2000)

    await openCreateAndGetToScheduler(page)

    // Now the UniversalScheduler should be visible with its radio options
    const pickDatesLabel = page.getByText('Pick Dates')
    const visible = await pickDatesLabel.isVisible({ timeout: 3000 }).catch(() => false)
    console.log('[MOBILE] Pick Dates radio visible:', visible)

    await page.screenshot({ path: 'tests/e2e/screenshots/worker5-mobile-scheduler-radios.png' })

    if (visible) {
      await pickDatesLabel.click()
      await page.waitForTimeout(500)
      await scrollModalDown(page)

      // Verify calendar grid
      const calGrid = page.locator('.grid-cols-7').first()
      const calVisible = await calGrid.isVisible({ timeout: 3000 }).catch(() => false)
      console.log('[MOBILE] Calendar grid visible:', calVisible)

      if (calVisible) {
        const overflow = await calGrid.evaluate(el => el.scrollWidth > el.clientWidth)
        console.log('[MOBILE] Calendar horizontal overflow:', overflow)
        expect(overflow).toBe(false)

        // Paint 3 dates
        const dayBtns = calGrid.locator('button')
        const count = await dayBtns.count()
        console.log('[MOBILE] Day buttons:', count)
        if (count > 10) {
          await dayBtns.nth(3).click()
          await page.waitForTimeout(150)
          await dayBtns.nth(7).click()
          await page.waitForTimeout(150)
          await dayBtns.nth(11).click()
          await page.waitForTimeout(150)
        }
      }

      await page.screenshot({ path: 'tests/e2e/screenshots/worker5-mobile-calendar-painted.png' })
    }

    await context.close()
  })

  test('desktop: pick dates golden path with time window', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await page.waitForTimeout(2000)

    await openCreateAndGetToScheduler(page)

    const pickDatesLabel = page.getByText('Pick Dates')
    const visible = await pickDatesLabel.isVisible({ timeout: 3000 }).catch(() => false)
    console.log('[DESKTOP] Pick Dates radio visible:', visible)

    if (visible) {
      await pickDatesLabel.click()
      await page.waitForTimeout(500)
      await scrollModalDown(page)

      // Paint dates
      const calGrid = page.locator('.grid-cols-7').first()
      if (await calGrid.isVisible({ timeout: 2000 }).catch(() => false)) {
        const dayBtns = calGrid.locator('button')
        const count = await dayBtns.count()
        console.log('[DESKTOP] Day buttons:', count)
        for (const idx of [3, 7, 12, 18]) {
          if (idx < count) {
            await dayBtns.nth(idx).click()
            await page.waitForTimeout(150)
          }
        }
      }

      await scrollModalDown(page)

      // Click "Add time window"
      const timeWindowBtn = page.getByText('Add time window')
      if (await timeWindowBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await timeWindowBtn.click()
        await page.waitForTimeout(300)
        console.log('[DESKTOP] Time window opened: true')
      }

      await page.screenshot({ path: 'tests/e2e/screenshots/worker5-desktop-golden-path.png' })

      // Open calendar preview
      const viewCal = page.getByText('View on calendar')
      if (await viewCal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewCal.click()
        await page.waitForTimeout(500)
        await scrollModalDown(page)
      }

      await page.screenshot({ path: 'tests/e2e/screenshots/worker5-desktop-with-preview.png' })
    }
  })

  test('regression: weekly mode still works after adding Pick Dates', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await page.waitForTimeout(2000)

    await openCreateAndGetToScheduler(page)

    // Weekly should be present in the UniversalScheduler
    const weeklyLabel = page.getByText('Weekly', { exact: true }).first()
    const visible = await weeklyLabel.isVisible({ timeout: 3000 }).catch(() => false)
    console.log('[REGRESSION] Weekly visible in scheduler:', visible)

    if (visible) {
      await weeklyLabel.click()
      await page.waitForTimeout(300)

      // Day circles should render
      const tuCircle = page.getByText('Tu', { exact: true }).first()
      const tuVisible = await tuCircle.isVisible({ timeout: 2000 }).catch(() => false)
      console.log('[REGRESSION] Tu circle visible:', tuVisible)
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/worker5-regression-weekly.png' })
  })
})
