/**
 * PRD-11 / PRD-25: Guided Victories Page
 *
 * Victory recording + browsing for Guided shell members (ages 8-12).
 * Uses SimplifiedRecordVictory for quick capture and shows recent wins.
 */

import { useState } from 'react'
import { Trophy, Plus, Sparkles } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useRecentVictories, useCreateVictory, useVictoryCount } from '@/hooks/useVictories'
import { SimplifiedRecordVictory } from '@/components/victories/SimplifiedRecordVictory'
import type { VictorySource } from '@/types/victories'

export function GuidedVictories() {
  const { data: member } = useFamilyMember()
  const [showRecord, setShowRecord] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const memberId = member?.id
  const familyId = member?.family_id

  const { data: victories = [], isLoading } = useRecentVictories(memberId, 20)
  const { data: todayCount = 0 } = useVictoryCount(memberId, 'today')
  const createVictory = useCreateVictory()

  function handleSave(data: { description: string; lifeAreaTag: string | null; source: VictorySource }) {
    if (!memberId || !familyId) return
    createVictory.mutate(
      {
        family_id: familyId,
        family_member_id: memberId,
        description: data.description,
        life_area_tag: data.lifeAreaTag,
        source: data.source,
        member_type: 'guided',
      },
      {
        onSuccess: () => {
          setShowRecord(false)
          setJustSaved(true)
          setTimeout(() => setJustSaved(false), 3000)
        },
      },
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <div
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 15%, var(--color-bg-card))' }}
        >
          <Trophy size={32} style={{ color: 'var(--color-sparkle-gold, #D4AF37)' }} />
        </div>
        <h1
          className="text-xl font-bold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          My Victories
        </h1>
        {todayCount > 0 && (
          <p className="text-sm" style={{ color: 'var(--color-sparkle-gold-dark, #B8942A)' }}>
            {todayCount} victor{todayCount === 1 ? 'y' : 'ies'} today!
          </p>
        )}
      </div>

      {/* Just saved confirmation */}
      {justSaved && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 15%, var(--color-bg-card))',
            color: 'var(--color-sparkle-gold-dark, #B8942A)',
            border: '1px solid color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 30%, transparent)',
          }}
        >
          <Sparkles size={16} />
          Victory saved! Great job!
        </div>
      )}

      {/* Record button or form */}
      {showRecord ? (
        <SimplifiedRecordVictory
          shell="guided"
          familyId={familyId ?? ''}
          memberId={memberId ?? ''}
          onSave={handleSave}
          onClose={() => setShowRecord(false)}
        />
      ) : (
        <button
          onClick={() => setShowRecord(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-base transition-all active:scale-[0.98]"
          style={{
            minHeight: 48,
            backgroundColor: 'var(--color-sparkle-gold, #D4AF37)',
            color: 'white',
          }}
        >
          <Plus size={20} />
          Record a Victory
        </button>
      )}

      {/* Recent victories list */}
      <div className="space-y-2">
        <h2
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Recent Victories
        </h2>

        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
          </div>
        ) : victories.length === 0 ? (
          <div
            className="py-8 text-center rounded-xl"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <Trophy size={28} style={{ color: 'var(--color-text-secondary)', margin: '0 auto 8px' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No victories yet. Record your first one!
            </p>
          </div>
        ) : (
          victories.map((v) => (
            <div
              key={v.id}
              className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Trophy
                size={18}
                className="shrink-0 mt-0.5"
                style={{ color: 'var(--color-sparkle-gold, #D4AF37)' }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {v.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {(v.life_area_tags?.[0] ?? v.life_area_tag) && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {v.life_area_tags?.[0] ?? v.life_area_tag}
                    </span>
                  )}
                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {formatRelativeDate(v.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}
