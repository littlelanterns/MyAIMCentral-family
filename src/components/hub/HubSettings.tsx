/**
 * HubSettings — PRD-14D Family Hub Settings
 *
 * Mom-only settings modal with 6 configuration groups:
 * 1. Hub Appearance (title, theme override)
 * 2. Hub Mode & Security (set/change Hub PIN)
 * 3. Section Visibility & Order
 * 4. Family Best Intentions Management
 * 5. Victory Settings
 * 6. Calendar note
 *
 * Opens from gear icon in Hub header. PIN-protected on standalone Hub.
 */

import { useState, useCallback } from 'react'
import {
  Settings, Eye, EyeOff, GripVertical, Plus, Pencil, Archive,
  Star, Trophy, Home, Lock, Frame, Trash2, Type, Image as ImageIcon, Calendar,
} from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { supabase } from '@/lib/supabase/client'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useFamilyHubConfig, useUpdateFamilyHubConfig, HUB_SECTION_KEYS } from '@/hooks/useFamilyHubConfig'
import {
  useAllFamilyBestIntentions,
  useCreateFamilyBestIntention,
  useUpdateFamilyBestIntention,
  useArchiveFamilyBestIntention,
} from '@/hooks/useFamilyBestIntentions'
import {
  useVisibleCountdowns,
  useCreateCountdown,
  useUpdateCountdown,
  useDeleteCountdown,
} from '@/hooks/useCountdowns'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import type { FamilyBestIntention } from '@/hooks/useFamilyBestIntentions'
import type { Countdown } from '@/hooks/useCountdowns'
import {
  useAllSlideshowSlides,
  useCreateSlideshowSlide,
  useDeleteSlideshowSlide,
} from '@/hooks/useSlideshowSlides'

// ─── Hub PIN Setter ─────────────────────────────────────────────────────────

function HubPinSetter({ familyId, hasPin }: { familyId?: string; hasPin: boolean }) {
  const [editing, setEditing] = useState(false)
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!familyId) return
    if (pin.length !== 4) { setError('PIN must be 4 digits'); return }
    if (pin !== confirm) { setError('PINs do not match'); return }

    setSaving(true)
    setError('')
    const { error: rpcErr } = await supabase.rpc('hash_hub_pin', { p_family_id: familyId, p_pin: pin })
    setSaving(false)

    if (rpcErr) {
      setError('Failed to save PIN')
      return
    }
    setEditing(false)
    setPin('')
    setConfirm('')
  }

  if (!editing) {
    return (
      <button
        className="text-xs px-3 py-2 rounded-lg font-medium mt-2"
        style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        onClick={() => setEditing(true)}
      >
        {hasPin ? 'Change Hub PIN' : 'Set Hub PIN'}
      </button>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError('') }}
        className="w-full px-3 py-2 rounded-lg outline-none text-center tracking-widest"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        placeholder="New 4-digit PIN"
        autoFocus
      />
      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={confirm}
        onChange={(e) => { setConfirm(e.target.value.replace(/\D/g, '')); setError('') }}
        className="w-full px-3 py-2 rounded-lg outline-none text-center tracking-widest"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        placeholder="Confirm PIN"
      />
      {error && <p className="text-xs" style={{ color: 'var(--color-error, #ef4444)' }}>{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => { setEditing(false); setPin(''); setConfirm(''); setError('') }}
          className="flex-1 text-xs px-3 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || pin.length < 4}
          className="flex-1 text-xs px-3 py-2 rounded-lg font-semibold disabled:opacity-50"
          style={{ background: 'var(--gradient-primary, var(--color-btn-primary-bg))', color: 'var(--color-btn-primary-text)', border: 'none' }}
        >
          {saving ? 'Saving...' : 'Save PIN'}
        </button>
      </div>
    </div>
  )
}

