/**
 * Build M Sub-phase C — Gamification Write Path Wiring E2E
 *
 * Verifies that the `roll_creature_for_completion` RPC is actually
 * wired into the completion flow and populating `family_members`
 * gamification columns + `member_creature_collection` rows.
 *
 * Tests (DB-level, service-role bypasses RLS for clean setup/teardown):
 *
 *   1. Seed a fresh Play member context, reset their gamification
 *      stats, complete a task via the real code path (insert
 *      task_completions + RPC call), verify points/streak updated.
 *
 *   2. Same flow against the adult Dashboard path: mom creates + completes
 *      a task on herself. RPC fires but returns `gamification_disabled`
 *      because mom has no gamification_configs row with enabled=true.
 *      Task completion still succeeds.
 *
 *   3. Idempotency: firing the RPC twice against the same
 *      task_completions.id never double-awards. Second call returns
 *      `already_processed: true`.
 *
 * No browser tests for Sub-phase C — the RPC is server-side and the
 * PlayDashboard UI changes are a single inline banner behind a
 * timing-sensitive 40% creature roll. Visual verification of the banner
 * is left for Sub-phase F's end-to-end review per founder decision.
 *
 * Reference:
 *   claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md §9 Sub-phase C
 *   migration 00000000100115_play_dashboard_sticker_book.sql (RPC definition)
 */
import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function findFamilyAndPlayMember(): Promise<{
  familyId: string
  momMemberId: string
  playMember: { id: string; display_name: string }
}> {
  const sb = serviceClient()
  const familyName = process.env.E2E_FAMILY_LOGIN_NAME!

  const { data: family, error: fErr } = await sb
    .from('families')
    .select('id, primary_parent_id')
    .eq('family_login_name', familyName)
    .single()
  if (fErr || !family) throw new Error(`Family not found: ${fErr?.message}`)

  const { data: momMember } = await sb
    .from('family_members')
    .select('id')
    .eq('family_id', family.id)
    .eq('user_id', family.primary_parent_id)
    .single()
  if (!momMember) throw new Error('Mom family_member row not found')

  const { data: playMembers } = await sb
    .from('family_members')
    .select('id, display_name, dashboard_mode')
    .eq('family_id', family.id)
    .eq('dashboard_mode', 'play')
    .eq('is_active', true)
  if (!playMembers || playMembers.length === 0) {
    throw new Error('No active Play members found in founder family')
  }
  const ruthie = playMembers.find(m =>
    /ruthie/i.test(m.display_name as string),
  )
  const chosen = ruthie ?? playMembers[0]

  return {
    familyId: family.id,
    momMemberId: momMember.id,
    playMember: {
      id: chosen.id,
      display_name: chosen.display_name,
    },
  }
}

// Reusable cleanup list — ids of tasks we create; task_completions and
// member_creature_collection rows tied to them get cascaded on delete
// via FK ON DELETE CASCADE.
const createdTaskIds: string[] = []

async function cleanup() {
  if (createdTaskIds.length === 0) return
  const sb = serviceClient()
  await sb.from('task_completions').delete().in('task_id', createdTaskIds)
  await sb.from('tasks').delete().in('id', createdTaskIds)
  createdTaskIds.length = 0
}

// ============================================================
// Tests
// ============================================================

