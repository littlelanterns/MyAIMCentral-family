/**
 * useBookShelf — fetch and manage BookShelf items (PRD-23)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from './useFamilyMember'
import type { BookShelfItem } from '@/types/bookshelf'

const BOOKS_KEY = 'bookshelf-items'

export function useBookShelf() {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id
  const qc = useQueryClient()

  const { data: books = [], isLoading: loading, error } = useQuery({
    queryKey: [BOOKS_KEY, familyId],
    queryFn: async () => {
      if (!familyId) return []
      // Light query: only columns needed for library grid display
      const { data, error } = await supabase
        .from('bookshelf_items')
        .select('id,family_id,uploaded_by_member_id,title,author,isbn,file_type,file_name,genres,tags,folder_group,processing_status,extraction_status,chunk_count,parent_bookshelf_item_id,part_number,part_count,last_viewed_at,archived_at,created_at,updated_at')
        .eq('family_id', familyId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as BookShelfItem[]
    },
    enabled: !!familyId,
  })

  // Derived data
  const parentBooks = books.filter(b => !b.parent_bookshelf_item_id)
  const extractedBooks = books.filter(b => b.extraction_status === 'completed')

  const booksByFolder = new Map<string, BookShelfItem[]>()
  for (const book of parentBooks) {
    const folder = book.folder_group || 'Uncategorized'
    const existing = booksByFolder.get(folder) || []
    existing.push(book)
    booksByFolder.set(folder, existing)
  }

  function getPartsForBook(parentId: string): BookShelfItem[] {
    return books
      .filter(b => b.parent_bookshelf_item_id === parentId)
      .sort((a, b) => (a.part_number ?? 0) - (b.part_number ?? 0))
  }

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BookShelfItem> }) => {
      const { error } = await supabase
        .from('bookshelf_items')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BOOKS_KEY, familyId] }),
  })

  async function updateBookTitle(id: string, title: string) {
    await updateMutation.mutateAsync({ id, updates: { title } })
  }

  async function updateBookAuthor(id: string, author: string) {
    await updateMutation.mutateAsync({ id, updates: { author } })
  }

  async function updateLastViewedAt(id: string) {
    await supabase
      .from('bookshelf_items')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', id)
    // Don't await refetch — fire and forget
  }

  async function updateBookFolder(id: string, folderId: string | null) {
    await updateMutation.mutateAsync({ id, updates: { folder_id: folderId } })
  }

  async function updateBookGenres(id: string, genres: string[]) {
    await updateMutation.mutateAsync({ id, updates: { genres } })
  }

  async function updateBookTags(id: string, tags: string[]) {
    await updateMutation.mutateAsync({ id, updates: { tags } })
  }

  async function archiveBook(id: string) {
    await updateMutation.mutateAsync({ id, updates: { archived_at: new Date().toISOString() } })
  }

  async function refetch() {
    await qc.invalidateQueries({ queryKey: [BOOKS_KEY, familyId] })
  }

  return {
    books,
    loading,
    error: error ? String(error) : null,
    parentBooks,
    extractedBooks,
    booksByFolder,
    getPartsForBook,
    updateBookTitle,
    updateBookAuthor,
    updateBookFolder,
    updateBookGenres,
    updateBookTags,
    updateLastViewedAt,
    archiveBook,
    refetch,
  }
}
