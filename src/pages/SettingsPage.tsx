/**
 * Settings Page — Light implementation for Vibeathon demo
 *
 * Route: /settings
 * Sections: Profile, Appearance, Family Members & PINs, Lantern's Path
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Palette, Users, Map, Moon, Sun, Sparkles, Eye, EyeOff, RotateCcw, ChevronLeft } from 'lucide-react'
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
    <div className="max-w-2xl mx-auto pb-12 space-y-6">
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
          0%, 100% { box-shadow: 0 0 8px rgba(214, 164, 97, 0.3); border-color: #D6A461; }
          50% { box-shadow: 0 0 20px rgba(214, 164, 97, 0.6); border-color: #E8C177; }
        }
      `}</style>
      <div
        className="rounded-xl p-5"
        style={{
          background: 'var(--color-bg-card)',
          border: '2px solid #D6A461',
          animation: 'goldShimmer 3s ease-in-out infinite',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Map size={20} style={{ color: '#D6A461' }} />
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
              backgroundColor: '#D6A461',
              color: '#fff',
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

      {/* Family Members & PINs (Mom only) */}
      {shell === 'mom' && (
        <SettingsSection title="Family Members" icon={Users}>
          <FamilyMembersSection familyId={family?.id} />
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

// ── Profile Section ──────────────────────────────────────────────

function ProfileSection({ member }: { member: any }) {
  if (!member) return <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Avatar */}
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
  const { theme, setColorMode, effectiveColorMode, gradientEnabled, setGradientEnabled } = useTheme()
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

// ── Family Members Section ───────────────────────────────────────

function FamilyMembersSection({ familyId }: { familyId?: string }) {
  const [members, setMembers] = useState<any[]>([])
  const [revealedPin, setRevealedPin] = useState<string | null>(null)

  useEffect(() => {
    if (!familyId) return
    supabase
      .from('family_members')
      .select('id, display_name, role, auth_method, is_active')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('created_at')
      .then(({ data }) => {
        if (data) setMembers(data)
      })
  }, [familyId])

  // Auto-hide PIN after 5 seconds
  useEffect(() => {
    if (!revealedPin) return
    const timer = setTimeout(() => setRevealedPin(null), 5000)
    return () => clearTimeout(timer)
  }, [revealedPin])

  if (!familyId) return null

  return (
    <div className="space-y-2">
      {members.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-3 p-2 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
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
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {m.role === 'primary_parent' ? 'Mom' : m.role === 'additional_adult' ? 'Adult' : m.role}
              {m.auth_method ? ` · ${m.auth_method}` : ''}
            </p>
          </div>
          {m.role !== 'primary_parent' && (
            <button
              onClick={() => setRevealedPin(revealedPin === m.id ? null : m.id)}
              className="p-1.5 rounded-lg text-xs flex items-center gap-1"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                minHeight: 'unset',
              }}
            >
              {revealedPin === m.id ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden sm:inline">{revealedPin === m.id ? 'Hide' : 'PIN'}</span>
            </button>
          )}
        </div>
      ))}
      {members.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No family members found.
        </p>
      )}
    </div>
  )
}
