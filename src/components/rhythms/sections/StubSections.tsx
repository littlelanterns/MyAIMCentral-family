/**
 * PRD-18 Phase A — stub section components
 *
 * These sections are scheduled to receive real implementations in
 * later phases. In Phase A they either:
 *   (a) auto-hide (return null) when their data dependency isn't
 *       available yet — so the rhythm modal still feels complete
 *   (b) render a small placeholder card noting the upcoming feature
 *
 * Sections covered here:
 *   - CompletedMeetingsSection         — auto-hide (PRD-16 dependency)
 *   - MilestoneCelebrationsSection     — auto-hide (gamification dependency)
 *   - CarryForwardSection              — placeholder, off by default
 *   - BeforeCloseTheDaySection         — auto-hide
 *   - RhythmTrackerPromptsSection      — auto-hide (Phase C wiring)
 *   - EveningTomorrowCaptureSection    — Phase B placeholder
 *   - MindSweepLiteSection             — Phase C placeholder
 *   - MorningPrioritiesRecallSection   — Phase B placeholder
 *   - OnTheHorizonSection              — Phase B placeholder
 *   - MorningInsightSection            — Phase C placeholder
 *   - FeatureDiscoverySection          — Phase C placeholder
 *
 * Each placeholder is intentionally compact — it preserves the section's
 * place in the rhythm narrative arc without dominating the experience.
 */

import { Brain, Lightbulb, Sparkles, Telescope, Wand2 } from 'lucide-react'

// ─── Auto-hiding sections (return null until wired) ──────────

export function CompletedMeetingsSection(): null {
  // Phase A: PRD-16 not built. Auto-hide.
  return null
}

export function MilestoneCelebrationsSection(): null {
  // Phase A: gamification milestones not yet wired. Auto-hide.
  return null
}

export function BeforeCloseTheDaySection(): null {
  // Phase A: cross-feature pending aggregation not built. Auto-hide.
  return null
}

export function RhythmTrackerPromptsSection(): null {
  // Phase A: dashboard_widgets.config.rhythm_keys not yet implemented (Phase C).
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

// Tomorrow Capture (Enhancement 1) — Phase B replaces this with the
// rotating prompts + fuzzy task matching + ADHD overflow handling.
export function EveningTomorrowCaptureSection() {
  return (
    <StubPlaceholder
      title="Tomorrow"
      description="Conversational tomorrow capture with fuzzy task matching is coming."
      phase="B"
      Icon={Sparkles}
    />
  )
}

// MindSweep-Lite (Enhancement 2) — Phase C replaces with Haiku
// disposition classification.
export function MindSweepLiteSection() {
  return (
    <StubPlaceholder
      title="Something on your mind?"
      description="Brain dump with auto-sort dispositions is coming."
      phase="C"
      Icon={Wand2}
    />
  )
}

// Morning Priorities Recall (Enhancement 1) — Phase B reads previous
// evening's metadata.priority_items and shows them.
export function MorningPrioritiesRecallSection() {
  return (
    <StubPlaceholder
      title="Last night you said..."
      description="Your evening focus picks will appear here in the morning."
      phase="B"
      Icon={Sparkles}
    />
  )
}

// On the Horizon (Enhancement 8) — Phase B 7-day lookahead +
// Task Breaker integration.
export function OnTheHorizonSection() {
  return (
    <StubPlaceholder
      title="On the Horizon"
      description="Forward-looking 7-day awareness with Task Breaker is coming."
      phase="B"
      Icon={Telescope}
    />
  )
}

// Morning Insight (Enhancement 3) — Phase C BookShelf semantic pull.
export function MorningInsightSection() {
  return (
    <StubPlaceholder
      title="Something to think about"
      description="A daily growth question paired with passages from your library."
      phase="C"
      Icon={Brain}
    />
  )
}

// Feature Discovery (Enhancement 4) — Phase C activity-log-driven nudge.
export function FeatureDiscoverySection() {
  return (
    <StubPlaceholder
      title="Something new"
      description="Gentle 2-3x/week nudge toward useful features you haven't tried."
      phase="C"
      Icon={Sparkles}
    />
  )
}

// ─── Periodic rhythm placeholders (Phase B) ──────────────────

export function PeriodicCardsSlot(): null {
  // Phase A: weekly/monthly/quarterly cards aren't built yet.
  // Slot exists in default morning sections for Phase B to fill.
  return null
}
