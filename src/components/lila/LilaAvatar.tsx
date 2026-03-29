import { Tooltip } from '@/components/shared'

/**
 * LiLa Avatar — PRD-05
 * Renders the correct character art for each LiLa mode/avatar state.
 * Four avatars: Help (open arms), Assist (clipboard), Optimizer (thinking), Sitting (resting).
 * Uses PNG character art from /public/.
 */

interface LilaAvatarProps {
  avatarKey: string
  size?: number
  className?: string
}

const AVATAR_CONFIG: Record<string, {
  src: string
  label: string
}> = {
  happy_to_help: { src: '/Lila-HtH.png', label: 'LiLa Help' },
  your_guide: { src: '/lila-asst.png', label: 'LiLa Assist' },
  smart_ai: { src: '/lila-opt.png', label: 'LiLa Optimizer' },
  sitting: { src: '/sittinglila.png', label: 'Sitting LiLa' },
  resting: { src: '/sittinglila.png', label: 'Sitting LiLa' },
}

export function LilaAvatar({ avatarKey, size = 24, className = '' }: LilaAvatarProps) {
  const config = AVATAR_CONFIG[avatarKey] || AVATAR_CONFIG.sitting

  return (
    <Tooltip content={config.label}>
    <img
      src={config.src}
      alt={config.label}
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={{
        width: size + 8,
        height: size + 8,
        minHeight: 0, // Prevent any inherited min-height
      }}
      onError={(e) => {
        // Fallback to a colored circle if image fails to load
        const target = e.target as HTMLImageElement
        target.style.display = 'none'
        const fallback = document.createElement('div')
        fallback.style.width = `${size + 8}px`
        fallback.style.height = `${size + 8}px`
        fallback.style.borderRadius = '50%'
        fallback.style.backgroundColor = 'var(--color-btn-primary-bg)'
        fallback.style.display = 'inline-flex'
        fallback.style.alignItems = 'center'
        fallback.style.justifyContent = 'center'
        fallback.style.color = 'var(--color-btn-primary-text)'
        fallback.style.fontSize = `${size * 0.5}px`
        fallback.textContent = 'L'
        target.parentElement?.appendChild(fallback)
      }}
    />
    </Tooltip>
  )
}

/** Get the display name for a mode key */
export function getModeDisplayName(modeKey: string | null, guidedSubtype: string | null): string {
  if (guidedSubtype) return guidedSubtype
  switch (modeKey) {
    case 'help': return 'LiLa Help'
    case 'assist': return 'LiLa Assist'
    case 'optimizer': return 'LiLa Optimizer'
    case 'general': return 'General Chat'
    default: return modeKey || 'General Chat'
  }
}

/** Get the avatar key for a mode */
export function getAvatarKeyForMode(mode: string): string {
  switch (mode) {
    case 'help': return 'happy_to_help'
    case 'assist': return 'your_guide'
    case 'optimizer': return 'smart_ai'
    default: return 'sitting'
  }
}
