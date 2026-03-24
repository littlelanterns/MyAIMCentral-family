/**
 * PRD-09A: Task Breaker AI
 * Text input → ai-parse Edge Function → 3 decomposition levels.
 * Also supports image input (Full Magic tier, gated by PermissionGate).
 */

import { useState } from 'react'
import {
  Zap, ChevronDown, ChevronUp, X, Loader2, Check,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { TaskBreakerLevel } from '@/types/tasks'

interface TaskBreakerProps {
  taskTitle: string
  taskDescription?: string
  onApply: (subtasks: BrokenTask[]) => void
  onCancel: () => void
}

export interface BrokenTask {
  title: string
  description?: string
  suggestedAssignee?: string // family member name
}

const DETAIL_LEVELS: { key: TaskBreakerLevel; label: string; description: string }[] = [
  { key: 'quick', label: 'Quick', description: '3–5 high-level steps' },
  { key: 'detailed', label: 'Detailed', description: '5–10 steps with descriptions' },
  { key: 'granular', label: 'Granular', description: '10–20 micro-steps' },
]

export function TaskBreaker({ taskTitle, taskDescription, onApply, onCancel }: TaskBreakerProps) {
  const { data: member } = useFamilyMember()
  const [level, setLevel] = useState<TaskBreakerLevel>('detailed')
  const [subtasks, setSubtasks] = useState<BrokenTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [_imageMode, _setImageMode] = useState(false)

  async function handleBreakDown() {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-parse', {
        body: {
          action: 'task_breaker',
          content: taskTitle + (taskDescription ? `\n\n${taskDescription}` : ''),
          options: {
            level,
            family_context: member ? { member_name: member.display_name } : undefined,
          },
        },
      })

      if (fnError) throw fnError

      // Parse AI response into subtask array
      const items: BrokenTask[] = Array.isArray(data?.items)
        ? data.items.map((item: { title?: string; description?: string; assignee?: string }) => ({
            title: item.title ?? String(item),
            description: item.description,
            suggestedAssignee: item.assignee,
          }))
        : parseTextResponse(data?.text ?? data?.content ?? '')

      setSubtasks(items)
    } catch (err) {
      setError('Failed to break down task. Try again.')
      console.error('Task Breaker error:', err)
    } finally {
      setLoading(false)
    }
  }

  function removeSubtask(idx: number) {
    setSubtasks(prev => prev.filter((_, i) => i !== idx))
  }

  function moveSubtask(idx: number, direction: 'up' | 'down') {
    setSubtasks(prev => {
      const arr = [...prev]
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= arr.length) return arr
      ;[arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]]
      return arr
    })
  }

  function editSubtask(idx: number, title: string) {
    setSubtasks(prev => prev.map((s, i) => (i === idx ? { ...s, title } : s)))
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Zap size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          Task Breaker
        </h3>
      </div>

      {/* Task being broken */}
      <div
        className="px-3 py-2 rounded-lg text-sm"
        style={{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
      >
        {taskTitle}
      </div>

      {/* Detail level selector */}
      {subtasks.length === 0 && (
        <>
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Detail Level
            </label>
            <div className="flex gap-2">
              {DETAIL_LEVELS.map(d => (
                <button
                  key={d.key}
                  onClick={() => setLevel(d.key)}
                  className="flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg text-xs transition-colors"
                  style={{
                    background: level === d.key
                      ? 'var(--color-btn-primary-bg)'
                      : 'var(--color-bg-secondary)',
                    color: level === d.key
                      ? 'var(--color-btn-primary-text)'
                      : 'var(--color-text-primary)',
                    border: `1px solid ${level === d.key ? 'transparent' : 'var(--color-border)'}`,
                  }}
                >
                  <span className="font-medium">{d.label}</span>
                  <span
                    className="text-[10px]"
                    style={{
                      color: level === d.key ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                      opacity: level === d.key ? 0.9 : 1,
                    }}
                  >
                    {d.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleBreakDown}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Breaking down...
              </>
            ) : (
              <>
                <Zap size={16} />
                Break It Down
              </>
            )}
          </button>

          {error && (
            <p className="text-xs text-center" style={{ color: 'var(--color-error, #e55)' }}>
              {error}
            </p>
          )}
        </>
      )}

      {/* Results: editable subtask list */}
      {subtasks.length > 0 && (
        <>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {subtasks.length} steps generated. Edit, reorder, or remove before applying.
          </p>

          <div className="flex flex-col gap-1.5">
            {subtasks.map((st, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-2 py-2 rounded-lg group"
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveSubtask(idx, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 disabled:opacity-20"
                  >
                    <ChevronUp size={12} style={{ color: 'var(--color-text-secondary)' }} />
                  </button>
                  <button
                    onClick={() => moveSubtask(idx, 'down')}
                    disabled={idx === subtasks.length - 1}
                    className="p-0.5 disabled:opacity-20"
                  >
                    <ChevronDown size={12} style={{ color: 'var(--color-text-secondary)' }} />
                  </button>
                </div>

                <span className="text-xs w-5 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  {idx + 1}
                </span>

                <input
                  type="text"
                  value={st.title}
                  onChange={e => editSubtask(idx, e.target.value)}
                  className="flex-1 text-sm bg-transparent border-none outline-none"
                  style={{ color: 'var(--color-text-primary)' }}
                />

                <button
                  onClick={() => removeSubtask(idx)}
                  className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onApply(subtasks)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              <Check size={16} />
              Apply {subtasks.length} Steps
            </button>
            <button
              onClick={() => setSubtasks([])}
              className="px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
              }}
            >
              Retry
            </button>
          </div>
        </>
      )}

      <button
        onClick={onCancel}
        className="text-sm py-1"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Cancel
      </button>
    </div>
  )
}

/** Fallback parser for plain text AI response */
function parseTextResponse(text: string): BrokenTask[] {
  return text
    .split('\n')
    .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(Boolean)
    .map(title => ({ title }))
}
