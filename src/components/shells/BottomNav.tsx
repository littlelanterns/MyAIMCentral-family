import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, CheckSquare, Library, Gem, MoreHorizontal, X, ChevronRight, Info } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useShell } from './ShellProvider'
import { useTheme } from '@/lib/theme'
import { getFeatureIcons } from '@/lib/assets'
import { getSidebarSections, type NavSection } from './Sidebar'

/**
 * Mobile-only bottom navigation bar (PRD-04).
 * 56px fixed at bottom. Hidden on md+ (desktop uses Sidebar).
 * Shell-aware: guided and play shells render their own nav — this component returns null for those.
 * "More" button opens a slide-up menu with full navigation.
 */

interface BottomNavItem {
  path: string
  icon: typeof Home
  label: string
  featureKey: string
}

// Left side items (before center notepad button)
const NAV_LEFT: BottomNavItem[] = [
  { path: '/dashboard', icon: Home, label: 'Home', featureKey: 'dashboard' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks', featureKey: 'tasks' },
]

// Right side items (after center notepad button)
const NAV_RIGHT: BottomNavItem[] = [
  { path: '/vault', icon: Gem, label: 'AI Vault', featureKey: 'vault_browse' },
]

// Combined for icon fetching
const NAV_ITEMS: BottomNavItem[] = [...NAV_LEFT, ...NAV_RIGHT]

/**
 * Set of paths already reachable from the bottom tab bar (Home, Tasks,
 * BookShelf, AI Vault). These are filtered out of the More menu so the
 * menu doesn't duplicate buttons that are one tap away.
 */
const BOTTOM_NAV_PATHS = new Set<string>(['/dashboard', '/tasks', '/bookshelf', '/vault'])

/** Batch-fetch illustrated icons for the bottom tab bar buttons */
function useBottomNavIcons() {
  const { vibe } = useTheme()
  const [iconUrls, setIconUrls] = useState<Record<string, string | null>>({})

  const allKeys = NAV_ITEMS.map(i => i.featureKey)
  const keysStr = allKeys.join(',')

  useEffect(() => {
    let cancelled = false
    getFeatureIcons(allKeys, vibe, 'A', 128).then(urls => {
      if (!cancelled) setIconUrls(urls)
    })
    return () => { cancelled = true }
  }, [vibe, keysStr])

  return iconUrls
}

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const [showDescriptions, setShowDescriptions] = useState(false)
  const location = useLocation()
  const { data: member } = useFamilyMember()
  const { shell } = useShell()
  const iconUrls = useBottomNavIcons()

  // Guided and play shells handle their own navigation
  if (shell === 'guided' || shell === 'play') return null

  // Mirror the desktop sidebar exactly — same sections, same items, same
  // order — and just drop anything already pinned to the bottom tab bar.
  // This is the only place the More menu structure should ever be defined.
  const moreSections: NavSection[] = getSidebarSections(shell)
    .map(section => ({
      ...section,
      items: section.items.filter(item => !BOTTOM_NAV_PATHS.has(item.path)),
    }))
    .filter(section => section.items.length > 0)

  const renderNavItem = (item: BottomNavItem) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    const illustratedUrl = iconUrls[item.featureKey]
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]"
        style={{
          color: isActive ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-text-secondary)',
          textDecoration: 'none',
          transition: 'color 0.2s ease',
        }}
      >
        {illustratedUrl ? (
          <img src={illustratedUrl} alt="" width={20} height={20} className="shrink-0 rounded-sm" />
        ) : (
          <item.icon size={20} />
        )}
        <span className="text-[10px] font-medium">{item.label}</span>
      </NavLink>
    )
  }

  return (
    <>
      {/* Bottom tab bar — mobile only */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch md:hidden"
        style={{
          height: '56px',
          backgroundColor: 'var(--color-bg-nav, var(--color-bg-card))',
          borderTop: '1px solid var(--color-border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Left items */}
        {NAV_LEFT.map(renderNavItem)}

        {/* Center: BookShelf — raised circle button */}
        <div className="flex-1 flex items-center justify-center" style={{ position: 'relative' }}>
          <NavLink
            to="/bookshelf"
            className="flex items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform"
            style={{
              width: '52px',
              height: '52px',
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text, #fff)',
              border: '3px solid var(--color-bg-nav, var(--color-bg-card))',
              position: 'absolute',
              top: '-14px',
              minHeight: 'unset',
              padding: 0,
              textDecoration: 'none',
            }}
            aria-label="Open BookShelf"
          >
            <Library size={22} />
          </NavLink>
          <span
            className="text-[10px] font-medium absolute"
            style={{ bottom: '2px', color: 'var(--color-text-secondary)' }}
          >
            BookShelf
          </span>
        </div>

        {/* Right items */}
        {NAV_RIGHT.map(renderNavItem)}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]"
          style={{
            color: moreOpen ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
            background: 'transparent',
            border: 'none',
            transition: 'color 0.2s ease',
          }}
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* More menu — slide-up overlay */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 md:hidden animate-fadeIn"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            onClick={() => setMoreOpen(false)}
          />

          {/* Menu */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            style={{
              maxHeight: '80dvh',
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: '16px 16px 0 0',
              overflow: 'hidden',
              animation: 'moreMenuSlideUp 200ms ease-out',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                {member && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{
                      background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                      color: 'var(--color-btn-primary-text)',
                    }}
                  >
                    {member.display_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-text-heading)' }}
                >
                  {member?.display_name || 'Menu'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowDescriptions((v) => !v)}
                  className="p-1.5 rounded-full"
                  title={showDescriptions ? 'Hide descriptions' : 'Show descriptions'}
                  style={{
                    color: showDescriptions ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                    backgroundColor: showDescriptions ? 'var(--color-bg-secondary)' : 'transparent',
                    border: 'none',
                    minHeight: 'unset',
                    transition: 'color 0.15s ease, background-color 0.15s ease',
                  }}
                >
                  <Info size={16} />
                </button>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-1.5 rounded-full"
                  style={{
                    color: 'var(--color-text-secondary)',
                    background: 'transparent',
                    border: 'none',
                    minHeight: 'unset',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable sections — mirrors the desktop sidebar */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80dvh - 56px)' }}>
              {moreSections.map((section) => (
                <div key={section.title} className="py-2">
                  <p
                    className="px-5 py-1 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--color-btn-primary-bg)', opacity: 0.7 }}
                  >
                    {section.title}
                  </p>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 px-5 py-2.5 min-h-[44px]"
                      style={({ isActive }) => ({
                        color: isActive ? 'var(--color-btn-primary-bg)' : 'var(--color-text-primary)',
                        backgroundColor: isActive ? 'var(--color-bg-secondary)' : 'transparent',
                        textDecoration: 'none',
                        transition: 'background-color 0.15s ease',
                      })}
                    >
                      <span className="shrink-0 flex items-center justify-center" style={{ width: 20, height: 20 }}>
                        {item.icon}
                      </span>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{item.label}</span>
                        {showDescriptions && item.tooltip && (
                          <span
                            className="block text-xs"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {item.tooltip}
                          </span>
                        )}
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
                    </NavLink>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Keyframe for slide-up animation */}
      <style>{`
        @keyframes moreMenuSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
