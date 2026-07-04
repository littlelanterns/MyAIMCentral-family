/**
 * Opportunity Surfaces Restoration — browser verification (2026-07-01)
 *
 * Pins the OPPORTUNITY-SURFACES regression fix: opportunity boards
 * (lists.is_opportunity=true) were invisible to mom, adults, and teens after
 * FO-COMMAND-CENTER gated the Tasks-page Opportunities tab behind
 * isGuidedMember (commit a6e8108) while the FO relocation only shipped
 * claimed-item display.
 *
 * Covers:
 *   1. Mom: Opportunities tab visible on /tasks; she sees ALL boards,
 *      including boards whose eligible_members exclude her
 *   2. Eligible teen (Alex): tab visible; sees the restricted board AND the
 *      everyone board; items browsable inside the expanded card
 *   3. Sibling teen (Casey): sees the everyone board, NOT the restricted one
 *   4. Dad (additional_adult): tab visible; everyone board only
 *   5. FO Opportunities section: browsable board (unclaimed items) renders in
 *      the eligible member's column; restricted board absent from the
 *      sibling's column
 *   6. Guided regression (Jordan): two-tab experience intact, board visible
 *   7. Play claim flow (scope c, founder-approved 2026-07-02): Ruthie sees the
 *      Extra Jobs board, taps a tile, confirms, the claim-bridge task appears;
 *      completing it CONSUMES the one_time list item (write-back via
 *      useTasks.useCompleteTask)
 *   8. Teen write-back path: Alex claims a one_time item from the Tasks-page
 *      board and completes the bridge task via the TaskCard toggle — the item
 *      is consumed (write-back via useTaskCompletion.ts)
 *
 * Fixtures are OPPSURF-prefixed, created via service role in beforeAll and
 * removed in afterAll (leak-pass pattern). Mom's family_overview_configs row
 * is snapshotted and restored so the FO test can pin column selection.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsDad, loginAsAlex, loginAsCasey, loginAsJordan, loginAsRiley } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// ── Fixture names ──────────────────────────────────────────────────────────
const RESTRICTED_BOARD = 'OPPSURF Alex Jobs Board'
const EVERYONE_BOARD = 'OPPSURF Everyone Board'
const PLAY_BOARD = 'OPPSURF Ruthie Jobs'
const RESTRICTED_ITEM_1 = 'OPPSURF Rake the leaves'
const RESTRICTED_ITEM_2 = 'OPPSURF Wash the windows'
const EVERYONE_ITEM = 'OPPSURF Feed the cat'
const TEEN_ONETIME_ITEM = 'OPPSURF Clean the car'
const PLAY_ONETIME_ITEM = 'OPPSURF Water the plants'

let familyId = ''
const memberIds: Record<string, string> = {}
let restrictedBoardId = ''
let everyoneBoardId = ''
let playBoardId = ''
let teenOneTimeItemId = ''
let playOneTimeItemId = ''
let savedFoConfig: Record<string, unknown> | null = null
let savedRuthiePrefs: Record<string, unknown> | null | undefined = undefined

/** Reset a one_time fixture item + its bridge tasks so claim tests are re-runnable. */
async function resetOneTimeItem(itemId: string) {
  await supabase
    .from('tasks')
    .delete()
    .eq('family_id', familyId)
    .eq('source', 'opportunity_list_claim')
    .eq('source_reference_id', itemId)
  await supabase
    .from('list_items')
    .update({ is_available: true, completed_instances: 0, last_completed_at: null })
    .eq('id', itemId)
}

/** Poll the DB until the predicate returns truthy (or time out). */
async function pollDb<T>(fn: () => Promise<T | null>, timeoutMs = 15000): Promise<T> {
  const start = Date.now()
  for (;;) {
    const result = await fn()
    if (result) return result
    if (Date.now() - start > timeoutMs) throw new Error('pollDb timed out')
    await new Promise(r => setTimeout(r, 500))
  }
}

async function memberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const { data, error } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('display_name', name)
    .single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  return data.id
}

async function cleanup() {
  // Any claim-bridge tasks a stray click may have created
  await supabase.from('tasks').delete().eq('family_id', familyId).ilike('title', 'OPPSURF%')
  const { data: lists } = await supabase
    .from('lists').select('id').eq('family_id', familyId).ilike('title', 'OPPSURF%')
  for (const l of lists ?? []) {
    await supabase.from('list_items').delete().eq('list_id', l.id)
    await supabase.from('lists').delete().eq('id', l.id)
  }
}

