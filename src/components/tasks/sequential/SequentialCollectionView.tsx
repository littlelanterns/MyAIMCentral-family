/**
 * PRD-09A Screen 6: Sequential Collection View
 * Shows all sequential collections with progress tracking.
 * Management view (mom): full list, reorder, reassign, deploy.
 * Kid's view: single active task card.
 */

import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Play, UserPlus } from 'lucide-react'
import { useSequentialCollections, useSequentialCollection } from '@/hooks/useSequentialCollections'
import { FeatureGuide } from '@/components/shared/FeatureGuide'
import type { SequentialCollection, Task } from '@/types/tasks'

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

function SequentialCollectionCard({ collection }: { collection: SequentialCollection }) {
  const [expanded, setExpanded] = useState(false)
  const { data: detail } = useSequentialCollection(expanded ? collection.id : undefined)

  const completedCount = detail?.tasks?.filter((t: Task) => t.status === 'completed').length ?? 0
  const totalCount = collection.total_items ?? 0
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: '1px solid var(--color-border)',
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
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-heading)' }}>
            {collection.title}
          </p>
          {collection.life_area_tag && (
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {collection.life_area_tag}
            </span>
          )}
        </div>

        <span
          className="text-sm font-medium px-2 py-0.5 rounded"
          style={{
            background: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
            color: 'var(--color-btn-primary-bg)',
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
              background: 'var(--color-btn-primary-bg)',
            }}
          />
        </div>
      </div>

      {/* Expanded: full item list */}
      {expanded && detail?.tasks && (
        <div
          className="border-t px-4 py-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {detail.tasks
              .sort((a: Task, b: Task) => (a.sequential_position ?? 0) - (b.sequential_position ?? 0))
              .map((task: Task, idx: number) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded"
                  style={{
                    background: task.sequential_is_active
                      ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)'
                      : 'transparent',
                    opacity: task.status === 'completed' ? 0.5 : 1,
                  }}
                >
                  <span className="text-xs w-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    {idx + 1}
                  </span>
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
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: 'var(--color-btn-primary-bg)',
                        color: 'var(--color-btn-primary-text)',
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
              ))}
          </div>

          {/* Actions */}
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
        </div>
      )}
    </div>
  )
}
