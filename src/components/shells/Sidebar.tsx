import { useState, useEffect, useCallback } from 'react'
import { Tooltip } from '@/components/shared'
import { useEdgeSwipe } from '@/hooks/useSwipeGesture'
import { NavLink, useLocation } from 'react-router-dom'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useViewAsNav } from '@/features/permissions/ViewAsModal'
import {
  LayoutDashboard, BookOpen, Sun, Moon as MoonIcon, CheckSquare, Calendar,
  BarChart3, List, Star, Brain, Target, Trophy, Compass, Users, Archive,
  Palette, Lock, Gem, Rss, BookCopy,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useShell } from './ShellProvider'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { supabase } from '@/lib/supabase/client'
import type { ShellType } from '@/lib/theme'

interface NavItem {
  label: string
  path: string
  featureKey: string
  icon: React.ReactNode
  tooltip: string
}

interface NavSection {
  title: string
  items: NavItem[]
  collapsible?: boolean
}

function getSidebarSections(shell: ShellType): NavSection[] {
  const home: NavSection = {
    title: 'Home',
    collapsible: false,
    items: [
      { label: 'Dashboard', path: '/dashboard', featureKey: 'dashboard', icon: <LayoutDashboard size={20} />, tooltip: 'Your personal space' },
    ],
  }

  const capture: NavSection = {
    title: 'Capture & Reflect',
    collapsible: true,
    items: [
      { label: 'Journal', path: '/journal', featureKey: 'journal', icon: <BookOpen size={20} />, tooltip: 'Capture thoughts and reflect' },
      { label: 'Morning Rhythm', path: '/rhythms/morning', featureKey: 'morning_rhythm', icon: <Sun size={20} />, tooltip: 'Start your day with intention' },
      { label: 'Evening Review', path: '/rhythms/evening', featureKey: 'evening_review', icon: <MoonIcon size={20} />, tooltip: 'Reflect on your day' },
    ],
  }

  const plan: NavSection = {
    title: 'Plan & Do',
    collapsible: true,
    items: [
      { label: 'Tasks', path: '/tasks', featureKey: 'tasks', icon: <CheckSquare size={20} />, tooltip: 'Tasks, routines, and to-dos' },
      { label: 'Calendar', path: '/calendar', featureKey: 'calendar', icon: <Calendar size={20} />, tooltip: 'Family calendar' },
      { label: 'Trackers', path: '/trackers', featureKey: 'widgets_trackers', icon: <BarChart3 size={20} />, tooltip: 'Charts and trackers' },
      { label: 'Lists', path: '/lists', featureKey: 'lists', icon: <List size={20} />, tooltip: 'Lists and templates' },
      { label: 'Studio', path: '/studio', featureKey: 'studio', icon: <Palette size={20} />, tooltip: 'Template workshop' },
    ],
  }

  const grow: NavSection = {
    title: 'Grow',
    collapsible: true,
    items: [
      { label: 'Guiding Stars', path: '/guiding-stars', featureKey: 'guiding_stars', icon: <Star size={20} />, tooltip: 'Your values and direction' },
      { label: 'BestIntentions', path: '/best-intentions', featureKey: 'best_intentions', icon: <Target size={20} />, tooltip: 'Your intentions and iterations' },
      { label: 'InnerWorkings', path: '/inner-workings', featureKey: 'my_foundation', icon: <Brain size={20} />, tooltip: 'Self-knowledge and growth' },
      { label: 'Victories', path: '/victories', featureKey: 'victories', icon: <Trophy size={20} />, tooltip: 'Celebrate your wins' },
      { label: 'LifeLantern', path: '/life-lantern', featureKey: 'lifelantern', icon: <Compass size={20} />, tooltip: 'Life vision and assessment' },
    ],
  }

  const family: NavSection = {
    title: 'Family',
    collapsible: true,
    items: [
      { label: 'People', path: '/family-context', featureKey: 'people_relationships', icon: <Users size={20} />, tooltip: 'People and relationships' },
      { label: 'Family Feeds', path: '/feeds', featureKey: 'family_feeds', icon: <Rss size={20} />, tooltip: 'Private family social feed' },
    ],
  }

  const tools: NavSection = {
    title: 'AI & Tools',
    collapsible: true,
    items: [
      { label: 'AI Vault', path: '/vault', featureKey: 'vault_browse', icon: <Gem size={20} />, tooltip: 'Tutorials, tools, and prompts' },
      { label: 'Archives', path: '/archives', featureKey: 'archives', icon: <Archive size={20} />, tooltip: 'Context and documents' },
      { label: 'BookShelf', path: '/bookshelf', featureKey: 'bookshelf', icon: <BookCopy size={20} />, tooltip: 'Upload books, extract wisdom with LiLa' },
    ],
  }

  switch (shell) {
    case 'mom':
      return [home, tools, capture, plan, grow, family]
    case 'adult':
      return [home, capture, plan, grow, family, {
        title: 'AI & Tools',
        items: [
          { label: 'AI Vault', path: '/vault', featureKey: 'vault_browse', icon: <Gem size={20} />, tooltip: 'Tutorials, tools, and prompts' },
        ],
      }]
    case 'independent':
      return [home, capture, plan, {
        ...grow,
        items: grow.items.filter(i => i.label !== 'LifeLantern'),
      }, {
        title: 'AI & Tools',
        collapsible: true,
        items: [
          { label: 'AI Vault', path: '/vault', featureKey: 'vault_consume', icon: <Gem size={20} />, tooltip: 'AI tutorials and tools' },
          { label: 'BookShelf', path: '/bookshelf', featureKey: 'bookshelf', icon: <BookCopy size={20} />, tooltip: 'Upload books, extract wisdom with LiLa' },
        ],
      }]
    case 'guided':
      return [home, {
        title: 'My Day',
        items: [
          { label: 'Tasks', path: '/tasks', featureKey: 'tasks', icon: <CheckSquare size={20} />, tooltip: 'Your tasks for today' },
          { label: 'Journal', path: '/journal', featureKey: 'journal', icon: <BookOpen size={20} />, tooltip: 'Write and reflect' },
          { label: 'Victories', path: '/victories', featureKey: 'victories', icon: <Trophy size={20} />, tooltip: 'Your wins' },
        ],
      }]
    case 'play':
      return [] // Play shell has no sidebar
  }
}

