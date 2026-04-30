// PRD-11: Victory Detail modal — edit, GS/BI connections, Mom's Picks, archive, delete
import { useState } from 'react'
import { Trophy, Star, Archive, ArchiveRestore, Trash2, Copy, LinkIcon } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useUpdateVictory, useArchiveVictory, useUnarchiveVictory, useDeleteVictory, useToggleMomsPick } from '@/hooks/useVictories'
import { SOURCE_LABELS, IMPORTANCE_OPTIONS } from '@/types/victories'
import type { Victory, VictoryImportance } from '@/types/victories'

interface VictoryDetailProps {
  victory: Victory
  onClose: () => void
  isMom: boolean
  currentMemberId: string
}

export function VictoryDetail({ victory, onClose, isMom, currentMemberId }: VictoryDetailProps) {
  const [description, setDescription] = useState(victory.description)
  const [celebrationText, setCelebrationText] = useState(victory.celebration_text || '')
  const [lifeAreaTag, setLifeAreaTag] = useState(victory.life_area_tags?.[0] ?? victory.life_area_tag ?? '')
  const [importance, setImportance] = useState<VictoryImportance>(victory.importance)
  const [momsPickNote, setMomsPickNote] = useState(victory.moms_pick_note || '')
  const [editing, setEditing] = useState(false)

  const updateVictory = useUpdateVictory()
  const archiveVictory = useArchiveVictory()
  const unarchiveVictory = useUnarchiveVictory()
  const deleteVictory = useDeleteVictory()
  const toggleMomsPick = useToggleMomsPick()
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null)

  const isOwnVictory = victory.family_member_id === currentMemberId
  const canEdit = isOwnVictory || isMom
  const canMomsPick = isMom || isOwnVictory
  const isArchived = !!victory.archived_at

  async function handleSave() {
    await updateVictory.mutateAsync({
      id: victory.id,
      memberId: victory.family_member_id,
      updates: {
        description,
        celebration_text: celebrationText || null,
        life_area_tag: lifeAreaTag || null,
        life_area_tags: lifeAreaTag ? [lifeAreaTag] : [],
        importance,
      },
    })
    setEditing(false)
  }

  async function handleArchive() {
    await archiveVictory.mutateAsync({ id: victory.id, memberId: victory.family_member_id })
    onClose()
  }

  async function handleUnarchive() {
    await unarchiveVictory.mutateAsync({ id: victory.id, memberId: victory.family_member_id })
    onClose()
  }

  async function handleDelete() {
    await deleteVictory.mutateAsync({ id: victory.id, memberId: victory.family_member_id })
    onClose()
  }

  async function handleTogglePick() {
    const newState = !victory.is_moms_pick
    await toggleMomsPick.mutateAsync({
      id: victory.id,
      memberId: victory.family_member_id,
      isMomsPick: newState,
      note: newState ? momsPickNote || null : null,
      pickedBy: newState ? currentMemberId : null,
    })
  }

  function handleCopy() {
    const text = [victory.description, victory.celebration_text].filter(Boolean).join('\n\n')
    navigator.clipboard.writeText(text)
  }

  const dateStr = new Date(victory.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <ModalV2
      id="victory-detail"
      isOpen
      onClose={onClose}
      type="transient"
      size="md"
      title="Victory"
      icon={Trophy}
      footer={
        <div className="w-full">
          {/* Confirmation dialog */}
          {confirmAction && (
            <div className="flex items-center justify-between mb-3 p-2.5 rounded-lg"
              style={{
                background: confirmAction === 'delete'
                  ? 'color-mix(in srgb, var(--color-error, #ef4444) 10%, var(--color-bg-card))'
                  : 'var(--color-bg-secondary)',
                border: `1px solid ${confirmAction === 'delete' ? 'var(--color-error, #ef4444)' : 'var(--color-border-default)'}`,
              }}
            >
              <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                {confirmAction === 'delete'
                  ? 'Permanently delete this victory?'
                  : 'Move this victory to the archive?'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="text-xs px-2.5 py-1 rounded"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmAction === 'delete') handleDelete()
                    else handleArchive()
                    setConfirmAction(null)
                  }}
                  className="text-xs px-2.5 py-1 rounded font-medium"
                  style={{
                    background: confirmAction === 'delete' ? 'var(--color-error, #ef4444)' : 'var(--surface-primary)',
                    color: '#fff',
                  }}
                >
                  {confirmAction === 'delete' ? 'Delete' : 'Archive'}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {isArchived ? (
                <>
                  <button
                    onClick={handleUnarchive}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <ArchiveRestore size={13} />
                    Restore
                  </button>
                  <button
                    onClick={() => setConfirmAction('delete')}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors"
                    style={{ color: 'var(--color-error, #ef4444)' }}
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmAction('archive')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <Archive size={13} />
                  Archive
                </button>
              )}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <Copy size={13} />
                Copy
              </button>
            </div>
            {editing && (
              <button
                onClick={handleSave}
                disabled={updateVictory.isPending}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary, #fff)' }}
              >
                {updateVictory.isPending ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Description */}
        <div>
          {editing && canEdit ? (
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none"
              style={{
                background: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-default)',
              }}
            />
          ) : (
            <p
              className="text-sm cursor-pointer"
              style={{ color: 'var(--color-text-primary)' }}
              onClick={() => canEdit && setEditing(true)}
            >
              {victory.description}
            </p>
          )}
        </div>

        {/* Celebration Text */}
        {(victory.celebration_text || editing) && (
          <div className="rounded-lg p-3" style={{ background: 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 8%, transparent)' }}>
            {editing ? (
              <textarea
                value={celebrationText}
                onChange={e => setCelebrationText(e.target.value)}
                rows={3}
                placeholder="Celebration text..."
                className="w-full rounded px-2 py-1.5 text-sm italic resize-none"
                style={{
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-default)',
                }}
              />
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
                {victory.celebration_text}
              </p>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2">
          {/* Date */}
          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {dateStr}
          </div>

          {/* Life Area Tag */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Area:</span>
            {editing ? (
              <input
                value={lifeAreaTag}
                onChange={e => setLifeAreaTag(e.target.value)}
                placeholder="e.g. health, education..."
                className="text-xs px-2 py-1 rounded border"
                style={{
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  borderColor: 'var(--color-border-default)',
                }}
              />
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                  color: 'var(--color-accent)',
                }}>
                {victory.life_area_tags?.[0] ?? victory.life_area_tag ?? 'None'}
              </span>
            )}
          </div>

          {/* Importance */}
          {editing && (
            <div>
              <span className="text-xs mr-2" style={{ color: 'var(--color-text-secondary)' }}>Size:</span>
              <div className="inline-flex gap-1.5 mt-1">
                {IMPORTANCE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setImportance(opt.value)}
                    className="px-2 py-0.5 rounded text-xs transition-colors border"
                    style={{
                      background: importance === opt.value ? 'var(--surface-primary)' : 'transparent',
                      color: importance === opt.value ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-tertiary)',
                      borderColor: 'var(--color-border-default)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Source */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <LinkIcon size={11} />
            {SOURCE_LABELS[victory.source] || victory.source}
            {victory.source_reference_id && (
              <span className="text-xs italic">(linked)</span>
            )}
          </div>

          {/* Custom Tags */}
          {victory.custom_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {victory.custom_tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full border"
                  style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border-default)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Mom's Pick */}
        {canMomsPick && (
          <div
            className="rounded-lg p-3 border transition-colors"
            style={{
              borderColor: victory.is_moms_pick
                ? 'var(--color-sparkle-gold, #D4AF37)'
                : 'var(--color-border-default)',
              background: victory.is_moms_pick
                ? 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 8%, transparent)'
                : 'transparent',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star
                  size={16}
                  fill={victory.is_moms_pick ? 'var(--color-sparkle-gold, #D4AF37)' : 'none'}
                  style={{ color: 'var(--color-sparkle-gold, #D4AF37)' }}
                />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Mom's Pick
                </span>
              </div>
              <button
                onClick={handleTogglePick}
                disabled={toggleMomsPick.isPending}
                className="text-xs px-2.5 py-1 rounded transition-colors"
                style={{
                  background: victory.is_moms_pick ? 'transparent' : 'var(--color-sparkle-gold, #D4AF37)',
                  color: victory.is_moms_pick ? 'var(--color-text-secondary)' : '#fff',
                  border: victory.is_moms_pick ? '1px solid var(--color-border-default)' : 'none',
                }}
              >
                {victory.is_moms_pick ? 'Remove' : 'Mark as Pick'}
              </button>
            </div>
            {victory.is_moms_pick && (
              <input
                value={momsPickNote}
                onChange={e => setMomsPickNote(e.target.value)}
                onBlur={() => {
                  if (momsPickNote !== (victory.moms_pick_note || '')) {
                    updateVictory.mutate({
                      id: victory.id,
                      memberId: victory.family_member_id,
                      updates: { moms_pick_note: momsPickNote || null },
                    })
                  }
                }}
                placeholder="Why this matters to me..."
                className="w-full text-xs px-2 py-1.5 rounded mt-1"
                style={{
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-default)',
                }}
              />
            )}
          </div>
        )}

        {/* Edit toggle */}
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs underline"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Edit victory
          </button>
        )}
      </div>
    </ModalV2>
  )
}
