// PRD-10: Multiplayer colored bars rendering
// Shows per-member data as side-by-side colored bars
// Used as an overlay on any multiplayer-enabled tracker

import { useMemo } from 'react'
import type { WidgetDataPoint } from '@/types/widgets'

interface MultiplayerBarsProps {
  dataPoints: WidgetDataPoint[]
  participants: { id: string; name: string; color: string }[]
  sharedTarget?: number
  mode: 'collaborative' | 'competitive' | 'both'
  isCompact?: boolean
}

export function MultiplayerBars({ dataPoints, participants, sharedTarget, mode, isCompact }: MultiplayerBarsProps) {
  // Group data by member
  const memberTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const p of participants) totals[p.id] = 0
    for (const dp of dataPoints) {
      const mid = dp.family_member_id
      if (mid in totals) totals[mid] += dp.value
    }
    return totals
  }, [dataPoints, participants])

  const maxValue = Math.max(...Object.values(memberTotals), 1)
  const combinedTotal = Object.values(memberTotals).reduce((a, b) => a + b, 0)
  const barTarget = mode === 'competitive' ? maxValue : (sharedTarget || maxValue)

  return (
    <div className="w-full space-y-2">
      {/* Collaborative: combined progress bar */}
      {(mode === 'collaborative' || mode === 'both') && sharedTarget && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Team Progress</span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
              {combinedTotal} / {sharedTarget}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--color-bg-tertiary)' }}>
            {participants.map(p => {
              const pct = Math.min((memberTotals[p.id] / sharedTarget) * 100, 100 / participants.length * 3)
              return (
                <div
                  key={p.id}
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: p.color }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Individual bars */}
      {(mode === 'competitive' || mode === 'both') && (
        <div className={`space-y-1.5 ${isCompact ? '' : 'mt-2'}`}>
          {participants.map(p => {
            const value = memberTotals[p.id]
            const pct = Math.min((value / barTarget) * 100, 100)
            return (
              <div key={p.id} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: p.color }}
                />
                <span className="text-[10px] w-14 truncate shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                  {p.name}
                </span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-tertiary)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: p.color }}
                  />
                </div>
                <span className="text-[10px] w-8 text-right shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                  {value}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend for collaborative-only */}
      {mode === 'collaborative' && (
        <div className="flex flex-wrap gap-2 mt-1">
          {participants.map(p => (
            <div key={p.id} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>{p.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// View toggle for multiplayer widgets
export function MultiplayerViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: 'family' | 'personal'
  onChange: (mode: 'family' | 'personal') => void
}) {
  return (
    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border-default)' }}>
      {(['family', 'personal'] as const).map(mode => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className="px-3 py-1 text-[10px] font-medium transition-colors"
          style={{
            background: viewMode === mode ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
            color: viewMode === mode ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
          }}
        >
          {mode === 'family' ? 'Family' : 'Just Me'}
        </button>
      ))}
    </div>
  )
}
