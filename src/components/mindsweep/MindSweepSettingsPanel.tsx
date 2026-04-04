/**
 * MindSweepSettingsPanel — PRD-17B Phase C
 * Extracted shared component used in both /sweep capture page and Settings page.
 */
import { useState } from 'react'
import { X, ChevronDown, ChevronUp, Mail, Copy, Trash2, Plus } from 'lucide-react'
import type { AggressivenessMode, AlwaysReviewRule, MindSweepSettings, MindSweepAllowedSender } from '@/types/mindsweep'

const MODE_OPTIONS: { key: AggressivenessMode; label: string; desc: string }[] = [
  { key: 'always_ask', label: 'Always Ask', desc: 'Sort and suggest, but I\'ll review everything in my Queue.' },
  { key: 'trust_obvious', label: 'Trust the Obvious', desc: 'Auto-route high-confidence items. Everything else goes to my Queue.' },
  { key: 'full_autopilot', label: 'Full Autopilot', desc: 'Handle high and medium confidence. Only flag low-confidence and sensitive content.' },
]

const REVIEW_RULES: { key: AlwaysReviewRule; label: string }[] = [
  { key: 'emotional_children', label: 'Emotional content about children' },
  { key: 'relationship_dynamics', label: 'Family relationship observations' },
  { key: 'behavioral_notes', label: 'Behavioral notes about family members' },
  { key: 'financial', label: 'Financial discussions' },
  { key: 'health_medical', label: 'Health / medical content' },
  { key: 'outside_people', label: 'Content mentioning people outside the family' },
]

export { MODE_OPTIONS }

interface MindSweepSettingsPanelProps {
  settings: MindSweepSettings | null | undefined
  onUpdate: (updates: Partial<MindSweepSettings>) => void
  onClose?: () => void
  /** When true, renders without the close button header (for embedding in Settings page) */
  embedded?: boolean
  /** Email forwarding config — only shown when provided (mom/settings page) */
  emailConfig?: {
    sweepEmail: string | null
    emailEnabled: boolean
    onToggleEmail: (enabled: boolean) => void
    allowedSenders: MindSweepAllowedSender[]
    onAddSender: (email: string) => void
    onRemoveSender: (id: string) => void
  }
}

export function MindSweepSettingsPanel({ settings, onUpdate, onClose, embedded, emailConfig }: MindSweepSettingsPanelProps) {
  const currentMode = settings?.aggressiveness || 'always_ask'
  const reviewRules: AlwaysReviewRule[] = settings?.always_review_rules || ['emotional_children', 'relationship_dynamics', 'behavioral_notes', 'financial']
  const highAccuracy = settings?.high_accuracy_voice ?? false
  const [expandedSection, setExpandedSection] = useState<string | null>('mode')

  function toggleSection(key: string) {
    setExpandedSection(expandedSection === key ? null : key)
  }

  return (
    <div
      className={embedded ? '' : 'border-b overflow-y-auto'}
      style={{
        borderColor: embedded ? undefined : 'var(--color-border)',
        backgroundColor: embedded ? undefined : 'var(--color-bg-secondary)',
        maxHeight: embedded ? undefined : '70vh',
      }}
    >
      {!embedded && (
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>MindSweep Settings</span>
          {onClose && (
            <button onClick={onClose} className="p-1" style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}>
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Section 1: Auto-sort mode */}
      <SettingsSection title="Auto-sort mode" sectionKey="mode" expanded={expandedSection} onToggle={toggleSection}>
        <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          How much should MindSweep handle on its own?
        </p>
        {MODE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => onUpdate({ aggressiveness: opt.key })}
            className="w-full text-left px-3 py-2 rounded-lg mb-1.5"
            style={{
              backgroundColor: currentMode === opt.key
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)'
                : 'var(--color-bg-primary)',
              border: currentMode === opt.key ? '1px solid var(--color-btn-primary-bg)' : '1px solid var(--color-border)',
              minHeight: 'unset',
            }}
          >
            <p className="text-xs font-medium" style={{
              color: currentMode === opt.key ? 'var(--color-btn-primary-bg)' : 'var(--color-text-primary)',
            }}>
              {currentMode === opt.key ? '\u25CF ' : '\u25CB '}{opt.label}
            </p>
            <p className="text-[11px] mt-0.5 ml-4" style={{ color: 'var(--color-text-secondary)' }}>{opt.desc}</p>
          </button>
        ))}
      </SettingsSection>

      {/* Section 2: Always review */}
      <SettingsSection title="Always review (regardless of mode)" sectionKey="review" expanded={expandedSection} onToggle={toggleSection}>
        {REVIEW_RULES.map(rule => {
          const checked = reviewRules.includes(rule.key)
          return (
            <label key={rule.key} className="flex items-start gap-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  const updated = checked
                    ? reviewRules.filter(r => r !== rule.key)
                    : [...reviewRules, rule.key]
                  onUpdate({ always_review_rules: updated })
                }}
                className="mt-0.5"
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{rule.label}</span>
            </label>
          )
        })}
      </SettingsSection>

      {/* Section 3: Voice */}
      <SettingsSection title="Voice" sectionKey="voice" expanded={expandedSection} onToggle={toggleSection}>
        <label className="flex items-center justify-between py-1 cursor-pointer">
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>High accuracy (all recordings)</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              {highAccuracy ? 'All recordings use premium transcription' : 'Short captures use free transcription'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={highAccuracy}
            onChange={() => onUpdate({ high_accuracy_voice: !highAccuracy })}
            className="ml-2"
            style={{ accentColor: 'var(--color-btn-primary-bg)' }}
          />
        </label>
      </SettingsSection>

      {/* Section 4: Document scanning info */}
      <SettingsSection title="Document scanning" sectionKey="scan" expanded={expandedSection} onToggle={toggleSection}>
        <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
          Scan extracts text from photos of flyers, bulletins, and screenshots.
          Images stay on your phone — MindSweep only keeps the information it reads.
        </p>
      </SettingsSection>

      {/* Section 5: Email forwarding (only when emailConfig provided) */}
      {emailConfig && (
        <EmailForwardingSection
          config={emailConfig}
          processImmediately={settings?.email_process_immediately ?? true}
          onUpdateProcessMode={(val) => onUpdate({ email_process_immediately: val })}
          expanded={expandedSection}
          onToggle={toggleSection}
        />
      )}

      {/* Section 6: Digest */}
      <SettingsSection title="Digest" sectionKey="digest" expanded={expandedSection} onToggle={toggleSection}>
        <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Include MindSweep summary in:
        </p>
        {([
          { key: 'digest_morning', label: 'Morning Rhythm' },
          { key: 'digest_evening', label: 'Evening Rhythm' },
          { key: 'digest_weekly', label: 'Weekly Review' },
        ] as const).map(d => {
          const checked = settings?.[d.key] ?? (d.key !== 'digest_weekly')
          return (
            <label key={d.key} className="flex items-center gap-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onUpdate({ [d.key]: !checked })}
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{d.label}</span>
            </label>
          )
        })}
      </SettingsSection>
    </div>
  )
}

