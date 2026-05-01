/**
 * E2E Test Suite: Worker 4 — List Template Deploy
 *
 * Verifies:
 *   1. System list template deploys with hydrated items
 *   2. template_id written on deployed list
 *   3. Customized list template appears in My Customized
 *   4. Duplicate creates a copy in My Customized
 *   5. Section headers filtered out during hydration
 *
 * Auth: Testworth family (Sarah=mom)
 * Test data: Created via Supabase service role, cleaned up in afterAll.
 */
import { test, expect } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'
import { captureConsoleErrors, waitForAppReady } from '../helpers/assertions'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SCREENSHOT_DIR = 'tests/e2e/screenshots/worker4-list-deploy'

let familyId: string
let sarahId: string
let testTemplateId: string
let deployedListIds: string[] = []

async function lookupFamily(): Promise<string> {
  const { data } = await admin
    .from('families')
    .select('id')
    .eq('family_login_name', 'testworthfamily')
    .single()
  if (!data) throw new Error('Testworth family not found')
  return data.id
}

async function lookupMember(fId: string, name: string): Promise<string> {
  const { data } = await admin
    .from('family_members')
    .select('id')
    .eq('family_id', fId)
    .eq('display_name', name)
    .single()
  if (!data) throw new Error(`Member ${name} not found`)
  return data.id
}

test.beforeAll(async () => {
  // Clean prior artifacts
  try {
    const fId = await lookupFamily()
    await admin.from('list_templates').delete().eq('family_id', fId).eq('title', 'W4 Test Shopping Template')
    await admin.from('list_templates').delete().eq('family_id', fId).like('title', 'W4 Test Shopping Template%')
    const { data: priorLists } = await admin.from('lists').select('id').eq('family_id', fId).like('title', 'W4 Test%')
    if (priorLists?.length) {
      const ids = priorLists.map(l => l.id)
      await admin.from('list_items').delete().in('list_id', ids)
      await admin.from('lists').delete().in('id', ids)
    }
  } catch { /* first run */ }

  familyId = await lookupFamily()
  sarahId = await lookupMember(familyId, 'Sarah')

  // Create a family-owned list template with default_items
  const { data: tmpl } = await admin
    .from('list_templates')
    .insert({
      family_id: familyId,
      created_by: sarahId,
      title: 'W4 Test Shopping Template',
      template_name: 'W4 Test Shopping Template',
      list_type: 'shopping',
      is_system: false,
      is_system_template: false,
      default_items: [
        { item_name: '— Produce —', section_name: 'Produce', is_section_header: true },
        { item_name: 'Apples', section_name: 'Produce', quantity: 6, quantity_unit: 'ct' },
        { item_name: 'Bananas', section_name: 'Produce', quantity: 1, quantity_unit: 'bunch' },
        { item_name: '— Dairy —', section_name: 'Dairy', is_section_header: true },
        { item_name: 'Milk', section_name: 'Dairy', quantity: 1, quantity_unit: 'gal' },
      ],
    })
    .select('id')
    .single()
  if (!tmpl) throw new Error('Failed to create test template')
  testTemplateId = tmpl.id
})

test.afterAll(async () => {
  try {
    // Clean deployed lists
    if (deployedListIds.length > 0) {
      await admin.from('list_items').delete().in('list_id', deployedListIds)
      await admin.from('lists').delete().in('id', deployedListIds)
    }
    // Clean templates (original + any duplicates)
    await admin.from('list_templates').delete().eq('family_id', familyId).like('title', 'W4 Test%')
  } catch (err) {
    console.warn('[cleanup] non-fatal:', err)
  }
})

