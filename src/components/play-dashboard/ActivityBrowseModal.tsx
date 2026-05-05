import { useState, useCallback } from 'react'
import { X, Check, ChevronRight } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { MathGate } from '@/components/beta/MathGate'
import type { ListItem } from '@/types/lists'

interface ActivityBrowseModalProps {
  listId: string
  listTitle: string
  familyId: string
  memberId: string
  isPlayShell: boolean
  onClose: () => void
}

export function ActivityBrowseModal({
  listId,
  listTitle,
  familyId,
  memberId,
  isPlayShell,
  onClose,
}: ActivityBrowseModalProps) {
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [showMathGate, setShowMathGate] = useState(false)
  const queryClient = useQueryClient()

  const { data: items = [] } = useQuery({
    queryKey: ['icon-launcher-items', listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return (data ?? []) as ListItem[]
    },
    staleTime: 1000 * 60 * 5,
  })

  const handleClaim = useCallback(async () => {
    if (!selectedItem || claiming) return
    setClaiming(true)

    try {
      await supabase.from('tasks').insert({
        family_id: familyId,
        created_by: memberId,
        assignee_id: memberId,
        title: selectedItem.item_name || selectedItem.content,
        task_type: 'task',
        status: 'pending',
        source: 'icon_launcher',
        source_reference_id: selectedItem.id,
      })

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    } catch (err) {
      console.warn('[ActivityBrowseModal] Claim failed:', err)
    } finally {
      setClaiming(false)
    }
  }, [selectedItem, familyId, memberId, claiming, queryClient, onClose])

  const handleDismiss = useCallback(() => {
    if (isPlayShell) {
      setShowMathGate(true)
    } else {
      setSelectedItem(null)
    }
  }, [isPlayShell])

  if (showMathGate) {
    return (
      <MathGate
        onSuccess={() => {
          setShowMathGate(false)
          setSelectedItem(null)
        }}
        onDismiss={() => {
          setShowMathGate(false)
          setSelectedItem(null)
        }}
      />
    )
  }

  const eligible = items.filter(i => i.is_available !== false)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '75vh',
          borderRadius: 'var(--vibe-radius-card, 1rem) var(--vibe-radius-card, 1rem) 0 0',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            {listTitle}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '4px',
              display: 'flex',
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Item list */}
        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            padding: '0.5rem',
          }}
        >
          {eligible.length === 0 ? (
            <p
              style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              All activities completed! Great job!
            </p>
          ) : (
            eligible.map(item => {
              const isSelected = selectedItem?.id === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItem(isSelected ? null : item)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--vibe-radius-input, 0.5rem)',
                    border: isSelected
                      ? '2px solid var(--color-btn-primary-bg)'
                      : '1px solid var(--color-border)',
                    backgroundColor: isSelected
                      ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                      : 'var(--color-bg-card)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginBottom: '0.375rem',
                    minHeight: isPlayShell ? '56px' : '48px',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: isSelected ? 600 : 500,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {item.item_name || item.content}
                  </span>
                  <ChevronRight
                    size={16}
                    style={{
                      color: isSelected
                        ? 'var(--color-btn-primary-bg)'
                        : 'var(--color-text-secondary)',
                      flexShrink: 0,
                    }}
                  />
                </button>
              )
            })
          )}
        </div>

        {/* Claim / Dismiss footer */}
        {selectedItem && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: '0.75rem',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: 'var(--vibe-radius-input, 0.5rem)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: isPlayShell ? '56px' : '44px',
              }}
            >
              Pick another
            </button>
            <button
              type="button"
              onClick={handleClaim}
              disabled={claiming}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: 'var(--vibe-radius-input, 0.5rem)',
                border: 'none',
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-text-on-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: claiming ? 'wait' : 'pointer',
                opacity: claiming ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: isPlayShell ? '56px' : '44px',
              }}
            >
              <Check size={16} />
              {claiming ? 'Adding...' : "Let's do it!"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
