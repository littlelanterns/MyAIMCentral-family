/**
 * MessagesSpacePage — PRD-15 Screen 2 route wrapper
 *
 * Renders ConversationSpaceView for /messages/space/:spaceId
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useConversationSpaces } from '@/hooks/useConversationSpaces'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { ConversationSpaceView } from '@/components/messaging/ConversationSpaceView'
import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'

export function MessagesSpacePage() {
  const { spaceId } = useParams<{ spaceId: string }>()
  const navigate = useNavigate()
  const { data: spaces, isLoading } = useConversationSpaces()
  // Data subject — inside View-As this is the target (Convention #39 / Q5).
  const { member: currentMember } = useEffectiveMember()

  const space = useMemo(() => {
    return spaces?.find(s => s.id === spaceId)
  }, [spaces, spaceId])

  if (!spaceId) {
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

  // Determine display name
  let spaceName = space?.name ?? 'Conversation'
  if (space?.space_type === 'direct' && space.members && currentMember) {
    const other = space.members.find(m => m.family_member_id !== currentMember.id)
    if (other?.display_name) spaceName = other.display_name
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', height: '100%' }}>
      <ConversationSpaceView spaceId={spaceId} spaceName={spaceName} space={space} />
    </div>
  )
}
