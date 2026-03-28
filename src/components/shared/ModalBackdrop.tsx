/**
 * ModalBackdrop — Themed backdrop overlay
 */

interface ModalBackdropProps {
  onClick: () => void
  zIndex?: number
}

export function ModalBackdrop({ onClick, zIndex }: ModalBackdropProps) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--color-bg-overlay, rgba(0,0,0,0.5))',
        zIndex: zIndex ?? undefined,
        cursor: 'pointer',
      }}
      aria-hidden="true"
    />
  )
}
