/**
 * PRD-25: NBT AI glaze hook
 * Calls guided-nbt-glaze Edge Function for encouraging one-liners.
 * Caches results per suggestion ID per session (in-memory Map).
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

interface UseNBTGlazeReturn {
  glazeText: string | null
  isLoading: boolean
  error: string | null
}

/** In-memory session cache — cleared on page refresh */
const glazeCache = new Map<string, string>()

export function useNBTGlaze(
  suggestionId: string | null,
  taskTitle: string | null,
  suggestionType: string | null,
  memberName: string,
  streakCount: number,
  familyId?: string,
  memberId?: string,
  pointValue?: number,
  currencyName?: string,
): UseNBTGlazeReturn {
  const [glazeText, setGlazeText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchGlaze = useCallback(async () => {
    if (!suggestionId || !taskTitle || !suggestionType) {
      setGlazeText(null)
      return
    }

    // Check cache first
    const cached = glazeCache.get(suggestionId)
    if (cached) {
      setGlazeText(cached)
      return
    }

    setIsLoading(true)
    setError(null)

    // Abort previous in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const hour = new Date().getHours()
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setGlazeText(null)
        setIsLoading(false)
        return
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/guided-nbt-glaze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          taskTitle,
          timeOfDay,
          memberName,
          streakCount,
          currencyName,
          suggestionType,
          pointValue,
          family_id: familyId,
          member_id: memberId,
        }),
        signal: controller.signal,
      })

      if (!response.ok) throw new Error('Glaze fetch failed')
      const data = await response.json()
      const text = data.glazeText || null

      if (text) {
        glazeCache.set(suggestionId, text)
      }
      setGlazeText(text)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError('Failed to load')
      setGlazeText(null)
    } finally {
      setIsLoading(false)
    }
  }, [suggestionId, taskTitle, suggestionType, memberName, streakCount, familyId, memberId, pointValue, currencyName])

  useEffect(() => {
    fetchGlaze()
    return () => { abortRef.current?.abort() }
  }, [fetchGlaze])

  return { glazeText, isLoading, error }
}
