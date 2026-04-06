/**
 * LinkPreviewCard — PRD-15 Phase E
 *
 * Displays a URL metadata card for Content Corner links.
 * Shows: title, domain, optional thumbnail. Opens in new tab on click.
 * Fallback: just the URL text if no metadata available.
 */

import { ExternalLink, Link as LinkIcon } from 'lucide-react'

interface LinkMetadata {
  url: string
  title?: string
  domain?: string
  thumbnail_url?: string
}

interface LinkPreviewCardProps {
  metadata: LinkMetadata
  senderName?: string
  timestamp?: string
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url.slice(0, 40)
  }
}

export function LinkPreviewCard({ metadata, senderName, timestamp }: LinkPreviewCardProps) {
  const { url, title, domain, thumbnail_url } = metadata
  const displayDomain = domain || extractDomain(url)

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--vibe-radius-card, 8px)',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg-secondary)',
        cursor: 'pointer',
        transition: 'box-shadow 150ms',
      }}
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
      role="link"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') window.open(url, '_blank', 'noopener,noreferrer') }}
    >
      {/* Thumbnail */}
      {thumbnail_url && (
        <div
          style={{
            height: 140,
            backgroundColor: 'var(--color-bg-tertiary)',
            backgroundImage: `url(${thumbnail_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      <div style={{ padding: '0.75rem' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {title || url}
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                marginTop: '0.25rem',
              }}
            >
              <LinkIcon size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                {displayDomain}
              </span>
            </div>
          </div>
          <ExternalLink
            size={14}
            style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '0.125rem' }}
          />
        </div>

        {/* Shared by + timestamp */}
        {(senderName || timestamp) && (
          <div
            style={{
              marginTop: '0.5rem',
              paddingTop: '0.375rem',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.6875rem',
              color: 'var(--color-text-muted)',
            }}
          >
            {senderName && <span>Shared by {senderName}</span>}
            {timestamp && (
              <span>
                {new Date(timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
