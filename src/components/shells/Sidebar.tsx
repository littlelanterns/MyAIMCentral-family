import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Sun, Moon as MoonIcon, CheckSquare, Calendar,
  BarChart3, List, Star, Heart, Trophy, Compass, Users, Archive,
  ChevronLeft, ChevronRight, Menu, X,
} from 'lucide-react'
import { useShell } from './ShellProvider'
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
      { label: 'My Foundation', path: '/inner-workings', icon: <Heart size={20} />, tooltip: 'Self-knowledge and growth' },
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

  switch (shell) {
    case 'mom':
      return [home, capture, plan, grow, family, tools]
    case 'adult':
      return [home, capture, plan, grow, family]
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
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const sections = getSidebarSections(shell)

  if (shell === 'play' || sections.length === 0) return null

  const sidebarContent = (
    <nav className="h-full flex flex-col overflow-y-auto py-4">
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
      </aside>
    </>
  )
}
