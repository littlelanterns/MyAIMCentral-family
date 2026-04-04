/**
 * Layer 4: ActionStepItem (PRD-23)
 * Thin wrapper for action_step extractions.
 */
import { ExtractionItem } from '../ExtractionItem'
import { TypeBadge } from './TypeBadge'
import type { BookExtraction } from '@/types/bookshelf'
import type { ExtractionType } from '@/lib/extractionActions'
import type { ReactNode } from 'react'

interface ActionStepItemProps {
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
  exercise: 'Exercise',
  practice: 'Practice',
  habit: 'Habit',
  conversation_starter: 'Conversation Starter',
  project: 'Project',
  daily_action: 'Daily Action',
  weekly_practice: 'Weekly Practice',
}

export function ActionStepItem({ item, ...props }: ActionStepItemProps) {
  const sentParts: string[] = []
  if (item.sent_to_tasks) sentParts.push('In Tasks')

  return (
    <ExtractionItem
      id={item.id}
      extractionType="action_step"
      text={item.text}
      isHearted={item.is_hearted}
      isKeyPoint={item.is_key_point}
      isFromGoDeeper={item.is_from_go_deeper}
      userNote={item.user_note}
      borderColorClass="border-l-[var(--color-success,#4a8a5c)]"
      isEditing={false}
      sentIndicators={sentParts.length > 0 ? <span>{sentParts.join(' · ')}</span> : null}
      renderMeta={() => (
        <TypeBadge label={CONTENT_TYPE_LABELS[item.content_type || ''] || item.content_type || ''} variant="action" />
      )}
      {...props}
    />
  )
}
