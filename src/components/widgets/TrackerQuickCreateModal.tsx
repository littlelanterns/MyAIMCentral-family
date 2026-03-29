/**
 * TrackerQuickCreateModal — Fast path to create a dashboard tracker.
 *
 * Persistent modal (gradient header, minimizable) opened from QuickCreate FAB.
 * Title + quick-pick pills + visualization + assign + size.
 * "Add to Dashboard" creates widget, "Customize later →" opens full WidgetConfiguration.
 *
 * Spec: List-Task-Type-and-Tracker-Quick-Create-Spec.md Part 2
 * PRD-10 Screen 5 "Track This" flow in modal form.
 */

import { useState, useCallback } from 'react'
import {
  Droplets, BookOpen, Music, CheckSquare, Activity, BarChart3,
} from 'lucide-react'
import { ModalV2, Button } from '@/components/shared'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useCreateWidget } from '@/hooks/useWidgets'
import { useRoutingToast } from '@/components/shared/RoutingToastProvider'
import { getPhaseATrackers } from '@/types/widgets'
import type { PhaseATrackerType } from '@/types/widgets'

const QUICK_PICKS = [
  { label: 'Water', icon: Droplets, trackerType: 'tally' as PhaseATrackerType },
  { label: 'Reading', icon: BookOpen, trackerType: 'tally' as PhaseATrackerType },
  { label: 'Practice', icon: Music, trackerType: 'streak' as PhaseATrackerType },
  { label: 'Chores', icon: CheckSquare, trackerType: 'percentage' as PhaseATrackerType },
  { label: 'Exercise', icon: Activity, trackerType: 'streak' as PhaseATrackerType },
]

const SIZE_OPTIONS = [
  { key: 'sm' as const, label: 'S' },
  { key: 'md' as const, label: 'M' },
  { key: 'lg' as const, label: 'L' },
]

interface TrackerQuickCreateModalProps {
  isOpen: boolean
  onClose: () => void
}

// Map quick-create size keys to widget WidgetSize values
const SIZE_TO_WIDGET: Record<'sm' | 'md' | 'lg', import('@/types/widgets').WidgetSize> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
}

