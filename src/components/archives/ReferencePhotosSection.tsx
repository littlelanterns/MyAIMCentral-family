/**
 * ReferencePhotosSection — PRD-13B
 * Displays and manages up to 7 reference photos per family member.
 * Shows a horizontal strip of photo thumbnails with add/delete controls.
 * Click any photo to see actions: "Set as Profile" and "Delete".
 * The profile photo (index 0) is used as the member's avatar platform-wide.
 * Used on MemberArchiveDetail page.
 */

import { useRef, useState, useCallback } from 'react'
import { Camera, X, ImagePlus, Star, Trash2, UserCircle } from 'lucide-react'
import { Card, LoadingSpinner } from '@/components/shared'
import { CropPreviewModal } from './CropPreviewModal'
import { useAvatarUpload, MAX_REFERENCE_PHOTOS } from '@/hooks/useAvatarUpload'
import { useArchiveMemberSettings } from '@/hooks/useArchives'

interface ReferencePhotosSectionProps {
  familyId: string
  memberId: string
  memberName: string
}

export function ReferencePhotosSection({
  familyId,
  memberId,
  memberName,
}: ReferencePhotosSectionProps) {
  const { data: settings } = useArchiveMemberSettings(familyId, memberId)
  const { uploadReferencePhoto, deleteReferencePhoto, setProfilePhoto, uploading, error } =
    useAvatarUpload(familyId)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  // Which photo URL is showing its action menu (click to open, click elsewhere to close)
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null)

  const photos = settings?.reference_photos ?? []
  const canAddMore = photos.length < MAX_REFERENCE_PHOTOS

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCropFile(file)
      setCropModalOpen(true)
    }
    e.target.value = ''
  }, [])

  const handleCropConfirm = useCallback(
    async (croppedBlob: Blob) => {
      const file = new File([croppedBlob], 'reference.jpg', { type: 'image/jpeg' })
      await uploadReferencePhoto(memberId, file, photos)
      setCropModalOpen(false)
      setCropFile(null)
    },
    [memberId, photos, uploadReferencePhoto],
  )

  const handleDelete = useCallback(
    async (photoUrl: string) => {
      await deleteReferencePhoto(memberId, photoUrl, photos)
      setActivePhotoUrl(null)
    },
    [memberId, photos, deleteReferencePhoto],
  )

  const handleSetProfile = useCallback(
    async (photoUrl: string) => {
      await setProfilePhoto(memberId, photoUrl, photos)
      setActivePhotoUrl(null)
    },
    [memberId, photos, setProfilePhoto],
  )

  const handlePhotoClick = useCallback(
    (url: string) => {
      setActivePhotoUrl((prev) => (prev === url ? null : url))
    },
    [],
  )

  return (
    <>
      <Card variant="flat" padding="md">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Reference Photos
              </p>
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {photos.length}/{MAX_REFERENCE_PHOTOS}
              </span>
            </div>
          </div>

          <p
            className="text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Photos used to describe {memberName} for AI image generation. Tap any photo for options.
          </p>

          {/* Photo strip */}
          <div className="flex gap-2 flex-wrap">
            {photos.map((url, index) => {
              const isProfile = index === 0
              const isActive = activePhotoUrl === url

              return (
                <div
                  key={url}
                  className="relative group rounded-lg overflow-hidden shrink-0 cursor-pointer"
                  style={{
                    width: '72px',
                    height: '72px',
                    border: isProfile
                      ? '2px solid var(--color-btn-primary-bg)'
                      : '1px solid var(--color-border)',
                  }}
                  onClick={() => handlePhotoClick(url)}
                >
                  <img
                    src={url}
                    alt={`${memberName} reference ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />

                  {/* Profile badge on first photo */}
                  {isProfile && !isActive && (
                    <div
                      className="absolute top-0.5 left-0.5 p-0.5 rounded"
                      style={{ backgroundColor: 'var(--color-btn-primary-bg)' }}
                      title="Profile photo"
                    >
                      <Star size={10} fill="white" color="white" />
                    </div>
                  )}

                  {/* Action overlay — shown when photo is tapped/clicked */}
                  {isActive && (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
                    >
                      {/* Set as Profile — only on non-profile photos */}
                      {!isProfile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetProfile(url)
                          }}
                          disabled={uploading}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: 'var(--color-btn-primary-bg)',
                            color: 'var(--color-btn-primary-text, #fff)',
                          }}
                        >
                          <UserCircle size={12} />
                          Profile
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(url)
                        }}
                        disabled={uploading}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--color-danger, #ef4444)',
                          color: '#fff',
                        }}
                      >
                        {uploading ? (
                          '...'
                        ) : (
                          <>
                            <Trash2 size={12} />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Add button */}
            {canAddMore && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center justify-center rounded-lg transition-colors"
                style={{
                  width: '72px',
                  height: '72px',
                  border: '2px dashed var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
                title="Add reference photo"
              >
                {uploading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <ImagePlus size={20} />
                )}
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--color-danger, #ef4444)' }}>
              {error}
            </p>
          )}
        </div>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Crop modal */}
      <CropPreviewModal
        open={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false)
          setCropFile(null)
        }}
        imageFile={cropFile}
        onCropConfirm={handleCropConfirm}
        memberName={memberName}
        uploading={uploading}
      />
    </>
  )
}
