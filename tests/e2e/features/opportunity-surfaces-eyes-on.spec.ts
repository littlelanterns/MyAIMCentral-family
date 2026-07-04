/**
 * OPPORTUNITY-SURFACES — EYES-ON TOUR (manual helper, NOT a regression test)
 *
 * Drives the Testworth family through the founder's eyes-on list so the
 * restored/new surfaces can be visually verified (founder 2026-07-02: "check
 * as a user with a headed playwright to make sure it's all visible"):
 *   Stop 1 — Mom: Tasks → Opportunities tab, board expanded
 *   Stop 2 — Mom: Family Overview kid column → Opportunities section
 *   Stop 3 — View As Alex (teen) + Alex own-login: eligibility scoping
 *   Stop 4 — Play (Ruthie): Extra Jobs section + confirm dialog,
 *            money HIDDEN by default (founder ruling 2026-07-02)
 *
 * Run with:
 *   $env:EYES_ON_TOUR='1'; npx playwright test tests/e2e/features/opportunity-surfaces-eyes-on.spec.ts --headed
 *
 * Gated behind EYES_ON_TOUR so it NEVER runs in the normal suite. Screenshots
 * land in eyes-on-tour/ (repo root, gitignored — survives test-results wipes).
 *
 * Fixtures share the OPPSURF prefix and are LEFT IN PLACE for live poking;
 * the next opportunity-surfaces.spec.ts run sweeps them in beforeAll.
 */
import { test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsAlex, loginAsRiley } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

test.skip(!process.env.EYES_ON_TOUR, 'Manual eyes-on tour — set EYES_ON_TOUR=1 to run')

const sr = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')

async function shot(page: import('@playwright/test').Page, name: string) {
  fs.mkdirSync(SHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
}

async function linger(page: import('@playwright/test').Page, ms = 2500) {
  await page.waitForTimeout(ms)
}

let familyId = ''
const memberIds: Record<string, string> = {}
let restrictedBoardId = ''
let everyoneBoardId = ''
let playBoardId = ''
let playItemId = ''

async function memberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const { data, error } = await sr
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('display_name', name)
    .single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  return data.id
}

/** Idempotent board fixture: reuse by title, else create with items. */
async function ensureBoard(opts: {
  title: string
  eligible: string[] | null
  subtype: string
  rewardType: string
  rewardAmount: number
  items: string[]
}): Promise<{ boardId: string; itemIds: string[] }> {
  const sarah = await memberId('Sarah')
  let boardId: string
  const { data: existing } = await sr
    .from('lists').select('id').eq('family_id', familyId).eq('title', opts.title).maybeSingle()
  if (existing) {
    boardId = existing.id
  } else {
    const { data: created, error } = await sr.from('lists')
      .insert({
        family_id: familyId, owner_id: sarah, created_by: sarah,
        title: opts.title, list_name: opts.title, list_type: 'custom',
        is_opportunity: true, eligible_members: opts.eligible,
        default_opportunity_subtype: opts.subtype,
        default_reward_type: opts.rewardType, default_reward_amount: opts.rewardAmount,
      })
      .select('id').single()
    if (error) throw new Error(`board ${opts.title}: ${error.message}`)
    boardId = created.id
  }

  const itemIds: string[] = []
  for (const [i, content] of opts.items.entries()) {
    const { data: existingItem } = await sr
      .from('list_items').select('id').eq('list_id', boardId).eq('content', content).maybeSingle()
    if (existingItem) {
      await sr.from('list_items')
        .update({ is_available: true, completed_instances: 0, last_completed_at: null })
        .eq('id', existingItem.id)
      itemIds.push(existingItem.id)
    } else {
      const { data: createdItem, error } = await sr.from('list_items')
        .insert({ list_id: boardId, content, item_name: content, is_available: true, sort_order: i })
        .select('id').single()
      if (error) throw new Error(`item ${content}: ${error.message}`)
      itemIds.push(createdItem.id)
    }
  }
  // Clear stale claim-bridge tasks so every item shows claimable
  await sr.from('tasks')
    .delete()
    .eq('family_id', familyId)
    .eq('source', 'opportunity_list_claim')
    .in('source_reference_id', itemIds)
  return { boardId, itemIds }
}

