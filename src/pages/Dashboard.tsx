import { useAuth } from '@/hooks/useAuth'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { LogOut } from 'lucide-react'

export function Dashboard() {
  const { signOut } = useAuth()
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()

  return (
    <div className="min-h-svh p-8" style={{ backgroundColor: 'var(--theme-background)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
              {member ? `Welcome, ${member.display_name}` : 'Welcome'}
            </h1>
            {family && (
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                {family.family_name}
              </p>
            )}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
            style={{
              backgroundColor: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: 'var(--theme-surface)',
            border: '1px solid var(--theme-border)',
          }}
        >
          <p style={{ color: 'var(--theme-text)' }}>
            MyAIM Central — Phase 01 Complete
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--theme-text-muted)' }}>
            Role: {member?.role ?? 'loading...'} | Shell routing comes in Phase 04
          </p>
        </div>
      </div>
    </div>
  )
}
