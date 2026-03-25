/**
 * Context Assembly Pipeline — PRD-05 LiLaEdge
 *
 * The 8-step process that builds the context sent to the AI model:
 * 1. Identify the member
 * 2. Identify the mode
 * 3. Identify the people
 * 4. Apply three-tier toggles (is_included_in_ai)
 * 5. Apply permission filters (non-mom members)
 * 6. Apply Privacy Filtered exclusion
 * 7. Apply page context
 * 8. Assemble the prompt
 *
 * This file contains the CLIENT-SIDE context assembly utilities.
 * The Edge Function has its own server-side version using the service role.
 */

import { supabase } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Conditional context loading — PRD-06/07
// Neither Guiding Stars nor InnerWorkings loads on every conversation.
// Load only when the topic warrants it.
// ---------------------------------------------------------------------------

const IDENTITY_KEYWORDS = /values?|identity|declaration|vision|purpose|meaning|who i am|choosing to be|guiding star|character|principle|faith|spiritual|believe|conviction|legacy/i
const GROWTH_KEYWORDS = /personality|trait|strength|growth|self.?know|introvert|extrovert|enneagram|mbti|processing|communication style|love language|trigger|how i work|inner.?work|temperament/i
const RELATIONAL_KEYWORDS = /relationship|marriage|spouse|partner|parenting|parent|child|conflict|communication|family dynamic|sibling|co.?parent|divorce|boundary|repair/i
const EMOTIONAL_KEYWORDS = /stress|anxious|overwhelm|emotion|feeling|burnout|self.?care|mental health|depression|anger|grief|loss|struggle|cope|heal/i
const INTENTION_KEYWORDS = /intention|mindful|practice|habit|trying to|want to be|working on|choosing to|committed to|striving|actively/i

const PRACTICAL_PAGE_CONTEXTS = new Set([
  'calendar', 'timer', 'tasks', 'lists', 'studio', 'meetings',
  'caregiver', 'homeschool_time', 'allowance', 'shopping',
])

const IDENTITY_PAGE_CONTEXTS = new Set([
  'guiding_stars', 'inner_workings', 'best_intentions', 'journal',
  'life_lantern', 'family_vision', 'victories', 'safe_harbor',
  'bigplans', 'thoughtsift', 'settings',
])

export function shouldLoadGuidingStars(
  message: string,
  pageContext?: string,
  guidedMode?: string,
): boolean {
  // Always load on identity-related pages
  if (pageContext && IDENTITY_PAGE_CONTEXTS.has(pageContext)) return true
  // Never load for purely practical contexts (unless message content overrides)
  if (pageContext && PRACTICAL_PAGE_CONTEXTS.has(pageContext) && !IDENTITY_KEYWORDS.test(message)) return false
  // Load for guided modes that benefit from identity context
  if (guidedMode && ['self_discovery', 'craft_with_lila', 'life_lantern', 'family_vision_quest', 'bigplans_planning', 'board_of_directors', 'perspective_shifter', 'decision_guide', 'mediator', 'safe_harbor'].includes(guidedMode)) return true
  // Keyword detection in message content
  if (IDENTITY_KEYWORDS.test(message)) return true
  if (RELATIONAL_KEYWORDS.test(message)) return true
  if (EMOTIONAL_KEYWORDS.test(message)) return true
  return false
}

export function shouldLoadSelfKnowledge(
  message: string,
  pageContext?: string,
  guidedMode?: string,
): boolean {
  // Always load on self-knowledge-related pages
  if (pageContext && IDENTITY_PAGE_CONTEXTS.has(pageContext)) return true
  // Never load for purely practical contexts (unless message content overrides)
  if (pageContext && PRACTICAL_PAGE_CONTEXTS.has(pageContext) && !GROWTH_KEYWORDS.test(message)) return false
  // Load for guided modes that need personality/self-knowledge context
  if (guidedMode && ['self_discovery', 'cyrano', 'higgins_say', 'higgins_navigate', 'quality_time', 'gifts', 'observe_serve', 'words_affirmation', 'gratitude', 'safe_harbor', 'board_of_directors', 'mediator', 'life_lantern', 'bigplans_planning'].includes(guidedMode)) return true
  // Keyword detection
  if (GROWTH_KEYWORDS.test(message)) return true
  if (RELATIONAL_KEYWORDS.test(message)) return true
  if (EMOTIONAL_KEYWORDS.test(message)) return true
  return false
}

