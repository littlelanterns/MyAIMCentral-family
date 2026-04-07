/**
 * BookCard — grid and compact variants (PRD-23)
 */
import { FileText, FileType, BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { BookShelfItem } from '@/types/bookshelf'

// ─── File type icon mapping ─────────────────────────────────

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  epub: BookOpen,
  docx: FileText,
  txt: FileText,
  md: FileText,
  image: FileType,
  text_note: FileText,
}

function FileIcon({ fileType, size = 20 }: { fileType: string; size?: number }) {
  const Icon = FILE_ICONS[fileType] || FileText
  return <Icon size={size} />
}

// ─── Status badge ───────────────────────────────────────────

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    completed: 'var(--color-status-success)',
    failed: 'var(--color-status-error)',
    extracting: 'var(--color-status-warning)',
    discovering: 'var(--color-status-warning)',
    processing: 'var(--color-status-warning)',
    none: 'var(--color-text-tertiary)',
    pending: 'var(--color-text-tertiary)',
  }
  return (
    <span
      className="inline-flex items-center text-xs px-1.5 py-0.5 rounded-full"
      style={{
        backgroundColor: `color-mix(in srgb, ${colors[status] || 'var(--color-text-tertiary)'} 15%, transparent)`,
        color: colors[status] || 'var(--color-text-tertiary)',
      }}
    >
      {label}
    </span>
  )
}

// ─── Props ──────────────────────────────────────────────────

interface BookCardProps {
  book: BookShelfItem
  layout: 'grid' | 'compact'
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
  onClick: (book: BookShelfItem) => void
  parts?: BookShelfItem[]
}

// ─── Grid Variant ───────────────────────────────────────────

function GridCard({ book, selected, onSelect, onClick, parts }: BookCardProps) {
  const [showParts, setShowParts] = useState(false)
  const hasParts = parts && parts.length > 0

  return (
    <div
      className="group relative rounded-lg p-3 cursor-pointer transition-all"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
      }}
      onClick={() => onClick(book)}
    >
      {/* Checkbox */}
      <label
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 md:opacity-0 transition-opacity"
        style={{ opacity: selected ? 1 : undefined }}
        onClick={e => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={e => onSelect(book.id, e.target.checked)}
          className="w-4 h-4 rounded"
        />
      </label>

      {/* File type icon */}
      <div
        className="w-10 h-10 rounded-md flex items-center justify-center mb-2"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
          color: 'var(--color-accent)',
        }}
      >
        <FileIcon fileType={book.file_type} size={22} />
      </div>

      {/* Title */}
      <h3
        className="text-sm font-medium leading-tight line-clamp-2 mb-1"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {book.title}
      </h3>

      {/* Author */}
      {book.author && (
        <p
          className="text-xs truncate mb-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {book.author}
        </p>
      )}

      {/* Badges row */}
      <div className="flex flex-wrap gap-1 mb-2">
        <StatusBadge
          status={book.extraction_status}
          label={book.extraction_status === 'completed' ? 'Extracted' : book.extraction_status === 'none' ? 'Not extracted' : book.extraction_status}
        />
        <span
          className="text-xs px-1.5 py-0.5 rounded-full uppercase"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-text-tertiary) 12%, transparent)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          {book.file_type}
        </span>
        {hasParts && (
          <span
            className="text-xs px-1.5 py-0.5 rounded-full cursor-pointer"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
              color: 'var(--color-accent)',
            }}
            onClick={e => { e.stopPropagation(); setShowParts(!showParts) }}
          >
            {parts.length} parts {showParts ? <ChevronDown size={10} className="inline" /> : <ChevronRight size={10} className="inline" />}
          </span>
        )}
      </div>

      {/* Tags */}
      {book.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {book.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 10%, transparent)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {tag}
            </span>
          ))}
          {book.tags.length > 3 && (
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              +{book.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Expanded parts list */}
      {showParts && hasParts && (
        <div
          className="mt-2 pt-2 space-y-1"
          style={{ borderTop: '1px solid var(--color-border)' }}
          onClick={e => e.stopPropagation()}
        >
          {parts.map(part => (
            <div
              key={part.id}
              className="text-xs flex items-center gap-1 cursor-pointer rounded px-1 py-0.5 hover:opacity-80"
              style={{ color: 'var(--color-text-secondary)' }}
              onClick={() => onClick(part)}
            >
              <FileIcon fileType={part.file_type} size={12} />
              Part {part.part_number}: {part.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Compact Variant ────────────────────────────────────────

function CompactRow({ book, selected, onSelect, onClick }: BookCardProps) {
  return (
    <div
      className="group flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md transition-colors hover:opacity-90"
      style={{
        backgroundColor: selected ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : 'transparent',
        borderBottom: '1px solid var(--color-border)',
      }}
      onClick={() => onClick(book)}
    >
      <label onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={e => onSelect(book.id, e.target.checked)}
          className="w-4 h-4 rounded"
        />
      </label>

      <div
        className="w-7 h-7 rounded flex items-center justify-center shrink-0"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
          color: 'var(--color-accent)',
        }}
      >
        <FileIcon fileType={book.file_type} size={14} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {book.title}
          </span>
          {book.author && (
            <span className="text-xs truncate shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
              {book.author}
            </span>
          )}
        </div>
      </div>

      <StatusBadge
        status={book.extraction_status}
        label={book.extraction_status === 'completed' ? 'Extracted' : book.extraction_status === 'none' ? 'Not extracted' : book.extraction_status}
      />

      {book.tags.length > 0 && (
        <div className="hidden lg:flex gap-1 shrink-0">
          {book.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 10%, transparent)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Export ──────────────────────────────────────────────────

export function BookCard(props: BookCardProps) {
  if (props.layout === 'compact') return <CompactRow {...props} />
  return <GridCard {...props} />
}
