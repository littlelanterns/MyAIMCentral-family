/**
 * Layered Context Assembly for LiLa Edge Functions
 *
 * Three-layer architecture:
 *   Layer 1 — Always loaded: family roster (~200 tokens)
 *   Layer 2 — On-demand: archive items, guiding stars, self-knowledge
 *             (loaded only when a person is mentioned or topic is detected)
 *   Layer 3 — Search only: book chunks, journal entries (via semantic RPCs)
 *
 * Principle: "LiLa appears smarter by knowing less at the right time."
 *
 * PRD-28 EXCLUSION: Financial data is NEVER loaded into LiLa context.
 * This includes: financial_transactions, allowance_configs, allowance_periods,
 * loans, and any dollar amounts. LiLa may reference task completion percentages
 * in general terms ("Emma has completed 84% of her tasks this week") but must
 * NEVER reference specific dollar amounts ("$11.77 earned"). This exclusion
 * is by design — no tables to load, no queries to add.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════

export interface ContextAssemblyOptions {
  familyId: string
  memberId: string
  /** Current user message — drives name detection + topic matching */
  userMessage: string
  /** Recent conversation for broader detection (last 2-4 messages) */
  recentMessages?: Array<{ role: string; content: string }>
  /** Feature-specific context line (e.g. 'Discussing book: "Uniquely Human"') */
  featureContext?: string
  /** Always load these members' Layer 2 context regardless of detection */
  alwaysIncludeMembers?: string[]
  /** Always load these topic categories regardless of detection */
  alwaysIncludeCategories?: string[]
  /** Max archive items to load per member (default 20) */
  maxItemsPerMember?: number
  /** Max total guiding stars to load (default 10) */
  maxGuidingStars?: number
  /** Max total self-knowledge items to load (default 10) */
  maxSelfKnowledge?: number
}

export interface LoadedSource {
  source: string
  memberName?: string
  reason: string
  itemCount: number
}

export interface AssembledContext {
  /** Layer 1: family roster — always present */
  familyRoster: string
  /** Feature context line — always present if provided */
  featureContext: string
  /** Layer 2: relevance-filtered context */
  relevantContext: string
  /** Metadata for explainability */
  loadedSources: LoadedSource[]
}

export interface FamilyMember {
  id: string
  display_name: string
  role: string
  age: number | null
  date_of_birth: string | null
  relationship: string | null
  nicknames: string[] | null
}

// ════════════════════════════════════════════════════════════
// Topic → Category Mapping
// ════════════════════════════════════════════════════════════

export const TOPIC_PATTERNS: Array<{ pattern: RegExp; categories: string[] }> = [
  {
    pattern: /\b(faith|spiritual|pray|prayer|church|god|scripture|bible|worship|religion)\b/i,
    categories: ['Faith & Values', 'faith'],
  },
  {
    pattern: /\b(goal|intention|plan|grow|improve|resolution|aspir|dream|vision)\b/i,
    categories: ['guiding_stars', 'best_intentions'],
  },
  {
    pattern: /\b(schedule|busy|time|week|calendar|routine|morning|evening|bedtime)\b/i,
    categories: ['Schedule & Activities'],
  },
  {
    pattern: /\b(personality|trait|strength|weakness|type|introvert|extrovert|temperament)\b/i,
    categories: ['Personality & Traits', 'self_knowledge'],
  },
  {
    pattern: /\b(food|meal|diet|cook|eat|allerg|recipe|dinner|lunch|breakfast|snack)\b/i,
    categories: ['Preferences'],
  },
  {
    pattern: /\b(school|learn|homework|curriculum|grade|teach|education|homeschool|reading)\b/i,
    categories: ['School & Learning'],
  },
  {
    pattern: /\b(health|medical|doctor|therap|medication|diagnos|disabilit|syndrome|sensory|autism|adhd)\b/i,
    categories: ['Health & Medical'],
  },
  {
    pattern: /\b(hobby|interest|sport|music|art|game|play|craft|draw|sing|dance)\b/i,
    categories: ['Interests & Hobbies'],
  },
  {
    pattern: /\b(gift|present|wish|birthday|christmas|want|surprise)\b/i,
    categories: ['Preferences', 'wishlist'],
  },
  {
    pattern: /\b(love|marriage|husband|wife|spouse|partner|relationship|romantic|date night)\b/i,
    categories: ['Relationships'],
  },
  {
    pattern: /\b(money|budget|finance|allowance|saving|spend|earn)\b/i,
    categories: ['Preferences'],
  },
  {
    pattern: /\b(book|read|wisdom|principle|framework|lesson|insight|declaration|author)\b/i,
    categories: ['bookshelf'],
  },
]

