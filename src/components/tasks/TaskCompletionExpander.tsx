/**
 * TaskCompletionExpander — PRD-09A completion evidence
 *
 * Inline expansion below a task card when the user taps complete.
 * Shows optional note textarea + optional photo capture + Confirm button.
 *
 * For tasks with require_approval=true: always shows the expander.
 * For normal tasks: shows a brief "Add details?" prompt that can be skipped.
 *
 * The photo is always optional. One tap to skip.
 */

import { useState, useRef } from 'react'
import { Camera, X, Loader2, Send } from 'lucide-react'
import { uploadCompletionPhoto } from './useTaskCompletion'

interface TaskCompletionExpanderProps {
  taskId: string
  requireApproval: boolean
  onConfirm: (extras: { completionNote?: string | null; photoUrl?: string | null }) => void
  onCancel: () => void
}

export function TaskCompletionExpander({
  taskId,
  requireApproval,
  onConfirm,
  onCancel,
}: TaskCompletionExpanderProps) {
  const [note, setNote] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Photo must be under 10MB')
      return
    }

    setPhotoFile(file)
    setUploadError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleConfirm = async () => {
    setUploading(true)
    setUploadError(null)

    try {
      let photoUrl: string | null = null

      if (photoFile) {
        try {
          photoUrl = await uploadCompletionPhoto(photoFile, taskId)
        } catch (err) {
          // Photo upload failure is non-blocking — complete without photo
          console.warn('Photo upload failed:', err)
          setUploadError('Photo upload failed, completing without photo')
        }
      }

      onConfirm({
        completionNote: note.trim() || null,
        photoUrl,
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSkip = () => {
    onConfirm({ completionNote: null, photoUrl: null })
  }

  return (
    <div
      className="mt-2 rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--vibe-radius-card, 0.5rem)',
        padding: '0.75rem',
      }}
    >
      {/* Note textarea */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={requireApproval ? 'Add a note for review...' : 'Add a note (optional)...'}
        rows={2}
        className="w-full text-sm resize-none"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--vibe-radius-input, 0.375rem)',
          padding: '0.5rem',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-btn-primary-bg)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
        }}
      />

      {/* Photo section */}
      <div className="flex items-center gap-2 mt-2">
        {/* Photo preview thumbnail */}
        {photoPreview && (
          <div className="relative">
            <img
              src={photoPreview}
              alt="Completion evidence"
              className="rounded"
              style={{
                width: 48,
                height: 48,
                objectFit: 'cover',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--vibe-radius-sm, 4px)',
              }}
            />
            <button
              onClick={handleRemovePhoto}
              className="absolute -top-1.5 -right-1.5 rounded-full flex items-center justify-center"
              style={{
                width: 18,
                height: 18,
                backgroundColor: 'var(--color-error, #ef4444)',
                color: 'var(--color-btn-primary-text, #fff)',
              }}
              aria-label="Remove photo"
            >
              <X size={10} />
            </button>
          </div>
        )}

        {/* Add photo button */}
        {!photoPreview && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{
              color: 'var(--color-text-secondary)',
              padding: '0.375rem 0.5rem',
              borderRadius: 'var(--vibe-radius-sm, 4px)',
              border: '1px dashed var(--color-border)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            <Camera size={14} />
            Add photo
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Skip button (for non-approval tasks) */}
        {!requireApproval && (
          <button
            onClick={handleSkip}
            disabled={uploading}
            className="text-xs font-medium"
            style={{
              color: 'var(--color-text-secondary)',
              padding: '0.375rem 0.625rem',
              borderRadius: 'var(--vibe-radius-sm, 4px)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Skip
          </button>
        )}

        {/* Cancel button (for approval tasks) */}
        {requireApproval && (
          <button
            onClick={onCancel}
            disabled={uploading}
            className="text-xs font-medium"
            style={{
              color: 'var(--color-text-secondary)',
              padding: '0.375rem 0.625rem',
              borderRadius: 'var(--vibe-radius-sm, 4px)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Cancel
          </button>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{
            color: 'var(--color-text-on-primary, #fff)',
            padding: '0.375rem 0.75rem',
            borderRadius: 'var(--vibe-radius-sm, 4px)',
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            cursor: uploading ? 'wait' : 'pointer',
            border: 'none',
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Send size={12} />
          )}
          {requireApproval ? 'Submit for Approval' : 'Done'}
        </button>
      </div>

      {/* Upload error */}
      {uploadError && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--color-error, #ef4444)' }}>
          {uploadError}
        </p>
      )}
    </div>
  )
}
