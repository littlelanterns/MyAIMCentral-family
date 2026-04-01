import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, Trophy, BarChart3, Settings, PenLine, X, Mic } from 'lucide-react'
import { Tooltip } from '@/components/shared'
import { LilaModalTrigger } from '@/components/lila'
import { TimerProvider } from '@/features/timer'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useSettings } from '@/components/settings'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { supabase } from '@/lib/supabase/client'

interface GuidedShellProps {
  children: ReactNode
}

const navItems = [
  { path: '/dashboard', icon: <Home size={22} />, label: 'Home' },
  { path: '/tasks', icon: <CheckSquare size={22} />, label: 'Tasks' },
  { path: '/journal', icon: <PenLine size={22} />, label: 'Write' },
  { path: '/victories', icon: <Trophy size={22} />, label: 'Victories' },
  { path: '/trackers', icon: <BarChart3 size={22} />, label: 'Progress' },
]

export function GuidedShell({ children }: GuidedShellProps) {
  const { data: member } = useFamilyMember()
  const { openSettings } = useSettings()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const [notepadOpen, setNotepadOpen] = useState(false)

  // Show the viewed-as member's name when in View As mode
  const displayMember = isViewingAs && viewingAsMember ? viewingAsMember : member

  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <TimerProvider>
    <div className="flex flex-col min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
      >
        <div>
          <h1
            className="text-lg font-medium"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-heading)' }}
          >
            {greeting}, {displayMember?.display_name || 'Friend'}!
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="Write something">
          <button
            onClick={() => setNotepadOpen(true)}
            className="p-2 rounded-full"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
          >
            <PenLine size={20} />
          </button>
          </Tooltip>
          <LilaModalTrigger modeKey="guided_communication_coach" label="LiLa" />
          <button
            onClick={openSettings}
            className="p-2 rounded-full"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Lightweight Notepad drawer — PRD-04: single tab, saves to journal */}
      {notepadOpen && (
        <GuidedNotepad memberId={member?.id} onClose={() => setNotepadOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t py-2 z-20"
        style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px] min-h-[48px] justify-center"
            style={({ isActive }) => ({
              color: isActive ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-text-secondary)',
            })}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
    </TimerProvider>
  )
}

/**
 * GuidedNotepad — PRD-04 lightweight notepad for Guided shell.
 * Single tab, freeform text, larger font, saves directly to journal.
 * No routing grid, no multi-tab, no Review & Route.
 */
function GuidedNotepad({ memberId, onClose }: { memberId?: string; onClose: () => void }) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!content.trim() || !memberId) return
    setSaving(true)
    try {
      const { data: member } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('id', memberId)
        .single()
      if (member) {
        await supabase.from('journal_entries').insert({
          family_id: member.family_id,
          member_id: memberId,
          entry_type: 'journal_entry',
          content: content.trim(),
          visibility: 'shared_parents',
          is_included_in_ai: true,
        })
        setContent('')
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end md:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full md:max-w-lg md:mx-4 rounded-t-xl md:rounded-xl flex flex-col"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          maxHeight: '80dvh',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3
            className="text-base font-medium"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Write something
          </h3>
          <div className="flex items-center gap-2">
            <Tooltip content="Voice input">
            <button
              className="p-1.5 rounded-full"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            >
              <Mic size={18} />
            </button>
            </Tooltip>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="flex-1 p-4 resize-none focus:outline-none"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)',
            fontSize: '18px',
            lineHeight: 1.6,
            minHeight: '200px',
            border: 'none',
          }}
          autoFocus
        />
        <div className="flex justify-end p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: content.trim() ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-bg-secondary)',
              color: content.trim() ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save to Journal'}
          </button>
        </div>
      </div>
    </div>
  )
}
