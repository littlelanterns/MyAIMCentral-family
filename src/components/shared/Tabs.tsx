/**
 * Tabs (PRD-03 Design System)
 *
 * Horizontal scrollable tab bar.
 * Active tab: 2px bottom border in var(--color-btn-primary-bg), primary text color.
 * Inactive: secondary text, hover to primary.
 * Optional icon per tab.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import type { ReactNode } from 'react'

export interface TabItem {
  key: string
  label: string
  icon?: ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  activeKey: string
  onChange: (key: string) => void
  className?: string
}

export function Tabs({ tabs, activeKey, onChange, className = '' }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`flex overflow-x-auto scrollbar-hide ${className}`}
      style={{
        borderBottom: '1px solid var(--color-border)',
        gap: 0,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey
        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.key}`}
            id={`tab-${tab.key}`}
            onClick={() => onChange(tab.key)}
            className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
            style={{
              padding: '0.625rem 1rem',
              border: 'none',
              borderBottom: isActive
                ? '2px solid var(--color-btn-primary-bg)'
                : '2px solid transparent',
              background: 'transparent',
              color: isActive
                ? 'var(--color-text-primary)'
                : 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm, 0.875rem)',
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              transition: 'color var(--vibe-transition, 0.2s ease), border-color var(--vibe-transition, 0.2s ease)',
              minHeight: 'var(--touch-target-min, 44px)',
              marginBottom: -1, // sit on top of the container border
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--color-text-secondary)'
              }
            }}
          >
            {tab.icon && (
              <span aria-hidden="true" className="flex-shrink-0">
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