test.describe('Opportunity Surfaces — eyes-on tour', () => {
  test.beforeAll(async () => {
    const { data: family, error } = await sr
      .from('families').select('id').eq('family_login_name_lower', 'testworthfamily').single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    const alex = await memberId('Alex')
    const ruthie = await memberId('Ruthie')

    const a = await ensureBoard({
      title: 'OPPSURF Alex Jobs Board', eligible: [alex], subtype: 'repeatable',
      rewardType: 'money', rewardAmount: 2,
      items: ['OPPSURF Rake the leaves', 'OPPSURF Wash the windows'],
    })
    restrictedBoardId = a.boardId

    const b = await ensureBoard({
      title: 'OPPSURF Everyone Board', eligible: null, subtype: 'repeatable',
      rewardType: 'points', rewardAmount: 5,
      items: ['OPPSURF Feed the cat'],
    })
    everyoneBoardId = b.boardId

    const p = await ensureBoard({
      title: 'OPPSURF Ruthie Jobs', eligible: [ruthie], subtype: 'one_time',
      rewardType: 'money', rewardAmount: 1,
      items: ['OPPSURF Water the plants'],
    })
    playBoardId = p.boardId
    playItemId = p.itemIds[0]

    // Ruthie: clear any explicit money opt-in → founder-default hidden state
    const { data: ruthieRow } = await sr
      .from('family_members').select('preferences').eq('id', ruthie).single()
    const prefs = { ...((ruthieRow?.preferences as Record<string, unknown> | null) ?? {}) }
    const sections = { ...((prefs.my_rewards_sections as Record<string, unknown> | null) ?? {}) }
    delete sections.finances
    await sr.from('family_members')
      .update({ preferences: { ...prefs, my_rewards_sections: sections } })
      .eq('id', ruthie)
  })

  // ── Stop 1: Mom — Tasks → Opportunities tab ────────────────────────────────
  test('Stop 1 — Mom Tasks page: Opportunities tab + expanded board', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await waitForAppReady(page)
    await shot(page, 'opps-01-mom-tasks-my-tasks-tab')

    await page.getByRole('tab', { name: 'Opportunities' }).click()
    await page.getByText('OPPSURF Alex Jobs Board').waitFor({ state: 'visible', timeout: 15000 })
    await shot(page, 'opps-02-mom-opportunities-tab-boards')
    await linger(page)

    await page.getByText('OPPSURF Alex Jobs Board').click()
    await page.getByText('OPPSURF Rake the leaves').waitFor({ state: 'visible', timeout: 15000 })
    await shot(page, 'opps-03-mom-board-expanded-items')
    await linger(page)
  })

  // ── Stop 2: Mom — FO kid column Opportunities section ──────────────────────
  test('Stop 2 — Mom Family Overview: kid column browsable board', async ({ page }) => {
    const sarah = await memberId('Sarah')
    const alex = await memberId('Alex')
    const casey = await memberId('Casey')

    // Pin FO selection so Alex + Casey columns are present, nothing collapsed
    const { data: cfg } = await sr
      .from('family_overview_configs')
      .select('id').eq('family_id', familyId).eq('family_member_id', sarah).maybeSingle()
    if (cfg) {
      await sr.from('family_overview_configs')
        .update({ selected_member_ids: [alex, casey], section_states: {} })
        .eq('id', cfg.id)
    } else {
      await sr.from('family_overview_configs')
        .insert({ family_id: familyId, family_member_id: sarah, selected_member_ids: [alex, casey], section_states: {} })
    }

    await loginAsMom(page)
    await page.goto('/dashboard?view=family_overview')
    await waitForAppReady(page)

    const alexBoard = page.getByTestId(`fo-opp-board-${restrictedBoardId}-${alex}`)
    await alexBoard.waitFor({ state: 'visible', timeout: 15000 })
    await alexBoard.scrollIntoViewIfNeeded()
    await shot(page, 'opps-04-mom-fo-alex-column-board')
    await linger(page)
  })

  // ── Stop 3: View As Alex + Alex own login — teen scoping ───────────────────
  test('Stop 3 — teen scoping: View As Alex, then Alex own login', async ({ page }) => {
    // View As: mom enters Alex's world (modal). /tasks inside the modal uses
    // the same useEffectiveMember path own-login uses, so the board set is
    // identical — the own-login shots below are the readable proof.
    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await page.getByRole('tab', { name: /View As/i }).click()
    await page
      .getByText('Choose a family member to see their dashboard experience')
      .waitFor({ state: 'visible', timeout: 10000 })
    await page.getByRole('button').filter({ hasText: 'Alex' }).first().click()
    await page.locator('[data-testid="view-as-exit"]').waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(2500)
    await shot(page, 'opps-05-viewas-alex-dashboard')
    const alexId = await memberId('Alex')
    await sr.from('view_as_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('viewing_as_id', alexId).is('ended_at', null)

    // Own login: the Opportunities tab with Alex's eligible boards
    await loginAsAlex(page)
    await page.goto('/tasks')
    await waitForAppReady(page)
    await page.getByRole('tab', { name: 'Opportunities' }).click()
    await page.getByText('OPPSURF Alex Jobs Board').waitFor({ state: 'visible', timeout: 15000 })
    await shot(page, 'opps-06-alex-opportunities-scoped')
    await page.getByText('OPPSURF Alex Jobs Board').click()
    await page.getByText('OPPSURF Rake the leaves').waitFor({ state: 'visible', timeout: 15000 })
    await shot(page, 'opps-07-alex-board-claim-buttons')
    await linger(page)
  })

  // ── Stop 4: Play (Ruthie) — Extra Jobs + confirm, money hidden ─────────────
  test('Stop 4 — Play Extra Jobs: tiles + confirm dialog, no dollar amounts', async ({ page }) => {
    await loginAsRiley(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    const board = page.getByTestId(`play-opp-board-${playBoardId}`)
    await board.waitFor({ state: 'visible', timeout: 15000 })
    await board.scrollIntoViewIfNeeded()
    await shot(page, 'opps-08-play-extra-jobs-section')
    await linger(page)

    await page.getByTestId(`play-opp-tile-${playItemId}`).click()
    await page.getByText('Want to do this job?').waitFor({ state: 'visible', timeout: 10000 })
    await shot(page, 'opps-09-play-confirm-dialog')
    await linger(page)
    // Leave the job unclaimed for the founder to poke live
    await page.getByTestId('play-opp-claim-no').click()
  })
})
