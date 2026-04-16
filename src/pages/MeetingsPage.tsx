import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { UsersRound, Plus, Clock, ChevronRight, CalendarDays, Settings, MessageSquarePlus } from 'lucide-react'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember, useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { useMeetingSchedules, useRecentMeetings, usePendingAgendaCounts, useAddAgendaItem, useMeetingTemplates, useActiveMeetings } from '@/hooks/useMeetings'
import { PermissionGate } from '@/lib/permissions/PermissionGate'
import { FeatureGuide } from '@/components/shared/FeatureGuide'
import { ScheduleEditorModal } from '@/components/meetings/ScheduleEditorModal'
import { AgendaSectionEditorModal } from '@/components/meetings/AgendaSectionEditorModal'
import { CustomTemplateCreatorModal } from '@/components/meetings/CustomTemplateCreatorModal'
import { StartMeetingModal } from '@/components/meetings/StartMeetingModal'
import { MeetingConversationView } from '@/components/meetings/MeetingConversationView'
import { PostMeetingReview } from '@/components/meetings/PostMeetingReview'
import { MeetingHistoryView } from '@/components/meetings/MeetingHistoryView'
import { MeetingSetupWizard } from '@/components/studio/wizards/MeetingSetupWizard'
import { useFixMeetingEventAttendees } from '@/hooks/useFixMeetingEventAttendees'
import type { MeetingType, MeetingMode, MeetingSchedule, Meeting } from '@/types/meetings'
import { MEETING_TYPE_LABELS, getMeetingUrgency } from '@/types/meetings'

function MeetingUpcomingCard({ schedule, agendaCount, childName, onStartMeeting }: {
  schedule: MeetingSchedule
  agendaCount: number
  childName?: string
  onStartMeeting: (meetingType: MeetingType, relatedMemberId?: string, childName?: string, schedule?: MeetingSchedule) => void
}) {
  const urgency = getMeetingUrgency(schedule.next_due_date)
  const urgencyColor = urgency === 'overdue' ? 'var(--color-error)' : urgency === 'due_today' ? 'var(--color-warning)' : 'var(--color-text-tertiary)'
  // Use local date math to avoid UTC off-by-one
  const daysUntil = (() => {
    if (!schedule.next_due_date) return null
    const now = new Date()
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const due = new Date(schedule.next_due_date)
    const dueLocal = new Date(due.getFullYear(), due.getMonth(), due.getDate())
    return Math.round((dueLocal.getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24))
  })()
  const urgencyLabel = urgency === 'overdue'
    ? `Overdue ${Math.abs(daysUntil ?? 0)}d`
    : urgency === 'due_today' ? 'Due Today' : daysUntil !== null
      ? `In ${daysUntil}d`
      : 'Not scheduled'

  const label = schedule.meeting_type === 'mentor' || schedule.meeting_type === 'parent_child'
    ? `${MEETING_TYPE_LABELS[schedule.meeting_type]}${childName ? `: ${childName}` : ''}`
    : MEETING_TYPE_LABELS[schedule.meeting_type as MeetingType] ?? 'Custom Meeting'

  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
        <span className="text-xs font-medium" style={{ color: urgencyColor }}>{urgencyLabel}</span>
      </div>
      {agendaCount > 0 && (
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          {agendaCount} agenda item{agendaCount !== 1 ? 's' : ''} pending
        </p>
      )}
      <div className="flex gap-2">
        <button
          className="btn-primary text-sm px-3 py-1.5 rounded-md flex items-center gap-1"
          onClick={() => onStartMeeting(schedule.meeting_type as MeetingType, schedule.related_member_id ?? undefined, childName, schedule)}
        >
          <UsersRound size={14} /> Live Mode
        </button>
        <button
          className="text-sm px-3 py-1.5 rounded-md flex items-center gap-1"
          style={{ background: 'var(--color-surface-tertiary)', color: 'var(--color-text-secondary)' }}
          onClick={() => onStartMeeting(schedule.meeting_type as MeetingType, schedule.related_member_id ?? undefined, childName, schedule)}
        >
          <Clock size={14} /> Record After
        </button>
      </div>
    </div>
  )
}

