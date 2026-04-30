/**
 * PRD-09A Screen 6: Sequential Collection View
 * Shows all sequential collections with progress tracking.
 * Management view (mom): full list, reorder, reassign, deploy.
 * Kid's view: single active task card.
 * Completion flow: Restart for another student or Archive.
 */

import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Play, UserPlus, RotateCcw, Archive, CheckCircle2, Settings2 } from 'lucide-react'
import {
  useSequentialCollections,
  useSequentialCollection,
  useRedeploySequentialCollection,
} from '@/hooks/useSequentialCollections'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { Toggle } from '@/components/shared'
import { FeatureGuide } from '@/components/shared/FeatureGuide'
import type { SequentialCollection, Task, AdvancementMode } from '@/types/tasks'

// ─── Per-Item Advancement Override Editor ────────────────────

function ItemAdvancementEditor({
  task,
  collectionId,
  onClose,
}: {
  task: Task
  collectionId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<AdvancementMode>(task.advancement_mode ?? 'complete')
  const [target, setTarget] = useState(task.practice_target ?? 5)
  const [requireApproval, setRequireApproval] = useState(task.require_mastery_approval ?? false)
  const [requireEvidence, setRequireEvidence] = useState(task.require_mastery_evidence ?? false)
  const [trackDuration, setTrackDuration] = useState(task.track_duration ?? false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('tasks').update({
      advancement_mode: mode,
      practice_target: mode === 'practice_count' ? target : null,
      require_mastery_approval: mode === 'mastery' ? requireApproval : false,
      require_mastery_evidence: mode === 'mastery' ? requireEvidence : false,
      track_duration: trackDuration,
    }).eq('id', task.id)

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['sequential-collection', collectionId] })
      onClose()
    } else {
      console.error('Failed to update item advancement:', error)
    }
    setSaving(false)
  }

  const MODE_OPTIONS: { key: AdvancementMode; label: string; desc: string }[] = [
    { key: 'complete', label: 'Complete once', desc: 'Mark done to advance' },
    { key: 'practice_count', label: 'Practice N times', desc: 'Auto-advance after target' },
    { key: 'mastery', label: 'Mastery', desc: 'Practice + approval to advance' },
  ]

  return (
    <div
      className="mt-2 p-2.5 rounded-lg flex flex-col gap-2"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
        Advancement for this item
      </div>

      {/* Mode selector */}
      <div className="flex gap-1.5">
        {MODE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setMode(opt.key)}
            className="flex-1 text-center py-1.5 px-1 rounded text-[10px] font-medium transition-colors"
            style={{
              background: mode === opt.key ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
              color: mode === opt.key ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
              border: `1px solid ${mode === opt.key ? 'transparent' : 'var(--color-border)'}`,
              minHeight: 'unset',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Practice target */}
      {mode === 'practice_count' && (
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Target:</span>
          <input
            type="number"
            min={1}
            max={100}
            value={target}
            onChange={e => setTarget(parseInt(e.target.value) || 1)}
            className="w-16 px-2 py-1 rounded text-xs text-center"
            style={{
              background: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>completions</span>
        </div>
      )}

      {/* Mastery options */}
      {mode === 'mastery' && (
        <div className="flex flex-col gap-1.5">
          <Toggle checked={requireApproval} onChange={setRequireApproval} label="Require mom approval" />
          <Toggle checked={requireEvidence} onChange={setRequireEvidence} label="Require evidence" />
        </div>
      )}

      {/* Duration tracking */}
      <Toggle checked={trackDuration} onChange={setTrackDuration} label="Track duration" />

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-1.5 rounded text-xs font-medium"
          style={{
            background: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
            minHeight: 'unset',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded text-xs"
          style={{
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            minHeight: 'unset',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Main Exports ────────────────────────────────────────────

interface SequentialCollectionViewProps {
  familyId: string
  onCreateCollection: () => void
}

export function SequentialCollectionView({ familyId, onCreateCollection }: SequentialCollectionViewProps) {
  const { data: collections = [] } = useSequentialCollections(familyId)

  return (
    <div className="flex flex-col gap-4 p-4">
      <FeatureGuide featureKey="tasks_sequential" />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          Sequential Collections
        </h2>
        <button
          onClick={onCreateCollection}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{
            background: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          <Plus size={16} />
          Create
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Play size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            No sequential collections yet
          </p>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Create ordered task lists that drip-feed one item at a time.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {collections.map(collection => (
            <SequentialCollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  )
}

export function SequentialCollectionCard({ collection }: { collection: SequentialCollection }) {
  const [expanded, setExpanded] = useState(false)
  const [showRedeployPicker, setShowRedeployPicker] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const { data: detail } = useSequentialCollection(expanded ? collection.id : undefined)
  const redeploy = useRedeploySequentialCollection()
  const { data: familyMembers = [] } = useFamilyMembers(collection.family_id)

  const completedCount = detail?.tasks?.filter((t: Task) => t.status === 'completed').length ?? 0
  const totalCount = collection.total_items ?? 0
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const isAllComplete = totalCount > 0 && completedCount === totalCount

  const handleRestart = async (newAssigneeId: string, createdBy: string) => {
    await redeploy.mutateAsync({
      collectionId: collection.id,
      newAssigneeId,
      familyId: collection.family_id,
      createdBy,
    })
    setShowRedeployPicker(false)
    // prompt auto-hides when state resets
  }

  const handleArchive = async () => {
    setArchiving(true)
    try {
      await supabase
        .from('sequential_collections')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', collection.id)
      // Soft-archive all tasks in the collection
      await supabase
        .from('tasks')
        .update({ archived_at: new Date().toISOString() })
        .eq('sequential_collection_id', collection.id)
    } finally {
      setArchiving(false)
      // prompt auto-hides when state resets
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: isAllComplete
          ? '1.5px solid var(--color-success, #22c55e)'
          : '1px solid var(--color-border)',
        background: 'var(--color-bg-card)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full px-4 py-3 text-left"
      >
        {expanded ? (
          <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
        ) : (
          <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-heading)' }}>
              {collection.title}
            </p>
            {isAllComplete && (
              <CheckCircle2 size={14} style={{ color: 'var(--color-success, #22c55e)', flexShrink: 0 }} />
            )}
          </div>
          {(collection.life_area_tags?.[0] ?? collection.life_area_tag) && (
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {collection.life_area_tags?.[0] ?? collection.life_area_tag}
            </span>
          )}
        </div>

        <span
          className="text-sm font-medium px-2 py-0.5 rounded"
          style={{
            background: isAllComplete
              ? 'color-mix(in srgb, var(--color-success, #22c55e) 10%, transparent)'
              : 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
            color: isAllComplete
              ? 'var(--color-success, #22c55e)'
              : 'var(--color-btn-primary-bg)',
          }}
        >
          {completedCount}/{totalCount}
        </span>
      </button>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--color-bg-secondary)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: isAllComplete
                ? 'var(--color-success, #22c55e)'
                : 'var(--color-btn-primary-bg)',
            }}
          />
        </div>
      </div>

      {/* Completion prompt — shown when all items are done */}
      {isAllComplete && expanded && (
        <div
          className="mx-4 mb-3 p-3 rounded-lg"
          style={{
            background: 'color-mix(in srgb, var(--color-success, #22c55e) 8%, var(--color-bg-card))',
            border: '1px solid color-mix(in srgb, var(--color-success, #22c55e) 20%, transparent)',
          }}
        >
          {showRedeployPicker ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                Restart for which student?
              </p>
              <div className="flex flex-wrap gap-1.5">
                {familyMembers.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleRestart(m.id, m.id)}
                    disabled={redeploy.isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {m.display_name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowRedeployPicker(false)}
                className="text-xs"
                style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>
                All items complete!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRedeployPicker(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: 'var(--color-btn-primary-bg)',
                    color: 'var(--color-btn-primary-text)',
                  }}
                >
                  <RotateCcw size={12} />
                  Restart for another student
                </button>
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <Archive size={12} />
                  Archive
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Expanded: full item list */}
      {expanded && detail?.tasks && (
        <div
          className="border-t px-4 py-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {detail.tasks
              .sort((a: Task, b: Task) => (a.sequential_position ?? 0) - (b.sequential_position ?? 0))
              .map((task: Task, idx: number) => {
                // Build J: derive the progress subtitle from advancement mode
                const advancementMode = task.advancement_mode ?? 'complete'
                let progressSubtitle: string | null = null
                if (advancementMode === 'practice_count' && task.practice_target != null) {
                  progressSubtitle = `${task.practice_count}/${task.practice_target} practices`
                } else if (advancementMode === 'mastery') {
                  if (task.mastery_status === 'submitted') {
                    progressSubtitle = `Submitted — awaiting approval (${task.practice_count} practices)`
                  } else if (task.mastery_status === 'approved') {
                    progressSubtitle = `Mastered`
                  } else {
                    progressSubtitle = `Practiced ${task.practice_count} ${task.practice_count === 1 ? 'time' : 'times'}`
                  }
                }

                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-2 py-1.5 px-2 rounded group"
                    style={{
                      background: task.sequential_is_active
                        ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)'
                        : 'transparent',
                      opacity: task.status === 'completed' ? 0.5 : 1,
                    }}
                  >
                    <span
                      className="text-xs w-6 text-center shrink-0"
                      style={{ color: 'var(--color-text-secondary)', marginTop: 1 }}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm flex-1 ${task.status === 'completed' ? 'line-through' : ''}`}
                          style={{
                            color: task.sequential_is_active
                              ? 'var(--color-btn-primary-bg)'
                              : 'var(--color-text-primary)',
                          }}
                        >
                          {task.title}
                        </span>
                        {task.sequential_is_active && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                            style={{
                              background: 'var(--color-btn-primary-bg)',
                              color: 'var(--color-btn-primary-text)',
                            }}
                          >
                            Active
                          </span>
                        )}
                        {task.mastery_status === 'submitted' && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                            style={{
                              background: 'color-mix(in srgb, var(--color-warning, #eab308) 20%, transparent)',
                              color: 'var(--color-warning, #eab308)',
                              border: '1px solid var(--color-warning, #eab308)',
                            }}
                          >
                            Submitted
                          </span>
                        )}
                        {task.mastery_status === 'approved' && (
                          <CheckCircle2
                            size={12}
                            style={{ color: 'var(--color-success, #22c55e)', flexShrink: 0 }}
                          />
                        )}
                        {/* Per-item advancement override — settings icon */}
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => setEditingItemId(editingItemId === task.id ? null : task.id)}
                            className="shrink-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'transparent', border: 'none', minHeight: 'unset', cursor: 'pointer' }}
                            title="Edit advancement settings"
                          >
                            <Settings2 size={12} style={{ color: 'var(--color-text-secondary)' }} />
                          </button>
                        )}
                      </div>
                      {progressSubtitle && (
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {progressSubtitle}
                        </div>
                      )}
                      {/* Inline advancement override editor */}
                      {editingItemId === task.id && (
                        <ItemAdvancementEditor
                          task={task}
                          collectionId={detail.collection.id}
                          onClose={() => setEditingItemId(null)}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Actions — hide when collection is complete (completion prompt shows instead) */}
          {!isAllComplete && (
            <div className="flex gap-2 mt-3 pb-1">
              <button
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Edit
              </button>
              <button
                className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <UserPlus size={12} />
                Reassign
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
