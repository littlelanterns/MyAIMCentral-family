/**
 * Layer 1: Extraction Action Functions (PRD-23, Platform Library Phase 2)
 * Database operations as pure async functions. No React state, no UI concerns.
 *
 * Phase 2 migration: actions now target bookshelf_user_state (personal state)
 * and platform_intelligence.book_extractions (via RPCs for platform-level writes).
 */
import { supabase } from '@/lib/supabase/client'
import type { ExtractionType } from '@/types/bookshelf'

// Re-export for backward compatibility — components import ExtractionType from here
export type { ExtractionType }

// ── Item-level actions (bookshelf_user_state) ────────────────────────────────

async function upsertUserState(
  extractionId: string,
  memberId: string,
  familyId: string,
  fields: Record<string, unknown>
): Promise<boolean> {
  const { error } = await supabase
    .from('bookshelf_user_state')
    .upsert(
      { extraction_id: extractionId, member_id: memberId, family_id: familyId, ...fields },
      { onConflict: 'member_id,extraction_id' }
    )
  return !error
}

export async function toggleExtractionHeart(
  _type: ExtractionType,
  id: string,
  hearted: boolean,
  memberId: string,
  familyId: string
): Promise<boolean> {
  return upsertUserState(id, memberId, familyId, { is_hearted: hearted })
}

export async function updateExtractionNote(
  _type: ExtractionType,
  id: string,
  note: string | null,
  memberId: string,
  familyId: string
): Promise<boolean> {
  return upsertUserState(id, memberId, familyId, { user_note: note || null })
}

export async function softDeleteExtractionItem(
  _type: ExtractionType,
  id: string,
  memberId: string,
  familyId: string
): Promise<boolean> {
  return upsertUserState(id, memberId, familyId, { is_hidden: true })
}

export async function updateExtractionText(
  type: ExtractionType,
  id: string,
  text: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('update_extraction_text', {
    p_extraction_id: id,
    p_extraction_type: type,
    p_text: text,
  })
  return !error && data === true
}

// ── Apply This routing actions ───────────────────────────────────────────────

interface SendToGuidingStarsData {
  familyId: string
  memberId: string
  text: string
  sourceItemId: string
  sourceType: ExtractionType
}

export async function sendToGuidingStars(
  data: SendToGuidingStarsData
): Promise<{ guidingStarId: string } | null> {
  const { data: gs, error } = await supabase
    .from('guiding_stars')
    .insert({
      family_id: data.familyId,
      member_id: data.memberId,
      content: data.text,
      entry_type: 'declaration',
      source: 'bookshelf',
      source_reference_id: data.sourceItemId,
      is_included_in_ai: true,
    })
    .select('id')
    .single()

  if (error || !gs) return null

  // Update tracking on user state for declarations
  if (data.sourceType === 'declaration') {
    await upsertUserState(data.sourceItemId, data.memberId, data.familyId, {
      sent_to_guiding_stars: true,
      guiding_star_id: gs.id,
    })
  }

  return { guidingStarId: gs.id }
}

interface SendToBestIntentionsData {
  familyId: string
  memberId: string
  text: string
  sourceItemId: string
}

export async function sendToBestIntentions(
  data: SendToBestIntentionsData
): Promise<{ bestIntentionId: string } | null> {
  const { data: bi, error } = await supabase
    .from('best_intentions')
    .insert({
      family_id: data.familyId,
      member_id: data.memberId,
      statement: data.text,
      source: 'bookshelf',
      source_reference_id: data.sourceItemId,
      is_included_in_ai: true,
      is_active: true,
    })
    .select('id')
    .single()

  if (error || !bi) return null
  return { bestIntentionId: bi.id }
}

interface SendToJournalPromptsData {
  familyId: string
  memberId: string
  text: string
  sourceItemId: string
  bookTitle: string | null
  chapterTitle: string | null
}

export async function sendToJournalPrompts(
  data: SendToJournalPromptsData
): Promise<{ promptId: string } | null> {
  const { data: jp, error } = await supabase
    .from('journal_prompts')
    .insert({
      family_id: data.familyId,
      family_member_id: data.memberId,
      prompt_text: data.text,
      source: 'bookshelf_extraction',
      source_reference_id: data.sourceItemId,
      source_book_title: data.bookTitle,
      source_chapter_title: data.chapterTitle,
    })
    .select('id')
    .single()

  if (error || !jp) return null

  // Update tracking on user state
  await upsertUserState(data.sourceItemId, data.memberId, data.familyId, {
    sent_to_prompts: true,
    journal_prompt_id: jp.id,
  })

  return { promptId: jp.id }
}

// ── Send to Queue (PRD-17) ──────────────────────────────────────────────────

interface SendToQueueData {
  familyId: string
  memberId: string
  text: string
  sourceItemId: string
  sourceType: ExtractionType
  bookTitle: string | null
}

export async function sendToQueue(
  data: SendToQueueData
): Promise<{ queueItemId: string } | null> {
  const content = data.bookTitle
    ? `[From "${data.bookTitle}"] ${data.text}`
    : data.text

  const { data: qi, error } = await supabase
    .from('studio_queue')
    .insert({
      family_id: data.familyId,
      owner_id: data.memberId,
      destination: 'task',
      content,
      source: 'bookshelf',
      source_reference_id: data.sourceItemId,
      content_details: { extraction_type: data.sourceType, book_title: data.bookTitle },
    })
    .select('id')
    .single()

  if (error || !qi) return null
  return { queueItemId: qi.id }
}

// ── Send to InnerWorkings / Self-Knowledge (PRD-07) ─────────────────────────

interface SendToSelfKnowledgeData {
  familyId: string
  memberId: string
  text: string
  sourceItemId: string
  sourceType: ExtractionType
  category?: string
}

export async function sendToSelfKnowledge(
  data: SendToSelfKnowledgeData
): Promise<{ selfKnowledgeId: string } | null> {
  const { data: sk, error } = await supabase
    .from('self_knowledge')
    .insert({
      family_id: data.familyId,
      member_id: data.memberId,
      content: data.text,
      category: data.category || 'general',
      source_type: 'content_extraction',
      source_reference_id: data.sourceItemId,
      source: data.sourceType,
      is_included_in_ai: true,
    })
    .select('id')
    .single()

  if (error || !sk) return null
  return { selfKnowledgeId: sk.id }
}

// ── Custom Manual Additions (PRD-23) ────────────────────────────────────────

interface CreateCustomInsightData {
  familyId: string
  memberId: string
  bookLibraryId: string
  text: string
  contentType: string
  sectionTitle?: string
}

export async function createCustomInsight(
  data: CreateCustomInsightData
): Promise<{ insightId: string } | null> {
  const { data: result, error } = await supabase.rpc('create_custom_extraction', {
    p_book_library_id: data.bookLibraryId,
    p_extraction_type: 'insight',
    p_text: data.text,
    p_content_type: data.contentType,
    p_section_title: data.sectionTitle || null,
  })

  if (error || !result) return null
  return { insightId: result as string }
}

/** After a task is created from BookShelf, update tracking on user state */
export async function markSentToTasks(
  type: ExtractionType,
  itemId: string,
  taskId: string,
  memberId: string,
  familyId: string
): Promise<boolean> {
  if (type === 'action_step' || type === 'question') {
    return upsertUserState(itemId, memberId, familyId, {
      sent_to_tasks: true,
      task_id: taskId,
    })
  }
  return true
}
