// PRD-10 Screen 5: Track This — 4-step streamlined flow
// Step 1: What are you tracking? (text + quick-pick pills)
// Step 2: Pick your visualization (carousel of templates)
// Step 3: Quick Configure (title, goal, assigned to, size)
// Step 4: Deploy to dashboard

import { useState, useMemo } from 'react'
import {
  Sparkles, ChevronRight, ChevronLeft, LayoutDashboard,
  Droplets, BookOpen, Dumbbell, Music, CheckSquare, Smile,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { ModalV2 } from '@/components/shared'
import type { CreateWidget, WidgetSize, TrackerType } from '@/types/widgets'
import { TRACKER_TYPE_REGISTRY, getTrackerMeta } from '@/types/widgets'

interface TrackThisModalProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  familyMembers: { id: string; display_name: string }[]
  onDeploy: (widget: CreateWidget) => void
  prefillText?: string
}

const QUICK_PICKS = [
  { label: 'Water intake', icon: Droplets, suggestedType: 'tally' as TrackerType, suggestedVariant: 'thermometer' },
  { label: 'Reading', icon: BookOpen, suggestedType: 'tally' as TrackerType, suggestedVariant: 'star_chart' },
  { label: 'Exercise', icon: Dumbbell, suggestedType: 'streak' as TrackerType, suggestedVariant: 'flame_counter' },
  { label: 'Practice', icon: Music, suggestedType: 'timer_duration' as TrackerType, suggestedVariant: 'time_bar_chart' },
  { label: 'Chores', icon: CheckSquare, suggestedType: 'percentage' as TrackerType, suggestedVariant: 'donut_ring' },
  { label: 'Mood', icon: Smile, suggestedType: 'mood_rating' as TrackerType, suggestedVariant: 'emoji_row_trend' },
]

function getLucideIcon(name: string): React.FC<{ size?: number }> | null {
  return (LucideIcons as unknown as Record<string, React.FC<{ size?: number }>>)[name] ?? null
}

