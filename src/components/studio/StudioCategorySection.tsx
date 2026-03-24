/**
 * StudioCategorySection (PRD-09B Screen 1)
 *
 * Collapsible section with heading + horizontal-swipeable row of StudioTemplateCards.
 * Example templates are in a collapsed sub-accordion (default closed).
 * No visible scrollbars — swipe to scroll on mobile, drag on desktop.
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ScrollRow } from '@/components/shared/ScrollRow'
import { StudioTemplateCard } from './StudioTemplateCard'
import type { StudioTemplate } from './StudioTemplateCard'

interface StudioCategorySectionProps {
  title: string
  templates: StudioTemplate[]
  exampleTemplates?: StudioTemplate[]
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
  const [examplesExpanded, setExamplesExpanded] = useState(false)

  const blankCount = templates.length

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
          {blankCount > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {blankCount}
            </span>
          )}
        </div>
        <div style={{ color: 'var(--color-text-secondary)' }}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {!collapsed && (
        <div className="space-y-4">
          {/* Planned content (for future PRD categories) */}
          {plannedContent && <div>{plannedContent}</div>}

          {/* Blank template cards — horizontal swipe row with arrow buttons */}
          {!plannedContent && templates.length > 0 && (
            <ScrollRow>
              {templates.map(tpl => (
                <div key={tpl.id} className="snap-start flex-shrink-0" style={{ minWidth: '260px', maxWidth: '300px' }}>
                  <StudioTemplateCard
                    template={tpl}
                    onCustomize={onCustomize}
                    onUseAsIs={onUseAsIs}
                  />
                </div>
              ))}
            </ScrollRow>
          )}

          {/* Example templates — collapsible sub-section, default CLOSED */}
          {!plannedContent && exampleTemplates.length > 0 && (
            <div>
              <button
                onClick={() => setExamplesExpanded(e => !e)}
                className="flex items-center gap-2 text-xs font-medium transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {examplesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="uppercase tracking-wider">
                  Example Templates ({exampleTemplates.length})
                </span>
              </button>

              {examplesExpanded && (
                <div className="mt-3">
                  <ScrollRow>
                    {exampleTemplates.map(tpl => (
                      <div key={tpl.id} className="snap-start flex-shrink-0" style={{ minWidth: '260px', maxWidth: '300px' }}>
                        <StudioTemplateCard
                          template={tpl}
                          onCustomize={onCustomize}
                          onUseAsIs={onUseAsIs}
                        />
                      </div>
                    ))}
                  </ScrollRow>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!plannedContent && templates.length === 0 && exampleTemplates.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
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

