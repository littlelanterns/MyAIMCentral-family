/**
 * ShopItemEditorModal — PRD-24 Point Economy Addendum §7.3.
 *
 * Create/edit surface for one Reward Shop catalog item. Name, description,
 * RewardImagePicker (three-mode), point cost, audience (Everyone / specific
 * kids — empty array = Everyone per addendum §6.1), "Needs my approval"
 * toggle (default ON), purchase limit (N per day/week/month or no limit),
 * unlock gate (completion-% threshold, rolling week), notes to kid.
 */

import { useState } from 'react'
import { Gift, Users } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { RewardImagePicker, type RewardImageValue } from '@/components/rewards/RewardImagePicker'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useCreateRewardShopItem, useUpdateRewardShopItem } from '@/hooks/useRewardShop'
import type { RewardShopItem, RewardShopLimitPeriod } from '@/types/reward-shop'

interface ShopItemEditorModalProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  createdBy: string
  /** Pass an existing item to edit; omit to create a new one. */
  item?: RewardShopItem | null
}

export function ShopItemEditorModal({ isOpen, onClose, familyId, createdBy, item }: ShopItemEditorModalProps) {
  const { data: members = [] } = useFamilyMembers(familyId)
  const kids = members.filter((m) => m.role === 'member')
  const createItem = useCreateRewardShopItem()
  const updateItem = useUpdateRewardShopItem()

  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [image, setImage] = useState<RewardImageValue>({
    imageUrl: item?.image_url ?? null,
    imageAssetKey: item?.image_asset_key ?? null,
  })
  const [pointCost, setPointCost] = useState(item?.point_cost?.toString() ?? '')
  const [requiresApproval, setRequiresApproval] = useState(item?.requires_approval ?? true)
  const [audienceMode, setAudienceMode] = useState<'everyone' | 'specific'>(
    item && item.audience_member_ids.length > 0 ? 'specific' : 'everyone',
  )
  const [audienceIds, setAudienceIds] = useState<string[]>(item?.audience_member_ids ?? [])
  const [hasLimit, setHasLimit] = useState(item?.limit_per_member != null)
  const [limitPerMember, setLimitPerMember] = useState(item?.limit_per_member?.toString() ?? '1')
  const [limitPeriod, setLimitPeriod] = useState<RewardShopLimitPeriod>(item?.limit_period ?? 'week')
  const [hasGate, setHasGate] = useState(!!item?.unlock_rule)
  const [gateThreshold, setGateThreshold] = useState(item?.unlock_rule?.threshold?.toString() ?? '80')
  const [notesToKid, setNotesToKid] = useState(item?.notes_to_kid ?? '')
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!item
  const isSaving = createItem.isPending || updateItem.isPending

  const toggleAudienceKid = (memberId: string) => {
    setAudienceIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    )
  }

  const handleSave = async () => {
    setError(null)
    const trimmedName = name.trim()
    const cost = parseInt(pointCost, 10)
    if (!trimmedName) {
      setError('Give this reward a name.')
      return
    }
    if (!Number.isFinite(cost) || cost <= 0) {
      setError('Point cost must be a positive number.')
      return
    }
    if (audienceMode === 'specific' && audienceIds.length === 0) {
      setError('Pick at least one kid, or switch back to Everyone.')
      return
    }

    const input = {
      familyId,
      createdBy,
      name: trimmedName,
      description: description.trim() || null,
      imageUrl: image.imageUrl,
      imageAssetKey: image.imageAssetKey,
      pointCost: cost,
      requiresApproval,
      audienceMemberIds: audienceMode === 'everyone' ? [] : audienceIds,
      limitPerMember: hasLimit ? Math.max(1, parseInt(limitPerMember, 10) || 1) : null,
      limitPeriod: hasLimit ? limitPeriod : null,
      unlockRule: hasGate
        ? { type: 'completion_pct' as const, threshold: Math.min(100, Math.max(0, parseInt(gateThreshold, 10) || 0)), window: 'week' as const }
        : null,
      notesToKid: notesToKid.trim() || null,
    }

    try {
      if (isEditing && item) {
        await updateItem.mutateAsync({ itemId: item.id, familyId, updates: input })
      } else {
        await createItem.mutateAsync(input)
      }
      onClose()
    } catch {
      setError('Something went wrong saving this reward. Try again?')
    }
  }

  return (
    <ModalV2
      id="shop-item-editor"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title={isEditing ? 'Edit Reward' : 'New Reward'}
      icon={Gift}
      footer={
        <button
          type="button"
          data-testid="shop-item-save"
          onClick={handleSave}
          disabled={isSaving}
          style={{
            width: '100%',
            padding: '0.625rem 1rem',
            minHeight: '44px',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            border: 'none',
            background: 'var(--surface-primary)',
            color: 'var(--color-text-on-primary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            cursor: 'pointer',
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Reward'}
        </button>
      }
    >
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <p style={{ color: 'var(--color-error, #c44)', fontSize: 'var(--font-size-sm)', margin: 0 }}>{error}</p>
        )}

        <div>
          <label style={fieldLabelStyle}>Reward name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Movie Night"
            data-testid="shop-item-name"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={fieldLabelStyle}>Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Pick any movie, popcorn included"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <RewardImagePicker value={image} onChange={setImage} familyId={familyId} suggestText={name} />

        <div>
          <label style={fieldLabelStyle}>Point cost</label>
          <input
            type="number"
            min={1}
            value={pointCost}
            onChange={(e) => setPointCost(e.target.value)}
            placeholder="200"
            data-testid="shop-item-cost"
            style={{ ...inputStyle, width: '10rem' }}
          />
        </div>

        <div>
          <label style={fieldLabelStyle}>Who can buy this</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <ModeButton active={audienceMode === 'everyone'} onClick={() => setAudienceMode('everyone')}>
              <Users size={14} /> Everyone
            </ModeButton>
            <ModeButton active={audienceMode === 'specific'} onClick={() => setAudienceMode('specific')}>
              Specific kids
            </ModeButton>
          </div>
          {audienceMode === 'specific' && (
            <MemberPillSelector
              members={kids}
              selectedIds={audienceIds}
              onToggle={toggleAudienceKid}
              variant="compact"
              showSortToggle={false}
            />
          )}
        </div>

        <ToggleRow
          label="Needs my approval"
          description="Points are held until you approve — nothing ships without you seeing it"
          checked={requiresApproval}
          onChange={setRequiresApproval}
        />

        <div>
          <ToggleRow
            label="Limit how often"
            description="Cap purchases per kid over a period"
            checked={hasLimit}
            onChange={setHasLimit}
          />
          {hasLimit && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Up to</span>
              <input
                type="number"
                min={1}
                value={limitPerMember}
                onChange={(e) => setLimitPerMember(e.target.value)}
                style={{ ...inputStyle, width: '4.5rem' }}
              />
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>per</span>
              <select
                value={limitPeriod}
                onChange={(e) => setLimitPeriod(e.target.value as RewardShopLimitPeriod)}
                style={{ ...inputStyle, width: 'auto' }}
              >
                <option value="day">day</option>
                <option value="week">week</option>
                <option value="month">month</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <ToggleRow
            label="Unlock with a completion streak"
            description="Only available once their weekly completion rate clears a threshold — shown as warm progress, never a list of misses"
            checked={hasGate}
            onChange={setHasGate}
          />
          {hasGate && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Unlocks at
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={gateThreshold}
                onChange={(e) => setGateThreshold(e.target.value)}
                style={{ ...inputStyle, width: '4.5rem' }}
              />
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                % this week
              </span>
            </div>
          )}
        </div>

        <div>
          <label style={fieldLabelStyle}>A note for them (optional)</label>
          <textarea
            value={notesToKid}
            onChange={(e) => setNotesToKid(e.target.value)}
            rows={2}
            placeholder="Ask me first about which night!"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      </div>
    </ModalV2>
  )
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.375rem',
        padding: '0.5rem',
        minHeight: '40px',
        borderRadius: 'var(--vibe-radius-input, 8px)',
        border: active ? '2px solid var(--color-btn-primary-bg)' : '1px solid var(--color-border)',
        backgroundColor: active
          ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
          : 'var(--color-bg-card)',
        color: 'var(--color-text-primary)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: '0.2rem', minHeight: 'unset', width: '18px', height: '18px', accentColor: 'var(--color-btn-primary-bg)' }}
      />
      <span>
        <span style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {label}
        </span>
        <span style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          {description}
        </span>
      </span>
    </label>
  )
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  marginBottom: '0.375rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  minHeight: '44px',
  borderRadius: 'var(--vibe-radius-input, 8px)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)',
}
