// PRD-16 Phase D: MeetingHistoryView
// Type-filterable list of completed meetings with read-only detail view.

import { useState } from 'react'
import { Clock, ArrowLeft, FileText, Users } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useMeetings } from '@/hooks/useMeetings'
import { useMeetingParticipants } from '@/hooks/useMeetings'
import type { Meeting, MeetingType } from '@/types/meetings'
import { MEETING_TYPE_LABELS } from '@/types/meetings'
import type { FamilyMember } from '@/hooks/useFamilyMember'

interface MeetingHistoryViewProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  members: FamilyMember[]
}

const TYPE_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'couple', label: 'Couple' },
  { value: 'parent_child', label: 'Parent-Child' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'family_council', label: 'Family Council' },
  { value: 'custom', label: 'Custom' },
]

export function MeetingHistoryView({ isOpen, onClose, familyId, members }: MeetingHistoryViewProps) {
  const { data: allMeetings = [] } = useMeetings(familyId)
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)

  const completedMeetings = allMeetings
    .filter(m => m.status === 'completed')
    .filter(m => typeFilter === 'all' || m.meeting_type === typeFilter)
    .sort((a, b) => new Date(b.completed_at ?? b.started_at).getTime() - new Date(a.completed_at ?? a.started_at).getTime())

  const getMemberName = (id: string) => members.find(m => m.id === id)?.display_name ?? ''

  return (
    <ModalV2
      id="meeting-history"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title={selectedMeeting ? 'Meeting Detail' : 'Meeting History'}
      subtitle={selectedMeeting ? (selectedMeeting.custom_title ?? MEETING_TYPE_LABELS[selectedMeeting.meeting_type as MeetingType]) : undefined}
      icon={Clock}
    >
      {selectedMeeting ? (
        <MeetingDetail
          meeting={selectedMeeting}
          getMemberName={getMemberName}
          onBack={() => setSelectedMeeting(null)}
        />
      ) : (
        <div className="space-y-4">
          {/* Type filter */}
          <div className="flex gap-1.5 flex-wrap">
            {TYPE_FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className="text-xs px-3 py-1.5 rounded-full transition-colors"
                style={{
                  background: typeFilter === opt.value ? 'var(--color-accent)' : 'var(--color-surface-tertiary)',
                  color: typeFilter === opt.value ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Meetings list */}
          {completedMeetings.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={32} className="mx-auto mb-2" style={{ color: 'var(--color-text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {typeFilter === 'all' ? 'No completed meetings yet.' : `No completed ${TYPE_FILTER_OPTIONS.find(o => o.value === typeFilter)?.label.toLowerCase()} meetings.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedMeetings.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMeeting(m)}
                  className="w-full text-left rounded-lg p-3 hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {m.custom_title ?? MEETING_TYPE_LABELS[m.meeting_type as MeetingType]}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {m.completed_at ? new Date(m.completed_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {m.duration_minutes != null && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {m.duration_minutes}m
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FileText size={10} /> {m.mode === 'record_after' ? 'Record After' : 'Live'}
                    </span>
                  </div>
                  {m.summary && (
                    <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {m.summary}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </ModalV2>
  )
}

// ── Read-only detail view ────────────────────────────────────────

function MeetingDetail({
  meeting,
  getMemberName,
  onBack,
}: {
  meeting: Meeting
  getMemberName: (id: string) => string
  onBack: () => void
}) {
  const { data: participants = [] } = useMeetingParticipants(meeting.id)
  const displayTitle = meeting.custom_title ?? MEETING_TYPE_LABELS[meeting.meeting_type as MeetingType]

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm hover:opacity-80"
        style={{ color: 'var(--color-btn-primary-bg)' }}
      >
        <ArrowLeft size={14} /> Back to History
      </button>

      {/* Header info */}
      <div className="rounded-lg p-4" style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}>
        <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{displayTitle}</h3>
        <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          <span>
            {meeting.completed_at
              ? new Date(meeting.completed_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : new Date(meeting.started_at).toLocaleDateString()}
          </span>
          {meeting.duration_minutes != null && (
            <span className="flex items-center gap-1">
              <Clock size={10} /> {meeting.duration_minutes} minutes
            </span>
          )}
          <span className="flex items-center gap-1">
            <FileText size={10} /> {meeting.mode === 'record_after' ? 'Record After' : 'Live Mode'}
          </span>
        </div>

        {participants.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Users size={12} style={{ color: 'var(--color-text-tertiary)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {participants.map(p => getMemberName(p.family_member_id)).filter(Boolean).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Summary */}
      {meeting.summary && (
        <section>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Summary</h4>
          <div
            className="rounded-lg p-3 text-sm whitespace-pre-wrap"
            style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
          >
            {meeting.summary}
          </div>
        </section>
      )}

      {/* No impressions shown — those are personal and never shared */}

      {!meeting.summary && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-tertiary)' }}>
          No summary was saved for this meeting.
        </p>
      )}
    </div>
  )
}
