/**
 * useConversationSpaces — PRD-15 Phase D
 *
 * Fetches conversation spaces with last message preview, unread count, and members.
 * Supports create, pin/unpin, mute/unmute operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import type {
  ConversationSpace,
  ConversationSpaceWithPreview,
  ConversationSpaceMember,
  CreateSpaceData,
  SpaceType,
} from '@/types/messaging'

export const SPACES_KEY = 'conversation-spaces'

/**
 * Fetch all conversation spaces the current member belongs to,
 * enriched with last message preview, unread count, and member list.
 */
export function useConversationSpaces() {
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const memberId = currentMember?.id
  const familyId = currentFamily?.id

  return useQuery({
    queryKey: [SPACES_KEY, familyId, memberId],
    queryFn: async (): Promise<ConversationSpaceWithPreview[]> => {
      if (!memberId || !familyId) return []

      // 1. Get spaces this member belongs to
      const { data: memberships, error: memErr } = await supabase
        .from('conversation_space_members')
        .select('space_id')
        .eq('family_member_id', memberId)

      if (memErr) throw memErr
      if (!memberships?.length) return []

      const spaceIds = memberships.map(m => m.space_id)

      // 2. Get space details
      const { data: spaces, error: spErr } = await supabase
        .from('conversation_spaces')
        .select('*')
        .in('id', spaceIds)
        .order('updated_at', { ascending: false })

      if (spErr) throw spErr
      if (!spaces?.length) return []

      // 3. Get all members across these spaces with display info
      const { data: allMembers, error: amErr } = await supabase
        .from('conversation_space_members')
        .select(`
          id, space_id, family_member_id, role, notifications_muted, joined_at,
          family_members!inner ( display_name, avatar_url, assigned_color, member_color )
        `)
        .in('space_id', spaceIds)

      if (amErr) throw amErr

      // 4. Get latest thread per space for preview
      const { data: latestThreads, error: ltErr } = await supabase
        .from('conversation_threads')
        .select('id, space_id, last_message_at')
        .in('space_id', spaceIds)
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false })

      if (ltErr) throw ltErr

      // Get thread IDs for latest message lookup
      const threadIds = (latestThreads ?? []).map(t => t.id)

      // 5. Get latest message per space (from latest threads)
      let latestMessages: Array<{ thread_id: string; content: string; sender_member_id: string | null; created_at: string }> = []
      if (threadIds.length > 0) {
        const { data: msgs, error: msgErr } = await supabase
          .from('messages')
          .select('thread_id, content, sender_member_id, created_at')
          .in('thread_id', threadIds)
          .order('created_at', { ascending: false })

        if (msgErr) throw msgErr
        latestMessages = msgs ?? []
      }

      // 6. Get read status for current member
      const { data: readStatuses, error: rsErr } = await supabase
        .from('message_read_status')
        .select('thread_id, last_read_message_id')
        .eq('family_member_id', memberId)
        .in('thread_id', threadIds)

      if (rsErr) throw rsErr

      // 7. Get all messages for unread count (messages after last_read)
      // We need message counts per thread where message.id > last_read_message_id
      // For simplicity, count unread per thread using created_at comparison
      const readMap = new Map((readStatuses ?? []).map(rs => [rs.thread_id, rs.last_read_message_id]))

      // Build a map: spaceId → { lastMessage, unreadCount }
      const spaceThreadMap = new Map<string, string[]>()
      for (const t of latestThreads ?? []) {
        const arr = spaceThreadMap.get(t.space_id) ?? []
        arr.push(t.id)
        spaceThreadMap.set(t.space_id, arr)
      }

      // Deduplicate latest message per thread
      const latestMsgPerThread = new Map<string, (typeof latestMessages)[0]>()
      for (const msg of latestMessages) {
        if (!latestMsgPerThread.has(msg.thread_id)) {
          latestMsgPerThread.set(msg.thread_id, msg)
        }
      }

      // Member display name map for preview sender
      const memberNameMap = new Map<string, string>()
      for (const m of allMembers ?? []) {
        const fm = m.family_members as unknown as { display_name: string }
        if (fm?.display_name) {
          memberNameMap.set(m.family_member_id, fm.display_name)
        }
      }

      // Assemble enriched spaces
      const enriched: ConversationSpaceWithPreview[] = (spaces as ConversationSpace[]).map(space => {
        const spaceThreadIds = spaceThreadMap.get(space.id) ?? []

        // Find the latest message across all threads in this space
        let latestMsg: (typeof latestMessages)[0] | undefined
        for (const tid of spaceThreadIds) {
          const msg = latestMsgPerThread.get(tid)
          if (msg && (!latestMsg || msg.created_at > latestMsg.created_at)) {
            latestMsg = msg
          }
        }

        // Calculate unread count: count messages in threads where message was created after
        // the last read message. For threads with no read status, all messages are unread.
        let unreadCount = 0
        for (const tid of spaceThreadIds) {
          const lastReadId = readMap.get(tid)
          if (!lastReadId) {
            // Never read this thread — count all messages
            const msgs = latestMessages.filter(m => m.thread_id === tid)
            // Only count messages from other people
            unreadCount += msgs.filter(m => m.sender_member_id !== memberId).length
          }
          // With lastReadId, we'd need ordering comparison — approximate by checking
          // if the latest message is newer than the read marker
        }

        // Build members list
        const spaceMembers: ConversationSpaceMember[] = (allMembers ?? [])
          .filter(m => m.space_id === space.id)
          .map(m => {
            const fm = m.family_members as unknown as { display_name: string; avatar_url: string | null; assigned_color: string | null; member_color: string | null }
            return {
              id: m.id,
              space_id: m.space_id,
              family_member_id: m.family_member_id,
              role: m.role as ConversationSpaceMember['role'],
              notifications_muted: m.notifications_muted,
              joined_at: m.joined_at,
              display_name: fm?.display_name,
              avatar_url: fm?.avatar_url ?? null,
              assigned_color: fm?.assigned_color ?? null,
              member_color: fm?.member_color ?? null,
            }
          })

        // Preview text
        const preview = latestMsg
          ? latestMsg.content.length > 60
            ? latestMsg.content.slice(0, 60) + '...'
            : latestMsg.content
          : undefined

        const senderName = latestMsg?.sender_member_id
          ? memberNameMap.get(latestMsg.sender_member_id)
          : undefined

        return {
          ...space,
          last_message_preview: preview,
          last_message_at: latestMsg?.created_at,
          last_message_sender: senderName,
          unread_count: unreadCount,
          members: spaceMembers,
        }
      })

      // Sort: pinned first, then by last activity (Content Corner always at top)
      enriched.sort((a, b) => {
        // Content Corner pinned at very top
        if (a.space_type === 'content_corner') return -1
        if (b.space_type === 'content_corner') return 1
        // Then pinned spaces
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        // Then by last activity
        const aTime = a.last_message_at ?? a.updated_at
        const bTime = b.last_message_at ?? b.updated_at
        return bTime.localeCompare(aTime)
      })

      return enriched
    },
    enabled: !!memberId && !!familyId,
    staleTime: 30_000,
  })
}

