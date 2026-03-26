/**
 * Guided Shell structural tests (younger child role).
 */
import { test, expect } from '@playwright/test'
import { loginAsJordan } from '../helpers/auth'
import { waitForAppReady, captureConsoleErrors, assertNoInfiniteRenders } from '../helpers/assertions'

test.describe('Guided Shell Structure', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
    await loginAsJordan(page)
  })

  test('Guided shell renders for younger child', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await expect(page.locator('main').first()).toBeVisible()
    assertNoInfiniteRenders(consoleErrors)
  })

  test.skip('Guided shell has personalized greeting', async () => {
    // TODO: PRD-04: greeting header with member name + date
  })

  test.skip('Guided shell has 48px touch targets', async () => {
    // TODO: Measure touch target sizes
  })
})
