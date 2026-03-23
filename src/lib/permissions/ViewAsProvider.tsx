import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { FamilyMember } from '@/hooks/useFamilyMember'

interface ViewAsContextType {
  isViewingAs: boolean
  viewingAsMember: FamilyMember | null
  startViewAs: (member: FamilyMember, viewerId: string, familyId: string) => Promise<void>
  stopViewAs: () => Promise<void>
  switchViewAs: (member: FamilyMember) => Promise<void>
}

const ViewAsContext = createContext<ViewAsContextType>({
  isViewingAs: false,
  viewingAsMember: null,
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
  }, [sessionId])

  const switchViewAs = useCallback(async (member: FamilyMember) => {
    // End current session
    if (sessionId) {
      await supabase
        .from('view_as_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId)
    }

    // Start new session (reuse family_id from the member)
    const { data } = await supabase
      .from('view_as_sessions')
      .insert({
        family_id: member.family_id,
        viewer_id: sessionId ? viewingAsMember?.id : member.id,
        viewing_as_id: member.id,
      })
      .select('id')
      .single()

    if (data) {
      setSessionId(data.id)
      setViewingAsMember(member)
    }
  }, [sessionId, viewingAsMember])

  return (
    <ViewAsContext.Provider
      value={{
        isViewingAs: viewingAsMember !== null,
        viewingAsMember,
        startViewAs,
        stopViewAs,
        switchViewAs,
      }}
    >
      {children}
    </ViewAsContext.Provider>
  )
}
