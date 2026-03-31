/**
 * useBookShelfSettings — per-member library preferences (PRD-23)
 * Upserts a row on first access if none exists.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from './useFamilyMember'
import type { BookShelfMemberSettings, BookKnowledgeAccess } from '@/types/bookshelf'

const SETTINGS_KEY = 'bookshelf-member-settings'

const DEFAULTS: Omit<BookShelfMemberSettings, 'id' | 'family_id' | 'family_member_id' | 'created_at' | 'updated_at'> = {
  book_knowledge_access: 'hearted_only',
  library_sort: 'newest',
  library_layout: 'grid',
  library_group_mode: 'all_books',
  resurfaced_item_ids: [],
}

export interface BookShelfSettingsState {
  librarySort: string
  libraryLayout: 'grid' | 'compact'
  libraryGroupMode: 'by_folder' | 'all_books'
  bookKnowledgeAccess: BookKnowledgeAccess
}

export function useBookShelfSettings() {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id
  const memberId = member?.id
  const qc = useQueryClient()

  const { data: raw, isLoading: loading } = useQuery({
    queryKey: [SETTINGS_KEY, familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return null
      // Try to fetch existing
      const { data, error } = await supabase
        .from('bookshelf_member_settings')
        .select('*')
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .maybeSingle()
      if (error) throw error
      if (data) return data as BookShelfMemberSettings

      // Upsert default row
      const { data: created, error: insertErr } = await supabase
        .from('bookshelf_member_settings')
        .upsert({
          family_id: familyId,
          family_member_id: memberId,
          ...DEFAULTS,
        }, { onConflict: 'family_id,family_member_id' })
        .select()
        .single()
      if (insertErr) throw insertErr
      return created as BookShelfMemberSettings
    },
    enabled: !!familyId && !!memberId,
  })

  const settings: BookShelfSettingsState = {
    librarySort: raw?.library_sort ?? DEFAULTS.library_sort,
    libraryLayout: (raw?.library_layout ?? DEFAULTS.library_layout) as 'grid' | 'compact',
    libraryGroupMode: (raw?.library_group_mode ?? DEFAULTS.library_group_mode) as 'by_folder' | 'all_books',
    bookKnowledgeAccess: (raw?.book_knowledge_access ?? DEFAULTS.book_knowledge_access) as BookKnowledgeAccess,
  }

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<BookShelfMemberSettings>) => {
      if (!raw?.id) return
      const { error } = await supabase
        .from('bookshelf_member_settings')
        .update(updates)
        .eq('id', raw.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [SETTINGS_KEY, familyId, memberId] }),
  })

  async function updateSetting(key: keyof BookShelfSettingsState, value: string) {
    const columnMap: Record<keyof BookShelfSettingsState, string> = {
      librarySort: 'library_sort',
      libraryLayout: 'library_layout',
      libraryGroupMode: 'library_group_mode',
      bookKnowledgeAccess: 'book_knowledge_access',
    }
    await updateMutation.mutateAsync({ [columnMap[key]]: value })
  }

  return { settings, loading, updateSetting }
}
