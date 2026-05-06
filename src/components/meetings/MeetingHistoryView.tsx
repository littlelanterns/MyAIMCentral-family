// PRD-16: MeetingHistoryView
// Type-filterable, searchable list of completed meetings with read-only detail view.
// Also surfaces discussed-but-never-formal-meeting agenda items so mom can recall
// what she's already talked about with each person.

import { useState, useMemo } from 'react'
import { Clock, ArrowLeft, Users, Search, CheckCircle2 } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useMeetings, useMeetingParticipants, useDiscussedAgendaItems } from '@/hooks/useMeetings'
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
  // Discussed agenda items across the whole family — last ~year so the search
  // catches "did we ever talk about X" even months later.
  const { data: discussedItems = [] } = useDiscussedAgendaItems(
    familyId,
    undefined,
    undefined,
    365,
    isOpen,
  )
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)

  const completedMeetings = useMemo(() => {
    const lower = searchQuery.toLowerCase().trim()
    return allMeetings
      .filter(m => m.status === 'completed')
      .filter(m => typeFilter === 'all' || m.meeting_type === typeFilter)
      .filter(m => {
        if (!lower) return true
        const title = (m.custom_title ?? MEETING_TYPE_LABELS[m.meeting_type as MeetingType] ?? '').toLowerCase()
        const summary = (m.summary ?? '').toLowerCase()
        return title.includes(lower) || summary.includes(lower)
      })
      .sort((a, b) => new Date(b.completed_at ?? b.started_at).getTime() - new Date(a.completed_at ?? a.started_at).getTime())
  }, [allMeetings, typeFilter, searchQuery])

  const getMemberName = (id: string) => members.find(m => m.id === id)?.display_name ?? ''

  // Filter + label discussed items the same way as formal meetings.
  const filteredDiscussed = useMemo(() => {
    const lower = searchQuery.toLowerCase().trim()
    return discussedItems
      .filter(i => typeFilter === 'all' || i.meeting_type === typeFilter)
      .filter(i => {
        if (!lower) return true
        return i.content.toLowerCase().includes(lower)
      })
  }, [discussedItems, typeFilter, searchQuery])

  const conversationLabel = (meetingType: MeetingType, relatedMemberId: string | null) => {
    const base = MEETING_TYPE_LABELS[meetingType] ?? meetingType
    if (relatedMemberId) {
      const name = getMemberName(relatedMemberId)
      return name ? `${base}: ${name}` : base
    }
    return base
  }

  return (
    <ModalV2
      id="meeting-history"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title={selectedMeeting ? 'Conversation Detail' : 'Conversation History'}
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
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search meetings by title or summary..."
              className="w-full text-sm pl-9 pr-3 py-2 rounded-lg"
              style={{
                background: 'var(--color-surface-primary)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

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

          {/* Formal Meetings section */}
          <section>
            <h3
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Formal Meetings
            </h3>
            {completedMeetings.length === 0 ? (
              <p className="text-sm py-3" style={{ color: 'var(--color-text-tertiary)' }}>
                {searchQuery
                  ? `No meetings matching "${searchQuery}"`
                  : typeFilter === 'all'
                    ? 'No completed meetings yet.'
                    : `No completed ${TYPE_FILTER_OPTIONS.find(o => o.value === typeFilter)?.label.toLowerCase()} meetings.`
                }
              </p>
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
          </section>

          {/* Discussed Items section — agenda items checked off without a formal meeting */}
          <section>
            <h3
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Discussed Items
            </h3>
            {filteredDiscussed.length === 0 ? (
              <p className="text-sm py-3" style={{ color: 'var(--color-text-tertiary)' }}>
                {searchQuery
                  ? `No discussed items matching "${searchQuery}"`
                  : 'No items checked off yet.'
                }
              </p>
            ) : (
              <div className="space-y-1.5">
                {filteredDiscussed.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 py-2 px-3 rounded-md"
                    style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}
                  >
                    <CheckCircle2
                      size={14}
                      className="shrink-0 mt-0.5"
                      style={{ color: 'var(--color-success)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {item.content}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                        {conversationLabel(item.meeting_type, item.related_member_id)}
                        {' · '}
                        {new Date(item.updated_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
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

      {!meeting.summary && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-tertiary)' }}>
          No summary was saved for this meeting.
        </p>
      )}
    </div>
  )
}
