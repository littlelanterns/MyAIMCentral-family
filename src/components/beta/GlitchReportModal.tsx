/**
 * GlitchReportModal — Bug report form for beta testers
 *
 * Four required text fields, optional image attachment,
 * auto-captured diagnostics, screenshot preview.
 * Submits directly to beta_glitch_reports via Supabase client.
 * Uses theme tokens — no hardcoded colors.
 */

import { useState, useRef } from 'react'
import { X, Camera, CheckCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getRecentErrors, getRecentRoutes, getBrowserInfo } from '@/services/diagnosticCapture'

interface GlitchReportModalProps {
  onClose: () => void
  screenshotDataUrl: string | null
  screenshotFailed: boolean
  userId: string
  familyId: string
  familyMemberId: string
  displayName: string
  shellType: string
}

const MAX_SUBMISSIONS = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

// Track submission timestamps in module scope (survives modal close/reopen)
const submissionTimestamps: number[] = []

export function GlitchReportModal({
  onClose,
  screenshotDataUrl,
  screenshotFailed,
  userId,
  familyId,
  familyMemberId,
  displayName,
  shellType,
}: GlitchReportModalProps) {
  const [whatDoing, setWhatDoing] = useState('')
  const [whatTried, setWhatTried] = useState('')
  const [whatHappened, setWhatHappened] = useState('')
  const [whatExpected, setWhatExpected] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showScreenshot, setShowScreenshot] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // At least one field or a screenshot must be provided
  const hasAnyText = whatDoing.trim() || whatTried.trim() || whatHappened.trim() || whatExpected.trim()
  const isValid = hasAnyText || !!screenshotDataUrl || !!imageFile

  const isRateLimited = (() => {
    const now = Date.now()
    const recent = submissionTimestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS)
    return recent.length >= MAX_SUBMISSIONS
  })()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }
    setImageFile(file)
    setError(null)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!isValid || submitting || isRateLimited) return
    setSubmitting(true)
    setError(null)

    try {
      let userImageUrl: string | null = null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'png'
        const path = `${familyId}/${familyMemberId}/glitch-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('beta-glitch-images')
          .upload(path, imageFile, { upsert: true, contentType: imageFile.type })
        if (uploadError) {
          console.warn('Image upload failed:', uploadError.message)
        } else {
          const { data } = supabase.storage.from('beta-glitch-images').getPublicUrl(path)
          userImageUrl = data.publicUrl
        }
      }

      const diagnostics = {
        console_errors: getRecentErrors(),
        recent_routes: getRecentRoutes(),
        browser_info: getBrowserInfo(),
      }

      const { error: insertError } = await supabase
        .from('beta_glitch_reports')
        .insert({
          user_id: userId,
          family_id: familyId,
          family_member_id: familyMemberId,
          shell_type: shellType,
          display_name: displayName,
          what_doing: whatDoing.trim() || '(not provided)',
          what_tried: whatTried.trim() || '(not provided)',
          what_happened: whatHappened.trim() || '(not provided)',
          what_expected: whatExpected.trim() || '(not provided)',
          user_image_url: userImageUrl,
          screenshot_data_url: screenshotDataUrl,
          current_route: window.location.pathname + window.location.search,
          browser_info: diagnostics.browser_info,
          console_errors: diagnostics.console_errors,
          recent_routes: diagnostics.recent_routes,
        })

      if (insertError) throw insertError

      submissionTimestamps.push(Date.now())
      setSubmitted(true)
      setTimeout(onClose, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success state ──
  if (submitted) {
    return (
      <div className="glitch-reporter-overlay fixed inset-0 z-9998 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="rounded-xl p-8 text-center w-[90%] max-w-[360px]"
          style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--vibe-radius-card)' }}>
          <CheckCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
            Thank you!
          </p>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Your report has been saved.
          </p>
        </div>
      </div>
    )
  }

  // ── Full-size screenshot preview ──
  if (showScreenshot && screenshotDataUrl) {
    return (
      <div className="glitch-reporter-overlay fixed inset-0 z-9999 flex items-center justify-center cursor-pointer"
        style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
        onClick={() => setShowScreenshot(false)}>
        <img src={screenshotDataUrl} alt="Screenshot preview"
          className="max-w-[90vw] max-h-[90vh]"
          style={{ borderRadius: 'var(--vibe-radius-card)' }} />
      </div>
    )
  }

  return (
    <div className="glitch-reporter-overlay fixed inset-0 z-9998 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}>
      <div className="w-[95%] max-w-[520px] max-h-[90vh] overflow-auto"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--vibe-radius-modal)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-4 pb-3"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-lg font-semibold m-0"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
            Report a Glitch
          </h2>
          <button onClick={onClose} className="p-1 cursor-pointer border-none bg-transparent"
            style={{ color: 'var(--color-text-secondary)' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-5">
          {/* Screenshot preview */}
          {screenshotDataUrl && (
            <div onClick={() => setShowScreenshot(true)}
              className="mb-4 cursor-pointer overflow-hidden"
              style={{
                borderRadius: 'var(--vibe-radius-input)',
                border: '1px solid var(--color-border)',
                maxHeight: '120px',
              }}>
              <img src={screenshotDataUrl} alt="Captured screenshot"
                className="w-full block" style={{ height: '120px', objectFit: 'cover' }} />
            </div>
          )}
          {screenshotFailed && !screenshotDataUrl && (
            <div className="flex items-center gap-2 px-3 py-2 mb-4"
              style={{
                borderRadius: 'var(--vibe-radius-input)',
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
              }}>
              <AlertTriangle size={16} />
              Screenshot capture failed — you can still attach an image manually.
            </div>
          )}

          {/* Helper text */}
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
            Fill in whatever is helpful — all fields are optional. A screenshot alone is fine too.
          </p>

          {/* Form fields */}
          <FieldGroup label="What were you doing?" value={whatDoing} onChange={setWhatDoing} />
          <FieldGroup label="What did you try to do?" value={whatTried} onChange={setWhatTried} />
          <FieldGroup label="What happened?" value={whatHappened} onChange={setWhatHappened} />
          <FieldGroup label="What did you expect would happen?" value={whatExpected} onChange={setWhatExpected} />

          {/* Image attachment */}
          <div className="mb-4">
            <label className="block mb-1.5 font-medium"
              style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>
              Attach an image (optional)
            </label>
            <input ref={fileInputRef} type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              onChange={handleImageChange} className="hidden" />
            {imagePreview ? (
              <div className="flex items-center gap-2">
                <img src={imagePreview} alt="Attached"
                  className="w-[60px] h-[60px] object-cover"
                  style={{
                    borderRadius: 'var(--vibe-radius-input)',
                    border: '1px solid var(--color-border)',
                  }} />
                <button
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="cursor-pointer bg-transparent px-3 py-1.5"
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--vibe-radius-input)',
                    color: 'var(--color-text-secondary)',
                    fontSize: 'var(--font-size-xs)',
                  }}>
                  Remove
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 cursor-pointer"
                style={{
                  border: '1px dashed var(--color-border)',
                  borderRadius: 'var(--vibe-radius-input)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)',
                }}>
                <Camera size={16} />
                Choose from camera / gallery
              </button>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p className="mb-3" style={{ color: 'var(--color-error, #ef4444)', fontSize: 'var(--font-size-xs)' }}>
              {error}
            </p>
          )}

          {/* Rate limit message */}
          {isRateLimited && (
            <p className="px-3 py-2.5 mb-3"
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))',
                borderRadius: 'var(--vibe-radius-input)',
              }}>
              You've submitted several reports recently. Take a breather — your earlier reports are safe!
            </p>
          )}

          {/* Submit button */}
          <button onClick={handleSubmit}
            disabled={!isValid || submitting || isRateLimited}
            className="w-full py-3 font-semibold border-none cursor-pointer"
            style={{
              fontSize: 'var(--font-size-base)',
              borderRadius: 'var(--vibe-radius-input)',
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-text-on-primary)',
              opacity: isValid && !submitting && !isRateLimited ? 1 : 0.5,
              cursor: isValid && !submitting && !isRateLimited ? 'pointer' : 'not-allowed',
            }}>
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Reusable field group with label and textarea */
function FieldGroup({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="mb-3.5">
      <label className="block mb-1 font-medium"
        style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full resize-vertical box-border"
        style={{
          padding: '8px 10px',
          fontSize: 'var(--font-size-sm)',
          fontFamily: 'var(--font-body)',
          borderRadius: 'var(--vibe-radius-input)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-primary)',
          color: 'var(--color-text-primary)',
          outline: 'none',
        }}
      />
    </div>
  )
}
