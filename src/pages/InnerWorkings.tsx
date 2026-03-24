/**
 * InnerWorkings Page — PRD-07
 * Adapted from StewardShip's Keel pattern.
 * Self-knowledge entries by category tabs.
 * Document upload for personality test extraction.
 * BulkAdd with AI for manual multi-entry.
 */

import { useState, useMemo, useRef } from 'react'
import {
  Brain, Plus, Pencil, Trash2, Eye, EyeOff, Upload, Users,
  Loader2, ChevronDown, Check, Sparkles,
} from 'lucide-react'
import { FeatureGuide, FeatureIcon, BulkAddWithAI } from '@/components/shared'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { supabase } from '@/lib/supabase/client'
import {
  useSelfKnowledge,
  useCreateSelfKnowledge,
  useUpdateSelfKnowledge,
  useDeleteSelfKnowledge,
  useToggleSelfKnowledgeAI,
  SELF_KNOWLEDGE_CATEGORIES,
} from '@/hooks/useSelfKnowledge'
import type { SelfKnowledgeEntry, SelfKnowledgeCategory } from '@/hooks/useSelfKnowledge'

// ── Types for extraction pipeline ──────────────────────────

interface ExtractedInsight {
  text: string
  category: string
  confidence: number
  source_label: string
  selected: boolean
}

type PageMode = 'list' | 'create' | 'edit' | 'upload' | 'review' | 'bulk'

