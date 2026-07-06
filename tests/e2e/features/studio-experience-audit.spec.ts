/**
 * STUDIO-EXPERIENCE audit tour — Pass A (shelf sweep).
 *
 * MANUAL AUDIT HELPER, NOT A REGRESSION TEST. Gated behind STUDIO_AUDIT=1 so it
 * never runs in normal suites. For every Studio shelf tile: expand the card →
 * click [Customize] → record what opens (URL, dialog text, console errors) →
 * screenshot → return to /studio. Results land in STUDIO_AUDIT_OUT
 * (default: <repo>/studio-audit-out, gitignored-by-absence-of-tracking).
 *
 * Read by the STUDIO-EXPERIENCE Fable audit session (2026-07-04) to grade each
 * tile WORKS / BROKEN / MISLEADING / MISSING against its card promise.
 */
import { test, expect, type Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { loginAsMom } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'

test.skip(!process.env.STUDIO_AUDIT, 'Manual studio audit — set STUDIO_AUDIT=1 to run')

const OUT_DIR = process.env.STUDIO_AUDIT_OUT
  ? process.env.STUDIO_AUDIT_OUT
  : path.join(process.cwd(), 'studio-audit-out')

interface TileSpec {
  section: string
  name: string
  /** 'first' | 'last' — disambiguate duplicate names (blank vs example) */
  instance?: 'first' | 'last'
  /** example cards in default-mode sections live behind the accordion */
  inExampleAccordion?: boolean
}

// Static shelf inventory (from studio-seed-data.ts render order).
const TILES: TileSpec[] = [
  // 1. Setup Wizards (showExamplesFirst — examples visible, no accordion)
  { section: 'Setup Wizards', name: 'Potty Chart' },
  { section: 'Setup Wizards', name: 'Consequence Spinner' },
  { section: 'Setup Wizards', name: 'Extra Earning Opportunities' },
  { section: 'Setup Wizards', name: 'Reading Fun Activities' },
  { section: 'Setup Wizards', name: 'Homeschool Variety Pack' },
  { section: 'Setup Wizards', name: 'Honey-Do List' },
  { section: 'Setup Wizards', name: 'Family Meeting Setup' },
  { section: 'Setup Wizards', name: 'Routine Builder (AI)' },
  { section: 'Setup Wizards', name: 'Create a List' },
  { section: 'Setup Wizards', name: 'Create a Rewards List' },
  { section: 'Setup Wizards', name: 'Set Up a Progress Chart' },
  { section: 'Setup Wizards', name: 'Extra Earning or Consequence Spinner' },
  { section: 'Setup Wizards', name: 'Set Up Subject Activities' },
  { section: 'Setup Wizards', name: 'Create a Shared To-Do' },
  // 2. Task & Chore Templates
  { section: 'Task & Chore Templates', name: 'Simple Task' },
  { section: 'Task & Chore Templates', name: 'Routine Checklist' },
  { section: 'Task & Chore Templates', name: 'Opportunity Board' },
  { section: 'Task & Chore Templates', name: 'Sequential Collection' },
  { section: 'Task & Chore Templates', name: 'Morning Routine', inExampleAccordion: true },
  { section: 'Task & Chore Templates', name: 'Bedroom Clean-Up', inExampleAccordion: true },
  { section: 'Task & Chore Templates', name: 'Extra House Jobs Board', inExampleAccordion: true },
  { section: 'Task & Chore Templates', name: 'Curriculum Chapter Sequence', inExampleAccordion: true },
  { section: 'Task & Chore Templates', name: 'Reading List', inExampleAccordion: true },
  { section: 'Task & Chore Templates', name: 'TSG Extra Jobs Randomizer', inExampleAccordion: true },
  // 3. Guided Forms & Worksheets
  { section: 'Guided Forms & Worksheets', name: 'Guided Form', instance: 'first' },
  { section: 'Guided Forms & Worksheets', name: 'SODAS', instance: 'first' },
  { section: 'Guided Forms & Worksheets', name: 'What-If Game' },
  { section: 'Guided Forms & Worksheets', name: 'Apology Reflection', instance: 'first' },
  { section: 'Guided Forms & Worksheets', name: 'SODAS Sibling Conflict', inExampleAccordion: true },
  { section: 'Guided Forms & Worksheets', name: 'What-If: Friend Pressure', inExampleAccordion: true },
  // 4. List Templates
  { section: 'List Templates', name: 'Shopping List' },
  { section: 'List Templates', name: 'Wishlist' },
  { section: 'List Templates', name: 'Packing List' },
  { section: 'List Templates', name: 'Expense Tracker' },
  { section: 'List Templates', name: 'To-Do List' },
  { section: 'List Templates', name: 'Custom List' },
  { section: 'List Templates', name: 'Randomizer / Draw List' },
  { section: 'List Templates', name: 'Shared Family Shopping List', inExampleAccordion: true },
  { section: 'List Templates', name: 'Weekly Grocery List', inExampleAccordion: true },
  { section: 'List Templates', name: 'Family Road Trip Packing', inExampleAccordion: true },
  { section: 'List Templates', name: 'Birthday Wishlist (Child)', inExampleAccordion: true },
  { section: 'List Templates', name: 'Homeschool Curriculum Budget', inExampleAccordion: true },
  // 6. Gamification & Rewards
  { section: 'Gamification & Rewards', name: 'Gamification Setup' },
  { section: 'Gamification & Rewards', name: 'Day Segments' },
  { section: 'Gamification & Rewards', name: 'Coloring Page Reveal' },
  { section: 'Gamification & Rewards', name: 'Reward Reveal' },
  { section: 'Gamification & Rewards', name: 'Star / Sticker Chart' },
  { section: 'Gamification & Rewards', name: 'Reward Spinner' },
  // 7. Growth & Self-Knowledge
  { section: 'Growth & Self-Knowledge', name: 'Get to Know Your Family' },
  { section: 'Growth & Self-Knowledge', name: 'Best Intentions Starter' },
]

interface TileResult {
  section: string
  name: string
  urlAfter: string
  dialogCount: number
  dialogText: string
  bodyTextIfNavigated: string
  consoleErrors: string[]
  screenshot: string
  error?: string
}

async function dismissOverlays(page: Page) {
  for (let i = 0; i < 3; i++) {
    for (const text of ["Don't show guides", 'Got it', 'Dismiss Guide', 'Dismiss guide', 'Dismiss']) {
      const btn = page.locator('button').filter({ hasText: text }).first()
      if (await btn.isVisible({ timeout: 200 }).catch(() => false)) {
        await btn.click({ force: true })
        await page.waitForTimeout(200)
      }
    }
  }
}

function sectionContainer(page: Page, sectionTitle: string) {
  return page
    .locator('h2')
    .filter({ hasText: sectionTitle })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "mb-8")]')
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>(res => setTimeout(() => res(fallback), ms))])
}

