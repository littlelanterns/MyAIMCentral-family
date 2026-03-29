/**
 * Randomizer (PRD-09B + Smart Lists spec)
 *
 * For list_type='randomizer' lists.
 *
 * Features:
 * - Frequency-aware draw via useSmartDraw (respects caps, cooldowns, priority weighting)
 * - Category filter buttons
 * - Prominent [Draw] button
 * - Spinner/wheel animation on draw
 * - Result card with reward amount, frequency context
 * - [Assign to] member picker → creates a task for selected child
 * - [Re-draw] gets another random item
 * - Exhaustion state with next-available time
 *
 * Zero hardcoded hex colors. Lucide icons only. Mobile-first.
 */

import { useState, useMemo, useCallback } from 'react'
import { Shuffle, Package, Tag, Clock } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { RandomizerSpinner } from './RandomizerSpinner'
import { RandomizerResultCard } from './RandomizerResultCard'
import type { RandomizerItem } from './RandomizerResultCard'
import { FrequencyBadge } from './FrequencyRulesEditor'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { useSmartDraw, useSmartDrawCompletion, useListItemMemberTracking } from '@/hooks/useSmartDraw'
import { supabase } from '@/lib/supabase/client'
import type { ListItem, PoolMode } from '@/types/lists'

// ─── Types ────────────────────────────────────────────────

type RandomizerCategory = 'all' | string

interface RandomizerProps {
  listId: string
  listTitle: string
  familyId: string
  assigningMemberId: string
  items: ListItem[]
  eligibleMembers: FamilyMember[]
  poolMode?: PoolMode
  onItemAssigned?: (itemId: string, taskId: string) => void
}

// SPIN_DURATION matches RandomizerSpinner default
const SPIN_DURATION_MS = 2400

// ─── Category config ──────────────────────────────────────

function getCategoryLabel(cat: string): string {
  switch (cat) {
    case 'quick': return 'Quick'
    case 'medium': return 'Medium'
    case 'big': return 'Big'
    case 'connection': return 'Connection'
    default: return cat.charAt(0).toUpperCase() + cat.slice(1)
  }
}

function toRandomizerItem(item: ListItem): RandomizerItem {
  return {
    id: item.id,
    item_name: item.item_name || item.content,
    notes: item.notes,
    category: item.category,
    is_repeatable: item.is_repeatable,
    reward_amount: item.reward_amount,
  }
}

// ─── Component ───────────────────────────────────────────

export function Randomizer({
  listId,
  listTitle,
  familyId,
  assigningMemberId,
  items,
  eligibleMembers,
  poolMode = 'individual',
  onItemAssigned,
}: RandomizerProps) {
  const [selectedCategory, setSelectedCategory] = useState<RandomizerCategory>('all')
  const [spinning, setSpinning] = useState(false)
  const [drawnItem, setDrawnItem] = useState<RandomizerItem | null>(null)
  const [assigning, setAssigning] = useState(false)

  // Smart draw hooks
  const { data: memberTracking = [] } = useListItemMemberTracking(listId, assigningMemberId)
  const completeDraw = useSmartDrawCompletion()

  // Filter items by category first
  const categoryFilteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
      return true
    })
  }, [items, selectedCategory])

  // Smart draw engine
  const { draw, eligibleCount, exhausted, nextAvailableAt } = useSmartDraw(
    categoryFilteredItems,
    poolMode,
    assigningMemberId,
    memberTracking,
  )

  // Derive available categories from items
  const availableCategories = useMemo(() => {
    const cats = new Set<string>()
    items.forEach(item => {
      if (item.category) cats.add(item.category)
    })
    return Array.from(cats).sort()
  }, [items])

  const poolNames = categoryFilteredItems
    .filter(i => i.is_available)
    .map(i => i.item_name || i.content)

  const handleDraw = useCallback(() => {
    const result = draw(1)
    if (result.items.length === 0) return

    setDrawnItem(null)
    setSpinning(true)

    const winner = toRandomizerItem(result.items[0])

    setTimeout(() => {
      setSpinning(false)
      setDrawnItem(winner)
    }, SPIN_DURATION_MS)
  }, [draw])

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

      // Record completion via smart draw engine
      await completeDraw.mutateAsync({
        listItemId: item.id,
        memberId,
        listId,
        poolMode,
      })

      // Legacy: mark one-time items unavailable (completeDraw handles lifetime cap too)
      if (!item.is_repeatable) {
        await supabase
          .from('list_items')
          .update({ is_available: false })
          .eq('id', item.id)
      }

      onItemAssigned?.(item.id, taskData.id)
    } finally {
      setAssigning(false)
    }
  }, [familyId, assigningMemberId, onItemAssigned, completeDraw, listId, poolMode])

  // Format next available time
  const nextAvailableLabel = useMemo(() => {
    if (!nextAvailableAt) return null
    const next = new Date(nextAvailableAt)
    const now = new Date()
    const diffMs = next.getTime() - now.getTime()
    if (diffMs <= 0) return null

    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
    if (diffHours < 24) return `${diffHours}h`
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return `${diffDays}d`
  }, [nextAvailableAt])

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
            {eligibleCount} item{eligibleCount !== 1 ? 's' : ''} available
            {selectedCategory !== 'all' ? ` (${getCategoryLabel(selectedCategory)} only)` : ''}
            {categoryFilteredItems.length !== eligibleCount && ` of ${categoryFilteredItems.length} total`}
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
            disabled={exhausted}
            onClick={handleDraw}
            className="min-w-[200px]"
          >
            <Shuffle size={20} aria-hidden />
            {exhausted ? 'All caught up!' : 'Draw'}
          </Button>

          {exhausted && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
                {selectedCategory !== 'all'
                  ? `No available items in the "${getCategoryLabel(selectedCategory)}" category.`
                  : 'All items are on cooldown or at their frequency cap.'}
              </p>
              {nextAvailableLabel && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-btn-primary-bg)' }}>
                  <Clock size={12} />
                  <span>Next item available in ~{nextAvailableLabel}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Item list */}
      {!spinning && !drawnItem && categoryFilteredItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Tag size={14} aria-hidden style={{ color: 'var(--color-text-secondary)' }} />
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
              Draw pool
            </p>
          </div>
          {categoryFilteredItems.map(item => {
            const name = item.item_name || item.content
            const isEligible = item.is_available
            const freqRules = {
              frequency_min: item.frequency_min,
              frequency_max: item.frequency_max,
              frequency_period: item.frequency_period,
              cooldown_hours: item.cooldown_hours,
              lifetime_max: item.max_instances,
              reward_amount: item.reward_amount,
            }

            return (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  opacity: isEligible ? 1 : 0.5,
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
                  {name}
                </span>
                <FrequencyBadge rules={freqRules} />
                {item.reward_amount != null && (
                  <span className="text-xs font-medium" style={{ color: 'var(--color-btn-primary-bg)' }}>
                    ${item.reward_amount}
                  </span>
                )}
                {!item.is_repeatable && (
                  <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                    one-time
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── FilterChip ───────────────────────────────────────────

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
