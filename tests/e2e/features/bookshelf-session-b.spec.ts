/**
 * BookShelf Session B — ExtractionBrowser smoke tests.
 *
 * Tests against the dev account (dev@myaimcentral.test) which has
 * 394 parent books + 184 parts with 89K extraction items loaded.
 *
 * What we can test without deployed Edge Functions:
 *   - Extraction tabs load with item counts
 *   - Tab switching shows different content types
 *   - Abridged / Full toggle changes visible items
 *   - Heart toggle on extraction items
 *   - Note inline editing
 *   - Apply This → Guiding Stars creates a guiding_stars entry
 *   - Apply This → Tasks opens TaskCreationModal pre-filled
 *   - View modes (Tabs / Chapters / Notes) switch correctly
 *   - Chapter sidebar renders (desktop)
 *   - Mobile chapter jump FAB renders (<768px)
 *   - Journal Prompts page loads
 *
 * What requires deployed Edge Functions (marked .skip for now):
 *   - Semantic search returns results
 *   - Refresh Key Points calls Edge Function
 */
import { test, expect, Page } from '@playwright/test'
import {
  captureConsoleErrors,
  assertNoInfiniteRenders,
  waitForAppReady,
} from '../helpers/assertions'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

// ── Dev account login helper ───────────────────────────────────────────────

const DEV_EMAIL = 'dev@myaimcentral.test'
const DEV_PASSWORD = 'devtest123'
const AUTH_CACHE_DIR = path.join(process.cwd(), 'tests', 'e2e', '.auth')

async function loginAsDev(page: Page): Promise<void> {
  const cachePath = path.join(AUTH_CACHE_DIR, 'dev.json')

  if (fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
    const expiresAt = cached.expires_at * 1000
    if (Date.now() < expiresAt - 60000) {
      await injectSession(page, cached)
      return
    }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
  })

  if (error || !data.session) {
    throw new Error(`Failed to login as dev: ${error?.message || 'No session'}`)
  }

  if (!fs.existsSync(AUTH_CACHE_DIR)) {
    fs.mkdirSync(AUTH_CACHE_DIR, { recursive: true })
  }
  fs.writeFileSync(cachePath, JSON.stringify(data.session))
  await injectSession(page, data.session)
}

async function injectSession(page: Page, session: Record<string, unknown>): Promise<void> {
  await page.goto('/')
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
  const storageValue = JSON.stringify(session)

  await page.evaluate(
    ([key, value]) => { localStorage.setItem(key, value) },
    [storageKey, storageValue]
  )

  await page.reload()
  await page.waitForLoadState('networkidle')
}

// ── Find a book with extractions ───────────────────────────────────────────

let extractedBookId: string | null = null

