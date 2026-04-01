/**
 * Reflections Page (PRD-18 — Reflections portion)
 *
 * Daily reflection prompts — 32 defaults per member, lazy-seeded on first visit.
 * Three tabs: Today (answer questions), Past (history), Manage (curate prompts).
 * Answers auto-route to Journal as entry_type='reflection'.
 */

import { useState } from 'react'
import { BookHeart, Eye } from 'lucide-react'
import { FeatureGuide } from '@/components/shared'
import { FeatureIcon } from '@/components/shared'
import { Tooltip } from '@/components/shared'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useShell } from '@/components/shells/ShellProvider'
import { ReflectionsTodayTab } from '@/components/reflections/ReflectionsTodayTab'
import { ReflectionsPastTab } from '@/components/reflections/ReflectionsPastTab'
import { ReflectionsManageTab } from '@/components/reflections/ReflectionsManageTab'

type TabKey = 'today' | 'past' | 'manage'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'past', label: 'Past' },
  { key: 'manage', label: 'Manage' },
]

export function ReflectionsPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { shell } = useShell()
  const [activeTab, setActiveTab] = useState<TabKey>('today')

  const familyId = family?.id
  const memberId = member?.id
  const showTransparency = shell === 'independent'

  if (!familyId || !memberId) {
    return <p className="p-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
  }

  return (
    <div className="density-comfortable max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FeatureIcon
            featureKey="reflections"
            fallback={<BookHeart size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />}
            size={40}
            className="!w-10 !h-10 md:!w-36 md:!h-36"
            assetSize={512}
          />
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
            >
              Reflections
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Daily questions for thoughtful reflection
            </p>
          </div>
        </div>

        {/* Transparency indicator for teens */}
        {showTransparency && (
          <Tooltip content="Your parent can see your reflections">
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Eye size={14} />
              Visible to parent
            </span>
          </Tooltip>
        )}
      </div>

      {/* FeatureGuide */}
      <FeatureGuide featureKey="reflections" />

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 text-sm font-medium rounded-md transition-all"
            style={{
              background: activeTab === tab.key
                ? 'var(--surface-primary, var(--color-btn-primary-bg))'
                : 'transparent',
              color: activeTab === tab.key
                ? 'var(--color-btn-primary-text)'
                : 'var(--color-text-secondary)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'today' && (
        <ReflectionsTodayTab familyId={familyId} memberId={memberId} />
      )}
      {activeTab === 'past' && (
        <ReflectionsPastTab memberId={memberId} />
      )}
      {activeTab === 'manage' && (
        <ReflectionsManageTab familyId={familyId} memberId={memberId} />
      )}
    </div>
  )
}
