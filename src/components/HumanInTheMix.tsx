import { Pencil, Check, RefreshCw, X } from 'lucide-react'
import { Tooltip } from '@/components/shared'

interface HumanInTheMixProps {
  onEdit: () => void
  onApprove: () => void
  onRegenerate: () => void
  onReject: () => void
  isLoading?: boolean
}

/**
 * Human-in-the-Mix wrapper for all AI-generated output.
 * Every AI output MUST present Edit / Approve / Regenerate / Reject
 * before persisting. No exceptions.
 */
export function HumanInTheMix({
  onEdit,
  onApprove,
  onRegenerate,
  onReject,
  isLoading = false,
}: HumanInTheMixProps) {
  return (
    <div
      className="flex items-center gap-2 pt-2 border-t mt-2"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <Tooltip content="Edit this response">
      <button
        onClick={onEdit}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
        }}
      >
        <Pencil size={12} />
        Edit
      </button>
      </Tooltip>
      <Tooltip content="Approve and save">
      <button
        onClick={onApprove}
        disabled={isLoading}
        className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
        style={{
          backgroundColor: 'var(--color-btn-primary-bg)',
          color: 'var(--color-btn-primary-text)',
        }}
      >
        <Check size={12} />
        Approve
      </button>
      </Tooltip>
      <Tooltip content="Generate a new response">
      <button
        onClick={onRegenerate}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
        }}
      >
        <RefreshCw size={12} />
        Regenerate
      </button>
      </Tooltip>
      <Tooltip content="Discard this response">
      <button
        onClick={onReject}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
        style={{
          color: 'var(--color-text-secondary)',
        }}
      >
        <X size={12} />
        Reject
      </button>
      </Tooltip>
    </div>
  )
}
