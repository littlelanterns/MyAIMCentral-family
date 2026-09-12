/**
 * STUDIO-EXPERIENCE ST-C — Save-and-return eyes-on tour (Convention #277).
 *
 * MANUAL TOUR HELPER, NOT A REGRESSION TEST. Gated behind EYES_ON_TOUR=1.
 * Captures every ST-C mom-facing surface at BOTH desktop (1440) and mobile
 * (375) so the Mom-UI Verification table rests on read screenshots rather
 * than inference:
 *   1. The "Save & Come Back" footer button, mid-edit.
 *   2. The close/discard prompt ("Save as a draft to come back to?").
 *   3. The reopen-prompt showing a SINGLE draft.
 *   4. The reopen-prompt's multi-draft picker (two drafts of the same
 *      wizard type, per Convention 250 §2.2's multi-draft requirement).
 *   5. The Studio Drafts tab listing both drafts with Resume/Discard.
 *
 * Screenshots land in EYES_ON_TOUR_OUT (default <repo>/eyes-on-tour, which
 * is gitignored). Fixtures: STUDIOAUD prefix, swept beforeAll + afterAll
 * via service role, Testworth family.
 */
import { test, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
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

const PREFIX = 'STUDIOAUD'

const sr = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
)

let FAMILY_ID = ''

async function sweep() {
  if (!FAMILY_ID) {
    const { data: fam } = await sr
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    FAMILY_ID = fam!.id as string
  }
  const { data: drafts } = await sr
    .from('wizard_drafts')
    .select('id')
    .eq('family_id', FAMILY_ID)
    .ilike('title', `${PREFIX}%`)
  if (drafts?.length) {
    await sr.from('wizard_drafts').delete().in('id', drafts.map((d) => d.id as string))
  }
}

test.beforeAll(async () => {
  await sweep()
})

test.afterAll(async () => {
  await sweep()
})

// Drafts are real server-backed rows now (not localStorage) — the desktop
// and mobile iterations below share the SAME Testworth mom account, so
// without a per-test sweep the second iteration would immediately hit the
// first iteration's leftover "STUDIOAUD Tour Draft A/B" rows and get the
// reopen-prompt instead of a blank wizard. Sweep before EACH viewport run,
// not just once for the whole file.
test.beforeEach(async () => {
  await sweep()
})

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

