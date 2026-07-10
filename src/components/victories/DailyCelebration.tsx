// PRD-11 Phase 12C: DailyCelebration — 5-step celebration sequence for Guided/Play
// Full-screen overlay launched from Celebrate button on dashboards.
// Shell-aware: Play = maximum delight, Guided = moderate.
// NEVER shows incomplete tasks. Only victories. Never "X of Y".

import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight, Star, CheckCircle, Share2, Pencil, Check, RefreshCw, Flame, Sparkles } from 'lucide-react'
import { useVictories, useCreateVictory } from '@/hooks/useVictories'
import { useVoicePreference } from '@/hooks/useVoicePreference'
import { useSaveCelebration } from '@/hooks/useCelebrationArchive'
import { useMemberStreak } from '@/hooks/useMemberStreak'
import { useGamificationConfig } from '@/hooks/useGamificationSettings'
import { useStickerBookState } from '@/hooks/useStickerBookState'
import { useCreaturesForMember } from '@/hooks/useCreaturesForMember'
import { WriteDrawerReflections } from '@/components/guided/WriteDrawerReflections'
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
  /** PRD-25 Screen 6: when true, inserts the Reflections step between Step 2 (Victories) and Step 3 (Streak). Guided-only — Play never passes this. */
  reflectionsEnabled?: boolean
  /** How many reflection prompts to show (mom's `reflection_daily_count` preference). Defaults to 1. */
  reflectionDailyCount?: number
  /** PRD-25 Screen 4: adds text-to-speech icons to reflection prompts. */
  readingSupport?: boolean
}

type CelebrationStep = 'opener' | 'victories' | 'reflections' | 'streak' | 'theme' | 'close'