export function shouldLoadBestIntentions(
  message: string,
  pageContext?: string,
  guidedMode?: string,
): boolean {
  // Always load on relevant pages
  if (pageContext === 'best_intentions' || pageContext === 'guiding_stars' || pageContext === 'journal') return true
  // Never load for purely practical contexts (unless message content overrides)
  if (pageContext && PRACTICAL_PAGE_CONTEXTS.has(pageContext) && !INTENTION_KEYWORDS.test(message)) return false
  // Load for growth-oriented guided modes
  if (guidedMode && ['life_lantern', 'bigplans_planning', 'safe_harbor', 'board_of_directors'].includes(guidedMode)) return true
  // Keyword detection
  if (INTENTION_KEYWORDS.test(message)) return true
  if (RELATIONAL_KEYWORDS.test(message)) return true
  return false
}

// ---------------------------------------------------------------------------

/** A named group of context items from a single source domain. */
export interface ContextSection {
  label: string
  items: Array<{ content: string; source?: string; visibility?: string; belongsToOtherMember?: boolean }>
}

export interface ContextBundle {
  guidingStars: Array<{ id: string; content: string; category?: string }>
  bestIntentions: Array<{ id: string; statement: string }>
  selfKnowledge: Array<{ id: string; content: string; category: string }>
  journalRecent: Array<{ id: string; content: string; entry_type: string }>
  archiveItems: Array<{ id: string; context_value: string; folder_name?: string }>
  familyMembers: Array<{ id: string; display_name: string; role: string }>
  faithPreferences: {
    tradition?: string
    denomination?: string
    response_approach?: string
    special_instructions?: string
  } | null
  // Stub sections — empty until their PRD phases are built
  archiveContext: ContextSection
  lifeLanternContext: ContextSection
  partnerContext: ContextSection
  bookShelfContext: ContextSection
  familyVisionContext: ContextSection
  personalVisionContext: ContextSection
  recentTasksContext: ContextSection
  // Page context
  pageContext: string | null
  totalInsights: number
  activeInsights: number
}

// ---------------------------------------------------------------------------
// Stub context loaders — each returns an empty ContextSection until the
// corresponding PRD phase wires in the real query.
// ---------------------------------------------------------------------------

/** STUB: Archive context items (PRD-13) — returns empty until Phase 13 */
async function loadArchiveContext(_familyId: string, _memberId: string): Promise<ContextSection> {
  // STUB: PRD-13 — wires to archive_context_items table
  return { label: 'Archives', items: [] }
}

/** STUB: LifeLantern assessments (PRD-12A) — returns empty until Phase 22 */
async function loadLifeLanternContext(_familyId: string, _memberId: string): Promise<ContextSection> {
  // STUB: PRD-12A — wires to life_lantern_areas table
  return { label: 'LifeLantern', items: [] }
}

/** STUB: Partner/spouse profile (PRD-19) — returns empty until Phase 20 */
async function loadPartnerContext(_familyId: string, _memberId: string): Promise<ContextSection> {
  // STUB: PRD-19 — wires to archive_member_settings + relationship_notes tables
  return { label: 'Partner Context', items: [] }
}

/** STUB: BookShelf insights (PRD-23) — returns empty until Phase 28 */
async function loadBookShelfContext(_familyId: string, _memberId: string): Promise<ContextSection> {
  // STUB: PRD-23 — wires to bookshelf_insights + bookshelf_member_settings tables
  return { label: 'BookShelf Insights', items: [] }
}

