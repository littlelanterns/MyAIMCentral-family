/**
 * BookShelf types (PRD-23)
 * Column names match migration 00000000100059_prd23_bookshelf_schema.sql exactly.
 */

// ─── File & Processing Types ────────────────────────────────

export type BookFileType = 'pdf' | 'epub' | 'docx' | 'txt' | 'md' | 'image' | 'text_note'
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ExtractionStatus = 'none' | 'discovering' | 'extracting' | 'completed' | 'failed'

// ─── Extraction Content Types ───────────────────────────────

export type SummaryContentType =
  | 'key_concept' | 'story' | 'metaphor' | 'lesson' | 'quote'
  | 'insight' | 'theme' | 'character_insight' | 'exercise' | 'principle'

export type InsightContentType =
  | 'principle' | 'framework' | 'mental_model' | 'process'
  | 'strategy' | 'concept' | 'system' | 'tool_set'

export type DeclarationStyleVariant =
  | 'choosing_committing' | 'recognizing_awakening' | 'claiming_stepping_into'
  | 'learning_striving' | 'resolute_unashamed'

export type DeclarationRichness = 'rich' | 'medium' | 'concise'

export type ActionStepContentType =
  | 'exercise' | 'practice' | 'habit' | 'conversation_starter'
  | 'project' | 'daily_action' | 'weekly_practice'

export type QuestionContentType =
  | 'reflection' | 'implementation' | 'recognition'
  | 'self_examination' | 'discussion' | 'scenario'

export type ExtractionTab = 'summaries' | 'insights' | 'declarations' | 'action_steps' | 'questions'

/** Extraction type discriminator matching platform_intelligence.book_extractions.extraction_type */
export type ExtractionType = 'summary' | 'insight' | 'declaration' | 'action_step' | 'question'

export type DiscussionAudience = 'personal' | 'family' | 'teen' | 'spouse' | 'children'

export type BookKnowledgeAccess = 'hearted_only' | 'all_extracted' | 'insights_only' | 'none'

// ─── Core Tables ────────────────────────────────────────────

