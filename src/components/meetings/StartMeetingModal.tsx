// PRD-16: StartMeetingModal
// Participant picker for family_council, optional facilitator,
// optional "Record & Transcribe" toggle. Creates meetings + meeting_participants.

import React, { useState } from 'react'
import { UsersRound, Mic, Sparkles } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import { useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { useCreateMeeting } from '@/hooks/useMeetings'
import type { MeetingType, MeetingMode, MeetingSchedule } from '@/types/meetings'
import { MEETING_TYPE_LABELS } from '@/types/meetings'

interface StartMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  meetingType: MeetingType
  familyId: string
  memberId: string
  relatedMemberId?: string
  childName?: string
  schedule?: MeetingSchedule
  templateId?: string
  onMeetingStarted: (meetingId: string, mode: MeetingMode) => void
}

export function StartMeetingModal({
  isOpen,
  onClose,
  meetingType,
  familyId,
  memberId,
  relatedMemberId,
  childName,
  schedule,
  templateId,
  onMeetingStarted,
}: StartMeetingModalProps) {
  const { data: members = [] } = useFamilyMembers(familyId)
  const createMeeting = useCreateMeeting()

  const [recordAndTranscribe, setRecordAndTranscribe] = useState(false)
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([])
  const [facilitatorId, setFacilitatorId] = useState<string | null>(null)
  const [hasInitializedParticipants, setHasInitializedParticipants] = useState(false)

  React.useEffect(() => {
    if (members.length > 0 && !hasInitializedParticipants) {
      setSelectedParticipantIds(getDefaultParticipants(meetingType, memberId, relatedMemberId, members))
      setHasInitializedParticipants(true)
    }
  }, [members, meetingType, memberId, relatedMemberId, hasInitializedParticipants])

  const isFamilyCouncil = meetingType === 'family_council'
  const showParticipantPicker = isFamilyCouncil

  const eligibleMembers = members.filter((m: FamilyMember) =>
    m.is_active && m.role !== 'special_adult'
  )

  const facilitatorCandidates = members.filter((m: FamilyMember) =>
    m.is_active && m.role === 'member' && selectedParticipantIds.includes(m.id)
  )

  const displayTitle = childName
    ? `${MEETING_TYPE_LABELS[meetingType]}: ${childName}`
    : MEETING_TYPE_LABELS[meetingType]

  const handleToggleParticipant = (id: string) => {
    setSelectedParticipantIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
    if (facilitatorId === id) setFacilitatorId(null)
  }

  const handleToggleAll = () => {
    const allIds = eligibleMembers.map((m: FamilyMember) => m.id)
    if (selectedParticipantIds.length === allIds.length) {
      setSelectedParticipantIds([memberId])
    } else {
      setSelectedParticipantIds(allIds)
    }
  }

  const handleStart = async () => {
    try {
      const customTitle = (meetingType === 'mentor' || meetingType === 'parent_child') && childName
        ? `${MEETING_TYPE_LABELS[meetingType]}: ${childName}`
        : undefined

      const mode: MeetingMode = recordAndTranscribe ? 'record_after' : 'live'

      const meeting = await createMeeting.mutateAsync({
        family_id: familyId,
        meeting_type: meetingType,
        mode,
        started_by: memberId,
        template_id: templateId,
        custom_title: customTitle,
        related_member_id: relatedMemberId,
        facilitator_member_id: facilitatorId ?? undefined,
        schedule_id: schedule?.id,
        calendar_event_id: schedule?.calendar_event_id ?? undefined,
        participant_ids: selectedParticipantIds,
      })

      onClose()
      onMeetingStarted(meeting.id, mode)
    } catch (err) {
      console.error('Failed to start meeting:', err)
    }
  }

  return (
    <ModalV2
      id="start-meeting-modal"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title={displayTitle}
    >
      <div className="space-y-5 p-4">
        {/* Participant picker — family council only */}
        {showParticipantPicker && (
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
              Who's joining?
            </label>
            <MemberPillSelector
              members={eligibleMembers.map((m: FamilyMember) => ({
                id: m.id,
                display_name: m.display_name,
                assigned_color: m.assigned_color ?? undefined,
                member_color: m.member_color ?? undefined,
              }))}
              selectedIds={selectedParticipantIds}
              onToggle={handleToggleParticipant}
              showEveryone
              onToggleAll={handleToggleAll}
              showSortToggle={false}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Play children are unchecked by default — opt them in if they're joining
            </p>
          </div>
        )}

        {/* Facilitator designation — family council only, optional */}
        {isFamilyCouncil && facilitatorCandidates.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
              <Sparkles size={14} className="inline mr-1" />
              Child facilitator (optional)
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFacilitatorId(null)}
                className="px-3 py-1.5 rounded-full text-sm transition-all"
                style={{
                  background: facilitatorId === null ? 'var(--color-accent)' : 'var(--color-surface-tertiary)',
                  color: facilitatorId === null ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                }}
              >
                Parent leads
              </button>
              {facilitatorCandidates.map((m: FamilyMember) => (
                <button
                  key={m.id}
                  onClick={() => setFacilitatorId(m.id)}
                  className="px-3 py-1.5 rounded-full text-sm transition-all"
                  style={{
                    background: facilitatorId === m.id ? 'var(--color-accent)' : 'var(--color-surface-tertiary)',
                    color: facilitatorId === m.id ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  {m.display_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Record & Transcribe option */}
        <label
          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
          style={{ background: 'var(--color-surface-tertiary)', border: '1px solid var(--color-border-default)' }}
        >
          <input
            type="checkbox"
            checked={recordAndTranscribe}
            onChange={e => setRecordAndTranscribe(e.target.checked)}
            className="w-4 h-4 rounded accent-(--color-accent)"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <Mic size={14} style={{ color: 'var(--color-text-secondary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Record & Transcribe
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              Opens Notepad for recording — start when you're ready
            </p>
          </div>
        </label>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={createMeeting.isPending || selectedParticipantIds.length === 0}
          className="w-full btn-primary py-3 rounded-lg font-medium flex items-center justify-center gap-2"
        >
          {createMeeting.isPending ? (
            <>Starting...</>
          ) : (
            <>
              <UsersRound size={18} />
              Open Meeting
            </>
          )}
        </button>
      </div>
    </ModalV2>
  )
}

function getDefaultParticipants(
  meetingType: MeetingType,
  memberId: string,
  relatedMemberId: string | undefined,
  members: FamilyMember[],
): string[] {
  switch (meetingType) {
    case 'couple': {
      const adults = members.filter((m: FamilyMember) =>
        m.is_active && (m.role === 'primary_parent' || m.role === 'additional_adult')
      )
      return adults.map((m: FamilyMember) => m.id)
    }
    case 'parent_child':
    case 'mentor': {
      const ids = [memberId]
      if (relatedMemberId) ids.push(relatedMemberId)
      return ids
    }
    case 'family_council': {
      return members
        .filter((m: FamilyMember) => m.is_active && m.role !== 'special_adult')
        .filter((m: FamilyMember) => m.dashboard_mode !== 'play')
        .map((m: FamilyMember) => m.id)
    }
    case 'custom':
    default:
      return [memberId]
  }
}
