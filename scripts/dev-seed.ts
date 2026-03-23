/**
 * Dev Seed Script — creates a test account for local development.
 *
 * Creates:
 * - Auth user: dev@myaimcentral.test / devtest123
 * - Family: "The Testworths"
 * - Family member: "Tenise" as primary_parent
 *
 * Run: npm run dev:seed
 *
 * Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_EMAIL = 'dev@myaimcentral.test'
const TEST_PASSWORD = 'devtest123'
const TEST_DISPLAY_NAME = 'Tenise'
const TEST_FAMILY_NAME = 'The Testworths'
const TEST_LOGIN_NAME = 'testworths'

async function seed() {
  console.log('Creating dev account...\n')

  // 1. Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(u => u.email === TEST_EMAIL)

  let userId: string

  if (existing) {
    console.log(`Auth user already exists: ${TEST_EMAIL}`)
    userId = existing.id
  } else {
    // Create auth user (auto-confirmed, no email verification)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: TEST_DISPLAY_NAME },
    })

    if (authError) {
      console.error('Failed to create auth user:', authError.message)
      process.exit(1)
    }

    userId = authData.user.id
    console.log(`Created auth user: ${TEST_EMAIL} (${userId})`)
  }

  // 2. Check if family exists
  const { data: existingFamily } = await supabase
    .from('families')
    .select('id')
    .eq('primary_parent_id', userId)
    .single()

  let familyId: string

  if (existingFamily) {
    console.log(`Family already exists: ${TEST_FAMILY_NAME}`)
    familyId = existingFamily.id
  } else {
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .insert({
        primary_parent_id: userId,
        family_name: TEST_FAMILY_NAME,
        family_login_name: TEST_LOGIN_NAME,
        family_login_name_lower: TEST_LOGIN_NAME.toLowerCase(),
        is_founding_family: true,
        timezone: 'America/Chicago',
      })
      .select('id')
      .single()

    if (familyError) {
      console.error('Failed to create family:', familyError.message)
      process.exit(1)
    }

    familyId = familyData.id
    console.log(`Created family: ${TEST_FAMILY_NAME} (${familyId})`)
  }

  // 3. Check if family member exists
  const { data: existingMember } = await supabase
    .from('family_members')
    .select('id')
    .eq('user_id', userId)
    .eq('family_id', familyId)
    .single()

  if (existingMember) {
    console.log(`Family member already exists: ${TEST_DISPLAY_NAME}`)
  } else {
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_id: familyId,
        user_id: userId,
        display_name: TEST_DISPLAY_NAME,
        role: 'primary_parent',
        login_method: 'email',
        is_active: true,
      })

    if (memberError) {
      console.error('Failed to create family member:', memberError.message)
      process.exit(1)
    }

    console.log(`Created family member: ${TEST_DISPLAY_NAME} (primary_parent)`)
  }

  console.log('\n--- Dev Account Ready ---')
  console.log(`Email:    ${TEST_EMAIL}`)
  console.log(`Password: ${TEST_PASSWORD}`)
  console.log(`Family:   ${TEST_FAMILY_NAME}`)
  console.log(`Role:     primary_parent (Mom shell)`)
  console.log('\nSign in at: http://localhost:5174/auth/sign-in')
}

seed().catch(console.error)
