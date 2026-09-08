/**
 * MEMBER-SETTINGS-HUB — Convention #277 eyes-on tour.
 *
 * Tours the hub as mom at desktop/tablet/mobile: opening it from Family
 * Management, the default-open Profile section, expanding Login & Access
 * and Safety Monitoring, and the mobile accordion layout. Screenshots to
 * eyes-on-tour/member-settings-hub-*.png (gitignored); Claude reads every
 * shot and fills the Mom-UI table in the active build file.
 *
 * Gated on EYES_ON_TOUR=1. Read-only against the Testworth family — no
 * fixtures created or swept.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { loginAsMom } from '../helpers/auth'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const sr = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

test.skip(process.env.EYES_ON_TOUR !== '1', 'EYES_ON_TOUR=1 to run the Convention #277 tour')

let caseyId = ''

test.beforeAll(async () => {
  const { data: fam } = await sr.from('families').select('id').eq('family_name', 'The Testworth Family').single()
  if (!fam) throw new Error('Testworth family not found')
  const { data: casey } = await sr.from('family_members').select('id').eq('family_id', fam.id).eq('display_name', 'Casey').single()
  if (!casey) throw new Error('Casey not found')
  caseyId = casey.id
})

for (const [label, viewport] of [
  ['desktop', { width: 1440, height: 900 }],
  ['tablet', { width: 768, height: 1024 }],
  ['mobile', { width: 375, height: 812 }],
] as const) {
  test(`tour (${label}): Member Settings Hub open + sections expanded`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await loginAsMom(page)
    await page.goto('/family-members')
    await expect(page.getByTestId(`member-hub-open-${caseyId}`)).toBeVisible()
    await page.waitForTimeout(300)
    await page.screenshot({ path: `eyes-on-tour/member-settings-hub-${label}-0-list.png`, fullPage: true })

    await page.getByTestId(`member-hub-open-${caseyId}`).click()
    await expect(page.getByText("Casey's Settings")).toBeVisible()
    await page.waitForTimeout(500)
    await page.screenshot({ path: `eyes-on-tour/member-settings-hub-${label}-1-profile-open.png`, fullPage: true })

    await page.getByTestId('hub-section-toggle-login-access').click()
    await page.getByTestId('hub-section-toggle-safety-monitoring').click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: `eyes-on-tour/member-settings-hub-${label}-2-more-sections.png`, fullPage: true })
  })
}

test('tour (desktop): the SAME hub opened from Settings → Family Management (founder gap-check)', async ({ page }) => {
  // The founder's original complaint: the Settings → Family Management
  // roster PREVIEW was unclickable, forcing a detour through "Manage
  // Members & PINs" just to open one kid's settings. This shot proves the
  // second door: Casey's row on /settings opens the identical hub in place.
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsMom(page)
  await page.goto('/settings')
  // Every Settings section (including Family Management) is its own
  // collapsed-by-default accordion — expand it before the roster shows.
  await page.getByRole('button', { name: 'Family Management' }).click()
  await expect(page.getByTestId(`settings-member-hub-open-${caseyId}`)).toBeVisible()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'eyes-on-tour/member-settings-hub-desktop-3-settings-entry-list.png', fullPage: true })

  await page.getByTestId(`settings-member-hub-open-${caseyId}`).click()
  await expect(page.getByText("Casey's Settings")).toBeVisible()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'eyes-on-tour/member-settings-hub-desktop-4-settings-entry-open.png', fullPage: true })
})

test('tour (desktop): the pill lifecycle (founder ruling, 2026-09-07)', async ({ page }) => {
  // Founder ruling: X = fully done (no pill), backdrop click = minimize to
  // a pill, clicking the pill = reopen with state preserved, and the pill
  // gets its own small dismiss x. This proves the minimize→pill→restore leg
  // visually (the part that was previously broken — clicking the pill used
  // to just make it vanish with nothing reopening).
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsMom(page)
  await page.goto('/family-members')
  await page.getByTestId(`member-hub-open-${caseyId}`).click()
  await expect(page.getByText("Casey's Settings")).toBeVisible()
  await page.getByTestId('hub-section-toggle-login-access').click()
  await expect(page.getByText('Set PIN', { exact: true })).toBeVisible()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'eyes-on-tour/member-settings-hub-desktop-5-pill-1-before-minimize.png', fullPage: true })

  // Click the page underneath (the backdrop) — minimizes to a pill; the
  // page underneath becomes fully usable again (that's the whole point).
  await page.getByTestId('modal-backdrop').click({ position: { x: 10, y: 10 } })
  await expect(page.getByText("Casey's Settings")).toBeHidden()
  const pill = page.getByRole('button', { name: /^Casey's Setting/i })
  await expect(pill).toBeVisible()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'eyes-on-tour/member-settings-hub-desktop-5-pill-2-minimized-with-pill.png', fullPage: true })

  // Click the pill — reopens with Login & Access still expanded (state
  // preserved), pill gone.
  await pill.click()
  await expect(page.getByText("Casey's Settings")).toBeVisible()
  await expect(page.getByText('Set PIN', { exact: true })).toBeVisible()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'eyes-on-tour/member-settings-hub-desktop-5-pill-3-restored.png', fullPage: true })
})
