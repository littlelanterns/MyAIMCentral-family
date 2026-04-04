/**
 * Layer 4: DeclarationItem (PRD-23)
 * Thin wrapper for declaration extractions. Uses declaration_text, not text.
 */
import { ExtractionItem } from '../ExtractionItem'
import { TypeBadge } from './TypeBadge'
import type { BookExtraction } from '@/types/bookshelf'
import type { ExtractionType } from '@/lib/extractionActions'
import type { ReactNode } from 'react'

interface DeclarationItemProps {
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

const STYLE_LABELS: Record<string, string> = {
  choosing_committing: 'Choosing & Committing',
  recognizing_awakening: 'Recognizing & Awakening',
  claiming_stepping_into: 'Claiming & Stepping Into',
  learning_striving: 'Learning & Striving',
  resolute_unashamed: 'Resolute & Unashamed',
}

export function DeclarationItem({ item, ...props }: DeclarationItemProps) {
  return (
    <ExtractionItem
      id={item.id}
      extractionType="declaration"
      text={item.declaration_text || item.text}
      isHearted={item.is_hearted}
      isKeyPoint={item.is_key_point}
      isFromGoDeeper={item.is_from_go_deeper}
      userNote={item.user_note}
      borderColorClass="border-l-[var(--color-accent-warm,#d4956a)]"
      isEditing={false}
      sentIndicators={
        item.sent_to_guiding_stars ? <span>In Guiding Stars</span> : null
      }
      renderMeta={() => (
        <div className="flex items-center gap-2">
          <TypeBadge label={STYLE_LABELS[item.style_variant ?? ''] || item.style_variant || 'Declaration'} variant="declaration" />
          {item.value_name && (
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">
              {item.value_name}
            </span>
          )}
        </div>
      )}
      renderText={() => (
        <blockquote className="italic text-sm text-[var(--color-text-primary)] leading-relaxed border-l-0">
          &ldquo;{item.declaration_text || item.text}&rdquo;
        </blockquote>
      )}
      {...props}
    />
  )
}