// ════════════════════════════════════════════════════════════
// Name Detection
// ════════════════════════════════════════════════════════════

/**
 * Detect family member names in text using word-boundary regex.
 * Checks display_name and nicknames. Case-insensitive.
 */
export function detectMentionedMembers(
  text: string,
  roster: FamilyMember[],
): Set<string> {
  const mentioned = new Set<string>()
  const lowerText = text.toLowerCase()

  for (const member of roster) {
    // Check display name (word boundary)
    const name = member.display_name.toLowerCase()
    if (name.length >= 2) {
      const nameRegex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i')
      if (nameRegex.test(text)) {
        mentioned.add(member.id)
        continue
      }
    }

    // Check nicknames
    if (member.nicknames && member.nicknames.length > 0) {
      for (const nick of member.nicknames) {
        if (nick && nick.length >= 2) {
          const nickRegex = new RegExp(`\\b${escapeRegex(nick.toLowerCase())}\\b`, 'i')
          if (nickRegex.test(text)) {
            mentioned.add(member.id)
            break
          }
        }
      }
    }
  }

  return mentioned
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Detect topic categories from text using keyword patterns.
 */
export function detectTopics(text: string): Set<string> {
  const categories = new Set<string>()
  for (const { pattern, categories: cats } of TOPIC_PATTERNS) {
    if (pattern.test(text)) {
      for (const cat of cats) categories.add(cat)
    }
  }
  return categories
}

// ════════════════════════════════════════════════════════════
// Main Assembly
// ════════════════════════════════════════════════════════════

export async function assembleContext(
  options: ContextAssemblyOptions,
): Promise<AssembledContext> {
  const {
    familyId,
    memberId,
    userMessage,
    recentMessages = [],
    featureContext = '',
    alwaysIncludeMembers = [],
    alwaysIncludeCategories = [],
    maxItemsPerMember = 20,
    maxGuidingStars = 10,
    maxSelfKnowledge = 10,
  } = options

  const loadedSources: LoadedSource[] = []

  // ── Layer 1: Family Roster (always loaded) ──────────────
  const { data: members } = await supabase
    .from('family_members')
    .select('id, display_name, role, age, date_of_birth, relationship, nicknames')
    .eq('family_id', familyId)
    .eq('is_active', true)

  const roster = (members || []) as FamilyMember[]
  const nameMap = new Map(roster.map(m => [m.id, m.display_name]))

  const rosterLines: string[] = ['Family Members:']
  for (const m of roster) {
    const agePart = m.age ? `, age ${m.age}` : ''
    const relPart = m.relationship ? ` (${m.relationship})` : ''
    const rolePart = m.id === memberId ? ' [current user]' : ''
    rosterLines.push(`- ${m.display_name}${agePart}${relPart}${rolePart}`)
  }

  loadedSources.push({
    source: 'family_roster',
    reason: 'always loaded',
    itemCount: roster.length,
  })

  // ── Detect relevance from conversation ──────────────────
  // Build full text from current message + recent history for detection
  const detectionText = [
    userMessage,
    ...recentMessages.slice(-4).map(m => m.content),
  ].join(' ')

  // Detect mentioned family members
  const mentionedIds = detectMentionedMembers(detectionText, roster)

  // Always include the current user
  mentionedIds.add(memberId)

  // Always include override members
  for (const id of alwaysIncludeMembers) mentionedIds.add(id)

  // Detect topic categories
  const detectedTopics = detectTopics(detectionText)

  // Add override categories
  for (const cat of alwaysIncludeCategories) detectedTopics.add(cat)

  // ── Layer 2: Relevance-Filtered Context ─────────────────
  const contextParts: string[] = []

  // 2a. Guiding Stars — only if topic matches or always for current user's top items
  const loadGuidingStars = detectedTopics.has('guiding_stars') ||
    detectedTopics.has('best_intentions') ||
    detectedTopics.size === 0 // If no specific topic, load user's top stars as baseline

  if (loadGuidingStars) {
    const { data: stars } = await supabase
      .from('guiding_stars')
      .select('content, category, entry_type')
      .eq('family_id', familyId)
      .eq('member_id', memberId)
      .eq('is_included_in_ai', true)
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .limit(detectedTopics.has('guiding_stars') ? maxGuidingStars : 5)

    if (stars && stars.length > 0) {
      contextParts.push("\nUser's Guiding Stars:")
      for (const g of stars as Array<{ content: string; category: string | null; entry_type: string | null }>) {
        const prefix = g.entry_type ? `[${g.entry_type}] ` : ''
        contextParts.push(`- ${prefix}${g.content}`)
      }
      loadedSources.push({
        source: 'guiding_stars',
        memberName: nameMap.get(memberId),
        reason: detectedTopics.has('guiding_stars') ? 'topic match: goals/values' : 'baseline (top 5)',
        itemCount: stars.length,
      })
    }
  }

  // 2b. Self-Knowledge — only if topic matches personality/traits
  const loadSelfKnowledge = detectedTopics.has('self_knowledge') ||
    detectedTopics.has('Personality & Traits')

  if (loadSelfKnowledge) {
    const { data: sk } = await supabase
      .from('self_knowledge')
      .select('content, category')
      .eq('family_id', familyId)
      .eq('member_id', memberId)
      .eq('is_included_in_ai', true)
      .is('archived_at', null)
      .order('created_at', { ascending: true })
      .limit(maxSelfKnowledge)

    if (sk && sk.length > 0) {
      contextParts.push('\nAbout the User (InnerWorkings):')
      for (const s of sk as Array<{ content: string; category: string }>) {
        const prefix = s.category && s.category !== 'general' ? `[${s.category}] ` : ''
        contextParts.push(`- ${prefix}${s.content.substring(0, 200)}`)
      }
      loadedSources.push({
        source: 'self_knowledge',
        memberName: nameMap.get(memberId),
        reason: 'topic match: personality/traits',
        itemCount: sk.length,
      })
    }
  }

  // 2c. Archive Context Items — only for mentioned members + matching topic folders
  const mentionedNonUser = [...mentionedIds].filter(id => id !== memberId)
  const loadArchiveForUser = detectedTopics.size > 0 // Only load user archives if a specific topic is detected
  const membersToLoadArchive = [
    ...(loadArchiveForUser ? [memberId] : []),
    ...mentionedNonUser,
  ]

  if (membersToLoadArchive.length > 0) {
    const archiveContext = await loadFilteredArchive(
      familyId,
      membersToLoadArchive,
      detectedTopics,
      maxItemsPerMember,
    )

    if (archiveContext.items.length > 0) {
      // Group by member name
      const grouped = new Map<string, string[]>()
      for (const item of archiveContext.items) {
        const name = item.memberId ? nameMap.get(item.memberId) || 'Family' : 'Family'
        const list = grouped.get(name) || []
        list.push(item.content)
        grouped.set(name, list)
      }

      contextParts.push('\nFamily Context:')
      for (const [name, items] of grouped) {
        contextParts.push(`\n${name}:`)
        for (const text of items) {
          contextParts.push(`- ${text}`)
        }
        loadedSources.push({
          source: 'archive_context',
          memberName: name,
          reason: archiveContext.reason,
          itemCount: items.length,
        })
      }
    }
  }

  // 2d. Faith preferences — only if faith topic detected
  if (detectedTopics.has('Faith & Values') || detectedTopics.has('faith')) {
    const { data: fp } = await supabase
      .from('faith_preferences')
      .select('faith_tradition, denomination, special_instructions, is_included_in_ai')
      .eq('family_id', familyId)
      .single()

    const faithData = fp as { faith_tradition?: string; denomination?: string; special_instructions?: string; is_included_in_ai?: boolean } | null
    if (faithData?.faith_tradition && faithData.is_included_in_ai !== false) {
      const faithLine = `\nFaith: ${faithData.faith_tradition}${faithData.denomination ? ` (${faithData.denomination})` : ''}${faithData.special_instructions ? `. ${faithData.special_instructions}` : ''}`
      contextParts.push(faithLine)
      loadedSources.push({
        source: 'faith_preferences',
        reason: 'topic match: faith/spiritual',
        itemCount: 1,
      })
    }
  }

  // 2e. BookShelf context — if bookshelf topic detected or as baseline (hearted items)
  const loadBookShelf = detectedTopics.has('bookshelf') || detectedTopics.size === 0

  if (loadBookShelf) {
    const bsCtx = await loadBookShelfContext(familyId, memberId)
    if (bsCtx.itemCount > 0) {
      contextParts.push('\nYour BookShelf Wisdom:')
      contextParts.push(...bsCtx.contextLines)
      loadedSources.push({
        source: 'bookshelf',
        reason: detectedTopics.has('bookshelf') ? `topic match: ${bsCtx.reason}` : `baseline: ${bsCtx.reason}`,
        itemCount: bsCtx.itemCount,
      })
    }
  }

  // 2f. Wishlist context — load mentioned members' wishlists that have is_included_in_ai=true
  // Useful for gift suggestions, understanding wants/needs, and general family awareness
  const membersForWishlist = [...mentionedIds].filter(id => id !== memberId)
  const wishlistTopicMatch = detectedTopics.has('Preferences') || detectedTopics.has('wishlist')
  if (membersForWishlist.length > 0 || wishlistTopicMatch) {
    const wishlistMembers = wishlistTopicMatch
      ? [...mentionedIds]
      : membersForWishlist

    for (const wMemberId of wishlistMembers) {
      const wCtx = await loadWishlistContext(familyId, wMemberId)
      if (wCtx.items.length > 0) {
        const wName = nameMap.get(wMemberId) || 'Family member'
        contextParts.push(`\n${wName}'s Wishlist:`)
        for (const item of wCtx.items) {
          contextParts.push(`- ${item}`)
        }
        loadedSources.push({
          source: 'wishlist',
          memberName: wName,
          reason: 'mentioned member has AI-included wishlist',
          itemCount: wCtx.items.length,
        })
      }
    }
  }

  return {
    familyRoster: rosterLines.join('\n'),
    featureContext,
    relevantContext: contextParts.join('\n'),
    loadedSources,
  }
}

// ════════════════════════════════════════════════════════════
// BookShelf Context (PRD-23)
// ════════════════════════════════════════════════════════════

/**
 * Load BookShelf extraction items filtered by the member's book_knowledge_access setting.
 *
 * Phase 1b-E: Rewired from 4 direct old-table queries to the single
 * get_bookshelf_context platform RPC (migration 100094, enum-fixed in 100131).
 * The RPC queries platform_intelligence.book_extractions + bookshelf_user_state,
 * handles hearted-first ordering, access-level filtering, and book title attribution.
 */
async function loadBookShelfContext(
  familyId: string,
  memberId: string,
): Promise<{ contextLines: string[]; itemCount: number; reason: string }> {
  const empty = { contextLines: [], itemCount: 0, reason: '' }

  try {
    // Check member's book_knowledge_access setting
    const { data: settings } = await supabase
      .from('bookshelf_member_settings')
      .select('book_knowledge_access')
      .eq('family_id', familyId)
      .eq('family_member_id', memberId)
      .maybeSingle()

    const access = (settings?.book_knowledge_access as string) || 'hearted_only'
    if (access === 'none') return empty

    // Map member setting to RPC access_level parameter
    // PRD-23 enum: 'hearted_only' | 'all' | 'insights_only' | 'none'
    const accessLevel = access === 'insights_only' ? 'insights_only'
      : access === 'all' ? 'all'
      : 'hearted_only' // default

    const MAX_ITEMS = 25

    const { data, error } = await supabase.rpc('get_bookshelf_context', {
      p_family_id: familyId,
      p_member_id: memberId,
      p_access_level: accessLevel,
      p_max_items: MAX_ITEMS,
    })

    if (error) {
      console.error('get_bookshelf_context RPC error:', error.message)
      return empty
    }

    if (!data || data.length === 0) return empty

    type ContextRow = {
      extraction_type: string
      text: string | null
      declaration_text: string | null
      content_type: string | null
      style_variant: string | null
      is_hearted: boolean
      book_title: string
    }

    const rows = data as ContextRow[]

    // Group by book title for cleaner output (same format as before)
    const grouped = new Map<string, string[]>()
    for (const r of rows) {
      const itemText = r.extraction_type === 'declaration'
        ? (r.declaration_text || '').substring(0, 250)
        : (r.text || '').substring(0, 250)

      const prefix = r.content_type ? `[${r.content_type}] ` : ''
      const list = grouped.get(r.book_title) || []
      list.push(`- ${prefix}${itemText}`)
      grouped.set(r.book_title, list)
    }

    const lines: string[] = []
    for (const [title, items] of grouped) {
      lines.push(`\nFrom "${title}":`)
      lines.push(...items)
    }

    const reason = accessLevel === 'hearted_only' ? 'hearted BookShelf items' :
      accessLevel === 'insights_only' ? 'BookShelf insights/principles' :
      'all BookShelf extractions'

    return { contextLines: lines, itemCount: rows.length, reason }
  } catch (err) {
    console.error('BookShelf context loading failed:', err)
    return empty
  }
}

// ════════════════════════════════════════════════════════════
// Archive Loading with Three-Tier Filtering + Topic Scoping
// ════════════════════════════════════════════════════════════

async function loadFilteredArchive(
  familyId: string,
  memberIds: string[],
  detectedTopics: Set<string>,
  maxPerMember: number,
): Promise<{
  items: Array<{ content: string; memberId: string | null }>
  reason: string
}> {
  const empty = { items: [], reason: '' }

  try {
    // Step 1: Person-level toggles
    const { data: memberSettings } = await supabase
      .from('archive_member_settings')
      .select('member_id, is_included_in_ai')
      .eq('family_id', familyId)

    const excludedMembers = new Set(
      (memberSettings ?? [])
        .filter((s: { is_included_in_ai: boolean }) => !s.is_included_in_ai)
        .map((s: { member_id: string }) => s.member_id),
    )
    const enabledMembers = memberIds.filter(id => !excludedMembers.has(id))
    if (enabledMembers.length === 0) return empty

    // Step 2: Folder-level toggles — filter by topic if topics detected
    const { data: folders } = await supabase
      .from('archive_folders')
      .select('id, folder_name, member_id, is_included_in_ai')
      .eq('family_id', familyId)
      .eq('is_included_in_ai', true)

    if (!folders || folders.length === 0) return empty

    let enabledFolders = (folders as Array<{ id: string; folder_name: string; member_id: string | null; is_included_in_ai: boolean }>)
      .filter(f => f.member_id === null || enabledMembers.includes(f.member_id))

    // If topics are detected, further filter folders to only matching categories
    const topicFolderNames = new Set<string>()
    for (const topic of detectedTopics) {
      // Direct folder name matches
      if (topic.includes('&') || topic.includes(' ')) {
        topicFolderNames.add(topic) // e.g. "Health & Medical", "Schedule & Activities"
      }
    }

    if (topicFolderNames.size > 0) {
      // Filter to only folders matching detected topics (+ General which is always relevant)
      enabledFolders = enabledFolders.filter(f => {
        if (f.folder_name === 'General') return true
        for (const topicName of topicFolderNames) {
          if (f.folder_name.toLowerCase().includes(topicName.toLowerCase())) return true
        }
        return false
      })
    }

    if (enabledFolders.length === 0) return empty

    const enabledFolderIds = enabledFolders.map(f => f.id)
    const folderOwnerMap = new Map(enabledFolders.map(f => [f.id, f.member_id]))

    // Step 3: Load items
    const totalLimit = maxPerMember * enabledMembers.length
    const { data: items } = await supabase
      .from('archive_context_items')
      .select('context_value, folder_id, member_id')
      .eq('family_id', familyId)
      .in('folder_id', enabledFolderIds)
      .eq('is_included_in_ai', true)
      .eq('is_privacy_filtered', false)
      .is('archived_at', null)
      .limit(totalLimit)

    if (!items || items.length === 0) return empty

    const result: Array<{ content: string; memberId: string | null }> = []
    for (const item of items as Array<{ context_value: string; folder_id: string; member_id: string | null }>) {
      const ownerId = item.member_id || folderOwnerMap.get(item.folder_id) || null
      result.push({
        content: item.context_value.substring(0, 200),
        memberId: ownerId,
      })
    }

    const reasons: string[] = []
    if (topicFolderNames.size > 0) reasons.push(`topic match: ${[...topicFolderNames].join(', ')}`)
    if (enabledMembers.length > 0) reasons.push('name detected in conversation')
    const reason = reasons.join(' + ') || 'relevant context'

    return { items: result, reason }
  } catch (err) {
    console.error('Filtered archive loading failed:', err)
    return empty
  }
}

// ════════════════════════════════════════════════════════════
// Wishlist Context Loading
// ════════════════════════════════════════════════════════════

/**
 * Load wishlist items for a family member who has wishlists with is_included_in_ai=true.
 * Returns formatted item strings including section, name, price, and URL.
 */
async function loadWishlistContext(
  familyId: string,
  memberId: string,
): Promise<{ items: string[] }> {
  try {
    // Find wishlists owned by this member that are AI-included
    const { data: wishlists } = await supabase
      .from('lists')
      .select('id, title')
      .eq('family_id', familyId)
      .eq('owner_id', memberId)
      .eq('list_type', 'wishlist')
      .eq('is_included_in_ai', true)
      .is('archived_at', null)

    if (!wishlists || wishlists.length === 0) return { items: [] }

    const listIds = wishlists.map((l: { id: string }) => l.id)

    // Load items from those wishlists
    const { data: listItems } = await supabase
      .from('list_items')
      .select('content, item_name, section_name, price, url, notes')
      .in('list_id', listIds)
      .eq('checked', false) // Only unchecked (unfulfilled) items
      .order('sort_order', { ascending: true })
      .limit(30)

    if (!listItems || listItems.length === 0) return { items: [] }

    type WishlistItem = { content: string; item_name: string | null; section_name: string | null; price: number | null; url: string | null; notes: string | null }

    const formatted: string[] = []
    for (const item of listItems as WishlistItem[]) {
      const name = item.item_name || item.content
      const parts = [name]
      if (item.section_name) parts.push(`(${item.section_name})`)
      if (item.price) parts.push(`~$${item.price}`)
      if (item.notes) parts.push(`— ${item.notes.substring(0, 80)}`)
      formatted.push(parts.join(' '))
    }

    return { items: formatted }
  } catch (err) {
    console.error('Wishlist context loading failed:', err)
    return { items: [] }
  }
}
