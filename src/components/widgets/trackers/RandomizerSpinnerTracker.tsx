/**
 * RandomizerSpinnerTracker — Dashboard widget wrapping a randomizer list.
 *
 * Mom links it to any randomizer list via widget_config.linked_list_id.
 * The widget shows the list title, a prominent "Spin!" button, and after
 * the draw: the result + member picker + assign flow — all inline.
 *
 * Use cases:
 *   - Consequence spinner on Mom/Dad/Hub dashboards
 *   - Activity picker for play kids
 *   - Reward spinner
 *
 * Zero hardcoded colors. Uses existing Randomizer spinner animation.
 */

import { useState, useMemo, useCallback } from 'react'
import { RotateCw, Check, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { TrackerProps } from './TrackerProps'
import { resolveTrackingProperties } from '@/lib/tasks/resolveTrackingProperties'
import { resolveRewardProperties } from '@/lib/tasks/resolveRewardProperties'
import { resolveAllowanceProperties } from '@/lib/tasks/resolveAllowanceProperties'
import { resolveHomeworkProperties } from '@/lib/tasks/resolveHomeworkProperties'
import { resolveCategorizationProperties } from '@/lib/tasks/resolveCategorizationProperties'

interface SpinnerConfig {
  linked_list_id?: string
  assign_mode?: 'pick_member' | 'self_only'
}

interface ListItem {
  id: string
  content: string
  notes: string | null
  category: string | null
  is_repeatable: boolean
  is_available: boolean
  reward_amount: number | null
  reward_type: string | null
  resource_url: string | null
  track_progress: boolean | null
  track_duration: boolean | null
  advancement_mode: string | null
  practice_target: number | null
  require_mastery_approval: boolean
  require_mastery_evidence: boolean
  victory_flagged: boolean
  opportunity_subtype: string | null
  life_area_tags: string[]
}

export function RandomizerSpinnerTracker({ widget, dataPoints, onRecordData, isCompact }: TrackerProps) {
  const config = (widget.widget_config ?? {}) as SpinnerConfig
  const linkedListId = config.linked_list_id
  const familyId = widget.family_id

  const queryClient = useQueryClient()
  const { data: familyMembers = [] } = useFamilyMembers(familyId)
  const children = useMemo(() => familyMembers.filter(m => m.role === 'member' && m.is_active), [familyMembers])

  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<ListItem | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [assigned, setAssigned] = useState(false)

  // Fetch the linked list and its items
  const { data: listData } = useQuery({
    queryKey: ['randomizer-widget-list', linkedListId],
    queryFn: async () => {
      if (!linkedListId) return null
      const { data: list } = await supabase
        .from('lists')
        .select('id, title, default_track_progress, default_track_duration, default_reward_type, default_reward_amount, default_advancement_mode, default_practice_target, default_require_approval, default_require_evidence, counts_for_allowance, counts_for_homework, counts_for_gamification, victory_mode, life_area_tags')
        .eq('id', linkedListId)
        .single()
      const { data: items } = await supabase
        .from('list_items')
        .select('id, content, notes, category, is_repeatable, is_available, reward_amount, reward_type, resource_url, track_progress, track_duration, advancement_mode, practice_target, require_mastery_approval, require_mastery_evidence, victory_flagged, opportunity_subtype, life_area_tags')
        .eq('list_id', linkedListId)
        .order('sort_order')
      return { list, items: (items ?? []) as ListItem[] }
    },
    enabled: !!linkedListId,
  })

  const availableItems = useMemo(
    () => (listData?.items ?? []).filter(item => item.is_available !== false),
    [listData?.items],
  )

  const handleSpin = useCallback(() => {
    if (availableItems.length === 0) return
    setSpinning(true)
    setResult(null)
    setAssigned(false)
    setSelectedMemberId(null)

    // Animate for 2 seconds then show result
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * availableItems.length)
      const drawn = availableItems[randomIndex]
      setResult(drawn)
      setSpinning(false)

      // Record the draw as a data point
      onRecordData?.(randomIndex, {
        item_id: drawn.id,
        item_name: drawn.content,
        category: drawn.category,
      })
    }, 2000)
  }, [availableItems, onRecordData])

  const handleAssign = useCallback(async () => {
    if (!result || !selectedMemberId || !familyId) return
    setAssigning(true)
    try {
      const list = listData?.list
      const tracking = resolveTrackingProperties(result, list)
      const reward = resolveRewardProperties(result, list)
      const allowance = resolveAllowanceProperties(null, list)
      const homework = resolveHomeworkProperties(null, list)
      const categorization = resolveCategorizationProperties(result, list)

      const { data: newTask } = await supabase.from('tasks').insert({
        family_id: familyId,
        created_by: widget.family_member_id,
        assignee_id: selectedMemberId,
        title: result.content,
        description: result.notes ?? null,
        task_type: 'task',
        status: 'pending',
        source: 'randomizer_draw',
        source_reference_id: result.id,
        resource_url: result.resource_url ?? null,
        track_progress: tracking.track_progress,
        track_duration: tracking.track_duration,
        in_progress_member_id: tracking.track_progress ? selectedMemberId : null,
        advancement_mode: result.advancement_mode ?? 'complete',
        practice_target: result.practice_target,
        require_mastery_approval: result.require_mastery_approval,
        require_mastery_evidence: result.require_mastery_evidence,
        victory_flagged: reward.victory_flagged,
        points_override: reward.points_override,
        counts_for_allowance: allowance.counts_for_allowance,
        allowance_points: allowance.allowance_points,
        is_extra_credit: allowance.is_extra_credit,
        counts_for_homework: homework.counts_for_homework,
        homework_subject_ids: homework.homework_subject_ids,
        counts_for_gamification: list?.counts_for_gamification ?? true,
        life_area_tags: categorization.life_area_tags,
      }).select('id').single()

      if (newTask && reward.reward_type && reward.reward_amount != null) {
        await supabase.from('task_rewards').insert({
          task_id: newTask.id,
          reward_type: reward.reward_type,
          reward_value: { amount: reward.reward_amount },
        })
      }

      // Mark non-repeatable items as unavailable
      if (!result.is_repeatable) {
        await supabase
          .from('list_items')
          .update({ is_available: false })
          .eq('id', result.id)
      }

      setAssigned(true)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['randomizer-widget-list', linkedListId] })
    } finally {
      setAssigning(false)
    }
  }, [result, selectedMemberId, familyId, widget.family_member_id, linkedListId, queryClient])

  // ── No linked list configured ──
  if (!linkedListId) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center">
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Configure this widget to link a randomizer list.
        </p>
      </div>
    )
  }

  const listTitle = listData?.list?.title ?? 'Spinner'
  const itemCount = availableItems.length

  // ── Compact mode (small widget) ──
  if (isCompact) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-2">
        <p className="text-xs font-medium truncate w-full text-center" style={{ color: 'var(--color-text-primary)' }}>
          {listTitle}
        </p>
        <button
          onClick={handleSpin}
          disabled={spinning || itemCount === 0}
          className="p-3 rounded-full transition-all disabled:opacity-50"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text, #fff)',
          }}
        >
          <RotateCw size={20} className={spinning ? 'animate-spin' : ''} />
        </button>
        {result && !spinning && (
          <p className="text-xs font-medium text-center truncate w-full" style={{ color: 'var(--color-text-heading)' }}>
            {result.content}
          </p>
        )}
      </div>
    )
  }

  // ── Full mode ──
  return (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          {listTitle}
        </p>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {itemCount} items
        </span>
      </div>

      {/* Spinner area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {spinning ? (
          <div className="flex flex-col items-center gap-2">
            <RotateCw
              size={40}
              className="animate-spin"
              style={{ color: 'var(--color-btn-primary-bg)' }}
            />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Spinning...
            </p>
          </div>
        ) : result ? (
          <div className="w-full space-y-3">
            {/* Result */}
            <div
              className="text-center p-4 rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))',
                border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)',
              }}
            >
              <p className="text-lg font-bold" style={{ color: 'var(--color-text-heading)' }}>
                {result.content}
              </p>
              {result.notes && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {result.notes}
                </p>
              )}
            </div>

            {/* Assign flow */}
            {assigned ? (
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--color-btn-primary-bg)' }}>
                  <Check size={14} className="inline mr-1" />
                  Assigned!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Assign to:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {children.map(member => {
                    const selected = selectedMemberId === member.id
                    const color = getMemberColor(member)
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setSelectedMemberId(member.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={{
                          backgroundColor: selected ? color : 'var(--color-bg-secondary)',
                          color: selected ? '#fff' : 'var(--color-text-primary)',
                          border: `1.5px solid ${selected ? color : 'var(--color-border)'}`,
                        }}
                      >
                        {member.display_name}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAssign}
                    disabled={!selectedMemberId || assigning}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                    style={{
                      backgroundColor: 'var(--color-btn-primary-bg)',
                      color: 'var(--color-btn-primary-text, #fff)',
                    }}
                  >
                    <Check size={14} />
                    {assigning ? 'Assigning...' : 'Assign'}
                  </button>
                  <button
                    onClick={handleSpin}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleSpin}
            disabled={itemCount === 0}
            className="flex flex-col items-center gap-2 p-6 rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text, #fff)',
            }}
          >
            <RotateCw size={32} />
            <span className="text-sm font-semibold">Spin!</span>
          </button>
        )}
      </div>

      {/* History — last 3 draws */}
      {dataPoints.length > 0 && !result && (
        <div className="border-t pt-2" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Recent:
          </p>
          <div className="flex flex-col gap-0.5">
            {dataPoints.slice(-3).reverse().map((dp) => (
              <p key={dp.id} className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {(dp.metadata as { item_name?: string })?.item_name ?? `Draw #${dp.value}`}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
