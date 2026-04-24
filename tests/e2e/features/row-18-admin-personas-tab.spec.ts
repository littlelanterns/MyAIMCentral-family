/**
 * Row 18 — SCOPE-8b.F3 Admin Console Personas tab (Wave 1B).
 *
 * Playwright coverage of the Personas admin UI that landed in commit 6476646.
 * Uses injectSuperAdminSession (short-circuits email check; RPCs will reject
 * on auth.uid() mismatch — that's acceptable here, the page still mounts the
 * filter bar + empty-state shell).
 *
 * Asserts:
 *   1. /admin/personas renders the Personas tab with filter bar buttons
 *      (pending, deferred, approved, refined_and_approved, rejected).
 *   2. Stale-hide toggle is present when filter=pending.
 *   3. Empty-state banner ("No personas in this state.") renders when
 *      queue is empty OR error banner renders when RPC rejects auth —
 *      either proves the page mounted.
 *
 * Complements tests/verification/row-18-promotion-queue-lifecycle.ts which
 * covers the HITM gate invariants + RPC source-level admin gate check.
 */
import { test, expect } from '@playwright/test'
import { injectSuperAdminSession } from '../helpers/auth'

test.describe('Row 18 — Admin Personas tab', () => {
  test.setTimeout(30_000)

  test('super-admin visits /admin/personas → filter bar + stale toggle + empty/error state', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await injectSuperAdminSession(page, 'tenisewertman@gmail.com')

    await page.goto('/admin/personas')
    await expect(page).toHaveURL(/\/admin\/personas$/)

    // Admin shell chrome
    await expect(
      page.getByRole('heading', { name: 'Admin Console', level: 1 })
    ).toBeVisible()

    // Personas tab button (admin nav) + page heading
    await expect(page.getByRole('tab', { name: 'Personas' }))
      .toBeVisible({ timeout: 5_000 })
    await expect(
      page.getByRole('heading', { name: /Persona Review Queue/i, level: 2 })
    ).toBeVisible()

    // Filter bar — 5 status buttons, labels formatted from snake_case
    await expect(page.getByRole('button', { name: /^pending$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^deferred$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^approved$/ })).toBeVisible()
    await expect(
      page.getByRole('button', { name: /^refined and approved$/ })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /^rejected$/ })).toBeVisible()

    // Default filter is pending → stale-hide checkbox visible
    await expect(page.getByText(/Hide stale/i)).toBeVisible()

    // Queue state: either "Loading queue…" (fetch pending against the real
    // Edge Function with a synthetic JWT), "No personas in this state.", OR
    // an error banner. Any of the three proves the page mounted.
    //
    // The synthetic super-admin session's bearer token is not a valid JWT,
    // so the Edge Function pre-flight will reject it before or after a CORS
    // roundtrip. We don't care which — mount, filter bar, and stale toggle
    // presence is the assertion for this row.
    const loadingOrEmptyOrError = page.locator(
      'text=/Loading queue|No personas in this state|Not authenticated|HTTP [45]|Failed|not authorized|UNAUTHORIZED|invalid/i'
    ).first()
    await expect(loadingOrEmptyOrError).toBeVisible({ timeout: 10_000 })

    // Click the "rejected" filter — stale toggle must disappear (only on pending)
    await page.getByRole('button', { name: /^rejected$/ }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText(/Hide stale/i)).toHaveCount(0)

    await page.screenshot({
      path: 'test-results/row-18-admin-personas.png',
      fullPage: false,
    })
  })
})