/** STUB: Family vision (PRD-12B) — returns empty until Phase 22 */
async function loadFamilyVisionContext(_familyId: string): Promise<ContextSection> {
  // STUB: PRD-12B — wires to family_vision_statements table
  return { label: 'Family Vision', items: [] }
}

/** STUB: Personal vision (PRD-12A) — returns empty until Phase 22 */
async function loadPersonalVisionContext(_familyId: string, _memberId: string): Promise<ContextSection> {
  // STUB: PRD-12A — wires to personal_vision_statements table
  return { label: 'Personal Vision', items: [] }
}

/** STUB: Active/recent tasks (PRD-09A) — returns empty until Phase 10 */
async function loadRecentTasksContext(_familyId: string, _memberId: string): Promise<ContextSection> {
  // STUB: PRD-09A — wires to tasks table (pending/in_progress, limit 10)
  return { label: 'Recent Tasks', items: [] }
}

/**
 * Assemble context for a conversation.
 * Reads from all available context source tables, filtered by is_included_in_ai.
 * Applies permission filtering for non-mom members (Step 5) and privacy
 * filtering (Step 6) per the PRD-05 context assembly pipeline.
 *
 * @param familyId   The family to load context for.
 * @param memberId   The member whose conversation this is.
 * @param memberRole The role of the member (used for permission/privacy steps).
 * @param pageContext Current page pathname for Step 7 (pass window.location.pathname).
 */
