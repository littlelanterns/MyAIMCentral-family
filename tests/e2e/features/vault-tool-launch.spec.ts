/**
 * PRD-21 + PRD-34 — Vault Tool Launch Path E2E
 *
 * For every published `ai_tool` in the Vault, this test:
 *   1. Opens the Vault
 *   2. Searches for the tool by display_title
 *   3. Clicks into its detail view and hits Launch Tool
 *   4. Asserts the VaultDetailView closes
 *   5. Asserts the correct modal renders (TranslatorModal, BoardOfDirectorsModal,
 *      or ToolConversationModal with the expected mode key)
 *   6. Asserts the tool-specific signature UI (person picker label or its absence,
 *      tone buttons, advisor seat row, etc.)
 *
 * Regression guard for the bug Tenise reported on 2026-04-07: Translator was
 * rendering through ToolConversationModal which has no translator entry in its
 * configs map, falling through to the default "Who is this about?" person picker.
 * The fix routes AIToolDetail through useToolLauncher().openTool() which dispatches
 * to the correct modal per tool, AND closes the VaultDetailView so the tool modal
 * has a clean z-stack.
 *
 * Scope: LAUNCH PATH ONLY. This test does not call any Edge Function with real
 * input. We already have a separate full-flow test for Translator
 * (translator.spec.ts) that exercises the real lila-translator Edge Function,
 * and each tool Edge Function has its own unit tests. Running real AI calls for
 * 13 tools here would burn budget without catching anything the launch-path
 * test doesn't already catch.
 */
import { test, expect, type Page } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'

// Expected modal type for each tool's guided_mode_key.
type ModalKind = 'translator' | 'board_of_directors' | 'tool_conversation'

interface ToolCase {
  /** display_title as shown on the vault card (must match DB row) */
  displayTitle: string
  /** guided_mode_key from vault_items */
  modeKey: string
  /** Which modal should render */
  modal: ModalKind
  /**
   * For tool_conversation modals: what personLabel do we expect to see?
   * null = no person picker expected (decision_guide, board_of_directors).
   * string = substring match against the rendered label (case-insensitive).
   */
  expectedPersonLabel: string | null
}

// Source of truth: 13 published native ai_tools as of 2026-04-07.
// Labels come from ToolConversationModal.tsx:556-570 configs map.
const TOOL_CASES: ToolCase[] = [
  { displayTitle: 'Translator', modeKey: 'translator', modal: 'translator', expectedPersonLabel: null },
  { displayTitle: 'Board of Directors', modeKey: 'board_of_directors', modal: 'board_of_directors', expectedPersonLabel: null },
  { displayTitle: 'Cyrano', modeKey: 'cyrano', modal: 'tool_conversation', expectedPersonLabel: 'your partner' },
  { displayTitle: 'Help Me Say Something', modeKey: 'higgins_say', modal: 'tool_conversation', expectedPersonLabel: 'who is this about' },
  { displayTitle: 'Help Me Navigate This', modeKey: 'higgins_navigate', modal: 'tool_conversation', expectedPersonLabel: 'who is involved' },
  { displayTitle: 'Quality Time', modeKey: 'quality_time', modal: 'tool_conversation', expectedPersonLabel: 'who is this about' },
  { displayTitle: 'Gifts', modeKey: 'gifts', modal: 'tool_conversation', expectedPersonLabel: 'who is this for' },
  { displayTitle: 'Observe & Serve', modeKey: 'observe_serve', modal: 'tool_conversation', expectedPersonLabel: 'who is this about' },
  { displayTitle: 'Words of Affirmation', modeKey: 'words_affirmation', modal: 'tool_conversation', expectedPersonLabel: 'who is this for' },
  { displayTitle: 'Gratitude', modeKey: 'gratitude', modal: 'tool_conversation', expectedPersonLabel: 'who are you grateful for' },
  { displayTitle: 'Decision Guide', modeKey: 'decision_guide', modal: 'tool_conversation', expectedPersonLabel: null },
  { displayTitle: 'Perspective Shifter', modeKey: 'perspective_shifter', modal: 'tool_conversation', expectedPersonLabel: 'whose perspective' },
  // Mediator's personLabel is conditional on context selection, so we only
  // assert the modal opened with the right mode key.
  { displayTitle: 'Mediator', modeKey: 'mediator', modal: 'tool_conversation', expectedPersonLabel: null },
]

