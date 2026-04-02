// PRD-11 Phase 12B: Victory Reckoning Context hook
// Stub API for PRD-18 (Evening Rhythm / Reckoning) to consume.
// Provides today's victories, scan trigger, and celebrate trigger.

import { useCallback, useState } from 'react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useVictories, useVictoryCount } from '@/hooks/useVictories'
import { supabase } from '@/lib/supabase/client'
import type { VictorySuggestion } from '@/types/victories'

export function useVictoryReckoningContext() {
  const { data: member } = useFamilyMember()
  const memberId = member?.id
  const familyId = member?.family_id

  const { data: todaysVictories = [] } = useVictories(memberId, { period: 'today' })
  const { data: todayCount = 0 } = useVictoryCount(memberId, 'today')

  const [scanning, setScanning] = useState(false)
  const [suggestions, setSuggestions] = useState<VictorySuggestion[]>([])

  // Trigger the Activity Log scan for today
  const triggerScan = useCallback(async () => {
    if (!memberId) return []
    setScanning(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-activity-victories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            family_member_id: memberId,
            period: 'today',
          }),
        },
      )
      if (!response.ok) return []
      const result = await response.json()
      const fetched = (result.suggestions ?? []) as VictorySuggestion[]
      setSuggestions(fetched)
      return fetched
    } catch {
      return []
    } finally {
      setScanning(false)
    }
  }, [memberId])

  // Trigger "Celebrate This!" for today's victories
  const triggerCelebrate = useCallback(() => {
    // Navigation-based: consumer should navigate to /victories with celebrate=1
    // This is a convenience pointer — the actual modal opens on VictoryRecorder page
    if (typeof window !== 'undefined') {
      window.location.href = '/victories?celebrate=1'
    }
  }, [])

  return {
    todaysVictories,
    todayCount,
    suggestions,
    scanning,
    triggerScan,
    triggerCelebrate,
    memberId,
    familyId,
  }
}
