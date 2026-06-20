/**
 * KIDS-REWARDS-PAGE — Slice 3 verification
 * (Creature pages + Coloring section + Dashboard Doors)
 *
 * Proof-of-done per the active build file + founder gate §13:
 *
 *   1. Creature frame renders (swipe strip + unplaced tray) on the member's
 *      rewards page; chevron/swipe NAVIGATES between unlocked backgrounds and
 *      persists last_viewed_page_id (R5).
 *   2. Placement gesture A — tap a tray creature to select, tap the scene to
 *      drop it (sticker_page_id set to the current page).
 *   3. Placement gesture B — drag a tray creature up onto the scene (pointer).
 *   4. Drag-to-edge — dragging a PLACED creature to the edge carries it to the
 *      adjacent background (gate §13 "swipe browses, drag-to-edge carries").
 *   5. Remove-from-page — tap a placed creature → Return to tray (sticker_page_id
 *      = NULL), back in the unplaced tray.
 *   6. Theme-scoped — backgrounds + creatures from a DIFFERENT theme never
 *      appear (future set-picker prepared, gate §13).
 *   7. Coloring CARD GALLERY — active + completed cards; tap a finished card →
 *      the existing reveal modal with the new Download actions (Q4).
 *   8. Dashboard doors — info_sticker_page + info_coloring_page render as
 *      view-only viewports and tap-open their full modals.
 *   9. Settings — the Creatures + Coloring section toggles exist and gate the
 *      sections.
 *  10. Play variant renders the frame on /rewards.
 *  11. View As (Convention #39) — mom viewing a kid sees the frame, no crash.
 *
 * Fixtures: KRSLICE3-prefixed where a text field exists; every creature / page
 * unlock / coloring reveal / widget / throwaway-theme row is tracked by id and
 * removed in cleanup (member_creature_collection etc. have no text field).
 * Member preferences + sticker state are snapshotted and restored. Testworth
 * family; service role (role-scoping-leak-pass pattern).
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsCasey, loginAsRiley } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const sr = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PREFIX = 'KRSLICE3'

let familyId = ''
const memberIds: Record<string, string> = {}

// Reference fixtures (looked up once)
let themeId = ''
let pageA = { id: '', scene: '' } // cherry blossom (sort 1)
let pageB = { id: '', scene: '' } // christmas (sort 2)
let pageC = { id: '', scene: '' } // a same-theme page deliberately NOT unlocked
let creatureIds: string[] = []
let coloringIds: string[] = []

// Throwaway second theme for the theme-scoping negative test
let otherThemeId = ''
let otherPageId = ''
let otherCreatureId = ''

// Tracked fixture rows to delete on cleanup
const created = {
  creatures: [] as string[],
  pageUnlocks: [] as string[],
  coloring: [] as string[],
  widgets: [] as string[],
}
let caseyStateSnapshot:
  | { existed: boolean; is_enabled?: boolean; active_theme_id?: string; active_page_id?: string | null; last_viewed_page_id?: string | null }
  | null = null
// Snapshot of Casey's real page unlocks — restored on cleanup so the swipe
// strip is deterministically [pageA, pageB] during the run.
let caseyUnlocksSnapshot:
  | { sticker_page_id: string; unlocked_trigger_type: string; creatures_at_unlock: number }[]
  | null = null
let ruthieStateSnapshot:
  | { existed: boolean; is_enabled?: boolean; active_page_id?: string | null }
  | null = null

/** The widget grid lazy-renders off-screen cells as skeletons; scroll until
 *  the named widget button appears in the DOM (IntersectionObserver fires). */
async function revealWidgetButton(
  page: import('@playwright/test').Page,
  name: string,
) {
  const btn = page.getByRole('button', { name })
  for (let i = 0; i < 10; i++) {
    if (await btn.count()) return
    await page.mouse.move(640, 400)
    await page.mouse.wheel(0, 900)
    await page.waitForTimeout(350)
  }
}

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

async function setPrefs(mid: string, updates: Record<string, unknown>) {
  const { data } = await sr.from('family_members').select('preferences').eq('id', mid).single()
  const prefs = { ...((data?.preferences as Record<string, unknown>) ?? {}), ...updates }
  await sr.from('family_members').update({ preferences: prefs }).eq('id', mid)
}

