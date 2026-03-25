import { useState, useEffect, useRef, useCallback } from 'react'
import { useEdgeSwipe } from '@/hooks/useSwipeGesture'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Sun, Moon as MoonIcon, CheckSquare, Calendar,
  BarChart3, List, Star, Heart, Target, Trophy, Compass, Users, Archive,
  Palette, Lock,
  ChevronLeft, ChevronRight, Eye,
} from 'lucide-react'
import { useShell } from './ShellProvider'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/lib/theme'
import { getFeatureIcons } from '@/lib/assets'
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
}

function getSidebarSections(shell: ShellType): NavSection[] {
  const home: NavSection = {
    title: 'Home',
    items: [
      { label: 'Dashboard', path: '/dashboard', featureKey: 'dashboard', icon: <LayoutDashboard size={20} />, tooltip: 'Your personal space' },
    ],
  }

  const capture: NavSection = {
    title: 'Capture & Reflect',
    items: [
      { label: 'Journal', path: '/journal', featureKey: 'journal', icon: <BookOpen size={20} />, tooltip: 'Capture thoughts and reflect' },
      { label: 'Morning Rhythm', path: '/rhythms/morning', featureKey: 'morning_rhythm', icon: <Sun size={20} />, tooltip: 'Start your day with intention' },
      { label: 'Evening Review', path: '/rhythms/evening', featureKey: 'evening_review', icon: <MoonIcon size={20} />, tooltip: 'Reflect on your day' },
    ],
  }

  const plan: NavSection = {
    title: 'Plan & Do',
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
    items: [
      { label: 'Guiding Stars', path: '/guiding-stars', featureKey: 'guiding_stars', icon: <Star size={20} />, tooltip: 'Your values and direction' },
      { label: 'BestIntentions', path: '/best-intentions', featureKey: 'best_intentions', icon: <Target size={20} />, tooltip: 'Your intentions and iterations' },
      { label: 'InnerWorkings', path: '/inner-workings', featureKey: 'my_foundation', icon: <Heart size={20} />, tooltip: 'Self-knowledge and growth' },
      { label: 'Victories', path: '/victories', featureKey: 'victories', icon: <Trophy size={20} />, tooltip: 'Celebrate your wins' },
      { label: 'LifeLantern', path: '/life-lantern', featureKey: 'lifelantern', icon: <Compass size={20} />, tooltip: 'Life vision and assessment' },
    ],
  }

  const family: NavSection = {
    title: 'Family',
    items: [
      { label: 'People', path: '/family-context', featureKey: 'people_relationships', icon: <Users size={20} />, tooltip: 'People and relationships' },
    ],
  }

  const tools: NavSection = {
    title: 'AI & Tools',
    items: [
      { label: 'Archives', path: '/archives', featureKey: 'archives', icon: <Archive size={20} />, tooltip: 'Context and documents' },
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
          { label: 'Tasks', path: '/tasks', featureKey: 'tasks', icon: <CheckSquare size={20} />, tooltip: 'Your tasks for today' },
          { label: 'Journal', path: '/journal', featureKey: 'journal', icon: <BookOpen size={20} />, tooltip: 'Write and reflect' },
          { label: 'Victories', path: '/victories', featureKey: 'victories', icon: <Trophy size={20} />, tooltip: 'Your wins' },
        ],
      }]
    case 'play':
      return [] // Play shell has no sidebar
  }
}

/** Batch-fetch illustrated icons for all nav items, cached by vibe */
function useNavIcons(sections: NavSection[]) {
  const { vibe } = useTheme()
  const [iconUrls, setIconUrls] = useState<Record<string, string | null>>({})
  const vibeRef = useRef(vibe)
  const sectionsRef = useRef(sections)

  // Track sections reference for stable comparison
  const sectionKeys = sections.flatMap(s => s.items.map(i => i.featureKey)).join(',')

  useEffect(() => {
    const featureKeys = sections.flatMap(s => s.items.map(i => i.featureKey))
    if (featureKeys.length === 0) return

    let cancelled = false
    getFeatureIcons(featureKeys, vibe, 'A', 128).then(urls => {
      if (!cancelled) setIconUrls(urls)
    })
    vibeRef.current = vibe
    sectionsRef.current = sections

    return () => { cancelled = true }
  }, [vibe, sectionKeys])

  return iconUrls
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

/** ViewAs member switcher — mom only, at the bottom of the sidebar */
function ViewAsSwitcher() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { isViewingAs, viewingAsMember, startViewAs, stopViewAs } = useViewAs()
  const [members, setMembers] = useState<Array<{ id: string; display_name: string; role: string; dashboard_mode: string | null; theme_preferences: Record<string, unknown> | null }>>([])
  const [open, setOpen] = useState(false)

  // Load family members — include dashboard_mode and theme_preferences for View As shell switching
  useEffect(() => {
    if (!family?.id) return
    supabase
      .from('family_members')
      .select('id, display_name, role, dashboard_mode, theme_preferences')
      .eq('family_id', family.id)
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) setMembers(data as typeof members)
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
  const iconUrls = useNavIcons(sections)

  const sidebarContent = (
    <nav className="flex-1 flex flex-col overflow-y-auto py-4 scrollbar-card">
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
          {section.items.map((item) => {
            const illustratedUrl = iconUrls[item.featureKey]
            // Tier-locking: during beta useCanAccess returns true for all.
            // When tiers are enforced: mom sees greyed/blurred, others hidden.
            // For now, always show all items (beta behavior).
            const tierLocked = false // Will be: !useCanAccess(item.featureKey)
            const isMom = shell === 'mom'

            // Non-mom: hide tier-locked items entirely
            if (tierLocked && !isMom) return null

            return (
              <NavLink
                key={item.path}
                to={tierLocked ? '#' : item.path}
                title={collapsed ? `${item.label} — ${item.tooltip}` : item.tooltip}
                onClick={(e) => {
                  if (tierLocked) { e.preventDefault(); return }
                  setMobileOpen(false)
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-colors ${
                    isActive && !tierLocked ? 'font-medium' : ''
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive && !tierLocked ? 'var(--surface-primary, var(--color-bg-secondary))' : 'transparent',
                  color: tierLocked
                    ? 'var(--color-text-secondary)'
                    : isActive ? 'var(--color-text-heading)' : 'var(--color-text-primary)',
                  borderRight: isActive && !tierLocked ? '3px solid var(--surface-primary, var(--color-btn-primary-bg))' : '3px solid transparent',
                  opacity: tierLocked ? 0.45 : 1,
                  filter: tierLocked ? 'blur(0.5px)' : 'none',
                  cursor: tierLocked ? 'not-allowed' : 'pointer',
                })}
              >
                {illustratedUrl ? (
                  <img src={illustratedUrl} alt="" width={26} height={26} className="shrink-0 rounded-sm" style={tierLocked ? { filter: 'grayscale(1)' } : undefined} />
                ) : (
                  item.icon
                )}
                {!collapsed && (
                  <>
                    <span>{item.label}</span>
                    {tierLocked && <Lock size={12} className="ml-auto shrink-0" />}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      ))}
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
            {shell === 'mom' && <ViewAsSwitcher />}
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
