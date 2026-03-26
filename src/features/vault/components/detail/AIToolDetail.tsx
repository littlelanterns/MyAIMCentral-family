import { useState } from 'react'
import { Play, ExternalLink, Info } from 'lucide-react'
import type { VaultItem } from '../../hooks/useVaultBrowse'

interface Props {
  item: VaultItem
  memberId: string | null
}

/**
 * AI Tool detail view (PRD-21A).
 * Portal page with tool description, tips, and Launch Tool button.
 * Delivery methods: native (LiLa modal), embedded (iframe), link_out (new tab).
 */
export function AIToolDetail({ item, memberId: _memberId }: Props) {
  const [launched, setLaunched] = useState(false)

  const handleLaunch = () => {
    if (item.delivery_method === 'link_out' && item.tool_url) {
      window.open(item.tool_url, '_blank', 'noopener,noreferrer')
    } else if (item.delivery_method === 'native' && item.guided_mode_key) {
      // STUB: Would open LiLa conversation modal in the tool's guided mode
      alert(`Launch LiLa in "${item.guided_mode_key}" mode — coming soon!`)
    } else if (item.delivery_method === 'embedded') {
      // STUB: Would load tool in iframe
      setLaunched(true)
    }
  }

  return (
    <div className="p-4 md:p-6">
      {/* Full description */}
      {item.full_description && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {item.full_description}
        </p>
      )}

      {/* Portal description */}
      {item.portal_description && (
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{item.portal_description}</p>
        </div>
      )}

      {/* Tips */}
      {item.portal_tips && item.portal_tips.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
            <Info size={12} /> Tips before you start
          </p>
          <ul className="space-y-1.5">
            {item.portal_tips.map((tip, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <span className="shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prerequisites */}
      {item.prerequisites_text && (
        <div className="mb-5 p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Prerequisites
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{item.prerequisites_text}</p>
        </div>
      )}

      {/* Auth requirement notice */}
      {item.requires_auth && item.auth_provider && (
        <p className="text-xs mb-4 italic" style={{ color: 'var(--color-text-secondary)' }}>
          This tool requires a {item.auth_provider} account.
        </p>
      )}

      {/* Embedded iframe (when launched) */}
      {launched && item.delivery_method === 'embedded' && item.tool_url ? (
        <div className="rounded-lg overflow-hidden mb-4" style={{ border: '1px solid var(--color-border)' }}>
          <iframe
            src={item.tool_url}
            className="w-full border-0"
            style={{ minHeight: '500px' }}
            title={item.detail_title || item.display_title}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      ) : (
        /* Launch button */
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleLaunch}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {item.delivery_method === 'link_out' ? <ExternalLink size={16} /> : <Play size={16} />}
            Launch Tool
          </button>
        </div>
      )}

      {/* Platform info */}
      {item.platform && (
        <p className="text-xs mt-4" style={{ color: 'var(--color-text-secondary)' }}>
          Platform: {item.platform}
        </p>
      )}
    </div>
  )
}
