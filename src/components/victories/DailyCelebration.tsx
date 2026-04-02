// PRD-11 Phase 12C: DailyCelebration — 5-step celebration sequence for Guided/Play
// Full-screen overlay launched from Celebrate button on dashboards.
// Shell-aware: Play = maximum delight, Guided = moderate.
// NEVER shows incomplete tasks. Only victories. Never "X of Y".

import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight, Star, CheckCircle, Share2 } from 'lucide-react'
import { useVictories, useCreateVictory } from '@/hooks/useVictories'
import { useVoicePreference } from '@/hooks/useVoicePreference'
import { useSaveCelebration } from '@/hooks/useCelebrationArchive'
import { supabase } from '@/lib/supabase/client'
import { ConfettiBurst } from '@/components/shared/ConfettiBurst'
import { AnimatedList } from '@/components/shared/AnimatedList'
import { SparkleOverlay } from '@/components/shared/SparkleOverlay'
import { SimplifiedRecordVictory } from './SimplifiedRecordVictory'
import type { Victory, VictorySource } from '@/types/victories'

interface DailyCelebrationProps {
  shell: 'guided' | 'play'
  memberId: string
  familyId: string
  memberName: string
  onClose: () => void
  /** PRD-25 Phase B: when true, inserts reflection step between Step 2 and Step 3 */
  reflectionsEnabled?: boolean
}

type CelebrationStep = 'opener' | 'victories' | 'streak' | 'theme' | 'close'
const ALL_STEPS: CelebrationStep[] = ['opener', 'victories', 'streak', 'theme', 'close']

