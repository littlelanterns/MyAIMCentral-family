/**
 * useMessageCoaching — PRD-15 Phase E
 *
 * Hook for before-send message coaching.
 * Calls the message-coach Edge Function with a 3-second timeout.
 * On timeout or error, returns { shouldCoach: false } so the message sends normally.
 *
 * Also provides rapid-fire bypass: if the last coached send was <60s ago,
 * coaching is skipped entirely.
 */

import { useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface CoachingResult {
  shouldCoach: boolean
  coachingNote: string
  isClean: boolean
}

const RAPID_FIRE_WINDOW_MS = 60_000 // 60 seconds
const COACHING_TIMEOUT_MS = 3_000 // 3 seconds

export function useMessageCoaching() {
  const lastCoachedSendRef = useRef<number>(0)

  const checkCoaching = useCallback(
    async (threadId: string, messageContent: string): Promise<CoachingResult> => {
      // Rapid-fire bypass: skip if last coached send was <60s ago
      const now = Date.now()
      if (now - lastCoachedSendRef.current < RAPID_FIRE_WINDOW_MS) {
        return { shouldCoach: false, coachingNote: '', isClean: true }
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          return { shouldCoach: false, coachingNote: '', isClean: true }
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), COACHING_TIMEOUT_MS)

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/message-coach`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              thread_id: threadId,
              message_content: messageContent,
            }),
            signal: controller.signal,
          },
        )

        clearTimeout(timeoutId)

        if (!response.ok) {
          return { shouldCoach: false, coachingNote: '', isClean: true }
        }

        const result: CoachingResult = await response.json()
        return result
      } catch (err) {
        // Timeout (AbortError) or network error — don't block the message
        if ((err as Error).name === 'AbortError') {
          console.log('[useMessageCoaching] Timed out after 3s — sending without coaching')
        }
        return { shouldCoach: false, coachingNote: '', isClean: true }
      }
    },
    [],
  )

  const recordCoachedSend = useCallback(() => {
    lastCoachedSendRef.current = Date.now()
  }, [])

  return { checkCoaching, recordCoachedSend }
}
