/**
 * Studio Page — PRD-09B Screen 1
 *
 * Template workshop. Browse blank formats + examples organized by category.
 * Two tabs: Browse Templates (the shelf) | My Customized (mom's library)
 *
 * Categories:
 * 1. Task & Chore Templates — Simple Task, Routine, Opportunity Board, Sequential Collection
 * 2. Guided Forms & Worksheets — Guided Form, SODAS, What-If, Apology Reflection
 * 3. List Templates — Shopping, Wishlist, Packing, Expense Tracker, To-Do, Custom, Randomizer
 * 4. Trackers & Widgets — PlannedExpansionCard (PRD-10)
 * 5. Tools — PlannedExpansionCard (future PRDs)
 * 6. Gamification Systems — PlannedExpansionCard (PRD-24)
 *
 * System templates have is_system_template=true, family_id=NULL in the DB.
 * Example templates have is_example=true and are labeled with a badge.
 *
 * [Customize] on task/routine/opportunity/sequential/guided_form types → opens TaskCreationModal
 * [Customize] on list types → opens ListCreationModal (logs + closes if not yet available)
 */

import { useState, useMemo, useCallback } from 'react'
import { Palette, Filter, ArrowUpDown } from 'lucide-react'
import { Tabs, PlannedExpansionCard, FeatureGuide, FeatureIcon, EmptyState, LoadingSpinner } from '@/components/shared'
import { StudioCategorySection } from '@/components/studio/StudioCategorySection'
import { StudioSearch } from '@/components/studio/StudioSearch'
import { CustomizedTemplateCard } from '@/components/studio/CustomizedTemplateCard'
import type { StudioTemplate } from '@/components/studio/StudioTemplateCard'
import type { CustomizedTemplate } from '@/components/studio/CustomizedTemplateCard'
import type { TabItem } from '@/components/shared'
import {
  TASK_TEMPLATES_BLANK,
  TASK_TEMPLATES_EXAMPLES,
  GUIDED_FORM_TEMPLATES_BLANK,
  GUIDED_FORM_TEMPLATES_EXAMPLES,
  LIST_TEMPLATES_BLANK,
  LIST_TEMPLATES_EXAMPLES,
  RANDOMIZER_TEMPLATE_BLANK,
} from '@/components/studio/studio-seed-data'
import { TaskCreationModal } from '@/components/tasks/TaskCreationModal'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

// ─────────────────────────────────────────────
// My Customized data loader
// ─────────────────────────────────────────────

function useCustomizedTemplates(familyId: string | undefined) {
  return useQuery({
    queryKey: ['task_templates_customized', familyId],
    queryFn: async (): Promise<CustomizedTemplate[]> => {
      if (!familyId) return []

      const { data, error } = await supabase
        .from('task_templates')
        .select('id, title, task_type, config, created_at')
        .eq('family_id', familyId)
        .eq('is_system', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[Studio] Failed to load customized templates:', error)
        return []
      }

      return (data ?? []).map((row) => {
        const config = (row.config ?? {}) as Record<string, unknown>
        const templateType = mapDbTypeToStudioType(row.task_type as string)
        return {
          id: row.id as string,
          name: (row.title as string) || 'Untitled Template',
          templateType,
          assignedTo: (config.assigned_to_names as string[]) ?? [],
          activeDeployments: (config.active_deployments as number) ?? 0,
          lastDeployedAt: (config.last_deployed_at as string) ?? null,
          createdAt: row.created_at as string,
        }
      })
    },
    enabled: !!familyId,
  })
}

function mapDbTypeToStudioType(dbType: string): StudioTemplate['templateType'] {
  const map: Record<string, StudioTemplate['templateType']> = {
    task: 'task',
    routine: 'routine',
    opportunity: 'opportunity_claimable',
    sequential: 'sequential',
    guided_form: 'guided_form',
    randomizer: 'randomizer',
  }
  return map[dbType] ?? 'task'
}

// ─────────────────────────────────────────────
// Template → task type mapping for TaskCreationModal
// ─────────────────────────────────────────────

function studioTypeToTaskType(t: StudioTemplate['templateType']): string | null {
  if (t === 'task') return 'task'
  if (t === 'routine') return 'routine'
  if (t === 'opportunity_claimable' || t === 'opportunity_repeatable' || t === 'opportunity_capped') return 'opportunity'
  if (t === 'sequential') return 'sequential'
  if (t.startsWith('guided_form')) return 'guided_form'
  return null // list types handled separately
}

// ─────────────────────────────────────────────
// Search filtering helper
// ─────────────────────────────────────────────

function matchesSearch(tpl: StudioTemplate, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  return (
    tpl.name.toLowerCase().includes(q) ||
    tpl.tagline.toLowerCase().includes(q) ||
    tpl.description.toLowerCase().includes(q) ||
    tpl.exampleUseCases.some(uc => uc.toLowerCase().includes(q))
  )
}

// ─────────────────────────────────────────────
// My Customized sort & filter state
// ─────────────────────────────────────────────