export function DailyCelebration({
  shell,
  memberId,
  familyId,
  memberName,
  onClose,
  reflectionsEnabled: _reflectionsEnabled,
}: DailyCelebrationProps) {
  const isPlay = shell === 'play'
  const minTouch = isPlay ? 56 : 48

  // ─── Data ─────────────────────────────────────────────────
  const { data: todaysVictories = [], isLoading } = useVictories(memberId, { period: 'today' })
  const { selectedVoice } = useVoicePreference(familyId, memberId, shell)
  const saveCelebrationMutation = useSaveCelebration()
  const createVictory = useCreateVictory()

  // ─── State ────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<CelebrationStep>('opener')
  const [showConfetti, setShowConfetti] = useState(true)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [localVictories, setLocalVictories] = useState<Victory[]>([])
  const [sharedWithMom, setSharedWithMom] = useState(false)
  const [showSaveSparkle, setShowSaveSparkle] = useState(false)

  // Sync victories when loaded
  useEffect(() => {
    if (todaysVictories.length > 0) {
      setLocalVictories(todaysVictories)
    }
  }, [todaysVictories])

  // Active steps (skip streak + theme since they're stubs)
  const activeSteps = useMemo((): CelebrationStep[] => {
    // Steps 3 (streak) and 4 (theme) are stubs — auto-skip
    return ALL_STEPS.filter(s => s !== 'streak' && s !== 'theme')
  }, [])

  const currentIndex = activeSteps.indexOf(currentStep)
  const totalSteps = activeSteps.length

  // ─── Step 1: Auto-advance opener ─────────────────────────
  useEffect(() => {
    if (currentStep === 'opener') {
      const timer = setTimeout(() => setCurrentStep('victories'), 5000)
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  // ─── Trigger narrative generation during Step 2 ──────────
  useEffect(() => {
    if (currentStep === 'victories' && localVictories.length > 0 && !narrative && !narrativeLoading) {
      generateNarrative()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, localVictories.length])

  async function generateNarrative() {
    if (localVictories.length === 0) return
    setNarrativeLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/celebrate-victory`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            family_member_id: memberId,
            mode: 'review',
            period: 'today',
            victory_ids: localVictories.map(v => v.id),
            voice: selectedVoice,
          }),
        },
      )

      if (res.ok) {
        const data = await res.json()
        setNarrative(data.narrative)
      }
    } catch {
      // Non-blocking — sequence continues without narrative
    } finally {
      setNarrativeLoading(false)
    }
  }

  // ─── Navigation ───────────────────────────────────────────
  const goNext = useCallback(() => {
    const idx = activeSteps.indexOf(currentStep)
    if (idx < activeSteps.length - 1) {
      setCurrentStep(activeSteps[idx + 1])
    }
  }, [currentStep, activeSteps])

  const goBack = useCallback(() => {
    const idx = activeSteps.indexOf(currentStep)
    if (idx > 0) {
      setCurrentStep(activeSteps[idx - 1])
    }
  }, [currentStep, activeSteps])

  // ─── Record Victory from within DailyCelebration ──────────
  function handleRecordVictory(data: { description: string; lifeAreaTag: string | null; source: VictorySource }) {
    createVictory.mutate(
      {
        family_id: familyId,
        family_member_id: memberId,
        description: data.description,
        life_area_tag: data.lifeAreaTag,
        source: data.source,
        member_type: shell,
      },
      {
        onSuccess: (newVictory) => {
          setLocalVictories(prev => [...prev, newVictory])
          setShowRecordForm(false)
          setShowSaveSparkle(true)
          setTimeout(() => setShowSaveSparkle(false), 1200)
        },
      },
    )
  }

  // ─── Share with Mom ───────────────────────────────────────
  async function handleShareWithMom() {
    if (!narrative || sharedWithMom) return
    // Save celebration with shared flag
    saveCelebrationMutation.mutate({
      family_id: familyId,
      family_member_id: memberId,
      mode: 'review',
      period: 'today',
      narrative,
      victory_ids: localVictories.map(v => v.id),
      victory_count: localVictories.length,
      celebration_voice: selectedVoice,
    })
    setSharedWithMom(true)
  }

  // ─── Done ─────────────────────────────────────────────────
  function handleDone() {
    // Save celebration if narrative exists and not already shared
    if (narrative && !sharedWithMom) {
      saveCelebrationMutation.mutate({
        family_id: familyId,
        family_member_id: memberId,
        mode: 'review',
        period: 'today',
        narrative,
        victory_ids: localVictories.map(v => v.id),
        victory_count: localVictories.length,
        celebration_voice: selectedVoice,
      })
    }
    onClose()
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Confetti on opener */}
      {showConfetti && currentStep === 'opener' && (
        <ConfettiBurst
          intensity={isPlay ? 'maximum' : 'moderate'}
          onComplete={() => setShowConfetti(false)}
        />
      )}

      {/* Save sparkle */}
      {showSaveSparkle && <SparkleOverlay type="quick_burst" />}

      {/* Close button */}
      <div className="flex justify-end p-3">
        <button
          onClick={onClose}
          className="rounded-full flex items-center justify-center"
          style={{
            minHeight: minTouch,
            minWidth: minTouch,
            color: 'var(--color-text-secondary)',
          }}
        >
          <X size={isPlay ? 28 : 22} />
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
        {currentStep === 'opener' && (
          <StepOpener
            memberName={memberName}
            isPlay={isPlay}
            onTapAdvance={() => setCurrentStep('victories')}
          />
        )}

        {currentStep === 'victories' && (
          <StepVictories
            victories={localVictories}
            isPlay={isPlay}
            isLoading={isLoading}
            narrative={narrative}
            narrativeLoading={narrativeLoading}
            showRecordForm={showRecordForm}
            shell={shell}
            familyId={familyId}
            memberId={memberId}
            minTouch={minTouch}
            onToggleRecord={() => setShowRecordForm(!showRecordForm)}
            onRecordVictory={handleRecordVictory}
          />
        )}

        {currentStep === 'close' && (
          <StepClose
            isPlay={isPlay}
            hasNarrative={!!narrative}
            sharedWithMom={sharedWithMom}
            minTouch={minTouch}
            onShareWithMom={handleShareWithMom}
            onDone={handleDone}
          />
        )}
      </div>

      {/* Progress dots + navigation */}
      <div className="flex items-center justify-between px-6 pb-6 pt-3">
        <button
          onClick={goBack}
          disabled={currentIndex <= 0}
          className="rounded-full flex items-center justify-center"
          style={{
            minHeight: minTouch,
            minWidth: minTouch,
            color: currentIndex > 0 ? 'var(--color-text-secondary)' : 'transparent',
          }}
        >
          <ChevronLeft size={isPlay ? 28 : 22} />
        </button>

        {/* Progress dots */}
        <div className="flex gap-2">
          {activeSteps.map((step, i) => (
            <div
              key={step}
              className="rounded-full transition-all"
              style={{
                width: i === currentIndex ? (isPlay ? 24 : 16) : (isPlay ? 12 : 8),
                height: isPlay ? 12 : 8,
                backgroundColor:
                  i === currentIndex
                    ? 'var(--color-sparkle-gold, #D4AF37)'
                    : i < currentIndex
                      ? 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 40%, transparent)'
                      : 'var(--color-border)',
                borderRadius: 999,
              }}
            />
          ))}
        </div>

        <button
          onClick={currentStep === 'close' ? handleDone : goNext}
          disabled={currentIndex >= totalSteps - 1 && currentStep !== 'close'}
          className="rounded-full flex items-center justify-center"
          style={{
            minHeight: minTouch,
            minWidth: minTouch,
            color: currentIndex < totalSteps - 1 ? 'var(--color-text-secondary)' : 'transparent',
          }}
        >
          <ChevronRight size={isPlay ? 28 : 22} />
        </button>
      </div>
    </div>
  )
}

// ─── Step Components ────────────────────────────────────────

function StepOpener({
  memberName,
  isPlay,
  onTapAdvance,
}: {
  memberName: string
  isPlay: boolean
  onTapAdvance: () => void
}) {
  return (
    <button
      onClick={onTapAdvance}
      className="text-center space-y-4 w-full"
      style={{ background: 'none', border: 'none' }}
    >
      <div
        className={`font-bold ${isPlay ? 'text-4xl' : 'text-2xl'}`}
        style={{
          color: 'var(--color-sparkle-gold, #D4AF37)',
          animation: isPlay ? 'bounceText 0.6s ease-out' : 'fadeSlideUp 0.5s ease-out',
        }}
      >
        {isPlay ? 'WOW!' : 'Amazing work today,'}
      </div>
      <div
        className={`font-bold ${isPlay ? 'text-3xl' : 'text-xl'}`}
        style={{
          color: 'var(--color-text-heading)',
          animation: isPlay ? 'bounceText 0.6s ease-out 0.2s both' : 'fadeSlideUp 0.5s ease-out 0.2s both',
        }}
      >
        {isPlay ? `Great job, ${memberName}!` : memberName + '!'}
      </div>
      <p
        className={`${isPlay ? 'text-lg' : 'text-sm'}`}
        style={{
          color: 'var(--color-text-secondary)',
          animation: 'fadeSlideUp 0.5s ease-out 0.6s both',
        }}
      >
        Tap to continue
      </p>

      <style>{`
        @keyframes bounceText {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes fadeSlideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; }
        }
      `}</style>
    </button>
  )
}

function StepVictories({
  victories,
  isPlay,
  isLoading,
  narrative,
  narrativeLoading,
  showRecordForm,
  shell,
  familyId,
  memberId,
  minTouch,
  onToggleRecord,
  onRecordVictory,
}: {
  victories: Victory[]
  isPlay: boolean
  isLoading: boolean
  narrative: string | null
  narrativeLoading: boolean
  showRecordForm: boolean
  shell: 'guided' | 'play'
  familyId: string
  memberId: string
  minTouch: number
  onToggleRecord: () => void
  onRecordVictory: (data: { description: string; lifeAreaTag: string | null; source: VictorySource }) => void
}) {
  if (isLoading) {
    return (
      <div className="text-center" style={{ color: 'var(--color-text-secondary)' }}>
        <div className={isPlay ? 'text-xl' : 'text-base'}>Loading your victories...</div>
      </div>
    )
  }

  const hasVictories = victories.length > 0

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Header */}
      <h2
        className={`text-center font-bold ${isPlay ? 'text-2xl' : 'text-xl'}`}
        style={{ color: 'var(--color-text-heading)' }}
      >
        {hasVictories
          ? (isPlay ? 'Look what you did!' : 'Look what you did today!')
          : (isPlay ? 'Every day is a new chance!' : 'Every day is a new chance!')}
      </h2>

      {/* Victory list */}
      {hasVictories && (
        <>
          <AnimatedList
            staggerDelay={isPlay ? 500 : 400}
            icon={
              isPlay
                ? <Star size={20} style={{ color: 'var(--color-sparkle-gold, #D4AF37)' }} fill="var(--color-sparkle-gold, #D4AF37)" />
                : <CheckCircle size={18} style={{ color: 'var(--color-sparkle-gold, #D4AF37)' }} />
            }
            items={victories.map(v => (
              <span
                key={v.id}
                className={isPlay ? 'text-lg font-medium' : 'text-base'}
                style={{ color: 'var(--color-text-primary)' }}
              >
                {v.description}
              </span>
            ))}
          />

          {/* Victory count */}
          <div
            className={`text-center font-bold ${isPlay ? 'text-xl' : 'text-lg'}`}
            style={{ color: 'var(--color-sparkle-gold, #D4AF37)' }}
          >
            {isPlay
              ? `That's ${victories.length} ${victories.length === 1 ? 'victory' : 'victories'}!`
              : `${victories.length} ${victories.length === 1 ? 'victory' : 'victories'} today`}
          </div>

          {/* Narrative callout */}
          {narrativeLoading && (
            <div
              className="text-center text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Reflecting on your day...
            </div>
          )}
          {narrative && (
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 8%, var(--color-bg-card))',
                border: '1px solid color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 25%, transparent)',
              }}
            >
              <p
                className={`${isPlay ? 'text-base' : 'text-sm'} leading-relaxed`}
                style={{ color: 'var(--color-text-primary)' }}
              >
                {narrative}
              </p>
            </div>
          )}
        </>
      )}

      {/* No victories message */}
      {!hasVictories && (
        <p
          className={`text-center ${isPlay ? 'text-lg' : 'text-base'}`}
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {isPlay
            ? 'What did you do today? Tell me about it!'
            : 'What did you accomplish today? Even small things count.'}
        </p>
      )}

      {/* Record form or button */}
      {showRecordForm ? (
        <SimplifiedRecordVictory
          shell={shell}
          familyId={familyId}
          memberId={memberId}
          onSave={onRecordVictory}
          onClose={onToggleRecord}
        />
      ) : (
        <button
          onClick={onToggleRecord}
          className={`w-full rounded-xl font-semibold transition-all ${isPlay ? 'text-lg py-4' : 'text-base py-3'}`}
          style={{
            minHeight: minTouch,
            backgroundColor: 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 15%, var(--color-bg-card))',
            color: 'var(--color-sparkle-gold-dark, #B8942A)',
            border: '1.5px solid color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 35%, transparent)',
          }}
        >
          {hasVictories
            ? (isPlay ? 'I Did Something Else Great!' : 'I Did Something Else Great!')
            : (isPlay ? 'I Did Something Great!' : 'I Did Something Great!')}
        </button>
      )}
    </div>
  )
}

