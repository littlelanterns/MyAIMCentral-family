/**
 * PECON-SHOP — EYES-ON TOUR (manual helper, NOT a regression test)
 *
 * Convention #277: Claude drives this tour via Playwright, reads every
 * screenshot, and fills the Mom-UI Verification table in
 * .claude/rules/current-builds/PECON-shop.md. Gated behind EYES_ON_TOUR so
 * it never runs as part of the normal suite.
 *
 * Run with:
 *   $env:EYES_ON_TOUR='1'; npx playwright test tests/e2e/features/point-economy-shop-eyes-on-tour.spec.ts --headed
 *
 * Surfaces toured:
 *   1. Prize Board "Shop" tab — item list, [+ Add Reward] editor modal,
 *      Bulk Add with AI input step, pending-purchase strip (mom, desktop/mobile)
 *   2. Queue Requests tab — StorePurchaseCard for a pending purchase (mom, desktop)
 *   3. GamificationSettingsModal — Points section "Manage the Reward Shop →"
 *      door + My Rewards Page section "Reward Shop" toggle (mom, desktop)
 *   4. My Rewards Shop section — Buy / progress / gate states + confirm modal
 *      (Alex, independent, desktop/tablet/mobile)
 *   5. Play picture-shelf Shop variant + "Trade for this?" confirm (Ruthie, mobile)
 *
 * Fixtures: PECONTOUR-marked reward_shop_items + one seeded pending purchase,
 * against the shared Testworth family. Every seeded row is reverted in
 * afterAll (other lanes share this same family right now) — balances are
 * captured before and restored after.
 */
import { test, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsAlex, loginAsRiley } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

test.skip(!process.env.EYES_ON_TOUR, 'Manual eyes-on tour — set EYES_ON_TOUR=1 to run')

const sr = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')

async function shot(page: Page, name: string) {
  fs.mkdirSync(SHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
}

async function linger(page: Page, ms = 700) {
  await page.waitForTimeout(ms)
}

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
}

const MARKER = 'PECONTOUR'

let familyId = ''
let sarahId = '', alexId = '', ruthieId = ''
let alexBefore = 0, ruthieBefore = 0

const itemIds: string[] = []
let pendingPurchaseId = ''

async function memberId(name: string): Promise<string> {
  const { data, error } = await sr.from('family_members').select('id').eq('family_id', familyId).eq('display_name', name).single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  return data.id
}

