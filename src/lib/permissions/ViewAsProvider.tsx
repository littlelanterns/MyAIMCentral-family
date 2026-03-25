import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { FamilyMember } from '@/hooks/useFamilyMember'

interface ViewAsContextType {
  isViewingAs: boolean
  viewingAsMember: FamilyMember | null
  /** The real viewer's member ID (mom or dad who initiated View As) */
  realViewerId: string | null
  /** Issue 6: Feature keys excluded from the current View As session */
  excludedFeatures: string[]
  startViewAs: (member: FamilyMember, viewerId: string, familyId: string) => Promise<void>
  stopViewAs: () => Promise<void>
  switchViewAs: (member: FamilyMember) => Promise<void>
  /** Issue 6: Set feature exclusions for current View As session */
  setFeatureExclusions: (featureKeys: string[]) => Promise<void>
}

const ViewAsContext = createContext<ViewAsContextType>({
  isViewingAs: false,
  viewingAsMember: null,
  realViewerId: null,
  excludedFeatures: [],
  startViewAs: async () => {},
  stopViewAs: async () => {},
  switchViewAs: async () => {},
  setFeatureExclusions: async () => {},
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
  const [excludedFeatures, setExcludedFeatures] = useState<string[]>([])

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
    setExcludedFeatures([])
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

  // Issue 6: Set feature exclusions and persist to view_as_feature_exclusions
  const setFeatureExclusions = useCallback(async (featureKeys: string[]) => {
    setExcludedFeatures(featureKeys)
    if (sessionId) {
      // Clear existing exclusions for this session
      await supabase
        .from('view_as_feature_exclusions')
        .delete()
        .eq('session_id', sessionId)
      // Insert new exclusions
      if (featureKeys.length > 0) {
        await supabase
          .from('view_as_feature_exclusions')
          .insert(featureKeys.map((key) => ({ session_id: sessionId, feature_key: key })))
      }
    }
  }, [sessionId])

  return (
    <ViewAsContext.Provider
      value={{
        isViewingAs: viewingAsMember !== null,
        viewingAsMember,
        realViewerId,
        excludedFeatures,
        startViewAs,
        stopViewAs,
        switchViewAs,
        setFeatureExclusions,
      }}
    >
      {children}
    </ViewAsContext.Provider>
  )
}
