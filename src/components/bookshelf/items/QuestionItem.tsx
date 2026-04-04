/**
 * Layer 4: QuestionItem (PRD-23)
 * Thin wrapper for question extractions.
 */
import { ExtractionItem } from '../ExtractionItem'
import { TypeBadge } from './TypeBadge'
import type { BookExtraction } from '@/types/bookshelf'
import type { ExtractionType } from '@/lib/extractionActions'
import type { ReactNode } from 'react'

interface QuestionItemProps {
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
  reflection: 'Reflection',
  implementation: 'Implementation',
  recognition: 'Recognition',
  self_examination: 'Self-Examination',
  discussion: 'Discussion',
  scenario: 'Scenario',
}

export function QuestionItem({ item, ...props }: QuestionItemProps) {
  const sentParts: string[] = []
  if (item.sent_to_prompts) sentParts.push('In Journal Prompts')
  if (item.sent_to_tasks) sentParts.push('In Tasks')

  return (
    <ExtractionItem
      id={item.id}
      extractionType="question"
      text={item.text}
      isHearted={item.is_hearted}
      isKeyPoint={item.is_key_point}
      isFromGoDeeper={item.is_from_go_deeper}
      userNote={item.user_note}
      borderColorClass="border-l-[var(--color-accent-deep,#8b5ab5)]"
      isEditing={false}
      sentIndicators={sentParts.length > 0 ? <span>{sentParts.join(' · ')}</span> : null}
      renderMeta={() => (
        <TypeBadge label={CONTENT_TYPE_LABELS[item.content_type || ''] || item.content_type || ''} variant="question" />
      )}
      {...props}
    />
  )
}
