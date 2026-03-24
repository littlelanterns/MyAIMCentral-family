import { Database } from 'lucide-react'

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
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
      style={{ color: 'var(--color-text-secondary)' }}
      title="Click to manage context settings"
    >
      <Database size={10} />
      <span>{summary}</span>
    </button>
  )
}
