/**
 * useWizardProgress — localStorage persistence for wizard state.
 *
 * Saves wizard state on every step change, restores on mount.
 * Keyed by `wizard-v1-{wizardId}-{familyId}`.
 * Clears on successful deploy or explicit "Start Over."
 *
 * Version number allows invalidating stale drafts when wizard
 * structure changes between deploys.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

const WIZARD_VERSION = 'v1'

function buildKey(wizardId: string, familyId: string): string {
  return `wizard-${WIZARD_VERSION}-${wizardId}-${familyId}`
}

interface UseWizardProgressOptions<T> {
  wizardId: string
  familyId: string
  initialState: T
}

interface UseWizardProgressReturn<T> {
  state: T
  setState: (updater: T | ((prev: T) => T)) => void
  currentStep: number
  setCurrentStep: (step: number) => void
  clearProgress: () => void
  hasRestoredDraft: boolean
}

interface PersistedData<T> {
  wizardState: T
  currentStep: number
  savedAt: string
}

export function useWizardProgress<T>({
  wizardId,
  familyId,
  initialState,
}: UseWizardProgressOptions<T>): UseWizardProgressReturn<T> {
  const key = buildKey(wizardId, familyId)
  const initializedRef = useRef(false)
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)

  // Try to restore from localStorage on first mount
  const [state, setStateRaw] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed: PersistedData<T> = JSON.parse(stored)
        if (parsed.wizardState) {
          return parsed.wizardState
        }
      }
    } catch {
      // Corrupted data — start fresh
      localStorage.removeItem(key)
    }
    return initialState
  })

  const [currentStep, setCurrentStepRaw] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed: PersistedData<T> = JSON.parse(stored)
        if (typeof parsed.currentStep === 'number') {
          return parsed.currentStep
        }
      }
    } catch {
      // Already handled above
    }
    return 0
  })

  // Flag restoration on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          setHasRestoredDraft(true)
        }
      } catch {
        // ignore
      }
    }
  }, [key])

  // Persist to localStorage whenever state or step changes
  useEffect(() => {
    if (!initializedRef.current) return
    try {
      const data: PersistedData<T> = {
        wizardState: state,
        currentStep,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(key, JSON.stringify(data))
    } catch {
      // localStorage full or unavailable — continue without persistence
    }
  }, [state, currentStep, key])

  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    setStateRaw(updater as T)
  }, [])

  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepRaw(step)
  }, [])

  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
    setStateRaw(initialState)
    setCurrentStepRaw(0)
    setHasRestoredDraft(false)
  }, [key, initialState])

  return {
    state,
    setState,
    currentStep,
    setCurrentStep,
    clearProgress,
    hasRestoredDraft,
  }
}
