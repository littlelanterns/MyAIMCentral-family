/**
 * completeMeeting — PRD-16 Phase D
 *
 * Handles the full Save & Close flow after a meeting ends:
 * 1. Update meeting record with summary + impressions
 * 2. Route each non-skipped action item to its destination
 * 3. Auto-save summary as a journal entry (entry_type='meeting_notes')
 * 4. Advance schedule next_due_date based on recurrence
 * 5. Create notifications for other participants
 */

import { supabase } from '@/lib/supabase/client'
import { createNotification } from '@/utils/createNotification'
import type { ActionItem } from '@/components/meetings/PostMeetingReview'
import type { Meeting, MeetingType } from '@/types/meetings'
import type { MeetingParticipant } from '@/types/meetings'
import { MEETING_TYPE_LABELS } from '@/types/meetings'
import { RRule } from 'rrule'

interface CompleteMeetingParams {
  meeting: Meeting
  summary: string
  impressions: string
  actionItems: ActionItem[]
  familyId: string
  memberId: string
  participants: MeetingParticipant[]
}

export async function completeMeeting({
  meeting,
  summary,
  impressions,
  actionItems,
  familyId,
  memberId,
  participants,
}: CompleteMeetingParams): Promise<void> {
  const displayTitle = meeting.custom_title ?? MEETING_TYPE_LABELS[meeting.meeting_type as MeetingType]

  // 1. Update meeting record with summary + impressions
  const { error: updateError } = await supabase
    .from('meetings')
    .update({
      summary: summary || null,
      impressions: impressions || null,
    })
    .eq('id', meeting.id)
  if (updateError) throw updateError

  // 2. Route action items to their destinations
  const routedCount = await routeActionItems(actionItems, familyId, memberId, meeting.id)

  // 3. Auto-save summary as journal entry (meeting_notes)
  if (summary.trim()) {
    const { error: journalError } = await supabase
      .from('journal_entries')
      .insert({
        family_id: familyId,
        member_id: memberId,
        entry_type: 'meeting_notes',
        content: `## ${displayTitle}\n\n${summary}`,
        tags: ['meeting_notes', meeting.meeting_type],
        visibility: 'shared_parents',
        source: 'meeting',
        source_reference_id: meeting.id,
        is_included_in_ai: true,
      })
    if (journalError) {
      console.error('[completeMeeting] Journal auto-save failed:', journalError.message)
      // Non-blocking — continue with other steps
    }
  }

  // 4. Advance schedule next_due_date if the meeting has a schedule
  if (meeting.schedule_id) {
    await advanceScheduleDate(meeting.schedule_id)
  }

  // 5. Create notifications for other participants
  const otherParticipants = participants.filter(p => p.family_member_id !== memberId)
  for (const p of otherParticipants) {
    await createNotification({
      family_id: familyId,
      recipient_member_id: p.family_member_id,
      notification_type: 'system',
      category: 'tasks',
      title: `${displayTitle} completed`,
      body: routedCount > 0
        ? `Meeting reviewed with ${routedCount} action item${routedCount !== 1 ? 's' : ''} routed.`
        : 'Meeting reviewed — check the summary.',
      source_type: 'meetings',
      source_reference_id: meeting.id,
      action_url: '/meetings',
    })
  }
}

// ── Route action items ──────────────────────────────────────────

