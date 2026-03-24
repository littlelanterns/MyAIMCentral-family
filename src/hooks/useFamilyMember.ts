import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export interface FamilyMember {
  id: string
  family_id: string
  user_id: string | null
  display_name: string
  role: 'primary_parent' | 'additional_adult' | 'special_adult' | 'member'
  dashboard_mode: 'adult' | 'independent' | 'guided' | 'play' | null
  avatar_url: string | null
  login_method: string | null
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
  theme_preferences: Record<string, unknown>
  layout_preferences: Record<string, unknown>
  preferences: Record<string, unknown>
  created_at: string
}

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
        .order('created_at')

      if (error) throw error
      return data as FamilyMember[]
    },
    enabled: !!familyId,
  })
}
