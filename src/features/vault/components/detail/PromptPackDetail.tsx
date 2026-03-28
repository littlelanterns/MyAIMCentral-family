import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Save, Check, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { VaultItem } from '../../hooks/useVaultBrowse'
import type { PromptEntry } from '../../hooks/useVaultDetail'
import { ContentProtection } from '../ContentProtection'
import { CopyPromptButton } from '../CopyPromptButton'

interface Props {
  item: VaultItem
  entries: PromptEntry[]
  memberId: string | null
}

/** Save a prompt entry to user_saved_prompts */
async function saveToMyPrompts(memberId: string, entry: PromptEntry, item: VaultItem): Promise<boolean> {
  const { error } = await supabase.from('user_saved_prompts').insert({
    user_id: memberId,
    title: entry.title,
    prompt_text: entry.prompt_text,
    source_vault_item_id: item.id,
    source_prompt_entry_id: entry.id,
    is_lila_optimized: false,
    tags: entry.tags.length > 0 ? entry.tags : item.tags.slice(0, 5),
  })
  return !error
}

/**
 * Prompt Pack detail view (PRD-21A).
 *
 * Two rendering modes based on prompt_format:
 * - image_gen / video_gen → Gallery Mode (masonry grid of example output images)
 * - text_llm / audio_gen → List Mode (expandable text cards)
 */
export function PromptPackDetail({ item, entries, memberId }: Props) {
  const isGallery = item.prompt_format === 'image_gen' || item.prompt_format === 'video_gen'

  // If there's an interactive HTML content_url, render it via iframe (like TutorialDetail)
  const isStorageHtml = item.content_url?.includes('supabase.co/storage') && item.content_url?.endsWith('.html')
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [loadingHtml, setLoadingHtml] = useState(false)

  useEffect(() => {
    if (!isStorageHtml || !item.content_url) return
    setLoadingHtml(true)
    fetch(item.content_url)
      .then(r => r.text())
      .then(html => setHtmlContent(html))
      .catch(() => setHtmlContent(null))
      .finally(() => setLoadingHtml(false))
  }, [item.content_url, isStorageHtml])

  // Interactive HTML version takes priority when available
  if (isStorageHtml) {
    return (
      <div className="p-4 md:p-6">
        {item.full_description && (
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {item.full_description}
          </p>
        )}
        {loadingHtml ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)' }} />
            <span className="ml-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading prompt pack...</span>
          </div>
        ) : htmlContent ? (
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            <iframe
              srcDoc={htmlContent}
              className="w-full border-0"
              style={{ minHeight: '80vh' }}
              title={item.detail_title || item.display_title}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Failed to load content. Please try again later.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Pack description */}
      {item.full_description && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {item.full_description}
        </p>
      )}

      {/* Entry count */}
      <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        {entries.length} prompt{entries.length !== 1 ? 's' : ''} in this pack
      </p>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Content is being added to this pack. Check back soon!
          </p>
        </div>
      ) : isGallery ? (
        <PromptGallery entries={entries} item={item} memberId={memberId} />
      ) : (
        <PromptList entries={entries} item={item} memberId={memberId} />
      )}
    </div>
  )
}

// ── Shared save/optimize button logic ──

function SaveButton({ entry, item, memberId, dark }: { entry: PromptEntry; item: VaultItem; memberId: string | null; dark?: boolean }) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!memberId || saving || saved) return
    setSaving(true)
    const ok = await saveToMyPrompts(memberId, entry, item)
    setSaving(false)
    if (ok) setSaved(true)
  }

  return (
    <button
      onClick={handleSave}
      disabled={saving || saved}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
      style={dark
        ? { backgroundColor: saved ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.2)', color: 'var(--color-text-on-primary, #fff)' }
        : { backgroundColor: saved ? 'var(--color-success, #22c55e)' : 'var(--color-bg-secondary)', color: saved ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-primary)' }
      }
    >
      {saved ? <Check size={dark ? 10 : 12} /> : <Save size={dark ? 10 : 12} />}
      {saved ? 'Saved!' : 'Save'}
    </button>
  )
}

function OptimizeButton({ dark }: { dark?: boolean }) {
  // STUB: Optimizer EF not deployed yet. Show a gentle message.
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: When PRD-05C Optimizer is built, launch LiLa Optimizer conversation modal
    // with vault_item_id as context metadata and the specific prompt text pre-loaded.
  }

  return (
    <button
      onClick={handleClick}
      title="Optimize with LiLa — coming soon"
      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium opacity-60"
      style={dark
        ? { backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--color-text-on-primary, #fff)' }
        : { backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }
      }
    >
      <Sparkles size={dark ? 10 : 12} /> Optimize
    </button>
  )
}

