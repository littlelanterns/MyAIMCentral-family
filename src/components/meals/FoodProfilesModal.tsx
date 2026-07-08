/**
 * FoodProfilesModal — PRD-42 KitchenCompass §6.7
 *
 * Restrictions block (writes food_restrictions, always-include, "can't be
 * turned off" copy) + likes/dislikes quick-add (writes archive_context_items
 * into the member's Preferences folder — Convention #75 write-back) + a
 * whole-family row + mom-only nutrition_direction editor.
 */

import { useState } from 'react'
import { X, Plus, Trash2, Heart, HeartOff, ShieldAlert, Sparkles } from 'lucide-react'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'
import { Avatar } from '@/components/shared/Avatar'
import { useFoodRestrictions, useCreateFoodRestriction, useDeleteFoodRestriction, useMealSettings, useUpdateMealSettings } from '@/hooks/useFoodProfiles'
import { useArchiveFolders, useArchiveContextItemsByMember, useCreateArchiveContextItem, useToggleArchiveItemAI } from '@/hooks/useArchives'
import type { FoodRestrictionSeverity, FoodRestrictionType } from '@/types/meals'

interface FoodProfilesModalProps {
  familyId: string
  memberId: string
  isMomOrGrant: boolean
  onClose: () => void
}

const RESTRICTION_TYPES: FoodRestrictionType[] = ['allergy', 'intolerance', 'medical_diet', 'religious', 'strong_dislike']
const SEVERITIES: FoodRestrictionSeverity[] = ['life_threatening', 'avoid', 'limit']

