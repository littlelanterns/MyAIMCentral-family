/**
 * Independent Shell structural tests (teen role).
 */
import { test, expect } from '@playwright/test'
import { loginAsAlex } from '../helpers/auth'
import { waitForAppReady, captureConsoleErrors, assertNoInfiniteRenders } from '../helpers/assertions'

test.describe('Independent Shell Structure', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
    await loginAsAlex(page)
  })

  test('Independent shell renders for teen', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await expect(page.locator('main').first()).toBeVisible()
    assertNoInfiniteRenders(consoleErrors)
  })

  test.skip('Independent shell has age-appropriate nav', async () => {
    // TODO: Verify cleaner UI, no admin features
  })
})
