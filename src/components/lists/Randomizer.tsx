/**
 * Randomizer (PRD-09B, specs/studio-seed-templates.md)
 *
 * For list_type='randomizer' lists.
 *
 * Features:
 * - Shows all available items (is_available=true) grouped by category
 * - Category filter buttons (quick / medium / big / connection / all)
 * - Prominent [Draw] button
 * - Spinner/wheel animation on draw (CSS animation, 2-3 second spin)
 * - Result card reveals the selected item
 * - [Assign to] member picker → creates a task for selected child
 * - [Re-draw] gets another random item
 * - One-time items: set is_available=false after confirmed assignment
 * - Repeatable items: remain in pool after assignment
 *
 * Zero hardcoded hex colors. Lucide icons only. Mobile-first.
 */

import { useState, useMemo, useCallback } from 'react'
import { Shuffle, Package, Tag } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { RandomizerSpinner } from './RandomizerSpinner'
import { RandomizerResultCard } from './RandomizerResultCard'
import type { RandomizerItem } from './RandomizerResultCard'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { supabase } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────

type RandomizerCategory = 'all' | 'quick' | 'medium' | 'big' | 'connection' | string

interface RandomizerProps {
  listId: string
  listTitle: string
  familyId: string
  assigningMemberId: string
  items: RandomizerItem[]
  eligibleMembers: FamilyMember[]
  onItemAssigned?: (itemId: string, taskId: string) => void
}

// SPIN_DURATION matches RandomizerSpinner default
const SPIN_DURATION_MS = 2400

// ─── Category config ──────────────────────────────────────────────

const KNOWN_CATEGORIES = ['quick', 'medium', 'big', 'connection']

function getCategoryLabel(cat: string): string {
  switch (cat) {
    case 'quick': return 'Quick'
    case 'medium': return 'Medium'
    case 'big': return 'Big'
    case 'connection': return 'Connection'
    default: return cat.charAt(0).toUpperCase() + cat.slice(1)
  }
}

// ─── Component ───────────────────────────────────────────────────

export function Randomizer({
  listId,
  listTitle,
  familyId,
  assigningMemberId,
  items,
  eligibleMembers,
  onItemAssigned,
}: RandomizerProps) {
  const [selectedCategory, setSelectedCategory] = useState<RandomizerCategory>('all')
  const [spinning, setSpinning] = useState(false)
  const [drawnItem, setDrawnItem] = useState<RandomizerItem | null>(null)
  const [assigning, setAssigning] = useState(false)

  // Derive available categories from items
  const availableCategories = useMemo(() => {
    const cats = new Set<string>()
    items.forEach(item => {
      if (item.category) cats.add(item.category)
    })
    return Array.from(cats).sort()
  }, [items])

  // Items in the draw pool filtered by category
  const poolItems = useMemo(() => {
    return items.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
      return true
    })
  }, [items, selectedCategory])

  const poolNames = poolItems.map(i => i.item_name)

  const handleDraw = useCallback(() => {
    if (poolItems.length === 0) return

    setDrawnItem(null)
    setSpinning(true)

    // Pick winner before animation starts so spinner can display it at end
    const winner = poolItems[Math.floor(Math.random() * poolItems.length)]

    // Let the spinner run for SPIN_DURATION_MS, then reveal
    setTimeout(() => {
      setSpinning(false)
      setDrawnItem(winner)
    }, SPIN_DURATION_MS)
  }, [poolItems])

  const handleRedraw = useCallback(() => {
    setDrawnItem(null)
  }, [])

  const handleAssign = useCallback(async (
    item: RandomizerItem,
    memberId: string
  ) => {
    setAssigning(true)

    try {
      // Create a task for the selected child
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          family_id: familyId,
          created_by: assigningMemberId,
          assignee_id: memberId,
          title: item.item_name,
          description: item.notes ?? null,
          task_type: 'task',
          status: 'pending',
          source: 'randomizer_draw',
          source_reference_id: item.id,
        })
        .select('id')
        .single()

      if (taskError || !taskData) throw taskError ?? new Error('Failed to create task')

      // If the item is one-time, mark it as unavailable
      if (!item.is_repeatable) {
        const { error: updateError } = await supabase
          .from('list_items')
          .update({ is_available: false })
          .eq('id', item.id)

        if (updateError) throw updateError
      }

      onItemAssigned?.(item.id, taskData.id)
    } finally {
      setAssigning(false)
    }
  }, [familyId, assigningMemberId, onItemAssigned])

  const emptyPool = poolItems.length === 0

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Package
          size={20}
          aria-hidden
          style={{ color: 'var(--color-btn-primary-bg)' }}
        />
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            {listTitle}
          </h2>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {poolItems.length} item{poolItems.length !== 1 ? 's' : ''} in draw pool
            {selectedCategory !== 'all' ? ` (${getCategoryLabel(selectedCategory)} only)` : ''}
          </p>
        </div>
      </div>

      {/* Category filter */}
      {availableCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <FilterChip
            label="All"
            active={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
          />
          {availableCategories.map(cat => (
            <FilterChip
              key={cat}
              label={getCategoryLabel(cat)}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </div>
      )}

      {/* Draw area */}
      {(spinning || drawnItem) ? (
        <div className="flex flex-col items-center gap-4">
          <RandomizerSpinner
            items={poolNames}
            finalItem={drawnItem?.item_name ?? null}
            spinning={spinning}
            duration={SPIN_DURATION_MS}
          />

          {drawnItem && (
            <RandomizerResultCard
              item={drawnItem}
              eligibleMembers={eligibleMembers}
              onAssign={handleAssign}
              onRedraw={handleRedraw}
              assigning={assigning}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4">
          <Button
            variant="primary"
            size="lg"
            disabled={emptyPool}
            onClick={handleDraw}
            className="min-w-[200px]"
          >
            <Shuffle size={20} aria-hidden />
            {emptyPool ? 'No items available' : 'Draw'}
          </Button>

          {emptyPool && (
            <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
              {selectedCategory !== 'all'
                ? `No available items in the "${getCategoryLabel(selectedCategory)}" category.`
                : 'All items have been used or marked unavailable.'}
            </p>
          )}
        </div>
      )}

      {/* Item list */}
      {!spinning && !drawnItem && poolItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Tag size={14} aria-hidden style={{ color: 'var(--color-text-secondary)' }} />
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
              Draw pool
            </p>
          </div>
          {poolItems.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {item.category && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 capitalize"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-accent, var(--color-btn-primary-bg)) 15%, var(--color-bg-card))',
                    color: 'var(--color-accent, var(--color-btn-primary-bg))',
                  }}
                >
                  {getCategoryLabel(item.category)}
                </span>
              )}
              <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
                {item.item_name}
              </span>
              {!item.is_repeatable && (
                <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                  one-time
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── FilterChip ───────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
      style={{
        backgroundColor: active
          ? 'var(--color-btn-primary-bg)'
          : 'var(--color-bg-secondary)',
        color: active
          ? 'var(--color-btn-primary-text, #fff)'
          : 'var(--color-text-secondary)',
        border: `1px solid ${active ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
