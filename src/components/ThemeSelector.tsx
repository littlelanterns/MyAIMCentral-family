import { useState, useMemo } from 'react'
import { Palette, X, Sun, Moon, Monitor, ChevronDown, ChevronUp, Type } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { themes } from '@/lib/theme/tokens'
import type { ThemeKey, VibeKey } from '@/lib/theme/tokens'

interface ThemeCategory {
  name: string
  short: string
  themes: { key: ThemeKey; name: string }[]
}

const THEME_CATEGORIES: ThemeCategory[] = [
  {
    name: 'Original', short: 'Original',
    themes: [
      { key: 'classic', name: 'Classic MyAIM' },
      { key: 'sage_garden', name: 'Sage Garden' },
      { key: 'rose_gold', name: 'Rose Gold' },
      { key: 'ocean_depth', name: 'Ocean Depth' },
      { key: 'golden_hour', name: 'Golden Hour' },
      { key: 'lavender_fields', name: 'Lavender Fields' },
      { key: 'earth_tones', name: 'Earth Tones' },
      { key: 'sunset_coral', name: 'Sunset Coral' },
      { key: 'mint_fresh', name: 'Mint Fresh' },
    ],
  },
  {
    name: 'Warm & Cozy', short: 'Warm',
    themes: [
      { key: 'honey_linen', name: 'Honey Linen' },
      { key: 'warm_sunset', name: 'Warm Sunset' },
      { key: 'dusty_blush', name: 'Dusty Blush' },
      { key: 'earthy_comfort', name: 'Earthy Comfort' },
      { key: 'champagne', name: 'Champagne' },
      { key: 'hearthstone', name: 'Hearthstone' },
      { key: 'timber_iron', name: 'Timber & Iron' },
    ],
  },
  {
    name: 'Cool & Calm', short: 'Cool',
    themes: [
      { key: 'ocean_breeze', name: 'Ocean Breeze' },
      { key: 'forest_calm', name: 'Forest Calm' },
      { key: 'sage_cream', name: 'Sage & Cream' },
      { key: 'pine_stone', name: 'Pine Stone' },
      { key: 'coastal_slate', name: 'Coastal Slate' },
      { key: 'teal_storm', name: 'Teal Storm' },
      { key: 'lavender_dreams', name: 'Lavender Dreams' },
    ],
  },
  {
    name: 'Bold & Rich', short: 'Bold',
    themes: [
      { key: 'captains_quarters', name: "Captain's Quarters" },
      { key: 'inkwell_bronze', name: 'Inkwell Bronze' },
      { key: 'evening_indigo', name: 'Evening Indigo' },
      { key: 'plum_electric', name: 'Plum Electric' },
      { key: 'midnight_berry', name: 'Midnight Berry' },
      { key: 'sunset_blaze', name: 'Sunset Blaze' },
    ],
  },
  {
    name: 'Soft & Light', short: 'Soft',
    themes: [
      { key: 'peach_garden', name: 'Peach Garden' },
      { key: 'berry_soft', name: 'Berry Soft' },
      { key: 'morning_mist', name: 'Morning Mist' },
      { key: 'petal_honey', name: 'Petal Honey' },
      { key: 'cloud_nine', name: 'Cloud Nine' },
    ],
  },
  {
    name: 'Bright & Fun', short: 'Bright',
    themes: [
      { key: 'sunshine_day', name: 'Sunshine Day' },
      { key: 'garden_party', name: 'Garden Party' },
      { key: 'ocean_adventure', name: 'Ocean Adventure' },
      { key: 'berry_bright', name: 'Berry Bright' },
      { key: 'minty_fresh', name: 'Minty Fresh' },
      { key: 'peachy_keen', name: 'Peachy Keen' },
    ],
  },
  {
    name: 'Seasonal', short: 'Seasonal',
    themes: [
      { key: 'fresh_spring', name: 'Fresh Spring' },
      { key: 'sunny_summer', name: 'Sunny Summer' },
      { key: 'cozy_autumn', name: 'Cozy Autumn' },
      { key: 'winter_wonderland', name: 'Winter Wonderland' },
      { key: 'christmas_joy', name: 'Christmas Joy' },
      { key: 'fall_fun', name: 'Fall Fun' },
    ],
  },
]

const VIBE_OPTIONS: { key: VibeKey; name: string }[] = [
  { key: 'classic', name: 'Classic MyAIM' },
  { key: 'modern', name: 'Clean & Modern' },
  { key: 'nautical', name: 'Professional' },
  { key: 'cozy', name: 'Cozy Journal' },
]

const COLOR_MODES = [
  { key: 'light' as const, icon: Sun, label: 'Light' },
  { key: 'dark' as const, icon: Moon, label: 'Dark' },
  { key: 'system' as const, icon: Monitor, label: 'Auto' },
]

const FONT_SCALES = [
  { key: 'small' as const, label: 'S' },
  { key: 'default' as const, label: 'M' },
  { key: 'large' as const, label: 'L' },
  { key: 'extra-large' as const, label: 'XL' },
]

function ThemeSwatch({ themeKey, gradientEnabled, size = 28 }: { themeKey: ThemeKey; gradientEnabled: boolean; size?: number }) {
  const colors = themes[themeKey].light
  const c1 = colors.bgPrimary
  const c2 = colors.btnPrimaryBg
  const c3 = colors.bgNav

  if (gradientEnabled) {
    return (
      <div
        className="flex-shrink-0"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          background: `conic-gradient(from 0deg at 50% 50%, ${c1} 0deg, ${c2} 120deg, ${c3} 240deg, ${c1} 360deg)`,
        }}
      />
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className="flex-shrink-0">
      <path d="M16,16 L16,0 A16,16 0 0,1 29.86,24 Z" fill={c1} />
      <path d="M16,16 L29.86,24 A16,16 0 0,1 2.14,24 Z" fill={c2} />
      <path d="M16,16 L2.14,24 A16,16 0 0,1 16,0 Z" fill={c3} />
    </svg>
  )
}

