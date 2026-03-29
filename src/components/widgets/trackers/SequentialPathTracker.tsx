// PRD-10: Sequential Path tracker — ordered steps with unlock/complete states
// Visual variants: winding_path (default), mastery_path, staircase, skill_tree, map_journey

import { useMemo } from 'react'
import { Check, Lock, Trophy, Footprints } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

interface PathStep {
  label: string
  description?: string
}

const DEFAULT_STEPS: PathStep[] = [
  { label: 'Step 1', description: 'Getting started' },
  { label: 'Step 2', description: 'Building momentum' },
  { label: 'Step 3', description: 'Making progress' },
  { label: 'Step 4', description: 'Almost there' },
  { label: 'Step 5', description: 'The finish line' },
]

export function SequentialPathTracker({ widget, dataPoints, onRecordData, variant: _variant, isCompact }: TrackerProps) {
  const config = widget.widget_config as {
    steps?: PathStep[]
  }

  const steps = config.steps && config.steps.length > 0 ? config.steps : DEFAULT_STEPS

  const currentStep = useMemo(() => {
    return dataPoints.filter(dp => Number(dp.value) === 1).length
  }, [dataPoints])

  const isComplete = currentStep >= steps.length

  const handleCompleteStep = () => {
    if (currentStep < steps.length) {
      onRecordData?.(1, { step_index: currentStep })
    }
  }

  if (isCompact) {
    return (
      <div className="flex items-center gap-2 h-full w-full justify-center">
        <Footprints size={14} style={{ color: 'var(--color-accent)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
        </span>
        {/* Mini progress bar */}
        <div
          className="flex-1 max-w-[60px] h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--color-border-default)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(currentStep / steps.length) * 100}%`,
              background: 'var(--color-accent)',
            }}
          />
        </div>
      </div>
    )
  }

  // Full size: winding_path SVG variant
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          <Footprints size={14} />
          <span>
            {isComplete ? 'Complete!' : `Step ${currentStep + 1} of ${steps.length}`}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <WindingPath
          steps={steps}
          currentStep={currentStep}
          onCompleteStep={handleCompleteStep}
          hasRecordData={!!onRecordData}
        />
      </div>
    </div>
  )
}

// ── Winding Path SVG ──────────────────────────────────

function WindingPath({
  steps,
  currentStep,
  onCompleteStep,
  hasRecordData,
}: {
  steps: PathStep[]
  currentStep: number
  onCompleteStep: () => void
  hasRecordData: boolean
}) {
  const nodeRadius = 16
  const verticalSpacing = 56
  const svgWidth = 200
  const svgHeight = steps.length * verticalSpacing + nodeRadius * 2

  // Generate winding node positions
  const nodes = steps.map((step, i) => {
    const isEven = i % 2 === 0
    const x = isEven ? svgWidth * 0.35 : svgWidth * 0.65
    const y = nodeRadius + i * verticalSpacing
    return { x, y, step, index: i }
  })

  // Build path between nodes
  const pathSegments: string[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    const from = nodes[i]
    const to = nodes[i + 1]
    const midY = (from.y + to.y) / 2
    pathSegments.push(
      i === 0 ? `M ${from.x} ${from.y}` : '',
      `C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`
    )
  }
  const pathD = pathSegments.filter(Boolean).join(' ')

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{ maxHeight: svgHeight }}
    >
      {/* Background path line */}
      {nodes.length > 1 && (
        <path
          d={pathD}
          fill="none"
          stroke="var(--color-border-default)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}

      {/* Completed path overlay */}
      {currentStep > 0 && nodes.length > 1 && (
        <path
          d={pathD}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(currentStep / (steps.length - 1)) * 100}%`}
          className="transition-all duration-700"
        />
      )}

      {/* Nodes */}
      {nodes.map(({ x, y, step, index }) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isLocked = index > currentStep
        const isFinal = index === steps.length - 1

        return (
          <g key={index}>
            {/* Pulse animation for current step */}
            {isCurrent && (
              <circle
                cx={x}
                cy={y}
                r={nodeRadius + 4}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2"
                opacity="0.4"
              >
                <animate
                  attributeName="r"
                  values={`${nodeRadius + 2};${nodeRadius + 8};${nodeRadius + 2}`}
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.4;0.1;0.4"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Node circle */}
            <circle
              cx={x}
              cy={y}
              r={nodeRadius}
              fill={
                isCompleted
                  ? 'var(--color-accent)'
                  : isCurrent
                    ? 'var(--color-surface-secondary)'
                    : 'var(--color-surface-secondary)'
              }
              stroke={
                isCompleted || isCurrent
                  ? 'var(--color-accent)'
                  : 'var(--color-border-default)'
              }
              strokeWidth="2.5"
              style={{
                cursor: isCurrent && hasRecordData ? 'pointer' : 'default',
                opacity: isLocked ? 0.5 : 1,
              }}
              onClick={isCurrent && hasRecordData ? onCompleteStep : undefined}
            />

            {/* Node icon */}
            {isCompleted && (
              <Check
                x={x - 7}
                y={y - 7}
                size={14}
                style={{ color: 'var(--color-text-on-primary)' }}
              />
            )}
            {isCurrent && !isFinal && (
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="var(--color-accent)"
              >
                {index + 1}
              </text>
            )}
            {isLocked && !isFinal && (
              <Lock
                x={x - 6}
                y={y - 6}
                size={12}
                style={{ color: 'var(--color-text-secondary)' }}
              />
            )}
            {isFinal && !isCompleted && (
              <Trophy
                x={x - 7}
                y={y - 7}
                size={14}
                style={{ color: isLocked ? 'var(--color-text-secondary)' : 'var(--color-accent)' }}
              />
            )}
            {isFinal && isCompleted && (
              <Trophy
                x={x - 7}
                y={y - 7}
                size={14}
                style={{ color: 'var(--color-text-on-primary)' }}
              />
            )}

            {/* Step label */}
            <text
              x={index % 2 === 0 ? x + nodeRadius + 8 : x - nodeRadius - 8}
              y={y - 4}
              textAnchor={index % 2 === 0 ? 'start' : 'end'}
              fontSize="11"
              fontWeight="600"
              fill={
                isCompleted
                  ? 'var(--color-text-primary)'
                  : isCurrent
                    ? 'var(--color-accent)'
                    : 'var(--color-text-secondary)'
              }
              style={{ opacity: isLocked ? 0.5 : 1 }}
            >
              {step.label}
            </text>

            {/* Step description */}
            {step.description && (
              <text
                x={index % 2 === 0 ? x + nodeRadius + 8 : x - nodeRadius - 8}
                y={y + 10}
                textAnchor={index % 2 === 0 ? 'start' : 'end'}
                fontSize="9"
                fill="var(--color-text-secondary)"
                style={{ opacity: isLocked ? 0.4 : 0.7 }}
              >
                {step.description}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
