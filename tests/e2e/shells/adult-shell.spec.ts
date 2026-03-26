/**
 * Adult Shell structural tests (Dad role).
 */
import { test, expect } from '@playwright/test'
import { loginAsDad } from '../helpers/auth'
import { waitForAppReady, captureConsoleErrors, assertNoInfiniteRenders } from '../helpers/assertions'

test.describe('Adult Shell Structure', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
    await loginAsDad(page)
  })

  test('Adult shell renders with main content', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await expect(page.locator('main').first()).toBeVisible()
    assertNoInfiniteRenders(consoleErrors)
  })

  test.skip('Adult shell has scoped sidebar (no family management)', async () => {
    // TODO: Verify adult sidebar is missing admin-only items
  })
})
