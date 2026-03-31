/**
 * TypeBadge — small uppercase label for extraction content types.
 */
import { FileText, Lightbulb, Flame, Zap, HelpCircle } from 'lucide-react'

type Variant = 'summary' | 'insight' | 'declaration' | 'action' | 'question'

const ICONS: Record<Variant, React.ElementType> = {
  summary: FileText,
  insight: Lightbulb,
  declaration: Flame,
  action: Zap,
  question: HelpCircle,
}

const COLORS: Record<Variant, string> = {
  summary: 'text-[var(--color-accent,#4a9a8a)]',
  insight: 'text-[var(--color-btn-primary-bg,#5b7bb5)]',
  declaration: 'text-[var(--color-accent-warm,#d4956a)]',
  action: 'text-[var(--color-success,#4a8a5c)]',
  question: 'text-[var(--color-accent-deep,#8b5ab5)]',
}

interface TypeBadgeProps {
  label: string
  variant: Variant
}

export function TypeBadge({ label, variant }: TypeBadgeProps) {
  const Icon = ICONS[variant]
  const color = COLORS[variant]

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  )
}
