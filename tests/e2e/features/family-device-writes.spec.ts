/**
 * FDWA — Family-Device Write Audit (Remaining Tables) — E2E verification
 * (2026-07-09, migration 00000000100306_family_device_write_audit.sql)
 *
 * Migration 100262 restored family-shadow-session write access to 8 tables
 * (tasks/lists/hub-tally domain). This migration closes the follow-up: 19
 * more tables/surfaces where a kid's action on the family tablet silently
 * did nothing (theme changes, widget reorder, tracker taps, Guided
 * worksheets, journal Send-To, practice logs, timer starts, reflections,
 * rhythm check-ins, reward proposals, messaging, notepad, mindsweep
 * capture, family requests) — plus a narrow `update_member_appearance` RPC
 * (fixes BOTH the family-device case AND the universal non-mom self-theme
 * bug — no self-update RLS policy on family_members ever existed) and a
 * `redeem_own_prize` edit adding the family-shadow branch its siblings
 * already had.
 *
 * Methodology (per FDWA.md ruling 6 + the established PECON-SHOP precedent
 * — see RLS-VERIFICATION.md "Migration 100302 — PECON-SHOP"): the
 * family-shadow session's account password IS the human-readable family
 * door password (establishFamilySession() signs in with the exact form
 * value the mom typed — verified live before writing this spec), so this
 * spec authenticates AS the family-shadow session directly via
 * supabase-js — no browser navigation needed. Cross-tenant isolation
 * (does a DIFFERENT family's shadow session get rejected) is proven by the
 * companion rls-verifier pass (JWT impersonation, faster and more
 * exhaustive for that specific property) rather than re-derived here with
 * a second real family's live credentials — this spec's job is the
 * positive-path proof: every previously-silent write now succeeds, with
 * correct attribution, from a real family-shadow session.
 *
 * Fixtures: FDWATEST-marked rows against Testworth's real members (Sarah
 * mom / Casey / Alex). Every created row's id is tracked and deleted in
 * afterAll; Casey/Alex's theme_preferences/layout_preferences are captured
 * before and restored after (PECON-SHOP capture/restore convention).
 *
 * Run: npx playwright test tests/e2e/features/family-device-writes.spec.ts
 */
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'
import { todayLocalIso } from '../helpers/dates'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const MARKER = 'FDWATEST'
const TESTWORTH_FAMILY_ID = '1f6200a7-df82-4ac4-bce3-3edcafe66bc5'
const TESTWORTH_FAMILY_PASSWORD = process.env.E2E_TESTWORTH_FAMILY_PASSWORD || 'Lanterns2026'
const MIGRATION_PATH = 'supabase/migrations/00000000100306_family_device_write_audit.sql'

let familyId = ''
let sarahId = ''
let caseyId = ''
let alexId = ''
let reflectionPromptId = ''

let familyClient: SupabaseClient // family-shadow session (the family tablet)
let caseyClient: SupabaseClient // Casey's own real login session
let sarahClient: SupabaseClient // Sarah's (mom) own real login session

let caseyOriginalTheme: unknown = null
let caseyOriginalLayout: unknown = null
let alexOriginalTheme: unknown = null

// Precise cleanup — every fixture row this spec creates, tracked by table+id.
const cleanup: Array<{ table: string; id: string }> = []
function track(table: string, id: string) {
  cleanup.push({ table, id })
}

