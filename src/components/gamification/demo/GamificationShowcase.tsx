/**
 * GamificationShowcase — PRD-24 visual test page
 *
 * Acceptance test surface for every component in the gamification module.
 * Lets you preview each animation across all 5 shells, with reduced-motion
 * toggleable, against the live theme tokens. If everything looks elegant on
 * this page across the matrix, the foundation is done.
 *
 * Mount at any route, e.g. `/dev/gamification` (handled in App.tsx).
 */

import { useRef, useState } from 'react'
import { Sparkles, Star, Gift, Trophy, Heart } from 'lucide-react'
import {
  // Foundation
  ShellMotionOverrideProvider,
  ReducedMotionOverrideProvider,
  RevealSparkle,
  RewardCard,
  // Reveals
  CardFlipReveal,
  ThreeDoorsReveal,
  SpinnerWheelReveal,
  ScratchOffReveal,
  // Celebrations
  PointsPopup,
  StreakFire,
  LevelUpBurst,
  BackgroundCelebration,
  // Widgets
  StarChartAnimation,
  TreasureBoxIdle,
  // Dashboard
  ReadabilityGradient,
} from '@/components/gamification'
import type { ShellType } from '@/lib/theme'

type ScratchTextureKey = 'gold_foil' | 'aged_parchment' | 'metallic_pixel' | 'sparkle_frost'

const SAMPLE_REWARD = {
  title: 'Extra Screen Time',
  description: '30 minutes of bonus screen time',
  pointValue: 25,
}

const SAMPLE_REWARD_BIG = {
  title: 'Movie Night Choice',
  description: 'You pick the family movie tonight',
  pointValue: 50,
}

const SHELLS: ShellType[] = ['mom', 'adult', 'independent', 'guided', 'play']

export function GamificationShowcase() {
  const [shellOverride, setShellOverride] = useState<ShellType>('mom')
  const [reducedMotion, setReducedMotion] = useState<boolean>(false)

  return (
    <ShellMotionOverrideProvider shell={shellOverride}>
      <ReducedMotionOverrideProvider value={reducedMotion}>
        <ShowcaseContent
          shellOverride={shellOverride}
          setShellOverride={setShellOverride}
          reducedMotion={reducedMotion}
          setReducedMotion={setReducedMotion}
        />
      </ReducedMotionOverrideProvider>
    </ShellMotionOverrideProvider>
  )
}

interface ShowcaseContentProps {
  shellOverride: ShellType
  setShellOverride: (s: ShellType) => void
  reducedMotion: boolean
  setReducedMotion: (b: boolean) => void
}