export async function assembleContext(
  familyId: string,
  memberId: string,
  memberRole?: string,
  pageContext?: string,
): Promise<ContextBundle> {
  const bundle: ContextBundle = {
    guidingStars: [],
    bestIntentions: [],
    selfKnowledge: [],
    journalRecent: [],
    archiveItems: [],
    familyMembers: [],
    faithPreferences: null,
    // Stub sections
    archiveContext: { label: 'Archives', items: [] },
    lifeLanternContext: { label: 'LifeLantern', items: [] },
    partnerContext: { label: 'Partner Context', items: [] },
    bookShelfContext: { label: 'BookShelf Insights', items: [] },
    familyVisionContext: { label: 'Family Vision', items: [] },
    personalVisionContext: { label: 'Personal Vision', items: [] },
    recentTasksContext: { label: 'Recent Tasks', items: [] },
    // Page context — Step 7
    pageContext: pageContext ?? null,
    totalInsights: 0,
    activeInsights: 0,
  }

  // Run all queries in parallel for performance
  const [
    guidingStarsRes,
    bestIntentionsRes,
    selfKnowledgeRes,
    journalRes,
    membersRes,
    faithRes,
    // Stub loaders — all resolve to empty ContextSections until their phases land
    archiveContextRes,
    lifeLanternContextRes,
    partnerContextRes,
    bookShelfContextRes,
    familyVisionContextRes,
    personalVisionContextRes,
    recentTasksContextRes,
  ] = await Promise.all([
    // Guiding Stars
    supabase
      .from('guiding_stars')
      .select('id, content, category, is_included_in_ai')
      .eq('family_id', familyId)
      .eq('member_id', memberId),

    // Best Intentions
    supabase
      .from('best_intentions')
      .select('id, statement, is_included_in_ai')
      .eq('family_id', familyId)
      .eq('member_id', memberId),

    // Self-Knowledge (InnerWorkings)
    supabase
      .from('self_knowledge')
      .select('id, content, category, is_included_in_ai')
      .eq('family_id', familyId)
      .eq('member_id', memberId),

    // Recent journal entries (last 10, included in AI)
    supabase
      .from('journal_entries')
      .select('id, content, entry_type, is_included_in_ai')
      .eq('family_id', familyId)
      .eq('member_id', memberId)
      .eq('is_included_in_ai', true)
      .order('created_at', { ascending: false })
      .limit(10),

    // Family members (for context awareness)
    supabase
      .from('family_members')
      .select('id, display_name, role')
      .eq('family_id', familyId)
      .eq('is_active', true),

    // Faith preferences
    supabase
      .from('faith_preferences')
      .select('tradition, denomination, response_approach, special_instructions')
      .eq('family_id', familyId)
      .maybeSingle(),

    // Stub loaders
    loadArchiveContext(familyId, memberId),
    loadLifeLanternContext(familyId, memberId),
    loadPartnerContext(familyId, memberId),
    loadBookShelfContext(familyId, memberId),
    loadFamilyVisionContext(familyId),
    loadPersonalVisionContext(familyId, memberId),
    loadRecentTasksContext(familyId, memberId),
  ])

  // Process Guiding Stars
  if (guidingStarsRes.data) {
    bundle.totalInsights += guidingStarsRes.data.length
    const active = guidingStarsRes.data.filter(g => g.is_included_in_ai)
    bundle.activeInsights += active.length
    bundle.guidingStars = active.map(g => ({ id: g.id, content: g.content, category: g.category }))
  }

  // Process Best Intentions
  if (bestIntentionsRes.data) {
    bundle.totalInsights += bestIntentionsRes.data.length
    const active = bestIntentionsRes.data.filter(b => b.is_included_in_ai)
    bundle.activeInsights += active.length
    bundle.bestIntentions = active.map(b => ({ id: b.id, statement: b.statement }))
  }

  // Process Self-Knowledge
  if (selfKnowledgeRes.data) {
    bundle.totalInsights += selfKnowledgeRes.data.length
    const active = selfKnowledgeRes.data.filter(s => s.is_included_in_ai)
    bundle.activeInsights += active.length
    bundle.selfKnowledge = active.map(s => ({ id: s.id, content: s.content, category: s.category }))
  }

  // Process Journal (already filtered by is_included_in_ai in query)
  if (journalRes.data) {
    bundle.journalRecent = journalRes.data.map(j => ({
      id: j.id,
      content: j.content,
      entry_type: j.entry_type,
    }))
  }

  // Family members
  if (membersRes.data) {
    bundle.familyMembers = membersRes.data.map(m => ({
      id: m.id,
      display_name: m.display_name,
      role: m.role,
    }))
  }

  // Faith preferences
  if (faithRes.data) {
    bundle.faithPreferences = faithRes.data
  }

  // Stub sections — wired into bundle so the architecture is in place
  bundle.archiveContext = archiveContextRes
  bundle.lifeLanternContext = lifeLanternContextRes
  bundle.partnerContext = partnerContextRes
  bundle.bookShelfContext = bookShelfContextRes
  bundle.familyVisionContext = familyVisionContextRes
  bundle.personalVisionContext = personalVisionContextRes
  bundle.recentTasksContext = recentTasksContextRes

  // ---------------------------------------------------------------------------
  // Step 5: Permission filtering for non-mom members
  // Non-mom members only see their OWN context. Full per-member permission
  // checks via member_permissions table wire in during Phase 20 (PRD-19).
  // ---------------------------------------------------------------------------
  const isMom = memberRole === 'primary_parent'
  if (!isMom) {
    // Stub sections: filter out any items marked as belonging to another member
    const stubSections: ContextSection[] = [
      bundle.archiveContext,
      bundle.lifeLanternContext,
      bundle.partnerContext,
      bundle.bookShelfContext,
      bundle.familyVisionContext,
      bundle.personalVisionContext,
      bundle.recentTasksContext,
    ]
    for (const section of stubSections) {
      section.items = section.items.filter(item => !item.belongsToOtherMember)
    }
  }

  // ---------------------------------------------------------------------------
  // Step 6: Privacy Filtered exclusion
  // Items with visibility = 'private' are NEVER included for non-mom members.
  // ---------------------------------------------------------------------------
  if (!isMom) {
    const stubSections: ContextSection[] = [
      bundle.archiveContext,
      bundle.lifeLanternContext,
      bundle.partnerContext,
      bundle.bookShelfContext,
      bundle.familyVisionContext,
      bundle.personalVisionContext,
      bundle.recentTasksContext,
    ]
    for (const section of stubSections) {
      section.items = section.items.filter(item => item.visibility !== 'private')
    }
  }

  return bundle
}

