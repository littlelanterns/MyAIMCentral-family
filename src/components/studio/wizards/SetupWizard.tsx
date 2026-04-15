/**
 * SetupWizard — Reusable multi-step wizard shell for Studio setup flows.
 *
 * Wraps ModalV2 with step indicator, back/next navigation, and progress tracking.
 * Each wizard component manages its own step state and renders step content
 * as children. This component provides the chrome.
 */

import { type ReactNode } from 'react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

export interface WizardStep {
  key: string
  title: string
  optional?: boolean
}

interface SetupWizardProps {
  id: string
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  steps: WizardStep[]
  currentStep: number
  onBack: () => void
  onNext: () => void
  onFinish: () => void
  children: ReactNode
  finishLabel?: string
  canAdvance?: boolean
  canFinish?: boolean
  isFinishing?: boolean
  hideNav?: boolean
}

export function SetupWizard({
  id,
  isOpen,
  onClose,
  title,
  subtitle,
  steps,
  currentStep,
  onBack,
  onNext,
  onFinish,
  children,
  finishLabel = 'Deploy',
  canAdvance = true,
  canFinish = true,
  isFinishing = false,
  hideNav = false,
}: SetupWizardProps) {
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1
  const step = steps[currentStep]

  return (
    <ModalV2
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title={title}
      subtitle={subtitle}
      footer={
        hideNav ? undefined : (
          <div className="flex items-center justify-between w-full">
            <button
              onClick={isFirst ? onClose : onBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              {isFirst ? (
                'Cancel'
              ) : (
                <>
                  <ChevronLeft size={16} />
                  Back
                </>
              )}
            </button>

            {isLast ? (
              <button
                onClick={onFinish}
                disabled={!canFinish || isFinishing}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                <Check size={16} />
                {isFinishing ? 'Saving...' : finishLabel}
              </button>
            ) : (
              <button
                onClick={onNext}
                disabled={!canAdvance}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        )
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-5 px-1">
        {steps.map((s, i) => {
          const isActive = i === currentStep
          const isDone = i < currentStep
          return (
            <div key={s.key} className="flex items-center gap-1 flex-1">
              {/* Dot */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all"
                style={{
                  backgroundColor: isDone
                    ? 'var(--color-btn-primary-bg)'
                    : isActive
                      ? 'var(--color-btn-primary-bg)'
                      : 'var(--color-bg-secondary)',
                  color: isDone || isActive
                    ? 'var(--color-btn-primary-text)'
                    : 'var(--color-text-muted)',
                  opacity: isDone ? 0.7 : 1,
                }}
              >
                {isDone ? <Check size={14} /> : i + 1}
              </div>
              {/* Label (hidden on mobile if more than 4 steps) */}
              <span
                className={`text-xs font-medium truncate ${steps.length > 4 ? 'hidden sm:inline' : ''}`}
                style={{
                  color: isActive
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                }}
              >
                {s.title}
              </span>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-px mx-1"
                  style={{
                    backgroundColor: isDone
                      ? 'var(--color-btn-primary-bg)'
                      : 'var(--color-border)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step title */}
      <h3
        className="text-base font-semibold mb-1"
        style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
      >
        {step?.title}
        {step?.optional && (
          <span className="text-xs font-normal ml-2" style={{ color: 'var(--color-text-muted)' }}>
            (optional)
          </span>
        )}
      </h3>

      {/* Step content */}
      <div className="mt-3">
        {children}
      </div>
    </ModalV2>
  )
}
