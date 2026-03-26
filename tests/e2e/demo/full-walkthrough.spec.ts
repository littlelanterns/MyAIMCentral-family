/**
 * MyAIM Family — Full Demo Walkthrough
 *
 * Playwright script that walks through the entire app as Sarah Testworth,
 * typing real inputs, waiting for AI responses, demonstrating every built feature.
 *
 * Run: npx playwright test tests/e2e/demo/full-walkthrough.spec.ts --headed --project=chromium
 * Video output: test-results/ directory (configured via video: 'on')
 *
 * Target: 3-4 minutes of app footage for Vibeathon demo video.
 * LiLa voiceover will be added in post via HeyGen.
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

const DEMO_USERS = {
  sarah: { email: 'testmom@testworths.com', password: 'TestPassword123!' },
  ruthie: { email: 'ruthietest@testworths.com', password: 'TestPassword123!' },
}

// ── Test Configuration ──────────────────────────────────────────

test.use({
  launchOptions: { slowMo: 800 },
  video: 'on',
  viewport: { width: 1280, height: 720 },
})

// ── Auth Helper ─────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`Login failed: ${error?.message}`)

  await page.goto('/')
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
  await page.evaluate(([key, val]) => localStorage.setItem(key, val), [
    storageKey,
    JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      expires_in: data.session.expires_in || 3600,
      token_type: 'bearer',
      type: 'access',
      user: data.session.user,
    }),
  ])

  // Dismiss the intro tour so it doesn't interfere with the demo
  await page.evaluate(() => {
    localStorage.setItem('myaim_intro_tour_dismissed', String(Date.now()))
  })

  await page.reload()
  await page.waitForLoadState('networkidle')
}

// ── Caption System ──────────────────────────────────────────────

async function showCaption(page: Page, title: string, subtitle: string) {
  await page.evaluate(({ title, subtitle }) => {
    const existing = document.getElementById('demo-caption')
    if (existing) existing.remove()

    const overlay = document.createElement('div')
    overlay.id = 'demo-caption'
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px 32px;
        background: linear-gradient(180deg, rgba(90,164,51,0.95) 0%, rgba(90,164,51,0.85) 100%);
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
        animation: captionSlideIn 0.4s ease-out;
        backdrop-filter: blur(8px);
      ">
        <div style="font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">${title}</div>
        <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">${subtitle}</div>
      </div>
      <style>
        @keyframes captionSlideIn {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes captionFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      </style>
    `
    document.body.appendChild(overlay)

    setTimeout(() => {
      const el = document.getElementById('demo-caption')
      if (el) {
        el.style.animation = 'captionFadeOut 0.5s ease-out forwards'
        setTimeout(() => el.remove(), 500)
      }
    }, 3000)
  }, { title, subtitle })

  await page.waitForTimeout(1500)
}

/** Remove caption immediately if needed */
async function clearCaption(page: Page) {
  await page.evaluate(() => {
    const el = document.getElementById('demo-caption')
    if (el) el.remove()
  })
}

// ── Main Demo ───────────────────────────────────────────────────

