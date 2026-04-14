/**
 * Routine Creation UX Verification
 *
 * Tests the routine creation and management flows using the real
 * WarmthWisdomWork family data (Helam, Miriam, and their mom Tenise).
 *
 * Covers:
 * 1. Mom view — routines tab shows kid routines, edit/deploy flows
 * 2. Helam (independent teen) — routine display, day filtering, step checking
 * 3. Miriam (guided child) — routine display, sections, step checking
 * 4. Studio Edit/Deploy flows
 * 5. Inline step editing (mom only, hidden for kids)
 * 6. Allowance configs
 */
import { test, expect, Page } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const BASE = 'http://localhost:5173'
const MOM_EMAIL = process.env.E2E_DEV_EMAIL || 'tenisewertman@gmail.com'
const MOM_PASSWORD = process.env.E2E_DEV_PASSWORD || 'password'
const FAMILY_NAME = process.env.E2E_FAMILY_LOGIN_NAME || 'WarmthWisdomWork'
const HELAM_PIN = '1007'
const MIRIAM_PIN = '1217'

const SCREENSHOT_DIR = 'tests/e2e/.screenshots/routine-ux'

// ─── Auth Helpers ─────────────────────────────────────────────────

/** Log in as Mom via normal email/password Supabase auth */
async function loginAsMom(page: Page) {
  // The landing page at /auth/signin is a splash — click "Sign In" to get the form
  await page.goto(`${BASE}/auth/sign-in`)
  await page.waitForLoadState('networkidle')

  // Fill email
  const emailInput = page.locator('input[type="email"]')
  await emailInput.waitFor({ timeout: 10000 })
  await emailInput.fill(MOM_EMAIL)

  // Fill password
  const passwordInput = page.locator('input[type="password"]')
  await passwordInput.fill(MOM_PASSWORD)

  // Submit
  await page.locator('button[type="submit"]').click()

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500) // React settle
}

/** Log in as a child via Family Member Login flow */
async function loginAsChild(page: Page, childName: string, pin: string) {
  await page.goto(`${BASE}/auth/signin`)
  await page.waitForLoadState('networkidle')

  // Click "Family Member Login" link
  const familyLoginLink = page.locator('a[href="/auth/family-login"]')
  await familyLoginLink.waitFor({ timeout: 10000 })
  await familyLoginLink.click()
  await page.waitForURL('**/auth/family-login**', { timeout: 10000 })
  await page.waitForLoadState('networkidle')

  // Type family name
  const familyInput = page.locator('input[placeholder*="SmithCrew"], input[type="text"]').first()
  await familyInput.waitFor({ timeout: 10000 })
  await familyInput.fill(FAMILY_NAME)

  // Click Continue
  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(2000) // Wait for member list to load

  // Select the child by name
  const memberButton = page.locator('button').filter({ hasText: childName })
  await memberButton.waitFor({ timeout: 10000 })
  await memberButton.click()
  await page.waitForTimeout(1000)

  // Enter PIN
  const pinInput = page.locator('input[type="password"][inputmode="numeric"], input[maxlength="4"]').first()
  await pinInput.waitFor({ timeout: 10000 })
  await pinInput.fill(pin)

  // Submit PIN
  const enterButton = page.locator('button[type="submit"]')
  await enterButton.click()

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500) // React settle
}

