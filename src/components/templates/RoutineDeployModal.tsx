import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Users, Calendar, DollarSign, Rocket } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import type { MemberPillItem, AssignMode } from '@/components/shared/MemberPillSelector'
import { PickDatesCalendar } from '@/components/scheduling/PickDatesCalendar'
import type { SchedulerAction } from '@/components/scheduling/types'
import type { SchedulerOutput } from '@/components/scheduling/types'
import { RoutineOverlapResolutionModal } from './RoutineOverlapResolutionModal'
import type { RoutineOverlapCandidate } from '@/lib/templates/detectRoutineOverlap'
import { detectRoutineOverlap } from '@/lib/templates/detectRoutineOverlap'
import { createTaskFromData } from '@/utils/createTaskFromData'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import type { RewardType } from '@/components/tasks/RewardConfig'
import { useFamilyMembers, useFamilyMember } from '@/hooks/useFamilyMember'
import { useAssignableMembers } from '@/hooks/useAssignableMembers'
import { useFamily } from '@/hooks/useFamily'
import { useMemberAllowancePools } from '@/hooks/useFinancial'
import { useRoutingToast } from '@/components/shared/RoutingToastProvider'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { getMemberColor } from '@/lib/memberColors'
import { todayLocalIso, localIso } from '@/utils/dates'

// ── Types ──

export interface RoutineDeployTemplate {
  id: string
  name: string
}

export interface ActiveDeployment {
  taskId: string
  assigneeId: string
  assigneeDisplayName: string
  assigneeColor: string
  dtstart: string | null
  endDate: string | null
  countsForAllowance: boolean
  countsForGamification: boolean
  countsForHomework: boolean
  allowancePoints: number | null
  status: string
}

interface RoutineDeployModalProps {
  isOpen: boolean
  onClose: () => void
  template: RoutineDeployTemplate
  mode: 'create' | 'edit'
  editingDeployment?: ActiveDeployment | null
}

// ── Helpers ──

function paintedDatesToSchedule(dates: string[]): SchedulerOutput {
  const sorted = [...dates].sort()
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  return {
    rrule: null,
    dtstart: sorted[0] || todayLocalIso(),
    until: sorted.length > 1 ? sorted[sorted.length - 1] : null,
    count: null,
    exdates: [],
    rdates: sorted,
    timezone: tz,
    schedule_type: 'painted',
    completion_dependent: null,
    custody_pattern: null,
  }
}

// ── Component ──

