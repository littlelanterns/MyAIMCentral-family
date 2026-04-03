/**
 * PRD-25: Guided Best Intentions Section
 * Shows personal + family intentions with tap-to-celebrate.
 * Optional child self-creation when permitted by mom.
 */

import { useState } from 'react'
import { Heart, Plus, Users, Volume2, Eye } from 'lucide-react'
import { useBestIntentions, useLogIteration, useCreateBestIntention } from '@/hooks/useBestIntentions'
import { speak } from '@/utils/speak'
import type { GuidedDashboardPreferences } from '@/types/guided-dashboard'

interface GuidedBestIntentionsSectionProps {
  memberId: string
  familyId: string
  preferences: GuidedDashboardPreferences
  readingSupport: boolean
}

export function GuidedBestIntentionsSection({
  memberId,
  familyId,
  preferences,
  readingSupport,
}: GuidedBestIntentionsSectionProps) {
  const { data: intentions = [] } = useBestIntentions(memberId)
  const logIteration = useLogIteration()
  const createIntention = useCreateBestIntention()

  const [celebratingId, setCelebratingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStatement, setNewStatement] = useState('')

  const activeIntentions = intentions.filter(i => i.is_active && !i.archived_at)

  const handleCelebrate = (intentionId: string) => {
    setCelebratingId(intentionId)
    logIteration.mutate({
      intentionId,
      familyId,
      memberId,
    })
    setTimeout(() => setCelebratingId(null), 800)
  }

  const handleCreate = () => {
    if (!newStatement.trim()) return
    createIntention.mutate({
      family_id: familyId,
      member_id: memberId,
      statement: newStatement.trim(),
      source: 'manual',
    })
    setNewStatement('')
    setShowAddForm(false)
  }

  if (activeIntentions.length === 0 && !preferences.child_can_create_best_intentions) {
    return (
      <div
        className="p-4 rounded-xl text-center"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          No Best Intentions set yet. Ask your mom to add some!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {activeIntentions.map(intention => {
        const isCelebrating = celebratingId === intention.id
        const isFamily = !!intention.related_member_ids?.length

        return (
          <button
            key={intention.id}
            onClick={() => handleCelebrate(intention.id)}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
            style={{
              backgroundColor: isCelebrating
                ? 'color-mix(in srgb, var(--color-accent-warm) 20%, var(--color-bg-card))'
                : 'var(--color-bg-card)',
              border: `1px solid ${isCelebrating ? 'var(--color-accent-warm)' : 'var(--color-border)'}`,
              transform: isCelebrating ? 'scale(1.03)' : 'scale(1)',
            }}
          >
            <Heart
              size={20}
              fill={isCelebrating ? 'var(--color-accent-warm, #f59e0b)' : 'none'}
              style={{
                color: isCelebrating
                  ? 'var(--color-accent-warm, #f59e0b)'
                  : 'var(--color-text-secondary)',
                transition: 'all 0.3s',
              }}
            />
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {intention.statement}
                </span>
                {isFamily && (
                  <span
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-accent-deep) 15%, transparent)',
                      color: 'var(--color-accent-deep)',
                    }}
                  >
                    <Users size={10} />
                    Family
                  </span>
                )}
                {readingSupport && (
                  <button
                    onClick={(e) => { e.stopPropagation(); speak(intention.statement) }}
                    className="reading-support-tts p-0.5 rounded"
                    style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                  >
                    <Volume2 size={14} />
                  </button>
                )}
              </div>
            </div>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: intention.iteration_count > 0
                  ? 'color-mix(in srgb, var(--color-accent-warm) 20%, transparent)'
                  : 'var(--color-bg-secondary)',
                color: intention.iteration_count > 0
                  ? 'var(--color-accent-warm)'
                  : 'var(--color-text-tertiary)',
              }}
            >
              {intention.iteration_count}
            </span>
          </button>
        )
      })}

      {/* Child self-creation */}
      {preferences.child_can_create_best_intentions && (
        <>
          {showAddForm ? (
            <div
              className="p-3 rounded-xl space-y-2"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <input
                type="text"
                value={newStatement}
                onChange={(e) => setNewStatement(e.target.value)}
                placeholder="I want to practice..."
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
              />
              <p
                className="text-xs px-1"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Write something you want to DO more of. Instead of &ldquo;Stop being
                mean,&rdquo; try &ldquo;Use kind words.&rdquo; What do you want to practice?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowAddForm(false); setNewStatement('') }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)', background: 'transparent' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newStatement.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: newStatement.trim()
                      ? 'var(--surface-primary, var(--color-btn-primary-bg))'
                      : 'var(--color-bg-secondary)',
                    color: newStatement.trim()
                      ? 'var(--color-btn-primary-text)'
                      : 'var(--color-text-tertiary)',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed text-sm"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'transparent',
              }}
            >
              <Plus size={16} />
              Add a Best Intention
            </button>
          )}
        </>
      )}

      {/* PRD-25 Phase C: Transparency indicator */}
      <p
        className="flex items-center gap-1.5 text-xs pt-1"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <Eye size={12} />
        Your parent can see your Best Intentions
      </p>
    </div>
  )
}
