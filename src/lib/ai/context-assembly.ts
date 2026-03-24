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
  totalInsights: number
  activeInsights: number
}

/**
 * Assemble context for a conversation.
 * Reads from all available context source tables, filtered by is_included_in_ai.
 */
export async function assembleContext(
  familyId: string,
  memberId: string,
): Promise<ContextBundle> {
  const bundle: ContextBundle = {
    guidingStars: [],
    bestIntentions: [],
    selfKnowledge: [],
    journalRecent: [],
    archiveItems: [],
    familyMembers: [],
    faithPreferences: null,
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
    total_active: bundle.activeInsights,
    total_available: bundle.totalInsights,
    assembled_at: new Date().toISOString(),
  }
}