export function InnerWorkingsPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: entries = [], isLoading } = useSelfKnowledge(member?.id)
  const createEntry = useCreateSelfKnowledge()
  const updateEntry = useUpdateSelfKnowledge()
  const deleteEntry = useDeleteSelfKnowledge()
  const toggleAI = useToggleSelfKnowledgeAI()

  const [activeCategory, setActiveCategory] = useState<SelfKnowledgeCategory>('personality')
  const [mode, setMode] = useState<PageMode>('list')
  const [editing, setEditing] = useState<SelfKnowledgeEntry | null>(null)
  const [formContent, setFormContent] = useState('')
  const [formShareDad, setFormShareDad] = useState(false)

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [extractedInsights, setExtractedInsights] = useState<ExtractedInsight[]>([])
  const [uploadFileName, setUploadFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const byCategory = useMemo(() => {
    const map: Record<string, SelfKnowledgeEntry[]> = {}
    for (const cat of SELF_KNOWLEDGE_CATEGORIES) {
      map[cat.value] = entries.filter(e => e.category === cat.value)
    }
    return map
  }, [entries])

  const activeEntries = byCategory[activeCategory] ?? []
  const totalIncluded = entries.filter(e => e.is_included_in_ai).length

  function resetForm() {
    setFormContent('')
    setFormShareDad(false)
    setMode('list')
    setEditing(null)
  }

  async function handleCreate() {
    if (!member || !family || !formContent.trim()) return
    await createEntry.mutateAsync({
      family_id: family.id,
      member_id: member.id,
      category: activeCategory,
      content: formContent.trim(),
      source_type: 'manual',
      share_with_dad: formShareDad,
    })
    resetForm()
  }

  async function handleUpdate() {
    if (!editing || !formContent.trim()) return
    await updateEntry.mutateAsync({
      id: editing.id,
      content: formContent.trim(),
      share_with_dad: formShareDad,
    })
    resetForm()
  }

  async function handleDelete(entry: SelfKnowledgeEntry) {
    if (!member || !confirm('Remove this entry?')) return
    await deleteEntry.mutateAsync({ id: entry.id, memberId: member.id })
  }

  async function handleToggleAI(entry: SelfKnowledgeEntry) {
    if (!member) return
    await toggleAI.mutateAsync({ id: entry.id, memberId: member.id, included: !entry.is_included_in_ai })
  }

  function startEdit(entry: SelfKnowledgeEntry) {
    setEditing(entry)
    setFormContent(entry.content)
    setFormShareDad(entry.share_with_dad)
    setMode('edit')
  }

  // ── Document Upload Flow ──────────────────────────────────

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !member) return

    setUploading(true)
    setUploadError(null)
    setUploadFileName(file.name)

    try {
      // Step 1: Upload to Supabase Storage
      const path = `${member.id}/innerworkings/${Date.now()}_${file.name}`
      const { error: uploadErr } = await supabase.storage
        .from('manifest-files')
        .upload(path, file)

      if (uploadErr) {
        // If bucket doesn't exist, show a helpful message
        if (uploadErr.message?.includes('not found') || uploadErr.message?.includes('Bucket')) {
          setUploadError('Storage not configured yet. The manifest-files bucket needs to be created in Supabase Storage.')
          setUploading(false)
          return
        }
        throw uploadErr
      }

      // Step 2: Call extract-insights Edge Function
      const { data, error: fnErr } = await supabase.functions.invoke('extract-insights', {
        body: {
          file_storage_path: path,
          file_type: file.type || file.name.split('.').pop(),
          extraction_target: 'keel', // same as StewardShip
        },
      })

      if (fnErr) {
        setUploadError('AI extraction not available yet. Add entries manually for now.')
        setUploading(false)
        return
      }

      // Step 3: Process results
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
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Map StewardShip Keel categories to MyAIM InnerWorkings categories
  function mapKeelCategory(cat: string): string {
    const map: Record<string, string> = {
      personality_assessment: 'personality',
      trait_tendency: 'personality',
      strength: 'strengths',
      growth_area: 'growth_areas',
      you_inc: 'how_i_work',
      general: 'personality',
    }
    return map[cat] ?? cat
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

    const selected = extractedInsights.filter(i => i.selected && i.text.trim())
    for (const insight of selected) {
      await createEntry.mutateAsync({
        family_id: family.id,
        member_id: member.id,
        category: insight.category as SelfKnowledgeCategory,
        content: insight.text.trim(),
        source_type: 'upload',
      })
    }

    setExtractedInsights([])
    setUploadFileName('')
    setMode('list')
    setUploading(false)
  }

  const categoryLabel = SELF_KNOWLEDGE_CATEGORIES.find(c => c.value === activeCategory)?.label ?? ''
  const highConfidence = extractedInsights.filter(i => i.confidence >= 0.5)
  const lowConfidence = extractedInsights.filter(i => i.confidence < 0.5)
  const [showLowConfidence, setShowLowConfidence] = useState(false)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <FeatureGuide featureKey="inner_workings" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FeatureIcon featureKey="innerworkings_basic" fallback={<Brain size={28} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={28} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
              InnerWorkings
            </h1>
            {entries.length > 0 && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {totalIncluded} of {entries.length} included in AI context
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('bulk')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-btn-primary-bg)', border: '1px solid var(--color-border)' }}
            title="Bulk add with AI"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">Bulk</span>
          </button>
          <button
            onClick={() => setMode('create')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {SELF_KNOWLEDGE_CATEGORIES.map(cat => {
          const count = byCategory[cat.value]?.length ?? 0
          const isActive = activeCategory === cat.value
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className="px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5"
              style={{
                backgroundColor: isActive ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                color: isActive ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                border: `1px solid ${isActive ? 'transparent' : 'var(--color-border)'}`,
              }}
            >
              {cat.label}
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-bg-secondary)',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Bulk Add Mode ── */}
      {mode === 'bulk' && member && family && (
        <BulkAddWithAI
          title="Bulk Add Self-Knowledge"
          placeholder={'Paste or type multiple entries, one per line. E.g.:\nI am an ENFP\nI recharge by being around people\nI struggle with follow-through on long projects'}
          hint="AI will parse and categorize each entry into the right InnerWorkings category."
          categories={SELF_KNOWLEDGE_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
          parsePrompt="Parse the following text into individual self-knowledge entries. Categorize each with one of: personality, strengths, growth_areas, communication_style, how_i_work. Return JSON array."
          onSave={async (parsed: any[]) => {
            for (const item of parsed.filter((i: any) => i.selected)) {
              await createEntry.mutateAsync({
                family_id: family.id,
                member_id: member.id,
                category: (item.category || activeCategory) as SelfKnowledgeCategory,
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
            {mode === 'edit' ? `Edit ${categoryLabel} Entry` : `New ${categoryLabel} Entry`}
          </h2>
          <textarea
            placeholder={`What do you know about your ${categoryLabel.toLowerCase()}?`}
            value={formContent}
            onChange={e => setFormContent(e.target.value)}
            rows={3}
            autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={formShareDad} onChange={e => setFormShareDad(e.target.checked)} className="rounded" />
            <Users size={14} />
            Share with spouse (helps Cyrano & relationship tools)
          </label>
          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button
              onClick={mode === 'edit' ? handleUpdate : handleCreate}
              disabled={!formContent.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
            >
              {mode === 'edit' ? 'Save' : 'Add Entry'}
            </button>
          </div>
        </div>
      )}

      {/* ── Document Upload ── */}
      {mode === 'list' && (
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.docx,.png,.jpg,.jpeg,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-sm transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '2px dashed var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Extracting insights from {uploadFileName}...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload personality test or assessment
              </>
            )}
          </button>
        </div>
      )}

      {uploadError && (
        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-error, #e55) 10%, var(--color-bg-card))', color: 'var(--color-error, #e55)' }}>
          {uploadError}
          <button onClick={() => setUploadError(null)} className="ml-2 underline">Dismiss</button>
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

          {/* High confidence insights */}
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

          {/* Low confidence toggle */}
          {lowConfidence.length > 0 && (
            <button
              onClick={() => setShowLowConfidence(!showLowConfidence)}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <ChevronDown size={14} className={showLowConfidence ? 'rotate-180' : ''} />
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
            <button onClick={() => { setMode('list'); setExtractedInsights([]) }} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Cancel
            </button>
            <button
              onClick={handleSaveExtracted}
              disabled={uploading || extractedInsights.filter(i => i.selected).length === 0}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save {extractedInsights.filter(i => i.selected).length} Entries
            </button>
          </div>
        </div>
      )}

      {/* ── Entries List ── */}
      {mode === 'list' && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)' }} />
            </div>
          ) : activeEntries.length === 0 ? (
            <div className="p-8 rounded-xl text-center" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <Brain size={32} className="mx-auto mb-3" style={{ color: 'var(--color-btn-primary-bg)' }} />
              <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>No {categoryLabel.toLowerCase()} entries yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Add what you know — or upload a personality test for AI extraction.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeEntries.map(entry => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl transition-all"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: `1px solid ${entry.is_included_in_ai ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                    opacity: entry.is_included_in_ai ? 1 : 0.7,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleAI(entry)}
                      className="mt-0.5 p-1 rounded transition-colors flex-shrink-0"
                      style={{ color: entry.is_included_in_ai ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
                    >
                      {entry.is_included_in_ai ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{entry.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {entry.source_type !== 'manual' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                            {entry.source_type === 'upload' ? 'From upload' : entry.source_type === 'bulk_add' ? 'Bulk add' : entry.source_type}
                          </span>
                        )}
                        {entry.share_with_dad && (
                          <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                            <Users size={10} /> Shared
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(entry)} className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(entry)} className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
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
            className="text-xs px-2 py-0.5 rounded border outline-none"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            {SELF_KNOWLEDGE_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
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
