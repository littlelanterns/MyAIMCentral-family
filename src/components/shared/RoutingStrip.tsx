import { useState } from 'react'
import {
  Calendar, CheckSquare, List, BookOpen, Star, Heart, Trophy,
  BarChart3, MessageCircle, ListChecks, Brain, Wand2, StickyNote,
  ThumbsUp, SkipForward,
} from 'lucide-react'
import type { NotepadRoutingStat } from '@/hooks/useNotepad'

// ─── Types ───────────────────────────────────────────────────

type DestAccent = 'teal' | 'warm' | 'rose' | 'muted'

export interface RoutingDestinationConfig {
  key: string
  label: string
  icon: typeof Calendar
  accent: DestAccent
  subOptions?: { key: string; label: string }[]
}

export type RoutingContext =
  | 'notepad_send_to'
  | 'request_accept'
  | 'meeting_action'
  | 'review_route_card'

interface RoutingStripProps {
  context: RoutingContext
  onRoute: (destination: string, subType?: string) => void
  onCancel: () => void
  routingStats?: NotepadRoutingStat[]
  showReviewRoute?: boolean
  onReviewRoute?: () => void
}

// ─── Full Destination Catalog ────────────────────────────────

// Accent color map — derives from theme variables using color-mix for variety
// Each accent uses a different theme color as its base, with faded/transparent tile backgrounds
const ACCENT_COLORS: Record<DestAccent, { icon: string; label: string; tileBg: string; favBg: string }> = {
  teal: {
    icon: 'var(--color-btn-primary-bg)',
    label: 'var(--color-btn-primary-bg)',
    tileBg: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card, #fff))',
    favBg: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card, #fff))',
  },
  warm: {
    icon: 'var(--color-accent)',
    label: 'color-mix(in srgb, var(--color-accent) 80%, var(--color-text-heading))',
    tileBg: 'color-mix(in srgb, var(--color-accent) 12%, var(--color-bg-card, #fff))',
    favBg: 'color-mix(in srgb, var(--color-accent) 20%, var(--color-bg-card, #fff))',
  },
  rose: {
    icon: 'color-mix(in srgb, var(--color-btn-primary-hover) 70%, var(--color-accent))',
    label: 'color-mix(in srgb, var(--color-btn-primary-hover) 70%, var(--color-accent))',
    tileBg: 'color-mix(in srgb, var(--color-btn-primary-hover) 8%, var(--color-bg-card, #fff))',
    favBg: 'color-mix(in srgb, var(--color-btn-primary-hover) 14%, var(--color-bg-card, #fff))',
  },
  muted: {
    icon: 'var(--color-text-secondary)',
    label: 'var(--color-text-secondary)',
    tileBg: 'color-mix(in srgb, var(--color-bg-secondary) 60%, var(--color-bg-card, #fff))',
    favBg: 'var(--color-bg-secondary)',
  },
}

const ALL_DESTINATIONS: RoutingDestinationConfig[] = [
  { key: 'calendar', label: 'Calendar', icon: Calendar, accent: 'teal' },
  {
    key: 'tasks', label: 'Tasks', icon: CheckSquare, accent: 'warm',
    subOptions: [
      { key: 'single', label: 'Single task' },
      { key: 'individual', label: 'Individual' },
      { key: 'ai_sort', label: 'AI sort' },
    ],
  },
  { key: 'list', label: 'List', icon: List, accent: 'muted' },
  {
    key: 'journal', label: 'Journal', icon: BookOpen, accent: 'teal',
    subOptions: [
      { key: 'free_write', label: 'Free write' },
      { key: 'daily_reflection', label: 'Reflection' },
      { key: 'learning_capture', label: 'Commonplace' },
      { key: 'gratitude', label: 'Gratitude' },
      { key: 'prayer', label: 'Prayer' },
      { key: 'dream', label: 'Dreams' },
    ],
  },
  { key: 'guiding_stars', label: 'Guiding Stars', icon: Star, accent: 'warm' },
  { key: 'best_intentions', label: 'Best Intentions', icon: Heart, accent: 'rose' },
  { key: 'victory', label: 'Victory', icon: Trophy, accent: 'warm' },
  { key: 'track', label: 'Track', icon: BarChart3, accent: 'teal' },
  { key: 'message', label: 'Message', icon: MessageCircle, accent: 'rose' },
  { key: 'agenda', label: 'Agenda', icon: ListChecks, accent: 'rose' },
  {
    key: 'innerworkings', label: 'InnerWorkings', icon: Brain, accent: 'teal',
    subOptions: [
      { key: 'personality', label: 'Personality' },
      { key: 'strengths', label: 'Strengths' },
      { key: 'growth_areas', label: 'Growth areas' },
      { key: 'communication_style', label: 'Communication' },
      { key: 'how_i_work', label: 'How I work' },
    ],
  },
  { key: 'optimizer', label: 'Optimizer', icon: Wand2, accent: 'teal' },
  { key: 'note', label: 'Note', icon: StickyNote, accent: 'muted' },
  { key: 'acknowledge', label: 'Acknowledge', icon: ThumbsUp, accent: 'muted' },
  { key: 'skip', label: 'Skip', icon: SkipForward, accent: 'muted' },
]

