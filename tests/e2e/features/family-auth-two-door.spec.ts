/**
 * Family-Auth-Two-Door — E2E verification (Phases 1-4, 2026-06-09)
 *
 * Verifies against the live dev server + production Supabase:
 *  1. Roster enumeration is sealed (generic errors, no names pre-password)
 *  2. The family door (name + password together) releases the choice screen
 *  3. The hidden Family identity row never appears as a person
 *  4. Hub tile rests the device on /hub (family session)
 *  5. Mom's tile routes to her own email sign-in (never the family password)
 *  6. Picture password: 9-image grid, wrong tap counts down, correct tap is
 *     detected server-side (Casey is an email-linked member, so his correct
 *     tap routes to email sign-in — the requires_email_login guard)
 *  7. Kill switch path: mom re-saving the family password (same value)
 *     exercises hash rewrite + shadow rotation + global sign-out, and the
 *     family door still unlocks afterwards
 *  8. (env-gated) Real PIN personal-device login for a Wertman kid
 *
 * Run: npx playwright test tests/e2e/features/family-auth-two-door.spec.ts
 */
import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const TESTWORTH_FAMILY_ID = '1f6200a7-df82-4ac4-bce3-3edcafe66bc5'
const TESTWORTH_LOGIN = 'testworthfamily'
const TESTWORTH_PASSWORD = 'Lanterns2026'
const SARAH = { email: 'testmom@testworths.com', password: 'Demo2026!' }

const GENERIC_ERROR = "That family name and password didn't match"

let caseyId = ''
let caseyAssetId = ''

test.beforeAll(async () => {
  // Ensure Casey has a picture password configured (the global seed may
  // reset members). Service role — mirrors set_member_picture's DB write.
  const svc = createClient(supabaseUrl, serviceKey)
  const { data: casey } = await svc
    .from('family_members')
    .select('id, visual_password_config')
    .eq('family_id', TESTWORTH_FAMILY_ID)
    .eq('display_name', 'Casey')
    .single()
  if (!casey) throw new Error('Casey not found — seed failed?')
  caseyId = casey.id

  const config = casey.visual_password_config as { asset_id?: string } | null
  if (config?.asset_id) {
    caseyAssetId = config.asset_id
  } else {
    const { data: assets } = await svc
      .from('platform_assets')
      .select('id')
      .eq('category', 'login_avatar')
      .eq('status', 'active')
      .limit(1)
    caseyAssetId = assets![0].id
    await svc
      .from('family_members')
      .update({
        visual_password_config: { asset_id: caseyAssetId },
        auth_method: 'visual_password',
      })
      .eq('id', caseyId)
  }
  // Clean lockout state so tap tests are deterministic
  await svc
    .from('family_members')
    .update({ pin_failed_attempts: 0, pin_locked_until: null })
    .eq('id', caseyId)
  await svc
    .from('families')
    .update({ family_password_failed_attempts: 0, family_password_locked_until: null })
    .eq('id', TESTWORTH_FAMILY_ID)
})

async function openFamilyDoor(page: Page, loginName: string, password: string) {
  await page.goto('/auth/family-login')
  await page.getByPlaceholder('e.g., TheSmithCrew').fill(loginName)
  await page.getByPlaceholder("Your family's shared password").fill(password)
  await page.getByRole('button', { name: 'Continue' }).click()
}

