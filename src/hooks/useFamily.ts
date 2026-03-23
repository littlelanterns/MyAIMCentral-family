import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from './useFamilyMember'

export interface Family {
  id: string
  primary_parent_id: string
  family_name: string
  family_login_name: string | null
  is_founding_family: boolean
  timezone: string
  created_at: string
}

export function useFamily() {
  const { data: member } = useFamilyMember()

  return useQuery({
    queryKey: ['family', member?.family_id],
    queryFn: async () => {
      if (!member) return null

      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', member.family_id)
        .single()

      if (error) throw error
      return data as Family
    },
    enabled: !!member?.family_id,
  })
}
