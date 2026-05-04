/**
 * StudioCategorySection (PRD-09B Screen 1)
 *
 * Collapsible section with heading + horizontal-swipeable row of StudioTemplateCards.
 *
 * Two rendering modes for example templates:
 *   showExamplesFirst=false (default): Example templates in a collapsed sub-accordion.
 *   showExamplesFirst=true: Example templates render prominently FIRST with a
 *     "Ready to use" label, followed by blank "Create Your Own" cards below.
 *     This is the correct rendering for Setup Wizards where seeded templates
 *     are the primary on-ramp (Phase 3.7).
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
  showExamplesFirst?: boolean
}

export function StudioCategorySection({
  title,
  templates,
  exampleTemplates = [],
  plannedContent,
  onCustomize,
  onUseAsIs,
  defaultCollapsed = false,
  showExamplesFirst = false,
}: StudioCategorySectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [examplesExpanded, setExamplesExpanded] = useState(false)

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
        <div className="space-y-4">
          {/* Planned content (for future PRD categories) */}
          {plannedContent && <div>{plannedContent}</div>}

          {/* ── Examples-first mode (Setup Wizards) ─────────────── */}
          {!plannedContent && showExamplesFirst && (
            <>
              {exampleTemplates.length > 0 && (
                <div>
                  <p
                    className="text-xs font-medium uppercase tracking-wider mb-2"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Ready to use
                  </p>
                  <ScrollRow>
                    {exampleTemplates.map(tpl => (
                      <div key={tpl.id} className="snap-start shrink-0" style={{ minWidth: '260px', maxWidth: '300px' }}>
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

              {templates.length > 0 && (
                <div>
                  <p
                    className="text-xs font-medium uppercase tracking-wider mb-2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Create your own
                  </p>
                  <ScrollRow>
                    {templates.map(tpl => (
                      <div key={tpl.id} className="snap-start shrink-0" style={{ minWidth: '260px', maxWidth: '300px' }}>
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
            </>
          )}

          {/* ── Default mode (accordion examples) ──────────────── */}
          {!plannedContent && !showExamplesFirst && (
            <>
              {templates.length > 0 && (
                <ScrollRow>
                  {templates.map(tpl => (
                    <div key={tpl.id} className="snap-start shrink-0" style={{ minWidth: '260px', maxWidth: '300px' }}>
                      <StudioTemplateCard
                        template={tpl}
                        onCustomize={onCustomize}
                        onUseAsIs={onUseAsIs}
                      />
                    </div>
                  ))}
                </ScrollRow>
              )}

              {exampleTemplates.length > 0 && (
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
                          <div key={tpl.id} className="snap-start shrink-0" style={{ minWidth: '260px', maxWidth: '300px' }}>
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
            </>
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
