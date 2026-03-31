/**
 * Layer 4: SummaryItem (PRD-23)
 * Thin wrapper around ExtractionItem for bookshelf_summaries.
 */
import { ExtractionItem } from '../ExtractionItem'
import { TypeBadge } from './TypeBadge'
import type { BookShelfSummary } from '@/types/bookshelf'
import type { ExtractionTable } from '@/lib/extractionActions'
import type { ReactNode } from 'react'

interface SummaryItemProps {
  item: BookShelfSummary
  isDeleting: boolean
  isNoting: boolean
  showApplyThis: boolean
  onHeart: (table: ExtractionTable, id: string, hearted: boolean) => void
  onNoteToggle: (id: string | null) => void
  onNoteSave: (table: ExtractionTable, id: string, note: string) => void
  onDelete: (table: ExtractionTable, id: string) => void
  onApplyThisToggle: (id: string | null) => void
  applyThisContent?: ReactNode
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  key_concept: 'Key Concept',
  story: 'Story',
  metaphor: 'Metaphor',
  lesson: 'Lesson',
  quote: 'Quote',
  insight: 'Insight',
  theme: 'Theme',
  character_insight: 'Character',
  exercise: 'Exercise',
  principle: 'Principle',
}

export function SummaryItem({ item, ...props }: SummaryItemProps) {
  return (
    <ExtractionItem
      id={item.id}
      table="bookshelf_summaries"
      text={item.text}
      isHearted={item.is_hearted}
      isKeyPoint={item.is_key_point}
      isFromGoDeeper={item.is_from_go_deeper}
      userNote={item.user_note}
      borderColorClass="border-l-[var(--color-accent,#4a9a8a)]"
      isEditing={false}
      renderMeta={() => (
        <TypeBadge label={CONTENT_TYPE_LABELS[item.content_type] || item.content_type} variant="summary" />
      )}
      {...props}
    />
  )
}
