/**
 * GlitchReporterFAB — Floating bug report button for beta testing
 *
 * Appears on ALL shells for ALL logged-in users.
 * Draggable — tap-and-drag to reposition (session only, resets on reload).
 * Captures screenshot via html2canvas before opening modal.
 * Math Gate for Guided/Play shell users.
 * Feature-flagged via ENABLE_BETA_FEEDBACK.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bug } from 'lucide-react'
import domtoimage from 'dom-to-image-more'
import { FEATURE_FLAGS } from '@/config/featureFlags'
import { useAuth } from '@/hooks/useAuth'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { MathGate } from './MathGate'
import { GlitchReportModal } from './GlitchReportModal'

const FAB_SIZE = 40
const EDGE_MARGIN = 8

interface FabPosition {
  x: number
  y: number
}

function clampPosition(x: number, y: number): FabPosition {
  const maxX = window.innerWidth - FAB_SIZE - EDGE_MARGIN
  const maxY = window.innerHeight - FAB_SIZE - EDGE_MARGIN
  return {
    x: Math.max(EDGE_MARGIN, Math.min(x, maxX)),
    y: Math.max(EDGE_MARGIN, Math.min(y, maxY)),
  }
}

function defaultPosition(): FabPosition {
  return { x: EDGE_MARGIN, y: 150 }
}

export function GlitchReporterFAB() {
  const { user } = useAuth()
  const { data: member } = useFamilyMember()

  const [pos, setPos] = useState<FabPosition>(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [showMathGate, setShowMathGate] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null)
  const [screenshotFailed, setScreenshotFailed] = useState(false)

  const dragStartRef = useRef<{ startX: number; startY: number; fabX: number; fabY: number } | null>(null)
  const hasDraggedRef = useRef(false)

  const enabled = FEATURE_FLAGS.ENABLE_BETA_FEEDBACK && !!user

  const shellType = member?.role === 'primary_parent' ? 'mom' : (member?.dashboard_mode || 'adult')
  const needsMathGate = shellType === 'guided' || shellType === 'play'

  const captureScreenshot = useCallback(async (): Promise<string | null> => {
    // Find the main content area — more reliable than document.body
    const target = document.querySelector('main') || document.getElementById('root') || document.body

    // Strategy 1: dom-to-image-more — better CSS variable support
    try {
      const dataUrl = await domtoimage.toPng(target, {
        quality: 0.6,
        bgcolor: '#ffffff',
        width: target.scrollWidth,
        height: Math.min(target.scrollHeight, window.innerHeight),
        style: { overflow: 'hidden' },
        filter: (node: Node) => {
          if (node instanceof HTMLElement) {
            return !node.classList?.contains('glitch-reporter-fab') &&
              !node.classList?.contains('glitch-reporter-overlay')
          }
          return true
        },
      })
      if (dataUrl && dataUrl !== 'data:,') return dataUrl
    } catch {
      // fall through
    }

    // Strategy 2: native Canvas from viewport (no permission prompt)
    try {
      const canvas = document.createElement('canvas')
      const scale = 0.5
      canvas.width = window.innerWidth * scale
      canvas.height = window.innerHeight * scale
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(scale, scale)
        // Draw a simple representation — background + text note
        ctx.fillStyle = '#f5f5f5'
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
        ctx.fillStyle = '#666'
        ctx.font = '14px sans-serif'
        ctx.fillText(`Page: ${window.location.pathname}`, 16, 30)
        ctx.fillText(`Viewport: ${window.innerWidth}x${window.innerHeight}`, 16, 50)
        ctx.fillText('(Auto-screenshot unavailable — see attached image)', 16, 80)
        return canvas.toDataURL('image/png', 0.6)
      }
    } catch {
      // fall through
    }

    return null
  }, [])

  const handleFabClick = useCallback(async () => {
    if (hasDraggedRef.current) return

    setScreenshotFailed(false)
    const screenshot = await captureScreenshot()
    if (screenshot) {
      setScreenshotDataUrl(screenshot)
    } else {
      setScreenshotDataUrl(null)
      setScreenshotFailed(true)
    }

    if (needsMathGate) {
      setShowMathGate(true)
    } else {
      setShowModal(true)
    }
  }, [captureScreenshot, needsMathGate])

  const handleMathGateSuccess = useCallback(() => {
    setShowMathGate(false)
    setShowModal(true)
  }, [])

  const handleMathGateDismiss = useCallback(() => {
    setShowMathGate(false)
    setScreenshotDataUrl(null)
  }, [])

  const handleModalClose = useCallback(() => {
    setShowModal(false)
    setScreenshotDataUrl(null)
    setScreenshotFailed(false)
  }, [])

  // ── Drag handling (mouse) ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, fabX: pos.x, fabY: pos.y }
    hasDraggedRef.current = false

    function handleMouseMove(ev: MouseEvent) {
      if (!dragStartRef.current) return
      const dx = ev.clientX - dragStartRef.current.startX
      const dy = ev.clientY - dragStartRef.current.startY
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasDraggedRef.current = true
        setIsDragging(true)
      }
      if (hasDraggedRef.current) {
        setPos(clampPosition(
          dragStartRef.current.fabX + dx,
          dragStartRef.current.fabY + dy,
        ))
      }
    }

    function handleMouseUp() {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      setIsDragging(false)
      dragStartRef.current = null
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [pos])

  // ── Drag handling (touch) ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragStartRef.current = { startX: touch.clientX, startY: touch.clientY, fabX: pos.x, fabY: pos.y }
    hasDraggedRef.current = false

    const fabClick = handleFabClick

    function handleTouchMove(ev: TouchEvent) {
      if (!dragStartRef.current) return
      const t = ev.touches[0]
      const dx = t.clientX - dragStartRef.current.startX
      const dy = t.clientY - dragStartRef.current.startY
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        hasDraggedRef.current = true
        setIsDragging(true)
        ev.preventDefault()
      }
      if (hasDraggedRef.current) {
        setPos(clampPosition(
          dragStartRef.current.fabX + dx,
          dragStartRef.current.fabY + dy,
        ))
      }
    }

    function handleTouchEnd() {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      setIsDragging(false)
      if (!hasDraggedRef.current) {
        fabClick()
      }
      dragStartRef.current = null
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }, [pos, handleFabClick])

  // Recalculate on resize
  useEffect(() => {
    function handleResize() {
      setPos(prev => clampPosition(prev.x, prev.y))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // All hooks above — early return below
  if (!enabled) return null

  return createPortal(
    <>
      {/* FAB button */}
      <button
        className="glitch-reporter-fab fixed z-9990 rounded-full flex items-center justify-center p-0"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={(e) => {
          e.stopPropagation()
          if (!hasDraggedRef.current) {
            handleFabClick()
          }
        }}
        style={{
          left: pos.x,
          top: pos.y,
          width: FAB_SIZE,
          height: FAB_SIZE,
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-card)',
          color: 'var(--color-text-secondary)',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDragging ? 0.9 : 0.6,
          transition: isDragging ? 'none' : 'opacity 200ms',
          touchAction: 'none',
          userSelect: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
        title="Report a glitch"
        aria-label="Report a glitch"
      >
        <Bug size={20} />
      </button>

      {/* Math Gate overlay */}
      {showMathGate && (
        <MathGate
          onSuccess={handleMathGateSuccess}
          onDismiss={handleMathGateDismiss}
        />
      )}

      {/* Glitch Report Modal */}
      {showModal && member && user && (
        <GlitchReportModal
          onClose={handleModalClose}
          screenshotDataUrl={screenshotDataUrl}
          screenshotFailed={screenshotFailed}
          userId={user.id}
          familyId={member.family_id}
          familyMemberId={member.id}
          displayName={member.display_name}
          shellType={shellType}
        />
      )}
    </>,
    document.body,
  )
}
