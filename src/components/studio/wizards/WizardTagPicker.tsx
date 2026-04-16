/**
 * WizardTagPicker — Tag selector for wizard review/deploy steps.
 *
 * Pre-filled with tags from the wizard's category/preset. Mom can add
 * custom tags. Tags write to the created record's `tags` field.
 */

import { useState, useCallback } from 'react'
import { X, Plus, Tag } from 'lucide-react'

interface WizardTagPickerProps {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestedTags?: string[]
  label?: string
}

export function WizardTagPicker({
  tags,
  onChange,
  suggestedTags = [],
  label = 'Tags',
}: WizardTagPickerProps) {
  const [inputValue, setInputValue] = useState('')
  const [showInput, setShowInput] = useState(false)

  const addTag = useCallback(
    (tag: string) => {
      const normalized = tag.trim().toLowerCase().replace(/\s+/g, '_')
      if (normalized && !tags.includes(normalized)) {
        onChange([...tags, normalized])
      }
    },
    [tags, onChange],
  )

  const removeTag = useCallback(
    (tag: string) => {
      onChange(tags.filter((t) => t !== tag))
    },
    [tags, onChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault()
        if (inputValue.trim()) {
          addTag(inputValue)
          setInputValue('')
        }
      } else if (e.key === 'Escape') {
        setShowInput(false)
        setInputValue('')
      }
    },
    [inputValue, addTag],
  )

  // Suggested tags that aren't already selected
  const availableSuggestions = suggestedTags.filter((t) => !tags.includes(t))

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Tag size={14} style={{ color: 'var(--color-text-muted)' }} />
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {label}
        </span>
      </div>

      {/* Active tags */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {tag.replace(/_/g, ' ')}
            <button
              onClick={() => removeTag(tag)}
              className="hover:opacity-70 transition-opacity"
              aria-label={`Remove ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Add tag button / input */}
        {showInput ? (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) addTag(inputValue)
              setInputValue('')
              setShowInput(false)
            }}
            placeholder="Type tag..."
            autoFocus
            className="px-2.5 py-1 rounded-full text-xs outline-none"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              width: '120px',
            }}
          />
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-muted)',
              border: '1px dashed var(--color-border)',
            }}
          >
            <Plus size={12} />
            Add tag
          </button>
        )}
      </div>

      {/* Suggested tags */}
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span
            className="text-xs mr-1 self-center"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Suggestions:
          </span>
          {availableSuggestions.map((tag) => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className="px-2 py-0.5 rounded-full text-xs transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-text-muted)',
                border: '1px dashed var(--color-border)',
              }}
            >
              + {tag.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
