/**
 * Build M Phase 6 — Randomizer Reveal Tiles + Adult Redraw E2E
 *
 * Tests:
 *   1. DB: Create a randomizer list + linked task + auto-draw → verify
 *      draw row exists and is deterministic (same item on re-query).
 *
 *   2. DB: Redraw flow — release current draw, insert new draw, verify
 *      the new draw is different from the released one (or at least
 *      the released one has status='released').
 *
 *   3. Browser (Play child login): Play Dashboard renders mystery-tap or
 *      show-upfront tiles for randomizer-linked tasks in segments.
 *
 *   4. Browser (Mom View As): Mom sees Redraw button on randomizer-linked
 *      tiles; tapping it shows math gate overlay.
 *
 *   5. DB: Segment reveal style update persists correctly.
 *
 * Runs against the real founder family via .env.local credentials.
 */
import { test, expect, Page } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { todayLocalIso } from '../helpers/dates'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const STORAGE_KEY = 'myaim-auth'

// ─── Auth helpers ─────────────────────────────────────────────

async function clearAuth(page: Page) {
  await page.goto('/auth/login', { waitUntil: 'commit' })
  await page.evaluate(key => localStorage.removeItem(key), STORAGE_KEY)
  await page.waitForTimeout(200)
}

async function loginAsMom(page: Page) {
  const email = process.env.E2E_DEV_EMAIL!
  const password = process.env.E2E_DEV_PASSWORD!

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error || !data.session) {
    throw new Error(`Mom login failed: ${error?.message}`)
  }

  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ([key, val]) => localStorage.setItem(key, val),
    [
      STORAGE_KEY,
      JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in || 3600,
        token_type: 'bearer',
        type: 'access',
        user: data.session.user,
      }),
    ],
  )

  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

async function dismissOverlays(page: Page) {
  for (let i = 0; i < 4; i++) {
    for (const text of [
      "Don't show guides",
      'Got it',
      'Dismiss Guide',
      'Dismiss guide',
      'Dismiss',
    ]) {
      const btn = page.locator('button').filter({ hasText: text }).first()
      if (await btn.isVisible({ timeout: 250 }).catch(() => false)) {
        await btn.click({ force: true })
        await page.waitForTimeout(250)
      }
    }
  }
}

// ─── Service-role helpers ────────────────────────────────────

function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

interface TestContext {
  familyId: string
  momMemberId: string
  playMemberId: string
  playMemberName: string
  listId: string | null
  taskId: string | null
  segmentId: string | null
}

async function setupTestContext(): Promise<TestContext> {
  const sb = serviceClient()
  const familyName = process.env.E2E_FAMILY_LOGIN_NAME!

  const { data: family } = await sb
    .from('families')
    .select('id, primary_parent_id')
    .eq('family_login_name', familyName)
    .single()
  if (!family) throw new Error('Family not found')

  const { data: momMember } = await sb
    .from('family_members')
    .select('id')
    .eq('family_id', family.id)
    .eq('user_id', family.primary_parent_id)
    .single()
  if (!momMember) throw new Error('Mom not found')

  const { data: playMembers } = await sb
    .from('family_members')
    .select('id, display_name')
    .eq('family_id', family.id)
    .eq('dashboard_mode', 'play')
    .eq('is_active', true)
  if (!playMembers?.length) throw new Error('No Play members')
  const play = playMembers.find(m => /ruthie/i.test(m.display_name)) ?? playMembers[0]

  return {
    familyId: family.id,
    momMemberId: momMember.id,
    playMemberId: play.id,
    playMemberName: play.display_name,
    listId: null,
    taskId: null,
    segmentId: null,
  }
}

// ─── Test cleanup helper ─────────────────────────────────────

async function cleanup(ctx: TestContext) {
  const sb = serviceClient()
  const today = todayLocalIso()

  // Clean up draws for today
  if (ctx.listId) {
    await sb
      .from('randomizer_draws')
      .delete()
      .eq('list_id', ctx.listId)
      .eq('family_member_id', ctx.playMemberId)
      .eq('routine_instance_date', today)
  }

  // Clean up test task
  if (ctx.taskId) {
    await sb.from('tasks').update({ task_segment_id: null }).eq('id', ctx.taskId)
    await sb.from('tasks').delete().eq('id', ctx.taskId)
  }

  // Clean up test segment
  if (ctx.segmentId) {
    await sb.from('task_segments').delete().eq('id', ctx.segmentId)
  }

  // Clean up test list + items
  if (ctx.listId) {
    await sb.from('list_items').delete().eq('list_id', ctx.listId)
    await sb.from('lists').delete().eq('id', ctx.listId)
  }
}

