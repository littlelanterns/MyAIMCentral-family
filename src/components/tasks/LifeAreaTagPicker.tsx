/**
 * LifeAreaTagPicker (PRD-09A)
 *
 * Compact pill-selector for the expanded life area tag set.
 * Renders as a scrollable flex-wrap of tappable pills.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

export const LIFE_AREA_TAGS = [
  { value: 'spiritual', label: 'Spiritual' },
  { value: 'spouse_marriage', label: 'Spouse / Marriage' },
  { value: 'family', label: 'Family' },
  { value: 'career_work', label: 'Career / Work' },
  { value: 'home', label: 'Home' },
  { value: 'health_physical', label: 'Health / Physical' },
  { value: 'social', label: 'Social' },
  { value: 'financial', label: 'Financial' },
  { value: 'personal', label: 'Personal' },
  { value: 'homeschool', label: 'Homeschool' },
  { value: 'extracurriculars', label: 'Extracurriculars' },
  { value: 'meal_planning', label: 'Meal Planning' },
  { value: 'auto_transport', label: 'Auto / Transport' },
  { value: 'digital_tech', label: 'Digital / Tech' },
  { value: 'hobbies', label: 'Hobbies' },
  { value: 'custom', label: 'Custom…' },
] as const

export type LifeAreaTag = (typeof LIFE_AREA_TAGS)[number]['value']

interface LifeAreaTagPickerProps {
  value: string
  onChange: (value: string) => void
  customValue?: string
  onCustomChange?: (value: string) => void
}

export function LifeAreaTagPicker({ value, onChange, customValue = '', onCustomChange }: LifeAreaTagPickerProps) {
  return (
    <div className="space-y-2">
      <span
        style={{
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm, 0.875rem)',
          fontWeight: 500,
        }}
      >
        Life area
      </span>
      <div className="flex flex-wrap gap-1.5">
        {LIFE_AREA_TAGS.map((tag) => {
          const selected = value === tag.value
          return (
            <button
              key={tag.value}
              type="button"
              onClick={() => onChange(tag.value)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                fontSize: 'var(--font-size-xs, 0.75rem)',
                fontWeight: selected ? 600 : 400,
                border: `1px solid ${selected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                backgroundColor: selected
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))'
                  : 'var(--color-bg-secondary)',
                color: selected ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--vibe-transition, 0.15s ease)',
                minHeight: '30px',
              }}
            >
              {tag.label}
            </button>
          )
        })}
      </div>
      {value === 'custom' && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange?.(e.target.value)}
          placeholder="Enter custom life area…"
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            backgroundColor: 'var(--color-bg-input)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            minHeight: '44px',
          }}
        />
      )}
    </div>
  )
}
