import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

const swept = new Set<string>()

export function useArchiveExpiredRoutines(familyId: string | undefined) {
  const queryClient = useQueryClient()
  const called = useRef(false)

  useEffect(() => {
    if (!familyId || called.current || swept.has(familyId)) return
    called.current = true
    swept.add(familyId)

    supabase
      .rpc('archive_expired_routines', { p_family_id: familyId })
      .then(({ data, error }) => {
        if (error) {
          console.warn('archive_expired_routines failed:', error.message)
          return
        }
        if (data && data > 0) {
          console.log(`Archived ${data} expired routine(s)`)
          queryClient.invalidateQueries({ queryKey: ['tasks', familyId] })
          queryClient.invalidateQueries({ queryKey: ['live-allowance-progress'] })
        }
      })
  }, [familyId, queryClient])
}
