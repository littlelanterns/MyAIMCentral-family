/**
 * MyAIM Family — Full Demo Walkthrough
 *
 * Playwright script that walks through the entire app as Sarah Testworth,
 * typing real inputs, waiting for AI responses, demonstrating every built feature.
 *
 * Run: npx playwright test tests/e2e/demo/full-walkthrough.spec.ts --headed --project=chromium
 * Video output: test-results/ directory (configured via video: 'on')
 *
 * Target: ~4.5 minutes of app footage for Vibeathon demo video.
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
// Brand colors: Deep Teal #2C5D60, Sage Teal #68A395

async function showCaption(page: Page, title: string, subtitle: string, detail?: string) {
  await page.evaluate(({ title, subtitle, detail }) => {
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
        padding: 20px 32px 16px;
        background: linear-gradient(180deg, rgba(44,93,96,0.97) 0%, rgba(104,163,149,0.92) 100%);
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
        animation: captionSlideIn 0.4s ease-out;
        backdrop-filter: blur(8px);
      ">
        <div style="font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">${title}</div>
        <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">${subtitle}</div>
        ${detail ? `<div style="font-size: 12px; opacity: 0.7; margin-top: 6px; font-style: italic; max-width: 700px; text-align: center;">${detail}</div>` : ''}
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
    }, 3500)
  }, { title, subtitle, detail })

  await page.waitForTimeout(1800)
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

    await showCaption(page, 'Welcome to MyAIM Family',
      'Logging in as Sarah Testworth — mom of 6, managing it all',
      'Help a mom, help everyone she holds. That\'s the entire thesis.')
    await loginAs(page, DEMO_USERS.sarah.email, DEMO_USERS.sarah.password)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 })

    await showCaption(page, 'The Command Center',
      'Five interaction zones — sidebar, QuickTasks, main area, Smart Notepad, and LiLa',
      'One codebase, five purpose-built shells. Mom, Dad, Independent Teen, Guided Child, Play Child.')
    await page.waitForTimeout(3000)

    // ─────────────────────────────────────────────────────────
    // Scene 2: LiLa Chat — Meet the AI (40 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Meet LiLa',
      'Your AI companion already knows your family',
      'Context assembly pulls from Archives, InnerWorkings, Guiding Stars, and relationships — before every response.')

    // Click one of the floating LiLa buttons to open the drawer
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

      await showCaption(page, 'Human-in-the-Mix',
        'Edit / Approve / Regenerate / Reject — on every AI output',
        'Not just good UX — it\'s COPPA compliance, ethical AI practice, and legal liability protection built into the architecture.')
      await page.waitForTimeout(3000)

      // Try to find and click Approve
      const approveBtn = page.getByRole('button', { name: /Approve/i }).first()
      if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await approveBtn.click()
        await page.waitForTimeout(1000)
      }
    } else {
      await page.waitForTimeout(2000)
    }

    // ─────────────────────────────────────────────────────────
    // Scene 3: Guiding Stars — Set a Value (25 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Guiding Stars',
      'Honest declarations about who you\'re choosing to become',
      'These feed into every LiLa conversation. Your AI doesn\'t just know your schedule — she knows your values.')

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

    await showCaption(page, 'Smart Notepad',
      'One brain dump becomes three organized outcomes',
      'Capture at 11pm. LiLa sorts by morning. Tasks, calendar events, messages — all routed automatically.')

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

      await showCaption(page, 'Review & Route',
        'AI classifies and routes each item to the right destination',
        'Embedding-first classification handles 90% of items before any LLM call. Cost: ~$0.20/family/month.')

      // Click Review & Route button
      const reviewRouteBtn = page.getByRole('button', { name: /Review.*Route/i }).first()
      if (await reviewRouteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await reviewRouteBtn.click()
        await page.waitForTimeout(5000) // Wait for AI to extract and categorize
      }

      await page.waitForTimeout(3000) // Let viewer see routing suggestions
    } else {
      await page.waitForTimeout(2000)
    }

    // ─────────────────────────────────────────────────────────
    // Scene 5: Tasks — Create & Break Down (30 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Tasks + Task Breaker',
      'AI turns a vague idea into a complete action plan',
      '13 view frameworks, sequential collections for homeschool curriculum, claimable chore opportunities with rewards.')

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

    await page.waitForTimeout(2000)

    // Try to find and demonstrate Task Breaker on a task
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

    await showCaption(page, 'Archives — LiLa\'s Long-Term Memory',
      'The context engine that makes everything personal',
      'This is the unfair advantage. No competitor assembles family context like this. Every interaction gets smarter over time.')

    await page.goto('/archives')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Click into Ruthie's archive to show her context folders
    const memberLink = page.locator('a:has-text("Ruthie"), button:has-text("Ruthie")').first()
    if (await memberLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await memberLink.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      await showCaption(page, 'Real Impact: Disability Families',
        'Therapy schedules, ISP goals, aide coordination — organized automatically',
        'Designed by a mom who writes these reports herself. SDS monthly summaries that took hours now take minutes.')
      await page.waitForTimeout(4000)
    }

    // ─────────────────────────────────────────────────────────
    // Scene 7: Cyrano — Draft a Message (40 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Cyrano',
      'AI that knows HOW your partner hears love',
      'Pulls from Mark\'s InnerWorkings profile — communication style, personality, strengths — to craft words that land.')

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

        await showCaption(page, 'Personalized with Real Context',
          'This message uses Mark\'s actual personality profile and communication style',
          'Multi-model routing via OpenRouter. Sonnet for coaching, Haiku for classification. 9 cost optimization patterns.')
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

    await showCaption(page, 'Perspective Shifter',
      'See through your teenager\'s eyes — using THEIR actual personality',
      'Family-context lenses use real InnerWorkings data. This isn\'t generic advice — it\'s YOUR kid\'s perspective.')
    await page.waitForTimeout(1500)

    // Launch Perspective Shifter via custom event (ToolLauncherProvider listens)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('lila-mode-switch', { detail: { to: 'perspective_shifter' } }))
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

      await showCaption(page, 'Real Context, Real Insight',
        'Alex\'s communication style, processing patterns, and relationship dynamics — all in the response',
        'Semantic context refresh (P9) pulls the most relevant embeddings per-turn. Context stays fresh without resending everything.')
      await page.waitForTimeout(5000)
    } else {
      await showCaption(page, 'ThoughtSift',
        'Board of Directors, Perspective Shifter, Decision Guide, Mediator, Translator',
        'Five thinking tools — each with its own Edge Function, system prompt, and model tier.')
      await page.waitForTimeout(3000)
    }

    // ─────────────────────────────────────────────────────────
    // Scene 9: Quick Shell Switch to Ruthie (15 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Five Shells, One Platform',
      'Same app, completely different experience for every family member',
      'Role-based permissions are architectural, not just settings. Children\'s data is isolated by design.')

    // Sign out
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i }).first()
    if (await signOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signOutBtn.click()
      await page.waitForTimeout(2000)
    } else {
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

    await showCaption(page, 'Ruthie\'s World',
      'A 7-year-old with Down Syndrome gets her own purpose-built experience',
      'Not a stripped-down version of mom\'s app. Purpose-built interface with large targets, celebration focus, parent control.')
    await page.waitForTimeout(4000)

    await page.waitForTimeout(3000)

    // ─────────────────────────────────────────────────────────
    // Scene 10: Under the Hood — Architecture Flash (15 seconds)
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'Under the Hood', 'What powers MyAIM Family')

    // Inject full-screen architecture overlay
    await page.evaluate(() => {
      const existing = document.getElementById('demo-caption')
      if (existing) existing.remove()

      const overlay = document.createElement('div')
      overlay.id = 'demo-architecture'
      overlay.innerHTML = `
        <div style="
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, rgba(44,93,96,0.97) 0%, rgba(104,163,149,0.95) 100%);
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
          padding: 40px;
          animation: captionSlideIn 0.5s ease-out;
        ">
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 32px;">How the AI Actually Works</div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px 48px; max-width: 900px;">
            <div>
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px;">Context Assembly</div>
              <div style="font-size: 13px; opacity: 0.85; line-height: 1.4;">Every response pulls from Guiding Stars, InnerWorkings, Archives, relationships, and semantic search across all embedded tables. pgvector + halfvec(1536) embeddings.</div>
            </div>

            <div>
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px;">Cost: ~$0.20/family/month</div>
              <div style="font-size: 13px; opacity: 0.85; line-height: 1.4;">9 optimization patterns. Embedding-first classification replaces LLM calls for 90% of routine items. On-demand secondary output via action chips.</div>
            </div>

            <div>
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px;">Multi-Model Routing</div>
              <div style="font-size: 13px; opacity: 0.85; line-height: 1.4;">OpenRouter routes to the right model per task. Sonnet for coaching and complex generation. Haiku for classification and quick responses.</div>
            </div>

            <div>
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px;">Human-in-the-Mix</div>
              <div style="font-size: 13px; opacity: 0.85; line-height: 1.4;">Every AI output: Edit / Approve / Regenerate / Reject. Nothing saves without explicit human approval. COPPA compliance by architecture.</div>
            </div>

            <div>
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px;">Five Shells, One Codebase</div>
              <div style="font-size: 13px; opacity: 0.85; line-height: 1.4;">Mom, Dad, Independent Teen, Guided Child, Play Child — each a purpose-built experience. Role-based permissions are architectural. Children's data isolated by design.</div>
            </div>

            <div>
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px;">40+ PRDs, 80+ Database Tables</div>
              <div style="font-size: 13px; opacity: 0.85; line-height: 1.4;">Every feature fully specified before code. Vite + React 19 + TypeScript + Supabase + pgvector. Playwright E2E tests. Built by a homeschooling mom of 9.</div>
            </div>
          </div>

          <div style="margin-top: 32px; font-size: 14px; opacity: 0.7; font-style: italic;">
            Predecessor: StewardShip — a working app actively used by the founder's family of eleven.
          </div>
        </div>
      `
      document.body.appendChild(overlay)
    })

    await page.waitForTimeout(8000) // Hold for 8 seconds — let judges absorb the architecture

    // Clean up architecture overlay
    await page.evaluate(() => {
      const el = document.getElementById('demo-architecture')
      if (el) {
        el.style.animation = 'captionFadeOut 0.8s ease-out forwards'
        setTimeout(() => el.remove(), 800)
      }
    })
    await page.waitForTimeout(1000)

    // ─────────────────────────────────────────────────────────
    // Closing
    // ─────────────────────────────────────────────────────────

    await showCaption(page, 'MyAIM Family',
      'Help a mom, help everyone she holds.',
      'AIMagicforMoms.com — AI Magic for Moms + MyAIM Family')
    await page.waitForTimeout(4000)

    await clearCaption(page)
  })
})
