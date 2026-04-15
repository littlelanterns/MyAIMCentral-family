/**
 * StarChartWizard — Guided setup for star charts, sticker charts, and potty charts.
 *
 * Chains: name input + member picker → visual variant picker → target count →
 * optional reward reveal → deploy to dashboard.
 *
 * Uses existing WidgetConfiguration fields + AttachRevealSection + useCreateWidget.
 */

import { useState, useCallback } from 'react'
import { Star, Sparkles } from 'lucide-react'
import { SetupWizard, type WizardStep } from './SetupWizard'
import { AttachRevealSection, type RevealAttachmentConfig } from '@/components/reward-reveals/AttachRevealSection'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import { useCreateWidget } from '@/hooks/useWidgets'
import type { CreateWidget } from '@/types/widgets'

// Visual variants available for tally trackers that feel like "star charts"
const CHART_VISUALS = [
  { key: 'star_chart', label: 'Star Chart', description: 'Classic gold stars filling up a row' },
  { key: 'animated_star_chart', label: 'Animated Stars', description: 'Stars with sparkle animation on each add' },
  { key: 'animated_sticker_grid', label: 'Sticker Grid', description: 'Colorful stickers on a grid board' },
  { key: 'coin_jar', label: 'Coin Jar', description: 'Coins filling up a jar as progress grows' },
  { key: 'garden_growth', label: 'Garden', description: 'A garden that grows with each achievement' },
  { key: 'thermometer', label: 'Thermometer', description: 'Classic thermometer filling up to the goal' },
  { key: 'bubble_fill', label: 'Bubble Fill', description: 'Bubbles rising to fill a container' },
  { key: 'progress_bar', label: 'Progress Bar', description: 'Simple progress bar toward the goal' },
] as const

const STEPS: WizardStep[] = [
  { key: 'name', title: 'Name It' },
  { key: 'assign', title: 'Who' },
  { key: 'visual', title: 'Pick a Look' },
  { key: 'target', title: 'Set Goal' },
  { key: 'reward', title: 'Add Reward', optional: true },
]

interface StarChartWizardProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  familyMembers: Array<{
    id: string
    display_name: string
    is_active?: boolean
    calendar_color?: string | null
    assigned_color?: string | null
    member_color?: string | null
  }>
}

