/**
 * Worker ROUTINE-PROPAGATION (c3, founder D3) — master-template edit
 * confirmation modal.
 *
 * Shown when mom saves a master-template edit that has 1+ active
 * deployments. Per founder D3 (count + names): the modal shows the
 * affected family members by name so mom knows exactly who's getting
 * the change. Past completions stay as-is — only future routine days
 * reflect the new structure.
 *
 * Naming: NO "kid" or "child" anywhere in copy. "Family members" /
 * "[Names]" exclusively (founder requirement).
 */

import { Layers } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Button } from '@/components/shared'

export interface MasterTemplateEditConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  /** Distinct affected family member names, already formatted for display */
  affectedNames: string[]
  /** Distinct affected family member count */
  affectedCount: number
  /** Master template title — for the modal copy */
  templateName: string
  /** Called when mom confirms the edit propagation */
  onConfirm: () => void
  /** Called when mom cancels */
  onCancel: () => void
}

function formatNameList(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

export function MasterTemplateEditConfirmationModal({
  isOpen,
  onClose,
  affectedNames,
  affectedCount,
  templateName,
  onConfirm,
  onCancel,
}: MasterTemplateEditConfirmationModalProps) {
  const nameList = formatNameList(affectedNames)
  const routineWord = affectedCount === 1 ? 'routine' : 'routines'

  return (
    <ModalV2
      id="master-template-edit-confirmation"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="sm"
      title="Update active routines?"
      subtitle={templateName}
      icon={Layers}
    >
      <div className="p-4 flex flex-col gap-4">
        <div
          className="text-sm"
          style={{ color: 'var(--color-text-primary)' }}
        >
          This will update {affectedCount} active {routineWord}
          {nameList ? ': ' : '.'}
          {nameList && (
            <strong style={{ color: 'var(--color-text-heading)' }}>
              {nameList}
            </strong>
          )}
          {nameList && '.'}
        </div>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Past completions stay as-is — only future routine days reflect
          the change.
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <Button variant="primary" onClick={onConfirm}>
            Update template
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </ModalV2>
  )
}
