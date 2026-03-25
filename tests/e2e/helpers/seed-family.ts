/**
 * Seeds "The Testworths" — a test family with every role type.
 * Idempotent: safe to run multiple times.
 * Uses Supabase service role key to bypass RLS.
 *
 * Family members:
 * - Mom (testmom@myaim.test) — primary_parent
 * - Dad (testdad@myaim.test) — additional_adult
 * - Grandma (testgrandma@myaim.test) — special_adult
 * - Alex (15, independent) — LiLa modal access, journal not private
 * - Casey (14, independent) — journal privacy granted
 * - Jordan (10, guided) — lightweight notepad
 * - Riley (5, play)
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
  )
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Test credentials
export const TEST_USERS = {
  mom: { email: 'testmom@myaim.test', password: 'TestPassword123!' },
  dad: { email: 'testdad@myaim.test', password: 'TestPassword123!' },
  grandma: { email: 'testgrandma@myaim.test', password: 'TestPassword123!' },
  alex: { email: 'testalex@myaim.test', password: 'TestPassword123!' },
  casey: { email: 'testcasey@myaim.test', password: 'TestPassword123!' },
  jordan: { email: 'testjordan@myaim.test', password: 'TestPassword123!' },
  riley: { email: 'testriley@myaim.test', password: 'TestPassword123!' },
} as const

// Store IDs after creation for reference in tests
export const TEST_IDS: {
  familyId?: string
  momId?: string
  dadId?: string
  grandmaId?: string
  alexId?: string
  caseyId?: string
  jordanId?: string
  rileyId?: string
  momMemberId?: string
  dadMemberId?: string
  grandmaMemberId?: string
  alexMemberId?: string
  caseyMemberId?: string
  jordanMemberId?: string
  rileyMemberId?: string
} = {}

async function createOrGetAuthUser(
  email: string,
  password: string
): Promise<string> {
  // Try to find existing user first
  const { data: existingUsers } =
    await supabase.auth.admin.listUsers()

  const existing = existingUsers?.users?.find(
    (u) => u.email === email
  )
  if (existing) {
    return existing.id
  }

  // Create new user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    throw new Error(`Failed to create user ${email}: ${error.message}`)
  }

  return data.user.id
}

async function ensureFamily(primaryParentId: string): Promise<string> {
  // Check if test family already exists
  const { data: existing } = await supabase
    .from('families')
    .select('id')
    .eq('family_login_name', 'testworths')
    .single()

  if (existing) {
    return existing.id
  }

  // Create the family
  const { data, error } = await supabase
    .from('families')
    .insert({
      primary_parent_id: primaryParentId,
      family_name: 'The Testworths',
      family_login_name: 'testworths',
      family_login_name_lower: 'testworths',
      timezone: 'America/Chicago',
      setup_completed: true,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create family: ${error.message}`)
  }

  return data.id
}

async function ensureFamilyMember(
  familyId: string,
  userId: string,
  displayName: string,
  role: string,
  extras: Record<string, unknown> = {}
): Promise<string> {
  // Check if member already exists
  const { data: existing } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    return existing.id
  }

  const { data, error } = await supabase
    .from('family_members')
    .insert({
      family_id: familyId,
      user_id: userId,
      display_name: displayName,
      role,
      is_active: true,
      ...extras,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(
      `Failed to create member ${displayName}: ${error.message}`
    )
  }

  return data.id
}

async function seedSampleData(familyId: string) {
  // Only seed if no tasks exist for this family
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('family_id', familyId)
    .limit(1)

  if (existingTasks && existingTasks.length > 0) {
    console.log('  Sample data already exists, skipping...')
    return
  }

  const momMemberId = TEST_IDS.momMemberId!
  const alexMemberId = TEST_IDS.alexMemberId!
  const jordanMemberId = TEST_IDS.jordanMemberId!

  // 3 tasks for Alex
  await supabase.from('tasks').insert([
    {
      family_id: familyId,
      created_by: momMemberId,
      assignee_id: alexMemberId,
      title: 'Complete math homework',
      task_type: 'task',
      status: 'pending',
      priority: 'now',
      source: 'manual',
    },
    {
      family_id: familyId,
      created_by: momMemberId,
      assignee_id: alexMemberId,
      title: 'Clean bedroom',
      task_type: 'task',
      status: 'in_progress',
      priority: 'next',
      source: 'manual',
    },
    {
      family_id: familyId,
      created_by: momMemberId,
      assignee_id: alexMemberId,
      title: 'Read chapter 5',
      task_type: 'task',
      status: 'completed',
      priority: 'optional',
      source: 'manual',
      completed_at: new Date().toISOString(),
    },
  ])

  // 3 tasks for Jordan
  await supabase.from('tasks').insert([
    {
      family_id: familyId,
      created_by: momMemberId,
      assignee_id: jordanMemberId,
      title: 'Practice spelling words',
      task_type: 'task',
      status: 'pending',
      priority: 'now',
      source: 'manual',
    },
    {
      family_id: familyId,
      created_by: momMemberId,
      assignee_id: jordanMemberId,
      title: 'Draw a picture',
      task_type: 'task',
      status: 'pending',
      priority: 'optional',
      source: 'manual',
    },
    {
      family_id: familyId,
      created_by: momMemberId,
      assignee_id: jordanMemberId,
      title: 'Help set the table',
      task_type: 'task',
      status: 'completed',
      priority: 'next',
      source: 'manual',
      completed_at: new Date().toISOString(),
    },
  ])

  // 4 guiding stars for mom (one per entry_type)
  await supabase.from('guiding_stars').insert([
    {
      family_id: familyId,
      member_id: momMemberId,
      content: 'Build a warm, connected family where every member feels seen',
      entry_type: 'value',
      source: 'manual',
    },
    {
      family_id: familyId,
      member_id: momMemberId,
      content: 'I am choosing to respond with patience, even when it is hard',
      entry_type: 'declaration',
      source: 'manual',
    },
    {
      family_id: familyId,
      member_id: momMemberId,
      content: 'Create systems that run themselves so I can be present',
      entry_type: 'vision',
      source: 'manual',
    },
    {
      family_id: familyId,
      member_id: momMemberId,
      content: 'Be still and know that I am God — Psalm 46:10',
      entry_type: 'scripture_quote',
      source: 'manual',
    },
  ])

  // 2 best intentions for mom (one active, one resting)
  await supabase.from('best_intentions').insert([
    {
      family_id: familyId,
      member_id: momMemberId,
      statement: 'I intend to spend 15 focused minutes with each child daily',
      source: 'manual',
      is_active: true,
    },
    {
      family_id: familyId,
      member_id: momMemberId,
      statement: 'Pause and breathe before responding when frustrated',
      source: 'manual',
      is_active: true,
    },
  ])

  // 3 self-knowledge entries for mom
  await supabase.from('self_knowledge').insert([
    {
      family_id: familyId,
      member_id: momMemberId,
      category: 'personality_type',
      content: 'ENFJ — warm, idealistic, organized',
      source_type: 'manual',
    },
    {
      family_id: familyId,
      member_id: momMemberId,
      category: 'strength',
      content: 'Strong verbal communicator — I process by talking things through',
      source_type: 'manual',
    },
    {
      family_id: familyId,
      member_id: momMemberId,
      category: 'growth_area',
      content: 'I tend to overcommit and then feel resentful about it',
      source_type: 'manual',
    },
  ])

  console.log('  Sample data seeded (tasks, guiding stars, best intentions)')
}

export async function seedTestFamily() {
  console.log('  Creating auth users...')

  // Create all auth users
  TEST_IDS.momId = await createOrGetAuthUser(
    TEST_USERS.mom.email,
    TEST_USERS.mom.password
  )
  TEST_IDS.dadId = await createOrGetAuthUser(
    TEST_USERS.dad.email,
    TEST_USERS.dad.password
  )
  TEST_IDS.grandmaId = await createOrGetAuthUser(
    TEST_USERS.grandma.email,
    TEST_USERS.grandma.password
  )
  TEST_IDS.alexId = await createOrGetAuthUser(
    TEST_USERS.alex.email,
    TEST_USERS.alex.password
  )
  TEST_IDS.caseyId = await createOrGetAuthUser(
    TEST_USERS.casey.email,
    TEST_USERS.casey.password
  )
  TEST_IDS.jordanId = await createOrGetAuthUser(
    TEST_USERS.jordan.email,
    TEST_USERS.jordan.password
  )
  TEST_IDS.rileyId = await createOrGetAuthUser(
    TEST_USERS.riley.email,
    TEST_USERS.riley.password
  )

  console.log('  Creating family...')
  TEST_IDS.familyId = await ensureFamily(TEST_IDS.momId)

  console.log('  Creating family members...')

  // Mom — primary parent (no dashboard_mode needed; shell determined by role)
  TEST_IDS.momMemberId = await ensureFamilyMember(
    TEST_IDS.familyId,
    TEST_IDS.momId,
    'Test Mom',
    'primary_parent',
    { dashboard_mode: 'adult' }
  )

  // Dad — additional adult
  TEST_IDS.dadMemberId = await ensureFamilyMember(
    TEST_IDS.familyId,
    TEST_IDS.dadId,
    'Test Dad',
    'additional_adult',
    { dashboard_mode: 'adult' }
  )

  // Grandma — special adult
  TEST_IDS.grandmaMemberId = await ensureFamilyMember(
    TEST_IDS.familyId,
    TEST_IDS.grandmaId,
    'Test Grandma',
    'special_adult',
    { dashboard_mode: 'adult' }
  )

  // Alex — 15yo independent teen
  TEST_IDS.alexMemberId = await ensureFamilyMember(
    TEST_IDS.familyId,
    TEST_IDS.alexId,
    'Alex',
    'member',
    { dashboard_mode: 'independent', age: 15 }
  )

  // Casey — 14yo independent teen with journal privacy
  TEST_IDS.caseyMemberId = await ensureFamilyMember(
    TEST_IDS.familyId,
    TEST_IDS.caseyId,
    'Casey',
    'member',
    { dashboard_mode: 'independent', age: 14 }
  )

  // Jordan — 10yo guided
  TEST_IDS.jordanMemberId = await ensureFamilyMember(
    TEST_IDS.familyId,
    TEST_IDS.jordanId,
    'Jordan',
    'member',
    { dashboard_mode: 'guided', age: 10 }
  )

  // Riley — 5yo play
  TEST_IDS.rileyMemberId = await ensureFamilyMember(
    TEST_IDS.familyId,
    TEST_IDS.rileyId,
    'Riley',
    'member',
    { dashboard_mode: 'play', age: 5 }
  )

  // Seed special adult assignment (grandma → Alex + Jordan)
  const { data: existingAssignments } = await supabase
    .from('special_adult_assignments')
    .select('id')
    .eq('family_id', TEST_IDS.familyId)
    .eq('special_adult_id', TEST_IDS.grandmaMemberId!)
    .limit(1)

  if (!existingAssignments || existingAssignments.length === 0) {
    await supabase.from('special_adult_assignments').insert([
      {
        family_id: TEST_IDS.familyId,
        special_adult_id: TEST_IDS.grandmaMemberId,
        child_id: TEST_IDS.alexMemberId,
      },
      {
        family_id: TEST_IDS.familyId,
        special_adult_id: TEST_IDS.grandmaMemberId,
        child_id: TEST_IDS.jordanMemberId,
      },
    ])
    console.log('  Special adult assignments created (Grandma → Alex, Jordan)')
  }

  console.log('  Seeding sample data...')
  await seedSampleData(TEST_IDS.familyId)
}
