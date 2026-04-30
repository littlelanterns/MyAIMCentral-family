/**
 * Testworth Family Seed — sole Testworth fixture for Playwright + demo
 * =====================================================================
 * Creates "The Testworth Family" with rich data across all features.
 * Idempotent: safe to run multiple times (upsert patterns throughout).
 *
 * CLI (manual run):       npx tsx tests/e2e/helpers/seed-testworths-complete.ts
 * Programmatic (imports): import { seedTestworthFamily, TEST_USERS, TEST_IDS }
 *                                from './seed-testworths-complete'
 * Called by:              tests/e2e/helpers/global-setup.ts (Playwright globalSetup)
 *
 * Family: "The Testworth Family" (login: testworthfamily, password: Demo2026!)
 * Members: Sarah (mom), Mark (dad), Alex (15), Casey (14),
 *          Jordan (10), Ruthie (7), Amy (special adult), Kylie (special adult)
 */
import { basename } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { localIso, todayLocalIso } from './dates'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Configuration ───────────────────────────────────────────────────────────

const FAMILY_LOGIN = 'testworthfamily'
const PASSWORD = 'Demo2026!'

const MEMBERS = {
  sarah: { email: 'testmom@testworths.com', name: 'Sarah', role: 'primary_parent', mode: 'adult', color: '#68a395', age: null },
  mark:  { email: 'testdad@testworths.com', name: 'Mark', role: 'additional_adult', mode: 'adult', color: '#2c5d60', age: null },
  alex:  { email: 'alextest@testworths.com', name: 'Alex', role: 'member', mode: 'independent', color: '#5a4033', age: 15 },
  casey: { email: 'caseytest@testworths.com', name: 'Casey', role: 'member', mode: 'independent', color: '#8b7bb5', age: 14 },
  jordan: { email: 'jordantest@testworths.com', name: 'Jordan', role: 'member', mode: 'guided', color: '#d6a461', age: 10 },
  ruthie: { email: 'ruthietest@testworths.com', name: 'Ruthie', role: 'member', mode: 'play', color: '#f4dcb7', age: 7 },
  amy:   { email: 'amytest@testworths.com', name: 'Amy', role: 'special_adult', mode: 'adult', color: '#4b7c66', age: null },
  kylie: { email: 'kylietest@testworths.com', name: 'Kylie', role: 'special_adult', mode: 'adult', color: '#5aab9a', age: null },
} as const

// Credentials exported for Playwright auth helpers.
// Kylie is omitted — she's not Playwright-facing (no loginAsKylie helper,
// no specs reference her). She still gets created by the seed below.
export const TEST_USERS = {
  sarah:  { email: MEMBERS.sarah.email,  password: PASSWORD },
  mark:   { email: MEMBERS.mark.email,   password: PASSWORD },
  amy:    { email: MEMBERS.amy.email,    password: PASSWORD },
  alex:   { email: MEMBERS.alex.email,   password: PASSWORD },
  casey:  { email: MEMBERS.casey.email,  password: PASSWORD },
  jordan: { email: MEMBERS.jordan.email, password: PASSWORD },
  ruthie: { email: MEMBERS.ruthie.email, password: PASSWORD },
} as const

// IDs populated by seedTestworthFamily() — consumed by feature specs that
// need to query by auth.users.id or family_members.id directly.
// Shape mirrors the old seed-family.ts's TEST_IDS for easy consumer migration.
export const TEST_IDS: {
  familyId?: string
  sarahId?: string;   sarahMemberId?: string
  markId?: string;    markMemberId?: string
  amyId?: string;     amyMemberId?: string
  kylieId?: string;   kylieMemberId?: string
  alexId?: string;    alexMemberId?: string
  caseyId?: string;   caseyMemberId?: string
  jordanId?: string;  jordanMemberId?: string
  ruthieId?: string;  ruthieMemberId?: string
} = {}

// Store IDs after creation
const IDS: Record<string, string> = {}
let familyId = ''
let totalRecords = 0
const tablesCounted = new Set<string>()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function count(table: string, n: number) {
  totalRecords += n
  tablesCounted.add(table)
}

async function createOrGetAuthUser(email: string): Promise<string> {
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(u => u.email === email)
  if (existing) return existing.id

  const { data, error } = await supabase.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
  })
  if (error) throw new Error(`Failed to create user ${email}: ${error.message}`)
  return data.user.id
}

async function ensureMember(
  userId: string, name: string, role: string,
  extras: Record<string, unknown> = {}
): Promise<string> {
  const { data: existing } = await supabase
    .from('family_members').select('id')
    .eq('family_id', familyId).eq('user_id', userId).single()
  if (existing) {
    // Update fields that may have changed
    await supabase.from('family_members').update({
      display_name: name, ...extras,
    }).eq('id', existing.id)
    return existing.id
  }

  const { data, error } = await supabase.from('family_members').insert({
    family_id: familyId, user_id: userId, display_name: name, role,
    is_active: true, ...extras,
  }).select('id').single()
  if (error) throw new Error(`Failed to create member ${name}: ${error.message}`)
  return data.id
}

/** Insert rows, skip if any already exist (check by unique field). */
async function upsertBatch(
  table: string, rows: Record<string, unknown>[],
  checkField: string = 'family_id', checkValue?: string
) {
  if (rows.length === 0) return
  const cv = checkValue ?? familyId
  const { data: existing } = await supabase
    .from(table).select('id').eq(checkField, cv).limit(1)
  if (existing && existing.length > 0) {
    console.log(`  ${table}: data exists, skipping`)
    return
  }
  const { error } = await supabase.from(table).insert(rows)
  if (error) {
    console.error(`  ${table}: INSERT failed — ${error.message}`)
    return
  }
  count(table, rows.length)
  console.log(`  ${table}: ${rows.length} rows inserted`)
}

/** Insert rows unconditionally (for tables where duplicates are OK or have no good check). */
async function insertBatch(table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return
  const { error } = await supabase.from(table).insert(rows)
  if (error) {
    console.error(`  ${table}: INSERT failed — ${error.message}`)
    return
  }
  count(table, rows.length)
  console.log(`  ${table}: ${rows.length} rows inserted`)
}

/** Find a folder by name for a given member (or family overview). */
async function findFolder(folderName: string, memberId?: string): Promise<string | null> {
  let q = supabase.from('archive_folders').select('id')
    .eq('family_id', familyId).eq('folder_name', folderName)
  if (memberId) q = q.eq('member_id', memberId)
  const { data } = await q.limit(1).single()
  return data?.id ?? null
}

/** Check if records exist in a table for this family. */
async function hasData(table: string, extraFilter?: Record<string, string>): Promise<boolean> {
  let q = supabase.from(table).select('id').eq('family_id', familyId)
  if (extraFilter) {
    for (const [k, v] of Object.entries(extraFilter)) q = q.eq(k, v)
  }
  const { data } = await q.limit(1)
  return (data && data.length > 0) || false
}

// ─── Date Helpers ────────────────────────────────────────────────────────────

const NOW = new Date()
const TODAY = todayLocalIso()

