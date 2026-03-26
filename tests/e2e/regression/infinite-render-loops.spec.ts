/**
 * Regression test: Infinite re-render loops.
 *
 * This is the most critical test — it catches the exact class of bugs
 * that caused the Phase 09 incident where navigation triggered
 * "Maximum update depth exceeded" errors.
 */
import { test, expect } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'
import {
  captureConsoleErrors,
  assertNoInfiniteRenders,
  assertNoErrorBoundary,
  assertMainContentVisible,
  waitForAppReady,
} from '../helpers/assertions'

test.describe('Infinite Re-render Prevention', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
  })

  test('navigating between main routes does not trigger infinite re-renders', async ({
    page,
  }) => {
    const routes = [
      '/dashboard',
      '/tasks',
      '/journal',
      '/guiding-stars',
      '/best-intentions',
      '/inner-workings',
      '/lists',
      '/studio',
    ]

    for (const route of routes) {
      // Clear errors before each navigation
      consoleErrors.length = 0

      await page.goto(route)
      await waitForAppReady(page)

      // Verify no error boundary triggered
      await assertNoErrorBoundary(page)

      // Verify main content area rendered
      await assertMainContentVisible(page)

      // Verify no infinite render errors in console
      assertNoInfiniteRenders(consoleErrors)
    }
  })

  test('rapid navigation between routes does not cause crashes', async ({
    page,
  }) => {
    // Simulate a user clicking quickly between routes
    const routes = ['/dashboard', '/tasks', '/journal', '/dashboard', '/tasks']

    for (const route of routes) {
      await page.goto(route)
      // Don't wait for networkidle — test rapid navigation
      await page.waitForTimeout(300)
    }

    // After all rapid navigation, wait for things to settle
    await waitForAppReady(page)

    // Should not have crashed
    assertNoInfiniteRenders(consoleErrors)
    await assertNoErrorBoundary(page)
  })

  test('refreshing a page does not trigger infinite re-renders', async ({
    page,
  }) => {
    const routes = ['/dashboard', '/tasks', '/journal']

    for (const route of routes) {
      consoleErrors.length = 0

      await page.goto(route)
      await waitForAppReady(page)

      // Hard refresh
      await page.reload()
      await waitForAppReady(page)

      assertNoInfiniteRenders(consoleErrors)
      await assertNoErrorBoundary(page)
    }
  })

  test('no "Maximum update depth exceeded" errors on any route', async ({
    page,
  }) => {
    // This test explicitly checks for the React error message
    const maxDepthErrors: string[] = []

    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        msg.text().includes('Maximum update depth exceeded')
      ) {
        maxDepthErrors.push(msg.text())
      }
    })

    const routes = [
      '/dashboard',
      '/tasks',
      '/journal',
      '/guiding-stars',
      '/best-intentions',
      '/inner-workings',
      '/lists',
      '/studio',
    ]

    for (const route of routes) {
      await page.goto(route)
      await waitForAppReady(page)
    }

    expect(maxDepthErrors).toHaveLength(0)
  })
})