async function stripPrefs(mid: string) {
  const { data } = await sr.from('family_members').select('preferences').eq('id', mid).single()
  const prefs = { ...((data?.preferences as Record<string, unknown>) ?? {}) }
  delete prefs.show_my_rewards
  delete prefs.my_rewards_sections
  await sr.from('family_members').update({ preferences: prefs }).eq('id', mid)
}

// ─── Sticker-book fixtures ────────────────────────────────────────────────────

async function ensureCaseyStickerState() {
  const casey = await memberId('Casey')
  const { data: existing } = await sr
    .from('member_sticker_book_state')
    .select('is_enabled, active_theme_id, active_page_id, last_viewed_page_id')
    .eq('family_member_id', casey)
    .maybeSingle()

  if (!caseyStateSnapshot) {
    caseyStateSnapshot = existing
      ? { existed: true, ...existing }
      : { existed: false }
  }

  const payload = {
    is_enabled: true,
    active_theme_id: themeId,
    active_page_id: pageA.id,
    last_viewed_page_id: null,
  }
  if (existing) {
    await sr.from('member_sticker_book_state').update(payload).eq('family_member_id', casey)
  } else {
    await sr
      .from('member_sticker_book_state')
      .insert({ family_id: familyId, family_member_id: casey, ...payload })
  }
}

/** Insert a page unlock if missing. Tracks the id only when `track` is set
 *  (Ruthie / throwaway-theme); Casey's strip is handled via snapshot/restore. */
async function ensurePageUnlock(mid: string, pageId: string, track = true) {
  const { data: existing } = await sr
    .from('member_page_unlocks')
    .select('id')
    .eq('family_member_id', mid)
    .eq('sticker_page_id', pageId)
    .maybeSingle()
  if (existing) return
  const { data, error } = await sr
    .from('member_page_unlocks')
    .insert({
      family_id: familyId,
      family_member_id: mid,
      sticker_page_id: pageId,
      unlocked_trigger_type: 'manual_unlock',
      creatures_at_unlock: 0,
    })
    .select('id')
    .single()
  if (error) throw new Error(`page unlock fixture: ${error.message}`)
  if (track) created.pageUnlocks.push(data.id)
}

async function clearCaseyCreatures() {
  const casey = await memberId('Casey')
  await sr.from('member_creature_collection').delete().eq('family_member_id', casey)
  created.creatures = []
}

async function insertCreature(
  mid: string,
  creatureId: string,
  pageId: string | null,
  x: number | null,
  y: number | null,
): Promise<string> {
  const { data, error } = await sr
    .from('member_creature_collection')
    .insert({
      family_id: familyId,
      family_member_id: mid,
      creature_id: creatureId,
      sticker_page_id: pageId,
      position_x: x,
      position_y: y,
      awarded_source_type: 'task_completion',
      awarded_source_id: randomUUID(),
    })
    .select('id')
    .single()
  if (error) throw new Error(`creature fixture: ${error.message}`)
  created.creatures.push(data.id)
  return data.id
}

async function creaturePageOf(creatureRowId: string): Promise<string | null> {
  const { data } = await sr
    .from('member_creature_collection')
    .select('sticker_page_id')
    .eq('id', creatureRowId)
    .single()
  return data?.sticker_page_id ?? null
}

async function insertColoringReveal(mid: string, coloringId: string, complete: boolean): Promise<string> {
  const { data, error } = await sr
    .from('member_coloring_reveals')
    .insert({
      family_id: familyId,
      family_member_id: mid,
      coloring_image_id: coloringId,
      reveal_step_count: 10,
      current_step: complete ? 10 : 3,
      revealed_zone_ids: [],
      lineart_preference: 'medium',
      is_complete: complete,
      is_active: true,
    })
    .select('id')
    .single()
  if (error) throw new Error(`coloring fixture: ${error.message}`)
  created.coloring.push(data.id)
  return data.id
}

