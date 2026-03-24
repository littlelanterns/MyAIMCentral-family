import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useShell } from '@/components/shells/ShellProvider'
import { FeatureGuide } from '@/components/shared'
import { LogOut, Users, Star, BookOpen, CheckSquare, List, Brain, Sparkles } from 'lucide-react'

export function Dashboard() {
  const { signOut } = useAuth()
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: familyMembers } = useFamilyMembers(member?.family_id)
  const { shell } = useShell()
  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  })

  const otherMembers = familyMembers?.filter((m) => m.id !== member?.id) ?? []
  const hasFamily = otherMembers.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <FeatureGuide featureKey="dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            {greeting}, {member?.display_name ?? 'there'}
          </h1>
          {family && (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {family.family_name}
            </p>
          )}
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      {/* Family Setup Prompt — PRD-01: Shows when no other family members exist */}
      {member?.role === 'primary_parent' && !hasFamily && (
        <div
          className="p-5 rounded-xl border-2 border-dashed"
          style={{
            borderColor: 'var(--color-sage-teal, #68a395)',
            backgroundColor: 'var(--color-soft-sage, #d4e3d9)',
          }}
        >
          <div className="flex items-start gap-3">
            <Users size={24} style={{ color: 'var(--color-sage-teal, #68a395)' }} className="mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--color-warm-earth, #5a4033)' }}>
                Tell us about your family
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--color-warm-earth, #5a4033)', opacity: 0.7 }}>
                Describe your family in your own words, and we'll set up everyone's accounts.
                Or add members one at a time. Everything works without this — set up whenever you're ready.
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  to="/family-setup"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }}
                >
                  Set Up My Family
                </Link>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-warm-earth, #5a4033)',
                    opacity: 0.5,
                  }}
                >
                  I'll do this later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <NavCard to="/guiding-stars" icon={<Star size={20} />} label="Guiding Stars" color="var(--color-golden-honey, #d6a461)" />
        <NavCard to="/journal" icon={<BookOpen size={20} />} label="Journal" color="var(--color-sage-teal, #68a395)" />
        <NavCard to="/tasks" icon={<CheckSquare size={20} />} label="Tasks" color="var(--color-deep-ocean, #2c5d60)" />
        <NavCard to="/lists" icon={<List size={20} />} label="Lists" color="var(--color-dusty-rose, #d69a84)" />
        <NavCard to="/inner-workings" icon={<Brain size={20} />} label="InnerWorkings" color="var(--color-warm-earth, #5a4033)" />
        <NavCard to="/best-intentions" icon={<Sparkles size={20} />} label="Best Intentions" color="var(--color-soft-gold, #f4dcb7)" textColor="var(--color-warm-earth, #5a4033)" />
      </div>

      {/* Family Members Summary */}
      {hasFamily && (
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
              Family Members
            </h2>
            {member?.role === 'primary_parent' && (
              <Link
                to="/family-members"
                className="text-xs"
                style={{ color: 'var(--color-sage-teal, #68a395)' }}
              >
                Manage
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {otherMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                style={{
                  backgroundColor: (m.member_color || 'var(--color-sage-teal)') + '20',
                  color: 'var(--color-text-primary)',
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                  style={{ backgroundColor: m.member_color || 'var(--color-sage-teal)' }}
                >
                  {m.display_name.charAt(0)}
                </div>
                {m.display_name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NavCard({
  to,
  icon,
  label,
  color,
  textColor,
}: {
  to: string
  icon: React.ReactNode
  label: string
  color: string
  textColor?: string
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:translate-y-[-2px] hover:shadow-md"
      style={{
        backgroundColor: color + '15',
        border: `1px solid ${color}30`,
        color: textColor || color,
      }}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
