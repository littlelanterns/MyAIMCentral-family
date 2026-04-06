import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import type { NotificationPreference, NotificationCategory } from '@/types/messaging'

const PREFS_KEY = 'notification-preferences'

const ALL_CATEGORIES: NotificationCategory[] = [
  'messages',
  'requests',
  'calendar',
  'tasks',
  'safety',
  'lila',
]

/**
 * Fetches notification preferences for the current member.
 * Auto-seeds defaults on first access if none exist.
 */
export function useNotificationPreferences() {
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const memberId = currentMember?.id
  const familyId = currentFamily?.id

  return useQuery({
    queryKey: [PREFS_KEY, memberId],
    queryFn: async () => {
      if (!memberId || !familyId) return []

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('family_member_id', memberId)

      if (error) throw error

      // Auto-seed if no preferences exist
      if (!data || data.length === 0) {
        const defaults = ALL_CATEGORIES.map((category) => ({
          family_id: familyId,
          family_member_id: memberId,
          category,
          in_app_enabled: true,
          push_enabled: false,
          do_not_disturb: false,
        }))

        const { data: seeded, error: seedError } = await supabase
          .from('notification_preferences')
          .insert(defaults)
          .select('*')

        if (seedError) {
          console.error('[useNotificationPreferences] Seed failed:', seedError.message)
          return []
        }

        return (seeded ?? []) as NotificationPreference[]
      }

      return data as NotificationPreference[]
    },
    enabled: !!memberId && !!familyId,
  })
}

/** Toggle in_app_enabled for a specific category */
export function useToggleNotificationPref() {
  const queryClient = useQueryClient()
  const { data: currentMember } = useFamilyMember()

  return useMutation({
    mutationFn: async ({
      prefId,
      category,
      field,
      value,
    }: {
      prefId: string
      category: NotificationCategory
      field: 'in_app_enabled' | 'push_enabled' | 'do_not_disturb'
      value: boolean
    }) => {
      // Safety category: in_app_enabled cannot be disabled
      if (category === 'safety' && field === 'in_app_enabled' && !value) {
        throw new Error('Safety notifications cannot be disabled')
      }

      const { error } = await supabase
        .from('notification_preferences')
        .update({ [field]: value })
        .eq('id', prefId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PREFS_KEY, currentMember?.id] })
    },
  })
}
