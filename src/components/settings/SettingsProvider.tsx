/**
 * SettingsProvider — PRD-04 / PRD-22
 *
 * Provides openSettings() to all shells via context.
 * Navigates to the /settings page using React Router (no full page reload).
 * Full Settings overlay conversion deferred to PRD-22 build.
 */

import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()

  const openSettings = useCallback(() => {
    navigate('/settings')
  }, [navigate])

  const closeSettings = useCallback(() => {
    navigate(-1)
  }, [navigate])

  return (
    <SettingsContext.Provider
      value={{
        isOpen: false,
        openSettings,
        closeSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
