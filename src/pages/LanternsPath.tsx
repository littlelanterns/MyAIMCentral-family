/**
 * The Lantern's Path — Full Feature Guide
 *
 * Route: /lanterns-path
 * Visual: Accordion stages with feature cards, status badges, sub-tool expansion.
 * Toggle: "Full Map" vs "What's Working Now"
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Star, Heart, Sparkles, FileText, BookOpen, CheckSquare, List, Archive,
  Feather, GraduationCap, Brain, Gem, Trophy, Sun, LayoutDashboard, Calendar,
  Users, Monitor, BarChart3, Gamepad2, MessageSquare, MessageCircle, Shield,
  Timer, Rocket, Rss, Compass, FileCheck, UserCheck, Wallet, ShieldAlert,
  BookCopy, ChevronDown, ChevronUp, ChevronRight, Map, Sparkle, Check,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { JOURNEY_STAGES, type JourneyStage, type JourneyFeature, type SubTool } from '@/data/lanterns-path-data'

// ── Icon Mapping ─────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Star, Heart, Sparkles, FileText, BookOpen, CheckSquare, List, Archive,
  Feather, GraduationCap, Brain, Gem, Trophy, Sun, LayoutDashboard, Calendar,
  Users, Monitor, BarChart3, Gamepad2, MessageSquare, MessageCircle, Shield,
  Timer, Rocket, Rss, Compass, FileCheck, UserCheck, Wallet, ShieldAlert,
  BookCopy,
}

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Star
}

// ── View Toggle ──────────────────────────────────────────────────

type ViewMode = 'full' | 'working'

// ── Main Page ────────────────────────────────────────────────────

export function LanternsPathPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('full')
  const [openStage, setOpenStage] = useState<number | null>(1)

  // Filter stages based on view mode
  const visibleStages = viewMode === 'full'
    ? JOURNEY_STAGES
    : JOURNEY_STAGES.filter(s => s.features.some(f => f.status === 'built')).map(s => ({
        ...s,
        features: s.features.filter(f => f.status === 'built'),
      }))

  return (
    <div className="density-comfortable max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div
        className="rounded-xl p-6 md:p-8 mb-6"
        style={{
          background: 'var(--surface-primary, var(--color-btn-primary-bg))',
          color: 'var(--color-btn-primary-text, #fff)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Map size={28} />
          <h1
            className="text-2xl md:text-3xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'inherit' }}
          >
            The Lantern's Path
          </h1>
        </div>
        <p className="text-sm md:text-base opacity-90" style={{ color: 'inherit' }}>
          Your guide to every feature in MyAIM — in the order that makes the journey meaningful.
        </p>
      </div>

      {/* Intro */}
      <div className="space-y-3 mb-6 px-1">
        <p style={{ color: 'var(--color-text-primary)' }}>
          MyAIM Family is built around one idea: help a mom, help everyone she holds. The tools here help you
          define what matters most, capture the chaos of daily life, turn intentions into action, invest in your
          relationships, and celebrate what actually got done — not what didn't.
        </p>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          You don't need to use everything at once. Start with Stage 1 — your values and self-knowledge — and
          let the rest fill in naturally as your family's needs reveal them. Features marked{' '}
          <StatusBadge status="built" inline /> are live and working right now. Features marked{' '}
          <StatusBadge status="in_production" inline /> are fully designed and being built.
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6 px-1">
        <button
          onClick={() => setViewMode('full')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: viewMode === 'full'
              ? 'var(--color-btn-primary-bg)'
              : 'var(--color-bg-secondary)',
            color: viewMode === 'full'
              ? 'var(--color-btn-primary-text)'
              : 'var(--color-text-primary)',
            border: 'none',
          }}
        >
          <Map size={16} />
          The Full Map
        </button>
        <button
          onClick={() => setViewMode('working')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: viewMode === 'working'
              ? 'var(--color-btn-primary-bg)'
              : 'var(--color-bg-secondary)',
            color: viewMode === 'working'
              ? 'var(--color-btn-primary-text)'
              : 'var(--color-text-primary)',
            border: 'none',
          }}
        >
          <Sparkle size={16} />
          What's Working Now
        </button>
      </div>

      {/* Accordion Stages */}
      <div className="space-y-3">
        {visibleStages.map((stage) => (
          <StageAccordion
            key={stage.number}
            stage={stage}
            isOpen={openStage === stage.number}
            onToggle={() => setOpenStage(openStage === stage.number ? null : stage.number)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Status Badge ─────────────────────────────────────────────────

function StatusBadge({ status, inline }: { status: 'built' | 'in_production'; inline?: boolean }) {
  if (status === 'built') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium rounded-full ${inline ? '' : 'px-2.5 py-0.5'}`}
        style={{
          backgroundColor: inline ? 'transparent' : 'color-mix(in srgb, var(--color-status-success) 15%, transparent)',
          color: 'var(--color-status-success)',
        }}
      >
        <Check size={12} /> Available Now
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium rounded-full ${inline ? '' : 'px-2.5 py-0.5'}`}
      style={{
        backgroundColor: inline ? 'transparent' : 'color-mix(in srgb, var(--color-status-warning) 15%, transparent)',
        color: 'var(--color-status-warning)',
      }}
    >
      <Sparkle size={12} /> In Production
    </span>
  )
}

// ── Stage Accordion ──────────────────────────────────────────────

function StageAccordion({ stage, isOpen, onToggle }: { stage: JourneyStage; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left transition-colors"
        style={{
          backgroundColor: isOpen
            ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
            : 'var(--color-bg-card)',
          border: 'none',
          minHeight: 'unset',
        }}
      >
        <span
          className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full text-sm font-bold"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {stage.number}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-base"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            {stage.title}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {stage.subtitle}
          </p>
        </div>
        {isOpen ? (
          <ChevronUp size={18} style={{ color: 'var(--color-text-secondary)' }} className="shrink-0" />
        ) : (
          <ChevronDown size={18} style={{ color: 'var(--color-text-secondary)' }} className="shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="px-4 pb-4">
          {/* Stage narrative */}
          <div
            className="pl-4 mb-4 text-sm italic"
            style={{
              borderLeft: '3px solid var(--color-btn-primary-bg)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {stage.narrative}
          </div>

          {/* Features */}
          <div className="space-y-4">
            {stage.features.map((feature) => (
              <FeatureCard key={feature.key} feature={feature} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Feature Card ─────────────────────────────────────────────────

function FeatureCard({ feature }: { feature: JourneyFeature }) {
  const Icon = getIcon(feature.iconName)

  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: feature.status === 'in_production'
          ? '1px solid color-mix(in srgb, var(--color-status-warning) 30%, transparent)'
          : '1px solid var(--color-border)',
      }}
    >
      {/* Feature header */}
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <span
          className="font-semibold text-sm"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {feature.name}
        </span>
        <StatusBadge status={feature.status} />
      </div>

      {/* Description */}
      <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
        {feature.description}
      </p>

      {/* Connections */}
      <p className="text-xs italic mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        {feature.connections}
      </p>

      {/* Built features: mini-prompts + link */}
      {feature.status === 'built' && feature.miniPrompts && (
        <div className="mb-3">
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-heading)' }}>
            Try this:
          </p>
          <ul className="space-y-0.5">
            {feature.miniPrompts.map((prompt, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
                <span style={{ color: 'var(--color-btn-primary-bg)' }}>•</span>
                {prompt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sub-tools */}
      {feature.subTools && feature.subTools.length > 0 && (
        <div className="space-y-1 mb-3">
          {feature.subTools.map((tool) => (
            <SubToolRow key={tool.name} tool={tool} />
          ))}
        </div>
      )}

      {/* In-production: lookForward */}
      {feature.status === 'in_production' && feature.lookForward && (
        <div
          className="rounded-lg p-3 mt-2"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-status-warning) 8%, var(--color-bg-card))',
            border: '1px solid color-mix(in srgb, var(--color-status-warning) 20%, transparent)',
          }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-status-warning)' }}>
            <Sparkle size={12} className="inline mr-1" style={{ verticalAlign: '-1px' }} />
            What's Coming:
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
            {feature.lookForward}
          </p>
        </div>
      )}

      {/* "Go there now" link for built features */}
      {feature.status === 'built' && feature.route && (
        <Link
          to={feature.route}
          className="inline-flex items-center gap-1 text-sm font-medium mt-2"
          style={{ color: 'var(--color-btn-primary-bg)' }}
        >
          Go there now <ChevronRight size={14} />
        </Link>
      )}
    </div>
  )
}

// ── Sub-Tool Row ─────────────────────────────────────────────────

function SubToolRow({ tool }: { tool: SubTool }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 w-full text-left"
        style={{ color: 'var(--color-btn-primary-bg)', border: 'none', background: 'transparent', minHeight: 'unset', padding: '2px 0' }}
      >
        <span className="font-medium">{tool.name}</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>— {tool.brief}</span>
        <span className="ml-auto shrink-0 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
          {expanded ? 'Less' : 'More'}
        </span>
      </button>
      {expanded && (
        <p className="pl-0 mt-1 mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {tool.detail}
        </p>
      )}
    </div>
  )
}
