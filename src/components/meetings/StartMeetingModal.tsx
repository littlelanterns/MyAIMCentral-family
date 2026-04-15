// PRD-16 Phase C: StartMeetingModal
// Mode selection (Live / Record After), participant picker for family_council,
// optional facilitator designation. Creates meetings + meeting_participants rows
// and opens the meeting conversation view.

import { useState } from 'react'
import { UsersRound, Clock, Sparkles } from 'lucide-react'
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

  const [mode, setMode] = useState<MeetingMode>('live')
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(() => {
    // Default participants based on meeting type
    return getDefaultParticipants(meetingType, memberId, relatedMemberId, members)
  })
  const [facilitatorId, setFacilitatorId] = useState<string | null>(null)

  const isFamilyCouncil = meetingType === 'family_council'
  const showParticipantPicker = isFamilyCouncil

  // Filter members for participant picker:
  // Exclude Special Adults (no meeting access per PRD-16)
  const eligibleMembers = members.filter((m: FamilyMember) =>
    m.is_active && m.role !== 'special_adult'
  )

  // Children eligible for facilitator role (family council only)
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
    // Clear facilitator if they're deselected
    if (facilitatorId === id) setFacilitatorId(null)
  }

  const handleToggleAll = () => {
    const allIds = eligibleMembers.map((m: FamilyMember) => m.id)
    if (selectedParticipantIds.length === allIds.length) {
      // Deselect all except current user
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
      title={`Start ${displayTitle}`}
    >
      <div className="space-y-6 p-4">
        {/* Mode selection */}
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
            How are you meeting?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('live')}
              className="p-4 rounded-lg text-left transition-all"
              style={{
                border: mode === 'live' ? '2px solid var(--color-accent)' : '1px solid var(--color-border-default)',
                background: mode === 'live' ? 'color-mix(in srgb, var(--color-accent) 8%, var(--color-surface-secondary))' : 'var(--color-surface-secondary)',
              }}
            >
              <UsersRound size={20} style={{ color: mode === 'live' ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }} />
              <p className="font-medium mt-2" style={{ color: 'var(--color-text-primary)' }}>Live Mode</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                LiLa guides you through your agenda in real time
              </p>
            </button>
            <button
              onClick={() => setMode('record_after')}
              className="p-4 rounded-lg text-left transition-all"
              style={{
                border: mode === 'record_after' ? '2px solid var(--color-accent)' : '1px solid var(--color-border-default)',
                background: mode === 'record_after' ? 'color-mix(in srgb, var(--color-accent) 8%, var(--color-surface-secondary))' : 'var(--color-surface-secondary)',
              }}
            >
              <Clock size={20} style={{ color: mode === 'record_after' ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }} />
              <p className="font-medium mt-2" style={{ color: 'var(--color-text-primary)' }}>Record After</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Capture what you already discussed
              </p>
            </button>
          </div>
        </div>

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
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              LiLa adapts guidance level for child facilitators
            </p>
          </div>
        )}

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
              {mode === 'live' ? <UsersRound size={18} /> : <Clock size={18} />}
              {mode === 'live' ? 'Start Live Meeting' : 'Start Recording'}
            </>
          )}
        </button>
      </div>
    </ModalV2>
  )
}

/** Determine default participants for a meeting type */
function getDefaultParticipants(
  meetingType: MeetingType,
  memberId: string,
  relatedMemberId: string | undefined,
  members: FamilyMember[],
): string[] {
  switch (meetingType) {
    case 'couple': {
      // Mom + dad/additional_adult
      const adults = members.filter((m: FamilyMember) =>
        m.is_active && (m.role === 'primary_parent' || m.role === 'additional_adult')
      )
      return adults.map((m: FamilyMember) => m.id)
    }
    case 'parent_child':
    case 'mentor': {
      // Current user + the specific child
      const ids = [memberId]
      if (relatedMemberId) ids.push(relatedMemberId)
      return ids
    }
    case 'family_council': {
      // All active members except Special Adults. Play unchecked by default.
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
