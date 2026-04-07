/**
 * DrawModeSelector — Build J (PRD-09A/09B Linked Steps addendum Enhancement C)
 *
 * Randomizer-only list configuration:
 *   - focused : one active draw, manual [Draw] button, locks on selection
 *   - buffet  : up to N active draws (configurable), slots open on completion
 *   - surprise: no [Draw] button — auto-draws on routine instance generation
 *               via the linked routine step (uses smart-draw weighting)
 *
 * This control lives in the randomizer detail settings panel next to the
 * PoolModeSelector. Non-randomizer lists don't render it.
 */

import { Shuffle, Target, Layers, Wand2 } from 'lucide-react'
import type { DrawMode } from '@/types/lists'

interface DrawModeSelectorProps {
  drawMode: DrawMode
  maxActiveDraws: number
  onDrawModeChange: (mode: DrawMode) => void
  onMaxActiveDrawsChange: (n: number) => void
}

const MODE_DESCRIPTIONS: Record<DrawMode, { label: string; description: string; Icon: typeof Target }> = {
  focused: {
    label: 'Focused',
    description: 'One active item at a time. Tap Draw, complete it, then draw again.',
    Icon: Target,
  },
  buffet: {
    label: 'Buffet',
    description: 'Multiple active items. Draw up to your limit; slots open as you complete items.',
    Icon: Layers,
  },
  surprise: {
    label: 'Surprise Me',
    description: 'System auto-draws one item when this randomizer is linked from a routine. No manual drawing. Same item all day.',
    Icon: Wand2,
  },
}

export function DrawModeSelector({
  drawMode,
  maxActiveDraws,
  onDrawModeChange,
  onMaxActiveDrawsChange,
}: DrawModeSelectorProps) {
  return (
    <div
      className="rounded-lg p-3 space-y-3"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2">
        <Shuffle size={14} style={{ color: 'var(--color-text-heading)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          Draw Mode
        </span>
      </div>

      <div className="space-y-2">
        {(Object.keys(MODE_DESCRIPTIONS) as DrawMode[]).map(mode => {
          const { label, description, Icon } = MODE_DESCRIPTIONS[mode]
          const selected = drawMode === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onDrawModeChange(mode)}
              className="w-full text-left rounded-lg px-3 py-2 transition-colors"
              style={{
                background: selected
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)'
                  : 'var(--color-bg-card)',
                border: `1px solid ${selected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
              }}
            >
              <div className="flex items-start gap-2">
                <Icon
                  size={14}
                  style={{
                    color: selected ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium"
                    style={{
                      color: selected ? 'var(--color-btn-primary-bg)' : 'var(--color-text-heading)',
                    }}
                  >
                    {label}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {description}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Max active draws — only shown for buffet mode */}
      {drawMode === 'buffet' && (
        <div
          className="pt-2 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <label
            className="text-xs font-medium block mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Max items active at once
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={10}
              value={maxActiveDraws}
              onChange={e => {
                const n = parseInt(e.target.value, 10)
                if (Number.isFinite(n) && n >= 1 && n <= 10) onMaxActiveDrawsChange(n)
              }}
              className="w-16 px-2 py-1 rounded text-sm text-center"
              style={{
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              active slots
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