export function DailyCelebration({
  shell,
  memberId,
  familyId,
  memberName,
  onClose,
  reflectionsEnabled = false,
  reflectionDailyCount = 1,
  readingSupport = false,
}: DailyCelebrationProps) {
  const isPlay = shell === 'play'
  const minTouch = isPlay ? 56 : 48

  // ─── Data ─────────────────────────────────────────────────
  const { data: todaysVictories = [], isLoading } = useVictories(memberId, { period: 'today' })
  const { selectedVoice } = useVoicePreference(familyId, memberId, shell)
  const saveCelebrationMutation = useSaveCelebration()
  const createVictory = useCreateVictory()

  // ─── GDCX Slice 3: Steps 3 (Streak) + 4 (Theme) real data ──
  const { data: memberStreak } = useMemberStreak(memberId)
  const streakCount = memberStreak?.currentStreak ?? 0
  const { data: gamConfig } = useGamificationConfig(memberId)
  // PRD-25 §Edge Cases: gamification disabled → Step 4 (Theme Progress) is
  // skipped. Streak (Step 3) is NOT gamification-gated — compute_streak
  // measures consistency independent of the points/rewards economy, and the
  // PRD explicitly lists only Step 4 as skipped when gamification is off.
  const gamificationEnabled = gamConfig?.enabled === true
  const { data: stickerBookState } = useStickerBookState(memberId)
  const { data: creatures = [] } = useCreaturesForMember(memberId)
  const showThemeStep = gamificationEnabled && stickerBookState?.is_enabled === true

  // ─── State ────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<CelebrationStep>('opener')
  const [showConfetti, setShowConfetti] = useState(true)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [localVictories, setLocalVictories] = useState<Victory[]>([])
  const [sharedWithMom, setSharedWithMom] = useState(false)
  const [showSaveSparkle, setShowSaveSparkle] = useState(false)
  // ─── HITM state (SCOPE-8a.F6) ────────────────────────────
  // Narrative is shown to the child during the ceremony (ephemeral) but must
  // not persist to victory_celebrations until explicitly approved. Reject
  // clears the narrative; Regenerate re-calls the Edge Function. In Play
  // shell, Edit is not exposed (read-only for the youngest members).
  const [narrativeApproved, setNarrativeApproved] = useState(false)
  const [narrativeRejected, setNarrativeRejected] = useState(false)
  const [isEditingNarrative, setIsEditingNarrative] = useState(false)
  const [narrativeDraft, setNarrativeDraft] = useState('')

  // Sync victories when loaded
  useEffect(() => {
    if (todaysVictories.length > 0) {
      setLocalVictories(todaysVictories)
    }
  }, [todaysVictories])

  // GDCX Slice 3: Steps 2.5 (Reflections) and 4 (Theme) are conditional;
  // Step 3 (Streak) always runs (compute_streak isn't gated on gamification).
  const activeSteps = useMemo((): CelebrationStep[] => {
    const steps: CelebrationStep[] = ['opener', 'victories']
    if (reflectionsEnabled) steps.push('reflections')
    steps.push('streak')
    if (showThemeStep) steps.push('theme')
    steps.push('close')
    return steps
  }, [reflectionsEnabled, showThemeStep])

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
    // Clear any prior approval/rejection state for the new generation.
    setNarrativeApproved(false)
    setNarrativeRejected(false)
    setIsEditingNarrative(false)
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

  // ─── HITM handlers (SCOPE-8a.F6) ──────────────────────────
  // Convention #4: every AI output must pass through Edit / Approve /
  // Regenerate / Reject before persisting. Narrative is ephemeral until
  // narrativeApproved === true.
  function handleApproveNarrative() {
    setNarrativeApproved(true)
    setNarrativeRejected(false)
    setIsEditingNarrative(false)
  }

  function handleRegenerateNarrative() {
    setNarrative(null)
    setNarrativeApproved(false)
    setNarrativeRejected(false)
    setIsEditingNarrative(false)
    generateNarrative()
  }

  function handleRejectNarrative() {
    setNarrative(null)
    setNarrativeApproved(false)
    setNarrativeRejected(true)
    setIsEditingNarrative(false)
  }

  function handleStartEditNarrative() {
    setNarrativeDraft(narrative ?? '')
    setIsEditingNarrative(true)
  }

  function handleSaveEditNarrative() {
    const next = narrativeDraft.trim()
    if (next.length === 0) return
    setNarrative(next)
    setNarrativeApproved(true)
    setIsEditingNarrative(false)
  }

  function handleCancelEditNarrative() {
    setNarrativeDraft('')
    setIsEditingNarrative(false)
  }

  // ─── Share with Mom ───────────────────────────────────────
  async function handleShareWithMom() {
    if (!narrative || sharedWithMom) return
    // HITM gate: persistence requires explicit approval.
    if (!narrativeApproved) return
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
    // HITM gate (SCOPE-8a.F6): narrative persists ONLY if the child explicitly
    // approved it. Done without Approve = no save. Celebration itself still
    // closes. Rejected narrative is already cleared so the guard would skip.
    if (narrative && narrativeApproved && !sharedWithMom) {
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
            narrativeApproved={narrativeApproved}
            narrativeRejected={narrativeRejected}
            isEditingNarrative={isEditingNarrative}
            narrativeDraft={narrativeDraft}
            showRecordForm={showRecordForm}
            shell={shell}
            familyId={familyId}
            memberId={memberId}
            minTouch={minTouch}
            onToggleRecord={() => setShowRecordForm(!showRecordForm)}
            onRecordVictory={handleRecordVictory}
            onApproveNarrative={handleApproveNarrative}
            onRegenerateNarrative={handleRegenerateNarrative}
            onRejectNarrative={handleRejectNarrative}
            onStartEditNarrative={handleStartEditNarrative}
            onSaveEditNarrative={handleSaveEditNarrative}
            onCancelEditNarrative={handleCancelEditNarrative}
            onNarrativeDraftChange={setNarrativeDraft}
          />
        )}

        {currentStep === 'reflections' && (
          <StepReflections
            familyId={familyId}
            memberId={memberId}
            readingSupport={readingSupport}
            dailyCount={reflectionDailyCount}
            isPlay={isPlay}
            onSkip={goNext}
          />
        )}

        {currentStep === 'streak' && (
          <StepStreak streakCount={streakCount} isPlay={isPlay} />
        )}

        {currentStep === 'theme' && (
          <StepTheme
            creaturesCount={creatures.length}
            pagesCount={stickerBookState?.pages_unlocked_total ?? 0}
            isPlay={isPlay}
          />
        )}

        {currentStep === 'close' && (
          <StepClose
            isPlay={isPlay}
            hasNarrative={!!narrative}
            narrativeApproved={narrativeApproved}
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
          data-testid="celebration-back-button"
          aria-label="Previous step"
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
          data-testid="celebration-next-button"
          aria-label="Next step"
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
  narrativeApproved,
  narrativeRejected,
  isEditingNarrative,
  narrativeDraft,
  showRecordForm,
  shell,
  familyId,
  memberId,
  minTouch,
  onToggleRecord,
  onRecordVictory,
  onApproveNarrative,
  onRegenerateNarrative,
  onRejectNarrative,
  onStartEditNarrative,
  onSaveEditNarrative,
  onCancelEditNarrative,
  onNarrativeDraftChange,
}: {
  victories: Victory[]
  isPlay: boolean
  isLoading: boolean
  narrative: string | null
  narrativeLoading: boolean
  narrativeApproved: boolean
  narrativeRejected: boolean
  isEditingNarrative: boolean
  narrativeDraft: string
  showRecordForm: boolean
  shell: 'guided' | 'play'
  familyId: string
  memberId: string
  minTouch: number
  onToggleRecord: () => void
  onRecordVictory: (data: { description: string; lifeAreaTag: string | null; source: VictorySource }) => void
  onApproveNarrative: () => void
  onRegenerateNarrative: () => void
  onRejectNarrative: () => void
  onStartEditNarrative: () => void
  onSaveEditNarrative: () => void
  onCancelEditNarrative: () => void
  onNarrativeDraftChange: (next: string) => void
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

          {/* Narrative callout — Human-in-the-Mix gated (SCOPE-8a.F6). */}
          {narrativeLoading && (
            <div
              className="text-center text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Reflecting on your day...
            </div>
          )}
          {narrativeRejected && !narrativeLoading && (
            <div
              className="text-center text-sm"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              No written reflection today — your victories still count!
            </div>
          )}
          {narrative && !narrativeRejected && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 8%, var(--color-bg-card))',
                border: `1px solid color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) ${narrativeApproved ? 45 : 25}%, transparent)`,
              }}
            >
              {isEditingNarrative ? (
                <textarea
                  value={narrativeDraft}
                  onChange={e => onNarrativeDraftChange(e.target.value)}
                  rows={6}
                  className={`w-full rounded-lg px-3 py-2 ${isPlay ? 'text-base' : 'text-sm'} leading-relaxed resize-y`}
                  style={{
                    background: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border-default)',
                  }}
                />
              ) : (
                <p
                  className={`${isPlay ? 'text-base' : 'text-sm'} leading-relaxed`}
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {narrative}
                </p>
              )}

              {/* HITM action row — Edit/Approve/Regenerate/Reject. */}
              {/* Play shell is read-only (no Edit). Guided shell exposes all 4. */}
              <NarrativeHITM
                isPlay={isPlay}
                approved={narrativeApproved}
                isEditing={isEditingNarrative}
                onApprove={onApproveNarrative}
                onRegenerate={onRegenerateNarrative}
                onReject={onRejectNarrative}
                onStartEdit={onStartEditNarrative}
                onSaveEdit={onSaveEditNarrative}
                onCancelEdit={onCancelEditNarrative}
              />

              {narrativeApproved && !isEditingNarrative && (
                <p
                  className="text-xs text-center"
                  style={{ color: 'var(--color-sparkle-gold-dark, #B8942A)' }}
                >
                  {isPlay ? 'Saved when you tap Done!' : 'Ready to save on Done.'}
                </p>
              )}
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

