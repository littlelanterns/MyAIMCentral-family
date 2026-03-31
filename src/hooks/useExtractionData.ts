/**
 * useExtractionData (PRD-23)
 * Fetches extraction data for given book IDs across all 5 tables in parallel.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from './useFamilyMember'
import type {
  BookShelfItem,
  BookShelfSummary,
  BookShelfInsight,
  BookShelfDeclaration,
  BookShelfActionStep,
  BookShelfQuestion,
} from '@/types/bookshelf'

export interface BookShelfChapter {
  id: string
  bookshelf_item_id: string
  chapter_index: number
  chapter_title: string
  start_chunk_index: number | null
  end_chunk_index: number | null
  created_at: string
}

export interface UseExtractionDataReturn {
  summaries: BookShelfSummary[]
  insights: BookShelfInsight[]
  declarations: BookShelfDeclaration[]
  actionSteps: BookShelfActionStep[]
  questions: BookShelfQuestion[]
  chapters: BookShelfChapter[]
  books: BookShelfItem[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const EXTRACTION_SELECT = `id, family_id, family_member_id, bookshelf_item_id,
  section_title, section_index, sort_order, audience,
  is_key_point, is_hearted, is_deleted, is_from_go_deeper,
  user_note, is_included_in_ai, created_at, updated_at`

export function useExtractionData(bookIds: string[]): UseExtractionDataReturn {
  const { data: member } = useFamilyMember()
  const [summaries, setSummaries] = useState<BookShelfSummary[]>([])
  const [insights, setInsights] = useState<BookShelfInsight[]>([])
  const [declarations, setDeclarations] = useState<BookShelfDeclaration[]>([])
  const [actionSteps, setActionSteps] = useState<BookShelfActionStep[]>([])
  const [questions, setQuestions] = useState<BookShelfQuestion[]>([])
  const [chapters, setChapters] = useState<BookShelfChapter[]>([])
  const [books, setBooks] = useState<BookShelfItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef(0)

  const fetchData = useCallback(async () => {
    if (!member?.family_id || bookIds.length === 0) {
      setLoading(false)
      return
    }

    const fetchId = ++abortRef.current
    setLoading(true)
    setError(null)

    try {
      const [sumRes, insRes, decRes, actRes, queRes, chapRes, bookRes] = await Promise.all([
        supabase
          .from('bookshelf_summaries')
          .select(`${EXTRACTION_SELECT}, content_type, text`)
          .in('bookshelf_item_id', bookIds)
          .eq('family_member_id', member.id)
          .eq('is_deleted', false)
          .order('section_index', { ascending: true, nullsFirst: false })
          .order('sort_order', { ascending: true }),
        supabase
          .from('bookshelf_insights')
          .select(`${EXTRACTION_SELECT}, content_type, text, is_user_added`)
          .in('bookshelf_item_id', bookIds)
          .eq('family_member_id', member.id)
          .eq('is_deleted', false)
          .order('section_index', { ascending: true, nullsFirst: false })
          .order('sort_order', { ascending: true }),
        supabase
          .from('bookshelf_declarations')
          .select(`${EXTRACTION_SELECT}, value_name, declaration_text, style_variant, richness, sent_to_guiding_stars, guiding_star_id`)
          .in('bookshelf_item_id', bookIds)
          .eq('family_member_id', member.id)
          .eq('is_deleted', false)
          .order('section_index', { ascending: true, nullsFirst: false })
          .order('sort_order', { ascending: true }),
        supabase
          .from('bookshelf_action_steps')
          .select(`${EXTRACTION_SELECT}, content_type, text, sent_to_tasks, task_id`)
          .in('bookshelf_item_id', bookIds)
          .eq('family_member_id', member.id)
          .eq('is_deleted', false)
          .order('section_index', { ascending: true, nullsFirst: false })
          .order('sort_order', { ascending: true }),
        supabase
          .from('bookshelf_questions')
          .select(`${EXTRACTION_SELECT}, content_type, text, sent_to_prompts, journal_prompt_id, sent_to_tasks, task_id`)
          .in('bookshelf_item_id', bookIds)
          .eq('family_member_id', member.id)
          .eq('is_deleted', false)
          .order('section_index', { ascending: true, nullsFirst: false })
          .order('sort_order', { ascending: true }),
        supabase
          .from('bookshelf_chapters')
          .select('*')
          .in('bookshelf_item_id', bookIds)
          .order('chapter_index', { ascending: true }),
        supabase
          .from('bookshelf_items')
          .select('*')
          .in('id', bookIds),
      ])

      // Only apply if this is still the latest fetch
      if (fetchId !== abortRef.current) return

      if (sumRes.error) throw sumRes.error
      if (insRes.error) throw insRes.error
      if (decRes.error) throw decRes.error
      if (actRes.error) throw actRes.error
      if (queRes.error) throw queRes.error

      setSummaries((sumRes.data || []) as BookShelfSummary[])
      setInsights((insRes.data || []) as BookShelfInsight[])
      setDeclarations((decRes.data || []) as BookShelfDeclaration[])
      setActionSteps((actRes.data || []) as BookShelfActionStep[])
      setQuestions((queRes.data || []) as BookShelfQuestion[])
      setChapters((chapRes.data || []) as BookShelfChapter[])
      setBooks((bookRes.data || []) as BookShelfItem[])
    } catch (err) {
      if (fetchId === abortRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load extractions')
      }
    } finally {
      if (fetchId === abortRef.current) {
        setLoading(false)
      }
    }
  }, [member?.family_id, member?.id, bookIds.join(',')])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    summaries, insights, declarations, actionSteps, questions,
    chapters, books, loading, error, refetch: fetchData,
  }
}