async function clientFor(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`)
  return client
}

test.beforeAll(async () => {
  const { data: family, error: famErr } = await admin
    .from('families')
    .select('id')
    .eq('id', TESTWORTH_FAMILY_ID)
    .single()
  if (famErr || !family) throw new Error(`Testworth family not found: ${famErr?.message}`)
  familyId = family.id

  const { data: members, error: memErr } = await admin
    .from('family_members')
    .select('id, display_name, theme_preferences, layout_preferences')
    .eq('family_id', familyId)
    .in('display_name', ['Sarah', 'Casey', 'Alex'])
  if (memErr || !members) throw new Error(`Testworth members not found: ${memErr?.message}`)

  const sarah = members.find(m => m.display_name === 'Sarah')!
  const casey = members.find(m => m.display_name === 'Casey')!
  const alex = members.find(m => m.display_name === 'Alex')!
  sarahId = sarah.id
  caseyId = casey.id
  alexId = alex.id
  caseyOriginalTheme = casey.theme_preferences
  caseyOriginalLayout = casey.layout_preferences
  alexOriginalTheme = alex.theme_preferences

  familyClient = await clientFor(`${familyId}@family.myaimcentral.app`, TESTWORTH_FAMILY_PASSWORD)
  caseyClient = await clientFor('caseytest@testworths.com', 'Demo2026!')
  sarahClient = await clientFor('testmom@testworths.com', 'Demo2026!')

  // One parent fixture the shadow session doesn't have write access to build
  // itself (reflection_prompts is outside FDWA's 22-table scope) — seed via
  // service role, matching the "pre-create the one out-of-scope parent"
  // pattern.
  const { data: prompt, error: promptErr } = await admin
    .from('reflection_prompts')
    .insert({
      family_id: familyId,
      member_id: caseyId,
      prompt_text: `${MARKER} probe prompt`,
      category: 'custom',
    })
    .select('id')
    .single()
  if (promptErr || !prompt) throw new Error(`reflection_prompts fixture failed: ${promptErr?.message}`)
  reflectionPromptId = prompt.id
  track('reflection_prompts', reflectionPromptId)
})

test.afterAll(async () => {
  // Delete tracked rows in reverse creation order (children before parents).
  for (const { table, id } of [...cleanup].reverse()) {
    await admin.from(table).delete().eq('id', id)
  }
  // Restore appearance columns to their exact pre-test values.
  await admin
    .from('family_members')
    .update({ theme_preferences: caseyOriginalTheme, layout_preferences: caseyOriginalLayout })
    .eq('id', caseyId)
  await admin
    .from('family_members')
    .update({ theme_preferences: alexOriginalTheme })
    .eq('id', alexId)
})

test.describe('FDWA — static tripwire', () => {
  test('migration retains util.is_family_shadow_of for every fixed table + both RPCs', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf-8')
    const tables = [
      'widget_data_points', 'practice_log', 'journal_entries', 'guided_form_responses',
      'dashboard_widgets', 'dashboard_configs', 'guiding_stars', 'best_intentions',
      'self_knowledge', 'reflection_responses', 'rhythm_completions', 'randomizer_draws',
      'time_sessions', 'reward_proposals', 'conversation_spaces', 'conversation_space_members',
      'conversation_threads', 'messages', 'notepad_tabs', 'notepad_extracted_items',
      'mindsweep_holding', 'family_requests',
    ]
    for (const table of tables) {
      // Every table section must reference is_family_shadow_of somewhere
      // between its own header comment and the next section — a coarse but
      // effective drift guard: assert the policy-name pattern AND the
      // shadow-check function both appear for this table.
      const tableRegex = new RegExp(`ON public\\.${table}\\b[\\s\\S]{0,400}?is_family_shadow_of`, 'm')
      expect(sql, `${table} additive policy must reference util.is_family_shadow_of`).toMatch(tableRegex)
    }
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.update_member_appearance')
    expect(sql).toContain('util.is_family_shadow_of(v_family_id)')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.redeem_own_prize')
    expect(sql).toContain('OR util.is_family_shadow_of(v_prize.family_id)')
  })

  test('recursion-fix migrations retain util.is_space_admin on both INSERT and DELETE branches', () => {
    // 100306's own "Ask Mom" chat-bootstrap probe surfaced a pre-existing
    // self-referencing RLS recursion on conversation_space_members
    // (42P17), independent of FDWA's own additive policies — same class as
    // the tasks↔task_assignments fix (100265). Fixed in two companion
    // migrations (100308 INSERT, 100309 DELETE — the second found live by
    // the rls-verifier pass on 100306). Both drift-pinned here so a future
    // refactor can't silently reintroduce either half.
    const insertFix = readFileSync(
      'supabase/migrations/00000000100308_fix_conversation_space_members_recursion.sql',
      'utf-8',
    )
    expect(insertFix).toContain('CREATE OR REPLACE FUNCTION util.is_space_admin')
    expect(insertFix).toContain('SECURITY DEFINER')
    expect(insertFix).toContain('csm_insert_admin_or_parent')
    expect(insertFix).toContain('util.is_space_admin(conversation_space_members.space_id)')

    const deleteFix = readFileSync(
      'supabase/migrations/00000000100309_fix_csm_delete_recursion.sql',
      'utf-8',
    )
    expect(deleteFix).toContain('csm_delete_admin_or_parent')
    expect(deleteFix).toContain('util.is_space_admin(space_id)')
  })
})

test.describe('FDWA — family-shadow session writes (was silently blocked)', () => {
  test('tasks + guided_form_responses (Guided Form save)', async () => {
    const { data: task, error: taskErr } = await familyClient
      .from('tasks')
      .insert({
        family_id: familyId,
        created_by: caseyId,
        assignee_id: caseyId,
        title: `${MARKER} guided form task`,
        task_type: 'guided_form',
        status: 'pending',
        source: 'guided_form_assignment',
      })
      .select('id')
      .single()
    expect(taskErr, taskErr?.message).toBeNull()
    track('tasks', task!.id)

    const { data: gfr, error: gfrErr } = await familyClient
      .from('guided_form_responses')
      .insert({
        family_id: familyId,
        task_id: task!.id,
        family_member_id: caseyId,
        section_key: 'situation',
        response_content: `${MARKER} response`,
      })
      .select('id, family_member_id')
      .single()
    expect(gfrErr, gfrErr?.message).toBeNull()
    track('guided_form_responses', gfr!.id)
    expect(gfr!.family_member_id).toBe(caseyId)
  })

  test('dashboard_widgets + widget_data_points (tracker create + tap)', async () => {
    const { data: widget, error: widgetErr } = await familyClient
      .from('dashboard_widgets')
      .insert({
        family_id: familyId,
        family_member_id: caseyId,
        template_type: `${MARKER}_counter`,
        title: `${MARKER} widget`,
      })
      .select('id')
      .single()
    expect(widgetErr, widgetErr?.message).toBeNull()
    track('dashboard_widgets', widget!.id)

    const { data: point, error: pointErr } = await familyClient
      .from('widget_data_points')
      .insert({
        family_id: familyId,
        widget_id: widget!.id,
        family_member_id: caseyId,
        value: 1,
      })
      .select('id, family_member_id')
      .single()
    expect(pointErr, pointErr?.message).toBeNull()
    track('widget_data_points', point!.id)
    expect(point!.family_member_id).toBe(caseyId)
  })

  test('dashboard_configs (layout save)', async () => {
    // 'personal' is auto-provisioned for every member (auto_provision_
    // member_resources trigger) — use a type Casey doesn't already have to
    // avoid the idx_dc_member_type unique constraint.
    const { data, error } = await familyClient
      .from('dashboard_configs')
      .insert({
        family_id: familyId,
        family_member_id: caseyId,
        dashboard_type: 'family_overview',
        layout: { marker: MARKER },
      })
      .select('id')
      .single()
    expect(error, error?.message).toBeNull()
    track('dashboard_configs', data!.id)
  })

  test('guiding_stars + best_intentions + self_knowledge (child-created growth content)', async () => {
    const { data: gs, error: gsErr } = await familyClient
      .from('guiding_stars')
      .insert({ family_id: familyId, member_id: caseyId, content: `${MARKER} star` })
      .select('id, member_id')
      .single()
    expect(gsErr, gsErr?.message).toBeNull()
    track('guiding_stars', gs!.id)
    expect(gs!.member_id).toBe(caseyId)

    const { data: bi, error: biErr } = await familyClient
      .from('best_intentions')
      .insert({ family_id: familyId, member_id: caseyId, statement: `${MARKER} intention` })
      .select('id, member_id')
      .single()
    expect(biErr, biErr?.message).toBeNull()
    track('best_intentions', bi!.id)
    expect(bi!.member_id).toBe(caseyId)

    const { data: sk, error: skErr } = await familyClient
      .from('self_knowledge')
      .insert({
        family_id: familyId,
        member_id: caseyId,
        category: 'general',
        content: `${MARKER} self-knowledge`,
        source_type: 'manual',
      })
      .select('id, member_id')
      .single()
    expect(skErr, skErr?.message).toBeNull()
    track('self_knowledge', sk!.id)
    expect(sk!.member_id).toBe(caseyId)
  })

  test('journal_entries (Send-To / quick note)', async () => {
    const { data, error } = await familyClient
      .from('journal_entries')
      .insert({
        family_id: familyId,
        member_id: caseyId,
        entry_type: 'quick_note',
        content: `${MARKER} journal entry`,
        visibility: 'private',
      })
      .select('id, member_id')
      .single()
    expect(error, error?.message).toBeNull()
    track('journal_entries', data!.id)
    expect(data!.member_id).toBe(caseyId)
  })

  test('reflection_responses + rhythm_completions (evening check-in)', async () => {
    const { data: rr, error: rrErr } = await familyClient
      .from('reflection_responses')
      .insert({
        family_id: familyId,
        member_id: caseyId,
        prompt_id: reflectionPromptId,
        response_text: `${MARKER} reflection`,
      })
      .select('id, member_id')
      .single()
    expect(rrErr, rrErr?.message).toBeNull()
    track('reflection_responses', rr!.id)
    expect(rr!.member_id).toBe(caseyId)

    const { data: rc, error: rcErr } = await familyClient
      .from('rhythm_completions')
      .insert({
        family_id: familyId,
        member_id: caseyId,
        rhythm_key: `${MARKER}_evening`,
        period: todayLocalIso(),
      })
      .select('id, member_id')
      .single()
    expect(rcErr, rcErr?.message).toBeNull()
    track('rhythm_completions', rc!.id)
    expect(rc!.member_id).toBe(caseyId)
  })

  test('lists + list_items + randomizer_draws (randomizer draw)', async () => {
    const { data: list, error: listErr } = await familyClient
      .from('lists')
      .insert({ family_id: familyId, owner_id: caseyId, title: `${MARKER} randomizer list`, list_type: 'randomizer' })
      .select('id')
      .single()
    expect(listErr, listErr?.message).toBeNull()
    track('lists', list!.id)

    const { data: item, error: itemErr } = await familyClient
      .from('list_items')
      .insert({ list_id: list!.id, content: `${MARKER} draw item` })
      .select('id')
      .single()
    expect(itemErr, itemErr?.message).toBeNull()
    track('list_items', item!.id)

    const { data: draw, error: drawErr } = await familyClient
      .from('randomizer_draws')
      .insert({ list_id: list!.id, list_item_id: item!.id, family_member_id: caseyId })
      .select('id, family_member_id')
      .single()
    expect(drawErr, drawErr?.message).toBeNull()
    track('randomizer_draws', draw!.id)
    expect(draw!.family_member_id).toBe(caseyId)
  })

  test('time_sessions (timer start)', async () => {
    const { data, error } = await familyClient
      .from('time_sessions')
      .insert({
        family_id: familyId,
        family_member_id: caseyId,
        started_by: caseyId,
        started_at: new Date().toISOString(),
      })
      .select('id, family_member_id')
      .single()
    expect(error, error?.message).toBeNull()
    track('time_sessions', data!.id)
    expect(data!.family_member_id).toBe(caseyId)
  })

  test('reward_proposals (propose-a-reward)', async () => {
    const { data, error } = await familyClient
      .from('reward_proposals')
      .insert({
        family_id: familyId,
        proposer_member_id: caseyId,
        terms: { description: `${MARKER} proposal` },
      })
      .select('id, proposer_member_id')
      .single()
    expect(error, error?.message).toBeNull()
    track('reward_proposals', data!.id)
    expect(data!.proposer_member_id).toBe(caseyId)
  })

  test('practice_log (practice session log)', async () => {
    const { data, error } = await familyClient
      .from('practice_log')
      .insert({
        family_id: familyId,
        family_member_id: caseyId,
        source_type: 'task',
        source_id: crypto.randomUUID(),
      })
      .select('id, family_member_id')
      .single()
    expect(error, error?.message).toBeNull()
    track('practice_log', data!.id)
    expect(data!.family_member_id).toBe(caseyId)
  })

  test('conversation_spaces + members + threads + messages ("Ask Mom" chat bootstrap) — attribution asserted', async () => {
    const { data: space, error: spaceErr } = await familyClient
      .from('conversation_spaces')
      .insert({ family_id: familyId, space_type: 'direct', created_by: caseyId })
      .select('id')
      .single()
    expect(spaceErr, spaceErr?.message).toBeNull()
    track('conversation_spaces', space!.id)

    const { data: csm, error: csmErr } = await familyClient
      .from('conversation_space_members')
      .insert([
        { space_id: space!.id, family_member_id: caseyId, role: 'admin' },
        { space_id: space!.id, family_member_id: sarahId, role: 'member' },
      ])
      .select('id')
    expect(csmErr, csmErr?.message).toBeNull()
    for (const row of csm!) track('conversation_space_members', row.id)

    const { data: thread, error: threadErr } = await familyClient
      .from('conversation_threads')
      .insert({ space_id: space!.id, started_by: caseyId })
      .select('id')
      .single()
    expect(threadErr, threadErr?.message).toBeNull()
    track('conversation_threads', thread!.id)

    const { data: message, error: msgErr } = await familyClient
      .from('messages')
      .insert({
        thread_id: thread!.id,
        sender_member_id: caseyId,
        content: `${MARKER} can you help me with this?`,
      })
      .select('id, sender_member_id')
      .single()
    expect(msgErr, msgErr?.message).toBeNull()
    track('messages', message!.id)
    // Attribution — the message must land credited to Casey, not the shared
    // shadow identity (app-layer attribution, ruling 5).
    expect(message!.sender_member_id).toBe(caseyId)
  })

  test('conversation_space_members DELETE (leave a conversation) — recursion fix regression pin', async () => {
    // Own-session (not shadow) probe — the recursion this pins was
    // role-independent (reproduced live against a real primary_parent
    // session by rls-verifier). Fixture seeded via service role (a SEPARATE,
    // pre-existing bug in csm_insert_admin_or_parent's own "space creator"
    // branch blocks Casey's own-session INSERT here — out of FDWA's scope,
    // flagged in the progress log, not fixed in this build) — this test's
    // job is only to pin the DELETE-side recursion fix (100309).
    const { data: space, error: spaceErr } = await admin
      .from('conversation_spaces')
      .insert({ family_id: familyId, space_type: 'direct', created_by: caseyId })
      .select('id')
      .single()
    expect(spaceErr, spaceErr?.message).toBeNull()
    track('conversation_spaces', space!.id)

    const { data: member, error: memberErr } = await admin
      .from('conversation_space_members')
      .insert({ space_id: space!.id, family_member_id: caseyId, role: 'admin' })
      .select('id')
      .single()
    expect(memberErr, memberErr?.message).toBeNull()

    const { error: deleteErr, count } = await caseyClient
      .from('conversation_space_members')
      .delete({ count: 'exact' })
      .eq('id', member!.id)
    expect(deleteErr, deleteErr?.message).toBeNull()
    expect(count).toBe(1)
    // Row is gone — nothing left to track/clean up for this one.
  })

  test('notepad_tabs + notepad_extracted_items — attribution asserted', async () => {
    const { data: tab, error: tabErr } = await familyClient
      .from('notepad_tabs')
      .insert({ family_id: familyId, member_id: caseyId, title: `${MARKER} notepad tab` })
      .select('id, member_id')
      .single()
    expect(tabErr, tabErr?.message).toBeNull()
    track('notepad_tabs', tab!.id)
    expect(tab!.member_id).toBe(caseyId)

    const { data: item, error: itemErr } = await familyClient
      .from('notepad_extracted_items')
      .insert({
        tab_id: tab!.id,
        routing_destination: 'task',
        extracted_content: `${MARKER} extracted item`,
        status: 'pending',
      })
      .select('id')
      .single()
    expect(itemErr, itemErr?.message).toBeNull()
    track('notepad_extracted_items', item!.id)
  })

  test('mindsweep_holding — attribution asserted', async () => {
    const { data, error } = await familyClient
      .from('mindsweep_holding')
      .insert({
        family_id: familyId,
        member_id: caseyId,
        content: `${MARKER} brain dump`,
        content_type: 'text',
        source_channel: 'quick_capture',
      })
      .select('id, member_id')
      .single()
    expect(error, error?.message).toBeNull()
    track('mindsweep_holding', data!.id)
    expect(data!.member_id).toBe(caseyId)
  })

  test('family_requests ("Ask Mom" outbound request) — attribution asserted', async () => {
    const { data, error } = await familyClient
      .from('family_requests')
      .insert({
        family_id: familyId,
        sender_member_id: caseyId,
        recipient_member_id: sarahId,
        title: `${MARKER} can you sign my permission slip?`,
      })
      .select('id, sender_member_id, recipient_member_id')
      .single()
    expect(error, error?.message).toBeNull()
    track('family_requests', data!.id)
    expect(data!.sender_member_id).toBe(caseyId)
    expect(data!.recipient_member_id).toBe(sarahId)
  })
})

test.describe('FDWA — update_member_appearance RPC', () => {
  test('Casey self-updates own theme (fixes the universal non-mom self-theme bug)', async () => {
    const marker = { marker: MARKER, theme: 'casey-self' }
    const { data, error } = await caseyClient.rpc('update_member_appearance', {
      p_member_id: caseyId,
      p_theme_preferences: marker,
      p_layout_preferences: null,
    })
    expect(error, error?.message).toBeNull()
    expect((data as { status?: string })?.status).toBe('ok')

    const { data: row } = await admin.from('family_members').select('theme_preferences').eq('id', caseyId).single()
    expect(row?.theme_preferences).toEqual(marker)
  })

  test('Casey cannot update Alex\'s appearance (cross-member rejected)', async () => {
    const { data, error } = await caseyClient.rpc('update_member_appearance', {
      p_member_id: alexId,
      p_theme_preferences: { marker: MARKER, theme: 'should-not-land' },
      p_layout_preferences: null,
    })
    expect(error, error?.message).toBeNull()
    expect((data as { status?: string })?.status).toBe('not_allowed')

    const { data: row } = await admin.from('family_members').select('theme_preferences').eq('id', alexId).single()
    expect(row?.theme_preferences).not.toEqual({ marker: MARKER, theme: 'should-not-land' })
  })

  test('Sarah (mom) can update Casey\'s appearance (primary_parent branch)', async () => {
    const marker = { marker: MARKER, theme: 'mom-set-for-casey' }
    const { data, error } = await sarahClient.rpc('update_member_appearance', {
      p_member_id: caseyId,
      p_theme_preferences: marker,
      p_layout_preferences: null,
    })
    expect(error, error?.message).toBeNull()
    expect((data as { status?: string })?.status).toBe('ok')

    const { data: row } = await admin.from('family_members').select('theme_preferences').eq('id', caseyId).single()
    expect(row?.theme_preferences).toEqual(marker)
  })

  test('family-shadow session updates Casey\'s theme + layout (the family-device fix)', async () => {
    const themeMarker = { marker: MARKER, theme: 'family-device-set' }
    const layoutMarker = { marker: MARKER, sidebar_open: false }
    const { data, error } = await familyClient.rpc('update_member_appearance', {
      p_member_id: caseyId,
      p_theme_preferences: themeMarker,
      p_layout_preferences: layoutMarker,
    })
    expect(error, error?.message).toBeNull()
    expect((data as { status?: string })?.status).toBe('ok')

    const { data: row } = await admin
      .from('family_members')
      .select('theme_preferences, layout_preferences')
      .eq('id', caseyId)
      .single()
    expect(row?.theme_preferences).toEqual(themeMarker)
    expect(row?.layout_preferences).toEqual(layoutMarker)
  })
})

test.describe('FDWA — redeem_own_prize RPC', () => {
  test('family-shadow session redeems Casey\'s prize (the core fix — was previously blocked)', async () => {
    const { data: prize, error: prizeErr } = await admin
      .from('earned_prizes')
      .insert({
        family_id: familyId,
        family_member_id: caseyId,
        source_type: 'store_purchase',
        prize_type: 'text',
        prize_name: `${MARKER} prize`,
        earned_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    expect(prizeErr, prizeErr?.message).toBeNull()
    track('earned_prizes', prize!.id)

    const { data, error } = await familyClient.rpc('redeem_own_prize', { p_prize_id: prize!.id })
    expect(error, error?.message).toBeNull()
    const result = data as { status?: string; redeemed_by?: string }
    expect(result.status).toBe('redeemed')
    expect(result.redeemed_by).toBe(caseyId)
  })

  test('redeeming the same prize again returns already_redeemed', async () => {
    const { data: prize } = await admin
      .from('earned_prizes')
      .insert({
        family_id: familyId,
        family_member_id: caseyId,
        source_type: 'store_purchase',
        prize_type: 'text',
        prize_name: `${MARKER} prize (double-redeem probe)`,
        earned_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    track('earned_prizes', prize!.id)

    const first = await familyClient.rpc('redeem_own_prize', { p_prize_id: prize!.id })
    expect((first.data as { status?: string })?.status).toBe('redeemed')

    const second = await familyClient.rpc('redeem_own_prize', { p_prize_id: prize!.id })
    expect(second.error, second.error?.message).toBeNull()
    expect((second.data as { status?: string })?.status).toBe('already_redeemed')
  })

  test('shadow session can redeem ANY family member\'s prize — family-level gate, app-layer attribution (ruling 5), not a bug', async () => {
    const { data: prize } = await admin
      .from('earned_prizes')
      .insert({
        family_id: familyId,
        family_member_id: alexId,
        source_type: 'store_purchase',
        prize_type: 'text',
        prize_name: `${MARKER} Alex's prize`,
        earned_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    track('earned_prizes', prize!.id)

    // The shadow session has no way to know WHICH kid is at the device —
    // that boundary is enforced by the app's View-As/member_session scope,
    // not by this RPC (documented Convention #39/#276 limitation, unchanged
    // by this migration). This is the intended behavior, not a leak.
    const { data, error } = await familyClient.rpc('redeem_own_prize', { p_prize_id: prize!.id })
    expect(error, error?.message).toBeNull()
    const result = data as { status?: string; redeemed_by?: string }
    expect(result.status).toBe('redeemed')
    expect(result.redeemed_by).toBe(alexId)
  })
})
