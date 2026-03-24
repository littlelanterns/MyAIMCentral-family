/**
 * Visual Timer Components (PRD-36)
 * Five animated SVG/CSS timer visualizations for the Play shell (kids).
 *
 * All colors use CSS custom properties from the AIMfM palette.
 * All animations respect prefers-reduced-motion.
 * No JavaScript animation loops — CSS @keyframes only.
 */

import React, { useId } from 'react'
import type { VisualTimerStyle } from './types'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

// Inline <style> tag — written once per component family via React's deduplication.
// We embed a single stylesheet at the bottom of this file and render it once.

// ---------------------------------------------------------------------------
// 1. SandTimer
// ---------------------------------------------------------------------------

interface SubTimerProps {
  progress: number  // 0 = start, 1 = complete
  size: number
  showNumbers: boolean
}

function SandTimer({ progress, size, showNumbers }: SubTimerProps) {
  const uid = useId().replace(/:/g, '')
  // Top half empties, bottom half fills.
  // progress=0 → top full, bottom empty
  // progress=1 → top empty, bottom full
  const half = size / 2
  const padding = size * 0.06
  const triW = size * 0.55
  const triH = half - padding * 2

  // Top triangle: apex at bottom-center of top half, base at top.
  // We clip it so that (1 - progress) of its height is visible from the apex up.
  const topFill = 1 - progress                   // 1→0 as time passes
  const topClipH = topFill * triH                // visible height in top
  const topClipY = triH - topClipH               // clip rect y offset inside triangle bbox

  // Bottom triangle: apex at top-center of bottom half, base at bottom.
  const bottomFill = progress                    // 0→1 as time passes
  const bottomClipH = bottomFill * triH

  // Center of canvas
  const cx = size / 2
  const topBaseY = padding
  const topApexY = half - padding

  const botApexY = half + padding
  const botBaseY = size - padding

  // Top triangle SVG path (isosceles, base at top)
  const topPath = `M ${cx - triW / 2} ${topBaseY} L ${cx + triW / 2} ${topBaseY} L ${cx} ${topApexY} Z`
  // Bottom triangle SVG path (isosceles, base at bottom)
  const botPath = `M ${cx} ${botApexY} L ${cx - triW / 2} ${botBaseY} L ${cx + triW / 2} ${botBaseY} Z`

  // Clip rect for top triangle: from topClipY, height topClipH (relative to top triangle bbox)
  const topClipRectY = topBaseY + topClipY
  const topClipRectH = topClipH

  // Clip rect for bottom triangle: from apex, height bottomClipH
  const botClipRectY = botApexY
  const botClipRectH = bottomClipH

  const clipTopId = `clip-sand-top-${uid}`
  const clipBotId = `clip-sand-bot-${uid}`

  // Grain particles: 6 small circles that animate falling from top-apex to bot-apex
  const grainCount = 6
  const grains = Array.from({ length: grainCount }, (_, i) => ({
    delay: i * (1 / grainCount),
    x: cx + (Math.sin(i * 137.5 * (Math.PI / 180)) * triW * 0.15),
  }))

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      aria-hidden="true"
      className="visual-timer-sand"
    >
      <defs>
        {/* Clip for top sand fill */}
        <clipPath id={clipTopId}>
          <rect
            x={cx - triW / 2}
            y={topClipRectY}
            width={triW}
            height={Math.max(0, topClipRectH)}
          />
        </clipPath>
        {/* Clip for bottom sand fill */}
        <clipPath id={clipBotId}>
          <rect
            x={cx - triW / 2}
            y={botClipRectY}
            width={triW}
            height={Math.max(0, botClipRectH)}
          />
        </clipPath>
      </defs>

      {/* Outline triangles (ghost) */}
      <path d={topPath} fill="none" stroke="var(--color-text-primary)" strokeWidth={size * 0.025} strokeOpacity={0.2} strokeLinejoin="round" />
      <path d={botPath} fill="none" stroke="var(--color-text-primary)" strokeWidth={size * 0.025} strokeOpacity={0.2} strokeLinejoin="round" />

      {/* Top filled sand */}
      <path d={topPath} fill="var(--color-golden-honey)" opacity={0.85} clipPath={`url(#${clipTopId})`} />

      {/* Bottom filled sand */}
      <path d={botPath} fill="var(--color-golden-honey)" opacity={0.85} clipPath={`url(#${clipBotId})`} />

      {/* Falling grain particles (CSS animated) */}
      {!reducedMotion && progress < 0.99 && grains.map((g, i) => (
        <circle
          key={i}
          cx={g.x}
          cy={topApexY}
          r={size * 0.022}
          fill="var(--color-golden-honey)"
          opacity={0.9}
          className="sand-grain"
          style={
            {
              '--grain-travel': `${botApexY - topApexY}px`,
              animationDelay: `${g.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Narrow neck line */}
      <line
        x1={cx - size * 0.04}
        y1={half}
        x2={cx + size * 0.04}
        y2={half}
        stroke="var(--color-text-primary)"
        strokeWidth={size * 0.02}
        strokeOpacity={0.35}
        strokeLinecap="round"
      />

      {/* Numbers */}
      {showNumbers && (
        <text
          x={cx}
          y={size - padding * 0.5}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize={size * 0.14}
          fill="var(--color-text-primary)"
          fontWeight="600"
          opacity={0.75}
        >
          {Math.round(progress * 100)}%
        </text>
      )}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// 2. Hourglass
// ---------------------------------------------------------------------------

function HourglassTimer({ progress, size, showNumbers }: SubTimerProps) {
  const uid = useId().replace(/:/g, '')
  const cx = size / 2
  const cy = size / 2

  // Classic hourglass SVG path using bezier curves for the waist
  const w = size * 0.44
  // h = size * 0.44 (reserved for future symmetric hourglass)
  const waist = size * 0.07
  const padTop = size * 0.05
  const capH = size * 0.04 // cap bar thickness

  // Top-left, top-right, waist-left, waist-right, bottom-left, bottom-right
  const tlx = cx - w / 2, tly = padTop
  const trx = cx + w / 2, try_ = padTop
  const wlx = cx - waist / 2, wly = cy
  const wrx = cx + waist / 2, wry = cy
  const blx = cx - w / 2, bly = size - padTop
  const brx = cx + w / 2, bry = size - padTop

  // Hourglass outline path (two triangular halves with curved waist)
  const outlinePath = [
    `M ${tlx} ${tly}`,
    `L ${trx} ${try_}`,
    `Q ${trx} ${cy * 0.6} ${wrx} ${wry}`,
    `Q ${brx} ${cy * 1.4} ${brx} ${bry}`,
    `L ${blx} ${bly}`,
    `Q ${blx} ${cy * 1.4} ${wlx} ${wly}`,
    `Q ${tlx} ${cy * 0.6} ${tlx} ${tly}`,
    'Z',
  ].join(' ')

  // Top cap
  const topCapPath = `M ${tlx} ${tly} L ${trx} ${try_} L ${trx} ${tly + capH} L ${tlx} ${tly + capH} Z`
  // Bottom cap
  const botCapPath = `M ${blx} ${bly - capH} L ${brx} ${bry - capH} L ${brx} ${bry} L ${blx} ${bly} Z`

  // Fill the top (decreasing) and bottom (increasing) halves
  const topFill = 1 - progress
  const botFill = progress

  const topFillClipId = `clip-hg-top-${uid}`
  const botFillClipId = `clip-hg-bot-${uid}`

  const topHalfHeight = cy - padTop
  const topClipH = topFill * topHalfHeight
  const topClipY = padTop + (topHalfHeight - topClipH)

  const botHalfHeight = (size - padTop) - cy
  const botClipH = botFill * botHalfHeight
  const botClipY = cy

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      aria-hidden="true"
      className="visual-timer-hourglass"
    >
      <defs>
        <clipPath id={topFillClipId}>
          <rect x={cx - w / 2} y={topClipY} width={w} height={Math.max(0, topClipH)} />
        </clipPath>
        <clipPath id={botFillClipId}>
          <rect x={cx - w / 2} y={botClipY} width={w} height={Math.max(0, botClipH)} />
        </clipPath>
      </defs>

      {/* Background ghost */}
      <path d={outlinePath} fill="var(--color-bg-card)" stroke="var(--color-text-primary)" strokeWidth={size * 0.022} strokeOpacity={0.25} />

      {/* Top half fill */}
      <path d={outlinePath} fill="var(--color-golden-honey)" opacity={0.8} clipPath={`url(#${topFillClipId})`} />

      {/* Bottom half fill */}
      <path d={outlinePath} fill="var(--color-golden-honey)" opacity={0.8} clipPath={`url(#${botFillClipId})`} />

      {/* Caps */}
      <path d={topCapPath} fill="var(--color-text-primary)" opacity={0.35} />
      <path d={botCapPath} fill="var(--color-text-primary)" opacity={0.35} />

      {/* Grain at waist */}
      {!reducedMotion && progress < 0.99 && (
        <circle
          cx={cx}
          cy={cy}
          r={size * 0.025}
          fill="var(--color-golden-honey)"
          className="hourglass-drip"
        />
      )}

      {showNumbers && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.13}
          fill="var(--color-text-primary)"
          fontWeight="700"
          opacity={0.8}
        >
          {Math.round(progress * 100)}%
        </text>
      )}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// 3. Thermometer
// ---------------------------------------------------------------------------

function ThermometerTimer({ progress, size, showNumbers }: SubTimerProps) {
  const uid = useId().replace(/:/g, '')
  const cx = size / 2

  // Dimensions
  const tubeW = size * 0.18
  const tubeR = tubeW / 2
  const bulbR = size * 0.15
  const bulbCy = size - bulbR - size * 0.03
  const tubeTop = size * 0.06
  const tubeBottom = bulbCy - bulbR + size * 0.03   // where tube meets bulb

  const tubeH = tubeBottom - tubeTop
  const fillH = progress * tubeH
  const fillY = tubeBottom - fillH

  // Color interpolation: cool → warm
  // We use a CSS gradient trick rather than JS color math
  const fillGradId = `thermo-fill-${uid}`

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      aria-hidden="true"
      className="visual-timer-thermometer"
    >
      <defs>
        <linearGradient id={fillGradId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--color-sage-teal)" />
          <stop offset="100%" stopColor="var(--color-golden-honey)" />
        </linearGradient>
      </defs>

      {/* Tube outline */}
      <rect
        x={cx - tubeR}
        y={tubeTop}
        width={tubeW}
        height={tubeH}
        rx={tubeR}
        ry={tubeR}
        fill="var(--color-bg-card)"
        stroke="var(--color-text-primary)"
        strokeWidth={size * 0.022}
        strokeOpacity={0.3}
      />

      {/* Tube fill */}
      {fillH > 0 && (
        <rect
          x={cx - tubeR + size * 0.025}
          y={fillY}
          width={tubeW - size * 0.05}
          height={fillH}
          rx={tubeR * 0.5}
          ry={tubeR * 0.5}
          fill={`url(#${fillGradId})`}
          opacity={0.9}
        />
      )}

      {/* Bulb */}
      <circle
        cx={cx}
        cy={bulbCy}
        r={bulbR}
        fill="var(--color-bg-card)"
        stroke="var(--color-text-primary)"
        strokeWidth={size * 0.022}
        strokeOpacity={0.3}
      />
      {/* Bulb fill (always colored — the mercury ball) */}
      <circle
        cx={cx}
        cy={bulbCy}
        r={bulbR * 0.78}
        fill={progress > 0.5 ? 'var(--color-golden-honey)' : 'var(--color-sage-teal)'}
        opacity={0.9}
      />

      {/* Tick marks on right side of tube */}
      {[0.25, 0.5, 0.75].map((tick, i) => {
        const tickY = tubeBottom - tick * tubeH
        return (
          <line
            key={i}
            x1={cx + tubeR + size * 0.01}
            y1={tickY}
            x2={cx + tubeR + size * 0.04}
            y2={tickY}
            stroke="var(--color-text-primary)"
            strokeWidth={size * 0.018}
            strokeOpacity={0.4}
            strokeLinecap="round"
          />
        )
      })}

      {showNumbers && (
        <text
          x={cx}
          y={tubeTop - size * 0.01}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize={size * 0.13}
          fill="var(--color-text-primary)"
          fontWeight="700"
          opacity={0.8}
        >
          {Math.round(progress * 100)}%
        </text>
      )}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// 4. Arc (circular progress ring)
// ---------------------------------------------------------------------------

function ArcTimer({ progress, size, showNumbers }: SubTimerProps) {
  const cx = size / 2
  const cy = size / 2
  const strokeWidth = size * 0.09
  const r = (size / 2) - strokeWidth / 2 - size * 0.03
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - progress)

  // Rotate so progress starts at top (12 o'clock)
  const startAngle = -90

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      aria-hidden="true"
      className="visual-timer-arc"
    >
      {/* Track ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-text-primary)"
        strokeWidth={strokeWidth}
        strokeOpacity={0.1}
      />

      {/* Progress ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-sage-teal)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(${startAngle} ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />

      {/* Inner decorative ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r - strokeWidth * 0.7}
        fill="none"
        stroke="var(--color-golden-honey)"
        strokeWidth={strokeWidth * 0.18}
        strokeOpacity={0.3}
      />

      {/* Dot at progress tip */}
      {progress > 0.01 && progress < 0.99 && (
        <circle
          cx={cx + r * Math.cos(((progress * 360 + startAngle) * Math.PI) / 180)}
          cy={cy + r * Math.sin(((progress * 360 + startAngle) * Math.PI) / 180)}
          r={strokeWidth * 0.55}
          fill="var(--color-golden-honey)"
          opacity={0.95}
        />
      )}

      {showNumbers && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.2}
          fill="var(--color-text-primary)"
          fontWeight="700"
          opacity={0.85}
        >
          {Math.round(progress * 100)}%
        </text>
      )}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// 5. FillingJar
// ---------------------------------------------------------------------------

function FillingJarTimer({ progress, size, showNumbers }: SubTimerProps) {
  const uid = useId().replace(/:/g, '')
  const cx = size / 2

  // Jar dimensions
  const jarW = size * 0.56
  const jarH = size * 0.66
  const jarX = cx - jarW / 2
  const jarTop = size * 0.08
  const jarBottom = jarTop + jarH
  const jarR = size * 0.07           // corner radius
  const lidH = size * 0.06
  const neckW = size * 0.44
  const neckH = size * 0.05

  // Lid rect
  const lidX = cx - neckW / 2 - size * 0.02
  const lidW = neckW + size * 0.04
  const lidY = jarTop - lidH

  // Neck (transition between lid and jar body)
  const neckX = cx - neckW / 2
  const neckY = jarTop

  // Fill
  const fillAreaH = jarH - size * 0.04   // slight bottom padding
  const fillH = progress * fillAreaH
  const fillY = jarBottom - size * 0.02 - fillH

  const jarClipId = `clip-jar-${uid}`
  const waveAnim = `wave-${uid}`

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Wave path at top of liquid: two complete cycles of a sine wave using SVG path
  // We'll use a rect for the fill body and a wavy path for the surface
  const waveAmplitude = size * 0.018
  const waveW = jarW * 2  // wider than jar so we can animate it sliding
  const wavePoints = 8

  function buildWavePath(yBase: number, xOffset: number): string {
    const segW = waveW / wavePoints
    let d = `M ${jarX - jarW + xOffset} ${yBase}`
    for (let i = 0; i <= wavePoints; i++) {
      const x = jarX - jarW + xOffset + i * segW
      const y = yBase + (i % 2 === 0 ? -waveAmplitude : waveAmplitude)
      if (i === 0) {
        d += ` L ${x} ${y}`
      } else {
        const prevX = jarX - jarW + xOffset + (i - 1) * segW
        const midX = (prevX + x) / 2
        d += ` Q ${midX} ${y} ${x} ${y}`
      }
    }
    d += ` L ${jarX + jarW} ${jarBottom} L ${jarX - jarW} ${jarBottom} Z`
    return d
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      aria-hidden="true"
      className="visual-timer-jar"
    >
      <defs>
        {/* Clip to jar interior */}
        <clipPath id={jarClipId}>
          <rect x={jarX + size * 0.02} y={neckY + size * 0.01} width={jarW - size * 0.04} height={jarH - size * 0.02} rx={jarR * 0.6} ry={jarR * 0.6} />
        </clipPath>
      </defs>

      {/* Jar body outline */}
      <rect
        x={jarX}
        y={jarTop}
        width={jarW}
        height={jarH}
        rx={jarR}
        ry={jarR}
        fill="var(--color-bg-card)"
        stroke="var(--color-text-primary)"
        strokeWidth={size * 0.022}
        strokeOpacity={0.3}
      />

      {/* Liquid fill body (static rect below wave) */}
      {fillH > waveAmplitude && (
        <rect
          x={jarX + size * 0.02}
          y={fillY + waveAmplitude}
          width={jarW - size * 0.04}
          height={fillH - waveAmplitude}
          fill="var(--color-sage-teal)"
          opacity={0.65}
          clipPath={`url(#${jarClipId})`}
        />
      )}

      {/* Wave surface */}
      {fillH > 0 && (
        <g clipPath={`url(#${jarClipId})`}>
          {/* Animated wave — two layers for depth */}
          <path
            d={buildWavePath(fillY, 0)}
            fill="var(--color-sage-teal)"
            opacity={0.65}
            className={reducedMotion ? undefined : 'jar-wave'}
            style={reducedMotion ? undefined : { animationName: waveAnim } as React.CSSProperties}
          />
          <path
            d={buildWavePath(fillY + waveAmplitude * 0.6, jarW * 0.3)}
            fill="var(--color-sage-teal)"
            opacity={0.35}
            className={reducedMotion ? undefined : 'jar-wave jar-wave--slow'}
            style={reducedMotion ? undefined : { animationName: waveAnim } as React.CSSProperties}
          />
        </g>
      )}

      {/* Jar shine highlight */}
      <rect
        x={jarX + jarW * 0.08}
        y={jarTop + jarH * 0.1}
        width={jarW * 0.08}
        height={jarH * 0.35}
        rx={size * 0.02}
        ry={size * 0.02}
        fill="white"
        opacity={0.18}
      />

      {/* Neck */}
      <rect
        x={neckX}
        y={neckY - neckH}
        width={neckW}
        height={neckH + size * 0.01}
        fill="var(--color-bg-card)"
        stroke="var(--color-text-primary)"
        strokeWidth={size * 0.022}
        strokeOpacity={0.3}
      />

      {/* Lid */}
      <rect
        x={lidX}
        y={lidY}
        width={lidW}
        height={lidH}
        rx={size * 0.025}
        ry={size * 0.025}
        fill="var(--color-bg-card)"
        stroke="var(--color-text-primary)"
        strokeWidth={size * 0.022}
        strokeOpacity={0.3}
      />
      {/* Lid band */}
      <rect
        x={lidX + size * 0.01}
        y={lidY + lidH * 0.35}
        width={lidW - size * 0.02}
        height={lidH * 0.3}
        rx={size * 0.01}
        ry={size * 0.01}
        fill="var(--color-golden-honey)"
        opacity={0.5}
      />

      {/* Knob on lid */}
      <circle
        cx={cx}
        cy={lidY - size * 0.02}
        r={size * 0.03}
        fill="var(--color-bg-card)"
        stroke="var(--color-text-primary)"
        strokeWidth={size * 0.02}
        strokeOpacity={0.3}
      />

      {showNumbers && (
        <text
          x={cx}
          y={jarBottom + size * 0.07}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.13}
          fill="var(--color-text-primary)"
          fontWeight="700"
          opacity={0.8}
        >
          {Math.round(progress * 100)}%
        </text>
      )}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// CSS Animations (injected once)
// ---------------------------------------------------------------------------

const VISUAL_TIMER_STYLES = `
  /* Sand grain falling animation */
  @keyframes sand-grain-fall {
    0%   { transform: translateY(0);      opacity: 1; }
    70%  { transform: translateY(var(--grain-travel, 20px)); opacity: 0.9; }
    100% { transform: translateY(var(--grain-travel, 20px)); opacity: 0; }
  }
  .sand-grain {
    animation: sand-grain-fall 0.9s linear infinite;
  }

  /* Hourglass drip pulse */
  @keyframes drip-pulse {
    0%, 100% { r: 2.5%; opacity: 0.9; }
    50%       { r: 3.5%; opacity: 0.5; }
  }
  .hourglass-drip {
    animation: drip-pulse 0.8s ease-in-out infinite;
  }

  /* Jar wave sliding */
  @keyframes jar-wave-slide {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .jar-wave {
    animation: jar-wave-slide 2.4s linear infinite;
  }
  .jar-wave--slow {
    animation-duration: 3.8s;
  }

  /* Respect prefers-reduced-motion */
  @media (prefers-reduced-motion: reduce) {
    .sand-grain,
    .hourglass-drip,
    .jar-wave,
    .jar-wave--slow {
      animation: none !important;
    }
  }
`

let stylesInjected = false
function ensureStyles() {
  if (typeof document === 'undefined' || stylesInjected) return
  const tag = document.createElement('style')
  tag.setAttribute('data-visual-timers', '1')
  tag.textContent = VISUAL_TIMER_STYLES
  document.head.appendChild(tag)
  stylesInjected = true
}

// ---------------------------------------------------------------------------
// Wrapper — VisualTimer
// ---------------------------------------------------------------------------

export interface VisualTimerProps {
  style: VisualTimerStyle
  /** 0 = start of period, 1 = period complete */
  progress: number
  /** Width & height in px (default 120) */
  size?: number
  /**
   * When true, show elapsed time / percentage in the timer.
   * Set false for Play shell kids mode.
   */
  showNumbers?: boolean
  className?: string
}

export function VisualTimer({
  style,
  progress,
  size = 120,
  showNumbers = true,
  className,
}: VisualTimerProps) {
  // Inject CSS once on first render
  React.useEffect(() => {
    ensureStyles()
  }, [])

  // Clamp progress to [0, 1]
  const p = Math.min(1, Math.max(0, progress))

  const props: SubTimerProps = { progress: p, size, showNumbers }

  let timer: React.ReactNode
  switch (style) {
    case 'sand_timer':
      timer = <SandTimer {...props} />
      break
    case 'hourglass':
      timer = <HourglassTimer {...props} />
      break
    case 'thermometer':
      timer = <ThermometerTimer {...props} />
      break
    case 'arc':
      timer = <ArcTimer {...props} />
      break
    case 'filling_jar':
      timer = <FillingJarTimer {...props} />
      break
    default:
      timer = <ArcTimer {...props} />
  }

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      role="img"
      aria-label={`Timer ${Math.round(p * 100)}% complete`}
    >
      {timer}
    </div>
  )
}

export default VisualTimer