export function TrackerQuickCreateModal({ isOpen, onClose }: TrackerQuickCreateModalProps) {
  const { data: currentMember } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: familyMembers = [] } = useFamilyMembers(currentMember?.family_id)
  const phaseATrackers = getPhaseATrackers()
  const createWidget = useCreateWidget()
  const routingToast = useRoutingToast()

  const [title, setTitle] = useState('')
  const [trackerType, setTrackerType] = useState<PhaseATrackerType>('tally')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md')

  // Derive loading state from mutation
  const loading = createWidget.isPending

  // Default assignee to current member
  const effectiveAssigneeId = assigneeId || currentMember?.id || ''

  const selectedMeta = phaseATrackers.find(t => t.type === trackerType)

  const resetForm = () => {
    setTitle('')
    setTrackerType('tally')
    setAssigneeId('')
    setSize('md')
  }

  const handleAddToDashboard = useCallback(async () => {
    if (!title.trim() || !family?.id || !currentMember?.id) return
    createWidget.mutate(
      {
        family_id: family.id,
        family_member_id: effectiveAssigneeId || currentMember.id,
        template_type: trackerType,
        visual_variant: selectedMeta?.defaultVariant ?? null,
        title: title.trim(),
        size: SIZE_TO_WIDGET[size],
        position_x: 0,
        position_y: 0,
        widget_config: {},
        assigned_member_id: effectiveAssigneeId || currentMember.id,
      },
      {
        onSuccess: () => {
          routingToast.show({
            message: `"${title.trim()}" added to dashboard`,
            onUndo: () => {},
          })
          onClose()
          resetForm()
        },
      }
    )
  }, [title, trackerType, selectedMeta, effectiveAssigneeId, size, family, currentMember, createWidget, routingToast, onClose])

  const footer = (
    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => {
          // STUB: Would save then open WidgetConfiguration
          handleAddToDashboard()
        }}
        style={{
          color: 'var(--color-btn-primary-bg)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 'var(--font-size-sm)',
          minHeight: 'unset',
        }}
      >
        Customize later →
      </button>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          onClick={handleAddToDashboard}
          loading={loading}
          disabled={!title.trim()}
        >
          Add to Dashboard
        </Button>
      </div>
    </div>
  )

  return (
    <ModalV2
      id="tracker-create"
      isOpen={isOpen}
      onClose={onClose}
      type="persistent"
      size="sm"
      title="Track Something"
      icon={BarChart3}
      footer={footer}
    >
      <div className="density-comfortable" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Title input */}
        <div>
          <label
            style={{
              display: 'block',
              color: 'var(--color-text-primary)',
              fontWeight: 500,
              fontSize: 'var(--font-size-sm)',
              marginBottom: '0.375rem',
            }}
          >
            What do you want to track?
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Water intake, Reading minutes..."
            autoFocus
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
            }}
          />

          {/* Quick picks */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {QUICK_PICKS.map(pick => {
              const Icon = pick.icon
              return (
                <button
                  key={pick.label}
                  type="button"
                  onClick={() => {
                    setTitle(pick.label)
                    setTrackerType(pick.trackerType)
                  }}
                  className="btn-chip"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.625rem',
                    borderRadius: '999px',
                    border: `1px solid ${title === pick.label ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                    background: title === pick.label
                      ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
                      : 'var(--color-bg-secondary)',
                    color: title === pick.label ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                    fontSize: 'var(--font-size-xs)',
                    cursor: 'pointer',
                    minHeight: 'unset',
                  }}
                >
                  <Icon size={12} />
                  {pick.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Visualization picker */}
        <div>
          <label
            style={{
              display: 'block',
              color: 'var(--color-text-primary)',
              fontWeight: 500,
              fontSize: 'var(--font-size-sm)',
              marginBottom: '0.375rem',
            }}
          >
            Visualization
          </label>
          <select
            value={trackerType}
            onChange={(e) => setTrackerType(e.target.value as PhaseATrackerType)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
            }}
          >
            {phaseATrackers.map(t => (
              <option key={t.type} value={t.type}>{t.label}</option>
            ))}
          </select>
          {selectedMeta && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', marginTop: '0.25rem' }}>
              {selectedMeta.description}
            </p>
          )}
        </div>

        {/* Assign to */}
        <div>
          <label
            style={{
              display: 'block',
              color: 'var(--color-text-primary)',
              fontWeight: 500,
              fontSize: 'var(--font-size-sm)',
              marginBottom: '0.375rem',
            }}
          >
            Assign to
          </label>
          <select
            value={effectiveAssigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
            }}
          >
            {currentMember && (
              <option value={currentMember.id}>Me ({currentMember.display_name})</option>
            )}
            {familyMembers.filter(m => m.id !== currentMember?.id && m.is_active).map(m => (
              <option key={m.id} value={m.id}>{m.display_name}</option>
            ))}
          </select>
        </div>

        {/* Size */}
        <div>
          <label
            style={{
              display: 'block',
              color: 'var(--color-text-primary)',
              fontWeight: 500,
              fontSize: 'var(--font-size-sm)',
              marginBottom: '0.375rem',
            }}
          >
            Size
          </label>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {SIZE_OPTIONS.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSize(s.key)}
                className="btn-chip"
                style={{
                  flex: 1,
                  padding: '0.375rem',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  border: `1.5px solid ${size === s.key ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                  background: size === s.key
                    ? 'var(--surface-primary, var(--color-btn-primary-bg))'
                    : 'var(--color-bg-secondary)',
                  color: size === s.key ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                  fontWeight: size === s.key ? 600 : 400,
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalV2>
  )
}
