import { useAuth } from '@/hooks/useAuth'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useShell } from '@/components/shells/ShellProvider'
import { LogOut } from 'lucide-react'

export function Dashboard() {
  const { signOut } = useAuth()
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { shell } = useShell()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            {member ? `Welcome, ${member.display_name}` : 'Welcome'}
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

      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        <p style={{ color: 'var(--color-text-primary)' }}>
          MyAIM Central — Dashboard
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Role: {member?.role ?? 'loading...'} | Shell: {shell}
        </p>
      </div>
    </div>
  )
}
