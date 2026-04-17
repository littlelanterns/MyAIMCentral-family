// BookShelf render diagnostic — captures chapter order + tab counts + DOM structure
// for 7 test books as rendered by Test Mom on production.

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

dotenv.config({ path: 'c:/dev/MyAIMCentral-family/MyAIMCentral-family/.env.local' })

const PROD_URL = process.env.DIAG_URL || 'http://localhost:5173'
const OUT_DIR = 'C:/tmp/bookshelf-diagnosis-after-fix'
const TEST_MOM = { email: 'testmom@myaim.test', password: 'TestPassword123!' }

const BOOKS = [
  { label: 'Made to Stick',             id: '37766901-86c1-4f0f-96df-2039e40b16db', type: 'standalone-working' },
  { label: 'Goals',                     id: '12081532-b9ff-45c1-a287-5d87ff8521ba', type: 'standalone-reported-scrambled' },
  { label: 'A House United',            id: '62bad954-e740-4757-957a-dfa69512922e', type: 'multipart-4parts' },
  { label: 'Thou Shall Prosper',        id: 'ab47e344-1386-45df-8192-ea0a3cd430af', type: 'multipart-5parts' },
  { label: 'Bonds That Make Us Free',   id: '59a70b6d-cdcf-4c8b-bb72-2e33e2a3a632', type: 'arbinger-standalone' },
  { label: 'The Outward Mindset',       id: '1312a938-3620-4949-9181-1a0e9dc3cb1f', type: 'arbinger-standalone' },
  { label: 'Dangerous Love',            id: '20a9d3db-732b-48fe-a077-caeea60cc839', type: 'arbinger-standalone' },
]

fs.mkdirSync(OUT_DIR, { recursive: true })

async function main() {
  // 1. Get session via Supabase directly
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data, error } = await supabase.auth.signInWithPassword(TEST_MOM)
  if (error) throw new Error(`Auth failed: ${error.message}`)
  console.log(`[auth] Signed in as ${TEST_MOM.email}, user_id=${data.user.id}`)

  // 2. Launch browser, inject session
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()

  await page.goto(PROD_URL)
  await page.evaluate((session) => {
    localStorage.setItem('myaim-auth', JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in || 3600,
      token_type: 'bearer',
      type: 'access',
      user: session.user,
    }))
  }, data.session)
  await page.reload()
  await page.waitForLoadState('networkidle')
  console.log(`[auth] Session injected. Current URL: ${page.url()}`)

  const results = []

  for (const book of BOOKS) {
    console.log(`\n[book] ${book.label} (${book.type})`)
    try {
      await page.goto(`${PROD_URL}/bookshelf?book=${book.id}`, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(4000) // let extractions settle

      const data = await page.evaluate(() => {
        const out = {
          title: document.querySelector('h1')?.textContent?.trim() || null,
          url: window.location.href,
          extractedBadge: !!document.querySelector('[class*="extract"]'),
          tabs: [],
          sidebarChapters: [],
          mainHeadings: [],
          filters: [],
          hasApiError: !!document.body.textContent?.match(/api error|failed to load|network error/i),
        }

        // Tabs: "Summaries 58", "Insights 33", etc.
        document.querySelectorAll('button').forEach(btn => {
          const t = btn.textContent?.trim() || ''
          if (/^(Summaries|Insights|Declarations|Action Steps|Questions)\s+\d+$/.test(t)) {
            out.tabs.push(t)
          }
        })

        // Sidebar: <aside> with chapter nav buttons
        const aside = document.querySelector('aside')
        if (aside) {
          aside.querySelectorAll('button').forEach(btn => {
            const span = btn.querySelector('span.truncate, span.flex-1')
            const label = span?.textContent?.trim() || btn.textContent?.trim() || ''
            if (label && label !== 'Library' && !/^[\d\s]+$/.test(label)) {
              out.sidebarChapters.push(label)
            }
          })
        }

        // Main headings (chapter titles in content)
        document.querySelectorAll('h2, h3').forEach(h => {
          const t = h.textContent?.trim()
          if (t && t.length > 2 && t.length < 200) out.mainHeadings.push(t)
        })

        // Filter state (All / Hearted / Full / Abridged buttons)
        document.querySelectorAll('button').forEach(btn => {
          const t = btn.textContent?.trim() || ''
          if (/^(All|Hearted|Full|Abridged)$/.test(t)) {
            out.filters.push({ label: t, active: btn.className.includes('primary') || btn.getAttribute('aria-pressed') === 'true' })
          }
        })

        return out
      })

      const screenshotPath = path.join(OUT_DIR, `${book.label.replace(/[^a-z0-9]/gi, '_')}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false })

      const result = { ...book, ...data, screenshot: screenshotPath }
      results.push(result)
      console.log(`  title:    ${data.title}`)
      console.log(`  tabs:     ${data.tabs.join(' | ')}`)
      console.log(`  sidebar (${data.sidebarChapters.length}): ${data.sidebarChapters.slice(0, 6).join(' → ')}${data.sidebarChapters.length > 6 ? ' → ...' : ''}`)
      console.log(`  apiError: ${data.hasApiError}`)
    } catch (e) {
      console.log(`  ERROR: ${e.message}`)
      results.push({ ...book, error: e.message })
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify(results, null, 2))
  console.log(`\nResults written to ${OUT_DIR}/results.json`)

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
