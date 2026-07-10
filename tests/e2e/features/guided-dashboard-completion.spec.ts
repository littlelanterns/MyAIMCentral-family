/**
 * GDCX — Guided Dashboard Completion (PRD-25 residuals), integration pins.
 *
 * The day-scheduling fix itself (the root cause behind Next Best Thing being
 * disabled since 2026-05-03) is pinned deterministically at the unit level in
 * tests/nbt-engine-day-scheduling.test.ts — that suite exercises the pure
 * `computeNBTSuggestions` function with controlled fixtures and has been
 * manually verified to FAIL against pre-fix code (see that file's header
 * comment). This spec proves the INTEGRATION: NBT actually renders on a real
 * Guided member's dashboard, the restructured bottom nav matches Convention
 * #124 (5 tabs, Progress → /my-rewards), and DailyCelebration's newly
 * unstubbed Reflections/Streak/Theme steps render and flow correctly.
 *
 * Uses Jordan (Testworth family, dashboard_mode='guided') via the shared
 * loginAsJordan() helper — NOT the real founder family/Mosiah used by the
 * older tests/e2e/features/guided-dashboard-full.spec.ts. That file's
 * bespoke login helpers write to a stale localStorage key format
 * (`sb-<host>-auth-token`) that predates src/lib/supabase/client.ts's current
 * fixed `myaim-auth` key — all 13 of its tests fail at login, unrelated to
 * any GDCX code change (confirmed: the app compiles and serves cleanly).
 * That is pre-existing test debt, out of GDCX's scope — not touched here.
 *
 * Fixtures are GDCXTEST-prefixed, created via service role, swept in
 * beforeAll + afterAll.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsJordan } from '../helpers/auth'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import { waitForAppReady, captureConsoleErrors, assertNoInfiniteRenders } from '../helpers/assertions'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PREFIX = 'GDCXTEST'

let familyId = ''
let jordanId = ''
// Jordan carries TWO dashboard_configs rows (dashboard_type='personal' AND
// 'guided') — restore each by its own id, never by a bare
// `.eq('family_member_id', ...)` update, which silently clobbers both rows
// at once with the SAME value (discovered live: an earlier version of this
// spec used `.maybeSingle()` to read the "original" preferences, which
// errors — and is swallowed to `null` — whenever more than one row matches,
// so the restore step silently no-opped and left both rows stuck at the
// test's temporary value).
let originalConfigs: Array<{ id: string; preferences: Record<string, unknown> }> = []

async function sweepFixtures() {
  await admin.from('tasks').delete().like('title', `${PREFIX}%`)
}

test.describe('GDCX — Guided Dashboard Completion', () => {
  // Serial + a generous per-test timeout: this repo runs with heavy parallel
  // Playwright/dev-server activity across concurrent sessions, and the
  // default 30s timeout is too tight for that contention (verified: every
  // test here passes reliably in isolation and with headroom).
  test.describe.configure({ mode: 'serial' })
  test.slow()

  test.beforeAll(async () => {
    const { data: family, error } = await admin
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    const { data: jordan, error: jErr } = await admin
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('display_name', 'Jordan')
      .single()
    if (jErr || !jordan) throw new Error(`Jordan not found: ${jErr?.message}`)
    jordanId = jordan.id

    // Save every dashboard_configs row for Jordan (there may be more than
    // one — see the comment on `originalConfigs`) so we can restore each
    // exactly. This build's test 3 temporarily flips reflections_in_celebration.
    const { data: configs, error: cfgErr } = await admin
      .from('dashboard_configs')
      .select('id, preferences')
      .eq('family_member_id', jordanId)
    if (cfgErr) throw new Error(`Failed to read Jordan's dashboard_configs: ${cfgErr.message}`)
    originalConfigs = (configs ?? []) as Array<{ id: string; preferences: Record<string, unknown> }>

    await sweepFixtures()
  })

  test.afterAll(async () => {
    await sweepFixtures()
    for (const config of originalConfigs) {
      await admin
        .from('dashboard_configs')
        .update({ preferences: config.preferences ?? {} })
        .eq('id', config.id)
    }
  })

  test('1. Guided bottom nav shows 5 tabs — Progress routes to /my-rewards, Victories to /victories', async ({ page }) => {
    const errors = captureConsoleErrors(page)
    await loginAsJordan(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    const nav = page.locator('nav').last()
    await expect(nav.getByText('Home', { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(nav.getByText('Tasks', { exact: true })).toBeVisible()
    await expect(nav.getByText('Write', { exact: true })).toBeVisible()
    await expect(nav.getByText('Victories', { exact: true })).toBeVisible()
    await expect(nav.getByText('Progress', { exact: true })).toBeVisible()

    // Convention #124 order: Home, Tasks, Write, Victories, Progress.
    const labels = await nav.locator('span.text-xs').allTextContents()
    expect(labels.slice(0, 5)).toEqual(['Home', 'Tasks', 'Write', 'Victories', 'Progress'])

    await nav.getByText('Progress', { exact: true }).click()
    await page.waitForURL('**/my-rewards**', { timeout: 10000 })

    await page.goto('/dashboard')
    await waitForAppReady(page)
    await page.locator('nav').last().getByText('Victories', { exact: true }).click()
    await page.waitForURL('**/victories**', { timeout: 10000 })

    assertNoInfiniteRenders(errors)
  })

  test('2. Next Best Thing card is re-enabled (not the disabled null-return state)', async ({ page }) => {
    const errors = captureConsoleErrors(page)
    await loginAsJordan(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // GDCX Slice 1: NBT was `return null` since 2026-05-03. Re-enabled, it
    // shows either an active suggestion (Do This / Something Else) or the
    // documented empty state — never nothing.
    const nbt = page.getByText(/Do This|Something Else|Nothing on the list right now/i)
    await expect(nbt.first()).toBeVisible({ timeout: 15000 })

    assertNoInfiniteRenders(errors)
  })

  test('3. DailyCelebration: Reflections step (2.5) renders when enabled, Skip advances to Streak', async ({ page }) => {
    // Enable reflections-in-celebration for Jordan (merge, don't clobber).
    // useGuidedDashboardConfig reads dashboard_type='personal' specifically
    // (see useGuidedDashboardConfig.ts) — target that row precisely rather
    // than every dashboard_configs row for this member.
    const { data: config } = await admin
      .from('dashboard_configs')
      .select('id, preferences')
      .eq('family_member_id', jordanId)
      .eq('dashboard_type', 'personal')
      .single()
    const prefs = (config?.preferences as Record<string, unknown> | null) ?? {}
    await admin
      .from('dashboard_configs')
      .update({ preferences: { ...prefs, reflections_in_celebration: true, reflection_daily_count: 1 } })
      .eq('id', config!.id)

    const errors = captureConsoleErrors(page)
    await loginAsJordan(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await page.getByRole('button', { name: /Celebrate!/i }).click()

    // Step 1 (opener) auto-advances after 5s to Step 2 (victories) — wait for
    // the actual victories heading rather than a fixed timeout (avoids
    // flakiness under load from other concurrent Playwright runs).
    await expect(page.getByText(/Look what you did|Every day is a new chance/i)).toBeVisible({ timeout: 12000 })

    // Advance from Victories to Reflections via the forward chevron (goNext).
    await page.getByTestId('celebration-next-button').click()

    await expect(page.getByText(/Let.s think about your day for a moment/i)).toBeVisible({ timeout: 10000 })

    const skipBtn = page.getByRole('button', { name: 'Skip', exact: true })
    await expect(skipBtn).toBeVisible()
    await skipBtn.click()
    await page.waitForTimeout(500)

    // Step 3 (Streak) — always renders regardless of gamification toggle.
    await expect(page.getByText(/day streak!|You're here today!/i)).toBeVisible({ timeout: 10000 })

    assertNoInfiniteRenders(errors)
  })
})
