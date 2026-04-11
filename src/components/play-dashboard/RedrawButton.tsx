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
import { todayLocalIso } from '@/utils/dates'

interface RedrawButtonProps {
  drawId: string
  listId: string
  memberId: string
}

export function RedrawButton({ drawId, listId, memberId }: RedrawButtonProps) {
  const [showGate, setShowGate] = useState(false)
  const queryClient = useQueryClient()

  const redrawMutation = useMutation({
    mutationFn: async () => {
      const today = todayLocalIso()

      // 1. Release current draw
      await supabase
        .from('randomizer_draws')
        .update({ status: 'released', completed_at: new Date().toISOString() })
        .eq('id', drawId)

      // 2. Fetch eligible items from the list
      const { data: items } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .eq('is_available', true)

      if (!items || items.length === 0) return null

      // 3. Weighted pick (3× for under-frequency-min items)
      const weights = items.map(item => {
        if (item.frequency_min != null && item.period_completion_count < item.frequency_min) {
          return 3
        }
        return 1
      })
      const total = weights.reduce((a: number, b: number) => a + b, 0)
      let r = Math.random() * total
      let winner = items[items.length - 1]
      for (let i = 0; i < items.length; i++) {
        r -= weights[i]
        if (r <= 0) { winner = items[i]; break }
      }

      // 4. Insert new draw
      const { data: newDraw, error } = await supabase
        .from('randomizer_draws')
        .insert({
          list_id: listId,
          list_item_id: winner.id,
          family_member_id: memberId,
          draw_source: 'auto_surprise',
          routine_instance_date: today,
          status: 'active',
        })
        .select()
        .maybeSingle()

      if (error) {
        // The UNIQUE partial index may conflict if there's a race.
        // Fetch whatever exists instead.
        console.warn('Redraw insert conflict:', error.message)
      }

      return newDraw
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