function daysAgo(n: number): string {
  const d = new Date(NOW)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function dateOnly(daysBack: number): string {
  const d = new Date(NOW)
  d.setDate(d.getDate() - daysBack)
  return localIso(d)
}

function hoursAgo(h: number): string {
  const d = new Date(NOW)
  d.setHours(d.getHours() - h)
  return d.toISOString()
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 1: FAMILY STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════

async function seedFamilyStructure() {
  console.log('\n── Part 1: Family Structure ──')

  // Create auth users
  console.log('  Creating auth users...')
  for (const [key, m] of Object.entries(MEMBERS)) {
    IDS[`${key}Auth`] = await createOrGetAuthUser(m.email)
  }

  // Ensure family exists
  const { data: existingFamily } = await supabase
    .from('families').select('id')
    .eq('family_login_name', FAMILY_LOGIN).single()

  if (existingFamily) {
    familyId = existingFamily.id
    console.log(`  Family exists: ${familyId}`)
  } else {
    const { data, error } = await supabase.from('families').insert({
      primary_parent_id: IDS.sarahAuth,
      family_name: 'The Testworth Family',
      family_login_name: FAMILY_LOGIN,
      family_login_name_lower: FAMILY_LOGIN.toLowerCase(),
      timezone: 'America/Chicago',
      setup_completed: true,
      is_founding_family: true,
    }).select('id').single()
    if (error) throw new Error(`Family creation failed: ${error.message}`)
    familyId = data.id
    count('families', 1)
    console.log(`  Family created: ${familyId}`)
  }

  // Create members
  console.log('  Creating family members...')
  for (const [key, m] of Object.entries(MEMBERS)) {
    const extras: Record<string, unknown> = {
      dashboard_mode: m.mode,
      member_color: m.color,
    }
    if (m.age) extras.age = m.age
    IDS[key] = await ensureMember(IDS[`${key}Auth`], m.name, m.role, extras)
    console.log(`    ${m.name}: ${IDS[key]}`)
  }

  // Set avatar URLs
  for (const key of Object.keys(MEMBERS)) {
    const avatarUrl = `${supabaseUrl}/storage/v1/object/public/family-avatars/${familyId}/${IDS[key]}`
    await supabase.from('family_members').update({ avatar_url: avatarUrl }).eq('id', IDS[key])
  }

  // Special adult assignments
  const assignments = [
    { special_adult_id: IDS.amy, child_id: IDS.ruthie },
    { special_adult_id: IDS.kylie, child_id: IDS.ruthie },
  ]
  for (const a of assignments) {
    const { data: exists } = await supabase
      .from('special_adult_assignments').select('id')
      .eq('family_id', familyId)
      .eq('special_adult_id', a.special_adult_id)
      .eq('child_id', a.child_id).limit(1)
    if (!exists || exists.length === 0) {
      await supabase.from('special_adult_assignments').insert({
        family_id: familyId, ...a,
      })
      count('special_adult_assignments', 1)
    }
  }
  console.log('  Special adult assignments verified')
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PARTS 2-3, 17: INNERWORKINGS (self_knowledge)
// ═══════════════════════════════════════════════════════════════════════════════

async function seedInnerWorkings() {
  console.log('\n── Parts 2-3, 17: InnerWorkings ──')

  if (await hasData('self_knowledge')) {
    console.log('  self_knowledge: data exists, skipping')
    return
  }

  const entries: Record<string, unknown>[] = []
  const base = { family_id: familyId, is_included_in_ai: true, share_with_mom: true, share_with_dad: false }

  // ── Sarah ──
  const sarahFile = { ...base, member_id: IDS.sarah, source_type: 'upload', source: 'CliftonStrengths Assessment - August 2024' }
  entries.push(
    { ...sarahFile, category: 'personality_type', content: 'CliftonStrengths Top 5: Ideation, Belief, Individualization, Strategic, Empathy. Leads with Strategic Thinking domain.' },
    { ...sarahFile, category: 'personality_type', content: 'Ideation #1 — fascinated by ideas, sees connections others miss, thrives in brainstorming, can overwhelm people with too many ideas at once' },
    { ...sarahFile, category: 'personality_type', content: 'Empathy #5 — feels others\' emotions as if her own, detects conflict early, can get emotionally drained' },
    { ...sarahFile, category: 'trait_tendency', content: 'Processes the world through ideas and connections — needs time to think before communicating or others can\'t follow the dots' },
    { ...sarahFile, category: 'trait_tendency', content: 'Futuristic #10 — lives in tomorrow, can miss the present moment, inspires others with vision' },
    { ...sarahFile, category: 'trait_tendency', content: 'Arranger #7 — both organized AND flexible, reorganizes constantly to find better configurations, can confuse others who want stability' },
    { ...sarahFile, category: 'trait_tendency', content: 'Input #9 — collects information compulsively, can overload others by sharing too much' },
    { ...sarahFile, category: 'strength', content: 'Strategic #4 — quickly spots patterns and alternative paths, makes fast decisions that look like winging it but aren\'t' },
    { ...sarahFile, category: 'strength', content: 'Communication #6 — finds words easily for complex ideas, good presenter and conversationalist' },
    { ...sarahFile, category: 'strength', content: 'Individualization #3 — sees exactly what makes each person unique, brings out the best in people' },
    { ...sarahFile, category: 'strength', content: 'Connectedness #8 — sees everything as linked, few coincidences, helps others find meaning' },
    { ...sarahFile, category: 'growth_area', content: 'Ideation blind spot: limitless ideas can overwhelm — needs to refine and share only the best' },
    { ...sarahFile, category: 'growth_area', content: 'Empathy drain: constantly absorbing others emotions is exhausting — needs to decompress intentionally' },
    { ...sarahFile, category: 'growth_area', content: 'Arranger blind spot: constant reorganizing can make others feel priorities keep changing' },
    { ...sarahFile, category: 'growth_area', content: 'Futuristic blind spot: so focused on tomorrow that she can miss what is right in front of her' },
    { ...sarahFile, category: 'general', content: 'Leads with Strategic Thinking domain' },
    { ...sarahFile, category: 'general', content: 'Belief #2 — core values are unchanging, makes decisions by asking does this align with what I hold to be true — can come across as stubborn' },
  )

  // ── Mark ──
  const markFile = { ...base, member_id: IDS.mark, source_type: 'upload', source: 'CliftonStrengths Assessment - August 2024' }
  entries.push(
    { ...markFile, category: 'personality_type', content: 'CliftonStrengths Top 5: Context, Belief, Connectedness, Learner, Ideation. Leads with Strategic Thinking domain.' },
    { ...markFile, category: 'personality_type', content: 'Context #1 — understands the present by researching the past, invaluable for planning, can seem like he lives in the past to others' },
    { ...markFile, category: 'personality_type', content: 'Woo #9 — loves meeting people and winning them over, makes strangers feel at ease, can move on too quickly for deeper connectors' },
    { ...markFile, category: 'trait_tendency', content: 'Adaptability #7 — goes with the flow, takes things as they come, can miss deadlines' },
    { ...markFile, category: 'trait_tendency', content: 'Positivity #8 — contagious enthusiasm, naturally upbeat, can come across as superficial if not genuinely felt' },
    { ...markFile, category: 'trait_tendency', content: 'Learner #4 — loves the process of learning more than the outcome, constantly improving, can stay in learning mode when action is needed' },
    { ...markFile, category: 'strength', content: 'Context #1 — sees the link between where we have been and where we are going' },
    { ...markFile, category: 'strength', content: 'Connectedness #3 — builds bridges between people, helps others find meaning and purpose' },
    { ...markFile, category: 'strength', content: 'Communication #6 — captures peoples attention, good storyteller and conversationalist' },
    { ...markFile, category: 'strength', content: 'Individualization #10 — appreciates each persons unique qualities, brings out the best in people' },
    { ...markFile, category: 'growth_area', content: 'Context blind spot: can seem resistant to change — needs to show he is using history to build forward not avoid change' },
    { ...markFile, category: 'growth_area', content: 'Adaptability blind spot: can miss deadlines or shift priorities too often for those needing structure' },
    { ...markFile, category: 'growth_area', content: 'Learner blind spot: loves learning so much the outcome can suffer — process over results' },
    { ...markFile, category: 'general', content: 'Leads with Strategic Thinking domain — both he and Sarah are Strategic Thinking leads: deep thinking partnership but may both miss execution' },
    { ...markFile, category: 'general', content: 'Belief #2 (shared with Sarah) — core values central to both, align deeply on what matters, both can be seen as stubborn' },
    { ...markFile, category: 'general', content: 'Bottom strengths: Discipline #34, Deliberative #33, Consistency #32 — structure, routine, and caution do not come naturally' },
  )

  // ── Alex ──
  const alexManual = { ...base, member_id: IDS.alex, source_type: 'manual' }
  entries.push(
    { ...alexManual, category: 'personality_type', content: 'INFP suspected — deeply internal, leads with values, needs meaning in what he does' },
    { ...alexManual, category: 'personality_type', content: 'Processes alone first — needs time to think before he can talk about something' },
    { ...alexManual, category: 'trait_tendency', content: 'Goes deep not wide — one intense interest at a time rather than many surface-level things' },
    { ...alexManual, category: 'trait_tendency', content: 'Observant — notices things others miss but rarely says so' },
    { ...alexManual, category: 'trait_tendency', content: 'Sensitive to criticism even when he acts like he isn\'t' },
    { ...alexManual, category: 'trait_tendency', content: 'More confident in his ideas than his abilities — imposter syndrome about music' },
    { ...alexManual, category: 'strength', content: 'Creative — original ideas, doesn\'t copy what already exists' },
    { ...alexManual, category: 'strength', content: 'Patient in his craft — will work on one beat for days until it feels right' },
    { ...alexManual, category: 'strength', content: 'Self-directed — doesn\'t need external motivation when he cares about something' },
    { ...alexManual, category: 'strength', content: 'Good ear — hears things in music most people don\'t notice' },
    { ...alexManual, category: 'growth_area', content: 'Finishing things — lots of started projects, fewer completed ones' },
    { ...alexManual, category: 'growth_area', content: 'Asking for help — would rather struggle alone than admit he\'s stuck' },
    { ...alexManual, category: 'growth_area', content: 'Comparing himself to professionals online and feeling like he\'ll never be that good' },
    { ...alexManual, category: 'general', content: 'Music is the thing that makes him most fully himself' },
    { ...alexManual, category: 'general', content: 'Wants to study audio engineering but scared to commit in case he\'s not good enough' },
    { ...alexManual, category: 'general', content: 'Responds better to questions than advice — don\'t tell him what to do' },
  )

  // ── Casey ──
  const caseyManual = { ...base, member_id: IDS.casey, source_type: 'manual' }
  entries.push(
    { ...caseyManual, category: 'personality_type', content: 'Strong introvert — social situations drain her, books restore her' },
    { ...caseyManual, category: 'personality_type', content: 'Observes deeply before participating — quiet in groups but has strong opinions' },
    { ...caseyManual, category: 'trait_tendency', content: 'Analytical — takes things apart to understand how they work, including stories' },
    { ...caseyManual, category: 'trait_tendency', content: 'Loyal — slow to trust but deeply committed once she does' },
    { ...caseyManual, category: 'trait_tendency', content: 'Perfectionist about her writing — will rewrite one paragraph 10 times' },
    { ...caseyManual, category: 'trait_tendency', content: 'Dry humor — most people don\'t catch it but it\'s there' },
    { ...caseyManual, category: 'strength', content: 'Strong writer — voice, imagery, emotional depth beyond her age' },
    { ...caseyManual, category: 'strength', content: 'Deep reader — remembers everything, connects themes across books' },
    { ...caseyManual, category: 'strength', content: 'Independent thinker — forms her own opinions, not easily swayed' },
    { ...caseyManual, category: 'strength', content: 'Emotionally intelligent — reads people accurately even when quiet' },
    { ...caseyManual, category: 'growth_area', content: 'Sharing her work — terrified to let people read her writing' },
    { ...caseyManual, category: 'growth_area', content: 'Initiating socially — waits to be invited rather than reaching out' },
    { ...caseyManual, category: 'growth_area', content: 'Perfectionism that stops her from finishing things' },
    { ...caseyManual, category: 'general', content: 'Books are her safe place and her primary way of understanding the world' },
    { ...caseyManual, category: 'general', content: 'Writing is how she processes emotions — she writes more than she talks' },
    { ...caseyManual, category: 'general', content: 'Responds to being taken seriously — treat her ideas as real and she opens up' },
  )

  // ── Jordan ──
  const jordanManual = { ...base, member_id: IDS.jordan, source_type: 'manual' }
  entries.push(
    { ...jordanManual, category: 'personality_type', content: 'Creative and imaginative — lives partly in the worlds she invents' },
    { ...jordanManual, category: 'personality_type', content: 'Sensitive — feels things deeply, needs gentle correction' },
    { ...jordanManual, category: 'trait_tendency', content: 'Needs warm-up time with new people or situations — not shy, just careful' },
    { ...jordanManual, category: 'trait_tendency', content: 'Once comfortable: funny, expressive, tells elaborate stories' },
    { ...jordanManual, category: 'trait_tendency', content: 'Gets anxious before presentations or performances — freezes up' },
    { ...jordanManual, category: 'trait_tendency', content: 'Learns by doing and creating, not by listening and memorizing' },
    { ...jordanManual, category: 'strength', content: 'Artistic — natural eye for composition and color' },
    { ...jordanManual, category: 'strength', content: 'Imaginative storytelling — creates rich detailed worlds' },
    { ...jordanManual, category: 'strength', content: 'Empathetic — notices when others are sad and wants to help' },
    { ...jordanManual, category: 'strength', content: 'Persistent on projects she loves — will work on a drawing for hours' },
    { ...jordanManual, category: 'growth_area', content: 'Math facts — needs hands-on approaches, drill worksheets shut her down' },
    { ...jordanManual, category: 'growth_area', content: 'Presentation confidence — knows her material but freezes in front of others' },
    { ...jordanManual, category: 'growth_area', content: 'Starting new things — beginnings feel risky to her' },
    { ...jordanManual, category: 'general', content: 'Art and stories are how she makes sense of the world' },
    { ...jordanManual, category: 'general', content: 'Minecraft is her social world — talks about it constantly' },
    { ...jordanManual, category: 'general', content: 'Responds beautifully to encouragement and terrible to pressure' },
  )

  // ── Ruthie (mom-authored) ──
  const ruthieManual = { ...base, member_id: IDS.ruthie, source_type: 'manual' }
  entries.push(
    { ...ruthieManual, category: 'personality_type', content: 'Down syndrome — processes with visual cues, repetition, and routine' },
    { ...ruthieManual, category: 'personality_type', content: 'Extremely social — loves people, performs for anyone who will watch' },
    { ...ruthieManual, category: 'trait_tendency', content: 'Routine-dependent — unexpected changes cause dysregulation' },
    { ...ruthieManual, category: 'trait_tendency', content: 'Communicates a lot through expression and gesture — her face tells everything' },
    { ...ruthieManual, category: 'trait_tendency', content: 'Very determined — if she wants something she will find a way' },
    { ...ruthieManual, category: 'trait_tendency', content: 'Sensory sensitive — loud unexpected sounds are hard, tight clothes bother her' },
    { ...ruthieManual, category: 'strength', content: 'Infectious joy — her happiness is completely genuine and contagious' },
    { ...ruthieManual, category: 'strength', content: 'Persistent — keeps trying even when something is hard' },
    { ...ruthieManual, category: 'strength', content: 'Loving — gives the best hugs, notices when people are sad' },
    { ...ruthieManual, category: 'strength', content: 'Responds to visual schedules — thrives with clear visual structure' },
    { ...ruthieManual, category: 'growth_area', content: 'Transitions between activities — this is the hardest part of her day' },
    { ...ruthieManual, category: 'growth_area', content: 'Tolerating frustration — meltdowns when overwhelmed' },
    { ...ruthieManual, category: 'growth_area', content: 'Fine motor skills — in active OT for this, making progress' },
    { ...ruthieManual, category: 'general', content: 'Bluey is her comfort show — can reset almost any hard moment' },
    { ...ruthieManual, category: 'general', content: 'Weighted blanket is non-negotiable for sleep and big feelings' },
    { ...ruthieManual, category: 'general', content: 'Learns through song, movement, and repetition' },
    { ...ruthieManual, category: 'general', content: 'Never underestimate what she understands — she takes everything in' },
  )

  await insertBatch('self_knowledge', entries)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PARTS 4 + Mark/Alex/Casey: GUIDING STARS
// ═══════════════════════════════════════════════════════════════════════════════

async function seedGuidingStars() {
  console.log('\n── Parts 4 + extras: Guiding Stars ──')

  if (await hasData('guiding_stars')) {
    console.log('  guiding_stars: data exists, skipping')
    return
  }

  const base = { family_id: familyId, is_included_in_ai: true, source: 'manual' }

  const stars = [
    // Sarah
    { ...base, member_id: IDS.sarah, entry_type: 'value', content: 'I lead with love, even when it is inconvenient' },
    { ...base, member_id: IDS.sarah, entry_type: 'value', content: 'Family is the most important work I will ever do' },
    { ...base, member_id: IDS.sarah, entry_type: 'declaration', content: 'I am building something that will outlast me' },
    { ...base, member_id: IDS.sarah, entry_type: 'declaration', content: 'I choose curiosity over anxiety when things feel overwhelming' },
    { ...base, member_id: IDS.sarah, entry_type: 'vision', content: 'A home where every child knows they are seen, celebrated, and completely themselves' },
    { ...base, member_id: IDS.sarah, entry_type: 'scripture_quote', content: 'She is clothed with strength and dignity, and she laughs without fear of the future. Proverbs 31:25' },
    // Mark
    { ...base, member_id: IDS.mark, entry_type: 'value', content: 'A man\'s word is his bond — integrity in small things matters as much as integrity in big ones' },
    { ...base, member_id: IDS.mark, entry_type: 'value', content: 'Leave things better than you found them' },
    { ...base, member_id: IDS.mark, entry_type: 'declaration', content: 'I show up consistently even when I don\'t feel like it' },
    { ...base, member_id: IDS.mark, entry_type: 'vision', content: 'Kids who know their dad believed in them before they believed in themselves' },
    { ...base, member_id: IDS.mark, entry_type: 'scripture_quote', content: 'Whatever you do, work at it with all your heart. Colossians 3:23' },
    // Alex
    { ...base, member_id: IDS.alex, entry_type: 'value', content: 'Be someone whose work speaks for itself' },
    { ...base, member_id: IDS.alex, entry_type: 'declaration', content: 'I am still becoming who I am going to be — and that is okay' },
    { ...base, member_id: IDS.alex, entry_type: 'vision', content: 'Making music that actually means something to someone' },
    // Casey
    { ...base, member_id: IDS.casey, entry_type: 'value', content: 'Stories matter — the ones we tell and the ones we live' },
    { ...base, member_id: IDS.casey, entry_type: 'declaration', content: 'My voice is worth hearing even when I am scared to use it' },
  ]

  await insertBatch('guiding_stars', stars)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PARTS 5 + Mark: BEST INTENTIONS + ITERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function seedBestIntentions() {
  console.log('\n── Parts 5 + Mark: Best Intentions ──')

  if (await hasData('best_intentions')) {
    console.log('  best_intentions: data exists, skipping')
    return
  }

  const base = { family_id: familyId, is_included_in_ai: true, source: 'manual', tracker_style: 'counter' }

  // Sarah's intentions
  const sarahIntentions = [
    { ...base, member_id: IDS.sarah, statement: 'Get down to Ruthie\'s level and look her in the eye when we talk', description: 'She processes so much better with direct eye contact and I forget in the rush', is_active: true },
    { ...base, member_id: IDS.sarah, statement: 'Put my phone down when a child is talking to me', description: 'Full presence even for small things', is_active: true },
    { ...base, member_id: IDS.sarah, statement: 'When I start to spiral, stop and pray before reacting', description: 'Pause before the words come out', is_active: true },
    { ...base, member_id: IDS.sarah, statement: 'Go for more walks focused on gratitude', is_active: false },
  ]

  // Mark's intentions
  const markIntentions = [
    { ...base, member_id: IDS.mark, statement: 'Put the phone away during dinner — fully present', is_active: true },
    { ...base, member_id: IDS.mark, statement: 'Ask each kid one real question today — not about school', is_active: true },
    { ...base, member_id: IDS.mark, statement: 'Go for a walk with Sarah once a week', is_active: false },
  ]

  const allIntentions = [...sarahIntentions, ...markIntentions]
  const { data: inserted, error } = await supabase
    .from('best_intentions').insert(allIntentions).select('id, member_id, statement, is_active')

  if (error) {
    console.error(`  best_intentions: INSERT failed — ${error.message}`)
    return
  }
  count('best_intentions', inserted.length)
  console.log(`  best_intentions: ${inserted.length} rows inserted`)

  // Add iterations for active intentions
  const iterations: Record<string, unknown>[] = []
  for (const bi of inserted) {
    if (!bi.is_active) continue
    let iterCount = 0
    // Sarah's first intention: 3 iterations
    if (bi.member_id === IDS.sarah && bi.statement.includes('Ruthie')) iterCount = 3
    // Sarah's second: 2
    else if (bi.member_id === IDS.sarah && bi.statement.includes('phone')) iterCount = 2
    // Sarah's third: 1
    else if (bi.member_id === IDS.sarah && bi.statement.includes('spiral')) iterCount = 1
    // Mark's first: 2
    else if (bi.member_id === IDS.mark && bi.statement.includes('phone')) iterCount = 2
    // Mark's second: 1
    else if (bi.member_id === IDS.mark && bi.statement.includes('question')) iterCount = 1

    for (let i = 0; i < iterCount; i++) {
      iterations.push({
        intention_id: bi.id,
        family_id: familyId,
        member_id: bi.member_id,
        recorded_at: hoursAgo(i * 2),
        day_date: TODAY,
      })
    }
  }

  if (iterations.length > 0) {
    await insertBatch('intention_iterations', iterations)

    // Sync iteration_count on each intention to match actual rows
    const countByIntention: Record<string, number> = {}
    for (const iter of iterations) {
      const iid = iter.intention_id as string
      countByIntention[iid] = (countByIntention[iid] || 0) + 1
    }
    for (const [intentionId, cnt] of Object.entries(countByIntention)) {
      await supabase.from('best_intentions').update({ iteration_count: cnt }).eq('id', intentionId)
    }
    console.log('  iteration_count synced on best_intentions')
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PARTS 6-7: ARCHIVES (Family Overview + Per-Child Context)
// ═══════════════════════════════════════════════════════════════════════════════

async function seedArchives() {
  console.log('\n── Parts 6-7: Archives ──')

  if (await hasData('archive_context_items')) {
    console.log('  archive_context_items: data exists, skipping')
    return
  }

  // Wait a moment for auto-provisioning triggers to complete
  await new Promise(r => setTimeout(r, 1000))

  const items: Record<string, unknown>[] = []
  const base = { family_id: familyId, is_included_in_ai: true, is_privacy_filtered: false, source: 'manual' }

  // ── Family Overview folders ──
  const familyPersonality = await findFolder('Family Personality')
  const rhythmsRoutines = await findFolder('Rhythms & Routines')
  const currentFocus = await findFolder('Current Focus')
  const faithValues = await findFolder('Faith & Values')

  if (familyPersonality) {
    items.push(
      { ...base, folder_id: familyPersonality, context_value: 'We are loud, creative, faith-centered, and always in the middle of something', context_type: 'family_personality' },
      { ...base, folder_id: familyPersonality, context_value: 'We homeschool — learning happens everywhere, not just at a desk', context_type: 'family_personality' },
      { ...base, folder_id: familyPersonality, context_value: 'We believe in doing hard things together', context_type: 'family_personality' },
    )
  }
  if (rhythmsRoutines) {
    items.push(
      { ...base, folder_id: rhythmsRoutines, context_value: 'School starts at 8:30am. Morning routine is non-negotiable for keeping Ruthie regulated', context_type: 'family_rhythm' },
      { ...base, folder_id: rhythmsRoutines, context_value: 'Thursdays are co-op days — biggest logistical day of the week', context_type: 'family_rhythm' },
      { ...base, folder_id: rhythmsRoutines, context_value: 'Sunday is family day — church then together time', context_type: 'family_rhythm' },
      { ...base, folder_id: rhythmsRoutines, context_value: 'Dinner together every night we possibly can', context_type: 'family_rhythm' },
    )
  }
  if (currentFocus) {
    items.push(
      { ...base, folder_id: currentFocus, context_value: 'Helping Ruthie transition to new therapy schedule without dysregulation', context_type: 'family_focus' },
      { ...base, folder_id: currentFocus, context_value: 'Alex is figuring out what he wants — giving him space while staying connected', context_type: 'family_focus' },
      { ...base, folder_id: currentFocus, context_value: 'Building the AI platform that will help other families like ours', context_type: 'family_focus' },
    )
  }
  if (faithValues) {
    items.push(
      { ...base, folder_id: faithValues, context_value: 'Christian family — faith is integrated into daily life, not compartmentalized', context_type: 'faith_context' },
      { ...base, folder_id: faithValues, context_value: 'We use scripture as an anchor, not a weapon', context_type: 'faith_context' },
    )
  }

  // ── Per-child archive items ──
  // Helper to find a child's subfolder
  async function childFolder(memberId: string, folderName: string): Promise<string | null> {
    // First find the member root
    const { data: root } = await supabase.from('archive_folders').select('id')
      .eq('family_id', familyId).eq('member_id', memberId).eq('folder_type', 'member_root').single()
    if (!root) return null
    const { data: sub } = await supabase.from('archive_folders').select('id')
      .eq('parent_folder_id', root.id).eq('folder_name', folderName).single()
    return sub?.id ?? null
  }

  // ── Ruthie ──
  const ruthiePrefs = await childFolder(IDS.ruthie, 'Preferences')
  const ruthieHealth = await childFolder(IDS.ruthie, 'Health & Medical')
  const ruthieSched = await childFolder(IDS.ruthie, 'Schedule & Activities')
  const ruthiePersonality = await childFolder(IDS.ruthie, 'Personality & Traits')

  if (ruthiePrefs) {
    items.push(
      { ...base, folder_id: ruthiePrefs, member_id: IDS.ruthie, context_value: 'Loves Bluey, rainbow colors, and her weighted blanket', context_type: 'preference' },
      { ...base, folder_id: ruthiePrefs, member_id: IDS.ruthie, context_value: 'Favorite food: mac and cheese and strawberries', context_type: 'preference' },
      { ...base, folder_id: ruthiePrefs, member_id: IDS.ruthie, context_value: 'Gets overwhelmed by loud unexpected noises', context_type: 'preference' },
      { ...base, folder_id: ruthiePrefs, member_id: IDS.ruthie, context_value: 'Loves to perform and be the center of attention in safe environments', context_type: 'preference' },
    )
  }
  if (ruthieHealth) {
    items.push(
      { ...base, folder_id: ruthieHealth, member_id: IDS.ruthie, context_value: 'Down syndrome — processes instructions best with visual cues and repetition', context_type: 'medical' },
      { ...base, folder_id: ruthieHealth, member_id: IDS.ruthie, context_value: 'Weighted blanket helps with sensory regulation, especially during transitions', context_type: 'medical' },
      { ...base, folder_id: ruthieHealth, member_id: IDS.ruthie, context_value: 'OT and Speech therapy weekly — currently working on fine motor skills and articulation', context_type: 'medical' },
      { ...base, folder_id: ruthieHealth, member_id: IDS.ruthie, context_value: 'Transitions between activities are the hardest part of her day — needs advance warning', context_type: 'medical' },
    )
  }
  if (ruthieSched) {
    items.push(
      { ...base, folder_id: ruthieSched, member_id: IDS.ruthie, context_value: 'OT Therapy: Tuesdays 2:00pm with Kylie', context_type: 'schedule' },
      { ...base, folder_id: ruthieSched, member_id: IDS.ruthie, context_value: 'Speech Therapy: Tuesdays 3:00pm with Kylie', context_type: 'schedule' },
      { ...base, folder_id: ruthieSched, member_id: IDS.ruthie, context_value: 'Homeschool Co-op: Tuesdays and Thursdays 9:00am-12:00pm', context_type: 'schedule' },
      { ...base, folder_id: ruthieSched, member_id: IDS.ruthie, context_value: 'Activity Days (church): 2nd and 4th Wednesdays with Amy', context_type: 'schedule' },
      { ...base, folder_id: ruthieSched, member_id: IDS.ruthie, context_value: 'Church: Sundays 10:00am', context_type: 'schedule' },
    )
  }
  if (ruthiePersonality) {
    items.push(
      { ...base, folder_id: ruthiePersonality, member_id: IDS.ruthie, context_value: 'Extremely social — lights up around people she knows', context_type: 'personality' },
      { ...base, folder_id: ruthiePersonality, member_id: IDS.ruthie, context_value: 'Communicates a lot through expression and gesture — watch her face', context_type: 'personality' },
      { ...base, folder_id: ruthiePersonality, member_id: IDS.ruthie, context_value: 'Very routine-dependent — unexpected changes cause dysregulation', context_type: 'personality' },
      { ...base, folder_id: ruthiePersonality, member_id: IDS.ruthie, context_value: 'Responds beautifully to visual schedules', context_type: 'personality' },
    )
  }

  // ── Jordan ──
  const jordanInterests = await childFolder(IDS.jordan, 'Interests & Hobbies')
  const jordanSchool = await childFolder(IDS.jordan, 'School & Learning')
  const jordanPersonality = await childFolder(IDS.jordan, 'Personality & Traits')

  if (jordanInterests) {
    items.push(
      { ...base, folder_id: jordanInterests, member_id: IDS.jordan, context_value: 'Drawing and art — fills notebooks constantly', context_type: 'interest' },
      { ...base, folder_id: jordanInterests, member_id: IDS.jordan, context_value: 'Minecraft — builds elaborate worlds', context_type: 'interest' },
      { ...base, folder_id: jordanInterests, member_id: IDS.jordan, context_value: 'Writing stories — has a whole fantasy series in her head', context_type: 'interest' },
    )
  }
  if (jordanSchool) {
    items.push(
      { ...base, folder_id: jordanSchool, member_id: IDS.jordan, context_value: 'Age 10, homeschooled', context_type: 'academic' },
      { ...base, folder_id: jordanSchool, member_id: IDS.jordan, context_value: 'Strong in language arts — reads above level', context_type: 'academic' },
      { ...base, folder_id: jordanSchool, member_id: IDS.jordan, context_value: 'Working on math facts — needs hands-on approaches, not drill worksheets', context_type: 'academic' },
      { ...base, folder_id: jordanSchool, member_id: IDS.jordan, context_value: 'Homeschool co-op on Tuesdays and Thursdays', context_type: 'academic' },
    )
  }
  if (jordanPersonality) {
    items.push(
      { ...base, folder_id: jordanPersonality, member_id: IDS.jordan, context_value: 'Deep thinker — needs time to process before responding', context_type: 'personality' },
      { ...base, folder_id: jordanPersonality, member_id: IDS.jordan, context_value: 'Needs time to warm up to new people but then is warm and funny', context_type: 'personality' },
      { ...base, folder_id: jordanPersonality, member_id: IDS.jordan, context_value: 'Gets presentation anxiety — needs low-stakes practice opportunities', context_type: 'personality' },
    )
  }

  // ── Alex ──
  const alexInterests = await childFolder(IDS.alex, 'Interests & Hobbies')
  const alexPersonality = await childFolder(IDS.alex, 'Personality & Traits')
  const alexSchool = await childFolder(IDS.alex, 'School & Learning')

  if (alexInterests) {
    items.push(
      { ...base, folder_id: alexInterests, member_id: IDS.alex, context_value: 'Music production — has been building beats since age 13', context_type: 'interest' },
      { ...base, folder_id: alexInterests, member_id: IDS.alex, context_value: 'Plays guitar and is self-teaching bass', context_type: 'interest' },
      { ...base, folder_id: alexInterests, member_id: IDS.alex, context_value: 'Wants to study audio engineering', context_type: 'interest' },
      { ...base, folder_id: alexInterests, member_id: IDS.alex, context_value: 'Music posters and gear fill his room', context_type: 'interest' },
    )
  }
  if (alexPersonality) {
    items.push(
      { ...base, folder_id: alexPersonality, member_id: IDS.alex, context_value: 'Introverted — recharges alone but is deeply connected when he opens up', context_type: 'personality' },
      { ...base, folder_id: alexPersonality, member_id: IDS.alex, context_value: 'Passionate and articulate when talking about music — becomes a different person', context_type: 'personality' },
      { ...base, folder_id: alexPersonality, member_id: IDS.alex, context_value: 'Figuring out his identity and direction — needs space not pressure', context_type: 'personality' },
    )
  }
  if (alexSchool) {
    items.push(
      { ...base, folder_id: alexSchool, member_id: IDS.alex, context_value: 'Age 15, homeschooled', context_type: 'academic' },
      { ...base, folder_id: alexSchool, member_id: IDS.alex, context_value: 'Learns best through doing and creating, not reading and memorizing', context_type: 'academic' },
    )
  }

  // ── Casey ──
  const caseyInterests = await childFolder(IDS.casey, 'Interests & Hobbies')
  const caseySchool = await childFolder(IDS.casey, 'School & Learning')
  const caseyPersonality = await childFolder(IDS.casey, 'Personality & Traits')

  if (caseyInterests) {
    items.push(
      { ...base, folder_id: caseyInterests, member_id: IDS.casey, context_value: 'Percy Jackson series — has read it multiple times', context_type: 'interest' },
      { ...base, folder_id: caseyInterests, member_id: IDS.casey, context_value: 'Reading is her love language', context_type: 'interest' },
      { ...base, folder_id: caseyInterests, member_id: IDS.casey, context_value: 'Creative writing — strong voice and imagination', context_type: 'interest' },
    )
  }
  if (caseySchool) {
    items.push(
      { ...base, folder_id: caseySchool, member_id: IDS.casey, context_value: 'Age 14, homeschooled', context_type: 'academic' },
      { ...base, folder_id: caseySchool, member_id: IDS.casey, context_value: 'Advanced reader, strong writer', context_type: 'academic' },
      { ...base, folder_id: caseySchool, member_id: IDS.casey, context_value: 'Thoughtful and analytical in discussion', context_type: 'academic' },
    )
  }
  if (caseyPersonality) {
    items.push(
      { ...base, folder_id: caseyPersonality, member_id: IDS.casey, context_value: 'Bookish and interior — observes more than she speaks', context_type: 'personality' },
      { ...base, folder_id: caseyPersonality, member_id: IDS.casey, context_value: 'Has strong opinions she shares selectively', context_type: 'personality' },
      { ...base, folder_id: caseyPersonality, member_id: IDS.casey, context_value: 'Quiet warmth — you have to earn it', context_type: 'personality' },
    )
  }

  if (items.length > 0) {
    await insertBatch('archive_context_items', items)
  } else {
    console.log('  No archive folders found — auto-provisioning may not have run. Skipping context items.')
  }

  // ── Faith Preferences ──
  const { data: existingFaith } = await supabase
    .from('faith_preferences').select('id').eq('family_id', familyId).limit(1)
  if (!existingFaith || existingFaith.length === 0) {
    const { error: fpErr } = await supabase.from('faith_preferences').insert({
      family_id: familyId,
      faith_tradition: 'Christian',
      denomination: 'Non-denominational',
      observances: ['Sunday worship', 'prayer', 'scripture study'],
      relevance_setting: 'automatic',
      respect_but_dont_assume: true,
      avoid_conflicting: true,
      is_included_in_ai: true,
      special_instructions: 'Faith is woven into our family naturally. Reference it when relevant to the conversation — parenting, values, decisions, comfort. Don\'t force it into practical/logistical topics.',
    })
    if (fpErr) console.error(`  faith_preferences: ${fpErr.message}`)
    else { count('faith_preferences', 1); console.log('  faith_preferences: 1 row inserted') }
  } else {
    console.log('  faith_preferences: data exists, skipping')
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 8: TASKS
// ═══════════════════════════════════════════════════════════════════════════════

async function seedTasks() {
  console.log('\n── Part 8: Tasks ──')

  if (await hasData('tasks')) {
    console.log('  tasks: data exists, skipping')
    return
  }

  const base = { family_id: familyId, task_type: 'task', source: 'manual' }
  const tasks = [
    // Sarah
    { ...base, created_by: IDS.sarah, assignee_id: IDS.sarah, title: 'Prepare Ruthie\'s therapy bag for Tuesday', status: 'completed', completed_at: daysAgo(2) },
    { ...base, created_by: IDS.sarah, assignee_id: IDS.sarah, title: 'Review Jordan\'s co-op portfolio', status: 'completed', completed_at: daysAgo(2) },
    { ...base, created_by: IDS.sarah, assignee_id: IDS.sarah, title: 'Call insurance about Ruthie\'s OT coverage', status: 'pending', due_date: TODAY },
    { ...base, created_by: IDS.sarah, assignee_id: IDS.sarah, title: 'Order Casey\'s next book series', status: 'pending' },
    { ...base, created_by: IDS.sarah, assignee_id: IDS.sarah, title: 'Respond to co-op coordinator email', status: 'pending', due_date: TODAY },
    // Alex
    { ...base, created_by: IDS.sarah, assignee_id: IDS.alex, title: 'Practice guitar 30 minutes', status: 'completed', completed_at: daysAgo(2) },
    { ...base, created_by: IDS.sarah, assignee_id: IDS.alex, title: 'Finish history chapter reading', status: 'pending' },
    // Jordan
    { ...base, created_by: IDS.sarah, assignee_id: IDS.jordan, title: 'Complete math worksheet', status: 'completed', completed_at: daysAgo(1) },
    { ...base, created_by: IDS.sarah, assignee_id: IDS.jordan, title: 'Work on co-op presentation', status: 'in_progress' },
    // Ruthie
    { ...base, created_by: IDS.sarah, assignee_id: IDS.ruthie, title: 'Morning routine checklist', status: 'completed', completed_at: daysAgo(2) },
    { ...base, created_by: IDS.sarah, assignee_id: IDS.ruthie, title: 'Pack therapy bag with Kylie', status: 'completed', completed_at: daysAgo(2) },
    { ...base, created_by: IDS.sarah, assignee_id: IDS.ruthie, title: 'Evening wind-down routine', status: 'completed', completed_at: daysAgo(2) },
  ]

  await insertBatch('tasks', tasks)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 9: VICTORIES
// ═══════════════════════════════════════════════════════════════════════════════

async function seedVictories() {
  console.log('\n── Part 9: Victories ──')

  if (await hasData('victories')) {
    console.log('  victories: data exists, skipping')
    return
  }

  const base = { family_id: familyId, source: 'manual' }
  const victories = [
    // Sarah
    { ...base, family_member_id: IDS.sarah, member_type: 'adult', description: 'Stayed calm during Ruthie\'s meltdown and used the visual schedule — it worked for the first time this week', created_at: daysAgo(2) },
    { ...base, family_member_id: IDS.sarah, member_type: 'adult', description: 'Published my first AI tutorial to the Vault', created_at: daysAgo(2) },
    { ...base, family_member_id: IDS.sarah, member_type: 'adult', description: 'Had a real conversation with Alex about his music instead of asking about schoolwork', created_at: daysAgo(3) },
    // Alex
    { ...base, family_member_id: IDS.alex, member_type: 'teen', description: 'Finished my first original beat from scratch', created_at: daysAgo(3) },
    // Jordan
    { ...base, family_member_id: IDS.jordan, member_type: 'guided', description: 'Read for 45 minutes without being asked', created_at: daysAgo(2) },
    { ...base, family_member_id: IDS.jordan, member_type: 'guided', description: 'Drew a full comic page — front and back', created_at: daysAgo(3) },
    // Ruthie
    { ...base, family_member_id: IDS.ruthie, member_type: 'play', description: 'Used her words to ask for a hug instead of grabbing', created_at: daysAgo(2) },
    { ...base, family_member_id: IDS.ruthie, member_type: 'play', description: 'Transitioned from co-op to speech without crying — first time ever', created_at: daysAgo(2) },
  ]

  await insertBatch('victories', victories)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 10: JOURNAL ENTRIES
// ═══════════════════════════════════════════════════════════════════════════════

async function seedJournal() {
  console.log('\n── Part 10: Journal Entries ──')

  if (await hasData('journal_entries')) {
    console.log('  journal_entries: data exists, skipping')
    return
  }

  const base = { family_id: familyId, member_id: IDS.sarah, is_included_in_ai: true, visibility: 'private' }
  const entries = [
    { ...base, entry_type: 'reflection', content: 'Today was hard. Ruthie had a rough therapy session and I could feel myself wanting to just fix it for her. But I sat with her instead. Let her feel it. Then the weighted blanket, then Bluey, then she was okay. I didn\'t fix it. I just stayed. I think that was better.', created_at: daysAgo(2) },
    { ...base, entry_type: 'gratitude', content: 'Grateful for Kylie today. She knew exactly what Ruthie needed during the transition without me saying a word. Years of showing up builds something you cannot pay for.', created_at: daysAgo(2) },
    { ...base, entry_type: 'kid_quips', content: 'Ruthie just told me the blocks were too loud. The blocks. I didn\'t know blocks could be loud but apparently today they were. She\'s not wrong.', created_at: daysAgo(3) },
    { ...base, entry_type: 'gratitude', content: 'Grateful that Alex let me listen to his new beat today. He didn\'t have to. He chose to. That\'s everything.', created_at: daysAgo(1) },
  ]

  await insertBatch('journal_entries', entries)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 12: CALENDAR EVENTS (Ruthie)
// ═══════════════════════════════════════════════════════════════════════════════

async function seedCalendarEvents() {
  console.log('\n── Part 12: Calendar Events ──')

  // calendar_events table doesn't exist yet (PRD-14B not built)
  console.log('  calendar_events: table not yet created (PRD-14B), skipping')
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 13: WIDGETS & TRACKERS
// ═══════════════════════════════════════════════════════════════════════════════

async function seedWidgets() {
  console.log('\n── Part 13: Widgets & Trackers ──')

  try {
    if (await hasData('dashboard_widgets')) {
      console.log('  dashboard_widgets: data exists, skipping')
      return
    }

    const widgets: Record<string, unknown>[] = []
    const dataPoints: Record<string, unknown>[] = []

    // Helper to create a widget and collect data points
    function addWidget(
      memberId: string, templateType: string, variant: string,
      title: string, size: string, config: Record<string, unknown>,
      x: number, y: number, extraPoints?: (widgetId: string) => Record<string, unknown>[]
    ) {
      const id = crypto.randomUUID()
      widgets.push({
        id, family_id: familyId, family_member_id: memberId,
        template_type: templateType, visual_variant: variant,
        title, size, position_x: x, position_y: y,
        widget_config: config, is_active: true, is_on_dashboard: true,
        multiplayer_enabled: false, multiplayer_participants: [], multiplayer_config: {},
      })
      if (extraPoints) {
        dataPoints.push(...extraPoints(id))
      }
    }

    // ── Sarah's Widgets ──
    // Morning Routine Streak
    addWidget(IDS.sarah, 'streak', 'flame_counter', 'Morning Routine', 'small',
      { current_streak: 12, longest_streak: 19 }, 0, 0,
      (wid) => {
        const pts: Record<string, unknown>[] = []
        for (let i = 0; i < 14; i++) {
          if (i === 5) continue // missed one 5 days ago
          pts.push({ family_id: familyId, widget_id: wid, family_member_id: IDS.sarah, recorded_date: dateOnly(i), value: 1, value_type: 'boolean' })
        }
        return pts
      }
    )

    // Daily Mood Check-In
    addWidget(IDS.sarah, 'dot_circle', 'year_in_pixels_weekly', 'Daily Mood', 'medium',
      { scale_type: '1-5' }, 2, 0,
      (wid) => {
        const moods = [5, 4, 5, 4, 3, 5, 4, 2, 4, 5, 4, 3, 5, 4]
        return moods.map((v, i) => ({
          family_id: familyId, widget_id: wid, family_member_id: IDS.sarah,
          recorded_date: dateOnly(i), value: v, value_type: 'mood',
        }))
      }
    )

    // Weekly Chore Completion
    addWidget(IDS.sarah, 'percentage', 'donut_completion', 'Family Chores Done', 'small',
      { goal_percentage: 100 }, 0, 1,
      (wid) => [{
        family_id: familyId, widget_id: wid, family_member_id: IDS.sarah,
        recorded_date: TODAY, value: 73, value_type: 'percentage',
      }]
    )

    // ── Mark's Widgets ──
    addWidget(IDS.mark, 'streak', 'flame_counter', 'Morning Routine', 'small',
      { current_streak: 5, longest_streak: 5 }, 0, 0,
      (wid) => Array.from({ length: 5 }, (_, i) => ({
        family_id: familyId, widget_id: wid, family_member_id: IDS.mark,
        recorded_date: dateOnly(i), value: 1, value_type: 'boolean',
      }))
    )

    // Family Reading Race (multiplayer)
    const readingRaceId = crypto.randomUUID()
    widgets.push({
      id: readingRaceId, family_id: familyId, family_member_id: IDS.mark,
      template_type: 'tally', visual_variant: 'colored_bars_competitive',
      title: 'Family Reading Challenge', size: 'large', position_x: 0, position_y: 1,
      widget_config: { measurement_unit: 'books', target_number: 20 },
      is_active: true, is_on_dashboard: true,
      multiplayer_enabled: true,
      multiplayer_participants: [IDS.sarah, IDS.mark, IDS.alex, IDS.casey, IDS.jordan],
      multiplayer_config: {},
    })
    const readingData: [string, number][] = [
      [IDS.sarah, 8], [IDS.mark, 6], [IDS.casey, 14], [IDS.alex, 3], [IDS.jordan, 11],
    ]
    for (const [mid, val] of readingData) {
      dataPoints.push({
        family_id: familyId, widget_id: readingRaceId, family_member_id: mid,
        recorded_date: TODAY, value: val, value_type: 'set',
      })
    }

    // ── Alex's Widgets ──
    addWidget(IDS.alex, 'multi_habit_grid', 'bujo_monthly_grid', 'Practice Daily', 'medium',
      { default_habits: ['Scales', 'Current song', 'Free play'] }, 0, 0,
      (wid) => {
        const pts: Record<string, unknown>[] = []
        for (let i = 0; i < 30; i++) {
          if (Math.random() > 0.6) { // ~18 of 30
            pts.push({ family_id: familyId, widget_id: wid, family_member_id: IDS.alex, recorded_date: dateOnly(i), value: 1, value_type: 'boolean' })
          }
        }
        return pts
      }
    )

    addWidget(IDS.alex, 'tally', 'star_chart', 'Books Read', 'small',
      { measurement_unit: 'books' }, 2, 0,
      (wid) => [{ family_id: familyId, widget_id: wid, family_member_id: IDS.alex, recorded_date: TODAY, value: 3, value_type: 'set' }]
    )

    addWidget(IDS.alex, 'streak', 'flame_counter', 'Morning Routine', 'small',
      { current_streak: 3 }, 0, 1,
      (wid) => Array.from({ length: 3 }, (_, i) => ({
        family_id: familyId, widget_id: wid, family_member_id: IDS.alex,
        recorded_date: dateOnly(i), value: 1, value_type: 'boolean',
      }))
    )

    // ── Jordan's Widgets ──
    addWidget(IDS.jordan, 'collection', 'animated_sticker_grid', 'Co-op Stars', 'medium',
      { sticker_type: 'star', target_number: 15 }, 0, 0,
      (wid) => [{ family_id: familyId, widget_id: wid, family_member_id: IDS.jordan, recorded_date: TODAY, value: 7, value_type: 'set' }]
    )

    addWidget(IDS.jordan, 'tally', 'star_chart', "Books I've Read", 'small',
      { measurement_unit: 'books' }, 2, 0,
      (wid) => [{ family_id: familyId, widget_id: wid, family_member_id: IDS.jordan, recorded_date: TODAY, value: 11, value_type: 'set' }]
    )

    // ── Ruthie's Widgets ──
    addWidget(IDS.ruthie, 'collection', 'animated_sticker_grid', "Ruthie's Stars", 'medium',
      { sticker_type: 'star', target_number: 10 }, 0, 0,
      (wid) => [{ family_id: familyId, widget_id: wid, family_member_id: IDS.ruthie, recorded_date: TODAY, value: 5, value_type: 'set' }]
    )

    addWidget(IDS.ruthie, 'streak', 'flame_counter', 'Morning Routine', 'small',
      { current_streak: 8 }, 2, 0,
      (wid) => Array.from({ length: 8 }, (_, i) => ({
        family_id: familyId, widget_id: wid, family_member_id: IDS.ruthie,
        recorded_date: dateOnly(i), value: 1, value_type: 'boolean',
      }))
    )

    await insertBatch('dashboard_widgets', widgets)
    if (dataPoints.length > 0) {
      await insertBatch('widget_data_points', dataPoints)
    }
  } catch (e) {
    console.error(`  Widgets failed — ${(e as Error).message}`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 14: LISTS
// ═══════════════════════════════════════════════════════════════════════════════

async function seedLists() {
  console.log('\n── Part 14: Lists ──')

  if (await hasData('lists')) {
    console.log('  lists: data exists, skipping')
    return
  }

  async function createList(ownerId: string, title: string, listType: string, items: { content: string; checked: boolean; section_name?: string; notes?: string; resource_url?: string; price?: number; quantity?: string }[]) {
    const { data: list, error } = await supabase.from('lists').insert({
      family_id: familyId, owner_id: ownerId, title, list_type: listType,
    }).select('id').single()

    if (error || !list) {
      console.error(`  lists: Failed to create "${title}" — ${error?.message}`)
      return
    }
    count('lists', 1)

    const listItems = items.map((item, i) => ({
      list_id: list.id, content: item.content, checked: item.checked,
      sort_order: i, section_name: item.section_name ?? null,
      notes: item.notes ?? null, resource_url: item.resource_url ?? null,
      price: item.price ?? null, quantity: item.quantity ?? null,
    }))
    const { error: itemErr } = await supabase.from('list_items').insert(listItems)
    if (itemErr) console.error(`  list_items for "${title}": ${itemErr.message}`)
    else count('list_items', listItems.length)
  }

  // Sarah's lists
  await createList(IDS.sarah, 'Grocery List', 'shopping', [
    { content: 'Milk', checked: true }, { content: 'Eggs', checked: true },
    { content: "Ruthie's yogurt pouches", checked: true }, { content: 'Mac and cheese (Ruthie)', checked: true },
    { content: 'Strawberries', checked: false }, { content: 'Bread', checked: false },
    { content: 'Chicken thighs', checked: false }, { content: "Casey's granola bars", checked: false },
    { content: 'Coffee (almost out)', checked: false }, { content: "Alex's energy drinks (limited to 2/week)", checked: false },
  ])

  await createList(IDS.sarah, 'Therapy Supplies', 'checklist', [
    { content: 'Weighted blanket (car)', checked: true }, { content: 'Noise-canceling headphones', checked: true },
    { content: 'Extra change of clothes', checked: false }, { content: 'Favorite fidget toys', checked: false },
    { content: 'Visual schedule cards (laminated)', checked: false }, { content: 'Snack for after OT', checked: false },
  ])

  await createList(IDS.sarah, "Books to Order (Casey)", 'wishlist', [
    { content: 'The Lightning Thief (own copy)', checked: false }, { content: 'The Sea of Monsters', checked: false },
    { content: 'Magnus Chase series', checked: false }, { content: 'Aru Shah and the End of Time', checked: false },
  ])

  await createList(IDS.sarah, 'Project Ideas', 'todo', [
    { content: 'Create SDS report tutorial for AI Vault', checked: false },
    { content: 'Build Pinterest content pipeline', checked: false },
    { content: 'Finish Vibeathon submission', checked: true },
    { content: 'Write homeschool portfolio guide', checked: false },
    { content: 'Create IEP prep prompt pack', checked: false },
  ])

  await createList(IDS.sarah, "Ruthie's Wishlist", 'wishlist', [
    { content: 'Bluey playhouse set', checked: false }, { content: 'Rainbow art kit', checked: false },
    { content: 'Weighted stuffed animal', checked: false }, { content: 'Melissa & Doug sticker pad', checked: false },
  ])

  // Alex's lists
  await createList(IDS.alex, 'Music Equipment Wishlist', 'wishlist', [
    { content: 'Audio-Technica ATH-M50x headphones', checked: false },
    { content: 'Focusrite Scarlett 2i2 interface', checked: false },
    { content: 'MIDI keyboard (61 keys)', checked: false },
    { content: 'DAW license (got for birthday)', checked: true },
  ])

  await createList(IDS.alex, 'Practice Checklist', 'checklist', [
    { content: '15 min scales/technique', checked: false }, { content: '30 min current song', checked: false },
    { content: '15 min free play / production', checked: false }, { content: 'Log what I worked on', checked: false },
  ])

  // Casey's lists
  await createList(IDS.casey, 'Reading List', 'checklist', [
    { content: 'Percy Jackson - Lightning Thief (re-read)', checked: true },
    { content: 'Percy Jackson - Sea of Monsters (re-read)', checked: true },
    { content: 'The Giver', checked: true },
    { content: "Percy Jackson - Titan's Curse", checked: false },
    { content: 'Aru Shah series', checked: false }, { content: 'Magnus Chase', checked: false },
  ])

  await createList(IDS.casey, 'Writing Project Checklist', 'checklist', [
    { content: 'Character outlines done', checked: true }, { content: 'World map drawn', checked: true },
    { content: 'Chapter 1 first draft', checked: false }, { content: 'Chapter 2 outline', checked: false },
    { content: 'Share with mom to read', checked: false },
  ])

  // Jordan's lists
  await createList(IDS.jordan, 'Art Supplies Needed', 'shopping', [
    { content: 'Fine tip black markers', checked: false }, { content: 'Watercolor set', checked: false },
    { content: 'Sketchbook (just got one)', checked: true }, { content: 'Colored pencils (more colors)', checked: false },
  ])

  await createList(IDS.jordan, 'Co-op Presentation Checklist', 'checklist', [
    { content: 'Pick topic (American Revolution)', checked: true }, { content: 'Research notes', checked: true },
    { content: 'Outline done', checked: false }, { content: 'Practice at home', checked: false },
    { content: 'Make visual aid', checked: false },
  ])

  console.log('  Lists created with items')
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 7B: PRIVACY-FILTERED ARCHIVE ITEMS (S4 Wizard multi-user test prep)
// ═══════════════════════════════════════════════════════════════════════════════
//  Adds 3 is_privacy_filtered=true items to exercise S3's role-asymmetric RLS
//  policy (migration 00000000100149) + Edge Function privacy filters in
//  context-assembler.ts, relationship-context.ts, and bookshelf-study-guide.
//  Per-row idempotency (probe by family_id + context_value + is_privacy_filtered)
//  so re-runs are safe after seedArchives() has already populated the family.

async function seedPrivacyFilteredArchiveItems() {
  console.log('\n── Part 7B: Privacy-Filtered Archive Items (S4 prep) ──')

  const FIXED_CREATED_AT = '2026-04-18T00:00:00Z'

  // Family Overview → Current Focus (family-level, member_id=NULL)
  const currentFocus = await findFolder('Current Focus')

  // Jordan's member subfolders (person-level + negative-preference)
  async function jordanSubfolder(folderName: string): Promise<string | null> {
    const { data: root } = await supabase.from('archive_folders').select('id')
      .eq('family_id', familyId).eq('member_id', IDS.jordan)
      .eq('folder_type', 'member_root').single()
    if (!root) return null
    const { data: sub } = await supabase.from('archive_folders').select('id')
      .eq('parent_folder_id', root.id).eq('folder_name', folderName).single()
    return sub?.id ?? null
  }
  const jordanPersonality = await jordanSubfolder('Personality & Traits')
  const jordanPrefs = await jordanSubfolder('Preferences')

  const rows: Record<string, unknown>[] = []

  if (currentFocus) {
    rows.push({
      family_id: familyId,
      folder_id: currentFocus,
      member_id: null,
      context_value: '[TEST S4] A family-level sensitive note that only Sarah should see in context',
      context_type: 'family_focus',
      is_included_in_ai: true,
      is_privacy_filtered: true,
      is_negative_preference: false,
      source: 'manual',
      created_at: FIXED_CREATED_AT,
    })
  }

  if (jordanPersonality) {
    rows.push({
      family_id: familyId,
      folder_id: jordanPersonality,
      member_id: IDS.jordan,
      context_value: '[TEST S4] A person-level sensitive note about Jordan that only Sarah should see in context',
      context_type: 'personality',
      is_included_in_ai: true,
      is_privacy_filtered: true,
      is_negative_preference: false,
      source: 'manual',
      created_at: FIXED_CREATED_AT,
    })
  }

  if (jordanPrefs) {
    rows.push({
      family_id: familyId,
      folder_id: jordanPrefs,
      member_id: IDS.jordan,
      context_value: '[TEST S4] A negative preference about Jordan that only Sarah should see in context',
      context_type: 'preference',
      is_included_in_ai: true,
      is_privacy_filtered: true,
      is_negative_preference: true,
      source: 'manual',
      created_at: FIXED_CREATED_AT,
    })
  }

  if (rows.length === 0) {
    console.log('  No target folders found (auto-provisioning incomplete?) — skipping')
    return
  }

  let inserted = 0
  let skipped = 0
  for (const row of rows) {
    const { data: existing } = await supabase
      .from('archive_context_items')
      .select('id')
      .eq('family_id', familyId)
      .eq('context_value', row.context_value as string)
      .eq('is_privacy_filtered', true)
      .maybeSingle()
    if (existing) { skipped++; continue }
    const { error } = await supabase.from('archive_context_items').insert(row)
    if (error) {
      console.error(`  privacy-filtered insert failed: ${error.message}`)
      continue
    }
    inserted++
  }
  if (inserted > 0) count('archive_context_items', inserted)
  console.log(`  archive_context_items (privacy-filtered): ${inserted} inserted, ${skipped} already present`)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PART 16: NOTEPAD TABS (so Notepad looks used)
// ═══════════════════════════════════════════════════════════════════════════════

async function seedNotepad() {
  console.log('\n── Notepad Tabs ──')

  if (await hasData('notepad_tabs')) {
    console.log('  notepad_tabs: data exists, skipping')
    return
  }

  const tabs = [
    {
      family_id: familyId, member_id: IDS.sarah,
      title: 'Ruthie transition strategies',
      content: 'Things to try for the OT→Speech gap:\n- Visual countdown timer\n- Transition song\n- Weighted vest during walk between rooms\n- Kylie carries fidget bag\n\nAsk Kylie if she has ideas too.',
      status: 'active', is_auto_named: false, sort_order: 0,
    },
    {
      family_id: familyId, member_id: IDS.sarah,
      title: 'Co-op week planning',
      content: 'Tuesday: Jordan needs presentation materials printed\nThursday: Bring snacks for group\nRemember Casey wants to lead the poetry section',
      status: 'active', is_auto_named: false, sort_order: 1,
    },
  ]

  await insertBatch('notepad_tabs', tabs)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Seed "The Testworth Family" — idempotent. Returns the family id and
 * a flat member-id map. Also populates the module-level TEST_IDS export
 * (mirrors the old seed-family.ts pattern for direct consumers).
 * Throws on failure — CLI main() wraps this with process.exit(1).
 */
export async function seedTestworthFamily(): Promise<{
  familyId: string
  memberIds: Record<'sarah' | 'mark' | 'amy' | 'kylie' | 'alex' | 'casey' | 'jordan' | 'ruthie', string>
}> {
  await seedFamilyStructure()
  await seedInnerWorkings()
  await seedGuidingStars()
  await seedBestIntentions()
  await seedArchives()
  await seedPrivacyFilteredArchiveItems()
  await seedTasks()
  await seedVictories()
  await seedJournal()
  await seedCalendarEvents()
  await seedWidgets()
  await seedLists()
  await seedNotepad()

  // Populate exported TEST_IDS from the module-internal IDS map.
  TEST_IDS.familyId = familyId
  for (const key of ['sarah','mark','amy','kylie','alex','casey','jordan','ruthie'] as const) {
    ;(TEST_IDS as Record<string, string>)[`${key}Id`] = IDS[`${key}Auth`]
    ;(TEST_IDS as Record<string, string>)[`${key}MemberId`] = IDS[key]
  }

  return {
    familyId,
    memberIds: {
      sarah:  IDS.sarah,  mark:   IDS.mark,
      amy:    IDS.amy,    kylie:  IDS.kylie,
      alex:   IDS.alex,   casey:  IDS.casey,
      jordan: IDS.jordan, ruthie: IDS.ruthie,
    },
  }
}

// CLI entry point — runs only when invoked directly via `npx tsx ...`, not on import.
async function main() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  Testworth Family Complete Demo Seed             ║')
  console.log('╚══════════════════════════════════════════════════╝')

  const start = Date.now()

  try {
    await seedTestworthFamily()

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log('\n╔══════════════════════════════════════════════════╗')
    console.log(`║  COMPLETE: ${totalRecords} records across ${tablesCounted.size} tables`)
    console.log(`║  Time: ${elapsed}s`)
    console.log('║')
    console.log(`║  Login credentials (all use ${PASSWORD}):`)
    for (const [, m] of Object.entries(MEMBERS)) {
      console.log(`║    ${m.name.padEnd(8)} ${m.email}`)
    }
    console.log('║')
    console.log(`║  Family login: ${FAMILY_LOGIN}`)
    console.log('╚══════════════════════════════════════════════════╝')
  } catch (e) {
    console.error('\n SEED FAILED:', (e as Error).message)
    process.exit(1)
  }
}

// Guard against module-import side-effects: only run main() when this file
// is the CLI entry point. Works across Windows/Unix and CJS/ESM under tsx
// by comparing basename of the invoked script.
const invokedBasename = basename(process.argv[1] ?? '')
if (invokedBasename === 'seed-testworths-complete.ts' || invokedBasename === 'seed-testworths-complete.js') {
  main()
}
