/**
 * Phase 3 — Connector Layer E2E Tests
 *
 * Verifies the full connector pipeline:
 *   contract creation → deed firing → dispatch_godmothers → grant delivery
 *
 * 14 tests across 10 scenarios:
 *   1. Contract CRUD via UI (4 tests)
 *   2. Task completion → points_godmother (1 test)
 *   3. Task completion → victory_godmother (1 test)
 *   4. Task completion → money_godmother (1 test)
 *   5. Intention iteration → custom_reward on threshold (1 test)
 *   6. Every-Nth IF pattern (1 test)
 *   7. Inheritance resolution — kid override vs family default (1 test)
 *   8. Presentation mode — toast pending reveal (1 test)
 *   9. Idempotency (2 tests)
 *  10. Contract inheritance visualization UI (1 test)
 */
import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { loginAsMom } from '../helpers/auth'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function sb(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ── Raw REST helpers ────────────────────────────────────────────────

async function restQuery(
  table: string,
  queryParams: string,
): Promise<Array<Record<string, unknown>>> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${queryParams}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GET ${table} failed (${res.status}): ${body}`)
  }
  return (await res.json()) as Array<Record<string, unknown>>
}

async function restInsert(
  table: string,
  row: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`INSERT ${table} failed (${res.status}): ${body}`)
  }
  const rows = (await res.json()) as Record<string, unknown>[]
  return rows[0]
}

async function restDelete(
  table: string,
  queryParams: string,
): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${queryParams}`
  await fetch(url, {
    method: 'DELETE',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  })
}

// ── Table accessibility check ───────────────────────────────────────

let tablesAccessible: boolean | null = null

async function checkTablesAccessible(): Promise<boolean> {
  if (tablesAccessible !== null) return tablesAccessible
  try {
    await restQuery('contracts', 'select=id&limit=0')
    await restQuery('contract_grant_log', 'select=id&limit=0')
    tablesAccessible = true
  } catch {
    tablesAccessible = false
  }
  return tablesAccessible
}

function skipIfNoAccess() {
  test.skip(
    tablesAccessible === false,
    'BLOCKED: contracts / contract_grant_log tables not accessible via PostgREST.',
  )
}

// ── Lookup helpers ──────────────────────────────────────────────────

interface FamilyInfo {
  familyId: string
  momMemberId: string
  kidAMemberId: string
  kidBMemberId: string
  kidAName: string
}

async function findTestFamily(): Promise<FamilyInfo> {
  const s = sb()

  // Always use the Testworth test family — never the founder's real family
  const { data: family, error: fErr } = await s
    .from('families')
    .select('id, primary_parent_id')
    .eq('family_login_name', 'testworthfamily')
    .single()
  if (fErr || !family) throw new Error(`Testworth family not found: ${fErr?.message}`)

  const { data: momMember } = await s
    .from('family_members')
    .select('id')
    .eq('family_id', family.id)
    .eq('user_id', family.primary_parent_id)
    .single()
  if (!momMember) throw new Error('Mom family_member row not found')

  // Get kids by role=member (excludes additional_adult and special_adult)
  const { data: kids } = await s
    .from('family_members')
    .select('id, display_name, role')
    .eq('family_id', family.id)
    .eq('role', 'member')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  if (!kids || kids.length < 2) throw new Error('Need at least 2 kid members (role=member)')

  return {
    familyId: family.id,
    momMemberId: momMember.id,
    kidAMemberId: kids[0].id,
    kidBMemberId: kids[1].id,
    kidAName: kids[0].display_name as string,
  }
}

// ── Cleanup tracker ─────────────────────────────────────────────────

const toCleanContracts: string[] = []
const toCleanTasks: string[] = []
const toCleanDeeds: string[] = []

async function cleanupAll() {
  const s = sb()
  for (const id of toCleanDeeds) {
    await restDelete('contract_grant_log', `deed_firing_id=eq.${id}`)
    await s.from('deed_firings').delete().eq('id', id)
  }
  toCleanDeeds.length = 0

  for (const id of toCleanContracts) {
    await restDelete('contracts', `id=eq.${id}`)
  }
  toCleanContracts.length = 0

  for (const id of toCleanTasks) {
    await s.from('task_completions').delete().eq('task_id', id)
    await s.from('tasks').delete().eq('id', id)
  }
  toCleanTasks.length = 0
}

