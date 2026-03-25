// PRD-10: Stub for tracker types not yet built (Phase B/C)
// Shows a friendly message with the tracker type info

import { Clock } from 'lucide-react'
import { getTrackerMeta } from '@/types/widgets'

interface PlannedTrackerStubProps {
  trackerType: string
}

export function PlannedTrackerStub({ trackerType }: PlannedTrackerStubProps) {
  const meta = getTrackerMeta(trackerType)

  return (
    <div className="flex flex-col h-full items-center justify-center gap-2 text-center p-2">
      <Clock size={24} style={{ color: 'var(--color-text-tertiary)' }} />
      <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {meta?.label ?? trackerType}
      </div>
      <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        Coming soon
      </div>
    </div>
  )
}
