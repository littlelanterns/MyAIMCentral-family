// Shared relationship context loader for PRD-21 communication tools
// Used by: lila-cyrano, lila-higgins-say, lila-higgins-navigate,
//          lila-quality-time, lila-gifts, lila-observe-serve,
//          lila-words-affirmation, lila-gratitude

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { detectTopics } from './context-assembler.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface PersonContext {
  memberId: string
  displayName: string
  role: string
  age?: number | null
  dashboardMode?: string | null
  relationship?: string | null
  loveLanguage?: string | null
  personalityType?: string | null
  howToReachMe?: string | null
  archiveItems: string[]
  negativePreferences: string[]
  selfKnowledge: Array<{ content: string; category: string }>
  /** Wishlist items (unchecked) from AI-included wishlists */
  wishlistItems: string[]
  /** Connection preferences extracted from self_knowledge for easy tool access */
  connectionPreferences: Record<string, string[]>
}

export interface RelationshipContext {
  /** Context for the user making the request */
  userContext: PersonContext
  /** Context for the selected person(s) */
  personContexts: PersonContext[]
  /** User's private notes about selected person(s) */
  privateNotes: string[]
  /** User's relationship notes for relevant pairs */
  relationshipNotes: string[]
  /** Name alias map for auto-detection */
  nameAliases: Record<string, string>
  /** Recent teaching skills used (for rotation) */
  recentSkills: string[]
  /** Total interaction count for skill-check threshold */
  totalInteractions: number
  /** User's guiding stars */
  guidingStars: string[]
  /** User's best intentions */
  bestIntentions: string[]
  /** Family faith context */
  faithContext: string
}

// ────────────────────────────────────────────────────────────────
// Main loader
// ────────────────────────────────────────────────────────────────

