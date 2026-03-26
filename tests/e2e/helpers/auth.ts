/**
 * Authentication helpers for Playwright E2E tests.
 * Logs in as each test family member via the Supabase auth API,
 * then sets the session in the browser via localStorage.
 */
import { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { TEST_USERS } from './seed-family'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

// Cache directory for auth state
const AUTH_CACHE_DIR = path.join(process.cwd(), 'tests', 'e2e', '.auth')

// Ensure cache directory exists
if (!fs.existsSync(AUTH_CACHE_DIR)) {
  fs.mkdirSync(AUTH_CACHE_DIR, { recursive: true })
}

/**
 * Authenticate via Supabase API and inject the session into the browser.
 * Caches auth state to avoid repeated logins.
 */
async function loginAs(
  page: Page,
  email: string,
  password: string,
  cacheKey: string
): Promise<void> {
  const cachePath = path.join(AUTH_CACHE_DIR, `${cacheKey}.json`)

  // Check if we have a cached session that's still valid
  if (fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
    const expiresAt = cached.expires_at * 1000 // Convert to ms
    if (Date.now() < expiresAt - 60000) {
      // Still valid with 1 minute buffer
      await injectSession(page, cached)
      return
    }
  }

  // Get fresh session via Supabase auth
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.session) {
    throw new Error(
      `Failed to login as ${email}: ${error?.message || 'No session returned'}`
    )
  }

  // Cache the session
  fs.writeFileSync(cachePath, JSON.stringify(data.session))

  // Inject into browser
  await injectSession(page, data.session)
}

/**
 * Inject a Supabase session into the browser's localStorage
 * so the app picks it up on page load.
 */
async function injectSession(
  page: Page,
  session: {
    access_token: string
    refresh_token: string
    expires_at?: number
    expires_in?: number
    user: { id: string; email?: string }
  }
): Promise<void> {
  // Navigate to the base URL first to set localStorage on the right origin
  await page.goto('/')

  // Supabase stores session in localStorage with a specific key pattern
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
  const storageValue = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in || 3600,
    token_type: 'bearer',
    type: 'access',
    user: session.user,
  })

  await page.evaluate(
    ([key, value]) => {
      localStorage.setItem(key, value)
    },
    [storageKey, storageValue]
  )

  // Reload to pick up the session
  await page.reload()
  await page.waitForLoadState('networkidle')
}

// Public login functions for each test role

export async function loginAsMom(page: Page): Promise<void> {
  await loginAs(page, TEST_USERS.mom.email, TEST_USERS.mom.password, 'mom')
}

export async function loginAsDad(page: Page): Promise<void> {
  await loginAs(page, TEST_USERS.dad.email, TEST_USERS.dad.password, 'dad')
}

export async function loginAsGrandma(page: Page): Promise<void> {
  await loginAs(
    page,
    TEST_USERS.grandma.email,
    TEST_USERS.grandma.password,
    'grandma'
  )
}

export async function loginAsAlex(page: Page): Promise<void> {
  await loginAs(page, TEST_USERS.alex.email, TEST_USERS.alex.password, 'alex')
}

export async function loginAsCasey(page: Page): Promise<void> {
  await loginAs(
    page,
    TEST_USERS.casey.email,
    TEST_USERS.casey.password,
    'casey'
  )
}

export async function loginAsJordan(page: Page): Promise<void> {
  await loginAs(
    page,
    TEST_USERS.jordan.email,
    TEST_USERS.jordan.password,
    'jordan'
  )
}

export async function loginAsRiley(page: Page): Promise<void> {
  await loginAs(
    page,
    TEST_USERS.riley.email,
    TEST_USERS.riley.password,
    'riley'
  )
}
