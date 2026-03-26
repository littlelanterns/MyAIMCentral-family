import { useState } from 'react'
import { Download, Copy, Sparkles, Check } from 'lucide-react'
import type { VaultItem } from '../../hooks/useVaultBrowse'
import { ContentProtection } from '../ContentProtection'

interface Props {
  item: VaultItem
  memberId: string | null
}

const PLATFORM_LABELS: Record<string, { label: string; action: string }> = {
  claude: { label: 'Claude', action: 'Download for Claude' },
  chatgpt: { label: 'ChatGPT', action: 'Copy for ChatGPT' },
  gemini: { label: 'Gemini', action: 'Copy for Gemini' },
}

/**
 * Skill detail view (PRD-21A).
 * Deployable AI instruction sets for external platforms.
 * Shows: description, platform selector, framework preview, deploy/download/copy buttons.
 */
export function SkillDetail({ item, memberId: _memberId }: Props) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    item.target_platforms?.[0] || 'claude'
  )
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)

  const platforms = item.target_platforms || []

  const handleDeployWithLila = () => {
    // STUB: Opens Optimizer conversation modal for family-context personalization
    alert('Deploy with LiLa — personalizes with family context. Coming soon!')
  }

  const handlePlatformAction = async (platform: string) => {
    if (platform === 'claude' && item.content_body) {
      // Download as .md file
      const blob = new Blob([item.content_body], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(item.detail_title || item.display_title).replace(/[^a-zA-Z0-9]/g, '-')}.md`
      a.click()
      URL.revokeObjectURL(url)
    } else if (item.content_body) {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(item.content_body)
      } catch {
        const textarea = document.createElement('textarea')
        textarea.value = item.content_body
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
    }

    setCopiedPlatform(platform)
    setTimeout(() => setCopiedPlatform(null), 2000)
  }

  return (
    <div className="p-4 md:p-6">
      {/* Full description */}
      {item.full_description && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {item.full_description}
        </p>
      )}

      {/* Platform compatibility */}
      {platforms.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Compatible Platforms
          </p>
          <div className="flex gap-2">
            {platforms.map(p => (
              <button
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: selectedPlatform === p ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
                  color: selectedPlatform === p ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                  border: `1px solid ${selectedPlatform === p ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                }}
              >
                {PLATFORM_LABELS[p]?.label || p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Learning outcomes / use cases */}
      {item.learning_outcomes && item.learning_outcomes.length > 0 && (
        <div className="mb-5 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            What this skill does
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

      {/* Framework preview (content protected) */}
      {item.content_body && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Skill Framework Preview
          </p>
          <ContentProtection disableSelection disableImageRightClick={false}>
            <div
              className="p-3 rounded-lg text-xs leading-relaxed max-h-60 overflow-y-auto"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
            >
              <pre className="whitespace-pre-wrap font-mono">
                {item.content_body.slice(0, 800)}{item.content_body.length > 800 ? '\n\n... (full framework available via download/copy)' : ''}
              </pre>
            </div>
          </ContentProtection>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mt-6">
        {/* Deploy with LiLa (premium action) */}
        <button
          onClick={handleDeployWithLila}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          <Sparkles size={16} />
          Deploy with LiLa
        </button>

        {/* Platform-specific buttons */}
        {platforms.map(p => {
          const info = PLATFORM_LABELS[p]
          if (!info) return null
          const isCopied = copiedPlatform === p
          return (
            <button
              key={p}
              onClick={() => handlePlatformAction(p)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: isCopied ? 'var(--color-success, #22c55e)' : 'var(--color-bg-secondary)',
                color: isCopied ? '#fff' : 'var(--color-text-primary)',
                border: `1px solid ${isCopied ? 'var(--color-success, #22c55e)' : 'var(--color-border)'}`,
              }}
            >
              {isCopied ? <Check size={16} /> : p === 'claude' ? <Download size={16} /> : <Copy size={16} />}
              {isCopied ? 'Done!' : info.action}
            </button>
          )
        })}
      </div>

      {/* Estimated setup time */}
      {item.estimated_minutes && (
        <p className="text-xs mt-4" style={{ color: 'var(--color-text-secondary)' }}>
          Estimated setup time: ~{item.estimated_minutes} minutes
        </p>
      )}
    </div>
  )
}
