import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, CheckSquare, Library, Gem, MoreHorizontal, X, ChevronRight, Info } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useEffectiveShell } from '@/hooks/useEffectiveShell'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useViewAsNav } from '@/features/permissions/ViewAsModal'
import { useShowMyRewards } from '@/hooks/useShowMyRewards'
import { useResolvedFeatureAccess } from '@/hooks/useResolvedFeatureAccess'
import { useManagementGrants } from '@/lib/permissions/useManagementGrants'
import { useTheme } from '@/lib/theme'
import { getFeatureIcons } from '@/lib/assets'
import { getSidebarSections, type NavSection } from './Sidebar'

// `useShell` is intentionally not imported here — BottomNav derives its
// shell exclusively via `useEffectiveShell()` so the View-As modal
// renders the target's More menu. ShellProvider still drives shell for
// the outer shells. Convention #39.

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
  // FE-FOLLOWUP item 1 (2026-07-10): BottomNav is the mobile-only nav
  // for Independent/Adult/Mom (Sidebar covers desktop). Unlike Sidebar and
  // the Guided/Play shells' own bottom navs, it never forked on isViewingAs —
  // every tap called react-router's real NavLink, which changes the ACTUAL
  // browser location (the single app-wide <BrowserRouter> both the modal and
  // mom's page behind it share), while the modal's own `renderPage(currentPath)`
  // state never moved. Net effect on mobile View-As: tapping Tasks/AI Vault/
  // any More-menu item silently changed mom's real page behind the overlay
  // without updating what the overlay showed — found while building a
  // scroll-verification tour for a long Tasks list inside View-As, which
  // this bug made impossible to drive. Mirrors the exact fork already used
  // by Sidebar.tsx's SidebarNavItem and PlayShell/GuidedBottomNav's own nav.
  const { isViewingAs } = useViewAs()
  const { currentPath, navigate: viewAsNav } = useViewAsNav()
  // Auth user — drives the "member" pill at the top of the More menu
  // (whose avatar appears, etc.). Stays as the auth user even inside
  // View-As because the More menu header reflects the human at the
  // device, not the viewed target.
  const { data: member } = useFamilyMember()
  // Effective shell — drives WHICH sections render in the More menu.
  // Single source of truth in `useEffectiveShell()`. Convention #39.
  const shell = useEffectiveShell()
  // Effective member — drives the per-child My Rewards toggle in the
  // More menu, mirroring Sidebar.tsx exactly per Convention #16.
  const { member: effectiveMember } = useEffectiveMember()
  const showMyRewards = useShowMyRewards(effectiveMember?.id ?? null)
  // PERMISSIONS-WIRING (2026-06-09): same per-member toggles + management
  // grants as Sidebar.tsx — Convention #16 parity is automatic because both
  // navs pass identical options into getSidebarSections.
  const { isEnabled } = useResolvedFeatureAccess(effectiveMember)
  const grants = useManagementGrants(effectiveMember)
  const iconUrls = useBottomNavIcons()

  // Guided and play shells handle their own navigation
  if (shell === 'guided' || shell === 'play') return null

  const managementAccess =
    effectiveMember?.role === 'additional_adult'
      ? {
          studio: grants.studioLevel !== 'none',
          prizeBoard: grants.financeMaxLevel !== 'none',
          rewardRules: grants.rewardRulesLevel !== 'none',
        }
      : undefined

  // Mirror the desktop sidebar exactly — same sections, same items, same
  // order — and just drop anything already pinned to the bottom tab bar.
  // Convention #16: this is the only place the More menu structure should
  // ever be defined; both navs read from `getSidebarSections`.
  const moreSections: NavSection[] = getSidebarSections(shell, { showMyRewards, isFeatureEnabled: isEnabled, managementAccess })
    .map(section => ({
      ...section,
      items: section.items.filter(item => !BOTTOM_NAV_PATHS.has(item.path)),
    }))
    .filter(section => section.items.length > 0)

  const renderNavItem = (item: BottomNavItem) => {
    const isActive = isViewingAs
      ? currentPath.split('?')[0] === item.path
      : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
    const illustratedUrl = iconUrls[item.featureKey]
    const content = (
      <>
        {illustratedUrl ? (
          <img src={illustratedUrl} alt="" width={20} height={20} className="shrink-0 rounded-sm" />
        ) : (
          <item.icon size={20} />
        )}
        <span className="text-[10px] font-medium">{item.label}</span>
      </>
    )
    const sharedStyle = {
      color: isActive ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-text-secondary)',
      textDecoration: 'none',
      transition: 'color 0.2s ease',
    }
    if (isViewingAs) {
      return (
        <button
          key={item.path}
          type="button"
          onClick={() => viewAsNav(item.path)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]"
          style={{ ...sharedStyle, background: 'transparent', border: 'none' }}
        >
          {content}
        </button>
      )
    }
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]"
        style={sharedStyle}
      >
        {content}
      </NavLink>
    )
  }

  return (
    <>
      {/* Bottom tab bar — mobile only */}
      <nav
        data-testid="bottom-nav"
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
          {isViewingAs ? (
            <button
              type="button"
              onClick={() => viewAsNav('/bookshelf')}
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
              }}
              aria-label="Open BookShelf"
            >
              <Library size={22} />
            </button>
          ) : (
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
          )}
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
                  {section.items.map((item) => {
                    const moreItemIsActive = isViewingAs
                      ? currentPath.split('?')[0] === item.path
                      : location.pathname === item.path
                    const moreItemContent = (
                      <>
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
                      </>
                    )
                    if (isViewingAs) {
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => { viewAsNav(item.path); setMoreOpen(false) }}
                          className="flex items-center gap-3 px-5 py-2.5 min-h-[44px] w-full text-left"
                          style={{
                            color: moreItemIsActive ? 'var(--color-btn-primary-bg)' : 'var(--color-text-primary)',
                            backgroundColor: moreItemIsActive ? 'var(--color-bg-secondary)' : 'transparent',
                            border: 'none',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          {moreItemContent}
                        </button>
                      )
                    }
                    return (
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
                        {moreItemContent}
                      </NavLink>
                    )
                  })}
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