// ─── Section labels ─────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  family_calendar: 'Family Calendar',
  family_best_intentions: 'Family Best Intentions',
  victories_summary: 'Victories Summary',
  countdowns: 'Countdowns',
  widget_grid: 'Widget Grid',
  member_access: 'Member Access',
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface HubSettingsProps {
  isOpen: boolean
  onClose: () => void
}

// ─── Component ──────────────────────────────────────────────────────────────

export function HubSettings({ isOpen, onClose }: HubSettingsProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: familyMembers } = useFamilyMembers(member?.family_id)
  const familyId = family?.id
  const memberId = member?.id

  const { data: config } = useFamilyHubConfig(familyId)
  const updateConfig = useUpdateFamilyHubConfig()
  const { data: intentions } = useAllFamilyBestIntentions(familyId)
  const createIntention = useCreateFamilyBestIntention()
  const updateIntention = useUpdateFamilyBestIntention()
  const archiveIntention = useArchiveFamilyBestIntention()
  const { data: countdowns } = useVisibleCountdowns(familyId)
  const createCountdown = useCreateCountdown()
  const updateCountdownMut = useUpdateCountdown()
  const deleteCountdown = useDeleteCountdown()
  const { data: slides } = useAllSlideshowSlides(familyId)
  const createSlide = useCreateSlideshowSlide()
  const deleteSlide = useDeleteSlideshowSlide()

  // Slideshow form
  const [showSlideForm, setShowSlideForm] = useState(false)
  const [slideType, setSlideType] = useState<'text' | 'image_photo' | 'image_word_art'>('text')
  const [slideText, setSlideText] = useState('')
  const [slideImageUrl, setSlideImageUrl] = useState('')

  // Local state
  const [hubTitle, setHubTitle] = useState('')
  const [titleDirty, setTitleDirty] = useState(false)

  // Intention form
  const [showIntentionForm, setShowIntentionForm] = useState(false)
  const [editingIntention, setEditingIntention] = useState<FamilyBestIntention | null>(null)
  const [intentionTitle, setIntentionTitle] = useState('')
  const [intentionDesc, setIntentionDesc] = useState('')
  const [intentionMembers, setIntentionMembers] = useState<string[]>([])
  const [intentionRequirePin, setIntentionRequirePin] = useState(false)

  // Countdown form
  const [showCountdownForm, setShowCountdownForm] = useState(false)
  const [editingCountdown, setEditingCountdown] = useState<Countdown | null>(null)
  const [cdTitle, setCdTitle] = useState('')
  const [cdEmoji, setCdEmoji] = useState('')
  const [cdDate, setCdDate] = useState('')
  const [cdShowOnDay, setCdShowOnDay] = useState(true)

  // ─── Section visibility toggle ──────────────────────────────────────────

  const sectionOrder = config?.section_order ?? [...HUB_SECTION_KEYS]
  const sectionVisibility = config?.section_visibility ?? {}

  const toggleSectionVisibility = useCallback((key: string) => {
    if (!familyId) return
    const current = sectionVisibility[key] ?? true
    updateConfig.mutate({
      familyId,
      sectionVisibility: { ...sectionVisibility, [key]: !current },
    })
  }, [familyId, sectionVisibility, updateConfig])

  // ─── Hub title save ─────────────────────────────────────────────────────

  const saveTitle = useCallback(() => {
    if (!familyId) return
    updateConfig.mutate({ familyId, hubTitle: hubTitle.trim() || null })
    setTitleDirty(false)
  }, [familyId, hubTitle, updateConfig])

  // ─── Intention form handlers ────────────────────────────────────────────

  const openNewIntention = useCallback(() => {
    setEditingIntention(null)
    setIntentionTitle('')
    setIntentionDesc('')
    setIntentionMembers(familyMembers?.map(m => m.id) ?? [])
    setIntentionRequirePin(false)
    setShowIntentionForm(true)
  }, [familyMembers])

  const openEditIntention = useCallback((i: FamilyBestIntention) => {
    setEditingIntention(i)
    setIntentionTitle(i.title)
    setIntentionDesc(i.description ?? '')
    setIntentionMembers(i.participating_member_ids)
    setIntentionRequirePin(i.require_pin_to_tally)
    setShowIntentionForm(true)
  }, [])

  const saveIntention = useCallback(async () => {
    if (!familyId || !memberId || !intentionTitle.trim()) return
    if (editingIntention) {
      await updateIntention.mutateAsync({
        id: editingIntention.id,
        familyId,
        title: intentionTitle.trim(),
        description: intentionDesc.trim() || null,
        participatingMemberIds: intentionMembers,
        requirePinToTally: intentionRequirePin,
      })
    } else {
      await createIntention.mutateAsync({
        familyId,
        createdByMemberId: memberId,
        title: intentionTitle.trim(),
        description: intentionDesc.trim() || undefined,
        participatingMemberIds: intentionMembers,
        requirePinToTally: intentionRequirePin,
      })
    }
    setShowIntentionForm(false)
  }, [familyId, memberId, intentionTitle, intentionDesc, intentionMembers, intentionRequirePin, editingIntention, createIntention, updateIntention])

  // ─── Countdown form handlers ────────────────────────────────────────────

  const openNewCountdown = useCallback(() => {
    setEditingCountdown(null)
    setCdTitle('')
    setCdEmoji('')
    setCdDate('')
    setCdShowOnDay(true)
    setShowCountdownForm(true)
  }, [])

  const openEditCountdown = useCallback((cd: Countdown) => {
    setEditingCountdown(cd)
    setCdTitle(cd.title)
    setCdEmoji(cd.emoji ?? '')
    setCdDate(cd.target_date)
    setCdShowOnDay(cd.show_on_target_day)
    setShowCountdownForm(true)
  }, [])

  const saveCountdown = useCallback(async () => {
    if (!familyId || !memberId || !cdTitle.trim() || !cdDate) return
    if (editingCountdown) {
      await updateCountdownMut.mutateAsync({
        id: editingCountdown.id,
        familyId,
        title: cdTitle.trim(),
        emoji: cdEmoji.trim() || null,
        targetDate: cdDate,
        showOnTargetDay: cdShowOnDay,
      })
    } else {
      await createCountdown.mutateAsync({
        familyId,
        createdByMemberId: memberId,
        title: cdTitle.trim(),
        emoji: cdEmoji.trim() || undefined,
        targetDate: cdDate,
        showOnTargetDay: cdShowOnDay,
      })
    }
    setShowCountdownForm(false)
  }, [familyId, memberId, cdTitle, cdEmoji, cdDate, cdShowOnDay, editingCountdown, createCountdown, updateCountdownMut])

  // ─── Victory settings ───────────────────────────────────────────────────

  const victorySettings = config?.victory_settings ?? {}
  const slideshowConfig = (config?.slideshow_config ?? {}) as Record<string, unknown>

  // @dnd-kit for section reorder
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !familyId) return
    const oldIndex = sectionOrder.indexOf(active.id as string)
    const newIndex = sectionOrder.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = [...sectionOrder]
    const [moved] = newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, moved)
    updateConfig.mutate({ familyId, sectionOrder: newOrder })
  }, [familyId, sectionOrder, updateConfig])
  const toggleVictorySetting = useCallback((key: string) => {
    if (!familyId) return
    const current = (victorySettings as Record<string, boolean>)[key] ?? true
    updateConfig.mutate({
      familyId,
      victorySettings: { ...victorySettings, [key]: !current },
    })
  }, [familyId, victorySettings, updateConfig])

  if (!isOpen) return null

  return (
    <ModalV2
      id="hub-settings"
      isOpen={isOpen}
      onClose={onClose}
      title="Hub Settings"
      size="md"
      type="transient"
    >
      <div className="space-y-6 p-4">

        {/* ── 1. Hub Appearance ──────────────────────────────────────── */}
        <SettingsGroup icon={<Home size={16} />} title="Hub Appearance">
          <div className="space-y-2">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Hub Title</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={titleDirty ? hubTitle : (config?.hub_title ?? '')}
                onChange={(e) => { setHubTitle(e.target.value); setTitleDirty(true) }}
                placeholder={`${family?.family_name ?? 'Family'} Hub`}
                className="flex-1 text-sm rounded-lg px-3 py-2"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              />
              {titleDirty && (
                <button
                  onClick={saveTitle}
                  className="text-xs px-3 py-1 rounded-lg font-medium"
                  style={{ backgroundColor: 'var(--surface-primary, var(--color-btn-primary-bg))', color: 'var(--color-text-on-primary, #fff)' }}
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </SettingsGroup>

        {/* ── 2. Hub Mode & Security ────────────────────────────────── */}
        <SettingsGroup icon={<Lock size={16} />} title="Hub Mode & Security">
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {config?.hub_pin
              ? 'Hub PIN is set. Hub Mode can be activated on shared devices.'
              : 'Set a Hub PIN to enable Hub Mode for shared devices.'}
          </p>
          <HubPinSetter familyId={family?.id} hasPin={!!config?.hub_pin} />
        </SettingsGroup>

        {/* ── 3. Section Visibility & Order ──────────────────────────── */}
        <SettingsGroup icon={<Eye size={16} />} title="Section Visibility & Order">
          <DndContext
            sensors={dndSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSectionDragEnd}
          >
            <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {sectionOrder.map((key) => {
                  const visible = sectionVisibility[key] ?? true
                  return (
                    <SortableSectionItem
                      key={key}
                      id={key}
                      label={SECTION_LABELS[key] ?? key}
                      visible={visible}
                      onToggle={() => toggleSectionVisibility(key)}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        </SettingsGroup>

        {/* ── 4. Family Best Intentions ──────────────────────────────── */}
        <SettingsGroup icon={<Star size={16} />} title="Family Best Intentions">
          {showIntentionForm ? (
            <div className="space-y-3 p-3 rounded-lg" style={{ border: '1px solid var(--color-border)' }}>
              <input
                type="text"
                value={intentionTitle}
                onChange={(e) => setIntentionTitle(e.target.value)}
                placeholder="Intention title (e.g., Remain Calm)"
                className="w-full text-sm rounded-lg px-3 py-2"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              />
              <input
                type="text"
                value={intentionDesc}
                onChange={(e) => setIntentionDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full text-sm rounded-lg px-3 py-2"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              />
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Participating Members
                </label>
                <MemberPillSelector
                  members={familyMembers ?? []}
                  selectedIds={intentionMembers}
                  onToggle={(id) => {
                    setIntentionMembers(prev =>
                      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
                    )
                  }}
                />
              </div>
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                <input
                  type="checkbox"
                  checked={intentionRequirePin}
                  onChange={(e) => setIntentionRequirePin(e.target.checked)}
                  className="rounded"
                />
                Require PIN to log tally
              </label>
              <div className="flex gap-2">
                <button
                  onClick={saveIntention}
                  disabled={!intentionTitle.trim()}
                  className="text-xs px-4 py-2 rounded-lg font-medium"
                  style={{ backgroundColor: 'var(--surface-primary, var(--color-btn-primary-bg))', color: 'var(--color-text-on-primary, #fff)', opacity: intentionTitle.trim() ? 1 : 0.5 }}
                >
                  {editingIntention ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => setShowIntentionForm(false)}
                  className="text-xs px-4 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {(intentions ?? []).map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center gap-2 py-2 px-2 rounded-lg"
                    style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                  >
                    <span className="flex-1 text-sm" style={{ color: i.is_active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                      {i.title}
                      {!i.is_active && <span className="text-xs ml-1">(inactive)</span>}
                    </span>
                    <button
                      onClick={() => openEditIntention(i)}
                      className="p-1 rounded"
                      style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => familyId && archiveIntention.mutate({ id: i.id, familyId })}
                      className="p-1 rounded"
                      style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                    >
                      <Archive size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={openNewIntention}
                className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg mt-2"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                <Plus size={14} /> Create New Intention
              </button>
            </>
          )}
        </SettingsGroup>

        {/* ── 5. Countdowns ──────────────────────────────────────────── */}
        <SettingsGroup icon={<Settings size={16} />} title="Countdowns">
          {showCountdownForm ? (
            <div className="space-y-3 p-3 rounded-lg" style={{ border: '1px solid var(--color-border)' }}>
              <input
                type="text"
                value={cdTitle}
                onChange={(e) => setCdTitle(e.target.value)}
                placeholder="Countdown title"
                className="w-full text-sm rounded-lg px-3 py-2"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cdEmoji}
                  onChange={(e) => setCdEmoji(e.target.value)}
                  placeholder="Emoji (optional)"
                  maxLength={4}
                  className="w-20 text-sm rounded-lg px-3 py-2 text-center"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                />
                <input
                  type="date"
                  value={cdDate}
                  onChange={(e) => setCdDate(e.target.value)}
                  className="flex-1 text-sm rounded-lg px-3 py-2"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                />
              </div>
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                <input
                  type="checkbox"
                  checked={cdShowOnDay}
                  onChange={(e) => setCdShowOnDay(e.target.checked)}
                  className="rounded"
                />
                Show &quot;Today is the day!&quot; on target date
              </label>
              <div className="flex gap-2">
                <button
                  onClick={saveCountdown}
                  disabled={!cdTitle.trim() || !cdDate}
                  className="text-xs px-4 py-2 rounded-lg font-medium"
                  style={{ backgroundColor: 'var(--surface-primary, var(--color-btn-primary-bg))', color: 'var(--color-text-on-primary, #fff)', opacity: (cdTitle.trim() && cdDate) ? 1 : 0.5 }}
                >
                  {editingCountdown ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => setShowCountdownForm(false)}
                  className="text-xs px-4 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {(countdowns ?? []).map((cd) => (
                  <div
                    key={cd.id}
                    className="flex items-center gap-2 py-2 px-2 rounded-lg"
                    style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                  >
                    {cd.emoji && <span className="text-sm">{cd.emoji}</span>}
                    <span className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {cd.title} — {cd.target_date}
                    </span>
                    <button
                      onClick={() => openEditCountdown(cd)}
                      className="p-1 rounded"
                      style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => familyId && deleteCountdown.mutate({ id: cd.id, familyId })}
                      className="p-1 rounded"
                      style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                    >
                      <Archive size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={openNewCountdown}
                className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg mt-2"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                <Plus size={14} /> Create Countdown
              </button>
            </>
          )}
        </SettingsGroup>

        {/* ── 6. Victory Settings ────────────────────────────────────── */}
        <SettingsGroup icon={<Trophy size={16} />} title="Victory Display">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
              <input
                type="checkbox"
                checked={victorySettings.show_count ?? true}
                onChange={() => toggleVictorySetting('show_count')}
                className="rounded"
              />
              Show victory count on Hub
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
              <input
                type="checkbox"
                checked={victorySettings.include_teens ?? true}
                onChange={() => toggleVictorySetting('include_teens')}
                className="rounded"
              />
              Include teen victories in Hub count
            </label>
            <p className="text-xs pl-6" style={{ color: 'var(--color-text-secondary)' }}>
              When enabled, siblings can see the total victory count including teen contributions.
            </p>
          </div>
        </SettingsGroup>

        {/* ── 7. Slideshow Management ─────────────────────────────────── */}
        <SettingsGroup icon={<Frame size={16} />} title="Slideshow Frame">
          {showSlideForm ? (
            <div className="space-y-3 p-3 rounded-lg" style={{ border: '1px solid var(--color-border)' }}>
              {/* Slide type selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSlideType('text')}
                  className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg font-medium"
                  style={{
                    backgroundColor: slideType === 'text' ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-bg-secondary)',
                    color: slideType === 'text' ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <Type size={12} /> Text
                </button>
                <button
                  onClick={() => setSlideType('image_photo')}
                  className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg font-medium"
                  style={{
                    backgroundColor: slideType === 'image_photo' ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-bg-secondary)',
                    color: slideType === 'image_photo' ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <ImageIcon size={12} /> Photo
                </button>
                <button
                  onClick={() => setSlideType('image_word_art')}
                  className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg font-medium"
                  style={{
                    backgroundColor: slideType === 'image_word_art' ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-bg-secondary)',
                    color: slideType === 'image_word_art' ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <Type size={12} /> Word Art
                </button>
              </div>

              {/* Text input for text slides */}
              {slideType === 'text' && (
                <textarea
                  value={slideText}
                  onChange={(e) => setSlideText(e.target.value)}
                  placeholder="Type a quote, scripture, or message..."
                  rows={3}
                  className="w-full text-sm rounded-lg px-3 py-2 resize-none"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                />
              )}

              {/* File upload for image slides */}
              {(slideType === 'image_photo' || slideType === 'image_word_art') && (
                <div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setSlideImageUrl(file.name) // Track that a file is selected
                      // Store the actual File object for upload
                      ;(window as unknown as Record<string, unknown>).__hubSlideFile = file
                    }}
                    className="w-full text-xs"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    JPG, PNG, WebP, or GIF. Max 10MB.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!familyId) return
                    if (slideType === 'text' && !slideText.trim()) return

                    let imageUrl: string | undefined
                    if (slideType !== 'text') {
                      // Upload file to Supabase Storage
                      const file = (window as unknown as Record<string, unknown>).__hubSlideFile as File | undefined
                      if (!file) return
                      const ext = file.name.split('.').pop() ?? 'jpg'
                      const path = `${familyId}/${crypto.randomUUID()}.${ext}`
                      const { error: uploadErr } = await supabase.storage
                        .from('hub-slideshow')
                        .upload(path, file, { contentType: file.type, upsert: false })
                      if (uploadErr) {
                        console.error('Upload failed:', uploadErr)
                        return
                      }
                      const { data: urlData } = supabase.storage.from('hub-slideshow').getPublicUrl(path)
                      imageUrl = urlData.publicUrl
                      delete (window as unknown as Record<string, unknown>).__hubSlideFile
                    }

                    await createSlide.mutateAsync({
                      familyId,
                      slideType,
                      textBody: slideType === 'text' ? slideText.trim() : undefined,
                      imageUrl,
                      sortOrder: (slides?.length ?? 0),
                    })
                    setSlideText('')
                    setSlideImageUrl('')
                    setShowSlideForm(false)
                  }}
                  disabled={slideType === 'text' ? !slideText.trim() : !slideImageUrl}
                  className="text-xs px-4 py-2 rounded-lg font-medium"
                  style={{
                    backgroundColor: 'var(--surface-primary, var(--color-btn-primary-bg))',
                    color: 'var(--color-text-on-primary, #fff)',
                    opacity: (slideType === 'text' ? slideText.trim() : slideImageUrl) ? 1 : 0.5,
                  }}
                >
                  Add Slide
                </button>
                <button
                  onClick={() => setShowSlideForm(false)}
                  className="text-xs px-4 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Existing slides list */}
              <div className="space-y-2">
                {(slides ?? []).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 py-2 px-2 rounded-lg"
                    style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                  >
                    {s.slide_type === 'text' ? (
                      <Type size={14} style={{ color: 'var(--color-text-secondary)' }} />
                    ) : (
                      <ImageIcon size={14} style={{ color: 'var(--color-text-secondary)' }} />
                    )}
                    <span className="flex-1 text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {s.slide_type === 'text'
                        ? (s.text_body?.slice(0, 50) ?? 'Text slide') + (s.text_body && s.text_body.length > 50 ? '...' : '')
                        : s.slide_type === 'image_word_art' ? 'Word art image' : 'Photo'}
                    </span>
                    <button
                      onClick={() => familyId && deleteSlide.mutate({ id: s.id, familyId })}
                      className="p-1 rounded"
                      style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setSlideText('')
                  setSlideImageUrl('')
                  setSlideType('text')
                  setShowSlideForm(true)
                }}
                className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg mt-2"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                <Plus size={14} /> Add Slide
              </button>
            </>
          )}

          {/* Guiding Stars auto-feed toggle */}
          <label className="flex items-center gap-2 text-sm mt-3" style={{ color: 'var(--color-text-primary)' }}>
            <input
              type="checkbox"
              checked={slideshowConfig.guiding_stars_feed !== false}
              onChange={() => {
                if (!familyId) return
                const current = slideshowConfig.guiding_stars_feed !== false
                updateConfig.mutate({
                  familyId,
                  slideshowConfig: { ...slideshowConfig, guiding_stars_feed: !current },
                })
              }}
              className="rounded"
            />
            Include family Guiding Stars
          </label>

          {/* Rotation order */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Order:</span>
            <select
              value={(slideshowConfig.rotation_order as string) ?? 'sequential'}
              onChange={(e) => {
                if (!familyId) return
                updateConfig.mutate({
                  familyId,
                  slideshowConfig: { ...slideshowConfig, rotation_order: e.target.value },
                })
              }}
              className="text-xs rounded px-2 py-1"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              <option value="sequential">Sequential</option>
              <option value="random">Random</option>
            </select>
          </div>
        </SettingsGroup>

        {/* ── 8. Calendar View ─────────────────────────────────────────── */}
        <SettingsGroup icon={<Calendar size={16} />} title="Hub Calendar">
          <div className="space-y-2">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Calendar view on Hub</label>
            <div className="flex gap-2">
              {(['week', 'month', 'both'] as const).map((view) => {
                const currentView = ((config?.preferences as Record<string, unknown>)?.hub_calendar_view as string) ?? 'week'
                const isActive = currentView === view
                return (
                  <button
                    key={view}
                    onClick={() => {
                      if (!familyId) return
                      updateConfig.mutate({
                        familyId,
                        preferences: {
                          ...((config?.preferences as Record<string, unknown>) ?? {}),
                          hub_calendar_view: view,
                        },
                      })
                    }}
                    className="flex-1 text-xs py-2 rounded-lg font-medium capitalize"
                    style={{
                      backgroundColor: isActive ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-bg-secondary)',
                      color: isActive ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {view}
                  </button>
                )
              })}
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Events are visible on the Hub by default. Hide individual events from the Hub when creating or editing them.
            </p>
          </div>
        </SettingsGroup>

      </div>
    </ModalV2>
  )
}

// ─── Settings Group ─────────────────────────────────────────────────────────

// ─── Sortable Section Item ──────────────────────────────────────────────────

function SortableSectionItem({ id, label, visible, onToggle }: { id: string; label: string; visible: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      className="flex items-center gap-2 py-2 px-2 rounded-lg"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <button
        className="cursor-grab active:cursor-grabbing p-0.5 touch-none"
        style={{ color: 'var(--color-text-muted, var(--color-text-secondary))', background: 'transparent', minHeight: 'unset' }}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>
      <span className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
        {label}
      </span>
      <button
        onClick={onToggle}
        className="p-1 rounded"
        style={{ color: visible ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
      >
        {visible ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  )
}

// ─── Settings Group ─────────────────────────────────────────────────────────

function SettingsGroup({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: 'var(--color-text-secondary)' }}>{icon}</span>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}
