/**
 * useMessagingSettings — PRD-15 Phase E
 *
 * Hooks for reading/writing messaging_settings (family-level),
 * message_coaching_settings (per-member), and member_messaging_permissions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type {
  MessagingSettings,
  MessageCoachingSetting,
  MemberMessagingPermission,
} from '@/types/messaging'

export const MESSAGING_SETTINGS_KEY = 'messaging-settings'
export const COACHING_SETTINGS_KEY = 'coaching-settings'
export const MESSAGING_PERMISSIONS_KEY = 'messaging-permissions-all'

// ── Family-level messaging settings ──

export function useMessagingSettings() {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useQuery({
    queryKey: [MESSAGING_SETTINGS_KEY, familyId],
    queryFn: async () => {
      if (!familyId) return null

      const { data, error } = await supabase
        .from('messaging_settings')
        .select('*')
        .eq('family_id', familyId)
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as MessagingSettings) ?? null
    },
    enabled: !!familyId,
  })
}

export function useUpdateMessagingSettings() {
  const queryClient = useQueryClient()
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useMutation({
    mutationFn: async (updates: Partial<Pick<
      MessagingSettings,
      'communication_guidelines' | 'content_corner_viewing_mode' |
      'content_corner_locked_until' | 'content_corner_who_can_add'
    >>) => {
      if (!familyId) throw new Error('No family ID')

      const { error } = await supabase
        .from('messaging_settings')
        .upsert(
          { family_id: familyId, ...updates },
          { onConflict: 'family_id' },
        )

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MESSAGING_SETTINGS_KEY, familyId] })
    },
  })
}

// ── Per-member coaching settings ──

export function useAllCoachingSettings() {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useQuery({
    queryKey: [COACHING_SETTINGS_KEY, familyId],
    queryFn: async () => {
      if (!familyId) return []

      const { data, error } = await supabase
        .from('message_coaching_settings')
        .select('*, family_members!message_coaching_settings_family_member_id_fkey(display_name, role, age)')
        .eq('family_id', familyId)

      if (error) throw error
      return data as (MessageCoachingSetting & {
        family_members: { display_name: string; role: string; age: number | null }
      })[]
    },
    enabled: !!familyId,
  })
}

export function useUpsertCoachingSetting() {
  const queryClient = useQueryClient()
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useMutation({
    mutationFn: async ({
      memberId,
      isEnabled,
      customPrompt,
    }: {
      memberId: string
      isEnabled: boolean
      customPrompt?: string | null
    }) => {
      if (!familyId) throw new Error('No family ID')

      const { error } = await supabase
        .from('message_coaching_settings')
        .upsert(
          {
            family_id: familyId,
            family_member_id: memberId,
            is_enabled: isEnabled,
            custom_prompt: customPrompt ?? null,
          },
          { onConflict: 'family_id,family_member_id' },
        )

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COACHING_SETTINGS_KEY, familyId] })
    },
  })
}

// ── All member messaging permissions (for the matrix) ──

export function useAllMessagingPermissions() {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useQuery({
    queryKey: [MESSAGING_PERMISSIONS_KEY, familyId],
    queryFn: async () => {
      if (!familyId) return []

      const { data, error } = await supabase
        .from('member_messaging_permissions')
        .select('*')
        .eq('family_id', familyId)

      if (error) throw error
      return data as MemberMessagingPermission[]
    },
    enabled: !!familyId,
  })
}

export function useToggleMessagingPermission() {
  const queryClient = useQueryClient()
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useMutation({
    mutationFn: async ({
      memberId,
      canMessageMemberId,
      allowed,
    }: {
      memberId: string
      canMessageMemberId: string
      allowed: boolean
    }) => {
      if (!familyId) throw new Error('No family ID')

      if (allowed) {
        // Insert permission
        const { error } = await supabase
          .from('member_messaging_permissions')
          .upsert(
            {
              family_id: familyId,
              member_id: memberId,
              can_message_member_id: canMessageMemberId,
            },
            { onConflict: 'member_id,can_message_member_id' },
          )
        if (error) throw error
      } else {
        // Remove permission
        const { error } = await supabase
          .from('member_messaging_permissions')
          .delete()
          .eq('family_id', familyId)
          .eq('member_id', memberId)
          .eq('can_message_member_id', canMessageMemberId)

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MESSAGING_PERMISSIONS_KEY, familyId] })
    },
  })
}
