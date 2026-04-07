/**
 * StudioSearch (PRD-09B Screen 1)
 *
 * Search bar that filters across all Studio categories by name and description.
 * Controlled input — parent owns the query state.
 */

import { Search, X } from 'lucide-react'

interface StudioSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function StudioSearch({ value, onChange, placeholder = 'Search templates…' }: StudioSearchProps) {
  return (
    <div
      className="relative flex items-center rounded-xl border"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: value ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
        transition: 'border-color 150ms ease',
      }}
    >
      <Search
        size={16}
        className="absolute left-3 shrink-0"
        style={{ color: 'var(--color-text-secondary)' }}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent py-2.5 pl-9 pr-9 text-sm outline-none"
        style={{ color: 'var(--color-text-primary)' }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 p-0.5 rounded transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
