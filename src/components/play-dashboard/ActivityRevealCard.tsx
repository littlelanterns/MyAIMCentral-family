import { useState, useEffect, useCallback } from 'react'
import { X, Sparkles, Check } from 'lucide-react'
import { MathGate } from '@/components/beta/MathGate'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import type { ListItem } from '@/types/lists'

interface ActivityRevealCardProps {
  item: ListItem | null
  listTitle: string
  familyId: string
  memberId: string
  isPlayShell: boolean
  onClose: () => void
  onClaimed: () => void
}

type RevealPhase = 'revealing' | 'revealed' | 'math_gate'

export function ActivityRevealCard({
  item,
  listTitle,
  familyId,
  memberId,
  isPlayShell,
  onClose,
  onClaimed,
}: ActivityRevealCardProps) {
  const [phase, setPhase] = useState<RevealPhase>('revealing')
  const [claiming, setClaiming] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!item) return
    const timer = setTimeout(() => setPhase('revealed'), 800)
    return () => clearTimeout(timer)
  }, [item])

  const handleClaim = useCallback(async () => {
    if (!item || claiming) return
    setClaiming(true)

    try {
      await supabase.from('tasks').insert({
        family_id: familyId,
        created_by: memberId,
        assignee_id: memberId,
        title: item.item_name || item.content,
        task_type: 'task',
        status: 'pending',
        source: 'icon_launcher',
        source_reference_id: item.id,
      })

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onClaimed()
    } catch (err) {
      console.warn('[ActivityRevealCard] Claim failed:', err)
    } finally {
      setClaiming(false)
    }
  }, [item, familyId, memberId, claiming, queryClient, onClaimed])

  const handleDismiss = useCallback(() => {
    if (isPlayShell) {
      setPhase('math_gate')
    } else {
      onClose()
    }
  }, [isPlayShell, onClose])

  if (!item) return null

  if (phase === 'math_gate') {
    return (
      <MathGate
        onSuccess={onClose}
        onDismiss={onClose}
      />
    )
  }

  const activityName = item.item_name || item.content

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="activity-reveal-card"
        style={{
          width: '90%',
          maxWidth: '360px',
          borderRadius: 'var(--vibe-radius-card, 1rem)',
          backgroundColor: 'var(--color-bg-card)',
          border: '2px solid var(--color-btn-primary-bg)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: phase === 'revealing' ? 'revealSpin 0.8s ease-out' : undefined,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))',
          }}
        >
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
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
            <X size={16} />
          </button>
        </div>

        {/* Activity name */}
        <div
          style={{
            padding: '2rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '9999px',
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-secondary))',
              marginBottom: '1rem',
            }}
          >
            <Sparkles
              size={24}
              style={{ color: 'var(--color-btn-primary-bg)' }}
            />
          </div>

          <p
            style={{
              fontSize: 'var(--font-size-lg, 1.125rem)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {activityName}
          </p>

          {item.notes && (
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                marginTop: '0.5rem',
              }}
            >
              {item.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        {phase === 'revealed' && (
          <div
            style={{
              padding: '0 1.5rem 1.5rem',
              display: 'flex',
              gap: '0.75rem',
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
                minHeight: '56px',
              }}
            >
              Not now
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
                minHeight: '56px',
              }}
            >
              <Check size={18} />
              {claiming ? 'Adding...' : "Let's do it!"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes revealSpin {
          0% {
            transform: rotateY(90deg) scale(0.8);
            opacity: 0;
          }
          50% {
            transform: rotateY(-10deg) scale(1.02);
            opacity: 1;
          }
          100% {
            transform: rotateY(0deg) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .activity-reveal-card {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