async function captureOpened(page: Page) {
  return withTimeout(captureOpenedInner(page), 10_000, {
    dialogCount: -1,
    dialogText: 'EVALUATE-TIMEOUT — page main thread frozen?',
  })
}

async function captureOpenedInner(page: Page) {
  return page.evaluate(() => {
    const parts: string[] = []
    const dialogs = document.querySelectorAll('[role="dialog"]')
    dialogs.forEach(d => parts.push((d as HTMLElement).innerText ?? ''))
    if (parts.length === 0) {
      // custom overlays (fixed inset-0 without role=dialog)
      document.querySelectorAll('div.fixed.inset-0').forEach(d => {
        const t = (d as HTMLElement).innerText ?? ''
        if (t.trim().length > 0) parts.push(t)
      })
    }
    return {
      dialogCount: dialogs.length,
      dialogText: parts.join('\n---\n').slice(0, 2000),
    }
  })
}

test.describe.configure({ timeout: Number(process.env.STUDIO_AUDIT_TIMEOUT ?? '1800000') })

/** Append one result line immediately so a crashed run loses nothing. */
function appendResult(rec: TileResult) {
  fs.appendFileSync(path.join(OUT_DIR, 'pass-a.ndjson'), JSON.stringify(rec) + '\n')
}

const START_AT = Number(process.env.STUDIO_AUDIT_START ?? '1')
const END_AT = Number(process.env.STUDIO_AUDIT_END ?? '9999')
const SKIP_TRACKERS = !!process.env.STUDIO_AUDIT_SKIP_TRACKERS

