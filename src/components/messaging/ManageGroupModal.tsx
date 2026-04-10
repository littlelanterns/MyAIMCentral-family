/**
 * ManageGroupModal — PRD-15 Group management
 *
 * Rename group, add/remove members, delete group, leave group.
 *
 * Permission rules (enforced in UI AND by RLS):
 * - Rename: space creator OR primary_parent
 * - Add/remove member: space admin OR primary_parent
 * - Delete group: primary_parent only
 * - Leave group: adults only (mom said kids can't leave groups she put them in)
 *
 * Only shown for space_type === 'group'. Other space types (direct, family,
 * content_corner, out_of_nest) don't expose management.
 */

import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Trash2, UserPlus, LogOut, Loader2, Check } from 'lucide-react'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'
import { useFamily } from '@/hooks/useFamily'
import {
  useUpdateSpaceName,
  useAddSpaceMember,
  useRemoveSpaceMember,
  useLeaveSpace,
  useDeleteSpace,
} from '@/hooks/useConversationSpaces'
import type { ConversationSpaceWithPreview } from '@/types/messaging'

interface ManageGroupModalProps {
  isOpen: boolean
  onClose: () => void
  space: ConversationSpaceWithPreview
}

export function ManageGroupModal({ isOpen, onClose, space }: ManageGroupModalProps) {
  const navigate = useNavigate()
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const { data: allMembers } = useFamilyMembers(currentFamily?.id)

  const updateName = useUpdateSpaceName()
  const addMember = useAddSpaceMember()
  const removeMember = useRemoveSpaceMember()
  const leaveSpace = useLeaveSpace()
  const deleteSpace = useDeleteSpace()

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(space.name ?? '')
  const [showAddPicker, setShowAddPicker] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  // ── Permission checks ─────────────────────────────────────────
  const isMom = currentMember?.role === 'primary_parent'
  const isAdult = currentMember?.role === 'primary_parent' || currentMember?.role === 'additional_adult'
  const isCreator = space.created_by === currentMember?.id
  const currentMembership = space.members?.find(m => m.family_member_id === currentMember?.id)
  const isSpaceAdmin = currentMembership?.role === 'admin'

  const canRename = isMom || isCreator
  const canManageMembers = isMom || isSpaceAdmin
  const canDelete = isMom
  const canLeave = isAdult && !isMom  // Mom shouldn't leave her own groups; kids can't either

  // ── Members to add (not already in the space) ───────────────
  const currentMemberIds = useMemo(() => new Set((space.members ?? []).map(m => m.family_member_id)), [space.members])
  const addableMembers = useMemo(() => {
    if (!allMembers) return []
    return allMembers.filter(
      m => m.is_active && !m.out_of_nest && !currentMemberIds.has(m.id),
    )
  }, [allMembers, currentMemberIds])

  // ── Handlers ─────────────────────────────────────────────────
  const handleSaveName = useCallback(async () => {
    if (!nameDraft.trim() || nameDraft.trim() === space.name) {
      setEditingName(false)
      return
    }
    try {
      await updateName.mutateAsync({ spaceId: space.id, name: nameDraft.trim() })
      setEditingName(false)
    } catch (err) {
      console.error('[ManageGroupModal] rename failed:', err)
    }
  }, [nameDraft, space.id, space.name, updateName])

  const handleAddMember = useCallback(async (memberId: string) => {
    try {
      await addMember.mutateAsync({ spaceId: space.id, memberId })
    } catch (err) {
      console.error('[ManageGroupModal] add member failed:', err)
    }
  }, [addMember, space.id])

  const handleRemoveMember = useCallback(async (memberId: string) => {
    // Prevent removing the last member
    if ((space.members?.length ?? 0) <= 1) return
    try {
      await removeMember.mutateAsync({ spaceId: space.id, memberId })
    } catch (err) {
      console.error('[ManageGroupModal] remove member failed:', err)
    }
  }, [removeMember, space.id, space.members])

  const handleLeave = useCallback(async () => {
    try {
      await leaveSpace.mutateAsync({ spaceId: space.id })
      onClose()
      navigate('/messages')
    } catch (err) {
      console.error('[ManageGroupModal] leave failed:', err)
    }
  }, [leaveSpace, space.id, onClose, navigate])

  const handleDelete = useCallback(async () => {
    try {
      await deleteSpace.mutateAsync({ spaceId: space.id })
      onClose()
      navigate('/messages')
    } catch (err) {
      console.error('[ManageGroupModal] delete failed:', err)
    }
  }, [deleteSpace, space.id, onClose, navigate])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 80%, transparent)',
        paddingTop: '5vh',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '85vh',
          backgroundColor: 'var(--color-bg-primary)',
          borderRadius: 'var(--vibe-radius-card, 12px)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px color-mix(in srgb, var(--color-text-primary) 15%, transparent)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Manage Group
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: '0.25rem' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* ── Group name ─────────────────────────────────────── */}
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Group name
            </p>
            {editingName && canRename ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') { setNameDraft(space.name ?? ''); setEditingName(false) }
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.625rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--vibe-radius-input, 6px)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-primary)',
                    backgroundColor: 'var(--color-bg-secondary)',
                  }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={updateName.isPending}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--vibe-radius-input, 6px)',
                    border: 'none',
                    background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                    color: 'var(--color-text-on-primary, #fff)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {updateName.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {space.name ?? 'Untitled group'}
                </span>
                {canRename && (
                  <button
                    onClick={() => { setNameDraft(space.name ?? ''); setEditingName(true) }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-btn-primary-bg)',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                    }}
                  >
                    Rename
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Members ─────────────────────────────────────────── */}
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Members ({space.members?.length ?? 0})
              </p>
              {canManageMembers && addableMembers.length > 0 && !showAddPicker && (
                <button
                  onClick={() => setShowAddPicker(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-btn-primary-bg)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                  }}
                >
                  <UserPlus size={14} /> Add
                </button>
              )}
            </div>

            {/* Current members list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {(space.members ?? []).map(m => {
                const isCurrentUser = m.family_member_id === currentMember?.id
                const canRemoveThis = canManageMembers && !isCurrentUser && (space.members?.length ?? 0) > 1
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem 0.625rem',
                      borderRadius: 'var(--vibe-radius-input, 6px)',
                      backgroundColor: 'var(--color-bg-secondary)',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: getMemberColor(m),
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {(m.display_name ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                      {m.display_name ?? 'Unknown'}
                      {isCurrentUser && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}> (you)</span>}
                      {m.role === 'admin' && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.6875rem', color: 'var(--color-btn-primary-bg)', fontWeight: 500 }}>
                          admin
                        </span>
                      )}
                    </span>
                    {canRemoveThis && (
                      <button
                        onClick={() => handleRemoveMember(m.family_member_id)}
                        disabled={removeMember.isPending}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex',
                          borderRadius: 4,
                        }}
                        title="Remove from group"
                        aria-label={`Remove ${m.display_name}`}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add member picker */}
            {showAddPicker && (
              <div style={{ marginTop: '0.75rem', padding: '0.625rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--vibe-radius-input, 6px)' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Tap someone to add them:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {addableMembers.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleAddMember(m.id)}
                      disabled={addMember.isPending}
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: 999,
                        border: `1.5px solid ${getMemberColor(m)}`,
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-primary)',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      + {m.display_name}
                    </button>
                  ))}
                  {addableMembers.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Everyone's already in this group.
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowAddPicker(false)}
                  style={{
                    marginTop: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* ── Danger zone ─────────────────────────────────────── */}
          {(canLeave || canDelete) && (
            <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Danger zone
              </p>

              {canLeave && (
                confirmLeave ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0.625rem', backgroundColor: 'color-mix(in srgb, var(--color-warning, #d97706) 10%, transparent)', borderRadius: 'var(--vibe-radius-input, 6px)' }}>
                    <span style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                      Leave this group?
                    </span>
                    <button
                      onClick={() => setConfirmLeave(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.8125rem', cursor: 'pointer', padding: '0.25rem 0.5rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLeave}
                      disabled={leaveSpace.isPending}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: 'none',
                        borderRadius: 'var(--vibe-radius-input, 6px)',
                        background: 'var(--color-warning, #d97706)',
                        color: '#fff',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {leaveSpace.isPending ? 'Leaving...' : 'Leave'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmLeave(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.625rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--vibe-radius-input, 6px)',
                      background: 'transparent',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <LogOut size={14} /> Leave group
                  </button>
                )
              )}

              {canDelete && (
                confirmDelete ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0.625rem', backgroundColor: 'color-mix(in srgb, var(--color-error, #dc2626) 10%, transparent)', borderRadius: 'var(--vibe-radius-input, 6px)' }}>
                    <span style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                      Delete this group and all its messages?
                    </span>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.8125rem', cursor: 'pointer', padding: '0.25rem 0.5rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleteSpace.isPending}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: 'none',
                        borderRadius: 'var(--vibe-radius-input, 6px)',
                        background: 'var(--color-error, #dc2626)',
                        color: '#fff',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {deleteSpace.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.625rem',
                      border: '1px solid color-mix(in srgb, var(--color-error, #dc2626) 30%, transparent)',
                      borderRadius: 'var(--vibe-radius-input, 6px)',
                      background: 'transparent',
                      color: 'var(--color-error, #dc2626)',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} /> Delete group
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