/**
 * Get a compact summary of active context for the context indicator.
 * Returns something like "Using 47 insights across 6 people"
 */
export function getContextSummary(bundle: ContextBundle): string {
  const people = bundle.familyMembers.length
  const insights = bundle.activeInsights

  if (insights === 0) {
    return 'No context loaded'
  }

  return `Using ${insights} insight${insights === 1 ? '' : 's'} across ${people} member${people === 1 ? '' : 's'}`
}

// ---------------------------------------------------------------------------
// STUB: Long conversation summarization (Post-MVP)
//
// When a conversation exceeds 50 messages, older messages should be summarized
// to keep the context window manageable and reduce token costs. For now, the
// Edge Function (lila-chat) loads only the last 20 messages per turn.
//
// Future implementation plan:
//   1. Count messages in the conversation before assembling the prompt.
//   2. If message count > 50, take messages[0..N-20] (the "old" batch).
//   3. Call Haiku with a summarization prompt to produce a rolling summary
//      (≤300 tokens) of those older messages.
//   4. Cache the summary on the conversation record
//      (e.g., lila_conversations.rolling_summary TEXT column — PRD-05 addendum).
//   5. Inject the cached summary at the top of the messages array as a
//      synthetic "system" message before the 20 most-recent turns.
//   6. Invalidate and regenerate the cache whenever the oldest un-summarized
//      message crosses the 50-message threshold again.
//
// Cost: ~1 Haiku call per 30-message batch — not metered against user credits.
// STUB: wires to lila-chat Edge Function — implement during PRD-05 Phase 2.
// ---------------------------------------------------------------------------

/**
 * STUB: Load conversation history for context assembly.
 * Returns the last 20 messages for a conversation.
 * When conversation exceeds 50 messages, older messages will be summarized
 * via Haiku and injected as a rolling summary (Post-MVP — see stub above).
 */
export async function loadConversationHistoryForContext(
  _conversationId: string,
): Promise<Array<{ role: string; content: string }>> {
  // STUB: Long conversation summarization — PRD-05 Post-MVP
  // The actual message loading happens server-side in the lila-chat Edge Function,
  // which already limits to the last 20 messages. This client-side stub exists
  // to document the future summarization hook point and keep the architecture visible.
  return []
}

// ---------------------------------------------------------------------------

/**
 * Create a snapshot of the current context state for storing on the conversation.
 * This records WHAT was active when the conversation started.
 */
export function createContextSnapshot(bundle: ContextBundle): Record<string, unknown> {
  return {
    guiding_stars_count: bundle.guidingStars.length,
    best_intentions_count: bundle.bestIntentions.length,
    self_knowledge_count: bundle.selfKnowledge.length,
    journal_entries_count: bundle.journalRecent.length,
    archive_items_count: bundle.archiveItems.length,
    family_members_count: bundle.familyMembers.length,
    faith_loaded: !!bundle.faithPreferences?.tradition,
    // Stub section counts — will be non-zero once their phases are built
    archive_context_count: bundle.archiveContext.items.length,
    life_lantern_count: bundle.lifeLanternContext.items.length,
    partner_context_count: bundle.partnerContext.items.length,
    bookshelf_count: bundle.bookShelfContext.items.length,
    family_vision_count: bundle.familyVisionContext.items.length,
    personal_vision_count: bundle.personalVisionContext.items.length,
    recent_tasks_count: bundle.recentTasksContext.items.length,
    page_context: bundle.pageContext,
    total_active: bundle.activeInsights,
    total_available: bundle.totalInsights,
    assembled_at: new Date().toISOString(),
  }
}
