/**
 * ContextLearningSaveDialog — PRD-13
 * Screen 7: Inline dialog rendered within LiLa conversations.
 * When LiLa detects a new fact about a family member, this compact
 * card offers to save it to the Archive. Supports Save, Edit Before
 * Saving, and Skip (with dismissal hash to prevent re-prompting).
 */

import { useState } from 'react'
import {
  FileText,
  Check,
  Pencil,
  X,
} from 'lucide-react'
import { Select } from '@/components/shared'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import {
  useCreateArchiveContextItem,
  useArchiveFolders,
} from '@/hooks/useArchives'
import { supabase } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Simple string hash for dedup (NOT cryptographic)
// ---------------------------------------------------------------------------

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return hash.toString(36)
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ContextLearningSaveDialogProps {
  detectedFact: string
  suggestedMember: { id: string; display_name: string } | null
  suggestedFolder: string
  conversationId: string
  familyId: string
  onSave: () => void
  onDismiss: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContextLearningSaveDialog({
  detectedFact,
  suggestedMember,
  suggestedFolder,
  conversationId,
  familyId,
  onSave,
  onDismiss,
}: ContextLearningSaveDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editMemberId, setEditMemberId] = useState(suggestedMember?.id ?? '')
  const [editFolder, setEditFolder] = useState(suggestedFolder)
  const [editContent, setEditContent] = useState(detectedFact)
  const [isSaving, setIsSaving] = useState(false)

  const { data: allMembers = [] } = useFamilyMembers(familyId)
  const { data: folderData } = useArchiveFolders(familyId, editMemberId || undefined)
  const createItem = useCreateArchiveContextItem()

  const memberOptions = allMembers
    .filter((m) => m.is_active)
    .map((m) => ({ value: m.id, label: m.display_name }))

  const folderOptions = (folderData?.folders ?? []).map((f) => ({
    value: f.id,
    label: f.folder_name,
  }))

  // Find or create a folder by name for saving
  async function resolveFolder(memberId: string, folderName: string): Promise<string | null> {
    // Check existing folders
    const { data: folders } = await supabase
      .from('archive_folders')
      .select('id')
      .eq('family_id', familyId)
      .eq('member_id', memberId)
      .eq('folder_name', folderName)
      .limit(1)

    if (folders?.[0]?.id) return folders[0].id

    // Try General as fallback
    const { data: generalFolders } = await supabase
      .from('archive_folders')
      .select('id')
      .eq('family_id', familyId)
      .eq('member_id', memberId)
      .eq('folder_name', 'General')
      .limit(1)

    if (generalFolders?.[0]?.id) return generalFolders[0].id

    // Create the folder
    const { data: newFolder } = await supabase
      .from('archive_folders')
      .insert({
        family_id: familyId,
        member_id: memberId,
        folder_name: folderName,
        folder_type: 'system_category',
      })
      .select('id')
      .single()

    return newFolder?.id ?? null
  }

  async function handleSave() {
    const memberId = isEditing ? editMemberId : suggestedMember?.id
    if (!memberId) return

    setIsSaving(true)
    try {
      const folderName = isEditing ? editFolder : suggestedFolder
      const content = isEditing ? editContent.trim() : detectedFact

      const folderId = await resolveFolder(memberId, folderName)
      if (!folderId) return

      await createItem.mutateAsync({
        family_id: familyId,
        folder_id: folderId,
        member_id: memberId,
        context_value: content,
        source: 'lila_detected',
        source_conversation_id: conversationId,
      })

      onSave()
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSkip() {
    // Save dismissal hash to prevent re-prompting
    const hash = simpleHash(detectedFact.toLowerCase().trim())

    try {
      await supabase.from('context_learning_dismissals').insert({
        family_id: familyId,
        content_hash: hash,
        conversation_id: conversationId,
      })
    } catch {
      // Non-critical — proceed even if dismissal record fails
    }

    onDismiss()
  }

  return (
    <div
      className="rounded-xl p-4 my-3"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-primary))',
        border: '1.5px solid color-mix(in srgb, var(--color-btn-primary-bg) 25%, transparent)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <FileText size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <span
          className="text-xs font-semibold"
          style={{ color: 'var(--color-btn-primary-bg)' }}
        >
          I noticed something new:
        </span>
      </div>

      {/* Detected fact */}
      {!isEditing && (
        <p
          className="text-sm font-medium leading-relaxed mb-3"
          style={{ color: 'var(--color-text-primary)' }}
        >
          "{detectedFact}"
        </p>
      )}

      {/* Suggestion line */}
      {!isEditing && suggestedMember && (
        <p
          className="text-xs mb-3"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Save to {suggestedMember.display_name}'s Archive?
          {suggestedFolder && (
            <span> (Folder: {suggestedFolder})</span>
          )}
        </p>
      )}

      {/* Edit mode */}
      {isEditing && (
        <div className="space-y-3 mb-3">
          <Select
            label="Family Member"
            value={editMemberId}
            onChange={setEditMemberId}
            options={memberOptions}
            placeholder="Select a member..."
          />

          {editMemberId && folderOptions.length > 0 && (
            <Select
              label="Folder"
              value={
                folderOptions.find((f) => f.label === editFolder)?.value ?? ''
              }
              onChange={(val) => {
                const folder = folderOptions.find((f) => f.value === val)
                if (folder) setEditFolder(folder.label)
              }}
              options={folderOptions}
              placeholder="Select a folder..."
            />
          )}

          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Content
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving || (isEditing && (!editMemberId || !editContent.trim()))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          <Check size={12} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Pencil size={12} />
            Edit Before Saving
          </button>
        )}

        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ml-auto"
          style={{
            color: 'var(--color-text-secondary)',
          }}
        >
          <X size={12} />
          Skip
        </button>
      </div>
    </div>
  )
}