/**
 * Hook to persist sidebar collapsed state to family_members.layout_preferences.
 * Loads initial state from Supabase, saves on change.
 */
function useSidebarPersistence(memberId: string | null) {
  const [collapsed, setCollapsedState] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load from Supabase on mount
  useEffect(() => {
    if (!memberId) return
    supabase
      .from('family_members')
      .select('layout_preferences')
      .eq('id', memberId)
      .single()
      .then(({ data }) => {
        if (data?.layout_preferences?.sidebar_open === false) {
          setCollapsedState(true)
        }
        setLoaded(true)
      })
  }, [memberId])

  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next)
    if (memberId) {
      supabase
        .from('family_members')
        .select('layout_preferences')
        .eq('id', memberId)
        .single()
        .then(({ data }) => {
          const prefs = (data?.layout_preferences as Record<string, unknown>) || {}
          supabase
            .from('family_members')
            .update({ layout_preferences: { ...prefs, sidebar_open: !next } })
            .eq('id', memberId)
            .then(() => {})
        })
    }
  }, [memberId])

  return { collapsed, setCollapsed, loaded }
}

/**
 * SidebarNavItem — renders either a real NavLink (normal mode)
 * or a button that uses ViewAsNav (when inside View As modal).
 */
function SidebarNavItem({
  path, icon, label, tierLocked, collapsed, onNavigate,
}: {
  path: string; icon: React.ReactNode; label: string
  tierLocked: boolean; collapsed: boolean; onNavigate: () => void
}) {
  const { isViewingAs } = useViewAs()
  const { currentPath, navigate: viewAsNav } = useViewAsNav()
  const location = useLocation()

  // Determine active state based on context
  const isActive = isViewingAs ? currentPath === path : location.pathname === path

  if (isViewingAs) {
    // In View As: use state-based navigation, not real router
    return (
      <button
        onClick={() => {
          if (tierLocked) return
          viewAsNav(path)
          onNavigate()
        }}
        className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-colors w-full text-left ${isActive && !tierLocked ? 'font-medium' : ''}`}
        style={{
          backgroundColor: isActive && !tierLocked ? 'var(--surface-primary, var(--color-bg-secondary))' : 'transparent',
          color: tierLocked ? 'var(--color-text-secondary)' : isActive ? 'var(--color-text-heading)' : 'var(--color-text-primary)',
          borderRight: isActive && !tierLocked ? '3px solid var(--surface-primary, var(--color-btn-primary-bg))' : '3px solid transparent',
          opacity: tierLocked ? 0.45 : 1,
          cursor: tierLocked ? 'not-allowed' : 'pointer',
        }}
      >
        {icon}
        {!collapsed && (
          <>
            <span>{label}</span>
            {tierLocked && <Lock size={12} className="ml-auto shrink-0" />}
          </>
        )}
      </button>
    )
  }

  // Normal mode: real NavLink
  return (
    <NavLink
      to={tierLocked ? '#' : path}
      onClick={(e) => {
        if (tierLocked) { e.preventDefault(); return }
        onNavigate()
      }}
      className={({ isActive: active }) =>
        `flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-colors ${active && !tierLocked ? 'font-medium' : ''}`
      }
      style={({ isActive: active }) => ({
        backgroundColor: active && !tierLocked ? 'var(--surface-primary, var(--color-bg-secondary))' : 'transparent',
        color: tierLocked ? 'var(--color-text-secondary)' : active ? 'var(--color-text-heading)' : 'var(--color-text-primary)',
        borderRight: active && !tierLocked ? '3px solid var(--surface-primary, var(--color-btn-primary-bg))' : '3px solid transparent',
        opacity: tierLocked ? 0.45 : 1,
        filter: tierLocked ? 'blur(0.5px)' : 'none',
        cursor: tierLocked ? 'not-allowed' : 'pointer',
      })}
    >
      {icon}
      {!collapsed && (
        <>
          <span>{label}</span>
          {tierLocked && <Lock size={12} className="ml-auto shrink-0" />}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const { shell } = useShell()
  const location = useLocation()
  const { data: member } = useFamilyMember()
  const { collapsed, setCollapsed } = useSidebarPersistence(member?.id ?? null)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Left-edge swipe to open sidebar on mobile/tablet (PRD-04)
  useEdgeSwipe({
    onSwipeFromEdge: () => setMobileOpen(true),
    enabled: shell !== 'play',
  })

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

/** Track expanded sections — default: only the section containing the current route */
function useSectionCollapse(sections: NavSection[], currentPath: string) {
  // Find which section contains the active route
  const activeSectionTitle = sections.find(s =>
    s.items.some(item => currentPath === item.path || currentPath.startsWith(item.path + '/'))
  )?.title

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Default: only expand the section containing the current route
    return new Set(activeSectionTitle ? [activeSectionTitle] : ['Home'])
  })

  // When route changes, auto-expand the section containing the new route
  useEffect(() => {
    if (activeSectionTitle && !expandedSections.has(activeSectionTitle)) {
      setExpandedSections(prev => new Set([...prev, activeSectionTitle]))
    }
  }, [currentPath, activeSectionTitle])

  const toggleSection = useCallback((title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }, [])

  const isSectionExpanded = useCallback((title: string) => expandedSections.has(title), [expandedSections])

  return { isSectionExpanded, toggleSection }
}

function SidebarInner({
  sections, collapsed, setCollapsed, mobileOpen: _mobileOpen, setMobileOpen, shell, isPreview: _isPreview,
}: {
  sections: NavSection[]
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  shell: ShellType
  isPreview: boolean
}) {
  const location = useLocation()
  const { isSectionExpanded, toggleSection } = useSectionCollapse(sections, location.pathname)

  const sidebarContent = (
    <nav className="flex-1 flex flex-col overflow-y-auto py-4 scrollbar-card">
      {sections.map((section) => {
        const isCollapsible = section.collapsible && !collapsed
        const isExpanded = !isCollapsible || isSectionExpanded(section.title)

        return (
        <div key={section.title} className="mb-1">
          {!collapsed && (
            isCollapsible ? (
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full text-xs font-semibold uppercase"
                style={{
                  color: 'var(--color-text-secondary)',
                  background: 'transparent',
                  border: 'none',
                  minHeight: 'unset',
                  padding: '0.375rem 0.75rem',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  fontSize: 'var(--font-size-xs, 0.7rem)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                <span>{section.title}</span>
                <ChevronRight
                  size={12}
                  style={{
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                    transition: 'transform 200ms ease',
                    color: 'var(--color-text-secondary)',
                  }}
                />
              </button>
            ) : (
              <p
                className="text-xs font-semibold uppercase"
                style={{
                  color: 'var(--color-text-secondary)',
                  padding: '0.375rem 0.75rem',
                  letterSpacing: '0.05em',
                  fontSize: 'var(--font-size-xs, 0.7rem)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {section.title}
              </p>
            )
          )}
          <div
            style={{
              overflow: 'hidden',
              maxHeight: isExpanded ? '500px' : '0',
              transition: 'max-height 200ms ease',
            }}
          >
          {section.items.map((item) => {
            // Tier-locking: during beta useCanAccess returns true for all.
            const tierLocked = false // Will be: !useCanAccess(item.featureKey)
            const isMom = shell === 'mom'

            if (tierLocked && !isMom) return null

            return (
              <Tooltip content={collapsed ? `${item.label} — ${item.tooltip}` : item.tooltip} key={item.path}>
              <SidebarNavItem
                path={item.path}
                icon={item.icon}
                label={item.label}
                tierLocked={tierLocked}
                collapsed={collapsed}
                onNavigate={() => setMobileOpen(false)}
              />
              </Tooltip>
            )
          })}
          </div>
        </div>
        )
      })}

      {/* AI Toolbox removed — tools accessible via LiLa guided mode switcher */}
    </nav>
  )

  return (
    <>
      {/* Mobile sidebar overlay — opens via left-edge swipe gesture */}
      {_mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 md:hidden"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex flex-col md:hidden animate-slideRight"
            style={{
              width: '260px',
              backgroundColor: 'var(--color-bg-card)',
              borderRight: '1px solid var(--color-border)',
              boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
              >
                <ChevronLeft size={16} />
              </button>
            </div>
            {sidebarContent}
            {/* View As removed from sidebar — lives in Family Overview only */}
          </aside>
          <style>{`
            @keyframes slideRight {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
            .animate-slideRight {
              animation: slideRight 0.2s ease-out;
            }
            @media (prefers-reduced-motion: reduce) {
              .animate-slideRight { animation: none; }
            }
          `}</style>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col border-r flex-shrink-0 h-svh sticky top-0"
        style={{
          width: collapsed ? '56px' : '220px',
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
          transition: 'width var(--vibe-transition, 200ms ease)',
        }}
      >
        <div className="flex items-center justify-end p-2">
          <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          </Tooltip>
        </div>
        {sidebarContent}
        {/* View As removed from sidebar — lives in Family Overview only */}
      </aside>
    </>
  )
}

