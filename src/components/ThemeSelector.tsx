import { useState } from 'react'
import { Palette, X, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { themes, vibes } from '@/lib/theme/tokens'
import type { ThemeKey, VibeKey } from '@/lib/theme/tokens'

const THEME_LIST: { key: ThemeKey; name: string; swatch: string }[] = [
  { key: 'classic', name: 'Classic MyAIM', swatch: '#68a395' },
  { key: 'sage_garden', name: 'Sage Garden', swatch: '#4b7c66' },
  { key: 'rose_gold', name: 'Rose Gold', swatch: '#c48b7a' },
  { key: 'ocean_depth', name: 'Ocean Depth', swatch: '#2c5d60' },
  { key: 'golden_hour', name: 'Golden Hour', swatch: '#d6a461' },
  { key: 'lavender_fields', name: 'Lavender Fields', swatch: '#8b7bb5' },
  { key: 'earth_tones', name: 'Earth Tones', swatch: '#8b6f47' },
  { key: 'sunset_coral', name: 'Sunset Coral', swatch: '#d69a84' },
  { key: 'mint_fresh', name: 'Mint Fresh', swatch: '#5aab9a' },
]

const VIBE_LIST: { key: VibeKey; name: string }[] = [
  { key: 'classic', name: 'Classic MyAIM' },
  { key: 'modern', name: 'Clean & Modern' },
  { key: 'nautical', name: 'Nautical' },
  { key: 'cozy', name: 'Cozy Journal' },
]

const COLOR_MODES = [
  { key: 'light' as const, icon: Sun, label: 'Light' },
  { key: 'dark' as const, icon: Moon, label: 'Dark' },
  { key: 'system' as const, icon: Monitor, label: 'System' },
]

export function ThemeSelector() {
  const [open, setOpen] = useState(false)
  const {
    theme, vibe, colorMode, gradientEnabled,
    setTheme, setVibe, setColorMode, setGradientEnabled,
  } = useTheme()

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          color: 'var(--color-text-secondary)',
          boxShadow: 'var(--shadow-sm)',
        }}
        title="Theme & appearance"
      >
        <Palette size={20} />
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-80 max-h-[80vh] overflow-y-auto rounded-lg mt-12 mr-2"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            Appearance
          </span>
          <button onClick={() => setOpen(false)} className="p-1" style={{ color: 'var(--color-text-secondary)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Color Mode */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Mode
            </p>
            <div className="flex gap-2">
              {COLOR_MODES.map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setColorMode(mode.key)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: colorMode === mode.key ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
                    color: colorMode === mode.key ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                  }}
                >
                  <mode.icon size={14} />
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Colors */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Color Theme
            </p>
            <div className="grid grid-cols-3 gap-2">
              {THEME_LIST.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: theme === t.key ? 'var(--color-bg-secondary)' : 'transparent',
                    border: theme === t.key ? '2px solid var(--color-btn-primary-bg)' : '2px solid transparent',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: t.swatch }}
                  />
                  <span className="text-center leading-tight">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vibe selector hidden for Vibeathon — only Classic MyAIM active */}

          {/* Gradient Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Gradient background</span>
            <button
              onClick={() => setGradientEnabled(!gradientEnabled)}
              className="w-10 h-6 rounded-full relative transition-colors"
              style={{
                backgroundColor: gradientEnabled ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
              }}
            >
              <div
                className="w-4 h-4 rounded-full absolute top-1 transition-all"
                style={{
                  left: gradientEnabled ? '22px' : '4px',
                  backgroundColor: '#ffffff',
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
