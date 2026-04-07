/**
 * CropPreviewModal — PRD-13B
 * Shows a square crop preview before uploading a photo.
 * Uses react-image-crop for drag-to-reposition.
 * Locked 1:1 aspect ratio.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { ModalV2, LoadingSpinner } from '@/components/shared'
import { getCroppedImage } from '@/lib/utils/cropImage'

interface CropPreviewModalProps {
  open: boolean
  onClose: () => void
  /** The file selected by the user */
  imageFile: File | null
  /** Called with the cropped blob when user confirms */
  onCropConfirm: (croppedBlob: Blob) => void
  /** Label shown below the preview thumbnail */
  memberName: string
  /** Whether upload is in progress */
  uploading?: boolean
}

export function CropPreviewModal({
  open,
  onClose,
  imageFile,
  onCropConfirm,
  memberName,
  uploading = false,
}: CropPreviewModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [processing, setProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load image when file changes
  useEffect(() => {
    if (!imageFile) {
      setImageSrc(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result as string)
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  // Set default crop when image loads — centered, as large as possible
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    const aspect = 1

    const initialCrop = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 90 },
        aspect,
        naturalWidth,
        naturalHeight,
      ),
      naturalWidth,
      naturalHeight,
    )

    setCrop(initialCrop)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !completedCrop) return

    setProcessing(true)
    try {
      // Pass rendered image dimensions so crop coordinates scale correctly
      const renderedWidth = imgRef.current?.width
      const renderedHeight = imgRef.current?.height
      const blob = await getCroppedImage(
        imageSrc,
        {
          x: completedCrop.x,
          y: completedCrop.y,
          width: completedCrop.width,
          height: completedCrop.height,
        },
        renderedWidth,
        renderedHeight,
      )
      onCropConfirm(blob)
    } catch {
      // Fallback: upload original file
      if (imageFile) {
        onCropConfirm(imageFile)
      }
    } finally {
      setProcessing(false)
    }
  }, [imageSrc, completedCrop, onCropConfirm, imageFile])

  const handleChooseDifferent = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleNewFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => setImageSrc(reader.result as string)
      reader.readAsDataURL(file)
      e.target.value = ''
    },
    [],
  )

  const isLoading = uploading || processing

  return (
    <ModalV2
      id="archive-crop-preview"
      isOpen={open}
      onClose={onClose}
      type="transient"
      title="Crop Photo"
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={onClose}
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
            disabled={isLoading}
          >
            Cancel
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleChooseDifferent}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
              disabled={isLoading}
            >
              Choose Different
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !completedCrop}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : null}
              {isLoading ? 'Saving...' : 'Looks Good — Save Photo'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {imageSrc ? (
          <div className="flex flex-col items-center gap-4">
            {/* Crop area */}
            <div className="w-full max-h-100 overflow-hidden rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            >
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop={false}
                keepSelection
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{ maxHeight: '400px', maxWidth: '100%' }}
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>

            {/* Preview thumbnail */}
            {completedCrop && imageSrc && (
              <div className="flex items-end gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-16 h-16 rounded-xl overflow-hidden"
                    style={{
                      border: '2px solid var(--color-border)',
                      backgroundImage: `url(${imageSrc})`,
                      backgroundSize: `${imgRef.current ? (imgRef.current.naturalWidth / completedCrop.width) * 64 : 64}px`,
                      backgroundPosition: `-${(completedCrop.x / (imgRef.current?.naturalWidth ?? 1)) * ((imgRef.current?.naturalWidth ?? 1) / completedCrop.width) * 64}px -${(completedCrop.y / (imgRef.current?.naturalHeight ?? 1)) * ((imgRef.current?.naturalHeight ?? 1) / completedCrop.height) * 64}px`,
                    }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {memberName}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="md" />
          </div>
        )}
      </div>

      {/* Hidden file input for "Choose Different" */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleNewFileSelect}
      />
    </ModalV2>
  )
}
