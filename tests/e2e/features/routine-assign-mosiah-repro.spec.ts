/**
 * Reproduction test — assigning a customized routine to Mosiah
 *
 * Purpose:
 *   Tenise saw duplicate task rows + ghost sections land on a customized
 *   routine template after assigning it through the Studio Deploy flow
 *   (Herringbone: Mosiah got 2 identical task rows 63 seconds apart; the
 *   template accumulated 4 copies of every section). This test drives the
 *   exact real-world sequence — login as mom, open Studio, hit Deploy on
 *   a customized routine, pick Mosiah, save — and captures a DB snapshot
 *   before and after so we can see if duplicates reappear.
 *
 * Test subject: "School Day Requirements" (newest customized routine,
 * zero active task assignments, 6 sections). Safe to assign against
 * because it won't pollute active dashboards.
 *
 * Cleanup: archives any task rows this test creates on tear-down so
 * Mosiah's dashboard stays clean.
 *
 * Run:
 *   npx playwright test tests/e2e/features/routine-assign-mosiah-repro.spec.ts --headed --project=chromium
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const BASE_URL = 'http://localhost:5173'
const DEV_EMAIL = process.env.E2E_DEV_EMAIL!
const DEV_PASSWORD = process.env.E2E_DEV_PASSWORD!
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY!

if (!DEV_EMAIL || !DEV_PASSWORD || !SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error('Missing E2E_DEV_* or VITE_SUPABASE_* in .env.local')
}

const FAMILY_ID = '4bc86323-545b-4faf-b31f-3926fdd8c5a6'
const MOSIAH_ID = '476f5e1f-cdd9-4490-8409-59a4440ebd79'
const TEMPLATE_ID = '85326587-5a2c-4f0b-89cb-bfca9deb21c2' // School Day Requirements
const TEMPLATE_NAME = 'School Day Requirements'

type DbClient = ReturnType<typeof createClient>

async function getSupabaseAdmin(): Promise<DbClient> {
  // Uses anon + Tenise's auth session for RLS-bound reads. Good enough for
  // snapshot queries; we're not doing any privileged writes from the test.
  const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
  })
  if (error) throw new Error(`Supabase admin login failed: ${error.message}`)
  return client
}

interface Snapshot {
  sectionCount: number
  mosiahActiveTasks: { id: string; created_at: string }[]
  otherActiveTasks: { id: string; assignee_id: string; created_at: string }[]
}

async function snapshot(client: DbClient): Promise<Snapshot> {
  const { data: sections, error: secErr } = await client
    .from('task_template_sections')
    .select('id')
    .eq('template_id', TEMPLATE_ID)
  if (secErr) throw new Error(`section snapshot: ${secErr.message}`)

  const { data: tasks, error: taskErr } = await client
    .from('tasks')
    .select('id, assignee_id, created_at')
    .eq('template_id', TEMPLATE_ID)
    .is('archived_at', null)
  if (taskErr) throw new Error(`task snapshot: ${taskErr.message}`)

  const mosiahActiveTasks = (tasks ?? [])
    .filter(t => t.assignee_id === MOSIAH_ID)
    .map(t => ({ id: t.id as string, created_at: t.created_at as string }))
  const otherActiveTasks = (tasks ?? [])
    .filter(t => t.assignee_id !== MOSIAH_ID)
    .map(t => ({
      id: t.id as string,
      assignee_id: t.assignee_id as string,
      created_at: t.created_at as string,
    }))

  return {
    sectionCount: sections?.length ?? 0,
    mosiahActiveTasks,
    otherActiveTasks,
  }
}

// ── Auth injection for Tenise ─────────────────────────────────
async function loginTenise(page: Page): Promise<void> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await client.auth.signInWithPassword({
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
  })
  if (error || !data.session) {
    throw new Error(`Tenise login failed: ${error?.message}`)
  }
  await page.goto('/')
  const storageValue = JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    expires_in: data.session.expires_in,
    token_type: 'bearer',
    type: 'access',
    user: data.session.user,
  })
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key as string, value as string),
    ['myaim-auth', storageValue],
  )
  await page.reload()
  await page.waitForLoadState('networkidle')
}

test.use({
  launchOptions: { slowMo: 150 },
  viewport: { width: 1280, height: 900 },
})

test.describe('Routine assign → Mosiah — duplicate-write repro', () => {
  let client: DbClient
  let before: Snapshot
  let after: Snapshot | null = null
  const createdByTest: string[] = []

  test.beforeAll(async () => {
    client = await getSupabaseAdmin()
    before = await snapshot(client)
    console.log('\n━━━ BEFORE ━━━')
    console.log(`Template "${TEMPLATE_NAME}" sections: ${before.sectionCount}`)
    console.log(`Mosiah active tasks on this template: ${before.mosiahActiveTasks.length}`)
    console.log(`Other-member active tasks on this template: ${before.otherActiveTasks.length}`)
  })

  test.afterAll(async () => {
    // Archive anything this test created so Mosiah's dashboard stays clean.
    if (createdByTest.length > 0) {
      const { error } = await client
        .from('tasks')
        .update({ archived_at: new Date().toISOString() })
        .in('id', createdByTest)
      if (error) {
        console.error(`Cleanup failed: ${error.message}`)
      } else {
        console.log(`\n━━━ CLEANUP ━━━`)
        console.log(`Archived test-created task rows: ${createdByTest.join(', ')}`)
      }
    }
  })

  test('Deploy customized routine → Mosiah once; verify counts', async ({ page }) => {
    await loginTenise(page)

    // Studio page
    await page.goto(`${BASE_URL}/studio`)
    await page.waitForLoadState('networkidle')

    // Click the "My Customized" tab (rendered by <Tabs> — tab label text is
    // dynamic: "My Customized" when any templates exist, plain if zero).
    const customizedTab = page.getByText(/my customized/i).first()
    await expect(customizedTab).toBeVisible({ timeout: 8000 })
    await customizedTab.click()
    await page.waitForTimeout(500)

    // Find the card for School Day Requirements. Use getByText anchored to
    // the template name, then walk up to its card container.
    const cardTitle = page.getByText(TEMPLATE_NAME, { exact: false }).first()
    await expect(cardTitle).toBeVisible({ timeout: 8000 })

    // Deploy button lives inside the same card. Get the closest ancestor
    // that contains a Deploy button.
    const card = cardTitle.locator('xpath=ancestor::*[.//button[contains(translate(., "DEPLOY", "deploy"), "deploy")]][1]')
    const deployButton = card.locator('button').filter({ hasText: /^deploy$/i }).first()
    await expect(deployButton).toBeVisible({ timeout: 5000 })
    await deployButton.click()

    // Wait for TaskCreationModal to open. It renders the routine form with
    // pre-loaded sections. The primary CTA is "Assign & Create" for routines
    // with sections.
    const saveBtn = page.getByRole('button', { name: /assign & create|create task|save changes/i })
    await expect(saveBtn).toBeVisible({ timeout: 8000 })

    // Pick Mosiah as assignee. The assignment row is a compact colored pill
    // list per Convention 119. Click Mosiah's pill to select.
    const mosiahPill = page.getByRole('button', { name: /^Mosiah$/i }).first()
    await expect(mosiahPill).toBeVisible({ timeout: 5000 })
    await mosiahPill.click()

    // Submit
    await saveBtn.click()

    // Wait for the modal to close (indicates the save completed).
    await expect(saveBtn).toBeHidden({ timeout: 10000 })

    // Let caches settle
    await page.waitForTimeout(2000)

    after = await snapshot(client)
    console.log('\n━━━ AFTER ━━━')
    console.log(`Template "${TEMPLATE_NAME}" sections: ${after.sectionCount} (delta ${after.sectionCount - before.sectionCount})`)
    console.log(`Mosiah active tasks on this template: ${after.mosiahActiveTasks.length} (delta ${after.mosiahActiveTasks.length - before.mosiahActiveTasks.length})`)
    console.log(`Other-member active tasks on this template: ${after.otherActiveTasks.length} (delta ${after.otherActiveTasks.length - before.otherActiveTasks.length})`)

    // Record which task rows are attributable to this test for cleanup
    const beforeMosiahIds = new Set(before.mosiahActiveTasks.map(t => t.id))
    for (const t of after.mosiahActiveTasks) {
      if (!beforeMosiahIds.has(t.id)) createdByTest.push(t.id)
    }

    console.log('\n━━━ DIAGNOSIS ━━━')
    const sectionDelta = after.sectionCount - before.sectionCount
    const taskDelta = after.mosiahActiveTasks.length - before.mosiahActiveTasks.length

    if (sectionDelta === 0 && taskDelta === 1) {
      console.log('✅ CLEAN: exactly 1 task row for Mosiah, sections untouched.')
    } else {
      console.log(`❌ BUG REPRODUCED: section delta ${sectionDelta}, Mosiah-task delta ${taskDelta}`)
      if (sectionDelta > 0) console.log(`   → Deploy flow added ${sectionDelta} section rows. Expected 0.`)
      if (taskDelta > 1)    console.log(`   → Deploy flow created ${taskDelta} task rows for Mosiah. Expected 1.`)
      if (taskDelta === 0)  console.log(`   → Deploy flow created 0 task rows for Mosiah. Save likely failed.`)
    }

    // Hard assertions — fail the test visibly if duplicates appeared
    expect(sectionDelta, `Template sections should not change on Deploy — found delta ${sectionDelta}`).toBe(0)
    expect(taskDelta, `Mosiah should get exactly 1 new task row — got delta ${taskDelta}`).toBe(1)
  })
})
