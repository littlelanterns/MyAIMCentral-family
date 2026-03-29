import { Eye, EyeOff } from 'lucide-react'
import { Tooltip } from './Tooltip'

export interface TransparencyIndicatorProps {
  level: 'usage_visible' | 'fully_private'
  size?: number
}

export function TransparencyIndicator({ level, size = 16 }: TransparencyIndicatorProps) {
  const Icon = level === 'usage_visible' ? Eye : EyeOff
  const label = level === 'usage_visible' ? 'Usage visible to parents' : 'Fully private'

  return (
    <Tooltip content={label}>
    <span
      className="inline-flex items-center gap-1 text-xs"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      <Icon size={size} />
      <span className="sr-only">{label}</span>
    </span>
    </Tooltip>
  )
}
