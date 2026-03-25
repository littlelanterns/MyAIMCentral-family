/**
 * ColorPicker (PRD-03 Design System)
 *
 * Member color assignment using the full 44-color AIMfM palette
 * plus the 8 brand colors. Colors grouped by hue family.
 * Zero hardcoded colors in styles — all CSS custom properties.
 */

import { useState } from 'react'
import { Check } from 'lucide-react'
import { MEMBER_COLORS, getContrastText } from '@/config/member_colors'
import { brand } from '@/lib/theme/tokens'

export interface ColorPickerProps {
  value?: string
  onChange: (hex: string) => void
  label?: string
}

// Brand colors as selectable options
const BRAND_COLORS = [
  { hex: brand.warmCream, name: 'Warm Cream' },
  { hex: brand.warmEarth, name: 'Warm Earth' },
  { hex: brand.sageTeal, name: 'Sage Teal' },
  { hex: brand.softSage, name: 'Soft Sage' },
  { hex: brand.goldenHoney, name: 'Golden Honey' },
  { hex: brand.dustyRose, name: 'Dusty Rose' },
  { hex: brand.softGold, name: 'Soft Gold' },
  { hex: brand.deepOcean, name: 'Deep Ocean' },
]

// Group member colors by hue
const HUE_ORDER = ['Red', 'Orange', 'Yellow', 'Green', 'Teal', 'Blue', 'Purple', 'Brown', 'Pink']

const groupedColors = HUE_ORDER.map(hue => ({
  hue,
  colors: MEMBER_COLORS.filter(c => c.hue === hue),
}))

export function ColorPicker({ value, onChange, label = 'Member Color' }: ColorPickerProps) {
  const [showAll, setShowAll] = useState(false)

  return (
    <div>
      <p
        className="text-xs font-medium uppercase tracking-wider mb-2"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </p>

      {/* Brand colors row */}
      <div className="mb-3">
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
          Brand
        </p>
        <div className="flex flex-wrap gap-1.5">
          {BRAND_COLORS.map(c => (
            <button
              key={c.hex}
              onClick={() => onChange(c.hex)}
              className="w-7 h-7 rounded-full relative transition-transform hover:scale-110"
              style={{
                backgroundColor: c.hex,
                border: value === c.hex
                  ? `2px solid var(--color-text-heading)`
                  : '2px solid transparent',
              }}
              title={c.name}
            >
              {value === c.hex && (
                <Check
                  size={12}
                  className="absolute inset-0 m-auto"
                  style={{ color: getContrastText(c.hex) }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Palette preview / expanded */}
      <div className="space-y-2">
        {(showAll ? groupedColors : groupedColors.slice(0, 4)).map(group => (
          <div key={group.hue}>
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              {group.hue}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.colors.map(c => (
                <button
                  key={c.hex}
                  onClick={() => onChange(c.hex)}
                  className="w-7 h-7 rounded-full relative transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.hex,
                    border: value === c.hex
                      ? `2px solid var(--color-text-heading)`
                      : '2px solid transparent',
                  }}
                  title={c.name}
                >
                  {value === c.hex && (
                    <Check
                      size={12}
                      className="absolute inset-0 m-auto"
                      style={{ color: getContrastText(c.hex) }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 text-xs font-medium"
          style={{ color: 'var(--color-btn-primary-bg)' }}
        >
          Show all colors
        </button>
      )}
    </div>
  )
}