// ── Email Forwarding Section ──

function EmailForwardingSection({ config, processImmediately, onUpdateProcessMode, expanded, onToggle }: {
  config: NonNullable<MindSweepSettingsPanelProps['emailConfig']>
  processImmediately: boolean
  onUpdateProcessMode: (val: boolean) => void
  expanded: string | null
  onToggle: (key: string) => void
}) {
  const [newSenderEmail, setNewSenderEmail] = useState('')
  const [copied, setCopied] = useState(false)

  function handleCopyEmail() {
    if (!config.sweepEmail) return
    navigator.clipboard.writeText(config.sweepEmail).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleAddSender() {
    const email = newSenderEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) return
    config.onAddSender(email)
    setNewSenderEmail('')
  }

  return (
    <SettingsSection title="Email forwarding" sectionKey="email" expanded={expanded} onToggle={onToggle}>
      {/* Sweep email address */}
      {config.sweepEmail ? (
        <div className="mb-3">
          <p className="text-[11px] mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Forward emails to this address to capture them in MindSweep:
          </p>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-mono truncate"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              {config.sweepEmail}
            </div>
            <button
              onClick={handleCopyEmail}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs shrink-0"
              style={{
                backgroundColor: copied ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)' : 'var(--color-bg-primary)',
                color: copied ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                minHeight: 'unset',
              }}
            >
              <Copy size={12} />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Enable/disable toggle */}
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <div className="flex items-center gap-1.5">
              <Mail size={12} style={{ color: 'var(--color-text-secondary)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>Email forwarding enabled</span>
            </div>
            <input
              type="checkbox"
              checked={config.emailEnabled}
              onChange={() => config.onToggleEmail(!config.emailEnabled)}
              style={{ accentColor: 'var(--color-btn-primary-bg)' }}
            />
          </label>
        </div>
      ) : (
        <div className="mb-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
          <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            Email forwarding will be available once your family's MindSweep email address is configured.
            This is coming soon.
          </p>
        </div>
      )}

      {/* Process mode */}
      <label className="flex items-center justify-between py-1 cursor-pointer mb-2">
        <div>
          <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>Process emails immediately</p>
          <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            {processImmediately ? 'Emails are auto-sorted on arrival' : 'Emails go to holding queue first'}
          </p>
        </div>
        <input
          type="checkbox"
          checked={processImmediately}
          onChange={() => onUpdateProcessMode(!processImmediately)}
          className="ml-2"
          style={{ accentColor: 'var(--color-btn-primary-bg)' }}
        />
      </label>

      {/* Allowed senders */}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[11px] font-medium mb-1.5" style={{ color: 'var(--color-text-heading)' }}>
          Allowed senders ({config.allowedSenders.length})
        </p>
        <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Only emails from these addresses will be accepted.
        </p>

        {config.allowedSenders.map(sender => (
          <div
            key={sender.id}
            className="flex items-center justify-between py-1.5 px-2 rounded mb-1"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
          >
            <span className="text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>
              {sender.email_address}
            </span>
            <button
              onClick={() => config.onRemoveSender(sender.id)}
              className="p-0.5 shrink-0 rounded opacity-50 hover:opacity-100"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}

        {/* Add sender */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <input
            type="email"
            value={newSenderEmail}
            onChange={(e) => setNewSenderEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 px-2 py-1.5 rounded text-xs outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSender() }}
          />
          <button
            onClick={handleAddSender}
            disabled={!newSenderEmail.trim().includes('@')}
            className="p-1.5 rounded disabled:opacity-30"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
              minHeight: 'unset',
            }}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </SettingsSection>
  )
}

// ── Collapsible Settings Section ──

function SettingsSection({ title, sectionKey, expanded, onToggle, children }: {
  title: string
  sectionKey: string
  expanded: string | null
  onToggle: (key: string) => void
  children: React.ReactNode
}) {
  const isOpen = expanded === sectionKey
  return (
    <div className="border-b" style={{ borderColor: 'var(--color-border)' }}>
      <button
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center justify-between px-4 py-2.5"
        style={{ background: 'transparent', color: 'var(--color-text-heading)', minHeight: 'unset' }}
      >
        <span className="text-xs font-medium">{title}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isOpen && (
        <div className="px-4 pb-3">
          {children}
        </div>
      )}
    </div>
  )
}
