/**
 * RedrawButton — Build M Phase 6
 *
 * Small button that lets an adult redraw a randomizer-linked task's
 * daily activity. Gated behind a simple math problem (same pattern as
 * the Guided/Play GlitchReporter MathGate) so kids can't spam redraws.
 *
 * Only rendered when the logged-in user is an adult (mom/dad) viewing
 * a kid's dashboard. The math gate is a speed bump, not security.
 *
 * On successful redraw:
 *   1. Releases the current draw (status → 'released')
 *   2. Triggers a new auto-draw for the same list + member + date
 *   3. Invalidates queries so the tile updates
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
interface RedrawButtonProps {
  drawId: string
  listId: string
  memberId: string
}

export function RedrawButton({ drawId, listId }: RedrawButtonProps) {
  const [showGate, setShowGate] = useState(false)
  const queryClient = useQueryClient()

  const redrawMutation = useMutation({
    mutationFn: async () => {
      // 1. Fetch eligible items from the list (exclude the current item)
      const { data: items } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .eq('is_available', true)

      if (!items || items.length === 0) return null

      // 2. Get current draw to exclude from pick
      const { data: currentDraw } = await supabase
        .from('randomizer_draws')
        .select('list_item_id')
        .eq('id', drawId)
        .single()

      const eligible = items.filter(i => i.id !== currentDraw?.list_item_id)
      if (eligible.length === 0) return null // Only one item in the list

      // 3. Weighted pick (3× for under-frequency-min items)
      const weights = eligible.map(item => {
        if (item.frequency_min != null && item.period_completion_count < item.frequency_min) {
          return 3
        }
        return 1
      })
      const total = weights.reduce((a: number, b: number) => a + b, 0)
      let r = Math.random() * total
      let winner = eligible[eligible.length - 1]
      for (let i = 0; i < eligible.length; i++) {
        r -= weights[i]
        if (r <= 0) { winner = eligible[i]; break }
      }

      // 4. UPDATE the existing draw row to the new item
      //    (can't insert a second auto_surprise for the same day —
      //     UNIQUE partial index blocks it regardless of status)
      const { data: updated, error } = await supabase
        .from('randomizer_draws')
        .update({ list_item_id: winner.id, status: 'active' })
        .eq('id', drawId)
        .select()
        .single()

      if (error) {
        console.warn('Redraw update failed:', error.message)
        return null
      }

      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-randomizer-draws'] })
      queryClient.invalidateQueries({ queryKey: ['randomizer-draws'] })
    },
  })

  const handleGateSuccess = useCallback(() => {
    setShowGate(false)
    redrawMutation.mutate()
  }, [redrawMutation])

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setShowGate(true)
        }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
        style={{
          color: 'var(--color-text-secondary)',
          background: 'color-mix(in srgb, var(--color-bg-secondary) 80%, transparent)',
          border: '1px solid var(--color-border)',
          cursor: 'pointer',
        }}
        title="Redraw a different activity"
        disabled={redrawMutation.isPending}
      >
        <RefreshCw size={10} className={redrawMutation.isPending ? 'animate-spin' : ''} />
        {redrawMutation.isPending ? 'Drawing...' : 'Redraw'}
      </button>

      {showGate && (
        <RedrawMathGate
          onSuccess={handleGateSuccess}
          onDismiss={() => setShowGate(false)}
        />
      )}
    </>
  )
}

// ── Math Gate (inline, same pattern as MathGate.tsx) ─────────────────

function RedrawMathGate({
  onSuccess,
  onDismiss,
}: {
  onSuccess: () => void
  onDismiss: () => void
}) {
  const { a, b } = useMemo(() => ({
    a: Math.floor(Math.random() * 8) + 2,
    b: Math.floor(Math.random() * 8) + 2,
  }), [])

  const [answer, setAnswer] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(answer, 10)
    if (num === a + b) {
      onSuccess()
    } else {
      onDismiss()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onDismiss}
    >
      <div
        className="w-[90%] max-w-[280px] p-5"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--vibe-radius-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Redraw activity
          </span>
          <button
            onClick={onDismiss}
            className="p-1 bg-transparent border-none cursor-pointer"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p
          className="text-xs mb-3"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Quick check so little fingers don't accidentally redraw:
        </p>

        <form onSubmit={handleSubmit}>
          <p
            className="text-lg font-semibold text-center mb-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            What is {a} + {b}?
          </p>

          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full text-center text-base box-border"
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--vibe-radius-input)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
            placeholder="?"
          />

          <button
            type="submit"
            disabled={!answer.trim()}
            className="w-full mt-2.5 py-2 font-semibold border-none text-sm"
            style={{
              borderRadius: 'var(--vibe-radius-input)',
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-text-on-primary)',
              cursor: answer.trim() ? 'pointer' : 'not-allowed',
              opacity: answer.trim() ? 1 : 0.5,
            }}
          >
            Draw again
          </button>
        </form>
      </div>
    </div>
  )
}