// ─── Step 2.5: Reflections (GDCX Slice 3, PRD-25 Screen 6) ───
// Reuses the Write drawer's WriteDrawerReflections card pattern verbatim,
// tagged sourceContext='daily_celebration' so answers are distinguishable
// from Write-drawer-originated ones. "Skip" is always available — reflections
// are never forced (PRD: "reflections are never forced").
function StepReflections({
  familyId,
  memberId,
  readingSupport,
  dailyCount,
  isPlay,
  onSkip,
}: {
  familyId: string
  memberId: string
  readingSupport: boolean
  dailyCount: number
  isPlay: boolean
  onSkip: () => void
}) {
  return (
    <div className="w-full max-w-md space-y-4">
      <h2
        className={`text-center font-bold ${isPlay ? 'text-2xl' : 'text-xl'}`}
        style={{ color: 'var(--color-text-heading)' }}
      >
        Let&rsquo;s think about your day for a moment.
      </h2>
      <WriteDrawerReflections
        familyId={familyId}
        memberId={memberId}
        readingSupport={readingSupport}
        dailyCount={dailyCount}
        sourceContext="daily_celebration"
      />
      <button
        onClick={onSkip}
        className="w-full text-center text-sm py-2"
        style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none' }}
      >
        Skip
      </button>
    </div>
  )
}

