/**
 * useLilaMessageRespond — PRD-15 Phase E + HITM-CLOSURE (2026-07-06)
 *
 * Hook for "Ask LiLa & Send" — calls lila-message-respond Edge Function
 * with SSE streaming. The streamed reply is a PRIVATE DRAFT visible only
 * to the invoker; nothing persists to `messages` until the invoker
 * approves it via sendDraft() (server-verified verbatim). discardDraft()
 * drops it locally — there is nothing to delete server-side.
 */

import { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { MESSAGES_KEY } from '@/hooks/useMessages'
import { THREADS_KEY } from '@/hooks/useConversationThreads'
import { SPACES_KEY } from '@/hooks/useConversationSpaces'

export interface LilaDraft {
  draftId: string
  content: string
  signature: string
}

interface LilaRespondState {
  isStreaming: boolean
  streamedContent: string
  draft: LilaDraft | null
  isSendingDraft: boolean
  error: string | null
}

const IDLE_STATE: LilaRespondState = {
  isStreaming: false,
  streamedContent: '',
  draft: null,
  isSendingDraft: false,
  error: null,
}

export function useLilaMessageRespond() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<LilaRespondState>(IDLE_STATE)
  const abortRef = useRef<AbortController | null>(null)
  // Mirror of state.draft so async callbacks read the current draft without
  // stale-closure risk.
  const draftRef = useRef<LilaDraft | null>(null)

  const invokeLila = useCallback(async (threadId: string, userMessageContent: string) => {
    // Reset state — a new invocation replaces any undecided draft
    draftRef.current = null
    setState({ ...IDLE_STATE, isStreaming: true })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setState(s => ({ ...s, isStreaming: false, error: 'Not authenticated' }))
        return
      }

      abortRef.current = new AbortController()

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lila-message-respond`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            thread_id: threadId,
            user_message_content: userMessageContent,
          }),
          signal: abortRef.current.signal,
        },
      )

      if (!response.ok) {
        const err = await response.text()
        setState(s => ({ ...s, isStreaming: false, error: `LiLa error: ${response.status}` }))
        console.error('[useLilaMessageRespond] Error:', err)
        return
      }

      // Check for JSON crisis response
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const json = await response.json()
        if (json.crisis) {
          // Crisis resources post to the thread immediately (Convention #7 —
          // exempt from the draft gate). Just refresh messages.
          queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY, threadId] })
          setState(s => ({ ...s, isStreaming: false }))
          return
        }
      }

      // Process SSE stream
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let draft: LilaDraft | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'chunk' && parsed.content) {
                accumulated += parsed.content
                setState(s => ({ ...s, streamedContent: accumulated }))
              } else if (parsed.type === 'draft' && parsed.draft_id && parsed.signature) {
                // Server-canonical text — replaces the accumulated stream so
                // the signature always matches what we display and send.
                draft = {
                  draftId: parsed.draft_id,
                  content: parsed.content ?? accumulated,
                  signature: parsed.signature,
                }
              }
            } catch {
              // Skip non-JSON
            }
          }
        }
      }

      if (draft) {
        draftRef.current = draft
        setState(s => ({
          ...s,
          isStreaming: false,
          streamedContent: draft!.content,
          draft,
        }))
      } else {
        setState(s => ({ ...s, isStreaming: false, streamedContent: '', error: s.error }))
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        draftRef.current = null
        setState(IDLE_STATE)
        return
      }
      console.error('[useLilaMessageRespond] Error:', err)
      setState(s => ({ ...s, isStreaming: false, error: 'Failed to reach LiLa' }))
    }
  }, [queryClient])

  // Post the approved draft VERBATIM as LiLa (server verifies the signature).
  const sendDraft = useCallback(async (threadId: string) => {
    const draft = draftRef.current
    if (!draft) return
    setState(s => (s.isSendingDraft ? s : { ...s, isSendingDraft: true }))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setState(s => ({ ...s, isSendingDraft: false, error: 'Not authenticated' }))
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lila-message-respond`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            thread_id: threadId,
            action: 'send_draft',
            draft_id: draft.draftId,
            draft_content: draft.content,
            draft_signature: draft.signature,
          }),
        },
      )

      if (!response.ok) {
        setState(s => ({ ...s, isSendingDraft: false, error: 'Failed to send LiLa\'s reply' }))
        return
      }

      queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY, threadId] })
      queryClient.invalidateQueries({ queryKey: [THREADS_KEY] })
      queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
      draftRef.current = null
      setState(IDLE_STATE)
    } catch (err) {
      console.error('[useLilaMessageRespond] sendDraft error:', err)
      setState(s => ({ ...s, isSendingDraft: false, error: 'Failed to send LiLa\'s reply' }))
    }
  }, [queryClient])

  // Drop the draft — purely local; nothing was persisted.
  const discardDraft = useCallback(() => {
    draftRef.current = null
    setState(IDLE_STATE)
  }, [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return {
    invokeLila,
    sendDraft,
    discardDraft,
    cancel,
    isStreaming: state.isStreaming,
    streamedContent: state.streamedContent,
    draft: state.draft,
    isSendingDraft: state.isSendingDraft,
    error: state.error,
  }
}
