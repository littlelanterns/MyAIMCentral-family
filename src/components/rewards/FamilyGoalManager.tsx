/**
 * FamilyGoalManager — FAMILY-GOALS-PRIZES Build Item 3
 *
 * Mom-only management surface for family_goals. Reachable from two doors
 * (FD-6): Prize Board → Prizes tab, and Hub Settings → "Family Goals &
 * Prizes" group. Same component, same modal, both call sites just pass
 * isOpen/onClose/familyId.
 *
 * List view: Active / Completed / Archived groups, create/edit/archive,
 * duplicate-from-completed (Key Decision #16). Create/edit form covers every
 * field named in the spec: title, description, prize (name/image/details),
 * participants, earning mode, target, sources (family intentions + tasks),
 * optional end date, progress-visible toggle, is_included_in_ai Heart toggle.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  Calendar,
  Copy,
  Gift,
  Heart,
  HeartOff,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { FeatureGuide } from '@/components/shared'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import { RewardImagePicker } from '@/components/rewards/RewardImagePicker'
import { PlatformAssetImage } from '@/components/shared/PlatformAssetImage'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamilyBestIntentions } from '@/hooks/useFamilyBestIntentions'
import {
  useFamilyGoals,
  useFamilyGoalSources,
  useFamilyGoalCandidateTasks,
  useCreateFamilyGoal,
  useUpdateFamilyGoal,
  useArchiveFamilyGoal,
  useDuplicateFamilyGoal,
} from '@/hooks/useFamilyGoals'
import type { FamilyGoal, FamilyGoalEarningMode, FamilyGoalSourceKind } from '@/types/family-goals'

interface FamilyGoalManagerProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
}

type ManagerView = 'list' | 'form'

export function FamilyGoalManager({ isOpen, onClose, familyId }: FamilyGoalManagerProps) {
  const { data: me } = useFamilyMember()
  const { data: members = [] } = useFamilyMembers(familyId)
  const { data: goals = [] } = useFamilyGoals(familyId)

  const [view, setView] = useState<ManagerView>('list')
  const [editingGoal, setEditingGoal] = useState<FamilyGoal | null>(null)

  const archiveMutation = useArchiveFamilyGoal()
  const duplicateMutation = useDuplicateFamilyGoal()

  const active = goals.filter((g) => g.status === 'active' && !g.archived_at)
  const completed = goals.filter((g) => g.status === 'completed' && !g.archived_at)
  const archived = goals.filter((g) => !!g.archived_at)

  const openCreate = () => {
    setEditingGoal(null)
    setView('form')
  }
  const openEdit = (goal: FamilyGoal) => {
    setEditingGoal(goal)
    setView('form')
  }
  const backToList = () => {
    setView('list')
    setEditingGoal(null)
  }

  const handleDuplicate = async (goal: FamilyGoal) => {
    if (!me) return
    const created = await duplicateMutation.mutateAsync({
      goalId: goal.id,
      familyId,
      createdBy: me.id,
    })
    setEditingGoal(created)
    setView('form')
  }

  return (
    <ModalV2
      id="family-goal-manager"
      isOpen={isOpen}
      onClose={() => {
        onClose()
        backToList()
      }}
      type="transient"
      size="lg"
      title="Family Goals & Prizes"
      subtitle={view === 'form' ? (editingGoal ? 'Edit family goal' : 'New family goal') : undefined}
    >
      <div className="p-4">
        {view === 'list' ? (
          <FamilyGoalList
            active={active}
            completed={completed}
            archived={archived}
            members={members}
            onCreate={openCreate}
            onEdit={openEdit}
            onArchive={(g) => archiveMutation.mutate({ id: g.id, familyId })}
            onDuplicate={handleDuplicate}
          />
        ) : (
          <FamilyGoalForm
            familyId={familyId}
            createdBy={me?.id}
            members={members}
            goal={editingGoal}
            onDone={backToList}
            onCancel={backToList}
          />
        )}
      </div>
    </ModalV2>
  )
}

// ─── List view ───────────────────────────────────────────────────────────

function FamilyGoalList({
  active,
  completed,
  archived,
  members,
  onCreate,
  onEdit,
  onArchive,
  onDuplicate,
}: {
  active: FamilyGoal[]
  completed: FamilyGoal[]
  archived: FamilyGoal[]
  members: { id: string; display_name: string }[]
  onCreate: () => void
  onEdit: (g: FamilyGoal) => void
  onArchive: (g: FamilyGoal) => void
  onDuplicate: (g: FamilyGoal) => void
}) {
  const nothingYet = active.length === 0 && completed.length === 0 && archived.length === 0

  return (
    <div className="space-y-5" data-testid="family-goal-list">
      <FeatureGuide featureKey="family_goals" />

      <button
        type="button"
        data-testid="family-goal-new-button"
        onClick={onCreate}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
        style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
      >
        <Plus size={16} />
        New Family Goal
      </button>

      {nothingYet && (
        <div
          className="rounded-lg p-6 text-center"
          style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
        >
          <Sparkles size={28} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Family Goals let your whole family work toward a prize together.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Create your first one!
          </p>
        </div>
      )}

      {active.length > 0 && (
        <GoalGroup title="Active" goals={active} members={members} onEdit={onEdit} onArchive={onArchive} showEdit />
      )}
      {completed.length > 0 && (
        <GoalGroup
          title="Completed"
          goals={completed}
          members={members}
          onArchive={onArchive}
          onDuplicate={onDuplicate}
        />
      )}
      {archived.length > 0 && (
        <GoalGroup title="Archived" goals={archived} members={members} onDuplicate={onDuplicate} />
      )}
    </div>
  )
}

function GoalGroup({
  title,
  goals,
  members,
  onEdit,
  onArchive,
  onDuplicate,
  showEdit,
}: {
  title: string
  goals: FamilyGoal[]
  members: { id: string; display_name: string }[]
  onEdit?: (g: FamilyGoal) => void
  onArchive?: (g: FamilyGoal) => void
  onDuplicate?: (g: FamilyGoal) => void
  showEdit?: boolean
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
        {title}
      </p>
      <div className="space-y-2">
        {goals.map((goal) => (
          <GoalManagerRow
            key={goal.id}
            goal={goal}
            members={members}
            onEdit={showEdit ? onEdit : undefined}
            onArchive={!goal.archived_at ? onArchive : undefined}
            onDuplicate={goal.status === 'completed' || goal.archived_at ? onDuplicate : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function GoalManagerRow({
  goal,
  members,
  onEdit,
  onArchive,
  onDuplicate,
}: {
  goal: FamilyGoal
  members: { id: string; display_name: string }[]
  onEdit?: (g: FamilyGoal) => void
  onArchive?: (g: FamilyGoal) => void
  onDuplicate?: (g: FamilyGoal) => void
}) {
  const participantNames = goal.participating_member_ids
    .map((id) => members.find((m) => m.id === id)?.display_name)
    .filter(Boolean)
    .join(', ')

  return (
    <div
      data-testid={`family-goal-row-${goal.id}`}
      className="flex items-start gap-3 p-3 rounded-lg"
      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
    >
      <GoalThumb goal={goal} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
          {goal.title}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
          {goal.prize_name} · {participantNames || 'No participants'}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {goal.earning_mode === 'shared_counter'
            ? `${goal.current_progress} / ${goal.target_count} together`
            : `Each person to ${goal.target_count}`}
          {goal.status !== 'active' && ` · ${goal.status}`}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onEdit && (
          <button
            type="button"
            aria-label="Edit family goal"
            onClick={() => onEdit(goal)}
            className="p-1.5 rounded"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent' }}
          >
            <Pencil size={14} />
          </button>
        )}
        {onDuplicate && (
          <button
            type="button"
            aria-label="Duplicate family goal"
            onClick={() => onDuplicate(goal)}
            className="p-1.5 rounded"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent' }}
          >
            <Copy size={14} />
          </button>
        )}
        {onArchive && (
          <button
            type="button"
            aria-label="Archive family goal"
            onClick={() => onArchive(goal)}
            className="p-1.5 rounded"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent' }}
          >
            <Archive size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

function GoalThumb({ goal }: { goal: FamilyGoal }) {
  if (goal.prize_image_url) {
    return <img src={goal.prize_image_url} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
  }
  if (goal.prize_asset_key) {
    return (
      <PlatformAssetImage
        assetKey={goal.prize_asset_key}
        size={36}
        assetSize={128}
        variant="B"
        fallback={<ThumbFallback />}
      />
    )
  }
  return <ThumbFallback />
}

function ThumbFallback() {
  return (
    <div
      className="w-9 h-9 rounded flex items-center justify-center shrink-0"
      style={{ backgroundColor: 'var(--color-bg-card)' }}
    >
      <Trophy size={16} className="opacity-50" />
    </div>
  )
}

// ─── Create/Edit form ────────────────────────────────────────────────────

function FamilyGoalForm({
  familyId,
  createdBy,
  members,
  goal,
  onDone,
  onCancel,
}: {
  familyId: string
  createdBy: string | undefined
  members: { id: string; display_name: string; role: string; calendar_color?: string | null; assigned_color?: string | null; member_color?: string | null }[]
  goal: FamilyGoal | null
  onDone: () => void
  onCancel: () => void
}) {
  const isEdit = !!goal
  const { data: existingSources = [] } = useFamilyGoalSources(goal?.id)
  const { data: intentions = [] } = useFamilyBestIntentions(familyId)

  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [participantIds, setParticipantIds] = useState<string[]>(
    goal?.participating_member_ids ?? members.filter((m) => m.role === 'member').map((m) => m.id),
  )
  const [earningMode, setEarningMode] = useState<FamilyGoalEarningMode>(goal?.earning_mode ?? 'shared_counter')
  const [targetCount, setTargetCount] = useState<number>(goal?.target_count ?? 50)
  const [endsAt, setEndsAt] = useState<string>(goal?.ends_at ?? '')
  const [prizeName, setPrizeName] = useState(goal?.prize_name ?? '')
  const [prizeText, setPrizeText] = useState(goal?.prize_text ?? '')
  const [prizeImage, setPrizeImage] = useState<{ imageUrl: string | null; imageAssetKey: string | null }>({
    imageUrl: goal?.prize_image_url ?? null,
    imageAssetKey: goal?.prize_asset_key ?? null,
  })
  const [progressVisible, setProgressVisible] = useState(goal?.progress_visible ?? true)
  const [includedInAi, setIncludedInAi] = useState(goal?.is_included_in_ai ?? true)

  const [selectedIntentionIds, setSelectedIntentionIds] = useState<string[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  // Sources load asynchronously (separate query) — hydrate the checkbox
  // selection once they arrive for an edit. Runs once per goal id.
  useEffect(() => {
    if (!isEdit) return
    setSelectedIntentionIds(existingSources.filter((s) => s.source_kind === 'family_intention').map((s) => s.source_id))
    setSelectedTaskIds(existingSources.filter((s) => s.source_kind === 'task').map((s) => s.source_id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal?.id, existingSources.length])

  const { data: candidateTasks = [] } = useFamilyGoalCandidateTasks(familyId, participantIds)

  const createMutation = useCreateFamilyGoal()
  const updateMutation = useUpdateFamilyGoal()
  const saving = createMutation.isPending || updateMutation.isPending

  const participantCandidates = useMemo(() => members.filter((m) => m.role !== 'special_adult'), [members])

  const canSave = title.trim().length > 0 && prizeName.trim().length > 0 && participantIds.length > 0 && targetCount > 0

  const handleSave = async () => {
    if (!canSave || !createdBy) return

    const sources = [
      ...selectedIntentionIds.map((id) => ({ sourceKind: 'family_intention' as FamilyGoalSourceKind, sourceId: id })),
      ...selectedTaskIds.map((id) => ({ sourceKind: 'task' as FamilyGoalSourceKind, sourceId: id })),
    ]

    if (isEdit && goal) {
      await updateMutation.mutateAsync({
        id: goal.id,
        familyId,
        title: title.trim(),
        description: description.trim() || null,
        participatingMemberIds: participantIds,
        earningMode,
        targetCount,
        endsAt: endsAt || null,
        prizeName: prizeName.trim(),
        prizeText: prizeText.trim() || null,
        prizeImageUrl: prizeImage.imageUrl,
        prizeAssetKey: prizeImage.imageAssetKey,
        progressVisible,
        isIncludedInAi: includedInAi,
        sources,
      })
    } else {
      await createMutation.mutateAsync({
        familyId,
        createdBy,
        title: title.trim(),
        description: description.trim() || undefined,
        participatingMemberIds: participantIds,
        earningMode,
        targetCount,
        endsAt: endsAt || null,
        prizeName: prizeName.trim(),
        prizeText: prizeText.trim() || undefined,
        prizeImageUrl: prizeImage.imageUrl,
        prizeAssetKey: prizeImage.imageAssetKey,
        progressVisible,
        isIncludedInAi: includedInAi,
        sources,
      })
    }

    onDone()
  }

  return (
    <div className="space-y-5" data-testid="family-goal-form">
      <button
        type="button"
        onClick={onCancel}
        className="text-xs font-medium flex items-center gap-1"
        style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none' }}
      >
        <X size={14} /> Back to list
      </button>

      {isEdit && (
        <p
          className="text-xs rounded-lg p-2.5"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
        >
          Changing the target or participants applies from now on — progress already counted stays counted.
        </p>
      )}

      {/* Title */}
      <FormField label="Title">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Family Movie Night"
          className="w-full text-sm rounded-lg px-3 py-2"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
          data-testid="family-goal-title-input"
        />
      </FormField>

      {/* Description */}
      <FormField label="Description (optional)">
        <textarea
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full text-sm rounded-lg px-3 py-2 resize-none"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
        />
      </FormField>

      {/* Prize */}
      <FormField label="Prize" icon={<Gift size={14} />}>
        <div className="space-y-2">
          <input
            type="text"
            value={prizeName}
            onChange={(e) => setPrizeName(e.target.value)}
            placeholder="Prize name (e.g., Family Movie Night)"
            className="w-full text-sm rounded-lg px-3 py-2"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
            data-testid="family-goal-prize-name-input"
          />
          <textarea
            value={prizeText ?? ''}
            onChange={(e) => setPrizeText(e.target.value)}
            placeholder="Details (optional) — popcorn, pick the movie, stay up late..."
            rows={2}
            className="w-full text-sm rounded-lg px-3 py-2 resize-none"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
          />
          <RewardImagePicker
            value={prizeImage}
            onChange={setPrizeImage}
            familyId={familyId}
            suggestText={prizeName}
            label="Prize picture (optional)"
          />
        </div>
      </FormField>

      {/* Participants */}
      <FormField label="Who's working toward this?" icon={<Users size={14} />}>
        <MemberPillSelector
          members={participantCandidates}
          selectedIds={participantIds}
          onToggle={(id) =>
            setParticipantIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
          }
          showEveryone
          onToggleAll={() =>
            setParticipantIds((prev) =>
              prev.length === participantCandidates.length ? [] : participantCandidates.map((m) => m.id),
            )
          }
        />
      </FormField>

      {/* Earning mode */}
      <FormField label="How does the family earn it?" icon={<Sparkles size={14} />}>
        <div className="inline-flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border-default)' }}>
          <button
            type="button"
            data-testid="family-goal-mode-shared"
            onClick={() => setEarningMode('shared_counter')}
            className="px-3 py-1.5 text-xs font-medium transition-colors"
            style={
              earningMode === 'shared_counter'
                ? { backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }
                : { backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-secondary)' }
            }
          >
            All together
          </button>
          <button
            type="button"
            data-testid="family-goal-mode-each"
            onClick={() => setEarningMode('each_member')}
            className="px-3 py-1.5 text-xs font-medium transition-colors"
            style={
              earningMode === 'each_member'
                ? { backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }
                : { backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-secondary)' }
            }
          >
            Everyone does their part
          </button>
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}>
          {earningMode === 'shared_counter'
            ? 'One shared counter — anyone’s contribution counts toward the family total.'
            : 'Each participant must hit the target on their own before the goal is complete.'}
        </p>
      </FormField>

      {/* Target */}
      <FormField label={earningMode === 'shared_counter' ? 'Family total' : 'Target per person'} icon={<Target size={14} />}>
        <input
          type="number"
          min={1}
          value={targetCount}
          onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-28 text-sm rounded-lg px-3 py-2"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
          data-testid="family-goal-target-input"
        />
      </FormField>

      {/* What counts */}
      <FormField label="What counts">
        <div className="space-y-3">
          {intentions.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Family Best Intentions
              </p>
              <div className="space-y-1">
                {intentions.map((i) => (
                  <label key={i.id} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={selectedIntentionIds.includes(i.id)}
                      onChange={() =>
                        setSelectedIntentionIds((prev) =>
                          prev.includes(i.id) ? prev.filter((x) => x !== i.id) : [...prev, i.id],
                        )
                      }
                      className="rounded"
                    />
                    {i.title}
                  </label>
                ))}
              </div>
            </div>
          )}

          {participantIds.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Tasks
              </p>
              {candidateTasks.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  No active tasks assigned to the selected participants yet.
                </p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {candidateTasks.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(t.id)}
                        onChange={() =>
                          setSelectedTaskIds((prev) =>
                            prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id],
                          )
                        }
                        className="rounded"
                      />
                      {t.title}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </FormField>

      {/* Optional end date */}
      <FormField label="Optional end date" icon={<Calendar size={14} />}>
        <input
          type="date"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          className="text-sm rounded-lg px-3 py-2"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
        />
      </FormField>

      {/* Progress visible + Heart toggle */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
          <input
            type="checkbox"
            checked={progressVisible}
            onChange={(e) => setProgressVisible(e.target.checked)}
            className="rounded"
          />
          Show progress to kids
        </label>

        <button
          type="button"
          aria-label={includedInAi ? 'Remove from LiLa context' : 'Include in LiLa context'}
          onClick={() => setIncludedInAi(!includedInAi)}
          className="flex items-center gap-1 text-xs"
          style={{ color: includedInAi ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)', background: 'none', border: 'none' }}
        >
          {includedInAi ? <Heart size={16} fill="currentColor" /> : <HeartOff size={16} />}
          LiLa context
        </button>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          data-testid="family-goal-save-button"
          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create Family Goal'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function FormField({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}
