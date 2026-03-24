import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Calendar, MessageCircle, MoreHorizontal, X, ChevronRight } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'

/**
 * Mobile-only bottom navigation bar (PRD-04).
 * 56px fixed at bottom. Hidden on md+ (desktop uses Sidebar).
 * "More" button opens a slide-up menu with full navigation.
 */

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
]

interface NavSection {
  title: string
  items: { path: string; label: string; description?: string }[]
}

const MORE_SECTIONS: NavSection[] = [
  {
    title: 'Personal Growth',
    items: [
      { path: '/guiding-stars', label: 'GuidingStars', description: 'Values & intentions' },
      { path: '/inner-workings', label: 'InnerWorkings', description: 'Self-knowledge' },
      { path: '/journal', label: 'Journal', description: 'Reflections & entries' },
      { path: '/victories', label: 'Victories', description: 'Celebrate wins' },
      { path: '/life-lantern', label: 'LifeLantern', description: 'Life assessment' },
    ],
  },
  {
    title: 'Family',
    items: [
      { path: '/family-hub', label: 'Family Hub', description: 'Shared coordination' },
      { path: '/family-members', label: 'Family Members', description: 'Manage your family' },
      { path: '/meetings', label: 'Meetings', description: 'Family meetings' },
      { path: '/family-feed', label: 'Family Feed', description: 'Moments & updates' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { path: '/lists', label: 'Lists', description: 'Checklists & references' },
      { path: '/notepad', label: 'Smart Notepad', description: 'Quick capture' },
      { path: '/vault', label: 'AI Vault', description: 'Browse & learn' },
      { path: '/bigplans', label: 'BigPlans', description: 'Project planning' },
      { path: '/thoughtsift', label: 'ThoughtSift', description: 'Decision tools' },
    ],
  },
]

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const { data: member } = useFamilyMember()

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
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]"
              style={{
                color: isActive ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          )
        })}

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
                      backgroundColor: 'var(--color-btn-primary-bg)',
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
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-full"
                style={{
                  color: 'var(--color-text-secondary)',
                  background: 'transparent',
                  minHeight: 'unset',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable sections */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80dvh - 56px)' }}>
              {MORE_SECTIONS.map((section) => (
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
                      <div className="flex-1">
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.description && (
                          <span
                            className="block text-xs"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {item.description}
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
