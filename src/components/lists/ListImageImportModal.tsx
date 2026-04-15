/**
 * ListImageImportModal — OCR image import for lists (Sessions 5 + 6).
 *
 * Two modes:
 * 1. Single-list: photo → OCR → items added to THIS list
 * 2. Multi-list: photo → OCR → AI sorts items across existing lists (via SmartImportModal)
 *
 * Uses mindsweep-scan Edge Function for OCR (Claude Sonnet vision).
 * Reuses the resizeImageForOCR pattern from MindSweepCapture.
 */

import { useState, useRef } from 'react'
import { Camera, Loader2, Check, FileText } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Button } from '@/components/shared/Button'
import { supabase } from '@/lib/supabase/client'

interface ListImageImportModalProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  /** When set, extracted items go directly into this list (single-list mode) */
  targetListId?: string
  /** Callback when items are ready for review (single-list mode) */
  onItemsExtracted?: (items: string[]) => void
  /** Callback with raw text for multi-list Smart Import */
  onTextExtracted?: (text: string, sourceContext: string) => void
}

// ── Image resize utility (from MindSweepCapture) ──────────

function resizeImageForOCR(file: File, maxDim: number): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img

      if (width <= maxDim && height <= maxDim && file.size <= 3 * 1024 * 1024) {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const commaIdx = dataUrl.indexOf(',')
          resolve({ base64: dataUrl.slice(commaIdx + 1), mimeType: file.type || 'image/jpeg' })
        }
        reader.onerror = () => reject(new Error('Failed to read image'))
        reader.readAsDataURL(file)
        return
      }

      const scale = Math.min(maxDim / width, maxDim / height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      const commaIdx = dataUrl.indexOf(',')
      resolve({ base64: dataUrl.slice(commaIdx + 1), mimeType: 'image/jpeg' })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }
    img.src = url
  })
}

// ── Component ────────────────────────────────────────────

export function ListImageImportModal({
  isOpen,
  onClose,
  familyId,
  memberId,
  targetListId,
  onItemsExtracted,
  onTextExtracted,
}: ListImageImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<'capture' | 'scanning' | 'review' | 'adding'>('capture')
  const [_extractedText, setExtractedText] = useState('')
  const [extractedItems, setExtractedItems] = useState<{ text: string; selected: boolean }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sourceLabel, setSourceLabel] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  function handleFileClick() {
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
    setPhase('scanning')
    setError(null)

    try {
      const { base64, mimeType } = await resizeImageForOCR(file, 1600)

      const { data, error: fnError } = await supabase.functions.invoke('mindsweep-scan', {
        body: {
          mode: 'scan',
          image_base64: base64,
          mime_type: mimeType,
          family_id: familyId,
          member_id: memberId,
        },
      })

      if (fnError) throw fnError

      const text = (data as { text: string }).text
      if (!text || text.trim().length === 0) {
        setError('No text found in the image. Try a clearer photo.')
        setPhase('capture')
        return
      }

      setExtractedText(text)

      // Parse into individual items (split by newlines, bullets, numbers)
      const lines = text
        .split(/\n/)
        .map(line => line.replace(/^[\s\-\*\d.)\]]+/, '').trim())
        .filter(line => line.length > 2)

      setExtractedItems(lines.map(text => ({ text, selected: true })))
      setPhase('review')
    } catch (err) {
      console.error('OCR failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to read the image')
      setPhase('capture')
    }

    // Reset file input so same file can be re-selected
    e.target.value = ''
  }

  function toggleItem(idx: number) {
    setExtractedItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, selected: !item.selected } : item
    ))
  }

  function handleAddToThisList() {
    const selected = extractedItems.filter(i => i.selected).map(i => i.text)
    if (onItemsExtracted) {
      onItemsExtracted(selected)
    }
    onClose()
  }

  function handleSortAcrossLists() {
    const selected = extractedItems.filter(i => i.selected).map(i => i.text)
    if (onTextExtracted) {
      onTextExtracted(selected.join('\n'), sourceLabel || 'Image import')
    }
    onClose()
  }

  const selectedCount = extractedItems.filter(i => i.selected).length

  return (
    <ModalV2
      id="list-image-import"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title="Import from Image"
      footer={phase === 'review' ? (
        <div className="flex items-center justify-between w-full gap-2">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {selectedCount} of {extractedItems.length} items selected
          </span>
          <div className="flex gap-2">
            {targetListId && onItemsExtracted && (
              <Button variant="primary" size="sm" onClick={handleAddToThisList} disabled={selectedCount === 0}>
                <Check size={14} />
                Add to this list
              </Button>
            )}
            {onTextExtracted && (
              <Button
                variant={targetListId ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleSortAcrossLists}
                disabled={selectedCount === 0}
              >
                <FileText size={14} />
                Sort across lists
              </Button>
            )}
          </div>
        </div>
      ) : undefined}
    >
      {/* Hidden file input */}
      {/* No capture attribute — lets user pick from camera roll, screenshots, files, OR take a new photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {error && (
        <div
          className="px-3 py-2 rounded-lg text-xs mb-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-danger, #ef4444) 10%, var(--color-bg-card))',
            color: 'var(--color-danger, #ef4444)',
          }}
        >
          {error}
        </div>
      )}

      {/* Phase: Capture */}
      {phase === 'capture' && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Choose a screenshot, photo, or any image with text. AI will read it and extract the items.
          </p>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-heading)' }}>
              Source (optional)
            </label>
            <input
              type="text"
              value={sourceLabel}
              onChange={e => setSourceLabel(e.target.value)}
              placeholder='e.g. "Nature Activities book, page 42"'
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <button
            onClick={handleFileClick}
            className="w-full flex flex-col items-center gap-3 py-8 rounded-xl transition-all hover:scale-[1.01]"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '2px dashed var(--color-border)',
            }}
          >
            <Camera size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
              Choose an image or take a photo
            </span>
            <span className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
              A book page, a printed list, a screenshot, a whiteboard — anything with text on it
            </span>
          </button>
        </div>
      )}

      {/* Phase: Scanning */}
      {phase === 'scanning' && (
        <div className="flex flex-col items-center gap-4 py-8">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Captured"
              className="max-h-40 rounded-lg object-contain"
              style={{ border: '1px solid var(--color-border)' }}
            />
          )}
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            Reading the image...
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            AI is extracting all readable text
          </p>
        </div>
      )}

      {/* Phase: Review */}
      {phase === 'review' && (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {previewUrl && (
            <div className="flex items-center gap-2 mb-2">
              <img
                src={previewUrl}
                alt="Source"
                className="h-12 w-12 rounded object-cover"
                style={{ border: '1px solid var(--color-border)' }}
              />
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
                  {extractedItems.length} items found
                </p>
                {sourceLabel && (
                  <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                    From: {sourceLabel}
                  </p>
                )}
              </div>
              <button
                onClick={() => { setPhase('capture'); setPreviewUrl(null); setExtractedItems([]) }}
                className="ml-auto text-xs px-2 py-1 rounded"
                style={{ color: 'var(--color-btn-primary-bg)' }}
              >
                Retake
              </button>
            </div>
          )}

          {extractedItems.map((item, idx) => (
            <label
              key={idx}
              className="flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: item.selected ? 'var(--color-bg-secondary)' : 'transparent',
                opacity: item.selected ? 1 : 0.5,
              }}
            >
              <input
                type="checkbox"
                checked={item.selected}
                onChange={() => toggleItem(idx)}
                className="mt-0.5"
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {item.text}
              </span>
            </label>
          ))}
        </div>
      )}
    </ModalV2>
  )
}
