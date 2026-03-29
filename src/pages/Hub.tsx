/**
 * HubPage — PRD-04 Tablet Hub Layout
 *
 * Standalone always-on family dashboard for shared devices.
 * No shell chrome — no sidebar, no QuickTasks, no LiLa drawer.
 * Member selection drawer on the left (hidden by default for privacy).
 * Widget grid with stub placeholders until PRD-10/PRD-14D.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, ChevronLeft, Users, Calendar, Target, Bell, Utensils, Trophy, Clock, Sparkles } from 'lucide-react'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useSettings } from '@/components/settings'

const WIDGET_STUBS = [
  { icon: Calendar, title: 'Family Calendar', description: 'Shared events and schedule at a glance.' },
  { icon: Target, title: 'Family Goals', description: 'Track family-level goals and progress together.' },
  { icon: Bell, title: 'Reminders', description: 'Upcoming deadlines and important dates.' },
  { icon: Utensils, title: 'Dinner Menu', description: "Tonight's dinner plan for the family." },
  { icon: Trophy, title: 'Family Progress', description: 'Collective achievements and milestones.' },
  { icon: Clock, title: 'Countdowns', description: 'Days until family events and celebrations.' },
]

export function HubPage() {
  const { data: family } = useFamily()
  const { data: member } = useFamilyMember()
  const { data: familyMembers } = useFamilyMembers(member?.family_id)
  const { openSettings } = useSettings()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Use family_login_name (more family-like) with family_name fallback
  const displayName = family?.family_login_name || family?.family_name || 'Family'

  return (
    <div
      className="density-compact min-h-svh flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Hub Header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-bg-card)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-full"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            title="Switch member"
          >
            <Users size={22} />
          </button>
          <h1
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            {displayName} Hub
          </h1>
        </div>
        <button
          onClick={openSettings}
          className="p-2 rounded-full"
          style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
          title="Hub settings"
        >
          <Settings size={22} />
        </button>
      </header>

      {/* Widget Grid — stub cards until PRD-10/PRD-14D */}
      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {WIDGET_STUBS.map((widget) => (
            <HubWidgetStub key={widget.title} icon={widget.icon} title={widget.title} description={widget.description} />
          ))}
        </div>
      </main>

      {/* Back to Dashboard link */}
      <div className="flex justify-center pb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm px-4 py-2 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Member Selection Drawer — left side, hidden by default for privacy */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex flex-col"
            style={{
              width: '280px',
              backgroundColor: 'var(--color-bg-card)',
              borderRight: '1px solid var(--color-border)',
              boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
              animation: 'hubDrawerSlide 200ms ease-out',
            }}
          >
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text-heading)' }}
              >
                Family Members
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
              >
                <ChevronLeft size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {familyMembers?.filter(m => m.is_active).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setDrawerOpen(false)
                    navigate('/dashboard')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left min-h-[48px]"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                    style={{
                      backgroundColor: 'var(--surface-primary, var(--color-btn-primary-bg))',
                      color: 'var(--color-btn-primary-text)',
                    }}
                  >
                    {m.display_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-medium block">{m.display_name}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {m.role === 'primary_parent' ? 'Mom' : m.role === 'additional_adult' ? 'Adult' : m.dashboard_mode || 'Member'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>
          <style>{`
            @keyframes hubDrawerSlide {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}
    </div>
  )
}

/** Simple stub card for hub widget placeholders */
function HubWidgetStub({ icon: Icon, title, description }: { icon: typeof Calendar; title: string; description: string }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px dashed var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <Icon size={20} style={{ color: 'var(--color-text-secondary)' }} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          {title}
        </h3>
      </div>
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {description}
      </p>
      <div className="flex items-center gap-1.5 mt-1">
        <Sparkles size={12} style={{ color: 'var(--color-victory, #d6a461)' }} />
        <span className="text-[10px] font-medium" style={{ color: 'var(--color-victory, #d6a461)' }}>
          Coming soon
        </span>
      </div>
    </div>
  )
}
