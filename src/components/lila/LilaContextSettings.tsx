import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronDown, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'

/**
 * Context Settings — PRD-05 (Mom Only)
 * Three-tier checkbox tree for controlling what context LiLa can access.
 * Person → Category → Item level toggles via is_included_in_ai.
 */

interface ContextSource {
  id: string
  content: string
  category?: string
  is_included_in_ai: boolean
  table: string
}

interface LilaContextSettingsProps {
  onClose: () => void
  hasActiveConversation?: boolean
  onRefreshContext?: () => void
}

export function LilaContextSettings({ onClose, hasActiveConversation, onRefreshContext }: LilaContextSettingsProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: familyMembers = [] } = useFamilyMembers(family?.id)
  const [sources, setSources] = useState<ContextSource[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [togglesChanged, setTogglesChanged] = useState(false)

  useEffect(() => {
    if (!family?.id || !member?.id) return
    loadContextSources(family.id, member.id)
  }, [family?.id, member?.id])

  async function loadContextSources(familyId: string, memberId: string) {
    setLoading(true)
    const allSources: ContextSource[] = []

    const [gsRes, biRes, skRes] = await Promise.all([
      supabase.from('guiding_stars').select('id, content, category, is_included_in_ai').eq('family_id', familyId).eq('member_id', memberId),
      supabase.from('best_intentions').select('id, statement, is_included_in_ai').eq('family_id', familyId).eq('member_id', memberId),
      supabase.from('self_knowledge').select('id, content, category, is_included_in_ai').eq('family_id', familyId).eq('member_id', memberId),
    ])

    if (gsRes.data) {
      allSources.push(...gsRes.data.map(g => ({
        id: g.id, content: g.content, category: g.category || 'Uncategorized',
        is_included_in_ai: g.is_included_in_ai, table: 'guiding_stars',
      })))
    }

    if (biRes.data) {
      allSources.push(...biRes.data.map(b => ({
        id: b.id, content: b.statement, category: 'Best Intentions',
        is_included_in_ai: b.is_included_in_ai, table: 'best_intentions',
      })))
    }

    if (skRes.data) {
      allSources.push(...skRes.data.map(s => ({
        id: s.id, content: s.content, category: s.category,
        is_included_in_ai: s.is_included_in_ai, table: 'self_knowledge',
      })))
    }

    setSources(allSources)
    setLoading(false)
  }

  async function toggleItem(source: ContextSource) {
    // Optimistic update
    setSources(prev =>
      prev.map(s => s.id === source.id ? { ...s, is_included_in_ai: !s.is_included_in_ai } : s)
    )
    setTogglesChanged(true)

    const { error } = await supabase
      .from(source.table)
      .update({ is_included_in_ai: !source.is_included_in_ai })
      .eq('id', source.id)

    if (error) {
      // Rollback on error
      setSources(prev =>
        prev.map(s => s.id === source.id ? { ...s, is_included_in_ai: source.is_included_in_ai } : s)
      )
    }
  }

  async function toggleSection(sectionKey: string, table: string, included: boolean) {
    const sectionItems = sources.filter(s => `${s.table}-${s.category}` === sectionKey)

    // Optimistic update
    setSources(prev =>
      prev.map(s => `${s.table}-${s.category}` === sectionKey ? { ...s, is_included_in_ai: included } : s)
    )
    setTogglesChanged(true)

    // Update all items in the section
    const ids = sectionItems.map(s => s.id)
    await supabase
      .from(table)
      .update({ is_included_in_ai: included })
      .in('id', ids)
  }

  function toggleExpanded(key: string) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Group sources by table then category
  const grouped = new Map<string, Map<string, ContextSource[]>>()
  for (const source of sources) {
    const tableLabel = TABLE_LABELS[source.table] || source.table
    if (!grouped.has(tableLabel)) grouped.set(tableLabel, new Map())
    const categories = grouped.get(tableLabel)!
    const cat = source.category || 'General'
    if (!categories.has(cat)) categories.set(cat, [])
    categories.get(cat)!.push(source)
  }

  const totalCount = sources.length
  const activeCount = sources.filter(s => s.is_included_in_ai).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            Context Settings
          </h3>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Gleaning context from {activeCount}/{totalCount} insights
          </p>
        </div>
        <button onClick={onClose} className="p-1" style={{ color: 'var(--color-text-secondary)' }}>
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Person-level toggles (mom only) — UI placeholder; filtering wires in Phase 20 */}
        {member?.role === 'primary_parent' && familyMembers.length > 1 && (
          <div className="mb-4 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Include context from
            </div>
            {familyMembers
              .filter(fm => fm.id !== member.id)
              .map(fm => (
                <label key={fm.id} className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded"
                  />
                  <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {fm.display_name}
                  </span>
                </label>
              ))}
          </div>
        )}

        {loading && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
            Loading context sources...
          </p>
        )}

        {!loading && sources.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
            No context sources yet. Add Guiding Stars, Best Intentions, or Self-Knowledge to get started.
          </p>
        )}

        {Array.from(grouped.entries()).map(([tableLabel, categories]) => (
          <div key={tableLabel}>
            <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-heading)' }}>
              {tableLabel}
            </h4>

            {Array.from(categories.entries()).map(([category, items]) => {
              const sectionKey = `${items[0].table}-${category}`
              const isExpanded = expandedSections.has(sectionKey)
              const activeInSection = items.filter(i => i.is_included_in_ai).length
              const allActive = activeInSection === items.length

              return (
                <div key={sectionKey} className="mb-2">
                  {/* Category header */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleExpanded(sectionKey)} className="p-0.5">
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={allActive}
                        onChange={() => toggleSection(sectionKey, items[0].table, !allActive)}
                        className="rounded"
                      />
                      <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                        {category}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        ({activeInSection}/{items.length} active)
                      </span>
                    </label>
                  </div>

                  {/* Individual items */}
                  {isExpanded && (
                    <div className="ml-7 mt-1 space-y-1">
                      {items.map(item => (
                        <label key={item.id} className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.is_included_in_ai}
                            onChange={() => toggleItem(item)}
                            className="rounded mt-0.5"
                          />
                          <span
                            className="text-xs truncate"
                            style={{ color: 'var(--color-text-primary)' }}
                            title={item.content}
                          >
                            {item.content.slice(0, 100)}{item.content.length > 100 ? '...' : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {/* Privacy Filtered section */}
        <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Lock size={12} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Privacy Filtered
            </span>
          </div>
          <p className="text-xs ml-5" style={{ color: 'var(--color-text-secondary)' }}>
            Items in this category are only available to your own LiLa. Never shared with other family members' tools.
          </p>
        </div>
      </div>

      {/* Refresh Context button — appears when toggles changed during active conversation (PRD-05 §Context Staleness) */}
      {hasActiveConversation && togglesChanged && onRefreshContext && (
        <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => {
              onRefreshContext()
              setTogglesChanged(false)
            }}
            className="w-full btn-primary px-3 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
          >
            Refresh Context for Current Conversation
          </button>
        </div>
      )}

      {/* Tooltip hint */}
      <div className="px-4 py-2 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Uncheck items to exclude from LiLa conversations. Changes apply immediately.
        </p>
      </div>
    </div>
  )
}

const TABLE_LABELS: Record<string, string> = {
  guiding_stars: 'Guiding Stars',
  best_intentions: 'Best Intentions',
  self_knowledge: 'Self-Knowledge (InnerWorkings)',
  journal_entries: 'Journal',
  archive_context_items: 'Archives',
}