function ShowcaseContent({
  shellOverride,
  setShellOverride,
  reducedMotion,
  setReducedMotion,
}: ShowcaseContentProps) {
  // Active reveal flags
  const [activeReveal, setActiveReveal] = useState<
    null | 'cardflip' | 'threedoors' | 'spinner' | 'scratchoff'
  >(null)
  const [scratchTexture, setScratchTexture] = useState<ScratchTextureKey>('gold_foil')

  // Reward card preview
  const [showRewardCard, setShowRewardCard] = useState(false)

  // Sparkle previews
  const [sparkleMode, setSparkleMode] = useState<
    null | 'burst' | 'shower' | 'trail'
  >(null)
  const sparkleOriginRef = useRef<HTMLButtonElement | null>(null)
  const sparkleTargetRef = useRef<HTMLDivElement | null>(null)
  const [sparkleOrigin, setSparkleOrigin] = useState<{ x: number; y: number } | null>(null)
  const [sparkleTarget, setSparkleTarget] = useState<{ x: number; y: number } | null>(null)

  // Points popup
  const [pointsPopups, setPointsPopups] = useState<
    Array<{ id: number; x: number; y: number; points: number }>
  >([])
  const popupCounterRef = useRef(0)

  // Streak fire
  const [streak, setStreak] = useState(7)
  const [streakFlare, setStreakFlare] = useState(false)

  // Level up
  const [levelUpVisible, setLevelUpVisible] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(5)

  // Treasure box
  const [treasureState, setTreasureState] = useState<'locked' | 'unlocked' | 'transitioning'>('locked')
  const [treasureProgress, setTreasureProgress] = useState(40)

  // Star chart
  const [starChartActive, setStarChartActive] = useState(false)
  const [starChartComplete, setStarChartComplete] = useState(false)
  const starOriginRef = useRef<HTMLButtonElement | null>(null)
  const starTargetRef = useRef<HTMLDivElement | null>(null)
  const [starRects, setStarRects] = useState<{
    origin: DOMRect
    target: DOMRect
  } | null>(null)

  // Background celebration
  const [bgCeleb, setBgCeleb] = useState<{
    tier: 'small' | 'medium' | 'large'
    backgroundId: 'ocean' | 'space' | 'garden'
    nonce: number
  } | null>(null)

  // ─── Helpers ────────────────────────────────────────────────

  function triggerSparkle(mode: 'burst' | 'shower' | 'trail') {
    if (mode === 'trail') {
      const o = sparkleOriginRef.current?.getBoundingClientRect()
      const t = sparkleTargetRef.current?.getBoundingClientRect()
      if (o && t) {
        setSparkleOrigin({ x: o.x + o.width / 2, y: o.y + o.height / 2 })
        setSparkleTarget({ x: t.x + t.width / 2, y: t.y + t.height / 2 })
      }
    } else {
      setSparkleOrigin(null)
      setSparkleTarget(null)
    }
    setSparkleMode(mode)
  }

  function triggerPointsPopup(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const id = ++popupCounterRef.current
    const popup = {
      id,
      x: rect.x + rect.width / 2,
      y: rect.y,
      points: 10 + Math.floor(Math.random() * 20),
    }
    setPointsPopups((prev) => [...prev, popup])
  }

  function dismissPointsPopup(id: number) {
    setPointsPopups((prev) => prev.filter((p) => p.id !== id))
  }

  function triggerStreakFlare() {
    setStreak((s) => s + 1)
    setStreakFlare(true)
  }

  function triggerLevelUp() {
    setCurrentLevel((l) => l + 1)
    setLevelUpVisible(true)
  }

  function triggerTreasureUnlock() {
    setTreasureState('transitioning')
  }

  function triggerStarChart(complete: boolean) {
    const o = starOriginRef.current?.getBoundingClientRect()
    const t = starTargetRef.current?.getBoundingClientRect()
    if (o && t) {
      setStarRects({ origin: o, target: t })
      setStarChartComplete(complete)
      setStarChartActive(true)
    }
  }

  function triggerBgCelebration(
    tier: 'small' | 'medium' | 'large',
    backgroundId: 'ocean' | 'space' | 'garden',
  ) {
    setBgCeleb({ tier, backgroundId, nonce: Date.now() })
  }

  // ─── UI ─────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        padding: '2rem 1.5rem 6rem',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--color-text-heading)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <Sparkles size={28} color="var(--color-accent)" />
            Gamification Showcase
          </h1>
          <p
            style={{
              margin: '0.5rem 0 0',
              color: 'var(--color-text-secondary)',
              maxWidth: 640,
            }}
          >
            Visual test page for every component in the gamification module.
            Switch shells to see how each animation scales. Toggle reduced
            motion to verify fallbacks. The active theme is what users will
            see — components consume your live tokens.
          </p>
        </header>

        {/* Shell + reduced-motion controls */}
        <ControlBar
          shellOverride={shellOverride}
          setShellOverride={setShellOverride}
          reducedMotion={reducedMotion}
          setReducedMotion={setReducedMotion}
        />

        {/* SECTION: Reveals */}
        <Section title="1. Interactive Reveals" subtitle="Tap to choose your reward">
          <ButtonRow>
            <DemoButton onClick={() => setActiveReveal('cardflip')}>
              Card Flip
            </DemoButton>
            <DemoButton onClick={() => setActiveReveal('threedoors')}>
              Three Doors
            </DemoButton>
            <DemoButton onClick={() => setActiveReveal('spinner')}>
              Spinner Wheel
            </DemoButton>
            <DemoButton onClick={() => setActiveReveal('scratchoff')}>
              Scratch Off
            </DemoButton>
          </ButtonRow>
          <div style={{ marginTop: '0.75rem' }}>
            <Label>Scratch texture:</Label>
            <ButtonRow>
              {(['gold_foil', 'aged_parchment', 'metallic_pixel', 'sparkle_frost'] as const).map(
                (t) => (
                  <DemoButton
                    key={t}
                    active={scratchTexture === t}
                    onClick={() => setScratchTexture(t)}
                    small
                  >
                    {t.replace('_', ' ')}
                  </DemoButton>
                ),
              )}
            </ButtonRow>
          </div>
        </Section>

        {/* SECTION: Reward card */}
        <Section title="2. Reward Card (terminal display)">
          <ButtonRow>
            <DemoButton onClick={() => setShowRewardCard(true)}>
              Show Reward Card
            </DemoButton>
          </ButtonRow>
        </Section>

        {/* SECTION: Reveal sparkle */}
        <Section title="3. RevealSparkle particle system">
          <ButtonRow>
            <DemoButton
              ref={sparkleOriginRef}
              onClick={() => triggerSparkle('burst')}
            >
              Burst (theme accent)
            </DemoButton>
            <DemoButton onClick={() => triggerSparkle('shower')}>
              Shower
            </DemoButton>
            <DemoButton onClick={() => triggerSparkle('trail')}>
              Trail (origin → target)
            </DemoButton>
          </ButtonRow>
          <div
            ref={sparkleTargetRef}
            style={{
              marginTop: '1rem',
              padding: '1rem',
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--vibe-radius-card)',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              display: 'inline-block',
            }}
          >
            ← Trail target (drag finger here)
          </div>
        </Section>

        {/* SECTION: Micro-celebrations */}
        <Section title="4. Micro-celebrations">
          <ButtonRow>
            <DemoButton onClick={triggerPointsPopup}>+Points popup</DemoButton>
            <DemoButton onClick={triggerLevelUp}>Level up</DemoButton>
          </ButtonRow>
          <div style={{ marginTop: '1.5rem' }}>
            <Label>Streak:</Label>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                marginTop: '0.5rem',
              }}
            >
              <StreakFire
                streak={streak}
                flare={streakFlare}
                onFlareComplete={() => setStreakFlare(false)}
              />
              <DemoButton small onClick={triggerStreakFlare}>
                Increment streak
              </DemoButton>
              <DemoButton
                small
                onClick={() => {
                  setStreak(0)
                  setStreakFlare(false)
                }}
              >
                Reset
              </DemoButton>
            </div>
          </div>
        </Section>

        {/* SECTION: Treasure box widget */}
        <Section title="5. TreasureBox idle widget">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1.25rem',
              maxWidth: 720,
            }}
          >
            <WidgetTile label="Locked (40%)">
              <TreasureBoxIdle
                imageUrl="https://placehold.co/120x120/D4AF37/FFFFFF?text=Box"
                state="locked"
                progressPercent={40}
                progressLabel="4/10 tasks"
              />
            </WidgetTile>
            <WidgetTile label="Locked (90%)">
              <TreasureBoxIdle
                imageUrl="https://placehold.co/120x120/D4AF37/FFFFFF?text=Box"
                state="locked"
                progressPercent={90}
                progressLabel="9/10 tasks"
              />
            </WidgetTile>
            <WidgetTile label="Unlocked">
              <TreasureBoxIdle
                imageUrl="https://placehold.co/120x120/D4AF37/FFFFFF?text=Box"
                state="unlocked"
                progressPercent={100}
                onTap={() => alert('Treasure tapped!')}
              />
            </WidgetTile>
            <WidgetTile label="Transition demo">
              <TreasureBoxIdle
                imageUrl="https://placehold.co/120x120/D4AF37/FFFFFF?text=Box"
                state={treasureState}
                progressPercent={treasureProgress}
                progressLabel={`${Math.round(treasureProgress / 10)}/10`}
                onTransitionComplete={() => {
                  setTreasureState('unlocked')
                  setTreasureProgress(100)
                }}
                onTap={() => {
                  setTreasureState('locked')
                  setTreasureProgress(40)
                }}
              />
            </WidgetTile>
          </div>
          <ButtonRow style={{ marginTop: '1rem' }}>
            <DemoButton small onClick={triggerTreasureUnlock}>
              Trigger transition
            </DemoButton>
          </ButtonRow>
        </Section>

        {/* SECTION: Star chart */}
        <Section title="6. Star chart flight">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '2rem',
              maxWidth: 600,
              padding: '1rem',
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: 'var(--vibe-radius-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <button
              ref={starOriginRef}
              type="button"
              onClick={() => triggerStarChart(false)}
              style={demoButtonStyle(false)}
            >
              Complete task →
            </button>
            <div
              ref={starTargetRef}
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--vibe-radius-card)',
                border: '2px dashed var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Star size={28} />
            </div>
          </div>
          <ButtonRow style={{ marginTop: '0.75rem' }}>
            <DemoButton small onClick={() => triggerStarChart(true)}>
              Trigger w/ chart complete
            </DemoButton>
          </ButtonRow>
        </Section>

        {/* SECTION: Background celebrations */}
        <Section title="7. Background celebrations" subtitle="Periphery silhouettes — never crosses center 40%">
          {(['ocean', 'space', 'garden'] as const).map((bg) => (
            <div key={bg} style={{ marginBottom: '0.75rem' }}>
              <Label>{bg.charAt(0).toUpperCase() + bg.slice(1)}:</Label>
              <ButtonRow>
                {(['small', 'medium', 'large'] as const).map((tier) => (
                  <DemoButton
                    key={tier}
                    small
                    onClick={() => triggerBgCelebration(tier, bg)}
                  >
                    {tier}
                  </DemoButton>
                ))}
              </ButtonRow>
            </div>
          ))}
        </Section>

        {/* SECTION: Readability gradient */}
        <Section title="8. Readability gradient (dashboard layer)">
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 600,
              aspectRatio: '16 / 9',
              borderRadius: 'var(--vibe-radius-card)',
              overflow: 'hidden',
              backgroundImage:
                'linear-gradient(135deg, var(--color-accent) 0%, var(--color-btn-primary-bg) 50%, var(--color-bg-secondary) 100%)',
            }}
          >
            <ReadabilityGradient />
            <div
              style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                right: '1rem',
                color: 'var(--color-text-primary)',
                fontWeight: 600,
              }}
            >
              Dashboard content sits on top — gradient ensures legibility
            </div>
          </div>
        </Section>

        {/* SECTION: Theme preview */}
        <Section title="9. Active theme tokens">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.75rem',
              maxWidth: 720,
            }}
          >
            <TokenSwatch token="--color-accent" label="Accent" />
            <TokenSwatch token="--color-btn-primary-bg" label="Primary" />
            <TokenSwatch token="--color-bg-card" label="Card BG" />
            <TokenSwatch token="--color-bg-secondary" label="Secondary BG" />
            <TokenSwatch token="--color-sparkle-gold" label="Gold" />
            <TokenSwatch token="--color-text-heading" label="Heading" />
          </div>
        </Section>
      </div>

      {/* ─── Active overlays ──────────────────────────────────── */}

      {activeReveal === 'cardflip' && (
        <CardFlipReveal
          content={SAMPLE_REWARD}
          onDismiss={() => setActiveReveal(null)}
        />
      )}
      {activeReveal === 'threedoors' && (
        <ThreeDoorsReveal
          content={SAMPLE_REWARD_BIG}
          onDismiss={() => setActiveReveal(null)}
        />
      )}
      {activeReveal === 'spinner' && (
        <SpinnerWheelReveal
          content={SAMPLE_REWARD}
          segments={[
            { icon: <Star size={20} />, label: 'Star' },
            { icon: <Gift size={20} />, label: 'Gift' },
            { icon: <Trophy size={20} />, label: 'Trophy' },
            { icon: <Heart size={20} />, label: 'Heart' },
            { icon: <Sparkles size={20} />, label: 'Sparkles' },
            { icon: <Star size={20} />, label: 'Star' },
            { icon: <Gift size={20} />, label: 'Gift' },
            { icon: <Trophy size={20} />, label: 'Trophy' },
          ]}
          onDismiss={() => setActiveReveal(null)}
        />
      )}
      {activeReveal === 'scratchoff' && (
        <ScratchOffReveal
          content={SAMPLE_REWARD_BIG}
          texture={scratchTexture}
          onDismiss={() => setActiveReveal(null)}
        />
      )}

      {showRewardCard && (
        <RewardCard
          title={SAMPLE_REWARD.title}
          description={SAMPLE_REWARD.description}
          pointValue={SAMPLE_REWARD.pointValue}
          onDismiss={() => setShowRewardCard(false)}
          entryAnimation="expand"
        />
      )}

      {sparkleMode && (
        <RevealSparkle
          mode={sparkleMode}
          origin={sparkleOrigin ?? undefined}
          target={sparkleTarget ?? undefined}
          palette="accent"
          onComplete={() => setSparkleMode(null)}
        />
      )}

      {pointsPopups.map((p) => (
        <PointsPopup
          key={p.id}
          points={p.points}
          origin={{ x: p.x, y: p.y }}
          onComplete={() => dismissPointsPopup(p.id)}
        />
      ))}

      {levelUpVisible && (
        <LevelUpBurst
          newLevel={currentLevel}
          onComplete={() => setLevelUpVisible(false)}
        />
      )}

      {starChartActive && starRects && (
        <StarChartAnimation
          originRect={starRects.origin}
          targetSlotRect={starRects.target}
          isChartComplete={starChartComplete}
          starCount={starChartComplete ? 10 : 5}
          totalSlots={10}
          onFlightComplete={() => {
            if (!starChartComplete) {
              setStarChartActive(false)
              setStarRects(null)
            }
          }}
          onCelebrationComplete={() => {
            setStarChartActive(false)
            setStarRects(null)
          }}
        />
      )}

      {bgCeleb && (
        <BackgroundCelebration
          key={bgCeleb.nonce}
          tier={bgCeleb.tier}
          backgroundId={bgCeleb.backgroundId}
          onComplete={() => setBgCeleb(null)}
        />
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────

function ControlBar({
  shellOverride,
  setShellOverride,
  reducedMotion,
  setReducedMotion,
}: ShowcaseContentProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1rem',
        marginBottom: '2rem',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--vibe-radius-card)',
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Label>Shell:</Label>
        {SHELLS.map((s) => (
          <DemoButton
            key={s}
            small
            active={shellOverride === s}
            onClick={() => setShellOverride(s)}
          >
            {s}
          </DemoButton>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Label>Reduced motion:</Label>
        <DemoButton
          small
          active={!reducedMotion}
          onClick={() => setReducedMotion(false)}
        >
          OFF
        </DemoButton>
        <DemoButton
          small
          active={reducedMotion}
          onClick={() => setReducedMotion(true)}
        >
          ON
        </DemoButton>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2
        style={{
          margin: 0,
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-text-heading)',
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            margin: '0.25rem 0 0.75rem',
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem',
          }}
        >
          {subtitle}
        </p>
      )}
      <div style={{ marginTop: subtitle ? 0 : '0.75rem' }}>{children}</div>
    </section>
  )
}