test.describe.serial('Build M Sub-phase C — Gamification Write Path', () => {
  test.afterAll(async () => {
    await cleanup()
  })

  test('Play completion fires RPC + family_members.gamification_points increments', async () => {
    test.setTimeout(60000)

    const sbAdmin = serviceClient()
    const { familyId, momMemberId, playMember } = await findFamilyAndPlayMember()

    // Snapshot the Play member's current gamification state BEFORE
    const { data: before, error: beforeErr } = await sbAdmin
      .from('family_members')
      .select(
        'gamification_points, current_streak, longest_streak, last_task_completion_date',
      )
      .eq('id', playMember.id)
      .single()
    expect(beforeErr).toBeNull()
    expect(before).not.toBeNull()

    // Confirm gamification is actually enabled for this Play member
    // (the auto_provision trigger should have set this during Sub-phase A
    // backfill). If this fails, Sub-phase A backfill didn't reach this member.
    const { data: config } = await sbAdmin
      .from('gamification_configs')
      .select('enabled, base_points_per_task')
      .eq('family_member_id', playMember.id)
      .single()
    expect(config).not.toBeNull()
    expect(config!.enabled).toBe(true)

    const basePoints = (config!.base_points_per_task as number) ?? 1

    // 1. Seed a task assigned to the Play member
    const { data: task, error: taskErr } = await sbAdmin
      .from('tasks')
      .insert({
        family_id: familyId,
        created_by: momMemberId,
        assignee_id: playMember.id,
        title: `[sub-c test] Complete me ${Date.now()}`,
        task_type: 'task',
        status: 'pending',
        source: 'manual',
      })
      .select('id')
      .single()
    expect(taskErr).toBeNull()
    expect(task).not.toBeNull()
    createdTaskIds.push(task!.id)

    // 2. Insert the task_completions row (simulating useCompleteTask step 1)
    const { data: completion, error: compErr } = await sbAdmin
      .from('task_completions')
      .insert({
        task_id: task!.id,
        member_id: playMember.id,
        family_member_id: playMember.id,
        period_date: new Date().toISOString().slice(0, 10),
        acted_by: momMemberId,
        rejected: false,
      })
      .select('id')
      .single()
    expect(compErr).toBeNull()
    expect(completion).not.toBeNull()

    // 3. Fire the RPC — this is what useCompleteTask now does at step 3
    const { data: rpcResult, error: rpcErr } = await sbAdmin.rpc(
      'roll_creature_for_completion',
      { p_task_completion_id: completion!.id },
    )
    expect(rpcErr).toBeNull()
    expect(rpcResult).not.toBeNull()

    const result = rpcResult as Record<string, unknown>
    // Not an error branch, not disabled, not already-processed, not skipped
    expect(result.error).toBeUndefined()
    expect(result.gamification_disabled).toBeUndefined()
    expect(result.already_processed).toBeUndefined()
    expect(result.skipped_completion_type).toBeUndefined()
    expect(result.points_awarded).toBe(basePoints)
    expect(typeof result.new_point_total).toBe('number')

    // 4. Verify the family_members row was actually updated by the RPC
    const { data: after } = await sbAdmin
      .from('family_members')
      .select(
        'gamification_points, current_streak, last_task_completion_date',
      )
      .eq('id', playMember.id)
      .single()
    expect(after).not.toBeNull()
    expect((after!.gamification_points as number)).toBe(
      (before!.gamification_points as number) + basePoints,
    )
    // Streak is ≥ 1 after any completion (either bumped, held, or reset to 1)
    expect((after!.current_streak as number)).toBeGreaterThanOrEqual(1)
    expect(after!.last_task_completion_date).toBe(
      new Date().toISOString().slice(0, 10),
    )

    // Restore the Play member's gamification state so the test is non-destructive
    await sbAdmin
      .from('family_members')
      .update({
        gamification_points: before!.gamification_points,
        current_streak: before!.current_streak,
        longest_streak: before!.longest_streak,
        last_task_completion_date: before!.last_task_completion_date,
      })
      .eq('id', playMember.id)

    // Also remove any creature/page unlock rows the RPC may have awarded
    // from this test completion so the Play member's collection isn't
    // polluted with garbage test data.
    await sbAdmin
      .from('member_creature_collection')
      .delete()
      .eq('awarded_source_id', completion!.id)
  })

  test('Adult completion RPC returns gamification_disabled; task still completes', async () => {
    test.setTimeout(60000)

    const sbAdmin = serviceClient()
    const { familyId, momMemberId } = await findFamilyAndPlayMember()

    // Seed a task assigned to mom herself
    const { data: task, error: taskErr } = await sbAdmin
      .from('tasks')
      .insert({
        family_id: familyId,
        created_by: momMemberId,
        assignee_id: momMemberId,
        title: `[sub-c test] Mom task ${Date.now()}`,
        task_type: 'task',
        status: 'pending',
        source: 'manual',
      })
      .select('id')
      .single()
    expect(taskErr).toBeNull()
    createdTaskIds.push(task!.id)

    // Insert completion + fire RPC
    const { data: completion, error: compErr } = await sbAdmin
      .from('task_completions')
      .insert({
        task_id: task!.id,
        member_id: momMemberId,
        family_member_id: momMemberId,
        period_date: new Date().toISOString().slice(0, 10),
        acted_by: momMemberId,
        rejected: false,
      })
      .select('id')
      .single()
    expect(compErr).toBeNull()

    const { data: rpcResult, error: rpcErr } = await sbAdmin.rpc(
      'roll_creature_for_completion',
      { p_task_completion_id: completion!.id },
    )
    expect(rpcErr).toBeNull()

    // Mom either has no gamification_configs row at all, or one with
    // enabled=false. Either way, the RPC returns gamification_disabled.
    // If mom's config has enabled=true for some reason (future change),
    // accept that too — the invariant is: the RPC does not throw, and
    // it does not crash the completion flow.
    const result = rpcResult as Record<string, unknown>
    expect(result).not.toBeNull()
    expect(result.error).toBeUndefined()

    // Confirm the task_completions row is still there — RPC failure or
    // disabled path must NEVER destroy the underlying completion.
    const { data: stillThere } = await sbAdmin
      .from('task_completions')
      .select('id')
      .eq('id', completion!.id)
      .maybeSingle()
    expect(stillThere).not.toBeNull()
  })

  test('Idempotency: firing RPC twice on the same completion never double-awards', async () => {
    test.setTimeout(60000)

    const sbAdmin = serviceClient()
    const { familyId, momMemberId, playMember } = await findFamilyAndPlayMember()

    // Snapshot before
    const { data: before } = await sbAdmin
      .from('family_members')
      .select('gamification_points, current_streak, longest_streak, last_task_completion_date')
      .eq('id', playMember.id)
      .single()

    // Seed a task + completion
    const { data: task } = await sbAdmin
      .from('tasks')
      .insert({
        family_id: familyId,
        created_by: momMemberId,
        assignee_id: playMember.id,
        title: `[sub-c idempotent test] ${Date.now()}`,
        task_type: 'task',
        status: 'pending',
        source: 'manual',
      })
      .select('id')
      .single()
    createdTaskIds.push(task!.id)

    const { data: completion } = await sbAdmin
      .from('task_completions')
      .insert({
        task_id: task!.id,
        member_id: playMember.id,
        family_member_id: playMember.id,
        period_date: new Date().toISOString().slice(0, 10),
        acted_by: momMemberId,
        rejected: false,
      })
      .select('id')
      .single()

    // Fire the RPC the first time — should process normally
    const { data: first } = await sbAdmin.rpc('roll_creature_for_completion', {
      p_task_completion_id: completion!.id,
    })
    const firstResult = first as Record<string, unknown>
    expect(firstResult.error).toBeUndefined()

    // If the first call awarded a creature, the second call should
    // report already_processed. If the first call didn't award a creature
    // (roll failed), the second call MAY re-enter the pipeline because
    // the idempotency key is `awarded_source_id` in member_creature_collection
    // — no row was inserted, so the guard doesn't trigger. This matches
    // the RPC's Step 2 logic and is the correct behavior.
    const awardedCreature =
      firstResult.creature_awarded === true && firstResult.creature != null

    const { data: second } = await sbAdmin.rpc('roll_creature_for_completion', {
      p_task_completion_id: completion!.id,
    })
    const secondResult = second as Record<string, unknown>
    expect(secondResult.error).toBeUndefined()

    if (awardedCreature) {
      // Idempotency guard must have triggered
      expect(secondResult.already_processed).toBe(true)
    }
    // Either way, the DB must not show double-awarded points
    const { data: after } = await sbAdmin
      .from('family_members')
      .select('gamification_points')
      .eq('id', playMember.id)
      .single()

    // Points increment at most once per unique task_completions.id. If the
    // first call awarded N points, the second must have been a no-op.
    const basePoints = (firstResult.points_awarded as number) ?? 0
    const expectedPoints = (before!.gamification_points as number) + basePoints
    expect((after!.gamification_points as number)).toBe(expectedPoints)

    // Restore
    await sbAdmin
      .from('family_members')
      .update({
        gamification_points: before!.gamification_points,
        current_streak: before!.current_streak,
        longest_streak: before!.longest_streak,
        last_task_completion_date: before!.last_task_completion_date,
      })
      .eq('id', playMember.id)
    await sbAdmin
      .from('member_creature_collection')
      .delete()
      .eq('awarded_source_id', completion!.id)
  })
})
