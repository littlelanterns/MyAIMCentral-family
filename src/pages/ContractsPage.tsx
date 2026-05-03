import { useState, useMemo } from 'react'
import { Button, Badge, EmptyState } from '@/components/shared'
import { useContracts, useDeleteContract, useRestoreContract, useArchiveContract } from '@/hooks/useContracts'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'
import { ContractForm } from '@/components/contracts/ContractForm'
import {
  Plus, Trash2, RotateCcw, Archive, Edit2, FileText,
  CheckCircle, List, Target, Activity, Clock, Calendar, Gift, Shuffle,
  DollarSign, Star, Trophy, Wand2, ListPlus, BellOff, Bell, Sparkles, Box, Palette, Eye,
} from 'lucide-react'
import type { Contract, ContractSourceType, GodmotherType, PresentationMode } from '@/types/contracts'

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

function formatIfPattern(c: Contract): string {
  let label = IF_PATTERN_LABELS[c.if_pattern] || c.if_pattern
  if (c.if_n !== null) label = label.replace('{n}', String(c.if_n))
  if (c.if_floor !== null) label = label.replace('{floor}', String(c.if_floor))
  if (c.if_window_kind) label = label.replace('{window}', c.if_window_kind)
  if (c.if_offset > 0) label += ` (skip first ${c.if_offset})`
  return label
}

export default function ContractsPage() {
  const { data: family } = useFamily()
  const { data: currentMember } = useFamilyMember()
  const { data: members } = useFamilyMembers(family?.id)
  const { data: contracts = [], isLoading } = useContracts(family?.id)
  const deleteContract = useDeleteContract()
  const restoreContract = useRestoreContract()
  const archiveContract = useArchiveContract()

  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filterMember, setFilterMember] = useState<string | 'all'>('all')
  const [filterGodmother, setFilterGodmother] = useState<string | 'all'>('all')

  const activeContracts = useMemo(() => {
    let filtered = contracts.filter((c) => c.status === 'active')
    if (filterMember !== 'all') {
      filtered = filtered.filter((c) =>
        filterMember === 'family' ? c.family_member_id === null : c.family_member_id === filterMember,
      )
    }
    if (filterGodmother !== 'all') {
      filtered = filtered.filter((c) => c.godmother_type === filterGodmother)
    }
    return filtered
  }, [contracts, filterMember, filterGodmother])

  const deletedContracts = useMemo(
    () => contracts.filter((c) => c.status === 'recently_deleted'),
    [contracts],
  )

  const grouped = useMemo(() => {
    const groups: Record<string, Contract[]> = { family_default: [] }
    for (const c of activeContracts) {
      const key = c.family_member_id ?? 'family_default'
      if (!groups[key]) groups[key] = []
      groups[key].push(c)
    }
    return groups
  }, [activeContracts])

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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-heading)' }}
          >
            Contracts
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Rules that connect what your family does to what they earn.
          </p>
        </div>
        <Button variant="primary" onClick={() => { setEditingContract(null); setShowForm(true) }} className="flex items-center gap-2">
          <Plus size={16} /> New Contract
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          className="rounded-lg px-3 py-1.5 text-sm border"
          style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-default)' }}
        >
          <option value="all">All Members</option>
          <option value="family">Family Default</option>
          {members?.filter((m) => m.role !== 'primary_parent').map((m) => (
            <option key={m.id} value={m.id}>{m.display_name}</option>
          ))}
        </select>
        <select
          value={filterGodmother}
          onChange={(e) => setFilterGodmother(e.target.value)}
          className="rounded-lg px-3 py-1.5 text-sm border"
          style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-default)' }}
        >
          <option value="all">All Actions</option>
          {Object.entries(GODMOTHER_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>Loading contracts...</div>
      ) : activeContracts.length === 0 && deletedContracts.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No contracts yet"
          description="Contracts are rules that connect what your family does to what they earn. Create your first one to get started."
        />
      ) : (
        <>
          {Object.entries(grouped).map(([memberId, memberContracts]) => {
            const isFamily = memberId === 'family_default'
            return (
              <div key={memberId} className="mb-6">
                <h2 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {isFamily ? 'Family Defaults' : getMemberName(memberId)}
                  <Badge variant="default">{memberContracts.length}</Badge>
                </h2>
                <div className="space-y-2">
                  {memberContracts.map((c) => (
                    <ContractCard
                      key={c.id}
                      contract={c}
                      memberColor={getMemberColorVal(c.family_member_id)}
                      onEdit={() => { setEditingContract(c); setShowForm(true) }}
                      onDelete={() => { if (family?.id) deleteContract.mutate({ id: c.id, familyId: family.id }) }}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {deletedContracts.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Recently Deleted (48h recovery)
              </h2>
              <div className="space-y-2">
                {deletedContracts.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl p-3 opacity-60 flex items-center justify-between border"
                    style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)' }}
                  >
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {SOURCE_TYPE_META[c.source_type]?.icon}
                      <span>{SOURCE_TYPE_META[c.source_type]?.label}</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
                      {GODMOTHER_META[c.godmother_type]?.icon}
                      <span>{GODMOTHER_META[c.godmother_type]?.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { if (family?.id) restoreContract.mutate({ id: c.id, familyId: family.id }) }} title="Restore">
                        <RotateCcw size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (family?.id) archiveContract.mutate({ id: c.id, familyId: family.id }) }} title="Archive now">
                        <Archive size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ContractCard({
  contract: c,
  memberColor,
  onEdit,
  onDelete,
}: {
  contract: Contract
  memberColor: string | undefined
  onEdit: () => void
  onDelete: () => void
}) {
  const srcMeta = SOURCE_TYPE_META[c.source_type]
  const gmMeta = GODMOTHER_META[c.godmother_type]
  const presMeta = PRESENTATION_META[c.presentation_mode]

  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        background: 'var(--color-bg-card)',
        borderColor: 'var(--color-border-default)',
        borderLeftWidth: memberColor ? '4px' : undefined,
        borderLeftColor: memberColor,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm flex-wrap" style={{ color: 'var(--color-text-primary)' }}>
            <span className="flex items-center gap-1">{srcMeta?.icon} {srcMeta?.label}</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
            <span className="flex items-center gap-1">{gmMeta?.icon} {gmMeta?.label}</span>
            {c.payload_amount !== null && <Badge variant="default">${c.payload_amount}</Badge>}
            {c.payload_text && <Badge variant="default">{c.payload_text.length > 30 ? c.payload_text.slice(0, 30) + '...' : c.payload_text}</Badge>}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs flex-wrap" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{formatIfPattern(c)}</span>
            <span>{c.stroke_of === 'immediate' ? 'Immediately' : c.stroke_of.replace(/_/g, ' ')}</span>
            {c.presentation_mode !== 'silent' && <span className="flex items-center gap-1">{presMeta?.icon} {presMeta?.label}</span>}
            {c.inheritance_level !== 'family_default' && (
              <Badge variant="default" className="text-xs">
                {c.inheritance_level === 'kid_override' ? 'Kid override' : 'Deed override'}
                {c.override_mode !== 'replace' && ` (${c.override_mode})`}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit} title="Edit"><Edit2 size={14} /></Button>
          <Button variant="ghost" size="sm" onClick={onDelete} title="Delete"><Trash2 size={14} /></Button>
        </div>
      </div>
    </div>
  )
}