// ── Seed helpers ────────────────────────────────────────────────────

async function seedContract(fields: Record<string, unknown>) {
  const data = await restInsert('contracts', fields)
  toCleanContracts.push(data.id as string)
  return data
}

async function seedTask(
  familyId: string, createdBy: string, assigneeId: string,
  extra?: Record<string, unknown>,
) {
  const s = sb()
  const { data, error } = await s
    .from('tasks')
    .insert({
      family_id: familyId,
      created_by: createdBy,
      assignee_id: assigneeId,
      title: `E2E Task ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      task_type: 'task',
      status: 'pending',
      source: 'manual',
      counts_for_gamification: true,
      counts_for_allowance: true,
      ...extra,
    })
    .select()
    .single()
  if (error) throw new Error(`seedTask: ${error.message}`)
  toCleanTasks.push(data.id)
  return data
}

async function insertDeed(
  familyId: string,
  memberId: string,
  sourceType: string,
  sourceId: string,
  idempotencyKey?: string,
) {
  const s = sb()
  const key = idempotencyKey ?? `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const { data, error } = await s
    .from('deed_firings')
    .insert({
      family_id: familyId,
      family_member_id: memberId,
      source_type: sourceType,
      source_id: sourceId,
      idempotency_key: key,
      metadata: {},
    })
    .select()
    .single()
  if (error) throw new Error(`insertDeed: ${error.message}`)
  toCleanDeeds.push(data.id)
  return data
}

async function grantsFor(deedId: string) {
  return restQuery('contract_grant_log', `deed_firing_id=eq.${deedId}&order=created_at.asc`)
}

function expectGranted(grant: Record<string, unknown>) {
  const status = grant.status as string
  if (status !== 'granted') {
    const meta = grant.metadata as Record<string, unknown> | null
    const errMsg = meta?.error_message ?? meta?.status ?? JSON.stringify(meta)
    throw new Error(
      `Expected grant status 'granted' but got '${status}'. ` +
      `godmother=${grant.godmother_type}, error=${errMsg}`,
    )
  }
}

async function ensureGamificationEnabled(familyId: string, memberId: string) {
  const s = sb()
  const { data: existing } = await s
    .from('gamification_configs')
    .select('id, enabled')
    .eq('family_id', familyId)
    .eq('family_member_id', memberId)
    .limit(1)

  if (existing && existing.length > 0) {
    if (!existing[0].enabled) {
      await s.from('gamification_configs')
        .update({ enabled: true })
        .eq('id', existing[0].id)
    }
  } else {
    await s.from('gamification_configs').insert({
      family_id: familyId,
      family_member_id: memberId,
      enabled: true,
      base_points_per_task: 10,
    })
  }
}

async function getMemberPoints(memberId: string): Promise<number> {
  const s = sb()
  const { data } = await s
    .from('family_members')
    .select('gamification_points')
    .eq('id', memberId)
    .single()
  return (data?.gamification_points as number) ?? 0
}

// ════════════════════════════════════════════════════════════════════
//  SCENARIO 1: Contract CRUD via UI
// ════════════════════════════════════════════════════════════════════

test.describe.serial('Contract CRUD via UI', () => {
  let info: FamilyInfo

  test.beforeAll(async () => {
    await checkTablesAccessible()
    info = await findTestFamily()

    // Clean up stale contracts from previous test runs that could cause unique constraint violations
    if (tablesAccessible) {
      await restDelete('contracts', `family_id=eq.${info.familyId}&godmother_type=eq.recognition_godmother&source_type=eq.task_completion`)
      await restDelete('contracts', `family_id=eq.${info.familyId}&godmother_type=eq.points_godmother&source_type=eq.task_completion&inheritance_level=eq.family_default`)
      await restDelete('contracts', `family_id=eq.${info.familyId}&godmother_type=eq.numerator_godmother&source_type=eq.widget_data_point`)
    }
  })

  test.afterAll(async () => { await cleanupAll() })

  test('navigates to /contracts and sees header + New Contract button', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/contracts')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1:has-text("Contracts")')).toBeVisible()
    await expect(page.locator('button:has-text("New Contract")')).toBeVisible()
  })

  test('creates a recognition-only contract with coloring advance', async ({ page }) => {
    skipIfNoAccess()
    await loginAsMom(page)
    await page.goto('/contracts')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("New Contract")')
    await expect(page.locator('h2:has-text("New Contract")')).toBeVisible()

    // Scope godmother selection via the "Then do this" section
    const godmotherSection = page.locator('button:has-text("Then do this")').locator('..')
    await godmotherSection.locator('button:has-text("Recognition Only")').click()

    // Recognition Only has payloadType 'none' — no Amount or Description fields
    await expect(godmotherSection.locator('label:has-text("Amount")')).not.toBeVisible()

    // Select Coloring advance in the "How the kid sees it" section
    const presentationSection = page.locator('button:has-text("How the kid sees it")').locator('..')
    await presentationSection.locator('button:has-text("Coloring advance")').click()

    await page.click('button:has-text("Create Contract")')

    // Wait for form to close and list to reappear
    await expect(page.locator('h1:has-text("Contracts")')).toBeVisible({ timeout: 10000 })

    const rows = await restQuery(
      'contracts',
      `family_id=eq.${info.familyId}&godmother_type=eq.recognition_godmother&status=eq.active&order=created_at.desc&limit=1`,
    )
    expect(rows.length).toBeGreaterThanOrEqual(1)
    expect(rows[0].presentation_mode).toBe('coloring_advance')
    toCleanContracts.push(rows[0].id as string)
  })

  test('creates a points contract with amount field', async ({ page }) => {
    skipIfNoAccess()
    await loginAsMom(page)
    await page.goto('/contracts')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("New Contract")')
    await expect(page.locator('h2:has-text("New Contract")')).toBeVisible()

    await page.click('button:has-text("Grant Points")')
    const amountInput = page.locator('input[type="number"][step="0.01"]')
    await expect(amountInput).toBeVisible()
    await amountInput.fill('25')

    await page.click('button:has-text("Create Contract")')
    await expect(page.locator('h1:has-text("Contracts")')).toBeVisible({ timeout: 5000 })

    const rows = await restQuery(
      'contracts',
      `family_id=eq.${info.familyId}&godmother_type=eq.points_godmother&payload_amount=eq.25&status=eq.active&order=created_at.desc&limit=1`,
    )
    expect(rows.length).toBeGreaterThanOrEqual(1)
    toCleanContracts.push(rows[0].id as string)
  })

  test('deletes and restores a contract', async ({ page }) => {
    skipIfNoAccess()
    const contract = await seedContract({
      family_id: info.familyId,
      created_by: info.momMemberId,
      source_type: 'widget_data_point',
      if_pattern: 'every_time',
      godmother_type: 'numerator_godmother',
      payload_amount: 1,
      stroke_of: 'immediate',
      inheritance_level: 'family_default',
      override_mode: 'replace',
      presentation_mode: 'silent',
      status: 'active',
    })

    await loginAsMom(page)
    await page.goto('/contracts')
    await page.waitForLoadState('networkidle')

    const card = page.locator('[class*="rounded-xl"]').filter({
      has: page.locator('text=Widget Data Point'),
    }).filter({
      has: page.locator('text=Numerator Boost'),
    }).first()
    await expect(card).toBeVisible()

    await card.locator('button[title="Delete"]').click()

    // Card moves to "Recently Deleted" section — verify it appears there
    await expect(page.locator('text=Recently Deleted')).toBeVisible({ timeout: 3000 })

    // Verify DB shows recently_deleted status
    const afterDelete = await restQuery('contracts', `id=eq.${contract.id}&select=status`)
    expect(afterDelete[0].status).toBe('recently_deleted')

    // Restore it
    const deletedArea = page.locator('h2:has-text("Recently Deleted")').locator('..').locator('..')
    await deletedArea.locator('button[title="Restore"]').first().click()

    // Wait for "Recently Deleted" section to disappear (no more deleted contracts)
    await page.waitForTimeout(1000)

    // Verify DB shows active again
    const afterRestore = await restQuery('contracts', `id=eq.${contract.id}&select=status,deleted_at`)
    expect(afterRestore[0].status).toBe('active')
    expect(afterRestore[0].deleted_at).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════════
//  SCENARIO 2: Task Completion → points_godmother
// ════════════════════════════════════════════════════════════════════

test.describe.serial('Task Completion → Points Awarded', () => {
  let info: FamilyInfo
  let pointsBefore: number

  test.beforeAll(async () => {
    await checkTablesAccessible()
    if (!tablesAccessible) return
    info = await findTestFamily()
    await ensureGamificationEnabled(info.familyId, info.kidAMemberId)
    pointsBefore = await getMemberPoints(info.kidAMemberId)
  })

  test.afterAll(async () => { await cleanupAll() })

  test('points_godmother fires on deed and awards 15 points', async () => {
    skipIfNoAccess()
    const task = await seedTask(info.familyId, info.momMemberId, info.kidAMemberId)

    await seedContract({
      family_id: info.familyId,
      created_by: info.momMemberId,
      source_type: 'widget_data_point',
      source_id: task.id,
      if_pattern: 'every_time',
      godmother_type: 'points_godmother',
      payload_amount: 15,
      stroke_of: 'immediate',
      inheritance_level: 'deed_override',
      override_mode: 'replace',
      presentation_mode: 'silent',
      status: 'active',
    })

    const deed = await insertDeed(info.familyId, info.kidAMemberId, 'widget_data_point', task.id)

    const grants = await grantsFor(deed.id)
    expect(grants.length).toBe(1)
    expect(grants[0].godmother_type).toBe('points_godmother')
    expectGranted(grants[0])

    const pointsAfter = await getMemberPoints(info.kidAMemberId)
    expect(pointsAfter).toBe(pointsBefore + 15)
  })
})

// ════════════════════════════════════════════════════════════════════
//  SCENARIO 3: Task Completion → victory_godmother
// ════════════════════════════════════════════════════════════════════

test.describe.serial('Task Completion → Victory Created', () => {
  let info: FamilyInfo

  test.beforeAll(async () => {
    await checkTablesAccessible()
    if (!tablesAccessible) return
    info = await findTestFamily()
  })

  test.afterAll(async () => {
    if (info) {
      const s = sb()
      await s.from('victories').delete()
        .eq('source', 'contract_grant').eq('family_id', info.familyId)
    }
    await cleanupAll()
  })

  test('victory_godmother creates a victory row', async () => {
    skipIfNoAccess()
    const task = await seedTask(info.familyId, info.momMemberId, info.kidAMemberId, {
      title: 'E2E Victory Task',
      victory_flagged: true,
    })

    await seedContract({
      family_id: info.familyId,
      created_by: info.momMemberId,
      source_type: 'widget_data_point',
      source_id: task.id,
      if_pattern: 'every_time',
      godmother_type: 'victory_godmother',
      stroke_of: 'immediate',
      inheritance_level: 'deed_override',
      override_mode: 'replace',
      presentation_mode: 'silent',
      status: 'active',
    })

    const deed = await insertDeed(info.familyId, info.kidAMemberId, 'widget_data_point', task.id)

    const grants = await grantsFor(deed.id)
    expect(grants.length).toBe(1)
    expect(grants[0].godmother_type).toBe('victory_godmother')
    expectGranted(grants[0])

    const s = sb()
    const { data: victories } = await s
      .from('victories')
      .select('*')
      .eq('family_id', info.familyId)
      .eq('source', 'contract_grant')
      .eq('family_member_id', info.kidAMemberId)
      .order('created_at', { ascending: false })
      .limit(1)

    expect(victories!.length).toBe(1)
  })
})

// ════════════════════════════════════════════════════════════════════
//  SCENARIO 4: Task Completion → money_godmother
// ════════════════════════════════════════════════════════════════════

test.describe.serial('Task Completion → Money Awarded', () => {
  let info: FamilyInfo

  test.beforeAll(async () => {
    await checkTablesAccessible()
    if (!tablesAccessible) return
    info = await findTestFamily()
  })

  test.afterAll(async () => {
    if (info) {
      const s = sb()
      await s.from('financial_transactions').delete()
        .eq('family_id', info.familyId)
        .eq('transaction_type', 'contract_grant')
    }
    await cleanupAll()
  })

  test('money_godmother creates a $2.50 financial transaction', async () => {
    skipIfNoAccess()
    const task = await seedTask(info.familyId, info.momMemberId, info.kidAMemberId)

    await seedContract({
      family_id: info.familyId,
      created_by: info.momMemberId,
      source_type: 'widget_data_point',
      source_id: task.id,
      if_pattern: 'every_time',
      godmother_type: 'money_godmother',
      payload_amount: 2.50,
      stroke_of: 'immediate',
      inheritance_level: 'deed_override',
      override_mode: 'replace',
      presentation_mode: 'silent',
      status: 'active',
    })

    const deed = await insertDeed(info.familyId, info.kidAMemberId, 'widget_data_point', task.id)

    const grants = await grantsFor(deed.id)
    expect(grants.length).toBe(1)
    expect(grants[0].godmother_type).toBe('money_godmother')
    expectGranted(grants[0])

    const s = sb()
    const { data: txns } = await s
      .from('financial_transactions')
      .select('*')
      .eq('family_id', info.familyId)
      .eq('family_member_id', info.kidAMemberId)
      .eq('transaction_type', 'contract_grant')
      .order('created_at', { ascending: false })
      .limit(1)

    expect(txns!.length).toBe(1)
    expect(Number(txns![0].amount)).toBe(2.50)
  })
})

// ════════════════════════════════════════════════════════════════════
//  SCENARIO 5: Intention Iteration → custom_reward on threshold
// ════════════════════════════════════════════════════════════════════

test.describe.serial('Intention Iteration → Threshold Custom Reward', () => {
  let info: FamilyInfo
  let intentionId: string

  test.beforeAll(async () => {
    await checkTablesAccessible()
    if (!tablesAccessible) return
    info = await findTestFamily()

    const s = sb()
    const { data, error } = await s
      .from('best_intentions')
      .insert({
        family_id: info.familyId,
        member_id: info.kidAMemberId,
        statement: 'E2E Test Best Intention',
        source: 'manual',
        is_active: true,
      })
      .select()
      .single()
    if (error) throw new Error(`Intention seed: ${error.message}`)
    intentionId = data.id
  })

  test.afterAll(async () => {
    if (intentionId) {
      const s = sb()
      await s.from('earned_prizes').delete()
        .eq('family_member_id', info.kidAMemberId)
        .like('prize_text', '%E2E ice cream%')
      await s.from('intention_iterations').delete().eq('intention_id', intentionId)
      await s.from('best_intentions').delete().eq('id', intentionId)
    }
    await cleanupAll()
  })

  test('custom_reward fires only on 3rd iteration, not before or after', async () => {
    skipIfNoAccess()

    await seedContract({
      family_id: info.familyId,
      created_by: info.momMemberId,
      source_type: 'intention_iteration',
      source_id: intentionId,
      family_member_id: info.kidAMemberId,
      if_pattern: 'on_threshold_cross',
      if_n: 3,
      godmother_type: 'custom_reward_godmother',
      payload_text: 'E2E ice cream trip!',
      stroke_of: 'immediate',
      inheritance_level: 'deed_override',
      override_mode: 'replace',
      presentation_mode: 'silent',
      status: 'active',
    })

    // Iterations 1 and 2: no grant
    const d1 = await insertDeed(info.familyId, info.kidAMemberId, 'intention_iteration', intentionId)
    expect((await grantsFor(d1.id)).length).toBe(0)

    const d2 = await insertDeed(info.familyId, info.kidAMemberId, 'intention_iteration', intentionId)
    expect((await grantsFor(d2.id)).length).toBe(0)

    // Iteration 3: threshold crossed → grant
    const d3 = await insertDeed(info.familyId, info.kidAMemberId, 'intention_iteration', intentionId)
    const g3 = await grantsFor(d3.id)
    expect(g3.length).toBe(1)
    expect(g3[0].godmother_type).toBe('custom_reward_godmother')
    expectGranted(g3[0])

    // Verify earned_prizes
    const s = sb()
    const { data: prizes } = await s
      .from('earned_prizes')
      .select('*')
      .eq('family_member_id', info.kidAMemberId)
      .like('prize_text', '%E2E ice cream%')
    expect(prizes!.length).toBe(1)

    // Iteration 4: threshold already crossed → no grant
    const d4 = await insertDeed(info.familyId, info.kidAMemberId, 'intention_iteration', intentionId)
    expect((await grantsFor(d4.id)).length).toBe(0)
  })
})

// ════════════════════════════════════════════════════════════════════
//  SCENARIO 6: Every-Nth IF pattern
// ════════════════════════════════════════════════════════════════════

test.describe.serial('Every-Nth IF Pattern', () => {
  let info: FamilyInfo
  let taskId: string
  let initialPoints: number

  test.beforeAll(async () => {
    await checkTablesAccessible()
    if (!tablesAccessible) return
    info = await findTestFamily()
    await ensureGamificationEnabled(info.familyId, info.kidAMemberId)
    initialPoints = await getMemberPoints(info.kidAMemberId)

    const task = await seedTask(info.familyId, info.momMemberId, info.kidAMemberId)
    taskId = task.id

    await seedContract({
      family_id: info.familyId,
      created_by: info.momMemberId,
      source_type: 'widget_data_point',
      source_id: taskId,
      family_member_id: info.kidAMemberId,
      if_pattern: 'every_nth',
      if_n: 3,
      godmother_type: 'points_godmother',
      payload_amount: 50,
      stroke_of: 'immediate',
      inheritance_level: 'deed_override',
      override_mode: 'replace',
      presentation_mode: 'silent',
      status: 'active',
    })
  })

  test.afterAll(async () => { await cleanupAll() })

  test('fires on 3rd and 6th, not 1st/2nd/4th/5th', async () => {
    skipIfNoAccess()

    const d1 = await insertDeed(info.familyId, info.kidAMemberId, 'widget_data_point', taskId)
    expect((await grantsFor(d1.id)).length).toBe(0)

    const d2 = await insertDeed(info.familyId, info.kidAMemberId, 'widget_data_point', taskId)
    expect((await grantsFor(d2.id)).length).toBe(0)

    const d3 = await insertDeed(info.familyId, info.kidAMemberId, 'widget_data_point', taskId)
    expect((await grantsFor(d3.id)).length).toBe(1)

    const d4 = await insertDeed(info.familyId, info.kidAMemberId, 'widget_data_point', taskId)
    expect((await grantsFor(d4.id)).length).toBe(0)

    const d5 = await insertDeed(info.familyId, info.kidAMemberId, 'widget_data_point', taskId)
    expect((await grantsFor(d5.id)).length).toBe(0)

    const d6 = await insertDeed(info.familyId, info.kidAMemberId, 'widget_data_point', taskId)
    expect((await grantsFor(d6.id)).length).toBe(1)

    const pointsNow = await getMemberPoints(info.kidAMemberId)
    expect(pointsNow).toBe(initialPoints + 100)
  })
})

// ════════════════════════════════════════════════════════════════════
//  SCENARIO 7: Inheritance resolution
// ════════════════════════════════════════════════════════════════════

test.describe.serial('Inheritance Resolution', () => {
  let info: FamilyInfo
  let kidAPointsBefore: number
  let kidBPointsBefore: number

  test.beforeAll(async () => {
    await checkTablesAccessible()
    if (!tablesAccessible) return
    info = await findTestFamily()
    await ensureGamificationEnabled(info.familyId, info.kidAMemberId)
    await ensureGamificationEnabled(info.familyId, info.kidBMemberId)
    kidAPointsBefore = await getMemberPoints(info.kidAMemberId)
    kidBPointsBefore = await getMemberPoints(info.kidBMemberId)
  })

  test.afterAll(async () => { await cleanupAll() })

  test('kid-override (20 pts) replaces family-default (5 pts); other kid gets default', async () => {
    skipIfNoAccess()
    const taskA = await seedTask(info.familyId, info.momMemberId, info.kidAMemberId)
    const taskB = await seedTask(info.familyId, info.momMemberId, info.kidBMemberId)

    // Family-default: 5 points on tracker_widget_event
    await seedContract({
      family_id: info.familyId,
      created_by: info.momMemberId,
      source_type: 'tracker_widget_event',
      family_member_id: null,
      if_pattern: 'every_time',
      godmother_type: 'points_godmother',
      payload_amount: 5,
      stroke_of: 'immediate',
      inheritance_level: 'family_default',
      override_mode: 'replace',
      presentation_mode: 'silent',
      status: 'active',
    })

    // Kid A override: 20 points
    await seedContract({
      family_id: info.familyId,
      created_by: info.momMemberId,
      source_type: 'tracker_widget_event',
      family_member_id: info.kidAMemberId,
      if_pattern: 'every_time',
      godmother_type: 'points_godmother',
      payload_amount: 20,
      stroke_of: 'immediate',
      inheritance_level: 'kid_override',
      override_mode: 'replace',
      presentation_mode: 'silent',
      status: 'active',
    })

    // Kid A → 20 pts (override wins)
    const deedA = await insertDeed(info.familyId, info.kidAMemberId, 'tracker_widget_event', taskA.id)
    const grantsA = await grantsFor(deedA.id)
    expect(grantsA.length).toBe(1)
    expectGranted(grantsA[0])
    expect(await getMemberPoints(info.kidAMemberId)).toBe(kidAPointsBefore + 20)

    // Kid B → 5 pts (family default)
    const deedB = await insertDeed(info.familyId, info.kidBMemberId, 'tracker_widget_event', taskB.id)
    const grantsB = await grantsFor(deedB.id)
    expect(grantsB.length).toBe(1)
    expectGranted(grantsB[0])
    expect(await getMemberPoints(info.kidBMemberId)).toBe(kidBPointsBefore + 5)
  })
})

// ════════════════════════════════════════════════════════════════════
//  SCENARIO 8: Presentation mode — toast pending reveal
// ════════════════════════════════════════════════════════════════════

test.describe.serial('Presentation Mode — Toast', () => {
  let info: FamilyInfo

  test.beforeAll(async () => {
    await checkTablesAccessible()
    if (!tablesAccessible) return
    info = await findTestFamily()
  })

  test.afterAll(async () => { await cleanupAll() })

  test('toast grant has revealed_at=NULL and is queryable as pending reveal', async () => {
    skipIfNoAccess()
    const task = await seedTask(info.familyId, info.momMemberId, info.kidAMemberId)

    await seedContract({
      family_id: info.familyId,
      created_by: info.momMemberId,
      source_type: 'widget_data_point',
      source_id: task.id,
      if_pattern: 'every_time',
      godmother_type: 'recognition_godmother',
      stroke_of: 'immediate',
      inheritance_level: 'deed_override',
      override_mode: 'replace',
      presentation_mode: 'toast',
      status: 'active',
    })

    const deed = await insertDeed(info.familyId, info.kidAMemberId, 'widget_data_point', task.id)
    const grants = await grantsFor(deed.id)

    expect(grants.length).toBe(1)
    expect(grants[0].presentation_mode).toBe('toast')
    expect(grants[0].revealed_at).toBeNull()

    const pending = await restQuery(
      'contract_grant_log',
      `family_member_id=eq.${info.kidAMemberId}&status=eq.granted&presentation_mode=neq.silent&revealed_at=is.null&select=id,presentation_mode`,
    )
    expect(pending.find(r => r.id === grants[0].id)).toBeTruthy()
  })
})

// ════════════════════════════════════════════════════════════════════
//  SCENARIO 9: Idempotency
// ════════════════════════════════════════════════════════════════════

test.describe.serial('Idempotency', () => {
  let info: FamilyInfo

  test.beforeAll(async () => {
    await checkTablesAccessible()
    if (!tablesAccessible) return
    info = await findTestFamily()
  })

  test.afterAll(async () => { await cleanupAll() })

  test('duplicate idempotency key is rejected at DB level', async () => {
    skipIfNoAccess()
    const task = await seedTask(info.familyId, info.momMemberId, info.kidAMemberId)
    const key = `e2e-idem-${Date.now()}`

    await insertDeed(info.familyId, info.kidAMemberId, 'widget_data_point', task.id, key)

    const s = sb()
    const { error } = await s.from('deed_firings').insert({
      family_id: info.familyId,
      family_member_id: info.kidAMemberId,
      source_type: 'widget_data_point',
      source_id: task.id,
      idempotency_key: key,
      metadata: {},
    })
    expect(error).toBeTruthy()
    expect(error!.code).toBe('23505')
  })

  test('dispatch_godmothers called twice produces exactly 1 grant', async () => {
    skipIfNoAccess()
    const task = await seedTask(info.familyId, info.momMemberId, info.kidAMemberId)

    await seedContract({
      family_id: info.familyId,
      created_by: info.momMemberId,
      source_type: 'widget_data_point',
      source_id: task.id,
      if_pattern: 'every_time',
      godmother_type: 'recognition_godmother',
      stroke_of: 'immediate',
      inheritance_level: 'deed_override',
      override_mode: 'replace',
      presentation_mode: 'silent',
      status: 'active',
    })

    const deed = await insertDeed(info.familyId, info.kidAMemberId, 'widget_data_point', task.id)
    expect((await grantsFor(deed.id)).length).toBe(1)

    const s = sb()
    await s.rpc('dispatch_godmothers', { p_deed_firing_id: deed.id })

    expect((await grantsFor(deed.id)).length).toBe(1)
  })
})

// ════════════════════════════════════════════════════════════════════
//  SCENARIO 10: Contract inheritance visualization UI
// ════════════════════════════════════════════════════════════════════

test.describe.serial('Contract Inheritance Visualization UI', () => {
  let info: FamilyInfo

  test.beforeAll(async () => {
    await checkTablesAccessible()
    if (!tablesAccessible) return
    info = await findTestFamily()
  })

  test.afterAll(async () => { await cleanupAll() })

  test('family-default and kid-override render in correct sections with member color', async ({ page }) => {
    skipIfNoAccess()

    // Use randomizer_drawn source — unlikely to collide with seeded contracts
    await seedContract({
      family_id: info.familyId,
      created_by: info.momMemberId,
      source_type: 'randomizer_drawn',
      family_member_id: null,
      if_pattern: 'every_time',
      godmother_type: 'recognition_godmother',
      stroke_of: 'immediate',
      inheritance_level: 'family_default',
      override_mode: 'replace',
      presentation_mode: 'silent',
      status: 'active',
    })

    await seedContract({
      family_id: info.familyId,
      created_by: info.momMemberId,
      source_type: 'randomizer_drawn',
      family_member_id: info.kidAMemberId,
      if_pattern: 'every_time',
      godmother_type: 'recognition_godmother',
      stroke_of: 'immediate',
      inheritance_level: 'kid_override',
      override_mode: 'replace',
      presentation_mode: 'toast',
      status: 'active',
    })

    await loginAsMom(page)
    await page.goto('/contracts')
    await page.waitForLoadState('networkidle')

    // Wait for contracts data to render (React Query fetch)
    await expect(page.locator('h2:has-text("Family Defaults")')).toBeVisible({ timeout: 10000 })

    // Kid A section with override — use longer timeout for data-driven render
    const kidHeading = page.locator(`h2:has-text("${info.kidAName}")`)
    await expect(kidHeading).toBeVisible({ timeout: 10000 })

    // Kid-override card has a colored left border (4px in member color)
    const kidCard = kidHeading.locator('..').locator('[class*="rounded-xl"]').first()
    await expect(kidCard).toBeVisible()

    const borderLeft = await kidCard.evaluate(el => getComputedStyle(el).borderLeftWidth)
    expect(parseFloat(borderLeft)).toBeGreaterThan(0)
  })
})
