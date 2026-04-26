/**
 * Worker ROUTINE-PROPAGATION (c4, founder D4) — "What would you like
 * to do?" chooser dialog.
 *
 * Single entry point per Convention #255. Tap "Duplicate" on a
 * customized template card → this dialog → mom picks one of two
 * paths:
 *
 *   1. Copy and Customize — lands in My Customized as a fresh
 *      template. Mom renames + tweaks before assigning to anyone.
 *      Opens RoutineDuplicateTemplateDialog.
 *
 *   2. Assign Additional Member — pick a family member and deploy a
 *      copy of this routine to them right now.
 *      Opens RoutineDuplicateDialog (existing flow).
 *
 * Naming requirement: NO "kid" or "child" anywhere — these flows
 * also serve mom and dad (founder explicit requirement).
 */

import { Copy, UserPlus, Layers } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'

export type RoutineDuplicateChoice = 'copy_template' | 'assign_member'

export interface RoutineDuplicateChooserDialogProps {
  isOpen: boolean
  onClose: () => void
  /** Template name — appears in the modal title */
  templateName: string
  /** Called when mom picks an option. Caller routes to the right flow. */
  onChoice: (choice: RoutineDuplicateChoice) => void
}

export function RoutineDuplicateChooserDialog({
  isOpen,
  onClose,
  templateName,
  onChoice,
}: RoutineDuplicateChooserDialogProps) {
  return (
    <ModalV2
      id="routine-duplicate-chooser"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="sm"
      title={`What would you like to do with ${templateName}?`}
      icon={Layers}
    >
      <div className="p-4 flex flex-col gap-3">
        <ChoiceCard
          icon={Copy}
          title="Copy and Customize"
          subtitle="Lands in My Customized. You can rename and tweak it before assigning to anyone."
          onClick={() => onChoice('copy_template')}
        />
        <ChoiceCard
          icon={UserPlus}
          title="Assign Additional Member"
          subtitle="Pick a family member and deploy a copy of this routine to them right now."
          onClick={() => onChoice('assign_member')}
        />
      </div>
    </ModalV2>
  )
}

function ChoiceCard({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ComponentType<{ size: number }>
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--vibe-radius-input, 8px)',
        backgroundColor: 'var(--color-bg-card)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: '0.5rem',
          backgroundColor:
            'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
          flexShrink: 0,
          marginTop: '0.125rem',
        }}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <div
          style={{
            fontWeight: 600,
            fontSize: 'var(--font-size-sm, 0.875rem)',
            color: 'var(--color-text-primary)',
            marginBottom: '0.25rem',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 'var(--font-size-xs, 0.75rem)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>
      </div>
    </button>
  )
}
