import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Sun, Moon as MoonIcon, CheckSquare, Calendar,
  BarChart3, List, Star, Heart, Target, Trophy, Compass, Users, Archive,
  ChevronLeft, ChevronRight, Menu, X, Settings, Eye,
} from 'lucide-react'
import { useShell } from './ShellProvider'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { supabase } from '@/lib/supabase/client'
import type { ShellType } from '@/lib/theme'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  tooltip: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

function getSidebarSections(shell: ShellType): NavSection[] {
  const home: NavSection = {
    title: 'Home',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, tooltip: 'Your personal space' },
    ],
  }

  const capture: NavSection = {
    title: 'Capture & Reflect',
    items: [
      { label: 'Journal', path: '/journal', icon: <BookOpen size={20} />, tooltip: 'Capture thoughts and reflect' },
      { label: 'Morning Rhythm', path: '/rhythms/morning', icon: <Sun size={20} />, tooltip: 'Start your day with intention' },
      { label: 'Evening Review', path: '/rhythms/evening', icon: <MoonIcon size={20} />, tooltip: 'Reflect on your day' },
    ],
  }

  const plan: NavSection = {
    title: 'Plan & Do',
    items: [
      { label: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} />, tooltip: 'Tasks, routines, and to-dos' },
      { label: 'Calendar', path: '/calendar', icon: <Calendar size={20} />, tooltip: 'Family calendar' },
      { label: 'Trackers', path: '/trackers', icon: <BarChart3 size={20} />, tooltip: 'Charts and trackers' },
      { label: 'Lists', path: '/lists', icon: <List size={20} />, tooltip: 'Lists and templates' },
    ],
  }

  const grow: NavSection = {
    title: 'Grow',
    items: [
      { label: 'Guiding Stars', path: '/guiding-stars', icon: <Star size={20} />, tooltip: 'Your values and direction' },
      { label: 'BestIntentions', path: '/best-intentions', icon: <Target size={20} />, tooltip: 'Your intentions and iterations' },
      { label: 'InnerWorkings', path: '/inner-workings', icon: <Heart size={20} />, tooltip: 'Self-knowledge and growth' },
      { label: 'Victories', path: '/victories', icon: <Trophy size={20} />, tooltip: 'Celebrate your wins' },
      { label: 'LifeLantern', path: '/life-lantern', icon: <Compass size={20} />, tooltip: 'Life vision and assessment' },
    ],
  }

  const family: NavSection = {
    title: 'Family',
    items: [
      { label: 'People', path: '/family-context', icon: <Users size={20} />, tooltip: 'People and relationships' },
    ],
  }

  const tools: NavSection = {
    title: 'AI & Tools',
    items: [
      { label: 'Archives', path: '/archives', icon: <Archive size={20} />, tooltip: 'Context and documents' },
    ],
  }

  const settings: NavSection = {
    title: 'System',
    items: [
      { label: 'Settings', path: '/settings', icon: <Settings size={20} />, tooltip: 'Account and family settings' },
    ],
  }

  switch (shell) {
    case 'mom':
      return [home, capture, plan, grow, family, tools, settings]
    case 'adult':
      return [home, capture, plan, grow, family, settings]
    case 'independent':
      return [home, capture, plan, {
        ...grow,
        items: grow.items.filter(i => i.label !== 'LifeLantern'),
      }]
    case 'guided':
      return [home, {
        title: 'My Day',
        items: [
          { label: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} />, tooltip: 'Your tasks for today' },
          { label: 'Journal', path: '/journal', icon: <BookOpen size={20} />, tooltip: 'Write and reflect' },
          { label: 'Victories', path: '/victories', icon: <Trophy size={20} />, tooltip: 'Your wins' },
        ],
      }]
    case 'play':
      return [] // Play shell has no sidebar
  }
}

export function Sidebar() {
  const { shell } = useShell()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // In /preview mode, prefix all sidebar paths with /preview
  const isPreview = location.pathname.startsWith('/preview')
  const pathPrefix = isPreview ? '/preview' : ''

  const rawSections = getSidebarSections(shell)
  const sections = rawSections.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      path: pathPrefix + item.path,
    })),
  }))

  if (shell === 'play' || sections.length === 0) return null

  return <SidebarInner sections={sections} collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} shell={shell} isPreview={isPreview} />
}

/** ViewAs member switcher — mom only, at the bottom of the sidebar */
function ViewAsSwitcher() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { isViewingAs, viewingAsMember, startViewAs, stopViewAs } = useViewAs()
  const [members, setMembers] = useState<Array<{ id: string; display_name: string; role: string }>>([])
  const [open, setOpen] = useState(false)

  // Load family members
  useEffect(() => {
    if (!family?.id) return
    supabase
      .from('family_members')
      .select('id, display_name, role')
      .eq('family_id', family.id)
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) setMembers(data as Array<{ id: string; display_name: string; role: string }>)
      })
  }, [family?.id])

  if (!member || !family) return null

  return (
    <div className="border-t p-3 mt-auto" style={{ borderColor: 'var(--color-border)' }}>
      {isViewingAs ? (
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Viewing as:
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {viewingAsMember?.display_name}
            </span>
            <button
              onClick={stopViewAs}
              className="text-xs px-2 py-1 rounded"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
            >
              Stop
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 text-xs w-full px-2 py-1.5 rounded"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Eye size={14} />
            View As...
          </button>
          {open && (
            <div className="mt-1 space-y-0.5">
              {members
                .filter(m => m.id !== member.id)
                .map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      startViewAs(m as any, member.id, family.id)
                      setOpen(false)
                    }}
                    className="w-full text-left text-xs px-2 py-1 rounded hover:opacity-80"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {m.display_name} <span style={{ color: 'var(--color-text-secondary)' }}>({m.role})</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SidebarInner({
  sections, collapsed, setCollapsed, mobileOpen, setMobileOpen, shell, isPreview,
}: {
  sections: NavSection[]
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  shell: ShellType
  isPreview: boolean
}) {

  const sidebarContent = (
    <nav className="flex-1 flex flex-col overflow-y-auto py-4">
      {sections.map((section) => (
        <div key={section.title} className="mb-4">
          {!collapsed && (
            <p
              className="px-4 mb-1 text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {section.title}
            </p>
          )}
          {section.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? `${item.label} — ${item.tooltip}` : item.tooltip}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'font-medium' : ''
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--color-bg-secondary)' : 'transparent',
                color: isActive ? 'var(--color-text-heading)' : 'var(--color-text-primary)',
                borderRight: isActive ? '3px solid var(--color-btn-primary-bg)' : '3px solid transparent',
              })}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        className="fixed top-3 left-3 z-50 p-2 rounded-lg md:hidden"
        style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={24} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute left-0 top-0 bottom-0 w-64"
            style={{ backgroundColor: 'var(--color-bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4">
              <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>Menu</span>
              <button onClick={() => setMobileOpen(false)}>
                <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col border-r flex-shrink-0 h-svh sticky top-0"
        style={{
          width: collapsed ? '56px' : '220px',
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
          transition: 'width var(--vibe-transition, 200ms ease)',
        }}
      >
        <div className="flex items-center justify-end p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded"
            style={{ color: 'var(--color-text-secondary)' }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        {sidebarContent}
        {shell === 'mom' && !collapsed && <ViewAsSwitcher />}
      </aside>
    </>
  )
}
