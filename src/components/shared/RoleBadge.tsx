export interface RoleBadgeProps {
  role: 'primary_parent' | 'additional_adult' | 'special_adult' | 'member'
  size?: 'sm' | 'md'
}

const roleLabels: Record<RoleBadgeProps['role'], string> = {
  primary_parent: 'Mom',
  additional_adult: 'Adult',
  special_adult: 'Caregiver',
  member: 'Member',
}

export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses}`}
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        color: 'var(--color-text-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      {roleLabels[role]}
    </span>
  )
}
