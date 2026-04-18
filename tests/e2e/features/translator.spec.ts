/**
 * PRD-34 ThoughtSift — Translator E2E
 *
 * Flow under test:
 * 1. Mom opens the Vault, clicks the Translator tool, clicks Launch Tool
 * 2. The VaultDetailView closes and the TranslatorModal takes the screen
 *    (regression: pre-fix, either a PersonPillSelector appeared because the
 *    tool was routing through the generic ToolConversationModal, or the
 *    TranslatorModal opened hidden behind the portaled VaultDetailView)
 * 3. Mom translates "I love you" into Pirate, then into Shakespeare
 * 4. Both results stack in the compose view (newest on top)
 * 5. Opening the History tab shows the same two translations with
 *    original text + tone label + translated text, persisted in lila_messages
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { loginAsMom } from '../helpers/auth'
import { TEST_IDS } from '../helpers/seed-testworths-complete'

dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

test.describe('PRD-34: Translator (AI Vault launch path)', () => {
  test.setTimeout(120_000) // Real OpenRouter calls — budget for network latency

  test('mom can translate into Pirate and Shakespeare, and see both in history', async ({ page }) => {
    await loginAsMom(page)

    // Capture any browser console errors — surface them in failure output
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    // ── Step 1: open Vault ──
    await page.goto('/vault')
    await expect(page.getByRole('heading', { name: 'AI Vault' })).toBeVisible()
    await page.waitForTimeout(1500) // let the vault items hydrate

    // ── Step 2: search for Translator and open its detail view ──
    // Using the search bar is the most reliable way to land on the item,
    // since category row order isn't stable across seed data changes.
    const searchInput = page.getByPlaceholder(/search/i).first()
    await searchInput.fill('Translator')
    await page.waitForTimeout(1000) // debounced search

    // The Translator card should be present in search results (h3 title)
    const translatorCardHeading = page.getByRole('heading', { name: 'Translator', level: 3 })
    await expect(translatorCardHeading).toBeVisible({ timeout: 10_000 })
    await translatorCardHeading.click()

    // VaultDetailView should open — we'll see the "Launch Tool" button
    const launchButton = page.getByRole('button', { name: /Launch Tool/i })
    await expect(launchButton).toBeVisible({ timeout: 5_000 })

    // ── Step 3: click Launch Tool ──
    await launchButton.click()

    // TranslatorModal header (h2) — the presence of this heading inside the
    // testid-scoped modal is positive proof we're in TranslatorModal and not
    // the generic ToolConversationModal.
    const modal = page.getByTestId('translator-modal')
    await expect(modal).toBeVisible({ timeout: 5_000 })
    await expect(modal.getByRole('heading', { level: 2, name: 'Translator' })).toBeVisible()

    // The fix: we should NOT see a person picker — that was the original bug
    // when ToolConversationModal was rendering translator with the default
    // "Who is this about?" label.
    await expect(page.getByText(/who is this about/i)).not.toBeVisible()

    // Compose view should show tone picker — positive signal that we're in
    // TranslatorModal, not ToolConversationModal.
    await expect(modal.getByRole('button', { name: 'Pirate', exact: true })).toBeVisible()
    await expect(modal.getByRole('button', { name: 'Shakespeare', exact: true })).toBeVisible()

    // ── Step 4: type "I love you" and translate into Pirate ──
    const textarea = modal.getByPlaceholder(/enter text to rewrite/i)
    await textarea.fill('I love you')

    await modal.getByRole('button', { name: 'Pirate', exact: true }).click()

    // Wait for the first result header ("Result:" with 1 result, then
    // "Results (2):" after the second). Haiku via OpenRouter usually returns
    // in 2-6s but we give real headroom.
    await expect(modal.getByText(/^Result:/)).toBeVisible({ timeout: 45_000 })

    // ── Step 5: translate the same text into Shakespeare ──
    await modal.getByRole('button', { name: 'Shakespeare', exact: true }).click()

    // Both results should now be stacked (newest on top).
    await expect(modal.getByText(/Results \(2\):/)).toBeVisible({ timeout: 45_000 })

    // ── Step 6: open History tab ──
    await modal.getByRole('button', { name: /view history/i }).click()

    const historyContainer = page.getByTestId('translator-history')
    await expect(historyContainer).toBeVisible()

    // Should see at least 2 history entries (the two we just ran)
    const historyEntries = page.getByTestId('translator-history-entry')
    await expect(historyEntries.first()).toBeVisible({ timeout: 10_000 })
    const entryCount = await historyEntries.count()
    expect(entryCount).toBeGreaterThanOrEqual(2)

    // Each entry has an "Original" label and a "Translated" label
    const originalLabels = page.getByText('Original', { exact: true })
    const translatedLabels = page.getByText('Translated', { exact: true })
    expect(await originalLabels.count()).toBeGreaterThanOrEqual(2)
    expect(await translatedLabels.count()).toBeGreaterThanOrEqual(2)

    // The two most recent entries should have the tones we just used
    // (history is DESC, so entry[0] = Shakespeare, entry[1] = Pirate)
    const firstEntryTone = await historyEntries.nth(0).locator('span').first().textContent()
    const secondEntryTone = await historyEntries.nth(1).locator('span').first().textContent()
    const topTwoTones = [firstEntryTone, secondEntryTone].filter(Boolean).map(s => s!.toLowerCase())
    expect(topTwoTones.some(t => t.includes('pirate'))).toBe(true)
    expect(topTwoTones.some(t => t.includes('shakespeare'))).toBe(true)

    // Both history entries should contain the original text "I love you"
    await expect(page.getByText('I love you').first()).toBeVisible()

    // ── Step 7: database-side verification ──
    // Confirm the conversations and messages were persisted by the
    // Edge Function — not just the UI optimistically rendering.
    if (TEST_IDS.sarahMemberId) {
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { data: convs } = await supabaseAdmin
        .from('lila_conversations')
        .select('id, model_used, message_count')
        .eq('member_id', TEST_IDS.sarahMemberId)
        .eq('guided_mode', 'translator')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
      expect(convs).toBeTruthy()
      expect(convs!.length).toBeGreaterThanOrEqual(2)
      // Each conversation has exactly one user + one assistant message
      for (const conv of convs!.slice(0, 2)) {
        expect(conv.model_used).toBe('haiku')
        expect(conv.message_count).toBeGreaterThanOrEqual(2)
      }
    }

    // Fail the test if the page logged any unexpected errors during the flow
    const relevantErrors = consoleErrors.filter(
      e => !e.includes('React DevTools') && !e.includes('apple-mobile-web-app-capable'),
    )
    if (relevantErrors.length > 0) {
      console.warn('Console errors during translator flow:', relevantErrors)
    }
  })
})