async function routeActionItems(
  items: ActionItem[],
  familyId: string,
  memberId: string,
  meetingId: string,
): Promise<number> {
  let routed = 0

  for (const item of items) {
    if (!item.routed || !item.routedDestination) continue

    const assigneeId = item.assigneeMemberId ?? memberId

    try {
      switch (item.routedDestination) {
        case 'tasks':
          // Route through studio_queue — never create tasks directly
          await supabase.from('studio_queue').insert({
            family_id: familyId,
            owner_id: assigneeId,
            destination: 'task',
            content: item.content,
            source: 'meeting_action',
            source_reference_id: meetingId,
          })
          routed++
          break

        case 'calendar':
          await supabase.from('studio_queue').insert({
            family_id: familyId,
            owner_id: assigneeId,
            destination: 'calendar',
            content: item.content,
            source: 'meeting_action',
            source_reference_id: meetingId,
          })
          routed++
          break

        case 'list':
          await supabase.from('studio_queue').insert({
            family_id: familyId,
            owner_id: assigneeId,
            destination: 'list',
            content: item.content,
            source: 'meeting_action',
            source_reference_id: meetingId,
          })
          routed++
          break

        case 'best_intentions':
          await supabase.from('best_intentions').insert({
            family_id: familyId,
            member_id: assigneeId,
            statement: item.content,
            source: 'manual',
            is_included_in_ai: true,
          })
          routed++
          break

        case 'guiding_stars':
          await supabase.from('guiding_stars').insert({
            family_id: familyId,
            member_id: assigneeId,
            content: item.content,
            entry_type: 'value',
            owner_type: 'member',
            source: 'manual',
            is_included_in_ai: true,
          })
          routed++
          break

        case 'backburner': {
          // Find the assignee's backburner list, add item
          const { data: bList } = await supabase
            .from('lists')
            .select('id')
            .eq('owner_id', assigneeId)
            .eq('list_type', 'backburner')
            .limit(1)
            .single()
          if (bList) {
            await supabase.from('list_items').insert({
              list_id: bList.id,
              content: item.content,
            })
          }
          routed++
          break
        }

        case 'skip':
          // No routing needed
          break

        default:
          // Unknown destination — route through studio_queue as fallback
          await supabase.from('studio_queue').insert({
            family_id: familyId,
            owner_id: assigneeId,
            destination: item.routedDestination,
            content: item.content,
            source: 'meeting_action',
            source_reference_id: meetingId,
          })
          routed++
          break
      }
    } catch (err) {
      console.error(`[completeMeeting] Failed to route action item "${item.content}":`, err)
      // Continue with remaining items — partial failure is acceptable
    }
  }

  return routed
}

// ── Advance schedule date ───────────────────────────────────────

async function advanceScheduleDate(scheduleId: string): Promise<void> {
  try {
    const { data: schedule, error } = await supabase
      .from('meeting_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()
    if (error || !schedule) return

    const details = schedule.recurrence_details as Record<string, unknown> | null
    const rruleStr = details?.rrule as string | undefined

    let nextDate: string | null = null

    if (rruleStr) {
      try {
        const rule = RRule.fromString(rruleStr)
        const after = new Date()
        const next = rule.after(after, false)
        if (next) {
          nextDate = next.toISOString()
        }
      } catch {
        // If rrule parsing fails, fall back to simple interval
        nextDate = computeFallbackNextDate(schedule.recurrence_rule)
      }
    } else {
      nextDate = computeFallbackNextDate(schedule.recurrence_rule)
    }

    await supabase
      .from('meeting_schedules')
      .update({
        next_due_date: nextDate,
        last_completed_date: new Date().toISOString(),
      })
      .eq('id', scheduleId)
  } catch (err) {
    console.error('[completeMeeting] Failed to advance schedule:', err)
    // Non-blocking
  }
}

function computeFallbackNextDate(recurrenceRule: string | null): string | null {
  const now = new Date()
  switch (recurrenceRule) {
    case 'daily':
      now.setDate(now.getDate() + 1)
      return now.toISOString()
    case 'weekdays':
      do { now.setDate(now.getDate() + 1) } while (now.getDay() === 0 || now.getDay() === 6)
      return now.toISOString()
    case 'weekly':
      now.setDate(now.getDate() + 7)
      return now.toISOString()
    case 'biweekly':
      now.setDate(now.getDate() + 14)
      return now.toISOString()
    case 'monthly':
      now.setMonth(now.getMonth() + 1)
      return now.toISOString()
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1)
      return now.toISOString()
    default:
      return null
  }
}
