/**
 * Settings Page — Hub for all platform settings
 *
 * Route: /settings
 * Sections: Lantern's Path, Profile, Appearance, Family Management, Access & Security, Data
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User, Palette, Users, Map, Moon, Sun, Sparkles, RotateCcw, ChevronLeft,
  ChevronRight, Shield, Download, KeyRound, UserPlus, LogIn,
} from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useTheme } from '@/lib/theme'
import { supabase } from '@/lib/supabase/client'
import { useShell } from '@/components/shells/ShellProvider'

// ── Tour Reset Helper ────────────────────────────────────────────
const TOUR_STORAGE_KEY = 'myaim_intro_tour_dismissed'

export function SettingsPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { shell } = useShell()
  const navigate = useNavigate()

  return (
    <div className="density-tight max-w-2xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hidden md:flex"
          style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', minHeight: 'unset' }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          Settings
        </h1>
      </div>

      {/* Lantern's Path Card — TOP position, gold shimmer */}
      <style>{`
        @keyframes goldShimmer {
          0%, 100% { box-shadow: 0 0 8px rgba(214, 164, 97, 0.3); border-color: var(--color-accent, #D6A461); }
          50% { box-shadow: 0 0 20px rgba(214, 164, 97, 0.6); border-color: var(--color-accent, #E8C177); }
        }
      `}</style>
      <div
        className="rounded-xl p-5"
        style={{
          background: 'var(--color-bg-card)',
          border: '2px solid var(--color-accent, #D6A461)',
          animation: 'goldShimmer 3s ease-in-out infinite',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Map size={20} style={{ color: 'var(--color-accent, #D6A461)' }} />
          <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-heading)' }}>
            The Lantern's Path
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Your guide to every feature in MyAIM. Discover what's working now and what's coming next.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/lanterns-path"
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-accent, #D6A461)',
              color: 'var(--color-btn-primary-text, #fff)',
              border: 'none',
            }}
          >
            Open Guide
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem(TOUR_STORAGE_KEY)
              navigate('/dashboard')
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <RotateCcw size={14} />
            Take the Guided Tour
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <SettingsSection title="Profile" icon={User}>
        <ProfileSection member={member} />
      </SettingsSection>

      {/* Appearance Section */}
      <SettingsSection title="Appearance" icon={Palette}>
        <AppearanceSection />
      </SettingsSection>

      {/* Family Management (Mom only) */}
      {shell === 'mom' && (
        <SettingsSection title="Family Management" icon={Users}>
          <FamilyManagementSection familyId={family?.id} loginName={family?.family_login_name ?? undefined} />
        </SettingsSection>
      )}

      {/* Access & Security (Mom only) */}
      {shell === 'mom' && (
        <SettingsSection title="Access & Security" icon={Shield}>
          <SettingsNavRow
            icon={Shield}
            label="Permissions Hub"
            description="Configure who sees what for each family member"
            to="/permissions"
          />
        </SettingsSection>
      )}

      {/* Data & Privacy (Mom only) */}
      {shell === 'mom' && (
        <SettingsSection title="Data & Privacy" icon={Download}>
          <SettingsNavRow
            icon={Download}
            label="Export Family Data"
            description="Download your family's context and archives"
            to="/archives/export"
          />
        </SettingsSection>
      )}
    </div>
  )
}

// ── Section Wrapper ──────────────────────────────────────────────

function SettingsSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <Icon size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-heading)' }}>
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ── Navigation Row ──────────────────────────────────────────────

function SettingsNavRow({ icon: Icon, label, description, to }: {
  icon: React.ElementType
  label: string
  description: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-lg transition-colors"
      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)' }}
      >
        <Icon size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      </div>
      <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
    </Link>
  )
}

// ── Profile Section ──────────────────────────────────────────────

function ProfileSection({ member }: { member: any }) {
  if (!member) return <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {member.display_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
            {member.display_name}
          </p>
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
              color: 'var(--color-btn-primary-bg)',
            }}
          >
            {member.role === 'primary_parent' ? 'Mom' : member.role}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Appearance Section ───────────────────────────────────────────

function AppearanceSection() {
  const { theme, effectiveColorMode, gradientEnabled, setColorMode, setGradientEnabled } = useTheme()
  const isDark = effectiveColorMode === 'dark'

  return (
    <div className="space-y-4">
      {/* Current theme display */}
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Current Theme
        </p>
        <p className="text-sm font-medium capitalize" style={{ color: 'var(--color-text-heading)' }}>
          {theme.replace(/_/g, ' ')}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          Use the palette icon in the top bar to browse all 40+ themes
        </p>
      </div>

      {/* Dark mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDark ? <Moon size={16} style={{ color: 'var(--color-text-secondary)' }} /> : <Sun size={16} style={{ color: 'var(--color-text-secondary)' }} />}
          <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Dark Mode</span>
        </div>
        <ToggleSwitch checked={isDark} onChange={(v) => setColorMode(v ? 'dark' : 'light')} />
      </div>

      {/* Gradient toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Gradients</span>
        </div>
        <ToggleSwitch checked={gradientEnabled} onChange={setGradientEnabled} />
      </div>
    </div>
  )
}

// ── Toggle Switch ────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
      style={{
        backgroundColor: checked ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
        border: `1px solid ${checked ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
        minHeight: 'unset',
      }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full transition-transform"
        style={{
          backgroundColor: checked ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
          transform: checked ? 'translateX(22px)' : 'translateX(4px)',
        }}
      />
    </button>
  )
}

// ── Family Management Section ───────────────────────────────────

function FamilyManagementSection({ familyId, loginName }: { familyId?: string; loginName?: string }) {
  const [members, setMembers] = useState<any[]>([])

  useEffect(() => {
    if (!familyId) return
    supabase
      .from('family_members')
      .select('id, display_name, role, auth_method, is_active, date_of_birth')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) {
          const roleOrder: Record<string, number> = {
            primary_parent: 0, additional_adult: 1, special_adult: 2, member: 3,
          }
          data.sort((a, b) => {
            const ra = roleOrder[a.role] ?? 9
            const rb = roleOrder[b.role] ?? 9
            if (ra !== rb) return ra - rb
            // Within same role group, oldest first (earliest DOB)
            if (a.date_of_birth && b.date_of_birth) return a.date_of_birth.localeCompare(b.date_of_birth)
            if (a.date_of_birth) return -1
            if (b.date_of_birth) return 1
            return 0
          })
          setMembers(data)
        }
      })
  }, [familyId])

  if (!familyId) return null

  return (
    <div className="space-y-3">
      {/* Quick member overview */}
      <div className="space-y-1.5">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              {m.display_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {m.display_name}
              </p>
            </div>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {m.role === 'primary_parent' ? 'Mom' : m.role === 'additional_adult' ? 'Adult' : m.role === 'special_adult' ? 'Special Adult' : 'Member'}
              {m.auth_method ? ` · ${m.auth_method}` : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Navigation links */}
      <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <SettingsNavRow
          icon={KeyRound}
          label="Manage Members & PINs"
          description="Edit details, set PINs, send invites"
          to="/family-members"
        />
        <SettingsNavRow
          icon={UserPlus}
          label="Add Family Members"
          description="Add new members with AI-assisted setup"
          to="/family-setup"
        />
        <SettingsNavRow
          icon={LogIn}
          label="Family Login Name"
          description={loginName ? `Current: ${loginName}` : 'Set your family login name'}
          to="/family-login-name"
        />
      </div>
    </div>
  )
}