function StepClose({
  isPlay,
  hasNarrative,
  sharedWithMom,
  minTouch,
  onShareWithMom,
  onDone,
}: {
  isPlay: boolean
  hasNarrative: boolean
  sharedWithMom: boolean
  minTouch: number
  onShareWithMom: () => void
  onDone: () => void
}) {
  const [showCloseConfetti, setShowCloseConfetti] = useState(true)

  return (
    <div className="text-center space-y-6 w-full max-w-sm">
      {showCloseConfetti && (
        <ConfettiBurst
          intensity={isPlay ? 'maximum' : 'moderate'}
          onComplete={() => setShowCloseConfetti(false)}
        />
      )}

      <div
        className={`font-bold ${isPlay ? 'text-3xl' : 'text-xl'}`}
        style={{
          color: 'var(--color-text-heading)',
          animation: 'fadeSlideUp 0.5s ease-out',
        }}
      >
        {isPlay ? "You're amazing!" : "You're doing great!"}
      </div>

      <p
        className={`${isPlay ? 'text-lg' : 'text-base'}`}
        style={{
          color: 'var(--color-text-secondary)',
          animation: 'fadeSlideUp 0.5s ease-out 0.2s both',
        }}
      >
        See you tomorrow!
      </p>

      <div className="space-y-3" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.4s both' }}>
        {/* Share with Mom — Guided only */}
        {!isPlay && hasNarrative && (
          <button
            onClick={onShareWithMom}
            disabled={sharedWithMom}
            className={`w-full rounded-xl font-semibold flex items-center justify-center gap-2 py-3 transition-all`}
            style={{
              minHeight: minTouch,
              backgroundColor: sharedWithMom
                ? 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 15%, var(--color-bg-card))'
                : 'var(--color-bg-secondary)',
              color: sharedWithMom ? 'var(--color-sparkle-gold, #D4AF37)' : 'var(--color-text-secondary)',
              border: `1.5px solid ${sharedWithMom ? 'var(--color-sparkle-gold, #D4AF37)' : 'var(--color-border)'}`,
            }}
          >
            <Share2 size={18} />
            {sharedWithMom ? 'Shared with Mom!' : 'Share with Mom'}
          </button>
        )}

        {/* Done button */}
        <button
          onClick={onDone}
          className={`w-full rounded-xl font-bold flex items-center justify-center transition-transform active:scale-95 ${isPlay ? 'text-xl py-5' : 'text-lg py-4'}`}
          style={{
            minHeight: minTouch,
            backgroundColor: 'var(--color-sparkle-gold, #D4AF37)',
            color: 'white',
          }}
        >
          Done!
        </button>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  )
}
