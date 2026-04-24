/**
 * Row 27 — SCOPE-3.F22 /rewards route renders PlayRewards inside PlayShell.
 *
 * Regression guard: before commit 81e07bf, PlayShell bottom-nav's "Fun" tab
 * linked to /rewards but App.tsx had no route → the catch-all redirected the
 * kid out of their Play shell to /welcome. This spec proves:
 *
 *   1. Logging in as Riley (Play child, ruthie age 7) and navigating to
 *      /rewards KEEPS the URL at /rewards (no redirect).
 *   2. The PlayRewards page renders its "My Rewards!" heading (positive
 *      signal) and the "Back to Home" button.
 *   3. Negative-path: URL is NOT /welcome and NOT a 404 — the catch-all did
 *      not fire.
 */
import { test, expect } from '@playwright/test'
import { loginAsRiley } from '../helpers/auth'

test.describe('Row 27 — /rewards route inside PlayShell', () => {
  test.setTimeout(30_000)

  test('Play child at /rewards sees PlayRewards, URL stays /rewards', async ({ page }) => {
    await loginAsRiley(page)
    await page.goto('/rewards')
    // Allow PlayRewards to finish its initial loading state (useStickerBookState).
    await page.waitForLoadState('networkidle')

    // Positive: URL stuck at /rewards
    await expect(page).toHaveURL(/\/rewards$/)

    // Positive: PlayRewards-specific heading visible
    await expect(
      page.getByRole('heading', { name: /My Rewards/i, level: 1 })
    ).toBeVisible({ timeout: 10_000 })

    // Positive: Back to Home button (proves PlayRewards component mounted,
    // not a generic catch-all redirect)
    await expect(page.getByRole('button', { name: /Back to Home/i })).toBeVisible()

    // Negative: URL is NOT the welcome/auth catch-all
    const url = page.url()
    expect(url).not.toMatch(/\/welcome/)
    expect(url).not.toMatch(/\/auth/)

    await page.screenshot({
      path: 'test-results/row-27-rewards-play.png',
      fullPage: false,
    })
  })
})
