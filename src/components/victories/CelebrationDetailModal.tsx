/**
 * CelebrationDetailModal — KIDS-REWARDS-PAGE Slice 2 (gate Section 7).
 *
 * Tap a victory in the My Rewards Victories section → see the full
 * celebration. The full-celebration narrative lives in victory_celebrations
 * (written by DailyCelebration on child approval); a victory is linked when
 * its id appears in victory_celebrations.victory_ids (array membership —
 * recon finding #8). `victories.celebration_text` is a DEAD column — never
 * populated, never read here.
 *
 * Fallback when no celebration narrative exists: the victory description +
 * photo. Celebration-only framing throughout — nothing about what wasn't
 * done can ever appear (Victory Recorder principle).
 */

import { PartyPopper } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { ModalV2 } from '@/components/shared/ModalV2'
import type { Victory, VictoryCelebration } from '@/types/victories'
import { IMPORTANCE_OPTIONS } from '@/types/victories'

interface CelebrationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  victory: Victory
}

/** Newest celebration whose victory_ids contains this victory, or null. */
function useCelebrationForVictory(victoryId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['victory-celebration-for', victoryId],
    queryFn: async (): Promise<VictoryCelebration | null> => {
      const { data, error } = await supabase
        .from('victory_celebrations')
        .select('*')
        .contains('victory_ids', [victoryId])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data as VictoryCelebration) ?? null
    },
    enabled,
    staleTime: 60_000,
  })
}

export function CelebrationDetailModal({
  isOpen,
  onClose,
  victory,
}: CelebrationDetailModalProps) {
  const { data: celebration, isLoading } = useCelebrationForVictory(victory.id, isOpen)

  const importanceLabel =
    IMPORTANCE_OPTIONS.find(o => o.value === victory.importance)?.label ?? null

  return (
    <ModalV2
      id={`celebration-detail-${victory.id}`}
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title="Celebration"
    >
      <div data-testid="celebration-detail" className="space-y-4">
        <div className="flex items-start gap-3">
          <PartyPopper
            size={28}
            style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }}
          />
          <div>
            <p
              className="text-base font-semibold"
              style={{ color: 'var(--color-text-heading)' }}
            >
              {victory.description}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {new Date(victory.created_at).toLocaleDateString()}
              {importanceLabel && victory.importance !== 'standard' && ` · ${importanceLabel}`}
            </p>
          </div>
        </div>

        {victory.photo_url && (
          <img
            src={victory.photo_url}
            alt="Victory"
            className="w-full max-h-72 object-cover rounded-xl"
          />
        )}

        {isLoading ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Loading the celebration...
          </p>
        ) : celebration ? (
          <div
            data-testid="celebration-narrative"
            className="p-4 rounded-xl text-sm whitespace-pre-wrap"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))',
              border:
                '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)',
              color: 'var(--color-text-primary)',
              lineHeight: 1.6,
            }}
          >
            {celebration.narrative}
          </div>
        ) : (
          <p
            data-testid="celebration-fallback"
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            This victory was recorded and counts! A full celebration message
            shows up here when one is created.
          </p>
        )}
      </div>
    </ModalV2>
  )
}