export function RoutineDeployModal({
  isOpen,
  onClose,
  template,
  mode,
  editingDeployment,
}: RoutineDeployModalProps) {
  const { data: family } = useFamily()
  const { data: currentMember } = useFamilyMember()
  const { data: members = [] } = useFamilyMembers(family?.id)
  const queryClient = useQueryClient()
  const toast = useRoutingToast()

  // RR-DEPLOY-SCOPING: deploy targets limited to who the current member may
  // assign tasks to (mom: everyone; granted additional_adult: self + granted
  // kids; others: self). DB mirrors via util.task_assign_allowed WITH CHECK.
  const { assignableIds } = useAssignableMembers()

  const nonMomMembers = useMemo(
    () => members.filter(m => m.role !== 'primary_parent' && m.is_active && assignableIds.has(m.id)),
    [members, assignableIds],
  )

  const pillMembers: MemberPillItem[] = useMemo(
    () => nonMomMembers.map(m => ({
      id: m.id,
      display_name: m.display_name,
      calendar_color: m.calendar_color,
      assigned_color: m.assigned_color,
      member_color: m.member_color,
    })),
    [nonMomMembers],
  )

  // ── State: Who ──
  const [selectedIds, setSelectedIds] = useState<string[]>(
    editingDeployment ? [editingDeployment.assigneeId] : [],
  )
  const [assignMode, setAssignMode] = useState<AssignMode>('each')

  // ── State: When ──
  const [paintedDates, setPaintedDates] = useState<string[]>(() => {
    if (mode === 'edit' && editingDeployment) {
      const start = editingDeployment.dtstart
      const end = editingDeployment.endDate
      if (start && end) {
        const dates: string[] = []
        const cur = new Date(start + 'T00:00:00')
        const endD = new Date(end + 'T00:00:00')
        while (cur <= endD) {
          dates.push(localIso(cur))
          cur.setDate(cur.getDate() + 1)
        }
        return dates
      }
      if (start) return [start]
    }
    return [todayLocalIso()]
  })

  // ── State: Allowance ──
  // Defaults for routines: counts_for_allowance defaults to TRUE (most chore routines
  // earn allowance). In edit mode, prefer the existing deployment's value. In create
  // mode, we hydrate from the template's defaults ONCE, only if mom hasn't already
  // touched the checkbox — see the effect below.
  const [countsForAllowance, setCountsForAllowance] = useState(
    editingDeployment?.countsForAllowance ?? true,
  )
  const [countsForGamification, setCountsForGamification] = useState(
    editingDeployment?.countsForGamification ?? true,
  )
  const [countsForHomework, setCountsForHomework] = useState(
    editingDeployment?.countsForHomework ?? false,
  )
  const [allowancePoints, setAllowancePoints] = useState<string>(
    editingDeployment?.allowancePoints?.toString() ?? '',
  )
  const [selectedPoolName, setSelectedPoolName] = useState('default')

  // Tracks whether mom has interacted with any tracking flag. Once true, the
  // async template-defaults hydration below stops writing — visible UI is the
  // saved value, no silent overrides after mom's first tap. Bug fixed: a flag
  // mom checked could previously be flipped back by a late template fetch.
  const trackingInteractedRef = useRef(false)
  const handleSetCountsForAllowance = useCallback((v: boolean) => {
    trackingInteractedRef.current = true
    setCountsForAllowance(v)
  }, [])
  const handleSetCountsForGamification = useCallback((v: boolean) => {
    trackingInteractedRef.current = true
    setCountsForGamification(v)
  }, [])
  const handleSetCountsForHomework = useCallback((v: boolean) => {
    trackingInteractedRef.current = true
    setCountsForHomework(v)
  }, [])
  const handleSetAllowancePoints = useCallback((v: string) => {
    trackingInteractedRef.current = true
    setAllowancePoints(v)
  }, [])

  // In create mode, prime the checkboxes from the template's own defaults so mom
  // doesn't have to re-check the box every deployment. Runs once on mount; if mom
  // has already touched a flag by the time the fetch resolves, we bail entirely
  // so her input wins.
  useEffect(() => {
    if (mode !== 'create') return
    let cancelled = false
    void (async () => {
      const { data } = await supabase
        .from('task_templates')
        .select('counts_for_allowance, counts_for_gamification, counts_for_homework, allowance_points')
        .eq('id', template.id)
        .maybeSingle()
      if (cancelled || !data) return
      if (trackingInteractedRef.current) return
      if (data.counts_for_allowance != null) setCountsForAllowance(data.counts_for_allowance)
      if (data.counts_for_gamification != null) setCountsForGamification(data.counts_for_gamification)
      if (data.counts_for_homework != null) setCountsForHomework(data.counts_for_homework)
      if (data.allowance_points != null) setAllowancePoints(String(data.allowance_points))
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id, mode])

  // Pool picker — only relevant when one member selected
  const singleMemberId = selectedIds.length === 1 ? selectedIds[0] : undefined
  const { data: pools = [] } = useMemberAllowancePools(singleMemberId)
  const activePools = useMemo(() => pools.filter(p => p.pool_status === 'active'), [pools])

  // ── State: Overlap ──
  const [overlapCandidates, setOverlapCandidates] = useState<RoutineOverlapCandidate[]>([])
  const [showOverlap, setShowOverlap] = useState(false)

  // ── State: Saving ──
  const [saving, setSaving] = useState(false)

  // Existing deployments overlay
  const [existingDeployments, setExistingDeployments] = useState<ActiveDeployment[]>([])

  // Fetch existing deployments when member selection changes
  const loadExistingDeployments = useCallback(async () => {
    if (selectedIds.length === 0 || !family?.id) {
      setExistingDeployments([])
      return
    }
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, assignee_id, recurrence_details, due_date, status, archived_at, counts_for_allowance, counts_for_gamification, counts_for_homework, allowance_points')
      .eq('template_id', template.id)
      .eq('task_type', 'routine')
      .is('archived_at', null)
      .in('assignee_id', selectedIds)
    if (!tasks) return

    setExistingDeployments(tasks.map(t => {
      const details = t.recurrence_details as Record<string, unknown> | null
      const member = members.find(m => m.id === t.assignee_id)
      return {
        taskId: t.id,
        assigneeId: t.assignee_id ?? '',
        assigneeDisplayName: member?.display_name ?? 'Unknown',
        assigneeColor: member ? getMemberColor(member) : '#888',
        dtstart: (details?.dtstart as string | undefined)?.slice(0, 10) ?? null,
        endDate: (t.due_date as string | undefined)?.slice(0, 10) ?? null,
        countsForAllowance: t.counts_for_allowance ?? false,
        countsForGamification: t.counts_for_gamification ?? true,
        countsForHomework: t.counts_for_homework ?? false,
        allowancePoints: t.allowance_points ?? null,
        status: t.status ?? 'pending',
      }
    }))
  }, [selectedIds, family?.id, template.id, members])

  useEffect(() => { loadExistingDeployments() }, [loadExistingDeployments])

  // ── Calendar dispatch adapter ──
  const calendarDispatch = useCallback((action: SchedulerAction) => {
    if (action.type === 'TOGGLE_PAINTED_DATE') {
      setPaintedDates(prev =>
        prev.includes(action.date)
          ? prev.filter(d => d !== action.date)
          : [...prev, action.date].sort(),
      )
    }
  }, [])

  // ── Member toggle ──
  const handleToggleMember = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    )
  }, [])

  const handleToggleAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.length === pillMembers.length
        ? []
        : pillMembers.map(m => m.id),
    )
  }, [pillMembers])

  // ── Deploy (Create) ──
  const handleDeploy = useCallback(async () => {
    if (!family?.id || !currentMember?.id || selectedIds.length === 0 || paintedDates.length === 0) return
    setSaving(true)

    try {
      const sortedDates = [...paintedDates].sort()
      const dtstart = sortedDates[0]
      const endDate = sortedDates.length > 1 ? sortedDates[sortedDates.length - 1] : null

      // Check overlaps
      const overlaps = await detectRoutineOverlap(supabase, {
        familyId: family.id,
        templateId: template.id,
        assigneeIds: selectedIds,
        newDtstart: dtstart,
        newEndDate: endDate,
      })

      if (overlaps.length > 0) {
        setOverlapCandidates(overlaps)
        setShowOverlap(true)
        setSaving(false)
        return
      }

      await executeDeploy()
    } catch (err) {
      console.error('Deploy failed:', err)
      toast.show({ message: 'Failed to deploy routine. Please try again.', variant: 'error' })
      setSaving(false)
    }
  }, [family?.id, currentMember?.id, selectedIds, paintedDates, template.id])

  const executeDeploy = useCallback(async () => {
    if (!family?.id || !currentMember?.id) return
    setSaving(true)

    try {
      const schedule = paintedDatesToSchedule(paintedDates)
      const pointsNum = allowancePoints ? parseInt(allowancePoints, 10) : null

      const data: CreateTaskData = {
        title: template.name,
        description: '',
        durationEstimate: '',
        customDuration: '',
        lifeAreaTag: '',
        customLifeArea: '',
        taskType: 'routine',
        assignments: selectedIds.map(id => ({ memberId: id, copyMode: 'individual' as const })),
        wholeFamily: false,
        assignMode,
        rotationEnabled: false,
        rotationFrequency: 'weekly',
        schedule,
        incompleteAction: 'fresh_reset',
        reward: {
          rewardType: '' as RewardType,
          rewardAmount: '',
          bonusThreshold: '85',
          bonusPercentage: '20',
          requireApproval: false,
          trackAsWidget: false,
          flagAsVictory: false,
          rewardDescription: '',
          rewardImageUrl: null,
          rewardImageAssetKey: null,
        },
        saveAsTemplate: false,
        templateName: '',
        deployFromTemplateId: template.id,
        countsForAllowance,
        countsForGamification,
        countsForHomework,
        allowancePoints: countsForAllowance ? pointsNum : null,
      }

      await createTaskFromData(
        supabase,
        data,
        family.id,
        currentMember.id,
        members,
      )

      // Invalidate caches
      await queryClient.invalidateQueries({ queryKey: ['tasks', family.id] })
      await queryClient.invalidateQueries({ queryKey: ['task_templates_customized', family.id] })

      const names = selectedIds
        .map(id => members.find(m => m.id === id)?.display_name?.split(' ')[0])
        .filter(Boolean)
        .join(', ')

      toast.show({ message: `Routine deployed to ${names}` })
      onClose()
    } catch (err) {
      console.error('Deploy failed:', err)
      toast.show({ message: 'Failed to deploy routine. Please try again.', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }, [family?.id, currentMember?.id, selectedIds, paintedDates, template, assignMode, countsForAllowance, countsForGamification, countsForHomework, allowancePoints, members, queryClient, toast, onClose])

  // ── Save (Edit) ──
  const handleSaveEdit = useCallback(async () => {
    if (!editingDeployment || paintedDates.length === 0) return
    setSaving(true)

    try {
      const sortedDates = [...paintedDates].sort()
      const endDate = sortedDates.length > 1 ? sortedDates[sortedDates.length - 1] : null
      const pointsNum = allowancePoints ? parseInt(allowancePoints, 10) : null

      const { error } = await supabase
        .from('tasks')
        .update({
          due_date: endDate,
          recurrence_details: paintedDatesToSchedule(paintedDates),
          counts_for_allowance: countsForAllowance,
          counts_for_gamification: countsForGamification,
          counts_for_homework: countsForHomework,
          allowance_points: countsForAllowance ? pointsNum : null,
        })
        .eq('id', editingDeployment.taskId)

      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['tasks', family?.id] })
      await queryClient.invalidateQueries({ queryKey: ['task_templates_customized', family?.id] })

      toast.show({ message: `Deployment updated for ${editingDeployment.assigneeDisplayName.split(' ')[0]}` })
      onClose()
    } catch (err) {
      console.error('Save edit failed:', err)
      toast.show({ message: 'Failed to save changes. Please try again.', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }, [editingDeployment, paintedDates, countsForAllowance, countsForGamification, countsForHomework, allowancePoints, family?.id, queryClient, toast, onClose])

  // ── End Deployment ──
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const handleEndDeployment = useCallback(async () => {
    if (!editingDeployment) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', editingDeployment.taskId)

      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['tasks', family?.id] })
      await queryClient.invalidateQueries({ queryKey: ['task_templates_customized', family?.id] })

      const name = editingDeployment.assigneeDisplayName.split(' ')[0]
      toast.show({ message: `${template.name} ended for ${name}. Credit preserved through today.` })
      onClose()
    } catch (err) {
      console.error('End deployment failed:', err)
      toast.show({ message: 'Failed to end deployment. Please try again.', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }, [editingDeployment, family?.id, template.name, queryClient, toast, onClose])

  // ── Overlap resolution ──
  const handleOverlapResolve = useCallback(async (choice: { kind: string; existingTaskId?: string }) => {
    setShowOverlap(false)
    if (choice.kind === 'cancel') {
      setSaving(false)
      return
    }
    if (choice.kind === 'replace' && choice.existingTaskId) {
      await supabase
        .from('tasks')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', choice.existingTaskId)
    }
    await executeDeploy()
  }, [executeDeploy])

  // ── Existing deployment dates for calendar overlay ──
  const existingDatesSet = useMemo(() => {
    const set = new Set<string>()
    for (const dep of existingDeployments) {
      if (mode === 'edit' && dep.taskId === editingDeployment?.taskId) continue
      if (!dep.dtstart) continue
      const start = new Date(dep.dtstart + 'T00:00:00')
      const end = dep.endDate ? new Date(dep.endDate + 'T00:00:00') : new Date(start)
      end.setMonth(end.getMonth() + 6) // cap at 6 months for "ongoing"
      const cur = new Date(start)
      while (cur <= end) {
        set.add(localIso(cur))
        cur.setDate(cur.getDate() + 1)
      }
    }
    return set
  }, [existingDeployments, mode, editingDeployment?.taskId])

  const isCreate = mode === 'create'
  const canSubmit = isCreate
    ? selectedIds.length > 0 && paintedDates.length > 0
    : paintedDates.length > 0

  return (
    <>
      <ModalV2
        id="routine-deploy-modal"
        isOpen={isOpen}
        onClose={onClose}
        title={isCreate ? `Deploy: ${template.name}` : `Edit Deployment: ${template.name}`}
        type="transient"
        size="md"
      >
        <div className="space-y-5 p-4">
          {/* ── Section 1: Who ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {isCreate ? 'Who is this for?' : 'Assigned to'}
              </h3>
            </div>
            {isCreate ? (
              <MemberPillSelector
                members={pillMembers}
                selectedIds={selectedIds}
                onToggle={handleToggleMember}
                showEveryone={pillMembers.length > 1}
                onToggleAll={handleToggleAll}
                showSortToggle={false}
                showAssignMode={true}
                assignMode={assignMode}
                onAssignModeChange={setAssignMode}
              />
            ) : (
              <div className="flex gap-2">
                {editingDeployment && (
                  <span
                    className="px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: editingDeployment.assigneeColor,
                      color: 'var(--color-text-on-primary, #fff)',
                      border: `2px solid ${editingDeployment.assigneeColor}`,
                    }}
                  >
                    {editingDeployment.assigneeDisplayName.split(' ')[0]}
                  </span>
                )}
              </div>
            )}
          </section>

          {/* ── Section 2: When ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                When should it be active?
              </h3>
            </div>
            {existingDeployments.length > 0 && isCreate && (
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                Muted dates show existing deployments of this routine.
              </p>
            )}
            <DeployCalendar
              paintedDates={paintedDates}
              dispatch={calendarDispatch}
              existingDates={existingDatesSet}
              mode={mode}
            />
          </section>

          {/* ── Section 3: Allowance ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Tracking
              </h3>
            </div>
            <div className="space-y-3">
              <ToggleRow
                label="Count toward allowance"
                checked={countsForAllowance}
                onChange={handleSetCountsForAllowance}
              />
              {countsForAllowance && activePools.length > 1 && singleMemberId && (
                <div className="ml-6">
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Pool
                  </label>
                  <select
                    value={selectedPoolName}
                    onChange={e => setSelectedPoolName(e.target.value)}
                    className="text-sm rounded-lg px-2 py-1.5 w-full"
                    style={{
                      backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {activePools.map(p => (
                      <option key={p.pool_name} value={p.pool_name}>
                        {p.pool_name === 'default' ? 'Default' : p.pool_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {countsForAllowance && (
                <div className="ml-6">
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Points override (optional)
                  </label>
                  <input
                    type="number"
                    value={allowancePoints}
                    onChange={e => handleSetAllowancePoints(e.target.value)}
                    placeholder="Default"
                    className="text-sm rounded-lg px-2 py-1.5 w-24"
                    style={{
                      backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    min={0}
                  />
                </div>
              )}
              <ToggleRow
                label="Count toward gamification"
                checked={countsForGamification}
                onChange={handleSetCountsForGamification}
              />
              <ToggleRow
                label="Count toward homework"
                checked={countsForHomework}
                onChange={handleSetCountsForHomework}
              />
            </div>
          </section>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
            {mode === 'edit' && (
              <button
                onClick={() => setShowEndConfirm(true)}
                disabled={saving}
                className="px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color: 'var(--color-error, #dc2626)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-error, #dc2626)',
                }}
              >
                End Deployment
              </button>
            )}
            <div className={`flex gap-2 ${mode === 'create' ? 'ml-auto' : ''}`}>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg"
                style={{
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={isCreate ? handleDeploy : handleSaveEdit}
                disabled={!canSubmit || saving}
                className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-opacity"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text, #fff)',
                  opacity: (!canSubmit || saving) ? 0.5 : 1,
                }}
              >
                <Rocket size={14} />
                {saving ? 'Saving...' : isCreate ? 'Deploy' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </ModalV2>

      {/* End Deployment Confirmation */}
      {showEndConfirm && editingDeployment && (
        <ModalV2
          id="routine-deploy-end-confirm"
          isOpen={showEndConfirm}
          onClose={() => setShowEndConfirm(false)}
          title="End Deployment?"
          type="transient"
          size="sm"
        >
          <div className="p-4 space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              This will end <strong>{template.name}</strong> for{' '}
              <strong>{editingDeployment.assigneeDisplayName.split(' ')[0]}</strong>.
              Credit for work already done will be preserved.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="px-3 py-2 text-sm rounded-lg"
                style={{
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                Keep Active
              </button>
              <button
                onClick={handleEndDeployment}
                disabled={saving}
                className="px-3 py-2 text-sm font-medium rounded-lg"
                style={{
                  backgroundColor: 'var(--color-error, #dc2626)',
                  color: '#fff',
                }}
              >
                {saving ? 'Ending...' : 'End Deployment'}
              </button>
            </div>
          </div>
        </ModalV2>
      )}

      {/* Overlap Resolution */}
      <RoutineOverlapResolutionModal
        isOpen={showOverlap}
        onClose={() => { setShowOverlap(false); setSaving(false) }}
        candidates={overlapCandidates}
        proposedDtstart={paintedDates.length > 0 ? [...paintedDates].sort()[0] : todayLocalIso()}
        proposedEndDate={paintedDates.length > 1 ? [...paintedDates].sort().pop()! : null}
        templateName={template.name}
        onResolve={handleOverlapResolve}
      />
    </>
  )
}

// ── Deploy Calendar with existing-deployment overlay ──

function DeployCalendar({
  paintedDates,
  dispatch,
  existingDates,
  mode: _mode,
}: {
  paintedDates: string[]
  dispatch: React.Dispatch<SchedulerAction>
  existingDates: Set<string>
  mode: 'create' | 'edit'
}) {
  // For now, render the standard PickDatesCalendar.
  // The existing-dates overlay is informational — shown via the legend.
  // A future enhancement could render those dates with a different background.
  return (
    <div>
      <PickDatesCalendar
        paintedDates={paintedDates}
        dispatch={dispatch}
      />
      {existingDates.size > 0 && (
        <div
          className="flex items-center gap-3 mt-2 text-xs"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-sm inline-block"
              style={{ backgroundColor: 'var(--color-accent, #68a395)' }}
            />
            Selected
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-sm inline-block"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 20%, transparent)',
                border: '1px dashed var(--color-text-secondary)',
              }}
            />
            Existing deployment
          </span>
        </div>
      )}
    </div>
  )
}

// ── Toggle Row ──

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="rounded"
        style={{ accentColor: 'var(--color-btn-primary-bg)' }}
      />
      <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
        {label}
      </span>
    </label>
  )
}
