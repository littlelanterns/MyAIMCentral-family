/**
 * useLilaMessageRespond — PRD-15 Phase E
 *
 * Hook for "Ask LiLa & Send" — calls lila-message-respond Edge Function
 * with SSE streaming. LiLa responds as a distinct participant in the
 * conversation thread (message_type = 'lila').
 */

import { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { MESSAGES_KEY } from '@/hooks/useMessages'
import { THREADS_KEY } from '@/hooks/useConversationThreads'
import { SPACES_KEY } from '@/hooks/useConversationSpaces'

interface LilaRespondState {
  isStreaming: boolean
  streamedContent: string
  error: string | null
}

export function useLilaMessageRespond() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<LilaRespondState>({
    isStreaming: false,
    streamedContent: '',
    error: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  const invokeLila = useCallback(async (threadId: string, userMessageContent: string) => {
    // Reset state
    setState({ isStreaming: true, streamedContent: '', error: null })

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
          // Crisis response handled server-side — just refresh messages
          queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY, threadId] })
          setState(s => ({ ...s, isStreaming: false }))
          return
        }
      }

      // Process SSE stream
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

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
              }
            } catch {
              // Skip non-JSON
            }
          }
        }
      }

      // Stream complete — refresh message list
      queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY, threadId] })
      queryClient.invalidateQueries({ queryKey: [THREADS_KEY] })
      queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })

      setState(s => ({ ...s, isStreaming: false }))
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setState(s => ({ ...s, isStreaming: false, streamedContent: '' }))
        return
      }
      console.error('[useLilaMessageRespond] Error:', err)
      setState(s => ({ ...s, isStreaming: false, error: 'Failed to reach LiLa' }))
    }
  }, [queryClient])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return {
    invokeLila,
    cancel,
    isStreaming: state.isStreaming,
    streamedContent: state.streamedContent,
    error: state.error,
  }
}