async function insertDoorWidget(mid: string, type: 'info_sticker_page' | 'info_coloring_page'): Promise<string> {
  const { data, error } = await sr
    .from('dashboard_widgets')
    .insert({
      family_id: familyId,
      family_member_id: mid,
      template_type: type,
      title: type === 'info_sticker_page' ? `${PREFIX} Sticker Page` : `${PREFIX} Coloring Page`,
      size: 'medium',
      is_active: true,
      is_on_dashboard: true,
    })
    .select('id')
    .single()
  if (error) throw new Error(`door widget fixture: ${error.message}`)
  created.widgets.push(data.id)
  return data.id
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

async function cleanup() {
  if (created.widgets.length) await sr.from('dashboard_widgets').delete().in('id', created.widgets)
  if (created.coloring.length) await sr.from('member_coloring_reveals').delete().in('id', created.coloring)
  if (created.creatures.length) await sr.from('member_creature_collection').delete().in('id', created.creatures)
  // Belt-and-suspenders: any Casey creatures from a crashed run
  if (memberIds['Casey']) {
    await sr.from('member_creature_collection').delete().eq('family_member_id', memberIds['Casey'])
  }
  if (created.pageUnlocks.length) await sr.from('member_page_unlocks').delete().in('id', created.pageUnlocks)
  created.widgets = []
  created.coloring = []
  created.creatures = []
  created.pageUnlocks = []

  // Throwaway theme + its page/creature (delete child rows first)
  if (otherCreatureId) await sr.from('gamification_creatures').delete().eq('id', otherCreatureId)
  if (otherPageId) {
    await sr.from('member_page_unlocks').delete().eq('sticker_page_id', otherPageId)
    await sr.from('gamification_sticker_pages').delete().eq('id', otherPageId)
  }
  if (otherThemeId) await sr.from('gamification_themes').delete().eq('id', otherThemeId)
  otherThemeId = ''
  otherPageId = ''
  otherCreatureId = ''

  // Restore Casey's real page unlocks (the deterministic strip is teardown-only)
  if (caseyUnlocksSnapshot !== null && memberIds['Casey']) {
    await sr.from('member_page_unlocks').delete().eq('family_member_id', memberIds['Casey'])
    if (caseyUnlocksSnapshot.length) {
      await sr.from('member_page_unlocks').insert(
        caseyUnlocksSnapshot.map(u => ({
          family_id: familyId,
          family_member_id: memberIds['Casey'],
          sticker_page_id: u.sticker_page_id,
          unlocked_trigger_type: u.unlocked_trigger_type,
          creatures_at_unlock: u.creatures_at_unlock,
        })),
      )
    }
    caseyUnlocksSnapshot = null
  }

  // Restore Casey sticker state
  if (caseyStateSnapshot && memberIds['Casey']) {
    if (caseyStateSnapshot.existed) {
      await sr
        .from('member_sticker_book_state')
        .update({
          is_enabled: caseyStateSnapshot.is_enabled,
          active_theme_id: caseyStateSnapshot.active_theme_id,
          active_page_id: caseyStateSnapshot.active_page_id,
          last_viewed_page_id: caseyStateSnapshot.last_viewed_page_id,
        })
        .eq('family_member_id', memberIds['Casey'])
    } else {
      await sr.from('member_sticker_book_state').delete().eq('family_member_id', memberIds['Casey'])
    }
    caseyStateSnapshot = null
  }

  // Restore Ruthie state if the Play-variant test touched it
  if (ruthieStateSnapshot && memberIds['Ruthie']) {
    if (ruthieStateSnapshot.existed) {
      await sr
        .from('member_sticker_book_state')
        .update({
          is_enabled: ruthieStateSnapshot.is_enabled,
          active_page_id: ruthieStateSnapshot.active_page_id,
        })
        .eq('family_member_id', memberIds['Ruthie'])
    } else {
      await sr.from('member_sticker_book_state').delete().eq('family_member_id', memberIds['Ruthie'])
    }
    ruthieStateSnapshot = null
  }

  for (const name of ['Casey', 'Ruthie']) {
    if (memberIds[name]) await stripPrefs(memberIds[name])
  }
  if (memberIds['Casey']) {
    await sr
      .from('view_as_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('viewing_as_id', memberIds['Casey'])
      .is('ended_at', null)
  }
}

// ─── Suite ───────────────────────────────────────────────────────────────────

test.describe('KIDS-REWARDS-PAGE Slice 3 — creatures + coloring + dashboard doors', () => {
  test.describe.configure({ timeout: 150_000 })

  test.beforeAll(async () => {
    const { data: family, error } = await sr
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    await Promise.all([memberId('Casey'), memberId('Ruthie'), memberId('Sarah')])

    // Reference data
    const { data: theme } = await sr
      .from('gamification_themes')
      .select('id')
      .eq('is_active', true)
      .order('sort_order')
      .limit(1)
      .single()
    themeId = theme!.id

    const { data: pages } = await sr
      .from('gamification_sticker_pages')
      .select('id, scene, sort_order')
      .eq('theme_id', themeId)
      .order('sort_order')
      .limit(3)
    pageA = { id: pages![0].id, scene: pages![0].scene }
    pageB = { id: pages![1].id, scene: pages![1].scene }
    pageC = { id: pages![2].id, scene: pages![2].scene }

    const { data: creatures } = await sr
      .from('gamification_creatures')
      .select('id')
      .eq('theme_id', themeId)
      .order('sort_order')
      .limit(2)
    creatureIds = (creatures ?? []).map(c => c.id)

    const { data: coloring } = await sr
      .from('coloring_reveal_library')
      .select('id')
      .eq('is_active', true)
      .order('sort_order')
      .limit(2)
    coloringIds = (coloring ?? []).map(c => c.id)

    await cleanup()
  })

  test.afterAll(async () => {
    await cleanup()
  })

  // Each creature test starts from a clean Casey creature set + the page+sticker
  // fixtures so they don't bleed into one another.
  async function baselineCasey() {
    const casey = await memberId('Casey')
    await ensureCaseyStickerState()
    // Snapshot Casey's real unlocks once, then reset the strip to exactly
    // [pageA, pageB] for deterministic navigation assertions.
    if (caseyUnlocksSnapshot === null) {
      const { data } = await sr
        .from('member_page_unlocks')
        .select('sticker_page_id, unlocked_trigger_type, creatures_at_unlock')
        .eq('family_member_id', casey)
      caseyUnlocksSnapshot = data ?? []
    }
    await sr.from('member_page_unlocks').delete().eq('family_member_id', casey)
    await ensurePageUnlock(casey, pageA.id, false)
    await ensurePageUnlock(casey, pageB.id, false)
    // Clear ALL of Casey's door widgets (by type — covers prior tests AND the
    // eyes-on tour, which seeds them with un-prefixed titles) so they don't
    // double up into a strict-mode violation.
    await sr
      .from('dashboard_widgets')
      .delete()
      .eq('family_member_id', casey)
      .in('template_type', ['info_sticker_page', 'info_coloring_page'])
    created.widgets = []
    await clearCaseyCreatures()
    await setPrefs(casey, {
      show_my_rewards: true,
      my_rewards_sections: { creatures: true, coloring: true, points: false },
    })
  }

  // ── 1. Frame renders + chevron navigation persists last_viewed_page_id ────
  test('frame renders; chevron navigates the swipe strip and persists last viewed', async ({ page }) => {
    const casey = await memberId('Casey')
    await baselineCasey()
    await insertCreature(casey, creatureIds[0], pageA.id, 0.2, 0.2) // placed, corner
    await insertCreature(casey, creatureIds[1], null, null, null) // unplaced

    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)

    const frame = page.getByTestId('creature-page-frame')
    await expect(frame).toBeVisible({ timeout: 15000 })
    // Starts on the active page (pageA / cherry blossom)
    await expect(frame.getByText(pageA.scene, { exact: true })).toBeVisible()
    // Tray shows the one unplaced creature
    await expect(page.getByTestId('tray-creature')).toHaveCount(1)

    // Navigate to the next background
    await page.getByTestId('creature-nav-right').click()
    await expect(frame.getByText(pageB.scene, { exact: true }).first()).toBeVisible()

    // last_viewed_page_id persisted to pageB (R5)
    await expect
      .poll(
        async () => {
          const { data } = await sr
            .from('member_sticker_book_state')
            .select('last_viewed_page_id')
            .eq('family_member_id', casey)
            .single()
          return data?.last_viewed_page_id ?? null
        },
        { timeout: 10000, message: 'last_viewed_page_id should persist on navigation' },
      )
      .toBe(pageB.id)
  })

  // ── 2. Gesture A — select a tray creature, tap the scene to place ─────────
  test('placement gesture A: select tray creature then tap the scene', async ({ page }) => {
    const casey = await memberId('Casey')
    await baselineCasey()
    const unplacedId = await insertCreature(casey, creatureIds[0], null, null, null)

    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    await expect(page.getByTestId('creature-page-frame')).toBeVisible({ timeout: 15000 })

    // Select the tray creature, then tap the centre of the scene
    await page.getByTestId('tray-creature').first().click()
    await page.getByTestId('creature-hero').click()

    // The creature now lives on the current page (pageA)
    await expect
      .poll(() => creaturePageOf(unplacedId), {
        timeout: 10000,
        message: 'tapped tray creature should land on the current page',
      })
      .toBe(pageA.id)
    await expect(page.getByTestId('tray-creature')).toHaveCount(0)
  })

  // ── 3. Gesture B — drag a tray creature up onto the scene ─────────────────
  test('placement gesture B: drag a tray creature onto the scene', async ({ page }) => {
    const casey = await memberId('Casey')
    await baselineCasey()
    const unplacedId = await insertCreature(casey, creatureIds[0], null, null, null)

    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    await expect(page.getByTestId('creature-page-frame')).toBeVisible({ timeout: 15000 })

    const tray = page.getByTestId('tray-creature').first()
    const hero = page.getByTestId('creature-hero')
    const tBox = (await tray.boundingBox())!
    const hBox = (await hero.boundingBox())!

    // Pull UP first (>12px) to start the drag, then move onto the scene.
    await page.mouse.move(tBox.x + tBox.width / 2, tBox.y + tBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(tBox.x + tBox.width / 2, tBox.y + tBox.height / 2 - 40, { steps: 6 })
    await page.mouse.move(hBox.x + hBox.width / 2, hBox.y + hBox.height / 2, { steps: 10 })
    await page.mouse.up()

    await expect
      .poll(() => creaturePageOf(unplacedId), {
        timeout: 10000,
        message: 'dragged tray creature should land on the current page',
      })
      .toBe(pageA.id)
  })

  // ── 4. Drag-to-edge — carry a placed creature to the adjacent background ──
  test('drag-to-edge carries a placed creature to the previous background', async ({ page }) => {
    const casey = await memberId('Casey')
    await baselineCasey()
    // Creature placed on pageB (so dragging to the LEFT edge carries it to pageA)
    const movingId = await insertCreature(casey, creatureIds[0], pageB.id, 0.5, 0.5)

    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    const frame = page.getByTestId('creature-page-frame')
    await expect(frame).toBeVisible({ timeout: 15000 })

    // Navigate to pageB where the creature lives
    await page.getByTestId('creature-nav-right').click()
    await expect(frame.getByText(pageB.scene, { exact: true }).first()).toBeVisible()

    const hero = page.getByTestId('creature-hero')
    const hBox = (await hero.boundingBox())!
    const creature = hero.locator('[data-creature-overlay]').first()
    const cBox = (await creature.boundingBox())!
    const cy = cBox.y + cBox.height / 2

    // hover() reliably targets the sticker (Playwright accounts for its box);
    // then drag PAST the far-left edge → the drop clamps below EDGE_ZONE → carry.
    await creature.hover()
    await page.mouse.down()
    await page.mouse.move(hBox.x + hBox.width * 0.5, cy, { steps: 5 })
    await page.mouse.move(hBox.x + hBox.width * 0.2, cy, { steps: 5 })
    await page.mouse.move(hBox.x - 60, cy, { steps: 8 })
    await page.waitForTimeout(120)
    await page.mouse.up()

    await expect
      .poll(() => creaturePageOf(movingId), {
        timeout: 10000,
        message: 'dragging to the left edge should carry the creature to the previous page',
      })
      .toBe(pageA.id)
  })

  // ── 5. Remove-from-page → back in the unplaced tray ──────────────────────
  test('tap a placed creature → Return to tray sets sticker_page_id NULL', async ({ page }) => {
    const casey = await memberId('Casey')
    await baselineCasey()
    const placedId = await insertCreature(casey, creatureIds[0], pageA.id, 0.5, 0.5)

    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    await expect(page.getByTestId('creature-page-frame')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('tray-creature')).toHaveCount(0)

    // Tap the placed creature → Return to tray
    await page.getByTestId('creature-hero').locator('[data-creature-overlay]').first().click()
    const removeBtn = page.getByTestId('creature-remove-from-page')
    await expect(removeBtn).toBeVisible()
    await removeBtn.click()

    await expect
      .poll(() => creaturePageOf(placedId), {
        timeout: 10000,
        message: 'Return to tray should null the sticker_page_id',
      })
      .toBe(null)
    await expect(page.getByTestId('tray-creature')).toHaveCount(1)
  })

  // ── 6. Theme-scoped — other-theme page + creature never appear ───────────
  test('theme scoping: a different theme’s background + creature are excluded', async ({ page }) => {
    const casey = await memberId('Casey')
    await baselineCasey()
    await insertCreature(casey, creatureIds[0], null, null, null) // same-theme unplaced

    // Throwaway second theme + page + creature, both granted to Casey
    const { data: ot, error: otErr } = await sr
      .from('gamification_themes')
      .insert({
        theme_slug: `${PREFIX.toLowerCase()}-other`,
        display_name: `${PREFIX} Other`,
        creature_reveal_video_url: 'https://example.com/v.mp4',
        page_reveal_video_url: 'https://example.com/v.mp4',
        is_active: true,
        sort_order: 999,
      })
      .select('id')
      .single()
    if (otErr) throw new Error(`theme fixture: ${otErr.message}`)
    otherThemeId = ot!.id
    const { data: op } = await sr
      .from('gamification_sticker_pages')
      .insert({
        theme_id: otherThemeId,
        slug: `${PREFIX.toLowerCase()}-other-page`,
        display_name: `${PREFIX} Other Page`,
        scene: `${PREFIX}-OtherScene`,
        image_url: 'https://example.com/x.png',
        sort_order: 1,
        is_active: true,
      })
      .select('id')
      .single()
    otherPageId = op!.id
    const { data: oc } = await sr
      .from('gamification_creatures')
      .insert({
        theme_id: otherThemeId,
        slug: `${PREFIX.toLowerCase()}-other-creature`,
        display_name: `${PREFIX} Other Creature`,
        rarity: 'common',
        image_url: 'https://example.com/c.png',
        sort_order: 1,
        is_active: true,
      })
      .select('id')
      .single()
    otherCreatureId = oc!.id
    await ensurePageUnlock(casey, otherPageId)
    await insertCreature(casey, otherCreatureId, null, null, null) // other-theme unplaced

    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    const frame = page.getByTestId('creature-page-frame')
    await expect(frame).toBeVisible({ timeout: 15000 })

    // Only the active theme's unplaced creature is in the tray (1, not 2)
    await expect(page.getByTestId('tray-creature')).toHaveCount(1)

    // The other theme's background never appears in the strip — navigate to the
    // end and confirm its scene name is never the header.
    for (let i = 0; i < 4; i++) {
      const next = page.getByTestId('creature-nav-right')
      if (!(await next.isVisible().catch(() => false))) break
      await next.click()
    }
    await expect(frame.getByText(`${PREFIX}-OtherScene`)).toHaveCount(0)
  })

  // ── 7. Coloring CARD GALLERY + downloads on a finished card ──────────────
  test('coloring gallery shows active + finished cards; finished opens modal with downloads', async ({ page }) => {
    const casey = await memberId('Casey')
    await baselineCasey()
    await insertColoringReveal(casey, coloringIds[0], false) // active
    await insertColoringReveal(casey, coloringIds[1], true) // finished

    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)

    const section = page.getByTestId('mr-section-coloring')
    await expect(section).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('coloring-active-grid')).toBeVisible()
    await expect(page.getByTestId('coloring-completed-grid')).toBeVisible()

    // Open the finished card → modal with Print + the two Download actions (Q4)
    await page.getByTestId('coloring-completed-grid').getByTestId('coloring-card').first().click()
    await expect(page.getByTestId('coloring-download-lineart')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('coloring-download-color')).toBeVisible()
  })

  // ── 8. Dashboard doors — render + open their modals ──────────────────────
  test('dashboard door widgets render and tap-open the creature + coloring modals', async ({ page }) => {
    const casey = await memberId('Casey')
    await baselineCasey()
    await insertCreature(casey, creatureIds[0], pageA.id, 0.3, 0.3)
    await insertColoringReveal(casey, coloringIds[0], false)
    await insertDoorWidget(casey, 'info_sticker_page')
    await insertDoorWidget(casey, 'info_coloring_page')

    await loginAsCasey(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)
    // Clear any auto-opened rhythm/ModalV2 before interacting with the grid.
    await page.waitForTimeout(1500)
    while ((await page.locator('[role="dialog"]').count()) > 0) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    }

    // Sticker door → CreaturePageModal (grid is below the fold — scroll to it)
    await revealWidgetButton(page, 'Open my sticker book')
    const stickerDoor = page.getByRole('button', { name: 'Open my sticker book' })
    await expect(stickerDoor).toBeVisible({ timeout: 15000 })
    await stickerDoor.scrollIntoViewIfNeeded()
    await stickerDoor.click()
    await expect(page.getByTestId('creature-page-modal')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('creature-page-frame')).toBeVisible()
    await page.getByRole('button', { name: 'Close sticker book' }).click()
    await expect(page.getByTestId('creature-page-modal')).toHaveCount(0)

    // Dismiss any stray dialog (an evening-rhythm ModalV2 can auto-open over the
    // dashboard and intercept pointer events on the widget below it).
    while ((await page.locator('[role="dialog"]').count()) > 0) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    }

    // Coloring door → ColorRevealDetailModal
    await revealWidgetButton(page, 'Open my coloring page')
    const coloringDoor = page.getByRole('button', { name: 'Open my coloring page' })
    await expect(coloringDoor).toBeVisible()
    await coloringDoor.scrollIntoViewIfNeeded()
    await coloringDoor.click()
    // Active reveal → step progress text uniquely confirms the reveal modal opened
    await expect(page.getByText(/Step \d+ of \d+/).first()).toBeVisible({ timeout: 10000 })
  })

  // ── 9. Settings — Creatures + Coloring toggles exist + gate the sections ──
  test('settings toggles for Creatures + Coloring exist and gate the sections', async ({ page }) => {
    const casey = await memberId('Casey')
    await baselineCasey()
    await ensureCaseyStickerState()
    await insertCreature(casey, creatureIds[0], null, null, null)
    await insertColoringReveal(casey, coloringIds[0], false)

    // The toggles render in the settings section (mom)
    await loginAsMom(page)
    await page.goto('/family-members')
    await waitForAppReady(page)
    const caseyCard = page
      .locator('.card-hover')
      .filter({ has: page.getByText('Casey', { exact: true }) })
    await caseyCard.getByTitle('Edit').click()
    await caseyCard.getByRole('button', { name: 'Gamification Settings' }).click()
    await page.getByRole('button', { name: 'My Rewards Page' }).click()
    const settings = page.getByTestId('my-rewards-settings-section')
    await expect(settings).toBeVisible()
    await expect(settings.getByRole('switch', { name: 'Creatures' })).toBeVisible()
    await expect(settings.getByRole('switch', { name: 'Coloring pages' })).toBeVisible()

    // Behaviour: an explicit OFF override hides each section
    await setPrefs(casey, {
      show_my_rewards: true,
      my_rewards_sections: { creatures: false, coloring: false, points: true },
    })
    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    await expect(page.getByTestId('mr-section-points')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('mr-section-creatures')).toHaveCount(0)
    await expect(page.getByTestId('mr-section-coloring')).toHaveCount(0)
  })

  // ── 10. Play variant renders the frame on /rewards ───────────────────────
  test('Play /rewards renders the creature frame (play variant)', async ({ page }) => {
    const ruthie = await memberId('Ruthie')
    // Ruthie has her own sticker state (Play auto-provision) — enable her
    // creatures section + ensure she has a background + an unplaced creature.
    const { data: rState } = await sr
      .from('member_sticker_book_state')
      .select('active_theme_id, is_enabled, active_page_id')
      .eq('family_member_id', ruthie)
      .maybeSingle()
    if (ruthieStateSnapshot === null) {
      ruthieStateSnapshot = rState
        ? { existed: true, is_enabled: rState.is_enabled, active_page_id: rState.active_page_id }
        : { existed: false }
    }
    const rTheme = rState?.active_theme_id ?? themeId
    // a background in Ruthie's theme
    const { data: rPage } = await sr
      .from('gamification_sticker_pages')
      .select('id')
      .eq('theme_id', rTheme)
      .order('sort_order')
      .limit(1)
      .single()
    if (!rState) {
      await sr.from('member_sticker_book_state').insert({
        family_id: familyId,
        family_member_id: ruthie,
        active_theme_id: rTheme,
        active_page_id: rPage!.id,
        is_enabled: true,
      })
    } else {
      await sr
        .from('member_sticker_book_state')
        .update({ is_enabled: true, active_page_id: rPage!.id })
        .eq('family_member_id', ruthie)
    }
    await ensurePageUnlock(ruthie, rPage!.id)
    const { data: rCreature } = await sr
      .from('gamification_creatures')
      .select('id')
      .eq('theme_id', rTheme)
      .order('sort_order')
      .limit(1)
      .single()
    await insertCreature(ruthie, rCreature!.id, null, null, null)
    await setPrefs(ruthie, { my_rewards_sections: { creatures: true, points: false } })

    await loginAsRiley(page)
    await page.goto('/rewards')
    await waitForAppReady(page)
    await expect(page.getByTestId('creature-page-frame')).toBeVisible({ timeout: 15000 })

    // cleanup Ruthie page-unlock + creature handled by tracked arrays;
    // reset Ruthie state if we created it is not needed (she had one).
  })

  // ── 11. View As — mom viewing Casey sees the door (effective member) ─────
  // The door widget reads the EFFECTIVE member (Convention #39). Mom viewing
  // Casey must see Casey's sticker door + open Casey's creature page — no crash.
  test('View As Casey: sticker door shows the effective member’s page', async ({ page }) => {
    const casey = await memberId('Casey')
    await baselineCasey()
    await insertCreature(casey, creatureIds[0], pageA.id, 0.3, 0.3)
    await insertDoorWidget(casey, 'info_sticker_page')

    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await page.getByRole('tab', { name: /View As/i }).click()
    await page
      .getByText('Choose a family member to see their dashboard experience')
      .waitFor({ state: 'visible', timeout: 10000 })
    await page.getByRole('button').filter({ hasText: 'Casey' }).first().click()
    await expect(page.locator('[data-testid="view-as-exit"]')).toBeVisible({ timeout: 15000 })

    // Dismiss any auto-opened rhythm modal
    await page.waitForTimeout(2500)
    while ((await page.locator('[role="dialog"]').count()) > 0) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    }

    // Casey's dashboard (in the modal) shows the sticker door → open the frame
    await revealWidgetButton(page, 'Open my sticker book')
    const door = page.getByRole('button', { name: 'Open my sticker book' })
    await expect(door).toBeVisible({ timeout: 15000 })
    await door.click()
    await expect(page.getByTestId('creature-page-modal')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('creature-page-frame')).toBeVisible()

    await sr
      .from('view_as_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('viewing_as_id', casey)
      .is('ended_at', null)
  })

  // ── 12. Starter creature — an enabled empty sticker book gets one, placed ─
  // Founder add (2026-06-13): every account with the creature feature starts
  // with one random creature so they see what it does. award_starter_creature()
  // fires from the member_sticker_book_state trigger once a background exists.
  test('starter creature: an enabled empty sticker book gets one creature on a page', async () => {
    const casey = await memberId('Casey')
    await baselineCasey() // enabled + pageA active + zero creatures

    // Re-touch active_page_id to fire the AFTER-UPDATE starter trigger.
    await sr
      .from('member_sticker_book_state')
      .update({ active_page_id: pageA.id })
      .eq('family_member_id', casey)

    await expect
      .poll(
        async () => {
          const { count } = await sr
            .from('member_creature_collection')
            .select('id', { count: 'exact', head: true })
            .eq('family_member_id', casey)
          return count ?? 0
        },
        { timeout: 10000, message: 'the starter trigger should award exactly one creature' },
      )
      .toBe(1)

    const { data: row } = await sr
      .from('member_creature_collection')
      .select('sticker_page_id, awarded_source_type')
      .eq('family_member_id', casey)
      .single()
    expect(row?.awarded_source_type).toBe('manual_award')
    expect(row?.sticker_page_id).not.toBeNull() // placed on a background, not stranded in the tray

    // Idempotent: re-firing the trigger does NOT add a second starter.
    await sr
      .from('member_sticker_book_state')
      .update({ active_page_id: pageA.id })
      .eq('family_member_id', casey)
    await new Promise(r => setTimeout(r, 1500))
    const { count: after } = await sr
      .from('member_creature_collection')
      .select('id', { count: 'exact', head: true })
      .eq('family_member_id', casey)
    expect(after).toBe(1)
  })

  // ── 13. Orphan safety net — a creature on a non-unlocked page shows in tray ─
  // Founder hotfix (2026-06-13): a starter had been placed on active_page_id
  // which pointed at a page the member hadn't unlocked, so it was invisible in
  // the swipe strip. The frame now surfaces such orphans in the tray so they're
  // never lost — the kid just re-places them.
  test('a creature on a non-unlocked page surfaces in the tray (never lost)', async ({ page }) => {
    const casey = await memberId('Casey')
    await baselineCasey() // unlocks pageA + pageB only
    // pageC is a same-theme page Casey has NOT unlocked → an orphan.
    await insertCreature(casey, creatureIds[0], pageC.id, 0.5, 0.5)

    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    await expect(page.getByTestId('creature-page-frame')).toBeVisible({ timeout: 15000 })

    // The orphan appears in the tray (recoverable), not lost on an unreachable page.
    await expect(page.getByTestId('tray-creature')).toHaveCount(1)
  })
})