function findCategoryForTheme(themeKey: ThemeKey): string {
  for (const cat of THEME_CATEGORIES) {
    if (cat.themes.some(t => t.key === themeKey)) return cat.name
  }
  return THEME_CATEGORIES[0].name
}

export function ThemeSelector() {
  const [open, setOpen] = useState(false)
  const {
    theme, vibe, colorMode, gradientEnabled, fontScale,
    setTheme, setVibe, setColorMode, setGradientEnabled, setFontScale,
  } = useTheme()

  const activeCategory = useMemo(() => findCategoryForTheme(theme), [theme])

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    return new Set([activeCategory])
  })

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  useMemo(() => {
    setExpandedCategories(prev => {
      if (prev.has(activeCategory)) return prev
      return new Set([...prev, activeCategory])
    })
  }, [activeCategory])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full hover:scale-110 transition-all duration-200"
        style={{
          background: 'transparent',
          color: 'var(--color-btn-primary-bg, #68a395)',
          minHeight: 'unset',
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
        className="w-80 max-h-[90vh] overflow-y-auto rounded-lg mt-10 mr-2 scrollbar-card"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          scrollbarColor: 'var(--color-btn-primary-bg) var(--color-bg-card)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            Appearance
          </span>
          <button onClick={() => setOpen(false)} className="p-1" style={{ color: 'var(--color-text-secondary)' }}>
            <X size={14} />
          </button>
        </div>

        <div className="px-3 py-2.5 space-y-3">
          {/* Row 1: Mode + Gradient side by side */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Mode
              </p>
              <div className="flex gap-1">
                {COLOR_MODES.map(mode => (
                  <button
                    key={mode.key}
                    onClick={() => setColorMode(mode.key)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px]"
                    style={{
                      background: colorMode === mode.key ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-bg-secondary)',
                      color: colorMode === mode.key ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                    }}
                  >
                    <mode.icon size={12} />
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>Gradient</span>
              <button
                onClick={() => setGradientEnabled(!gradientEnabled)}
                className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
                style={{
                  background: gradientEnabled
                    ? 'linear-gradient(135deg, var(--color-btn-primary-bg), var(--color-accent))'
                    : 'var(--color-bg-secondary)',
                }}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full absolute transition-all"
                  style={{
                    top: '3px',
                    left: gradientEnabled ? '19px' : '3px',
                    backgroundColor: 'var(--color-bg-card, #fff)',
                  }}
                />
              </button>
            </div>
          </div>

          {/* Color Theme — 2-column category grid */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Color Theme
            </p>
            <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
              {THEME_CATEGORIES.map(category => {
                const isExpanded = expandedCategories.has(category.name)
                const hasActiveTheme = category.themes.some(t => t.key === theme)
                return (
                  <div key={category.name} className={isExpanded ? 'col-span-2' : ''}>
                    <button
                      onClick={() => toggleCategory(category.name)}
                      className="w-full flex items-center justify-between py-1 px-1.5 rounded text-[11px] font-medium"
                      style={{
                        color: hasActiveTheme ? 'var(--color-btn-primary-bg)' : 'var(--color-text-primary)',
                        backgroundColor: hasActiveTheme ? 'var(--color-bg-secondary)' : 'transparent',
                      }}
                    >
                      <span>{category.short} ({category.themes.length})</span>
                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                    {isExpanded && (
                      <div className="grid grid-cols-4 gap-1 py-1.5 px-0.5">
                        {category.themes.map(t => (
                          <button
                            key={t.key}
                            onClick={() => setTheme(t.key)}
                            className="flex flex-col items-center gap-1 p-1 rounded text-[9px]"
                            style={{
                              backgroundColor: theme === t.key ? 'var(--color-bg-secondary)' : 'transparent',
                              border: theme === t.key ? '2px solid var(--color-btn-primary-bg)' : '2px solid transparent',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            <ThemeSwatch themeKey={t.key} gradientEnabled={gradientEnabled} size={24} />
                            <span className="text-center leading-none truncate w-full">{t.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Vibe — 4 compact pills in a row */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Vibe
            </p>
            <div className="grid grid-cols-2 gap-1">
              {VIBE_OPTIONS.map(v => (
                <button
                  key={v.key}
                  onClick={() => setVibe(v.key)}
                  className="py-1.5 px-2 rounded-md text-[11px] font-medium text-center"
                  style={{
                    backgroundColor: vibe === v.key ? 'var(--color-bg-secondary)' : 'transparent',
                    border: vibe === v.key ? '1.5px solid var(--color-btn-primary-bg)' : '1.5px solid var(--color-border)',
                    color: vibe === v.key ? 'var(--color-btn-primary-bg)' : 'var(--color-text-primary)',
                  }}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size — inline row */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 flex-shrink-0">
              <Type size={12} style={{ color: 'var(--color-text-secondary)' }} />
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Size
              </span>
            </div>
            <div className="flex gap-1 flex-1">
              {FONT_SCALES.map(fs => (
                <button
                  key={fs.key}
                  onClick={() => setFontScale(fs.key)}
                  className="flex-1 flex items-center justify-center py-1 rounded-md text-[11px] font-medium"
                  style={{
                    background: fontScale === fs.key ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-bg-secondary)',
                    color: fontScale === fs.key ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                  }}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
