/**
 * Layer 4: InsightItem (PRD-23)
 * Thin wrapper around ExtractionItem for insight extractions.
 */
import { ExtractionItem } from '../ExtractionItem'
import { TypeBadge } from './TypeBadge'
import type { BookExtraction } from '@/types/bookshelf'
import type { ExtractionType } from '@/lib/extractionActions'
import type { ReactNode } from 'react'

interface InsightItemProps {
  item: BookExtraction
  isDeleting: boolean
  isNoting: boolean
  showApplyThis: boolean
  onHeart: (type: ExtractionType, id: string, hearted: boolean) => void
  onNoteToggle: (id: string | null) => void
  onNoteSave: (type: ExtractionType, id: string, note: string) => void
  onDelete: (type: ExtractionType, id: string) => void
  onApplyThisToggle: (id: string | null) => void
  applyThisContent?: ReactNode
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  principle: 'Principle',
  framework: 'Framework',
  mental_model: 'Mental Model',
  process: 'Process',
  strategy: 'Strategy',
  concept: 'Concept',
  system: 'System',
  tool_set: 'Tool Set',
}

export function InsightItem({ item, ...props }: InsightItemProps) {
  return (
    <ExtractionItem
      id={item.id}
      extractionType="insight"
      text={item.text}
      isHearted={item.is_hearted}
      isKeyPoint={item.is_key_point}
      isFromGoDeeper={item.is_from_go_deeper}
      userNote={item.user_note}
      borderColorClass="border-l-[var(--color-btn-primary-bg,#5b7bb5)]"
      isEditing={false}
      renderMeta={() => (
        <TypeBadge label={CONTENT_TYPE_LABELS[item.content_type || ''] || item.content_type || ''} variant="insight" />
      )}
      {...props}
    />
  )
}
