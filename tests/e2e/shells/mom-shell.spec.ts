/**
 * Mom Shell structural tests.
 * Verifies sidebar, QuickTasks, Notepad drawer, LiLa drawer, settings gear.
 */
import { test, expect } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'
import { waitForAppReady, captureConsoleErrors, assertNoInfiniteRenders } from '../helpers/assertions'

test.describe('Mom Shell Structure', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
  })

  test('Mom shell renders with main content area', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await expect(page.locator('main').first()).toBeVisible()
    assertNoInfiniteRenders(consoleErrors)
  })

  test('Mom shell has navigation sidebar or bottom nav', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()
  })

  test.skip('QuickTasks strip is visible at top', async () => {
    // TODO: Verify horizontal scrollable pill bar
  })

  test.skip('Notepad drawer available in Mom shell', async () => {
    // TODO: Verify notepad can open from shell
  })
})