function ButtonRow({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--color-text-secondary)',
      }}
    >
      {children}
    </span>
  )
}

interface DemoButtonProps {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  active?: boolean
  small?: boolean
}

const DemoButton = ((() => {
  const inner = (
    props: DemoButtonProps,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) => {
    const { children, onClick, active = false, small = false } = props
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        style={demoButtonStyle(active, small)}
      >
        {children}
      </button>
    )
  }
  return Object.assign(
    (props: DemoButtonProps & { ref?: React.ForwardedRef<HTMLButtonElement> }) =>
      inner(props, props.ref ?? null),
    {},
  )
})()) as React.FC<DemoButtonProps & { ref?: React.ForwardedRef<HTMLButtonElement> }>

function demoButtonStyle(active: boolean, small = false): React.CSSProperties {
  return {
    padding: small ? '0.375rem 0.75rem' : '0.625rem 1.125rem',
    fontSize: small ? '0.8125rem' : '0.9375rem',
    fontWeight: 600,
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--vibe-radius-input)',
    backgroundColor: active ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
    color: active ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    textTransform: 'capitalize',
  }
}

function WidgetTile({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1rem',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--vibe-radius-card)',
      }}
    >
      <div style={{ width: 140, height: 140, position: 'relative' }}>{children}</div>
      <Label>{label}</Label>
    </div>
  )
}

function TokenSwatch({ token, label }: { token: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
      }}
    >
      <div
        style={{
          height: 48,
          borderRadius: 'var(--vibe-radius-card)',
          backgroundColor: `var(${token})`,
          border: '1px solid var(--color-border)',
        }}
      />
      <Label>{label}</Label>
    </div>
  )
}