async function openProgressChartWizard(page: Page) {
  const section = page
    .locator('h2')
    .filter({ hasText: 'Setup Wizards' })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "mb-8")]')
  const dialog = page.locator('[role="dialog"]').first()
  for (let attempt = 0; attempt < 3; attempt++) {
    const card = section.locator('div.snap-start').filter({ hasText: 'Set Up a Progress Chart' }).first()
    await card.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {})
    await card.hover({ timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(350)
    await card.click({ timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(400)
    const btn = card.getByRole('button', { name: /^customize$/i }).first()
    if (await btn.isVisible().catch(() => false)) {
      // Expanding the card reflows the horizontal ScrollRow (200px→280px) —
      // re-scroll the BUTTON itself into view before clicking. A blind
      // force:true click skips Playwright's scroll-into-view step, and at
      // mobile viewports the button's post-reflow position can fall outside
      // the current scroll offset, landing the click on whatever fixed-
      // position element (e.g. BottomNav) happens to sit at those raw
      // coordinates instead.
      await btn.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {})
      await btn.click({ timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(600)
      if ((await dialog.count()) > 0 && (await dialog.isVisible().catch(() => false))) break
    }
  }
  return dialog
}

for (const vp of VIEWPORTS) {
  test(`ST-C ${vp.key} shots: Save & Come Back, close prompt, reopen prompt (single + multi-draft), Drafts tab`, async ({ page }) => {
    fs.mkdirSync(OUT_DIR, { recursive: true })
    await page.setViewportSize({ width: vp.width, height: vp.height })

    const consoleErrors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300))
    })
    page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + String(e).slice(0, 300)))

    const shot = async (name: string) => {
      await page.waitForTimeout(600) // let modal fade settle (ST-A tour lesson)
      await page.screenshot({ path: path.join(OUT_DIR, `wizard-draft-${vp.key}-${name}.png`) })
    }

    await loginAsMom(page)
    await gotoStudio(page)

    // ── 1. Save & Come Back button mid-edit ─────────────────────────────
    let dialog = await openProgressChartWizard(page)
    await dialog.getByPlaceholder(/potty chart|piano practice/i).fill(`${PREFIX} Tour Draft A`)
    await shot('1-save-and-come-back-button')

    // ── 2. Close/discard prompt ──────────────────────────────────────────
    // Same ModalV2 instance (id="wizard-draft-close-prompt") throughout —
    // only its title/body swap between the two sub-states. A locator built
    // with hasText:'Save as a draft to come back to?' stops matching the
    // instant the discard sub-confirmation ("Discard for good?") replaces
    // that text, so we re-locate by the stable modal id via a data-testid
    // wrapper is unavailable — locate by role="dialog" without a stale text
    // filter for the sub-confirmation step instead.
    await dialog.getByLabel('Close').click()
    let closePrompt = page.locator('[role="dialog"]').filter({ hasText: 'Save as a draft to come back to?' })
    await shot('2-close-save-prompt')
    // Peek the discard sub-confirmation too.
    await closePrompt.getByTestId('wizard-draft-discard').click()
    const discardConfirmPrompt = page.locator('[role="dialog"]').filter({ hasText: 'Discard for good?' })
    await shot('2b-close-discard-confirm')
    await discardConfirmPrompt.getByTestId('wizard-draft-discard-cancel').click()
    // Back to the primary prompt — actually save this one (draft A).
    closePrompt = page.locator('[role="dialog"]').filter({ hasText: 'Save as a draft to come back to?' })
    await closePrompt.getByTestId('wizard-draft-save').click()
    await page.waitForTimeout(500)

    // ── 3. Reopen prompt — single draft ─────────────────────────────────
    dialog = await openProgressChartWizard(page)
    let reopenPrompt = page.locator('[role="dialog"]').filter({ hasText: 'Continue where you left off?' })
    await shot('3-reopen-prompt-single-draft')
    // Start Fresh — leaves draft A alone, opens blank.
    await reopenPrompt.getByTestId('wizard-draft-start-fresh').click()
    await page.waitForTimeout(400)

    // Create draft B in this fresh instance.
    dialog = page.locator('[role="dialog"]').filter({ hasText: 'Set Up a Progress Chart' })
    await dialog.getByPlaceholder(/potty chart|piano practice/i).fill(`${PREFIX} Tour Draft B`)
    await dialog.getByLabel('Close').click()
    closePrompt = page.locator('[role="dialog"]').filter({ hasText: 'Save as a draft to come back to?' })
    await closePrompt.getByTestId('wizard-draft-save').click()
    await page.waitForTimeout(500)

    // ── 4. Reopen prompt — multi-draft picker (A + B) ───────────────────
    dialog = await openProgressChartWizard(page)
    reopenPrompt = page.locator('[role="dialog"]').filter({ hasText: 'Continue where you left off?' })
    await shot('4-reopen-prompt-multi-draft-picker')
    // Continue with draft B to leave the wizard populated, then close+save.
    await reopenPrompt.getByText(`${PREFIX} Tour Draft B`, { exact: true }).click()
    await page.waitForTimeout(400)
    dialog = page.locator('[role="dialog"]').filter({ hasText: 'Set Up a Progress Chart' })
    await dialog.getByLabel('Close').click()
    closePrompt = page.locator('[role="dialog"]').filter({ hasText: 'Save as a draft to come back to?' })
    await closePrompt.getByTestId('wizard-draft-save').click()
    await page.waitForTimeout(500)

    // ── 5. Studio Drafts tab — both drafts, Resume/Discard ──────────────
    await page.getByRole('tab', { name: /Drafts/i }).click()
    await page.waitForTimeout(800)
    await shot('5-drafts-tab-two-drafts')

    fs.writeFileSync(
      path.join(OUT_DIR, `wizard-draft-${vp.key}-console.json`),
      JSON.stringify(consoleErrors, null, 2),
    )
  })
}
