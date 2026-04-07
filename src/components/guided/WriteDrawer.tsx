/**
 * PRD-25 Phase B: WriteDrawer — Multi-tab Write drawer for Guided shell.
 * Slides from right. Tabs: Notepad, Messages (stub), Reflections (when enabled).
 * Content persists across tab switches. Unsaved content prompt on close.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, PenLine, MessageCircle, Sparkles } from 'lucide-react'
import { useWriteDrawer } from '@/hooks/useWriteDrawer'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useGuidedDashboardConfig } from '@/hooks/useGuidedDashboardConfig'
import { WriteDrawerNotepad } from './WriteDrawerNotepad'
import { WriteDrawerMessages } from './WriteDrawerMessages'
import { WriteDrawerReflections } from './WriteDrawerReflections'

export function WriteDrawer() {
  const { isOpen, activeTab, setActiveTab, closeDrawer } = useWriteDrawer()
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member
  const { preferences } = useGuidedDashboardConfig(family?.id, activeMember?.id)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Notepad content persisted in session
  const [notepadContent, setNotepadContent] = useState(() =>
    sessionStorage.getItem('guided-write-drawer-content') || ''
  )

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, notepadContent])

  // Focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return
    const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
      'button, textarea, input, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()
  }, [isOpen])

  const handleClose = useCallback(() => {
    if (notepadContent.trim()) {
      const confirmed = window.confirm('You have unsaved writing. Discard it?')
      if (!confirmed) return
    }
    setNotepadContent('')
    sessionStorage.removeItem('guided-write-drawer-content')
    closeDrawer()
  }, [notepadContent, closeDrawer])

  const handleSent = useCallback(() => {
    setNotepadContent('')
    sessionStorage.removeItem('guided-write-drawer-content')
  }, [])

  // Handle outside click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  if (!isOpen) return null

  const familyId = family?.id
  const memberId = activeMember?.id
  if (!familyId || !memberId) return null

  const showReflections = preferences.reflections_in_drawer

  const tabs = [
    { key: 'notepad' as const, label: 'Notepad', icon: <PenLine size={16} /> },
    { key: 'messages' as const, label: 'Messages', icon: <MessageCircle size={16} /> },
    ...(showReflections
      ? [{ key: 'reflections' as const, label: 'Reflections', icon: <Sparkles size={16} /> }]
      : []),
  ]

  return (
    <div
      className="fixed inset-0 z-30"
      onClick={handleBackdropClick}
      role="dialog"
      aria-label="Write"
      aria-modal="true"
    >
      {/* Backdrop — mobile only */}
      <div
        className="absolute inset-0 md:hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="absolute right-0 top-0 bottom-0 flex flex-col"
        style={{
          width: 'min(100vw, 420px)',
          backgroundColor: 'var(--color-bg-primary)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.1)',
          animation: 'slideInRight 200ms ease-out',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
        >
          <h2
            className="text-base font-medium"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Write
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab strip */}
        <div
          className="flex border-b shrink-0"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
        >
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium flex-1 justify-center"
              style={{
                color: activeTab === tab.key
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-text-secondary)',
                borderBottom: activeTab === tab.key
                  ? '2px solid var(--color-btn-primary-bg)'
                  : '2px solid transparent',
                background: 'transparent',
                minHeight: '44px',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
          {activeTab === 'notepad' && (
            <WriteDrawerNotepad
              familyId={familyId}
              memberId={memberId}
              content={notepadContent}
              onContentChange={setNotepadContent}
              onSent={handleSent}
              coachingEnabled={preferences.spelling_coaching_enabled}
              readingSupport={preferences.reading_support_enabled}
            />
          )}
          {activeTab === 'messages' && (
            <WriteDrawerMessages />
          )}
          {activeTab === 'reflections' && showReflections && (
            <WriteDrawerReflections
              familyId={familyId}
              memberId={memberId}
              readingSupport={preferences.reading_support_enabled}
              dailyCount={preferences.reflection_daily_count}
            />
          )}
        </div>
      </div>

      {/* Slide animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
