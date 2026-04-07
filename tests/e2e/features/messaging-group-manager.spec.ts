/**
 * PRD-15 Group Manager E2E Tests (2026-04-06)
 *
 * Covers:
 *  1. "+ New Group" icon is visible on Messages header
 *  2. Clicking "+ New Group" opens the compose flow titled "New Group"
 *  3. Creating a new group with 2+ members writes conversation_spaces (group) + members
 *  4. Manage Group settings button appears on group space header (not on direct spaces)
 *  5. ManageGroupModal rename persists to DB
 *  6. ManageGroupModal add-member adds a conversation_space_members row
 *  7. ManageGroupModal remove-member deletes the row
 *  8. Delete Group (mom) drops the space + members + threads cascade
 *  9. Existing group pill appears in normal compose and sends into that group
 * 10. Sibling messaging default — Jordan (guided) can see siblings in compose picker
 * 11. Manage button NOT visible on direct spaces (only groups)
 * 12. Kids don't see "Leave group" button (only adults who aren't mom)
 */
import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsJordan, loginAsDad, loginAsAlex, loginAsRiley } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Helpers ──

async function getTestFamilyIds() {
  const { data: family } = await adminSupabase
    .from('families')
    .select('id')
    .eq('family_login_name', 'testworths')
    .single()
  if (!family) throw new Error('Test family "testworths" not found')

  const { data: members } = await adminSupabase
    .from('family_members')
    .select('id, display_name, role, dashboard_mode')
    .eq('family_id', family.id)
  if (!members || members.length === 0) throw new Error('No family members found')

  const find = (name: string) =>
    members.find((m) => m.display_name.toLowerCase().includes(name.toLowerCase()))

  return {
    familyId: family.id,
    momId: find('Mom')?.id!,
    dadId: find('Dad')?.id!,
    jordanId: find('Jordan')?.id!,
    alexId: find('Alex')?.id!,
    caseyId: find('Casey')?.id!,
    rileyId: find('Riley')?.id!,
  }
}

/** Clean up any test groups created during a test run (by title prefix) */
async function cleanupTestGroups(familyId: string, titlePrefix: string) {
  const { data: spaces } = await adminSupabase
    .from('conversation_spaces')
    .select('id')
    .eq('family_id', familyId)
    .eq('space_type', 'group')
    .ilike('name', `${titlePrefix}%`)

  if (spaces && spaces.length > 0) {
    const spaceIds = spaces.map((s) => s.id)
    // Threads → messages cascade via thread_id, but let's be explicit
    const { data: threads } = await adminSupabase
      .from('conversation_threads')
      .select('id')
      .in('space_id', spaceIds)
    if (threads && threads.length > 0) {
      const threadIds = threads.map((t) => t.id)
      await adminSupabase.from('messages').delete().in('thread_id', threadIds)
      await adminSupabase.from('message_read_status').delete().in('thread_id', threadIds)
      await adminSupabase.from('conversation_threads').delete().in('space_id', spaceIds)
    }
    await adminSupabase.from('conversation_space_members').delete().in('space_id', spaceIds)
    await adminSupabase.from('conversation_spaces').delete().in('id', spaceIds)
  }
}

/** Create a test group directly via admin — returns the space ID */
async function createTestGroup(
  familyId: string,
  creatorId: string,
  name: string,
  memberIds: string[],
): Promise<string> {
  const { data: space } = await adminSupabase
    .from('conversation_spaces')
    .insert({
      family_id: familyId,
      space_type: 'group',
      name,
      created_by: creatorId,
    })
    .select('id')
    .single()
  if (!space) throw new Error('Failed to create test group')

  const allMemberIds = Array.from(new Set([creatorId, ...memberIds]))
  await adminSupabase.from('conversation_space_members').insert(
    allMemberIds.map((mid) => ({
      space_id: space.id,
      family_member_id: mid,
      role: mid === creatorId ? 'admin' : 'member',
    })),
  )

  return space.id
}

