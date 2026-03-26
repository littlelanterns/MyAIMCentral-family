/**
 * GuidedIntroTour — Floating card carousel for new/demo users
 *
 * Stays visible while exploring. "Show me" navigates + triggers the UI element
 * but the carousel bounces to the bottom-right corner so it's easy to continue.
 * "Dismiss Guide" closes it and triggers a glow on the Lantern's Path QuickTasks pill.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Star, Heart, Sparkles, FileText, CheckSquare, Archive,
  Feather, Brain, ChevronLeft, ChevronRight, Map,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getTourFeatures, type JourneyFeature } from '@/data/lanterns-path-data'
import { useToolLauncher } from '@/components/lila/ToolLauncherProvider'
import { useNotepadContextSafe } from '@/components/notepad'

const STORAGE_KEY = 'myaim_intro_tour_dismissed'

const ICON_MAP: Record<string, LucideIcon> = {
  Star, Heart, Sparkles, FileText, CheckSquare, Archive, Feather, Brain,
}

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Star
}

function isTourDismissed(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function dismissTour() {
  try {
    sessionStorage.setItem(STORAGE_KEY, 'true')
  } catch { /* noop */ }
}

/** Dispatch event so QuickTasks Lantern's Path pill can glow after dismiss */
function triggerLanternsPathGlow() {
  window.dispatchEvent(new CustomEvent('tour-dismissed-glow'))
}

export function GuidedIntroTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [docked, setDocked] = useState(false) // "bounced to corner" state
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
    triggerLanternsPathGlow()
  }

  /** Execute the tour action — navigate + trigger UI, then dock the carousel */
  const handleShowMe = (feature: JourneyFeature) => {
    const action = feature.tourAction

    if (!action) {
      if (feature.route) navigate(feature.route)
      setDocked(true)
      return
    }

    switch (action.type) {
      case 'navigate':
        if (action.route) navigate(action.route)
        break
      case 'tool':
        if (action.toolModeKey) openTool(action.toolModeKey)
        break
      case 'lila':
        if (action.route) navigate(action.route)
        if (action.lilaMode) {
          window.dispatchEvent(new CustomEvent('tour-open-lila', {
            detail: { mode: action.lilaMode },
          }))
        }
        break
      case 'notepad':
        if (notepadCtx) notepadCtx.openNotepad()
        break
    }

    setDocked(true)
  }

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
      setDocked(false)
    }
  }

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1)
      setDocked(false)
    }
  }

  const handleUndock = () => setDocked(false)

  // ── Docked state: compact card in bottom-right ────────────
  if (docked) {
    const isLastStep = step >= tourFeatures.length
    const currentFeature = !isLastStep ? tourFeatures[step] : null
    const Icon = currentFeature ? getIcon(currentFeature.iconName) : Map

    return (
      <>
        <style>{`
          @keyframes tourBounceIn {
            0% { transform: scale(0.8) translateY(20px); opacity: 0; }
            50% { transform: scale(1.05) translateY(-4px); }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
        `}</style>
        <div
          className="fixed z-40 rounded-xl shadow-xl p-3 cursor-pointer"
          style={{
            bottom: '70px',
            right: '16px',
            width: '280px',
            backgroundColor: 'var(--color-bg-card)',
            border: '1.5px solid #D6A461',
            boxShadow: '0 4px 20px rgba(214,164,97,0.3)',
            animation: 'tourBounceIn 0.4s ease-out',
          }}
          onClick={handleUndock}
        >
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color: '#D6A461' }} />
            <span className="text-xs font-semibold flex-1 truncate" style={{ color: 'var(--color-text-heading)' }}>
              {currentFeature ? currentFeature.name : 'Tour Complete'}
            </span>
            <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
              {step + 1}/{totalSteps}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleUndock() }}
              className="text-[11px] font-medium px-2 py-1 rounded"
              style={{ backgroundColor: '#D6A461', color: '#fff', border: 'none', minHeight: 'unset' }}
            >
              Continue Tour
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext() }}
              className="text-[11px] px-2 py-1 rounded"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: '1px solid var(--color-border)', minHeight: 'unset' }}
            >
              Next
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss() }}
              className="text-[11px] px-2 py-1 rounded ml-auto"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', minHeight: 'unset', opacity: 0.6 }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── Final card ────────────────────────────────────────────
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
            style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)', border: 'none' }}
          >
            Open Full Map
          </button>
        </div>
      </TourCardWrapper>
    )
  }

  // ── Feature card (full) ───────────────────────────────────
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
        style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)', border: 'none' }}
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
      {/* Content */}
      <div className="pr-2">{children}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={onPrev}
          disabled={step === 0}
          className="p-1.5 rounded-lg"
          style={{
            color: step === 0 ? 'var(--color-text-secondary)' : 'var(--color-btn-primary-bg)',
            opacity: step === 0 ? 0.3 : 1,
            background: 'transparent', border: 'none', minHeight: 'unset',
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
                backgroundColor: i === step ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
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

      {/* Dismiss Guide button */}
      <div className="text-center mt-1">
        <button
          onClick={onDismiss}
          className="text-[11px] font-medium"
          style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', minHeight: 'unset', opacity: 0.7 }}
        >
          Dismiss Guide
        </button>
      </div>
    </div>
  )
}
