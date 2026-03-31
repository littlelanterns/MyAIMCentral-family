// PRD-10 Enhancement: Dinner Menu widget for Family Hub
// Inline editable text widget showing what's for dinner tonight

import { useState, useRef, useEffect } from 'react'
import { UtensilsCrossed, Pencil, Check } from 'lucide-react'
import type { DashboardWidget } from '@/types/widgets'

interface MenuWidgetProps {
  widget: DashboardWidget
  isCompact?: boolean
  onUpdateConfig?: (config: Record<string, unknown>) => void
}

interface MenuConfig {
  text?: string
  updated_at?: string
}

export function MenuWidget({ widget, isCompact, onUpdateConfig }: MenuWidgetProps) {
  const config = widget.widget_config as MenuConfig
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(config.text ?? '')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    const trimmed = editText.trim()
    if (trimmed !== (config.text ?? '')) {
      onUpdateConfig?.({
        ...widget.widget_config,
        text: trimmed,
        updated_at: new Date().toISOString(),
      })
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setEditText(config.text ?? '')
      setIsEditing(false)
    }
  }

  const menuText = config.text || ''
  const updatedAt = config.updated_at
    ? new Date(config.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  // Compact / small
  if (isCompact || widget.size === 'small') {
    return (
      <button
        onClick={() => { setEditText(menuText); setIsEditing(true) }}
        className="flex flex-col h-full items-center justify-center gap-1.5 text-center p-2 w-full"
      >
        <UtensilsCrossed size={18} style={{ color: 'var(--color-accent)' }} />
        {menuText ? (
          <div className="text-xs font-medium line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
            {menuText}
          </div>
        ) : (
          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Tap to set menu
          </div>
        )}
      </button>
    )
  }

  // Editing state
  if (isEditing) {
    return (
      <div className="flex flex-col h-full p-1 gap-2">
        <div className="flex items-center gap-1.5">
          <UtensilsCrossed size={14} style={{ color: 'var(--color-accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Tonight&apos;s Dinner
          </span>
        </div>
        <textarea
          ref={inputRef}
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder="What's for dinner?"
          className="flex-1 w-full rounded-md px-2 py-1.5 text-sm resize-none"
          style={{
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-accent)',
          }}
          maxLength={200}
        />
        <div className="flex justify-end">
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={handleSave}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
            style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
          >
            <Check size={12} />
            Save
          </button>
        </div>
      </div>
    )
  }

  // Medium display
  return (
    <button
      onClick={() => { setEditText(menuText); setIsEditing(true) }}
      className="flex flex-col h-full w-full text-left p-1 gap-2"
    >
      <div className="flex items-center gap-1.5">
        <UtensilsCrossed size={14} style={{ color: 'var(--color-accent)' }} />
        <span className="text-xs font-semibold flex-1" style={{ color: 'var(--color-text-primary)' }}>
          Tonight&apos;s Dinner
        </span>
        <Pencil size={12} style={{ color: 'var(--color-text-tertiary)' }} />
      </div>
      {menuText ? (
        <div className="flex-1">
          <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {menuText}
          </div>
          {updatedAt && (
            <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Updated {updatedAt}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Tap to set tonight&apos;s menu
          </div>
        </div>
      )}
    </button>
  )
}
