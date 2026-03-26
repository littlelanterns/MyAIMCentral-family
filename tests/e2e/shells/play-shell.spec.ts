/**
 * Play Shell structural tests (youngest child role).
 */
import { test, expect } from '@playwright/test'
import { loginAsRiley } from '../helpers/auth'
import { waitForAppReady, captureConsoleErrors, assertNoInfiniteRenders } from '../helpers/assertions'

test.describe('Play Shell Structure', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
    await loginAsRiley(page)
  })

  test('Play shell renders for youngest child', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await expect(page.locator('main').first()).toBeVisible()
    assertNoInfiniteRenders(consoleErrors)
  })

  test.skip('Play shell uses emoji navigation', async () => {
    // TODO: PRD-04: pure emoji nav
  })

  test.skip('Play shell has 56px touch targets', async () => {
    // TODO: Measure touch target sizes
  })
})
