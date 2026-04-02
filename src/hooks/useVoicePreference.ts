// PRD-11 Phase 12C: Voice preference hook for victory celebrations
// Reads/writes victory_voice_preferences table

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { getDefaultVoice } from '@/types/victories'
import type { VoicePersonality } from '@/types/victories'

export function useVoicePreference(familyId: string | undefined, memberId: string | undefined, shell?: string) {
  const queryClient = useQueryClient()
  const defaultVoice = getDefaultVoice(shell ?? 'adult')

  const { data: preference, isLoading } = useQuery({
    queryKey: ['voice-preference', memberId],
    queryFn: async () => {
      if (!memberId) return null
      const { data } = await supabase
        .from('victory_voice_preferences')
        .select('*')
        .eq('family_member_id', memberId)
        .maybeSingle()
      return data
    },
    enabled: !!memberId,
  })

  const selectedVoice = (preference?.selected_voice as VoicePersonality) ?? defaultVoice

  const setVoice = useMutation({
    mutationFn: async ({ targetMemberId, voice }: { targetMemberId: string; voice: VoicePersonality }) => {
      if (!familyId) throw new Error('No family ID')

      const { data: existing } = await supabase
        .from('victory_voice_preferences')
        .select('id')
        .eq('family_member_id', targetMemberId)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('victory_voice_preferences')
          .update({ selected_voice: voice, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('victory_voice_preferences')
          .insert({
            family_id: familyId,
            family_member_id: targetMemberId,
            selected_voice: voice,
          })
        if (error) throw error
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['voice-preference', variables.targetMemberId] })
    },
  })

  return {
    selectedVoice,
    isLoading,
    setVoice: (targetMemberId: string, voice: VoicePersonality) =>
      setVoice.mutate({ targetMemberId, voice }),
    isSaving: setVoice.isPending,
  }
}