// ─── Step 3: Streak Update (GDCX Slice 3) ────────────────────
// Runs regardless of the gamification toggle — compute_streak measures
// consistency of showing up, not points/rewards. Never shames a 0/1-day
// streak (celebration-only, Convention #180/#219 lineage) — reframes as an
// encouraging fresh start instead.
function StepStreak({ streakCount, isPlay }: { streakCount: number; isPlay: boolean }) {
  const hasStreak = streakCount >= 2
  return (
    <div className="text-center space-y-4 w-full max-w-sm">
      <Flame
        size={isPlay ? 56 : 40}
        className="mx-auto"
        style={{ color: 'var(--color-accent-warm, #f59e0b)' }}
      />
      <div
        className={`font-bold ${isPlay ? 'text-3xl' : 'text-xl'}`}
        style={{ color: 'var(--color-text-heading)' }}
      >
        {hasStreak ? `${streakCount}-day streak!` : "You're here today!"}
      </div>
      <p
        className={isPlay ? 'text-lg' : 'text-base'}
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {hasStreak
          ? 'Keep showing up — you’re building something great.'
          : 'Come back tomorrow and start a streak!'}
      </p>
    </div>
  )
}

// ─── Step 4: Theme Progress (GDCX Slice 3) ───────────────────
// Only rendered when gamification AND the sticker book (Build M) are both
// enabled for this member (PRD-25 §Edge Cases: skipped when gamification is
// off). Shows the same creature/page counts GuidedProgress's sticker book
// widget surfaces, condensed into a celebration step.
function StepTheme({
  creaturesCount,
  pagesCount,
  isPlay,
}: {
  creaturesCount: number
  pagesCount: number
  isPlay: boolean
}) {
  return (
    <div className="text-center space-y-4 w-full max-w-sm">
      <Sparkles
        size={isPlay ? 56 : 40}
        className="mx-auto"
        style={{ color: 'var(--color-sparkle-gold, #D4AF37)' }}
      />
      <div
        className={`font-bold ${isPlay ? 'text-3xl' : 'text-xl'}`}
        style={{ color: 'var(--color-text-heading)' }}
      >
        Your World is Growing!
      </div>
      <p
        className={isPlay ? 'text-lg' : 'text-base'}
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {creaturesCount} {creaturesCount === 1 ? 'creature' : 'creatures'} collected &middot; {pagesCount} {pagesCount === 1 ? 'page' : 'pages'} unlocked
      </p>
    </div>
  )
}