export async function loadRelationshipContext(
  familyId: string,
  memberId: string,
  personIds: string[],
  toolMode: string,
  /** Optional: current user message for relevance filtering */
  userMessage?: string,
  /** Optional: recent conversation messages for broader detection */
  recentMessages?: Array<{ role: string; content: string }>,
): Promise<RelationshipContext> {
  // Detect topics from user message for relevance filtering
  const detectionText = [
    userMessage || '',
    ...(recentMessages || []).slice(-4).map(m => m.content),
  ].join(' ')
  const detectedTopics = detectionText.trim() ? detectTopics(detectionText) : new Set<string>()

  // Determine scoping: if topics detected, filter; otherwise load conservatively
  const loadAllGuidingStars = detectedTopics.has('guiding_stars') || detectedTopics.has('best_intentions')
  const guidingStarsLimit = loadAllGuidingStars ? 20 : 5

  // Load all family members for name resolution
  const { data: allMembers } = await supabase
    .from('family_members')
    .select('id, display_name, role, age, date_of_birth, dashboard_mode, relationship')
    .eq('family_id', familyId)
    .eq('is_active', true)

  const members = allMembers || []

  // Build name alias map from archive_member_settings
  const { data: aliasData } = await supabase
    .from('archive_member_settings')
    .select('member_id, display_name_aliases')
    .eq('family_id', familyId)

  const nameAliases: Record<string, string> = {}
  for (const m of members) {
    // Map display_name → memberId
    nameAliases[m.display_name.toLowerCase()] = m.id
    // Map first name → memberId
    const firstName = m.display_name.split(' ')[0]?.toLowerCase()
    if (firstName) nameAliases[firstName] = m.id
  }
  // Map custom aliases
  for (const a of (aliasData || [])) {
    const aliases = a.display_name_aliases || []
    for (const alias of aliases) {
      if (alias) nameAliases[alias.toLowerCase()] = a.member_id
    }
  }

  // Parallel load of all context sources
  const [
    guidingStarsRes,
    bestIntentionsRes,
    userSelfKnowledgeRes,
    privateNotesRes,
    relationshipNotesRes,
    recentSkillsRes,
    totalCountRes,
    faithRes,
    ...personLoads
  ] = await Promise.all([
    // User's guiding stars (scoped by topic relevance)
    supabase.from('guiding_stars')
      .select('content')
      .eq('family_id', familyId)
      .eq('member_id', memberId)
      .eq('is_included_in_ai', true)
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .limit(guidingStarsLimit),
    // User's best intentions (always relevant for relationship tools)
    supabase.from('best_intentions')
      .select('statement')
      .eq('family_id', familyId)
      .eq('member_id', memberId)
      .eq('is_included_in_ai', true)
      .eq('is_active', true)
      .is('archived_at', null)
      .limit(10),
    // User's self-knowledge (always load for relationship tools — defines who they are)
    supabase.from('self_knowledge')
      .select('content, category')
      .eq('family_id', familyId)
      .eq('member_id', memberId)
      .eq('is_included_in_ai', true)
      .is('archived_at', null)
      .limit(15),
    // User's private notes about selected persons
    personIds.length > 0
      ? supabase.from('private_notes')
          .select('content, about_member_id')
          .eq('family_id', familyId)
          .eq('author_id', memberId)
          .in('about_member_id', personIds)
          .eq('is_included_in_ai', true)
      : Promise.resolve({ data: [] }),
    // Relationship notes for user ↔ selected persons
    personIds.length > 0
      ? supabase.from('relationship_notes')
          .select('content, person_a_id, person_b_id')
          .eq('family_id', familyId)
          .eq('author_id', memberId)
          .eq('is_included_in_ai', true)
      : Promise.resolve({ data: [] }),
    // Recent teaching skills for rotation
    supabase.from('teaching_skill_history')
      .select('skill_key')
      .eq('member_id', memberId)
      .eq('tool_mode', toolMode)
      .order('created_at', { ascending: false })
      .limit(10),
    // Total interaction count for skill-check mode
    supabase.from('teaching_skill_history')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('tool_mode', toolMode),
    // Faith preferences
    supabase.from('faith_preferences')
      .select('faith_tradition, denomination, special_instructions')
      .eq('family_id', familyId)
      .maybeSingle(),
    // Load context for each selected person (with topic filtering)
    ...personIds.map(pid => loadPersonContext(familyId, memberId, pid, members, detectedTopics)),
  ])

  // Filter relationship notes to only relevant pairs
  const relevantRelNotes: string[] = []
  for (const note of (relationshipNotesRes.data || []) as Array<{ content: string; person_a_id: string; person_b_id: string }>) {
    const involves = personIds.some(pid =>
      (note.person_a_id === pid || note.person_b_id === pid)
    )
    if (involves) relevantRelNotes.push(note.content)
  }

  // Build faith context string
  let faithContext = ''
  const fp = faithRes.data as { faith_tradition?: string; denomination?: string; special_instructions?: string } | null
  if (fp?.faith_tradition) {
    faithContext = `Faith: This family identifies with ${fp.faith_tradition}${fp.denomination ? ` (${fp.denomination})` : ''}. Reference when naturally relevant. Never force.`
    if (fp.special_instructions) faithContext += ` ${fp.special_instructions}`
  }

  // Build user context
  const userMember = members.find(m => m.id === memberId)
  const userSk = (userSelfKnowledgeRes.data || []) as Array<{ content: string; category: string }>

  // Extract user's connection preferences
  const userConnectionCategories = ['gift_ideas', 'meaningful_words', 'helpful_actions', 'quality_time_ideas', 'sensitivities', 'comfort_needs']
  const userConnectionPrefs: Record<string, string[]> = {}
  for (const sk of userSk) {
    if (userConnectionCategories.includes(sk.category)) {
      if (!userConnectionPrefs[sk.category]) userConnectionPrefs[sk.category] = []
      userConnectionPrefs[sk.category].push(sk.content)
    }
  }

  const userContext: PersonContext = {
    memberId,
    displayName: userMember?.display_name || 'User',
    role: userMember?.role || 'primary_parent',
    age: userMember?.age,
    dashboardMode: userMember?.dashboard_mode,
    relationship: userMember?.relationship,
    selfKnowledge: userSk,
    archiveItems: [],
    negativePreferences: [],
    wishlistItems: [],
    connectionPreferences: userConnectionPrefs,
  }

  // Extract love language from self-knowledge for user
  const userLl = userSk.find(s => s.category === 'personality_type' && s.content.toLowerCase().includes('love language'))
  if (userLl) userContext.loveLanguage = userLl.content

  return {
    userContext,
    personContexts: personLoads as PersonContext[],
    privateNotes: ((privateNotesRes.data || []) as Array<{ content: string }>).map(n => n.content),
    relationshipNotes: relevantRelNotes,
    nameAliases,
    recentSkills: ((recentSkillsRes.data || []) as Array<{ skill_key: string }>).map(s => s.skill_key),
    totalInteractions: totalCountRes.count || 0,
    guidingStars: ((guidingStarsRes.data || []) as Array<{ content: string }>).map(g => g.content),
    bestIntentions: ((bestIntentionsRes.data || []) as Array<{ statement: string }>).map(b => b.statement),
    faithContext,
  }
}