function MeetingTypeRow({ meetingType, label, agendaCount, schedule, familyId, memberId, childName, relatedMemberId, onOpenSchedule, onOpenSections, onStartMeeting }: {
  meetingType: MeetingType
  label: string
  agendaCount: number
  schedule?: MeetingSchedule
  familyId: string
  memberId: string
  childName?: string
  relatedMemberId?: string
  onOpenSchedule: (meetingType: MeetingType, schedule?: MeetingSchedule, relatedMemberId?: string, childName?: string) => void
  onOpenSections: (meetingType: MeetingType, childName?: string) => void
  onStartMeeting: (meetingType: MeetingType, relatedMemberId?: string, childName?: string, schedule?: MeetingSchedule) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [newItem, setNewItem] = useState('')
  const addItem = useAddAgendaItem()

  const displayLabel = childName ? `${label}: ${childName}` : label

  const handleAddItem = () => {
    if (!newItem.trim()) return
    addItem.mutate({
      family_id: familyId,
      meeting_type: meetingType,
      content: newItem.trim(),
      added_by: memberId,
      related_member_id: relatedMemberId ?? schedule?.related_member_id ?? undefined,
    })
    setNewItem('')
  }

  return (
    <div style={{ borderBottom: '1px solid var(--color-border-default)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 px-2 text-left"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <div className="flex items-center gap-2">
          <ChevronRight size={16} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          <span className="font-medium">{displayLabel}</span>
          {agendaCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-accent)', color: 'var(--color-text-on-primary)' }}>
              {agendaCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded hover:opacity-80"
            style={{ color: 'var(--color-text-secondary)' }}
            onClick={e => {
              e.stopPropagation()
              onOpenSchedule(meetingType, schedule, relatedMemberId, childName)
            }}
            title="Schedule"
          >
            <CalendarDays size={16} />
          </button>
          <button
            className="p-1 rounded hover:opacity-80"
            style={{ color: 'var(--color-text-secondary)' }}
            onClick={e => {
              e.stopPropagation()
              onOpenSections(meetingType, childName)
            }}
            title="Agenda sections"
          >
            <Settings size={16} />
          </button>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-3">
          {schedule?.next_due_date && (
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
              Next: {new Date(schedule.next_due_date).toLocaleDateString()}
            </p>
          )}
          {!schedule && (
            <p className="text-xs mb-2 italic" style={{ color: 'var(--color-text-tertiary)' }}>
              No schedule set — tap the calendar icon to configure
            </p>
          )}
          <AgendaQuickAdd
            value={newItem}
            onChange={setNewItem}
            onSubmit={handleAddItem}
            loading={addItem.isPending}
          />
          <button
            className="mt-2 w-full btn-primary text-sm py-2 rounded-md flex items-center justify-center gap-1.5"
            onClick={() => onStartMeeting(meetingType, relatedMemberId, childName, schedule)}
          >
            <UsersRound size={14} /> Start Meeting
          </button>
        </div>
      )}
    </div>
  )
}

function AgendaQuickAdd({ value, onChange, onSubmit, loading }: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  loading: boolean
}) {
  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSubmit() }}
        placeholder="+ Add agenda item..."
        className="flex-1 text-sm px-3 py-2 rounded-md"
        style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
        disabled={loading}
      />
      {value.trim() && (
        <button onClick={onSubmit} disabled={loading} className="p-2 rounded-md" style={{ background: 'var(--color-accent)', color: 'var(--color-text-on-primary)' }}>
          <MessageSquarePlus size={16} />
        </button>
      )}
    </div>
  )
}

