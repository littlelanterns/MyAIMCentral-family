/**
 * MessagesThreadPage — PRD-15 Screen 3 route wrapper
 *
 * Renders ChatThreadView for /messages/thread/:threadId
 * Phase E: passes showLilaButton and coachingEnabled props
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { ChatThreadView } from '@/components/messaging/ChatThreadView'
import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { COACHING_SETTINGS_KEY } from '@/hooks/useMessagingSettings'

export function MessagesThreadPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const navigate = useNavigate()
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const { data: allMembers } = useFamilyMembers(currentFamily?.id)

  // Fetch thread details
  const { data: thread, isLoading } = useQuery({
    queryKey: ['thread-detail', threadId],
    queryFn: async () => {
      if (!threadId) return null
      const { data, error } = await supabase
        .from('conversation_threads')
        .select(`
          id, space_id, title, started_by, is_archived, is_pinned,
          source_type, source_reference_id, last_message_at, created_at
        `)
        .eq('id', threadId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!threadId,
  })

  // Get space members for participant names
  const { data: spaceMembers } = useQuery({
    queryKey: ['space-members', thread?.space_id],
    queryFn: async () => {
      if (!thread?.space_id) return []
      const { data, error } = await supabase
        .from('conversation_space_members')
        .select('family_member_id')
        .eq('space_id', thread.space_id)
      if (error) return []
      return data ?? []
    },
    enabled: !!thread?.space_id,
  })

  const participantNames = useMemo(() => {
    if (!spaceMembers?.length || !allMembers?.length || !currentMember?.id) return ''
    const names = spaceMembers
      .filter(sm => sm.family_member_id !== currentMember.id)
      .map(sm => {
        const m = allMembers.find(fm => fm.id === sm.family_member_id)
        return m?.display_name
      })
      .filter(Boolean)
    return names.join(', ')
  }, [spaceMembers, allMembers, currentMember?.id])

  // Phase E: Check if coaching is enabled for current member
  const { data: myCoachingSetting } = useQuery({
    queryKey: [COACHING_SETTINGS_KEY, 'my', currentMember?.id],
    queryFn: async () => {
      if (!currentMember?.id) return null
      const { data, error } = await supabase
        .from('message_coaching_settings')
        .select('is_enabled')
        .eq('family_member_id', currentMember.id)
        .limit(1)
        .single()
      if (error) return null
      return data
    },
    enabled: !!currentMember?.id,
  })

  const coachingEnabled = myCoachingSetting?.is_enabled ?? false
  // LiLa button visible for all members during beta (all tiers unlocked)
  const showLilaButton = !!currentMember

  if (!threadId) {
    navigate('/messages')
    return null
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
      </div>
    )
  }

  if (!thread) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Thread not found.
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', height: '100%' }}>
      <ChatThreadView
        threadId={thread.id}
        threadTitle={thread.title}
        spaceId={thread.space_id}
        participantNames={participantNames}
        showLilaButton={showLilaButton}
        coachingEnabled={coachingEnabled}
      />
    </div>
  )
}
