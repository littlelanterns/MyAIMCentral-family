/**
 * Layer 2: useExtractionItemActions (PRD-23, Platform Library Phase 2)
 * Manages UI interaction state for extraction items: editing, noting, deleting, routing.
 * Does NOT own data — parent components update via callbacks.
 */
import { useState, useCallback } from 'react'
import type { ExtractionType } from '@/lib/extractionActions'
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
    type: ExtractionType, id: string, currentHearted: boolean
  ) => {
    // UI updates optimistically in ExtractionItem — no refetch needed
    await toggleExtractionHeart(type, id, !currentHearted, memberId, familyId)
  }, [memberId, familyId])

  const handleNoteSave = useCallback(async (
    type: ExtractionType, id: string, note: string
  ) => {
    const ok = await updateExtractionNote(type, id, note, memberId, familyId)
    if (ok) {
      setNotingItemId(null)
      callbacks.onItemUpdated()
    }
  }, [memberId, familyId, callbacks])

  const handleDelete = useCallback(async (
    type: ExtractionType, id: string
  ) => {
    setDeletingItemIds(prev => new Set(prev).add(id))
    // Wait for fade animation
    setTimeout(async () => {
      await softDeleteExtractionItem(type, id, memberId, familyId)
      setDeletingItemIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      callbacks.onItemUpdated()
    }, 300)
  }, [memberId, familyId, callbacks])

  const handleSendToGuidingStars = useCallback(async (
    type: ExtractionType, id: string, text: string
  ) => {
    const result = await sendToGuidingStars({
      familyId, memberId, text, sourceItemId: id, sourceType: type,
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
    type: ExtractionType, id: string, text: string, bookTitle: string | null
  ) => {
    const result = await sendToQueue({
      familyId, memberId, text, sourceItemId: id, sourceType: type, bookTitle,
    })
    if (result) {
      setApplyThisItemId(null)
      callbacks.onItemUpdated()
    }
    return result
  }, [familyId, memberId, callbacks])

  const handleSendToSelfKnowledge = useCallback(async (
    type: ExtractionType, id: string, text: string
  ) => {
    const result = await sendToSelfKnowledge({
      familyId, memberId, text, sourceItemId: id, sourceType: type,
    })
    if (result) {
      setApplyThisItemId(null)
      callbacks.onItemUpdated()
    }
    return result
  }, [familyId, memberId, callbacks])

  const handleCreateCustomInsight = useCallback(async (
    bookLibraryId: string, text: string, contentType: string, sectionTitle?: string
  ) => {
    const result = await createCustomInsight({
      familyId, memberId, bookLibraryId, text, contentType, sectionTitle,
    })
    if (result) callbacks.onItemUpdated()
    return result
  }, [familyId, memberId, callbacks])

  const handleMarkSentToTasks = useCallback(async (
    type: ExtractionType, itemId: string, taskId: string
  ) => {
    await markSentToTasks(type, itemId, taskId, memberId, familyId)
    setApplyThisItemId(null)
    callbacks.onItemUpdated()
  }, [memberId, familyId, callbacks])

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
