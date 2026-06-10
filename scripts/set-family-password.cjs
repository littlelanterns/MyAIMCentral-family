/**
 * set-family-password.cjs — apply the family password from .env.local to Supabase.
 *
 * Usage: npm run family:password
 *
 * Reads from .env.local:
 *   E2E_MOM_EMAIL / E2E_MOM_PASSWORD — mom's account (the family's primary parent)
 *   E2E_FAMILY_PASSWORD              — the family password to set
 *   E2E_FAMILY_LOGIN_NAME            — used only to verify the result end-to-end
 *
 * Security model: this script never writes a hash itself. It signs in as mom
 * and calls the production `set_family_password` RPC, so strength validation
 * and bcrypt hashing happen server-side — exactly the same path as the
 * Settings -> Family Password page. It then verifies via `verify_family_login`
 * (signed out) and reports the member count it gets back.
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// --- minimal .env.local loader (no dotenv dependency) -----------------------
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env.local not found. This script reads credentials from it.')
    process.exit(1)
  }
  const out = {}
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
  }
  return out
}

async function main() {
  const env = loadEnvLocal()

  const url = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY
  const momEmail = env.E2E_MOM_EMAIL
  const momPassword = env.E2E_MOM_PASSWORD
  const familyPassword = env.E2E_FAMILY_PASSWORD
  const familyLoginName = env.E2E_FAMILY_LOGIN_NAME

  const missing = []
  if (!url) missing.push('VITE_SUPABASE_URL')
  if (!anonKey) missing.push('VITE_SUPABASE_ANON_KEY')
  if (!momEmail) missing.push('E2E_MOM_EMAIL')
  if (!momPassword) missing.push('E2E_MOM_PASSWORD')
  if (!familyPassword) missing.push('E2E_FAMILY_PASSWORD')
  if (missing.length) {
    console.error(`ERROR: missing in .env.local: ${missing.join(', ')}`)
    process.exit(1)
  }

  const supabase = createClient(url, anonKey)

  console.log(`Signing in as ${momEmail}...`)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: momEmail,
    password: momPassword,
  })
  if (signInError) {
    console.error(`ERROR: mom sign-in failed: ${signInError.message}`)
    process.exit(1)
  }

  console.log('Setting family password via set_family_password RPC...')
  const { data, error: rpcError } = await supabase.rpc('set_family_password', {
    p_password: familyPassword,
  })
  if (rpcError) {
    console.error(`ERROR: RPC failed: ${rpcError.message}`)
    process.exit(1)
  }
  if (!data || data.success !== true) {
    const reason = data && data.reason
    if (reason === 'weak_password') {
      console.error('ERROR: password too weak — needs 8+ chars with a letter and a number.')
    } else if (reason === 'not_authorized') {
      console.error('ERROR: this account is not a primary parent of any family.')
    } else {
      console.error(`ERROR: set_family_password returned: ${JSON.stringify(data)}`)
    }
    process.exit(1)
  }
  console.log('Family password set.')

  await supabase.auth.signOut()

  if (familyLoginName) {
    console.log(`Verifying family login as a signed-out device (${familyLoginName})...`)
    const anonClient = createClient(url, anonKey)
    const { data: verify, error: verifyError } = await anonClient.rpc('verify_family_login', {
      p_login_name: familyLoginName,
      p_password: familyPassword,
    })
    if (verifyError) {
      console.error(`WARNING: verification call failed: ${verifyError.message}`)
      process.exit(1)
    }
    if (verify && verify.success) {
      console.log(
        `Verified: family "${verify.family_name}" unlocks with this password (${verify.members.length} member tiles).`,
      )
    } else {
      console.error(`WARNING: verification did not succeed: ${JSON.stringify(verify)}`)
      console.error('(Is E2E_FAMILY_LOGIN_NAME the login name for the same family as E2E_MOM_EMAIL?)')
      process.exit(1)
    }
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error('Unexpected failure:', err)
  process.exit(1)
})
