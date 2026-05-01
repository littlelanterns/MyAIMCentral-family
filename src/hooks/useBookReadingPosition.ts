/**
 * useBookReadingPosition — persist and restore reading position per book.
 * Stores { sectionTitle, scrollY, activeTab, updatedAt } in
 * bookshelf_member_settings.reading_positions JSONB keyed by book_library_id.
 */
import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from './useFamilyMember'

export interface ReadingPosition {
  sectionTitle: string | null
  scrollY: number
  activeTab: string
  updatedAt: string
}

interface UseBookReadingPositionOptions {
  bookLibraryId: string | undefined
  activeTab: string
  scrollContainerRef: React.RefObject<HTMLElement | null>
}

export function useBookReadingPosition({
  bookLibraryId,
  activeTab,
  scrollContainerRef,
}: UseBookReadingPositionOptions) {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id
  const memberId = member?.id
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restoredRef = useRef(false)
  const lastSavedRef = useRef<string>('')

  const save = useCallback(async (position: ReadingPosition) => {
    if (!familyId || !memberId || !bookLibraryId) return
    const key = `${bookLibraryId}:${position.scrollY}:${position.activeTab}`
    if (key === lastSavedRef.current) return
    lastSavedRef.current = key

    const { data: existing } = await supabase
      .from('bookshelf_member_settings')
      .select('id, reading_positions')
      .eq('family_id', familyId)
      .eq('family_member_id', memberId)
      .maybeSingle()

    const positions = (existing?.reading_positions as Record<string, ReadingPosition>) || {}
    positions[bookLibraryId] = position

    if (existing?.id) {
      await supabase
        .from('bookshelf_member_settings')
        .update({ reading_positions: positions })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('bookshelf_member_settings')
        .upsert({
          family_id: familyId,
          family_member_id: memberId,
          reading_positions: positions,
        }, { onConflict: 'family_id,family_member_id' })
    }
  }, [familyId, memberId, bookLibraryId])

  const debouncedSave = useCallback((position: ReadingPosition) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => save(position), 2000)
  }, [save])

  // Restore position on mount
  useEffect(() => {
    if (!familyId || !memberId || !bookLibraryId || restoredRef.current) return
    restoredRef.current = true

    ;(async () => {
      const { data } = await supabase
        .from('bookshelf_member_settings')
        .select('reading_positions')
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .maybeSingle()

      if (!data?.reading_positions) return
      const positions = data.reading_positions as Record<string, ReadingPosition>
      const saved = positions[bookLibraryId]
      if (!saved) return

      requestAnimationFrame(() => {
        const el = scrollContainerRef.current
        if (!el) return
        const scrollParent = el.closest('[data-scroll-container]') || el.ownerDocument?.scrollingElement
        if (scrollParent && saved.scrollY > 0) {
          scrollParent.scrollTop = saved.scrollY
        }
      })
    })()
  }, [familyId, memberId, bookLibraryId, scrollContainerRef])

  // Save on scroll (debounced 2s)
  useEffect(() => {
    if (!bookLibraryId) return
    const el = scrollContainerRef.current
    if (!el) return
    const scrollParent = el.closest('[data-scroll-container]') || el.ownerDocument?.scrollingElement
    if (!scrollParent) return

    const handleScroll = () => {
      debouncedSave({
        sectionTitle: null,
        scrollY: scrollParent.scrollTop,
        activeTab,
        updatedAt: new Date().toISOString(),
      })
    }

    scrollParent.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      scrollParent.removeEventListener('scroll', handleScroll)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [bookLibraryId, activeTab, debouncedSave, scrollContainerRef])

  // Save on tab change (immediate)
  const tabRef = useRef(activeTab)
  useEffect(() => {
    if (tabRef.current === activeTab) return
    tabRef.current = activeTab
    if (!bookLibraryId) return

    const el = scrollContainerRef.current
    const scrollParent = el?.closest('[data-scroll-container]') || el?.ownerDocument?.scrollingElement
    save({
      sectionTitle: null,
      scrollY: scrollParent?.scrollTop ?? 0,
      activeTab,
      updatedAt: new Date().toISOString(),
    })
  }, [activeTab, bookLibraryId, save, scrollContainerRef])

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [])
}
