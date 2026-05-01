/**
 * ApplyThisSheet (PRD-23)
 * Routing grid for "Apply This" action on extraction items.
 * Destinations: Guiding Stars, Best Intentions, Tasks, Tracker, Journal Prompts, + coming soon.
 */
import { useState } from 'react'
import {
  Star, Target, CheckSquare, Repeat, BookOpen,
  Inbox, Brain, Compass, FolderKanban,
  FileEdit, MessageSquare,
} from 'lucide-react'
import type { ExtractionType } from '@/lib/extractionActions'

interface ApplyThisSheetProps {
  itemId: string
  itemText: string
  extractionType: ExtractionType
  bookTitle: string | null
  chapterTitle: string | null
  onSendToGuidingStars: (type: ExtractionType, id: string, text: string) => Promise<unknown>
  onSendToBestIntentions: (id: string, text: string) => Promise<unknown>
  onSendToJournalPrompts: (id: string, text: string, bookTitle: string | null, chapterTitle: string | null) => Promise<unknown>
  onSendToQueue: (type: ExtractionType, id: string, text: string, bookTitle: string | null) => Promise<unknown>
  onSendToSelfKnowledge: (type: ExtractionType, id: string, text: string) => Promise<unknown>
  onSendToNotepad: (type: ExtractionType, id: string, text: string, bookTitle: string | null) => Promise<unknown>
  onSendToMessages: (type: ExtractionType, id: string, text: string, bookTitle: string | null) => Promise<unknown>
  onOpenTaskCreation: (title: string, description: string, taskType?: string, extractionType?: ExtractionType) => void
  onClose: () => void
}

interface Destination {
  icon: React.ElementType
  label: string
  tooltip: string
  action?: () => void
  comingSoon?: boolean
}

export function ApplyThisSheet({
  itemId, itemText, extractionType, bookTitle, chapterTitle,
  onSendToGuidingStars, onSendToBestIntentions,
  onSendToJournalPrompts, onSendToQueue, onSendToSelfKnowledge,
  onSendToNotepad, onSendToMessages,
  onOpenTaskCreation, onClose,
}: ApplyThisSheetProps) {
  const [sending, setSending] = useState<string | null>(null)

  const truncTitle = itemText.slice(0, 60) + (itemText.length > 60 ? '...' : '')

  const handleAction = async (key: string, fn: () => Promise<unknown> | void) => {
    setSending(key)
    try {
      await fn()
    } finally {
      setSending(null)
    }
  }

  const destinations: Destination[] = [
    {
      icon: Star,
      label: 'Guiding Stars',
      tooltip: 'Make this a declaration you live by',
      action: () => handleAction('gs', () => onSendToGuidingStars(extractionType, itemId, itemText)),
    },
    {
      icon: Target,
      label: 'Best Intentions',
      tooltip: 'Turn this into a daily intention',
      action: () => handleAction('bi', () => onSendToBestIntentions(itemId, itemText)),
    },
    {
      icon: CheckSquare,
      label: 'Tasks',
      tooltip: 'Create a task from this',
      action: () => {
        onOpenTaskCreation(truncTitle, itemText, undefined, extractionType)
        onClose()
      },
    },
    {
      icon: Repeat,
      label: 'Tracker',
      tooltip: 'Track this as a recurring practice',
      action: () => {
        onOpenTaskCreation(truncTitle, itemText, 'habit', extractionType)
        onClose()
      },
    },
    {
      icon: BookOpen,
      label: 'Journal Prompts',
      tooltip: 'Save as a reflection prompt',
      action: () => handleAction('jp', () => onSendToJournalPrompts(itemId, itemText, bookTitle, chapterTitle)),
    },
    {
      icon: Inbox,
      label: 'Queue',
      tooltip: 'Send to review queue for later',
      action: () => handleAction('queue', () => onSendToQueue(extractionType, itemId, itemText, bookTitle)),
    },
    {
      icon: Brain,
      label: 'InnerWorkings',
      tooltip: 'Add to your self-knowledge',
      action: () => handleAction('iw', () => onSendToSelfKnowledge(extractionType, itemId, itemText)),
    },
    {
      icon: FileEdit,
      label: 'Notepad',
      tooltip: 'Open in Smart Notepad',
      action: () => handleAction('notepad', () => onSendToNotepad(extractionType, itemId, itemText, bookTitle)),
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      tooltip: 'Send via Messages (routes to queue)',
      action: () => handleAction('messages', () => onSendToMessages(extractionType, itemId, itemText, bookTitle)),
    },
    {
      icon: Compass,
      label: 'LifeLantern',
      tooltip: 'Use this to set a life area goal',
      comingSoon: true,
    },
    {
      icon: FolderKanban,
      label: 'BigPlans',
      tooltip: 'Create a project goal from this',
      comingSoon: true,
    },
  ]

  return (
    <div className="mt-2 p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
      <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Apply This</div>
      <div className="grid grid-cols-4 gap-1.5">
        {destinations.map(dest => {
          const Icon = dest.icon
          const isSending = sending === dest.label.toLowerCase().replace(/\s/g, '')
          return (
            <button
              key={dest.label}
              onClick={dest.action}
              disabled={dest.comingSoon || !!sending}
              title={dest.tooltip}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-colors
                ${dest.comingSoon
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-[var(--color-surface-tertiary)] cursor-pointer'
                }
                ${isSending ? 'animate-pulse' : ''}
              `}
            >
              <Icon size={18} className="text-[var(--color-text-secondary)]" />
              <span className="text-[10px] leading-tight text-[var(--color-text-secondary)]">
                {dest.label}
              </span>
              {dest.comingSoon && (
                <span className="text-[8px] px-1 rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]">
                  Soon
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
