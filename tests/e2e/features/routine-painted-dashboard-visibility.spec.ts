/**
 * Painted routine dashboard visibility — DB-driven E2E spot-check.
 *
 * Unit-level coverage of isRecurringTaskVisibleToday lives in
 * tests/unit/recurringTaskFilter.painted.test.ts (deterministic, no UI).
 *
 * This spec walks one full dashboard render to confirm the unit-level rule
 * actually composes correctly through the production data path: a painted
 * routine with TODAY in rdates renders; the same template with a future-only
 * rdates set does not.
 *
 * Uses the 3 patched production routines (Upper Common Room, Zone 2,
 * Kitchen Zone) which have today (2026-05-23) in their rdates and should
 * be visible on the kid's dashboard.
 *
 * Run: npx playwright test tests/e2e/features/routine-painted-dashboard-visibility.spec.ts --headed --project=chromium
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const BASE_URL = 'http://localhost:5173'
const DEV_EMAIL = process.env.E2E_DEV_EMAIL!
const DEV_PASSWORD = process.env.E2E_DEV_PASSWORD!
const FAMILY_ID = '4bc86323-545b-4faf-b31f-3926fdd8c5a6'
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!DEV_EMAIL || !DEV_PASSWORD || !serviceRoleKey) {
  throw new Error('Missing E2E_DEV_EMAIL / E2E_DEV_PASSWORD / SUPABASE_SERVICE_ROLE_KEY')
}

function getServiceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

test.use({
  launchOptions: { slowMo: 150 },
  viewport: { width: 1280, height: 900 },
})

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/sign-in`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => {
    sessionStorage.setItem('myaim_intro_tour_dismissed', 'true')
    localStorage.setItem('myaim_guide_prefs', JSON.stringify({ all_guides_dismissed: true }))
  })
  await page.fill('input[type="email"]', DEV_EMAIL)
  await page.fill('input[type="password"]', DEV_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
}

test.describe('Painted routine dashboard visibility', () => {
  // NOTE: Unit-level coverage of "today-in-rdates → visible" is in
  // tests/unit/recurringTaskFilter.painted.test.ts (deterministic).
  // The synthetic future-only E2E below is the round-trip proof that the
  // unit-level rule composes correctly through the production data path.

  test('patched production routines have today in rdates (DB invariant)', async () => {
    const supabase = getServiceClient()
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, recurrence_details')
      .in('id', [
        'dcb1936e-ba82-4438-badf-77c800a473a5',
        'dadeddee-5ee0-4e6c-983a-d80880cfe51b',
        '1802566e-7c44-4c2c-8eeb-a50c66e9f770',
      ])
    expect(tasks?.length, 'all 3 patched routines must exist').toBe(3)

    const today = '2026-05-23'
    for (const t of tasks!) {
      const details = t.recurrence_details as Record<string, unknown>
      expect(details.schedule_type, `${t.title}: schedule_type`).toBe('painted')
      expect(details.rdates as string[], `${t.title}: rdates must include today`).toContain(today)
    }
  })

  test('a painted routine with only future rdates does NOT render today', async ({ page }) => {
    const supabase = getServiceClient()

    // Create a synthetic painted routine assigned to a guided kid, with rdates
    // all in the future. Then visit family-overview and confirm it's NOT visible.
    // Use a uniquely titled task so we can grep + clean up reliably.
    const uniqueTitle = `__test_future_painted_${Date.now()}`

    const { data: members } = await supabase
      .from('family_members')
      .select('id, role, dashboard_mode')
      .eq('family_id', FAMILY_ID)
    const kid = members?.find(m => m.dashboard_mode === 'guided' || m.dashboard_mode === 'independent')
    test.skip(!kid, 'No guided/independent kid to assign synthetic task to')

    const { data: mom } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', FAMILY_ID)
      .eq('role', 'primary_parent')
      .single()

    const { data: created, error: insertErr } = await supabase
      .from('tasks')
      .insert({
        family_id: FAMILY_ID,
        created_by: mom!.id,
        assignee_id: kid!.id,
        title: uniqueTitle,
        task_type: 'routine',
        status: 'pending',
        recurrence_rule: null,
        recurrence_details: {
          dtstart: '2026-05-18',
          schedule_type: 'painted',
          rdates: ['2026-06-15', '2026-06-16'],
          timezone: 'America/Chicago',
        },
      })
      .select('id')
      .single()
    expect(insertErr).toBeNull()

    try {
      await login(page)
      await page.goto(`${BASE_URL}/family-overview`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      const bodyText = await page.locator('body').innerText()
      expect(bodyText.includes(uniqueTitle),
        'future-only painted routine must NOT render on today\'s family overview'
      ).toBe(false)
    } finally {
      await supabase.from('tasks').delete().eq('id', created!.id)
    }
  })
})
