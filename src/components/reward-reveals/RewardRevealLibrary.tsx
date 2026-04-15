/**
 * RewardRevealLibrary — Browse/create/edit/delete named reveal combos.
 *
 * Route: /settings/reward-reveals
 * Mom creates named combinations (animation + prize content) here,
 * then attaches them to tasks/widgets/lists via AttachRevealSection's
 * "Pick from library" dropdown.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FeatureGuide } from '@/components/shared/FeatureGuide'
import {
  ChevronLeft,
  Gift,
  Plus,
  Pencil,
  Trash2,
  Film,
  Sparkles,
} from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { RevealAnimationPicker } from './RevealAnimationPicker'
import { PrizeContentEditor } from './PrizeContentEditor'
import { CongratulationsMessagePicker } from './CongratulationsMessagePicker'
import {
  useRewardReveals,
  useCreateRewardReveal,
  useUpdateRewardReveal,
  useDeleteRewardReveal,
  useRevealAnimations,
} from '@/hooks/useRewardReveals'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import type {
  RewardReveal,
  RewardRevealInput,
  PrizeType,
  PrizeMode,
  AnimationRotation,
  PrizePoolEntry,
} from '@/types/reward-reveals'

export function RewardRevealLibrary() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const familyId = family?.id
  const { data: reveals = [], isLoading } = useRewardReveals(familyId)
  const { data: animations = [] } = useRevealAnimations()
  const namedReveals = reveals.filter((r) => r.name)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const editingReveal = editingId ? reveals.find((r) => r.id === editingId) ?? null : null

  return (
    <div
      className="density-comfortable"
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '1rem',
      }}
    >
      {/* Back nav */}
      <Link
        to="/settings"
        className="hidden md:flex"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-sm)',
          textDecoration: 'none',
          marginBottom: '1rem',
        }}
      >
        <ChevronLeft size={16} /> Settings
      </Link>

      <FeatureGuide featureKey="reward_reveals" />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Gift size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <h1
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Reward Reveals
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--vibe-radius-input, 0.5rem)',
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-text-on-primary, #fff)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
          }}
        >
          <Plus size={16} /> New Reveal
        </button>
      </div>

      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
          marginBottom: '1rem',
        }}
      >
        Create named reveal combos here, then attach them to tasks, trackers,
        lists, and intentions. Each combo is an animation + prize that plays
        when something is completed.
      </p>

      {/* Library grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
          Loading...
        </div>
      ) : namedReveals.length === 0 ? (
        <EmptyState onCreateFirst={() => setShowCreate(true)} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {namedReveals.map((reveal) => (
            <RevealCard
              key={reveal.id}
              reveal={reveal}
              animations={animations}
              onEdit={() => setEditingId(reveal.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && familyId && member && (
        <RevealEditorModal
          familyId={familyId}
          memberId={member.id}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Edit modal */}
      {editingReveal && familyId && member && (
        <RevealEditorModal
          familyId={familyId}
          memberId={member.id}
          existing={editingReveal}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  )
}

// ── Empty state ──

function EmptyState({ onCreateFirst }: { onCreateFirst: () => void }) {
  return (
    <div
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        borderRadius: 'var(--vibe-radius-card, 1rem)',
        border: '2px dashed var(--color-border)',
        backgroundColor: 'var(--color-bg-card)',
      }}
    >
      <Gift size={48} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
      <div>
        <div
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '0.25rem',
          }}
        >
          No reveal combos yet
        </div>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Create your first one — pick an animation and a prize, give it a name, then
          attach it to any task, tracker, or list.
        </div>
      </div>
      <button
        type="button"
        onClick={onCreateFirst}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--vibe-radius-input, 0.5rem)',
          backgroundColor: 'var(--color-btn-primary-bg)',
          color: 'var(--color-text-on-primary, #fff)',
          border: 'none',
          cursor: 'pointer',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
        }}
      >
        <Plus size={16} /> Create First Reveal
      </button>
    </div>
  )
}

// ── Reveal card in the grid ──

