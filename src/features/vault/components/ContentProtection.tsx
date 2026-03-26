import { useRef, useEffect, type ReactNode } from 'react'

/**
 * ContentProtection wrapper (PRD-21A).
 *
 * - Disables text selection on prompt/skill content
 * - Disables right-click on images
 * - Copy only via explicit Copy buttons
 * - Does NOT prevent viewing — just makes casual copying impractical
 */

interface Props {
  children: ReactNode
  /** Set false to allow text selection (e.g. for non-prompt content) */
  disableSelection?: boolean
  /** Set false to allow right-click on images */
  disableImageRightClick?: boolean
}

export function ContentProtection({
  children,
  disableSelection = true,
  disableImageRightClick = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!disableImageRightClick) return
    const el = ref.current
    if (!el) return

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG') {
        e.preventDefault()
      }
    }

    el.addEventListener('contextmenu', handler)
    return () => el.removeEventListener('contextmenu', handler)
  }, [disableImageRightClick])

  return (
    <div
      ref={ref}
      style={disableSelection ? {
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none' as any,
      } : undefined}
    >
      {children}
    </div>
  )
}
