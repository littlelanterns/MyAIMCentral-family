/**
 * SmartImportModal — Multi-list smart import with AI classification.
 *
 * Flow:
 * 1. Mom pastes text (activities, chores, ideas)
 * 2. AI classifies each item into the best-matching existing list
 * 3. Mom reviews per-item assignments, overrides as needed
 * 4. Items that don't fit get "create new list" suggestions
 * 5. Bulk commit adds items to their respective lists
 *
 * Uses the smart-list-import Edge Function (Haiku).
 */

import { useState, useMemo } from 'react'
import { Loader2, Check, Plus, Sparkles, ArrowRight } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Button } from '@/components/shared/Button'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import type { List } from '@/types/lists'

// ── Types ────────────────────────────────────────────────

interface ClassifiedItem {
  text: string
  notes: string | null
  target_list_id: string | null
  target_list_title: string | null
  suggested_new_list: string | null
  confidence: 'high' | 'medium' | 'low'
  reward_type: 'money' | 'points' | 'privilege' | null
  reward_amount: number | null
  category: string | null
  sort_order: number
  // UI state (not from AI)
  accepted: boolean
  overridden_list_id?: string | null
  overridden_list_title?: string | null
}

interface SuggestedNewList {
  title: string
  description?: string
  item_count?: number
  created_id?: string // filled after creation
}

interface SmartImportModalProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  existingLists: List[]
}

// ── Component ────────────────────────────────────────────

