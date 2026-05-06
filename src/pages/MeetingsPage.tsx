import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  UsersRound, Plus, ChevronRight, CalendarDays, Settings,
  MessageSquarePlus, Heart, Users, GraduationCap, MessageSquare,
  X, CheckCircle2, Circle, StickyNote, Save,
} from 'lucide-react'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember, useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import {
  useMeetingSchedules, useRecentMeetings, useMeetingAgendaItems,
  useAddAgendaItem, useRemoveAgendaItem, useMarkAgendaDiscussed, useMeetingTemplates, useActiveMeetings,
} from '@/hooks/useMeetings'
import { supabase } from '@/lib/supabase/client'
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
import type { MeetingType, MeetingMode, MeetingSchedule, Meeting, MeetingAgendaItem } from '@/types/meetings'
import { MEETING_TYPE_LABELS } from '@/types/meetings'

const EMPTY_MEMBERS: FamilyMember[] = []

const TYPE_ICONS: Record<MeetingType, typeof Heart> = {
  couple: Heart,
  parent_child: Users,
  mentor: GraduationCap,
  family_council: UsersRound,
  custom: MessageSquare,
}

// ── Agenda-First Meeting Card ─────────────────────────────────

function MeetingCard({
  meetingType,
  label,
  agendaItems,
  schedule,
  familyId,
  memberId,
  relatedMemberId,
  onOpenSchedule,
  onOpenSections,
  onStartMeeting,
}: {
  meetingType: MeetingType
  label: string
  agendaItems: MeetingAgendaItem[]
  schedule?: MeetingSchedule
  familyId: string
  memberId: string
  relatedMemberId?: string
  onOpenSchedule: (meetingType: MeetingType, schedule?: MeetingSchedule, relatedMemberId?: string) => void
  onOpenSections: (meetingType: MeetingType) => void
  onStartMeeting: (meetingType: MeetingType, relatedMemberId?: string, schedule?: MeetingSchedule) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const addItem = useAddAgendaItem()
  const removeItem = useRemoveAgendaItem()
  const markDiscussed = useMarkAgendaDiscussed()
  const Icon = TYPE_ICONS[meetingType] ?? MessageSquare

  const handleAddItem = () => {
    if (!newItem.trim()) return
    addItem.mutate({
      family_id: familyId,
      meeting_type: meetingType,
      content: newItem.trim(),
      added_by: memberId,
      related_member_id: relatedMemberId,
    })
    setNewItem('')
  }

  const handleRemoveItem = (itemId: string) => {
    removeItem.mutate({ id: itemId, family_id: familyId })
  }

  const handleToggleDiscussed = (item: MeetingAgendaItem) => {
    if (item.status === 'discussed') return
    markDiscussed.mutate({ id: item.id, family_id: familyId })
  }

  const handleSaveNotes = async () => {
    if (!notes.trim()) return
    const title = `${label} — ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
    await supabase.from('journal_entries').insert({
      family_id: familyId,
      member_id: memberId,
      entry_type: 'meeting_notes',
      content: `## ${title}\n\n${notes.trim()}`,
      visibility: 'private',
      tags: ['meeting_notes', meetingType],
    })
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 3000)
  }

  const scheduleLabel = schedule?.next_due_date
    ? `${schedule.recurrence_rule === 'weekly' ? 'Weekly' : schedule.recurrence_rule === 'monthly' ? 'Monthly' : schedule.recurrence_rule ?? 'Scheduled'} — next: ${new Date(schedule.next_due_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`
    : null

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }}>
          <Icon size={18} style={{ color: 'var(--color-accent)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{label}</span>
            {agendaItems.length > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--color-accent)', color: 'var(--color-text-on-primary)' }}
              >
                {agendaItems.length}
              </span>
            )}
          </div>
          {scheduleLabel && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{scheduleLabel}</p>
          )}
        </div>

        <ChevronRight
          size={16}
          className={`shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
          style={{ color: 'var(--color-text-tertiary)' }}
        />
      </button>

      {/* Expanded — agenda items + actions */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--color-border-default)' }}>
          {/* Agenda items with inline check-off */}
          {agendaItems.length > 0 ? (
            <div className="pt-3 space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
                Things to talk about
              </p>
              {agendaItems.map(item => {
                const isDone = item.status === 'discussed'
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 py-1.5 px-2 rounded-md group"
                    style={{ background: 'var(--color-surface-primary)' }}
                  >
                    <button
                      onClick={() => handleToggleDiscussed(item)}
                      className="shrink-0 mt-0.5"
                      disabled={isDone}
                      title={isDone ? 'Discussed' : 'Mark as discussed'}
                    >
                      {isDone ? (
                        <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                      ) : (
                        <Circle size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                      )}
                    </button>
                    <span
                      className={`text-sm flex-1 ${isDone ? 'line-through' : ''}`}
                      style={{ color: isDone ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)' }}
                    >
                      {item.content}
                    </span>
                    {!isDone && (
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--color-text-tertiary)' }}
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm pt-3 italic" style={{ color: 'var(--color-text-tertiary)' }}>
              Nothing on the list yet — add things you want to remember to talk about.
            </p>
          )}

          {/* Quick add */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddItem() }}
              placeholder="+ Add agenda item..."
              className="flex-1 text-sm px-3 py-2 rounded-md"
              style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
              disabled={addItem.isPending}
            />
            {newItem.trim() && (
              <button onClick={handleAddItem} disabled={addItem.isPending} className="p-2 rounded-md" style={{ background: 'var(--color-accent)', color: 'var(--color-text-on-primary)' }}>
                <MessageSquarePlus size={16} />
              </button>
            )}
          </div>

          {/* Notes area */}
          {showNotes && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
                Notes
              </p>
              <textarea
                value={notes}
                onChange={e => { setNotes(e.target.value); setNotesSaved(false) }}
                placeholder="Jot down notes, decisions, follow-ups..."
                rows={3}
                className="w-full text-sm px-3 py-2 rounded-md resize-none"
                style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveNotes}
                  disabled={!notes.trim() || notesSaved}
                  className="text-sm px-3 py-1.5 rounded-md flex items-center gap-1.5 disabled:opacity-40"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-text-on-primary)' }}
                >
                  <Save size={13} /> {notesSaved ? 'Saved to Journal' : 'Save to Journal'}
                </button>
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-xs"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Close notes
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!showNotes && (
              <button
                className="text-sm px-3 py-2 rounded-lg flex items-center gap-1.5"
                style={{ background: 'var(--color-surface-tertiary)', color: 'var(--color-text-secondary)' }}
                onClick={() => setShowNotes(true)}
              >
                <StickyNote size={14} /> Notes
              </button>
            )}
            <button
              className="text-sm px-3 py-2 rounded-lg flex items-center gap-1.5"
              style={{ background: 'var(--color-surface-tertiary)', color: 'var(--color-text-secondary)' }}
              onClick={() => onStartMeeting(meetingType, relatedMemberId, schedule)}
              title="Full meeting with LiLa facilitation and post-meeting review"
            >
              <UsersRound size={14} /> Formal Meeting
            </button>
            <button
              className="text-sm px-3 py-2 rounded-lg flex items-center gap-1.5"
              style={{ background: 'var(--color-surface-tertiary)', color: 'var(--color-text-secondary)' }}
              onClick={() => onOpenSections(meetingType)}
              title="Edit conversation template sections"
            >
              <Settings size={14} /> Sections
            </button>
            <button
              className="text-sm px-3 py-2 rounded-lg flex items-center gap-1.5"
              style={{ background: 'var(--color-surface-tertiary)', color: 'var(--color-text-secondary)' }}
              onClick={() => onOpenSchedule(meetingType, schedule, relatedMemberId)}
              title={schedule ? 'Edit schedule' : 'Add a schedule (optional)'}
            >
              <CalendarDays size={14} /> {schedule ? 'Schedule' : 'Add Schedule'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export function MeetingsPage() {
  const { data: family } = useFamily()
  const { data: member } = useFamilyMember()
  const { data: members } = useFamilyMembers(family?.id)
  const familyId = family?.id
  const memberId = member?.id

  useFixMeetingEventAttendees(familyId, memberId, (members ?? EMPTY_MEMBERS) as FamilyMember[])

  const { data: schedules = [] } = useMeetingSchedules(familyId)
  const { data: recentMeetings = [] } = useRecentMeetings(familyId)
  const { data: allAgendaItems = [] } = useMeetingAgendaItems(familyId)
  const { data: templates = [] } = useMeetingTemplates(familyId)
  const { data: activeMeetings = [] } = useActiveMeetings(familyId)
  const queryClient = useQueryClient()

  // Auto-advance stale schedules on mount (once per page load)
  const hasAdvancedSchedules = useRef(false)
  useEffect(() => {
    if (!familyId || schedules.length === 0 || hasAdvancedSchedules.current) return
    const now = new Date()
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const staleSchedules = schedules.filter(s => {
      if (!s.next_due_date) return false
      const due = new Date(s.next_due_date)
      const dueLocal = new Date(due.getFullYear(), due.getMonth(), due.getDate())
      return dueLocal < todayLocal
    })

    if (staleSchedules.length === 0) return
    hasAdvancedSchedules.current = true

    const advanceSchedules = async () => {
      for (const schedule of staleSchedules) {
        const nextDate = computeNextOccurrence(schedule, todayLocal)
        if (nextDate) {
          await supabase
            .from('meeting_schedules')
            .update({ next_due_date: nextDate })
            .eq('id', schedule.id)
        }
      }
      queryClient.invalidateQueries({ queryKey: ['meeting-schedules', familyId] })
    }
    advanceSchedules()
  }, [familyId, schedules, queryClient])

  // Modal state
  const [scheduleModal, setScheduleModal] = useState<{
    open: boolean; meetingType: MeetingType; schedule?: MeetingSchedule; relatedMemberId?: string
  }>({ open: false, meetingType: 'couple' })

  const [sectionsModal, setSectionsModal] = useState<{
    open: boolean; meetingType: MeetingType
  }>({ open: false, meetingType: 'couple' })

  const [customTemplateOpen, setCustomTemplateOpen] = useState(false)

  const [startMeetingModal, setStartMeetingModal] = useState<{
    open: boolean; meetingType: MeetingType; relatedMemberId?: string; schedule?: MeetingSchedule
  }>({ open: false, meetingType: 'couple' })

  const [activeMeetingView, setActiveMeetingView] = useState<Meeting | null>(null)
  const [reviewMeeting, setReviewMeeting] = useState<Meeting | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [meetingWizardOpen, setMeetingWizardOpen] = useState(false)

  const getChildren = () => members?.filter((m: FamilyMember) => m.role === 'member') ?? []

  const getAgendaForMeeting = (meetingType: MeetingType, relatedMemberId?: string) =>
    allAgendaItems.filter(item =>
      item.meeting_type === meetingType &&
      (relatedMemberId ? item.related_member_id === relatedMemberId : !item.related_member_id)
    )

  const handleOpenSchedule = (meetingType: MeetingType, schedule?: MeetingSchedule, relatedMemberId?: string) => {
    setScheduleModal({ open: true, meetingType, schedule, relatedMemberId })
  }

  const handleOpenSections = (meetingType: MeetingType) => {
    setSectionsModal({ open: true, meetingType })
  }

  const handleStartMeeting = (meetingType: MeetingType, relatedMemberId?: string, schedule?: MeetingSchedule) => {
    setStartMeetingModal({ open: true, meetingType, relatedMemberId, schedule })
  }

  const handleMeetingStarted = async (meetingId: string, _mode: MeetingMode) => {
    const { data } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single()
    if (data) {
      setActiveMeetingView(data as Meeting)
    }
  }

  const handleMeetingEnded = () => {
    const endedMeeting = activeMeetingView
    setActiveMeetingView(null)
    if (endedMeeting) {
      setReviewMeeting(endedMeeting)
    }
  }

  const handleReviewComplete = () => {
    setReviewMeeting(null)
    queryClient.invalidateQueries({ queryKey: ['meetings', familyId] })
    queryClient.invalidateQueries({ queryKey: ['meeting-schedules', familyId] })
    queryClient.invalidateQueries({ queryKey: ['studio-queue', familyId] })
  }

  const builtInTypes: Array<{ type: MeetingType; label: string }> = [
    { type: 'couple', label: 'Couple Meeting' },
    { type: 'parent_child', label: 'Parent-Child Meeting' },
    { type: 'mentor', label: 'Mentor Meeting' },
    { type: 'family_council', label: 'Family Council' },
  ]

  const hasAnySchedule = schedules.length > 0

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
              <div key={m.id} className="rounded-xl p-4" style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-warning)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {m.custom_title ?? MEETING_TYPE_LABELS[m.meeting_type as MeetingType]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-warning)', color: 'var(--color-text-on-primary)' }}>
                    {m.status === 'paused' ? 'Paused' : 'In Progress'}
                  </span>
                </div>
                <button
                  className="mt-2 text-sm font-medium flex items-center gap-1"
                  style={{ color: 'var(--color-btn-primary-bg)' }}
                  onClick={async () => {
                    const { data } = await supabase.from('meetings').select('*').eq('id', m.id).single()
                    if (data) setActiveMeetingView(data as Meeting)
                  }}
                >
                  <UsersRound size={14} /> Resume
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state — no schedules at all */}
      {!hasAnySchedule && allAgendaItems.length === 0 && activeMeetings.length === 0 && (
        <div className="text-center py-8 rounded-xl" style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}>
          <UsersRound size={32} className="mx-auto mb-2" style={{ color: 'var(--color-accent-deep)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Set up your family meetings</p>
          <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            Schedule family council, 1:1 time with each kid, and couple check-ins — or just start adding agenda items whenever something comes up.
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
      )}

      {/* Meeting Cards — agenda-first */}
      <PermissionGate featureKey="meetings_shared">
        <section className="space-y-3">
          {builtInTypes.map(({ type, label }) => {
            if (type === 'mentor' || type === 'parent_child') {
              const children = getChildren()
              if (children.length === 0) {
                return (
                  <MeetingCard
                    key={type}
                    meetingType={type}
                    label={label}
                    agendaItems={getAgendaForMeeting(type)}
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
                const schedule = schedules.find(s => s.meeting_type === type && s.related_member_id === child.id)
                return (
                  <MeetingCard
                    key={`${type}-${child.id}`}
                    meetingType={type}
                    label={`${label}: ${child.display_name}`}
                    agendaItems={getAgendaForMeeting(type, child.id)}
                    schedule={schedule}
                    familyId={familyId!}
                    memberId={memberId!}
                    relatedMemberId={child.id}
                    onOpenSchedule={handleOpenSchedule}
                    onOpenSections={handleOpenSections}
                    onStartMeeting={handleStartMeeting}
                  />
                )
              })
            }
            return (
              <MeetingCard
                key={type}
                meetingType={type}
                label={label}
                agendaItems={getAgendaForMeeting(type)}
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
            <MeetingCard
              key={t.id}
              meetingType="custom"
              label={t.name}
              agendaItems={allAgendaItems.filter(i => i.meeting_type === 'custom' && i.template_id === t.id)}
              familyId={familyId!}
              memberId={memberId!}
              onOpenSchedule={handleOpenSchedule}
              onOpenSections={handleOpenSections}
              onStartMeeting={handleStartMeeting}
            />
          ))}

          <button
            className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg w-full justify-center hover:opacity-80"
            style={{ border: '1px dashed var(--color-border-default)', color: 'var(--color-text-secondary)' }}
            onClick={() => setCustomTemplateOpen(true)}
          >
            <Plus size={16} /> Create Custom Meeting Type
          </button>
        </section>
      </PermissionGate>

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
              View All
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
            existingSchedule={scheduleModal.schedule}
            familyId={familyId}
          />

          <AgendaSectionEditorModal
            isOpen={sectionsModal.open}
            onClose={() => setSectionsModal(s => ({ ...s, open: false }))}
            meetingType={sectionsModal.meetingType}
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
              schedule={startMeetingModal.schedule}
              onMeetingStarted={handleMeetingStarted}
            />
          )}
        </>
      )}

      {activeMeetingView && (
        <MeetingConversationView
          meeting={activeMeetingView}
          onEnd={handleMeetingEnded}
          onClose={() => setActiveMeetingView(null)}
        />
      )}

      {reviewMeeting && (
        <PostMeetingReview
          isOpen={!!reviewMeeting}
          onClose={() => setReviewMeeting(null)}
          meeting={reviewMeeting}
          onSaveComplete={handleReviewComplete}
        />
      )}

      {showHistory && familyId && (
        <MeetingHistoryView
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          familyId={familyId}
          members={members as FamilyMember[]}
        />
      )}

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

/**
 * Compute the next future occurrence for a stale schedule.
 * Steps forward by the recurrence interval until the date is today or later.
 */
function computeNextOccurrence(schedule: MeetingSchedule, today: Date): string | null {
  if (!schedule.next_due_date) return null

  const due = new Date(schedule.next_due_date)
  let candidate = new Date(due.getFullYear(), due.getMonth(), due.getDate())

  const intervalDays = schedule.recurrence_rule === 'weekly' ? 7
    : schedule.recurrence_rule === 'biweekly' ? 14
    : schedule.recurrence_rule === 'monthly' ? 30
    : schedule.recurrence_rule === 'quarterly' ? 90
    : 7

  while (candidate < today) {
    if (schedule.recurrence_rule === 'monthly') {
      candidate.setMonth(candidate.getMonth() + 1)
    } else if (schedule.recurrence_rule === 'quarterly') {
      candidate.setMonth(candidate.getMonth() + 3)
    } else {
      candidate.setDate(candidate.getDate() + intervalDays)
    }
  }

  return candidate.toISOString()
}
