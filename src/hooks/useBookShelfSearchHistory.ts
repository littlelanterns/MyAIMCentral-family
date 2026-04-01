/**
 * useBookShelfSearchHistory (PRD-23)
 * Tracks semantic search queries for the history panel (clock icon).
 * Stores to bookshelf_search_history table, displays 20 most recent.
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from './useFamilyMember'
import type { BookShelfSearchHistoryEntry } from '@/types/bookshelf'

export function useBookShelfSearchHistory() {
  const { data: member } = useFamilyMember()
  const [history, setHistory] = useState<BookShelfSearchHistoryEntry[]>([])
  const fetchedRef = useRef(false)

  // Fetch on mount
  useEffect(() => {
    if (!member || fetchedRef.current) return
    fetchedRef.current = true

    supabase
      .from('bookshelf_search_history')
      .select('*')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setHistory(data)
      })
  }, [member])

  const saveSearch = useCallback((query: string, mode: string, scope: string, resultCount: number) => {
    if (!member) return
    supabase
      .from('bookshelf_search_history')
      .insert({
        family_id: member.family_id,
        member_id: member.id,
        query,
        mode,
        scope,
        result_count: resultCount,
      })
      .select('*')
      .single()
      .then(({ data }) => {
        if (data) {
          setHistory(prev => [data, ...prev].slice(0, 20))
        }
      })
  }, [member])

  const deleteEntry = useCallback((id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id))
    supabase.from('bookshelf_search_history').delete().eq('id', id).then()
  }, [])

  const clearAll = useCallback(() => {
    if (!member) return
    setHistory([])
    supabase.from('bookshelf_search_history').delete().eq('member_id', member.id).then()
  }, [member])

  return { history, saveSearch, deleteEntry, clearAll }
}
