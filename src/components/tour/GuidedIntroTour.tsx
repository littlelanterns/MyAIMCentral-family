/**
 * GuidedIntroTour — Floating card carousel for new/demo users
 *
 * Shows one built feature at a time with navigation arrows.
 * Dismissal stored in localStorage with 48-hour expiry.
 * Minimizes to a floating pill when user navigates to a feature.
 *
 * Each tour card specifies an action: navigate to a page, open a LiLa tool,
 * open the LiLa drawer in a specific mode, or open the Smart Notepad.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Star, Heart, Sparkles, FileText, CheckSquare, Archive,
  Feather, Brain, ChevronLeft, ChevronRight, X, Map,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getTourFeatures, type JourneyFeature } from '@/data/lanterns-path-data'
import { useToolLauncher } from '@/components/lila/ToolLauncherProvider'
import { useNotepadContextSafe } from '@/components/notepad'

const STORAGE_KEY = 'myaim_intro_tour_dismissed'
const TOUR_EXPIRY_MS = 48 * 60 * 60 * 1000 // 48 hours

const ICON_MAP: Record<string, LucideIcon> = {
  Star, Heart, Sparkles, FileText, CheckSquare, Archive, Feather, Brain,
}

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Star
}

function isTourDismissed(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return false
    const ts = parseInt(stored, 10)
    if (isNaN(ts)) return false
    return Date.now() - ts < TOUR_EXPIRY_MS
  } catch {
    return false
  }
}

function dismissTour() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  } catch { /* noop */ }
}

export function GuidedIntroTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [minimized, setMinimized] = useState(false)
  const navigate = useNavigate()
  const { openTool } = useToolLauncher()
  const notepadCtx = useNotepadContextSafe()

  const tourFeatures = getTourFeatures()
  const totalSteps = tourFeatures.length + 1 // +1 for the final card

  useEffect(() => {
    if (!isTourDismissed()) {
      setVisible(true)
    }
  }, [])

  if (!visible || tourFeatures.length === 0) return null

  const handleDismiss = () => {
    dismissTour()
    setVisible(false)
  }

  /** Execute the tour action for a feature — navigate + trigger the right UI */
  const handleShowMe = (feature: JourneyFeature) => {
    const action = feature.tourAction

    if (!action) {
      // Default: just navigate
      if (feature.route) navigate(feature.route)
      setMinimized(true)
      return
    }

    switch (action.type) {
      case 'navigate':
        if (action.route) navigate(action.route)
        break

      case 'tool':
        // Open a LiLa tool modal (Cyrano, Perspective Shifter, etc.)
        if (action.toolModeKey) {
          openTool(action.toolModeKey)
        }
        break

      case 'lila':
        // Navigate to page if specified, then open LiLa drawer in the specified mode
        if (action.route) navigate(action.route)
        if (action.lilaMode) {
          // Dispatch custom event that MomShell listens for
          window.dispatchEvent(new CustomEvent('tour-open-lila', {
            detail: { mode: action.lilaMode },
          }))
        }
        break

      case 'notepad':
        // Open the Smart Notepad drawer
        if (notepadCtx) {
          notepadCtx.openNotepad()
        }
        break
    }

    setMinimized(true)
  }

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
      setMinimized(false)
    }
  }

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1)
      setMinimized(false)
    }
  }

  // Minimized pill
  if (minimized) {
    return (
      <div
        className="fixed z-40 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg cursor-pointer"
        style={{
          bottom: '70px',
          right: '16px',
          backgroundColor: 'var(--color-btn-primary-bg)',
          color: 'var(--color-btn-primary-text)',
        }}
        onClick={() => setMinimized(false)}
      >
        <Map size={14} />
        <span className="text-xs font-medium">Tour: {step + 1}/{totalSteps}</span>
        <button
          onClick={(e) => { e.stopPropagation(); handleNext() }}
          className="text-xs font-medium ml-1"
          style={{ color: 'inherit', background: 'transparent', border: 'none', minHeight: 'unset', padding: 0 }}
        >
          Next
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDismiss() }}
          className="ml-1"
          style={{ color: 'inherit', background: 'transparent', border: 'none', minHeight: 'unset', padding: 0 }}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  // Final card
  if (step >= tourFeatures.length) {
    return (
      <TourCardWrapper
        step={step}
        totalSteps={totalSteps}
        onPrev={handlePrev}
        onNext={handleDismiss}
        onDismiss={handleDismiss}
        isLast
      >
        <div className="text-center">
          <Map size={32} className="mx-auto mb-2" style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="font-semibold mb-1" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
            You've seen what's working now!
          </p>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Visit The Lantern's Path for the full vision of what's coming.
          </p>
          <button
            onClick={() => { navigate('/lanterns-path'); handleDismiss() }}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
              border: 'none',
            }}
          >
            Open Full Map
          </button>
        </div>
      </TourCardWrapper>
    )
  }

  // Feature card
  const feature = tourFeatures[step]
  const Icon = getIcon(feature.iconName)

  return (
    <TourCardWrapper
      step={step}
      totalSteps={totalSteps}
      onPrev={handlePrev}
      onNext={handleNext}
      onDismiss={handleDismiss}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <span className="font-semibold text-sm" style={{ color: 'var(--color-text-heading)' }}>
          {feature.name}
        </span>
      </div>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
        {feature.tourHook}
      </p>
      {feature.tourInstruction && (
        <p className="text-xs mb-3 italic" style={{ color: 'var(--color-text-secondary)' }}>
          Try this now: {feature.tourInstruction}
        </p>
      )}
      <button
        onClick={() => handleShowMe(feature)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
        style={{
          backgroundColor: 'var(--color-btn-primary-bg)',
          color: 'var(--color-btn-primary-text)',
          border: 'none',
        }}
      >
        Show me <ChevronRight size={12} />
      </button>
    </TourCardWrapper>
  )
}

// ── Tour Card Wrapper ────────────────────────────────────────────

function TourCardWrapper({
  step,
  totalSteps,
  onPrev,
  onNext,
  onDismiss,
  isLast,
  children,
}: {
  step: number
  totalSteps: number
  onPrev: () => void
  onNext: () => void
  onDismiss: () => void
  isLast?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed z-40 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-md rounded-xl shadow-xl p-4"
      style={{
        bottom: '70px',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-full"
        style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', minHeight: 'unset' }}
      >
        <X size={16} />
      </button>

      {/* Content */}
      <div className="pr-6">{children}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={onPrev}
          disabled={step === 0}
          className="p-1.5 rounded-lg"
          style={{
            color: step === 0 ? 'var(--color-text-secondary)' : 'var(--color-btn-primary-bg)',
            opacity: step === 0 ? 0.3 : 1,
            background: 'transparent',
            border: 'none',
            minHeight: 'unset',
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Progress dots */}
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: i === step
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-border)',
              }}
            />
          ))}
        </div>

        {isLast ? (
          <button
            onClick={onDismiss}
            className="text-xs font-medium px-2 py-1 rounded"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', minHeight: 'unset' }}
          >
            Done
          </button>
        ) : (
          <button
            onClick={onNext}
            className="p-1.5 rounded-lg"
            style={{ color: 'var(--color-btn-primary-bg)', background: 'transparent', border: 'none', minHeight: 'unset' }}
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Skip tour link */}
      <div className="text-center mt-1">
        <button
          onClick={onDismiss}
          className="text-[10px]"
          style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', minHeight: 'unset', opacity: 0.6 }}
        >
          Skip Tour
        </button>
      </div>
    </div>
  )
}
