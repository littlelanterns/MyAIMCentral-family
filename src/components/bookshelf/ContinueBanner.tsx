/**
 * ContinueBanner — "Continue Where You Left Off" (PRD-23)
 * Reads bookshelf-last-book-id / bookshelf-last-book-title from sessionStorage.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, X } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'

export function ContinueBanner() {
  const navigate = useNavigate()
  const { data: member } = useFamilyMember()
  const [dismissed, setDismissed] = useState(false)

  // Scope sessionStorage keys by member ID to prevent cross-member leaking
  const prefix = member?.id ? `bookshelf-${member.id}-` : 'bookshelf-'
  const bookId = sessionStorage.getItem(`${prefix}last-book-id`)
  const bookTitle = sessionStorage.getItem(`${prefix}last-book-title`)

  if (!bookId || !bookTitle || dismissed) return null

  function handleDismiss() {
    sessionStorage.removeItem(`${prefix}last-book-id`)
    sessionStorage.removeItem(`${prefix}last-book-title`)
    setDismissed(true)
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg mb-4"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
      }}
    >
      <BookOpen size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
      <span className="text-sm flex-1 min-w-0" style={{ color: 'var(--color-text-primary)' }}>
        Continue reading{' '}
        <strong className="truncate">{bookTitle}</strong>
      </span>
      <button
        className="px-3 py-1 rounded-md text-sm font-medium shrink-0"
        style={{
          background: 'var(--surface-primary)',
          color: 'var(--color-text-on-primary)',
        }}
        onClick={() => navigate(`/bookshelf?book=${bookId}`)}
      >
        Continue
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 rounded hover:opacity-70 shrink-0"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
