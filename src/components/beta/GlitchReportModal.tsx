/**
 * GlitchReportModal — Bug report form for beta testers
 *
 * Four required text fields, optional image attachment,
 * auto-captured diagnostics, screenshot preview.
 * Submits directly to beta_glitch_reports via Supabase client.
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

const MIN_CHARS = 3
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

  const isValid =
    whatDoing.trim().length >= MIN_CHARS &&
    whatTried.trim().length >= MIN_CHARS &&
    whatHappened.trim().length >= MIN_CHARS &&
    whatExpected.trim().length >= MIN_CHARS

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
      // Upload user image if provided
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

      // Gather diagnostics
      const diagnostics = {
        console_errors: getRecentErrors(),
        recent_routes: getRecentRoutes(),
        browser_info: getBrowserInfo(),
      }

      // Insert report
      const { error: insertError } = await supabase
        .from('beta_glitch_reports')
        .insert({
          user_id: userId,
          family_id: familyId,
          family_member_id: familyMemberId,
          shell_type: shellType,
          display_name: displayName,
          what_doing: whatDoing.trim(),
          what_tried: whatTried.trim(),
          what_happened: whatHappened.trim(),
          what_expected: whatExpected.trim(),
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
      <div
        className="glitch-reporter-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          backgroundColor: 'var(--color-surface, #fff)',
          borderRadius: 'var(--vibe-radius-card, 12px)',
          padding: '32px',
          textAlign: 'center',
          maxWidth: '360px',
          width: '90%',
        }}>
          <CheckCircle size={48} style={{ color: 'var(--color-success, #22c55e)', marginBottom: '12px' }} />
          <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary, #333)' }}>
            Thank you!
          </p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary, #666)', marginTop: '4px' }}>
            Your report has been saved.
          </p>
        </div>
      </div>
    )
  }

  // ── Full-size screenshot preview ──
  if (showScreenshot && screenshotDataUrl) {
    return (
      <div
        className="glitch-reporter-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.8)',
          cursor: 'pointer',
        }}
        onClick={() => setShowScreenshot(false)}
      >
        <img
          src={screenshotDataUrl}
          alt="Screenshot preview"
          style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px' }}
        />
      </div>
    )
  }

  return (
    <div
      className="glitch-reporter-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface, #fff)',
          borderRadius: 'var(--vibe-radius-card, 12px)',
          maxWidth: '520px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--color-border-default, #eee)',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary, #333)', margin: 0 }}>
            Report a Glitch
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--color-text-secondary, #666)',
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px 20px' }}>
          {/* Screenshot preview */}
          {screenshotDataUrl && (
            <div
              onClick={() => setShowScreenshot(true)}
              style={{
                marginBottom: '16px',
                cursor: 'pointer',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                overflow: 'hidden',
                border: '1px solid var(--color-border-default, #ddd)',
                maxHeight: '120px',
              }}
            >
              <img
                src={screenshotDataUrl}
                alt="Captured screenshot"
                style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}
          {screenshotFailed && !screenshotDataUrl && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              marginBottom: '16px',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              backgroundColor: 'var(--color-bg-secondary, #f5f5f5)',
              fontSize: '13px',
              color: 'var(--color-text-secondary, #666)',
            }}>
              <AlertTriangle size={16} />
              Screenshot capture failed — you can still attach an image manually.
            </div>
          )}

          {/* Form fields */}
          <FieldGroup label="What were you doing?" value={whatDoing} onChange={setWhatDoing} />
          <FieldGroup label="What did you try to do?" value={whatTried} onChange={setWhatTried} />
          <FieldGroup label="What happened?" value={whatHappened} onChange={setWhatHappened} />
          <FieldGroup label="What did you expect would happen?" value={whatExpected} onChange={setWhatExpected} />

          {/* Image attachment */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary, #333)', marginBottom: '6px' }}>
              Attach an image (optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            {imagePreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src={imagePreview}
                  alt="Attached"
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: 'var(--vibe-radius-input, 8px)',
                    border: '1px solid var(--color-border-default, #ddd)',
                  }}
                />
                <button
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--color-border-default, #ddd)',
                    borderRadius: 'var(--vibe-radius-input, 8px)',
                    padding: '6px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary, #666)',
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  border: '1px dashed var(--color-border-default, #ccc)',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary, #666)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <Camera size={16} />
                Choose from camera / gallery
              </button>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p style={{ color: 'var(--color-error, #ef4444)', fontSize: '13px', marginBottom: '12px' }}>
              {error}
            </p>
          )}

          {/* Rate limit message */}
          {isRateLimited && (
            <p style={{
              fontSize: '13px',
              color: 'var(--color-text-secondary, #666)',
              backgroundColor: 'var(--color-bg-secondary, #f5f5f5)',
              padding: '10px 12px',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              marginBottom: '12px',
            }}>
              You've submitted several reports recently. Take a breather — your earlier reports are safe!
            </p>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting || isRateLimited}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: 'none',
              backgroundColor: 'var(--color-btn-primary-bg, #4f46e5)',
              color: 'var(--color-btn-primary-text, #fff)',
              cursor: isValid && !submitting && !isRateLimited ? 'pointer' : 'not-allowed',
              opacity: isValid && !submitting && !isRateLimited ? 1 : 0.5,
            }}
          >
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
    <div style={{ marginBottom: '14px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--color-text-primary, #333)',
        marginBottom: '4px',
      }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        style={{
          width: '100%',
          padding: '8px 10px',
          fontSize: '14px',
          borderRadius: 'var(--vibe-radius-input, 8px)',
          border: '1px solid var(--color-border-default, #ddd)',
          backgroundColor: 'var(--color-bg-secondary, #f5f5f5)',
          color: 'var(--color-text-primary, #333)',
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}