// ── Gallery Mode (image_gen / video_gen) ──

function PromptGallery({ entries, item, memberId }: { entries: PromptEntry[]; item: VaultItem; memberId: string | null }) {
  const [activeEntry, setActiveEntry] = useState<string | null>(null)

  return (
    <ContentProtection disableSelection disableImageRightClick>
      <div className="columns-2 md:columns-3 gap-3 space-y-3">
        {entries.map(entry => (
          <div
            key={entry.id}
            className="break-inside-avoid rounded-lg overflow-hidden group relative cursor-pointer"
            style={{ border: '1px solid var(--color-border)' }}
            onClick={() => setActiveEntry(activeEntry === entry.id ? null : entry.id)}
          >
            {/* Example output image */}
            {entry.example_outputs.length > 0 ? (
              <img
                src={entry.example_outputs[0]}
                alt={entry.title}
                className="w-full object-cover"
                onContextMenu={e => e.preventDefault()}
                draggable={false}
              />
            ) : (
              <div className="aspect-square flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <ImageIcon size={32} style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }} />
              </div>
            )}

            {/* Title overlay on hover/tap */}
            <div
              className="absolute inset-x-0 bottom-0 p-2 transition-opacity"
              style={{
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                opacity: activeEntry === entry.id ? 1 : 0,
              }}
            >
              <p className="text-xs font-medium text-white">{entry.title}</p>
            </div>

            {/* Expanded overlay with prompt text and actions */}
            {activeEntry === entry.id && (
              <div
                className="absolute inset-0 flex flex-col justify-end p-3"
                style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
                onClick={e => e.stopPropagation()}
              >
                <p className="text-xs font-semibold text-white mb-1">{entry.title}</p>
                <p className="text-[11px] text-white/80 line-clamp-4 mb-2">
                  {entry.prompt_text.slice(0, 200)}{entry.prompt_text.length > 200 ? '...' : ''}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  <CopyPromptButton
                    text={entry.prompt_text}
                    memberId={memberId}
                    vaultItemId={item.id}
                    promptEntryId={entry.id}
                    size="sm"
                  />
                  <SaveButton entry={entry} item={item} memberId={memberId} dark />
                  <OptimizeButton dark />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reference images section */}
      {entries.some(e => e.reference_images.length > 0) && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Style References
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {entries.flatMap(e => e.reference_images).map((url, i) => (
              <img
                key={i}
                src={url}
                alt="Style reference"
                className="w-full aspect-square object-cover rounded-lg"
                onContextMenu={e => e.preventDefault()}
                draggable={false}
              />
            ))}
          </div>
        </div>
      )}
    </ContentProtection>
  )
}

// ── List Mode (text_llm / audio_gen) ──

function PromptList({ entries, item, memberId }: { entries: PromptEntry[]; item: VaultItem; memberId: string | null }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <ContentProtection disableSelection disableImageRightClick={false}>
      <div className="space-y-2">
        {entries.map(entry => {
          const expanded = expandedId === entry.id
          return (
            <div
              key={entry.id}
              className="rounded-lg border overflow-hidden"
              style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
            >
              {/* Header (always visible) */}
              <button
                onClick={() => setExpandedId(expanded ? null : entry.id)}
                className="w-full text-left p-3 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {entry.title}
                  </p>
                  {!expanded && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {entry.prompt_text.slice(0, 100)}...
                    </p>
                  )}
                </div>
                {expanded ? (
                  <ChevronUp size={16} style={{ color: 'var(--color-text-secondary)' }} />
                ) : (
                  <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
                )}
              </button>

              {/* Expanded content */}
              {expanded && (
                <div className="px-3 pb-3">
                  <div
                    className="p-3 rounded text-xs whitespace-pre-wrap leading-relaxed"
                    style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                  >
                    {entry.prompt_text}
                  </div>

                  {/* Variable placeholders */}
                  {entry.variable_placeholders.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Variables</p>
                      <div className="flex flex-wrap gap-1">
                        {entry.variable_placeholders.map(v => (
                          <span key={v} className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-btn-primary-bg)' }}>
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <CopyPromptButton
                      text={entry.prompt_text}
                      memberId={memberId}
                      vaultItemId={item.id}
                      promptEntryId={entry.id}
                    />
                    <SaveButton entry={entry} item={item} memberId={memberId} />
                    <OptimizeButton />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </ContentProtection>
  )
}