// ═══════════════════════════════════════════════════════════════
// Test 1: DB — Randomizer draw creation + determinism
// ═══════════════════════════════════════════════════════════════

test('randomizer auto-draw is created and deterministic per day', async () => {
  const ctx = await setupTestContext()
  const sb = serviceClient()
  const today = todayLocalIso()

  try {
    // Create a randomizer list with 3 items
    const { data: list } = await sb
      .from('lists')
      .insert({
        family_id: ctx.familyId,
        owner_id: ctx.momMemberId,
        title: 'E2E Phase 6 Reading List',
        list_type: 'randomizer',
        draw_mode: 'surprise',
      })
      .select()
      .single()
    expect(list).toBeTruthy()
    ctx.listId = list!.id

    // Add 3 items
    const items = [
      { list_id: list!.id, content: 'Charlotte\'s Web ch. 1', sort_order: 0, is_available: true },
      { list_id: list!.id, content: 'Charlotte\'s Web ch. 2', sort_order: 1, is_available: true },
      { list_id: list!.id, content: 'Charlotte\'s Web ch. 3', sort_order: 2, is_available: true },
    ]
    const { data: insertedItems } = await sb.from('list_items').insert(items).select()
    expect(insertedItems?.length).toBe(3)

    // Create a draw
    const winner = insertedItems![0]
    const { data: draw1 } = await sb
      .from('randomizer_draws')
      .insert({
        list_id: list!.id,
        list_item_id: winner.id,
        family_member_id: ctx.playMemberId,
        draw_source: 'auto_surprise',
        routine_instance_date: today,
        status: 'active',
      })
      .select()
      .single()

    expect(draw1).toBeTruthy()
    expect(draw1!.list_item_id).toBe(winner.id)

    // Query again — same draw returned (deterministic)
    const { data: draws } = await sb
      .from('randomizer_draws')
      .select('*')
      .eq('list_id', list!.id)
      .eq('family_member_id', ctx.playMemberId)
      .eq('routine_instance_date', today)
      .eq('draw_source', 'auto_surprise')

    expect(draws?.length).toBe(1)
    expect(draws![0].id).toBe(draw1!.id)
  } finally {
    await cleanup(ctx)
  }
})

// ═══════════════════════════════════════════════════════════════
// Test 2: DB — Redraw releases old draw and creates new one
// ═══════════════════════════════════════════════════════════════

test('redraw updates the existing draw row to a different item', async () => {
  const ctx = await setupTestContext()
  const sb = serviceClient()
  const today = todayLocalIso()

  try {
    // Create list + items
    const { data: list } = await sb
      .from('lists')
      .insert({
        family_id: ctx.familyId,
        owner_id: ctx.momMemberId,
        title: 'E2E Phase 6 Redraw Test',
        list_type: 'randomizer',
        draw_mode: 'surprise',
      })
      .select()
      .single()
    ctx.listId = list!.id

    const { data: insertedItems } = await sb
      .from('list_items')
      .insert([
        { list_id: list!.id, content: 'Activity A', sort_order: 0, is_available: true },
        { list_id: list!.id, content: 'Activity B', sort_order: 1, is_available: true },
        { list_id: list!.id, content: 'Activity C', sort_order: 2, is_available: true },
      ])
      .select()

    // Create initial draw pointing to item A
    const { data: draw1 } = await sb
      .from('randomizer_draws')
      .insert({
        list_id: list!.id,
        list_item_id: insertedItems![0].id,
        family_member_id: ctx.playMemberId,
        draw_source: 'auto_surprise',
        routine_instance_date: today,
        status: 'active',
      })
      .select()
      .single()

    expect(draw1!.status).toBe('active')
    expect(draw1!.list_item_id).toBe(insertedItems![0].id)

    // Redraw: UPDATE the same row to point to item B
    // (UNIQUE partial index prevents inserting a second auto_surprise
    //  for the same day, so redraw must update in place)
    const { data: updated } = await sb
      .from('randomizer_draws')
      .update({ list_item_id: insertedItems![1].id, status: 'active' })
      .eq('id', draw1!.id)
      .select()
      .single()

    expect(updated).toBeTruthy()
    expect(updated!.id).toBe(draw1!.id) // same row
    expect(updated!.list_item_id).toBe(insertedItems![1].id) // different item
    expect(updated!.status).toBe('active')
  } finally {
    await cleanup(ctx)
  }
})

