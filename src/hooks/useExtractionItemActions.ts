/**
 * Layer 2: useExtractionItemActions (PRD-23, Platform Library Phase 2)
 * Manages UI interaction state for extraction items: editing, noting, deleting, routing.
 * Uses optimistic local updates — no full refetch on item actions.
 */
import { useState, useCallback } from 'react'
import type { ExtractionType } from '@/lib/extractionActions'
import type { ExtractionUpdater } from '@/hooks/useExtractionData'
import {
  toggleExtractionHeart,
  updateExtractionNote,
  softDeleteExtractionItem,
  sendToGuidingStars,
  sendToBestIntentions,
  sendToJournalPrompts,
  sendToQueue,
  sendToSelfKnowledge,
  sendToNotepad,
  sendToMessages,
  createCustomInsight,
  markSentToTasks,
} from '@/lib/extractionActions'

export interface ItemActionCallbacks {
  onItemUpdated: () => void
  updateItemLocally: ExtractionUpdater
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

  const backgroundSync = useCallback(() => {
    try { callbacks.onItemUpdated() } catch { /* fire-and-forget */ }
  }, [callbacks])

  const handleHeart = useCallback(async (
    type: ExtractionType, id: string, currentHearted: boolean
  ) => {
    await toggleExtractionHeart(type, id, !currentHearted, memberId, familyId)
  }, [memberId, familyId])

  const handleNoteSave = useCallback(async (
    type: ExtractionType, id: string, note: string
  ) => {
    const ok = await updateExtractionNote(type, id, note, memberId, familyId)
    if (ok) {
      setNotingItemId(null)
      callbacks.updateItemLocally(id, type, { user_note: note || null })
    }
  }, [memberId, familyId, callbacks])

  const handleDelete = useCallback(async (
    type: ExtractionType, id: string
  ) => {
    setDeletingItemIds(prev => new Set(prev).add(id))
    setTimeout(async () => {
      await softDeleteExtractionItem(type, id, memberId, familyId)
      setDeletingItemIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      callbacks.updateItemLocally(id, type, 'remove')
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
      if (type === 'declaration') {
        callbacks.updateItemLocally(id, type, {
          sent_to_guiding_stars: true,
          guiding_star_id: result.guidingStarId,
        })
      }
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
    }
    return result
  }, [familyId, memberId])

  const handleSendToJournalPrompts = useCallback(async (
    id: string, text: string, bookTitle: string | null, chapterTitle: string | null
  ) => {
    const result = await sendToJournalPrompts({
      familyId, memberId, text, sourceItemId: id, bookTitle, chapterTitle,
    })
    if (result) {
      setApplyThisItemId(null)
      callbacks.updateItemLocally(id, 'question', {
        sent_to_prompts: true,
        journal_prompt_id: result.promptId,
      })
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
    }
    return result
  }, [familyId, memberId])

  const handleSendToSelfKnowledge = useCallback(async (
    type: ExtractionType, id: string, text: string
  ) => {
    const result = await sendToSelfKnowledge({
      familyId, memberId, text, sourceItemId: id, sourceType: type,
    })
    if (result) {
      setApplyThisItemId(null)
    }
    return result
  }, [familyId, memberId])

  const handleSendToNotepad = useCallback(async (
    type: ExtractionType, id: string, text: string, bookTitle: string | null
  ) => {
    const result = await sendToNotepad({
      familyId, memberId, text, sourceItemId: id, sourceType: type, bookTitle,
    })
    if (result) {
      setApplyThisItemId(null)
    }
    return result
  }, [familyId, memberId])

  const handleSendToMessages = useCallback(async (
    type: ExtractionType, id: string, text: string, bookTitle: string | null
  ) => {
    const result = await sendToMessages({
      familyId, memberId, text, sourceItemId: id, sourceType: type, bookTitle,
    })
    if (result) {
      setApplyThisItemId(null)
    }
    return result
  }, [familyId, memberId])

  const handleCreateCustomInsight = useCallback(async (
    bookLibraryId: string, text: string, contentType: string, sectionTitle?: string
  ) => {
    const result = await createCustomInsight({
      familyId, memberId, bookLibraryId, text, contentType, sectionTitle,
    })
    if (result) backgroundSync()
    return result
  }, [familyId, memberId, backgroundSync])

  const handleMarkSentToTasks = useCallback(async (
    type: ExtractionType, itemId: string, taskId: string
  ) => {
    await markSentToTasks(type, itemId, taskId, memberId, familyId)
    setApplyThisItemId(null)
    if (type === 'action_step' || type === 'question') {
      callbacks.updateItemLocally(itemId, type, {
        sent_to_tasks: true,
        task_id: taskId,
      })
    }
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
    handleSendToNotepad,
    handleSendToMessages,
    handleCreateCustomInsight,
    handleMarkSentToTasks,
  }
}