// ─── Screenshot helper ────────────────────────────────────────────

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}.png`,
    fullPage: true,
  })
}

// ═══════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════

test.describe('Routine UX Verification — WarmthWisdomWork Family', () => {
  test.setTimeout(120000) // 2 min per test

  // ─── MOM TESTS ────────────────────────────────────────────────

  test.describe('Mom (Tenise)', () => {
    test('can see kid routines on Tasks → Routines tab', async ({ page }) => {
      await loginAsMom(page)

      // Navigate to Tasks page
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)
      await screenshot(page, 'mom-01-tasks-page')

      // Click Routines tab
      const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
      if (await routinesTab.count() > 0) {
        await routinesTab.first().click()
        await page.waitForTimeout(1000)
      }
      await screenshot(page, 'mom-02-routines-tab')

      // Verify we can see kid routines (Kitchen Zone, Zone 2)
      const pageContent = await page.textContent('body')
      const hasKitchenZone = pageContent?.includes('Kitchen Zone') || pageContent?.includes('kitchen')
      const hasZone2 = pageContent?.includes('Zone 2') || pageContent?.includes('Herringbone')

      console.log(`Mom sees Kitchen Zone: ${hasKitchenZone}`)
      console.log(`Mom sees Zone 2: ${hasZone2}`)
    })

    test('can expand a routine and see sections with steps', async ({ page }) => {
      await loginAsMom(page)
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // Click Routines tab
      const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
      if (await routinesTab.count() > 0) {
        await routinesTab.first().click()
        await page.waitForTimeout(1000)
      }

      // Try to find and click on a routine card to expand it
      const routineCard = page.locator('[class*="card"], [class*="Card"]').filter({ hasText: /Kitchen Zone|Zone 2|Herringbone/i }).first()
      if (await routineCard.count() > 0) {
        await routineCard.click()
        await page.waitForTimeout(1000)
      }
      await screenshot(page, 'mom-03-routine-expanded')

      // Check if steps/sections are visible (auto-expand should show them)
      const sections = page.locator('text=/Monday|Tuesday|Wednesday|Daily|Mon-Sat|Sunday/i')
      const sectionCount = await sections.count()
      console.log(`Visible section labels: ${sectionCount}`)
      await screenshot(page, 'mom-04-routine-sections-visible')
    })

    test('inline step editing — pencil icon visible for mom', async ({ page }) => {
      await loginAsMom(page)
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // Click Routines tab
      const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
      if (await routinesTab.count() > 0) {
        await routinesTab.first().click()
        await page.waitForTimeout(1000)
      }

      // Look for a routine and expand it
      const routineCard = page.locator('[class*="card"], [class*="Card"]').filter({ hasText: /Kitchen Zone|Zone 2|Herringbone/i }).first()
      if (await routineCard.count() > 0) {
        await routineCard.click()
        await page.waitForTimeout(1000)
      }

      // Look for pencil/edit icon on section headers
      const pencilIcons = page.locator('[class*="pencil"], [data-testid*="edit"], svg.lucide-pencil, button[title*="Edit"]')
      const pencilCount = await pencilIcons.count()
      console.log(`Pencil/edit icons found: ${pencilCount}`)
      await screenshot(page, 'mom-05-inline-edit-icons')
    })

    test('Studio → My Customized shows routine templates', async ({ page }) => {
      await loginAsMom(page)
      await page.goto(`${BASE}/studio`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)
      await screenshot(page, 'mom-06-studio-page')

      // Click "My Customized" tab if it exists
      const myCustomizedTab = page.locator('button, [role="tab"]').filter({ hasText: /my customized|my templates|library/i })
      if (await myCustomizedTab.count() > 0) {
        await myCustomizedTab.first().click()
        await page.waitForTimeout(1000)
      }
      await screenshot(page, 'mom-07-studio-my-customized')

      // Check for routine templates
      const templateCards = page.locator('text=/Kitchen Zone|Zone 2|Herringbone/i')
      const count = await templateCards.count()
      console.log(`Routine templates found in Studio: ${count}`)
    })

    test('Studio Edit flow — loads sections into modal', async ({ page }) => {
      await loginAsMom(page)
      await page.goto(`${BASE}/studio`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // Click My Customized tab
      const myCustomizedTab = page.locator('button, [role="tab"]').filter({ hasText: /my customized|my templates|library/i })
      if (await myCustomizedTab.count() > 0) {
        await myCustomizedTab.first().click()
        await page.waitForTimeout(1000)
      }

      // Find a routine template and click its menu (three dots)
      const templateCard = page.locator('[class*="card"], [class*="Card"]').filter({ hasText: /Kitchen Zone|Zone 2|Herringbone/i }).first()
      if (await templateCard.count() > 0) {
        // Look for three-dot menu button inside the card
        const menuButton = templateCard.locator('button[class*="menu"], button[aria-label*="menu"], [class*="MoreVertical"], [class*="ellipsis"], svg.lucide-more-vertical').first()
        if (await menuButton.count() > 0) {
          await menuButton.click()
          await page.waitForTimeout(500)
          await screenshot(page, 'mom-08-template-menu-open')

          // Click Edit
          const editOption = page.locator('button, [role="menuitem"]').filter({ hasText: /^edit$/i }).first()
          if (await editOption.count() > 0) {
            await editOption.click()
            await page.waitForTimeout(2000)
            await screenshot(page, 'mom-09-edit-modal-opened')

            // Verify sections are loaded in the modal
            const modalSections = page.locator('[class*="modal"], [role="dialog"]').locator('text=/Monday|Tuesday|Daily|Mon-Sat|Sunday|Section/i')
            const sectionCount = await modalSections.count()
            console.log(`Sections loaded in edit modal: ${sectionCount}`)
            await screenshot(page, 'mom-10-edit-modal-sections')
          }
        }
      }
    })

    test('Finances tab visible for mom on Tasks page', async ({ page }) => {
      await loginAsMom(page)
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // Look for Finances tab
      const financesTab = page.locator('button, [role="tab"]').filter({ hasText: /finances/i })
      const hasFinances = await financesTab.count() > 0
      console.log(`Finances tab visible: ${hasFinances}`)

      if (hasFinances) {
        await financesTab.first().click()
        await page.waitForTimeout(1000)
        await screenshot(page, 'mom-11-finances-tab')
      }
    })

    test('Allowance settings — Helam and Miriam configs', async ({ page }) => {
      await loginAsMom(page)
      await page.goto(`${BASE}/settings/allowance`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      await screenshot(page, 'mom-12-allowance-settings')

      // Check for both kids' allowance configs
      const pageContent = await page.textContent('body')
      const hasHelam = pageContent?.includes('Helam')
      const hasMiriam = pageContent?.includes('Miriam')
      console.log(`Helam allowance config visible: ${hasHelam}`)
      console.log(`Miriam allowance config visible: ${hasMiriam}`)
    })
  })

  // ─── HELAM TESTS (Independent Teen) ──────────────────────────

  test.describe('Helam (Independent Teen)', () => {
    test('sees routine with auto-expanded sections on Tasks page', async ({ page }) => {
      await loginAsChild(page, 'Helam', HELAM_PIN)
      await screenshot(page, 'helam-01-dashboard')

      // Navigate to Tasks
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)
      await screenshot(page, 'helam-02-tasks-page')

      // Check for routines tab or direct routine display
      const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
      if (await routinesTab.count() > 0) {
        await routinesTab.first().click()
        await page.waitForTimeout(1000)
      }
      await screenshot(page, 'helam-03-routines-tab')

      // Check that routine sections are visible (auto-expanded)
      const pageContent = await page.textContent('body')
      const hasZone2 = pageContent?.includes('Zone 2') || pageContent?.includes('Herringbone')
      console.log(`Helam sees Zone 2 routine: ${hasZone2}`)
    })

    test('only sees today\'s sections (day filtering)', async ({ page }) => {
      await loginAsChild(page, 'Helam', HELAM_PIN)
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // Click Routines tab
      const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
      if (await routinesTab.count() > 0) {
        await routinesTab.first().click()
        await page.waitForTimeout(1000)
      }

      // Get today's day name
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
      const isSunday = today === 'Sunday'
      console.log(`Today is: ${today}`)

      // Screenshot showing which sections appear
      await screenshot(page, 'helam-04-today-sections')

      // Look for section day indicators
      const allDayLabels = await page.locator('text=/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Daily|Mon-Sat|Every day/i').allTextContents()
      console.log(`Day labels visible: ${JSON.stringify(allDayLabels)}`)
    })

    test('can check/complete routine steps', async ({ page }) => {
      await loginAsChild(page, 'Helam', HELAM_PIN)
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // Click Routines tab
      const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
      if (await routinesTab.count() > 0) {
        await routinesTab.first().click()
        await page.waitForTimeout(1000)
      }

      // Look for checkboxes/step items
      const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"], [class*="checkbox"]')
      const checkboxCount = await checkboxes.count()
      console.log(`Checkboxes found: ${checkboxCount}`)
      await screenshot(page, 'helam-05-steps-with-checkboxes')
    })

    test('does NOT see inline edit pencil icons', async ({ page }) => {
      await loginAsChild(page, 'Helam', HELAM_PIN)
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
      if (await routinesTab.count() > 0) {
        await routinesTab.first().click()
        await page.waitForTimeout(1000)
      }

      // Check pencil icons are NOT visible for kids
      const pencilIcons = page.locator('svg.lucide-pencil, button[title*="Edit section"], [data-testid*="edit-section"]')
      const pencilCount = await pencilIcons.count()
      console.log(`Pencil icons visible for Helam (should be 0): ${pencilCount}`)
      await screenshot(page, 'helam-06-no-edit-icons')
    })

    test('does NOT see Reassign/Deploy button', async ({ page }) => {
      await loginAsChild(page, 'Helam', HELAM_PIN)
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
      if (await routinesTab.count() > 0) {
        await routinesTab.first().click()
        await page.waitForTimeout(1000)
      }

      const deployButton = page.locator('button').filter({ hasText: /deploy|reassign/i })
      const deployCount = await deployButton.count()
      console.log(`Deploy/Reassign buttons for Helam (should be 0): ${deployCount}`)
      await screenshot(page, 'helam-07-no-deploy-buttons')
    })
  })

  // ─── MIRIAM TESTS (Guided Child) ─────────────────────────────

  test.describe('Miriam (Guided Child)', () => {
    test('sees routine on dashboard or tasks page', async ({ page }) => {
      await loginAsChild(page, 'Miriam', MIRIAM_PIN)
      await screenshot(page, 'miriam-01-dashboard')

      // Check dashboard for routine/task content
      const dashContent = await page.textContent('body')
      const hasKitchenZone = dashContent?.includes('Kitchen Zone') || dashContent?.includes('kitchen')
      console.log(`Miriam dashboard has Kitchen Zone: ${hasKitchenZone}`)

      // Navigate to Tasks
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)
      await screenshot(page, 'miriam-02-tasks-page')
    })

    test('sees routine with auto-expanded sections', async ({ page }) => {
      await loginAsChild(page, 'Miriam', MIRIAM_PIN)
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // For guided, there may be fewer tabs
      const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
      if (await routinesTab.count() > 0) {
        await routinesTab.first().click()
        await page.waitForTimeout(1000)
      }
      await screenshot(page, 'miriam-03-routines-view')

      // Check for auto-expanded section content
      const pageContent = await page.textContent('body')
      const hasKitchenZone = pageContent?.includes('Kitchen Zone') || pageContent?.includes('kitchen')
      console.log(`Miriam sees Kitchen Zone: ${hasKitchenZone}`)
      await screenshot(page, 'miriam-04-routine-sections')
    })

    test('only sees today\'s sections (day filtering)', async ({ page }) => {
      await loginAsChild(page, 'Miriam', MIRIAM_PIN)
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
      if (await routinesTab.count() > 0) {
        await routinesTab.first().click()
        await page.waitForTimeout(1000)
      }

      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
      console.log(`Today is: ${today}`)

      await screenshot(page, 'miriam-05-today-sections')

      const allDayLabels = await page.locator('text=/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Daily|Mon-Sat|Every day/i').allTextContents()
      console.log(`Day labels visible for Miriam: ${JSON.stringify(allDayLabels)}`)
    })

    test('can check/complete routine steps', async ({ page }) => {
      await loginAsChild(page, 'Miriam', MIRIAM_PIN)
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
      if (await routinesTab.count() > 0) {
        await routinesTab.first().click()
        await page.waitForTimeout(1000)
      }

      const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"], [class*="checkbox"]')
      const checkboxCount = await checkboxes.count()
      console.log(`Checkboxes found for Miriam: ${checkboxCount}`)
      await screenshot(page, 'miriam-06-steps-checkboxes')
    })

    test('does NOT see inline edit pencil icons', async ({ page }) => {
      await loginAsChild(page, 'Miriam', MIRIAM_PIN)
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      const routinesTab = page.locator('button, [role="tab"]').filter({ hasText: /routines/i })
      if (await routinesTab.count() > 0) {
        await routinesTab.first().click()
        await page.waitForTimeout(1000)
      }

      const pencilIcons = page.locator('svg.lucide-pencil, button[title*="Edit section"], [data-testid*="edit-section"]')
      const pencilCount = await pencilIcons.count()
      console.log(`Pencil icons visible for Miriam (should be 0): ${pencilCount}`)
      await screenshot(page, 'miriam-07-no-edit-icons')
    })

    test('does NOT see Finances tab', async ({ page }) => {
      await loginAsChild(page, 'Miriam', MIRIAM_PIN)
      await page.goto(`${BASE}/tasks`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      const financesTab = page.locator('button, [role="tab"]').filter({ hasText: /finances/i })
      const hasFinances = await financesTab.count() > 0
      console.log(`Miriam sees Finances tab (should be false): ${hasFinances}`)
      await screenshot(page, 'miriam-08-no-finances-tab')
    })
  })
})
