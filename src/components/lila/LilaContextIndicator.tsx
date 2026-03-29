import { Database } from 'lucide-react'
import { Tooltip } from '@/components/shared'

/**
 * Context Indicator — PRD-05
 * Shows "Using X insights across Y people" in the drawer input area.
 * Tappable to open context settings.
 */

interface LilaContextIndicatorProps {
  summary: string
  onClick?: () => void
}

export function LilaContextIndicator({ summary, onClick }: LilaContextIndicatorProps) {
  return (
    <Tooltip content="Click to manage context settings">
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      <Database size={10} />
      <span>{summary}</span>
    </button>
    </Tooltip>
  )
}