export function StarChartWizard({
  isOpen,
  onClose,
  familyId,
  memberId,
  familyMembers,
}: StarChartWizardProps) {
  const [step, setStep] = useState(0)

  // Step state
  const [chartName, setChartName] = useState('')
  const [assignedTo, setAssignedTo] = useState<string[]>([])
  const [visual, setVisual] = useState('star_chart')
  const [targetCount, setTargetCount] = useState(10)
  const [revealConfig, setRevealConfig] = useState<RevealAttachmentConfig | null>(null)

  const createWidget = useCreateWidget()
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)

  const reset = useCallback(() => {
    setStep(0)
    setChartName('')
    setAssignedTo([])
    setVisual('star_chart')
    setTargetCount(10)
    setRevealConfig(null)
    setDeployed(false)
    setIsDeploying(false)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const canAdvance = (() => {
    if (step === 0) return chartName.trim().length > 0
    if (step === 1) return assignedTo.length > 0
    return true
  })()

  const handleFinish = useCallback(async () => {
    if (isDeploying) return
    setIsDeploying(true)

    try {
      // Create one widget per assigned member
      for (const targetMemberId of assignedTo) {
        const targetMember = familyMembers.find(m => m.id === targetMemberId)
        const title = chartName.replace('[Name]', targetMember?.display_name ?? '')

        const widget: CreateWidget = {
          family_id: familyId,
          family_member_id: targetMemberId,
          template_type: 'tally',
          visual_variant: visual,
          title,
          size: 'medium',
          widget_config: {
            target: targetCount,
            unit_label: visual.includes('star') ? 'stars' : visual === 'coin_jar' ? 'coins' : 'points',
            ...(revealConfig ? { reveal_config: revealConfig } : {}),
          },
          assigned_member_id: targetMemberId !== memberId ? targetMemberId : undefined,
        }

        await createWidget.mutateAsync(widget)
      }
      setDeployed(true)
    } catch (err) {
      console.error('[StarChartWizard] Deploy failed:', err)
    } finally {
      setIsDeploying(false)
    }
  }, [isDeploying, assignedTo, chartName, familyMembers, familyId, visual, targetCount, revealConfig, memberId, createWidget])

  const activeMembers = familyMembers.filter(m => m.is_active !== false)

  // Deployed success screen
  if (deployed) {
    return (
      <SetupWizard
        id="star-chart-wizard"
        isOpen={isOpen}
        onClose={handleClose}
        title="Star Chart"
        steps={STEPS}
        currentStep={STEPS.length - 1}
        onBack={() => {}}
        onNext={() => {}}
        onFinish={handleClose}
        finishLabel="Done"
        hideNav
      >
        <div className="text-center py-8">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' }}
          >
            <Sparkles size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
          </div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Chart deployed!
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {assignedTo.length === 1
              ? `${chartName} is now on ${familyMembers.find(m => m.id === assignedTo[0])?.display_name ?? 'their'}'s dashboard.`
              : `${chartName} is now on ${assignedTo.length} dashboards.`
            }
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-2 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            Done
          </button>
        </div>
      </SetupWizard>
    )
  }

  return (
    <SetupWizard
      id="star-chart-wizard"
      isOpen={isOpen}
      onClose={handleClose}
      title="Star Chart Setup"
      subtitle="Create a visual progress tracker"
      steps={STEPS}
      currentStep={step}
      onBack={() => setStep(s => s - 1)}
      onNext={() => setStep(s => s + 1)}
      onFinish={handleFinish}
      canAdvance={canAdvance}
      canFinish={canAdvance}
      isFinishing={isDeploying}
      finishLabel="Deploy to Dashboard"
    >
      {/* Step 1: Name */}
      {step === 0 && (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            What are you tracking? Give it a name your child will understand.
            This creates a Tracker widget on their dashboard.
          </p>
          <input
            type="text"
            value={chartName}
            onChange={e => setChartName(e.target.value)}
            placeholder="e.g., Potty Stars, Reading Chart, Good Manners"
            className="w-full rounded-lg px-4 py-3 text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
            autoFocus
          />
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Tip: Use [Name] in the title and it will be replaced with each child's name.
          </p>
        </div>
      )}

      {/* Step 2: Assign */}
      {step === 1 && (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Who gets this chart? Pick one or more family members.
          </p>
          <MemberPillSelector
            members={activeMembers}
            selectedIds={assignedTo}
            onToggle={(id) => {
              setAssignedTo(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
              )
            }}
            showEveryone
            onToggleAll={() => {
              const allIds = activeMembers.map(m => m.id)
              setAssignedTo(prev =>
                prev.length === allIds.length ? [] : allIds
              )
            }}
            showSortToggle={false}
          />
        </div>
      )}

      {/* Step 3: Visual */}
      {step === 2 && (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            How should the chart look? These are the same visual styles you'll see in
            Trackers &amp; Widgets if you create one from scratch later.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CHART_VISUALS.map(v => (
              <button
                key={v.key}
                onClick={() => setVisual(v.key)}
                className="rounded-xl p-3 text-left transition-all"
                style={{
                  backgroundColor: visual === v.key
                    ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))'
                    : 'var(--color-bg-card)',
                  border: visual === v.key
                    ? '2px solid var(--color-btn-primary-bg)'
                    : '1px solid var(--color-border)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Star
                    size={16}
                    style={{
                      color: visual === v.key
                        ? 'var(--color-btn-primary-bg)'
                        : 'var(--color-text-muted)',
                    }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {v.label}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {v.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Target */}
      {step === 3 && (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            How many {visual.includes('star') ? 'stars' : visual === 'coin_jar' ? 'coins' : 'points'} to reach the goal?
          </p>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="number"
              min={1}
              max={100}
              value={targetCount}
              onChange={e => setTargetCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-24 rounded-lg px-4 py-3 text-center text-lg font-semibold outline-none"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {visual.includes('star') ? 'stars' : visual === 'coin_jar' ? 'coins' : 'points'} to earn the reward
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[5, 10, 15, 20, 30, 50].map(n => (
              <button
                key={n}
                onClick={() => setTargetCount(n)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: targetCount === n
                    ? 'var(--color-btn-primary-bg)'
                    : 'var(--color-bg-secondary)',
                  color: targetCount === n
                    ? 'var(--color-btn-primary-text)'
                    : 'var(--color-text-secondary)',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Reward (optional) */}
      {step === 4 && (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Add a celebration that plays along the way or when they finish.
            Pick multiple reveal styles and they'll rotate — a different surprise each time!
          </p>
          <AttachRevealSection
            value={revealConfig}
            onChange={setRevealConfig}
            familyId={familyId}
            showTriggerConfig={true}
            variant="section-card"
          />
          {!revealConfig && (
            <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
              No reward? That's fine too. The chart itself is the celebration.
            </p>
          )}
          {revealConfig && (
            <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
              Tip: set "Every N" to {Math.min(5, targetCount)} so they get a surprise every few {visual.includes('star') ? 'stars' : 'stickers'}, not just at the end.
              The chart keeps filling up — the reveal is just a bonus on top.
            </p>
          )}
        </div>
      )}
    </SetupWizard>
  )
}
