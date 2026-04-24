/**
 * Row 192 NEW-LL — Routine step checkbox idempotent toggle (Playwright UI test).
 *
 * Verifies the user-visible behavior of the migration 100165 / hook upsert
 * change at the UI layer:
 *
 *   - Checking a step writes a row.
 *   - Unchecking removes the row.
 *   - Re-checking after uncheck succeeds (1 row again).
 *   - Two parallel upserts (worst case for the old INSERT path) produce
 *     exactly +1 row, never +2.
 *
 * The "parallel upsert" path mirrors the Mosiah live-data scenario where
 * rapid retaps + optimistic-state lag were producing 17+ raw rows for 12
 * unique completed steps before migration 100165 + the hook upsert change.
 *
 * Strategy: log in as Miriam (existing kid in WarmthWisdomWork family),
 * find any routine step checkbox via the same 18px-button selector pattern
 * established in routine-miriam-checklist.spec.ts. Read row counts via the
 * Supabase REST API (service role) since the UI doesn't expose them directly.
 *
 * Run: npx playwright test tests/e2e/features/routine-step-toggle.spec.ts --headed --project=chromium
 */

import { test, expect, type Page } from '@playwright/test'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const BASE = 'http://localhost:5173'
const FAMILY_NAME = process.env.E2E_FAMILY_LOGIN_NAME || 'WarmthWisdomWork'
const MIRIAM_PIN = '1217'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
}
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function loginAsMiriam(page: Page) {
  await page.goto(`${BASE}/auth/sign-in`)
  await page.waitForLoadState('networkidle')

  const familyLoginLink = page.locator('a[href="/auth/family-login"]')
  await familyLoginLink.waitFor({ timeout: 10000 })
  await familyLoginLink.click()
  await page.waitForURL('**/auth/family-login**', { timeout: 10000 })
  await page.waitForLoadState('networkidle')

  const familyInput = page.locator('input[type="text"]').first()
  await familyInput.waitFor({ timeout: 10000 })
  await familyInput.fill(FAMILY_NAME)
  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(2000)

  const memberButton = page.locator('button').filter({ hasText: 'Miriam' })
  await memberButton.waitFor({ timeout: 10000 })
  await memberButton.click()
  await page.waitForTimeout(1000)

  const pinInput = page.locator('input[type="password"]').first()
  await pinInput.waitFor({ timeout: 10000 })
  await pinInput.fill(MIRIAM_PIN)
  await page.locator('button[type="submit"]').click()

  await page.waitForURL('**/dashboard**', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
}

/**
 * Click the first 18px step checkbox we can find on the page. Returns the
 * step text label so the test can use it for row-count queries.
 */
async function clickFirstStepCheckbox(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    const buttons = document.querySelectorAll('button')
    for (const btn of buttons) {
      if ((btn as HTMLButtonElement).style.width !== '18px') continue
      const row = btn.parentElement
      const span = row?.querySelector('span.text-xs')
      const text = span?.textContent ?? null
      ;(btn as HTMLButtonElement).click()
      return text
    }
    return null
  })
}

/** Count routine_step_completions rows for (memberDisplayName, today). */
async function countCompletionsToday(memberDisplayName: string): Promise<number> {
  const { data: kid } = await sb
    .from('family_members')
    .select('id, family_id')
    .eq('display_name', memberDisplayName)
    .single()
  if (!kid) throw new Error(`member ${memberDisplayName} not found`)
  const memberId = (kid as { id: string }).id

  const { data: today } = await sb.rpc('family_today', { p_member_id: memberId })

  const { count } = await sb
    .from('routine_step_completions')
    .select('id', { count: 'exact', head: true })
    .eq('family_member_id', memberId)
    .eq('period_date', today as string)

  return count ?? 0
}

