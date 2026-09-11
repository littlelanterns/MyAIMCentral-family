/**
 * STUDIO-EXPERIENCE ST-B — NLC v2 eyes-on tour (Convention #277).
 *
 * MANUAL TOUR HELPER, NOT A REGRESSION TEST. Gated behind EYES_ON_TOUR=1.
 * Captures every ST-B mom-facing surface at BOTH desktop (1440) and mobile
 * (375) so the Mom-UI Verification table rests on read screenshots rather
 * than inference:
 *   1. NLC input rendered while the Studio search box has text (F-07 — it
 *      used to be hidden behind `{!searchQuery.trim() && ...}`).
 *   2. The §2.9 full-catalog fallback card (14 real wizards + restate copy),
 *      replacing the old hard-fail / 6-chip dead end.
 *   3. A prefilled wizard opened straight from a description (probe 2's
 *      potty chart — chartName + actionTaskName + Ruthie preselected).
 *   4. The routine builder's verbatim description passthrough (probe 4).
 *
 * Screenshots land in EYES_ON_TOUR_OUT (default <repo>/eyes-on-tour, which
 * is gitignored).
 */
import { test, type Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { loginAsMom } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'

dotenv.config({ path: '.env.local' })

test.skip(!process.env.EYES_ON_TOUR, 'Manual eyes-on tour — set EYES_ON_TOUR=1 to run')

const OUT_DIR = process.env.EYES_ON_TOUR_OUT
  ? process.env.EYES_ON_TOUR_OUT
  : path.join(process.cwd(), 'eyes-on-tour')

test.describe.configure({ timeout: 300_000 })

const VIEWPORTS = [
  { key: 'desktop', width: 1440, height: 900 },
  { key: 'mobile', width: 375, height: 812 },
]

async function gotoStudio(page: Page) {
  await page.goto('/studio')
  await waitForAppReady(page)
  await page.waitForTimeout(1000)
}

async function submitNLC(page: Page, text: string) {
  const input = page.getByPlaceholder('Describe what you want to create...')
  await input.fill(text)
  await input.press('Enter')
}

for (const vp of VIEWPORTS) {
  test(`ST-B ${vp.key} shots: NLC visibility, fallback catalog, prefilled wizards`, async ({ page }) => {
    fs.mkdirSync(OUT_DIR, { recursive: true })
    await page.setViewportSize({ width: vp.width, height: vp.height })

    const consoleErrors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300))
    })
    page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + String(e).slice(0, 300)))

    const shot = async (name: string) => {
      await page.waitForTimeout(600) // let modal fade settle (ST-A tour lesson)
      await page.screenshot({ path: path.join(OUT_DIR, `nlc-stb-${vp.key}-${name}.png`) })
    }

    await loginAsMom(page)

    // ── 1. F-07: NLC stays visible while searching ──────────────────────
    await gotoStudio(page)
    await shot('1-nlc-default')

    const search = page.getByPlaceholder(/search/i).first()
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('chart')
      await page.waitForTimeout(700)
      await shot('2-nlc-visible-while-searching')
      await search.fill('')
      await page.waitForTimeout(400)
    }

    // ── 2. §2.9 full-catalog fallback (none_confident path) ─────────────
    await submitNLC(page, 'xylophone tuesday sandwich protocol')
    await page.waitForTimeout(9000) // real router round-trip
    await shot('3-fallback-full-catalog')

    // ── 3. Prefilled wizard from a description (probe 2) ────────────────
    await gotoStudio(page)
    await submitNLC(page, 'set up a potty chart for Ruthie')
    await page.waitForTimeout(9000)
    const yes = page.getByRole('button', { name: 'Yes, open it' })
    if (await yes.isVisible({ timeout: 2000 }).catch(() => false)) await yes.click()
    await shot('4-prefilled-chart-name')

    const dialog = page.getByRole('dialog')
    const next = dialog.getByRole('button', { name: 'Next' })
    if (await next.isVisible({ timeout: 5000 }).catch(() => false)) {
      await next.click()
      await shot('5-prefilled-action-name')
      // Now on step 2 (Pick Action). Chart Display + Milestones have no
      // required fields — three more Next clicks reach step 5 (Assign).
      for (let i = 0; i < 3; i++) {
        await next.click().catch(() => {})
        await page.waitForTimeout(400)
      }
      await shot('6-assign-ruthie-preselected')
    }

    // ── 4. Routine builder verbatim description (probe 4) ───────────────
    await gotoStudio(page)
    await submitNLC(page, 'help me set up a morning routine')
    await page.waitForTimeout(9000)
    const yes2 = page.getByRole('button', { name: 'Yes, open it' })
    if (await yes2.isVisible({ timeout: 2000 }).catch(() => false)) await yes2.click()
    await shot('7-routine-verbatim-description')

    fs.writeFileSync(
      path.join(OUT_DIR, `nlc-stb-${vp.key}-console.json`),
      JSON.stringify(consoleErrors, null, 2),
    )
  })
}
