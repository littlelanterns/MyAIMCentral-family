// PRD-11: Celebration Archive — past celebration narratives
import { BookOpen, Copy, Trash2 } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useCelebrationArchive, useDeleteCelebration } from '@/hooks/useCelebrationArchive'
import type { VictoryCelebration } from '@/types/victories'
import { todayLocalIso, localIsoDaysFromToday } from '@/utils/dates'

interface CelebrationArchiveProps {
  memberId: string
  onClose: () => void
}

function formatCelebrationDate(dateStr: string): string {
  // dateStr comes from DB as YYYY-MM-DD (DATE column) — compare as strings
  if (dateStr === todayLocalIso()) return 'Today'
  if (dateStr === localIsoDaysFromToday(-1)) return 'Yesterday'

  // Parse at noon local to avoid any DST/midnight boundary weirdness
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function CelebrationCard({ celebration, onDelete }: { celebration: VictoryCelebration; onDelete: () => void }) {
  const deleteMutation = useDeleteCelebration()

  function handleCopy() {
    navigator.clipboard.writeText(celebration.narrative)
  }

  function handleDelete() {
    if (confirm('Delete this celebration?')) {
      deleteMutation.mutate({ id: celebration.id, memberId: celebration.family_member_id })
      onDelete()
    }
  }

  const periodLabel = celebration.period
    ? { today: 'Daily', this_week: 'Weekly', this_month: 'Monthly', custom: 'Custom' }[celebration.period] || ''
    : ''

  return (
    <div
      className="rounded-lg p-4 mb-3"
      style={{
        background: 'var(--color-surface-secondary, var(--color-bg-secondary))',
        borderLeft: '3px solid var(--color-sparkle-gold, #D4AF37)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {formatCelebrationDate(celebration.created_at)}
          </span>
          {periodLabel && (
            <span className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 15%, transparent)',
                color: 'var(--color-sparkle-gold, #D4AF37)',
              }}>
              {periodLabel}
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          {celebration.victory_count} {celebration.victory_count === 1 ? 'victory' : 'victories'}
        </span>
      </div>

      <div className="mb-3">
        {celebration.narrative.split('\n\n').map((para, i) => (
          <p key={i} className="text-sm leading-relaxed mb-2 last:mb-0" style={{ color: 'var(--color-text-primary)' }}>
            {para}
          </p>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Copy size={12} />
          Copy
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  )
}

export function CelebrationArchive({ memberId, onClose }: CelebrationArchiveProps) {
  const { data: celebrations = [], isLoading } = useCelebrationArchive(memberId)

  return (
    <ModalV2
      id="celebration-archive"
      isOpen
      onClose={onClose}
      type="transient"
      size="lg"
      title="Past Celebrations"
      icon={BookOpen}
    >
      <div className="min-h-[200px]">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent"
              style={{ borderColor: 'var(--color-sparkle-gold, #D4AF37)', borderTopColor: 'transparent' }} />
          </div>
        ) : celebrations.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={32} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 12px' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No celebrations yet. Record some victories and tap "Celebrate This!" to create your first one.
            </p>
          </div>
        ) : (
          <div>
            {celebrations.map(c => (
              <CelebrationCard key={c.id} celebration={c} onDelete={() => {}} />
            ))}
          </div>
        )}
      </div>
    </ModalV2>
  )
}
