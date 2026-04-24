import { Inbox } from 'lucide-react'

/**
 * Empty-state placeholder for the Admin Console approvals queue.
 *
 * Minimum-scope (SCOPE-2.F48 Wave 0): no queue logic. Mount point for
 * Wave 4 COPPA parental-consent approvals and Wave 1B Personas approvals.
 */
export function ApprovalsPlaceholder() {
  return (
    <div
      className="rounded-2xl p-8 md:p-12 text-center"
      style={{
        backgroundColor: 'var(--theme-surface)',
        border: '1px solid var(--theme-border)',
        color: 'var(--theme-text-primary)',
      }}
    >
      <div className="flex justify-center mb-4">
        <Inbox size={40} style={{ color: 'var(--theme-text-muted)' }} />
      </div>
      <h2 className="text-lg md:text-xl font-semibold mb-2">
        No pending approvals
      </h2>
      <p
        className="text-sm md:text-base max-w-md mx-auto"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        When something needs your review — parental-consent requests or
        community personas waiting for approval — it will show up here.
      </p>
    </div>
  )
}