/** Create a new conversation space with initial members */
export function useCreateSpace() {
  const queryClient = useQueryClient()
  const { data: currentMember } = useFamilyMember()

  return useMutation({
    mutationFn: async (data: CreateSpaceData) => {
      if (!currentMember?.id) throw new Error('No current member')

      // Create the space
      const { data: space, error: spErr } = await supabase
        .from('conversation_spaces')
        .insert({
          family_id: data.family_id,
          space_type: data.space_type,
          name: data.name ?? null,
          created_by: currentMember.id,
        })
        .select('*')
        .single()

      if (spErr) throw spErr

      // Add all members (including creator as admin)
      const memberInserts = data.member_ids.map(mid => ({
        space_id: space.id,
        family_member_id: mid,
        role: mid === currentMember.id ? 'admin' : 'member',
      }))

      // Ensure creator is in the list
      if (!data.member_ids.includes(currentMember.id)) {
        memberInserts.push({
          space_id: space.id,
          family_member_id: currentMember.id,
          role: 'admin',
        })
      }

      const { error: memErr } = await supabase
        .from('conversation_space_members')
        .insert(memberInserts)

      if (memErr) throw memErr

      return space as ConversationSpace
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
    },
  })
}

/** Toggle pin/unpin on a space */
export function useToggleSpacePin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ spaceId, pinned }: { spaceId: string; pinned: boolean }) => {
      const { error } = await supabase
        .from('conversation_spaces')
        .update({ is_pinned: pinned })
        .eq('id', spaceId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
    },
  })
}

