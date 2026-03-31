/**
 * useBookShelfCollections — CRUD for collections (PRD-23)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from './useFamilyMember'
import type { BookShelfCollection, BookShelfCollectionItem } from '@/types/bookshelf'

const COLLECTIONS_KEY = 'bookshelf-collections'
const COLLECTION_ITEMS_KEY = 'bookshelf-collection-items'

export function useBookShelfCollections() {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id
  const memberId = member?.id
  const qc = useQueryClient()

  // Fetch collections
  const { data: collections = [], isLoading: loading } = useQuery({
    queryKey: [COLLECTIONS_KEY, familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('bookshelf_collections')
        .select('*')
        .eq('family_id', familyId)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as BookShelfCollection[]
    },
    enabled: !!familyId,
  })

  // Fetch all collection items (junction table)
  const { data: collectionItems = [] } = useQuery({
    queryKey: [COLLECTION_ITEMS_KEY, familyId],
    queryFn: async () => {
      if (!familyId || collections.length === 0) return []
      const ids = collections.map(c => c.id)
      const { data, error } = await supabase
        .from('bookshelf_collection_items')
        .select('*')
        .in('collection_id', ids)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as BookShelfCollectionItem[]
    },
    enabled: !!familyId && collections.length > 0,
  })

  // Map: collectionId → bookshelf_item_ids
  const collectionBookIds = new Map<string, string[]>()
  for (const item of collectionItems) {
    const existing = collectionBookIds.get(item.collection_id) || []
    existing.push(item.bookshelf_item_id)
    collectionBookIds.set(item.collection_id, existing)
  }

  function getBookIdsForCollection(collectionId: string): string[] {
    return collectionBookIds.get(collectionId) || []
  }

  function getBookCountForCollection(collectionId: string): number {
    return (collectionBookIds.get(collectionId) || []).length
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!familyId || !memberId) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('bookshelf_collections')
        .insert({
          family_id: familyId,
          created_by_member_id: memberId,
          name,
          description: description || null,
          sort_order: collections.length,
        })
        .select()
        .single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [COLLECTIONS_KEY, familyId] }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BookShelfCollection> }) => {
      const { error } = await supabase
        .from('bookshelf_collections')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [COLLECTIONS_KEY, familyId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Soft-delete: set archived_at
      const { error } = await supabase
        .from('bookshelf_collections')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COLLECTIONS_KEY, familyId] })
      qc.invalidateQueries({ queryKey: [COLLECTION_ITEMS_KEY, familyId] })
    },
  })

  async function createCollection(name: string, description?: string): Promise<string> {
    return await createMutation.mutateAsync({ name, description })
  }

  async function updateCollection(id: string, updates: Partial<BookShelfCollection>) {
    await updateMutation.mutateAsync({ id, updates })
  }

  async function deleteCollection(id: string) {
    await deleteMutation.mutateAsync(id)
  }

  async function addBookToCollection(collectionId: string, bookId: string) {
    const existing = collectionBookIds.get(collectionId) || []
    if (existing.includes(bookId)) return // Already in collection
    const { error } = await supabase
      .from('bookshelf_collection_items')
      .insert({
        collection_id: collectionId,
        bookshelf_item_id: bookId,
        sort_order: existing.length,
      })
    if (error) throw error
    qc.invalidateQueries({ queryKey: [COLLECTION_ITEMS_KEY, familyId] })
  }

  async function removeBookFromCollection(collectionId: string, bookId: string) {
    const { error } = await supabase
      .from('bookshelf_collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('bookshelf_item_id', bookId)
    if (error) throw error
    qc.invalidateQueries({ queryKey: [COLLECTION_ITEMS_KEY, familyId] })
  }

  async function addBooksToCollection(collectionId: string, bookIds: string[]) {
    const existing = collectionBookIds.get(collectionId) || []
    const newBooks = bookIds.filter(id => !existing.includes(id))
    if (newBooks.length === 0) return
    const rows = newBooks.map((bookId, i) => ({
      collection_id: collectionId,
      bookshelf_item_id: bookId,
      sort_order: existing.length + i,
    }))
    const { error } = await supabase
      .from('bookshelf_collection_items')
      .insert(rows)
    if (error) throw error
    qc.invalidateQueries({ queryKey: [COLLECTION_ITEMS_KEY, familyId] })
  }

  return {
    collections,
    loading,
    collectionBookIds,
    getBookIdsForCollection,
    getBookCountForCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    addBookToCollection,
    removeBookFromCollection,
    addBooksToCollection,
  }
}
