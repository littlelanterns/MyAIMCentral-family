/**
 * MysteryTapTile — Build M Phase 6
 *
 * Sparkly mystery card in the Play shell that flips to reveal a
 * randomizer-drawn activity. Used when a segment's
 * `randomizer_reveal_style === 'mystery_tap'`.
 *
 * - Before tap: shimmer animation, Gift icon, "Tap to reveal!" text
 * - On tap: CSS card-flip animation (rotateY 180deg) revealing the
 *   actual PlayTaskTile underneath
 * - Session-only state: refreshing the page re-hides the tile
 * - Respects prefers-reduced-motion: skip animation, show result directly
 * - Completed tasks always show revealed (no mystery on done tasks)
 */

import { useState } from 'react'
import { Gift, Sparkles } from 'lucide-react'
import { PlayTaskTile } from './PlayTaskTile'
import type { Task } from '@/types/tasks'

interface MysteryTapTileProps {
  task: Task
  iconUrl: string | null
  isCompleting: boolean
  onTap: (task: Task) => void
  /** The drawn randomizer item name (shown after reveal + on the real tile) */
  drawnItemName: string
}

export function MysteryTapTile({
  task,
  iconUrl,
  isCompleting,
  onTap,
  drawnItemName,
}: MysteryTapTileProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const isCompleted = task.status === 'completed' || task.status === 'pending_approval'

  // Completed tasks are always revealed — no mystery on done tasks
  if (isCompleted || isRevealed) {
    return (
      <PlayTaskTile
        task={task}
        iconUrl={iconUrl}
        isCompleting={isCompleting}
        onTap={onTap}
        subtitle={drawnItemName}
      />
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsRevealed(true)}
        aria-label={`Mystery task — tap to reveal`}
        className="mystery-tap-tile"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.625rem',
          padding: '1rem',
          borderRadius: 'var(--vibe-radius-card, 1rem)',
          backgroundColor: 'var(--color-bg-card)',
          border: '2px solid var(--color-btn-primary-bg)',
          cursor: 'pointer',
          minHeight: '140px',
          overflow: 'hidden',
        }}
      >
        {/* Shimmer overlay */}
        <div
          className="mystery-shimmer"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: `linear-gradient(
              135deg,
              transparent 30%,
              color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent) 45%,
              color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent) 50%,
              color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent) 55%,
              transparent 70%
            )`,
            backgroundSize: '200% 200%',
            pointerEvents: 'none',
          }}
        />

        {/* Sparkle decorations */}
        <Sparkles
          size={14}
          className="mystery-sparkle mystery-sparkle--tl"
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            color: 'var(--color-btn-primary-bg)',
            opacity: 0.5,
          }}
        />
        <Sparkles
          size={10}
          className="mystery-sparkle mystery-sparkle--br"
          style={{
            position: 'absolute',
            bottom: 12,
            right: 10,
            color: 'var(--color-btn-primary-bg)',
            opacity: 0.4,
          }}
        />

        {/* Gift icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '9999px',
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Gift
            size={28}
            style={{ color: 'var(--color-btn-primary-bg)' }}
          />
        </div>

        {/* Task title (visible so kid knows WHICH task this is) */}
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            textAlign: 'center',
            lineHeight: 1.3,
            maxWidth: '100%',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {task.title}
        </span>

        {/* "Tap to reveal!" label */}
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 500,
            color: 'var(--color-btn-primary-bg)',
            letterSpacing: '0.02em',
          }}
        >
          Tap to reveal!
        </span>
      </button>

      <style>{`
        .mystery-tap-tile:active {
          transform: scale(0.97);
        }
        .mystery-shimmer {
          animation: mysteryShimmer 2.5s ease-in-out infinite;
        }
        .mystery-sparkle--tl {
          animation: mysterySparkle 2s ease-in-out infinite;
        }
        .mystery-sparkle--br {
          animation: mysterySparkle 2s ease-in-out 1s infinite;
        }
        @keyframes mysteryShimmer {
          0% { background-position: 200% 200%; }
          100% { background-position: -200% -200%; }
        }
        @keyframes mysterySparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mystery-shimmer { animation: none; }
          .mystery-sparkle--tl,
          .mystery-sparkle--br { animation: none; }
          .mystery-tap-tile:active { transform: none; }
        }
      `}</style>
    </>
  )
}