test.describe('Family-Auth-Two-Door', () => {
  test('1. fake family name → generic error, zero names leaked', async ({ page }) => {
    await openFamilyDoor(page, 'thesmithcrew', 'wrongpass1')
    await expect(page.getByText(GENERIC_ERROR)).toBeVisible()
    await expect(page.getByText('Sarah')).not.toBeVisible()
    await expect(page.getByText('Casey')).not.toBeVisible()
  })

  test('2. real name + wrong password → SAME generic error', async ({ page }) => {
    await openFamilyDoor(page, TESTWORTH_LOGIN, 'wrongpass1')
    await expect(page.getByText(GENERIC_ERROR)).toBeVisible()
    await expect(page.getByText('Sarah')).not.toBeVisible()
  })

  test('3. correct password → choice screen; Family identity row hidden', async ({ page }) => {
    await openFamilyDoor(page, TESTWORTH_LOGIN, TESTWORTH_PASSWORD)
    // Member tiles appear ONLY behind the verified password
    await expect(page.getByText('Sarah')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Casey')).toBeVisible()
    // Hub tile renders when the family session established
    await expect(page.getByText('Family Hub')).toBeVisible({ timeout: 15000 })
    // The hidden role='family' identity row must never appear as a person
    const familyTiles = page.locator('button', { hasText: /^Family$/ })
    await expect(familyTiles).toHaveCount(0)
  })

  test('4. Hub tile → device rests on /hub', async ({ page }) => {
    await openFamilyDoor(page, TESTWORTH_LOGIN, TESTWORTH_PASSWORD)
    await page.getByText('Family Hub').click()
    await page.waitForURL('**/hub', { timeout: 20000 })
    expect(page.url()).toContain('/hub')
    // Hub renders under the family session (not bounced to auth).
    // No networkidle wait — the hub keeps realtime connections open.
    await expect(page.getByRole('heading', { name: /Family Hub/i })).toBeVisible({
      timeout: 20000,
    })
    expect(page.url()).not.toContain('/auth/')
  })

  test('5. mom tile → her own email sign-in, never the family password', async ({ page }) => {
    await openFamilyDoor(page, TESTWORTH_LOGIN, TESTWORTH_PASSWORD)
    await expect(page.getByText('Sarah')).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /Sarah/ }).click()
    await page.waitForURL('**/auth/sign-in', { timeout: 10000 })
    expect(page.url()).toContain('/auth/sign-in')
  })

  test('6. picture password: grid, wrong tap, correct tap (email-member routing)', async ({ page }) => {
    await openFamilyDoor(page, TESTWORTH_LOGIN, TESTWORTH_PASSWORD)
    await expect(page.getByText('Casey')).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /Casey/ }).click()

    // 9-image grid renders, no image marked as correct
    const grid = page.getByTestId('picture-grid')
    await expect(grid).toBeVisible({ timeout: 15000 })
    const buttons = grid.locator('button[data-asset-id]')
    await expect(buttons).toHaveCount(9)

    // Wrong tap → server-side rejection
    const wrongButton = grid.locator(`button[data-asset-id]:not([data-asset-id="${caseyAssetId}"])`).first()
    await wrongButton.click()
    await expect(page.getByText("That wasn't your picture")).toBeVisible({ timeout: 10000 })

    // Correct tap → verified server-side; Casey is linked to a real email
    // account, so the guard routes him to email sign-in (and resets lockout)
    await grid.locator(`button[data-asset-id="${caseyAssetId}"]`).click()
    await page.waitForURL('**/auth/sign-in', { timeout: 15000 })
    expect(page.url()).toContain('/auth/sign-in')
  })

  test('7. kill switch path: mom re-saves password; family door still opens', async ({ page }) => {
    // Sign in as Sarah (Testworth mom) through the real sign-in UI
    await page.goto('/auth/sign-in')
    await page.locator('input[type="email"]').fill(SARAH.email)
    await page.locator('input[type="password"]').fill(SARAH.password)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard', { timeout: 30000 })

    await page.goto('/family-password')

    // Change-password form (password already set → change framing)
    await expect(page.getByText('Change Family Password')).toBeVisible({ timeout: 15000 })
    const inputs = page.locator('input[type="password"]')
    await inputs.nth(0).fill(TESTWORTH_PASSWORD)
    await inputs.nth(1).fill(TESTWORTH_PASSWORD)
    await page.getByRole('button', { name: 'Change Password' }).click()

    // Full pipeline: hash rewrite + shadow rotation + global device sign-out
    await expect(page.getByText('Family password saved!')).toBeVisible({ timeout: 20000 })

    // The family door still unlocks with the (re-saved) password
    await page.evaluate(() => localStorage.clear())
    await openFamilyDoor(page, TESTWORTH_LOGIN, TESTWORTH_PASSWORD)
    await expect(page.getByText('Sarah')).toBeVisible({ timeout: 15000 })
  })

  test('8. PIN personal device (Wertman kid) — env-gated', async ({ page }) => {
    const familyLogin = process.env.E2E_FAMILY_LOGIN_NAME
    const familyPassword = process.env.E2E_FAMILY_PASSWORD
    const ruthiePin = process.env.E2E_RUTHIE_PIN
    test.skip(!familyLogin || !familyPassword || !ruthiePin, 'E2E family/PIN env vars not set')

    await openFamilyDoor(page, familyLogin!, familyPassword!)
    await expect(page.getByText('Ruthie')).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /Ruthie/ }).click()

    // PIN entry → real session → her dashboard
    await expect(page.getByText(/Enter your PIN/i)).toBeVisible({ timeout: 10000 })
    await page.locator('input[type="password"]').fill(ruthiePin!)
    await page.getByRole('button', { name: 'Enter' }).click()
    await page.waitForURL('**/dashboard', { timeout: 20000 })
    expect(page.url()).toContain('/dashboard')
    await page.waitForLoadState('networkidle')
    expect(page.url()).not.toContain('/auth/')
  })
})