test.describe('Routine step checkbox — idempotent toggle (NEW-LL)', () => {
  test.setTimeout(120000)

  test('check → uncheck → re-check produces clean 1/0/1 row state', async ({ page }) => {
    await loginAsMiriam(page)

    await page.goto(`${BASE}/tasks`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
    if ((await routinesTab.count()) > 0) {
      await routinesTab.first().click()
      await page.waitForTimeout(1500)
    }

    const initialCount = await countCompletionsToday('Miriam')
    console.log(`[seed] Miriam routine_step_completions today=${initialCount}`)

    // Step 1 — check a step.
    const stepText = await clickFirstStepCheckbox(page)
    expect(stepText, 'should find at least one routine step checkbox').not.toBeNull()
    console.log(`[step 1] checked: "${stepText}"`)
    await page.waitForTimeout(1500)

    const afterCheck = await countCompletionsToday('Miriam')
    expect(afterCheck, 'check should add exactly 1 row').toBe(initialCount + 1)

    // Step 2 — uncheck (re-click while checked).
    await clickFirstStepCheckbox(page)
    await page.waitForTimeout(1500)

    const afterUncheck = await countCompletionsToday('Miriam')
    expect(afterUncheck, 'uncheck should remove the row').toBe(initialCount)

    // Step 3 — re-check the same step.
    await clickFirstStepCheckbox(page)
    await page.waitForTimeout(1500)

    const afterRecheck = await countCompletionsToday('Miriam')
    expect(afterRecheck, 're-check should add 1 row again').toBe(initialCount + 1)

    // Cleanup — leave Miriam's data in initial state.
    await clickFirstStepCheckbox(page)
    await page.waitForTimeout(1500)
    const final = await countCompletionsToday('Miriam')
    expect(final, 'final cleanup uncheck restores initial state').toBe(initialCount)
  })

  test('parallel upserts produce exactly +1 row (write-layer idempotency)', async ({ page }) => {
    // Bypasses the UI button to assert the write-layer invariant directly.
    // Two upserts firing in parallel was the worst case for the pre-100165
    // INSERT path — Mosiah's tablet retries + optimistic state could fire
    // duplicate writes before the first one's response invalidated the
    // query cache. Migration 100165 + ignoreDuplicates upsert makes this
    // cleanly idempotent at the DB layer.
    await loginAsMiriam(page)
    await page.goto(`${BASE}/tasks`)
    await page.waitForLoadState('networkidle')

    // Get a real (task_id, step_id, member_id) by reading any routine step
    // visible on the page, then resolving identity via service role.
    const stepText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const checkbox = buttons.find(b => (b as HTMLButtonElement).style.width === '18px')
      if (!checkbox) return null
      const row = checkbox.parentElement
      const span = row?.querySelector('span.text-xs')
      return span?.textContent ?? null
    })
    expect(stepText, 'should find a step on the page').toBeTruthy()
    console.log(`[parallel-upsert] target step text: "${stepText}"`)

    const { data: kid } = await sb
      .from('family_members')
      .select('id')
      .eq('display_name', 'Miriam')
      .single()
    const memberId = (kid as { id: string }).id

    const { data: stepRow } = await sb
      .from('task_template_steps')
      .select('id, section_id, title')
      .eq('title', stepText!)
      .limit(1)
      .single()
    const stepId = (stepRow as { id: string }).id
    const sectionId = (stepRow as { section_id: string }).section_id

    const { data: section } = await sb
      .from('task_template_sections')
      .select('template_id')
      .eq('id', sectionId)
      .single()
    const templateId = (section as { template_id: string }).template_id

    const { data: task } = await sb
      .from('tasks')
      .select('id')
      .eq('template_id', templateId)
      .eq('assignee_id', memberId)
      .limit(1)
      .single()
    const taskId = (task as { id: string }).id

    const { data: today } = await sb.rpc('family_today', { p_member_id: memberId })

    // Ensure clean slate.
    await sb
      .from('routine_step_completions')
      .delete()
      .eq('task_id', taskId)
      .eq('step_id', stepId)
      .eq('member_id', memberId)
      .eq('period_date', today as string)

    const baseline = await countCompletionsToday('Miriam')

    const payload = {
      task_id: taskId,
      step_id: stepId,
      member_id: memberId,
      family_member_id: memberId,
      period_date: today as string,
    }
    const [r1, r2] = await Promise.all([
      sb.from('routine_step_completions').upsert(
        { ...payload, completed_at: new Date().toISOString() },
        { onConflict: 'step_id,family_member_id,period_date', ignoreDuplicates: true },
      ),
      sb.from('routine_step_completions').upsert(
        { ...payload, completed_at: new Date(Date.now() + 1).toISOString() },
        { onConflict: 'step_id,family_member_id,period_date', ignoreDuplicates: true },
      ),
    ])
    expect(r1.error, 'first parallel upsert should not error').toBeNull()
    expect(r2.error, 'second parallel upsert should not error').toBeNull()

    const after = await countCompletionsToday('Miriam')
    expect(
      after,
      'two parallel upserts must produce exactly +1 row (idempotency invariant)',
    ).toBe(baseline + 1)

    // Cleanup.
    await sb
      .from('routine_step_completions')
      .delete()
      .eq('task_id', taskId)
      .eq('step_id', stepId)
      .eq('member_id', memberId)
      .eq('period_date', today as string)
  })
})