test.describe('PECON-SHOP eyes-on tour', () => {
  test.beforeAll(async () => {
    const { data: family, error } = await sr.from('families').select('id').eq('family_login_name_lower', 'testworthfamily').single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    sarahId = await memberId('Sarah')
    alexId = await memberId('Alex')
    ruthieId = await memberId('Ruthie')

    const { data: alexRow } = await sr.from('family_members').select('gamification_points').eq('id', alexId).single()
    alexBefore = alexRow?.gamification_points ?? 0
    const { data: ruthieRow } = await sr.from('family_members').select('gamification_points').eq('id', ruthieId).single()
    ruthieBefore = ruthieRow?.gamification_points ?? 0

    // Give Alex enough headroom to clearly afford one item and not another.
    await sr.from('family_members').update({ gamification_points: 100 }).eq('id', alexId)
    await sr.from('family_members').update({ gamification_points: 3 }).eq('id', ruthieId)

    async function seedItem(opts: Parameters<typeof insertItem>[0]) {
      const id = await insertItem(opts)
      itemIds.push(id)
      return id
    }
    async function insertItem(opts: {
      name: string; pointCost: number; requiresApproval?: boolean
      audienceMemberIds?: string[]; unlockRule?: { type: 'completion_pct'; threshold: number; window: 'week' } | null
    }) {
      const { data, error } = await sr.from('reward_shop_items').insert({
        family_id: familyId, created_by: sarahId, name: `${MARKER} ${opts.name}`,
        point_cost: opts.pointCost, requires_approval: opts.requiresApproval ?? true,
        audience_member_ids: opts.audienceMemberIds ?? [], unlock_rule: opts.unlockRule ?? null,
      }).select('id').single()
      if (error) throw error
      return data!.id as string
    }

    // Three states for Alex's Shop section: affordable+buyable, too-pricey
    // (progress framing), and gate-locked.
    await seedItem({ name: 'Movie Night', pointCost: 40, requiresApproval: true })
    await seedItem({ name: 'New Video Game', pointCost: 500, requiresApproval: true })
    await seedItem({ name: 'Sleepover', pointCost: 20, unlockRule: { type: 'completion_pct', threshold: 80, window: 'week' } })
    // A cheap, Play-appropriate item for Ruthie.
    await seedItem({ name: 'Extra Story Time', pointCost: 2, requiresApproval: false })

    // Seed one pending purchase (Alex) for the Queue card shot.
    const { data: purchase } = await sr.rpc('purchase_reward_shop_item', {
      p_item_id: itemIds[0], p_member_id: alexId, p_acted_by: null,
    })
    pendingPurchaseId = (purchase as { purchase_id: string }).purchase_id
  })

  test.afterAll(async () => {
    if (pendingPurchaseId) {
      await sr.rpc('resolve_reward_shop_purchase', {
        p_purchase_id: pendingPurchaseId, p_action: 'decline', p_decline_note: null, p_processed_by: sarahId,
      })
    }
    await sr.from('reward_shop_purchases').delete().in('store_item_id', itemIds)
    await sr.from('reward_shop_items').delete().in('id', itemIds)
    await sr.from('point_transactions').delete().ilike('description', `%${MARKER}%`)
    await sr.from('notifications').delete().ilike('title', `%${MARKER}%`)

    await sr.from('family_members').update({ gamification_points: alexBefore }).eq('id', alexId)
    await sr.from('family_members').update({ gamification_points: ruthieBefore }).eq('id', ruthieId)
    // Ledger self-heal, mirroring the point-economy specs' own discipline.
    for (const id of [alexId, ruthieId]) {
      const { data: rows } = await sr.from('point_transactions').select('amount').eq('family_member_id', id)
      const reconciled = (rows ?? []).reduce((s, r) => s + Number(r.amount), 0)
      if (rows && rows.length > 0) await sr.from('family_members').update({ gamification_points: reconciled }).eq('id', id)
    }
  })

  // ── Tour 1: Prize Board Shop tab ─────────────────────────────────────────
  test('Tour 1 — Prize Board Shop tab: item list, editor modal, bulk-add (mom)', async ({ page }) => {
    await loginAsMom(page)

    for (const [vpName, vp] of Object.entries({ desktop: VIEWPORTS.desktop, mobile: VIEWPORTS.mobile })) {
      await page.setViewportSize(vp)
      await page.goto('/prize-board?tab=shop')
      await waitForAppReady(page)
      await linger(page, 600)
      await shot(page, `shop-01-tab-item-list-${vpName}`)

      const addBtn = page.getByTestId('shop-add-item')
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click()
        const dialog = page.getByRole('dialog')
        await dialog.waitFor({ state: 'visible' })
        await dialog.getByTestId('shop-item-name').fill(`${MARKER} tour item`)
        await dialog.getByTestId('shop-item-cost').fill('75')
        await linger(page, 400)
        await shot(page, `shop-02-item-editor-modal-${vpName}`)
        await page.keyboard.press('Escape')
        await linger(page, 300)
      }

      const bulkBtn = page.getByTestId('shop-bulk-add')
      if (await bulkBtn.isVisible().catch(() => false)) {
        await bulkBtn.click()
        await linger(page, 400)
        const textarea = page.locator('textarea').first()
        if (await textarea.isVisible().catch(() => false)) {
          await textarea.fill('Movie night 200\nExtra screen time 50')
        }
        await shot(page, `shop-03-bulk-add-input-${vpName}`)
        const cancelBtn = page.getByText('Cancel', { exact: true }).first()
        if (await cancelBtn.isVisible().catch(() => false)) await cancelBtn.click()
        await linger(page, 300)
      }
    }

    // Pending strip — should show Alex's seeded pending purchase.
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.reload()
    await waitForAppReady(page)
    const pendingStrip = page.getByTestId('shop-pending-strip')
    if (await pendingStrip.isVisible().catch(() => false)) {
      await pendingStrip.scrollIntoViewIfNeeded()
      await linger(page, 400)
      await shot(page, 'shop-04-pending-strip-desktop')
    }
  })

  // ── Tour 2: Queue Requests tab — StorePurchaseCard ─────────────────────────
  test('Tour 2 — Queue Requests tab: StorePurchaseCard for a pending purchase (mom)', async ({ page }) => {
    await loginAsMom(page)
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Pre-existing QuickTasks layout quirk (not a PECON-SHOP defect): at this
    // viewport the strip's "Scroll right" chevron (`right-[32px]`, always
    // md:flex regardless of overflow state) visually overlaps the queue
    // button (`right-9` = 36px) closely enough that it intercepts pointer
    // events at that pixel even after `{force:true}` — force only skips
    // Playwright's own actionability pre-checks, not the browser's real
    // hit-testing at the dispatched coordinates. A native DOM .click() fires
    // the click event directly on the element, bypassing hit-testing
    // entirely (confirmed live: {force:true} left the dialog count at 0;
    // el.click() opens it every time).
    const queueBtn = page.locator('button[title="Review Queue — all caught up"], button[title="Review Queue: all caught up"]').first()
    await queueBtn.waitFor({ state: 'attached', timeout: 10_000 }).catch(() => {})
    await queueBtn.evaluate((el: HTMLElement) => el.click())
    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 10_000 })
    await linger(page, 500)

    // The tab bar's "Requests" label isn't exposed with an accessible button
    // name (getByRole found zero matches, confirmed live) — the tab strip
    // renders plain text inside a non-labelled control. getByText matches
    // on visible text content instead.
    const requestsTab = dialog.getByText('Requests', { exact: true })
    await requestsTab.click({ timeout: 5_000 })
    await linger(page, 500)
    await shot(page, 'shop-05-queue-store-purchase-card-desktop')
  })

  // ── Tour 3: GamificationSettingsModal Shop entry points ────────────────────
  test('Tour 3 — GamificationSettingsModal: Points-section door + My Rewards Page toggle (mom)', async ({ page }) => {
    await loginAsMom(page)
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto('/family-members')
    await waitForAppReady(page)

    const alexCard = page.locator('.card-hover').filter({ has: page.getByText('Alex', { exact: true }) })
    await alexCard.getByTitle('Edit').click()
    await alexCard.getByRole('button', { name: 'Gamification Settings' }).click()
    await linger(page, 500)

    await page.getByRole('button', { name: 'Points' }).click()
    await linger(page, 400)
    const doorBtn = page.getByTestId('gamification-manage-reward-shop')
    if (await doorBtn.isVisible().catch(() => false)) await doorBtn.scrollIntoViewIfNeeded()
    await linger(page, 300)
    await shot(page, 'shop-06-gamification-points-door-desktop')

    await page.getByRole('button', { name: 'My Rewards Page' }).click().catch(() => {})
    await linger(page, 400)
    await shot(page, 'shop-07-gamification-my-rewards-toggle-desktop')
  })

  // ── Tour 4: My Rewards Shop section (Alex, independent) ────────────────────
  test('Tour 4 — My Rewards Shop section: Buy / progress / gate states (Alex)', async ({ page }) => {
    await loginAsAlex(page)
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(vp)
      await page.goto('/my-rewards')
      await waitForAppReady(page)
      const shopSection = page.getByTestId('mr-section-shop')
      if (await shopSection.isVisible().catch(() => false)) {
        await shopSection.scrollIntoViewIfNeeded()
        await linger(page, 400)
      }
      await shot(page, `shop-08-myrewards-shop-section-${vpName}`)
    }

    // Confirm-purchase modal on the affordable item.
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    const buyBtns = page.locator('[data-testid^="mr-shop-buy-"]')
    const count = await buyBtns.count()
    for (let i = 0; i < count; i++) {
      const btn = buyBtns.nth(i)
      const enabled = await btn.isEnabled().catch(() => false)
      if (enabled) {
        await btn.click()
        await linger(page, 400)
        await shot(page, 'shop-09-confirm-purchase-modal-desktop')
        await page.keyboard.press('Escape')
        break
      }
    }
  })

  // ── Tour 5: Play picture-shelf Shop variant (Ruthie) ───────────────────────
  test('Tour 5 — Play picture-shelf Shop section + trade confirm (Ruthie)', async ({ page }) => {
    await loginAsRiley(page)
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto('/rewards')
    await waitForAppReady(page)
    let dialogCount = await page.locator('[role="dialog"]').count()
    while (dialogCount > 0) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
      dialogCount = await page.locator('[role="dialog"]').count()
    }
    const shopSection = page.getByTestId('mr-section-shop')
    if (await shopSection.isVisible().catch(() => false)) {
      await shopSection.scrollIntoViewIfNeeded()
      await linger(page, 400)
    }
    await shot(page, 'shop-10-play-picture-shelf-mobile')

    const buyBtns = page.locator('[data-testid^="mr-shop-buy-"]')
    const count = await buyBtns.count()
    for (let i = 0; i < count; i++) {
      const btn = buyBtns.nth(i)
      if (await btn.isEnabled().catch(() => false)) {
        await btn.click()
        await linger(page, 400)
        await shot(page, 'shop-11-play-trade-confirm-mobile')
        await page.keyboard.press('Escape')
        break
      }
    }
  })
})
