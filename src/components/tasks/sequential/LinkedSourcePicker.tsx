/**
 * LinkedSourcePicker — Build J (PRD-09A/09B Linked Steps addendum Enhancement A)
 *
 * Modal for mom to pick a source when she adds a Linked Content step to a
 * routine. Three source types:
 *   - sequential_collection → any family sequential collection
 *   - randomizer_list → any family randomizer list
 *   - recurring_task → any family recurring task (template-generated)
 *
 * Returns { source_id, source_type, source_name } via onSelect. The routine
 * step editor uses source_name for the display name fallback.
 */

import { useState, useMemo } from 'react'
import { BookOpen, Shuffle, Repeat, Link2 } from 'lucide-react'
import { ModalV2, Button } from '@/components/shared'
import { useSequentialCollections } from '@/hooks/useSequentialCollections'
import { useLists } from '@/hooks/useLists'
import { useTasks } from '@/hooks/useTasks'
import type { LinkedSourceType } from '@/types/tasks'

interface LinkedSourcePickerProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  onSelect: (params: {
    source_id: string
    source_type: LinkedSourceType
    source_name: string
  }) => void
}

export function LinkedSourcePicker({
  isOpen,
  onClose,
  familyId,
  onSelect,
}: LinkedSourcePickerProps) {
  const [sourceType, setSourceType] = useState<LinkedSourceType>('sequential_collection')

  const { data: sequentialCollections = [] } = useSequentialCollections(familyId)
  const { data: allLists = [] } = useLists(familyId)
  const { data: allTasks = [] } = useTasks(familyId)

  const randomizerLists = useMemo(
    () => allLists.filter(l => l.list_type === 'randomizer' && !l.archived_at),
    [allLists],
  )

  const recurringTasks = useMemo(
    () =>
      allTasks.filter(
        t => t.recurrence_rule != null && t.task_type !== 'sequential' && !t.archived_at,
      ),
    [allTasks],
  )

  const SOURCE_TABS: Array<{
    key: LinkedSourceType
    label: string
    Icon: typeof BookOpen
  }> = [
    { key: 'sequential_collection', label: 'Sequential List', Icon: BookOpen },
    { key: 'randomizer_list', label: 'Randomizer', Icon: Shuffle },
    { key: 'recurring_task', label: 'Recurring Task', Icon: Repeat },
  ]

  return (
    <ModalV2
      id="linked-source-picker"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      title="Link to content"
      icon={Link2}
      size="md"
    >
      <div className="flex flex-col gap-4 p-4">
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Pick a source. The routine step will show the currently active item(s) from this source each day.
        </p>

        {/* Source type tabs */}
        <div className="flex gap-2">
          {SOURCE_TABS.map(tab => {
            const selected = sourceType === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSourceType(tab.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: selected
                    ? 'var(--color-btn-primary-bg)'
                    : 'var(--color-bg-secondary)',
                  color: selected
                    ? 'var(--color-btn-primary-text)'
                    : 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <tab.Icon size={12} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Source list */}
        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
          {sourceType === 'sequential_collection' && (
            <>
              {sequentialCollections.length === 0 && (
                <EmptyHint label="No sequential collections yet. Create one in Studio first." />
              )}
              {sequentialCollections.map(col => (
                <SourceRow
                  key={col.id}
                  Icon={BookOpen}
                  name={col.title}
                  subtitle={`${col.total_items ?? 0} items`}
                  onClick={() =>
                    onSelect({
                      source_id: col.id,
                      source_type: 'sequential_collection',
                      source_name: col.title,
                    })
                  }
                />
              ))}
            </>
          )}

          {sourceType === 'randomizer_list' && (
            <>
              {randomizerLists.length === 0 && (
                <EmptyHint label="No randomizer lists yet. Create one from Lists first." />
              )}
              {randomizerLists.map(list => (
                <SourceRow
                  key={list.id}
                  Icon={Shuffle}
                  name={list.title}
                  subtitle={`Draw mode: ${list.draw_mode ?? 'focused'}`}
                  onClick={() =>
                    onSelect({
                      source_id: list.id,
                      source_type: 'randomizer_list',
                      source_name: list.title,
                    })
                  }
                />
              ))}
            </>
          )}

          {sourceType === 'recurring_task' && (
            <>
              {recurringTasks.length === 0 && (
                <EmptyHint label="No recurring tasks yet. Create a recurring task first." />
              )}
              {recurringTasks.map(t => (
                <SourceRow
                  key={t.id}
                  Icon={Repeat}
                  name={t.title}
                  subtitle={`Recurrence: ${t.recurrence_rule ?? 'custom'}`}
                  onClick={() =>
                    onSelect({
                      source_id: t.id,
                      source_type: 'recurring_task',
                      source_name: t.title,
                    })
                  }
                />
              ))}
            </>
          )}
        </div>

        <div className="flex pt-2">
          <Button variant="secondary" size="md" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </ModalV2>
  )
}

function SourceRow({
  Icon,
  name,
  subtitle,
  onClick,
}: {
  Icon: typeof BookOpen
  name: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <Icon size={16} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium truncate"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {name}
        </div>
        <div
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {subtitle}
        </div>
      </div>
    </button>
  )
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div
      className="px-3 py-6 rounded-lg text-xs text-center"
      style={{
        background: 'var(--color-bg-secondary)',
        color: 'var(--color-text-secondary)',
        border: '1px dashed var(--color-border)',
      }}
    >
      {label}
    </div>
  )
}
