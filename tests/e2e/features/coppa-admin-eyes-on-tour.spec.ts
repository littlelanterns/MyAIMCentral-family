/**
 * PRD-40 Slice 6 — Convention #277 eyes-on tour: /admin/coppa (Screen 10).
 *
 * Tours the admin COPPA log as a coppa_admin staff session at desktop /
 * tablet / mobile, plus a zero-surface probe as a non-staff family adult.
 * Screenshots to eyes-on-tour/coppa-s6-*.png (gitignored); Claude reads
 * every shot and fills the Mom-UI table in the active build file.
 *
 * Gated on EYES_ON_TOUR=1. COPPATEST S6T fixtures, swept, loud failures.
 * The stamp guard's blocker fixture guarantees the tour can never
 * accidentally activate enforcement (the stamp button is disabled).
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { TEST_USERS } from '../helpers/seed-testworths-complete'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'
const sr = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const KID_NAME = 'COPPATEST S6T Blocker Kid'
const STAFF_EMAIL = `coppatest-s6t-staff-${Date.now()}@pin.myaimcentral.app.test`
const STAFF_PASSWORD = 'CoppaTest2026!Tour'
let familyId = ''
let staffUserId = ''

test.describe.configure({ mode: 'serial' })
test.skip(process.env.EYES_ON_TOUR !== '1', 'EYES_ON_TOUR=1 to run the Convention #277 tour')

async function sweep() {
  const warn = (label: string, err: { message: string } | null) => {
    if (err) console.warn(`tour sweep: ${label} failed:`, err.message)
  }
  const { data: kids } = await sr.from('family_members').select('id').like('display_name', 'COPPATEST S6T%')
  const ids = (kids ?? []).map((k) => k.id)
  if (ids.length) {
    for (const [table, col] of [
      ['lists', 'owner_id'], ['archive_folders', 'member_id'], ['dashboard_configs', 'family_member_id'],
      ['archive_member_settings', 'member_id'], ['dashboard_widgets', 'family_member_id'],
    ] as const) {
      warn(table, (await sr.from(table).delete().in(col, ids)).error)
    }
    warn('family_members', (await sr.from('family_members').delete().in('id', ids)).error)
  }
  if (staffUserId) {
    warn('staff_permissions', (await sr.from('staff_permissions').delete().eq('user_id', staffUserId)).error)
    const del = await sr.auth.admin.deleteUser(staffUserId)
    if (del.error) console.warn('tour sweep: auth deleteUser failed:', del.error.message)
    staffUserId = ''
  }
}

test.beforeAll(async () => {
  const { data: fam } = await sr.from('families').select('id').eq('family_name', 'The Testworth Family').single()
  if (!fam) throw new Error('Testworth family not found')
  familyId = fam.id
  await sweep()

  // Sequencing-law blocker — the tour must be incapable of stamping.
  const { error } = await sr.from('family_members').insert({
    family_id: familyId, display_name: KID_NAME, role: 'member', dashboard_mode: 'guided',
    relationship: 'child', age: 7, in_household: true, dashboard_enabled: true,
    auth_method: 'none', is_active: true, coppa_age_bracket: 'under_13', member_color: '#68a395',
  })
  if (error) throw new Error(`seed blocker kid failed: ${error.message}`)

  const { data: created, error: uErr } = await sr.auth.admin.createUser({
    email: STAFF_EMAIL, password: STAFF_PASSWORD, email_confirm: true,
    user_metadata: { skip_auto_family: true },
  })
  if (uErr || !created.user) throw new Error(`staff createUser failed: ${uErr?.message}`)
  staffUserId = created.user.id
  const { error: gErr } = await sr.from('staff_permissions').insert({ user_id: staffUserId, permission_type: 'coppa_admin', granted_by: staffUserId })
  if (gErr) throw new Error(`grant coppa_admin failed: ${gErr.message}`)
})

test.afterAll(async () => {
  await sweep()
})

async function signInBrowser(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(`${APP_URL}/auth/sign-in`)
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {})
}

for (const [label, viewport] of [
  ['desktop', { width: 1440, height: 900 }],
  ['tablet', { width: 768, height: 1024 }],
  ['mobile', { width: 375, height: 812 }],
] as const) {
  test(`tour (${label}): Screen 10 overview + full record + template management as coppa_admin staff`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await signInBrowser(page, STAFF_EMAIL, STAFF_PASSWORD)

    await page.goto(`${APP_URL}/admin/coppa`)
    await expect(page.getByTestId('coppa-admin-page')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('stamp-readiness-banner')).toContainText('BLOCKED')
    await page.waitForTimeout(1200)
    await page.screenshot({ path: `eyes-on-tour/coppa-s6-${label}-1-overview.png`, fullPage: true })

    // Full record expanded
    const { data: fam } = await sr.from('families').select('id').eq('family_name', 'The Testworth Family').single()
    await page.getByTestId(`view-record-${fam!.id}`).click()
    await expect(page.getByTestId('family-detail')).toBeVisible()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `eyes-on-tour/coppa-s6-${label}-2-full-record.png`, fullPage: true })

    // Template section with the hard-disabled stamp
    await expect(page.getByText('Consent template versions')).toBeVisible()
    await expect(page.getByTestId('stamp-open-1.0.0')).toBeDisabled()
    await page.screenshot({ path: `eyes-on-tour/coppa-s6-${label}-3-templates.png`, fullPage: true })
  })
}

test('tour (zero-surface): non-staff family adult gets the AdminGate card', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await signInBrowser(page, TEST_USERS.mark.email, TEST_USERS.mark.password)
  await page.goto(`${APP_URL}/admin/coppa`)
  await expect(page.getByText('Admin area')).toBeVisible({ timeout: 15000 })
  await page.screenshot({ path: 'eyes-on-tour/coppa-s6-dad-blocked.png', fullPage: true })
})
