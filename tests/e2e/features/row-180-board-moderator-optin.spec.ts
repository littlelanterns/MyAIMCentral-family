/**
 * Row 180 — SCOPE-4.F7 Board of Directors moderator opt-in.
 *
 * Moderator interjection is opt-in. Toggle lives in the Board modal header
 * ("LiLa synthesis" checkbox), persisted on
 * family_members.preferences.moderator_interjections_enabled. Server-side
 * (lila-board-of-directors index.ts ~1114) gates the moderator stream on
 * that pref (per-conversation override in context_snapshot also respected).
 *
 * Cost-controlled verification: we do NOT exercise the real moderator
 * stream (Sonnet × N advisors × moderator = ~$0.10 per run). Instead:
 *
 *  (a) OFF state — open Board, assert toggle is visible and unchecked by
 *      default for a user with no pref set. This is the stable baseline.
 *  (b) ON state — click the toggle, then query family_members via the
 *      service role and assert
 *      preferences.moderator_interjections_enabled === true.
 *  (c) Flip back OFF and assert pref flips to false again. Proves the
 *      toggle writes both directions.
 *
 * Server-side gate (opt-in respected on the stream) is verified by
 * tests/verification/row-180-moderator-optin-server-gate.ts via source
 * grep — runtime stream coverage would require a real Sonnet call.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom } from '../helpers/auth'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function getMomMember() {
  const { data: family } = await admin
    .from('families')
    .select('id')
    .ilike('family_name', '%testworth%')
    .single()
  const { data: mom } = await admin
    .from('family_members')
    .select('id, preferences')
    .eq('family_id', family!.id)
    .eq('role', 'primary_parent')
    .single()
  return mom!
}

test.describe('Row 180 — Board moderator opt-in', () => {
  test.setTimeout(90_000)

  test('moderator toggle default OFF, click persists to preferences.moderator_interjections_enabled, click again flips back', async ({
    page,
  }) => {
    // Reset baseline: clear the pref so the default-OFF assertion is stable.
    const initial = await getMomMember()
    const basePrefs = { ...(initial.preferences as Record<string, unknown> || {}) }
    delete basePrefs.moderator_interjections_enabled
    await admin.from('family_members').update({ preferences: basePrefs }).eq('id', initial.id)

    await loginAsMom(page)

    // Open Translator's Vault card path is stable; use it to launch Board.
    await page.goto('/vault')
    await expect(page.getByRole('heading', { name: 'AI Vault' })).toBeVisible()
    await page.waitForTimeout(1500)

    const search = page.getByPlaceholder(/search/i).first()
    await search.fill('Board of Directors')
    await page.waitForTimeout(1000)
    const cardHeading = page.getByRole('heading', { name: 'Board of Directors', level: 3, exact: true }).first()
    await expect(cardHeading).toBeVisible({ timeout: 10_000 })
    const cardRoot = cardHeading.locator('xpath=ancestor::div[contains(@class,"cursor-pointer")][1]')
    await cardRoot.dispatchEvent('click')

    const launch = page.getByRole('button', { name: /Launch Tool/i })
    await expect(launch).toBeVisible({ timeout: 5_000 })
    await launch.click()

    const modal = page.getByTestId('board-of-directors-modal')
    await expect(modal).toBeVisible({ timeout: 10_000 })

    // (a) Default OFF — toggle unchecked
    const toggle = modal.locator('input[type="checkbox"]').first()
    await expect(toggle).toBeVisible()
    await expect(toggle).not.toBeChecked()

    // (b) Toggle ON, assert DB update
    await toggle.check()
    // Allow the optimistic setState + supabase UPDATE to round-trip
    await page.waitForTimeout(1200)
    const afterOn = await getMomMember()
    const prefsAfterOn = (afterOn.preferences as Record<string, unknown>) || {}
    expect(prefsAfterOn.moderator_interjections_enabled).toBe(true)
    await expect(toggle).toBeChecked()

    // (c) Toggle OFF again, assert DB update flips back
    await toggle.uncheck()
    await page.waitForTimeout(1200)
    const afterOff = await getMomMember()
    const prefsAfterOff = (afterOff.preferences as Record<string, unknown>) || {}
    expect(prefsAfterOff.moderator_interjections_enabled).toBe(false)
    await expect(toggle).not.toBeChecked()

    // Restore baseline (delete the key)
    const restorePrefs = { ...(afterOff.preferences as Record<string, unknown> || {}) }
    delete restorePrefs.moderator_interjections_enabled
    await admin.from('family_members').update({ preferences: restorePrefs }).eq('id', afterOff.id)
  })
})