// ────────────────────────────────────────────────────────────────
// Person context loader (for each selected person)
// ────────────────────────────────────────────────────────────────

async function loadPersonContext(
  familyId: string,
  _requestingMemberId: string,
  personId: string,
  allMembers: Array<{ id: string; display_name: string; role: string; age?: number; dashboard_mode?: string; relationship?: string }>,
  detectedTopics?: Set<string>,
): Promise<PersonContext> {
  const member = allMembers.find(m => m.id === personId)

  // Parallel load person-specific context
  const [skRes, archiveRes, negPrefRes, wishlistRes] = await Promise.all([
    // Person's self-knowledge (always load — defines who they are for relationship tools)
    supabase.from('self_knowledge')
      .select('content, category')
      .eq('family_id', familyId)
      .eq('member_id', personId)
      .eq('is_included_in_ai', true)
      .is('archived_at', null)
      .limit(25), // Raised from 15 to accommodate connection preference categories
    // Person's archive items (3-tier filtered, topic-scoped when available)
    loadPersonArchiveItems(familyId, personId, detectedTopics),
    // Negative preferences (veto items)
    supabase.from('archive_context_items')
      .select('context_value')
      .eq('family_id', familyId)
      .eq('member_id', personId)
      .eq('is_negative_preference', true)
      .eq('is_included_in_ai', true)
      .is('archived_at', null),
    // Person's wishlist items (from AI-included wishlists)
    loadPersonWishlistItems(familyId, personId),
  ])

  const selfKnowledge = (skRes.data || []) as Array<{ content: string; category: string }>

  // Extract love language and personality from self-knowledge
  let loveLanguage: string | undefined
  let personalityType: string | undefined
  for (const sk of selfKnowledge) {
    if (sk.category === 'personality_type' && sk.content.toLowerCase().includes('love language')) {
      loveLanguage = sk.content
    }
    if (sk.category === 'personality_type' && !sk.content.toLowerCase().includes('love language')) {
      personalityType = sk.content
    }
  }

  // Find "How to Reach Me" card
  let howToReachMe: string | undefined
  const archiveItems = archiveRes || []
  const htrmIndex = archiveItems.findIndex(a => a.type === 'how_to_reach_me')
  if (htrmIndex !== -1) {
    howToReachMe = archiveItems[htrmIndex].content
    archiveItems.splice(htrmIndex, 1) // Don't duplicate in general items
  }

  // Extract connection preferences from self_knowledge for easy tool access
  const connectionCategories = ['gift_ideas', 'meaningful_words', 'helpful_actions', 'quality_time_ideas', 'sensitivities', 'comfort_needs']
  const connectionPreferences: Record<string, string[]> = {}
  for (const sk of selfKnowledge) {
    if (connectionCategories.includes(sk.category)) {
      if (!connectionPreferences[sk.category]) connectionPreferences[sk.category] = []
      connectionPreferences[sk.category].push(sk.content)
    }
  }

  return {
    memberId: personId,
    displayName: member?.display_name || 'Unknown',
    role: member?.role || 'member',
    age: member?.age,
    dashboardMode: member?.dashboard_mode,
    relationship: member?.relationship,
    loveLanguage,
    personalityType,
    howToReachMe,
    archiveItems: archiveItems.map(a => a.content),
    negativePreferences: ((negPrefRes.data || []) as Array<{ context_value: string }>).map(n => n.context_value),
    selfKnowledge,
    wishlistItems: wishlistRes,
    connectionPreferences,
  }
}