function RevealCard({
  reveal,
  animations,
  onEdit,
}: {
  reveal: RewardReveal
  animations: Array<{ id: string; display_name: string; reveal_type: string }>
  onEdit: () => void
}) {
  const deleteReveal = useDeleteRewardReveal()
  const animNames = reveal.animation_ids
    .map((id) => animations.find((a) => a.id === id)?.display_name ?? '?')
    .join(', ')
  const isVideo = reveal.animation_ids.some(
    (id) => animations.find((a) => a.id === id)?.reveal_type === 'video',
  )

  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--vibe-radius-card, 0.75rem)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isVideo ? (
          <Film size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
        ) : (
          <Sparkles size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
        )}
        <span
          style={{
            flex: 1,
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          {reveal.name}
        </span>
      </div>

      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
        {animNames}
      </div>

      {reveal.prize_name && (
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          Prize: {reveal.prize_name}
        </div>
      )}

      {reveal.prize_mode !== 'fixed' && reveal.prize_pool && (
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          {reveal.prize_pool.length} prizes ({reveal.prize_mode})
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button
          type="button"
          onClick={onEdit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          type="button"
          onClick={() =>
            deleteReveal.mutate({ id: reveal.id, familyId: reveal.family_id })
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  )
}

// ── Create/Edit modal ──

function RevealEditorModal({
  familyId,
  memberId,
  existing,
  onClose,
}: {
  familyId: string
  memberId: string
  existing?: RewardReveal
  onClose: () => void
}) {
  const createMutation = useCreateRewardReveal()
  const updateMutation = useUpdateRewardReveal()

  const [name, setName] = useState(existing?.name ?? '')
  const [animationIds, setAnimationIds] = useState<string[]>(existing?.animation_ids ?? [])
  const [animationRotation, setAnimationRotation] = useState<AnimationRotation>(
    existing?.animation_rotation ?? 'sequential',
  )
  const [prizeMode, setPrizeMode] = useState<PrizeMode>(existing?.prize_mode ?? 'fixed')
  const [prizeType, setPrizeType] = useState<PrizeType>(existing?.prize_type ?? 'text')
  const [prizeText, setPrizeText] = useState(existing?.prize_text ?? '')
  const [prizeName, setPrizeName] = useState(existing?.prize_name ?? '')
  const [prizeImageUrl, setPrizeImageUrl] = useState(existing?.prize_image_url ?? '')
  const [prizeAssetKey, setPrizeAssetKey] = useState(existing?.prize_asset_key ?? '')
  const [prizePool, setPrizePool] = useState<PrizePoolEntry[]>(
    (existing?.prize_pool as PrizePoolEntry[]) ?? [],
  )

  const isValid = name.trim() && animationIds.length > 0

  const handleSave = async () => {
    const payload: RewardRevealInput = {
      family_id: familyId,
      created_by: memberId,
      name: name.trim(),
      animation_ids: animationIds,
      animation_rotation: animationIds.length > 1 ? animationRotation : 'sequential',
      prize_mode: prizeMode,
      prize_type: prizeType,
      prize_text: prizeText || null,
      prize_name: prizeName || null,
      prize_image_url: prizeImageUrl || null,
      prize_asset_key: prizeAssetKey || null,
      prize_pool: prizeMode !== 'fixed' ? prizePool : null,
    }

    if (existing) {
      await updateMutation.mutateAsync({ id: existing.id, ...payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    onClose()
  }

  return (
    <ModalV2
      id="reveal-editor"
      isOpen={true}
      onClose={onClose}
      type="transient"
      size="lg"
      title={existing ? 'Edit Reward Reveal' : 'New Reward Reveal'}
      icon={Gift}
    >
      <div
        className="density-comfortable"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        {/* Name */}
        <div>
          <label
            htmlFor="reveal-name"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.25rem',
            }}
          >
            Name
          </label>
          <input
            id="reveal-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. "Potty Chart Ice Cream", "Piano Mastery Gift"'
            autoFocus
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
            }}
          />
        </div>

        {/* Animation picker */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Reveal animation{animationIds.length > 1 ? 's' : ''}
          </label>
          <RevealAnimationPicker
            selectedIds={animationIds}
            onSelect={setAnimationIds}
            multiSelect
          />
          {animationIds.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '0.5rem',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Rotation:
              </span>
              {(['sequential', 'random'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAnimationRotation(r)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: 'var(--font-size-xs)',
                    border:
                      animationRotation === r
                        ? '1px solid var(--color-btn-primary-bg)'
                        : '1px solid var(--color-border)',
                    backgroundColor:
                      animationRotation === r
                        ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)'
                        : 'transparent',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  {r === 'sequential' ? 'In order' : 'Random'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Prize content */}
        <PrizeContentEditor
          prizeMode={prizeMode}
          onPrizeModeChange={setPrizeMode}
          prizeType={prizeType}
          onPrizeTypeChange={setPrizeType}
          prizeText={prizeText}
          onPrizeTextChange={setPrizeText}
          prizeName={prizeName}
          onPrizeNameChange={setPrizeName}
          prizeImageUrl={prizeImageUrl}
          onPrizeImageUrlChange={setPrizeImageUrl}
          prizeAssetKey={prizeAssetKey}
          onPrizeAssetKeyChange={setPrizeAssetKey}
          prizePool={prizePool}
          onPrizePoolChange={setPrizePool}
          familyId={familyId}
        />

        {/* Message picker */}
        <CongratulationsMessagePicker
          value={prizeText}
          onChange={setPrizeText}
          familyId={familyId}
          prizeName={prizeName}
        />

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid || createMutation.isPending || updateMutation.isPending}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-text-on-primary, #fff)',
              border: 'none',
              cursor: isValid ? 'pointer' : 'not-allowed',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              opacity: isValid ? 1 : 0.5,
            }}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : existing
                ? 'Save Changes'
                : 'Create Reveal'}
          </button>
        </div>
      </div>
    </ModalV2>
  )
}
