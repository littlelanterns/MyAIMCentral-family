/**
 * CustomTemplateCreatorModal — PRD-16 Phase B (Screen 7)
 *
 * Creates a custom meeting template with name, participant type,
 * default partner/participants, and starting sections.
 */

import { useState } from 'react'
import { User, Users, UsersRound, Copy } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import { useCreateMeetingTemplate, useMeetingTemplateSections, useSeedDefaultSections } from '@/hooks/useMeetings'
import { useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { MeetingType, TemplateParticipantType, MeetingTemplateSection } from '@/types/meetings'
import { MEETING_TYPE_LABELS, BUILT_IN_AGENDAS } from '@/types/meetings'

interface CustomTemplateCreatorModalProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
}

type SectionSource = 'blank' | 'copy_from'

const PARTICIPANT_TYPE_OPTIONS: Array<{ value: TemplateParticipantType; label: string; description: string; icon: typeof User }> = [
  { value: 'personal', label: 'Personal', description: 'Just you — journal-style review or planning session', icon: User },
  { value: 'two_person', label: 'Two People', description: 'You and one other person — date night, mentoring, 1-on-1', icon: Users },
  { value: 'group', label: 'Group', description: 'Multiple family members — family council, planning meeting', icon: UsersRound },
]

export function CustomTemplateCreatorModal({
  isOpen,
  onClose,
  familyId,
}: CustomTemplateCreatorModalProps) {
  const { data: member } = useFamilyMember()
  const { data: members = [] } = useFamilyMembers(familyId)
  const createTemplate = useCreateMeetingTemplate()
  const seedSections = useSeedDefaultSections()

  const [name, setName] = useState('')
  const [participantType, setParticipantType] = useState<TemplateParticipantType>('two_person')
  const [defaultPartnerId, setDefaultPartnerId] = useState<string | null>(null)
  const [defaultParticipantIds, setDefaultParticipantIds] = useState<string[]>([])
  const [sectionSource, setSectionSource] = useState<SectionSource>('blank')
  const [copyFromType, setCopyFromType] = useState<MeetingType>('couple')
  const [saving, setSaving] = useState(false)

  // Filter members for partner selection (adults only, not self)
  const adultMembers = members.filter((m: FamilyMember) =>
    m.id !== member?.id && (m.role === 'primary_parent' || m.role === 'additional_adult')
  )

  // All non-self members for group selection
  const allOtherMembers = members.filter((m: FamilyMember) => m.id !== member?.id)

  const copySourceOptions: Array<{ value: MeetingType; label: string }> = Object.entries(BUILT_IN_AGENDAS)
    .filter(([, sections]) => sections && sections.length > 0)
    .map(([type, sections]) => ({
      value: type as MeetingType,
      label: `${MEETING_TYPE_LABELS[type as MeetingType]} (${sections!.length} sections)`,
    }))

  // Load sections from the selected copy-from type (for preview)
  const { data: copyFromSections = [] } = useMeetingTemplateSections(
    sectionSource === 'copy_from' ? familyId : undefined,
    sectionSource === 'copy_from' ? copyFromType : undefined,
  )

  const handleToggleParticipant = (memberId: string) => {
    setDefaultParticipantIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleSave = async () => {
    if (!name.trim() || !member?.id) return
    setSaving(true)

    try {
      await createTemplate.mutateAsync({
        family_id: familyId,
        name: name.trim(),
        participant_type: participantType,
        default_partner_id: participantType === 'two_person' ? defaultPartnerId : null,
        default_participant_ids: participantType === 'group' ? defaultParticipantIds : null,
        created_by: member.id,
      })

      // Seed starting sections
      if (sectionSource === 'copy_from') {
        // Copy sections from the built-in type's DB rows if they exist,
        // otherwise fall back to the BUILT_IN_AGENDAS constant
        const sectionsToSeed = copyFromSections.length > 0
          ? copyFromSections.map((s: MeetingTemplateSection, i: number) => ({
              section_name: s.section_name,
              prompt_text: s.prompt_text ?? '',
              sort_order: i,
            }))
          : (BUILT_IN_AGENDAS[copyFromType] ?? []).map((s, i) => ({
              section_name: s.section_name,
              prompt_text: s.prompt_text,
              sort_order: i,
            }))

        if (sectionsToSeed.length > 0) {
          await seedSections.mutateAsync({
            family_id: familyId,
            meeting_type: 'custom',
            sections: sectionsToSeed,
          })
        }
      }

      // Reset form
      setName('')
      setParticipantType('two_person')
      setDefaultPartnerId(null)
      setDefaultParticipantIds([])
      setSectionSource('blank')
      onClose()
    } catch (err) {
      console.error('Failed to create custom template:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalV2
      id="custom-template-creator"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title="Create Custom Meeting Type"
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
            disabled={!name.trim() || saving}
            className="btn-primary px-4 py-2 rounded-lg text-sm"
          >
            {saving ? 'Creating...' : 'Create Meeting Type'}
          </button>
        </div>
      }
    >
      <div className="space-y-5 p-1">
        {/* Name */}
        <div>
          <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--color-text-primary)' }}>
            Meeting Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Monthly Business Review, Date Night Check-in"
            className="w-full text-sm px-3 py-2 rounded-lg"
            style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
            autoFocus
          />
        </div>

        {/* Participant Type */}
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
            Who participates?
          </label>
          <div className="space-y-2">
            {PARTICIPANT_TYPE_OPTIONS.map(opt => {
              const Icon = opt.icon
              const selected = participantType === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setParticipantType(opt.value)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                  style={{
                    background: selected ? 'var(--color-surface-tertiary)' : 'var(--color-surface-secondary)',
                    border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
                  }}
                >
                  <Icon size={18} style={{ color: selected ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{opt.label}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{opt.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Default Partner (two_person only) */}
        {participantType === 'two_person' && adultMembers.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
              Default Partner (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {adultMembers.map((m: FamilyMember) => {
                const selected = defaultPartnerId === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setDefaultPartnerId(selected ? null : m.id)}
                    className="px-3 py-1.5 text-sm rounded-full transition-colors"
                    style={{
                      background: selected ? 'var(--color-accent)' : 'var(--color-surface-secondary)',
                      color: selected ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
                      border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
                    }}
                  >
                    {m.display_name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Default Participants (group only) */}
        {participantType === 'group' && allOtherMembers.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
              Default Participants (optional)
            </label>
            <MemberPillSelector
              members={allOtherMembers}
              selectedIds={defaultParticipantIds}
              onToggle={handleToggleParticipant}
              showSortToggle={false}
            />
          </div>
        )}

        {/* Starting Sections */}
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
            Starting Agenda Sections
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setSectionSource('blank')}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left"
              style={{
                background: sectionSource === 'blank' ? 'var(--color-surface-tertiary)' : 'var(--color-surface-secondary)',
                border: `1px solid ${sectionSource === 'blank' ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
              }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Start Blank</p>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Add your own sections after creating</p>
              </div>
            </button>
            <button
              onClick={() => setSectionSource('copy_from')}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left"
              style={{
                background: sectionSource === 'copy_from' ? 'var(--color-surface-tertiary)' : 'var(--color-surface-secondary)',
                border: `1px solid ${sectionSource === 'copy_from' ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
              }}
            >
              <Copy size={16} style={{ color: sectionSource === 'copy_from' ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Copy from Existing</p>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Start with sections from a built-in meeting type</p>
              </div>
            </button>
          </div>

          {sectionSource === 'copy_from' && (
            <div className="mt-3">
              <select
                value={copyFromType}
                onChange={e => setCopyFromType(e.target.value as MeetingType)}
                className="w-full text-sm px-3 py-2 rounded-lg"
                style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
              >
                {copySourceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {/* Preview sections from source */}
              <div className="mt-2 pl-2">
                {(copyFromSections.length > 0
                  ? copyFromSections.map((s: MeetingTemplateSection) => s.section_name)
                  : (BUILT_IN_AGENDAS[copyFromType] ?? []).map(s => s.section_name)
                ).map((name: string, i: number) => (
                  <p key={i} className="text-xs py-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                    {i + 1}. {name}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalV2>
  )
}
