/**
 * GuidedThingsToTalkAboutSection — PRD-16 / PRD-25 integration
 *
 * Simple text input on the Guided Dashboard where a child can type things
 * they want to talk about with mom or dad. Creates `meeting_agenda_items`
 * records with `suggested_by_guided = true`.
 *
 * Items surface in the parent's mentor/parent-child meeting agenda as
 * "Suggested by [child name]."
 *
 * The child can also see and remove their own pending items.
 */

import { useState } from 'react'
import { MessageCircle, Send, X, Volume2 } from 'lucide-react'
import { useAddAgendaItem, useMeetingAgendaItems, useRemoveAgendaItem } from '@/hooks/useMeetings'

interface Props {
  familyId: string
  memberId: string
  readingSupport?: boolean
}

export function GuidedThingsToTalkAboutSection({ familyId, memberId, readingSupport }: Props) {
  const [text, setText] = useState('')
  const [justAdded, setJustAdded] = useState(false)

  const addItem = useAddAgendaItem()
  const removeItem = useRemoveAgendaItem()

  // Fetch this child's pending agenda items (parent_child type, scoped to this child)
  const { data: myItems = [] } = useMeetingAgendaItems(familyId, 'parent_child', memberId)

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed) return

    await addItem.mutateAsync({
      family_id: familyId,
      meeting_type: 'parent_child',
      related_member_id: memberId,
      content: trimmed,
      added_by: memberId,
      suggested_by_guided: true,
      source: 'quick_add',
    })

    setText('')
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  const handleRemove = async (itemId: string) => {
    await removeItem.mutateAsync({ id: itemId, family_id: familyId })
  }

  const speakText = (t: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(t)
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  const prompt = 'Anything you want to talk about with mom or dad?'

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={18} style={{ color: 'var(--color-accent-deep)' }} />
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          Things to Talk About
        </h3>
        {readingSupport && (
          <button onClick={() => speakText(prompt)} className="ml-auto p-1 rounded-lg hover:opacity-80">
            <Volume2 size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        )}
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        {prompt}
      </p>

      {/* Quick-add input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="Type something..."
          className="flex-1 rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || addItem.isPending}
          className="p-2 rounded-lg transition-colors disabled:opacity-40"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          <Send size={16} />
        </button>
      </div>

      {justAdded && (
        <p className="text-xs mt-2 font-medium" style={{ color: 'var(--color-accent-deep)' }}>
          Added! Mom will see it before your next meeting.
        </p>
      )}

      {/* Show child's pending items */}
      {myItems.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Your items ({myItems.length}):
          </p>
          {myItems.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5"
              style={{ background: 'var(--color-bg-secondary)' }}
            >
              <span className="text-xs flex-1" style={{ color: 'var(--color-text-primary)' }}>
                {item.content}
              </span>
              <button
                onClick={() => handleRemove(item.id)}
                className="p-0.5 rounded hover:opacity-70 shrink-0"
                title="Remove"
              >
                <X size={14} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