export function FoodProfilesModal({ familyId, memberId, isMomOrGrant, onClose }: FoodProfilesModalProps) {
  const { data: members = [] } = useFamilyMembers(familyId)
  const { data: restrictions = [] } = useFoodRestrictions(familyId)
  const { data: mealSettings } = useMealSettings(familyId)
  const [nutritionDirection, setNutritionDirection] = useState(mealSettings?.nutrition_direction ?? '')
  const updateSettings = useUpdateMealSettings()

  const hasNoRestrictions = restrictions.length === 0

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-5 space-y-5 density-comfortable"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Food Profiles</h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>

        {hasNoRestrictions && (
          <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
            Start with allergies — then teach LiLa your family's tastes.
          </div>
        )}

        {/* Whole-family row */}
        <MemberFoodCard
          familyId={familyId}
          actingMemberId={memberId}
          memberId={null}
          memberLabel="Whole family"
          memberColor="var(--color-text-secondary)"
          isMomOrGrant={isMomOrGrant}
          restrictions={restrictions.filter((r) => r.member_id === null)}
        />

        {members.map((m) => (
          <MemberFoodCard
            key={m.id}
            familyId={familyId}
            actingMemberId={memberId}
            memberId={m.id}
            memberLabel={m.display_name}
            memberColor={getMemberColor(m)}
            avatarSrc={m.avatar_url}
            isMomOrGrant={isMomOrGrant}
            restrictions={restrictions.filter((r) => r.member_id === m.id)}
          />
        ))}

        {isMomOrGrant && (
          <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              <Sparkles size={13} /> Nutrition awareness (only you see this)
            </p>
            <textarea
              value={nutritionDirection}
              onChange={(e) => setNutritionDirection(e.target.value)}
              onBlur={() => updateSettings.mutate({ familyId, updates: { nutrition_direction: nutritionDirection || null } })}
              rows={2}
              placeholder="e.g. more protein at breakfast, less sugar"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              Suggestions will lean this way qualitatively — no calorie or macro numbers, and this never shows on any kid surface.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function MemberFoodCard({
  familyId, actingMemberId, memberId, memberLabel, memberColor, avatarSrc, isMomOrGrant, restrictions,
}: {
  familyId: string
  /** Who is USING the app right now — restriction/preference author, per Convention #223-adjacent write-attribution. */
  actingMemberId: string
  memberId: string | null
  memberLabel: string
  memberColor: string
  avatarSrc?: string | null
  isMomOrGrant: boolean
  restrictions: { id: string; item: string; restriction_type: FoodRestrictionType; severity: FoodRestrictionSeverity; notes: string | null }[]
}) {
  const [showAddRestriction, setShowAddRestriction] = useState(false)
  const [item, setItem] = useState('')
  const [type, setType] = useState<FoodRestrictionType>('allergy')
  const [severity, setSeverity] = useState<FoodRestrictionSeverity>('avoid')
  const [loveInput, setLoveInput] = useState('')
  const [dislikeInput, setDislikeInput] = useState('')

  const createRestriction = useCreateFoodRestriction()
  const deleteRestriction = useDeleteFoodRestriction()

  const { data: folders } = useArchiveFolders(familyId, memberId ?? undefined)
  const preferencesFolder = folders?.folders.find((f) => f.folder_name === 'Preferences')
  const { data: prefItems = [] } = useArchiveContextItemsByMember(familyId, memberId ?? undefined)
  const createPref = useCreateArchiveContextItem()
  const toggleAi = useToggleArchiveItemAI()

  const loves = prefItems.filter((p) => p.context_field === 'food_like')
  const dislikes = prefItems.filter((p) => p.context_field === 'food_dislike')

  async function handleAddRestriction() {
    if (!item.trim()) return
    await createRestriction.mutateAsync({ familyId, createdBy: actingMemberId, memberId, restrictionType: type, item: item.trim(), severity })
    setItem('')
    setShowAddRestriction(false)
  }

  async function handleAddPreference(kind: 'food_like' | 'food_dislike', value: string) {
    if (!value.trim() || !preferencesFolder || !memberId) return
    await createPref.mutateAsync({ family_id: familyId, folder_id: preferencesFolder.id, member_id: memberId, added_by: actingMemberId, context_field: kind, context_value: value.trim() })
    if (kind === 'food_like') setLoveInput('')
    else setDislikeInput('')
  }

  return (
    <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: 'var(--color-bg-secondary)', border: `2px solid ${memberColor}` }}>
      <div className="flex items-center gap-2">
        {memberId && <Avatar src={avatarSrc} name={memberLabel} color={memberColor} size="sm" />}
        <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{memberLabel}</span>
      </div>

      {/* Restrictions — always-include safety card */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
          <ShieldAlert size={12} /> Restrictions
        </p>
        {restrictions.map((r) => (
          <div key={r.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-card)' }}>
            <span style={{ color: 'var(--color-text-primary)' }}>{r.item} <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>({r.restriction_type.replace('_', ' ')}, {r.severity.replace('_', ' ')})</span></span>
            {isMomOrGrant && <button onClick={() => deleteRestriction.mutate({ id: r.id, familyId })}><Trash2 size={12} style={{ color: 'var(--color-text-secondary)' }} /></button>}
          </div>
        ))}
        <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>LiLa always plans around these. This can't be turned off.</p>

        {isMomOrGrant && (
          showAddRestriction ? (
            <div className="flex gap-1.5 flex-wrap items-center">
              <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="e.g. peanuts" className="flex-1 min-w-[6rem] px-2 py-1 rounded text-xs" style={inputStyle} />
              <select value={type} onChange={(e) => setType(e.target.value as FoodRestrictionType)} className="px-1.5 py-1 rounded text-xs" style={inputStyle}>
                {RESTRICTION_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <select value={severity} onChange={(e) => setSeverity(e.target.value as FoodRestrictionSeverity)} className="px-1.5 py-1 rounded text-xs" style={inputStyle}>
                {SEVERITIES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <button onClick={handleAddRestriction} className="btn-primary px-2 py-1 rounded text-xs">Save restriction</button>
            </div>
          ) : (
            <button onClick={() => setShowAddRestriction(true)} className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-accent)' }}>
              <Plus size={12} /> Add restriction
            </button>
          )
        )}
      </div>

      {/* Preferences quick-add — only meaningful for a specific member */}
      {memberId && preferencesFolder && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PreferenceColumn label="Loves…" items={loves} value={loveInput} onChangeValue={setLoveInput} onAdd={() => handleAddPreference('food_like', loveInput)} onToggleAi={(id, included) => toggleAi.mutate({ id, folderId: preferencesFolder.id, included })} />
          <PreferenceColumn label="Not a fan of…" items={dislikes} value={dislikeInput} onChangeValue={setDislikeInput} onAdd={() => handleAddPreference('food_dislike', dislikeInput)} onToggleAi={(id, included) => toggleAi.mutate({ id, folderId: preferencesFolder.id, included })} />
        </div>
      )}
    </div>
  )
}

function PreferenceColumn({
  label, items, value, onChangeValue, onAdd, onToggleAi,
}: {
  label: string
  items: { id: string; context_value: string; is_included_in_ai: boolean }[]
  value: string
  onChangeValue: (v: string) => void
  onAdd: () => void
  onToggleAi: (id: string, included: boolean) => void
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((it) => (
          <span key={it.id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}>
            {it.context_value}
            <button onClick={() => onToggleAi(it.id, !it.is_included_in_ai)}>
              {it.is_included_in_ai ? <Heart size={10} fill="currentColor" style={{ color: 'var(--color-accent)' }} /> : <HeartOff size={10} style={{ color: 'var(--color-text-secondary)' }} />}
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={value}
          onChange={(e) => onChangeValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onAdd() }}
          placeholder="type and press Enter"
          className="flex-1 px-2 py-1 rounded text-xs"
          style={inputStyle}
        />
        <button onClick={onAdd} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-secondary)' }}><Plus size={12} /></button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }
