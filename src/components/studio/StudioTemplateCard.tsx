/**
 * StudioTemplateCard (PRD-09B Screen 1)
 *
 * Universal card for every template in Studio. Two states:
 * - Collapsed: icon, name, tagline (~80 chars), [Customize] on hover (desktop) or after tap (mobile)
 * - Expanded: full description, "Works great for:" use-case chips, [Customize] button
 *
 * Mobile: single tap expands in-place. Second tap collapses.
 * Desktop: hover shows expanded state.
 *
 * Guided-form cards show section structure preview in expanded state.
 * Example templates have an "Example" badge.
 */

import { useState, useRef, useEffect } from 'react'
import {
  CheckSquare, RefreshCw, Star, Layers, Shuffle,
  FileText, HelpCircle, AlertTriangle, Heart,
  ShoppingCart, Gift, Luggage, DollarSign, ListTodo, List,
  ChevronRight, Users, Palette, Trophy, Wand2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────

export type StudioTemplateType =
  | 'task'
  | 'routine'
  | 'opportunity_claimable'
  | 'opportunity_repeatable'
  | 'opportunity_capped'
  | 'sequential'
  | 'randomizer'
  | 'guided_form'
  | 'guided_form_sodas'
  | 'guided_form_what_if'
  | 'guided_form_apology_reflection'
  | 'list_shopping'
  | 'list_wishlist'
  | 'list_packing'
  | 'list_expenses'
  | 'list_todo'
  | 'list_custom'
  // Gamification & Rewards (Phase 1)
  | 'gamification_setup'
  | 'gamification_creatures'
  | 'gamification_pages'
  | 'gamification_segments'
  | 'gamification_coloring'
  | 'reward_reveal'
  | 'widget_tally'
  | 'widget_randomizer_spinner'
  // Growth & Self-Knowledge
  | 'self_knowledge_wizard'
  | 'best_intentions_wizard'
  // Setup Wizards
  | 'routine_builder_wizard'

export interface StudioTemplate {
  id: string
  templateType: StudioTemplateType
  name: string
  tagline: string
  description: string
  exampleUseCases: string[]
  isExample: boolean
  /**
   * PRD-09A/09B Studio Intelligence Phase 1 — foundation for Phase 2 intent-based search.
   * Tags describe what the template DOES, not what it IS. Multiple tools can share tags.
   * Required field: forgetting tags on a future template is a compile error (by design).
   * Tag vocabulary is authoritative in
   * `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` §1D.
   */
  capability_tags: string[]
  /** For guided forms: ordered section keys */
  sectionStructure?: string[]
  /** Opportunity sub-type description */
  howItWorks?: string
}

interface StudioTemplateCardProps {
  template: StudioTemplate
  onCustomize: (template: StudioTemplate) => void
  onUseAsIs?: (template: StudioTemplate) => void
}

// ─── Icon map ─────────────────────────────────────────────────

function TemplateIcon({ type, size = 22 }: { type: StudioTemplateType; size?: number }) {
  const style = { color: 'var(--color-btn-primary-bg)', flexShrink: 0 as const }
  switch (type) {
    case 'task':               return <CheckSquare size={size} style={style} />
    case 'routine':            return <RefreshCw size={size} style={style} />
    case 'opportunity_claimable':
    case 'opportunity_repeatable':
    case 'opportunity_capped': return <Star size={size} style={style} />
    case 'sequential':         return <Layers size={size} style={style} />
    case 'randomizer':         return <Shuffle size={size} style={style} />
    case 'guided_form':        return <FileText size={size} style={style} />
    case 'guided_form_sodas':  return <HelpCircle size={size} style={style} />
    case 'guided_form_what_if':return <AlertTriangle size={size} style={style} />
    case 'guided_form_apology_reflection': return <Heart size={size} style={style} />
    case 'list_shopping':      return <ShoppingCart size={size} style={style} />
    case 'list_wishlist':      return <Gift size={size} style={style} />
    case 'list_packing':       return <Luggage size={size} style={style} />
    case 'list_expenses':      return <DollarSign size={size} style={style} />
    case 'list_todo':          return <ListTodo size={size} style={style} />
    case 'list_custom':        return <List size={size} style={style} />
    // Gamification & Rewards
    case 'gamification_setup':
    case 'gamification_creatures':
    case 'gamification_pages':
    case 'gamification_segments': return <Trophy size={size} style={style} />
    case 'gamification_coloring': return <Palette size={size} style={style} />
    case 'reward_reveal':      return <Gift size={size} style={style} />
    case 'widget_tally':       return <Star size={size} style={style} />
    case 'widget_randomizer_spinner': return <Shuffle size={size} style={style} />
    // Growth & Self-Knowledge
    case 'self_knowledge_wizard': return <Users size={size} style={style} />
    case 'best_intentions_wizard': return <Heart size={size} style={style} />
    // Setup Wizards
    case 'routine_builder_wizard': return <Wand2 size={size} style={style} />
    default:                   return <FileText size={size} style={style} />
  }
}

const GUIDED_FORM_TYPES: StudioTemplateType[] = [
  'guided_form', 'guided_form_sodas', 'guided_form_what_if', 'guided_form_apology_reflection',
]

function isGuidedForm(type: StudioTemplateType): boolean {
  return GUIDED_FORM_TYPES.includes(type)
}

// ─── Card ─────────────────────────────────────────────────────

export function StudioTemplateCard({ template, onCustomize, onUseAsIs }: StudioTemplateCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Desktop: hover triggers expanded state. Mobile: tap only.
  const showExpanded = expanded || hovered

  // Close on outside click (mobile tap-to-expand)
  useEffect(() => {
    if (!expanded) return
    function handler(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [expanded])

  function handleCardClick() {
    // Mobile tap: toggle expanded
    setExpanded(prev => !prev)
  }

  function handleCustomize(e: React.MouseEvent) {
    e.stopPropagation()
    onCustomize(template)
  }

  function handleUseAsIs(e: React.MouseEvent) {
    e.stopPropagation()
    onUseAsIs?.(template)
  }

  const taglineTruncated = template.tagline.length > 80
    ? template.tagline.slice(0, 77) + '…'
    : template.tagline

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative shrink-0 rounded-xl border cursor-pointer transition-all duration-200 select-none"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: showExpanded
          ? 'var(--color-btn-primary-bg)'
          : 'var(--color-border)',
        boxShadow: showExpanded
          ? '0 4px 16px rgba(0,0,0,0.08)'
          : '0 1px 4px rgba(0,0,0,0.04)',
        width: showExpanded ? '280px' : '200px',
        minHeight: showExpanded ? 'auto' : '140px',
        padding: '16px',
        transition: 'all 200ms ease',
      }}
    >
      {/* Example badge */}
      {template.isExample && (
        <span
          className="absolute top-2 right-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          Example
        </span>
      )}

      {/* Icon */}
      <div className="mb-3">
        <TemplateIcon type={template.templateType} size={22} />
      </div>

      {/* Name */}
      <p
        className="font-semibold text-sm leading-snug mb-1"
        style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
      >
        {template.name}
      </p>

      {/* Tagline — collapsed, full description — expanded */}
      <p
        className="text-xs leading-relaxed"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {showExpanded ? template.description : taglineTruncated}
      </p>

      {/* Expanded: "Works great for:" chips */}
      {showExpanded && template.exampleUseCases.length > 0 && (
        <div className="mt-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Works great for:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.exampleUseCases.map((uc) => (
              <span
                key={uc}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px]"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {uc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expanded: Guided form section structure preview */}
      {showExpanded && isGuidedForm(template.templateType) && template.sectionStructure && (
        <div className="mt-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Sections:
          </p>
          <div className="flex flex-wrap items-center gap-1">
            {template.sectionStructure.map((section, i) => (
              <span key={section} className="flex items-center gap-1">
                <span
                  className="text-[11px]"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {section}
                </span>
                {i < template.sectionStructure!.length - 1 && (
                  <ChevronRight size={10} style={{ color: 'var(--color-text-secondary)' }} />
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expanded: Opportunity board "how it works" */}
      {showExpanded && template.howItWorks && (
        <div
          className="mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {template.howItWorks}
        </div>
      )}

      {/* Action buttons */}
      <div
        className={`flex gap-2 transition-all duration-200 ${showExpanded ? 'mt-4 opacity-100' : 'mt-3 md:opacity-0 md:group-hover:opacity-100 opacity-100'}`}
      >
        {template.isExample && onUseAsIs && (
          <button
            onClick={handleUseAsIs}
            className="flex-1 rounded-lg py-1.5 text-xs font-medium border transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent',
            }}
          >
            Use as-is
          </button>
        )}
        <button
          onClick={handleCustomize}
          className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          Customize
        </button>
      </div>
    </div>
  )
}
