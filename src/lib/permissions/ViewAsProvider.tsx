import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { FamilyMember } from '@/hooks/useFamilyMember'

interface ViewAsContextType {
  isViewingAs: boolean
  viewingAsMember: FamilyMember | null
  /** The real viewer's member ID (mom or dad who initiated View As) */
  realViewerId: string | null
  startViewAs: (member: FamilyMember, viewerId: string, familyId: string) => Promise<void>
  stopViewAs: () => Promise<void>
  switchViewAs: (member: FamilyMember) => Promise<void>
}

const ViewAsContext = createContext<ViewAsContextType>({
  isViewingAs: false,
  viewingAsMember: null,
  realViewerId: null,
  startViewAs: async () => {},
  stopViewAs: async () => {},
  switchViewAs: async () => {},
})

export function useViewAs() {
  return useContext(ViewAsContext)
}

interface ViewAsProviderProps {
  children: ReactNode
}

export function ViewAsProvider({ children }: ViewAsProviderProps) {
  const [viewingAsMember, setViewingAsMember] = useState<FamilyMember | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [realViewerId, setRealViewerId] = useState<string | null>(null)
  const [realFamilyId, setRealFamilyId] = useState<string | null>(null)

  const startViewAs = useCallback(async (member: FamilyMember, viewerId: string, familyId: string) => {
    const { data } = await supabase
      .from('view_as_sessions')
      .insert({
        family_id: familyId,
        viewer_id: viewerId,
        viewing_as_id: member.id,
      })
      .select('id')
      .single()

    if (data) {
      setSessionId(data.id)
      setViewingAsMember(member)
      setRealViewerId(viewerId)
      setRealFamilyId(familyId)
    }
  }, [])

  const stopViewAs = useCallback(async () => {
    if (sessionId) {
      await supabase
        .from('view_as_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId)
    }

    setViewingAsMember(null)
    setSessionId(null)
    setRealViewerId(null)
    setRealFamilyId(null)
  }, [sessionId])

  const switchViewAs = useCallback(async (member: FamilyMember) => {
    // End current session
    if (sessionId) {
      await supabase
        .from('view_as_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId)
    }

    // Start new session — viewer_id is always the REAL viewer (mom), never the viewed member
    // Safety: if realViewerId is null (shouldn't happen), abort rather than insert bad data
    if (!realViewerId || !realFamilyId) {
      console.error('ViewAs switchViewAs called without an active session. Use startViewAs first.')
      return
    }

    const { data } = await supabase
      .from('view_as_sessions')
      .insert({
        family_id: realFamilyId,
        viewer_id: realViewerId,
        viewing_as_id: member.id,
      })
      .select('id')
      .single()

    if (data) {
      setSessionId(data.id)
      setViewingAsMember(member)
    }
  }, [sessionId, realViewerId, realFamilyId])

  return (
    <ViewAsContext.Provider
      value={{
        isViewingAs: viewingAsMember !== null,
        viewingAsMember,
        realViewerId,
        startViewAs,
        stopViewAs,
        switchViewAs,
      }}
    >
      {children}
    </ViewAsContext.Provider>
  )
}
