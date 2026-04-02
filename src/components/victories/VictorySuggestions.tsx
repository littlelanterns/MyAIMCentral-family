// PRD-11 Phase 12B: Victory Suggestions — Haiku-powered activity scan
// User-initiated scan surfaces potential victories from Activity Log.
// Session-only state — not persisted. Claim / Edit & Claim / Skip per suggestion.

import { useState, useCallback } from 'react'
import { Sparkles, Check, Pencil, X, Loader2, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useCreateVictory } from '@/hooks/useVictories'
import { supabase } from '@/lib/supabase/client'
import { SparkleOverlay } from '@/components/shared/SparkleOverlay'
import type { VictorySuggestion, VictoryPeriodFilter, MemberType } from '@/types/victories'

interface VictorySuggestionsProps {
  memberId: string
  familyId: string
  memberType: MemberType
  period: VictoryPeriodFilter
  customStart?: string
  customEnd?: string
  onVictoryClaimed: () => void
}

export function VictorySuggestions({
  memberId,
  familyId,
  memberType,
  period,
  customStart,
  customEnd,
  onVictoryClaimed,
}: VictorySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<VictorySuggestion[]>([])
  const [scanning, setScanning] = useState(false)
  const [hasScanned, setHasScanned] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [claimedIds, setClaimedIds] = useState<Set<number>>(new Set())
  const [sparkleOrigin, setSparkleOrigin] = useState<{ x: number; y: number } | null>(null)
  const createVictory = useCreateVictory()

  const scanPeriod = period === 'all' ? 'this_month' : (period === 'custom' ? 'custom' : period)

  const handleScan = useCallback(async () => {
    setScanning(true)
    setHasScanned(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-activity-victories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            family_member_id: memberId,
            period: scanPeriod,
            ...(scanPeriod === 'custom' && customStart ? { custom_start: customStart } : {}),
            ...(scanPeriod === 'custom' && customEnd ? { custom_end: customEnd } : {}),
          }),
        },
      )
      if (response.ok) {
        const result = await response.json()
        setSuggestions(result.suggestions ?? [])
      }
    } catch {
      // Silently fail — user can try again
    } finally {
      setScanning(false)
    }
  }, [memberId, scanPeriod, customStart, customEnd])

  const handleClaim = useCallback(async (suggestion: VictorySuggestion, index: number, e: React.MouseEvent) => {
    await createVictory.mutateAsync({
      family_id: familyId,
      family_member_id: memberId,
      description: suggestion.description,
      life_area_tag: suggestion.life_area_tag,
      member_type: memberType,
      importance: 'standard',
      guiding_star_id: suggestion.guiding_star_id,
      best_intention_id: suggestion.best_intention_id,
      source: 'task_completed', // scanned from activity log
    })
    setClaimedIds(prev => new Set(prev).add(index))
    setSparkleOrigin({ x: e.clientX, y: e.clientY })
    onVictoryClaimed()
  }, [familyId, memberId, memberType, createVictory, onVictoryClaimed])

  const handleSkip = useCallback((index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index))
  }, [])

  const activeSuggestions = suggestions.filter((_, i) => !claimedIds.has(i))

  // Nothing to show if we haven't scanned yet — just the button
  if (!hasScanned) {
    return (
      <div className="mb-4">
        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full justify-center"
          style={{
            background: 'var(--color-surface-secondary, var(--color-bg-secondary))',
            color: 'var(--color-text-secondary)',
            border: '1px dashed var(--color-border-default)',
          }}
        >
          {scanning ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Scanning your activity...
            </>
          ) : (
            <>
              <Search size={16} />
              Scan My Activity
            </>
          )}
        </button>
      </div>
    )
  }

  // Scanned but no suggestions
  if (hasScanned && activeSuggestions.length === 0 && !scanning) {
    return (
      <div className="mb-4 text-center py-3">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          No new suggestions found. Try again later as you complete more activities.
        </p>
        <button
          onClick={handleScan}
          className="text-xs mt-1 underline"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Scan again
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full mb-3"
      >
        <Sparkles size={14} style={{ color: 'var(--color-sparkle-gold, #D4AF37)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          LiLa noticed these...
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          ({activeSuggestions.length})
        </span>
        {collapsed ? <ChevronDown size={14} style={{ color: 'var(--color-text-tertiary)' }} /> : <ChevronUp size={14} style={{ color: 'var(--color-text-tertiary)' }} />}
        <button
          onClick={(e) => { e.stopPropagation(); handleScan() }}
          disabled={scanning}
          className="ml-auto text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {scanning ? 'Scanning...' : 'Rescan'}
        </button>
      </button>

      {/* Suggestion Cards */}
      {!collapsed && (
        <div className="space-y-2">
          {activeSuggestions.map((suggestion) => {
            const originalIndex = suggestions.indexOf(suggestion)
            return (
              <div
                key={originalIndex}
                className="rounded-lg p-3 transition-all"
                style={{
                  background: 'var(--color-surface-secondary, var(--color-bg-secondary))',
                  borderLeft: '3px solid color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 50%, transparent)',
                }}
              >
                <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {suggestion.description}
                </p>
                {suggestion.pattern_note && (
                  <p className="text-xs italic mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                    {suggestion.pattern_note}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {suggestion.life_area_tag && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                        color: 'var(--color-accent)',
                      }}>
                      {suggestion.life_area_tag}
                    </span>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={(e) => handleClaim(suggestion, originalIndex, e)}
                      disabled={createVictory.isPending}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                      style={{
                        background: 'var(--color-sparkle-gold, #D4AF37)',
                        color: '#fff',
                      }}
                    >
                      <Check size={12} />
                      Claim
                    </button>
                    <button
                      onClick={() => {
                        // Navigate to record victory with prefill
                        window.location.href = `/victories?new=1&prefill=${encodeURIComponent(suggestion.description)}`
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors"
                      style={{
                        background: 'var(--color-surface-primary, var(--color-bg-primary))',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border-default)',
                      }}
                    >
                      <Pencil size={10} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleSkip(originalIndex)}
                      className="p-1 rounded transition-opacity hover:opacity-70"
                      title="Skip"
                    >
                      <X size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sparkle effect on claim */}
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