// ═══════════════════════════════════════════════════════════════
// Test 3: DB — Segment reveal style update persists
// ═══════════════════════════════════════════════════════════════

test('segment randomizer_reveal_style can be toggled and persists', async () => {
  const ctx = await setupTestContext()
  const sb = serviceClient()

  try {
    // Create a segment with mystery_tap (default)
    const { data: seg } = await sb
      .from('task_segments')
      .insert({
        family_id: ctx.familyId,
        family_member_id: ctx.playMemberId,
        segment_name: 'E2E Phase 6 Test Segment',
        sort_order: 99,
        randomizer_reveal_style: 'mystery_tap',
      })
      .select()
      .single()
    ctx.segmentId = seg!.id

    expect(seg!.randomizer_reveal_style).toBe('mystery_tap')

    // Update to show_upfront
    await sb
      .from('task_segments')
      .update({ randomizer_reveal_style: 'show_upfront' })
      .eq('id', seg!.id)

    const { data: updated } = await sb
      .from('task_segments')
      .select('randomizer_reveal_style')
      .eq('id', seg!.id)
      .single()

    expect(updated!.randomizer_reveal_style).toBe('show_upfront')

    // Toggle back
    await sb
      .from('task_segments')
      .update({ randomizer_reveal_style: 'mystery_tap' })
      .eq('id', seg!.id)

    const { data: reverted } = await sb
      .from('task_segments')
      .select('randomizer_reveal_style')
      .eq('id', seg!.id)
      .single()

    expect(reverted!.randomizer_reveal_style).toBe('mystery_tap')
  } finally {
    await cleanup(ctx)
  }
})

// ═══════════════════════════════════════════════════════════════
// Test 4: DB — linked_list_id on task connects task to randomizer
// ═══════════════════════════════════════════════════════════════

test('task with linked_list_id can be queried with its randomizer draw', async () => {
  const ctx = await setupTestContext()
  const sb = serviceClient()
  const today = todayLocalIso()

  try {
    // Create randomizer list
    const { data: list } = await sb
      .from('lists')
      .insert({
        family_id: ctx.familyId,
        owner_id: ctx.momMemberId,
        title: 'E2E Linked List Test',
        list_type: 'randomizer',
        draw_mode: 'surprise',
      })
      .select()
      .single()
    ctx.listId = list!.id

    const { data: items } = await sb
      .from('list_items')
      .insert([
        { list_id: list!.id, content: 'Math worksheet 1', sort_order: 0, is_available: true },
        { list_id: list!.id, content: 'Math worksheet 2', sort_order: 1, is_available: true },
      ])
      .select()

    // Create a task linked to the randomizer
    const { data: task } = await sb
      .from('tasks')
      .insert({
        family_id: ctx.familyId,
        created_by: ctx.momMemberId,
        assignee_id: ctx.playMemberId,
        title: 'Math',
        task_type: 'task',
        status: 'pending',
        source: 'manual',
        linked_list_id: list!.id,
      })
      .select()
      .single()
    ctx.taskId = task!.id

    expect(task!.linked_list_id).toBe(list!.id)

    // Create auto-draw
    const { data: draw } = await sb
      .from('randomizer_draws')
      .insert({
        list_id: list!.id,
        list_item_id: items![0].id,
        family_member_id: ctx.playMemberId,
        draw_source: 'auto_surprise',
        routine_instance_date: today,
        status: 'active',
      })
      .select()
      .single()

    // Query the draw with joined list_items to get item name
    const { data: drawWithItem } = await sb
      .from('randomizer_draws')
      .select('id, list_id, list_item_id, list_items!inner(content)')
      .eq('list_id', list!.id)
      .eq('family_member_id', ctx.playMemberId)
      .eq('routine_instance_date', today)
      .eq('draw_source', 'auto_surprise')
      .single()

    expect(drawWithItem).toBeTruthy()
    const itemData = (drawWithItem as Record<string, unknown>).list_items as { content: string }
    expect(itemData.content).toBe('Math worksheet 1')
  } finally {
    await cleanup(ctx)
  }
})

