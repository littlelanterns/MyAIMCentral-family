import { useState } from 'react'
import { Copy, Check, Loader2 } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Button } from '@/components/shared'
import { supabase } from '@/lib/supabase/client'
import { cloneListTemplate } from '@/lib/templates/cloneListTemplate'
import { useRoutingToast } from '@/components/shared/RoutingToastProvider'

export interface ListDuplicateDialogProps {
  isOpen: boolean
  onClose: () => void
  sourceTemplateId: string
  sourceTemplateName: string
  familyId: string
  createdBy: string
  onDuplicated?: (newTemplateId: string) => void
}

export function ListDuplicateDialog({
  isOpen,
  onClose,
  sourceTemplateId,
  sourceTemplateName,
  familyId,
  createdBy,
  onDuplicated,
}: ListDuplicateDialogProps) {
  const [newName, setNewName] = useState(`${sourceTemplateName} (copy)`)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const routingToast = useRoutingToast()

  async function handleSave() {
    const trimmed = newName.trim()
    if (!trimmed) {
      setError('Pick a name for the duplicate.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const result = await cloneListTemplate(supabase, {
        sourceTemplateId,
        newTitle: trimmed,
        familyId,
        createdBy,
      })
      routingToast.show({
        message: `Duplicated as "${trimmed}" — find it in My Customized.`,
      })
      onDuplicated?.(result.newTemplateId)
      onClose()
    } catch (err) {
      console.error('[ListDuplicateDialog] clone failed:', err)
      setError('Could not duplicate the template. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalV2
      id="list-duplicate-template"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="sm"
      title="Duplicate list template"
      subtitle={sourceTemplateName}
      icon={Copy}
    >
      <div className="p-4 flex flex-col gap-4">
        <p
          className="text-sm"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Creates a copy in My Customized. The original stays unchanged.
        </p>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="duplicate-list-template-name"
            className="text-xs font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Name
          </label>
          <input
            id="duplicate-list-template-name"
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
