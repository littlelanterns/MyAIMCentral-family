/**
 * useExtractionData (PRD-23)
 * Fetches extraction data for given book IDs across all 5 tables in parallel.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from './useFamilyMember'
import type {
  BookShelfItem,
  BookShelfChapter,
  BookShelfSummary,
  BookShelfInsight,
  BookShelfDeclaration,
  BookShelfActionStep,
  BookShelfQuestion,
} from '@/types/bookshelf'

export type { BookShelfChapter }

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

export function useExtractionData(bookIds: string[], audience?: string): UseExtractionDataReturn {
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
      // For multi-part books, extractions live on child parts, not the parent.
      // First fetch the book records, then expand the extraction query to
      // include children (when viewing a parent) and parent (when viewing a part).
      const bookRes = await supabase
        .from('bookshelf_items')
        .select('id,family_id,uploaded_by_member_id,title,author,file_type,genres,tags,extraction_status,parent_bookshelf_item_id,part_number,part_count,created_at,updated_at')
        .in('id', bookIds)

      if (fetchId !== abortRef.current) return

      const fetchedBooks = (bookRes.data || []) as BookShelfItem[]

      // Build expanded ID set for extraction queries
      const extractionIds = new Set(bookIds)

      // If this is a child part, also search the parent
      for (const b of fetchedBooks) {
        if (b.parent_bookshelf_item_id) {
          extractionIds.add(b.parent_bookshelf_item_id)
        }
      }

      // Always check for children of the requested books — extractions
      // on multi-part books live on the child parts, not the parent.
      const { data: childParts } = await supabase
        .from('bookshelf_items')
        .select('id,family_id,uploaded_by_member_id,title,author,file_type,genres,tags,extraction_status,parent_bookshelf_item_id,part_number,part_count,created_at,updated_at')
        .in('parent_bookshelf_item_id', bookIds)
        .order('part_number', { ascending: true })
      if (fetchId !== abortRef.current) return
      for (const ch of (childParts || []) as BookShelfItem[]) {
        extractionIds.add(ch.id)
        fetchedBooks.push(ch)
      }

      const extractionIdArray = Array.from(extractionIds)

      const audienceFilter = audience || 'original'

      const [sumRes, insRes, decRes, actRes, queRes, chapRes] = await Promise.all([
        supabase
          .from('bookshelf_summaries')
          .select(`${EXTRACTION_SELECT}, content_type, text`)
          .in('bookshelf_item_id', extractionIdArray)
          .eq('family_id', member.family_id)
          .eq('audience', audienceFilter)
          .eq('is_deleted', false)
          .order('section_index', { ascending: true, nullsFirst: false })
          .order('sort_order', { ascending: true }),
        supabase
          .from('bookshelf_insights')
          .select(`${EXTRACTION_SELECT}, content_type, text, is_user_added`)
          .in('bookshelf_item_id', extractionIdArray)
          .eq('family_id', member.family_id)
          .eq('audience', audienceFilter)
          .eq('is_deleted', false)
          .order('section_index', { ascending: true, nullsFirst: false })
          .order('sort_order', { ascending: true }),
        supabase
          .from('bookshelf_declarations')
          .select(`${EXTRACTION_SELECT}, value_name, declaration_text, style_variant, richness, sent_to_guiding_stars, guiding_star_id`)
          .in('bookshelf_item_id', extractionIdArray)
          .eq('family_id', member.family_id)
          .eq('audience', audienceFilter)
          .eq('is_deleted', false)
          .order('section_index', { ascending: true, nullsFirst: false })
          .order('sort_order', { ascending: true }),
        supabase
          .from('bookshelf_action_steps')
          .select(`${EXTRACTION_SELECT}, content_type, text, sent_to_tasks, task_id`)
          .in('bookshelf_item_id', extractionIdArray)
          .eq('family_id', member.family_id)
          .eq('audience', audienceFilter)
          .eq('is_deleted', false)
          .order('section_index', { ascending: true, nullsFirst: false })
          .order('sort_order', { ascending: true }),
        supabase
          .from('bookshelf_questions')
          .select(`${EXTRACTION_SELECT}, content_type, text, sent_to_prompts, journal_prompt_id, sent_to_tasks, task_id`)
          .in('bookshelf_item_id', extractionIdArray)
          .eq('family_id', member.family_id)
          .eq('audience', audienceFilter)
          .eq('is_deleted', false)
          .order('section_index', { ascending: true, nullsFirst: false })
          .order('sort_order', { ascending: true }),
        supabase
          .from('bookshelf_chapters')
          .select('*')
          .in('bookshelf_item_id', extractionIdArray)
          .order('chapter_index', { ascending: true }),
      ])

      // Only apply if this is still the latest fetch
      if (fetchId !== abortRef.current) return

      if (sumRes.error) throw sumRes.error
      if (insRes.error) throw insRes.error
      if (decRes.error) throw decRes.error
      if (actRes.error) throw actRes.error
      if (queRes.error) throw queRes.error

      // For multi-part books: sort extractions by part_number, then section_index, then sort_order
      // so chapters from Part 1 come before Part 2, etc.
      const partNumMap = new Map<string, number>()
      for (const b of fetchedBooks) {
        if (b.part_number != null) partNumMap.set(b.id, b.part_number)
      }
      const hasMultipleParts = partNumMap.size > 0

      function sortByPart<T extends { bookshelf_item_id: string; section_index?: number | null; sort_order?: number | null }>(items: T[]): T[] {
        if (!hasMultipleParts) return items
        return items.sort((a, b) => {
          const pa = partNumMap.get(a.bookshelf_item_id) ?? 0
          const pb = partNumMap.get(b.bookshelf_item_id) ?? 0
          if (pa !== pb) return pa - pb
          const sa = a.section_index ?? 999
          const sb = b.section_index ?? 999
          if (sa !== sb) return sa - sb
          return (a.sort_order ?? 0) - (b.sort_order ?? 0)
        })
      }

      setSummaries(sortByPart((sumRes.data || []) as BookShelfSummary[]))
      setInsights(sortByPart((insRes.data || []) as BookShelfInsight[]))
      setDeclarations(sortByPart((decRes.data || []) as BookShelfDeclaration[]))
      setActionSteps(sortByPart((actRes.data || []) as BookShelfActionStep[]))
      setQuestions(sortByPart((queRes.data || []) as BookShelfQuestion[]))
      setChapters(hasMultipleParts
        ? (chapRes.data || [] as BookShelfChapter[]).sort((a: BookShelfChapter, b: BookShelfChapter) => {
            const pa = partNumMap.get(a.bookshelf_item_id) ?? 0
            const pb = partNumMap.get(b.bookshelf_item_id) ?? 0
            return pa !== pb ? pa - pb : a.chapter_index - b.chapter_index
          })
        : (chapRes.data || []) as BookShelfChapter[])
      setBooks(fetchedBooks)
    } catch (err) {
      if (fetchId === abortRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load extractions')
      }
    } finally {
      if (fetchId === abortRef.current) {
        setLoading(false)
      }
    }
  }, [member?.family_id, member?.id, bookIds.join(','), audience])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    summaries, insights, declarations, actionSteps, questions,
    chapters, books, loading, error, refetch: fetchData,
  }
}
