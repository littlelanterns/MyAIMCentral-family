import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useVaultBookmarks(memberId: string | null) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!memberId) return
    supabase
      .from('vault_user_bookmarks')
      .select('vault_item_id')
      .eq('user_id', memberId)
      .then(({ data }) => {
        if (data) setBookmarkedIds(new Set(data.map(b => b.vault_item_id)))
      })
  }, [memberId])

  const toggle = useCallback(async (itemId: string) => {
    if (!memberId) return
    const isBookmarked = bookmarkedIds.has(itemId)

    // Optimistic update
    setBookmarkedIds(prev => {
      const next = new Set(prev)
      if (isBookmarked) next.delete(itemId)
      else next.add(itemId)
      return next
    })

    if (isBookmarked) {
      const { error } = await supabase
        .from('vault_user_bookmarks')
        .delete()
        .eq('user_id', memberId)
        .eq('vault_item_id', itemId)
      if (error) {
        // Revert
        setBookmarkedIds(prev => { const next = new Set(prev); next.add(itemId); return next })
      }
    } else {
      const { error } = await supabase
        .from('vault_user_bookmarks')
        .insert({ user_id: memberId, vault_item_id: itemId })
      if (error) {
        // Revert
        setBookmarkedIds(prev => { const next = new Set(prev); next.delete(itemId); return next })
      }
    }
  }, [memberId, bookmarkedIds])

  return { bookmarkedIds, toggleBookmark: toggle, isBookmarked: (id: string) => bookmarkedIds.has(id) }
}
