/**
 * ArchiveMemberCard — PRD-13B
 * Square card for the Archives grid layout.
 * Photo state: image fills card with gradient overlay.
 * No-photo state: member color background + centered initials.
 * Both states show name, insight count, role badge, heart toggle.
 * Camera overlay on hover (desktop) / long-press (mobile).
 *
 * File selection triggers onFileSelect callback — the parent
 * manages the crop preview modal.
 */

import { useRef, useState, useCallback } from 'react'
import { Heart, HeartOff, Camera } from 'lucide-react'
import { RoleBadge, LoadingSpinner } from '@/components/shared'
import { getContrastText } from '@/config/member_colors'
import { getInitials } from '@/components/shared/Avatar'
import { useTheme } from '@/lib/theme/ThemeProvider'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArchiveMemberCardProps {
  /** Member display name */
  name: string
  /** Avatar image URL */
  avatarUrl?: string | null
  /** Hex color for no-photo background */
  memberColor?: string | null
  /** Member role (for RoleBadge) */
  role?: 'primary_parent' | 'additional_adult' | 'special_adult' | 'member'
  /** AI context insight counts */
  includedInsights: number
  totalInsights: number
  /** Person-level AI toggle */
  isIncludedInAI: boolean
  /** Callbacks */
  onNavigate: () => void
  onToggleAI: () => void
  /** Called when user selects a file — parent opens crop modal */
  onFileSelect?: (file: File) => void
  /** Upload in progress */
  uploading?: boolean
  /** True for the Family Overview card (no role badge, no heart) */
  isFamilyOverview?: boolean
  /** Override label (e.g. "Family Overview") */
  label?: string
  /** Override insight label (e.g. "12 items active") */
  insightLabel?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ArchiveMemberCard({
  name,
  avatarUrl,
  memberColor,
  role,
  includedInsights,
  totalInsights,
  isIncludedInAI,
  onNavigate,
  onToggleAI,
  onFileSelect,
  uploading = false,
  isFamilyOverview = false,
  label,
  insightLabel,
}: ArchiveMemberCardProps) {
  const { gradientEnabled } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showCameraOverlay, setShowCameraOverlay] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasPhoto = !!avatarUrl
  const bgColor = memberColor && memberColor.startsWith('#')
    ? memberColor
    : 'var(--color-btn-primary-bg)'
  const initials = getInitials(name)
  const initialsColor = memberColor && memberColor.startsWith('#')
    ? getContrastText(memberColor)
    : '#ffffff'

  const displayLabel = label || name
  const displayInsight = insightLabel || `${includedInsights}/${totalInsights} insights`

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && onFileSelect) {
        onFileSelect(file)
      }
      e.target.value = ''
    },
    [onFileSelect],
  )

  const handleCameraClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setShowCameraOverlay(false)
      fileInputRef.current?.click()
    },
    [],
  )

  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowCameraOverlay(true)
    }, 500)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  return (
    <div
      className="relative overflow-hidden rounded-xl cursor-pointer group"
      style={{ aspectRatio: '1 / 1' }}
      onClick={onNavigate}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onNavigate()
        }
      }}
    >
      {/* Background: photo or color */}
      {hasPhoto ? (
        <img
          src={avatarUrl!}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover object-center"
          draggable={false}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <span
            style={{
              fontSize: '2.5rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              color: initialsColor,
              userSelect: 'none',
            }}
          >
            {initials}
          </span>
        </div>
      )}

      {/* Bottom text scrim — photo cards only, no overlay on color cards */}
      {hasPhoto && (
        <div
          className="absolute inset-0"
          style={{
            background: gradientEnabled
              ? 'linear-gradient(to top, color-mix(in srgb, var(--color-accent-deep) 80%, transparent) 0%, color-mix(in srgb, var(--color-accent-deep) 20%, transparent) 35%, transparent 55%)'
              : 'linear-gradient(to top, color-mix(in srgb, var(--color-accent-deep) 70%, transparent) 0%, transparent 40%)',
          }}
        />
      )}

      {/* Role badge — top-left */}
      {role && !isFamilyOverview && (
        <div className="absolute top-2 left-2 z-10">
          <RoleBadge role={role} size="sm" />
        </div>
      )}

      {/* Heart toggle — top-right */}
      {!isFamilyOverview && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleAI()
          }}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full transition-colors"
          style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            color: isIncludedInAI ? '#ffffff' : 'rgba(255,255,255,0.6)',
          }}
          title={
            isIncludedInAI
              ? 'Included in AI context — click to exclude'
              : 'Excluded from AI context — click to include'
          }
        >
          {isIncludedInAI ? (
            <Heart size={16} fill="currentColor" />
          ) : (
            <HeartOff size={16} />
          )}
        </button>
      )}

      {/* Name + insight count — bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-2.5 pt-6">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
        >
          {displayLabel}
        </p>
        <p
          className="text-xs truncate"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          {displayInsight}
        </p>
      </div>

      {/* Camera overlay — hover (desktop) */}
      {onFileSelect && (
        <div
          className="absolute inset-0 z-20 items-center justify-center bg-black/40 transition-opacity hidden md:flex"
          style={{ opacity: showCameraOverlay ? 1 : undefined }}
          onClick={handleCameraClick}
        >
          <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={28} color="#ffffff" />
            <span className="text-xs font-medium text-white">
              {hasPhoto ? 'Change Photo' : 'Add Photo'}
            </span>
          </div>
        </div>
      )}

      {/* Camera overlay — long-press (mobile) */}
      {onFileSelect && showCameraOverlay && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 md:hidden"
          onClick={handleCameraClick}
        >
          <div className="flex flex-col items-center gap-1">
            <Camera size={28} color="#ffffff" />
            <span className="text-xs font-medium text-white">
              {hasPhoto ? 'Change Photo' : 'Add Photo'}
            </span>
          </div>
        </div>
      )}

      {/* Upload spinner overlay */}
      {uploading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* Hidden file input */}
      {onFileSelect && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}
    </div>
  )
}
