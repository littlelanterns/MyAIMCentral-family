import { Eye, EyeOff } from 'lucide-react'
import { Tooltip } from './Tooltip'

export interface VisibilityToggleProps {
  visible: boolean
  onChange: (visible: boolean) => void
  label?: string
  size?: number
}

export function VisibilityToggle({ visible, onChange, label, size = 18 }: VisibilityToggleProps) {
  const Icon = visible ? Eye : EyeOff

  return (
    <Tooltip content={label ?? (visible ? 'Hide' : 'Show')}>
    <button
      onClick={() => onChange(!visible)}
      className="p-1.5 rounded-lg transition-colors"
      style={{
        color: visible ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
        backgroundColor: 'transparent',
      }}
      aria-label={label ?? (visible ? 'Hide' : 'Show')}
    >
      <Icon size={size} />
    </button>
    </Tooltip>
  )
}
