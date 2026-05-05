import { useState } from 'react'

interface IconLauncherTileProps {
  widgetId: string
  label: string
  iconUrl: string | null
  onTap: () => void
}

export function IconLauncherTile({ label, iconUrl, onTap }: IconLauncherTileProps) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`Open ${label}`}
      className="icon-launcher-tile"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.625rem',
        padding: '1.25rem 1rem',
        borderRadius: 'var(--vibe-radius-card, 1rem)',
        backgroundColor: 'var(--color-bg-card)',
        border: '2px solid var(--color-btn-primary-bg)',
        cursor: 'pointer',
        minHeight: '140px',
        transition: 'transform 0.15s ease, box-shadow 0.2s ease',
        boxShadow: '0 2px 8px color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: 'var(--vibe-radius-card, 0.75rem)',
          backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {iconUrl && !imageFailed ? (
          <img
            src={iconUrl}
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
              fontSize: '2rem',
              color: 'var(--color-btn-primary-bg)',
              fontWeight: 700,
            }}
            aria-hidden="true"
          >
            {label.charAt(0).toUpperCase()}
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
        {label}
      </span>

      <style>{`
        .icon-launcher-tile:active {
          transform: scale(0.96);
        }
        @media (prefers-reduced-motion: reduce) {
          .icon-launcher-tile {
            transition: none;
          }
          .icon-launcher-tile:active {
            transform: none;
          }
        }
      `}</style>
    </button>
  )
}
