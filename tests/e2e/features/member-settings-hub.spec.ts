/**
 * MEMBER-SETTINGS-HUB — person-first settings navigation (2026-09-07).
 *
 * Covers: clicking a member's row on Family Management opens their hub; a
 * real edit through one section (Allowance) persists to the DB; View-As
 * launches from the hub and exits back cleanly; mom-only enforcement is
 * unchanged (the hub only ever mounts inside the existing <MomOnlyRoute>
 * page).
 *
 * Fixture isolation: reads the real Testworth family (read-only for the
 * navigation/View-As/enforcement tests) and adds ONE throwaway kid member
 * (HUBTEST-prefixed) for the allowance-edit-persists test, swept in
 * afterAll via service role. No shadow auth accounts are created.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { loginAsMom, loginAsCasey } from '../helpers/auth'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const sr = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let familyId = ''
let caseyId = ''
let hubTestKidId = ''

async function resolveTestworth() {
  const { data: fam, error } = await sr
    .from('families')
    .select('id')
    .eq('family_name', 'The Testworth Family')
    .single()
  if (error || !fam) throw new Error(`Testworth family not found: ${error?.message}`)
  familyId = fam.id

  const { data: casey, error: caseyErr } = await sr
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('display_name', 'Casey')
    .single()
  if (caseyErr || !casey) throw new Error(`Casey not found: ${caseyErr?.message}`)
  caseyId = casey.id
}

test.beforeAll(async () => {
  await resolveTestworth()

  const { data: kid, error } = await sr
    .from('family_members')
    .insert({
      family_id: familyId,
      display_name: `HUBTEST Kid ${Date.now()}`,
      role: 'member',
      dashboard_mode: 'independent',
      relationship: 'child',
      age: 13,
      coppa_age_bracket: '13_to_17',
      in_household: true,
      dashboard_enabled: true,
      auth_method: 'none',
      is_active: true,
      member_color: '#68a395',
    })
    .select('id')
    .single()
  if (error || !kid) throw new Error(`seed HUBTEST kid failed: ${error?.message}`)
  hubTestKidId = kid.id
})

test.afterAll(async () => {
  if (hubTestKidId) {
    // auto_provision_member_resources (Convention #19) auto-creates rows in
    // several tables for every new family_members insert. Most of those FKs
    // cascade on delete (archive_folders, dashboard_configs,
    // archive_member_settings, gamification_configs, member_sticker_book_state,
    // rhythm_configs, safety_monitoring_configs — verified against their
    // migrations, all ON DELETE CASCADE) — but `lists.owner_id` does NOT, and
    // neither does `allowance_periods.family_member_id` (which our own
    // allowance edit can create via useStartAllowancePeriod). Both must be
    // swept BEFORE the family_members delete or that delete fails with a
    // foreign-key violation and strands the fixture (the exact
    // silent-sweep-failure class this codebase has been bitten by before —
    // see the coppa-admin-eyes-on-tour.spec.ts sweep() precedent).
    const { error: listsErr } = await sr.from('lists').delete().eq('owner_id', hubTestKidId)
    if (listsErr) console.error('sweep lists failed:', listsErr.message)
    const { error: periodErr } = await sr.from('allowance_periods').delete().eq('family_member_id', hubTestKidId)
    if (periodErr) console.error('sweep allowance_periods failed:', periodErr.message)
    const { error: allowanceErr } = await sr.from('allowance_configs').delete().eq('family_member_id', hubTestKidId)
    if (allowanceErr) console.error('sweep allowance_configs failed:', allowanceErr.message)
    const { error: memberErr } = await sr.from('family_members').delete().eq('id', hubTestKidId)
    if (memberErr) console.error('sweep HUBTEST kid failed:', memberErr.message)
  }
  // Residue check — zero HUBTEST rows should remain in Testworth.
  const { data: residue } = await sr
    .from('family_members')
    .select('id, display_name')
    .eq('family_id', familyId)
    .like('display_name', 'HUBTEST%')
  expect(residue ?? []).toHaveLength(0)
})

test('mom-only enforcement: a kid session hitting /family-members gets the Parent-only block card', async ({ page }) => {
  await loginAsCasey(page)
  await page.goto('/family-members')
  await expect(page.getByRole('heading', { name: 'Parent-only area' })).toBeVisible()
})

test('clicking a member row opens the Member Settings Hub, scoped to that member', async ({ page }) => {
  await loginAsMom(page)
  await page.goto('/family-members')
  await expect(page.getByTestId(`member-hub-open-${caseyId}`)).toBeVisible()
  await page.getByTestId(`member-hub-open-${caseyId}`).click()

  await expect(page.getByText("Casey's Settings")).toBeVisible()
  // Profile section is open by default (Convention: default open on Profile only).
  await expect(page.locator('[data-testid="coppa-bracket-selector-edit"]').first()).toBeVisible()

  // Expand Login & Access and confirm its launch rows render.
  await page.getByTestId('hub-section-toggle-login-access').click()
  await expect(page.getByText('Set PIN', { exact: true })).toBeVisible()
  await expect(page.getByText('Set Picture Login', { exact: true })).toBeVisible()

  // Expand Safety Monitoring — Casey is role=member, so the real kid-flavored
  // monitored toggle renders (not a "not applicable" note).
  await page.getByTestId('hub-section-toggle-safety-monitoring').click()
  await expect(page.getByText('Monitored', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: /close/i }).first().click().catch(() => {})
})

test('a real edit through the Allowance section persists to the database', async ({ page }) => {
  await loginAsMom(page)
  await page.goto('/family-members')
  await page.getByTestId(`member-hub-open-${hubTestKidId}`).click()
  await expect(page.getByText(/HUBTEST Kid \d+'s Settings/)).toBeVisible()

  await page.getByTestId('hub-section-toggle-allowance-finances').click()

  const weeklyAmountInput = page
    .locator('label:text-is("Weekly allowance amount")')
    .locator('xpath=following-sibling::div[1]//input')
  await expect(weeklyAmountInput).toBeVisible()
  await weeklyAmountInput.fill('37.5')
  await weeklyAmountInput.blur()

  // ChildAllowanceConfig autosaves via an 800ms debounce.
  await page.waitForTimeout(1500)

  const { data, error } = await sr
    .from('allowance_configs')
    .select('weekly_amount, enabled')
    .eq('family_member_id', hubTestKidId)
    .eq('pool_name', 'default')
    .maybeSingle()
  expect(error).toBeNull()
  expect(data).not.toBeNull()
  expect(Number(data?.weekly_amount)).toBeCloseTo(37.5, 1)
})

test('Settings → Family Management roster row opens the SAME hub (founder gap-check, 2026-09-07)', async ({ page }) => {
  // The founder's original complaint was specifically that Settings →
  // Family Management's roster PREVIEW (not the /family-members page) was
  // unclickable — mom had to press "Manage Members & PINs" first. This test
  // proves the second door: clicking Casey's row right here on /settings
  // opens the identical MemberSettingsHub, no navigation hop to
  // /family-members first.
  await loginAsMom(page)
  await page.goto('/settings')
  // Every Settings section (including Family Management) is its own
  // collapsed-by-default accordion (SettingsSection, isOpen=false) — expand
  // it before the roster becomes clickable.
  await page.getByRole('button', { name: 'Family Management' }).click()
  await expect(page.getByTestId(`settings-member-hub-open-${caseyId}`)).toBeVisible()
  await page.getByTestId(`settings-member-hub-open-${caseyId}`).click()

  // Still on /settings — no navigation occurred.
  expect(page.url()).toContain('/settings')
  await expect(page.getByText("Casey's Settings")).toBeVisible()
  await expect(page.locator('[data-testid="coppa-bracket-selector-edit"]').first()).toBeVisible()

  // A real edit through this door persists too — same save path as the
  // /family-members door (useMemberSaveAndConsentGate, shared, no fork).
  const nameInput = page.locator('label:text-is("Name")').locator('xpath=following-sibling::input')
  await expect(nameInput).toHaveValue('Casey')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.waitForTimeout(500)

  const { data, error } = await sr.from('family_members').select('display_name').eq('id', caseyId).single()
  expect(error).toBeNull()
  expect(data?.display_name).toBe('Casey')

  // Mom's own row stays a plain, non-interactive summary — no hub for herself.
  const { data: sarah } = await sr.from('family_members').select('id').eq('family_id', familyId).eq('role', 'primary_parent').single()
  await expect(page.getByTestId(`settings-member-hub-open-${sarah!.id}`)).toHaveCount(0)
})

test('View As launches from the hub and exits back cleanly', async ({ page }) => {
  await loginAsMom(page)
  await page.goto('/family-members')
  await page.getByTestId(`member-hub-open-${caseyId}`).click()
  await expect(page.getByText("Casey's Settings")).toBeVisible()

  await page.getByRole('button', { name: /View as Casey/i }).click()

  // /family-members sits behind <MomOnlyRoute>, which reacts to the GLOBAL
  // isViewingAs flag (not scoped to ViewAsModal's own subtree) — starting a
  // View-As session while still on that route would immediately flip
  // MomOnlyRoute's OWN guard to blocked for the very page hosting the
  // button, before RoleRouter/ViewAsModal ever gets a chance to mount. The
  // hub's "View as" button navigates to /dashboard first (the same host
  // every other View-As entry point in the app already uses) so the
  // overlay actually renders — confirmed here by waiting for that URL.
  await page.waitForURL('**/dashboard', { timeout: 10000 })

  // ViewAsBanner only renders while a View-As session is active.
  await expect(page.getByTestId('view-as-exit')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Viewing as')).toBeVisible()
  await expect(page.getByText('Casey', { exact: true })).toBeVisible()

  await page.getByTestId('view-as-exit').click()
  await expect(page.getByTestId('view-as-exit')).toHaveCount(0)

  // Exiting View-As returns mom to her own Dashboard (not back into the
  // hub — navigating away unmounts FamilyMembers.tsx's hubMemberId state,
  // same as leaving any other page would). No blocked card, no crash.
  await expect(page.getByRole('heading', { name: 'Parent-only area' })).toHaveCount(0)
})
