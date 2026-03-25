/**
 * SettingsProvider — PRD-04 Repair / PRD-22 stub
 *
 * Provides openSettings() to all shells via context.
 * The actual Settings overlay UI will be built in PRD-22.
 * For now, renders a placeholder overlay.
 */

import { createContext, useContext, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface SettingsContextType {
  isOpen: boolean
  openSettings: () => void
  closeSettings: () => void
}

const SettingsContext = createContext<SettingsContextType>({
  isOpen: false,
  openSettings: () => {},
  closeSettings: () => {},
})

export function useSettings() {
  return useContext(SettingsContext)
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <SettingsContext.Provider
      value={{
        isOpen,
        openSettings: () => setIsOpen(true),
        closeSettings: () => setIsOpen(false),
      }}
    >
      {children}
      {isOpen && <SettingsOverlay onClose={() => setIsOpen(false)} />}
    </SettingsContext.Provider>
  )
}

// STUB: Settings overlay placeholder — wires to PRD-22
function SettingsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
          >
            <X size={18} />
          </button>
        </div>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Settings will be available here soon. Theme, family management, notifications, privacy, and more.
        </p>
      </div>
    </div>
  )
}
