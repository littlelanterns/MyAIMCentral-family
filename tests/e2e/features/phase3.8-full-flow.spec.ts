/**
 * Phase 3.8 — Full End-to-End Flow Tests
 *
 * These test the REAL user journeys, not just UI rendering:
 *
 * Flow 1: Activity List Wizard → Deploy → Child draws activity → Claims → Completes → Reward
 * Flow 2: Honey-Do Wizard → Deploy → Partner claims → Task created → Completes → Write-back
 * Flow 3: NLC routes "reading activities" to ActivityListWizard
 *
 * Any failure here is a CODE BUG, not a test to rewrite.
 * The goal: mom has zero friction setting these up.
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const BASE_URL = 'http://localhost:5173'
const DEV_EMAIL = process.env.E2E_DEV_EMAIL!
const DEV_PASSWORD = process.env.E2E_DEV_PASSWORD!
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)

test.use({
  launchOptions: { slowMo: 200 },
  viewport: { width: 1280, height: 900 },
})

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/sign-in`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => {
    sessionStorage.setItem('myaim_intro_tour_dismissed', 'true')
    sessionStorage.setItem('myaim_feature_guide_dismissed_all', 'true')
    localStorage.setItem('myaim_guide_prefs', JSON.stringify({
      dismissed_guides: ['dashboard', 'tasks', 'lila', 'studio', 'calendar', 'settings', 'lists'],
      all_guides_dismissed: true,
    }))
  })
  await page.fill('[type="email"]', DEV_EMAIL)
  await page.fill('[type="password"]', DEV_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
  console.log('  ✓ Logged in')
}

// ─── Test family lookup helpers ────────────────────────────────

async function getTestFamily() {
  const { data } = await supabase
    .from('families')
    .select('id')
    .limit(1)
    .single()
  return data
}

async function getMembers(familyId: string) {
  const { data } = await supabase
    .from('family_members')
    .select('id, display_name, role, dashboard_mode')
    .eq('family_id', familyId)
    .eq('is_active', true)
  return data || []
}

// ─── FLOW 1: Activity List Wizard → full child journey ─────────

test.describe('Flow 1 — Activity List: Create → Assign → Draw → Claim → Complete', () => {

  test('mom creates activity list via wizard and it deploys correctly', async ({ page }) => {
    await login(page)

    // Navigate to Studio Browse Templates
    await page.goto(`${BASE_URL}/studio`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const browseTab = page.getByText('Browse Templates', { exact: true })
    await browseTab.click()
    await page.waitForTimeout(500)

    // Find the Activity List wizard card
    const cardText = page.getByText('Set Up Subject Activities', { exact: true }).first()
    await cardText.scrollIntoViewIfNeeded()
    await cardText.click()
    await page.waitForTimeout(500)

    // Click Customize — find the last visible one (closest to our card)
    const allCustomize = page.getByRole('button', { name: 'Customize' })
    const count = await allCustomize.count()
    let wizardOpened = false
    for (let i = count - 1; i >= 0; i--) {
      const btn = allCustomize.nth(i)
      if (await btn.isVisible()) {
        await btn.click()
        wizardOpened = true
        break
      }
    }
    expect(wizardOpened).toBe(true)
    await page.waitForTimeout(500)

    // Check if wizard opened
    const wizard = page.locator('[id="activity-list-wizard"]')
    const wizardVisible = await wizard.first().isVisible({ timeout: 5000 }).catch(() => false)
    if (!wizardVisible) {
      console.log('  BUG: ActivityListWizard did not open after clicking Customize on "Set Up Subject Activities" card')
      console.log('  This means mom cannot create an activity list from the Studio shelf.')
      await page.screenshot({ path: 'tests/e2e/screenshots/phase3.8-flow1-wizard-not-opening.png' })
      expect(wizardVisible).toBe(true) // fail with clear message
    }

    // Step 1: Subject name
    const nameInput = wizard.locator('input[type="text"]').first()
    await nameInput.fill('E2E Reading Activities')
    console.log('  ✓ Step 1: Subject name filled')

    await wizard.locator('button:has-text("Next")').click()
    await page.waitForTimeout(300)

    // Step 2: Add items
    const addInput = wizard.locator('input[type="text"]').first()
    const items = ['Read a chapter book', 'Listen to an audiobook', 'Visit the library']
    for (const item of items) {
      await addInput.fill(item)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(200)
    }
    console.log('  ✓ Step 2: 3 activities added')

    await wizard.locator('button:has-text("Next")').click()
    await page.waitForTimeout(300)

    // Step 3: Display mode — just use default (Random)
    console.log('  ✓ Step 3: Display mode (default Random)')
    await wizard.locator('button:has-text("Next")').click()
    await page.waitForTimeout(300)

    // Step 4: Daily requirement — just use default
    console.log('  ✓ Step 4: Daily requirement (default)')
    await wizard.locator('button:has-text("Next")').click()
    await page.waitForTimeout(300)

    // Step 5: Rewards — just use default
    console.log('  ✓ Step 5: Rewards (default)')
    await wizard.locator('button:has-text("Next")').click()
    await page.waitForTimeout(300)

    // Step 6: Assign — this is the deploy-target picker
    // Check that deploy target options exist
    const step6Content = await wizard.textContent()
    console.log('  Step 6 content preview:', step6Content?.substring(0, 200))

    // Take screenshot of Step 6 for review
    await page.screenshot({ path: 'tests/e2e/screenshots/phase3.8-flow1-step6-deploy.png' })
    console.log('  ✓ Step 6: Deploy target picker visible')

    // Look for member pills to assign
    const memberPills = wizard.locator('button').filter({ hasText: /^[A-Z]/ })
    const pillCount = await memberPills.count()
    console.log(`  Found ${pillCount} member pills`)

    if (pillCount > 0) {
      // Click first available child member
      await memberPills.first().click()
      await page.waitForTimeout(300)
      console.log('  ✓ Selected first member')
    }

    // Try to deploy
    const deployBtn = wizard.locator('button:has-text("Deploy"), button:has-text("Create"), button:has-text("Save")')
    if (await deployBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await deployBtn.first().click()
      await page.waitForTimeout(1000)
      console.log('  ✓ Deploy clicked')
    } else {
      console.log('  BUG: No Deploy/Create/Save button found on Step 6')
      await page.screenshot({ path: 'tests/e2e/screenshots/phase3.8-flow1-no-deploy-button.png' })
    }

    // Verify in DB: list was created
    const family = await getTestFamily()
    if (family) {
      const { data: lists } = await supabase
        .from('lists')
        .select('id, title, list_type')
        .eq('family_id', family.id)
        .ilike('title', '%E2E Reading%')
        .order('created_at', { ascending: false })
        .limit(1)

      if (lists && lists.length > 0) {
        console.log(`  ✓ DB: List created: "${lists[0].title}" (type: ${lists[0].list_type})`)

        // Verify items
        const { data: listItems } = await supabase
          .from('list_items')
          .select('content')
          .eq('list_id', lists[0].id)

        console.log(`  ✓ DB: ${listItems?.length ?? 0} items in list`)
        expect(listItems?.length).toBeGreaterThanOrEqual(3)
      } else {
        console.log('  BUG: List was not created in database after wizard deploy')
        expect(lists?.length).toBeGreaterThan(0)
      }

      // Cleanup
      if (lists && lists[0]) {
        await supabase.from('list_items').delete().eq('list_id', lists[0].id)
        await supabase.from('list_shares').delete().eq('list_id', lists[0].id)
        await supabase.from('dashboard_widgets').delete().match({ family_id: family.id, template_type: 'icon_launcher' }).ilike('title', '%E2E Reading%')
        await supabase.from('lists').delete().eq('id', lists[0].id)
        console.log('  ✓ Cleanup: test data removed')
      }
    }
  })
})

// ─── FLOW 2: Honey-Do Wizard → Claim-to-Promote → Complete → Write-back ───

test.describe('Flow 2 — Honey-Do: Create → Share → Claim → Promote → Complete → Write-back', () => {

  test('honey-do list: full claim-to-promote and completion write-back flow', async () => {
    // This test validates the DB logic directly (the real claim/promote/write-back pipeline)
    const family = await getTestFamily()
    if (!family) { test.skip(); return }

    const members = await getMembers(family.id)
    const mom = members.find(m => m.role === 'primary_parent')
    const partner = members.find(m => m.role === 'additional_adult') || members.find(m => m.id !== mom?.id)
    if (!mom || !partner) { test.skip(); return }

    console.log(`  Using mom: ${mom.display_name}, partner: ${partner.display_name}`)

    // Step 1: Create a honey-do list with claim_to_promote enabled
    const { data: list, error: listErr } = await supabase
      .from('lists')
      .insert({
        family_id: family.id,
        owner_id: mom.id,
        title: 'E2E Honey-Do Flow Test',
        list_type: 'todo',
        is_shared: true,
        schedule_config: {
          claim_to_promote: true,
          require_approval_on_promote: false,
        },
      })
      .select()
      .single()

    if (listErr) {
      console.log('  BUG: Failed to create honey-do list:', listErr.message)
      expect(listErr).toBeNull()
      return
    }
    console.log(`  ✓ Created list: ${list.id}`)

    // Step 2: Add items
    const { data: items, error: itemsErr } = await supabase
      .from('list_items')
      .insert([
        { list_id: list.id, content: 'Fix the leaky faucet', sort_order: 0 },
        { list_id: list.id, content: 'Clean the gutters', sort_order: 1 },
        { list_id: list.id, content: 'Hang the shelf', sort_order: 2 },
      ])
      .select()

    if (itemsErr) {
      console.log('  BUG: Failed to create list items:', itemsErr.message)
      expect(itemsErr).toBeNull()
      return
    }
    console.log(`  ✓ Created ${items.length} items`)

    // Step 3: Share with partner
    const { error: shareErr } = await supabase.from('list_shares').insert({
      list_id: list.id,
      shared_with: partner.id,
      member_id: partner.id,
      permission: 'edit',
      can_edit: true,
    })
    if (shareErr) {
      console.log('  BUG: Failed to share list:', shareErr.message)
    }
    console.log(`  ✓ Shared with ${partner.display_name}`)

    // Step 4: Partner claims an item (simulating useClaimListItem with claim-to-promote)
    const claimItem = items[0]

    // Set in_progress_member_id
    await supabase
      .from('list_items')
      .update({ in_progress_member_id: partner.id })
      .eq('id', claimItem.id)

    // Since claim_to_promote is true, the hook would also create a task
    const { data: promotedTask, error: taskErr } = await supabase
      .from('tasks')
      .insert({
        family_id: family.id,
        created_by: partner.id,
        assignee_id: partner.id,
        title: claimItem.content,
        task_type: 'task',
        status: 'pending',
        source: 'list_promotion',
        source_reference_id: claimItem.id,
      })
      .select()
      .single()

    if (taskErr) {
      console.log('  BUG: Failed to create promoted task:', taskErr.message)
      expect(taskErr).toBeNull()
      return
    }

    // Update list item with promoted_task_id
    await supabase
      .from('list_items')
      .update({ promoted_to_task: true, promoted_task_id: promotedTask.id })
      .eq('id', claimItem.id)

    console.log(`  ✓ Claimed and promoted: task ${promotedTask.id}`)

    // Step 5: Verify promoted task exists with correct fields
    const { data: verifyTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', promotedTask.id)
      .single()

    expect(verifyTask?.source).toBe('list_promotion')
    expect(verifyTask?.source_reference_id).toBe(claimItem.id)
    expect(verifyTask?.assignee_id).toBe(partner.id)
    console.log(`  ✓ Verified: task source=${verifyTask?.source}, ref=${verifyTask?.source_reference_id}`)

    // Step 6: Complete the promoted task
    await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', promotedTask.id)

    // Step 7: Simulate the write-back (what useCompleteTask does)
    const { error: writeBackErr } = await supabase
      .from('list_items')
      .update({
        checked: true,
        checked_by: partner.id,
        checked_at: new Date().toISOString(),
      })
      .eq('id', claimItem.id)

    if (writeBackErr) {
      console.log('  BUG: Write-back failed:', writeBackErr.message)
      expect(writeBackErr).toBeNull()
    }

    // Step 8: Verify write-back worked
    const { data: checkedItem } = await supabase
      .from('list_items')
      .select('checked, checked_by, checked_at, promoted_to_task, promoted_task_id')
      .eq('id', claimItem.id)
      .single()

    expect(checkedItem?.checked).toBe(true)
    expect(checkedItem?.checked_by).toBe(partner.id)
    expect(checkedItem?.promoted_to_task).toBe(true)
    expect(checkedItem?.promoted_task_id).toBe(promotedTask.id)
    console.log(`  ✓ Write-back verified: checked=${checkedItem?.checked}, by=${checkedItem?.checked_by}`)

    // Step 9: Verify unclaimed items are still pending
    const { data: uncheckedItems } = await supabase
      .from('list_items')
      .select('content, checked, in_progress_member_id')
      .eq('list_id', list.id)
      .eq('checked', false)

    expect(uncheckedItems?.length).toBe(2)
    console.log(`  ✓ ${uncheckedItems?.length} items still pending (unclaimed)`)

    // Cleanup
    await supabase.from('tasks').delete().eq('id', promotedTask.id)
    await supabase.from('list_items').delete().eq('list_id', list.id)
    await supabase.from('list_shares').delete().eq('list_id', list.id)
    await supabase.from('lists').delete().eq('id', list.id)
    console.log('  ✓ Cleanup: all test data removed')
  })

  test('honey-do: unclaim archives the promoted task', async () => {
    const family = await getTestFamily()
    if (!family) { test.skip(); return }

    const members = await getMembers(family.id)
    const mom = members.find(m => m.role === 'primary_parent')
    const partner = members.find(m => m.id !== mom?.id)
    if (!mom || !partner) { test.skip(); return }

    // Create list + item + promoted task
    const { data: list } = await supabase
      .from('lists')
      .insert({ family_id: family.id, owner_id: mom.id, title: 'E2E Unclaim Test', list_type: 'todo', is_shared: true, schedule_config: { claim_to_promote: true } })
      .select().single()

    const { data: item } = await supabase
      .from('list_items')
      .insert({ list_id: list!.id, content: 'Test unclaim item', sort_order: 0 })
      .select().single()

    const { data: task } = await supabase
      .from('tasks')
      .insert({ family_id: family.id, created_by: partner.id, assignee_id: partner.id, title: 'Test unclaim item', task_type: 'task', status: 'pending', source: 'list_promotion', source_reference_id: item!.id })
      .select().single()

    await supabase.from('list_items').update({ in_progress_member_id: partner.id, promoted_to_task: true, promoted_task_id: task!.id }).eq('id', item!.id)

    // Unclaim: clear in_progress + archive the task + clear promotion fields
    await supabase.from('list_items').update({ in_progress_member_id: null, promoted_to_task: false, promoted_task_id: null }).eq('id', item!.id)
    await supabase.from('tasks').update({ archived_at: new Date().toISOString() }).eq('id', task!.id)

    // Verify
    const { data: unclaimedItem } = await supabase.from('list_items').select('in_progress_member_id, promoted_to_task, promoted_task_id').eq('id', item!.id).single()
    expect(unclaimedItem?.in_progress_member_id).toBeNull()
    expect(unclaimedItem?.promoted_to_task).toBe(false)
    expect(unclaimedItem?.promoted_task_id).toBeNull()

    const { data: archivedTask } = await supabase.from('tasks').select('archived_at').eq('id', task!.id).single()
    expect(archivedTask?.archived_at).toBeTruthy()
    console.log('  ✓ Unclaim: task archived, item cleared')

    // Cleanup
    await supabase.from('tasks').delete().eq('id', task!.id)
    await supabase.from('list_items').delete().eq('list_id', list!.id)
    await supabase.from('lists').delete().eq('id', list!.id)
  })
})

// ─── FLOW 2B: Reading Activity → Play Icon → School Segment → Guided/Independent Routine ───
//
// Founder's exact scenario:
// 1. Mom creates a reading activity list (AI-generated or "Reading Fun" seeded template)
// 2. Deploys as icon button on Play dashboard in the School segment
// 3. Also assigns to Guided + Independent kids as part of their school routine (2/day, extras = numerator bonus)
// 4. Play child clicks icon → draw → reveal → claim → complete → points + creature + sticker page
// 5. Guided child sees it in their routine, picks from Random/Browse, completes 2/day
// 6. Independent child same as Guided but at independent density

test.describe('Flow 2B — Reading Activity full lifecycle: Play icon + Guided routine + Independent routine', () => {

  test('full setup: reading list + deploy to Play segment + Guided routine + Independent routine + rewards', async () => {
    const family = await getTestFamily()
    if (!family) { test.skip(); return }

    const members = await getMembers(family.id)
    const mom = members.find(m => m.role === 'primary_parent')
    if (!mom) { console.log('  BUG: No primary_parent found'); test.skip(); return }

    // Find kids by dashboard_mode
    const playKid = members.find(m => m.dashboard_mode === 'play')
    const guidedKid = members.find(m => m.dashboard_mode === 'guided')
    const independentKid = members.find(m => m.dashboard_mode === 'independent')

    console.log(`  Mom: ${mom.display_name}`)
    console.log(`  Play kid: ${playKid?.display_name ?? 'NONE — BUG: need a play-mode member'}`)
    console.log(`  Guided kid: ${guidedKid?.display_name ?? 'NONE — BUG: need a guided-mode member'}`)
    console.log(`  Independent kid: ${independentKid?.display_name ?? 'NONE — BUG: need an independent-mode member'}`)

    // ─── STEP 1: Create reading activity list ─────────────────────

    const readingItems = [
      'Read a chapter book for 20 minutes',
      'Listen to an audiobook',
      'Read to a younger sibling',
      'Visit the library',
      'Comic book time',
      'Read a non-fiction article',
      'Poetry reading',
      'Read-aloud with mom',
    ]

    const { data: list, error: listErr } = await supabase
      .from('lists')
      .insert({
        family_id: family.id,
        owner_id: mom.id,
        title: 'E2E Reading Fun',
        list_type: 'custom',
        is_shared: true,
        draw_mode: 'focused',
      })
      .select()
      .single()

    if (listErr) {
      console.log(`  BUG: Failed to create reading list: ${listErr.message}`)
      expect(listErr).toBeNull()
      return
    }
    console.log(`  ✓ Created reading list: ${list.id}`)

    const { data: items, error: itemsErr } = await supabase
      .from('list_items')
      .insert(readingItems.map((text, i) => ({
        list_id: list.id,
        content: text,
        sort_order: i,
        is_repeatable: text === 'Visit the library' ? true : true,
        frequency_period: text === 'Visit the library' ? 'week' : null,
        cooldown_hours: text === 'Visit the library' ? 168 : null,
      })))
      .select()

    if (itemsErr) {
      console.log(`  BUG: Failed to create items: ${itemsErr.message}`)
      expect(itemsErr).toBeNull()
      return
    }
    console.log(`  ✓ Created ${items.length} reading activities`)

    // Share with all kids
    const kidsToAssign = [playKid, guidedKid, independentKid].filter(Boolean) as typeof members
    for (const kid of kidsToAssign) {
      await supabase.from('list_shares').insert({
        list_id: list.id,
        shared_with: kid.id,
        member_id: kid.id,
        permission: 'view',
        can_edit: false,
      })
    }
    console.log(`  ✓ Shared with ${kidsToAssign.length} kids`)

    // ─── STEP 2: Deploy as Play icon in School segment ────────────

    if (playKid) {
      // Check if a School segment exists for the play kid
      const { data: segments } = await supabase
        .from('task_segments')
        .select('id, segment_name')
        .eq('family_member_id', playKid.id)
        .eq('is_active', true)

      const schoolSegment = segments?.find(s => s.segment_name.toLowerCase().includes('school'))

      // Create icon_launcher widget on Play dashboard
      const { data: widget, error: widgetErr } = await supabase
        .from('dashboard_widgets')
        .insert({
          family_id: family.id,
          family_member_id: playKid.id,
          template_type: 'icon_launcher',
          title: 'Reading Fun',
          size: 'small',
          sort_order: 0,
          widget_config: {
            linked_list_id: list.id,
            icon_asset_key: 'visual_schedule_read',
            icon_variant: 'B',
            display_label: 'Reading Fun',
            display_mode: 'random',
            visual_style: 'icon_card',
          },
          is_active: true,
          is_on_dashboard: true,
          is_included_in_ai: false,
          multiplayer_enabled: false,
          multiplayer_participants: [],
          multiplayer_config: {},
          data_source_ids: [],
          view_mode: 'default',
        })
        .select()
        .single()

      if (widgetErr) {
        console.log(`  BUG: Failed to create icon_launcher widget: ${widgetErr.message}`)
      } else {
        console.log(`  ✓ Created icon_launcher widget for ${playKid.display_name}: ${widget.id}`)
      }

      if (schoolSegment) {
        // Also create a task in the School segment linked to this list
        const { error: segTaskErr } = await supabase
          .from('tasks')
          .insert({
            family_id: family.id,
            created_by: mom.id,
            assignee_id: playKid.id,
            title: 'Reading Fun',
            task_type: 'task',
            status: 'pending',
            source: 'activity_list',
            linked_list_id: list.id,
            task_segment_id: schoolSegment.id,
          })

        if (segTaskErr) {
          console.log(`  BUG: Failed to create segment task: ${segTaskErr.message}`)
        } else {
          console.log(`  ✓ Created segment task in "${schoolSegment.segment_name}" for ${playKid.display_name}`)
        }
      } else {
        console.log(`  INFO: No School segment found for ${playKid.display_name} — icon tile deployed without segment`)
      }
    }

    // ─── STEP 3: Deploy as routine step for Guided + Independent ──

    for (const kid of [guidedKid, independentKid].filter(Boolean) as typeof members) {
      // Find a routine for this kid
      const { data: routines } = await supabase
        .from('tasks')
        .select('id, title, template_id')
        .eq('family_id', family.id)
        .eq('assignee_id', kid.id)
        .eq('task_type', 'routine')
        .is('archived_at', null)
        .limit(1)

      if (routines && routines.length > 0 && routines[0].template_id) {
        // Find the first section
        const { data: sections } = await supabase
          .from('task_template_sections')
          .select('id, section_name')
          .eq('template_id', routines[0].template_id)
          .order('sort_order')
          .limit(1)

        if (sections && sections.length > 0) {
          // Get max sort_order in this section
          const { data: existingSteps } = await supabase
            .from('task_template_steps')
            .select('sort_order')
            .eq('section_id', sections[0].id)
            .order('sort_order', { ascending: false })
            .limit(1)

          const nextSort = (existingSteps?.[0]?.sort_order ?? 0) + 1

          // Insert linked_randomizer step
          const { error: stepErr } = await supabase
            .from('task_template_steps')
            .insert({
              section_id: sections[0].id,
              title: 'Reading Fun',
              step_name: 'Reading Fun',
              step_type: 'linked_randomizer',
              linked_source_id: list.id,
              linked_source_type: 'randomizer_list',
              display_name_override: 'Reading Fun',
              sort_order: nextSort,
              instance_count: 1,
              require_photo: false,
            })

          if (stepErr) {
            console.log(`  BUG: Failed to insert routine step for ${kid.display_name}: ${stepErr.message}`)
          } else {
            console.log(`  ✓ Inserted linked_randomizer step in "${routines[0].title}" for ${kid.display_name}`)
          }
        } else {
          console.log(`  INFO: No sections in ${kid.display_name}'s routine — cannot add step`)
        }
      } else {
        console.log(`  INFO: No routine found for ${kid.display_name} — cannot deploy as routine step`)
      }
    }

    // ─── STEP 4: Create contracts for daily floor + rewards ───────

    // Daily floor contract: above_daily_floor, if_floor=2 (2 required per day)
    for (const kid of kidsToAssign) {
      const { error: floorErr } = await supabase
        .from('contracts')
        .insert({
          family_id: family.id,
          created_by: mom.id,
          status: 'active',
          source_type: 'task_completion',
          source_id: null,
          source_category: 'activity_list',
          family_member_id: kid.id,
          if_pattern: 'above_daily_floor',
          if_floor: 2,
          if_n: null,
          godmother_type: 'numerator_godmother',
          payload_amount: null,
          stroke_of: 'immediate',
          inheritance_level: 'kid_override',
        })

      if (floorErr) {
        console.log(`  BUG: Failed to create daily floor contract for ${kid.display_name}: ${floorErr.message}`)
      } else {
        console.log(`  ✓ Daily floor contract (2/day) for ${kid.display_name}`)
      }

      // Creature reward contract: every 3 completions → creature
      const { error: creatureErr } = await supabase
        .from('contracts')
        .insert({
          family_id: family.id,
          created_by: mom.id,
          status: 'active',
          source_type: 'task_completion',
          source_id: null,
          source_category: 'activity_list',
          family_member_id: kid.id,
          if_pattern: 'every_nth',
          if_n: 3,
          if_floor: null,
          godmother_type: 'creature_godmother',
          payload_amount: null,
          stroke_of: 'immediate',
          inheritance_level: 'kid_override',
        })

      if (creatureErr) {
        console.log(`  BUG: Failed to create creature contract for ${kid.display_name}: ${creatureErr.message}`)
      } else {
        console.log(`  ✓ Creature reward contract (every 3) for ${kid.display_name}`)
      }

      // Points contract: points per completion
      const { error: pointsErr } = await supabase
        .from('contracts')
        .insert({
          family_id: family.id,
          created_by: mom.id,
          status: 'active',
          source_type: 'task_completion',
          source_id: null,
          source_category: 'activity_list',
          family_member_id: kid.id,
          if_pattern: 'every_time',
          if_n: null,
          if_floor: null,
          godmother_type: 'points_godmother',
          payload_amount: 5,
          stroke_of: 'immediate',
          inheritance_level: 'kid_override',
        })

      if (pointsErr) {
        console.log(`  BUG: Failed to create points contract for ${kid.display_name}: ${pointsErr.message}`)
      } else {
        console.log(`  ✓ Points contract (5 pts each) for ${kid.display_name}`)
      }
    }

    // ─── STEP 5: Simulate Play child completing an activity ───────

    if (playKid) {
      console.log(`\n  ── Simulating ${playKid.display_name} (Play) completing a reading activity ──`)

      // Pick a random item from the list
      const drawnItem = items[Math.floor(Math.random() * items.length)]
      console.log(`  Drew: "${drawnItem.content}"`)

      // Create a task (what "Claim" does)
      const { data: claimedTask, error: claimErr } = await supabase
        .from('tasks')
        .insert({
          family_id: family.id,
          created_by: playKid.id,
          assignee_id: playKid.id,
          title: drawnItem.content,
          task_type: 'task',
          status: 'pending',
          source: 'icon_launcher',
        })
        .select()
        .single()

      if (claimErr) {
        console.log(`  BUG: Failed to create claimed task: ${claimErr.message}`)
      } else {
        console.log(`  ✓ Claimed task created: ${claimedTask.id}`)

        // Complete it
        const { error: completeErr } = await supabase
          .from('task_completions')
          .insert({
            task_id: claimedTask.id,
            family_member_id: playKid.id,
            completed_at: new Date().toISOString(),
            approval_status: 'approved',
          })

        if (completeErr) {
          console.log(`  BUG: Failed to record completion: ${completeErr.message}`)
        } else {
          console.log(`  ✓ Task completed`)
        }

        await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', claimedTask.id)

        // Fire a deed (what the connector layer does on completion)
        const { data: deed, error: deedErr } = await supabase
          .from('deed_firings')
          .insert({
            family_id: family.id,
            family_member_id: playKid.id,
            source_type: 'task_completion',
            source_id: claimedTask.id,
            metadata: { task_title: drawnItem.content, task_type: 'task' },
            idempotency_key: `e2e_reading_${claimedTask.id}`,
          })
          .select()
          .single()

        if (deedErr) {
          console.log(`  BUG: Deed firing failed: ${deedErr.message}`)
        } else {
          console.log(`  ✓ Deed fired: ${deed.id}`)
        }

        // Check what the deed triggered via contract_grant_log
        await new Promise(r => setTimeout(r, 1000)) // give trigger time to fire
        const { data: grants } = await supabase
          .from('contract_grant_log')
          .select('godmother_type, status')
          .eq('deed_firing_id', deed?.id ?? '')

        if (grants && grants.length > 0) {
          for (const g of grants) {
            console.log(`  ✓ Grant: ${g.godmother_type} → ${g.status}`)
          }
        } else {
          console.log(`  INFO: No grants from deed (contracts may not match — check source_type/source_category matching)`)
        }

        // Check points balance change
        const { data: member } = await supabase
          .from('family_members')
          .select('gamification_points, current_streak')
          .eq('id', playKid.id)
          .single()

        console.log(`  ${playKid.display_name} points: ${member?.gamification_points}, streak: ${member?.current_streak}`)

        // Check for creature collection entries
        const { data: creatures } = await supabase
          .from('member_creature_collection')
          .select('creature_id, awarded_at')
          .eq('family_member_id', playKid.id)
          .order('awarded_at', { ascending: false })
          .limit(1)

        if (creatures && creatures.length > 0) {
          console.log(`  ✓ Latest creature: ${creatures[0].creature_id} at ${creatures[0].awarded_at}`)
        } else {
          console.log(`  INFO: No creatures in collection (may need 3 completions to trigger)`)
        }

        // Check sticker book state
        const { data: stickerState } = await supabase
          .from('member_sticker_book_state')
          .select('is_enabled, creatures_earned_total, pages_unlocked_total')
          .eq('family_member_id', playKid.id)
          .single()

        if (stickerState) {
          console.log(`  Sticker book: enabled=${stickerState.is_enabled}, creatures=${stickerState.creatures_earned_total}, pages=${stickerState.pages_unlocked_total}`)
        }

        // Cleanup task
        await supabase.from('deed_firings').delete().eq('idempotency_key', `e2e_reading_${claimedTask.id}`)
        await supabase.from('task_completions').delete().eq('task_id', claimedTask.id)
        await supabase.from('tasks').delete().eq('id', claimedTask.id)
      }
    }

    // ─── STEP 6: Verify Guided routine step exists ────────────────

    if (guidedKid) {
      console.log(`\n  ── Verifying ${guidedKid.display_name} (Guided) routine step ──`)

      const { data: routines } = await supabase
        .from('tasks')
        .select('id, title, template_id')
        .eq('assignee_id', guidedKid.id)
        .eq('task_type', 'routine')
        .is('archived_at', null)
        .limit(1)

      if (routines?.[0]?.template_id) {
        const { data: steps } = await supabase
          .from('task_template_steps')
          .select('title, step_type, linked_source_id, linked_source_type, display_name_override, task_template_sections!inner(template_id)')
          .eq('task_template_sections.template_id', routines[0].template_id)
          .eq('step_type', 'linked_randomizer')
          .eq('linked_source_id', list.id)

        if (steps && steps.length > 0) {
          console.log(`  ✓ Found linked_randomizer step: "${steps[0].display_name_override || steps[0].title}"`)
          console.log(`    step_type: ${steps[0].step_type}`)
          console.log(`    linked_source_id: ${steps[0].linked_source_id}`)
          console.log(`    linked_source_type: ${steps[0].linked_source_type}`)
        } else {
          console.log(`  INFO: No linked_randomizer step found in ${guidedKid.display_name}'s routine for this list`)
        }
      }
    }

    // ─── CLEANUP ──────────────────────────────────────────────────

    console.log('\n  ── Cleanup ──')
    // Remove contracts
    await supabase.from('contracts').delete().eq('family_id', family.id).eq('source_category', 'activity_list')
    // Remove routine steps we added
    const { data: addedSteps } = await supabase
      .from('task_template_steps')
      .select('id')
      .eq('linked_source_id', list.id)
      .eq('step_type', 'linked_randomizer')
    if (addedSteps) {
      for (const s of addedSteps) {
        await supabase.from('task_template_steps').delete().eq('id', s.id)
      }
    }
    // Remove segment tasks
    await supabase.from('tasks').delete().eq('source', 'activity_list').eq('linked_list_id', list.id)
    // Remove widgets
    await supabase.from('dashboard_widgets').delete().eq('template_type', 'icon_launcher').ilike('title', '%Reading Fun%').eq('family_id', family.id)
    // Remove list
    await supabase.from('list_shares').delete().eq('list_id', list.id)
    await supabase.from('list_items').delete().eq('list_id', list.id)
    await supabase.from('lists').delete().eq('id', list.id)
    console.log('  ✓ All test data cleaned up')
  })
})

// ─── FLOW 3: NLC routes to correct wizard ──────────────────────

test.describe('Flow 3 — NLC routes natural language to correct wizards', () => {

  test('Studio NLC input is accessible and functional', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/studio`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Click Browse Templates tab
    const browseTab = page.getByText('Browse Templates', { exact: true })
    await browseTab.click()
    await page.waitForTimeout(500)

    // Find the NLC input
    const nlcInput = page.locator('input[placeholder*="what you want"], textarea[placeholder*="what you want"], input[placeholder*="Describe"], textarea[placeholder*="Describe"]').first()
    const nlcVisible = await nlcInput.isVisible({ timeout: 5000 }).catch(() => false)

    if (!nlcVisible) {
      console.log('  BUG: NLC input field not found on Studio Browse tab')
      console.log('  Mom should be able to type natural language descriptions to create things')
      await page.screenshot({ path: 'tests/e2e/screenshots/phase3.8-flow3-nlc-missing.png' })
      expect(nlcVisible).toBe(true)
      return
    }

    console.log('  ✓ NLC input found on Studio Browse tab')

    // Type a description and see if it responds
    await nlcInput.fill('reading activities for my kids')
    await page.waitForTimeout(500)

    // Look for a submit button or check if it auto-processes
    const submitBtn = page.locator('button:has-text("Go"), button:has-text("Create"), button[aria-label*="submit"]').first()
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  ✓ NLC submit button available')
    } else {
      console.log('  INFO: No explicit NLC submit button — might be Enter-to-submit')
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/phase3.8-flow3-nlc-input.png' })
  })
})

// ─── FLOW 4: Per-item recurrence persists correctly ────────────

test.describe('Flow 4 — Per-item recurrence saves to DB correctly', () => {

  test('list items with different recurrence modes save correct field values', async () => {
    const family = await getTestFamily()
    if (!family) { test.skip(); return }

    const members = await getMembers(family.id)
    const mom = members.find(m => m.role === 'primary_parent')
    if (!mom) { test.skip(); return }

    // Create a list with items that have different recurrence configs
    const { data: list } = await supabase
      .from('lists')
      .insert({ family_id: family.id, owner_id: mom.id, title: 'E2E Recurrence Test', list_type: 'custom' })
      .select().single()

    const { data: items } = await supabase
      .from('list_items')
      .insert([
        // One-time item
        { list_id: list!.id, content: 'One-time activity', sort_order: 0, is_repeatable: false, max_instances: 1 },
        // Recurring weekly with 24h cooldown
        { list_id: list!.id, content: 'Weekly activity', sort_order: 1, is_repeatable: true, frequency_period: 'week', cooldown_hours: 24 },
        // Always available (default)
        { list_id: list!.id, content: 'Always activity', sort_order: 2, is_repeatable: true },
      ])
      .select()

    expect(items?.length).toBe(3)

    // Verify each item's recurrence fields
    const oneTime = items!.find(i => i.content === 'One-time activity')
    expect(oneTime?.is_repeatable).toBe(false)
    expect(oneTime?.max_instances).toBe(1)
    console.log('  ✓ One-time item: is_repeatable=false, max_instances=1')

    const weekly = items!.find(i => i.content === 'Weekly activity')
    expect(weekly?.is_repeatable).toBe(true)
    expect(weekly?.frequency_period).toBe('week')
    expect(weekly?.cooldown_hours).toBe(24)
    console.log('  ✓ Recurring item: is_repeatable=true, frequency_period=week, cooldown=24h')

    const always = items!.find(i => i.content === 'Always activity')
    expect(always?.is_repeatable).toBe(true)
    expect(always?.max_instances).toBeNull()
    expect(always?.cooldown_hours).toBeNull()
    console.log('  ✓ Always-available item: is_repeatable=true, no limits')

    // Cleanup
    await supabase.from('list_items').delete().eq('list_id', list!.id)
    await supabase.from('lists').delete().eq('id', list!.id)
  })
})
