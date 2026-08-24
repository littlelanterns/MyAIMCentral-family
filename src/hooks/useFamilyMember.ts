import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import { sortFamilyMembers, getMemberSortPreference } from '@/utils/sortFamilyMembers'

export interface FamilyMember {
  id: string
  family_id: string
  user_id: string | null
  display_name: string
  /** 'family' = the hidden Family identity row (hub-resting family devices,
   *  Family-Auth-Two-Door) — excluded from all people-rosters */
  role: 'primary_parent' | 'additional_adult' | 'special_adult' | 'member' | 'family'
  dashboard_mode: 'adult' | 'independent' | 'guided' | 'play' | null
  avatar_url: string | null
  auth_method: 'full_login' | 'pin' | 'visual_password' | 'none' | null
  /** TEEN-CRED: mom-chosen username for username-mode full_login members with
   *  no real email. NULL for real-email full_login, PIN, picture, or none. */
  login_username: string | null
  member_color: string | null
  calendar_color: string | null
  assigned_color: string | null
  nicknames: string[]
  relationship: 'self' | 'spouse' | 'child' | 'special' | null
  custom_role: string | null
  age: number | null
  date_of_birth: string | null
  in_household: boolean
  dashboard_enabled: boolean
  out_of_nest: boolean
  onboarding_completed: boolean
  is_active: boolean
  /** PRD-40: canonical under-13 source (ruling R-2). Default 'adult'. */
  coppa_age_bracket: 'under_13' | '13_to_17' | 'adult'
  /** PRD-40: true during the 14-day revocation grace window. */
  is_suspended_for_deletion: boolean
  theme_preferences: Record<string, unknown>
  layout_preferences: Record<string, unknown>
  preferences: Record<string, unknown>
  created_at: string
}

// ─── Active family persistence (for future multi-family support) ─────────────

const ACTIVE_FAMILY_KEY = 'myaim_active_family_id'

export function getActiveFamilyId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_FAMILY_KEY)
  } catch {
    return null
  }
}

export function setActiveFamilyId(familyId: string): void {
  try {
    localStorage.setItem(ACTIVE_FAMILY_KEY, familyId)
  } catch {
    // localStorage unavailable
  }
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useFamilyMember() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['family-member', user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data as FamilyMember
    },
    enabled: !!user,
  })
}

export function useFamilyMembers(familyId: string | undefined) {
  return useQuery({
    queryKey: ['family-members', familyId],
    queryFn: async () => {
      if (!familyId) return []

      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        // The Family identity row is infrastructure, never a person in lists
        .neq('role', 'family')
        .order('created_at')

      if (error) throw error
      // Apply user's preferred sort (default: by age — parents first, then kids oldest→youngest)
      return sortFamilyMembers(data as FamilyMember[], getMemberSortPreference())
    },
    enabled: !!familyId,
  })
}
