/**
 * InnerWorkings Page — PRD-07
 * Self-knowledge entries organized by collapsible category groups.
 * Features: drag-to-reorder, heart toggle, upload extraction, bulk add, archive/restore.
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Heart, HeartOff, Plus, Pencil, Archive, Upload, Loader2,
  ChevronDown, Check, Sparkles, GripVertical, Brain, MessageCircle, Users, RotateCcw,
  Handshake, Lightbulb,
} from 'lucide-react'
import { FeatureGuide, FeatureIcon, BulkAddWithAI, CollapsibleGroup, Tooltip } from '@/components/shared'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { supabase } from '@/lib/supabase/client'
import {
  useSelfKnowledge,
  useArchivedSelfKnowledge,
  useCreateSelfKnowledge,
  useUpdateSelfKnowledge,
  useDeleteSelfKnowledge,
  useToggleSelfKnowledgeAI,
  useBatchToggleSelfKnowledgeAI,
  useRestoreSelfKnowledge,
  useReorderSelfKnowledge,
  SELF_KNOWLEDGE_CATEGORIES,
  GUIDED_CONNECTION_LABELS,
  CONNECTION_STARTER_PROMPTS,
} from '@/hooks/useSelfKnowledge'
import type { SelfKnowledgeEntry, SelfKnowledgeCategory, SelfKnowledgeCategoryGroup } from '@/hooks/useSelfKnowledge'

// ── Types for extraction pipeline ──────────────────────────

interface ExtractedInsight {
  text: string
  category: string
  confidence: number
  source_label: string
  selected: boolean
}

type PageMode = 'list' | 'create' | 'edit' | 'review' | 'bulk'

export function InnerWorkingsPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member
  const { data: entries = [], isLoading } = useSelfKnowledge(activeMember?.id)
  const { data: archivedEntries = [] } = useArchivedSelfKnowledge(activeMember?.id)
  const createEntry = useCreateSelfKnowledge()
  const updateEntry = useUpdateSelfKnowledge()
  const deleteEntry = useDeleteSelfKnowledge()
  const toggleAI = useToggleSelfKnowledgeAI()
  const batchToggleAI = useBatchToggleSelfKnowledgeAI()
  const restoreEntry = useRestoreSelfKnowledge()
  const reorderEntries = useReorderSelfKnowledge()

  const [mode, setMode] = useState<PageMode>('list')
  const [editing, setEditing] = useState<SelfKnowledgeEntry | null>(null)
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState<SelfKnowledgeCategory>('general')
  const [formSource, setFormSource] = useState('')
  const [formShareDad, setFormShareDad] = useState(false)
  const [formShareMom, setFormShareMom] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SelfKnowledgeCategoryGroup>('self_knowledge')

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [extractedInsights, setExtractedInsights] = useState<ExtractedInsight[]>([])
  const [uploadFileName, setUploadFileName] = useState('')
  const [showLowConfidence, setShowLowConfidence] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const byCategory = useMemo(() => {
    const map: Record<string, SelfKnowledgeEntry[]> = {}
    for (const cat of SELF_KNOWLEDGE_CATEGORIES) {
      map[cat.value] = entries.filter(e => e.category === cat.value)
    }
    return map
  }, [entries])

  const totalIncluded = entries.filter(e => e.is_included_in_ai).length
  const isGuidedMember = activeMember?.dashboard_mode === 'guided'
  const selfKnowledgeCats = SELF_KNOWLEDGE_CATEGORIES.filter(c => c.group === 'self_knowledge')
  const connectionCats = SELF_KNOWLEDGE_CATEGORIES.filter(c => c.group === 'connection')
  const activeGroupCats = activeTab === 'self_knowledge' ? selfKnowledgeCats : connectionCats

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function resetForm() {
    setFormContent('')
    setFormCategory('general')
    setFormSource('')
    setFormShareMom(true)
    setFormShareDad(false)
    setMode('list')
    setEditing(null)
  }

  async function handleCreate() {
    if (!member || !family || !formContent.trim()) return
    await createEntry.mutateAsync({
      family_id: family.id,
      member_id: member.id,
      category: formCategory,
      content: formContent.trim(),
      source_type: 'manual',
      source: formSource.trim() || null,
      share_with_mom: formShareMom,
      share_with_dad: formShareDad,
    })
    resetForm()
  }

  async function handleUpdate() {
    if (!editing || !formContent.trim()) return
    await updateEntry.mutateAsync({
      id: editing.id,
      content: formContent.trim(),
      category: formCategory,
      source: formSource.trim() || null,
      share_with_mom: formShareMom,
      share_with_dad: formShareDad,
    })
    resetForm()
  }

  async function handleArchive(entry: SelfKnowledgeEntry) {
    if (!member) return
    await deleteEntry.mutateAsync({ id: entry.id, memberId: member.id })
  }

  async function handleRestore(entry: SelfKnowledgeEntry) {
    if (!member) return
    await restoreEntry.mutateAsync({ id: entry.id, memberId: member.id })
  }

  async function handleToggleAI(entry: SelfKnowledgeEntry) {
    if (!member) return
    await toggleAI.mutateAsync({ id: entry.id, memberId: member.id, included: !entry.is_included_in_ai })
  }

  async function handleBatchToggleAI(category: SelfKnowledgeCategory, included: boolean) {
    if (!member) return
    await batchToggleAI.mutateAsync({ memberId: member.id, category, included })
  }

  function startEdit(entry: SelfKnowledgeEntry) {
    setEditing(entry)
    setFormContent(entry.content)
    setFormCategory(entry.category)
    setFormSource(entry.source ?? '')
    setFormShareMom(entry.share_with_mom)
    setFormShareDad(entry.share_with_dad)
    setMode('edit')
  }

  function startCreate() {
    resetForm()
    setMode('create')
  }

  const handleDragEnd = useCallback((event: DragEndEvent, category: SelfKnowledgeCategory) => {
    const { active, over } = event
    if (!over || active.id === over.id || !member) return

    const catEntries = byCategory[category] ?? []
    const oldIndex = catEntries.findIndex(e => e.id === active.id)
    const newIndex = catEntries.findIndex(e => e.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(catEntries, oldIndex, newIndex)
    reorderEntries.mutate({
      memberId: member.id,
      reorderedIds: reordered.map(e => e.id),
    })
  }, [byCategory, member, reorderEntries])

  // ── Document Upload Flow ──────────────────────────────────

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !member) return

    setUploading(true)
    setUploadError(null)
    setUploadFileName(file.name)

    try {
      const path = `${member.id}/innerworkings/${Date.now()}_${file.name}`
      const { error: uploadErr } = await supabase.storage
        .from('manifest-files')
        .upload(path, file)

      if (uploadErr) {
        if (uploadErr.message?.includes('not found') || uploadErr.message?.includes('Bucket')) {
          setUploadError('Storage not configured yet. The manifest-files bucket needs to be created in Supabase Storage.')
          setUploading(false)
          return
        }
        throw uploadErr
      }

      const { data, error: fnErr } = await supabase.functions.invoke('extract-insights', {
        body: {
          file_storage_path: path,
          file_type: file.type || file.name.split('.').pop(),
          extraction_target: 'keel',
        },
      })

      if (fnErr) {
        setUploadError('AI extraction not available yet. Add entries manually for now.')
        setUploading(false)
        return
      }

      const insights: ExtractedInsight[] = (data?.insights ?? []).map((i: any) => ({
        text: i.text ?? '',
        category: mapKeelCategory(i.category),
        confidence: i.confidence ?? 0.5,
        source_label: i.source_label ?? file.name,
        selected: (i.confidence ?? 0.5) >= 0.5,
      }))

      if (insights.length === 0) {
        setUploadError('No insights could be extracted from this file. Try a different format or add entries manually.')
        setUploading(false)
        return
      }

      setExtractedInsights(insights)
      setMode('review')
    } catch (err: any) {
      setUploadError(err?.message ?? 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function mapKeelCategory(cat: string): string {
    const map: Record<string, string> = {
      personality_assessment: 'personality_type',
      personality: 'personality_type',
      trait_tendency: 'trait_tendency',
      strength: 'strength',
      strengths: 'strength',
      growth_area: 'growth_area',
      growth_areas: 'growth_area',
      communication_style: 'trait_tendency',
      how_i_work: 'general',
      you_inc: 'general',
      general: 'general',
    }
    return map[cat] ?? 'general'
  }

  function toggleInsight(idx: number) {
    setExtractedInsights(prev => prev.map((ins, i) => i === idx ? { ...ins, selected: !ins.selected } : ins))
  }

  function updateInsightText(idx: number, text: string) {
    setExtractedInsights(prev => prev.map((ins, i) => i === idx ? { ...ins, text } : ins))
  }

  function updateInsightCategory(idx: number, category: string) {
    setExtractedInsights(prev => prev.map((ins, i) => i === idx ? { ...ins, category } : ins))
  }

  async function handleSaveExtracted() {
    if (!member || !family) return
    setUploading(true)

    const batchId = crypto.randomUUID()
    const selected = extractedInsights.filter(i => i.selected && i.text.trim())
    for (const insight of selected) {
      await createEntry.mutateAsync({
        family_id: family.id,
        member_id: member.id,
        category: insight.category as SelfKnowledgeCategory,
        content: insight.text.trim(),
        source_type: 'file_upload',
        source: uploadFileName || null,
        source_reference_id: batchId,
        file_storage_path: `${member.id}/innerworkings/${uploadFileName}`,
      })
    }

    setExtractedInsights([])
    setUploadFileName('')
    setMode('list')
    setUploading(false)
  }

  const highConfidence = extractedInsights.filter(i => i.confidence >= 0.5)
  const lowConfidence = extractedInsights.filter(i => i.confidence < 0.5)

  // ── Empty state (zero entries AND on self-knowledge tab) ──
  // Connection Preferences tab should always render even when no entries exist
  // (it has starter prompts that are the whole point)
  if (!isLoading && entries.length === 0 && mode === 'list' && activeTab === 'self_knowledge') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <FeatureGuide featureKey="inner_workings" />

        <div className="flex items-center gap-3">
          <FeatureIcon featureKey="my_foundation" fallback={<Brain size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={40} className="w-10! h-10! md:w-36! md:h-36!" assetSize={512} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
              InnerWorkings
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Who you are right now.
            </p>
          </div>
        </div>

        {/* Tab switcher — always visible even in empty state */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <button
            onClick={() => setActiveTab('self_knowledge')}
            className="flex items-center gap-2 flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <Brain size={16} />
            Self-Knowledge
          </button>
          <button
            onClick={() => setActiveTab('connection')}
            className="flex items-center gap-2 flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Handshake size={16} />
            Connection Preferences
          </button>
        </div>

        <div className="p-8 rounded-xl text-center space-y-4" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <Brain size={48} className="mx-auto" style={{ color: 'var(--color-btn-primary-bg)', opacity: 0.6 }} />
          <div>
            <p className="font-semibold text-lg" style={{ color: 'var(--color-text-heading)' }}>
              Start building your self-knowledge
            </p>
            <p className="text-sm mt-1 max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              The more LiLa knows about how you work, the better she can help. Add personality types, strengths, growth areas, and anything else that makes you, you.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={startCreate}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)', minHeight: '44px' }}
            >
              <Pencil size={16} />
              Write Something About Myself
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.docx,.png,.jpg,.jpeg,.webp" onChange={handleFileSelect} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', minHeight: '44px' }}
            >
              <Upload size={16} />
              Upload Assessment Results
            </button>
            <button
              onClick={() => showToast('Coming soon — LiLa Discovery mode is not available yet.')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', minHeight: '44px' }}
            >
              <MessageCircle size={16} />
              Let LiLa Help Me Discover
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-error, #e55) 10%, var(--color-bg-card))', color: 'var(--color-error, #e55)' }}>
            {uploadError}
            <button onClick={() => setUploadError(null)} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm shadow-lg" style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
            {toast}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="density-comfortable max-w-3xl mx-auto space-y-6">
      <FeatureGuide featureKey="inner_workings" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FeatureIcon featureKey="my_foundation" fallback={<Brain size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={40} className="w-10! h-10! md:w-36! md:h-36!" assetSize={512} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
              InnerWorkings
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Who you are right now.
            </p>
            {entries.length > 0 && (
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                LiLa is drawing from {totalIncluded} of {entries.length} insights
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={startCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)', minHeight: '44px' }}
        >
          <Plus size={16} />
          Add
        </button>
        <button
          onClick={() => setMode('bulk')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', minHeight: '44px' }}
        >
          <Sparkles size={14} />
          Bulk
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.docx,.png,.jpg,.jpeg,.webp" onChange={handleFileSelect} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', minHeight: '44px' }}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Upload
        </button>
        <button
          onClick={() => showToast('Coming soon — LiLa Discovery mode is not available yet.')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', minHeight: '44px' }}
        >
          <MessageCircle size={14} />
          <span className="hidden sm:inline">Discover with LiLa</span>
          <span className="sm:hidden">LiLa</span>
        </button>
      </div>

      {uploadError && (
        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-error, #e55) 10%, var(--color-bg-card))', color: 'var(--color-error, #e55)' }}>
          {uploadError}
          <button onClick={() => setUploadError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* ── Bulk Add Mode ── */}
      {mode === 'bulk' && member && family && (
        <BulkAddWithAI
          title="Bulk Add Self-Knowledge"
          placeholder={'Paste or type multiple entries, one per line. E.g.:\nI am an ENFP\nI recharge by being around people\nI struggle with follow-through on long projects'}
          hint="AI will parse and categorize each entry into the right InnerWorkings category."
          categories={SELF_KNOWLEDGE_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
          parsePrompt="Parse the following text into individual self-knowledge entries. Categorize each with one of: personality_type, trait_tendency, strength, growth_area, general, gift_ideas, meaningful_words, helpful_actions, quality_time_ideas, sensitivities, comfort_needs. The last 6 are connection preferences about how to relate to this person. Return JSON array."
          onSave={async (parsed: any[]) => {
            for (const item of parsed.filter((i: any) => i.selected)) {
              await createEntry.mutateAsync({
                family_id: family.id,
                member_id: member.id,
                category: (item.category || 'general') as SelfKnowledgeCategory,
                content: item.text,
                source_type: 'bulk_add',
              })
            }
          }}
          onClose={() => setMode('list')}
        />
      )}

      {/* ── Create / Edit Form ── */}
      {(mode === 'create' || mode === 'edit') && (
        <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            {mode === 'edit' ? 'Edit Entry' : 'New Entry'}
          </h2>
          <textarea
            placeholder="What do you know about yourself?"
            value={formContent}
            onChange={e => setFormContent(e.target.value)}
            rows={3}
            autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Category</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value as SelfKnowledgeCategory)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', minHeight: '44px' }}
              >
                <optgroup label="Self-Knowledge">
                  {selfKnowledgeCats.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Connection Preferences">
                  {connectionCats.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Source (optional)</label>
              <input
                type="text"
                placeholder="Where does this come from?"
                value={formSource}
                onChange={e => setFormSource(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', minHeight: '44px' }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--color-text-secondary)', minHeight: '44px' }}>
              <input type="checkbox" checked={formShareMom} onChange={e => setFormShareMom(e.target.checked)} className="rounded" />
              <Users size={14} />
              Share with mom (visible in family context)
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--color-text-secondary)', minHeight: '44px' }}>
              <input type="checkbox" checked={formShareDad} onChange={e => setFormShareDad(e.target.checked)} className="rounded" />
              <Users size={14} />
              Share with spouse (helps Cyrano & relationship tools)
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)', minHeight: '44px' }}>Cancel</button>
            <button
              onClick={mode === 'edit' ? handleUpdate : handleCreate}
              disabled={!formContent.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)', minHeight: '44px' }}
            >
              {mode === 'edit' ? 'Save' : 'Add Entry'}
            </button>
          </div>
        </div>
      )}

      {/* ── Review Extracted Insights ── */}
      {mode === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-heading)' }}>
              Review Extracted Insights
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              from {uploadFileName} — {extractedInsights.filter(i => i.selected).length} selected
            </p>
          </div>

          <div className="space-y-2">
            {highConfidence.map((insight) => {
              const realIdx = extractedInsights.indexOf(insight)
              return (
                <InsightCard
                  key={realIdx}
                  insight={insight}
                  onToggle={() => toggleInsight(realIdx)}
                  onTextChange={text => updateInsightText(realIdx, text)}
                  onCategoryChange={cat => updateInsightCategory(realIdx, cat)}
                />
              )
            })}
          </div>

          {lowConfidence.length > 0 && (
            <button
              onClick={() => setShowLowConfidence(!showLowConfidence)}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--color-text-secondary)', minHeight: '44px' }}
            >
              <ChevronDown size={14} className={`transition-transform ${showLowConfidence ? 'rotate-180' : ''}`} />
              {showLowConfidence ? 'Hide' : 'Show'} {lowConfidence.length} lower-confidence insights
            </button>
          )}

          {showLowConfidence && (
            <div className="space-y-2">
              {lowConfidence.map((insight) => {
                const realIdx = extractedInsights.indexOf(insight)
                return (
                  <InsightCard
                    key={realIdx}
                    insight={insight}
                    onToggle={() => toggleInsight(realIdx)}
                    onTextChange={text => updateInsightText(realIdx, text)}
                    onCategoryChange={cat => updateInsightCategory(realIdx, cat)}
                  />
                )
              })}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button onClick={() => { setMode('list'); setExtractedInsights([]) }} className="px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)', minHeight: '44px' }}>
              Cancel
            </button>
            <button
              onClick={handleSaveExtracted}
              disabled={uploading || extractedInsights.filter(i => i.selected).length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)', minHeight: '44px' }}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save {extractedInsights.filter(i => i.selected).length} Entries
            </button>
          </div>
        </div>
      )}

      {/* ── Tab Switcher ── */}
      {mode === 'list' && (
        <>
          <div className="flex gap-1 p-1 rounded-lg mb-4" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <button
              onClick={() => setActiveTab('self_knowledge')}
              className="flex items-center gap-2 flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              style={activeTab === 'self_knowledge' ? {
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              } : {
                color: 'var(--color-text-secondary)',
              }}
            >
              <Brain size={16} />
              Self-Knowledge
            </button>
            <button
              onClick={() => setActiveTab('connection')}
              className="flex items-center gap-2 flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              style={activeTab === 'connection' ? {
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              } : {
                color: 'var(--color-text-secondary)',
              }}
            >
              <Handshake size={16} />
              Connection Preferences
            </button>
          </div>

          {/* ── Connection tab intro ── */}
          {activeTab === 'connection' && (
            <div
              className="p-4 rounded-lg mb-4 text-sm"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-primary))', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            >
              <p className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Help your family know how to connect with you.
              </p>
              <p>
                These entries feed into LiLa&apos;s context — when someone uses a relationship tool with you selected,
                LiLa will know what matters to you. Everyone in the family can fill out their own.
              </p>
            </div>
          )}

          {/* ── Category Groups ── */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)' }} />
            </div>
          ) : (
            <div className="space-y-3">
              {activeGroupCats.map(cat => {
                const catEntries = byCategory[cat.value] ?? []
                const heartedCount = catEntries.filter(e => e.is_included_in_ai).length
                const displayLabel = isGuidedMember && GUIDED_CONNECTION_LABELS[cat.value]
                  ? GUIDED_CONNECTION_LABELS[cat.value]!
                  : cat.label
                const starterPrompts = activeTab === 'connection'
                  ? CONNECTION_STARTER_PROMPTS[cat.value]
                  : undefined
                const promptList = starterPrompts
                  ? (isGuidedMember ? starterPrompts.guided : starterPrompts.adult)
                  : undefined

                // Use prompt count as fallback to prevent CollapsibleGroup's "No X yet" empty state
                // when starter prompts exist (they ARE the content for empty connection categories)
                const effectiveCount = catEntries.length > 0 ? catEntries.length : (promptList?.length ?? 0)

                return (
                  <CollapsibleGroup
                    key={cat.value}
                    label={displayLabel}
                    count={effectiveCount}
                    heartedCount={heartedCount}
                    description={cat.description}
                    defaultOpen={catEntries.length > 0 || activeTab === 'connection'}
                    onToggleAll={(included) => handleBatchToggleAI(cat.value, included)}
                  >
                    {/* Starter prompt cards when no entries exist */}
                    {catEntries.length === 0 && promptList && promptList.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {promptList.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setFormContent('')
                              setFormCategory(cat.value)
                              setFormSource('')
                              setMode('create')
                            }}
                            className="w-full text-left flex items-start gap-2.5 p-3 rounded-lg transition-colors"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--color-accent) 5%, var(--color-bg-secondary))',
                              border: '1px dashed var(--color-border)',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            <Lightbulb size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-accent)' }} />
                            <span className="text-sm">{prompt}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleDragEnd(event, cat.value)}
                    >
                      <SortableContext items={catEntries.map(e => e.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1.5">
                          {catEntries.map(entry => (
                            <SortableEntryCard
                              key={entry.id}
                              entry={entry}
                              onToggleAI={() => handleToggleAI(entry)}
                              onEdit={() => startEdit(entry)}
                              onArchive={() => handleArchive(entry)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </CollapsibleGroup>
                )
              })}
            </div>
          )}

          {/* ── Mom's Observations (only when mom views another member on Connection tab) ── */}
          {activeTab === 'connection' && isViewingAs && member?.role === 'primary_parent' && activeMember && (
            <MomObservationsSection
              familyId={family?.id ?? ''}
              aboutMemberId={activeMember.id}
              momMemberId={member.id}
              memberName={activeMember.display_name}
            />
          )}

          {/* ── Archived Section ── */}
          {archivedEntries.length > 0 && (
            <div>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: 'var(--color-text-secondary)', minHeight: '44px' }}
              >
                <ChevronDown size={14} className={`transition-transform ${showArchived ? 'rotate-180' : ''}`} />
                View Archived ({archivedEntries.length})
              </button>
              {showArchived && (
                <div className="mt-2 space-y-1.5">
                  {archivedEntries.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 rounded-lg"
                      style={{
                        backgroundColor: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        opacity: 0.6,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{entry.content}</p>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {SELF_KNOWLEDGE_CATEGORIES.find(c => c.value === entry.category)?.label ?? entry.category}
                        </p>
                      </div>
                      <Tooltip content="Restore">
                      <button
                        onClick={() => handleRestore(entry)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium shrink-0"
                        style={{ color: 'var(--color-btn-primary-bg)', minHeight: '44px' }}
                      >
                        <RotateCcw size={14} />
                        Restore
                      </button>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm shadow-lg" style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ── Sortable Entry Card ──────────────────────────────────

function SortableEntryCard({
  entry,
  onToggleAI,
  onEdit,
  onArchive,
}: {
  entry: SelfKnowledgeEntry
  onToggleAI: () => void
  onEdit: () => void
  onArchive: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const sourceLabel = (() => {
    switch (entry.source_type) {
      case 'file_upload': return 'From upload'
      case 'bulk_add': return 'Bulk add'
      case 'lila_discovery': return 'LiLa discovery'
      case 'content_extraction': return 'Extracted'
      case 'log_routed': return 'Routed'
      default: return null
    }
  })()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 p-3 rounded-lg transition-all"
      {...attributes}
    >
      {/* Drag handle */}
      <Tooltip content="Drag to reorder">
      <button
        {...listeners}
        className="mt-1 p-1 rounded cursor-grab active:cursor-grabbing shrink-0 touch-none"
        style={{ color: 'var(--color-text-secondary)', minWidth: '28px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <GripVertical size={14} />
      </button>
      </Tooltip>

      {/* Heart toggle */}
      <Tooltip content={entry.is_included_in_ai ? 'Exclude from AI context' : 'Include in AI context'}>
      <button
        onClick={onToggleAI}
        className="mt-0.5 p-1 rounded transition-colors shrink-0"
        style={{ color: entry.is_included_in_ai ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)', minWidth: '28px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {entry.is_included_in_ai ? <Heart size={16} fill="currentColor" /> : <HeartOff size={16} />}
      </button>
      </Tooltip>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{entry.content}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {sourceLabel && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
              {sourceLabel}
            </span>
          )}
          {entry.source && (
            <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              {entry.source}
            </span>
          )}
          {entry.share_with_dad && (
            <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              <Users size={10} /> Shared
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-0.5 shrink-0">
        <Tooltip content="Edit">
        <button
          onClick={onEdit}
          className="p-1.5 rounded hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Pencil size={14} />
        </button>
        </Tooltip>
        <Tooltip content="Archive">
        <button
          onClick={onArchive}
          className="p-1.5 rounded hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Archive size={14} />
        </button>
        </Tooltip>
      </div>
    </div>
  )
}

// ── Insight Review Card ──────────────────────────────────

function InsightCard({
  insight,
  onToggle,
  onTextChange,
  onCategoryChange,
}: {
  insight: ExtractedInsight
  onToggle: () => void
  onTextChange: (text: string) => void
  onCategoryChange: (cat: string) => void
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg transition-all"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: `1px solid ${insight.selected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
        opacity: insight.selected ? 1 : 0.5,
      }}
    >
      <input
        type="checkbox"
        checked={insight.selected}
        onChange={onToggle}
        className="mt-1 rounded"
        style={{ minWidth: '20px', minHeight: '20px' }}
      />
      <div className="flex-1 space-y-1.5">
        <textarea
          value={insight.text}
          onChange={e => onTextChange(e.target.value)}
          rows={2}
          className="w-full text-sm resize-none bg-transparent border-none outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />
        <div className="flex items-center gap-2">
          <select
            value={insight.category}
            onChange={e => onCategoryChange(e.target.value)}
            className="text-xs px-2 py-1 rounded border outline-none"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', minHeight: '32px' }}
          >
            <optgroup label="Self-Knowledge">
              {SELF_KNOWLEDGE_CATEGORIES.filter(c => c.group === 'self_knowledge').map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </optgroup>
            <optgroup label="Connection Preferences">
              {SELF_KNOWLEDGE_CATEGORIES.filter(c => c.group === 'connection').map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </optgroup>
          </select>
          {insight.source_label && (
            <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              {insight.source_label}
            </span>
          )}
          <span className="text-[10px] ml-auto" style={{ color: 'var(--color-text-secondary)' }}>
            {Math.round(insight.confidence * 100)}% confidence
          </span>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// Mom's Observations — private connection insights stored in archive_context_items
// with is_privacy_filtered=true (invisible to the subject, visible to LiLa for mom)
// ════════════════════════════════════════════════════════════

function MomObservationsSection({ familyId, aboutMemberId, momMemberId, memberName }: {
  familyId: string
  aboutMemberId: string
  momMemberId: string
  memberName: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()

  const { data: observations = [] } = useQuery({
    queryKey: ['mom-observations', familyId, aboutMemberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('archive_context_items')
        .select('*')
        .eq('family_id', familyId)
        .eq('member_id', aboutMemberId)
        .eq('context_type', 'mom_connection_insight')
        .eq('added_by', momMemberId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Array<{
        id: string
        context_value: string
        is_included_in_ai: boolean
        created_at: string
      }>
    },
  })

  const { data: prefsFolder } = useQuery({
    queryKey: ['prefs-folder', familyId, aboutMemberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('archive_folders')
        .select('id')
        .eq('family_id', familyId)
        .eq('member_id', aboutMemberId)
        .eq('folder_name', 'Preferences')
        .eq('folder_type', 'system_category')
        .maybeSingle()
      if (error) throw error
      return data as { id: string } | null
    },
  })

  async function handleSave() {
    if (!newNote.trim() || !prefsFolder) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('archive_context_items')
        .insert({
          family_id: familyId,
          folder_id: prefsFolder.id,
          member_id: aboutMemberId,
          context_field: 'Mom\'s observation',
          context_value: newNote.trim(),
          context_type: 'mom_connection_insight',
          is_included_in_ai: true,
          is_privacy_filtered: true,
          source: 'manual',
          added_by: momMemberId,
        })
      if (error) throw error
      setNewNote('')
      queryClient.invalidateQueries({ queryKey: ['mom-observations', familyId, aboutMemberId] })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await supabase
      .from('archive_context_items')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['mom-observations', familyId, aboutMemberId] })
  }

  async function handleToggleAI(id: string, current: boolean) {
    await supabase
      .from('archive_context_items')
      .update({ is_included_in_ai: !current })
      .eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['mom-observations', familyId, aboutMemberId] })
  }

  return (
    <div
      className="mt-4 rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 4%, var(--color-bg-primary))' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-medium"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        My Observations about {memberName}
        {observations.length > 0 && (
          <span className="text-xs font-normal ml-auto" style={{ color: 'var(--color-text-secondary)' }}>
            {observations.length} note{observations.length !== 1 ? 's' : ''}
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Private to you. {memberName} will never see these. LiLa uses them when you ask about {memberName}.
          </p>

          {observations.map(obs => (
            <div
              key={obs.id}
              className="flex items-start gap-2 p-3 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex-1 min-w-0">
                <p style={{ color: 'var(--color-text-primary)' }}>{obs.context_value}</p>
              </div>
              <Tooltip content={obs.is_included_in_ai ? 'LiLa can see this' : 'Hidden from LiLa'}>
                <button onClick={() => handleToggleAI(obs.id, obs.is_included_in_ai)}>
                  {obs.is_included_in_ai
                    ? <Heart size={14} fill="var(--color-accent)" style={{ color: 'var(--color-accent)' }} />
                    : <HeartOff size={14} style={{ color: 'var(--color-text-secondary)' }} />}
                </button>
              </Tooltip>
              <Tooltip content="Remove">
                <button onClick={() => handleDelete(obs.id)}>
                  <Archive size={14} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </Tooltip>
            </div>
          ))}

          <div className="flex gap-2">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder={`What have you noticed about what works for ${memberName}?`}
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg text-sm resize-none"
              style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            <button
              onClick={handleSave}
              disabled={!newNote.trim() || saving || !prefsFolder}
              className="self-end px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)', minHeight: '44px' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
