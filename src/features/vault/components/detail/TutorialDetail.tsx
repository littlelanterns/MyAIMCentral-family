import { useRef, useEffect, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import type { VaultItem } from '../../hooks/useVaultBrowse'
import { ContentProtection } from '../ContentProtection'

interface Props {
  item: VaultItem
  memberId: string | null
  updateProgress: (percent: number) => void
}

/**
 * Tutorial detail view (PRD-21A).
 * Renders rich text content and/or iframe embeds.
 * Progress auto-tracks based on scroll position.
 */
export function TutorialDetail({ item, memberId, updateProgress }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)

  // Track scroll progress
  const handleScroll = useCallback(() => {
    const el = contentRef.current
    if (!el) return
    const scrollPercent = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)
    if (scrollPercent > 0 && scrollPercent % 10 === 0) {
      updateProgress(scrollPercent)
    }
  }, [updateProgress])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <div ref={contentRef} className="p-4 md:p-6">
      {/* Full description */}
      {item.full_description && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          {item.full_description}
        </p>
      )}

      {/* Learning outcomes */}
      {item.learning_outcomes && item.learning_outcomes.length > 0 && (
        <div className="mb-5 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            What you'll learn
          </p>
          <ul className="space-y-1">
            {item.learning_outcomes.map((outcome, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Sparkles size={12} className="shrink-0 mt-1" style={{ color: 'var(--color-btn-primary-bg)' }} />
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content: iframe embed or rich text */}
      {item.content_url ? (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
          <iframe
            src={item.content_url}
            className="w-full border-0"
            style={{ minHeight: '600px' }}
            title={item.detail_title || item.display_title}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      ) : item.content_body ? (
        <ContentProtection disableSelection={false}>
          <div
            className="prose prose-sm max-w-none"
            style={{ color: 'var(--color-text-primary)' }}
            dangerouslySetInnerHTML={{ __html: item.content_body }}
          />
        </ContentProtection>
      ) : (
        <div className="text-center py-12">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Content is being prepared. Check back soon!
          </p>
        </div>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-6">
          {item.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[10px]"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
