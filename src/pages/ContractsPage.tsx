import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button, Badge, Card, EmptyState } from '@/components/shared'
import { useContracts, useDeleteContract, useRestoreContract, useArchiveContract } from '@/hooks/useContracts'
import { useContractSourceNames } from '@/hooks/useContractSourceNames'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'
import { ContractForm } from '@/components/contracts/ContractForm'
import {
  Plus, Trash2, RotateCcw, Archive, Edit2, FileText,
  CheckCircle, List, Target, Activity, Clock, Calendar, Gift, Shuffle,
  DollarSign, Star, Trophy, Wand2, ListPlus, BellOff, Bell, Sparkles, Box, Palette, Eye,
  ChevronDown, ChevronRight, Settings, Users, LayoutGrid, Rows3,
} from 'lucide-react'
import type { Contract, ContractSourceType, GodmotherType, PresentationMode } from '@/types/contracts'

// ─────────────────────────────────────────────────────────────────────────────
// Display metadata

const SOURCE_TYPE_META: Record<ContractSourceType, { icon: React.ReactNode; label: string }> = {
  task_completion: { icon: <CheckCircle size={16} />, label: 'Task Completion' },
  routine_step_completion: { icon: <CheckCircle size={16} />, label: 'Routine Step' },
  list_item_completion: { icon: <List size={16} />, label: 'List Item' },
  intention_iteration: { icon: <Target size={16} />, label: 'Intention Iteration' },
  widget_data_point: { icon: <Activity size={16} />, label: 'Widget Data Point' },
  tracker_widget_event: { icon: <Activity size={16} />, label: 'Tracker Event' },
  time_session_ended: { icon: <Clock size={16} />, label: 'Time Session' },
  scheduled_occurrence_active: { icon: <Calendar size={16} />, label: 'Scheduled Occurrence' },
  opportunity_claimed: { icon: <Gift size={16} />, label: 'Opportunity Claimed' },
  randomizer_drawn: { icon: <Shuffle size={16} />, label: 'Randomizer Drawn' },
  // PRD-24 Point Economy Addendum §5.6 (rider 2, migration 100296)
  daily_points_goal_met: { icon: <Star size={16} />, label: 'Daily Points Goal Met' },
}

const GODMOTHER_META: Record<GodmotherType, { icon: React.ReactNode; label: string }> = {
  allowance_godmother: { icon: <DollarSign size={16} />, label: 'Allowance' },
  numerator_godmother: { icon: <DollarSign size={16} />, label: 'Numerator Boost' },
  money_godmother: { icon: <DollarSign size={16} />, label: 'Grant Money' },
  points_godmother: { icon: <Star size={16} />, label: 'Grant Points' },
  prize_godmother: { icon: <Gift size={16} />, label: 'Prize' },
  victory_godmother: { icon: <Trophy size={16} />, label: 'Victory' },
  family_victory_godmother: { icon: <Trophy size={16} />, label: 'Family Victory' },
  custom_reward_godmother: { icon: <Wand2 size={16} />, label: 'Custom Reward' },
  assign_task_godmother: { icon: <ListPlus size={16} />, label: 'Assign Task' },
  recognition_godmother: { icon: <Eye size={16} />, label: 'Recognition Only' },
  creature_godmother: { icon: <Star size={16} />, label: 'Creature Roll' },
  page_unlock_godmother: { icon: <Gift size={16} />, label: 'Page Unlock' },
  coloring_reveal_godmother: { icon: <Palette size={16} />, label: 'Coloring Advance' },
  widget_data_point_godmother: { icon: <Activity size={16} />, label: 'Widget Data' },
}

const PRESENTATION_META: Record<PresentationMode, { icon: React.ReactNode; label: string }> = {
  silent: { icon: <BellOff size={14} />, label: 'Silent' },
  toast: { icon: <Bell size={14} />, label: 'Toast' },
  reveal_animation: { icon: <Sparkles size={14} />, label: 'Reveal' },
  treasure_box: { icon: <Box size={14} />, label: 'Treasure Box' },
  coloring_advance: { icon: <Palette size={14} />, label: 'Coloring' },
}