export function MeetingsPage() {
  const { data: family } = useFamily()
  const { data: member } = useFamilyMember()
  const { data: members } = useFamilyMembers(family?.id)
  const familyId = family?.id
  const memberId = member?.id

  // One-time fix: add attendees to meeting calendar events created before the fix
  useFixMeetingEventAttendees(familyId, memberId, (members ?? []) as FamilyMember[])

  const { data: schedules = [] } = useMeetingSchedules(familyId)
  const { data: recentMeetings = [] } = useRecentMeetings(familyId)
  const { data: agendaCounts = {} } = usePendingAgendaCounts(familyId)
  const { data: templates = [] } = useMeetingTemplates(familyId)
  const { data: activeMeetings = [] } = useActiveMeetings(familyId)

  // Modal state
  const [scheduleModal, setScheduleModal] = useState<{
    open: boolean
    meetingType: MeetingType
    schedule?: MeetingSchedule
    relatedMemberId?: string
    childName?: string
  }>({ open: false, meetingType: 'couple' })

  const [sectionsModal, setSectionsModal] = useState<{
    open: boolean
    meetingType: MeetingType
    childName?: string
  }>({ open: false, meetingType: 'couple' })

  const [customTemplateOpen, setCustomTemplateOpen] = useState(false)

  // Meeting start + conversation state (Phase C)
  const [startMeetingModal, setStartMeetingModal] = useState<{
    open: boolean
    meetingType: MeetingType
    relatedMemberId?: string
    childName?: string
    schedule?: MeetingSchedule
  }>({ open: false, meetingType: 'couple' })

  const [activeMeetingView, setActiveMeetingView] = useState<Meeting | null>(null)
  const [reviewMeeting, setReviewMeeting] = useState<Meeting | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [meetingWizardOpen, setMeetingWizardOpen] = useState(false)

  const getMemberName = (id: string) => members?.find((m: FamilyMember) => m.id === id)?.display_name ?? ''

  const handleOpenSchedule = (meetingType: MeetingType, schedule?: MeetingSchedule, relatedMemberId?: string, childName?: string) => {
    setScheduleModal({ open: true, meetingType, schedule, relatedMemberId, childName })
  }

  const handleOpenSections = (meetingType: MeetingType, childName?: string) => {
    setSectionsModal({ open: true, meetingType, childName })
  }

  const handleStartMeeting = (meetingType: MeetingType, relatedMemberId?: string, childName?: string, schedule?: MeetingSchedule) => {
    setStartMeetingModal({ open: true, meetingType, relatedMemberId, childName, schedule })
  }

  const handleMeetingStarted = async (meetingId: string, _mode: MeetingMode) => {
    // Fetch the created meeting to pass to the conversation view
    const { data } = await (await import('@/lib/supabase/client')).supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single()
    if (data) {
      setActiveMeetingView(data as Meeting)
    }
  }

  const handleMeetingEnded = (_meetingId: string) => {
    // Keep the meeting reference for review before clearing the conversation view
    const endedMeeting = activeMeetingView
    setActiveMeetingView(null)
    if (endedMeeting) {
      setReviewMeeting(endedMeeting)
    }
  }

  const queryClient = useQueryClient()
  const handleReviewComplete = () => {
    setReviewMeeting(null)
    queryClient.invalidateQueries({ queryKey: ['meetings', familyId] })
    queryClient.invalidateQueries({ queryKey: ['meeting-schedules', familyId] })
    queryClient.invalidateQueries({ queryKey: ['studio-queue', familyId] })
  }

  // Group upcoming schedules (within 7 days or overdue)
  const upcomingSchedules = schedules
    .filter(s => {
      if (!s.next_due_date) return false
      const diff = (new Date(s.next_due_date).getTime() - Date.now()) / 86400000
      return diff < 7
    })
    .sort((a, b) => new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime())

  // Built-in meeting types
  const builtInTypes: Array<{ type: MeetingType; label: string }> = [
    { type: 'couple', label: 'Couple Meeting' },
    { type: 'parent_child', label: 'Parent-Child Meeting' },
    { type: 'mentor', label: 'Mentor Meeting' },
    { type: 'family_council', label: 'Family Council' },
  ]

  // For mentor/parent_child, expand per child
  const getMemberChildren = () => members?.filter((m: FamilyMember) => m.role === 'member') ?? []

  return (
    <div className="density-compact max-w-3xl mx-auto px-4 py-6 space-y-6">
      <FeatureGuide featureKey="meetings_basic" />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Meetings</h1>
      </div>

      {/* Active / In-Progress Meetings */}
      {activeMeetings.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-tertiary)' }}>In Progress</h2>
          <div className="space-y-3">
            {activeMeetings.map(m => (
              <div key={m.id} className="rounded-lg p-4" style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-warning)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {m.custom_title ?? MEETING_TYPE_LABELS[m.meeting_type as MeetingType]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-warning)', color: 'var(--color-text-on-primary)' }}>
                    {m.status === 'paused' ? 'Paused' : 'In Progress'}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  Started {new Date(m.started_at).toLocaleDateString()} — resume in Phase C
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <PermissionGate featureKey="meetings_shared">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Upcoming</h2>
          {upcomingSchedules.length === 0 && schedules.length === 0 ? (
            <div className="text-center py-8 rounded-lg" style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}>
              <UsersRound size={32} className="mx-auto mb-2" style={{ color: 'var(--color-accent-deep)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Set up your family meetings</p>
              <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                Schedule family council, 1:1 time with each kid, and couple check-ins in a few minutes.
              </p>
              <button
                onClick={() => setMeetingWizardOpen(true)}
                className="mt-4 px-5 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
                style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
              >
                <CalendarDays size={16} />
                Get Started
              </button>
            </div>
          ) : upcomingSchedules.length === 0 ? (
            <div className="text-center py-8 rounded-lg" style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}>
              <UsersRound size={32} className="mx-auto mb-2" style={{ color: 'var(--color-text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No upcoming meetings this week</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Your next meeting will appear here when it's due</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSchedules.map(s => {
                const key = s.related_member_id ? `${s.meeting_type}:${s.related_member_id}` : s.meeting_type
                return (
                  <MeetingUpcomingCard
                    key={s.id}
                    schedule={s}
                    agendaCount={agendaCounts[key] ?? 0}
                    childName={s.related_member_id ? getMemberName(s.related_member_id) : undefined}
                    onStartMeeting={handleStartMeeting}
                  />
                )
              })}
            </div>
          )}
        </section>
      </PermissionGate>

      {/* Meeting Types */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Meeting Types</h2>
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border-default)' }}>
          {builtInTypes.map(({ type, label }) => {
            // For mentor/parent_child, expand per child
            if (type === 'mentor' || type === 'parent_child') {
              const children = getMemberChildren()
              if (children.length === 0) {
                return (
                  <MeetingTypeRow
                    key={type}
                    meetingType={type}
                    label={label}
                    agendaCount={agendaCounts[type] ?? 0}
                    schedule={schedules.find(s => s.meeting_type === type)}
                    familyId={familyId!}
                    memberId={memberId!}
                    onOpenSchedule={handleOpenSchedule}
                    onOpenSections={handleOpenSections}
                    onStartMeeting={handleStartMeeting}
                  />
                )
              }
              return children.map((child: FamilyMember) => {
                const key = `${type}:${child.id}`
                const schedule = schedules.find(s => s.meeting_type === type && s.related_member_id === child.id)
                return (
                  <MeetingTypeRow
                    key={key}
                    meetingType={type}
                    label={label}
                    agendaCount={agendaCounts[key] ?? 0}
                    schedule={schedule}
                    familyId={familyId!}
                    memberId={memberId!}
                    childName={child.display_name}
                    relatedMemberId={child.id}
                    onOpenSchedule={handleOpenSchedule}
                    onOpenSections={handleOpenSections}
                    onStartMeeting={handleStartMeeting}
                  />
                )
              })
            }
            return (
              <MeetingTypeRow
                key={type}
                meetingType={type}
                label={label}
                agendaCount={agendaCounts[type] ?? 0}
                schedule={schedules.find(s => s.meeting_type === type)}
                familyId={familyId!}
                memberId={memberId!}
                onOpenSchedule={handleOpenSchedule}
                onOpenSections={handleOpenSections}
                onStartMeeting={handleStartMeeting}
              />
            )
          })}
          {/* Custom templates */}
          {templates.map(t => (
            <MeetingTypeRow
              key={t.id}
              meetingType="custom"
              label={t.name}
              agendaCount={agendaCounts[`custom:${t.id}`] ?? 0}
              familyId={familyId!}
              memberId={memberId!}
              onOpenSchedule={handleOpenSchedule}
              onOpenSections={handleOpenSections}
              onStartMeeting={handleStartMeeting}
            />
          ))}
        </div>
        <button
          className="mt-3 flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md w-full justify-center hover:opacity-80"
          style={{ border: '1px dashed var(--color-border-default)', color: 'var(--color-text-secondary)' }}
          onClick={() => setCustomTemplateOpen(true)}
        >
          <Plus size={16} /> Create Custom Meeting Type
        </button>
      </section>

      {/* Recent History */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Recent History</h2>
          {recentMeetings.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              className="text-xs font-medium hover:opacity-80"
              style={{ color: 'var(--color-btn-primary-bg)' }}
            >
              View All History
            </button>
          )}
        </div>
        {recentMeetings.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
            Your meeting history will appear here after your first completed meeting.
          </p>
        ) : (
          <div className="space-y-2">
            {recentMeetings.map(m => (
              <div key={m.id} className="rounded-lg p-3" style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {m.custom_title ?? MEETING_TYPE_LABELS[m.meeting_type as MeetingType]}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {m.completed_at ? new Date(m.completed_at).toLocaleDateString() : ''}
                  </span>
                </div>
                {m.summary && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {m.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Modals ─────────────────────────────────────────── */}

      {familyId && (
        <>
          <ScheduleEditorModal
            isOpen={scheduleModal.open}
            onClose={() => setScheduleModal(s => ({ ...s, open: false }))}
            meetingType={scheduleModal.meetingType}
            relatedMemberId={scheduleModal.relatedMemberId}
            childName={scheduleModal.childName}
            existingSchedule={scheduleModal.schedule}
            familyId={familyId}
          />

          <AgendaSectionEditorModal
            isOpen={sectionsModal.open}
            onClose={() => setSectionsModal(s => ({ ...s, open: false }))}
            meetingType={sectionsModal.meetingType}
            childName={sectionsModal.childName}
            familyId={familyId}
          />

          <CustomTemplateCreatorModal
            isOpen={customTemplateOpen}
            onClose={() => setCustomTemplateOpen(false)}
            familyId={familyId}
          />

          {memberId && (
            <StartMeetingModal
              isOpen={startMeetingModal.open}
              onClose={() => setStartMeetingModal(s => ({ ...s, open: false }))}
              meetingType={startMeetingModal.meetingType}
              familyId={familyId}
              memberId={memberId}
              relatedMemberId={startMeetingModal.relatedMemberId}
              childName={startMeetingModal.childName}
              schedule={startMeetingModal.schedule}
              onMeetingStarted={handleMeetingStarted}
            />
          )}
        </>
      )}

      {/* Full-screen meeting conversation view */}
      {activeMeetingView && (
        <MeetingConversationView
          meeting={activeMeetingView}
          onEnd={handleMeetingEnded}
          onClose={() => setActiveMeetingView(null)}
        />
      )}

      {/* Post-meeting review modal (Phase D) */}
      {reviewMeeting && (
        <PostMeetingReview
          isOpen={!!reviewMeeting}
          onClose={() => setReviewMeeting(null)}
          meeting={reviewMeeting}
          onSaveComplete={handleReviewComplete}
        />
      )}

      {/* Meeting History view (Phase D) */}
      {showHistory && familyId && (
        <MeetingHistoryView
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          familyId={familyId}
          members={members as FamilyMember[]}
        />
      )}

      {/* Meeting Setup Wizard (Phase 5) */}
      {meetingWizardOpen && familyId && member?.id && (
        <MeetingSetupWizard
          isOpen={meetingWizardOpen}
          onClose={() => {
            setMeetingWizardOpen(false)
            queryClient.invalidateQueries({ queryKey: ['meeting-schedules', familyId] })
          }}
          familyId={familyId}
          memberId={member.id}
          familyMembers={members as FamilyMember[]}
        />
      )}
    </div>
  )
}