/** Load archive items for a specific person with 3-tier toggle filtering + topic scoping */
async function loadPersonArchiveItems(
  familyId: string,
  personId: string,
  detectedTopics?: Set<string>,
): Promise<Array<{ content: string; type?: string }>> {
  // Check person-level toggle
  const { data: memberSettings } = await supabase
    .from('archive_member_settings')
    .select('is_included_in_ai')
    .eq('family_id', familyId)
    .eq('member_id', personId)
    .maybeSingle()

  if (memberSettings && !memberSettings.is_included_in_ai) return []

  // Load enabled folders for this person
  const { data: folders } = await supabase
    .from('archive_folders')
    .select('id, folder_name')
    .eq('family_id', familyId)
    .eq('member_id', personId)
    .eq('is_included_in_ai', true)

  if (!folders || folders.length === 0) return []

  // Topic-scope folders if topics were detected
  let filteredFolders = folders as Array<{ id: string; folder_name: string }>
  if (detectedTopics && detectedTopics.size > 0) {
    // Build set of topic-matching folder names
    const topicFolderNames = new Set<string>()
    for (const topic of detectedTopics) {
      if (topic.includes('&') || topic.includes(' ')) {
        topicFolderNames.add(topic) // e.g. "Health & Medical", "Personality & Traits"
      }
    }

    if (topicFolderNames.size > 0) {
      filteredFolders = filteredFolders.filter(f => {
        // Always include General and Preferences (widely relevant for relationship tools)
        if (f.folder_name === 'General' || f.folder_name === 'Preferences') return true
        for (const topicName of topicFolderNames) {
          if (f.folder_name.toLowerCase().includes(topicName.toLowerCase())) return true
        }
        return false
      })
    }
  }

  if (filteredFolders.length === 0) return []
  const folderIds = filteredFolders.map(f => f.id)

  // Load items from enabled (and topic-scoped) folders
  const { data: items } = await supabase
    .from('archive_context_items')
    .select('context_value, context_type, is_negative_preference')
    .eq('family_id', familyId)
    .in('folder_id', folderIds)
    .eq('is_included_in_ai', true)
    .eq('is_negative_preference', false)
    .is('archived_at', null)
    .limit(50)

  return (items || []).map((item: { context_value: string; context_type?: string }) => ({
    content: item.context_value,
    type: item.context_type || undefined,
  }))
}

// ────────────────────────────────────────────────────────────────
// Wishlist loader for person context
// ────────────────────────────────────────────────────────────────