const IF_PATTERN_LABELS: Record<string, string> = {
  every_time: 'Every time',
  every_nth: 'Every {n}th time',
  on_threshold_cross: 'When total reaches {n}',
  above_daily_floor: 'More than {floor}/day',
  above_window_floor: 'More than {floor}/{window}',
  within_date_range: 'Within date range',
  streak: 'On streak of {n} days',
  calendar: 'Calendar pattern',
}

const STICKER_BOOK_GODMOTHERS: GodmotherType[] = [
  'creature_godmother',
  'page_unlock_godmother',
  'coloring_reveal_godmother',
]

const ALLOWANCE_GODMOTHERS: GodmotherType[] = [
  'allowance_godmother',
  'numerator_godmother',
]

function formatIfPattern(c: Contract): string {
  let label = IF_PATTERN_LABELS[c.if_pattern] || c.if_pattern
  if (c.if_n !== null) label = label.replace('{n}', String(c.if_n))
  if (c.if_floor !== null) label = label.replace('{floor}', String(c.if_floor))
  if (c.if_window_kind) label = label.replace('{window}', c.if_window_kind)
  if (c.if_offset > 0) label += ` (skip first ${c.if_offset})`
  return label
}

function formatStrokeOf(c: Contract): string {
  return c.stroke_of === 'immediate' ? 'Immediately' : c.stroke_of.replace(/_/g, ' ')
}

// ─────────────────────────────────────────────────────────────────────────────
// Page

type ViewMode = 'by_source' | 'by_person'
type LayoutMode = 'list' | 'grid'

