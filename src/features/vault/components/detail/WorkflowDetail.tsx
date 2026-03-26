import { Sparkles } from 'lucide-react'
import type { VaultItem } from '../../hooks/useVaultBrowse'
import { ContentProtection } from '../ContentProtection'

interface Props {
  item: VaultItem
  memberId: string | null // reserved for future progress/copy tracking
}

/**
 * Workflow detail view (PRD-21A).
 * Step-by-step layout with numbered steps, instructions, and embedded copyable prompts.
 * Content comes from content_body (Markdown/HTML) with embedded prompt blocks.
 */
export function WorkflowDetail({ item, memberId: _memberId }: Props) {
  // Parse content_body for steps. Convention: steps delimited by "## Step N:" headers in Markdown.
  // For now render the full content_body as rich text with copy buttons on code blocks.
  // When admin adds structured workflows, this can be enhanced.

  return (
    <div className="p-4 md:p-6">
      {/* Full description */}
      {item.full_description && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {item.full_description}
        </p>
      )}

      {/* Estimated time and step count */}
      <div className="flex gap-4 mb-5">
        {item.estimated_minutes && (
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            ~{item.estimated_minutes} minutes total
          </span>
        )}
      </div>

      {item.content_body ? (
        <ContentProtection disableSelection>
          <div
            className="prose prose-sm max-w-none"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {/* Render content_body as HTML. Prompt blocks within are wrapped in <pre> tags
                and will have CopyPromptButton injected via post-processing in a future enhancement.
                For now, render raw and the content protection wrapper prevents text selection. */}
            <div dangerouslySetInnerHTML={{ __html: item.content_body }} />
          </div>
        </ContentProtection>
      ) : item.content_url ? (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
          <iframe
            src={item.content_url}
            className="w-full border-0"
            style={{ minHeight: '600px' }}
            title={item.detail_title || item.display_title}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Workflow steps are being prepared. Check back soon!
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
