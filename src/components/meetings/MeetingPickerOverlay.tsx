// Touch Base picker — multi-select overlay for routing items to conversations.
// Used by NotepadDrawer and SortTab when destination='agenda'.

import { useState } from 'react'
import { X } from 'lucide-react'
import { useAddAgendaItem, useMeetingTemplates } from '@/hooks/useMeetings'
import { useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'
import type { MeetingType } from '@/types/meetings'

interface PickOption {
  key: string
  label: string
  color: string
  meetingType: MeetingType
  relatedMemberId?: string
  templateId?: string
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
  const { data: templates = [] } = useMeetingTemplates(familyId)
  const { data: members = [] } = useFamilyMembers(familyId)
  const addItem = useAddAgendaItem()

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const children = members.filter((m: FamilyMember) => m.role === 'member' && m.is_active)
  const partner = members.find((m: FamilyMember) => m.role === 'additional_adult' && m.is_active)

  const options: PickOption[] = []

  if (partner) {
    options.push({
      key: 'couple',
      label: partner.display_name,
      color: getMemberColor(partner),
      meetingType: 'couple',
    })
  }

  for (const child of children) {
    options.push({
      key: `child-${child.id}`,
      label: child.display_name,
      color: getMemberColor(child),
      meetingType: 'parent_child',
      relatedMemberId: child.id,
    })
  }

  options.push({
    key: 'family_council',
    label: 'The Whole Family',
    color: 'var(--color-accent)',
    meetingType: 'family_council',
  })

  for (const t of templates) {
    options.push({
      key: `custom-${t.id}`,
      label: t.name,
      color: 'var(--color-text-secondary)',
      meetingType: 'custom',
      templateId: t.id,
    })
  }

  const toggleOption = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleConfirm = async () => {
    if (selectedKeys.size === 0) return
    setSaving(true)

    const selected = options.filter(o => selectedKeys.has(o.key))
    for (const opt of selected) {
      await addItem.mutateAsync({
        family_id: familyId,
        meeting_type: opt.meetingType,
        content: content.trim(),
        added_by: memberId,
        template_id: opt.templateId,
        related_member_id: opt.relatedMemberId,
        source: 'notepad_route',
      })
    }

    setSaving(false)
    setSelectedKeys(new Set())
    onComplete()
  }

  const selectedCount = selectedKeys.size

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="rounded-xl shadow-lg w-full max-w-sm mx-4 overflow-hidden"
        style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-default)' }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            Touch Base with...
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-text-tertiary)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {options.map(opt => {
              const isSelected = selectedKeys.has(opt.key)
              return (
                <button
                  key={opt.key}
                  onClick={() => toggleOption(opt.key)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: isSelected ? opt.color : 'transparent',
                    color: isSelected ? '#fff' : opt.color,
                    border: `2px solid ${opt.color}`,
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0 || saving}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'var(--color-accent)', color: 'var(--color-text-on-primary)' }}
          >
            {saving
              ? 'Adding...'
              : selectedCount === 0
                ? 'Select who to touch base with'
                : selectedCount === 1
                  ? 'Add to 1 conversation'
                  : `Add to ${selectedCount} conversations`
            }
          </button>
        </div>
      </div>
    </div>
  )
}