async function loadPersonWishlistItems(
  familyId: string,
  personId: string,
): Promise<string[]> {
  try {
    const { data: wishlists } = await supabase
      .from('lists')
      .select('id')
      .eq('family_id', familyId)
      .eq('owner_id', personId)
      .eq('list_type', 'wishlist')
      .eq('is_included_in_ai', true)
      .is('archived_at', null)

    if (!wishlists || wishlists.length === 0) return []

    const listIds = wishlists.map((l: { id: string }) => l.id)

    const { data: items } = await supabase
      .from('list_items')
      .select('content, item_name, section_name, price, notes')
      .in('list_id', listIds)
      .eq('checked', false)
      .order('sort_order', { ascending: true })
      .limit(20)

    if (!items || items.length === 0) return []

    type WItem = { content: string; item_name: string | null; section_name: string | null; price: number | null; notes: string | null }
    return (items as WItem[]).map(item => {
      const name = item.item_name || item.content
      const parts = [name]
      if (item.section_name) parts.push(`(${item.section_name})`)
      if (item.price) parts.push(`~$${item.price}`)
      if (item.notes) parts.push(`— ${item.notes.substring(0, 60)}`)
      return parts.join(' ')
    })
  } catch {
    return []
  }
}

// ────────────────────────────────────────────────────────────────
// Formatting helpers
// ────────────────────────────────────────────────────────────────

/** Format person context into a prompt block */
export function formatPersonContextBlock(person: PersonContext): string {
  const lines: string[] = []
  lines.push(`## About ${person.displayName}`)
  lines.push(`Role: ${person.role}${person.age ? `, Age: ${person.age}` : ''}`)

  if (person.howToReachMe) {
    lines.push(`\n### HOW TO REACH ${person.displayName.toUpperCase()} (HIGH PRIORITY)`)
    lines.push(person.howToReachMe)
  }

  if (person.loveLanguage) {
    lines.push(`\nLove Language: ${person.loveLanguage}`)
  }
  if (person.personalityType) {
    lines.push(`Personality: ${person.personalityType}`)
  }

  if (person.selfKnowledge.length > 0) {
    lines.push(`\n### What I Know About ${person.displayName}`)
    for (const sk of person.selfKnowledge.slice(0, 15)) {
      lines.push(`- [${sk.category}] ${sk.content}`)
    }
  }

  if (person.archiveItems.length > 0) {
    lines.push(`\n### Context Items`)
    for (const item of person.archiveItems.slice(0, 20)) {
      lines.push(`- ${item}`)
    }
  }

  // Connection preferences — organized by category for easy tool consumption
  const connCatLabels: Record<string, string> = {
    gift_ideas: 'Things They\'d Love (Gifts)',
    meaningful_words: 'Words That Mean Something',
    helpful_actions: 'What Really Helps',
    quality_time_ideas: 'Ways to Spend Time Together',
    sensitivities: 'Good to Know (Handle Thoughtfully)',
    comfort_needs: 'What Makes a Bad Day Better',
  }
  const hasConnectionPrefs = person.connectionPreferences && Object.keys(person.connectionPreferences).length > 0
  if (hasConnectionPrefs) {
    lines.push(`\n### Connection Preferences for ${person.displayName}`)
    for (const [cat, items] of Object.entries(person.connectionPreferences)) {
      const label = connCatLabels[cat] || cat
      lines.push(`\n**${label}:**`)
      for (const item of items) {
        lines.push(`- ${item}`)
      }
    }
  }

  // Wishlist items
  if (person.wishlistItems && person.wishlistItems.length > 0) {
    lines.push(`\n### ${person.displayName}'s Wishlist`)
    for (const item of person.wishlistItems.slice(0, 15)) {
      lines.push(`- ${item}`)
    }
  }

  if (person.negativePreferences.length > 0) {
    lines.push(`\n### AVOID SUGGESTING (silently skip these — do not mention they were vetoed)`)
    for (const pref of person.negativePreferences) {
      lines.push(`- ${pref}`)
    }
  }

  return lines.join('\n')
}

