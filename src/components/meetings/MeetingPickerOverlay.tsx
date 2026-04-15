// PRD-16 Phase D: MeetingPickerOverlay
// Reusable overlay for picking a meeting type when routing to "Agenda".
// Used by NotepadDrawer to create meeting_agenda_items directly
// instead of depositing to studio_queue.

import { UsersRound, Heart, Users, GraduationCap, MessageSquare, X } from 'lucide-react'
import { useMeetingSchedules, useAddAgendaItem, useMeetingTemplates } from '@/hooks/useMeetings'
import { useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import type { MeetingType } from '@/types/meetings'
import { MEETING_TYPE_LABELS } from '@/types/meetings'

const TYPE_ICONS: Record<MeetingType, typeof Heart> = {
  couple: Heart,
  parent_child: Users,
  mentor: GraduationCap,
  family_council: UsersRound,
  custom: MessageSquare,
}

interface MeetingPickerOverlayProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  content: string
  onComplete: () => void
}

export function MeetingPickerOverlay({
  isOpen,
  onClose,
  familyId,
  memberId,
  content,
  onComplete,
}: MeetingPickerOverlayProps) {
  const { data: schedules = [] } = useMeetingSchedules(familyId)
  const { data: templates = [] } = useMeetingTemplates(familyId)
  const { data: members = [] } = useFamilyMembers(familyId)
  const addItem = useAddAgendaItem()

  if (!isOpen) return null

  const children = members.filter((m: FamilyMember) => m.role === 'member')

  const handlePick = (meetingType: MeetingType, relatedMemberId?: string, templateId?: string) => {
    addItem.mutate({
      family_id: familyId,
      meeting_type: meetingType,
      content: content.trim(),
      added_by: memberId,
      template_id: templateId,
      related_member_id: relatedMemberId,
      source: 'notepad_route',
    }, {
      onSuccess: () => onComplete(),
    })
  }

  // Build options: built-in types, expanding per-child for mentor/parent_child
  const builtInTypes: MeetingType[] = ['couple', 'parent_child', 'mentor', 'family_council']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="rounded-xl shadow-lg w-full max-w-sm mx-4 overflow-hidden"
        style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-default)' }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            Add to which meeting?
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-text-tertiary)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="px-3 py-2 max-h-80 overflow-y-auto space-y-1">
          {builtInTypes.map(type => {
            const Icon = TYPE_ICONS[type]
            const schedule = schedules.find(s => s.meeting_type === type && !s.related_member_id)

            // Expand per-child for mentor/parent_child
            if ((type === 'mentor' || type === 'parent_child') && children.length > 0) {
              return children.map((child: FamilyMember) => {
                const childSchedule = schedules.find(s => s.meeting_type === type && s.related_member_id === child.id)
                return (
                  <PickerRow
                    key={`${type}-${child.id}`}
                    icon={Icon}
                    label={`${MEETING_TYPE_LABELS[type]}: ${child.display_name}`}
                    nextDate={childSchedule?.next_due_date ?? null}
                    onClick={() => handlePick(type, child.id)}
                    loading={addItem.isPending}
                  />
                )
              })
            }

            return (
              <PickerRow
                key={type}
                icon={Icon}
                label={MEETING_TYPE_LABELS[type]}
                nextDate={schedule?.next_due_date ?? null}
                onClick={() => handlePick(type)}
                loading={addItem.isPending}
              />
            )
          })}

          {/* Custom templates */}
          {templates.map(t => (
            <PickerRow
              key={t.id}
              icon={MessageSquare}
              label={t.name}
              nextDate={schedules.find(s => s.template_id === t.id)?.next_due_date ?? null}
              onClick={() => handlePick('custom', undefined, t.id)}
              loading={addItem.isPending}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function PickerRow({
  icon: Icon,
  label,
  nextDate,
  onClick,
  loading,
}: {
  icon: typeof Heart
  label: string
  nextDate: string | null
  onClick: () => void
  loading: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
      style={{ color: 'var(--color-text-primary)' }}
    >
      <Icon size={16} style={{ color: 'var(--color-accent)' }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {nextDate && (
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Next: {new Date(nextDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </button>
  )
}