export default function ContractsPage() {
  const { data: family } = useFamily()
  const { data: currentMember } = useFamilyMember()
  const { data: members } = useFamilyMembers(family?.id)
  const { data: contracts = [], isLoading } = useContracts(family?.id)
  const { data: sourceNames } = useContractSourceNames(family?.id, contracts)
  const deleteContract = useDeleteContract()
  const restoreContract = useRestoreContract()
  const archiveContract = useArchiveContract()

  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<ViewMode>('by_source')
  const [layout, setLayout] = useState<LayoutMode>('list')

  const activeContracts = useMemo(
    () => contracts.filter((c) => c.status === 'active'),
    [contracts],
  )

  const deletedContracts = useMemo(
    () => contracts.filter((c) => c.status === 'recently_deleted'),
    [contracts],
  )

  const handleEdit = (c: Contract) => {
    setEditingContract(c)
    setShowForm(true)
  }

  const handleDelete = (c: Contract) => {
    if (family?.id) deleteContract.mutate({ id: c.id, familyId: family.id })
  }

  const getMemberName = (id: string | null) => {
    if (!id) return 'Family Default'
    return members?.find((m) => m.id === id)?.display_name ?? 'Unknown'
  }

  const getMemberColorVal = (id: string | null): string | undefined => {
    if (!id) return undefined
    const member = members?.find((m) => m.id === id)
    if (!member) return undefined
    return getMemberColor(member)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingContract(null)
  }

  if (showForm) {
    return (
      <div className="density-compact p-4 md:p-6 max-w-3xl mx-auto">
        <ContractForm
          contract={editingContract}
          familyId={family?.id ?? ''}
          memberId={currentMember?.id ?? ''}
          members={(members ?? []) as Array<{ id: string; display_name: string; role: string }>}
          onClose={handleFormClose}
        />
      </div>
    )
  }

  return (
    <div className="density-compact p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-heading)' }}
          >
            RewardRules
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Rules that connect what your family does to what they earn.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => { setEditingContract(null); setShowForm(true) }}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> New Scenario
        </Button>
      </div>

      {/* View + layout toggles */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <ViewToggle view={view} onChange={setView} />
        <LayoutToggle layout={layout} onChange={setLayout} />
      </div>

      {isLoading ? (
        <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
          Loading scenarios...
        </div>
      ) : activeContracts.length === 0 && deletedContracts.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No scenarios yet"
          description="Scenarios connect what your family does to what they earn. Create your first one to get started."
        />
      ) : view === 'by_source' ? (
        <BySourceView
          contracts={activeContracts}
          sourceNames={sourceNames}
          getMemberName={getMemberName}
          getMemberColor={getMemberColorVal}
          layout={layout}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <ByPersonView
          contracts={activeContracts}
          members={members ?? []}
          sourceNames={sourceNames}
          getMemberColor={getMemberColorVal}
          layout={layout}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Recently Deleted (always visible at bottom) */}
      {deletedContracts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Recently Deleted (48h recovery)
          </h2>
          <div className="space-y-2">
            {deletedContracts.map((c) => (
              <Card
                key={c.id}
                variant="flat"
                padding="sm"
                className="opacity-60 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {SOURCE_TYPE_META[c.source_type]?.icon}
                  <span>{SOURCE_TYPE_META[c.source_type]?.label}</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
                  {GODMOTHER_META[c.godmother_type]?.icon}
                  <span>{GODMOTHER_META[c.godmother_type]?.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { if (family?.id) restoreContract.mutate({ id: c.id, familyId: family.id }) }}
                    title="Restore"
                  >
                    <RotateCcw size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { if (family?.id) archiveContract.mutate({ id: c.id, familyId: family.id }) }}
                    title="Archive now"
                  >
                    <Archive size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// View toggle (segmented control)

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div
      className="inline-flex rounded-lg p-1 border"
      style={{
        background: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <ToggleButton active={view === 'by_source'} onClick={() => onChange('by_source')} icon={<List size={14} />} label="By Source" />
      <ToggleButton active={view === 'by_person'} onClick={() => onChange('by_person')} icon={<Users size={14} />} label="By Person" />
    </div>
  )
}

function LayoutToggle({ layout, onChange }: { layout: LayoutMode; onChange: (l: LayoutMode) => void }) {
  return (
    <div
      className="inline-flex rounded-lg p-1 border"
      style={{
        background: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
      role="group"
      aria-label="Layout"
    >
      <ToggleButton
        active={layout === 'list'}
        onClick={() => onChange('list')}
        icon={<Rows3 size={14} />}
        label=""
        ariaLabel="List layout"
      />
      <ToggleButton
        active={layout === 'grid'}
        onClick={() => onChange('grid')}
        icon={<LayoutGrid size={14} />}
        label=""
        ariaLabel="Grid layout"
      />
    </div>
  )
}

function ToggleButton({
  active, onClick, icon, label, ariaLabel,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; ariaLabel?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      aria-pressed={active}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors"
      style={{
        background: active ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'transparent',
        color: active ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-primary)',
        fontWeight: active ? 600 : 400,
      }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// By Source view

interface SourceGroup {
  key: string
  title: string
  subtitle: string
  contracts: Contract[]
  isAutoManaged: boolean
  autoManagedSettingsLink?: string
  autoManagedHint?: string
  /** When set, this group is backed by a list — show "Open list" CTA */
  listSourceId?: string
}

function BySourceView({
  contracts, sourceNames, getMemberName, getMemberColor, layout, onEdit, onDelete,
}: {
  contracts: Contract[]
  sourceNames: Map<string, { source_id: string; title: string; kind: string }> | undefined
  getMemberName: (id: string | null) => string
  getMemberColor: (id: string | null) => string | undefined
  layout: LayoutMode
  onEdit: (c: Contract) => void
  onDelete: (c: Contract) => void
}) {
  const groups = useMemo<SourceGroup[]>(() => {
    const byKey = new Map<string, Contract[]>()

    for (const c of contracts) {
      let key: string

      if (STICKER_BOOK_GODMOTHERS.includes(c.godmother_type)) {
        key = '__sticker_book__'
      } else if (ALLOWANCE_GODMOTHERS.includes(c.godmother_type)) {
        key = '__allowance__'
      } else if (c.source_id) {
        key = `source:${c.source_id}`
      } else {
        key = `nosource:${c.source_type}:${c.godmother_type}`
      }

      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key)!.push(c)
    }

    const result: SourceGroup[] = []

    for (const [key, list] of byKey.entries()) {
      if (key === '__sticker_book__') {
        const memberCount = new Set(list.map((c) => c.family_member_id).filter(Boolean)).size
        result.push({
          key,
          title: 'Sticker Book Rewards',
          subtitle: `Auto-managed · Active for ${memberCount} ${memberCount === 1 ? 'kid' : 'kids'}`,
          contracts: list,
          isAutoManaged: true,
          autoManagedSettingsLink: '/settings/gamification',
          autoManagedHint: 'Edit per-kid sticker book settings to change creature rolls, page unlocks, and coloring reveals.',
        })
        continue
      }

      if (key === '__allowance__') {
        const memberCount = new Set(list.map((c) => c.family_member_id).filter(Boolean)).size
        result.push({
          key,
          title: 'Family Allowance',
          subtitle: memberCount > 0
            ? `Auto-managed · Active for ${memberCount} ${memberCount === 1 ? 'kid' : 'kids'}`
            : 'Auto-managed · Family-wide',
          contracts: list,
          isAutoManaged: true,
          autoManagedSettingsLink: '/settings/allowance',
          autoManagedHint: 'Edit allowance amounts, periods, and pools in Allowance Settings.',
        })
        continue
      }

      if (key.startsWith('source:')) {
        const sourceId = key.slice('source:'.length)
        const name = sourceNames?.get(sourceId)
        const amounts = list
          .map((c) => c.payload_amount)
          .filter((a): a is number => a !== null)
        const amountSummary = summarizeAmounts(amounts)
        const subtitle = [
          `${list.length} ${list.length === 1 ? 'scenario' : 'scenarios'}`,
          amountSummary,
        ].filter(Boolean).join(' · ')

        result.push({
          key,
          title: name?.title ?? 'Source removed',
          subtitle,
          contracts: list,
          isAutoManaged: false,
          listSourceId: name?.kind === 'list' ? sourceId : undefined,
        })
        continue
      }

      // Generic / no-source contracts
      const first = list[0]
      const srcLabel = SOURCE_TYPE_META[first.source_type]?.label ?? first.source_type
      const gmLabel = GODMOTHER_META[first.godmother_type]?.label ?? first.godmother_type
      result.push({
        key,
        title: `${srcLabel} → ${gmLabel}`,
        subtitle: `${list.length} ${list.length === 1 ? 'scenario' : 'scenarios'} · Custom`,
        contracts: list,
        isAutoManaged: false,
      })
    }

    // Sort: intentional first (alphabetical), then auto-managed
    result.sort((a, b) => {
      if (a.isAutoManaged !== b.isAutoManaged) return a.isAutoManaged ? 1 : -1
      return a.title.localeCompare(b.title)
    })

    return result
  }, [contracts, sourceNames])

  const intentional = groups.filter((g) => !g.isAutoManaged)
  const autoManaged = groups.filter((g) => g.isAutoManaged)

  const containerClass = layout === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 gap-2'
    : 'space-y-2'

  return (
    <div className="space-y-6">
      {intentional.length > 0 && (
        <div>
          <SectionHeader
            title="Things you set up"
            count={intentional.reduce((sum, g) => sum + g.contracts.length, 0)}
          />
          <div className={containerClass}>
            {intentional.map((group) => (
              <SourceGroupCard
                key={group.key}
                group={group}
                getMemberName={getMemberName}
                getMemberColor={getMemberColor}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {autoManaged.length > 0 && (
        <div>
          <SectionHeader title="Auto-managed" count={autoManaged.reduce((sum, g) => sum + g.contracts.length, 0)} />
          <div className={containerClass}>
            {autoManaged.map((group) => (
              <SourceGroupCard
                key={group.key}
                group={group}
                getMemberName={getMemberName}
                getMemberColor={getMemberColor}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <h2
      className="text-sm font-medium mb-2 flex items-center gap-2"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {title}
      <Badge variant="default">{count}</Badge>
    </h2>
  )
}

function summarizeAmounts(amounts: number[]): string {
  if (amounts.length === 0) return ''
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  if (min === max) return `$${min}`
  return `$${min}–$${max}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Source group card (collapsible)

function SourceGroupCard({
  group, getMemberName, getMemberColor, onEdit, onDelete,
}: {
  group: SourceGroup
  getMemberName: (id: string | null) => string
  getMemberColor: (id: string | null) => string | undefined
  onEdit: (c: Contract) => void
  onDelete: (c: Contract) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
        opacity: group.isAutoManaged ? 0.85 : 1,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left transition-colors"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{group.title}</span>
            {group.isAutoManaged && (
              <Badge variant="default" className="text-xs">Auto</Badge>
            )}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {group.subtitle}
          </div>
        </div>
      </button>

      {expanded && (
        <div
          className="border-t px-3 pb-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {group.isAutoManaged && group.autoManagedHint && (
            <div
              className="mt-3 mb-2 p-2.5 rounded-lg text-xs flex items-start gap-2"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Settings size={14} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{group.autoManagedHint}</p>
                {group.autoManagedSettingsLink && (
                  <Link
                    to={group.autoManagedSettingsLink}
                    className="inline-block mt-1 underline"
                    style={{ color: 'var(--color-btn-primary-bg)' }}
                  >
                    Open settings →
                  </Link>
                )}
              </div>
            </div>
          )}

          {group.listSourceId ? (
            <ListBackedGroupBody
              listId={group.listSourceId}
              contracts={group.contracts}
              getMemberName={getMemberName}
              getMemberColor={getMemberColor}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ) : (
            <div className="space-y-1.5 mt-2">
              {group.contracts.map((c) => (
                <ContractRow
                  key={c.id}
                  contract={c}
                  memberName={getMemberName(c.family_member_id)}
                  memberColor={getMemberColor(c.family_member_id)}
                  onEdit={() => onEdit(c)}
                  onDelete={() => onDelete(c)}
                  showMember
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Body for groups backed by a list source — shows mom-friendly "Open list"
// CTAs and tucks the per-item contract rules behind an Advanced disclosure.
function ListBackedGroupBody({
  listId,
  contracts,
  getMemberName,
  getMemberColor,
  onEdit,
  onDelete,
}: {
  listId: string
  contracts: Contract[]
  getMemberName: (id: string | null) => string
  getMemberColor: (id: string | null) => string | undefined
  onEdit: (c: Contract) => void
  onDelete: (c: Contract) => void
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        This list controls when these rewards fire. Edit the list to add, remove, or adjust items, amounts, and timing.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          to={`/lists?list=${listId}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-text-on-primary, #fff)',
          }}
        >
          <List size={14} />
          Open list to edit items
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="text-xs underline"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {showAdvanced ? 'Hide' : 'Show'} advanced — per-item reward rules ({contracts.length})
      </button>

      {showAdvanced && (
        <div className="space-y-1.5">
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            One rule per item. These were created automatically when you set up the list — most moms won&apos;t need to edit them here.
          </p>
          {contracts.map((c) => (
            <ContractRow
              key={c.id}
              contract={c}
              memberName={getMemberName(c.family_member_id)}
              memberColor={getMemberColor(c.family_member_id)}
              onEdit={() => onEdit(c)}
              onDelete={() => onDelete(c)}
              showMember
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// By Person view

function ByPersonView({
  contracts, members, sourceNames, getMemberColor, layout, onEdit, onDelete,
}: {
  contracts: Contract[]
  members: Array<{ id: string; display_name: string; role: string }>
  sourceNames: Map<string, { source_id: string; title: string; kind: string }> | undefined
  getMemberColor: (id: string | null) => string | undefined
  layout: LayoutMode
  onEdit: (c: Contract) => void
  onDelete: (c: Contract) => void
}) {
  const familyDefaults = contracts.filter((c) => c.family_member_id === null)
  const perMember = useMemo(() => {
    const byMember = new Map<string, Contract[]>()
    for (const c of contracts) {
      if (!c.family_member_id) continue
      if (!byMember.has(c.family_member_id)) byMember.set(c.family_member_id, [])
      byMember.get(c.family_member_id)!.push(c)
    }
    return byMember
  }, [contracts])

  // Members that either have overrides OR are non-primary-parent (potential override targets)
  const visibleMembers = members.filter(
    (m) => m.role !== 'primary_parent' && (perMember.has(m.id) || true),
  )

  const containerClass = layout === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 gap-2'
    : 'space-y-2'

  return (
    <div className="space-y-6">
      {familyDefaults.length > 0 && (
        <div>
          <SectionHeader title="Family Defaults" count={familyDefaults.length} />
          <PersonGroupCard
            title="Applies to everyone (unless overridden)"
            subtitle={`${familyDefaults.length} ${familyDefaults.length === 1 ? 'scenario' : 'scenarios'}`}
            contracts={familyDefaults}
            sourceNames={sourceNames}
            color={undefined}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}

      {visibleMembers.length > 0 && (
        <div>
          <SectionHeader
            title="Per-Person Overrides"
            count={Array.from(perMember.values()).reduce((sum, l) => sum + l.length, 0)}
          />
          <div className={containerClass}>
            {visibleMembers.map((m) => {
              const memberContracts = perMember.get(m.id) ?? []
              if (memberContracts.length === 0) return null
              return (
                <PersonGroupCard
                  key={m.id}
                  title={m.display_name}
                  subtitle={`${memberContracts.length} ${memberContracts.length === 1 ? 'override' : 'overrides'}`}
                  contracts={memberContracts}
                  sourceNames={sourceNames}
                  color={getMemberColor(m.id)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PersonGroupCard({
  title, subtitle, contracts, sourceNames, color, onEdit, onDelete,
}: {
  title: string
  subtitle: string
  contracts: Contract[]
  sourceNames: Map<string, { source_id: string; title: string; kind: string }> | undefined
  color: string | undefined
  onEdit: (c: Contract) => void
  onDelete: (c: Contract) => void
}) {
  const [expanded, setExpanded] = useState(false)

  // Split into intentional vs auto-managed within this person card
  const auto = contracts.filter(
    (c) =>
      STICKER_BOOK_GODMOTHERS.includes(c.godmother_type) ||
      ALLOWANCE_GODMOTHERS.includes(c.godmother_type),
  )
  const intentional = contracts.filter((c) => !auto.includes(c))

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
        borderLeftWidth: color ? '4px' : undefined,
        borderLeftColor: color,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left transition-colors"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{title}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {subtitle}
          </div>
        </div>
      </button>

      {expanded && (
        <div
          className="border-t px-3 pb-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {intentional.length > 0 && (
            <>
              <div className="mt-3 mb-1.5 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Custom scenarios
              </div>
              <div className="space-y-1.5">
                {intentional.map((c) => (
                  <ContractRow
                    key={c.id}
                    contract={c}
                    sourceLabel={sourceNames?.get(c.source_id ?? '')?.title}
                    onEdit={() => onEdit(c)}
                    onDelete={() => onDelete(c)}
                  />
                ))}
              </div>
            </>
          )}

          {auto.length > 0 && (
            <>
              <div className="mt-3 mb-1.5 text-xs font-medium flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                <Settings size={12} /> Auto-managed
              </div>
              <div className="space-y-1.5 opacity-80">
                {auto.map((c) => (
                  <ContractRow
                    key={c.id}
                    contract={c}
                    onEdit={() => onEdit(c)}
                    onDelete={() => onDelete(c)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract row (the leaf inside a card)

function ContractRow({
  contract: c, memberName, memberColor, sourceLabel, onEdit, onDelete, showMember,
}: {
  contract: Contract
  memberName?: string
  memberColor?: string
  sourceLabel?: string
  onEdit: () => void
  onDelete: () => void
  showMember?: boolean
}) {
  const srcMeta = SOURCE_TYPE_META[c.source_type]
  const gmMeta = GODMOTHER_META[c.godmother_type]
  const presMeta = PRESENTATION_META[c.presentation_mode]

  return (
    <Card variant="flat" padding="sm" className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm flex-wrap" style={{ color: 'var(--color-text-primary)' }}>
          <span className="flex items-center gap-1">{srcMeta?.icon} {srcMeta?.label}</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
          <span className="flex items-center gap-1">{gmMeta?.icon} {gmMeta?.label}</span>
          {c.payload_amount !== null && <Badge variant="default">${c.payload_amount}</Badge>}
          {c.payload_text && (
            <Badge variant="default">
              {c.payload_text.length > 30 ? c.payload_text.slice(0, 30) + '...' : c.payload_text}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs flex-wrap" style={{ color: 'var(--color-text-secondary)' }}>
          <span>{formatIfPattern(c)}</span>
          <span>{formatStrokeOf(c)}</span>
          {c.presentation_mode !== 'silent' && (
            <span className="flex items-center gap-1">{presMeta?.icon} {presMeta?.label}</span>
          )}
          {showMember && memberName && memberName !== 'Family Default' && (
            <span
              className="flex items-center gap-1"
              style={memberColor ? { color: memberColor, fontWeight: 500 } : undefined}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: memberColor ?? 'var(--color-text-secondary)' }}
              />
              {memberName}
            </span>
          )}
          {sourceLabel && (
            <span className="italic">from {sourceLabel}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <Button variant="ghost" size="sm" onClick={onEdit} title="Edit"><Edit2 size={14} /></Button>
        <Button variant="ghost" size="sm" onClick={onDelete} title="Delete"><Trash2 size={14} /></Button>
      </div>
    </Card>
  )
}
