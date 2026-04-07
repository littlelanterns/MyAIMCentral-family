import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import type { VaultItem } from '../hooks/useVaultBrowse'

interface Props {
  items: VaultItem[]
  memberId: string | null // reserved for future personalization
}

const CTA_LABELS: Record<string, string> = {
  tutorial: 'Start Tutorial',
  ai_tool: 'Try This Tool',
  prompt_pack: 'Browse Pack',
  curation: 'Explore Collection',
  workflow: 'View Workflow',
  skill: 'Learn More',
}

export function VaultHeroSpotlight({ items, memberId: _memberId }: Props) {
  const [index, setIndex] = useState(0)

  // Auto-rotate every 8s. Must run before any conditional return so the
  // hook order is stable across renders.
  useEffect(() => {
    if (items.length <= 1) return
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % items.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [items.length])

  const item = items[index]
  if (!item) return null

  return (
    <section className="relative rounded-xl overflow-hidden" style={{ minHeight: '220px' }}>
      {/* Background image */}
      <div className="absolute inset-0" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.35 }}
            onContextMenu={e => e.preventDefault()}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles size={64} style={{ color: 'var(--color-text-secondary)', opacity: 0.1 }} />
          </div>
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.2) 100%)' }} />

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8 flex flex-col justify-end min-h-[220px]">
        <span className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Featured
        </span>
        <h2 className="text-xl md:text-2xl font-bold text-white leading-tight max-w-lg">
          {item.display_title}
        </h2>
        <p className="text-sm text-white/80 mt-2 max-w-md line-clamp-2">
          {item.short_description}
        </p>
        <div className="mt-4">
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {CTA_LABELS[item.content_type] || 'Explore'}
          </button>
        </div>
      </div>

      {/* Navigation dots */}
      {items.length > 1 && (
        <div className="absolute bottom-3 right-4 z-10 flex items-center gap-2">
          <button onClick={() => setIndex(prev => (prev - 1 + items.length) % items.length)} className="p-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <ChevronLeft size={16} className="text-white" />
          </button>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="w-2 h-2 rounded-full transition-colors"
              style={{ backgroundColor: i === index ? 'var(--color-text-on-primary, #fff)' : 'rgba(255,255,255,0.4)' }}
            />
          ))}
          <button onClick={() => setIndex(prev => (prev + 1) % items.length)} className="p-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <ChevronRight size={16} className="text-white" />
          </button>
        </div>
      )}
    </section>
  )
}
