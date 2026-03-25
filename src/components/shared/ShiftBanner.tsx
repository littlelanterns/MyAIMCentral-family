import { Clock } from 'lucide-react'

export interface ShiftBannerProps {
  caregiverName: string
  endTime?: string
  onEndShift?: () => void
}

export function ShiftBanner({ caregiverName, endTime, onEndShift }: ShiftBannerProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2"
      style={{
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-text-on-primary, #fff)',
      }}
    >
      <div className="flex items-center gap-2">
        <Clock size={16} />
        <span className="text-sm font-medium">
          {caregiverName} is on shift{endTime ? ` until ${endTime}` : ''}
        </span>
      </div>
      {onEndShift && (
        <button
          onClick={onEndShift}
          className="text-xs font-medium px-3 py-1 rounded-full"
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'inherit',
          }}
        >
          End Shift
        </button>
      )}
    </div>
  )
}
