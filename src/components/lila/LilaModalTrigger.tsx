import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useToolPermissions } from '@/hooks/useLila'
import { LilaModal } from './LilaModal'

/**
 * LiLa Modal Trigger — PRD-05
 * Button that launches a LiLa modal for non-mom members.
 * Only renders if the member has tool permission for this mode.
 * Used in Adult, Independent, and Guided shells.
 */

interface LilaModalTriggerProps {
  modeKey: string
  label?: string
  referenceId?: string
  className?: string
}

export function LilaModalTrigger({ modeKey, label, referenceId, className = '' }: LilaModalTriggerProps) {
  const { data: member } = useFamilyMember()
  const { data: permissions = [] } = useToolPermissions(member?.id)
  const [modalOpen, setModalOpen] = useState(false)

  // Check if member has permission for this tool
  const hasPermission = permissions.some(p => p.mode_key === modeKey && p.is_enabled)

  // During beta, all permissions are granted
  // The useCanAccess hook returns true for everything during beta
  // But we still check tool permissions for the UI
  if (!hasPermission && permissions.length > 0) return null

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${className}`}
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <MessageCircle size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
        {label || 'Talk to LiLa'}
      </button>

      {modalOpen && (
        <LilaModal
          modeKey={modeKey}
          referenceId={referenceId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
