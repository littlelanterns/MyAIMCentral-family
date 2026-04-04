/**
 * Layer 2: useExtractionItemActions (PRD-23)
 * Manages UI interaction state for extraction items: editing, noting, deleting, routing.
 * Does NOT own data — parent components update via callbacks.
 */
import { useState, useCallback } from 'react'
import type { ExtractionTable } from '@/lib/extractionActions'
import {
  toggleExtractionHeart,
  updateExtractionNote,
  softDeleteExtractionItem,
  sendToGuidingStars,
  sendToBestIntentions,
  sendToJournalPrompts,
  sendToQueue,
  sendToSelfKnowledge,
  createCustomInsight,
  markSentToTasks,
} from '@/lib/extractionActions'

export interface ItemActionCallbacks {
  onItemUpdated: () => void
}

export function useExtractionItemActions(
  familyId: string,
  memberId: string,
  callbacks: ItemActionCallbacks
) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [notingItemId, setNotingItemId] = useState<string | null>(null)
  const [applyThisItemId, setApplyThisItemId] = useState<string | null>(null)
  const [deletingItemIds, setDeletingItemIds] = useState<Set<string>>(new Set())

  const handleHeart = useCallback(async (
    table: ExtractionTable, id: string, currentHearted: boolean
  ) => {
    // UI updates optimistically in ExtractionItem — no refetch needed
    await toggleExtractionHeart(table, id, !currentHearted)
  }, [])

  const handleNoteSave = useCallback(async (
    table: ExtractionTable, id: string, note: string
  ) => {
    const ok = await updateExtractionNote(table, id, note)
    if (ok) {
      setNotingItemId(null)
      callbacks.onItemUpdated()
    }
  }, [callbacks])

  const handleDelete = useCallback(async (
    table: ExtractionTable, id: string
  ) => {
    setDeletingItemIds(prev => new Set(prev).add(id))
    // Wait for fade animation
    setTimeout(async () => {
      await softDeleteExtractionItem(table, id)
      setDeletingItemIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      callbacks.onItemUpdated()
    }, 300)
  }, [callbacks])

  const handleSendToGuidingStars = useCallback(async (
    table: ExtractionTable, id: string, text: string
  ) => {
    const result = await sendToGuidingStars({
      familyId, memberId, text, sourceItemId: id, sourceTable: table,
    })
    if (result) {
      setApplyThisItemId(null)
      callbacks.onItemUpdated()
    }
    return result
  }, [familyId, memberId, callbacks])

  const handleSendToBestIntentions = useCallback(async (
    id: string, text: string
  ) => {
    const result = await sendToBestIntentions({
      familyId, memberId, text, sourceItemId: id,
    })
    if (result) {
      setApplyThisItemId(null)
      callbacks.onItemUpdated()
    }
    return result
  }, [familyId, memberId, callbacks])

  const handleSendToJournalPrompts = useCallback(async (
    id: string, text: string, bookTitle: string | null, chapterTitle: string | null
  ) => {
    const result = await sendToJournalPrompts({
      familyId, memberId, text, sourceItemId: id, bookTitle, chapterTitle,
    })
    if (result) {
      setApplyThisItemId(null)
      callbacks.onItemUpdated()
    }
    return result
  }, [familyId, memberId, callbacks])

  const handleSendToQueue = useCallback(async (
    table: ExtractionTable, id: string, text: string, bookTitle: string | null
  ) => {
    const result = await sendToQueue({
      familyId, memberId, text, sourceItemId: id, sourceTable: table, bookTitle,
    })
    if (result) {
      setApplyThisItemId(null)
      callbacks.onItemUpdated()
    }
    return result
  }, [familyId, memberId, callbacks])

  const handleSendToSelfKnowledge = useCallback(async (
    table: ExtractionTable, id: string, text: string
  ) => {
    const result = await sendToSelfKnowledge({
      familyId, memberId, text, sourceItemId: id, sourceTable: table,
    })
    if (result) {
      setApplyThisItemId(null)
      callbacks.onItemUpdated()
    }
    return result
  }, [familyId, memberId, callbacks])

  const handleCreateCustomInsight = useCallback(async (
    bookshelfItemId: string, text: string, contentType: string, sectionTitle?: string
  ) => {
    const result = await createCustomInsight({
      familyId, memberId, bookshelfItemId, text, contentType, sectionTitle,
    })
    if (result) callbacks.onItemUpdated()
    return result
  }, [familyId, memberId, callbacks])

  const handleMarkSentToTasks = useCallback(async (
    table: ExtractionTable, itemId: string, taskId: string
  ) => {
    await markSentToTasks(table, itemId, taskId)
    setApplyThisItemId(null)
    callbacks.onItemUpdated()
  }, [callbacks])

  return {
    editingItemId, setEditingItemId,
    notingItemId, setNotingItemId,
    applyThisItemId, setApplyThisItemId,
    deletingItemIds,
    handleHeart,
    handleNoteSave,
    handleDelete,
    handleSendToGuidingStars,
    handleSendToBestIntentions,
    handleSendToJournalPrompts,
    handleSendToQueue,
    handleSendToSelfKnowledge,
    handleCreateCustomInsight,
    handleMarkSentToTasks,
  }
}
