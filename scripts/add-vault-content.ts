/**
 * CLI helper for adding AI Vault content via Claude Code.
 *
 * Usage (run from project root with tsx):
 *   npx tsx scripts/add-vault-content.ts --type tutorial --category creative-fun --title "..." --description "..." [options]
 *
 * Or import and call programmatically:
 *   import { addVaultItem, addPromptEntry } from './scripts/add-vault-content'
 *
 * This replaces the PRD-21B admin UI during the build phase.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  console.error('Set them in .env or pass as environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ---------- Types ----------

interface VaultItemInput {
  display_title: string
  detail_title?: string
  short_description: string
  full_description?: string
  content_type: 'tutorial' | 'ai_tool' | 'prompt_pack' | 'curation' | 'workflow' | 'skill'
  category_slug: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
  thumbnail_url?: string
  preview_image_url?: string
  content_body?: string
  content_url?: string
  tool_url?: string
  guided_mode_key?: string
  platform?: string
  target_platforms?: string[]
  delivery_method?: 'native' | 'embedded' | 'link_out'
  prompt_format?: 'text_llm' | 'image_gen' | 'video_gen' | 'audio_gen'
  enable_lila_optimization?: boolean
  lila_optimization_prompt?: string
  allowed_tiers?: string[]
  status?: 'draft' | 'published' | 'archived'
  is_featured?: boolean
  teen_visible?: boolean
  estimated_minutes?: number
  learning_outcomes?: string[]
  portal_description?: string
  portal_tips?: string[]
  prerequisites_text?: string
  display_order?: number
  seasonal_tags?: string[]
  gift_idea_tags?: string[]
  created_by: string // auth.users UUID
}

interface PromptEntryInput {
  vault_item_id: string
  title: string
  prompt_text: string
  variable_placeholders?: string[]
  example_outputs?: string[]
  reference_images?: string[]
  tags?: string[]
  sort_order?: number
}

// ---------- Functions ----------

export async function addVaultItem(input: VaultItemInput): Promise<string> {
  // Resolve category slug to ID
  const { data: cat, error: catErr } = await supabase
    .from('vault_categories')
    .select('id')
    .eq('slug', input.category_slug)
    .single()

  if (catErr || !cat) {
    throw new Error(`Category not found: ${input.category_slug}. Error: ${catErr?.message}`)
  }

  const { category_slug, ...rest } = input
  const row = {
    ...rest,
    category_id: cat.id,
    status: input.status || 'published',
    difficulty: input.difficulty || 'beginner',
    tags: input.tags || [],
    allowed_tiers: input.allowed_tiers || ['essential', 'enhanced', 'full_magic', 'creator'],
    target_platforms: input.target_platforms || [],
    learning_outcomes: input.learning_outcomes || [],
    portal_tips: input.portal_tips || [],
    seasonal_tags: input.seasonal_tags || [],
    gift_idea_tags: input.gift_idea_tags || [],
  }

  const { data, error } = await supabase
    .from('vault_items')
    .insert(row)
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to insert vault item: ${error.message}`)
  }

  console.log(`Created vault_item: ${data.id} — "${input.display_title}"`)
  return data.id
}

export async function addPromptEntry(input: PromptEntryInput): Promise<string> {
  const row = {
    vault_item_id: input.vault_item_id,
    title: input.title,
    prompt_text: input.prompt_text,
    variable_placeholders: input.variable_placeholders || [],
    example_outputs: input.example_outputs || [],
    reference_images: input.reference_images || [],
    tags: input.tags || [],
    sort_order: input.sort_order || 0,
  }

  const { data, error } = await supabase
    .from('vault_prompt_entries')
    .insert(row)
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to insert prompt entry: ${error.message}`)
  }

  console.log(`Created vault_prompt_entry: ${data.id} — "${input.title}"`)
  return data.id
}

export async function listCategories(): Promise<void> {
  const { data, error } = await supabase
    .from('vault_categories')
    .select('slug, display_name, sort_order')
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    console.error('Failed to list categories:', error.message)
    return
  }

  console.log('\nAvailable categories:')
  data?.forEach(c => console.log(`  ${c.slug} — ${c.display_name}`))
  console.log('')
}

export async function listItems(): Promise<void> {
  const { data, error } = await supabase
    .from('vault_items')
    .select('id, display_title, content_type, status, category_id')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Failed to list items:', error.message)
    return
  }

  console.log('\nRecent vault items:')
  data?.forEach(i => console.log(`  [${i.status}] ${i.content_type}: "${i.display_title}" (${i.id})`))
  console.log(`Total shown: ${data?.length || 0}\n`)
}

// ---------- CLI ----------

async function main() {
  const args = process.argv.slice(2)
  const cmd = args[0]

  if (cmd === 'categories') {
    await listCategories()
  } else if (cmd === 'list') {
    await listItems()
  } else {
    console.log('AI Vault Content Helper')
    console.log('')
    console.log('Commands:')
    console.log('  npx tsx scripts/add-vault-content.ts categories   — List available categories')
    console.log('  npx tsx scripts/add-vault-content.ts list         — List recent vault items')
    console.log('')
    console.log('For adding content, import this module and call addVaultItem() / addPromptEntry() programmatically.')
    console.log('Claude Code can use these functions directly to insert vault content.')
  }
}

main().catch(console.error)