test.describe('MyAIM Family Demo Walkthrough', () => {
  test('Complete platform walkthrough for demo video', async ({ page }) => {
    test.setTimeout(300_000) // 5 minutes max

    // ─────────────────────────────────────────────────────────
    // Scene 1: Login as Sarah (15 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Welcome to MyAIM Family', 'Logging in as Sarah Testworth — mom of 6, managing it all')
    await loginAs(page, DEMO_USERS.sarah.email, DEMO_USERS.sarah.password)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 })

    await showCaption(page, 'The Command Center', 'Five interaction zones — sidebar, QuickTasks, content, Notepad, and LiLa')
    await page.waitForTimeout(3000)

    // ─────────────────────────────────────────────────────────
    // Scene 2: LiLa Chat — Meet the AI (40 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Meet LiLa', 'Your AI companion already knows your family')

    // Click one of the floating LiLa buttons to open the drawer
    // The "Assist" button is the most demo-friendly
    const assistBtn = page.locator('button[title*="Feature guidance"]').first()
    if (await assistBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await assistBtn.click()
    }
    await page.waitForTimeout(1500)

    // Type into the LiLa chat input
    const lilaInput = page.locator('input[placeholder*="mind"], input[placeholder*="learn"], input[placeholder*="issue"]').first()
    await lilaInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})

    if (await lilaInput.isVisible().catch(() => false)) {
      await lilaInput.click()
      await lilaInput.fill('')
      await page.keyboard.type('What can you tell me about each of my children?', { delay: 40 })
      await page.waitForTimeout(500)

      // Send the message
      await page.keyboard.press('Enter')

      // Wait for AI response to render
      await page.waitForTimeout(8000)

      await showCaption(page, 'Human-in-the-Mix', 'Every AI response: Edit, Approve, Regenerate, or Reject')
      await page.waitForTimeout(3000)

      // Try to find and click Approve
      const approveBtn = page.getByRole('button', { name: /Approve/i }).first()
      if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await approveBtn.click()
        await page.waitForTimeout(1000)
      }
    } else {
      // LiLa drawer didn't open — skip gracefully
      await page.waitForTimeout(2000)
    }

    // ─────────────────────────────────────────────────────────
    // Scene 3: Guiding Stars — Set a Value (25 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Guiding Stars', 'Honest declarations about who you\'re choosing to become')

    await page.goto('/guiding-stars')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Click the "Add" button to create a new star
    const addStarBtn = page.locator('button:has-text("Add")').first()
    if (await addStarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addStarBtn.click()
      await page.waitForTimeout(500)

      // Type the declaration in the textarea
      const starTextarea = page.locator('textarea[placeholder*="What guides you"]').first()
      if (await starTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await starTextarea.click()
        await page.keyboard.type(
          'I choose to be fully present with my kids, even when the house is chaos and my to-do list is screaming.',
          { delay: 35 }
        )
        await page.waitForTimeout(1500)

        // Click "Declaration" type chip
        const declarationChip = page.locator('button:has-text("Declaration")').first()
        if (await declarationChip.isVisible({ timeout: 2000 }).catch(() => false)) {
          await declarationChip.click()
        }

        // Click Create
        const createBtn = page.locator('button:has-text("Create")').first()
        if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await createBtn.click()
          await page.waitForTimeout(2000)
        }
      }
    }

    // ─────────────────────────────────────────────────────────
    // Scene 4: Smart Notepad — Capture & Route (35 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Smart Notepad', 'One brain dump becomes three organized outcomes')

    // Click "Quick Note" in QuickTasks to open the Notepad
    const quickNoteBtn = page.locator('button:has-text("Quick Note")').first()
    if (await quickNoteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quickNoteBtn.click()
      await page.waitForTimeout(1000)
    }

    // Type into the notepad's rich text editor
    const notepadEditor = page.locator('[role="textbox"]').first()
    if (await notepadEditor.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notepadEditor.click()
      await page.keyboard.type(
        "Need to schedule Ruthie's OT evaluation for next month. Also, Jordan's science project is due Friday — he needs poster board and markers. And I keep meaning to tell Mark how much I appreciated him chopping wood Saturday morning so I could sleep in.",
        { delay: 30 }
      )
      await page.waitForTimeout(2000)

      await showCaption(page, 'Review & Route', 'LiLa sorts your chaos into the right destinations')

      // Click Review & Route button
      const reviewRouteBtn = page.getByRole('button', { name: /Review.*Route/i }).first()
      if (await reviewRouteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await reviewRouteBtn.click()
        await page.waitForTimeout(5000) // Wait for AI to extract and categorize
      }

      await page.waitForTimeout(3000) // Let viewer see routing suggestions
    } else {
      // Notepad didn't open — continue
      await page.waitForTimeout(2000)
    }

    // ─────────────────────────────────────────────────────────
    // Scene 5: Tasks — Create & Break Down (30 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Tasks + Task Breaker', 'AI turns a vague idea into a complete action plan')

    await page.goto('/tasks?new=1')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // The ?new=1 param should open the task creation modal
    const taskNameInput = page.locator('input[placeholder*="What needs to be done"]').first()
    if (await taskNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await taskNameInput.click()
      await page.keyboard.type("Plan Jordan's birthday party", { delay: 40 })
      await page.waitForTimeout(1000)

      // Save the task
      const saveTaskBtn = page.locator('button:has-text("Save task")').first()
      if (await saveTaskBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveTaskBtn.click()
        await page.waitForTimeout(2000)
      }
    }

    // Demonstrate the task list and views
    await page.waitForTimeout(2000)

    // Try to find and demonstrate Task Breaker on a task
    // Look for a task card with a menu button
    const taskMenu = page.locator('button[title*="More"], button[aria-label*="more"]').first()
    if (await taskMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskMenu.click()
      await page.waitForTimeout(500)

      const breakItDown = page.locator('button:has-text("Break"), [role="menuitem"]:has-text("Break")').first()
      if (await breakItDown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await breakItDown.click()
        await page.waitForTimeout(5000) // Wait for AI decomposition
        await page.waitForTimeout(3000) // Let viewer see the breakdown
      }
    }

    // ─────────────────────────────────────────────────────────
    // Scene 6: Archives — Family Context (45 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Archives', 'LiLa\'s long-term memory — the context engine behind everything')

    await page.goto('/archives')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await showCaption(page, 'Family Context', 'Every preference, allergy, schedule, and personality trait — organized automatically')
    await page.waitForTimeout(3000)

    // Click into a family member's archive to show their context folders
    // Look for member cards/links on the archives page
    const memberLink = page.locator('a:has-text("Ruthie"), button:has-text("Ruthie")').first()
    if (await memberLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await memberLink.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      await showCaption(page, 'Ruthie\'s Archive', 'Down Syndrome, therapy schedule, ISP goals — LiLa knows her as a person')
      await page.waitForTimeout(4000)
    }

    // ─────────────────────────────────────────────────────────
    // Scene 7: Cyrano — Draft a Message (40 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Cyrano', 'AI that knows HOW your partner hears love')

    // Go back to dashboard and launch Cyrano from QuickTasks
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Click the Cyrano pill in QuickTasks
    const cyranoBtn = page.locator('button:has-text("Cyrano")').first()
    if (await cyranoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cyranoBtn.click()
      await page.waitForTimeout(2000)

      // Type into the Cyrano conversation modal
      const cyranoInput = page.locator('input[placeholder*="mind"], input[type="text"], textarea').last()
      if (await cyranoInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cyranoInput.click()
        await page.keyboard.type(
          "Mark spent Saturday morning chopping wood for the fire pit before anyone was awake. I want to thank him — not just for the wood, but for the pattern. He's always doing the physical, behind-the-scenes stuff nobody notices. I want him to feel seen.",
          { delay: 30 }
        )
        await page.waitForTimeout(500)
        await page.keyboard.press('Enter')

        // Wait for AI draft to render
        await page.waitForTimeout(7000)

        await showCaption(page, 'Personalized with Real Context', 'LiLa uses Mark\'s actual personality profile and communication style')
        await page.waitForTimeout(5000)

        // Approve the draft
        const approveMsg = page.getByRole('button', { name: /Approve/i }).first()
        if (await approveMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
          await approveMsg.click()
          await page.waitForTimeout(1000)
        }
      }

      // Close the tool modal
      const closeModal = page.locator('button[aria-label*="close"], button:has(svg.lucide-x)').first()
      if (await closeModal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeModal.click()
      }
    }

    // ─────────────────────────────────────────────────────────
    // Scene 8: ThoughtSift — Perspective Shifter (35 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Perspective Shifter', 'See through your teenager\'s eyes — using THEIR actual personality')
    await page.waitForTimeout(1500)

    // Launch Perspective Shifter via ToolLauncher
    // This is accessible via the LiLa mode switcher or sidebar
    // Try launching directly by evaluating the tool launcher
    await page.evaluate(() => {
      // Try to trigger the tool launcher if available in window context
      const event = new CustomEvent('open-tool', { detail: { mode: 'perspective_shifter' } })
      window.dispatchEvent(event)
    })
    await page.waitForTimeout(2000)

    // Look for the perspective shifter modal/conversation
    const perspInput = page.locator('input[placeholder*="mind"], input[type="text"], textarea').last()
    if (await perspInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await perspInput.click()
      await page.keyboard.type(
        "Alex has been pulling away lately — spending all his time in his room, barely talking at dinner, and when I ask what's wrong he just says 'nothing.' I'm trying not to take it personally but I'm worried.",
        { delay: 30 }
      )
      await page.waitForTimeout(500)
      await page.keyboard.press('Enter')

      // Wait for AI response
      await page.waitForTimeout(8000)

      await showCaption(page, 'Real Context, Real Insight', 'This response uses Alex\'s actual personality profile')
      await page.waitForTimeout(5000)
    } else {
      // Perspective Shifter didn't open — show the concept via caption
      await showCaption(page, 'ThoughtSift', 'Board of Directors, Perspective Shifter, Decision Guide, Mediator, Translator')
      await page.waitForTimeout(3000)
    }

    // ─────────────────────────────────────────────────────────
    // Scene 9: Quick Shell Switch to Ruthie (15 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Five Shells, One Platform', 'Same app, completely different experience for every family member')

    // Sign out
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i }).first()
    if (await signOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signOutBtn.click()
      await page.waitForTimeout(2000)
    } else {
      // Navigate to dashboard where sign out lives
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)
      const signOutBtn2 = page.getByRole('button', { name: /Sign Out/i }).first()
      if (await signOutBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await signOutBtn2.click()
        await page.waitForTimeout(2000)
      }
    }

    // Login as Ruthie
    await loginAs(page, DEMO_USERS.ruthie.email, DEMO_USERS.ruthie.password)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    await showCaption(page, 'Ruthie\'s World', 'A 7-year-old with Down Syndrome gets her own purpose-built experience')
    await page.waitForTimeout(4000)

    // Let the viewer see the completely different Play shell interface
    await page.waitForTimeout(3000)

    // ─────────────────────────────────────────────────────────
    // Closing
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'MyAIM Family', 'Help a mom, help everyone she holds.')
    await page.waitForTimeout(4000)

    await clearCaption(page)
  })
})