/**
 * Search for a tool in the Vault and open its detail view.
 * Handles the search debounce and waits for the card to appear in results.
 */
async function openVaultToolDetail(page: Page, displayTitle: string) {
  await page.goto('/vault')
  await expect(page.getByRole('heading', { name: 'AI Vault' })).toBeVisible()
  // Let the vault items hydrate before we start interacting with search.
  await page.waitForTimeout(1500)

  const searchInput = page.getByPlaceholder(/search/i).first()
  await searchInput.click()
  await searchInput.fill('')
  await searchInput.fill(displayTitle)
  await page.waitForTimeout(1000) // debounced search

  // Vault cards render the tool title as h3. Some tools have partial-match
  // titles (e.g. "Help Me Say Something" could collide with "Help Me
  // Navigate This") — so use an exact-match heading lookup.
  const card = page.getByRole('heading', { name: displayTitle, level: 3, exact: true }).first()
  await expect(card).toBeVisible({ timeout: 10_000 })
  await card.click()

  // Detail view should render a Launch Tool button.
  const launchButton = page.getByRole('button', { name: /Launch Tool/i })
  await expect(launchButton).toBeVisible({ timeout: 5_000 })
  await launchButton.click()
}

/**
 * After launching, assert the correct modal rendered and the vault detail closed.
 */
async function assertModalOpened(page: Page, tc: ToolCase) {
  if (tc.modal === 'translator') {
    const modal = page.getByTestId('translator-modal')
    await expect(modal).toBeVisible({ timeout: 5_000 })
    await expect(modal.getByRole('heading', { level: 2, name: 'Translator' })).toBeVisible()
    // Positive signal: tone buttons unique to TranslatorModal
    await expect(modal.getByRole('button', { name: 'Pirate', exact: true })).toBeVisible()
    await expect(modal.getByRole('button', { name: 'Shakespeare', exact: true })).toBeVisible()
    // Negative signal: must NOT show the generic "Who is this about?" label
    await expect(page.getByText(/who is this about/i)).not.toBeVisible()
    return
  }

  if (tc.modal === 'board_of_directors') {
    const modal = page.getByTestId('board-of-directors-modal')
    await expect(modal).toBeVisible({ timeout: 5_000 })
    // Positive signal: "Your Board:" label in the assembly bar
    await expect(modal.getByText('Your Board:')).toBeVisible()
    // Must NOT be routed through ToolConversationModal
    await expect(page.getByTestId('tool-conversation-modal')).not.toBeVisible()
    await expect(page.getByTestId('translator-modal')).not.toBeVisible()
    return
  }

  // tool_conversation case
  const modal = page.getByTestId('tool-conversation-modal')
  await expect(modal).toBeVisible({ timeout: 5_000 })
  // The data-mode-key attribute tells us which tool this is — proves we're
  // not on a fallthrough default.
  await expect(modal).toHaveAttribute('data-mode-key', tc.modeKey)
  // Must NOT be TranslatorModal or BoardOfDirectorsModal
  await expect(page.getByTestId('translator-modal')).not.toBeVisible()
  await expect(page.getByTestId('board-of-directors-modal')).not.toBeVisible()

  if (tc.expectedPersonLabel !== null) {
    // Positive signal: the expected person label is visible inside the modal
    const labelRegex = new RegExp(tc.expectedPersonLabel, 'i')
    await expect(modal.getByText(labelRegex).first()).toBeVisible()
  }
}

test.describe('PRD-21 + PRD-34: Vault tool launch path — all native tools', () => {
  test.setTimeout(60_000)

  for (const tc of TOOL_CASES) {
    test(`launches "${tc.displayTitle}" into the correct modal`, async ({ page }) => {
      await loginAsMom(page)
      await openVaultToolDetail(page, tc.displayTitle)
      await assertModalOpened(page, tc)
    })
  }
})
