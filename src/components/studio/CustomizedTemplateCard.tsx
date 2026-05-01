/**
 * CustomizedTemplateCard (PRD-09B Screen 1 — My Customized tab)
 *
 * Card for a family-owned customized template. Shows:
 * - Template name + type badge
 * - Deployment status: "Assigned to: [names]", "Unassigned", "N active deployments"
 * - Last deployed date
 * - [Deploy] [Edit] [Duplicate] [Archive] action buttons
 */

import { useState } from 'react'
import { Calendar, Users, Unlink, Copy, Archive, Edit2, Play, MoreHorizontal } from 'lucide-react'
import type { StudioTemplateType } from './StudioTemplateCard'
import { ScheduledStartBadge } from '@/components/templates/ScheduledStartBadge'
import { PendingChangesBadge } from '@/components/templates/PendingChangesBadge'

export interface CustomizedTemplate {
  id: string
  name: string
  templateType: StudioTemplateType
  /** Display names of assigned members */
  assignedTo: string[]
  /** Count of active deployed copies */
  activeDeployments: number
  lastDeployedAt: string | null
  createdAt: string
  /**
   * Worker ROUTINE-PROPAGATION (c5): earliest future dtstart across
   * active deployments of this template. NULL when no future-scheduled
   * deployments exist. Drives the "Scheduled to start" badge in the
   * card header so mom sees at a glance which routines are queued
   * but not yet active.
   */
  nextScheduledStart?: string | null
}

interface CustomizedTemplateCardProps {
  template: CustomizedTemplate
  onDeploy: (template: CustomizedTemplate) => void
  onEdit: (template: CustomizedTemplate) => void
  onDuplicate: (template: CustomizedTemplate) => void
  onArchive: (template: CustomizedTemplate) => void
}

const TYPE_LABELS: Record<StudioTemplateType, string> = {
  task: 'Task',
  routine: 'Routine',
  opportunity_claimable: 'Opportunity',
  opportunity_repeatable: 'Opportunity',
  opportunity_capped: 'Opportunity',
  sequential: 'Sequential',
  randomizer: 'Randomizer',
  guided_form: 'Guided Form',
  guided_form_sodas: 'SODAS',
  guided_form_what_if: 'What-If',
  guided_form_apology_reflection: 'Apology Reflection',
  list_shopping: 'Shopping List',
  list_wishlist: 'Wishlist',
  list_packing: 'Packing List',
  list_expenses: 'Expense Tracker',
  list_todo: 'To-Do List',
  list_custom: 'Custom List',
  // Gamification & Rewards
  gamification_setup: 'Gamification',
  gamification_creatures: 'Gamification',
  gamification_pages: 'Gamification',
  gamification_segments: 'Segments',
  gamification_coloring: 'Coloring Reveal',
  reward_reveal: 'Reward Reveal',
  widget_tally: 'Star Chart',
  widget_randomizer_spinner: 'Reward Spinner',
  // Growth & Wizards
  self_knowledge_wizard: 'Self Knowledge',
  best_intentions_wizard: 'Best Intentions',
  routine_builder_wizard: 'Routine Builder',
  meeting_setup_wizard: 'Meeting Setup',
  list_wizard: 'List',
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Never'
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function deploymentStatus(template: CustomizedTemplate): string {
  if (template.assignedTo.length > 0) {
    if (template.assignedTo.length <= 3) {
      return `Assigned to: ${template.assignedTo.join(', ')}`
    }
    return `Assigned to ${template.assignedTo.length} members`
  }
  if (template.activeDeployments > 0) {
    return `${template.activeDeployments} active deployment${template.activeDeployments === 1 ? '' : 's'}`
  }
  return 'Unassigned'
}

export function CustomizedTemplateCard({
  template,
  onDeploy,
  onEdit,
  onDuplicate,
  onArchive,
}: CustomizedTemplateCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const status = deploymentStatus(template)
  const isAssigned = template.assignedTo.length > 0 || template.activeDeployments > 0

  return (
    <div
      className="rounded-xl border p-4 transition-shadow"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Top row: name + type badge */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-sm leading-snug"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            {template.name}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {TYPE_LABELS[template.templateType] ?? template.templateType}
            </span>
            {/* Worker ROUTINE-PROPAGATION (c5): "Scheduled to start"
                badge when ANY active deployment of this template has a
                future dtstart. Returns null otherwise. */}
            <ScheduledStartBadge
              dtstart={template.nextScheduledStart}
              size="full"
            />
            <PendingChangesBadge
              sourceType="routine_template"
              sourceId={template.id}
            />
          </div>
        </div>

        {/* Overflow menu */}
        <div className="relative shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(m => !m) }}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="More options"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div
                className="absolute right-0 top-7 z-20 rounded-xl border shadow-lg min-w-[140px] py-1"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                }}
              >
                {[
                  { label: 'Edit', icon: <Edit2 size={14} />, action: () => { onEdit(template); setMenuOpen(false) } },
                  { label: 'Duplicate', icon: <Copy size={14} />, action: () => { onDuplicate(template); setMenuOpen(false) } },
                  { label: 'Archive', icon: <Archive size={14} />, action: () => { onArchive(template); setMenuOpen(false) } },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span style={{ color: 'var(--color-text-secondary)' }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Deployment status */}
      <div className="flex items-center gap-1.5 mb-2">
        {isAssigned ? (
          <Users size={13} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }} />
        ) : (
          <Unlink size={13} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
        )}
        <p
          className="text-xs"
          style={{ color: isAssigned ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
        >
          {status}
        </p>
      </div>

      {/* Last deployed date */}
      {template.lastDeployedAt && (
        <div className="flex items-center gap-1.5 mb-3">
          <Calendar size={13} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Last deployed: {formatDate(template.lastDeployedAt)}
          </p>
        </div>
      )}

      {/* Deploy button */}
      <button
        onClick={() => onDeploy(template)}
        className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors"
        style={{
          backgroundColor: 'var(--color-btn-primary-bg)',
          color: 'var(--color-btn-primary-text)',
        }}
      >
        <Play size={13} />
        Deploy
      </button>
    </div>
  )
}
