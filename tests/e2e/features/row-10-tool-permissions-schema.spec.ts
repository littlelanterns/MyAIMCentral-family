/**
 * Row 10 — SCOPE-3.F41 MemberAssignmentModal writes correct columns to lila_tool_permissions.
 *
 * Verifies that "+Add to AI Toolbox" writes a row that matches the live
 * schema (commit ba68ebd):
 *   - is_enabled = true          (canonical flag per Convention #88)
 *   - source = 'vault'
 *   - vault_item_id populated
 *   - mode_key populated
 *   - DOES NOT write is_granted or granted_by (dropped columns)
 *
 * Flow: loginAsMom → /vault → open a vault tool detail → click +Toolbox →
 *       assign to a member → query lila_tool_permissions via service role →
 *       assert shape.
 *
 * Cleanup: deletes the inserted row after assertion.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom } from '../helpers/auth'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

test.describe('Row 10 — MemberAssignmentModal writes to lila_tool_permissions with correct shape', () => {
  test.setTimeout(60_000)

  test('writes is_enabled=true + source=vault + vault_item_id, no is_granted/granted_by', async ({ page }) => {
    // 1. Auth as mom
    await loginAsMom(page)

    // 2. Resolve the Testworth family + a target member who does NOT already
    //    have this specific tool assigned. We pick "Translator" as the target
    //    tool because it's a known-stable ai_tool in the Vault.
    const { data: family } = await admin
      .from('families')
      .select('id')
      .ilike('family_name', '%testworth%')
      .single()
    expect(family?.id).toBeTruthy()
    const familyId = family!.id as string

    const { data: toolItem } = await admin
      .from('vault_items')
      .select('id, display_title, content_type')
      .eq('display_title', 'Translator')
      .eq('content_type', 'ai_tool')
      .eq('status', 'published')
      .single()
    expect(toolItem?.id).toBeTruthy()
    const vaultItemId = toolItem!.id as string

    // Pre-clean any stale row from a previous failed run for this family+tool
    await admin
      .from('lila_tool_permissions')
      .delete()
      .eq('family_id', familyId)
      .eq('vault_item_id', vaultItemId)
      .eq('source', 'vault')

    // 3. Navigate to /vault, search for Translator, open detail
    await page.goto('/vault')
    await expect(page.getByRole('heading', { name: 'AI Vault' })).toBeVisible()
    await page.waitForTimeout(1500)

    const searchInput = page.getByPlaceholder(/search/i).first()
    await searchInput.click()
    await searchInput.fill('Translator')
    await page.waitForTimeout(1000)

    const cardHeading = page
      .getByRole('heading', { name: 'Translator', level: 3, exact: true })
      .first()
    await expect(cardHeading).toBeVisible({ timeout: 10_000 })
    // VaultContentCard is a <div onClick> wrapper around the heading. Use
    // dispatchEvent to bypass pointer-event actionability (the hero spotlight
    // has an ephemeral "What you'll learn" list that intercepts clicks).
    const cardRoot = cardHeading.locator('xpath=ancestor::div[contains(@class,"cursor-pointer")][1]')
    await cardRoot.scrollIntoViewIfNeeded()
    await cardRoot.dispatchEvent('click')

    // 4. Click the +Toolbox button in the detail view header
    const toolboxBtn = page.getByRole('button', { name: /Toolbox/ }).first()
    await expect(toolboxBtn).toBeVisible({ timeout: 5_000 })
    await toolboxBtn.click()

    // 5. MemberAssignmentModal opens — pick the Mom pill (pre-checked) and Save
    //    Mom's pill is auto-selected per MemberAssignmentModal lines 67-68.
    const saveBtn = page.getByRole('button', { name: /^Add to Toolbox$/ })
    await expect(saveBtn).toBeVisible({ timeout: 5_000 })
    await saveBtn.click()

    // Wait for the "Added!" state to appear (successful insert per lines 108-111)
    await expect(page.getByRole('button', { name: /Added!/ })).toBeVisible({ timeout: 10_000 })

    // 6. Query the DB for the inserted row + assert shape
    const { data: rows, error } = await admin
      .from('lila_tool_permissions')
      .select('*')
      .eq('family_id', familyId)
      .eq('vault_item_id', vaultItemId)
      .eq('source', 'vault')

    expect(error).toBeNull()
    expect(rows).toBeDefined()
    expect(rows!.length).toBeGreaterThan(0)

    const row = rows![0] as Record<string, unknown>
    // Core assertions — positive
    expect(row.is_enabled).toBe(true)
    expect(row.source).toBe('vault')
    expect(row.vault_item_id).toBe(vaultItemId)
    expect(row.mode_key).toBeTruthy()
    expect(row.family_id).toBe(familyId)
    expect(row.member_id).toBeTruthy()

    // Negative assertions — dropped columns must not be present
    expect(Object.prototype.hasOwnProperty.call(row, 'is_granted')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(row, 'granted_by')).toBe(false)

    // 7. Cleanup
    await admin
      .from('lila_tool_permissions')
      .delete()
      .eq('family_id', familyId)
      .eq('vault_item_id', vaultItemId)
      .eq('source', 'vault')
  })
})
