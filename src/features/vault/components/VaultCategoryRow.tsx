import { useRef, useState, useEffect, type ReactNode } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import type { VaultItem } from '../hooks/useVaultBrowse'
import { VaultContentCard } from './VaultContentCard'

interface Props {
  title: string
  categorySlug?: string
  items: VaultItem[]
  memberId: string | null
  showProgress?: boolean
  emptyMessage?: ReactNode
  onSelectItem?: (item: VaultItem) => void
}

export function VaultCategoryRow({ title, categorySlug, items, memberId, showProgress, emptyMessage, onSelectItem }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) el.addEventListener('scroll', checkScroll, { passive: true })
    return () => { el?.removeEventListener('scroll', checkScroll) }
  }, [items])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.7
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          {title}
        </h2>
        {categorySlug && items.length > 0 && (
          <a
            href={`/vault/category/${categorySlug}`}
            className="text-xs font-medium flex items-center gap-0.5"
            style={{ color: 'var(--color-btn-primary-bg)' }}
          >
            See All <ChevronRight size={14} />
          </a>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-2 py-4">
          {emptyMessage || (
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>No items yet</span>
          )}
        </div>
      ) : (
        <div className="relative group/row">
          {/* Left scroll arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full items-center justify-center shadow-md"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <ChevronLeft size={16} style={{ color: 'var(--color-text-primary)' }} />
            </button>
          )}

          {/* Scrollable row */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none' }}
          >
            {items.map(item => (
              <div key={item.id} className="w-44 sm:w-48 lg:w-52 shrink-0 snap-start">
                <VaultContentCard
                  item={item}
                  memberId={memberId}
                  showProgress={showProgress}
                  onSelect={onSelectItem}
                />
              </div>
            ))}
          </div>

          {/* Right scroll arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full items-center justify-center shadow-md"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <ChevronRight size={16} style={{ color: 'var(--color-text-primary)' }} />
            </button>
          )}
        </div>
      )}
    </section>
  )
}