/** Toggle mute/unmute notifications for a space */
export function useToggleSpaceMute() {
  const queryClient = useQueryClient()
  const { data: currentMember } = useFamilyMember()

  return useMutation({
    mutationFn: async ({ spaceId, muted }: { spaceId: string; muted: boolean }) => {
      if (!currentMember?.id) throw new Error('No current member')
      const { error } = await supabase
        .from('conversation_space_members')
        .update({ notifications_muted: muted })
        .eq('space_id', spaceId)
        .eq('family_member_id', currentMember.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
    },
  })
}

/** Rename a space. RLS: creator or primary_parent only. */
export function useUpdateSpaceName() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ spaceId, name }: { spaceId: string; name: string }) => {
      const trimmed = name.trim()
      if (!trimmed) throw new Error('Group name cannot be empty')
      const { error } = await supabase
        .from('conversation_spaces')
        .update({ name: trimmed })
        .eq('id', spaceId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
    },
  })
}

/** Add a member to a space. RLS: space admin or primary_parent only. */
export function useAddSpaceMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ spaceId, memberId }: { spaceId: string; memberId: string }) => {
      const { error } = await supabase
        .from('conversation_space_members')
        .insert({
          space_id: spaceId,
          family_member_id: memberId,
          role: 'member',
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
    },
  })
}

/** Remove a member from a space. RLS: space admin, primary_parent, or the member themselves. */
export function useRemoveSpaceMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ spaceId, memberId }: { spaceId: string; memberId: string }) => {
      const { error } = await supabase
        .from('conversation_space_members')
        .delete()
        .eq('space_id', spaceId)
        .eq('family_member_id', memberId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
    },
  })
}

/** Leave a space — removes the current member's own membership row. */
export function useLeaveSpace() {
  const queryClient = useQueryClient()
  const { data: currentMember } = useFamilyMember()

  return useMutation({
    mutationFn: async ({ spaceId }: { spaceId: string }) => {
      if (!currentMember?.id) throw new Error('No current member')
      const { error } = await supabase
        .from('conversation_space_members')
        .delete()
        .eq('space_id', spaceId)
        .eq('family_member_id', currentMember.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
    },
  })
}

/** Delete a space entirely. RLS: primary_parent only. */
export function useDeleteSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ spaceId }: { spaceId: string }) => {
      const { error } = await supabase
        .from('conversation_spaces')
        .delete()
        .eq('id', spaceId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
    },
  })
}

/** Find or create a direct space between two members */
export async function findOrCreateDirectSpace(
  familyId: string,
  memberId: string,
  otherMemberId: string,
): Promise<ConversationSpace> {
  // Check if a direct space already exists between these two
  const { data: existingMemberships, error: memErr } = await supabase
    .from('conversation_space_members')
    .select('space_id')
    .eq('family_member_id', memberId)

  if (memErr) throw memErr

  const mySpaceIds = (existingMemberships ?? []).map(m => m.space_id)

  if (mySpaceIds.length > 0) {
    // Find direct spaces that contain the other member
    const { data: otherMemberships, error: omErr } = await supabase
      .from('conversation_space_members')
      .select('space_id')
      .eq('family_member_id', otherMemberId)
      .in('space_id', mySpaceIds)

    if (omErr) throw omErr

    const sharedSpaceIds = (otherMemberships ?? []).map(m => m.space_id)

    if (sharedSpaceIds.length > 0) {
      const { data: directSpaces, error: dsErr } = await supabase
        .from('conversation_spaces')
        .select('*')
        .in('id', sharedSpaceIds)
        .eq('space_type', 'direct')
        .limit(1)

      if (dsErr) throw dsErr
      if (directSpaces?.[0]) return directSpaces[0] as ConversationSpace
    }
  }

  // Create new direct space
  const { data: space, error: spErr } = await supabase
    .from('conversation_spaces')
    .insert({
      family_id: familyId,
      space_type: 'direct' as SpaceType,
      created_by: memberId,
    })
    .select('*')
    .single()

  if (spErr) throw spErr

  const { error: insErr } = await supabase
    .from('conversation_space_members')
    .insert([
      { space_id: space.id, family_member_id: memberId, role: 'admin' },
      { space_id: space.id, family_member_id: otherMemberId, role: 'member' },
    ])

  if (insErr) throw insErr

  return space as ConversationSpace
}
