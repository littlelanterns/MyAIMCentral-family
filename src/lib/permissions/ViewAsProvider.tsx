import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { FamilyMember } from '@/hooks/useFamilyMember'

/**
 * Origin of an active View-As session. Drives close behavior and
 * per-flow UX affordances. See migration 100246 and Convention #39.
 *
 *   - 'mom_viewing'    — Mom opened the View-As modal from her own
 *                        dashboard. Auth user is mom, data subject is
 *                        the target. Close returns to mom's dashboard.
 *   - 'member_session' — A family member authenticated through the hub
 *                        PIN flow on a shared tablet. Auth user is
 *                        still mom (PIN-only kids have no Supabase
 *                        user_id today — known future-migration point),
 *                        data subject is the kid. Close returns to
 *                        /hub.
 *
 * `null` outside an active View-As session.
 */
export type ViewAsOrigin = 'mom_viewing' | 'member_session'

interface StartViewAsOptions {
  /** Defaults to 'mom_viewing'. Worker 5 will flip the hub flow to pass 'member_session' explicitly. */
  origin?: ViewAsOrigin
}

interface ViewAsContextType {
  isViewingAs: boolean
  /**
   * The View-As target — the data subject inside the modal scope.
   * Consumed by `useEffectiveMember()` for identity-scoped reads.
   */
  viewingAsMember: FamilyMember | null
  /** The real viewer's member ID (mom or dad who initiated View As) */
  realViewerId: string | null
  /**
   * Origin of the active session. `null` when no session is active.
   * Consumed by `useEffectiveViewer()` (realHumanIsTarget) and by the
   * modal close logic to decide where to return.
   */
  origin: ViewAsOrigin | null
  /** Feature keys excluded from the current View As session */
  excludedFeatures: string[]
  startViewAs: (member: FamilyMember, viewerId: string, familyId: string, options?: StartViewAsOptions) => Promise<void>
  stopViewAs: () => Promise<void>
  switchViewAs: (member: FamilyMember, options?: StartViewAsOptions) => Promise<void>
  /** Set feature exclusions for current View As session */
  setFeatureExclusions: (featureKeys: string[]) => Promise<void>
}

const ViewAsContext = createContext<ViewAsContextType>({
  isViewingAs: false,
  viewingAsMember: null,
  realViewerId: null,
  origin: null,
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
  const [origin, setOrigin] = useState<ViewAsOrigin | null>(null)
  const [excludedFeatures, setExcludedFeatures] = useState<string[]>([])

  // Privacy-protected features automatically excluded from all View As sessions
  const PRIVACY_EXCLUSIONS = ['safe_harbor']

  const startViewAs = useCallback(async (
    member: FamilyMember,
    viewerId: string,
    familyId: string,
    options?: StartViewAsOptions,
  ) => {
    const nextOrigin: ViewAsOrigin = options?.origin ?? 'mom_viewing'

    const { data } = await supabase
      .from('view_as_sessions')
      .insert({
        family_id: familyId,
        viewer_id: viewerId,
        viewing_as_id: member.id,
        origin: nextOrigin,
      })
      .select('id')
      .single()

    if (data) {
      setSessionId(data.id)
      setViewingAsMember(member)
      setRealViewerId(viewerId)
      setRealFamilyId(familyId)
      setOrigin(nextOrigin)
      // Auto-apply privacy exclusions (Safe Harbor always excluded per PRD-20)
      setExcludedFeatures(PRIVACY_EXCLUSIONS)
      // Persist to DB
      await supabase
        .from('view_as_feature_exclusions')
        .insert(PRIVACY_EXCLUSIONS.map((key) => ({ session_id: data.id, feature_key: key })))
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
    setOrigin(null)
    setExcludedFeatures([])
  }, [sessionId])

  const switchViewAs = useCallback(async (member: FamilyMember, options?: StartViewAsOptions) => {
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

    // Carry the previous origin forward if the caller didn't override it.
    // Rationale: mom switching between targets inside the picker should not
    // silently flip a 'member_session' to 'mom_viewing'. The caller can
    // explicitly pass a new origin when the flow path changes.
    const nextOrigin: ViewAsOrigin = options?.origin ?? origin ?? 'mom_viewing'

    const { data } = await supabase
      .from('view_as_sessions')
      .insert({
        family_id: realFamilyId,
        viewer_id: realViewerId,
        viewing_as_id: member.id,
        origin: nextOrigin,
      })
      .select('id')
      .single()

    if (data) {
      setSessionId(data.id)
      setViewingAsMember(member)
      setOrigin(nextOrigin)
    }
  }, [sessionId, realViewerId, realFamilyId, origin])

  // Set feature exclusions and persist to view_as_feature_exclusions
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
        origin,
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
