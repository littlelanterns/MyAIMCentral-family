// PRD-11: Celebration Modal — "Celebrate This!" experience
// Fireworks while AI generates, narrative display, Human-in-the-Mix edit
import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Copy, Edit3, Check, X } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useSaveCelebration } from '@/hooks/useCelebrationArchive'
import { supabase } from '@/lib/supabase/client'
import type { Victory, CelebrationPeriod } from '@/types/victories'

interface CelebrationModalProps {
  victoryIds: string[]
  victories: Victory[]
  memberId: string
  familyId: string
  period?: CelebrationPeriod
  onClose: () => void
}

// Gold rain particle for loading animation
function GoldRainParticle({ index }: { index: number }) {
  const left = Math.random() * 100
  const delay = Math.random() * 2
  const duration = 1.5 + Math.random() * 1.5
  const size = 3 + Math.random() * 4

  return (
    <div
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: -10,
        width: size,
        height: size,
        borderRadius: '50%',
        background: index % 3 === 0
          ? 'var(--color-sparkle-gold, #D4AF37)'
          : index % 3 === 1
            ? 'var(--color-sparkle-gold-light, #E8C547)'
            : 'var(--color-sparkle-gold-dark, #B8942A)',
        animation: `celebrationRain ${duration}s ease-in ${delay}s infinite`,
        opacity: 0,
      }}
    />
  )
}

// Firework burst
function FireworkBurst() {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360
    const rad = (angle * Math.PI) / 180
    const dist = 60 + Math.random() * 40
    return {
      tx: Math.cos(rad) * dist,
      ty: Math.sin(rad) * dist,
      size: 4 + Math.random() * 4,
      delay: Math.random() * 200,
    }
  })

  return (
    <div style={{ position: 'absolute', left: '50%', top: '30%' }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: i % 3 === 0
              ? 'var(--color-sparkle-gold, #D4AF37)'
              : i % 3 === 1
                ? 'var(--color-sparkle-gold-light, #E8C547)'
                : '#fff',
            opacity: 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ['--tx' as any]: `${p.tx}px`,
            ['--ty' as any]: `${p.ty}px`,
            animation: `fireworkBurst 1s ease-out ${p.delay}ms forwards`,
          }}
        />
      ))}
    </div>
  )
}

export function CelebrationModal({
  victoryIds,
  victories,
  memberId,
  familyId,
  period,
  onClose,
}: CelebrationModalProps) {
  const [narrative, setNarrative] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [saved, setSaved] = useState(false)
  const [contextSources, setContextSources] = useState<Record<string, unknown>>({})
  const saveCelebration = useSaveCelebration()

  // Call the Edge Function
  useEffect(() => {
    let cancelled = false

    async function generate() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('Not authenticated')
          setIsLoading(false)
          return
        }

        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/celebrate-victory`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              family_member_id: memberId,
              mode: 'collection',
              period: period ?? 'today',
              victory_ids: victoryIds,
            }),
          },
        )

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}))
          throw new Error(errData.error || `Celebration failed (${resp.status})`)
        }

        const data = await resp.json()
        if (!cancelled) {
          setNarrative(data.narrative || '')
          setEditText(data.narrative || '')
          setContextSources(data.context_sources || {})
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to generate celebration')
          setIsLoading(false)
        }
      }
    }

    generate()
    return () => { cancelled = true }
  }, [memberId, victoryIds, period])

  const handleSave = useCallback(async () => {
    const text = isEditing ? editText : narrative
    await saveCelebration.mutateAsync({
      family_id: familyId,
      family_member_id: memberId,
      mode: 'collection',
      period: period ?? 'today',
      narrative: text,
      victory_ids: victoryIds,
      victory_count: victories.length,
      context_sources: contextSources,
    })
    setSaved(true)
  }, [isEditing, editText, narrative, familyId, memberId, period, victoryIds, victories.length, contextSources, saveCelebration])

  function handleCopy() {
    const text = isEditing ? editText : narrative
    navigator.clipboard.writeText(text)
  }

  function handleEdit() {
    setEditText(narrative)
    setIsEditing(true)
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setEditText(narrative)
  }

  function handleAcceptEdit() {
    setNarrative(editText)
    setIsEditing(false)
  }

  return (
    <ModalV2
      id="celebration"
      isOpen
      onClose={onClose}
      type="transient"
      size="lg"
      title={isLoading ? 'Celebrating...' : 'Your Celebration'}
      icon={Sparkles}
      footer={
        !isLoading && !error ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <Copy size={13} />
                Copy
              </button>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <Edit3 size={13} />
                  Edit
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing && (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <X size={13} />
                    Cancel
                  </button>
                  <button
                    onClick={handleAcceptEdit}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    <Check size={13} />
                    Accept
                  </button>
                </>
              )}
              {!isEditing && (
                <button
                  onClick={saved ? onClose : handleSave}
                  disabled={saveCelebration.isPending}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    background: saved ? 'var(--color-text-tertiary)' : 'var(--color-sparkle-gold, #D4AF37)',
                    color: '#fff',
                  }}
                >
                  {saved ? 'Close' : saveCelebration.isPending ? 'Saving...' : 'Save to Archive'}
                </button>
              )}
            </div>
          </div>
        ) : undefined
      }
    >
      <div className="relative min-h-[200px]">
        {/* Loading: Fireworks + gold rain */}
        {isLoading && (
          <div className="relative overflow-hidden rounded-lg py-16 text-center" style={{ minHeight: 250 }}>
            <FireworkBurst />
            {Array.from({ length: 20 }, (_, i) => (
              <GoldRainParticle key={i} index={i} />
            ))}
            <div className="relative z-10 mt-8">
              <Sparkles size={32} style={{ color: 'var(--color-sparkle-gold, #D4AF37)', margin: '0 auto 12px' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Reflecting on your accomplishments...
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {victories.length} {victories.length === 1 ? 'victory' : 'victories'} to celebrate
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
              LiLa had trouble with that. Want to try again?
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-tertiary)' }}>{error}</p>
            <button
              onClick={() => { setError(null); setIsLoading(true) }}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary, #fff)' }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Narrative */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {isEditing ? (
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={10}
                className="w-full rounded-lg px-4 py-3 text-sm leading-relaxed resize-y"
                style={{
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-default)',
                }}
              />
            ) : (
              <div
                className="rounded-lg p-5"
                style={{ background: 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 6%, transparent)' }}
              >
                {narrative.split('\n\n').map((para, i) => (
                  <p
                    key={i}
                    className="text-sm leading-relaxed mb-3 last:mb-0"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {para}
                  </p>
                ))}
              </div>
            )}

            {saved && (
              <p className="text-xs text-center" style={{ color: 'var(--color-sparkle-gold, #D4AF37)' }}>
                Saved to your celebration archive
              </p>
            )}
          </div>
        )}
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes celebrationRain {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.3; }
          100% { transform: translateY(300px); opacity: 0; }
        }
        @keyframes fireworkBurst {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          70% { opacity: 0.7; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; }
        }
      `}</style>
    </ModalV2>
  )
}
