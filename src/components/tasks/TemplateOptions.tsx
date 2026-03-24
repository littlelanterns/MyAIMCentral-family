/**
 * TemplateOptions (PRD-09A Section 7)
 *
 * Save-as-template checkbox and template name field.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { Toggle, Input } from '@/components/shared'

interface TemplateOptionsProps {
  saveAsTemplate: boolean
  onSaveAsTemplateChange: (v: boolean) => void
  templateName: string
  onTemplateNameChange: (v: string) => void
}

export function TemplateOptions({
  saveAsTemplate,
  onSaveAsTemplateChange,
  templateName,
  onTemplateNameChange,
}: TemplateOptionsProps) {
  return (
    <div className="space-y-3">
      <div
        style={{
          padding: '0.75rem',
          borderRadius: 'var(--vibe-radius-input, 8px)',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Toggle
          checked={saveAsTemplate}
          onChange={onSaveAsTemplateChange}
          label="Save as a reusable template in your Studio library"
        />
      </div>

      {saveAsTemplate && (
        <Input
          label="Template name"
          value={templateName}
          onChange={(e) => onTemplateNameChange(e.target.value)}
          placeholder="e.g. Weekly Bedroom Clean, Daily Reading Practice…"
          required
        />
      )}
    </div>
  )
}