test('Pass A — shelf sweep: what does every tile open?', async ({ page }) => {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const results: TileResult[] = []
  let tileErrors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') tileErrors.push(msg.text().slice(0, 300))
  })
  page.on('pageerror', err => tileErrors.push(`pageerror: ${String(err).slice(0, 300)}`))

  await loginAsMom(page)

  let idx = 0
  for (const tile of TILES) {
    idx++
    if (idx < START_AT || idx > END_AT) continue
    tileErrors = []
    const slug = `${String(idx).padStart(2, '0')}-${tile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`
    const rec: TileResult = {
      section: tile.section,
      name: tile.name,
      urlAfter: '',
      dialogCount: 0,
      dialogText: '',
      bodyTextIfNavigated: '',
      consoleErrors: [],
      screenshot: `${slug}.png`,
    }
    try {
      await page.goto('/studio')
      await waitForAppReady(page)
      await page.waitForTimeout(800)
      await dismissOverlays(page)

      const container = sectionContainer(page, tile.section)
      await container.scrollIntoViewIfNeeded()
      await page.waitForTimeout(200)

      if (tile.inExampleAccordion) {
        const acc = container.locator('button').filter({ hasText: /Example Templates \(/ }).first()
        if (await acc.isVisible({ timeout: 1500 }).catch(() => false)) {
          await acc.click()
          await page.waitForTimeout(400)
        }
      }

      const cards = container.locator('div.snap-start').filter({ hasText: tile.name })
      const card = tile.instance === 'last' ? cards.last() : cards.first()
      // Explicit timeouts everywhere — playwright.config has actionTimeout 0 (unbounded),
      // which let a single vanished card stall the whole sweep (tile-24 incident).
      try {
        await card.scrollIntoViewIfNeeded({ timeout: 8000 })
      } catch {
        // Card not attached — page may have navigated out from under us. One retry.
        await page.goto('/studio')
        await waitForAppReady(page)
        await page.waitForTimeout(800)
        if (tile.inExampleAccordion) {
          const acc2 = sectionContainer(page, tile.section).locator('button').filter({ hasText: /Example Templates \(/ }).first()
          if (await acc2.isVisible({ timeout: 1500 }).catch(() => false)) { await acc2.click(); await page.waitForTimeout(400) }
        }
        await card.scrollIntoViewIfNeeded({ timeout: 8000 })
      }
      await card.click({ timeout: 8000 })
      await page.waitForTimeout(400)
      const customizeBtn = card.getByRole('button', { name: /^customize$/i })
      await customizeBtn.click({ force: true, timeout: 8000 })
      await page.waitForTimeout(1500)

      rec.urlAfter = page.url()
      const opened = await captureOpened(page)
      rec.dialogCount = opened.dialogCount
      rec.dialogText = opened.dialogText
      if (!rec.urlAfter.includes('/studio')) {
        // navigation happened — capture landing page main text too
        await page.waitForTimeout(800)
        rec.bodyTextIfNavigated = await withTimeout(
          page.evaluate(() => (document.querySelector('main') ?? document.body).textContent?.slice(0, 1200) ?? ''),
          10_000,
          'EVALUATE-TIMEOUT — page main thread frozen?',
        )
        const opened2 = await captureOpened(page)
        if (opened2.dialogText.length > rec.dialogText.length) {
          rec.dialogCount = opened2.dialogCount
          rec.dialogText = opened2.dialogText
        }
      }
      await page.screenshot({ path: path.join(OUT_DIR, `${slug}.png`), fullPage: false })

      // cleanup: escape out of any modal
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    } catch (e) {
      rec.error = String(e).slice(0, 500)
      await page.screenshot({ path: path.join(OUT_DIR, `${slug}-ERROR.png`), fullPage: false }).catch(() => {})
    }
    rec.consoleErrors = [...tileErrors]
    results.push(rec)
    appendResult(rec)
  }

  // Dynamic pass: Trackers & Widgets tiles (names come from DB starter configs)
  if (SKIP_TRACKERS) {
    fs.writeFileSync(path.join(OUT_DIR, 'pass-a.json'), JSON.stringify(results, null, 2))
    expect(results.length).toBeGreaterThan(0)
    return
  }
  await page.goto('/studio')
  await waitForAppReady(page)
  await page.waitForTimeout(800)
  await dismissOverlays(page)
  const twContainer = sectionContainer(page, 'Trackers & Widgets')
  await twContainer.scrollIntoViewIfNeeded()
  const trackerNames: string[] = await twContainer
    .locator('div.snap-start p')
    .evaluateAll(nodes =>
      nodes
        .filter(n => n.matches('p.font-semibold'))
        .map(n => n.textContent?.trim() ?? '')
        .filter(Boolean),
    )
  fs.writeFileSync(path.join(OUT_DIR, 'tracker-tile-names.json'), JSON.stringify(trackerNames, null, 2))

  for (const name of trackerNames) {
    idx++
    tileErrors = []
    const slug = `${String(idx).padStart(2, '0')}-tracker-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`
    const rec: TileResult = {
      section: 'Trackers & Widgets',
      name,
      urlAfter: '',
      dialogCount: 0,
      dialogText: '',
      bodyTextIfNavigated: '',
      consoleErrors: [],
      screenshot: `${slug}.png`,
    }
    try {
      await page.goto('/studio')
      await waitForAppReady(page)
      await page.waitForTimeout(800)
      await dismissOverlays(page)
      const container = sectionContainer(page, 'Trackers & Widgets')
      await container.scrollIntoViewIfNeeded()
      const card = container.locator('div.snap-start').filter({ hasText: name }).first()
      await card.scrollIntoViewIfNeeded({ timeout: 8000 })
      await card.click({ timeout: 8000 })
      await page.waitForTimeout(400)
      await card.getByRole('button', { name: /^customize$/i }).click({ force: true, timeout: 8000 })
      await page.waitForTimeout(1200)
      rec.urlAfter = page.url()
      const opened = await captureOpened(page)
      rec.dialogCount = opened.dialogCount
      rec.dialogText = opened.dialogText
      await page.screenshot({ path: path.join(OUT_DIR, `${slug}.png`), fullPage: false })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    } catch (e) {
      rec.error = String(e).slice(0, 500)
    }
    rec.consoleErrors = [...tileErrors]
    results.push(rec)
    appendResult(rec)
  }

  fs.writeFileSync(path.join(OUT_DIR, 'pass-a.json'), JSON.stringify(results, null, 2))
  expect(results.length).toBeGreaterThan(0)
})
