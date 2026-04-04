/**
 * useExtractionData (PRD-23, Platform Library Phase 2)
 * Fetches extraction data via get_book_extractions RPC (single query).
 * Multi-part consolidation handled at the DB level — no client-side expansion needed.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from './useFamilyMember'
import type {
  BookShelfItem,
  BookShelfChapter,
  BookExtraction,
  ExtractionType,
} from '@/types/bookshelf'

export type { BookShelfChapter }

// Backward-compatible type aliases — downstream consumers still use these names
export type BookShelfSummary = BookExtraction
export type BookShelfInsight = BookExtraction
export type BookShelfDeclaration = BookExtraction
export type BookShelfActionStep = BookExtraction
export type BookShelfQuestion = BookExtraction

export interface UseExtractionDataReturn {
  summaries: BookExtraction[]
  insights: BookExtraction[]
  declarations: BookExtraction[]
  actionSteps: BookExtraction[]
  questions: BookExtraction[]
  chapters: BookShelfChapter[]
  books: BookShelfItem[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

function groupByType(rows: BookExtraction[]): Record<ExtractionType, BookExtraction[]> {
  const result: Record<ExtractionType, BookExtraction[]> = {
    summary: [],
    insight: [],
    declaration: [],
    action_step: [],
    question: [],
  }
  for (const row of rows) {
    const bucket = result[row.extraction_type]
    if (bucket) bucket.push(row)
  }
  return result
}

const PAGE_SIZE = 1000

async function fetchAllExtractions(params: {
  p_bookshelf_item_ids: string[]
  p_member_id: string
  p_audience: string
}): Promise<BookExtraction[]> {
  const all: BookExtraction[] = []
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .rpc('get_book_extractions', params)
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error
    all.push(...((data || []) as BookExtraction[]))
    if (!data || data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return all
}

export function useExtractionData(bookIds: string[], audience?: string): UseExtractionDataReturn {
  const { data: member } = useFamilyMember()
  const [summaries, setSummaries] = useState<BookExtraction[]>([])
  const [insights, setInsights] = useState<BookExtraction[]>([])
  const [declarations, setDeclarations] = useState<BookExtraction[]>([])
  const [actionSteps, setActionSteps] = useState<BookExtraction[]>([])
  const [questions, setQuestions] = useState<BookExtraction[]>([])
  const [chapters, setChapters] = useState<BookShelfChapter[]>([])
  const [books, setBooks] = useState<BookShelfItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef(0)

  const fetchData = useCallback(async () => {
    if (!member?.family_id || !member?.id || bookIds.length === 0) {
      setLoading(false)
      return
    }

    const fetchId = ++abortRef.current
    setLoading(true)
    setError(null)

    try {
      // Fetch book records for title lookups and chapter info
      const bookRes = await supabase
        .from('bookshelf_items')
        .select('id,family_id,uploaded_by_member_id,title,author,file_type,genres,tags,extraction_status,parent_bookshelf_item_id,part_number,part_count,book_library_id,created_at,updated_at')
        .in('id', bookIds)

      if (fetchId !== abortRef.current) return
      const fetchedBooks = (bookRes.data || []) as unknown as BookShelfItem[]

      // For multi-part parents, also fetch children for chapter lookups
      const { data: childParts } = await supabase
        .from('bookshelf_items')
        .select('id,family_id,uploaded_by_member_id,title,author,file_type,genres,tags,extraction_status,parent_bookshelf_item_id,part_number,part_count,book_library_id,created_at,updated_at')
        .in('parent_bookshelf_item_id', bookIds)
        .order('part_number', { ascending: true })

      if (fetchId !== abortRef.current) return
      for (const ch of (childParts || []) as unknown as BookShelfItem[]) {
        fetchedBooks.push(ch)
      }

      // All bookshelf_item IDs to pass to the RPC (includes children for coverage)
      const allItemIds = fetchedBooks.map(b => b.id)

      const audienceFilter = audience || 'original'

      // Paginated RPC — PostgREST limits to 1000 rows per request,
      // but large multi-part books can have 1800+ extractions.
      const rpcParams = {
        p_bookshelf_item_ids: allItemIds,
        p_member_id: member.id,
        p_audience: audienceFilter,
      }

      const [allExtractions, chapRes] = await Promise.all([
        fetchAllExtractions(rpcParams),
        supabase
          .from('bookshelf_chapters')
          .select('*')
          .in('bookshelf_item_id', allItemIds)
          .order('chapter_index', { ascending: true }),
      ])

      if (fetchId !== abortRef.current) return

      const grouped = groupByType(allExtractions)

      setSummaries(grouped.summary)
      setInsights(grouped.insight)
      setDeclarations(grouped.declaration)
      setActionSteps(grouped.action_step)
      setQuestions(grouped.question)
      setChapters((chapRes.data || []) as BookShelfChapter[])
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
