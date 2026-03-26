/**
 * SettingsProvider — PRD-04 / PRD-22
 *
 * Provides openSettings() to all shells via context.
 * Now navigates to the /settings page instead of showing a modal overlay.
 */

import { createContext, useContext, type ReactNode } from 'react'

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
  return (
    <SettingsContext.Provider
      value={{
        isOpen: false,
        openSettings: () => {
          // Navigate to the settings page
          // Using window.location because SettingsProvider is outside BrowserRouter
          window.location.href = '/settings'
        },
        closeSettings: () => {},
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