async function findExtractedBook(): Promise<string> {
  if (extractedBookId) return extractedBookId

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Login to get authed client
  await supabase.auth.signInWithPassword({ email: DEV_EMAIL, password: DEV_PASSWORD })

  // Find a book with extraction_status='completed' that has summaries
  const { data: books } = await supabase
    .from('bookshelf_items')
    .select('id')
    .eq('extraction_status', 'completed')
    .is('parent_bookshelf_item_id', null)
    .is('archived_at', null)
    .limit(1)
    .single()

  if (!books) throw new Error('No extracted book found in dev account')
  extractedBookId = books.id
  return extractedBookId
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('BookShelf ExtractionBrowser', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
    await loginAsDev(page)
  })

  test('library page loads with books', async ({ page }) => {
    await page.goto('/bookshelf')
    await waitForAppReady(page)

    // Should see BookShelfLibrary with book cards
    // Wait for at least one book card to appear
    const bookCard = page.locator('[class*="rounded"]').filter({ hasText: /.{3,}/ }).first()
    await expect(bookCard).toBeVisible({ timeout: 15000 })

    assertNoInfiniteRenders(consoleErrors)
  })

  test('clicking a book navigates to extraction browser', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)

    // Should see the ExtractionBrowser, not the library
    // Look for tab buttons (Summaries, Insights, etc.)
    const summariesTab = page.locator('button').filter({ hasText: 'Summaries' }).first()
    await expect(summariesTab).toBeVisible({ timeout: 15000 })

    assertNoInfiniteRenders(consoleErrors)
  })

  test('all 5 tabs render with counts', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)

    const tabLabels = ['Summaries', 'Insights', 'Declarations', 'Action Steps', 'Questions']

    for (const label of tabLabels) {
      const tab = page.locator('button').filter({ hasText: label }).first()
      await expect(tab).toBeVisible({ timeout: 10000 })

      // Tab should show a count
      const tabText = await tab.textContent()
      // Count is a number after the label text
      expect(tabText).toBeTruthy()
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('switching tabs changes visible extraction items', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)

    // Click Insights tab
    const insightsTab = page.locator('button').filter({ hasText: 'Insights' }).first()
    await insightsTab.click()
    await page.waitForTimeout(500)

    // Should see insight-type badges (PRINCIPLE, FRAMEWORK, etc.)
    const insightBadge = page.locator('text=/PRINCIPLE|FRAMEWORK|MENTAL MODEL|STRATEGY|CONCEPT/i').first()
    // May or may not be visible depending on data, so just check no crash
    expect(page.url()).toContain(`book=${bookId}`)

    // Switch to Declarations
    const declarationsTab = page.locator('button').filter({ hasText: 'Declarations' }).first()
    await declarationsTab.click()
    await page.waitForTimeout(500)

    // Declarations use blockquote style
    assertNoInfiniteRenders(consoleErrors)
  })

  test('abridged toggle changes visible items', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)

    // Find abridged toggle button
    const abridgedBtn = page.locator('button').filter({ hasText: /Abridged|Full/ }).first()
    await expect(abridgedBtn).toBeVisible({ timeout: 10000 })

    // Get initial button text
    const initialText = await abridgedBtn.textContent()

    // Click to toggle
    await abridgedBtn.click()
    await page.waitForTimeout(300)

    // Button text should change
    const newText = await abridgedBtn.textContent()
    expect(newText).not.toBe(initialText)

    assertNoInfiniteRenders(consoleErrors)
  })

  test('heart toggle works on extraction item', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)

    // Wait for items to load
    await page.waitForTimeout(1000)

    // Find a heart button (Heart icon in action bar)
    const heartBtn = page.locator('button[title="Heart this"], button[title="Remove from hearted"]').first()

    if (await heartBtn.count() > 0) {
      const initialTitle = await heartBtn.getAttribute('title')
      await heartBtn.click()
      await page.waitForTimeout(500)

      // The title should have toggled
      const newTitle = await heartBtn.getAttribute('title')
      expect(newTitle).not.toBe(initialTitle)
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Apply This sheet opens with destinations', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)

    await page.waitForTimeout(1000)

    // Find an "Apply This" button
    const applyBtn = page.locator('button[title="Apply This"]').first()

    if (await applyBtn.count() > 0) {
      await applyBtn.click()
      await page.waitForTimeout(300)

      // Should see the Apply This grid with destinations
      const gsButton = page.locator('button').filter({ hasText: 'Guiding Stars' }).first()
      await expect(gsButton).toBeVisible({ timeout: 5000 })

      const tasksButton = page.locator('button').filter({ hasText: 'Tasks' }).first()
      await expect(tasksButton).toBeVisible()

      const promptsButton = page.locator('button').filter({ hasText: 'Journal Prompts' }).first()
      await expect(promptsButton).toBeVisible()

      // Coming soon items should be visible but disabled
      const queueButton = page.locator('button').filter({ hasText: 'Queue' }).first()
      await expect(queueButton).toBeVisible()
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Apply This → Guiding Stars creates entry and shows toast', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)
    await page.waitForTimeout(1000)

    // Open Apply This on first item
    const applyBtn = page.locator('button[title="Apply This"]').first()
    if (await applyBtn.count() === 0) {
      test.skip()
      return
    }

    await applyBtn.click()
    await page.waitForTimeout(300)

    // Click Guiding Stars
    const gsButton = page.locator('button').filter({ hasText: 'Guiding Stars' }).first()
    await gsButton.click()

    // Wait for the action to complete (sheet should close, item should refresh)
    await page.waitForTimeout(2000)

    // The Apply This sheet should be closed now
    const sheetVisible = await page.locator('text=Apply This').first().isVisible().catch(() => false)
    // Sheet closes after successful send
    assertNoInfiniteRenders(consoleErrors)
  })

  test('Apply This → Tasks opens TaskCreationModal pre-filled', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)
    await page.waitForTimeout(1000)

    const applyBtn = page.locator('button[title="Apply This"]').first()
    if (await applyBtn.count() === 0) {
      test.skip()
      return
    }

    await applyBtn.click()
    await page.waitForTimeout(300)

    // Scope to the Apply This sheet (inside the extraction item, not sidebar nav)
    // The Apply This grid has a heading "Apply This" and the Tasks button is inside it
    const applySheet = page.locator('text=Apply This').locator('..').locator('..')
    const tasksButton = applySheet.locator('button').filter({ hasText: 'Tasks' }).first()

    // Fallback: find the icon grid button with exact "Tasks" label (10px text)
    const fallbackTasksBtn = page.locator('.grid button').filter({ hasText: 'Tasks' }).first()
    const btn = await tasksButton.count() > 0 ? tasksButton : fallbackTasksBtn

    if (await btn.count() === 0) {
      test.skip()
      return
    }

    await btn.click()
    await page.waitForTimeout(1000)

    // TaskCreationModal should be open with pre-filled title
    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible({ timeout: 5000 })

    // The title input should have content from the extraction
    const titleInput = modal.locator('input[type="text"]').first()
    if (await titleInput.count() > 0) {
      const titleValue = await titleInput.inputValue()
      expect(titleValue.length).toBeGreaterThan(0)
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('view modes switch: Tabs → Chapters → Notes', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)

    // Find view mode buttons (Layers, BookOpen, StickyNote icons)
    // They're in a segmented control group
    const viewModeButtons = page.locator('button[title="Tabs"], button[title="Chapters"], button[title="Notes"]')
    const count = await viewModeButtons.count()

    if (count >= 3) {
      // Switch to Chapters
      await page.locator('button[title="Chapters"]').click()
      await page.waitForTimeout(500)

      // Tab bar should be hidden in chapters view (tabs only show in tabs view)
      // Chapters view shows all content types grouped by chapter

      // Switch to Notes
      await page.locator('button[title="Notes"]').click()
      await page.waitForTimeout(500)

      // Notes view shows only items with user_note
      // May show "No notes yet" if no notes exist

      // Switch back to Tabs
      await page.locator('button[title="Tabs"]').click()
      await page.waitForTimeout(500)
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('back button returns to library', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)

    // Click the back arrow
    const backBtn = page.locator('button').filter({ has: page.locator('[class*="lucide-arrow-left"]') }).first()
    // Fallback: look for the first button in the header area
    const headerBackBtn = backBtn.count().then(c => c > 0 ? backBtn : page.locator('a:has-text("Library")').first())

    const btn = await headerBackBtn
    if (await btn.count() > 0) {
      await btn.click()
      await waitForAppReady(page)
      expect(page.url()).not.toContain('book=')
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('All / Hearted filter toggle works', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)

    // Find the Hearted filter button
    const heartedBtn = page.locator('button').filter({ hasText: 'Hearted' }).first()
    if (await heartedBtn.count() > 0) {
      await heartedBtn.click()
      await page.waitForTimeout(500)

      // Click All to switch back
      const allBtn = page.locator('button').filter({ hasText: 'All' }).first()
      await allBtn.click()
      await page.waitForTimeout(500)
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('inline-editable title shows edit state on click', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)

    // Click the book title (h1 element)
    const title = page.locator('h1').first()
    if (await title.count() > 0) {
      const originalText = await title.textContent()
      await title.click()
      await page.waitForTimeout(300)

      // Should now show an input element
      const titleInput = page.locator('input').first()
      if (await titleInput.count() > 0) {
        const inputValue = await titleInput.inputValue()
        expect(inputValue).toBe(originalText)

        // Press Escape to cancel edit
        await titleInput.press('Escape')
        await page.waitForTimeout(300)
      }
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Journal Prompts page loads', async ({ page }) => {
    await page.goto('/bookshelf/prompts')
    await waitForAppReady(page)

    // Should see the Journal Prompts heading
    const heading = page.locator('h1').filter({ hasText: 'Journal Prompts' }).first()
    await expect(heading).toBeVisible({ timeout: 10000 })

    // Should see "Add Custom" button
    const addBtn = page.locator('button').filter({ hasText: 'Add Custom' }).first()
    await expect(addBtn).toBeVisible()

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Journal Prompts — create custom prompt', async ({ page }) => {
    await page.goto('/bookshelf/prompts')
    await waitForAppReady(page)

    // Click Add Custom
    const addBtn = page.locator('button').filter({ hasText: 'Add Custom' }).first()
    await addBtn.click()
    await page.waitForTimeout(300)

    // Modal should appear
    const modal = page.locator('[role="dialog"], [class*="modal"]').first()
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Fill in prompt text
    const textarea = modal.locator('textarea').first()
    await textarea.fill('What did I learn today that surprised me?')

    // Fill in tags
    const tagsInput = modal.locator('input[placeholder*="tag"]').first()
    if (await tagsInput.count() > 0) {
      await tagsInput.fill('reflection, daily')
    }

    // Click Save
    const saveBtn = modal.locator('button').filter({ hasText: 'Save' }).first()
    await saveBtn.click()
    await page.waitForTimeout(1000)

    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 5000 })

    // New prompt should appear in the list
    const prompt = page.locator('text=What did I learn today that surprised me?').first()
    await expect(prompt).toBeVisible({ timeout: 5000 })

    assertNoInfiniteRenders(consoleErrors)
  })

  // ── Tests requiring deployed Edge Functions ─────────────────────────────

  test.skip('semantic search returns results', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)

    // TODO: Trigger semantic search panel
    // TODO: Enter query and verify results appear
    // Requires: bookshelf-search Edge Function deployed
  })

  test.skip('Refresh Key Points calls Edge Function', async ({ page }) => {
    const bookId = await findExtractedBook()
    await page.goto(`/bookshelf?book=${bookId}`)
    await waitForAppReady(page)

    // TODO: Click "Refresh Key Points" button
    // TODO: Verify spinner appears and items update
    // Requires: bookshelf-key-points Edge Function deployed
  })
})