type CustomizedSortKey = 'name' | 'last_deployed' | 'most_used' | 'recently_created'
type CustomizedFilter = 'all' | 'assigned' | 'unassigned'

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export function StudioPage() {
  const { data: _member } = useFamilyMember() // reserved for future member-scoped features
  const { data: family } = useFamily()

  const [activeTab, setActiveTab] = useState<'browse' | 'customized'>('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [customizedSort, setCustomizedSort] = useState<CustomizedSortKey>('recently_created')
  const [customizedFilter, setCustomizedFilter] = useState<CustomizedFilter>('all')

  // TaskCreationModal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitialType, setModalInitialType] = useState<string>('task')

  const {
    data: customizedTemplates = [],
    isLoading: customizedLoading,
  } = useCustomizedTemplates(family?.id)

  // ── Customize handler ────────────────────────────────────────

  const handleCustomize = useCallback((template: StudioTemplate) => {
    const taskType = studioTypeToTaskType(template.templateType)
    if (taskType) {
      setModalInitialType(taskType)
      setModalOpen(true)
    } else {
      // List types — ListCreationModal not yet implemented
      console.info('[Studio] List creation flow not yet implemented. Opening default.')
      setModalInitialType('task')
      setModalOpen(true)
    }
  }, [])

  const handleUseAsIs = useCallback((template: StudioTemplate) => {
    handleCustomize(template)
  }, [handleCustomize])

  const handleTaskSaved = useCallback((_data: CreateTaskData) => {
    setModalOpen(false)
  }, [])

  // ── Search filtering ─────────────────────────────────────────

  const taskBlanksFiltered = useMemo(
    () => TASK_TEMPLATES_BLANK.filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )
  const taskExamplesFiltered = useMemo(
    () => TASK_TEMPLATES_EXAMPLES.filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )
  const guidedBlanksFiltered = useMemo(
    () => GUIDED_FORM_TEMPLATES_BLANK.filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )
  const guidedExamplesFiltered = useMemo(
    () => GUIDED_FORM_TEMPLATES_EXAMPLES.filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )
  const listBlanksFiltered = useMemo(
    () => [...LIST_TEMPLATES_BLANK, RANDOMIZER_TEMPLATE_BLANK].filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )
  const listExamplesFiltered = useMemo(
    () => LIST_TEMPLATES_EXAMPLES.filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )

  const noSearchResults =
    searchQuery.trim() &&
    taskBlanksFiltered.length === 0 &&
    taskExamplesFiltered.length === 0 &&
    guidedBlanksFiltered.length === 0 &&
    guidedExamplesFiltered.length === 0 &&
    listBlanksFiltered.length === 0 &&
    listExamplesFiltered.length === 0

  // ── Customized tab: sort + filter ────────────────────────────

  const filteredCustomized = useMemo(() => {
    let list = [...customizedTemplates]
    if (customizedFilter === 'assigned') {
      list = list.filter(t => t.assignedTo.length > 0 || t.activeDeployments > 0)
    } else if (customizedFilter === 'unassigned') {
      list = list.filter(t => t.assignedTo.length === 0 && t.activeDeployments === 0)
    }
    switch (customizedSort) {
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'last_deployed':
        list.sort((a, b) => {
          const aD = a.lastDeployedAt ? new Date(a.lastDeployedAt).getTime() : 0
          const bD = b.lastDeployedAt ? new Date(b.lastDeployedAt).getTime() : 0
          return bD - aD
        })
        break
      case 'recently_created':
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }
    return list
  }, [customizedTemplates, customizedFilter, customizedSort])

  // ── Tab items ────────────────────────────────────────────────

  const tabs: TabItem[] = [
    { id: 'browse', label: 'Browse Templates' },
    {
      id: 'customized',
      label: 'My Customized',
      badge: customizedTemplates.length > 0 ? String(customizedTemplates.length) : undefined,
    },
  ]

  // ─────────────────────────────────────────────────────────────

  return (
    <div
      className="max-w-4xl mx-auto px-4 py-6"
      style={{ color: 'var(--color-text-primary)' }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <FeatureIcon featureKey="studio" fallback={<Palette size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={32} />
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Studio
          </h1>
        </div>
        <p className="text-sm ml-10" style={{ color: 'var(--color-text-secondary)' }}>
          Templates, Trackers &amp; Widgets
        </p>
      </div>

      {/* ── Feature Guide ───────────────────────────────────── */}
      <FeatureGuide featureKey="studio" />

      {/* ── Tabs + Search ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <Tabs
            items={tabs}
            activeId={activeTab}
            onChange={id => setActiveTab(id as 'browse' | 'customized')}
          />
        </div>
        {activeTab === 'browse' && (
          <div className="sm:w-64">
            <StudioSearch value={searchQuery} onChange={setSearchQuery} />
          </div>
        )}
      </div>

      {/* ── Browse Templates tab ─────────────────────────────── */}
      {activeTab === 'browse' && (
        <div>
          {noSearchResults ? (
            <EmptyState
              icon={<Palette size={32} style={{ color: 'var(--color-text-secondary)' }} />}
              title="No templates match that search"
              description='Try searching for "routine", "shopping", or "SODAS" to find what you need.'
            />
          ) : (
            <>
              {/* 1. Task & Chore Templates */}
              {(taskBlanksFiltered.length > 0 || taskExamplesFiltered.length > 0) && (
                <StudioCategorySection
                  title="Task & Chore Templates"
                  templates={taskBlanksFiltered}
                  exampleTemplates={taskExamplesFiltered}
                  onCustomize={handleCustomize}
                  onUseAsIs={handleUseAsIs}
                />
              )}

              {/* 2. Guided Forms & Worksheets */}
              {(guidedBlanksFiltered.length > 0 || guidedExamplesFiltered.length > 0) && (
                <StudioCategorySection
                  title="Guided Forms & Worksheets"
                  templates={guidedBlanksFiltered}
                  exampleTemplates={guidedExamplesFiltered}
                  onCustomize={handleCustomize}
                  onUseAsIs={handleUseAsIs}
                />
              )}

              {/* 3. List Templates */}
              {(listBlanksFiltered.length > 0 || listExamplesFiltered.length > 0) && (
                <StudioCategorySection
                  title="List Templates"
                  templates={listBlanksFiltered}
                  exampleTemplates={listExamplesFiltered}
                  onCustomize={handleCustomize}
                  onUseAsIs={handleUseAsIs}
                />
              )}

              {/* 4. Trackers & Widgets — PlannedExpansionCard */}
              {!searchQuery && (
                <StudioCategorySection
                  title="Trackers & Widgets"
                  templates={[]}
                  plannedContent={<PlannedExpansionCard featureKey="studio_trackers_widgets" />}
                  onCustomize={handleCustomize}
                  defaultCollapsed={false}
                />
              )}

              {/* 5. Tools — PlannedExpansionCard */}
              {!searchQuery && (
                <StudioCategorySection
                  title="Tools"
                  templates={[]}
                  plannedContent={<PlannedExpansionCard featureKey="studio_tools" />}
                  onCustomize={handleCustomize}
                  defaultCollapsed={true}
                />
              )}

              {/* 6. Gamification Systems — PlannedExpansionCard */}
              {!searchQuery && (
                <StudioCategorySection
                  title="Gamification Systems"
                  templates={[]}
                  plannedContent={<PlannedExpansionCard featureKey="studio_gamification" />}
                  onCustomize={handleCustomize}
                  defaultCollapsed={true}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ── My Customized tab ────────────────────────────────── */}
      {activeTab === 'customized' && (
        <div>
          {/* Sort & filter controls */}
          {customizedTemplates.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="flex items-center gap-1.5">
                <Filter size={14} style={{ color: 'var(--color-text-secondary)' }} />
                {(['all', 'assigned', 'unassigned'] as CustomizedFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setCustomizedFilter(f)}
                    className="rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize"
                    style={{
                      backgroundColor: customizedFilter === f
                        ? 'var(--color-btn-primary-bg)'
                        : 'var(--color-bg-secondary)',
                      color: customizedFilter === f
                        ? 'var(--color-btn-primary-text)'
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    {f === 'all' ? 'All' : f === 'assigned' ? 'Assigned' : 'Unassigned'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <ArrowUpDown size={14} style={{ color: 'var(--color-text-secondary)' }} />
                <select
                  value={customizedSort}
                  onChange={e => setCustomizedSort(e.target.value as CustomizedSortKey)}
                  className="text-xs rounded-lg px-2 py-1 border outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="recently_created">Recently Created</option>
                  <option value="name">Name A–Z</option>
                  <option value="last_deployed">Last Deployed</option>
                </select>
              </div>
            </div>
          )}

          {customizedLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="md" />
            </div>
          ) : filteredCustomized.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomized.map(tpl => (
                <CustomizedTemplateCard
                  key={tpl.id}
                  template={tpl}
                  onDeploy={(t) => {
                    // TODO: open deploy flow
                    console.info('[Studio] Deploy template:', t.id)
                  }}
                  onEdit={(t) => {
                    const taskType = mapDbTypeToStudioType(t.templateType as unknown as string)
                    setModalInitialType(taskType as string || 'task')
                    setModalOpen(true)
                  }}
                  onDuplicate={(t) => {
                    // TODO: duplicate template
                    console.info('[Studio] Duplicate template:', t.id)
                  }}
                  onArchive={(t) => {
                    // TODO: archive template
                    console.info('[Studio] Archive template:', t.id)
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Palette size={32} style={{ color: 'var(--color-text-secondary)' }} />}
              title={
                customizedFilter !== 'all'
                  ? 'No templates match that filter'
                  : "You haven't customized any templates yet"
              }
              description={
                customizedFilter !== 'all'
                  ? 'Try removing the filter to see all your templates.'
                  : 'Browse the Templates tab, tap [Customize] on any format, and build your first template. It will appear here.'
              }
              action={
                customizedFilter === 'all'
                  ? {
                      label: 'Browse Templates',
                      onClick: () => setActiveTab('browse'),
                    }
                  : undefined
              }
            />
          )}
        </div>
      )}

      {/* ── Task Creation Modal ──────────────────────────────── */}
      {modalOpen && (
        <TaskCreationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleTaskSaved}
        />
      )}
    </div>
  )
}
