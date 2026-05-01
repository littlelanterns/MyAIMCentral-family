import { usePendingChangesForSource } from '@/hooks/usePendingChanges'
import type { PendingChangeSourceType } from '@/types/pendingChanges'

interface PendingChangesBadgeProps {
  sourceType: PendingChangeSourceType
  sourceId: string
}

export function PendingChangesBadge({ sourceType, sourceId }: PendingChangesBadgeProps) {
  const { data: changes } = usePendingChangesForSource(sourceType, sourceId)
  const count = changes?.length ?? 0

  if (count === 0) return null

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{
        backgroundColor: 'var(--color-surface-secondary)',
        color: 'var(--color-text-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      {count} pending
    </span>
  )
}
