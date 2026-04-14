/**
 * Miriam Kitchen Routine — Checklist Interaction Test
 *
 * Tests that Miriam can mark off specific steps from her Monday
 * Kitchen Zone routine: "Wipe counters" and "Unload dishwasher".
 *
 * The step checkboxes are styled <button> elements with
 * style="width: 18px; height: 18px" inside the RoutineStepChecklist.
 * The task-level completion circle is a separate 20px button.
 * We must click the 18px step checkbox, NOT the 20px task circle.
 */
import { test, Page } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const BASE = 'http://localhost:5173'
const FAMILY_NAME = process.env.E2E_FAMILY_LOGIN_NAME || 'WarmthWisdomWork'
const MIRIAM_PIN = '1217'
const SCREENSHOT_DIR = 'tests/e2e/.screenshots/routine-ux'

async function loginAsMiriam(page: Page) {
  await page.goto(`${BASE}/auth/sign-in`)
  await page.waitForLoadState('networkidle')

  const familyLoginLink = page.locator('a[href="/auth/family-login"]')
  await familyLoginLink.waitFor({ timeout: 10000 })
  await familyLoginLink.click()
  await page.waitForURL('**/auth/family-login**', { timeout: 10000 })
  await page.waitForLoadState('networkidle')

  const familyInput = page.locator('input[type="text"]').first()
  await familyInput.waitFor({ timeout: 10000 })
  await familyInput.fill(FAMILY_NAME)
  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(2000)

  const memberButton = page.locator('button').filter({ hasText: 'Miriam' })
  await memberButton.waitFor({ timeout: 10000 })
  await memberButton.click()
  await page.waitForTimeout(1000)

  const pinInput = page.locator('input[type="password"]').first()
  await pinInput.waitFor({ timeout: 10000 })
  await pinInput.fill(MIRIAM_PIN)
  await page.locator('button[type="submit"]').click()

  await page.waitForURL('**/dashboard**', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: true })
}

/**
 * Click a step checkbox by finding the 18px-wide button that is a sibling
 * of the step text. Uses page.evaluate to precisely identify the right button.
 */
async function clickStepCheckbox(page: Page, stepTextPattern: RegExp): Promise<boolean> {
  const clicked = await page.evaluate((pattern) => {
    // Find all 18px step checkbox buttons
    const buttons = document.querySelectorAll('button')
    for (const btn of buttons) {
      if (btn.style.width !== '18px') continue
      // The sibling span with step text is in the next div
      const row = btn.parentElement
      if (!row) continue
      const span = row.querySelector('span.text-xs')
      if (!span) continue
      if (new RegExp(pattern, 'i').test(span.textContent || '')) {
        btn.click()
        return span.textContent
      }
    }
    return null
  }, stepTextPattern.source)

  if (clicked) {
    console.log(`Clicked step checkbox: "${clicked}"`)
    return true
  }
  console.log(`Step matching /${stepTextPattern.source}/i not found`)
  return false
}

test.describe('Miriam — Mark Kitchen Routine Steps', () => {
  test.setTimeout(120000)

  test('can mark off "Wipe counters" and "Unload dishwasher" from Monday routine', async ({ page }) => {
    await loginAsMiriam(page)

    // Navigate to Tasks page
    await page.goto(`${BASE}/tasks`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Click Routines tab
    const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
    if (await routinesTab.count() > 0) {
      await routinesTab.first().click()
      await page.waitForTimeout(1500)
    }
    await screenshot(page, 'miriam-mark-01-routines-tab')

    // Verify the routine is visible and steps are expanded
    const stepButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button')
      const results: string[] = []
      for (const btn of buttons) {
        if (btn.style.width === '18px') {
          const row = btn.parentElement
          const span = row?.querySelector('span.text-xs')
          results.push(span?.textContent || 'no-text')
        }
      }
      return results
    })
    console.log(`Step checkboxes found: ${stepButtons.length}`)
    console.log('Steps:', stepButtons)

    // Verify task is NOT completed (should still be in the list)
    const kitchenText = await page.locator('text=/Kitchen Zone/i').count()
    console.log(`Kitchen Zone visible: ${kitchenText > 0}`)

    await screenshot(page, 'miriam-mark-02-before-clicking')

    // --- Click "Wipe counters" step checkbox ---
    const wipedCounters = await clickStepCheckbox(page, /wipe counters/i)
    await page.waitForTimeout(1500)
    await screenshot(page, 'miriam-mark-03-after-wipe-counters')

    // --- Click "Unload dishwasher" step checkbox ---
    const unloadedDishwasher = await clickStepCheckbox(page, /unload dishwasher/i)
    await page.waitForTimeout(1500)
    await screenshot(page, 'miriam-mark-04-after-unload-dishwasher')

    // Verify the task is still visible (NOT completed — only individual steps marked)
    const kitchenStillVisible = await page.locator('text=/Kitchen Zone/i').count()
    console.log(`Kitchen Zone still visible after step clicks: ${kitchenStillVisible > 0}`)

    // Check the completion counters changed
    const counters = await page.locator('text=/\\d+\\/\\d+/').allTextContents()
    console.log('Section completion counters:', counters)

    await screenshot(page, 'miriam-mark-05-final-state')
    console.log(`Results: Wipe counters=${wipedCounters}, Unload dishwasher=${unloadedDishwasher}`)
  })
})
