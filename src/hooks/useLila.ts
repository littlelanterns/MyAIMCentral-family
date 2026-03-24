import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

// ============================================================
// Types — match PRD-05 corrected schema exactly
// ============================================================

export interface LilaConversation {
  id: string
  family_id: string
  member_id: string
  mode: 'general' | 'help' | 'assist' | 'optimizer'
  guided_mode: string | null
  guided_subtype: string | null
  guided_mode_reference_id: string | null
  model_used: string | null
  context_snapshot: Record<string, unknown>
  title: string | null
  container_type: 'drawer' | 'modal'
  page_context: string | null
  is_safe_harbor: boolean
  vault_item_id: string | null
  safety_scanned: boolean
  status: 'active' | 'archived' | 'deleted'
  message_count: number
  token_usage: { input: number; output: number }
  created_at: string
  updated_at: string
}

export interface LilaMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, unknown>
  token_count: number | null
  safety_scanned: boolean
  created_at: string
}

export interface GuidedMode {
  id: string
  mode_key: string
  display_name: string
  parent_mode: string | null
  avatar_key: string
  model_tier: 'sonnet' | 'haiku'
  context_sources: string[]
  person_selector: boolean
  opening_messages: string[]
  system_prompt_key: string
  available_to_roles: string[]
  requires_feature_key: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface LilaToolPermission {
  id: string
  family_id: string
  member_id: string
  mode_key: string
  is_enabled: boolean
  context_person_ids: string[]
  include_family_context: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// Crisis Detection — Layer 1 synchronous keyword matching
// ============================================================

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

// ============================================================
// Guided Modes
// ============================================================

export function useGuidedModes(activeOnly = true) {
  return useQuery({
    queryKey: ['guided-modes', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('lila_guided_modes')
        .select('*')
        .order('sort_order')

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query
      if (error) throw error
      return data as GuidedMode[]
    },
  })
}

export function useGuidedMode(modeKey: string | null) {
  return useQuery({
    queryKey: ['guided-mode', modeKey],
    queryFn: async () => {
      if (!modeKey) return null

      const { data, error } = await supabase
        .from('lila_guided_modes')
        .select('*')
        .eq('mode_key', modeKey)
        .single()

      if (error) throw error
      return data as GuidedMode
    },
    enabled: !!modeKey,
  })
}

// ============================================================
// Conversations
// ============================================================

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

/** All conversations for history view (active + archived) */
export function useConversationHistory(memberId: string | undefined, filters?: {
  search?: string
  modeKey?: string
  status?: 'active' | 'archived'
}) {
  return useQuery({
    queryKey: ['lila-conversation-history', memberId, filters],
    queryFn: async () => {
      if (!memberId) return []

      let query = supabase
        .from('lila_conversations')
        .select('*')
        .eq('member_id', memberId)
        .neq('status', 'deleted')
        .order('updated_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.modeKey) {
        query = query.eq('guided_mode', filters.modeKey)
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error } = await query
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
      mode?: 'general' | 'help' | 'assist' | 'optimizer'
      guided_mode?: string
      guided_subtype?: string
      guided_mode_reference_id?: string
      container_type: 'drawer' | 'modal'
      page_context?: string
      is_safe_harbor?: boolean
      model_used?: string
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
      queryClient.invalidateQueries({ queryKey: ['lila-conversation-history', data.member_id] })
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
      metadata?: Record<string, unknown>
      token_count?: number
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

export function useRenameConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, title, memberId }: { id: string; title: string; memberId: string }) => {
      const { error } = await supabase
        .from('lila_conversations')
        .update({ title })
        .eq('id', id)

      if (error) throw error
      return { id, memberId }
    },
    onSuccess: ({ memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['lila-conversations', memberId] })
      queryClient.invalidateQueries({ queryKey: ['lila-conversation-history', memberId] })
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
      queryClient.invalidateQueries({ queryKey: ['lila-conversation-history', memberId] })
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('lila_conversations')
        .update({ status: 'deleted' })
        .eq('id', id)

      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['lila-conversations', memberId] })
      queryClient.invalidateQueries({ queryKey: ['lila-conversation-history', memberId] })
    },
  })
}

// ============================================================
// Tool Permissions
// ============================================================

export function useToolPermissions(memberId: string | undefined) {
  return useQuery({
    queryKey: ['lila-tool-permissions', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('lila_tool_permissions')
        .select('*')
        .eq('member_id', memberId)
        .eq('is_enabled', true)

      if (error) throw error
      return data as LilaToolPermission[]
    },
    enabled: !!memberId,
  })
}

// ============================================================
// Streaming AI Chat
// ============================================================

/** Call the lila-chat Edge Function with streaming response */
export async function streamLilaChat(
  conversationId: string,
  content: string,
  onChunk: (chunk: string) => void,
  onDone: (fullResponse: string, metadata?: Record<string, unknown>) => void,
  onError: (error: Error) => void,
) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const response = await fetch(`${supabaseUrl}/functions/v1/lila-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ conversation_id: conversationId, content }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LiLa chat error: ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response stream')

    const decoder = new TextDecoder()
    let fullResponse = ''
    let metadata: Record<string, unknown> | undefined

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onDone(fullResponse, metadata)
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'chunk') {
              fullResponse += parsed.content
              onChunk(parsed.content)
            } else if (parsed.type === 'metadata') {
              metadata = parsed
            }
          } catch {
            // Non-JSON line, treat as raw content
            fullResponse += data
            onChunk(data)
          }
        }
      }
    }

    onDone(fullResponse, metadata)
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)))
  }
}