export function TrackThisModal({
  isOpen,
  onClose,
  familyId,
  memberId,
  familyMembers,
  onDeploy,
  prefillText = '',
}: TrackThisModalProps) {
  const [step, setStep] = useState(1)
  const [trackingText, setTrackingText] = useState(prefillText)
  const [selectedType, setSelectedType] = useState<TrackerType | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState<number | null>(null)
  const [assignedTo, setAssignedTo] = useState(memberId)
  const [size, setSize] = useState<WidgetSize>('medium')

  // Reset state when modal opens
  const handleClose = () => {
    setStep(1)
    setTrackingText('')
    setSelectedType(null)
    setSelectedVariant(null)
    setTitle('')
    setGoal(null)
    setAssignedTo(memberId)
    setSize('medium')
    onClose()
  }

  // Sort tracker types by relevance to the entered text
  const sortedTrackerTypes = useMemo(() => {
    const q = trackingText.toLowerCase()
    if (!q) return TRACKER_TYPE_REGISTRY.filter(t => t.type !== 'color_reveal' && t.type !== 'gameboard')

    // Simple keyword matching for relevance
    const scored = TRACKER_TYPE_REGISTRY
      .filter(t => t.type !== 'color_reveal' && t.type !== 'gameboard')
      .map(t => {
        let score = 0
        if (t.label.toLowerCase().includes(q)) score += 10
        if (t.description.toLowerCase().includes(q)) score += 5
        // Quick pick matches
        const qp = QUICK_PICKS.find(p => p.label.toLowerCase().includes(q))
        if (qp && qp.suggestedType === t.type) score += 20
        return { ...t, score }
      })
      .sort((a, b) => b.score - a.score)
    return scored
  }, [trackingText])

  const handleQuickPick = (pick: typeof QUICK_PICKS[0]) => {
    setTrackingText(pick.label)
    setSelectedType(pick.suggestedType)
    setSelectedVariant(pick.suggestedVariant)
    setTitle(pick.label)
    setStep(3) // Skip to configure
  }

  const handleSelectType = (type: TrackerType, variant: string) => {
    setSelectedType(type)
    setSelectedVariant(variant)
    if (!title) setTitle(trackingText)
    setStep(3)
  }

  const handleDeploy = () => {
    if (!selectedType) return
    const widget: CreateWidget = {
      family_id: familyId,
      family_member_id: assignedTo,
      template_type: selectedType,
      visual_variant: selectedVariant,
      title: title || trackingText || 'My Tracker',
      size,
      widget_config: goal ? { target_number: goal } : {},
      assigned_member_id: assignedTo !== memberId ? assignedTo : undefined,
    }
    onDeploy(widget)
    handleClose()
  }

  const stepTitles = ['What are you tracking?', 'Pick your visualization', 'Quick configure', 'Done!']

  return (
    <ModalV2
      id="track-this"
      isOpen={isOpen}
      onClose={handleClose}
      type="transient"
      size="md"
      title="Track This"
      subtitle={stepTitles[step - 1]}
      icon={Sparkles}
    >
      <div className="p-4">
        {/* Step indicator */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: s <= step ? 'var(--color-accent)' : 'var(--color-bg-tertiary)' }}
            />
          ))}
        </div>

        {/* Step 1: What are you tracking? */}
        {step === 1 && (
          <div className="space-y-4">
            <input
              type="text"
              value={trackingText}
              onChange={e => setTrackingText(e.target.value)}
              placeholder="e.g. Water intake, Reading time, Daily mood..."
              autoFocus
              className="w-full px-4 py-3 rounded-lg text-sm"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-default)',
              }}
            />

            <div>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Quick picks</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {QUICK_PICKS.map(qp => (
                  <button
                    key={qp.label}
                    onClick={() => handleQuickPick(qp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border-default)',
                    }}
                  >
                    <qp.icon size={12} />
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { if (trackingText.trim()) { setTitle(trackingText); setStep(2) } }}
              disabled={!trackingText.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Pick your visualization */}
        {step === 2 && (
          <div className="space-y-3">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-xs mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <ChevronLeft size={14} />
              Back
            </button>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {sortedTrackerTypes.map(meta => {
                const Icon = getLucideIcon(meta.icon)
                const isSelected = selectedType === meta.type
                return (
                  <button
                    key={meta.type}
                    onClick={() => handleSelectType(meta.type, meta.defaultVariant)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                    style={{
                      background: isSelected ? 'color-mix(in srgb, var(--color-accent) 10%, var(--color-bg-primary))' : 'var(--color-bg-secondary)',
                      border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border-default)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-accent)' }}
                    >
                      {Icon ? <Icon size={20} /> : <LucideIcons.Box size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{meta.label}</div>
                      <div className="text-xs line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>{meta.description}</div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3: Quick configure */}
        {step === 3 && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 text-xs mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <ChevronLeft size={14} />
              Back
            </button>

            {/* Selected type badge */}
            {selectedType && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: 'var(--color-bg-secondary)' }}
              >
                {(() => { const Icon = getLucideIcon(getTrackerMeta(selectedType)?.icon ?? ''); return Icon ? <Icon size={14} /> : null })()}
                <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                  {getTrackerMeta(selectedType)?.label}
                </span>
              </div>
            )}

            <label className="block">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Title</span>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-default)',
                }}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Goal (optional)</span>
              <input
                type="number"
                value={goal ?? ''}
                onChange={e => setGoal(e.target.value ? Number(e.target.value) : null)}
                placeholder="Target number"
                className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-default)',
                }}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Assigned To</span>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-default)',
                }}
              >
                {familyMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.display_name}</option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Size</span>
              <div className="flex gap-2 mt-1">
                {(['small', 'medium', 'large'] as WidgetSize[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: size === s ? 'var(--surface-primary)' : 'var(--color-bg-secondary)',
                      color: size === s ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                      border: size === s ? 'none' : '1px solid var(--color-border-default)',
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleDeploy}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
            >
              <LayoutDashboard size={16} />
              Add to Dashboard
            </button>
          </div>
        )}
      </div>
    </ModalV2>
  )
}
