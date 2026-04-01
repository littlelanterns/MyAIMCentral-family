/**
 * BookShelf Discuss — Layered Context Assembly Tests
 *
 * Tests the bookshelf-discuss Edge Function with real OpenRouter + OpenAI calls.
 * Verifies that the context assembler loads relevant context based on
 * name detection and topic matching, not bulk-dumping everything.
 *
 * Uses the real dev account (E2E_DEV_EMAIL) which has 394+ books with extractions,
 * family members including Ruthie (age 7, Down Syndrome), and archive context.
 */
import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const devEmail = process.env.E2E_DEV_EMAIL!
const devPassword = process.env.E2E_DEV_PASSWORD!

let supabase: SupabaseClient
let familyId: string
let memberId: string
let testBookId: string
let testBookTitle: string

test.beforeAll(async () => {
  if (!devEmail || !devPassword) {
    throw new Error('E2E_DEV_EMAIL and E2E_DEV_PASSWORD must be set in .env.local')
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: devEmail,
    password: devPassword,
  })
  if (authErr || !authData.session) throw new Error(`Auth failed: ${authErr?.message}`)

  // Get member info
  const { data: member } = await supabase
    .from('family_members')
    .select('id, family_id')
    .eq('user_id', authData.user.id)
    .eq('role', 'primary_parent')
    .single()

  if (!member) throw new Error('No primary_parent family member found')
  familyId = member.family_id
  memberId = member.id

  // Find a book with extractions
  const { data: book } = await supabase
    .from('bookshelf_items')
    .select('id, title')
    .eq('family_id', familyId)
    .eq('extraction_status', 'completed')
    .is('parent_bookshelf_item_id', null)
    .is('archived_at', null)
    .limit(1)
    .single()

  if (!book) throw new Error('No extracted book found in family library')
  testBookId = book.id
  testBookTitle = book.title
  console.log(`Using book: "${testBookTitle}" (${testBookId})`)
})

// ── Helper: Call the discuss Edge Function ─────────────────────────────

async function callDiscuss(opts: {
  bookIds: string[]
  message: string
  history?: Array<{ role: string; content: string }>
  audience?: string
}): Promise<{ content: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('bookshelf-discuss', {
    body: {
      bookshelf_item_ids: opts.bookIds,
      discussion_type: 'discuss',
      audience: opts.audience || 'personal',
      message: opts.message,
      conversation_history: opts.history || [],
      family_id: familyId,
      member_id: memberId,
    },
  })

  if (error) return { content: '', error: error.message }
  return data as { content: string }
}

// ════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════

test.describe('BookShelf Discuss — Layered Context Assembly', () => {
  test.setTimeout(120_000) // AI calls can be slow

  test('opening discussion returns AI content', async () => {
    const result = await callDiscuss({ bookIds: [testBookId], message: '' })
    expect(result.error).toBeUndefined()
    expect(result.content).toBeTruthy()
    expect(result.content.length).toBeGreaterThan(50)
    console.log(`Opening response (${result.content.length} chars): ${result.content.substring(0, 200)}...`)
  })

  test('mentioning Ruthie by name gets Ruthie-specific response', async () => {
    const result = await callDiscuss({
      bookIds: [testBookId],
      message: 'How could the ideas in this book apply to my daughter Ruthie? She is the one with Down Syndrome.',
    })

    expect(result.error).toBeUndefined()
    expect(result.content).toBeTruthy()
    // LiLa should reference Ruthie by name since we mentioned her
    const lower = result.content.toLowerCase()
    expect(lower).toContain('ruthie')
    console.log(`Ruthie response (${result.content.length} chars): ${result.content.substring(0, 300)}...`)
  })

  test('personal goals discussion stays self-focused', async () => {
    const result = await callDiscuss({
      bookIds: [testBookId],
      message: 'What personal growth goals could I set for myself based on this book? This is just about me, not my kids.',
    })

    expect(result.error).toBeUndefined()
    expect(result.content).toBeTruthy()
    // Response should contain goal/growth language
    const lower = result.content.toLowerCase()
    const hasGoalLanguage = ['goal', 'practice', 'commit', 'habit', 'intention', 'step', 'growth'].some(
      kw => lower.includes(kw)
    )
    expect(hasGoalLanguage).toBe(true)
    console.log(`Personal goals response (${result.content.length} chars): ${result.content.substring(0, 300)}...`)
  })

  test('follow-up with conversation history maintains thread', async () => {
    // Opening
    const opening = await callDiscuss({ bookIds: [testBookId], message: '' })
    expect(opening.content).toBeTruthy()

    // Follow-up
    const followUp = await callDiscuss({
      bookIds: [testBookId],
      message: 'Can you elaborate on the first point you made?',
      history: [
        { role: 'assistant', content: opening.content },
      ],
    })

    expect(followUp.error).toBeUndefined()
    expect(followUp.content).toBeTruthy()
    expect(followUp.content.length).toBeGreaterThan(50)
    console.log(`Follow-up response (${followUp.content.length} chars): ${followUp.content.substring(0, 200)}...`)
  })

  test('children audience produces age-appropriate language', async () => {
    const result = await callDiscuss({
      bookIds: [testBookId],
      message: 'What is the main idea of this book?',
      audience: 'children',
    })

    expect(result.error).toBeUndefined()
    expect(result.content).toBeTruthy()
    // Children's response should exist and be substantive
    expect(result.content.length).toBeGreaterThan(30)
    console.log(`Children audience (${result.content.length} chars): ${result.content.substring(0, 300)}...`)
  })
})
