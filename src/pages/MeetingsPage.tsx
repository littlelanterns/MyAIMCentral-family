import { useState } from 'react'
import { UsersRound, Plus, Clock, ChevronRight, CalendarDays, Settings, MessageSquarePlus } from 'lucide-react'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember, useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { useMeetingSchedules, useRecentMeetings, usePendingAgendaCounts, useAddAgendaItem, useMeetingTemplates, useActiveMeetings } from '@/hooks/useMeetings'
import { PermissionGate } from '@/lib/permissions/PermissionGate'
import { FeatureGuide } from '@/components/shared/FeatureGuide'
import { ScheduleEditorModal } from '@/components/meetings/ScheduleEditorModal'
import { AgendaSectionEditorModal } from '@/components/meetings/AgendaSectionEditorModal'
import { CustomTemplateCreatorModal } from '@/components/meetings/CustomTemplateCreatorModal'
import type { MeetingType, MeetingSchedule } from '@/types/meetings'
import { MEETING_TYPE_LABELS, getMeetingUrgency } from '@/types/meetings'

function MeetingUpcomingCard({ schedule, agendaCount, childName }: {
  schedule: MeetingSchedule
  agendaCount: number
  childName?: string
}) {
  const urgency = getMeetingUrgency(schedule.next_due_date)
  const urgencyColor = urgency === 'overdue' ? 'var(--color-error)' : urgency === 'due_today' ? 'var(--color-warning)' : 'var(--color-text-tertiary)'
  const urgencyLabel = urgency === 'overdue'
    ? `Overdue ${Math.abs(Math.floor((new Date(schedule.next_due_date!).getTime() - Date.now()) / 86400000))}d`
    : urgency === 'due_today' ? 'Due Today' : schedule.next_due_date
      ? `In ${Math.ceil((new Date(schedule.next_due_date).getTime() - Date.now()) / 86400000)}d`
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
        <button className="btn-primary text-sm px-3 py-1.5 rounded-md flex items-center gap-1" disabled>
          <UsersRound size={14} /> Live Mode
        </button>
        <button className="text-sm px-3 py-1.5 rounded-md flex items-center gap-1" style={{ background: 'var(--color-surface-tertiary)', color: 'var(--color-text-secondary)' }} disabled>
          <Clock size={14} /> Record After
        </button>
      </div>
      <p className="text-xs mt-2 italic" style={{ color: 'var(--color-text-tertiary)' }}>
        Live Mode and Record After activate in Phase C (AI integration)
      </p>
    </div>
  )
}

function MeetingTypeRow({ meetingType, label, agendaCount, schedule, familyId, memberId, childName, relatedMemberId, onOpenSchedule, onOpenSections }: {
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

  const getMemberName = (id: string) => members?.find((m: FamilyMember) => m.id === id)?.display_name ?? ''

  const handleOpenSchedule = (meetingType: MeetingType, schedule?: MeetingSchedule, relatedMemberId?: string, childName?: string) => {
    setScheduleModal({ open: true, meetingType, schedule, relatedMemberId, childName })
  }

  const handleOpenSections = (meetingType: MeetingType, childName?: string) => {
    setSectionsModal({ open: true, meetingType, childName })
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
          {upcomingSchedules.length === 0 ? (
            <div className="text-center py-8 rounded-lg" style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}>
              <UsersRound size={32} className="mx-auto mb-2" style={{ color: 'var(--color-text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No upcoming meetings</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Set up a meeting schedule to get started</p>
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
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Recent History</h2>
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
        </>
      )}
    </div>
  )
}
