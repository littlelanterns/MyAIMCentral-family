// PRD-28 Sub-phase B: Homework & Subjects Settings (Screen 3)
// Family-wide subject list, time allocation mode, school year dates, per-child overrides
// User-facing label: "Homework & Subjects" — internal table names unchanged

import { useState } from 'react'
import { ArrowLeft, Plus, GripVertical, Archive, BookOpen, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useHomeschoolSubjects,
  useCreateSubject,
  useUpdateSubject,
  useArchiveSubject,
  useHomeschoolFamilyConfig,
  useUpsertHomeschoolConfig,
} from '@/hooks/useHomeschool'
import { useFamilyMember, useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'
import { SUGGESTED_SUBJECTS, TIME_ALLOCATION_MODE_LABELS } from '@/types/homeschool'
import type { HomeschoolSubject, TimeAllocationMode } from '@/types/homeschool'

export function HomeworkSettingsPage() {
  const navigate = useNavigate()
  const { data: currentMember } = useFamilyMember()
  const familyId = currentMember?.family_id
  const { data: subjects, isLoading: loadingSubjects } = useHomeschoolSubjects(familyId)
  const { data: familyConfig } = useHomeschoolFamilyConfig(familyId)
  const { data: familyMembers } = useFamilyMembers(familyId)
  const createSubject = useCreateSubject()
  const updateSubject = useUpdateSubject()
  const archiveSubject = useArchiveSubject()
  const upsertConfig = useUpsertHomeschoolConfig()

  const [newSubjectName, setNewSubjectName] = useState('')
  const [addingSubject, setAddingSubject] = useState(false)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [expandedChild, setExpandedChild] = useState<string | null>(null)
  const [showSchoolYear, setShowSchoolYear] = useState(false)

  const children = familyMembers?.filter((m: FamilyMember) =>
    m.role === 'member' && m.is_active && m.dashboard_mode && ['guided', 'play', 'independent'].includes(m.dashboard_mode)
  ) ?? []

  // Pre-populate suggested defaults on first visit
  const showSuggested = !loadingSubjects && subjects && subjects.length === 0

  const handleAddSuggested = async () => {
    if (!familyId) return
    for (let i = 0; i < SUGGESTED_SUBJECTS.length; i++) {
      const s = SUGGESTED_SUBJECTS[i]
      await createSubject.mutateAsync({
        family_id: familyId,
        name: s.name,
        icon_key: s.icon_key,
        default_weekly_hours: null, // No targets by default
      })
    }
  }

  const handleAddSubject = async () => {
    if (!familyId || !newSubjectName.trim()) return
    await createSubject.mutateAsync({
      family_id: familyId,
      name: newSubjectName.trim(),
    })
    setNewSubjectName('')
    setAddingSubject(false)
  }

  const handleArchive = async (subject: HomeschoolSubject) => {
    if (!familyId) return
    await archiveSubject.mutateAsync({ id: subject.id, familyId })
  }

  const handleAllocationModeChange = async (mode: TimeAllocationMode) => {
    if (!familyId) return
    await upsertConfig.mutateAsync({
      family_id: familyId,
      family_member_id: null,
      time_allocation_mode: mode,
    })
  }

  const handleSchoolYearSave = async (start: string | null, end: string | null) => {
    if (!familyId) return
    await upsertConfig.mutateAsync({
      family_id: familyId,
      family_member_id: null,
      school_year_start: start,
      school_year_end: end,
    })
  }

  return (
    <div className="density-comfortable max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/settings')}
          className="p-1.5 rounded-lg hidden md:flex"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Homework & Subjects
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Configure subjects and time tracking for your family
          </p>
        </div>
      </div>

      {/* School Year Configuration — family-level */}
      <section className="mb-6">
        <button
          className="flex items-center gap-2 w-full text-left"
          onClick={() => setShowSchoolYear(!showSchoolYear)}
        >
          {showSchoolYear ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Calendar size={16} style={{ color: 'var(--color-accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            School Year
          </span>
          {familyConfig?.school_year_start && (
            <span className="text-xs ml-auto" style={{ color: 'var(--color-text-tertiary)' }}>
              {familyConfig.school_year_start} — {familyConfig.school_year_end ?? '...'}
            </span>
          )}
        </button>
        {showSchoolYear && (
          <SchoolYearEditor
            startDate={familyConfig?.school_year_start ?? null}
            endDate={familyConfig?.school_year_end ?? null}
            onSave={handleSchoolYearSave}
          />
        )}
      </section>

      {/* Subject List */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Subjects
          </h2>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
            onClick={() => setAddingSubject(true)}
          >
            <Plus size={12} /> Add Subject
          </button>
        </div>

        {/* Suggested defaults on first visit */}
        {showSuggested && (
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Start with common subjects? You can rename, reorder, or archive any of these later.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SUGGESTED_SUBJECTS.map(s => (
                <span
                  key={s.name}
                  className="px-2 py-1 rounded-md text-xs"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
                >
                  {s.name}
                </span>
              ))}
            </div>
            <button
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
              onClick={handleAddSuggested}
              disabled={createSubject.isPending}
            >
              {createSubject.isPending ? 'Adding...' : 'Add These Subjects'}
            </button>
          </div>
        )}

        {/* Subject rows */}
        <div className="flex flex-col gap-1">
          {subjects?.map(subject => (
            <SubjectRow
              key={subject.id}
              subject={subject}
              familyId={familyId!}
              isEditing={editingSubjectId === subject.id}
              onStartEdit={() => setEditingSubjectId(subject.id)}
              onStopEdit={() => setEditingSubjectId(null)}
              onUpdate={updateSubject.mutateAsync}
              onArchive={() => handleArchive(subject)}
            />
          ))}
        </div>

        {/* Add subject inline */}
        {addingSubject && (
          <div className="flex items-center gap-2 mt-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <input
              type="text"
              className="flex-1 px-3 py-1.5 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
              placeholder="Subject name..."
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddSubject() }}
              autoFocus
            />
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
              onClick={handleAddSubject}
              disabled={!newSubjectName.trim()}
            >
              Add
            </button>
            <button
              className="px-2 py-1.5 rounded-lg text-xs"
              style={{ color: 'var(--color-text-tertiary)' }}
              onClick={() => { setAddingSubject(false); setNewSubjectName('') }}
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* Time Allocation Mode — family-wide default */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Time Allocation Mode
        </h2>
        <div className="flex flex-col gap-2">
          {(Object.keys(TIME_ALLOCATION_MODE_LABELS) as TimeAllocationMode[]).map(mode => {
            const meta = TIME_ALLOCATION_MODE_LABELS[mode]
            const isActive = (familyConfig?.time_allocation_mode ?? 'full') === mode
            return (
              <button
                key={mode}
                className="flex items-start gap-3 p-3 rounded-lg text-left transition-all"
                style={{
                  backgroundColor: isActive ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                  color: isActive ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
                  border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
                }}
                onClick={() => handleAllocationModeChange(mode)}
              >
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${isActive ? 'border-current' : ''}`}
                  style={{ borderColor: isActive ? 'currentColor' : 'var(--color-text-tertiary)' }}
                >
                  {isActive && <div className="w-2 h-2 rounded-full m-0.5" style={{ backgroundColor: 'currentColor' }} />}
                </div>
                <div>
                  <div className="text-sm font-medium">{meta.label}</div>
                  <div className={`text-xs mt-0.5 ${isActive ? 'opacity-80' : ''}`} style={!isActive ? { color: 'var(--color-text-secondary)' } : undefined}>
                    {meta.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Per-child overrides */}
      {children.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Per-Child Settings
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {children.map((child: FamilyMember) => {
              const color = getMemberColor(child)
              const isExpanded = expandedChild === child.id
              return (
                <button
                  key={child.id}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    backgroundColor: isExpanded ? color : 'transparent',
                    color: isExpanded ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
                    border: `2px solid ${color}`,
                  }}
                  onClick={() => setExpandedChild(isExpanded ? null : child.id)}
                >
                  {child.display_name}
                </button>
              )
            })}
          </div>
          {expandedChild && (
            <ChildOverridePanel
              childId={expandedChild}
              familyId={familyId!}
              familyConfig={familyConfig}
            />
          )}
        </section>
      )}
    </div>
  )
}

// ── Subject Row ─────────────────────────────────────────────────

function SubjectRow({ subject, familyId, isEditing, onStartEdit, onStopEdit, onUpdate, onArchive }: {
  subject: HomeschoolSubject
  familyId: string
  isEditing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
  onUpdate: (input: { id: string; familyId: string; updates: Partial<Pick<HomeschoolSubject, 'name' | 'default_weekly_hours'>> }) => Promise<void>
  onArchive: () => void
}) {
  const [editName, setEditName] = useState(subject.name)
  const [editHours, setEditHours] = useState(subject.default_weekly_hours?.toString() ?? '')

  const handleSave = async () => {
    const updates: Partial<Pick<HomeschoolSubject, 'name' | 'default_weekly_hours'>> = {}
    if (editName.trim() && editName.trim() !== subject.name) updates.name = editName.trim()
    const parsedHours = editHours.trim() ? parseFloat(editHours) : null
    if (parsedHours !== subject.default_weekly_hours) updates.default_weekly_hours = parsedHours
    if (Object.keys(updates).length > 0) {
      await onUpdate({ id: subject.id, familyId, updates })
    }
    onStopEdit()
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <GripVertical size={14} style={{ color: 'var(--color-text-tertiary)' }} />
        <input
          type="text"
          className="flex-1 px-2 py-1 rounded text-sm"
          style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          autoFocus
        />
        <input
          type="number"
          step="0.25"
          min="0"
          className="w-20 px-2 py-1 rounded text-sm text-right"
          style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
          placeholder="hrs/wk"
          value={editHours}
          onChange={e => setEditHours(e.target.value)}
        />
        <button className="text-xs px-2 py-1 rounded" style={{ color: 'var(--color-accent)' }} onClick={handleSave}>
          Save
        </button>
        <button className="text-xs px-2 py-1 rounded" style={{ color: 'var(--color-text-tertiary)' }} onClick={onStopEdit}>
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg group cursor-pointer hover:bg-opacity-50"
      style={{ backgroundColor: 'transparent' }}
      onClick={onStartEdit}
    >
      <GripVertical size={14} style={{ color: 'var(--color-text-tertiary)' }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      <BookOpen size={14} style={{ color: 'var(--color-accent)' }} />
      <span className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
        {subject.name}
      </span>
      {subject.default_weekly_hours != null && (
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          {subject.default_weekly_hours}h/wk target
        </span>
      )}
      <button
        className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--color-text-tertiary)' }}
        onClick={e => { e.stopPropagation(); onArchive() }}
        title="Archive subject (preserves historical data)"
      >
        <Archive size={14} />
      </button>
    </div>
  )
}

// ── School Year Editor ──────────────────────────────────────────

function SchoolYearEditor({ startDate, endDate, onSave }: {
  startDate: string | null
  endDate: string | null
  onSave: (start: string | null, end: string | null) => Promise<void>
}) {
  const [start, setStart] = useState(startDate ?? '')
  const [end, setEnd] = useState(endDate ?? '')

  return (
    <div className="mt-3 p-3 rounded-lg flex flex-col gap-3" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Set your school year boundaries. Summary views will respect these dates. Leave blank for year-round tracking.
      </p>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Start</label>
          <input
            type="date"
            className="w-full mt-1 px-2 py-1.5 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
            value={start}
            onChange={e => setStart(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>End</label>
          <input
            type="date"
            className="w-full mt-1 px-2 py-1.5 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
            value={end}
            onChange={e => setEnd(e.target.value)}
          />
        </div>
      </div>
      <button
        className="self-end px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
        onClick={() => onSave(start || null, end || null)}
      >
        Save
      </button>
    </div>
  )
}

// ── Per-Child Override Panel ─────────────────────────────────────

function ChildOverridePanel({ childId, familyId, familyConfig }: {
  childId: string
  familyId: string
  familyConfig: { time_allocation_mode?: string; school_year_start?: string | null; school_year_end?: string | null } | null | undefined
}) {
  const { data: familyMembers } = useFamilyMembers(familyId)
  const child = familyMembers?.find((m: FamilyMember) => m.id === childId)

  const familyMode = (familyConfig?.time_allocation_mode ?? 'full') as TimeAllocationMode
  const familyStart = familyConfig?.school_year_start ?? null
  const familyEnd = familyConfig?.school_year_end ?? null

  if (!child) return null

  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
        {child.display_name}
      </h3>
      <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
        Inherits family defaults. Override only where this child differs.
      </p>
      <div className="flex flex-col gap-3">
        <div>
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Allocation mode: <strong>{TIME_ALLOCATION_MODE_LABELS[familyMode].label}</strong> (inherited)
          </span>
        </div>
        {(familyStart || familyEnd) && (
          <div>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              School year: {familyStart ?? '...'} — {familyEnd ?? '...'} (inherited)
            </span>
          </div>
        )}
        <p className="text-xs italic" style={{ color: 'var(--color-text-tertiary)' }}>
          Per-child overrides unlock when you need a different schedule for this child.
        </p>
      </div>
    </div>
  )
}
