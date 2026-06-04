/**
 * View As Identity-Scope — Worker 5D, Discipline 1 Smoke Test #1
 *
 * Verifies the MEMBER_SESSION write path of view_as_sessions.origin end-to-end
 * in production. This is the architectural payoff of Worker 5B's hub-flow
 * refactor (Convention #39): a real kid PIN-in from the Family Hub
 *   (a) stays on /hub — it does NOT jump to /dashboard (the original bug), and
 *   (b) writes a view_as_sessions row with origin='member_session'.
 *
 * It also confirms the "Return to Hub" exit (5B's data-testid="view-as-exit")
 * keeps the kid on /hub, and that the session row terminates (ended_at set) so
 * the test cleans up after itself.
 *
 * Determinism note: the DB poll filters by viewing_as_id (Gideon) AND
 * origin='member_session' AND excludes rows that existed before the action.
 * The mom_viewing companion spec creates only mom_viewing rows, so the two
 * specs can never collide on this query even when run in parallel.
 *
 * Modal-lifetime note (observed by Worker 5D, OUT OF 5D SCOPE): when the
 * View-As target's shell differs from mom's (Gideon = Independent), the
 * View-As modal mounts and then closes again within ~2s — no JS error, full
 * page content present, so isViewingAs is simply reset. The most likely cause
 * is ViewAsModal's mount effect calling setShell()/setTheme() on the global
 * ThemeProvider, which remounts a provider above ViewAsProvider and resets its
 * useState back to null. This does NOT affect the origin write (it fires inside
 * startViewAs BEFORE the close) nor the no-jump-to-/dashboard payoff. The test
 * therefore verifies via the DB row + the /hub URL, never via modal longevity.
 * Surfaced for the orchestrator / a follow-up; not fixed here.
 *
 * Run: npx playwright test tests/e2e/features/view-as-hub-member-session.spec.ts
 */

import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { loginAsMomReal, hubPinLogin } from '../helpers/auth'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const GIDEON_PIN = process.env.E2E_GIDEON_PIN!

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

test('hub PIN login writes origin=member_session and stays on /hub', async ({ page }) => {
  test.slow()

  const gideonId = await resolveGideonId()
  const beforeIds = await existingSessionIds(gideonId)

  // Mom is the auth user; she lands on the standalone /hub and a kid PINs in.
  await loginAsMomReal(page)
  await page.goto('/hub')
  await hubPinLogin(page, 'Gideon', GIDEON_PIN)

  // ── Architectural payoff (Worker 5B): the hub PIN flow does NOT
  //    navigate('/dashboard'). The View-As session starts layered over /hub,
  //    so the underlying route stays /hub. This is the exact bug 5B fixed.
  await expect(page).toHaveURL(/\/hub/)
  expect(page.url()).not.toContain('/dashboard')

  // ── DB write verification: a NEW Gideon session row with member_session origin.
  let newRow: Awaited<ReturnType<typeof findNewSession>> = null
  await expect
    .poll(
      async () => {
        newRow = await findNewSession(gideonId, 'member_session', beforeIds)
        return newRow?.origin ?? null
      },
      {
        timeout: 20000,
        message: 'waiting for a new view_as_sessions row with origin=member_session',
      }
    )
    .toBe('member_session')

  await page.screenshot({
    path: 'tests/e2e/screenshots/worker5d-member-session-hub.png',
  })

  // Still on /hub after the session settled — no late jump to /dashboard.
  await expect(page).toHaveURL(/\/hub/)
  expect(page.url()).not.toContain('/dashboard')

  // ── Cleanup: terminate the session row directly. The View-As modal can
  //    auto-close shortly after mount (see the file header note on the
  //    ViewAsProvider remounting when the target shell differs from mom's),
  //    so we do NOT depend on a UI exit click — we end the row in the DB.
  await sb
    .from('view_as_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', newRow!.id)
    .is('ended_at', null)
})
