// PRD-28 Sub-phase B: Log Learning Modal (Screen 7)
// Standard layout for Guided/Independent/Adult + Play variant
// Built out fully in item 6 of the build sequence

import { useState } from 'react'
import { BookOpen, Clock, Trophy, Sparkles, Loader2 } from 'lucide-react'
import { ModalV2 } from '@/components/shared'
import { useLogLearning } from '@/hooks/useHomeschool'
import { useCreateVictory } from '@/hooks/useVictories'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useCreateRequest } from '@/hooks/useRequests'
import { supabase } from '@/lib/supabase/client'
import type { HomeschoolSubject, ResolvedHomeschoolConfig } from '@/types/homeschool'

interface LogLearningModalProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  subjects: HomeschoolSubject[]
  config: ResolvedHomeschoolConfig
  variant?: 'standard' | 'play'
}

export function LogLearningModal({
  isOpen,
  onClose,
  familyId,
  memberId,
  subjects,
  config,
  variant = 'standard',
}: LogLearningModalProps) {
  const { data: currentMember } = useFamilyMember()
  const logLearning = useLogLearning()
  const createVictory = useCreateVictory()
  const createRequest = useCreateRequest()

  const [description, setDescription] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set())
  const [alsoAddVictory, setAlsoAddVictory] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [estimating, setEstimating] = useState(false)
  const [estimation, setEstimation] = useState<{ subject_id: string; subject_name: string; minutes: number; reasoning: string }[] | null>(null)

  const isPlay = variant === 'play'
  const memberRole = currentMember?.role
  const isChild = memberRole === 'member'
  const dashboardMode = currentMember?.dashboard_mode
  const needsApproval = isChild && (dashboardMode === 'guided' || dashboardMode === 'play')

  const totalMinutes = (parseInt(hours || '0') * 60) + parseInt(minutes || '0')

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleEstimate = async () => {
    if (!description.trim() || totalMinutes <= 0) return
    setEstimating(true)
    try {
      const { data, error } = await supabase.functions.invoke('homework-estimate', {
        body: {
          description: description.trim(),
          total_minutes: totalMinutes,
          subjects: subjects.map(s => ({ id: s.id, name: s.name })),
          allocation_mode: config.time_allocation_mode,
          family_id: familyId,
          member_id: memberId,
        },
      })
      if (error) throw error
      if (data?.allocations) {
        setEstimation(data.allocations)
        // Auto-select the estimated subjects
        const estimatedIds = new Set<string>(data.allocations.map((a: { subject_id: string }) => a.subject_id))
        setSelectedSubjects(estimatedIds)
      }
    } catch (err) {
      console.error('LiLa estimation failed:', err)
    } finally {
      setEstimating(false)
    }
  }

  const handleSubmit = async () => {
    if (totalMinutes <= 0) return
    if (!isPlay && !description.trim()) return

    setSubmitting(true)
    try {
      const status = needsApproval ? 'pending' as const : 'confirmed' as const
      const subjectIds = Array.from(selectedSubjects)

      // Create time logs
      if (subjectIds.length > 0) {
        await logLearning.mutateAsync({
          family_id: familyId,
          family_member_id: memberId,
          description: description.trim() || 'Learning session',
          minutes: totalMinutes,
          subject_ids: subjectIds,
          allocation_mode: config.time_allocation_mode,
          source: 'child_report',
          status,
        })
      }

      // Victory on submission (not on approval)
      if (alsoAddVictory) {
        await createVictory.mutateAsync({
          family_id: familyId,
          family_member_id: memberId,
          description: description.trim() || `Logged ${formatMinutes(totalMinutes)} of learning`,
          source: 'homeschool_logged',
          member_type: dashboardMode === 'play' ? 'play' : dashboardMode === 'guided' ? 'guided' : dashboardMode === 'independent' ? 'teen' : 'adult',
        })
      }

      // Route to mom's approval queue if child
      if (needsApproval && currentMember) {
        // Find primary parent for recipient
        const { supabase } = await import('@/lib/supabase/client')
        const { data: parents } = await supabase
          .from('family_members')
          .select('id')
          .eq('family_id', familyId)
          .eq('role', 'primary_parent')
          .limit(1)

        if (parents && parents.length > 0) {
          await createRequest.mutateAsync({
            familyId,
            senderId: memberId,
            senderName: currentMember.display_name ?? 'Child',
            data: {
              recipient_member_id: parents[0].id,
              title: `Learning log from ${currentMember.display_name}`,
              details: description.trim() || undefined,
              source: 'homeschool_child_report' as const,
            },
          })
        }
      }

      onClose()
    } catch (err) {
      console.error('Log Learning submission failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Play variant: simplified with preset time buttons + subject icons
  if (isPlay) {
    return (
      <ModalV2 id="log-learning-play" isOpen={isOpen} onClose={onClose} title="Log Learning" size="sm" type="transient">
        <div className="flex flex-col gap-4 p-4">
          {/* Subject icons — large tap targets */}
          <div>
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>What subject?</div>
            <div className="flex flex-wrap gap-3">
              {subjects.map(s => {
                const selected = selectedSubjects.has(s.id)
                return (
                  <button
                    key={s.id}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl min-w-[72px] transition-all"
                    style={{
                      backgroundColor: selected ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                      color: selected ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
                      border: `2px solid ${selected ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
                    }}
                    onClick={() => toggleSubject(s.id)}
                  >
                    <BookOpen size={24} />
                    <span className="text-xs font-medium">{s.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preset time buttons */}
          <div>
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>How long?</div>
            <div className="flex gap-2">
              {[15, 30, 60].map(m => {
                const selected = totalMinutes === m
                return (
                  <button
                    key={m}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{
                      backgroundColor: selected ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                      color: selected ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
                    }}
                    onClick={() => { setHours(String(Math.floor(m / 60))); setMinutes(String(m % 60)) }}
                  >
                    {m >= 60 ? `${m / 60}h` : `${m}m`}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Optional description */}
          <textarea
            className="w-full p-3 rounded-lg text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default)',
            }}
            rows={2}
            placeholder="What did you do? (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          {/* Victory checkbox */}
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
            <input type="checkbox" checked={alsoAddVictory} onChange={e => setAlsoAddVictory(e.target.checked)} />
            <Trophy size={14} style={{ color: 'var(--color-accent)' }} />
            Also add as a Victory?
          </label>

          <button
            className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
            onClick={handleSubmit}
            disabled={submitting || totalMinutes <= 0 || selectedSubjects.size === 0}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </ModalV2>
    )
  }

  // Standard layout: Guided / Independent / Adult
  return (
    <ModalV2 id="log-learning-standard" isOpen={isOpen} onClose={onClose} title="Log Learning" size="md" type="transient">
      <div className="flex flex-col gap-4 p-4">
        {/* Description */}
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            What did you do?
          </label>
          <textarea
            className="w-full mt-1 p-3 rounded-lg text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default)',
            }}
            rows={3}
            placeholder="Describe what you learned or worked on..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Time entry */}
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            How long? <span className="text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>(optional)</span>
          </label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={12}
                className="w-14 p-2 rounded-lg text-sm text-center"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                placeholder="0"
                value={hours}
                onChange={e => setHours(e.target.value)}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>hr</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={59}
                className="w-14 p-2 rounded-lg text-sm text-center"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                placeholder="0"
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>min</span>
            </div>
            <span className="text-xs mx-1" style={{ color: 'var(--color-text-tertiary)' }}>or</span>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
              title="Use Timer — starts the Universal Timer"
            >
              <Clock size={14} /> Use Timer
            </button>
          </div>
        </div>

        {/* Subject checkboxes */}
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Subjects <span className="text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2 mt-1">
            {subjects.map(s => {
              const selected = selectedSubjects.has(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: selected ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                    color: selected ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
                    border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
                  }}
                  onClick={() => toggleSubject(s.id)}
                >
                  {s.name}
                </button>
              )
            })}
          </div>
          {/* LiLa estimation — appears when description + time entered but no subjects selected */}
          {description.trim() && totalMinutes > 0 && selectedSubjects.size === 0 && (
            <button
              type="button"
              className="flex items-center gap-1.5 mt-1 text-xs font-medium"
              style={{ color: 'var(--color-accent)' }}
              onClick={handleEstimate}
              disabled={estimating}
            >
              {estimating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {estimating ? 'LiLa is estimating...' : 'Let LiLa estimate subjects'}
            </button>
          )}
          {/* Show estimation results */}
          {estimation && estimation.length > 0 && (
            <div className="mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                LiLa&apos;s estimate (tap subjects above to adjust):
              </div>
              {estimation.map(a => (
                <div key={a.subject_id} className="flex items-center justify-between py-0.5">
                  <span style={{ color: 'var(--color-text-primary)' }}>{a.subject_name}</span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{a.minutes}m — {a.reasoning}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Victory checkbox */}
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
          <input type="checkbox" checked={alsoAddVictory} onChange={e => setAlsoAddVictory(e.target.checked)} />
          <Trophy size={14} style={{ color: 'var(--color-accent)' }} />
          Also add as a Victory?
        </label>

        {/* Submit */}
        <button
          className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
          onClick={handleSubmit}
          disabled={submitting || (!isPlay && !description.trim()) || totalMinutes <= 0}
        >
          {submitting ? 'Submitting...' : needsApproval ? 'Submit for Review' : 'Submit'}
        </button>

        {needsApproval && (
          <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
            Your learning log will be sent to mom for review
          </p>
        )}
      </div>
    </ModalV2>
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
