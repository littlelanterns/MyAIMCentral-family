/**
 * Worker ROUTINE-PROPAGATION (c4, founder D4) — "Copy and Customize"
 * dialog.
 *
 * Lives under src/components/templates/ (D6 Thread 1) so the future
 * Worker 2 SHARED-ROUTINES + Worker 3 SHARED-LISTS can reuse the
 * same shared template UI folder.
 *
 * Lands the duplicate in My Customized as an INDEPENDENT template
 * (no link to the original — edits to the original do NOT flow
 * to the duplicate). Mom can then rename and edit the duplicate
 * before assigning to anyone.
 *
 * Distinct from the existing RoutineDuplicateDialog which forces a
 * target member pick + immediate deploy.
 *
 * Naming requirement: NO "kid" or "child" anywhere in copy.
 */

import { useState } from 'react'
import { Copy, Check, Loader2 } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Button } from '@/components/shared'
import { supabase } from '@/lib/supabase/client'
import { cloneRoutineTemplate } from '@/lib/templates/cloneRoutineTemplate'

export interface RoutineDuplicateTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  /** The source template to duplicate */
  sourceTemplateId: string
  /** Current template name — used to seed the rename input */
  sourceTemplateName: string
  familyId: string
  createdBy: string
  /** Called with the new template id after a successful clone */
  onDuplicated?: (newTemplateId: string) => void
}

export function RoutineDuplicateTemplateDialog({
  isOpen,
  onClose,
  sourceTemplateId,
  sourceTemplateName,
  familyId,
  createdBy,
  onDuplicated,
}: RoutineDuplicateTemplateDialogProps) {
  const [newName, setNewName] = useState(`${sourceTemplateName} (copy)`)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    const trimmed = newName.trim()
    if (!trimmed) {
      setError('Pick a name for the duplicate.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const result = await cloneRoutineTemplate(supabase, {
        sourceTemplateId,
        newTitle: trimmed,
        familyId,
        createdBy,
      })
      onDuplicated?.(result.newTemplateId)
      onClose()
    } catch (err) {
      console.error('[RoutineDuplicateTemplateDialog] clone failed:', err)
      setError('Could not duplicate the template. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalV2
      id="routine-duplicate-as-template"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="sm"
      title="Copy and Customize"
      subtitle={sourceTemplateName}
      icon={Copy}
    >
      <div className="p-4 flex flex-col gap-4">
        <p
          className="text-sm"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Lands in My Customized as a fresh template. Rename it, tweak
          the steps, and assign to a family member when you're ready.
          Edits to the original won't flow to this copy.
        </p>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="duplicate-template-name"
            className="text-xs font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Name
          </label>
          <input
            id="duplicate-template-name"
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Template name"
            disabled={saving}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm, 0.875rem)',
              outline: 'none',
            }}
          />
        </div>

        {error && (
          <p
            className="text-xs"
            style={{ color: 'var(--color-error, var(--color-text-error))' }}
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Duplicating…
              </>
            ) : (
              <>
                <Check size={14} />
                Save as new template
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </ModalV2>
  )
}
