/**
 * PRD-25 Phase B: SendToGrid — Simplified routing grid for Guided members.
 * 4 destinations: Journal, Homework, Message (stub), Task Note.
 */

import { useState, useCallback } from 'react'
import { BookOpen, GraduationCap, MessageCircle, ClipboardList, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useTasks } from '@/hooks/useTasks'

interface SendToGridProps {
  content: string
  familyId: string
  memberId: string
  onSent: () => void
  onCancel: () => void
}

type Destination = 'journal' | 'homework' | 'message' | 'task_note'

export function SendToGrid({ content, familyId, memberId, onSent, onCancel }: SendToGridProps) {
  const [sending, setSending] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [pickingTask, setPickingTask] = useState(false)

  // Fetch active tasks for Task Note picker
  const { data: tasks = [] } = useTasks(familyId, {
    assigneeId: memberId,
    status: ['pending', 'in_progress'],
  })

  const handleDestination = useCallback(async (dest: Destination) => {
    if (dest === 'message') return // Stub — disabled
    if (dest === 'task_note') {
      setPickingTask(true)
      return
    }

    setSending(true)
    try {
      await supabase.from('journal_entries').insert({
        family_id: familyId,
        member_id: memberId,
        entry_type: 'journal_entry',
        content: content.trim(),
        visibility: 'shared_parents',
        is_included_in_ai: true,
        entry_category: dest === 'homework' ? 'homework' : null,
      })

      if (dest === 'homework') {
        setConfirmation('Saved to your homework folder! Your parent can see this.')
      } else {
        setConfirmation('Saved to your journal!')
      }

      setTimeout(() => {
        setConfirmation(null)
        onSent()
      }, 1800)
    } finally {
      setSending(false)
    }
  }, [content, familyId, memberId, onSent])

  const handleTaskNote = useCallback(async (taskId: string) => {
    setSending(true)
    try {
      // Attach content as completion note on selected task
      await supabase.from('tasks').update({
        completion_note: content.trim(),
      }).eq('id', taskId)

      setConfirmation('Added to your task!')
      setPickingTask(false)
      setTimeout(() => {
        setConfirmation(null)
        onSent()
      }, 1800)
    } finally {
      setSending(false)
    }
  }, [content, onSent])

  // Confirmation view
  if (confirmation) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
        >
          <Check size={24} />
        </div>
        <p className="text-sm font-medium text-center" style={{ color: 'var(--color-text-primary)' }}>
          {confirmation}
        </p>
      </div>
    )
  }

  // Task picker view
  if (pickingTask) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
          Which task is this for?
        </p>
        {tasks.length === 0 ? (
          <p className="text-sm py-4" style={{ color: 'var(--color-text-secondary)' }}>
            No active tasks right now.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {tasks.slice(0, 10).map(task => (
              <button
                key={task.id}
                onClick={() => handleTaskNote(task.id)}
                disabled={sending}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  minHeight: '44px',
                }}
              >
                {task.title}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setPickingTask(false)}
          className="w-full text-center py-2 text-sm"
          style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
        >
          Back
        </button>
      </div>
    )
  }

  // Main routing grid
  const destinations: Array<{
    key: Destination
    label: string
    icon: React.ReactNode
    disabled: boolean
    description?: string
  }> = [
    { key: 'journal', label: 'Journal', icon: <BookOpen size={22} />, disabled: false },
    { key: 'homework', label: 'Homework', icon: <GraduationCap size={22} />, disabled: false },
    { key: 'message', label: 'Message', icon: <MessageCircle size={22} />, disabled: true, description: 'Coming soon!' },
    { key: 'task_note', label: 'Task Note', icon: <ClipboardList size={22} />, disabled: false },
  ]

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
        Send to...
      </p>
      <div className="grid grid-cols-2 gap-2">
        {destinations.map(dest => (
          <button
            key={dest.key}
            onClick={() => handleDestination(dest.key)}
            disabled={dest.disabled || sending}
            className="flex flex-col items-center gap-1.5 p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: dest.disabled ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              opacity: dest.disabled ? 0.5 : 1,
              minHeight: '48px',
            }}
          >
            {dest.icon}
            <span className="text-sm font-medium">{dest.label}</span>
            {dest.description && (
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {dest.description}
              </span>
            )}
          </button>
        ))}
      </div>
      <button
        onClick={onCancel}
        className="w-full text-center py-2 text-sm"
        style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
      >
        Cancel
      </button>
    </div>
  )
}