export interface BookShelfItem {
  id: string
  family_id: string
  uploaded_by_member_id: string
  title: string
  author: string | null
  isbn: string | null
  file_type: BookFileType
  file_name: string | null
  storage_path: string | null
  text_content: string | null
  file_size_bytes: number | null
  genres: string[]
  tags: string[]
  folder_group: string | null
  folder_id: string | null
  processing_status: ProcessingStatus
  processing_detail: string | null
  extraction_status: ExtractionStatus
  chunk_count: number
  intake_completed: boolean
  ai_summary: string | null
  toc: unknown | null
  discovered_sections: unknown | null
  book_cache_id: string | null
  book_library_id: string | null
  parent_bookshelf_item_id: string | null
  part_number: number | null
  part_count: number | null
  last_viewed_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface BookShelfChapter {
  id: string
  bookshelf_item_id: string
  chapter_index: number
  chapter_title: string
  start_chunk_index: number | null
  end_chunk_index: number | null
  created_at: string
}

// ─── Collections ────────────────────────────────────────────

export interface BookShelfCollection {
  id: string
  family_id: string
  created_by_member_id: string
  name: string
  description: string | null
  sort_order: number
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface BookShelfCollectionItem {
  id: string
  collection_id: string
  bookshelf_item_id: string
  sort_order: number
  created_at: string
}

// ─── Member Settings ────────────────────────────────────────

export interface BookShelfMemberSettings {
  id: string
  family_id: string
  family_member_id: string
  book_knowledge_access: BookKnowledgeAccess
  library_sort: string
  library_layout: string
  library_group_mode: string
  resurfaced_item_ids: string[]
  created_at: string
  updated_at: string
}

// ─── Extraction Base ────────────────────────────────────────

export interface BaseExtractionItem {
  id: string
  family_id: string
  family_member_id: string
  bookshelf_item_id: string
  section_title: string | null
  section_index: number | null
  text: string
  sort_order: number
  audience: string
  is_key_point: boolean
  is_hearted: boolean
  is_deleted: boolean
  is_from_go_deeper: boolean
  user_note: string | null
  is_included_in_ai: boolean
  created_at: string
  updated_at: string
}

// ─── Extraction Tables ──────────────────────────────────────

export interface BookShelfSummary extends BaseExtractionItem {
  content_type: SummaryContentType
}

export interface BookShelfInsight extends BaseExtractionItem {
  content_type: InsightContentType
  is_user_added: boolean
}

export interface BookShelfDeclaration extends Omit<BaseExtractionItem, 'text'> {
  content_type: string
  value_name: string | null
  declaration_text: string
  style_variant: DeclarationStyleVariant | null
  richness: DeclarationRichness | null
  sent_to_guiding_stars: boolean
  guiding_star_id: string | null
}

export interface BookShelfActionStep extends BaseExtractionItem {
  content_type: ActionStepContentType
  sent_to_tasks: boolean
  task_id: string | null
}

export interface BookShelfQuestion extends BaseExtractionItem {
  content_type: QuestionContentType
  sent_to_prompts: boolean
  journal_prompt_id: string | null
  sent_to_tasks: boolean
  task_id: string | null
}

// ─── Unified Extraction (Platform Library Phase 2) ─────────

/** Unified extraction row from get_book_extractions RPC.
 *  Combines platform_intelligence.book_extractions + bookshelf_user_state. */
export interface BookExtraction {
  id: string
  book_library_id: string
  extraction_type: ExtractionType
  text: string
  guided_text: string | null
  independent_text: string | null
  content_type: string | null
  declaration_text: string | null
  style_variant: string | null
  value_name: string | null
  richness: string | null
  section_title: string | null
  section_index: number | null
  sort_order: number
  audience: string
  is_key_point: boolean
  is_from_go_deeper: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  // User state (from LEFT JOIN — defaults applied by RPC)
  is_hearted: boolean
  user_note: string | null
  is_included_in_ai: boolean
  is_hidden: boolean
  sent_to_guiding_stars: boolean
  guiding_star_id: string | null
  sent_to_tasks: boolean
  task_id: string | null
  sent_to_prompts: boolean
  journal_prompt_id: string | null
  user_state_id: string | null
  // Backward-compat aliases for components still using BaseExtractionItem shape
  family_id?: string
  family_member_id?: string
  bookshelf_item_id?: string
  is_user_added?: boolean
}

/** Maps ExtractionTab UI name to ExtractionType DB discriminator */
export const TAB_TO_TYPE: Record<ExtractionTab, ExtractionType> = {
  summaries: 'summary',
  insights: 'insight',
  declarations: 'declaration',
  action_steps: 'action_step',
  questions: 'question',
}

/** Maps ExtractionType DB discriminator to ExtractionTab UI name */
export const TYPE_TO_TAB: Record<ExtractionType, ExtractionTab> = {
  summary: 'summaries',
  insight: 'insights',
  declaration: 'declarations',
  action_step: 'action_steps',
  question: 'questions',
}

// ─── Discussions ────────────────────────────────────────────

export type DiscussionType = 'discuss' | 'generate_goals' | 'generate_questions' | 'generate_tasks' | 'generate_tracker'

export interface BookShelfDiscussion {
  id: string
  family_id: string
  family_member_id: string
  bookshelf_item_ids: string[]
  discussion_type: DiscussionType
  audience: DiscussionAudience
  title: string | null
  created_at: string
  updated_at: string
}

export interface BookShelfDiscussionMessage {
  id: string
  discussion_id: string
  role: 'user' | 'assistant'
  content: string
  metadata: Record<string, unknown>
  created_at: string
}

// ─── Search History ────────────────────────────────────────

export interface BookShelfSearchHistoryEntry {
  id: string
  family_id: string
  member_id: string
  query: string
  mode: string
  scope: string
  result_count: number
  created_at: string
}

// ─── Journal Prompts ────────────────────────────────────────

export interface JournalPrompt {
  id: string
  family_id: string
  family_member_id: string
  prompt_text: string
  source: 'manual' | 'bookshelf_extraction'
  source_reference_id: string | null
  source_book_title: string | null
  source_chapter_title: string | null
  tags: string[]
  archived_at: string | null
  created_at: string
  updated_at: string
}
