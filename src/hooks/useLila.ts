import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface LilaConversation {
  id: string
  family_id: string
  member_id: string
  guided_mode: string | null
  title: string | null
  container_type: 'drawer' | 'modal'
  page_context: string | null
  is_included_in_ai: boolean
  is_safe_harbor: boolean
  safety_scanned: boolean
  status: 'active' | 'archived' | 'deleted'
  created_at: string
  updated_at: string
}

export interface LilaMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  message_type: string | null
  metadata: Record<string, unknown> | null
  safety_scanned: boolean
  created_at: string
}

export interface GuidedMode {
  id: string
  mode_key: string
  display_name: string
  model_tier: 'sonnet' | 'haiku'
  avatar_set: string | null
  context_sources: string[] | null
  person_selector: boolean
  available_to_roles: string[] | null
  requires_feature_key: string | null
}

// Crisis keywords for Layer 1 synchronous detection
export const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'want to die', 'end my life',
  'self-harm', 'cutting myself', 'hurting myself',
  'being abused', 'abusing me', 'hits me', 'molest',
  'eating disorder', 'starving myself', 'purging',
  'overdose', 'drugs',
]

export function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase()
  return CRISIS_KEYWORDS.some(keyword => lower.includes(keyword))
}

export const CRISIS_RESPONSE = `I hear you, and I want you to know that help is available right now.

**988 Suicide & Crisis Lifeline**
Call or text 988 (24/7)

**Crisis Text Line**
Text HOME to 741741

**National Domestic Violence Hotline**
1-800-799-7233 (24/7)

**Emergency**
Call 911 if you're in immediate danger

These trained professionals can provide the care you need right now. You don't have to face this alone.`

export function useGuidedModes() {
  return useQuery({
    queryKey: ['guided-modes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lila_guided_modes')
        .select('*')
        .order('mode_key')

      if (error) throw error
      return data as GuidedMode[]
    },
  })
}

export function useLilaConversations(memberId: string | undefined) {
  return useQuery({
    queryKey: ['lila-conversations', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('lila_conversations')
        .select('*')
        .eq('member_id', memberId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data as LilaConversation[]
    },
    enabled: !!memberId,
  })
}

export function useLilaMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['lila-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return []

      const { data, error } = await supabase
        .from('lila_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at')

      if (error) throw error
      return data as LilaMessage[]
    },
    enabled: !!conversationId,
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conv: {
      family_id: string
      member_id: string
      guided_mode?: string
      container_type: 'drawer' | 'modal'
      page_context?: string
      is_safe_harbor?: boolean
    }) => {
      const { data, error } = await supabase
        .from('lila_conversations')
        .insert(conv)
        .select()
        .single()

      if (error) throw error
      return data as LilaConversation
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lila-conversations', data.member_id] })
    },
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (msg: {
      conversation_id: string
      role: 'user' | 'assistant' | 'system'
      content: string
      message_type?: string
      metadata?: Record<string, unknown>
    }) => {
      const { data, error } = await supabase
        .from('lila_messages')
        .insert(msg)
        .select()
        .single()

      if (error) throw error
      return data as LilaMessage
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lila-messages', data.conversation_id] })
    },
  })
}

export function useArchiveConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('lila_conversations')
        .update({ status: 'archived' })
        .eq('id', id)

      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['lila-conversations', memberId] })
    },
  })
}