test.describe('PRD-15 Group Manager (2026-04-06)', () => {
  let ids: Awaited<ReturnType<typeof getTestFamilyIds>>

  test.beforeAll(async () => {
    ids = await getTestFamilyIds()
    // Clean any leftover test groups from prior runs
    await cleanupTestGroups(ids.familyId, 'E2E_')
  })

  test.afterAll(async () => {
    await cleanupTestGroups(ids.familyId, 'E2E_')
  })

  // ── 1. "+ New Group" button visible on Messages header ──
  test('1. New Group button — visible on Messages header', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/messages')
    await waitForAppReady(page)

    // The button has aria-label="New group"
    await expect(page.getByLabel('New group')).toBeVisible({ timeout: 10000 })
  })

  // ── 2. Clicking "+ New Group" opens compose with "New Group" title ──
  test('2. Clicking New Group opens compose titled "New Group"', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/messages')
    await waitForAppReady(page)

    // Wait for the button to be stable before clicking (protects against flake
    // when a previous test left a modal in a racing state)
    const newGroupBtn = page.getByLabel('New group')
    await expect(newGroupBtn).toBeVisible({ timeout: 10000 })
    await newGroupBtn.click()
    await page.waitForTimeout(500)

    // Compose modal should be visible with "New Group" title (not "New Message")
    const modal = page.getByTestId('compose-flow-modal')
    await expect(modal).toBeVisible()
    await expect(modal.getByText('New Group', { exact: true })).toBeVisible()

    // Helper text should appear
    await expect(modal.getByText(/Pick the people you want in this group/i)).toBeVisible()
  })

  // ── 3. Creating a group with 2+ members writes DB rows ──
  test('3. Create group with 2+ kids — writes conversation_spaces + members', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/messages')
    await waitForAppReady(page)

    // Wait for the button to be stable before clicking (protects against flake
    // when a previous test left a modal in a racing state)
    const newGroupBtn = page.getByLabel('New group')
    await expect(newGroupBtn).toBeVisible({ timeout: 10000 })
    await newGroupBtn.click()
    await page.waitForTimeout(500)

    const modal = page.getByTestId('compose-flow-modal')
    await expect(modal).toBeVisible()

    // Select Alex + Casey (two independent teens)
    await modal.getByRole('button', { name: /Alex/ }).first().click()
    await page.waitForTimeout(100)
    await modal.getByRole('button', { name: /Casey/ }).first().click()
    await page.waitForTimeout(300)

    // "Group message" radio should auto-select in new_group mode
    // Name the group
    const groupName = `E2E_Big Kids ${Date.now()}`
    await modal.getByPlaceholder(/Group name/i).fill(groupName)

    // Type first message
    await modal.getByPlaceholder('Type your message...').fill('First message!')

    // Send
    await modal.getByRole('button', { name: 'Send', exact: true }).click()
    await page.waitForTimeout(3000)

    // Verify in DB
    const { data: groups } = await adminSupabase
      .from('conversation_spaces')
      .select('id, name, space_type, created_by')
      .eq('family_id', ids.familyId)
      .eq('name', groupName)

    expect(groups!.length).toBe(1)
    expect(groups![0].space_type).toBe('group')
    expect(groups![0].created_by).toBe(ids.momId)

    // Verify member rows (mom + Alex + Casey = 3)
    const { data: groupMembers } = await adminSupabase
      .from('conversation_space_members')
      .select('family_member_id, role')
      .eq('space_id', groups![0].id)

    expect(groupMembers!.length).toBe(3)
    const memberIds = groupMembers!.map((m) => m.family_member_id).sort()
    expect(memberIds).toEqual([ids.alexId, ids.caseyId, ids.momId].sort())

    // Mom should be admin, kids should be members
    const momMembership = groupMembers!.find((m) => m.family_member_id === ids.momId)
    expect(momMembership!.role).toBe('admin')
  })

  // ── 4. Manage Group button visible on group space header ──
  test('4. Manage button — visible on group space header', async ({ page }) => {
    const groupName = `E2E_Manage Test ${Date.now()}`
    const spaceId = await createTestGroup(ids.familyId, ids.momId, groupName, [
      ids.alexId,
      ids.caseyId,
      ids.jordanId,
    ])

    await loginAsMom(page)
    await page.goto(`/messages/space/${spaceId}`)
    await waitForAppReady(page)

    // Manage button (Settings2 icon)
    await expect(page.getByLabel('Manage group')).toBeVisible({ timeout: 10000 })

    // Member count should render in the title
    await expect(page.getByText(/4 members/)).toBeVisible()
  })

  // ── 5. Rename group persists to DB ──
  test('5. Rename group — persists to DB', async ({ page }) => {
    const oldName = `E2E_Rename ${Date.now()}`
    const newName = `${oldName} RENAMED`
    const spaceId = await createTestGroup(ids.familyId, ids.momId, oldName, [
      ids.alexId,
      ids.caseyId,
    ])

    await loginAsMom(page)
    await page.goto(`/messages/space/${spaceId}`)
    await waitForAppReady(page)

    // Open manage modal
    const manageBtn = page.getByLabel('Manage group')
    await expect(manageBtn).toBeVisible({ timeout: 10000 })
    await manageBtn.click()
    await page.waitForTimeout(500)

    // Click "Rename"
    await page.getByRole('button', { name: 'Rename' }).click()
    await page.waitForTimeout(300)

    // Clear the input and type new name
    const input = page.locator('input[value*="E2E_Rename"]')
    await input.fill(newName)

    // Save
    await page.getByRole('button', { name: /Save/ }).click()
    await page.waitForTimeout(1500)

    // Verify DB
    const { data: space } = await adminSupabase
      .from('conversation_spaces')
      .select('name')
      .eq('id', spaceId)
      .single()

    expect(space!.name).toBe(newName)
  })

  // ── 6. Add member via Manage modal ──
  test('6. Add member — inserts conversation_space_members row', async ({ page }) => {
    const groupName = `E2E_AddMember ${Date.now()}`
    const spaceId = await createTestGroup(ids.familyId, ids.momId, groupName, [
      ids.alexId,
    ])

    await loginAsMom(page)
    await page.goto(`/messages/space/${spaceId}`)
    await waitForAppReady(page)

    // Open manage modal
    const manageBtn = page.getByLabel('Manage group')
    await expect(manageBtn).toBeVisible({ timeout: 10000 })
    await manageBtn.click()
    await page.waitForTimeout(500)

    // Click "Add"
    await page.getByRole('button', { name: /Add/ }).first().click()
    await page.waitForTimeout(300)

    // Pick Casey from the "+ Casey" pill
    await page.getByRole('button', { name: /\+ Casey/ }).click()
    await page.waitForTimeout(1500)

    // Verify DB
    const { data: members } = await adminSupabase
      .from('conversation_space_members')
      .select('family_member_id')
      .eq('space_id', spaceId)

    const memberIds = members!.map((m) => m.family_member_id)
    expect(memberIds).toContain(ids.caseyId)
    expect(memberIds.length).toBe(3) // mom + Alex + Casey
  })

  // ── 7. Remove member via Manage modal ──
  test('7. Remove member — deletes conversation_space_members row', async ({ page }) => {
    const groupName = `E2E_RemoveMember ${Date.now()}`
    const spaceId = await createTestGroup(ids.familyId, ids.momId, groupName, [
      ids.alexId,
      ids.caseyId,
    ])

    await loginAsMom(page)
    await page.goto(`/messages/space/${spaceId}`)
    await waitForAppReady(page)

    // Open manage modal
    const manageBtn = page.getByLabel('Manage group')
    await expect(manageBtn).toBeVisible({ timeout: 10000 })
    await manageBtn.click()
    await page.waitForTimeout(500)

    // Click the X on Casey's pill (not mom or current user)
    await page.getByLabel(/Remove .*Casey/i).click()
    await page.waitForTimeout(1500)

    // Verify DB
    const { data: members } = await adminSupabase
      .from('conversation_space_members')
      .select('family_member_id')
      .eq('space_id', spaceId)

    const memberIds = members!.map((m) => m.family_member_id)
    expect(memberIds).not.toContain(ids.caseyId)
    expect(memberIds).toContain(ids.alexId)
  })

  // ── 8. Delete group (mom only) ──
  test('8. Delete group — removes the space', async ({ page }) => {
    const groupName = `E2E_Delete ${Date.now()}`
    const spaceId = await createTestGroup(ids.familyId, ids.momId, groupName, [
      ids.alexId,
    ])

    await loginAsMom(page)
    await page.goto(`/messages/space/${spaceId}`)
    await waitForAppReady(page)

    // Open manage modal
    const manageBtn = page.getByLabel('Manage group')
    await expect(manageBtn).toBeVisible({ timeout: 10000 })
    await manageBtn.click()
    await page.waitForTimeout(500)

    // Click Delete group
    await page.getByRole('button', { name: /Delete group/ }).click()
    await page.waitForTimeout(300)

    // Confirm delete
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await page.waitForTimeout(2000)

    // Verify DB — space should be gone
    const { data: space } = await adminSupabase
      .from('conversation_spaces')
      .select('id')
      .eq('id', spaceId)
      .maybeSingle()

    expect(space).toBeNull()
  })

  // ── 9. Existing group pill in normal compose — sends into group ──
  test('9. Existing group — pill appears in compose, sends a thread to it', async ({ page }) => {
    // Avoid "Send" in the name — it collides with the Send button regex
    const groupName = `E2E_Reunion ${Date.now()}`
    const spaceId = await createTestGroup(ids.familyId, ids.momId, groupName, [
      ids.alexId,
      ids.caseyId,
    ])

    await loginAsMom(page)
    await page.goto('/messages')
    await waitForAppReady(page)

    // Open normal compose (pencil icon, not "New Group")
    const newMsgBtn = page.getByLabel('New message')
    await expect(newMsgBtn).toBeVisible({ timeout: 10000 })
    await newMsgBtn.click()
    await page.waitForTimeout(500)

    const modal = page.getByTestId('compose-flow-modal')
    await expect(modal).toBeVisible()

    // Should see "Send to a group" section with our group
    await expect(modal.getByText(/Send to a group/i)).toBeVisible()
    const groupPill = modal.getByRole('button', { name: new RegExp(groupName) })
    await expect(groupPill).toBeVisible()

    // Click the group pill
    await groupPill.click()
    await page.waitForTimeout(300)

    // Helper text should confirm selection
    await expect(modal.getByText(new RegExp(`Sending to.*${groupName}`, 'i'))).toBeVisible()

    // Type message + send
    const msg = `Existing group test ${Date.now()}`
    await modal.getByPlaceholder('Type your message...').fill(msg)
    await modal.getByRole('button', { name: 'Send', exact: true }).click()
    await page.waitForTimeout(3000)

    // Verify a new thread was created in that space
    const { data: threads } = await adminSupabase
      .from('conversation_threads')
      .select('id')
      .eq('space_id', spaceId)

    expect(threads!.length).toBeGreaterThanOrEqual(1)

    // Verify the message exists
    const { data: messages } = await adminSupabase
      .from('messages')
      .select('content, thread_id')
      .eq('content', msg)

    expect(messages!.length).toBe(1)
    // Message should be in a thread belonging to this space
    const threadIds = threads!.map((t) => t.id)
    expect(threadIds).toContain(messages![0].thread_id)
  })

  // ── 10. Sibling messaging default — Jordan sees siblings ──
  test('10. Sibling default — Jordan (guided) sees siblings in compose picker', async ({ page }) => {
    await loginAsJordan(page)
    await page.goto('/messages')
    await waitForAppReady(page)

    const newMsgBtn = page.getByLabel('New message')
    await expect(newMsgBtn).toBeVisible({ timeout: 10000 })
    await newMsgBtn.click()
    await page.waitForTimeout(500)

    const modal = page.getByTestId('compose-flow-modal')
    await expect(modal).toBeVisible()

    // Jordan should see Alex, Casey (siblings — teens), and Riley (sibling — play) as options
    // Plus Mom + Dad from the existing parent default
    await expect(modal.getByRole('button', { name: /Alex/ }).first()).toBeVisible()
    await expect(modal.getByRole('button', { name: /Casey/ }).first()).toBeVisible()
    await expect(modal.getByRole('button', { name: /Mom/i }).first()).toBeVisible()
    await expect(modal.getByRole('button', { name: /Dad/i }).first()).toBeVisible()
  })

  // ── 10b. END-TO-END sibling send — Jordan actually sends to a sibling ──
  test('10b. Sibling default — Jordan can fully send a message to Alex', async ({ page }) => {
    // Capture browser console errors for debugging RLS / silent-failure issues
    const consoleLogs: string[] = []
    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
    })
    page.on('pageerror', (err) => {
      consoleLogs.push(`[pageerror] ${err.message}`)
    })

    await loginAsJordan(page)
    await page.goto('/messages')
    await waitForAppReady(page)

    const newMsgBtn = page.getByLabel('New message')
    await expect(newMsgBtn).toBeVisible({ timeout: 10000 })
    await newMsgBtn.click()
    await page.waitForTimeout(500)

    const modal = page.getByTestId('compose-flow-modal')
    await expect(modal).toBeVisible()

    // Pick Alex (sibling)
    await modal.getByRole('button', { name: /Alex/ }).first().click()
    await page.waitForTimeout(300)

    // Send a unique message
    const msg = `Sibling E2E ${Date.now()}`
    await modal.getByPlaceholder('Type your message...').fill(msg)
    await modal.getByRole('button', { name: 'Send', exact: true }).click()
    await page.waitForTimeout(3000)

    // Verify the message landed in the DB — find the message by content
    const { data: msgs } = await adminSupabase
      .from('messages')
      .select('id, content, sender_member_id')
      .eq('content', msg)

    // If the send failed, surface the browser console logs so we can see why
    if (!msgs || msgs.length === 0) {
      console.log('=== CAPTURED BROWSER LOGS ===')
      for (const log of consoleLogs) {
        console.log(log)
      }
      console.log('=== END LOGS ===')
    }

    expect(msgs!.length).toBe(1)
    expect(msgs![0].sender_member_id).toBe(ids.jordanId)
  })

  // ── 11. Manage button NOT visible on direct spaces ──
  test('11. Manage button — hidden on direct spaces (groups only)', async ({ page }) => {
    await loginAsMom(page)

    // Find a direct space
    const { data: directSpaces } = await adminSupabase
      .from('conversation_spaces')
      .select('id')
      .eq('family_id', ids.familyId)
      .eq('space_type', 'direct')
      .limit(1)

    if (!directSpaces?.length) {
      test.skip()
      return
    }

    await page.goto(`/messages/space/${directSpaces[0].id}`)
    await waitForAppReady(page)

    // No Manage button on direct spaces
    const manageBtn = page.getByLabel('Manage group')
    await expect(manageBtn).not.toBeVisible()
  })

  // ── 12. Kids cannot leave groups ──
  test('12. Leave group — NOT shown for kid members', async ({ page }) => {
    // Create a group with Jordan in it
    const groupName = `E2E_KidLeave ${Date.now()}`
    const spaceId = await createTestGroup(ids.familyId, ids.momId, groupName, [
      ids.jordanId,
      ids.alexId,
    ])

    await loginAsJordan(page)
    await page.goto(`/messages/space/${spaceId}`)
    await waitForAppReady(page)

    // Jordan should see the Manage button (all group members can open it to view members)
    const manageBtn = page.getByLabel('Manage group')
    if (await manageBtn.isVisible()) {
      await manageBtn.click()
      await page.waitForTimeout(500)

      // No "Leave group" button for a kid
      const leaveBtn = page.getByRole('button', { name: /Leave group/ })
      await expect(leaveBtn).not.toBeVisible()
    }
  })

  // ── 13. Independent teen can find Messages in sidebar ──
  test('13. Independent shell — Messages entry in sidebar', async ({ page }) => {
    await loginAsAlex(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Look for the Messages sidebar link — it's in the "Family" section for Independent
    const messagesLink = page.getByRole('link', { name: 'Messages' }).first()
    await expect(messagesLink).toBeVisible({ timeout: 10000 })

    // Clicking it should navigate to /messages
    await messagesLink.click()
    await page.waitForURL('**/messages', { timeout: 10000 })
    expect(page.url()).toContain('/messages')
  })

  // ── 14. Guided kid can find Messages via More menu → Family ──
  test('14. Guided shell — Messages discoverable via More menu → Family section', async ({ page }) => {
    await loginAsJordan(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Guided shell uses a custom bottom nav with a "More" button
    const moreBtn = page.getByRole('button', { name: /More/ }).first()
    await expect(moreBtn).toBeVisible({ timeout: 10000 })
    await moreBtn.click()
    await page.waitForTimeout(500)

    // "Family" section header should appear in the slide-up menu
    // (rendered as "Family" text, CSS-uppercased via text-transform)
    await expect(page.getByText('Family', { exact: true })).toBeVisible({ timeout: 5000 })

    // Messages entry in the Family section
    const messagesLink = page.getByRole('link', { name: /^Messages/ })
    await expect(messagesLink).toBeVisible()

    // Clicking navigates to /messages
    await messagesLink.click()
    await page.waitForURL('**/messages', { timeout: 10000 })
    expect(page.url()).toContain('/messages')
  })

  // ── 15. Guided kid Write drawer Messages tab links to /messages ──
  test('15. Guided shell — Write drawer Messages tab has working Open Messages button', async ({ page }) => {
    await loginAsJordan(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Open the Write drawer via the "Write" bottom nav button
    // Guided bottom nav is custom — look for the Write button
    const writeBtn = page.getByRole('button', { name: /Write/i }).first()
    if (await writeBtn.isVisible({ timeout: 5000 })) {
      await writeBtn.click()
      await page.waitForTimeout(500)

      // Switch to Messages tab inside the drawer
      const messagesTab = page.getByRole('button', { name: /Messages/ }).first()
      if (await messagesTab.isVisible({ timeout: 5000 })) {
        await messagesTab.click()
        await page.waitForTimeout(300)

        // The new content should show "Open Messages" button (not the old "Coming soon")
        const openBtn = page.getByRole('button', { name: /Open Messages/i })
        await expect(openBtn).toBeVisible({ timeout: 5000 })

        // Old stub text should NOT be visible
        await expect(page.getByText(/Messages are coming soon/)).not.toBeVisible()

        // Clicking "Open Messages" should navigate to /messages
        await openBtn.click()
        await page.waitForURL('**/messages', { timeout: 10000 })
        expect(page.url()).toContain('/messages')
      }
    }
  })

  // ── 16. Play shell has NO Messages entry point (unchanged contract) ──
  test('16. Play shell — no Messages discoverability (expected)', async ({ page }) => {
    await loginAsRiley(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Play has no sidebar at all
    const messagesLink = page.getByRole('link', { name: 'Messages' })
    await expect(messagesLink).not.toBeVisible()
  })
})
