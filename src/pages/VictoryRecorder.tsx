// PRD-11: Victory Recorder — adult/teen celebration-only surface
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Trophy, Plus, Star, Sparkles, Clock, ChevronRight, ChevronDown, MessageSquarePlus, Archive } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useVictories, useVictoryCount, useLifeAreaBreakdown, useArchivedVictories } from '@/hooks/useVictories'
import { RecordVictory } from '@/components/victories/RecordVictory'
import { VictoryDetail } from '@/components/victories/VictoryDetail'
import { CelebrationModal } from '@/components/victories/CelebrationModal'
import { CelebrationArchive } from '@/components/victories/CelebrationArchive'
import { VictorySuggestions } from '@/components/victories/VictorySuggestions'
import { VoiceSelector } from '@/components/victories/VoiceSelector'
import { SparkleOverlay } from '@/components/shared/SparkleOverlay'
import { useVoicePreference } from '@/hooks/useVoicePreference'
import { useFamily } from '@/hooks/useFamily'
import { supabase } from '@/lib/supabase/client'
import type { Victory, VictoryFilters, VictoryPeriodFilter, VoicePersonality } from '@/types/victories'
import { SOURCE_LABELS } from '@/types/victories'

const PERIOD_OPTIONS: { value: VictoryPeriodFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function VictoryRecorder() {
  const { data: member } = useFamilyMember()
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<VictoryFilters>({
    period: 'today',
    lifeAreaTags: [],
    specialFilter: null,
  })
  const prefillText = searchParams.get('prefill') ? decodeURIComponent(searchParams.get('prefill')!) : undefined
  const prefillSource = searchParams.get('source') ?? undefined
  const [showRecord, setShowRecord] = useState(searchParams.get('new') === '1')
  const [selectedVictory, setSelectedVictory] = useState<Victory | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [sparkleOrigin, setSparkleOrigin] = useState<{ x: number; y: number } | null>(null)
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)
  const { data: family } = useFamily()
  const { selectedVoice, setVoice, isSaving: voiceSaving } = useVoicePreference(family?.id, member?.id)

  const [showArchived, setShowArchived] = useState(false)

  const memberId = member?.id
  const { data: victories = [], isLoading } = useVictories(memberId, filters)
  const { data: lifeAreas = [] } = useLifeAreaBreakdown(memberId, filters.period)
  const { data: todayVictoryCount = 0 } = useVictoryCount(memberId, 'today')
  const { data: archivedVictories = [] } = useArchivedVictories(showArchived ? memberId : undefined)

  // Check if activity log is sparse today (< 3 entries) for "What Actually Got Done" prompt
  const [activitySparse, setActivitySparse] = useState(false)
  useEffect(() => {
    if (!memberId || !member?.family_id) return
    const today = new Date().toISOString().slice(0, 10)
    supabase
      .from('activity_log_entries')
      .select('id', { count: 'exact', head: true })
      .eq('family_id', member.family_id)
      .eq('member_id', memberId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59.999`)
      .then(({ count }) => {
        setActivitySparse((count ?? 0) < 3)
      })
  }, [memberId, member?.family_id])

  const victoryIds = useMemo(() => victories.map(v => v.id), [victories])

  const handlePeriodChange = useCallback((period: VictoryPeriodFilter) => {
    setFilters(prev => ({ ...prev, period }))
  }, [])

  const toggleLifeArea = useCallback((tag: string) => {
    setFilters(prev => {
      const current = prev.lifeAreaTags || []
      const next = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag]
      return { ...prev, lifeAreaTags: next }
    })
  }, [])

  const toggleSpecialFilter = useCallback((filter: 'best_intentions' | 'guiding_stars') => {
    setFilters(prev => ({
      ...prev,
      specialFilter: prev.specialFilter === filter ? null : filter,
    }))
  }, [])

  const handleRecordSaved = useCallback((origin?: { x: number; y: number }) => {
    if (origin) setSparkleOrigin(origin)
    setShowRecord(false)
  }, [])

  // Auto-open celebrate if ?celebrate=1 (for reckoning hook)
  useEffect(() => {
    if (searchParams.get('celebrate') === '1' && victories.length > 0) {
      setShowCelebration(true)
    }
  }, [searchParams, victories.length])

  if (!member) return null

  const isMom = member.role === 'primary_parent'

  return (
    <div className="density-comfortable max-w-3xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Trophy size={24} style={{ color: 'var(--color-sparkle-gold, #D4AF37)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Victory Recorder
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          What did you do right?
        </p>
      </div>

      {/* Period Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => handlePeriodChange(opt.value)}
            className="shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              background: filters.period === opt.value
                ? 'var(--surface-primary)'
                : 'var(--color-surface-secondary, var(--color-bg-secondary))',
              color: filters.period === opt.value
                ? 'var(--color-text-on-primary, #fff)'
                : 'var(--color-text-secondary)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Life Area Tags — auto-sorted by frequency */}
      {lifeAreas.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {lifeAreas.map(la => (
            <button
              key={la.tag}
              onClick={() => toggleLifeArea(la.tag)}
              className="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border"
              style={{
                background: (filters.lifeAreaTags || []).includes(la.tag)
                  ? 'var(--surface-primary)'
                  : 'transparent',
                color: (filters.lifeAreaTags || []).includes(la.tag)
                  ? 'var(--color-text-on-primary, #fff)'
                  : 'var(--color-text-secondary)',
                borderColor: 'var(--color-border-default)',
              }}
            >
              {la.tag} ({la.count})
            </button>
          ))}
        </div>
      )}

      {/* Special Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => toggleSpecialFilter('guiding_stars')}
          className="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border"
          style={{
            background: filters.specialFilter === 'guiding_stars'
              ? 'var(--surface-primary)'
              : 'transparent',
            color: filters.specialFilter === 'guiding_stars'
              ? 'var(--color-text-on-primary, #fff)'
              : 'var(--color-text-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          Guiding Stars
        </button>
        <button
          onClick={() => toggleSpecialFilter('best_intentions')}
          className="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border"
          style={{
            background: filters.specialFilter === 'best_intentions'
              ? 'var(--surface-primary)'
              : 'transparent',
            color: filters.specialFilter === 'best_intentions'
              ? 'var(--color-text-on-primary, #fff)'
              : 'var(--color-text-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          Best Intentions
        </button>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {victories.length} {victories.length === 1 ? 'victory' : 'victories'}
        </span>
        <div className="flex items-center gap-3">
          {victories.length > 0 && (
            <button
              onClick={() => setShowCelebration(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
              style={{
                background: 'var(--color-sparkle-gold, #D4AF37)',
                color: '#fff',
              }}
            >
              <Sparkles size={14} />
              Celebrate This!
            </button>
          )}
          <button
            onClick={() => setShowArchive(true)}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Past Celebrations
            <ChevronRight size={12} />
          </button>
          <button
            onClick={() => setShowVoiceSelector(!showVoiceSelector)}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Voice: {selectedVoice.replace(/_/g, ' ')}
            <ChevronRight size={12} className={`transition-transform ${showVoiceSelector ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Voice Selector (collapsible) */}
      {showVoiceSelector && memberId && (
        <div
          className="mb-4 rounded-xl p-4"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-heading)' }}>
            Celebration Voice
          </h3>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Choose how LiLa celebrates your victories
          </p>
          <VoiceSelector
            selectedVoice={selectedVoice}
            onSelect={(voice: VoicePersonality) => setVoice(memberId, voice)}
            isSaving={voiceSaving}
          />
        </div>
      )}

      {/* "What Actually Got Done" prompt — shows when activity is sparse and no victories today */}
      {activitySparse && todayVictoryCount === 0 && filters.period === 'today' && !isLoading && (
        <button
          onClick={() => setShowRecord(true)}
          className="w-full mb-4 rounded-lg p-4 text-left transition-colors"
          style={{
            background: 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 8%, var(--color-surface-secondary, var(--color-bg-secondary)))',
            border: '1px dashed color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 40%, transparent)',
          }}
        >
          <div className="flex items-start gap-3">
            <MessageSquarePlus size={20} style={{ color: 'var(--color-sparkle-gold, #D4AF37)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                What happened today that didn't make it onto a list?
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Calming a meltdown, handling a crisis, driving to appointments — the invisible work counts too.
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Victory Suggestions — Haiku-powered activity scan */}
      {memberId && (
        <VictorySuggestions
          memberId={memberId}
          familyId={member.family_id}
          memberType={member.role === 'primary_parent' || member.role === 'additional_adult' || member.role === 'special_adult' ? 'adult' : 'teen'}
          period={filters.period}
          customStart={filters.customStart}
          customEnd={filters.customEnd}
          onVictoryClaimed={() => {
            // Invalidation happens inside useCreateVictory already
          }}
        />
      )}

      {/* Victory List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
            style={{ borderColor: 'var(--color-sparkle-gold, #D4AF37)', borderTopColor: 'transparent' }} />
        </div>
      ) : victories.length === 0 ? (
        /* Empty State: "What Actually Got Done" */
        <div className="text-center py-16 px-6">
          <Trophy size={48} style={{ color: 'var(--color-sparkle-gold, #D4AF37)', margin: '0 auto 16px' }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Nothing here yet — and that's okay.
          </h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            What happened today that didn't make it onto a list? When you notice something you've done right, no matter how small, come back and record it.
          </p>
          <button
            onClick={() => setShowRecord(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary, #fff)' }}
          >
            <Plus size={16} />
            Record a Victory
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {victories.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVictory(v)}
              className="w-full text-left rounded-lg p-4 transition-colors"
              style={{
                background: 'var(--color-surface-secondary, var(--color-bg-secondary))',
                borderLeft: '3px solid var(--color-sparkle-gold, #D4AF37)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    {v.description}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {v.life_area_tag && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                          color: 'var(--color-accent)',
                        }}>
                        {v.life_area_tag}
                      </span>
                    )}
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      <Clock size={10} />
                      {formatDate(v.created_at)}
                    </span>
                    {v.source !== 'manual' && (
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        {SOURCE_LABELS[v.source] || v.source}
                      </span>
                    )}
                  </div>
                </div>
                {v.is_moms_pick && (
                  <Star size={16} fill="var(--color-sparkle-gold, #D4AF37)" style={{ color: 'var(--color-sparkle-gold, #D4AF37)', flexShrink: 0 }} />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Archived Victories Section */}
      <div className="mt-6">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Archive size={14} />
          Archived{archivedVictories.length > 0 ? ` (${archivedVictories.length})` : ''}
          {showArchived ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {showArchived && (
          <div className="mt-3 space-y-3">
            {archivedVictories.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                No archived victories
              </p>
            ) : (
              archivedVictories.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVictory(v)}
                  className="w-full text-left rounded-lg p-4 transition-colors opacity-70"
                  style={{
                    background: 'var(--color-surface-secondary, var(--color-bg-secondary))',
                    borderLeft: '3px solid var(--color-text-tertiary)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        {v.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {v.life_area_tag && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                              color: 'var(--color-accent)',
                            }}>
                            {v.life_area_tag}
                          </span>
                        )}
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                          <Clock size={10} />
                          {formatDate(v.created_at)}
                        </span>
                        <span className="text-xs italic" style={{ color: 'var(--color-text-tertiary)' }}>
                          archived {v.archived_at ? formatDate(v.archived_at) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* FAB: Record a Victory */}
      <button
        onClick={() => setShowRecord(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg font-semibold text-sm transition-transform hover:scale-105"
        style={{
          background: 'var(--color-sparkle-gold, #D4AF37)',
          color: '#fff',
        }}
      >
        <Plus size={18} />
        <span className="hidden sm:inline">Record a Victory</span>
      </button>

      {/* Modals */}
      {showRecord && (
        <RecordVictory
          onClose={() => setShowRecord(false)}
          onSaved={handleRecordSaved}
          memberId={member.id}
          familyId={member.family_id}
          memberType={member.role === 'primary_parent' || member.role === 'additional_adult' || member.role === 'special_adult' ? 'adult' : 'teen'}
          defaultDescription={prefillText}
          defaultSource={prefillSource}
        />
      )}

      {selectedVictory && (
        <VictoryDetail
          victory={selectedVictory}
          onClose={() => setSelectedVictory(null)}
          isMom={isMom}
          currentMemberId={member.id}
        />
      )}

      {showCelebration && victories.length > 0 && (
        <CelebrationModal
          victoryIds={victoryIds}
          victories={victories}
          memberId={member.id}
          familyId={member.family_id}
          period={filters.period === 'all' ? undefined : (filters.period === 'today' ? 'today' : filters.period === 'this_week' ? 'this_week' : 'this_month')}
          onClose={() => setShowCelebration(false)}
        />
      )}

      {showArchive && (
        <CelebrationArchive
          memberId={member.id}
          onClose={() => setShowArchive(false)}
        />
      )}

      {/* SparkleOverlay on save */}
      {sparkleOrigin && (
        <SparkleOverlay
          type="quick_burst"
          origin={sparkleOrigin}
          onComplete={() => setSparkleOrigin(null)}
        />
      )}
    </div>
  )
}