/** Format the full context for injection into system prompt */
export function formatRelationshipContextForPrompt(ctx: RelationshipContext): string {
  const sections: string[] = [
    `CONTEXT REFERENCE RULES: When referencing any context below in your response, frame through growth and aspiration — never deficit or diagnosis. Say "building patience" not "anger management." Quote the user's own words when possible. Never label the user or family members with clinical terminology they did not use themselves.`,
  ]

  // User's own context (brief)
  if (ctx.guidingStars.length > 0) {
    sections.push(`## Your Guiding Stars\n${ctx.guidingStars.map(g => `- ${g}`).join('\n')}`)
  }

  if (ctx.userContext.selfKnowledge.length > 0) {
    sections.push(`## Your InnerWorkings\n${ctx.userContext.selfKnowledge.slice(0, 10).map(s => `- [${s.category}] ${s.content}`).join('\n')}`)
  }

  // Person context blocks
  for (const person of ctx.personContexts) {
    sections.push(formatPersonContextBlock(person))
  }

  // Private notes
  if (ctx.privateNotes.length > 0) {
    sections.push(`## Your Private Notes\n${ctx.privateNotes.map(n => `- ${n}`).join('\n')}`)
  }

  // Relationship notes
  if (ctx.relationshipNotes.length > 0) {
    sections.push(`## Relationship Notes\n${ctx.relationshipNotes.map(n => `- ${n}`).join('\n')}`)
  }

  // Name aliases
  const aliasEntries = Object.entries(ctx.nameAliases)
  if (aliasEntries.length > 0) {
    const aliasLines = aliasEntries.slice(0, 30).map(([alias, _id]) => alias).join(', ')
    sections.push(`## Known Names & Nicknames\n${aliasLines}`)
  }

  // Faith context
  if (ctx.faithContext) {
    sections.push(ctx.faithContext)
  }

  return sections.join('\n\n')
}

// ────────────────────────────────────────────────────────────────
// Skill rotation helper
// ────────────────────────────────────────────────────────────────

/** Pick a skill that hasn't been used recently, preferring unused ones */
export function pickNextSkill(allSkills: string[], recentSkills: string[]): string {
  // Filter out the most recently used skill
  const lastUsed = recentSkills[0]
  const available = allSkills.filter(s => s !== lastUsed)

  // Prefer skills not in recent history at all
  const unused = available.filter(s => !recentSkills.includes(s))
  if (unused.length > 0) {
    return unused[Math.floor(Math.random() * unused.length)]
  }

  // Fall back to any skill except the most recent
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)]
  }

  // Last resort: use any skill
  return allSkills[Math.floor(Math.random() * allSkills.length)]
}

// ────────────────────────────────────────────────────────────────
// Teaching skill save helper
// ────────────────────────────────────────────────────────────────

export async function saveTeachingSkill(
  familyId: string,
  memberId: string,
  toolMode: string,
  skillKey: string,
  aboutMemberId?: string,
  conversationId?: string,
) {
  await supabase.from('teaching_skill_history').insert({
    family_id: familyId,
    member_id: memberId,
    tool_mode: toolMode,
    skill_key: skillKey,
    about_member_id: aboutMemberId || null,
    lila_conversation_id: conversationId || null,
  })
}

// ────────────────────────────────────────────────────────────────
// Veto write-back helper
// ────────────────────────────────────────────────────────────────

export async function saveVetoItem(
  familyId: string,
  addedBy: string,
  aboutMemberId: string,
  vetoContent: string,
  conversationId?: string,
) {
  // folder_id is NOT NULL — find the person's member_root folder
  const { data: rootFolder } = await supabase
    .from('archive_folders')
    .select('id')
    .eq('family_id', familyId)
    .eq('member_id', aboutMemberId)
    .eq('folder_type', 'member_root')
    .maybeSingle()

  if (!rootFolder) return // Can't save without a folder

  await supabase.from('archive_context_items').insert({
    family_id: familyId,
    folder_id: rootFolder.id,
    member_id: aboutMemberId,
    context_value: vetoContent,
    context_type: 'preference',
    is_negative_preference: true,
    is_included_in_ai: true,
    source: 'lila_conversation',
    source_conversation_id: conversationId || null,
    added_by: addedBy,
  })
}