test.describe('Opportunity Surfaces Restoration', () => {
  // Same shared-auth-helper flake allowance as the leak-pass suite.
  test.describe.configure({ retries: 1 })

  test.beforeAll(async () => {
    const { data: family, error } = await supabase
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    const sarah = await memberId('Sarah')
    const alex = await memberId('Alex')

    await cleanup() // clear leftovers from a crashed prior run

    // Board restricted to Alex — mom is NOT in eligible_members (pins the
    // mom-sees-all rule), siblings are excluded
    const { data: bA, error: bAErr } = await supabase.from('lists')
      .insert({
        family_id: familyId, owner_id: sarah, created_by: sarah,
        title: RESTRICTED_BOARD, list_name: RESTRICTED_BOARD, list_type: 'custom',
        is_opportunity: true, eligible_members: [alex],
        default_opportunity_subtype: 'repeatable',
        default_reward_type: 'money', default_reward_amount: 2,
      })
      .select('id').single()
    if (bAErr) throw new Error(`restricted board: ${bAErr.message}`)
    restrictedBoardId = bA.id

    // Board for everyone (eligible_members null)
    const { data: bB, error: bBErr } = await supabase.from('lists')
      .insert({
        family_id: familyId, owner_id: sarah, created_by: sarah,
        title: EVERYONE_BOARD, list_name: EVERYONE_BOARD, list_type: 'custom',
        is_opportunity: true, eligible_members: null,
        default_opportunity_subtype: 'repeatable',
        default_reward_type: 'points', default_reward_amount: 5,
      })
      .select('id').single()
    if (bBErr) throw new Error(`everyone board: ${bBErr.message}`)
    everyoneBoardId = bB.id

    // Play board — eligible to Ruthie only, one_time jobs (scope c + write-back)
    const ruthie = await memberId('Ruthie')
    const { data: bP, error: bPErr } = await supabase.from('lists')
      .insert({
        family_id: familyId, owner_id: sarah, created_by: sarah,
        title: PLAY_BOARD, list_name: PLAY_BOARD, list_type: 'custom',
        is_opportunity: true, eligible_members: [ruthie],
        default_opportunity_subtype: 'one_time',
        default_reward_type: 'money', default_reward_amount: 1,
      })
      .select('id').single()
    if (bPErr) throw new Error(`play board: ${bPErr.message}`)
    playBoardId = bP.id

    const { error: iErr } = await supabase.from('list_items').insert([
      { list_id: restrictedBoardId, content: RESTRICTED_ITEM_1, item_name: RESTRICTED_ITEM_1, is_available: true, sort_order: 0 },
      { list_id: restrictedBoardId, content: RESTRICTED_ITEM_2, item_name: RESTRICTED_ITEM_2, is_available: true, sort_order: 1 },
      { list_id: everyoneBoardId, content: EVERYONE_ITEM, item_name: EVERYONE_ITEM, is_available: true, sort_order: 0 },
    ])
    if (iErr) throw new Error(`board items: ${iErr.message}`)

    // One_time items for the two write-back tests (per-item subtype override
    // on the teen board; the play board's list-level default is one_time)
    const { data: teenItem, error: tiErr } = await supabase.from('list_items')
      .insert({
        list_id: restrictedBoardId, content: TEEN_ONETIME_ITEM, item_name: TEEN_ONETIME_ITEM,
        is_available: true, sort_order: 2, opportunity_subtype: 'one_time',
      })
      .select('id').single()
    if (tiErr) throw new Error(`teen one_time item: ${tiErr.message}`)
    teenOneTimeItemId = teenItem.id

    const { data: playItem, error: piErr } = await supabase.from('list_items')
      .insert({
        list_id: playBoardId, content: PLAY_ONETIME_ITEM, item_name: PLAY_ONETIME_ITEM,
        is_available: true, sort_order: 0,
      })
      .select('id').single()
    if (piErr) throw new Error(`play one_time item: ${piErr.message}`)
    playOneTimeItemId = playItem.id
  })

  test.afterAll(async () => {
    await cleanup()
    // Restore Ruthie's preferences if test 7 changed the money opt-in
    if (savedRuthiePrefs !== undefined) {
      await supabase
        .from('family_members')
        .update({ preferences: savedRuthiePrefs })
        .eq('id', await memberId('Ruthie'))
    }
    // Restore mom's FO config if test 5 replaced it
    if (savedFoConfig) {
      await supabase
        .from('family_overview_configs')
        .update({
          selected_member_ids: savedFoConfig.selected_member_ids,
          section_states: savedFoConfig.section_states,
        })
        .eq('id', savedFoConfig.id as string)
    }
  })

  // ── 1. Mom sees the tab and ALL boards ────────────────────────────────────
  test('Mom: Opportunities tab restored on /tasks; sees all boards regardless of eligibility', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    const oppTab = page.getByRole('tab', { name: 'Opportunities' })
    await expect(oppTab).toBeVisible({ timeout: 15000 })
    await oppTab.click()

    // Mom is NOT in the restricted board's eligible_members — she still sees it
    await expect(page.getByText(RESTRICTED_BOARD)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(EVERYONE_BOARD)).toBeVisible()

    // Expanding the board reveals its items (browse UI wired)
    await page.getByText(RESTRICTED_BOARD).click()
    await expect(page.getByText(RESTRICTED_ITEM_1)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(RESTRICTED_ITEM_2)).toBeVisible()
  })

  // ── 2. Eligible teen sees both boards ─────────────────────────────────────
  test('Eligible teen (Alex): tab visible; restricted + everyone boards render', async ({ page }) => {
    await loginAsAlex(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    const oppTab = page.getByRole('tab', { name: 'Opportunities' })
    await expect(oppTab).toBeVisible({ timeout: 15000 })
    await oppTab.click()

    await expect(page.getByText(RESTRICTED_BOARD)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(EVERYONE_BOARD)).toBeVisible()

    // Items browsable with the claim button
    await page.getByText(RESTRICTED_BOARD).click()
    await expect(page.getByText(RESTRICTED_ITEM_1)).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: "I'll do this!" }).first()).toBeVisible()
  })

  // ── 3. Sibling does NOT see the restricted board ──────────────────────────
  test('Sibling teen (Casey): everyone board only — restricted board hidden', async ({ page }) => {
    await loginAsCasey(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    const oppTab = page.getByRole('tab', { name: 'Opportunities' })
    await expect(oppTab).toBeVisible({ timeout: 15000 })
    await oppTab.click()

    await expect(page.getByText(EVERYONE_BOARD)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(RESTRICTED_BOARD)).not.toBeVisible()
  })

  // ── 4. Dad (additional_adult) is eligibility-scoped too ───────────────────
  test('Dad: tab visible; sees the everyone board, not the restricted one', async ({ page }) => {
    await loginAsDad(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    const oppTab = page.getByRole('tab', { name: 'Opportunities' })
    await expect(oppTab).toBeVisible({ timeout: 15000 })
    await oppTab.click()

    await expect(page.getByText(EVERYONE_BOARD)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(RESTRICTED_BOARD)).not.toBeVisible()
  })

  // ── 5. FO browsable board per member column ───────────────────────────────
  test('Mom FO: unclaimed board items render in the eligible member\'s column only', async ({ page }) => {
    const sarah = await memberId('Sarah')
    const alex = await memberId('Alex')
    const casey = await memberId('Casey')

    // Snapshot + pin mom's FO config so both teen columns are selected and
    // no saved collapse state hides the opportunities section
    const { data: cfg } = await supabase
      .from('family_overview_configs')
      .select('id, selected_member_ids, section_states')
      .eq('family_id', familyId)
      .eq('family_member_id', sarah)
      .maybeSingle()
    if (cfg) {
      savedFoConfig = cfg
      await supabase
        .from('family_overview_configs')
        .update({ selected_member_ids: [alex, casey], section_states: {} })
        .eq('id', cfg.id)
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('family_overview_configs')
        .insert({
          family_id: familyId, family_member_id: sarah,
          selected_member_ids: [alex, casey], section_states: {},
        })
        .select('id, selected_member_ids, section_states').single()
      if (insErr) throw new Error(`fo config: ${insErr.message}`)
      savedFoConfig = { ...inserted, selected_member_ids: [], section_states: {} }
    }

    await loginAsMom(page)
    await page.goto('/dashboard?view=family_overview')
    await waitForAppReady(page)

    // Alex's column: restricted board with its unclaimed items
    const alexColumn = page.getByTestId(`member-column-${alex}`)
    await expect(alexColumn).toBeVisible({ timeout: 15000 })
    await expect(
      alexColumn.getByTestId(`fo-opp-board-${restrictedBoardId}-${alex}`)
    ).toBeVisible({ timeout: 15000 })
    await expect(alexColumn.getByText(RESTRICTED_ITEM_1)).toBeVisible()
    // Everyone board shows for Alex too
    await expect(
      alexColumn.getByTestId(`fo-opp-board-${everyoneBoardId}-${alex}`)
    ).toBeVisible()

    // Casey's column: everyone board yes, restricted board never
    const caseyColumn = page.getByTestId(`member-column-${casey}`)
    await expect(caseyColumn).toBeVisible()
    await expect(
      caseyColumn.getByTestId(`fo-opp-board-${everyoneBoardId}-${casey}`)
    ).toBeVisible({ timeout: 15000 })
    await expect(
      caseyColumn.getByTestId(`fo-opp-board-${restrictedBoardId}-${casey}`)
    ).not.toBeVisible()
  })

  // ── 6. Guided regression pin ──────────────────────────────────────────────
  test('Guided (Jordan): two-tab experience intact; everyone board still renders', async ({ page }) => {
    await loginAsJordan(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    await expect(page.getByRole('tab', { name: 'My Tasks' })).toBeVisible({ timeout: 15000 })
    const oppTab = page.getByRole('tab', { name: 'Opportunities' })
    await expect(oppTab).toBeVisible()
    await oppTab.click()

    await expect(page.getByText(EVERYONE_BOARD)).toBeVisible({ timeout: 15000 })
    // Jordan isn't in the restricted board's eligible_members
    await expect(page.getByText(RESTRICTED_BOARD)).not.toBeVisible()
  })

  // ── 7. Play claim flow + write-back (scope c) + money-visibility gate ─────
  test('Play (Ruthie): tap-to-claim a job; completing it consumes the one_time item', async ({ page }) => {
    await resetOneTimeItem(playOneTimeItemId)

    // Snapshot Ruthie's preferences; clear any explicit money opt-in so the
    // default-hidden state is what renders first (restored in afterAll).
    const ruthieId = await memberId('Ruthie')
    const { data: ruthieRow } = await supabase
      .from('family_members')
      .select('preferences')
      .eq('id', ruthieId)
      .single()
    savedRuthiePrefs = (ruthieRow?.preferences as Record<string, unknown> | null) ?? null
    const basePrefs = { ...(savedRuthiePrefs ?? {}) } as Record<string, unknown>
    const baseSections = { ...((basePrefs.my_rewards_sections as Record<string, unknown> | null) ?? {}) }
    delete baseSections.finances
    await supabase
      .from('family_members')
      .update({ preferences: { ...basePrefs, my_rewards_sections: baseSections } })
      .eq('id', ruthieId)

    await loginAsRiley(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Extra Jobs board renders with the claimable tile
    const board = page.getByTestId(`play-opp-board-${playBoardId}`)
    await expect(board).toBeVisible({ timeout: 15000 })
    const tile = page.getByTestId(`play-opp-tile-${playOneTimeItemId}`)
    await expect(tile).toBeVisible()

    // Money gate (founder ruling 2026-07-02): dollar amounts HIDDEN by default
    // on Play tiles — same per-kid opt-in as the Fun page money section.
    await expect(page.getByText('Earn $1.00')).not.toBeVisible()

    // Mom opts the kid in → the amount shows
    await supabase
      .from('family_members')
      .update({
        preferences: {
          ...basePrefs,
          my_rewards_sections: { ...baseSections, finances: true },
        },
      })
      .eq('id', ruthieId)
    await page.reload()
    await waitForAppReady(page)
    await expect(page.getByTestId(`play-opp-tile-${playOneTimeItemId}`)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Earn $1.00')).toBeVisible()

    // Tap → confirm → Yes!
    await page.getByTestId(`play-opp-tile-${playOneTimeItemId}`).click()
    await expect(page.getByText('Want to do this job?')).toBeVisible({ timeout: 10000 })
    await page.getByTestId('play-opp-claim-yes').click()
    // On success the confirm copy is replaced by "It's yours!" for 1.8s and the
    // dialog closes; on claim FAILURE the confirm copy stays with an error.
    // Pin the deterministic side (confirm copy gone) — the 1.8s success flash
    // can slip between expect polls on slow headless runs. The DB polls below
    // are the real proof the claim landed.
    await expect(page.getByText('Want to do this job?')).not.toBeVisible({ timeout: 20000 })

    // Claim-bridge task created for Ruthie
    const ruthie = await memberId('Ruthie')
    const bridgeTask = await pollDb(async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, status, assignee_id')
        .eq('source', 'opportunity_list_claim')
        .eq('source_reference_id', playOneTimeItemId)
        .maybeSingle()
      return data ?? null
    })
    expect(bridgeTask.assignee_id).toBe(ruthie)

    // Item leaves the board (claimed) — the board hides when nothing is claimable
    await expect(tile).not.toBeVisible({ timeout: 15000 })

    // The claimed job renders as a normal Play task tile — tap to complete
    const jobTile = page.getByRole('button', { name: PLAY_ONETIME_ITEM })
    await expect(jobTile).toBeVisible({ timeout: 15000 })
    await jobTile.click()

    // Write-back: the one_time item is consumed
    const consumed = await pollDb(async () => {
      const { data } = await supabase
        .from('list_items')
        .select('is_available, completed_instances')
        .eq('id', playOneTimeItemId)
        .single()
      return data && data.is_available === false && data.completed_instances === 1 ? data : null
    })
    expect(consumed.is_available).toBe(false)
    expect(consumed.completed_instances).toBe(1)
  })

  // ── 8. Teen write-back via the TaskCard toggle path ───────────────────────
  test('Teen (Alex): completing a claimed board job via the Tasks page consumes the item', async ({ page }) => {
    await resetOneTimeItem(teenOneTimeItemId)

    await loginAsAlex(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    await page.getByRole('tab', { name: 'Opportunities' }).click()
    await page.getByText(RESTRICTED_BOARD).click()
    await expect(page.getByText(TEEN_ONETIME_ITEM)).toBeVisible({ timeout: 15000 })

    // Claim the one_time item from the board
    const itemCard = page.locator('div').filter({ hasText: TEEN_ONETIME_ITEM }).filter({ has: page.getByRole('button', { name: "I'll do this!" }) }).last()
    await itemCard.getByRole('button', { name: "I'll do this!" }).click()

    // Bridge task exists → appears on the Opportunities tab as a task card
    const alex = await memberId('Alex')
    const bridgeTask = await pollDb(async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, assignee_id')
        .eq('source', 'opportunity_list_claim')
        .eq('source_reference_id', teenOneTimeItemId)
        .maybeSingle()
      return data ?? null
    })
    expect(bridgeTask.assignee_id).toBe(alex)

    // Complete it via the TaskCard toggle (useTaskCompletion.ts path).
    // Reload so the bridge task is in displayTasks; the board card starts
    // collapsed again, so the only "Mark complete" near the item title is
    // the TaskCard checkbox.
    await page.reload()
    await waitForAppReady(page)
    await page.getByRole('tab', { name: 'Opportunities' }).click()
    const cardRoot = page
      .locator('div.relative')
      .filter({ has: page.getByText(TEEN_ONETIME_ITEM, { exact: true }) })
      .filter({ has: page.getByRole('button', { name: 'Mark complete' }) })
      .first()
    await expect(cardRoot).toBeVisible({ timeout: 15000 })
    await cardRoot.getByRole('button', { name: 'Mark complete' }).click()

    // Write-back: item consumed through the useTaskCompletion path
    const consumed = await pollDb(async () => {
      const { data } = await supabase
        .from('list_items')
        .select('is_available, completed_instances')
        .eq('id', teenOneTimeItemId)
        .single()
      return data && data.is_available === false && data.completed_instances === 1 ? data : null
    })
    expect(consumed.is_available).toBe(false)
    expect(consumed.completed_instances).toBe(1)
  })
})
