/**
 * ScheduleEditorModal — PRD-16 Phase B
 *
 * Embeds <UniversalScheduler> with showTimeDefault={true}.
 * Stores RRULE JSONB in meeting_schedules.recurrence_details.
 * Opt-in calendar integration creates recurring calendar_events with source_type='meeting_schedule'.
 */

import { useState, useEffect } from 'react'
import { CalendarDays, CalendarCheck } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { UniversalScheduler } from '@/components/scheduling/UniversalScheduler'
import type { SchedulerOutput } from '@/components/scheduling/types'
import { useUpsertMeetingSchedule } from '@/hooks/useMeetings'
import { useCreateEvent } from '@/hooks/useCalendarEvents'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { MeetingType, MeetingSchedule } from '@/types/meetings'
import { MEETING_TYPE_LABELS } from '@/types/meetings'
import type { RecurrenceRule } from '@/types/calendar'
import { todayLocalIso } from '@/utils/dates'

interface ScheduleEditorModalProps {
  isOpen: boolean
  onClose: () => void
  meetingType: MeetingType
  relatedMemberId?: string
  childName?: string
  existingSchedule?: MeetingSchedule
  familyId: string
}

export function ScheduleEditorModal({
  isOpen,
  onClose,
  meetingType,
  relatedMemberId,
  childName,
  existingSchedule,
  familyId,
}: ScheduleEditorModalProps) {
  const { data: family } = useFamily()
  const { data: member } = useFamilyMember()
  const upsertSchedule = useUpsertMeetingSchedule()
  const createEvent = useCreateEvent()

  const [scheduleValue, setScheduleValue] = useState<SchedulerOutput | null>(null)
  const [createCalendarEvents, setCreateCalendarEvents] = useState(!!existingSchedule?.calendar_event_id)
  const [saving, setSaving] = useState(false)

  // Load existing schedule value
  useEffect(() => {
    if (existingSchedule?.recurrence_details && Object.keys(existingSchedule.recurrence_details).length > 0) {
      setScheduleValue(existingSchedule.recurrence_details as unknown as SchedulerOutput)
    } else {
      setScheduleValue(null)
    }
    setCreateCalendarEvents(!!existingSchedule?.calendar_event_id)
  }, [existingSchedule])

  const label = childName
    ? `${MEETING_TYPE_LABELS[meetingType]}: ${childName}`
    : MEETING_TYPE_LABELS[meetingType] ?? 'Custom Meeting'

  const computeNextDueDate = (output: SchedulerOutput): string | null => {
    // For one_time: use dtstart. For recurring: use dtstart if future, else today.
    if (!output.dtstart) return null
    const dtstart = new Date(output.dtstart)
    const now = new Date()
    return dtstart > now ? output.dtstart : todayLocalIso()
  }

  const computeRecurrenceRule = (output: SchedulerOutput): string => {
    if (!output.rrule) return 'none'
    const rrule = output.rrule.toUpperCase()
    if (rrule.includes('FREQ=DAILY')) return 'daily'
    if (rrule.includes('FREQ=WEEKLY')) return 'weekly'
    if (rrule.includes('FREQ=MONTHLY')) return 'monthly'
    if (rrule.includes('FREQ=YEARLY')) return 'yearly'
    return 'custom'
  }

  const computeCalendarRecurrenceRule = (output: SchedulerOutput): RecurrenceRule | undefined => {
    if (!output.rrule) return undefined
    const rrule = output.rrule.toUpperCase()
    if (rrule.includes('FREQ=DAILY')) return 'daily'
    if (rrule.includes('FREQ=WEEKLY')) return 'weekly'
    if (rrule.includes('FREQ=MONTHLY')) return 'monthly'
    if (rrule.includes('FREQ=YEARLY')) return 'yearly'
    return 'custom'
  }

  const handleSave = async () => {
    if (!scheduleValue || !member?.id) return
    setSaving(true)

    try {
      let calendarEventId: string | null = existingSchedule?.calendar_event_id ?? null

      // Create calendar event if opted in and doesn't already exist
      if (createCalendarEvents && !calendarEventId) {
        const eventData = await createEvent.mutateAsync({
          title: label,
          event_date: scheduleValue.dtstart?.split('T')[0] ?? todayLocalIso(),
          is_all_day: true,
          recurrence_rule: computeCalendarRecurrenceRule(scheduleValue),
          recurrence_details: scheduleValue as unknown as Record<string, unknown>,
          status: 'approved',
        })
        calendarEventId = eventData.id
      }

      // If calendar was unchecked and we had a calendar event, we leave it (don't delete)
      // Per founder decision: cancel doesn't remove calendar events

      await upsertSchedule.mutateAsync({
        id: existingSchedule?.id,
        family_id: familyId,
        meeting_type: meetingType,
        related_member_id: relatedMemberId ?? null,
        template_id: null,
        recurrence_rule: computeRecurrenceRule(scheduleValue),
        recurrence_details: scheduleValue as unknown as Record<string, unknown>,
        next_due_date: computeNextDueDate(scheduleValue),
        last_completed_date: existingSchedule?.last_completed_date ?? null,
        calendar_event_id: createCalendarEvents ? calendarEventId : existingSchedule?.calendar_event_id ?? null,
        is_active: true,
        created_by: existingSchedule?.created_by ?? member.id,
      })

      onClose()
    } catch (err) {
      console.error('Failed to save meeting schedule:', err)
    } finally {
      setSaving(false)
    }
  }

  const timezone = family?.timezone ?? 'America/Chicago'

  return (
    <ModalV2
      id="schedule-editor"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title={`Schedule: ${label}`}
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!scheduleValue || saving}
            className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            {saving ? 'Saving...' : existingSchedule ? 'Update Schedule' : 'Save Schedule'}
          </button>
        </div>
      }
    >
      <div className="space-y-4 p-1">
        <UniversalScheduler
          value={scheduleValue}
          onChange={setScheduleValue}
          showTimeDefault={true}
          timezone={timezone}
        />

        {/* Calendar integration opt-in */}
        <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}>
          <input
            type="checkbox"
            checked={createCalendarEvents}
            onChange={e => setCreateCalendarEvents(e.target.checked)}
            className="rounded"
          />
          <div className="flex items-center gap-2">
            {createCalendarEvents ? <CalendarCheck size={16} style={{ color: 'var(--color-accent)' }} /> : <CalendarDays size={16} style={{ color: 'var(--color-text-tertiary)' }} />}
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Create calendar events automatically
            </span>
          </div>
        </label>
        {createCalendarEvents && (
          <p className="text-xs pl-8" style={{ color: 'var(--color-text-tertiary)' }}>
            A recurring calendar event will be created so meetings show on the family calendar.
          </p>
        )}
      </div>
    </ModalV2>
  )
}
