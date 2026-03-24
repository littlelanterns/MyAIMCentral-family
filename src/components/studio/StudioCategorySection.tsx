/**
 * StudioCategorySection (PRD-09B Screen 1)
 *
 * Collapsible section with heading + horizontal-scrollable row of StudioTemplateCards.
 * Handles:
 * - Category heading with item count
 * - Collapse/expand toggle
 * - "Example Templates" subsection below blank templates when examples exist
 * - Optional PlannedExpansionCard override for future PRD categories
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { StudioTemplateCard } from './StudioTemplateCard'
import type { StudioTemplate } from './StudioTemplateCard'

interface StudioCategorySectionProps {
  title: string
  /** Blank/system templates for this category */
  templates: StudioTemplate[]
  /** Example templates (shown in a sub-section below) */
  exampleTemplates?: StudioTemplate[]
  /** When provided, renders this node instead of template cards (for PlannedExpansionCard categories) */
  plannedContent?: React.ReactNode
  onCustomize: (template: StudioTemplate) => void
  onUseAsIs?: (template: StudioTemplate) => void
  defaultCollapsed?: boolean
}

export function StudioCategorySection({
  title,
  templates,
  exampleTemplates = [],
  plannedContent,
  onCustomize,
  onUseAsIs,
  defaultCollapsed = false,
}: StudioCategorySectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const totalCount = templates.length + exampleTemplates.length

  return (
    <div className="mb-8">
      {/* Section heading */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2 w-full text-left mb-4 group"
      >
        <div className="flex items-center gap-2 flex-1">
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            {title}
          </h2>
          {totalCount > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {totalCount}
            </span>
          )}
        </div>
        <div style={{ color: 'var(--color-text-secondary)' }}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {!collapsed && (
        <div className="space-y-5">
          {/* Planned content (for future PRD categories) */}
          {plannedContent && (
            <div>{plannedContent}</div>
          )}

          {/* Blank template cards — horizontal scroll row */}
          {!plannedContent && templates.length > 0 && (
            <div
              className="flex gap-4 overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'thin' }}
            >
              {templates.map(tpl => (
                <StudioTemplateCard
                  key={tpl.id}
                  template={tpl}
                  onCustomize={onCustomize}
                  onUseAsIs={onUseAsIs}
                />
              ))}
            </div>
          )}

          {/* Example templates sub-section */}
          {!plannedContent && exampleTemplates.length > 0 && (
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Example Templates
              </p>
              <div
                className="flex gap-4 overflow-x-auto pb-2"
                style={{ scrollbarWidth: 'thin' }}
              >
                {exampleTemplates.map(tpl => (
                  <StudioTemplateCard
                    key={tpl.id}
                    template={tpl}
                    onCustomize={onCustomize}
                    onUseAsIs={onUseAsIs}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!plannedContent && templates.length === 0 && exampleTemplates.length === 0 && (
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              No templates in this category yet.
            </p>
          )}
        </div>
      )}

      {/* Divider */}
      <div
        className="mt-6"
        style={{ borderBottom: '1px solid var(--color-border)', opacity: 0.5 }}
      />
    </div>
  )
}