// ─── Narrative HITM action row (SCOPE-8a.F6) ─────────────────
// Shared by Guided + Play. Play shell is read-only (no Edit button).
// Kid-friendly copy per founder: "Yes, I love it!" replaces adult "Approve."
function NarrativeHITM({
  isPlay,
  approved,
  isEditing,
  onApprove,
  onRegenerate,
  onReject,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: {
  isPlay: boolean
  approved: boolean
  isEditing: boolean
  onApprove: () => void
  onRegenerate: () => void
  onReject: () => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
}) {
  const btnClass = `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${isPlay ? 'text-base' : 'text-sm'}`

  if (isEditing) {
    return (
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={onSaveEdit}
          className={btnClass}
          style={{
            backgroundColor: 'var(--color-sparkle-gold, #D4AF37)',
            color: '#fff',
          }}
        >
          <Check size={isPlay ? 18 : 14} />
          Save my edit
        </button>
        <button
          onClick={onCancelEdit}
          className={btnClass}
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <X size={isPlay ? 18 : 14} />
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
      <button
        onClick={onApprove}
        disabled={approved}
        className={btnClass}
        style={{
          backgroundColor: approved
            ? 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 15%, var(--color-bg-card))'
            : 'var(--color-sparkle-gold, #D4AF37)',
          color: approved ? 'var(--color-sparkle-gold-dark, #B8942A)' : '#fff',
          opacity: approved ? 0.85 : 1,
        }}
      >
        <Check size={isPlay ? 18 : 14} />
        {approved ? (isPlay ? 'Saved!' : 'Approved') : (isPlay ? 'Yes, I love it!' : 'Save my celebration!')}
      </button>

      {/* Edit — Guided only. Play shell is read-only for the youngest members. */}
      {!isPlay && (
        <button
          onClick={onStartEdit}
          className={btnClass}
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
          }}
        >
          <Pencil size={14} />
          Edit
        </button>
      )}

      <button
        onClick={onRegenerate}
        className={btnClass}
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
        }}
      >
        <RefreshCw size={isPlay ? 18 : 14} />
        {isPlay ? 'Try another one' : 'Regenerate'}
      </button>

      <button
        onClick={onReject}
        className={btnClass}
        style={{
          backgroundColor: 'transparent',
          color: 'var(--color-text-secondary)',
        }}
      >
        <X size={isPlay ? 18 : 14} />
        {isPlay ? 'No thanks' : 'Reject'}
      </button>
    </div>
  )
}

function StepClose({
  isPlay,
  hasNarrative,
  narrativeApproved,
  sharedWithMom,
  minTouch,
  onShareWithMom,
  onDone,
}: {
  isPlay: boolean
  hasNarrative: boolean
  narrativeApproved: boolean
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
        {/* Share with Mom — Guided only. HITM gate (SCOPE-8a.F6): disabled
            until the narrative is explicitly approved in Step 2. */}
        {!isPlay && hasNarrative && (
          <button
            onClick={onShareWithMom}
            disabled={sharedWithMom || !narrativeApproved}
            className={`w-full rounded-xl font-semibold flex items-center justify-center gap-2 py-3 transition-all`}
            style={{
              minHeight: minTouch,
              backgroundColor: sharedWithMom
                ? 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 15%, var(--color-bg-card))'
                : 'var(--color-bg-secondary)',
              color: sharedWithMom ? 'var(--color-sparkle-gold, #D4AF37)' : 'var(--color-text-secondary)',
              border: `1.5px solid ${sharedWithMom ? 'var(--color-sparkle-gold, #D4AF37)' : 'var(--color-border)'}`,
              opacity: !narrativeApproved && !sharedWithMom ? 0.5 : 1,
            }}
            title={!narrativeApproved && !sharedWithMom ? 'Approve the celebration first' : undefined}
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