// ─── Context Filters ─────────────────────────────────────────

const CONTEXT_FILTERS: Record<RoutingContext, string[]> = {
  notepad_send_to: [
    'calendar', 'tasks', 'list', 'journal', 'guiding_stars', 'best_intentions',
    'victory', 'track', 'message', 'agenda', 'innerworkings', 'optimizer', 'note',
  ],
  request_accept: ['calendar', 'tasks', 'list', 'acknowledge'],
  meeting_action: ['tasks', 'best_intentions', 'calendar', 'list', 'skip'],
  review_route_card: [
    'calendar', 'tasks', 'list', 'journal', 'guiding_stars', 'best_intentions',
    'victory', 'track', 'message', 'note',
  ],
}

// ─── Component ───────────────────────────────────────────────

export function RoutingStrip({
  context,
  onRoute,
  onCancel,
  routingStats = [],
  showReviewRoute = false,
  onReviewRoute,
}: RoutingStripProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const allowedKeys = CONTEXT_FILTERS[context]
  const destinations = ALL_DESTINATIONS.filter(d => allowedKeys.includes(d.key))

  // Compute favorites: top 3 by usage count
  const topStats = routingStats
    .filter(s => allowedKeys.includes(s.destination))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  const favorites = topStats.length >= 1
    ? topStats.map(s => destinations.find(d => d.key === s.destination)).filter(Boolean) as RoutingDestinationConfig[]
    : destinations.slice(0, 3)

  function handleTileClick(dest: RoutingDestinationConfig) {
    if (dest.subOptions) {
      setExpandedKey(expandedKey === dest.key ? null : dest.key)
    } else {
      onRoute(dest.key)
    }
  }

  function handleSubClick(parentKey: string, subKey: string) {
    setExpandedKey(null)
    onRoute(parentKey, subKey)
  }

  // Grid columns: 4 for exactly 4 items, otherwise 3
  const colCount = destinations.length === 4 ? 4 : 3
  const gridCols = colCount === 4 ? 'grid-cols-4' : 'grid-cols-3'

  return (
    <div className="flex flex-col gap-3 p-4" style={{ color: 'var(--color-text-primary)' }}>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
        Send to...
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Where should this go?
      </p>

      {/* Favorites section */}
      {context === 'notepad_send_to' && (
        <>
          <p
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Favorites
          </p>
          <div className="grid grid-cols-3 gap-2">
            {favorites.map(dest => (
              <FavoriteTile
                key={dest.key}
                dest={dest}
                onClick={() => handleTileClick(dest)}
                isExpanded={expandedKey === dest.key}
              />
            ))}
          </div>
          <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
        </>
      )}

      {/* All destinations — rendered row-by-row so sub-options appear inline */}
      <p
        className="text-[11px] font-medium uppercase tracking-wider"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        All destinations
      </p>
      <div className="flex flex-col gap-1.5">
        {chunkArray(destinations, colCount).map((row, rowIdx) => (
          <div key={rowIdx}>
            {/* Row of tiles */}
            <div className={`grid ${gridCols} gap-1.5`}>
              {row.map(dest => (
                <DestinationTile
                  key={dest.key}
                  dest={dest}
                  onClick={() => handleTileClick(dest)}
                  isActive={expandedKey === dest.key}
                />
              ))}
            </div>

            {/* Sub-destination drill-down — appears directly under the row containing the expanded tile */}
            {row.some(d => d.key === expandedKey) && (() => {
              const expanded = destinations.find(d => d.key === expandedKey)
              if (!expanded?.subOptions) return null
              const expandedAccent = ACCENT_COLORS[expanded.accent]
              return (
                <div
                  className="grid grid-cols-3 gap-1 p-2 mt-1.5 rounded-lg"
                  style={{ background: `color-mix(in srgb, ${expandedAccent.icon} 6%, var(--color-bg-secondary))` }}
                >
                  {expanded.subOptions.map(sub => (
                    <button
                      key={sub.key}
                      onClick={() => handleSubClick(expandedKey, sub.key)}
                      className="px-2 py-2 rounded-lg text-[10px] text-center transition-all hover:scale-[1.03]"
                      style={{
                        background: 'var(--color-bg-card, #fff)',
                        color: expandedAccent.label,
                        border: `1px solid color-mix(in srgb, ${expandedAccent.icon} 12%, transparent)`,
                        minHeight: 'unset',
                      }}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )
            })()}
          </div>
        ))}
      </div>

      {/* Review & Route button */}
      {showReviewRoute && onReviewRoute && (
        <button
          onClick={onReviewRoute}
          className="btn-primary w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.01]"
          style={{
            background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
            boxShadow: '0 2px 8px color-mix(in srgb, var(--color-btn-primary-bg) 30%, transparent)',
          }}
        >
          Review &amp; Route
        </button>
      )}

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="w-full py-2 text-sm rounded-lg transition-colors"
        style={{
          background: 'color-mix(in srgb, var(--color-bg-secondary) 50%, transparent)',
          color: 'var(--color-text-secondary)',
          minHeight: 'unset',
        }}
      >
        Cancel
      </button>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function FavoriteTile({ dest, onClick, isExpanded }: {
  dest: RoutingDestinationConfig
  onClick: () => void
  isExpanded: boolean
}) {
  const Icon = dest.icon
  const accent = ACCENT_COLORS[dest.accent]
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl transition-all hover:scale-[1.02]"
      style={{
        background: isExpanded
          ? 'var(--gradient-primary, var(--color-btn-primary-bg))'
          : accent.favBg,
        border: isExpanded ? 'none' : '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)',
        minHeight: 'unset',
      }}
    >
      <Icon size={22} style={{ color: isExpanded ? 'var(--color-btn-primary-text)' : accent.icon }} />
      <span
        className="text-xs font-medium"
        style={{ color: isExpanded ? 'var(--color-btn-primary-text)' : accent.label }}
      >
        {dest.label}
      </span>
    </button>
  )
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

function DestinationTile({ dest, onClick, isActive }: {
  dest: RoutingDestinationConfig
  onClick: () => void
  isActive: boolean
}) {
  const Icon = dest.icon
  const accent = ACCENT_COLORS[dest.accent]
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 py-2.5 px-1 transition-all hover:scale-[1.03]"
      style={{
        background: isActive
          ? 'var(--gradient-primary, var(--color-btn-primary-bg))'
          : accent.tileBg,
        border: isActive ? 'none' : `1px solid color-mix(in srgb, ${accent.icon} 15%, transparent)`,
        minHeight: 'unset',
        borderRadius: 'var(--vibe-radius-input, 8px)',
      }}
    >
      <Icon size={20} style={{ color: isActive ? 'var(--color-btn-primary-text)' : accent.icon }} />
      <span
        className="text-[11px]"
        style={{ color: isActive ? 'var(--color-btn-primary-text)' : accent.label }}
      >
        {dest.label}
      </span>
    </button>
  )
}
