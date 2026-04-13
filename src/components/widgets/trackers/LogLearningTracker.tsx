// PRD-28 Sub-phase B: Log Learning Widget (Screen 6)
// Tracks homework hours by subject with daily progress bars
// Two display modes: count-only (no target) vs progress bar (target set)

import { useState } from 'react'
import { BookOpen, Play } from 'lucide-react'
import type { DashboardWidget } from '@/types/widgets'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useHomeschoolSubjects, useDailySummary, useWeeklySummary, useResolvedHomeschoolConfig } from '@/hooks/useHomeschool'
import { todayLocalIso } from '@/utils/dates'
import { LogLearningModal } from '@/features/financial/LogLearningModal'

interface LogLearningTrackerProps {
  widget: DashboardWidget
  isCompact?: boolean
}

export function LogLearningTracker({ widget, isCompact }: LogLearningTrackerProps) {
  const [showModal, setShowModal] = useState(false)
  const { data: currentMember } = useFamilyMember()

  const memberId = widget.assigned_member_id ?? currentMember?.id
  const familyId = currentMember?.family_id

  const { data: subjects } = useHomeschoolSubjects(familyId)
  const { data: dailyBySubject } = useDailySummary(memberId, todayLocalIso())
  const { data: weeklyBySubject } = useWeeklySummary(memberId)
  const { resolved: config } = useResolvedHomeschoolConfig(familyId, memberId)

  if (!subjects || subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center"
        style={{ color: 'var(--color-text-secondary)' }}>
        <BookOpen size={24} style={{ color: 'var(--color-text-tertiary)' }} />
        <p className="mt-2 text-sm">No subjects configured yet</p>
        <p className="text-xs mt-1">Set up subjects in Settings → Homework & Subjects</p>
      </div>
    )
  }

  // Compact mode: total minutes + Log Learning button
  if (isCompact) {
    const totalToday = dailyBySubject
      ? Object.values(dailyBySubject).reduce((sum, m) => sum + m, 0)
      : 0
    return (
      <div className="flex items-center justify-between p-3 gap-2">
        <div>
          <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Today</div>
          <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {formatMinutes(totalToday)}
          </div>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
          onClick={() => setShowModal(true)}
        >
          <BookOpen size={14} /> Log
        </button>
        {showModal && memberId && familyId && (
          <LogLearningModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            familyId={familyId}
            memberId={memberId}
            subjects={subjects}
            config={config}
          />
        )}
      </div>
    )
  }

  // Full mode: per-subject progress + upcoming + Log Learning button
  const totalToday = dailyBySubject
    ? Object.values(dailyBySubject).reduce((sum, m) => sum + m, 0)
    : 0
  const totalTarget = subjects.reduce((sum, s) => {
    const override = config.subject_hour_overrides[s.id]
    const weeklyHours = override ?? s.default_weekly_hours
    if (weeklyHours == null) return sum
    return sum + weeklyHours * 60 / 7 // daily target from weekly
  }, 0)
  const hasAnyTarget = subjects.some(s => {
    const override = config.subject_hour_overrides[s.id]
    return (override ?? s.default_weekly_hours) != null
  })

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {widget.title ?? "Today's Homework"}
        </h3>
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {hasAnyTarget && totalTarget > 0
            ? `${formatMinutes(totalToday)} of ${formatMinutes(Math.round(totalTarget))}`
            : formatMinutes(totalToday)
          }
        </div>
      </div>

      {/* Per-subject rows */}
      <div className="flex flex-col gap-2">
        {subjects.map(subject => {
          const logged = dailyBySubject?.[subject.id] ?? 0
          const weeklyLogged = weeklyBySubject?.[subject.id] ?? 0
          const override = config.subject_hour_overrides[subject.id]
          const weeklyTarget = override ?? subject.default_weekly_hours
          const hasTarget = weeklyTarget != null
          const dailyTarget = hasTarget ? (weeklyTarget! * 60) / 7 : null

          return (
            <div key={subject.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {subject.name}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {hasTarget
                    ? `${formatMinutes(weeklyLogged)} of ${weeklyTarget}h target`
                    : `${formatMinutes(weeklyLogged)} this week`
                  }
                </span>
              </div>
              {hasTarget && dailyTarget != null && dailyTarget > 0 && (
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      width: `${Math.min(100, (logged / dailyTarget) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Log Learning button */}
      <button
        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium mt-1"
        style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
        onClick={() => setShowModal(true)}
      >
        <BookOpen size={15} />
        Log Learning
      </button>

      {/* Upcoming assignments */}
      <UpcomingAssignments memberId={memberId} />

      {showModal && memberId && familyId && (
        <LogLearningModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          familyId={familyId}
          memberId={memberId}
          subjects={subjects}
          config={config}
        />
      )}
    </div>
  )
}

function UpcomingAssignments({ memberId }: { memberId: string | undefined }) {
  // Query tasks where counts_for_homework=true + assigned to this member + pending/in_progress + due today or later
  const { data: currentMember } = useFamilyMember()
  const familyId = currentMember?.family_id

  // Lightweight inline query — no dedicated hook needed for 3 items
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; due_date: string | null }>>([])
  const [loaded, setLoaded] = useState(false)

  // Load upcoming homework tasks on mount
  useState(() => {
    if (!memberId || !familyId || loaded) return
    import('@/lib/supabase/client').then(({ supabase }) => {
      supabase
        .from('tasks')
        .select('id, title, due_date')
        .eq('family_id', familyId)
        .eq('assignee_id', memberId)
        .eq('counts_for_homework', true)
        .in('status', ['pending', 'in_progress'])
        .is('archived_at', null)
        .gte('due_date', todayLocalIso())
        .order('due_date', { ascending: true })
        .limit(3)
        .then(({ data }) => {
          setTasks((data ?? []) as Array<{ id: string; title: string; due_date: string | null }>)
          setLoaded(true)
        })
    })
  })

  if (tasks.length === 0) return null

  return (
    <div className="flex flex-col gap-1 mt-1">
      <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Upcoming</div>
      {tasks.map(task => (
        <div key={task.id} className="flex items-center justify-between text-xs py-1">
          <span style={{ color: 'var(--color-text-primary)' }}>{task.title}</span>
          <button
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
            title="Start timer"
          >
            <Play size={10} /> Start
          </button>
        </div>
      ))}
    </div>
  )
}

function formatMinutes(minutes: number): string {
  if (minutes === 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
