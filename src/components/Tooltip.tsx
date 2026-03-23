import { useState, type ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
}

/**
 * Theme-aware tooltip. Replaces native `title` attributes
 * with a styled tooltip using the current theme colors.
 */
export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className="absolute z-50 px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-4px)',
            backgroundColor: 'var(--color-bg-nav)',
            color: 'var(--color-btn-primary-text)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
