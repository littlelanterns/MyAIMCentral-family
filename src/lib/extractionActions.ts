/**
 * Layer 1: Pure Extraction Action Functions (PRD-23)
 * Database operations as pure async functions. No React state, no UI concerns.
 */
import { supabase } from '@/lib/supabase/client'

export type ExtractionTable =
  | 'bookshelf_summaries'
  | 'bookshelf_insights'
  | 'bookshelf_declarations'
  | 'bookshelf_action_steps'
  | 'bookshelf_questions'

/** Column that holds the main text for each table */
const TEXT_COLUMN: Record<ExtractionTable, string> = {
  bookshelf_summaries: 'text',
  bookshelf_insights: 'text',
  bookshelf_declarations: 'declaration_text',
  bookshelf_action_steps: 'text',
  bookshelf_questions: 'text',
}

// ── Item-level actions ─────────────────────────────────────────────────────

export async function toggleExtractionHeart(
  table: ExtractionTable,
  id: string,
  hearted: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from(table)
    .update({ is_hearted: hearted })
    .eq('id', id)
  return !error
}

export async function updateExtractionNote(
  table: ExtractionTable,
  id: string,
  note: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from(table)
    .update({ user_note: note || null })
    .eq('id', id)
  return !error
}

export async function softDeleteExtractionItem(
  table: ExtractionTable,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from(table)
    .update({ is_deleted: true })
    .eq('id', id)
  return !error
}

export async function updateExtractionText(
  table: ExtractionTable,
  id: string,
  text: string
): Promise<boolean> {
  const col = TEXT_COLUMN[table]
  const { error } = await supabase
    .from(table)
    .update({ [col]: text })
    .eq('id', id)
  return !error
}

// ── Apply This routing actions ─────────────────────────────────────────────

interface SendToGuidingStarsData {
  familyId: string
  memberId: string
  text: string
  sourceItemId: string
  sourceTable: ExtractionTable
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

  // Update tracking on declarations
  if (data.sourceTable === 'bookshelf_declarations') {
    await supabase
      .from('bookshelf_declarations')
      .update({ sent_to_guiding_stars: true, guiding_star_id: gs.id })
      .eq('id', data.sourceItemId)
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

  // Update tracking on questions
  await supabase
    .from('bookshelf_questions')
    .update({ sent_to_prompts: true, journal_prompt_id: jp.id })
    .eq('id', data.sourceItemId)

  return { promptId: jp.id }
}

/** After a task is created from BookShelf, update tracking on the source item */
export async function markSentToTasks(
  table: ExtractionTable,
  itemId: string,
  taskId: string
): Promise<boolean> {
  if (table === 'bookshelf_action_steps' || table === 'bookshelf_questions') {
    const { error } = await supabase
      .from(table)
      .update({ sent_to_tasks: true, task_id: taskId })
      .eq('id', itemId)
    return !error
  }
  return true
}
