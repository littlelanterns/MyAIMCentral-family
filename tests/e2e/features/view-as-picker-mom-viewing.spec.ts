/**
 * View As Identity-Scope — Worker 5D, Discipline 1 Smoke Test #2
 *
 * Verifies the MOM_VIEWING write path of view_as_sessions.origin end-to-end in
 * production. Mom, from her own dashboard, opens the "View As…" perspective tab
 * and selects a child. The session row must carry origin='mom_viewing'.
 *
 * Implementation note (surfaced by Worker 5D): the dashboard's mom-initiated
 * fresh-start View-As is the ViewAsMemberPills component (Dashboard.tsx), which
 * calls startViewAs WITHOUT an explicit origin and relies on the provider's
 * 'mom_viewing' default. The ViewAsMemberPicker (which passes origin explicitly,
 * per Worker 5B) is only reached via the in-modal "Switch" button while ALREADY
 * viewing. Both converge on origin='mom_viewing'; this spec drives the real
 * mom-facing fresh-start UI (the pills) so the verification is faithful.
 *
 * Determinism note: the DB poll filters by viewing_as_id (Gideon) AND
 * origin='mom_viewing' AND excludes pre-existing rows. The member_session
 * companion spec creates only member_session rows, so the two specs never
 * collide on this query even when run in parallel.
 *
 * Modal-lifetime note (observed by Worker 5D, OUT OF 5D SCOPE): when the
 * View-As target's shell differs from mom's (Gideon = Independent), the
 * View-As modal mounts and then closes again within ~2s — no JS error, full
 * page content present, so isViewingAs is simply reset (likely ViewAsModal's
 * mount effect calling setShell()/setTheme() remounts a provider above
 * ViewAsProvider). This does NOT affect the origin write, which fires inside
 * startViewAs BEFORE any close. The test verifies via the DB row, and cleans
 * up the session row directly in the DB rather than via a UI exit click.
 * Surfaced for the orchestrator / a follow-up; not fixed here.
 *
 * Run: npx playwright test tests/e2e/features/view-as-picker-mom-viewing.spec.ts
 */

import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { loginAsMomReal } from '../helpers/auth'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/** Resolve Gideon's family_member id. Asserts exactly one active match. */
async function resolveGideonId(): Promise<string> {
  const { data, error } = await sb
    .from('family_members')
    .select('id, display_name')
    .ilike('display_name', 'Gideon%')
    .eq('is_active', true)
  if (error) throw error
  if (!data || data.length !== 1) {
    throw new Error(
      `Expected exactly 1 active family member matching "Gideon", got ${data?.length ?? 0}. ` +
        `Scope the resolver to the founder family if production has multiple Gideons.`
    )
  }
  return data[0].id
}

/** Snapshot the ids of view_as_sessions rows already pointing at Gideon. */
async function existingSessionIds(gideonId: string): Promise<Set<string>> {
  const { data, error } = await sb
    .from('view_as_sessions')
    .select('id')
    .eq('viewing_as_id', gideonId)
  if (error) throw error
  return new Set((data ?? []).map((r) => r.id as string))
}

/**
 * Find a NEW view_as_sessions row for Gideon with the given origin that did not
 * exist before the action. Returns null until one appears.
 */
async function findNewSession(
  gideonId: string,
  origin: string,
  excludeIds: Set<string>
): Promise<{ id: string; origin: string; ended_at: string | null } | null> {
  const { data, error } = await sb
    .from('view_as_sessions')
    .select('id, origin, viewing_as_id, started_at, ended_at')
    .eq('viewing_as_id', gideonId)
    .order('started_at', { ascending: false })
    .limit(20)
  if (error) throw error
  const row = (data ?? []).find(
    (r) => !excludeIds.has(r.id as string) && r.origin === origin
  )
  return row
    ? { id: row.id as string, origin: row.origin as string, ended_at: (row.ended_at as string | null) ?? null }
    : null
}

test('dashboard View As picker writes origin=mom_viewing', async ({ page }) => {
  test.slow()

  const gideonId = await resolveGideonId()
  const beforeIds = await existingSessionIds(gideonId)

  await loginAsMomReal(page)
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')

  // Open the "View As…" perspective tab (label "View As..." / short "View As").
  const viewAsTab = page.getByRole('tab', { name: /View As/i })
  await viewAsTab.waitFor({ state: 'visible', timeout: 15000 })
  await viewAsTab.click()

  // The pills render under this heading; select Gideon's pill.
  await page
    .getByText('Choose a family member to see their dashboard experience')
    .waitFor({ state: 'visible', timeout: 10000 })
  const gideonPill = page.getByRole('button').filter({ hasText: 'Gideon' })
  await gideonPill.first().click()

  // ── ViewAsModal mounts (banner with the exit affordance is the mount signal).
  await expect(page.locator('[data-testid="view-as-exit"]')).toBeVisible({ timeout: 15000 })

  // ── DB write verification: a NEW Gideon session row with mom_viewing origin.
  let newRow: Awaited<ReturnType<typeof findNewSession>> = null
  await expect
    .poll(
      async () => {
        newRow = await findNewSession(gideonId, 'mom_viewing', beforeIds)
        return newRow?.origin ?? null
      },
      {
        timeout: 20000,
        message: 'waiting for a new view_as_sessions row with origin=mom_viewing',
      }
    )
    .toBe('mom_viewing')

  await page.screenshot({
    path: 'tests/e2e/screenshots/worker5d-mom-viewing-modal.png',
  })

  // ── Cleanup: terminate the session row directly. The View-As modal can
  //    auto-close shortly after mount (see the file header note), so we end the
  //    row in the DB rather than depending on a fragile UI exit click.
  await sb
    .from('view_as_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', newRow!.id)
    .is('ended_at', null)
})