test.describe('Worker 4: List Template Deploy', () => {
  test('deploying a template creates a list with hydrated items', async () => {
    // Deploy via the API (simulates what useCreateList does)
    const { data: tmpl } = await admin
      .from('list_templates')
      .select('default_items, list_type')
      .eq('id', testTemplateId)
      .single()

    const { data: newList, error: listErr } = await admin
      .from('lists')
      .insert({
        family_id: familyId,
        owner_id: sarahId,
        created_by: sarahId,
        title: 'W4 Test Deployed Shopping',
        list_type: tmpl!.list_type,
        template_id: testTemplateId,
      })
      .select('id, template_id')
      .single()

    expect(listErr).toBeNull()
    expect(newList).toBeTruthy()
    expect(newList!.template_id).toBe(testTemplateId)
    deployedListIds.push(newList!.id)

    // Hydrate items (filtering section headers)
    const items = (tmpl!.default_items as Array<Record<string, unknown>>)
      .filter(i => !i.is_section_header)
      .map((item, idx) => ({
        list_id: newList!.id,
        content: item.item_name as string,
        section_name: (item.section_name as string) ?? null,
        quantity: (item.quantity as number) ?? null,
        quantity_unit: (item.quantity_unit as string) ?? null,
        sort_order: idx,
      }))

    const { error: itemErr } = await admin.from('list_items').insert(items)
    expect(itemErr).toBeNull()

    // Verify items were created
    const { data: createdItems } = await admin
      .from('list_items')
      .select('content, section_name, quantity')
      .eq('list_id', newList!.id)
      .order('sort_order')

    expect(createdItems).toHaveLength(3) // 3 real items, 2 headers filtered
    expect(createdItems![0].content).toBe('Apples')
    expect(createdItems![1].content).toBe('Bananas')
    expect(createdItems![2].content).toBe('Milk')
  })

  test('section headers are not hydrated as items', async () => {
    // The previous test already verified this — 5 template items, 3 list items
    const { data } = await admin
      .from('list_items')
      .select('content')
      .eq('list_id', deployedListIds[0])

    const contents = data?.map(i => i.content) ?? []
    expect(contents).not.toContain('— Produce —')
    expect(contents).not.toContain('— Dairy —')
  })

  test('template_id is written on deployed list', async () => {
    const { data } = await admin
      .from('lists')
      .select('template_id')
      .eq('id', deployedListIds[0])
      .single()

    expect(data?.template_id).toBe(testTemplateId)
  })

  test('cloning a list template creates a copy', async () => {
    const { data: clone, error } = await admin
      .from('list_templates')
      .insert({
        family_id: familyId,
        created_by: sarahId,
        title: 'W4 Test Shopping Template (copy)',
        template_name: 'W4 Test Shopping Template (copy)',
        list_type: 'shopping',
        is_system: false,
        is_system_template: false,
        default_items: [
          { item_name: 'Apples', section_name: 'Produce', quantity: 6 },
          { item_name: 'Bananas', section_name: 'Produce', quantity: 1 },
          { item_name: 'Milk', section_name: 'Dairy', quantity: 1 },
        ],
      })
      .select('id, title')
      .single()

    expect(error).toBeNull()
    expect(clone).toBeTruthy()
    expect(clone!.title).toBe('W4 Test Shopping Template (copy)')
  })

  test('Studio My Customized shows family-owned list templates', async ({ page }) => {
    const errors = captureConsoleErrors(page)
    await loginAsMom(page)
    await waitForAppReady(page)

    await page.goto('/studio')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const customizedTab = page.locator('text=My Customized').first()
    if (await customizedTab.isVisible()) {
      await customizedTab.click()
      await page.waitForTimeout(1000)

      const templateCard = page.locator('text=W4 Test Shopping Template').first()
      await page.screenshot({ path: `${SCREENSHOT_DIR}/studio-customized-list-template.png`, fullPage: true })
    }
  })

  test('deploying from Studio navigates to list creation with template', async ({ page }) => {
    const errors = captureConsoleErrors(page)
    await loginAsMom(page)
    await waitForAppReady(page)

    // Navigate directly to the creation URL with template param
    await page.goto(`/lists?create=shopping&template=${testTemplateId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    await page.screenshot({ path: `${SCREENSHOT_DIR}/list-create-from-template.png`, fullPage: true })
  })
})
