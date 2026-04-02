// PRD-11: Record a Victory modal — quick entry, NO AI on save, gold sparkle
import { useState, useRef } from 'react'
import { Trophy, ListPlus } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useCreateVictory } from '@/hooks/useVictories'
import { VICTORY_CATEGORIES, IMPORTANCE_OPTIONS } from '@/types/victories'
import type { VictoryImportance, MemberType } from '@/types/victories'

interface RecordVictoryProps {
  onClose: () => void
  onSaved: (origin?: { x: number; y: number }) => void
  memberId: string
  familyId: string
  memberType: MemberType
  defaultDescription?: string
  defaultSource?: string
}

export function RecordVictory({ onClose, onSaved, memberId, familyId, memberType, defaultDescription, defaultSource }: RecordVictoryProps) {
  const [description, setDescription] = useState(defaultDescription ?? '')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [importance, setImportance] = useState<VictoryImportance>('standard')
  const [bulkMode, setBulkMode] = useState(false)
  const saveButtonRef = useRef<HTMLButtonElement>(null)
  const createVictory = useCreateVictory()

  const lifeAreaTag = selectedCategory
    ? VICTORY_CATEGORIES.find(c => c.key === selectedCategory)?.tag ?? null
    : null

  async function handleSave() {
    const text = description.trim()
    if (!text) return

    const source = (defaultSource ?? 'manual') as import('@/types/victories').VictorySource

    if (bulkMode) {
      // Split by newlines, create separate victories for each line
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      for (const line of lines) {
        await createVictory.mutateAsync({
          family_id: familyId,
          family_member_id: memberId,
          description: line,
          life_area_tag: lifeAreaTag,
          member_type: memberType,
          importance,
          source,
        })
      }
    } else {
      await createVictory.mutateAsync({
        family_id: familyId,
        family_member_id: memberId,
        description: text,
        life_area_tag: lifeAreaTag,
        member_type: memberType,
        importance,
        source,
      })
    }

    // Get button position for sparkle origin
    const rect = saveButtonRef.current?.getBoundingClientRect()
    const origin = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : undefined

    onSaved(origin)
  }

  const canSave = description.trim().length > 0 && !createVictory.isPending

  return (
    <ModalV2
      id="record-victory"
      isOpen
      onClose={onClose}
      type="transient"
      size="md"
      title="Record a Victory"
      icon={Trophy}
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors"
            style={{
              color: bulkMode ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              background: bulkMode ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent',
            }}
          >
            <ListPlus size={14} />
            Bulk
          </button>
          <button
            ref={saveButtonRef}
            onClick={handleSave}
            disabled={!canSave}
            className="px-5 py-2 rounded-lg font-semibold text-sm transition-opacity"
            style={{
              background: 'var(--color-sparkle-gold, #D4AF37)',
              color: '#fff',
              opacity: canSave ? 1 : 0.5,
            }}
          >
            {createVictory.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Description */}
        <div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={bulkMode ? 'Enter one victory per line...' : 'What did you accomplish?'}
            rows={bulkMode ? 6 : 3}
            autoFocus
            className="w-full rounded-lg px-3 py-2.5 text-sm resize-none transition-colors"
            style={{
              background: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default)',
            }}
          />
        </div>

        {/* Quick-add Categories */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Category (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {VICTORY_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors border"
                style={{
                  background: selectedCategory === cat.key
                    ? 'var(--surface-primary)'
                    : 'transparent',
                  color: selectedCategory === cat.key
                    ? 'var(--color-text-on-primary, #fff)'
                    : 'var(--color-text-secondary)',
                  borderColor: 'var(--color-border-default)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Importance */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            How big is this?
          </p>
          <div className="flex gap-2">
            {IMPORTANCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setImportance(opt.value)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors border"
                style={{
                  background: importance === opt.value
                    ? 'var(--surface-primary)'
                    : 'transparent',
                  color: importance === opt.value
                    ? 'var(--color-text-on-primary, #fff)'
                    : 'var(--color-text-secondary)',
                  borderColor: 'var(--color-border-default)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalV2>
  )
}
