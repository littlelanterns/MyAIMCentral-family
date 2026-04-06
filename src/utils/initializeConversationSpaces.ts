/**
 * initializeConversationSpaces — PRD-15 Phase D
 *
 * Auto-creates the default conversation spaces on first Messages page visit:
 * - One direct space per family member pair (involving the current member)
 * - One "family" space for the whole family
 * - One "content_corner" space for shared media links
 *
 * Idempotent — checks for existing spaces before creating.
 * Runs once per family, not per member (spaces are shared).
 */

import { supabase } from '@/lib/supabase/client'
import type { SpaceType } from '@/types/messaging'

interface InitParams {
  familyId: string
  currentMemberId: string
  allMemberIds: string[]
}

export async function initializeConversationSpaces({
  familyId,
  currentMemberId,
  allMemberIds,
}: InitParams): Promise<void> {
  // Check if initialization has already happened by looking for a family space
  const { data: existingFamily, error: efErr } = await supabase
    .from('conversation_spaces')
    .select('id')
    .eq('family_id', familyId)
    .eq('space_type', 'family')
    .limit(1)

  if (efErr) throw efErr

  // If a family space exists, initialization is complete
  if (existingFamily && existingFamily.length > 0) return

  // 1. Create the family space
  const { data: familySpace, error: fsErr } = await supabase
    .from('conversation_spaces')
    .insert({
      family_id: familyId,
      space_type: 'family' as SpaceType,
      name: 'Whole Family',
      created_by: currentMemberId,
    })
    .select('id')
    .single()

  if (fsErr) throw fsErr

  // Add all members to the family space
  const familyMembers = allMemberIds.map(mid => ({
    space_id: familySpace.id,
    family_member_id: mid,
    role: mid === currentMemberId ? 'admin' : 'member',
  }))

  const { error: fmErr } = await supabase
    .from('conversation_space_members')
    .insert(familyMembers)

  if (fmErr) throw fmErr

  // 2. Create the Content Corner space
  const { data: contentCorner, error: ccErr } = await supabase
    .from('conversation_spaces')
    .insert({
      family_id: familyId,
      space_type: 'content_corner' as SpaceType,
      name: 'Content Corner',
      created_by: currentMemberId,
      is_pinned: true,
    })
    .select('id')
    .single()

  if (ccErr) throw ccErr

  // Add all members to Content Corner
  const ccMembers = allMemberIds.map(mid => ({
    space_id: contentCorner.id,
    family_member_id: mid,
    role: mid === currentMemberId ? 'admin' : 'member',
  }))

  const { error: ccmErr } = await supabase
    .from('conversation_space_members')
    .insert(ccMembers)

  if (ccmErr) throw ccmErr

  // 3. Create direct spaces between the current member and each other member
  const otherMembers = allMemberIds.filter(mid => mid !== currentMemberId)

  for (const otherId of otherMembers) {
    const { data: directSpace, error: dsErr } = await supabase
      .from('conversation_spaces')
      .insert({
        family_id: familyId,
        space_type: 'direct' as SpaceType,
        created_by: currentMemberId,
      })
      .select('id')
      .single()

    if (dsErr) {
      console.error(`[initializeConversationSpaces] Failed to create direct space for ${otherId}:`, dsErr)
      continue
    }

    const { error: dmErr } = await supabase
      .from('conversation_space_members')
      .insert([
        { space_id: directSpace.id, family_member_id: currentMemberId, role: 'admin' },
        { space_id: directSpace.id, family_member_id: otherId, role: 'member' },
      ])

    if (dmErr) {
      console.error(`[initializeConversationSpaces] Failed to add members for direct space:`, dmErr)
    }
  }
}
