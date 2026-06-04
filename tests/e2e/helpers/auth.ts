/**
 * Authentication helpers for Playwright E2E tests.
 * Logs in as each test family member via the Supabase auth API,
 * then sets the session in the browser via localStorage.
 */
import { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { TEST_USERS } from './seed-testworths-complete'
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

  // App uses a custom storage key (see src/lib/supabase/client.ts)
  const storageKey = 'myaim-auth'
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
  await loginAs(page, TEST_USERS.sarah.email, TEST_USERS.sarah.password, 'mom')
}

export async function loginAsDad(page: Page): Promise<void> {
  await loginAs(page, TEST_USERS.mark.email, TEST_USERS.mark.password, 'dad')
}

export async function loginAsGrandma(page: Page): Promise<void> {
  await loginAs(
    page,
    TEST_USERS.amy.email,
    TEST_USERS.amy.password,
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
    TEST_USERS.ruthie.email,
    TEST_USERS.ruthie.password,
    'riley'
  )
}

// ─── Real founder-family helpers (View As Identity-Scope build, Worker 5D) ───
// These authenticate against the REAL founder family (mom = the live Supabase
// account) and drive the Family Hub kid-PIN flow. Used by the two
// view_as_sessions.origin smoke tests that verify both write paths in
// production. Credentials live in .env.local (gitignored).

/**
 * Log in as the real founder (mom) account via Supabase auth.
 * Sibling to loginAsMom (which uses the Sarah test family).
 */
export async function loginAsMomReal(page: Page): Promise<void> {
  const email = process.env.E2E_MOM_EMAIL
  const password = process.env.E2E_MOM_PASSWORD
  if (!email || !password) {
    throw new Error(
      'Missing E2E_MOM_EMAIL or E2E_MOM_PASSWORD in .env.local — ' +
        'required by loginAsMomReal for the view_as_sessions.origin smoke tests.'
    )
  }
  await loginAs(page, email, password, 'mom-real')
}

/**
 * Drive the Family Hub kid-PIN flow as the currently-authenticated mom.
 *
 * Navigates to /hub (if not already there), opens the member-access card
 * matching `memberName`, types `pin` into the HubMemberAuthModal, and waits
 * for the ViewAsModal (banner) to mount. On return, the View-As modal is
 * layered over /hub with origin='member_session'.
 *
 * Selectors (verified against FamilyHub.tsx / HubMemberAuthModal.tsx / PullTab.tsx):
 *   - getByRole('button', { name: /family member drawer/i }) — the left-edge
 *     pull tab that opens the member drawer (standalone /hub uses a slide-in
 *     <aside>, NOT an inline section)
 *   - aside button containing the member's full display name — the member row
 *   - [data-testid="hub-pin-input"] / [data-testid="hub-pin-submit"] — PIN form
 *
 * Completion signal: the PIN modal closes (hub-pin-input detaches) once
 * startViewAs() fires and the auth modal's onClose runs. The View-As modal
 * itself mounts only briefly here (see the spec note on the modal auto-closing
 * when the target shell differs from mom's), so the PIN-input detach is the
 * reliable signal that the member_session row was created.
 */
export async function hubPinLogin(
  page: Page,
  memberName: string,
  pin: string
): Promise<void> {
  if (!page.url().includes('/hub')) {
    await page.goto('/hub')
  }
  await page.waitForLoadState('networkidle')

  // Dismiss the first-visit onboarding card if it's covering the hub.
  const gotIt = page.getByText('Got it')
  if (await gotIt.isVisible().catch(() => false)) {
    await gotIt.click()
  }

  // Open the member drawer via the left-edge pull tab.
  const drawerTab = page.getByRole('button', { name: /family member drawer/i })
  await drawerTab.waitFor({ state: 'visible', timeout: 15000 })
  await drawerTab.click()

  // The drawer (<aside>) lists each member as a button labelled with their name.
  const memberBtn = page.locator('aside button').filter({ hasText: memberName })
  await memberBtn.first().click()

  // PIN-protected member → the modal renders the PIN form.
  const pinInput = page.locator('[data-testid="hub-pin-input"]')
  await pinInput.waitFor({ state: 'visible', timeout: 10000 })
  await pinInput.fill(pin)
  await page.locator('[data-testid="hub-pin-submit"]').click()

  // Completion signal: PIN modal closes once startViewAs() + onClose run.
  await pinInput.waitFor({ state: 'detached', timeout: 15000 })
}

// ─── Admin-only test helper (SCOPE-2.F48) ────────────────────────────────────
// DO NOT expand beyond admin-shell tests. This bypasses real Supabase auth
// by writing a synthetic session to localStorage — it does NOT create an
// auth.users row, and any DB call the test page makes with this session will
// fail RLS. Use ONLY for tests that exercise the SUPER_ADMIN_EMAILS code path
// in useIsAdmin (short-circuits before any DB query).

const TEST_ALLOWED_SUPER_ADMIN_EMAILS = [
  'tenisewertman@gmail.com',
]

export async function injectSuperAdminSession(
  page: Page,
  email: string
): Promise<void> {
  if (!TEST_ALLOWED_SUPER_ADMIN_EMAILS.includes(email)) {
    throw new Error(
      `injectSuperAdminSession: "${email}" not in test-safe allowlist. ` +
        `Expand TEST_ALLOWED_SUPER_ADMIN_EMAILS in tests/e2e/helpers/auth.ts ` +
        `only when you deliberately intend to bypass real auth for this email.`
    )
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const expiresAt = nowSeconds + 3600 // 1 hour

  const syntheticSession = {
    access_token: 'test-synthetic-access-token-admin-shell-spec',
    refresh_token: 'test-synthetic-refresh-token-admin-shell-spec',
    expires_at: expiresAt,
    expires_in: 3600,
    token_type: 'bearer',
    type: 'access',
    user: {
      id: '00000000-0000-0000-0000-000000000000',
      email,
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: new Date(nowSeconds * 1000).toISOString(),
    },
  }

  const storageKey = 'myaim-auth'
  const storageValue = JSON.stringify(syntheticSession)

  // Navigate to base URL so localStorage is scoped to the app origin.
  await page.goto('/')

  await page.evaluate(
    ([key, value]) => {
      localStorage.setItem(key, value)
    },
    [storageKey, storageValue]
  )

  // Reload so the Supabase client initializes with the injected session and
  // fires INITIAL_SESSION → useAuth picks up the user.
  await page.reload()
  await page.waitForLoadState('networkidle')
}
