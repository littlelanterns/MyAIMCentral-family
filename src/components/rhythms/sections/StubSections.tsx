/**
 * PRD-18 — stub section components (remaining stubs after Phase C)
 *
 * These sections are scheduled to receive real implementations in
 * later phases. They either:
 *   (a) auto-hide (return null) when their data dependency isn't
 *       available yet — so the rhythm modal still feels complete
 *   (b) render a small placeholder card noting the upcoming feature
 *
 * Sections still stubbed:
 *   - MilestoneCelebrationsSection     — auto-hide (gamification dependency)
 *   - CarryForwardSection              — placeholder, off by default
 *   - BeforeCloseTheDaySection         — auto-hide
 *
 * Previously stubbed, now wired:
 *   - EveningTomorrowCaptureSection    → Phase B2
 *   - MorningPrioritiesRecallSection   → Phase B2
 *   - OnTheHorizonSection              → Phase B3
 *   - MindSweepLiteSection             → Phase C2
 *   - MorningInsightSection            → Phase C3
 *   - FeatureDiscoverySection          → Phase C3
 *   - RhythmTrackerPromptsSection      → Phase C4
 *
 * Each placeholder is intentionally compact — it preserves the section's
 * place in the rhythm narrative arc without dominating the experience.
 */

import { Lightbulb } from 'lucide-react'

// ─── Auto-hiding sections (return null until wired) ──────────

// NOTE: CompletedMeetingsSection was a Phase A stub. Phase E (Build P)
// wired the real component at
// src/components/rhythms/sections/CompletedMeetingsSection.tsx.

export function MilestoneCelebrationsSection(): null {
  // Phase A: gamification milestones not yet wired. Auto-hide.
  return null
}

export function BeforeCloseTheDaySection(): null {
  // Phase A: cross-feature pending aggregation not built. Auto-hide.
  return null
}

// ─── Placeholder sections (small upcoming-feature cards) ─────

interface PlaceholderProps {
  title: string
  description: string
  phase: 'B' | 'C' | 'D'
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
}

function StubPlaceholder({ title, description, phase, Icon }: PlaceholderProps) {
  return (
    <div
      className="rounded-xl p-4 opacity-70"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px dashed var(--color-border-subtle)',
      }}
    >
      <div className="flex items-start gap-2">
        <Icon size={16} style={{ color: 'var(--color-text-secondary)' }} />
        <div className="flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {title}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {description}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}
          >
            Phase {phase}
          </p>
        </div>
      </div>
    </div>
  )
}

// Carry Forward — preserved as a section type but OFF by default. When
// the user enables it, they'll see this placeholder. Phase B replaces
// it with the global fallback behavior + per-task triage.
export function CarryForwardSection() {
  return (
    <StubPlaceholder
      title="Carry Forward"
      description="Per-task triage. Enable in Rhythms Settings if you want a nightly review."
      phase="B"
      Icon={Lightbulb}
    />
  )
}

// NOTE: EveningTomorrowCaptureSection and MorningPrioritiesRecallSection
// were Phase A stubs. Phase B2 wired the real components at
// src/components/rhythms/sections/EveningTomorrowCaptureSection.tsx and
// src/components/rhythms/sections/MorningPrioritiesRecallSection.tsx.
//
// NOTE: OnTheHorizonSection was a Phase A stub. Phase B3 wired the
// real component at src/components/rhythms/sections/OnTheHorizonSection.tsx.
//
// NOTE: MindSweepLiteSection was a Phase A/B stub. Phase C2 wired the
// real component at src/components/rhythms/sections/MindSweepLiteSection.tsx.
//
// NOTE: MorningInsightSection + FeatureDiscoverySection were Phase B stubs.
// Phase C3 wires the real components.
//
// NOTE: RhythmTrackerPromptsSection was a Phase A/B stub. Phase C4 wires
// the real component at src/components/rhythms/sections/RhythmTrackerPromptsSection.tsx.
//
// NOTE: PeriodicCardsSlot was a Phase A stub. Phase B4 wired the real
// component at src/components/rhythms/sections/PeriodicCardsSlot.tsx.