export function SmartImportModal({
  isOpen,
  onClose,
  familyId,
  memberId,
  existingLists,
}: SmartImportModalProps) {
  const queryClient = useQueryClient()

  // Phase: 'input' | 'classifying' | 'review' | 'committing' | 'done'
  const [phase, setPhase] = useState<'input' | 'classifying' | 'review' | 'committing' | 'done'>('input')
  const [rawText, setRawText] = useState('')
  const [sourceContext, setSourceContext] = useState('')
  const [items, setItems] = useState<ClassifiedItem[]>([])
  const [suggestedLists, setSuggestedLists] = useState<SuggestedNewList[]>([])
  const [error, setError] = useState<string | null>(null)
  const [commitResults, setCommitResults] = useState<{ listsUpdated: number; itemsAdded: number; listsCreated: number }>({ listsUpdated: 0, itemsAdded: 0, listsCreated: 0 })

  // ── Phase 1: Classify ──────────────────────────────────

  async function handleClassify() {
    if (!rawText.trim()) return
    setPhase('classifying')
    setError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-list-import', {
        body: {
          raw_text: rawText,
          existing_lists: existingLists.map(l => ({
            id: l.id,
            title: l.title,
            description: l.description,
            list_type: l.list_type,
            is_opportunity: l.is_opportunity,
          })),
          source_context: sourceContext || undefined,
          family_id: familyId,
          member_id: memberId,
        },
      })

      if (fnError) throw fnError

      const classifiedItems: ClassifiedItem[] = (data.items ?? []).map((item: ClassifiedItem) => ({
        ...item,
        accepted: true,
      }))

      setItems(classifiedItems)
      setSuggestedLists(data.suggested_new_lists ?? [])
      setPhase('review')
    } catch (err) {
      console.error('Smart import classification failed:', err)
      setError(err instanceof Error ? err.message : 'Classification failed')
      setPhase('input')
    }
  }

  // ── Phase 2: Review helpers ────────────────────────────

  function toggleItem(idx: number) {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, accepted: !item.accepted } : item
    ))
  }

  function overrideListForItem(idx: number, listId: string | null, listTitle: string | null) {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, overridden_list_id: listId, overridden_list_title: listTitle } : item
    ))
  }

  function setNewListForItem(idx: number, newListName: string) {
    setItems(prev => prev.map((item, i) =>
      i === idx ? {
        ...item,
        target_list_id: null,
        target_list_title: null,
        overridden_list_id: null,
        overridden_list_title: null,
        suggested_new_list: newListName,
      } : item
    ))
  }

  // Resolve the effective list for an item
  function resolveList(item: ClassifiedItem): { listId: string | null; listTitle: string | null; isNew: boolean; newListName: string | null } {
    if (item.overridden_list_id !== undefined && item.overridden_list_id !== null) {
      return { listId: item.overridden_list_id, listTitle: item.overridden_list_title ?? null, isNew: false, newListName: null }
    }
    if (item.target_list_id) {
      return { listId: item.target_list_id, listTitle: item.target_list_title, isNew: false, newListName: null }
    }
    return { listId: null, listTitle: null, isNew: true, newListName: item.suggested_new_list }
  }

  // Group items by target list for the review view
  const groupedItems = useMemo(() => {
    const groups = new Map<string, { listTitle: string; listId: string | null; isNew: boolean; items: (ClassifiedItem & { originalIndex: number })[] }>()

    items.forEach((item, idx) => {
      if (!item.accepted) return
      const resolved = resolveList(item)
      const key = resolved.listId ?? `new:${resolved.newListName ?? 'Uncategorized'}`
      const existing = groups.get(key)
      if (existing) {
        existing.items.push({ ...item, originalIndex: idx })
      } else {
        groups.set(key, {
          listTitle: resolved.listTitle ?? resolved.newListName ?? 'Uncategorized',
          listId: resolved.listId,
          isNew: resolved.isNew,
          items: [{ ...item, originalIndex: idx }],
        })
      }
    })

    return groups
  }, [items])

  // ── Phase 3: Commit ────────────────────────────────────

  async function handleCommit() {
    setPhase('committing')
    setError(null)

    const acceptedItems = items.filter(i => i.accepted)
    let listsCreated = 0
    let itemsAdded = 0
    const listsUpdated = new Set<string>()
    const createdListCache = new Map<string, string>() // newListName → listId

    try {
      for (const item of acceptedItems) {
        const resolved = resolveList(item)

        let targetListId = resolved.listId

        // Create new list if needed
        if (!targetListId && resolved.newListName) {
          const cachedId = createdListCache.get(resolved.newListName)
          if (cachedId) {
            targetListId = cachedId
          } else {
            const { data: newList, error: createErr } = await supabase
              .from('lists')
              .insert({
                family_id: familyId,
                owner_id: memberId,
                title: resolved.newListName,
                list_type: 'custom',
                tags: [],
              })
              .select('id')
              .single()

            if (createErr) {
              console.error('Failed to create list:', createErr)
              continue
            }

            targetListId = newList.id
            createdListCache.set(resolved.newListName, newList.id)
            listsCreated++
          }
        }

        if (!targetListId) continue

        // Add item to the list
        const { error: itemErr } = await supabase
          .from('list_items')
          .insert({
            list_id: targetListId,
            content: item.text,
            notes: item.notes ? (sourceContext ? `${item.notes} (From: ${sourceContext})` : item.notes) : (sourceContext ? `From: ${sourceContext}` : null),
            category: item.category,
            reward_amount: item.reward_amount,
            reward_type: item.reward_type,
            sort_order: item.sort_order,
          })

        if (itemErr) {
          console.error('Failed to add item:', itemErr)
          continue
        }

        itemsAdded++
        listsUpdated.add(targetListId)
      }

      setCommitResults({ listsUpdated: listsUpdated.size, itemsAdded, listsCreated })
      setPhase('done')

      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['list-items'] })
      queryClient.invalidateQueries({ queryKey: ['opportunity-lists'] })
    } catch (err) {
      console.error('Smart import commit failed:', err)
      setError(err instanceof Error ? err.message : 'Commit failed')
      setPhase('review')
    }
  }

  // ── Confidence badge color ─────────────────────────────

  function confidenceColor(c: string): string {
    switch (c) {
      case 'high': return 'var(--color-success)'
      case 'medium': return 'var(--color-warning)'
      case 'low': return 'var(--color-danger, #ef4444)'
      default: return 'var(--color-text-secondary)'
    }
  }

  // ── Render ─────────────────────────────────────────────

  const acceptedCount = items.filter(i => i.accepted).length

  return (
    <ModalV2
      id="smart-import"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title="Smart Import"
      subtitle={phase === 'review' ? `${acceptedCount} items to sort` : undefined}
      footer={
        phase === 'review' ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {acceptedCount} of {items.length} items selected
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPhase('input')}>
                Back
              </Button>
              <Button variant="primary" size="sm" onClick={handleCommit} disabled={acceptedCount === 0}>
                <Check size={14} />
                Add {acceptedCount} items to lists
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {/* Error banner */}
      {error && (
        <div
          className="px-3 py-2 rounded-lg text-xs mb-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-danger, #ef4444) 10%, var(--color-bg-card))',
            color: 'var(--color-danger, #ef4444)',
          }}
        >
          {error}
        </div>
      )}

      {/* Phase: Input */}
      {phase === 'input' && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Paste a list of activities, chores, or items. AI will sort them into your existing lists — or suggest new ones.
          </p>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-heading)' }}>
              Source (optional)
            </label>
            <input
              type="text"
              value={sourceContext}
              onChange={e => setSourceContext(e.target.value)}
              placeholder='e.g. "The Big Book of Nature Activities"'
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-heading)' }}>
              Items to sort
            </label>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder={`Paste your list here — one item per line, or comma-separated.\n\nExample:\nWash the car - $3\nOrganize the garage - $5\nNature scavenger hunt\nBuild a birdhouse\nPractice piano scales`}
              rows={10}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                resize: 'vertical',
              }}
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {existingLists.length} existing list{existingLists.length !== 1 ? 's' : ''} to match against
            </span>
            <Button variant="primary" size="sm" onClick={handleClassify} disabled={!rawText.trim()}>
              <Sparkles size={14} />
              Sort with AI
            </Button>
          </div>
        </div>
      )}

      {/* Phase: Classifying */}
      {phase === 'classifying' && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            Sorting items into your lists...
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            AI is matching each item to the best list
          </p>
        </div>
      )}

      {/* Phase: Review */}
      {phase === 'review' && (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Grouped by target list */}
          {Array.from(groupedItems.entries()).map(([key, group]) => (
            <div
              key={key}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--color-border)' }}
            >
              {/* List header */}
              <div
                className="px-3 py-2 flex items-center gap-2"
                style={{
                  backgroundColor: group.isNew
                    ? 'color-mix(in srgb, var(--color-warning) 10%, var(--color-bg-card))'
                    : 'var(--color-bg-card)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                {group.isNew ? (
                  <Plus size={14} style={{ color: 'var(--color-warning)' }} />
                ) : (
                  <ArrowRight size={14} style={{ color: 'var(--color-btn-primary-bg)' }} />
                )}
                <span className="text-sm font-semibold flex-1" style={{ color: 'var(--color-text-heading)' }}>
                  {group.listTitle}
                </span>
                {group.isNew && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-warning)', color: '#fff' }}
                  >
                    New list
                  </span>
                )}
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Items in this group */}
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {group.items.map(item => (
                  <div
                    key={item.originalIndex}
                    className="px-3 py-2 flex items-center gap-2"
                    style={{
                      backgroundColor: item.accepted ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
                      opacity: item.accepted ? 1 : 0.5,
                    }}
                  >
                    {/* Accept checkbox */}
                    <input
                      type="checkbox"
                      checked={item.accepted}
                      onChange={() => toggleItem(item.originalIndex)}
                      style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                    />

                    {/* Item text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {item.text}
                      </p>
                      {item.notes && (
                        <p className="text-[10px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                          {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Confidence dot */}
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: confidenceColor(item.confidence) }}
                      title={`${item.confidence} confidence`}
                    />

                    {/* Reward badge */}
                    {item.reward_amount != null && (
                      <span className="text-[10px] font-medium" style={{ color: 'var(--color-success)' }}>
                        {item.reward_type === 'money' ? `$${item.reward_amount}` : `${item.reward_amount}`}
                      </span>
                    )}

                    {/* List override dropdown */}
                    <select
                      value={item.overridden_list_id ?? item.target_list_id ?? `new:${item.suggested_new_list ?? ''}`}
                      onChange={e => {
                        const val = e.target.value
                        if (val.startsWith('new:')) {
                          setNewListForItem(item.originalIndex, val.slice(4) || 'Uncategorized')
                        } else {
                          const list = existingLists.find(l => l.id === val)
                          overrideListForItem(item.originalIndex, val, list?.title ?? null)
                        }
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded border max-w-[120px]"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {/* Current assignment */}
                      {item.target_list_id && (
                        <option value={item.target_list_id}>
                          {item.target_list_title}
                        </option>
                      )}
                      {/* Suggested new list */}
                      {item.suggested_new_list && !item.target_list_id && (
                        <option value={`new:${item.suggested_new_list}`}>
                          + {item.suggested_new_list}
                        </option>
                      )}
                      <optgroup label="Existing lists">
                        {existingLists.map(l => (
                          <option key={l.id} value={l.id}>{l.title}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Create new">
                        {suggestedLists.filter(s => s.title !== item.suggested_new_list).map(s => (
                          <option key={s.title} value={`new:${s.title}`}>+ {s.title}</option>
                        ))}
                        <option value="new:Other">+ Other...</option>
                      </optgroup>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Rejected items */}
          {items.filter(i => !i.accepted).length > 0 && (
            <div className="text-xs px-1" style={{ color: 'var(--color-text-secondary)' }}>
              {items.filter(i => !i.accepted).length} item{items.filter(i => !i.accepted).length !== 1 ? 's' : ''} unchecked (won't be added)
            </div>
          )}
        </div>
      )}

      {/* Phase: Committing */}
      {phase === 'committing' && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            Adding items to lists...
          </p>
        </div>
      )}

      {/* Phase: Done */}
      {phase === 'done' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Check size={40} style={{ color: 'var(--color-success)' }} />
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
              Import complete!
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {commitResults.itemsAdded} items added to {commitResults.listsUpdated} list{commitResults.listsUpdated !== 1 ? 's' : ''}
              {commitResults.listsCreated > 0 && ` (${commitResults.listsCreated} new list${commitResults.listsCreated !== 1 ? 's' : ''} created)`}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </ModalV2>
  )
}
