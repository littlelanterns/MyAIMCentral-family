import { NavLink, Outlet } from 'react-router-dom'

export interface AdminTab {
  label: string
  path: string
  /**
   * Future per-tab gating via `staff_permissions.permission_type`.
   * Undefined = any admin (hardcoded super or any staff_permissions row) sees it.
   * Minimum-scope build does not enforce per-tab gating.
   */
  permissionType?: string
}

/**
 * Admin Console tab registry. Minimum scope (SCOPE-2.F48 Wave 0) seeds
 * Approvals only. Wave 1B (Personas) and Wave 4 (COPPA) add rows here plus
 * matching <Route> entries under `/admin` in App.tsx.
 */
export const ADMIN_TABS: AdminTab[] = [
  { label: 'Approvals', path: '/admin/approvals' },
  { label: 'Personas', path: '/admin/personas', permissionType: 'persona_admin' },
]

export function AdminLayout() {
  return (
    <div
      className="min-h-svh"
      style={{
        backgroundColor: 'var(--theme-background)',
        color: 'var(--theme-text-primary)',
      }}
    >
      <header
        className="px-4 md:px-8 py-4 border-b"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">
          <div>
            <h1 className="text-lg md:text-xl font-semibold">Admin Console</h1>
            <p
              className="text-xs md:text-sm"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Platform management
            </p>
          </div>
          <NavLink
            to="/dashboard"
            className="text-sm underline-offset-2 hover:underline"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Back to app
          </NavLink>
        </div>

        <nav
          className="mt-4 max-w-6xl mx-auto flex gap-1 overflow-x-auto"
          role="tablist"
          aria-label="Admin sections"
        >
          {ADMIN_TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              role="tab"
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'btn-primary' : ''
                }`
              }
              style={({ isActive }) => ({
                color: isActive
                  ? 'var(--color-btn-primary-text)'
                  : 'var(--theme-text-primary)',
                border: isActive
                  ? '1px solid transparent'
                  : '1px solid var(--theme-border)',
              })}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