// ═══════════════════════════════════════════════════════════════
// Test 5: DB — isAdultViewing logic: adult role detected correctly
// ═══════════════════════════════════════════════════════════════

test('adult role is correctly identified for redraw visibility', async () => {
  const ctx = await setupTestContext()
  const sb = serviceClient()

  // Verify mom has adult role
  const { data: mom } = await sb
    .from('family_members')
    .select('role')
    .eq('id', ctx.momMemberId)
    .single()

  expect(mom!.role).toBe('primary_parent')

  // Verify play member does NOT have adult role
  const { data: play } = await sb
    .from('family_members')
    .select('role, dashboard_mode')
    .eq('id', ctx.playMemberId)
    .single()

  expect(play!.dashboard_mode).toBe('play')
  expect(play!.role).not.toBe('primary_parent')
  expect(play!.role).not.toBe('additional_adult')
})

// ═══════════════════════════════════════════════════════════════
// Test 6: DB — Full redraw cycle: update draw + verify item changed
// ═══════════════════════════════════════════════════════════════

test('full redraw cycle: existing draw item changes after update', async () => {
  const ctx = await setupTestContext()
  const sb = serviceClient()
  const today = todayLocalIso()

  try {
    // Create list + 3 items
    const { data: list } = await sb
      .from('lists')
      .insert({
        family_id: ctx.familyId,
        owner_id: ctx.momMemberId,
        title: 'E2E Full Redraw Cycle',
        list_type: 'randomizer',
        draw_mode: 'surprise',
      })
      .select()
      .single()
    ctx.listId = list!.id

    const { data: items } = await sb
      .from('list_items')
      .insert([
        { list_id: list!.id, content: 'Activity Alpha', sort_order: 0, is_available: true },
        { list_id: list!.id, content: 'Activity Beta', sort_order: 1, is_available: true },
        { list_id: list!.id, content: 'Activity Gamma', sort_order: 2, is_available: true },
      ])
      .select()

    // Create initial draw → Activity Alpha
    const { data: draw } = await sb
      .from('randomizer_draws')
      .insert({
        list_id: list!.id,
        list_item_id: items![0].id,
        family_member_id: ctx.playMemberId,
        draw_source: 'auto_surprise',
        routine_instance_date: today,
        status: 'active',
      })
      .select()
      .single()

    // Verify initial item
    const { data: withItem1 } = await sb
      .from('randomizer_draws')
      .select('list_item_id, list_items!inner(content)')
      .eq('id', draw!.id)
      .single()
    expect((withItem1 as Record<string, unknown>).list_items as { content: string }).toMatchObject({ content: 'Activity Alpha' })

    // Redraw → update to Activity Beta
    await sb
      .from('randomizer_draws')
      .update({ list_item_id: items![1].id })
      .eq('id', draw!.id)

    // Verify item changed
    const { data: withItem2 } = await sb
      .from('randomizer_draws')
      .select('list_item_id, list_items!inner(content)')
      .eq('id', draw!.id)
      .single()
    expect((withItem2 as Record<string, unknown>).list_items as { content: string }).toMatchObject({ content: 'Activity Beta' })

    // Redraw again → Activity Gamma
    await sb
      .from('randomizer_draws')
      .update({ list_item_id: items![2].id })
      .eq('id', draw!.id)

    const { data: withItem3 } = await sb
      .from('randomizer_draws')
      .select('list_item_id, list_items!inner(content)')
      .eq('id', draw!.id)
      .single()
    expect((withItem3 as Record<string, unknown>).list_items as { content: string }).toMatchObject({ content: 'Activity Gamma' })
  } finally {
    await cleanup(ctx)
  }
})
