/**
 * PlayTaskTile — Build M Sub-phase B
 *
 * Big touch-target task tile for Play kids. Renders a paper-craft icon
 * from platform_assets — NEVER an emoji and NEVER a Lucide icon. This
 * is the hard rule from CLAUDE.md §16.7.
 *
 * Icon priority:
 *   1. task.icon_asset_key set → resolved by usePlayTaskIcons batch query
 *   2. Auto-match via extractTaskIconTags → resolved by same batch query
 *   3. No match → vs_task_default fallback URL (Manus generates this asset
 *      separately; until then the broken-image fallback is acceptable per
 *      §17 of the kickoff prompt)
 *
 * Tap a tile to mark the task complete. Sub-phase B uses useCompleteTask
 * UNMODIFIED — Sub-phase C is the build that wires the gamification RPC.
 * The visual celebration on tap (confetti) lives in PlayDashboard's
 * onSuccess handler so the same handler runs for keyboard activation.
 */

import { useState } from 'react'
import type { Task } from '@/types/tasks'

interface PlayTaskTileProps {
  task: Task
  iconUrl: string | null
  isCompleting: boolean
  onTap: (task: Task) => void
}

const FALLBACK_ICON_URL = '' // intentional: triggers broken-image fallback
                              // until Manus generates vs_task_default. The
                              // 'No icon' label below is the visible fallback.

export function PlayTaskTile({ task, iconUrl, isCompleting, onTap }: PlayTaskTileProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const isCompleted = task.status === 'completed' || task.status === 'pending_approval'
  const resolvedUrl = iconUrl || FALLBACK_ICON_URL

  return (
    <button
      type="button"
      onClick={() => !isCompleting && !isCompleted && onTap(task)}
      disabled={isCompleting || isCompleted}
      aria-label={`${task.title}${isCompleted ? ' — completed' : ''}`}
      className="play-task-tile"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '0.5rem',
        padding: '1rem',
        borderRadius: 'var(--vibe-radius-card, 1rem)',
        backgroundColor: isCompleted
          ? 'var(--color-bg-secondary)'
          : 'var(--color-bg-card)',
        border: isCompleted
          ? '2px solid var(--color-border)'
          : '2px solid var(--color-border)',
        cursor: isCompleting || isCompleted ? 'default' : 'pointer',
        minHeight: '140px',
        opacity: isCompleted ? 0.6 : 1,
        transition: 'transform 0.15s ease, opacity 0.2s ease',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: 'var(--vibe-radius-card, 0.75rem)',
          backgroundColor: 'var(--color-bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {resolvedUrl && !imageFailed ? (
          <img
            src={resolvedUrl}
            alt=""
            onError={() => setImageFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
            loading="lazy"
          />
        ) : (
          <span
            style={{
              fontSize: '0.6875rem',
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              padding: '0.25rem',
            }}
            aria-hidden="true"
          >
            No icon
          </span>
        )}
      </div>

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
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {task.title}
      </span>

      {isCompleted && (
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            borderRadius: '9999px',
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text, #fff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
          }}
          aria-hidden="true"
        >
          ✓
        </span>
      )}

      <style>{`
        .play-task-tile:not(:disabled):active {
          transform: scale(0.97);
        }
        @media (prefers-reduced-motion: reduce) {
          .play-task-tile {
            transition: none;
          }
          .play-task-tile:not(:disabled):active {
            transform: none;
          }
        }
      `}</style>
    </button>
  )
}
